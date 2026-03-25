from __future__ import annotations

from _common import CRM_AGENT_DIR, fail, ok, run_guard


REQUIRED_VIEWS = [
    "v_crm_segment_counts",
    "v_crm_onboarding_funnel",
    "v_crm_retention_risk",
    "v_crm_send_health",
    "v_crm_cutover_readiness",
    "v_crm_send_rates",
    "v_crm_source_overlap",
    "v_crm_activity_cohorts",
    "v_crm_pipeline_quality",
    "v_crm_strategy_measurement_loop",
    "v_crm_privacy_requests",
]


def main() -> None:
    sql_path = CRM_AGENT_DIR / "supabase" / "crm_lane_v1.sql"
    sql = sql_path.read_text(encoding="utf-8").lower()

    for view in REQUIRED_VIEWS:
        token = f"create or replace view public.{view}".lower()
        if token not in sql:
            fail(f"missing reporting view declaration: {view}")

    ok("reporting view declarations validated in SQL migration")


if __name__ == "__main__":
    run_guard(main)
