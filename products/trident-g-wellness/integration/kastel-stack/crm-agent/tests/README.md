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
```
