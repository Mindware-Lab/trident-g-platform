from __future__ import annotations

import sys
from pathlib import Path

from _common import CRM_AGENT_DIR, fail, load_json, ok, run_guard


TOOLS_DIR = CRM_AGENT_DIR / "tools"
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import normalize_crm_source_exports as normalizer  # noqa: E402


def main() -> None:
    fixture = load_json("source_normalizer.fixture.json")

    for case in fixture.get("detect_source_cases", []):
        got = normalizer.detect_source(case["headers"])
        expected = case["expected_source"]
        if got != expected:
            fail(
                f"source detection mismatch for '{case['name']}': "
                f"expected {expected}, got {got}"
            )

    sample = fixture.get("normalize_ejunkie_case", {})
    row = sample.get("row", {})
    expected_row = sample.get("expected", {})
    normalized_rows = normalizer.normalize_rows(normalizer.SOURCE_EJUNKIE, [row])
    if len(normalized_rows) != 1:
        fail("expected one normalized row for ejunkie sample")
    got_row = normalized_rows[0]

    for key, expected_value in expected_row.items():
        got_value = got_row.get(key)
        if got_value != expected_value:
            fail(
                f"normalized field mismatch for '{key}': "
                f"expected '{expected_value}', got '{got_value}'"
            )

    stripe_sample = fixture.get("normalize_stripe_case", {})
    stripe_row = stripe_sample.get("row", {})
    stripe_expected = stripe_sample.get("expected", {})
    stripe_normalized_rows = normalizer.normalize_rows(normalizer.SOURCE_STRIPE, [stripe_row])
    if len(stripe_normalized_rows) != 1:
        fail("expected one normalized row for stripe sample")
    stripe_got = stripe_normalized_rows[0]
    for key, expected_value in stripe_expected.items():
        got_value = stripe_got.get(key)
        if got_value != expected_value:
            fail(
                f"stripe normalized field mismatch for '{key}': "
                f"expected '{expected_value}', got '{got_value}'"
            )

    missing = normalizer._required_missing(  # pylint: disable=protected-access
        normalizer.SOURCE_EJUNKIE,
        [sample["row"]],
        fixture["detect_source_cases"][3]["headers"],
    )
    if missing:
        fail(f"unexpected missing required ejunkie fields: {missing}")

    # Mismatch rule: filename says substack, headers say ejunkie.
    expected_from_name = normalizer._expected_from_filename(  # pylint: disable=protected-access
        Path("substack-2026-03-23.txt")
    )
    detected_from_headers = normalizer.detect_source(
        fixture["detect_source_cases"][3]["headers"]
    )
    if expected_from_name == detected_from_headers:
        fail("expected filename/header mismatch rule to trigger, but it did not")

    ok("source normalization and mismatch detection rules validated")


if __name__ == "__main__":
    run_guard(main)
