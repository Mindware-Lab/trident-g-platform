from __future__ import annotations

from _common import load_json, fail, ok, run_guard


def main() -> None:
    fixture = load_json("cutover.fixture.json")
    metrics = fixture.get("metrics", {})
    required = fixture.get("required", {})

    if int(metrics.get("high_conflicts_open", 0)) > int(
        required.get("high_conflicts_open_max", 0)
    ):
        fail("high-severity conflict threshold exceeded")

    if bool(metrics.get("suppression_parity_verified")) != bool(
        required.get("suppression_parity_verified")
    ):
        fail("suppression parity readiness check failed")

    if bool(metrics.get("send_traceability_verified")) != bool(
        required.get("send_traceability_verified")
    ):
        fail("send traceability readiness check failed")

    ok("cutover-readiness fixture validated")


if __name__ == "__main__":
    run_guard(main)
