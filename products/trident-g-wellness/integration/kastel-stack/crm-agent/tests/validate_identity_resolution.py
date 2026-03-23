from __future__ import annotations

from _common import load_json, fail, ok, run_guard


def normalize_email(value: str) -> str:
    return value.strip().lower()


def main() -> None:
    fixture = load_json("identity.fixture.json")
    for case in fixture.get("inputs", []):
        got = normalize_email(case["email_raw"])
        expected = case["expected"]
        if got != expected:
            fail(f"normalized email mismatch: expected {expected}, got {got}")

    conflict_case = fixture.get("conflict_case", {})
    same_email_conflicting_consent = bool(
        conflict_case.get("same_email_conflicting_consent", False)
    )
    expected_review_required = bool(conflict_case.get("expected_review_required", False))
    review_required = same_email_conflicting_consent
    if review_required != expected_review_required:
        fail(
            "conflict review flag mismatch: "
            f"expected {expected_review_required}, got {review_required}"
        )

    ok("identity normalization and conflict routing rules validated")


if __name__ == "__main__":
    run_guard(main)
