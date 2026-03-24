from __future__ import annotations

import json

from _common import CRM_AGENT_DIR, fail, ok, run_guard


REQUIRED_WORKFLOW_TOKENS = [
    "/strategy/recommendations",
    "/intents/strategy",
    "/kernel/crm/intents/gate",
    "CrmStrategyRecommendationsGenerated.v1",
    "CrmStrategyIntentProposed.v1",
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

    schemas = [
        CRM_AGENT_DIR
        / "schemas"
        / "contracts"
        / "CrmStrategyRecommendationsGenerated.v1.schema.json",
        CRM_AGENT_DIR
        / "schemas"
        / "contracts"
        / "CrmStrategyIntentProposed.v1.schema.json",
    ]
    for schema_path in schemas:
        if not schema_path.exists():
            fail(f"missing strategy schema: {schema_path.name}")

    ok("strategy-intel workflow scaffold validated")


if __name__ == "__main__":
    run_guard(main)
