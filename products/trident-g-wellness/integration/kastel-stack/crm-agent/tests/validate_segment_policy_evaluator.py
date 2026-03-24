from __future__ import annotations

import sys
from pathlib import Path

from _common import CRM_AGENT_DIR, load_json, fail, ok, run_guard


TOOLS_DIR = CRM_AGENT_DIR / "tools"
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

from segment_policy_evaluator import (  # type: ignore  # noqa: E402
    SEGMENT_POLICY_VERSION,
    evaluate_profile_segments,
)


def main() -> None:
    fixture = load_json("segment_policy.fixture.json")
    default_threshold = float(fixture["default_thresholds"]["high_value_spend_min"])

    for case in fixture.get("cases", []):
        result = evaluate_profile_segments(
            case["profile"],
            high_value_spend_min=default_threshold,
        )
        expected = list(case["expected_segment_keys"])
        got = list(result["segment_keys"])
        if got != expected:
            fail(
                f"segment mismatch for {case['name']}: expected {expected}, got {got}"
            )
        if result.get("segment_policy_version") != SEGMENT_POLICY_VERSION:
            fail(
                f"segment policy version mismatch for {case['name']}: "
                f"{result.get('segment_policy_version')} != {SEGMENT_POLICY_VERSION}"
            )

    override = fixture.get("override_threshold_case", {})
    override_result = evaluate_profile_segments(
        override.get("profile", {}),
        high_value_spend_min=float(override.get("high_value_spend_min", default_threshold)),
    )
    override_expected = list(override.get("expected_segment_keys", []))
    if list(override_result["segment_keys"]) != override_expected:
        fail(
            "override threshold case mismatch: "
            f"expected {override_expected}, got {override_result['segment_keys']}"
        )

    ok("segment policy evaluator validated (including high_value_spend threshold)")


if __name__ == "__main__":
    run_guard(main)
