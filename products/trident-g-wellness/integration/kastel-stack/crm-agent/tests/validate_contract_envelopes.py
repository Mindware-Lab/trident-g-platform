from __future__ import annotations

from _common import load_json, fail, ok, run_guard


REQUIRED_FIELDS = {
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
}

KNOWN_CONTRACTS = {
    "CrmSourceBatchReceived.v1",
    "CrmIdentityResolved.v1",
    "CrmConflictQueued.v1",
    "CrmProfileProjectionUpdated.v1",
    "CrmEligibilityEvaluated.v1",
    "CrmSegmentProjectionUpdated.v1",
    "BrevoContactSyncRequested.v1",
    "BrevoContactSynced.v1",
    "BrevoSegmentSyncRequested.v1",
    "OnboardingSequenceTriggerRequested.v1",
    "RetentionNudgeTriggerRequested.v1",
    "CrmDispatchObserved.v1",
    "CrmConversionObserved.v1",
    "CrmRecheckCompleted.v1",
    "CrmDeliverabilityAlertRaised.v1",
    "CrmStrategyRecommendationsGenerated.v1",
    "CrmStrategyIntentProposed.v1",
    "CrmStrategyApprovalRequested.v1",
}


def _validate_record(record: dict) -> tuple[bool, str]:
    missing = REQUIRED_FIELDS - set(record.keys())
    if missing:
        return False, f"missing required fields: {sorted(missing)}"
    if record.get("contract_version") != "v1":
        return False, f"unknown contract version: {record.get('contract_version')}"
    if record.get("contract_name") not in KNOWN_CONTRACTS:
        return False, f"unknown contract name: {record.get('contract_name')}"
    if not str(record.get("event_name", "")).startswith("ks."):
        return False, f"invalid event_name: {record.get('event_name')}"
    if not isinstance(record.get("trace_refs"), list):
        return False, "trace_refs must be an array"
    if not isinstance(record.get("payload"), dict):
        return False, "payload must be an object"
    return True, "ok"


def main() -> None:
    valid_records = load_json("contracts.sample.json")
    invalid_records = load_json("contracts_invalid_version.sample.json")

    for idx, record in enumerate(valid_records, start=1):
        is_valid, reason = _validate_record(record)
        if not is_valid:
            fail(f"valid sample #{idx} rejected: {reason}")

    for idx, record in enumerate(invalid_records, start=1):
        is_valid, reason = _validate_record(record)
        if is_valid:
            fail(f"invalid sample #{idx} unexpectedly accepted")
        if "version" not in reason.lower() and "unknown contract name" not in reason.lower():
            fail(f"invalid sample #{idx} failed for unexpected reason: {reason}")

    ok("contract envelope validation passed (including unknown-version rejection)")


if __name__ == "__main__":
    run_guard(main)
