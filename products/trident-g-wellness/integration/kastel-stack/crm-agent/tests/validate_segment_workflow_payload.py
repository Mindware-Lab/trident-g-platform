from __future__ import annotations

import json

from _common import CRM_AGENT_DIR, fail, ok, run_guard


REQUIRED_TOKENS = [
    '"segment_policy_version": "crm-segment-policy-v1"',
    '"segment_thresholds": {',
    '"high_value_spend_min": Number($json.high_value_spend_min || 300)',
]


def main() -> None:
    workflow_path = CRM_AGENT_DIR / "workflows" / "crm_segment_project_v1.n8n.json"
    payload = json.loads(workflow_path.read_text(encoding="utf-8"))
    nodes = payload.get("nodes", [])

    project_node = None
    for node in nodes:
        if node.get("name") == "Project Segments":
            project_node = node
            break

    if project_node is None:
        fail("missing Project Segments node in workflow")

    body = str(project_node.get("parameters", {}).get("jsonBody", ""))
    if "/project-segments" not in str(project_node.get("parameters", {}).get("url", "")):
        fail("Project Segments node is not targeting /project-segments endpoint")

    for token in REQUIRED_TOKENS:
        if token not in body:
            fail(f"workflow payload missing token: {token}")

    ok("segment projection workflow payload includes policy version and spend threshold")


if __name__ == "__main__":
    run_guard(main)
