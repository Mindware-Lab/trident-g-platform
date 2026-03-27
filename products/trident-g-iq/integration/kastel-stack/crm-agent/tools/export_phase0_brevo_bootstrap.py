from __future__ import annotations

import argparse
import csv
import json
import re
from collections import Counter
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Iterable, Optional, Sequence

import normalize_crm_source_exports as normalizer
from segment_policy_evaluator import evaluate_profile_segments, load_segment_thresholds


UTC = timezone.utc
MST = timezone(timedelta(hours=-7))
MONEY_PLACES = Decimal("0.01")
EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")

DEFAULT_LAUNCH_START = "2026-03-10T00:00:00Z"
DEFAULT_LAUNCH_END = "2026-03-15T23:59:59Z"
DEFAULT_TOP_LIMIT = 4500
DEFAULT_RESERVE_LIMIT = 500
DEFAULT_RISK_7D_DAYS = 7
DEFAULT_RISK_14D_DAYS = 14
DEFAULT_LAPSED_DAYS = 30

SOURCE_EJUNKIE = "ejunkie"
SOURCE_PODIA = "podia"
SOURCE_STRIPE = "stripe"
SOURCE_SUBSTACK = "substack"

SEGMENT_PRIORITY = {
    "post_launch_stripe_buyers": 1,
    "launch_promo_buyers": 2,
    "high_value_spend": 3,
    "high_value_at_risk": 4,
    "new_buyers_30d": 5,
    "repeat_buyers": 6,
    "lapsed_paid": 7,
    "suppressed_privacy_or_unsubscribed": 8,
    "new_buyers": 9,
}

ACTIVE_SEGMENTS = [
    "post_launch_stripe_buyers",
    "launch_promo_buyers",
    "high_value_spend",
    "high_value_at_risk",
    "new_buyers_30d",
    "repeat_buyers",
    "lapsed_paid",
    "suppressed_privacy_or_unsubscribed",
    "new_buyers",
]

DEFERRED_SEGMENTS = [
    "high_value_engaged",
    "engaged_non_buyers",
    "course_started_no_progress",
]

BREVO_HEADERS = [
    "email",
    "first_name",
    "last_name",
    "segment_keys",
    "marketing_eligibility",
    "total_spend",
    "purchase_count",
    "first_paid_at",
    "last_paid_at",
    "source_overlap",
    "post_launch_stripe_buyer_flag",
    "launch_promo_buyer_flag",
    "best_user_score",
]

ACTION_HEADERS = [
    "email",
    "first_name",
    "last_name",
    "marketing_eligibility",
    "bootstrap_bucket",
    "source_overlap",
    "total_spend",
    "purchase_count",
    "last_paid_at",
    "segment_keys",
    "primary_recommended_action",
    "primary_campaign_type",
    "primary_action_priority",
    "primary_action_reason",
    "secondary_recommended_actions",
    "best_user_score",
]

UNIVERSE_HEADERS = [
    "email",
    "first_name",
    "last_name",
    "marketing_eligibility",
    "eligibility_reason",
    "bootstrap_bucket",
    "source_flags",
    "source_overlap",
    "source_count",
    "has_stripe",
    "has_ejunkie",
    "has_podia",
    "has_substack",
    "total_spend",
    "refunded_spend",
    "purchase_count",
    "first_paid_at",
    "last_paid_at",
    "lifecycle_state",
    "segment_keys",
    "deferred_segment_keys",
    "post_launch_stripe_buyer_flag",
    "launch_promo_buyer_flag",
    "high_value_spend_flag",
    "high_value_at_risk_flag",
    "new_buyers_30d_flag",
    "repeat_buyers_flag",
    "lapsed_paid_flag",
    "suppressed_privacy_or_unsubscribed_flag",
    "new_buyers_flag",
    "has_unsubscribe_suppression",
    "has_privacy_suppression",
    "has_bounce_suppression",
    "has_complaint_suppression",
    "failed_evidence_count",
    "refund_evidence_count",
    "ambiguous_evidence_count",
    "stripe_payment_row_count",
    "stripe_customer_row_count",
    "ejunkie_row_count",
    "podia_row_count",
    "substack_row_count",
    "primary_recommended_action",
    "primary_campaign_type",
    "primary_action_priority",
    "primary_action_reason",
    "secondary_recommended_actions",
    "best_user_score",
    "review_reasons",
]

PLAYBOOK_HEADERS = [
    "match_type",
    "match_key",
    "recommended_action",
    "campaign_type",
    "action_priority",
    "operator_notes",
]

PLAYBOOK_ROWS = [
    {
        "match_type": "marketing_eligibility",
        "match_key": "suppressed_unsubscribed",
        "recommended_action": "suppress_do_not_contact",
        "campaign_type": "suppression",
        "action_priority": "critical",
        "operator_notes": "Hard suppression. Keep excluded from all promotional messaging.",
    },
    {
        "match_type": "marketing_eligibility",
        "match_key": "suppressed_privacy_request",
        "recommended_action": "suppress_do_not_contact",
        "campaign_type": "suppression",
        "action_priority": "critical",
        "operator_notes": "Hard suppression. Respect privacy request and do not campaign.",
    },
    {
        "match_type": "marketing_eligibility",
        "match_key": "suppressed_bounced",
        "recommended_action": "suppress_do_not_contact",
        "campaign_type": "suppression",
        "action_priority": "critical",
        "operator_notes": "Do not resend until deliverability status is manually cleared.",
    },
    {
        "match_type": "marketing_eligibility",
        "match_key": "suppressed_complaint",
        "recommended_action": "suppress_do_not_contact",
        "campaign_type": "suppression",
        "action_priority": "critical",
        "operator_notes": "Complaint suppression. Exclude from all promotional sends.",
    },
    {
        "match_type": "marketing_eligibility",
        "match_key": "review_required",
        "recommended_action": "manual_review_required",
        "campaign_type": "manual_ops_review",
        "action_priority": "critical",
        "operator_notes": "Inspect conflicting, refunded-only, failed-only, or ambiguous records before use.",
    },
    {
        "match_type": "marketing_eligibility",
        "match_key": "transactional_only",
        "recommended_action": "transactional_only_no_promo",
        "campaign_type": "transactional_only",
        "action_priority": "high",
        "operator_notes": "Relationship evidence exists, but not enough confidence for promotional campaigning.",
    },
    {
        "match_type": "segment",
        "match_key": "high_value_at_risk",
        "recommended_action": "retention_high_value_at_risk",
        "campaign_type": "retention",
        "action_priority": "high",
        "operator_notes": "Use proactive retention, coaching outreach, or concierge check-ins.",
    },
    {
        "match_type": "segment",
        "match_key": "launch_promo_buyers",
        "recommended_action": "launch_promo_followup",
        "campaign_type": "launch_followup",
        "action_priority": "high",
        "operator_notes": "Use launch follow-up, activation nudges, and feedback/interview asks.",
    },
    {
        "match_type": "segment",
        "match_key": "post_launch_stripe_buyers",
        "recommended_action": "post_launch_onboarding",
        "campaign_type": "onboarding",
        "action_priority": "high",
        "operator_notes": "Use onboarding and activation sequences for recent post-launch buyers.",
    },
    {
        "match_type": "segment",
        "match_key": "high_value_spend",
        "recommended_action": "vip_premium_offer",
        "campaign_type": "vip_offer",
        "action_priority": "medium",
        "operator_notes": "Use premium asks, VIP offers, or advisory-panel outreach.",
    },
    {
        "match_type": "segment",
        "match_key": "new_buyers_30d",
        "recommended_action": "new_buyer_onboarding",
        "campaign_type": "onboarding",
        "action_priority": "medium",
        "operator_notes": "Use onboarding and second-purchase nudges.",
    },
    {
        "match_type": "segment",
        "match_key": "new_buyers",
        "recommended_action": "new_buyer_onboarding",
        "campaign_type": "onboarding",
        "action_priority": "medium",
        "operator_notes": "Use onboarding and second-purchase nudges.",
    },
    {
        "match_type": "segment",
        "match_key": "repeat_buyers",
        "recommended_action": "repeat_buyer_upsell",
        "campaign_type": "upsell_cross_sell",
        "action_priority": "medium",
        "operator_notes": "Use bundle offers, cross-sell, and loyalty-style campaigns.",
    },
    {
        "match_type": "segment",
        "match_key": "lapsed_paid",
        "recommended_action": "win_back_lapsed_paid",
        "campaign_type": "win_back",
        "action_priority": "medium",
        "operator_notes": "Use controlled win-back offers for lapsed paid contacts.",
    },
]

ACTION_PRIORITY_BY_KEY = {
    "suppress_do_not_contact": "critical",
    "manual_review_required": "critical",
    "transactional_only_no_promo": "high",
    "retention_high_value_at_risk": "high",
    "launch_promo_followup": "high",
    "post_launch_onboarding": "high",
    "vip_premium_offer": "medium",
    "new_buyer_onboarding": "medium",
    "repeat_buyer_upsell": "medium",
    "win_back_lapsed_paid": "medium",
    "general_paid_nurture": "low",
}

SEGMENT_ACTIONS = {
    "high_value_at_risk": (
        "retention_high_value_at_risk",
        "retention",
        "high_value_at_risk segment matched",
    ),
    "launch_promo_buyers": (
        "launch_promo_followup",
        "launch_followup",
        "launch_promo_buyers segment matched",
    ),
    "post_launch_stripe_buyers": (
        "post_launch_onboarding",
        "onboarding",
        "post_launch_stripe_buyers segment matched",
    ),
    "high_value_spend": (
        "vip_premium_offer",
        "vip_offer",
        "high_value_spend segment matched",
    ),
    "new_buyers_30d": (
        "new_buyer_onboarding",
        "onboarding",
        "new_buyers_30d segment matched",
    ),
    "new_buyers": (
        "new_buyer_onboarding",
        "onboarding",
        "new_buyers segment matched",
    ),
    "repeat_buyers": (
        "repeat_buyer_upsell",
        "upsell_cross_sell",
        "repeat_buyers segment matched",
    ),
    "lapsed_paid": (
        "win_back_lapsed_paid",
        "win_back",
        "lapsed_paid segment matched",
    ),
    "suppressed_privacy_or_unsubscribed": (
        "suppress_do_not_contact",
        "suppression",
        "suppressed_privacy_or_unsubscribed segment matched",
    ),
}


@dataclass
class InputAudit:
    logical_source: str
    input_path: str
    detected_source: str
    parse_source: str
    row_count: int
    delimiter: str
    mismatched_label: bool
    warnings: list[str] = field(default_factory=list)


@dataclass(order=True)
class NameCandidate:
    source_rank: int
    observed_at: datetime
    first_name: str
    last_name: str


@dataclass
class CustomerAggregate:
    email: str
    email_valid: bool
    source_presence: set[str] = field(default_factory=set)
    provenance_counts: Counter[str] = field(default_factory=Counter)
    name_candidates: list[NameCandidate] = field(default_factory=list)
    total_paid_spend: Decimal = field(default_factory=lambda: Decimal("0.00"))
    refunded_spend: Decimal = field(default_factory=lambda: Decimal("0.00"))
    purchase_count: int = 0
    first_paid_at: datetime | None = None
    last_paid_at: datetime | None = None
    stripe_paid_at: list[datetime] = field(default_factory=list)
    failed_evidence_count: int = 0
    refund_evidence_count: int = 0
    ambiguous_evidence_count: int = 0
    stripe_customer_rollup_spend: Decimal = field(default_factory=lambda: Decimal("0.00"))
    stripe_customer_rollup_payment_count: int = 0
    has_unsubscribe_suppression: bool = False
    has_privacy_suppression: bool = False
    has_bounce_suppression: bool = False
    has_complaint_suppression: bool = False
    marketing_eligibility: str = "transactional_only"
    eligibility_reason: str = ""
    lifecycle_state: str = "no_paid_history"
    segment_flags: dict[str, bool] = field(default_factory=dict)
    segment_keys: list[str] = field(default_factory=list)
    deferred_segment_keys: list[str] = field(default_factory=lambda: list(DEFERRED_SEGMENTS))
    review_reasons: set[str] = field(default_factory=set)
    post_launch_stripe_buyer_flag: bool = False
    launch_promo_buyer_flag: bool = False
    bootstrap_bucket: str = ""
    primary_recommended_action: str = ""
    primary_campaign_type: str = ""
    primary_action_priority: str = ""
    primary_action_reason: str = ""
    secondary_recommended_actions: list[str] = field(default_factory=list)
    best_user_score: str = ""


def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _normalize_email(value: Any) -> str:
    return _clean_text(value).lower()


def _valid_email(email: str) -> bool:
    return bool(EMAIL_PATTERN.match(email))


def _parse_decimal(value: Any) -> Decimal:
    text = _clean_text(value).replace(",", "")
    if not text:
        return Decimal("0.00")
    try:
        return Decimal(text).quantize(MONEY_PLACES)
    except (InvalidOperation, ValueError):
        return Decimal("0.00")


def _format_money(value: Decimal) -> str:
    return f"{value.quantize(MONEY_PLACES):.2f}"


def _format_bool(value: bool) -> str:
    return "true" if value else "false"


def _format_datetime(value: datetime | None) -> str:
    if value is None:
        return ""
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _parse_iso_datetime(value: str) -> datetime:
    text = _clean_text(value)
    if not text:
        raise ValueError("empty datetime value")
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    parsed = datetime.fromisoformat(text)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _parse_known_datetime(value: Any, *, source_tz: timezone) -> datetime | None:
    text = _clean_text(value)
    if not text:
        return None
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            parsed = datetime.strptime(text, fmt)
            return parsed.replace(tzinfo=source_tz).astimezone(UTC)
        except ValueError:
            continue
    try:
        return _parse_iso_datetime(text)
    except ValueError:
        return None


def _cents(value: Decimal) -> int:
    return int((value.quantize(MONEY_PLACES) * 100))


def _join_keys(values: Iterable[str]) -> str:
    return ";".join(value for value in values if value)


def _dedupe_preserve_order(values: Iterable[str]) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()
    for value in values:
        if not value or value in seen:
            continue
        ordered.append(value)
        seen.add(value)
    return ordered


def _write_csv(path: Path, headers: Sequence[str], rows: Sequence[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(headers))
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def _load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))


def _expected_source_from_logical_source(logical_source: str) -> str:
    if logical_source in {SOURCE_EJUNKIE, SOURCE_PODIA, SOURCE_STRIPE, SOURCE_SUBSTACK}:
        return logical_source
    return normalizer.SOURCE_UNKNOWN


def _load_thresholds(config_path: Path, args: argparse.Namespace) -> dict[str, Any]:
    segment_thresholds = load_segment_thresholds(config_path)
    raw_config = _load_json(config_path)
    retention = raw_config.get("retention_thresholds", {})

    thresholds = {
        "high_value_spend_min": Decimal(
            str(
                args.high_value_spend_min
                if args.high_value_spend_min is not None
                else segment_thresholds["high_value_spend_min"]
            )
        ).quantize(MONEY_PLACES),
        "repeat_buyer_purchase_count_min": int(
            args.repeat_buyer_purchase_count_min
            if args.repeat_buyer_purchase_count_min is not None
            else segment_thresholds["repeat_buyer_purchase_count_min"]
        ),
        "new_buyer_window_days": int(
            args.new_buyer_window_days
            if args.new_buyer_window_days is not None
            else segment_thresholds["new_buyer_window_days"]
        ),
        "risk_7d_days": int(
            args.risk_7d_days
            if args.risk_7d_days is not None
            else retention.get("no_progress_days", DEFAULT_RISK_7D_DAYS)
        ),
        "risk_14d_days": int(
            args.risk_14d_days
            if args.risk_14d_days is not None
            else retention.get("risk_14d_days", DEFAULT_RISK_14D_DAYS)
        ),
        "lapsed_days": int(
            args.lapsed_days
            if args.lapsed_days is not None
            else retention.get("retained_window_days", DEFAULT_LAPSED_DAYS)
        ),
    }

    if thresholds["risk_7d_days"] > thresholds["risk_14d_days"]:
        raise SystemExit("risk_7d_days must be <= risk_14d_days")
    if thresholds["risk_14d_days"] > thresholds["lapsed_days"]:
        raise SystemExit("risk_14d_days must be <= lapsed_days")
    return thresholds


def _load_suppression_emails(path: Path | None, label: str) -> tuple[set[str], dict[str, Any]]:
    if path is None:
        return set(), {
            "label": label,
            "input_path": None,
            "loaded_count": 0,
            "invalid_count": 0,
            "duplicate_count": 0,
        }

    text = path.read_text(encoding="utf-8-sig", errors="replace")
    lines = [line for line in text.splitlines() if _clean_text(line)]
    emails: set[str] = set()
    duplicate_count = 0
    invalid_count = 0

    email_column: str | None = None
    if lines:
        delimiter = "\t" if lines[0].count("\t") > lines[0].count(",") else ","
        reader = csv.DictReader(lines, delimiter=delimiter)
        if reader.fieldnames:
            for field_name in reader.fieldnames:
                canonical = _clean_text(field_name).lower()
                if canonical == "email" or canonical == "email_normalized" or "email" in canonical:
                    email_column = field_name
                    break
        if email_column:
            for row in reader:
                email = _normalize_email(row.get(email_column, ""))
                if not email:
                    continue
                if not _valid_email(email):
                    invalid_count += 1
                    continue
                if email in emails:
                    duplicate_count += 1
                    continue
                emails.add(email)
        else:
            for line in lines:
                email = _normalize_email(line)
                if not email:
                    continue
                if not _valid_email(email):
                    invalid_count += 1
                    continue
                if email in emails:
                    duplicate_count += 1
                    continue
                emails.add(email)

    metadata = {
        "label": label,
        "input_path": str(path),
        "loaded_count": len(emails),
        "invalid_count": invalid_count,
        "duplicate_count": duplicate_count,
    }
    return emails, metadata


def _get_or_create_customer(customers: dict[str, CustomerAggregate], email: str) -> CustomerAggregate:
    if email not in customers:
        customers[email] = CustomerAggregate(email=email, email_valid=_valid_email(email))
    return customers[email]


def _maybe_add_name(
    customer: CustomerAggregate,
    first_name: Any,
    last_name: Any,
    *,
    source_rank: int,
    observed_at: datetime | None,
) -> None:
    first = _clean_text(first_name)
    last = _clean_text(last_name)
    if not first and not last:
        return
    customer.name_candidates.append(
        NameCandidate(
            source_rank=source_rank,
            observed_at=observed_at or datetime.min.replace(tzinfo=UTC),
            first_name=first,
            last_name=last,
        )
    )


def _update_paid_window(customer: CustomerAggregate, paid_at: datetime) -> None:
    if customer.first_paid_at is None or paid_at < customer.first_paid_at:
        customer.first_paid_at = paid_at
    if customer.last_paid_at is None or paid_at > customer.last_paid_at:
        customer.last_paid_at = paid_at


def _choose_name(customer: CustomerAggregate) -> tuple[str, str]:
    if not customer.name_candidates:
        return "", ""
    best = sorted(customer.name_candidates)[0]
    return best.first_name, best.last_name


def _source_overlap(source_presence: set[str]) -> str:
    if not source_presence:
        return "no_source"
    if len(source_presence) == 1:
        return f"{next(iter(source_presence))}_only"
    return "_plus_".join(sorted(source_presence))


def _file_analysis_for_legacy_source(path: Path, logical_source: str) -> tuple[InputAudit, list[dict[str, str]], str]:
    analysis = normalizer.analyze_and_normalize_file(
        input_path=path,
        output_dir=path.parent,
        dry_run=True,
        strict_source=False,
    )
    headers, raw_rows, _, _ = normalizer._read_rows(path)  # pylint: disable=protected-access
    parse_source = analysis.detected_source_from_header
    warnings = list(analysis.warnings)
    if parse_source == normalizer.SOURCE_UNKNOWN:
        parse_source = _expected_source_from_logical_source(logical_source)
        warnings.append(
            f"Fell back to logical source parser '{parse_source}' because header detection was unknown."
        )

    normalized_rows = normalizer.normalize_rows(parse_source, raw_rows)
    audit = InputAudit(
        logical_source=logical_source,
        input_path=str(path),
        detected_source=analysis.detected_source_from_header,
        parse_source=parse_source,
        row_count=len(raw_rows),
        delimiter=analysis.delimiter,
        mismatched_label=analysis.mismatched_label,
        warnings=warnings,
    )
    return audit, normalized_rows, parse_source


def _read_dict_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def _load_stripe_payments(path: Path) -> tuple[InputAudit, list[dict[str, str]]]:
    rows = _read_dict_rows(path)
    required_columns = {
        "Created date (UTC)",
        "Amount",
        "Amount Refunded",
        "Currency",
        "Captured",
        "Status",
        "Customer Email",
    }
    missing = sorted(required_columns.difference(rows[0].keys() if rows else set()))
    if missing:
        raise SystemExit(
            f"Stripe payments file is missing required columns: {', '.join(missing)}"
        )
    audit = InputAudit(
        logical_source="stripe_payments",
        input_path=str(path),
        detected_source="stripe_payments",
        parse_source="stripe_payments",
        row_count=len(rows),
        delimiter="COMMA",
        mismatched_label=False,
        warnings=[],
    )
    return audit, rows


def _ingest_stripe_payments(customers: dict[str, CustomerAggregate], rows: Sequence[dict[str, str]]) -> None:
    for row in rows:
        email = _normalize_email(row.get("Customer Email", ""))
        if not email:
            continue
        customer = _get_or_create_customer(customers, email)
        customer.source_presence.add(SOURCE_STRIPE)
        customer.provenance_counts["stripe_payment_rows"] += 1

        paid_at = _parse_known_datetime(row.get("Created date (UTC)"), source_tz=UTC)
        amount = _parse_decimal(row.get("Amount"))
        amount_refunded = _parse_decimal(row.get("Amount Refunded"))
        status = _clean_text(row.get("Status")).lower()
        captured = _clean_text(row.get("Captured")).lower() == "true"

        success = status == "paid" and captured
        refund_evidence = status == "refunded" or amount_refunded > Decimal("0.00")
        failed = status == "failed" or not captured

        if success and paid_at is not None:
            customer.purchase_count += 1
            customer.total_paid_spend += amount
            customer.stripe_paid_at.append(paid_at)
            _update_paid_window(customer, paid_at)
        if refund_evidence:
            customer.refunded_spend += amount_refunded
            customer.refund_evidence_count += 1
        if failed:
            customer.failed_evidence_count += 1
        if not success and not refund_evidence and status not in {"", "failed", "paid"}:
            customer.ambiguous_evidence_count += 1


def _ingest_stripe_customers(customers: dict[str, CustomerAggregate], rows: Sequence[dict[str, str]]) -> None:
    for row in rows:
        email = _normalize_email(row.get("email", ""))
        if not email:
            continue
        customer = _get_or_create_customer(customers, email)
        customer.source_presence.add(SOURCE_STRIPE)
        customer.provenance_counts["stripe_customer_rows"] += 1

        created_at = _parse_known_datetime(row.get("created_at"), source_tz=UTC)
        _maybe_add_name(
            customer,
            row.get("first_name"),
            row.get("last_name"),
            source_rank=0,
            observed_at=created_at,
        )
        customer.stripe_customer_rollup_spend = max(
            customer.stripe_customer_rollup_spend,
            _parse_decimal(row.get("total_spend")),
        )
        try:
            customer.stripe_customer_rollup_payment_count = max(
                customer.stripe_customer_rollup_payment_count,
                int(float(_clean_text(row.get("payment_count")) or "0")),
            )
        except ValueError:
            customer.review_reasons.add("stripe_customer_payment_count_invalid")


def _ingest_legacy_rows(
    customers: dict[str, CustomerAggregate],
    *,
    logical_source: str,
    parse_source: str,
    rows: Sequence[dict[str, str]],
) -> None:
    provenance_key = f"{logical_source}_rows"
    for row in rows:
        email = _normalize_email(row.get("email", ""))
        if not email:
            continue
        customer = _get_or_create_customer(customers, email)
        customer.source_presence.add(logical_source)
        customer.provenance_counts[provenance_key] += 1

        if parse_source == normalizer.SOURCE_EJUNKIE:
            observed_at = _parse_known_datetime(row.get("purchase_date"), source_tz=MST)
            _maybe_add_name(
                customer,
                row.get("first_name"),
                row.get("last_name"),
                source_rank=2,
                observed_at=observed_at,
            )
            amount = _parse_decimal(row.get("gross_amount"))
            status = _clean_text(row.get("payment_status")).lower()
            success = status == "completed"
            refund_evidence = status in {"refunded", "canceled_reversal", "reversed"}
            failed = status in {"failed", "declined"}

            if success and observed_at is not None:
                customer.purchase_count += 1
                customer.total_paid_spend += amount
                _update_paid_window(customer, observed_at)
            if refund_evidence:
                customer.refunded_spend += amount
                customer.refund_evidence_count += 1
            if failed:
                customer.failed_evidence_count += 1
            if not success and not refund_evidence and not failed and status:
                customer.ambiguous_evidence_count += 1
            continue

        if parse_source == normalizer.SOURCE_PODIA:
            observed_at = _parse_known_datetime(row.get("enrolled_at"), source_tz=UTC)
            _maybe_add_name(
                customer,
                row.get("first_name"),
                row.get("last_name"),
                source_rank=2,
                observed_at=observed_at,
            )
            amount = _parse_decimal(row.get("purchase_amount"))
            if amount > Decimal("0.00") and observed_at is not None:
                customer.purchase_count += 1
                customer.total_paid_spend += amount
                _update_paid_window(customer, observed_at)
            else:
                customer.ambiguous_evidence_count += 1
            continue

        if parse_source == normalizer.SOURCE_SUBSTACK:
            observed_at = _parse_known_datetime(row.get("subscribed_at"), source_tz=UTC)
            _maybe_add_name(
                customer,
                row.get("first_name"),
                row.get("last_name"),
                source_rank=3,
                observed_at=observed_at,
            )
            continue

        customer.ambiguous_evidence_count += 1


def _derive_lifecycle(customer: CustomerAggregate, as_of: datetime, thresholds: dict[str, Any]) -> str:
    if customer.purchase_count <= 0 or customer.last_paid_at is None:
        return "no_paid_history"

    age = as_of - customer.last_paid_at
    is_new_buyer = (
        customer.purchase_count == 1
        and customer.first_paid_at is not None
        and customer.first_paid_at >= as_of - timedelta(days=thresholds["new_buyer_window_days"])
    )
    if is_new_buyer:
        return "new_unactivated"
    if age >= timedelta(days=thresholds["lapsed_days"]):
        return "lapsed_paid"
    if age >= timedelta(days=thresholds["risk_14d_days"]):
        return "at_risk_14d"
    if age >= timedelta(days=thresholds["risk_7d_days"]):
        return "at_risk_7d"
    return "retained_30d"


def _derive_marketing_eligibility(customer: CustomerAggregate) -> tuple[str, str]:
    if customer.has_unsubscribe_suppression:
        return "suppressed_unsubscribed", "present in unsubscribe suppression input"
    if customer.has_privacy_suppression:
        return "suppressed_privacy_request", "present in privacy suppression input"
    if customer.has_bounce_suppression:
        return "suppressed_bounced", "present in bounce suppression input"
    if customer.has_complaint_suppression:
        return "suppressed_complaint", "present in complaint suppression input"
    if not customer.email_valid:
        return "review_required", "email failed normalization validation"
    if customer.purchase_count > 0:
        return "eligible_paid", "has at least one successful paid/completed purchase and no suppression hit"
    if (
        customer.failed_evidence_count > 0
        or customer.refund_evidence_count > 0
        or customer.ambiguous_evidence_count > 0
        or customer.stripe_customer_rollup_payment_count > 0
        or customer.stripe_customer_rollup_spend > Decimal("0.00")
    ):
        return "review_required", "purchase state is ambiguous, failed-only, refunded-only, or rollup-only"
    if customer.source_presence:
        return "transactional_only", "relationship evidence exists without promotable paid purchase proof"
    return "review_required", "no usable customer record could be derived"


def _derive_phase0_flags(
    customer: CustomerAggregate,
    *,
    launch_start_at: datetime,
    launch_end_at: datetime,
) -> tuple[bool, bool]:
    raw_post_launch = any(paid_at >= launch_start_at for paid_at in customer.stripe_paid_at)
    raw_launch_window = any(
        launch_start_at <= paid_at <= launch_end_at for paid_at in customer.stripe_paid_at
    )
    if customer.marketing_eligibility != "eligible_paid":
        return False, False
    return raw_post_launch, raw_launch_window


def _segment_profile(customer: CustomerAggregate, thresholds: dict[str, Any]) -> tuple[dict[str, bool], list[str]]:
    evaluator_marketing = "eligible" if customer.marketing_eligibility == "eligible_paid" else customer.marketing_eligibility
    result = evaluate_profile_segments(
        {
            "purchase_count": customer.purchase_count,
            "total_spend": float(customer.total_paid_spend),
            "lifecycle_state_projection": customer.lifecycle_state,
            "marketing_eligibility": evaluator_marketing,
            "first_purchase_at": _format_datetime(customer.first_paid_at),
            "last_purchase_at": _format_datetime(customer.last_paid_at),
            "has_active_privacy_request": customer.has_privacy_suppression,
        },
        high_value_spend_min=float(thresholds["high_value_spend_min"]),
        high_engagement_score_min=0.8,
        repeat_buyer_purchase_count_min=int(thresholds["repeat_buyer_purchase_count_min"]),
        new_buyer_window_days=int(thresholds["new_buyer_window_days"]),
    )

    active_keys = [
        key
        for key in result["segment_keys"]
        if key in ACTIVE_SEGMENTS and key not in DEFERRED_SEGMENTS
    ]
    if customer.post_launch_stripe_buyer_flag:
        active_keys.append("post_launch_stripe_buyers")
    if customer.launch_promo_buyer_flag:
        active_keys.append("launch_promo_buyers")

    ordered = sorted(set(active_keys), key=lambda key: SEGMENT_PRIORITY.get(key, 999))
    flags = {segment: segment in ordered for segment in ACTIVE_SEGMENTS}
    return flags, ordered


def _best_user_score(customer: CustomerAggregate) -> str:
    last_paid_token = (
        customer.last_paid_at.astimezone(UTC).strftime("%Y%m%d%H%M%S")
        if customer.last_paid_at
        else "00000000000000"
    )
    return (
        f"PL{int(customer.post_launch_stripe_buyer_flag)}|"
        f"HV{int(customer.segment_flags.get('high_value_spend', False))}|"
        f"RB{int(customer.segment_flags.get('repeat_buyers', False))}|"
        f"SC{len(customer.source_presence):02d}|"
        f"LP{int(customer.launch_promo_buyer_flag)}|"
        f"TS{_cents(customer.total_paid_spend):012d}|"
        f"PC{customer.purchase_count:06d}|"
        f"DT{last_paid_token}"
    )


def _derive_bootstrap_bucket(
    customer: CustomerAggregate,
    *,
    top_emails: set[str],
    reserve_emails: set[str],
) -> str:
    if customer.email in top_emails:
        return "top_4500"
    if customer.email in reserve_emails:
        return "reserve_next_500"
    if customer.marketing_eligibility == "eligible_paid":
        return "eligible_not_ranked"
    if customer.marketing_eligibility.startswith("suppressed_"):
        return "suppressed"
    if customer.marketing_eligibility == "review_required":
        return "review_required"
    if customer.marketing_eligibility == "transactional_only":
        return "transactional_only"
    return "not_ranked"


def _secondary_actions_for_segments(customer: CustomerAggregate) -> list[str]:
    actions: list[str] = []
    for segment in customer.segment_keys:
        action_meta = SEGMENT_ACTIONS.get(segment)
        if action_meta is None:
            continue
        actions.append(action_meta[0])
    return _dedupe_preserve_order(actions)


def _assign_recommended_actions(customer: CustomerAggregate) -> None:
    if customer.marketing_eligibility.startswith("suppressed_"):
        customer.primary_recommended_action = "suppress_do_not_contact"
        customer.primary_campaign_type = "suppression"
        customer.primary_action_priority = ACTION_PRIORITY_BY_KEY[customer.primary_recommended_action]
        customer.primary_action_reason = customer.marketing_eligibility
        customer.secondary_recommended_actions = []
        return

    if customer.marketing_eligibility == "review_required":
        customer.primary_recommended_action = "manual_review_required"
        customer.primary_campaign_type = "manual_ops_review"
        customer.primary_action_priority = ACTION_PRIORITY_BY_KEY[customer.primary_recommended_action]
        customer.primary_action_reason = _join_keys(sorted(customer.review_reasons)) or customer.eligibility_reason
        customer.secondary_recommended_actions = []
        return

    if customer.marketing_eligibility == "transactional_only":
        customer.primary_recommended_action = "transactional_only_no_promo"
        customer.primary_campaign_type = "transactional_only"
        customer.primary_action_priority = ACTION_PRIORITY_BY_KEY[customer.primary_recommended_action]
        customer.primary_action_reason = customer.eligibility_reason
        customer.secondary_recommended_actions = []
        return

    prioritized_segments = [
        "high_value_at_risk",
        "launch_promo_buyers",
        "post_launch_stripe_buyers",
        "high_value_spend",
        "new_buyers_30d",
        "new_buyers",
        "repeat_buyers",
        "lapsed_paid",
    ]
    for segment in prioritized_segments:
        if customer.segment_flags.get(segment, False):
            action_key, campaign_type, reason = SEGMENT_ACTIONS[segment]
            customer.primary_recommended_action = action_key
            customer.primary_campaign_type = campaign_type
            customer.primary_action_priority = ACTION_PRIORITY_BY_KEY[action_key]
            customer.primary_action_reason = reason
            break

    if not customer.primary_recommended_action:
        customer.primary_recommended_action = "general_paid_nurture"
        customer.primary_campaign_type = "nurture"
        customer.primary_action_priority = ACTION_PRIORITY_BY_KEY[customer.primary_recommended_action]
        customer.primary_action_reason = "eligible_paid with no higher-priority action segment"

    secondary_actions = _secondary_actions_for_segments(customer)
    customer.secondary_recommended_actions = [
        action for action in secondary_actions if action != customer.primary_recommended_action
    ]


def _ranking_key(customer: CustomerAggregate) -> tuple[Any, ...]:
    last_paid_ts = int(customer.last_paid_at.timestamp()) if customer.last_paid_at else 0
    return (
        -int(customer.post_launch_stripe_buyer_flag),
        -int(customer.segment_flags.get("high_value_spend", False)),
        -int(customer.segment_flags.get("repeat_buyers", False)),
        -len(customer.source_presence),
        -int(customer.launch_promo_buyer_flag),
        -_cents(customer.total_paid_spend),
        -customer.purchase_count,
        -last_paid_ts,
        customer.email,
    )


def _apply_suppressions(
    customers: dict[str, CustomerAggregate],
    emails: Iterable[str],
    flag_name: str,
) -> None:
    for email in emails:
        customer = _get_or_create_customer(customers, email)
        setattr(customer, flag_name, True)


def _customer_to_universe_row(customer: CustomerAggregate) -> dict[str, Any]:
    first_name, last_name = _choose_name(customer)
    return {
        "email": customer.email,
        "first_name": first_name,
        "last_name": last_name,
        "marketing_eligibility": customer.marketing_eligibility,
        "eligibility_reason": customer.eligibility_reason,
        "bootstrap_bucket": customer.bootstrap_bucket,
        "source_flags": _join_keys(sorted(customer.source_presence)),
        "source_overlap": _source_overlap(customer.source_presence),
        "source_count": len(customer.source_presence),
        "has_stripe": _format_bool(SOURCE_STRIPE in customer.source_presence),
        "has_ejunkie": _format_bool(SOURCE_EJUNKIE in customer.source_presence),
        "has_podia": _format_bool(SOURCE_PODIA in customer.source_presence),
        "has_substack": _format_bool(SOURCE_SUBSTACK in customer.source_presence),
        "total_spend": _format_money(customer.total_paid_spend),
        "refunded_spend": _format_money(customer.refunded_spend),
        "purchase_count": customer.purchase_count,
        "first_paid_at": _format_datetime(customer.first_paid_at),
        "last_paid_at": _format_datetime(customer.last_paid_at),
        "lifecycle_state": customer.lifecycle_state,
        "segment_keys": _join_keys(customer.segment_keys),
        "deferred_segment_keys": _join_keys(customer.deferred_segment_keys),
        "post_launch_stripe_buyer_flag": _format_bool(customer.post_launch_stripe_buyer_flag),
        "launch_promo_buyer_flag": _format_bool(customer.launch_promo_buyer_flag),
        "high_value_spend_flag": _format_bool(customer.segment_flags.get("high_value_spend", False)),
        "high_value_at_risk_flag": _format_bool(customer.segment_flags.get("high_value_at_risk", False)),
        "new_buyers_30d_flag": _format_bool(customer.segment_flags.get("new_buyers_30d", False)),
        "repeat_buyers_flag": _format_bool(customer.segment_flags.get("repeat_buyers", False)),
        "lapsed_paid_flag": _format_bool(customer.segment_flags.get("lapsed_paid", False)),
        "suppressed_privacy_or_unsubscribed_flag": _format_bool(
            customer.segment_flags.get("suppressed_privacy_or_unsubscribed", False)
        ),
        "new_buyers_flag": _format_bool(customer.segment_flags.get("new_buyers", False)),
        "has_unsubscribe_suppression": _format_bool(customer.has_unsubscribe_suppression),
        "has_privacy_suppression": _format_bool(customer.has_privacy_suppression),
        "has_bounce_suppression": _format_bool(customer.has_bounce_suppression),
        "has_complaint_suppression": _format_bool(customer.has_complaint_suppression),
        "failed_evidence_count": customer.failed_evidence_count,
        "refund_evidence_count": customer.refund_evidence_count,
        "ambiguous_evidence_count": customer.ambiguous_evidence_count,
        "stripe_payment_row_count": customer.provenance_counts.get("stripe_payment_rows", 0),
        "stripe_customer_row_count": customer.provenance_counts.get("stripe_customer_rows", 0),
        "ejunkie_row_count": customer.provenance_counts.get("ejunkie_rows", 0),
        "podia_row_count": customer.provenance_counts.get("podia_rows", 0),
        "substack_row_count": customer.provenance_counts.get("substack_rows", 0),
        "primary_recommended_action": customer.primary_recommended_action,
        "primary_campaign_type": customer.primary_campaign_type,
        "primary_action_priority": customer.primary_action_priority,
        "primary_action_reason": customer.primary_action_reason,
        "secondary_recommended_actions": _join_keys(customer.secondary_recommended_actions),
        "best_user_score": customer.best_user_score,
        "review_reasons": _join_keys(sorted(customer.review_reasons)),
    }


def _customer_to_action_row(customer: CustomerAggregate) -> dict[str, Any]:
    first_name, last_name = _choose_name(customer)
    return {
        "email": customer.email,
        "first_name": first_name,
        "last_name": last_name,
        "marketing_eligibility": customer.marketing_eligibility,
        "bootstrap_bucket": customer.bootstrap_bucket,
        "source_overlap": _source_overlap(customer.source_presence),
        "total_spend": _format_money(customer.total_paid_spend),
        "purchase_count": customer.purchase_count,
        "last_paid_at": _format_datetime(customer.last_paid_at),
        "segment_keys": _join_keys(customer.segment_keys),
        "primary_recommended_action": customer.primary_recommended_action,
        "primary_campaign_type": customer.primary_campaign_type,
        "primary_action_priority": customer.primary_action_priority,
        "primary_action_reason": customer.primary_action_reason,
        "secondary_recommended_actions": _join_keys(customer.secondary_recommended_actions),
        "best_user_score": customer.best_user_score,
    }


def _customer_to_brevo_row(customer: CustomerAggregate) -> dict[str, Any]:
    first_name, last_name = _choose_name(customer)
    return {
        "email": customer.email,
        "first_name": first_name,
        "last_name": last_name,
        "segment_keys": _join_keys(customer.segment_keys),
        "marketing_eligibility": customer.marketing_eligibility,
        "total_spend": _format_money(customer.total_paid_spend),
        "purchase_count": customer.purchase_count,
        "first_paid_at": _format_datetime(customer.first_paid_at),
        "last_paid_at": _format_datetime(customer.last_paid_at),
        "source_overlap": _source_overlap(customer.source_presence),
        "post_launch_stripe_buyer_flag": _format_bool(customer.post_launch_stripe_buyer_flag),
        "launch_promo_buyer_flag": _format_bool(customer.launch_promo_buyer_flag),
        "best_user_score": customer.best_user_score,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Build a reviewable, suppression-safe Brevo bootstrap audience from purchase-led exports."
    )
    parser.add_argument("--stripe-payments", required=True, help="Path to unified_payments.csv")
    parser.add_argument("--stripe-customers", required=True, help="Path to Stripe_customers.csv")
    parser.add_argument("--ejunkie", required=True, help="Path to e-junkie export")
    parser.add_argument("--podia", required=True, help="Path to Podia export")
    parser.add_argument("--substack", required=True, help="Path to Substack export")
    parser.add_argument("--unsubscribe-csv", required=True, help="Path to unsubscribe suppression input")
    parser.add_argument("--privacy-request-csv", help="Optional privacy-request suppression input")
    parser.add_argument("--bounce-csv", help="Optional bounce suppression input")
    parser.add_argument("--complaint-csv", help="Optional complaint suppression input")
    parser.add_argument("--out-dir", required=True, help="Output directory for CSV and JSON artifacts")
    parser.add_argument("--launch-start", default=DEFAULT_LAUNCH_START, help="UTC launch start datetime")
    parser.add_argument("--launch-end", default=DEFAULT_LAUNCH_END, help="UTC launch promo end datetime")
    parser.add_argument("--as-of", help="Optional UTC as-of timestamp for lifecycle calculation")
    parser.add_argument(
        "--config-path",
        default=str(Path(__file__).resolve().parents[1] / "config" / "segment_thresholds.sample.json"),
        help="Path to segment threshold config JSON",
    )
    parser.add_argument("--high-value-spend-min", type=float, help="Override high-value spend minimum")
    parser.add_argument(
        "--repeat-buyer-purchase-count-min",
        type=int,
        help="Override repeat buyer purchase count minimum",
    )
    parser.add_argument("--new-buyer-window-days", type=int, help="Override new buyer window")
    parser.add_argument("--risk-7d-days", type=int, help="Override at-risk 7d boundary")
    parser.add_argument("--risk-14d-days", type=int, help="Override at-risk 14d boundary")
    parser.add_argument("--lapsed-days", type=int, help="Override lapsed boundary")
    parser.add_argument("--top-limit", type=int, default=DEFAULT_TOP_LIMIT, help="Top audience export limit")
    parser.add_argument("--reserve-limit", type=int, default=DEFAULT_RESERVE_LIMIT, help="Reserve audience export limit")
    return parser


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    config_path = Path(args.config_path).resolve()
    thresholds = _load_thresholds(config_path, args)
    launch_start_at = _parse_iso_datetime(args.launch_start)
    launch_end_at = _parse_iso_datetime(args.launch_end)
    if launch_end_at < launch_start_at:
        raise SystemExit("launch-end must be >= launch-start")

    as_of = _parse_iso_datetime(args.as_of) if args.as_of else datetime.now(UTC)

    audits: list[InputAudit] = []
    customers: dict[str, CustomerAggregate] = {}

    stripe_payments_audit, stripe_payment_rows = _load_stripe_payments(Path(args.stripe_payments).resolve())
    audits.append(stripe_payments_audit)
    _ingest_stripe_payments(customers, stripe_payment_rows)

    stripe_customer_audit, stripe_customer_rows, _ = _file_analysis_for_legacy_source(
        Path(args.stripe_customers).resolve(),
        logical_source=SOURCE_STRIPE,
    )
    audits.append(stripe_customer_audit)
    _ingest_stripe_customers(customers, stripe_customer_rows)

    for logical_source, raw_path in (
        (SOURCE_EJUNKIE, args.ejunkie),
        (SOURCE_PODIA, args.podia),
        (SOURCE_SUBSTACK, args.substack),
    ):
        audit, normalized_rows, parse_source = _file_analysis_for_legacy_source(
            Path(raw_path).resolve(),
            logical_source=logical_source,
        )
        audits.append(audit)
        _ingest_legacy_rows(
            customers,
            logical_source=logical_source,
            parse_source=parse_source,
            rows=normalized_rows,
        )

    unsubscribe_emails, unsubscribe_meta = _load_suppression_emails(
        Path(args.unsubscribe_csv).resolve(),
        "unsubscribe",
    )
    privacy_emails, privacy_meta = _load_suppression_emails(
        Path(args.privacy_request_csv).resolve() if args.privacy_request_csv else None,
        "privacy_request",
    )
    bounce_emails, bounce_meta = _load_suppression_emails(
        Path(args.bounce_csv).resolve() if args.bounce_csv else None,
        "bounce",
    )
    complaint_emails, complaint_meta = _load_suppression_emails(
        Path(args.complaint_csv).resolve() if args.complaint_csv else None,
        "complaint",
    )

    _apply_suppressions(customers, unsubscribe_emails, "has_unsubscribe_suppression")
    _apply_suppressions(customers, privacy_emails, "has_privacy_suppression")
    _apply_suppressions(customers, bounce_emails, "has_bounce_suppression")
    _apply_suppressions(customers, complaint_emails, "has_complaint_suppression")

    all_customers = sorted(customers.values(), key=lambda customer: customer.email)
    for customer in all_customers:
        customer.lifecycle_state = _derive_lifecycle(customer, as_of, thresholds)
        customer.marketing_eligibility, customer.eligibility_reason = _derive_marketing_eligibility(customer)
        if customer.marketing_eligibility == "review_required":
            customer.review_reasons.add(customer.eligibility_reason)
        if (
            customer.purchase_count == 0
            and customer.stripe_customer_rollup_payment_count > 0
            and customer.marketing_eligibility == "review_required"
        ):
            customer.review_reasons.add("stripe_customer_rollup_without_payment_ledger")

        customer.post_launch_stripe_buyer_flag, customer.launch_promo_buyer_flag = _derive_phase0_flags(
            customer,
            launch_start_at=launch_start_at,
            launch_end_at=launch_end_at,
        )
        customer.segment_flags, customer.segment_keys = _segment_profile(customer, thresholds)
        customer.best_user_score = _best_user_score(customer)

    eligible_customers = sorted(
        [customer for customer in all_customers if customer.marketing_eligibility == "eligible_paid"],
        key=_ranking_key,
    )
    suppressed_customers = [
        customer
        for customer in all_customers
        if customer.marketing_eligibility.startswith("suppressed_")
    ]
    review_customers = [
        customer
        for customer in all_customers
        if customer.marketing_eligibility in {"review_required", "transactional_only"}
    ]

    top_customers = eligible_customers[: args.top_limit]
    reserve_customers = eligible_customers[args.top_limit : args.top_limit + args.reserve_limit]
    shortfall = max(args.top_limit - len(eligible_customers), 0)

    top_emails = {customer.email for customer in top_customers}
    reserve_emails = {customer.email for customer in reserve_customers}
    for customer in all_customers:
        customer.bootstrap_bucket = _derive_bootstrap_bucket(
            customer,
            top_emails=top_emails,
            reserve_emails=reserve_emails,
        )
        _assign_recommended_actions(customer)

    universe_rows = [_customer_to_universe_row(customer) for customer in all_customers]
    suppressed_rows = [_customer_to_universe_row(customer) for customer in suppressed_customers]
    review_rows = [_customer_to_universe_row(customer) for customer in review_customers]
    action_rows = [_customer_to_action_row(customer) for customer in all_customers]
    brevo_top_rows = [_customer_to_brevo_row(customer) for customer in top_customers]
    brevo_reserve_rows = [_customer_to_brevo_row(customer) for customer in reserve_customers]

    _write_csv(out_dir / "customer_universe.csv", UNIVERSE_HEADERS, universe_rows)
    _write_csv(out_dir / "contact_action_recommendations.csv", ACTION_HEADERS, action_rows)
    _write_csv(out_dir / "suppressed_contacts.csv", UNIVERSE_HEADERS, suppressed_rows)
    _write_csv(out_dir / "review_required_contacts.csv", UNIVERSE_HEADERS, review_rows)
    _write_csv(out_dir / "brevo_bootstrap_top_4500.csv", BREVO_HEADERS, brevo_top_rows)
    _write_csv(out_dir / "brevo_bootstrap_reserve_next_500.csv", BREVO_HEADERS, brevo_reserve_rows)
    _write_csv(out_dir / "segment_action_playbook.csv", PLAYBOOK_HEADERS, PLAYBOOK_ROWS)

    segment_count_rows: list[dict[str, Any]] = []
    segment_counter = Counter()
    for customer in all_customers:
        for key in customer.segment_keys:
            segment_counter[key] += 1
    for key in ACTIVE_SEGMENTS:
        segment_count_rows.append(
            {
                "segment_key": key,
                "status": "active",
                "count": segment_counter.get(key, 0),
            }
        )
    for key in DEFERRED_SEGMENTS:
        segment_count_rows.append(
            {
                "segment_key": key,
                "status": "deferred",
                "count": 0,
            }
        )
    _write_csv(out_dir / "segment_counts.csv", ["segment_key", "status", "count"], segment_count_rows)

    action_counter = Counter(customer.primary_recommended_action for customer in all_customers)
    action_count_rows = [
        {"recommended_action": action_key, "count": action_counter[action_key]}
        for action_key in sorted(action_counter)
    ]
    _write_csv(out_dir / "action_counts.csv", ["recommended_action", "count"], action_count_rows)

    qa_summary = {
        "summary": {
            "customer_universe_count": len(all_customers),
            "eligible_paid_count": len(eligible_customers),
            "suppressed_count": len(suppressed_customers),
            "review_or_transactional_count": len(review_customers),
            "top_export_count": len(top_customers),
            "reserve_export_count": len(reserve_customers),
            "eligible_shortfall": shortfall,
            "as_of_utc": _format_datetime(as_of),
        },
        "config": {
            "config_path": str(config_path),
            "launch_start_utc": _format_datetime(launch_start_at),
            "launch_end_utc": _format_datetime(launch_end_at),
            "top_limit": args.top_limit,
            "reserve_limit": args.reserve_limit,
            "best_user_score_note": "Deterministic review score derived from the published ranking tuple only.",
            "thresholds": {
                "high_value_spend_min": _format_money(thresholds["high_value_spend_min"]),
                "repeat_buyer_purchase_count_min": thresholds["repeat_buyer_purchase_count_min"],
                "new_buyer_window_days": thresholds["new_buyer_window_days"],
                "risk_7d_days": thresholds["risk_7d_days"],
                "risk_14d_days": thresholds["risk_14d_days"],
                "lapsed_days": thresholds["lapsed_days"],
            },
        },
        "files": [asdict(audit) for audit in audits],
        "suppression_inputs": [
            unsubscribe_meta,
            privacy_meta,
            bounce_meta,
            complaint_meta,
        ],
        "counts": {
            "marketing_eligibility": Counter(
                customer.marketing_eligibility for customer in all_customers
            ),
            "source_overlap": Counter(
                _source_overlap(customer.source_presence) for customer in all_customers
            ),
            "segments": segment_counter,
            "actions": action_counter,
            "launch_windows": {
                "post_launch_stripe_buyers": sum(
                    1 for customer in all_customers if customer.post_launch_stripe_buyer_flag
                ),
                "launch_promo_buyers": sum(
                    1 for customer in all_customers if customer.launch_promo_buyer_flag
                ),
            },
        },
        "warnings": [
            warning
            for audit in audits
            for warning in audit.warnings
        ],
    }
    (out_dir / "qa_summary.json").write_text(json.dumps(qa_summary, indent=2), encoding="utf-8")

    print(json.dumps(qa_summary["summary"], indent=2))
    print(f"Wrote outputs to {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
