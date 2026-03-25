from __future__ import annotations

import sys
from pathlib import Path

from _common import CRM_AGENT_DIR, fail, load_json, ok, run_guard


TOOLS_DIR = CRM_AGENT_DIR / "tools"
if str(TOOLS_DIR) not in sys.path:
    sys.path.insert(0, str(TOOLS_DIR))

import normalize_unsubscribe_list as privacy_normalizer  # noqa: E402


def main() -> None:
    fixture = load_json("unsubscribe_normalizer.fixture.json")
    lines = fixture.get("lines", [])
    expected = fixture.get("expected", {})

    rows, duplicate_rows, invalid_rows = privacy_normalizer.normalize_unsubscribe_lines(
        lines=lines,
        request_type=fixture.get("request_type", "erase"),
        source_system=fixture.get("source_system", "manual_unsubscribe_list"),
        requested_at="2026-03-25T00:00:00Z",
    )

    if len(rows) != int(expected.get("accepted_rows", 0)):
        fail(
            f"accepted row count mismatch: expected {expected.get('accepted_rows')}, got {len(rows)}"
        )
    if duplicate_rows != int(expected.get("duplicate_rows", 0)):
        fail(
            f"duplicate row count mismatch: expected {expected.get('duplicate_rows')}, got {duplicate_rows}"
        )
    if invalid_rows != int(expected.get("invalid_rows", 0)):
        fail(
            f"invalid row count mismatch: expected {expected.get('invalid_rows')}, got {invalid_rows}"
        )

    got_emails = [row.get("email") for row in rows]
    if got_emails != expected.get("emails", []):
        fail(f"normalized emails mismatch: expected {expected.get('emails')}, got {got_emails}")

    for row in rows:
        if row.get("request_type") != "erase":
            fail("request_type should propagate to normalized rows")
        if row.get("source_system") != "manual_unsubscribe_list":
            fail("source_system should propagate to normalized rows")

    ok("unsubscribe privacy normalizer validated")


if __name__ == "__main__":
    run_guard(main)
