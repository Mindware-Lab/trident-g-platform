from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent
FIXTURE_PATH = ROOT / "fixtures" / "contracts.sample.json"

REQUIRED_KEYS = [
    "contract_name",
    "contract_version",
    "event_name",
    "event_id",
    "idempotency_key",
    "workspace_id",
    "mission_id",
    "run_id",
    "risk_level",
    "psi_state",
    "producer_domain",
    "consumer_domain",
    "occurred_at",
    "trace_refs",
    "payload",
]

EVENT_PATTERN = re.compile(r"^ks\.[a-z0-9_.]+$")
VERSION_PATTERN = re.compile(r"^v[0-9]+$")


def main() -> int:
    items = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    errors: list[str] = []

    for idx, item in enumerate(items):
        prefix = f"item[{idx}]"
        for key in REQUIRED_KEYS:
            if key not in item:
                errors.append(f"{prefix}: missing key '{key}'")
        if "event_name" in item and not EVENT_PATTERN.match(item["event_name"]):
            errors.append(f"{prefix}: invalid event_name '{item['event_name']}'")
        if "contract_version" in item and not VERSION_PATTERN.match(item["contract_version"]):
            errors.append(f"{prefix}: invalid contract_version '{item['contract_version']}'")
        if "trace_refs" in item and not isinstance(item["trace_refs"], list):
            errors.append(f"{prefix}: trace_refs must be an array")

    if errors:
        print("CONTRACT ENVELOPE VALIDATION FAILED")
        for err in errors:
            print(f"- {err}")
        return 1

    print("CONTRACT ENVELOPE VALIDATION PASSED")
    print(f"validated_items={len(items)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
