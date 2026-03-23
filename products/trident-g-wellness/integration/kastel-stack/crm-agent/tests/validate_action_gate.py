from __future__ import annotations

from _common import load_json, fail, ok, run_guard


APPROVED_STATUSES = {"approved", "auto_approved"}


def should_dispatch(status: str) -> bool:
    return status in APPROVED_STATUSES


def main() -> None:
    fixture = load_json("gate.fixture.json")
    for case in fixture.get("intents", []):
        status = case["status"]
        expected = bool(case["should_dispatch"])
        got = should_dispatch(status)
        if got != expected:
            fail(
                "action gate mismatch for status "
                f"{status}: expected dispatch={expected}, got {got}"
            )

    ok("action-intent gate policy validated (no dispatch without approval)")


if __name__ == "__main__":
    run_guard(main)
