# SEO Lane Test Kit (v1)

This folder provides lightweight validation for the ontology-aligned SEO lane.

## What is covered

1. Contract envelope presence checks
2. Scoring parity checks against a deterministic fixture
3. Intent-gate wiring expectations (task creation only from approved intents)

## Files

- `fixtures/scoring_parity.fixture.json`
  - deterministic input/output for weighted scoring parity
- `fixtures/contracts.sample.json`
  - sample contract envelopes using lane-required fields
- `validate_scoring_parity.py`
  - computes weighted scores and validates ranked issue order
- `validate_contract_envelopes.py`
  - validates required envelope keys and canonical naming shape

## Run

From this folder:

```powershell
python validate_scoring_parity.py
python validate_contract_envelopes.py
```

These checks are intentionally dependency-light for CI portability.
