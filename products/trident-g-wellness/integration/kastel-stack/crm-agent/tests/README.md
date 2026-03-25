# CRM Lane Test Kit (v1)

This folder provides dependency-light checks for the CRM lane scaffold.

## Coverage

1. Contract envelope validation with unknown-version rejection
2. Idempotency replay checks
3. Deterministic identity normalization checks
4. Eligibility suppression gate checks
5. Action gate checks (no send unless approved)
6. End-to-end sequence fixture validation
7. Cutover readiness fixture validation
8. Reporting view existence checks in SQL migration
9. Source export normalization and mislabeled-file detection
10. Telemetry view declarations for overlap, activity, send rates, pipeline quality, and strategy measurement loop deltas
11. Segment definition validation (including high_value_spend)
12. Segment policy evaluator parity checks (including spend threshold override)
13. Segment workflow payload checks for policy metadata
14. Strategy-intel scaffold checks (workflow + strategy contracts + approval payload)
15. Privacy suppression scaffold checks (workflow + privacy contract)
16. Unsubscribe privacy normalizer checks

## Run

```powershell
python validate_contract_envelopes.py
python validate_idempotency.py
python validate_identity_resolution.py
python validate_eligibility_suppression.py
python validate_action_gate.py
python validate_end_to_end_fixture.py
python validate_cutover_readiness.py
python validate_reporting_views.py
python validate_source_normalizer.py
python validate_segment_definitions.py
python validate_segment_policy_evaluator.py
python validate_segment_workflow_payload.py
python validate_strategy_intel_scaffold.py
python validate_loop_cadence.py
python validate_privacy_workflow_scaffold.py
python validate_privacy_normalizer.py
```
