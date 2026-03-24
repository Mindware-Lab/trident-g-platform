# CSV Bootstrap Runbook (V1)

## Objective

Safely ingest legacy lists before API-first sync.

## Operator steps

1. Export CSVs from Substack, Podia, and e-Junkie.
2. Save raw files unchanged into dated folders under `CRM_SOURCE_DROP_PATH`.
3. Run source normalization + mislabeled-file detection:

```powershell
python tools/normalize_crm_source_exports.py `
  --inputs `
    "imports/YYYY-MM-DD/substack/raw/substack-*.txt" `
    "imports/YYYY-MM-DD/podia/raw/podia-*.txt" `
    "imports/YYYY-MM-DD/ejunkie/raw/e-junkie-*.txt" `
  --out-dir "imports/YYYY-MM-DD/normalized" `
  --report-path "imports/YYYY-MM-DD/normalization_report.json"
```

4. Review `normalization_report.json` and resolve any filename/source mismatches.
5. Run `crm_collect_sources_v1` in bootstrap mode using normalized records.
6. Run identity, profile, eligibility, and segment workflows.
7. Review `crm_conflict_review_queue` and suppression mismatches.
8. Approve only clean records for Brevo sync.
9. Activate limited onboarding/retention automation after readiness checks.

## Folder convention

`imports/YYYY-MM-DD/{substack,podia,ejunkie}/raw/`

## Rollback

- Stop sync workflows.
- Mark affected intents as rolled_back.
- Re-run projection from last known-good source batch id.
