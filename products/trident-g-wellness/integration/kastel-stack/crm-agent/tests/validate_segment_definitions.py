from __future__ import annotations

import json

from _common import CRM_AGENT_DIR, fail, ok, run_guard


REQUIRED_SEGMENTS = {
    "high_value_spend",
    "high_value_engaged",
    "high_value_at_risk",
    "new_buyers_30d",
    "repeat_buyers",
    "engaged_non_buyers",
    "course_started_no_progress",
    "lapsed_paid",
    "suppressed_privacy_or_unsubscribed",
}


def main() -> None:
    config_path = CRM_AGENT_DIR / "config" / "segment_thresholds.sample.json"
    payload = json.loads(config_path.read_text(encoding="utf-8"))

    defs = payload.get("segment_definitions", [])
    if not isinstance(defs, list):
        fail("segment_definitions must be a list")

    by_key = {}
    for entry in defs:
        key = entry.get("segment_key")
        if not key:
            fail("segment definition missing segment_key")
        by_key[key] = entry

    missing = sorted(REQUIRED_SEGMENTS - set(by_key))
    if missing:
        fail(f"missing required segment definitions: {', '.join(missing)}")

    high_value_rule = str(by_key["high_value_spend"].get("rule", "")).lower()
    if "total_spend" not in high_value_rule:
        fail("high_value_spend rule must include total_spend")
    high_value_engaged_rule = str(by_key["high_value_engaged"].get("rule", "")).lower()
    if "marketing_eligibility" not in high_value_engaged_rule:
        fail("high_value_engaged rule must include marketing_eligibility")
    if "activity_score_norm" not in high_value_engaged_rule:
        fail("high_value_engaged rule must include activity_score_norm")

    spend_thresholds = payload.get("spend_thresholds", {})
    if "high_value_spend_min" not in spend_thresholds:
        fail("missing spend_thresholds.high_value_spend_min")
    engagement_thresholds = payload.get("engagement_thresholds", {})
    if "high_engagement_score_min" not in engagement_thresholds:
        fail("missing engagement_thresholds.high_engagement_score_min")
    purchase_thresholds = payload.get("purchase_thresholds", {})
    if "repeat_buyer_purchase_count_min" not in purchase_thresholds:
        fail("missing purchase_thresholds.repeat_buyer_purchase_count_min")
    retention_thresholds = payload.get("retention_thresholds", {})
    if "new_buyer_window_days" not in retention_thresholds:
        fail("missing retention_thresholds.new_buyer_window_days")

    ok("segment definitions validated (high-value, engagement, risk, and suppression rules)")


if __name__ == "__main__":
    run_guard(main)
