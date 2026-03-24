from __future__ import annotations

import json

from _common import CRM_AGENT_DIR, fail, ok, run_guard


def main() -> None:
    cadence_path = CRM_AGENT_DIR / "config" / "loop_cadence.sample.json"
    if not cadence_path.exists():
        fail("missing loop cadence config: loop_cadence.sample.json")

    data = json.loads(cadence_path.read_text(encoding="utf-8"))

    if data.get("version") != "crm-loop-cadence-v1":
        fail("loop cadence version must be crm-loop-cadence-v1")

    daily = data.get("daily_cycle") or []
    weekly = data.get("weekly_cycle") or []
    if len(daily) < 2:
        fail("daily_cycle must include ingest_refresh and recheck_refresh")
    if len(weekly) < 2:
        fail("weekly_cycle must include measurement_refresh and strategy_refresh")

    daily_stages = {row.get("stage") for row in daily if isinstance(row, dict)}
    weekly_stages = {row.get("stage") for row in weekly if isinstance(row, dict)}

    for stage in ("ingest_refresh", "recheck_refresh"):
        if stage not in daily_stages:
            fail(f"daily_cycle missing stage: {stage}")

    for stage in ("measurement_refresh", "strategy_refresh"):
        if stage not in weekly_stages:
            fail(f"weekly_cycle missing stage: {stage}")

    guardrails = data.get("guardrails") or {}
    if guardrails.get("allow_auto") != []:
        fail("guardrails.allow_auto must remain an empty list")

    force_escalate = set(guardrails.get("force_escalate") or [])
    for intent in ("apply_live_price_change", "launch_unreviewed_promotion"):
        if intent not in force_escalate:
            fail(f"guardrails.force_escalate missing intent: {intent}")

    ok("loop cadence config validated")


if __name__ == "__main__":
    run_guard(main)
