from __future__ import annotations

import json

from _common import CRM_AGENT_DIR, fail, ok, run_guard


REQUIRED_WORKFLOW_TOKENS = [
    "/kernel/crm/privacy/requests/batch",
    "CrmPrivacyRequestReceived.v1",
    "ks.crm.privacy.request.received",
    "manual_unsubscribe_list",
    "request_type",
    "erase",
]


def main() -> None:
    workflow_path = CRM_AGENT_DIR / "workflows" / "crm_privacy_suppression_v1.n8n.json"
    if not workflow_path.exists():
        fail("missing workflow: crm_privacy_suppression_v1.n8n.json")

    workflow = json.loads(workflow_path.read_text(encoding="utf-8"))
    raw = json.dumps(workflow)

    if workflow.get("active") not in (False, None):
        fail("privacy suppression workflow must default to inactive")

    for token in REQUIRED_WORKFLOW_TOKENS:
        if token not in raw:
            fail(f"privacy workflow missing token: {token}")

    schema_path = (
        CRM_AGENT_DIR
        / "schemas"
        / "contracts"
        / "CrmPrivacyRequestReceived.v1.schema.json"
    )
    if not schema_path.exists():
        fail("missing strategy schema: CrmPrivacyRequestReceived.v1.schema.json")

    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    payload_required = schema["allOf"][1]["properties"]["payload"]["required"]
    for field in ("request_type", "source_system", "batch_size", "records"):
        if field not in payload_required:
            fail(f"privacy schema missing payload required field: {field}")

    ok("privacy suppression scaffold validated")


if __name__ == "__main__":
    run_guard(main)
