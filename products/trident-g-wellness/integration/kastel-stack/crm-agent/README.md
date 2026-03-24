# CRM Agent (Kastel Stack)

This module implements the CRM + lifecycle conversion lane for Podia/Substack/e-Junkie to Brevo migration.

The architecture split is explicit:

1. Brevo is live outbound messaging truth.
2. Supabase is orchestration/provenance mirror (missions/runs/events/action_intents + CRM projections).
3. Kernel owns scoring, gating, and Action Intent policy.
4. n8n runs ingest/connectors and executes only approved actions.

## V1 first-run rule

Manual CSV bootstrap is the default first-pass ingest path in V1.
API syncs are secondary until bootstrap readiness is proven.

Required order:

`CSV export -> raw batch ingest -> identity resolution -> profile projection -> eligibility evaluation -> segment projection -> conflict review -> approved Brevo sync -> limited automation activation`

### CSV normalization helper (mislabeled-file guard)

Use the helper before ingest if exported files are mixed, mislabeled, or in
provider-native TSV format:

```powershell
python tools/normalize_crm_source_exports.py `
  --inputs "C:\path\substack-2026-03-23.txt" "C:\path\podia-2026-03-23.txt" "C:\path\e-junkie-2026-03-23.txt" `
  --out-dir ".\imports\normalized" `
  --report-path ".\imports\normalization_report.json"
```

What it does:

1. detects source from header signature (substack/podia/ejunkie)
2. flags filename/source mismatches automatically
3. normalizes records into lane templates in `config/csv-templates/`
4. writes a JSON report for operator review and audit trail

Notes:

- for Substack, it also detects UI-style headers (`Subscriber`, `Type`, `Activity`, `Start date`) and maps `Type`/`Start date` into the normalized shape
- activity stars can be retained in source payload/provenance even when open/click timestamps are absent

## Folder layout

- `workflows/`: importable n8n JSON workflows
- `schemas/`: envelope + lane schemas
- `schemas/contracts/`: versioned CRM contract schemas
- `config/`: source config, segment thresholds, Brevo map
- `config/csv-templates/`: operator CSV templates
- `config/column-mappings/`: deterministic source-to-target mapping docs
- `supabase/`: SQL migration for CRM projection tables/views
- `runbooks/`: CSV bootstrap and cutover operations
- `tests/`: lightweight fixture-driven validation scripts
- `brevo/`: Brevo integration notes

## Workflow sequence

1. `crm_collect_sources_v1.n8n.json`
   - ingest CSV/API source batches
   - default operator path is CSV bootstrap
   - emit `CrmSourceBatchReceived.v1`
2. `crm_identity_resolve_v1.n8n.json`
   - deterministic email normalization + identity resolution
   - emit `CrmIdentityResolved.v1`
3. `crm_profile_project_v1.n8n.json`
   - update vendor-neutral profile projection
   - emit `CrmProfileProjectionUpdated.v1`
4. `crm_eligibility_evaluate_v1.n8n.json`
   - suppression/consent classification
   - emit `CrmEligibilityEvaluated.v1`
5. `crm_segment_project_v1.n8n.json`
   - segment projection updates
   - emit `CrmSegmentProjectionUpdated.v1`
6. `crm_sync_brevo_v1.n8n.json`
   - gate-approved Brevo sync only
   - emit `BrevoContactSyncRequested.v1` and `BrevoContactSynced.v1`
7. `crm_onboarding_retention_v1.n8n.json`
   - onboarding + early retention intents
   - intent-gated trigger path
8. `crm_digest_gmail_v1.n8n.json`
   - weekly KPI and exception digest
9. `crm_recheck_v1.n8n.json`
   - +7/+14/+28 delayed checks

## Internal handlers, ingress points, and shared intent types

Handler/job interfaces:

- `handleCrmSourceBatch(run_id)`
- `resolveCrmIdentity(run_id)`
- `projectCrmProfile(run_id)`
- `evaluateCrmEligibility(run_id)`
- `syncBrevo(run_id)`
- `projectCrmSegments(run_id)`
- `proposeLifecycleIntents(run_id)`
- `executeApprovedIntent(intent_id)`
- `runCrmRechecks()`

Ingress references:

- `POST /api/signals/ingest`
- `POST /api/stripe/webhook`

Shared action intent types:

- `sync_contact_to_brevo`
- `sync_segment_to_brevo`
- `trigger_onboarding_sequence`
- `trigger_retention_nudge`
- `raise_deliverability_alert`
- `create_crm_review_task`
- `send_weekly_crm_digest`

## Required environment variables

- `KERNEL_BASE_URL`
- `KERNEL_API_KEY`
- `WORKSPACE_ID`
- `CRM_MISSION_NAME`
- `CRM_SOURCE_DROP_PATH`
- `BREVO_API_KEY`
- `BREVO_LIST_ID`
- `BREVO_SENDER_ID`
- `GMAIL_TO`

## Stage discipline (v1)

- stages 1-5: no external writes
- stage 6: internal writes allowed (events/docs/tasks)
- publish/mutation actions are gated and generally escalated

In v1, no direct recommendation-to-send path is allowed. Execution requires approved shared `action_intents`.

## Quick start

1. Apply `supabase/crm_lane_v1.sql`.
2. Import workflows in `workflows/`.
3. Configure connector credentials and env vars in n8n.
4. Run CSV bootstrap with `crm_collect_sources_v1`.
5. Execute identity -> projection -> eligibility -> segment workflows.
6. Gate and run Brevo sync.
7. Enable onboarding/retention path once cutover readiness checks pass.

## Core telemetry views

These are built into `supabase/crm_lane_v1.sql` for direct workspace-level KPI pulls:

1. `v_crm_send_rates`:
   delivery/open/click/CTOR/unsubscribe/bounce/complaint rates
2. `v_crm_source_overlap`:
   profile overlap across Substack/Podia/e-junkie source flags
3. `v_crm_activity_cohorts`:
   normalized activity cohorts plus 30-day activation/progress counts
4. `v_crm_pipeline_quality`:
   ingest/identity/eligibility/conflict quality rates

Example query:

```sql
select * from public.v_crm_source_overlap where workspace_id = 'acme';
```
