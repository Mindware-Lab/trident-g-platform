from __future__ import annotations

import json

from _common import CRM_AGENT_DIR, fail, ok, run_guard


REQUIRED_WORKFLOW_TOKENS = [
    "/strategy/recommendations",
    "/intents/strategy",
    "/kernel/crm/intents/gate",
    "/kernel/crm/intents/approval",
    "CrmStrategyRecommendationsGenerated.v1",
    "CrmStrategyIntentProposed.v1",
    "CrmStrategyApprovalRequested.v1",
    "confidence",
    "expected_lift",
    "risk",
    "approval_reason",
    "draft_strategy_pricing_experiment",
    "launch_unreviewed_promotion",
]


def main() -> None:
    workflow_path = CRM_AGENT_DIR / "workflows" / "crm_strategy_intel_v1.n8n.json"
    if not workflow_path.exists():
        fail("missing workflow: crm_strategy_intel_v1.n8n.json")

    workflow = json.loads(workflow_path.read_text(encoding="utf-8"))
    raw = json.dumps(workflow)

    if workflow.get("active") not in (False, None):
        fail("strategy workflow must default to inactive")

    for token in REQUIRED_WORKFLOW_TOKENS:
        if token not in raw:
            fail(f"strategy workflow missing token: {token}")

    reco_schema_path = (
        CRM_AGENT_DIR
        / "schemas"
        / "contracts"
        / "CrmStrategyRecommendationsGenerated.v1.schema.json"
    )
    intent_schema_path = (
        CRM_AGENT_DIR
        / "schemas"
        / "contracts"
        / "CrmStrategyIntentProposed.v1.schema.json"
    )
    approval_schema_path = (
        CRM_AGENT_DIR
        / "schemas"
        / "contracts"
        / "CrmStrategyApprovalRequested.v1.schema.json"
    )

    for schema_path in (reco_schema_path, intent_schema_path, approval_schema_path):
        if not schema_path.exists():
            fail(f"missing strategy schema: {schema_path.name}")

    reco_schema = json.loads(reco_schema_path.read_text(encoding="utf-8"))
    reco_payload = reco_schema["allOf"][1]["properties"]["payload"]
    reco_items = reco_payload["properties"]["recommendations"]["items"]

    for required_field in ("strategy_window_days", "recommendation_count", "recommendations"):
        if required_field not in reco_payload.get("required", []):
            fail(f"recommendation schema missing payload required field: {required_field}")

    for required_field in ("id", "theme", "confidence", "expected_lift", "risk"):
        if required_field not in reco_items.get("required", []):
            fail(f"recommendation item missing required field: {required_field}")

    intent_schema = json.loads(intent_schema_path.read_text(encoding="utf-8"))
    intent_payload = intent_schema["allOf"][1]["properties"]["payload"]
    if "approval" not in intent_payload.get("required", []):
        fail("strategy intent schema must require payload.approval")

    approval_schema = json.loads(approval_schema_path.read_text(encoding="utf-8"))
    approval_payload = approval_schema["allOf"][1]["properties"]["payload"]
    for required_field in (
        "intent_type",
        "approval_scope",
        "approval_reason",
        "approval_status",
        "recommendation_snapshot",
    ):
        if required_field not in approval_payload.get("required", []):
            fail(f"approval schema missing payload required field: {required_field}")

    ok("strategy-intel workflow scaffold validated (contracts + approval payload)")


if __name__ == "__main__":
    run_guard(main)
