from __future__ import annotations

from _common import load_json, fail, ok, run_guard


def can_send_promotional(state: str) -> bool:
    return state == "eligible"


def main() -> None:
    fixture = load_json("eligibility.fixture.json")
    for case in fixture.get("cases", []):
        state = case["state"]
        expected = bool(case["can_send_promotional"])
        got = can_send_promotional(state)
        if got != expected:
            fail(
                "eligibility policy mismatch for state "
                f"{state}: expected {expected}, got {got}"
            )

    ok("suppression and review-required states correctly block promotional sends")


if __name__ == "__main__":
    run_guard(main)
