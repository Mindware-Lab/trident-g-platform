# CSV Bootstrap Runbook (V1)

## Objective

Safely ingest legacy lists before API-first sync.

## Operator steps

1. Export CSVs from Substack, Podia, and e-Junkie.
2. Save raw files unchanged into dated folders under `CRM_SOURCE_DROP_PATH`.
3. Run `crm_collect_sources_v1` in bootstrap mode.
4. Run identity, profile, eligibility, and segment workflows.
5. Review `crm_conflict_review_queue` and suppression mismatches.
6. Approve only clean records for Brevo sync.
7. Activate limited onboarding/retention automation after readiness checks.

## Folder convention

`imports/YYYY-MM-DD/{substack,podia,ejunkie}/raw/`

## Rollback

- Stop sync workflows.
- Mark affected intents as rolled_back.
- Re-run projection from last known-good source batch id.
