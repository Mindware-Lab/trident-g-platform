from __future__ import annotations

from _common import load_json, fail, ok, run_guard


REQUIRED_SEQUENCE = [
    "source_ingest",
    "identity_resolve",
    "profile_project",
    "eligibility_evaluate",
    "segment_project",
    "approved_brevo_sync",
    "onboarding_trigger",
    "dispatch_observed",
    "recheck_completed",
]


def main() -> None:
    fixture = load_json("e2e.fixture.json")
    sequence = fixture.get("expected_sequence", [])
    if sequence != REQUIRED_SEQUENCE:
        fail(
            "end-to-end flow sequence mismatch: "
            f"expected {REQUIRED_SEQUENCE}, got {sequence}"
        )

    ok("end-to-end mission flow fixture validated")


if __name__ == "__main__":
    run_guard(main)
