from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Mapping


SEGMENT_POLICY_VERSION = "crm-segment-policy-v1"
DEFAULT_HIGH_VALUE_SPEND_MIN = 300.0
DEFAULT_VIP_SPEND_MIN = 1000.0


SEGMENT_PRIORITY = {
    "new_buyers": 1,
    "course_started_no_progress": 2,
    "lapsed_paid": 3,
    "high_value_spend": 4,
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


def load_spend_thresholds(config_path: Path | None) -> dict[str, float]:
    thresholds = {
        "high_value_spend_min": DEFAULT_HIGH_VALUE_SPEND_MIN,
        "vip_spend_min": DEFAULT_VIP_SPEND_MIN,
    }
    if config_path is None or not config_path.exists():
        return thresholds

    payload = json.loads(config_path.read_text(encoding="utf-8"))
    source = payload.get("spend_thresholds", {})

    thresholds["high_value_spend_min"] = _to_float(
        source.get("high_value_spend_min"),
        DEFAULT_HIGH_VALUE_SPEND_MIN,
    )
    thresholds["vip_spend_min"] = _to_float(
        source.get("vip_spend_min"),
        DEFAULT_VIP_SPEND_MIN,
    )
    return thresholds


def evaluate_profile_segments(
    profile: Mapping[str, Any],
    *,
    high_value_spend_min: float = DEFAULT_HIGH_VALUE_SPEND_MIN,
) -> dict[str, Any]:
    lifecycle_state = str(profile.get("lifecycle_state_projection", "")).strip().lower()
    purchase_count = _to_int(profile.get("purchase_count"), 0)
    total_spend = _to_float(profile.get("total_spend"), 0.0)
    last_activation_at = profile.get("last_activation_at")
    last_progress_at = profile.get("last_progress_at")

    hits: list[dict[str, Any]] = []
    segment_keys: list[str] = []

    if purchase_count > 0 and lifecycle_state == "new_unactivated":
        segment_keys.append("new_buyers")
        hits.append(
            {
                "segment_key": "new_buyers",
                "matched": True,
                "reason": "purchase_count > 0 and lifecycle_state_projection = 'new_unactivated'",
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

    if total_spend >= high_value_spend_min:
        segment_keys.append("high_value_spend")
        hits.append(
            {
                "segment_key": "high_value_spend",
                "matched": True,
                "reason": f"total_spend >= {high_value_spend_min:g}",
            }
        )

    segment_keys = sorted(set(segment_keys), key=lambda key: SEGMENT_PRIORITY.get(key, 999))

    return {
        "segment_policy_version": SEGMENT_POLICY_VERSION,
        "segment_thresholds": {
            "high_value_spend_min": float(high_value_spend_min),
        },
        "segment_keys": segment_keys,
        "rule_hits": hits,
        "inputs_used": {
            "purchase_count": purchase_count,
            "total_spend": total_spend,
            "lifecycle_state_projection": lifecycle_state,
            "last_activation_at": last_activation_at,
            "last_progress_at": last_progress_at,
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
    thresholds = load_spend_thresholds(Path(args.config_path))
    result = evaluate_profile_segments(
        profile,
        high_value_spend_min=thresholds["high_value_spend_min"],
    )
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
