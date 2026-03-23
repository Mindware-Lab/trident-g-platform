from __future__ import annotations

from _common import load_json, fail, ok, run_guard


def main() -> None:
    fixture = load_json("idempotency.fixture.json")
    records = fixture.get("records", [])
    expected_unique = int(fixture.get("expected_unique", 0))

    keys = {
        (
            rec.get("workspace_id"),
            rec.get("run_id"),
            rec.get("idempotency_key"),
        )
        for rec in records
    }

    if len(keys) != expected_unique:
        fail(
            "idempotency uniqueness mismatch: "
            f"expected {expected_unique}, got {len(keys)}"
        )

    if len(records) <= len(keys):
        fail("fixture does not include a replay duplicate to prove idempotency handling")

    ok("idempotency replay fixture validated")


if __name__ == "__main__":
    run_guard(main)
