from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Mapping


SEGMENT_POLICY_VERSION = "crm-segment-policy-v1"
DEFAULT_HIGH_VALUE_SPEND_MIN = 300.0
DEFAULT_VIP_SPEND_MIN = 1000.0
DEFAULT_HIGH_ENGAGEMENT_SCORE_MIN = 0.8
DEFAULT_REPEAT_BUYER_PURCHASE_COUNT_MIN = 2
DEFAULT_NEW_BUYER_WINDOW_DAYS = 30


SEGMENT_PRIORITY = {
    "high_value_spend": 1,
    "high_value_engaged": 2,
    "high_value_at_risk": 3,
    "new_buyers_30d": 4,
    "repeat_buyers": 5,
    "engaged_non_buyers": 6,
    "course_started_no_progress": 7,
    "lapsed_paid": 8,
    "suppressed_privacy_or_unsubscribed": 9,
    "new_buyers": 10,
}


def _to_float(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    if text == "":
        return default
    try:
        return float(text)
    except ValueError:
        return default


def _to_int(value: Any, default: int = 0) -> int:
    if value is None:
        return default
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    text = str(value).strip()
    if text == "":
        return default
    try:
        return int(float(text))
    except ValueError:
        return default


def _has_value(value: Any) -> bool:
    if value is None:
        return False
    return str(value).strip() != ""


def _to_bool(value: Any, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)):
        return value != 0
    text = str(value).strip().lower()
    if text in {"1", "true", "t", "yes", "y"}:
        return True
    if text in {"0", "false", "f", "no", "n"}:
        return False
    return default


def _parse_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)
    text = str(value).strip()
    if text == "":
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _normalize_activity_score(value: Any) -> float | None:
    if not _has_value(value):
        return None
    score = _to_float(value, 0.0)
    if score > 1:
        score = min(score / 5.0, 1.0)
    if score < 0:
        return 0.0
    if score > 1:
        return 1.0
    return score


def load_segment_thresholds(config_path: Path | None) -> dict[str, float]:
    thresholds = {
        "high_value_spend_min": DEFAULT_HIGH_VALUE_SPEND_MIN,
        "vip_spend_min": DEFAULT_VIP_SPEND_MIN,
        "high_engagement_score_min": DEFAULT_HIGH_ENGAGEMENT_SCORE_MIN,
        "repeat_buyer_purchase_count_min": float(DEFAULT_REPEAT_BUYER_PURCHASE_COUNT_MIN),
        "new_buyer_window_days": float(DEFAULT_NEW_BUYER_WINDOW_DAYS),
    }
    if config_path is None or not config_path.exists():
        return thresholds

    payload = json.loads(config_path.read_text(encoding="utf-8"))
    spend_source = payload.get("spend_thresholds", {})
    engagement_source = payload.get("engagement_thresholds", {})
    purchase_source = payload.get("purchase_thresholds", {})
    retention_source = payload.get("retention_thresholds", {})

    thresholds["high_value_spend_min"] = _to_float(
        spend_source.get("high_value_spend_min"),
        DEFAULT_HIGH_VALUE_SPEND_MIN,
    )
    thresholds["vip_spend_min"] = _to_float(
        spend_source.get("vip_spend_min"),
        DEFAULT_VIP_SPEND_MIN,
    )
    thresholds["high_engagement_score_min"] = _to_float(
        engagement_source.get("high_engagement_score_min"),
        DEFAULT_HIGH_ENGAGEMENT_SCORE_MIN,
    )
    thresholds["repeat_buyer_purchase_count_min"] = _to_float(
        purchase_source.get("repeat_buyer_purchase_count_min"),
        float(DEFAULT_REPEAT_BUYER_PURCHASE_COUNT_MIN),
    )
    thresholds["new_buyer_window_days"] = _to_float(
        retention_source.get("new_buyer_window_days"),
        float(DEFAULT_NEW_BUYER_WINDOW_DAYS),
    )
    return thresholds


def load_spend_thresholds(config_path: Path | None) -> dict[str, float]:
    return load_segment_thresholds(config_path)


def evaluate_profile_segments(
    profile: Mapping[str, Any],
    *,
    high_value_spend_min: float = DEFAULT_HIGH_VALUE_SPEND_MIN,
    high_engagement_score_min: float = DEFAULT_HIGH_ENGAGEMENT_SCORE_MIN,
    repeat_buyer_purchase_count_min: int = DEFAULT_REPEAT_BUYER_PURCHASE_COUNT_MIN,
    new_buyer_window_days: int = DEFAULT_NEW_BUYER_WINDOW_DAYS,
) -> dict[str, Any]:
    now_utc = datetime.now(timezone.utc)
    lifecycle_state = str(profile.get("lifecycle_state_projection", "")).strip().lower()
    marketing_eligibility = str(profile.get("marketing_eligibility", "")).strip().lower()
    purchase_count = _to_int(profile.get("purchase_count"), 0)
    total_spend = _to_float(profile.get("total_spend"), 0.0)
    activity_score_norm = _normalize_activity_score(profile.get("substack_engagement_score"))
    last_activation_at = profile.get("last_activation_at")
    last_progress_at = profile.get("last_progress_at")
    first_purchase_at = _parse_datetime(profile.get("first_purchase_at"))
    last_purchase_at = _parse_datetime(profile.get("last_purchase_at"))
    has_active_privacy_request = _to_bool(profile.get("has_active_privacy_request"), False)

    hits: list[dict[str, Any]] = []
    segment_keys: list[str] = []

    high_value_spend = total_spend >= high_value_spend_min

    if high_value_spend:
        segment_keys.append("high_value_spend")
        hits.append(
            {
                "segment_key": "high_value_spend",
                "matched": True,
                "reason": f"total_spend >= {high_value_spend_min:g}",
            }
        )

    if (
        high_value_spend
        and activity_score_norm is not None
        and activity_score_norm >= high_engagement_score_min
        and marketing_eligibility == "eligible"
    ):
        segment_keys.append("high_value_engaged")
        hits.append(
            {
                "segment_key": "high_value_engaged",
                "matched": True,
                "reason": (
                    f"total_spend >= {high_value_spend_min:g} and "
                    f"activity_score_norm >= {high_engagement_score_min:g} and "
                    "marketing_eligibility = 'eligible'"
                ),
            }
        )

    if high_value_spend and purchase_count > 0 and lifecycle_state in {"at_risk_7d", "at_risk_14d", "lapsed_paid"}:
        segment_keys.append("high_value_at_risk")
        hits.append(
            {
                "segment_key": "high_value_at_risk",
                "matched": True,
                "reason": (
                    f"total_spend >= {high_value_spend_min:g} and purchase_count > 0 and "
                    "lifecycle_state_projection in ('at_risk_7d','at_risk_14d','lapsed_paid')"
                ),
            }
        )

    reference_purchase_at = first_purchase_at or last_purchase_at
    is_recent_buyer = False
    if reference_purchase_at is not None:
        is_recent_buyer = reference_purchase_at >= now_utc - timedelta(days=max(new_buyer_window_days, 1))

    if purchase_count > 0 and (is_recent_buyer or (reference_purchase_at is None and lifecycle_state == "new_unactivated")):
        segment_keys.append("new_buyers_30d")
        hits.append(
            {
                "segment_key": "new_buyers_30d",
                "matched": True,
                "reason": (
                    f"purchase_count > 0 and first/last purchase within {new_buyer_window_days} days "
                    "or fallback lifecycle_state_projection = 'new_unactivated'"
                ),
            }
        )

    if purchase_count >= repeat_buyer_purchase_count_min:
        segment_keys.append("repeat_buyers")
        hits.append(
            {
                "segment_key": "repeat_buyers",
                "matched": True,
                "reason": f"purchase_count >= {repeat_buyer_purchase_count_min}",
            }
        )

    if (
        purchase_count == 0
        and activity_score_norm is not None
        and activity_score_norm >= high_engagement_score_min
        and marketing_eligibility == "eligible"
    ):
        segment_keys.append("engaged_non_buyers")
        hits.append(
            {
                "segment_key": "engaged_non_buyers",
                "matched": True,
                "reason": (
                    "purchase_count = 0 and "
                    f"activity_score_norm >= {high_engagement_score_min:g} and "
                    "marketing_eligibility = 'eligible'"
                ),
            }
        )

    if _has_value(last_activation_at) and not _has_value(last_progress_at):
        segment_keys.append("course_started_no_progress")
        hits.append(
            {
                "segment_key": "course_started_no_progress",
                "matched": True,
                "reason": "last_activation_at is set and last_progress_at is empty",
            }
        )

    if purchase_count > 0 and lifecycle_state in {"at_risk_14d", "lapsed_paid"}:
        segment_keys.append("lapsed_paid")
        hits.append(
            {
                "segment_key": "lapsed_paid",
                "matched": True,
                "reason": "purchase_count > 0 and lifecycle_state_projection in ('at_risk_14d','lapsed_paid')",
            }
        )

    if marketing_eligibility == "suppressed_unsubscribed" or has_active_privacy_request:
        segment_keys.append("suppressed_privacy_or_unsubscribed")
        hits.append(
            {
                "segment_key": "suppressed_privacy_or_unsubscribed",
                "matched": True,
                "reason": "marketing_eligibility is suppressed_unsubscribed or has_active_privacy_request = true",
            }
        )

    if purchase_count > 0 and lifecycle_state == "new_unactivated":
        segment_keys.append("new_buyers")
        hits.append(
            {
                "segment_key": "new_buyers",
                "matched": True,
                "reason": "purchase_count > 0 and lifecycle_state_projection = 'new_unactivated'",
            }
        )

    segment_keys = sorted(set(segment_keys), key=lambda key: SEGMENT_PRIORITY.get(key, 999))

    return {
        "segment_policy_version": SEGMENT_POLICY_VERSION,
        "segment_thresholds": {
            "high_value_spend_min": float(high_value_spend_min),
            "high_engagement_score_min": float(high_engagement_score_min),
            "repeat_buyer_purchase_count_min": int(repeat_buyer_purchase_count_min),
            "new_buyer_window_days": int(new_buyer_window_days),
        },
        "segment_keys": segment_keys,
        "rule_hits": hits,
        "inputs_used": {
            "purchase_count": purchase_count,
            "total_spend": total_spend,
            "activity_score_norm": activity_score_norm,
            "lifecycle_state_projection": lifecycle_state,
            "marketing_eligibility": marketing_eligibility,
            "last_activation_at": last_activation_at,
            "last_progress_at": last_progress_at,
            "first_purchase_at": first_purchase_at.isoformat() if first_purchase_at else None,
            "last_purchase_at": last_purchase_at.isoformat() if last_purchase_at else None,
            "has_active_privacy_request": has_active_privacy_request,
        },
    }


def _load_profile(args: argparse.Namespace) -> dict[str, Any]:
    if args.profile_json:
        return json.loads(args.profile_json)
    if args.profile_path:
        payload = json.loads(Path(args.profile_path).read_text(encoding="utf-8"))
        if not isinstance(payload, dict):
            raise SystemExit("profile payload must be a JSON object")
        return payload
    raise SystemExit("provide --profile-json or --profile-path")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Evaluate CRM segment memberships for a projected profile."
    )
    parser.add_argument("--profile-json", help="Inline JSON object for a single projected profile.")
    parser.add_argument("--profile-path", help="Path to a JSON file with one projected profile object.")
    parser.add_argument(
        "--config-path",
        default=str(
            (Path(__file__).resolve().parents[1] / "config" / "segment_thresholds.sample.json")
        ),
        help="Path to segment threshold config JSON.",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    profile = _load_profile(args)
    thresholds = load_segment_thresholds(Path(args.config_path))
    result = evaluate_profile_segments(
        profile,
        high_value_spend_min=thresholds["high_value_spend_min"],
        high_engagement_score_min=thresholds["high_engagement_score_min"],
        repeat_buyer_purchase_count_min=int(thresholds["repeat_buyer_purchase_count_min"]),
        new_buyer_window_days=int(thresholds["new_buyer_window_days"]),
    )
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
