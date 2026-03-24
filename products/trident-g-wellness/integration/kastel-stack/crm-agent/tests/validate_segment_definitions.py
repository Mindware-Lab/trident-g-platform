from __future__ import annotations

import json

from _common import CRM_AGENT_DIR, fail, ok, run_guard


REQUIRED_SEGMENTS = {
    "new_buyers",
    "course_started_no_progress",
    "lapsed_paid",
    "high_value_spend",
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

    spend_thresholds = payload.get("spend_thresholds", {})
    if "high_value_spend_min" not in spend_thresholds:
        fail("missing spend_thresholds.high_value_spend_min")

    ok("segment definitions validated (including high_value_spend)")


if __name__ == "__main__":
    run_guard(main)
