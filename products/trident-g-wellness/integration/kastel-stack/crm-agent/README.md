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
  --inputs "C:\path\substack-2026-03-23.txt" "C:\path\podia-2026-03-23.txt" "C:\path\e-junkie-2026-03-23.txt" "C:\path\unified_customers.csv" `
  --out-dir ".\imports\normalized" `
  --report-path ".\imports\normalization_report.json"
```

What it does:

1. detects source from header signature (substack/podia/ejunkie/stripe)
2. flags filename/source mismatches automatically
3. normalizes records into lane templates in `config/csv-templates/`
4. writes a JSON report for operator review and audit trail

Notes:

- for Substack, it also detects UI-style headers (`Subscriber`, `Type`, `Activity`, `Start date`) and maps `Type`/`Start date` into the normalized shape
- activity stars can be retained in source payload/provenance even when open/click timestamps are absent
- Stripe customer rollups (for example `unified_customers.csv`) are normalized into `stripe_customer_id`, `total_spend`, `payment_count`, `refunded_volume`, `dispute_losses`, and computed `net_spend`
- one-email-per-line unsubscribe/privacy lists can be normalized with `tools/normalize_unsubscribe_list.py` into hard `unsubscribe` or `erase` intake payloads

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
   - supports `source_system` override (for example `stripe_customer_rollup`)
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
10. `crm_strategy_intel_v1.n8n.json`
   - draft-first strategy recommendations for products/pricing/promotions/messaging/pipeline
   - recommendation payload now requires `confidence`, `expected_lift`, and `risk`
   - offer/promo/pricing intents emit `CrmStrategyApprovalRequested.v1` with approval metadata
   - strategy intents must pass kernel gate before execution
11. `crm_privacy_suppression_v1.n8n.json`
   - intake hard privacy requests (`unsubscribe` or `erase`)
   - emit `CrmPrivacyRequestReceived.v1`
   - route into high-risk suppression/deletion handling

## V1 named segments (rulebook)

1. `high_value_spend`
2. `high_value_engaged`
3. `high_value_at_risk`
4. `new_buyers_30d`
5. `repeat_buyers`
6. `engaged_non_buyers`
7. `course_started_no_progress`
8. `lapsed_paid`
9. `suppressed_privacy_or_unsubscribed`
10. `new_buyers` (compatibility alias)

Rulebook and computed memberships are queryable in Supabase via:

1. `v_crm_segment_rulebook`
2. `v_crm_named_segments_v1`

## Kernel segment policy reference

Reference evaluator:

```powershell
python tools/segment_policy_evaluator.py `
  --profile-json "{\"purchase_count\":2,\"total_spend\":420,\"lifecycle_state_projection\":\"retained_30d\"}"
```

The segment workflow payload now passes policy metadata to kernel:

1. `segment_policy_version = crm-segment-policy-v1`
2. `segment_thresholds.high_value_spend_min` (default `300`)
3. `segment_thresholds.high_engagement_score_min` (default `0.8`)
4. `segment_thresholds.repeat_buyer_purchase_count_min` (default `2`)
5. `segment_thresholds.new_buyer_window_days` (default `30`)

Proof query pack:

- `runbooks/sql-proof-high-value-spend-segment.sql`

## Internal handlers, ingress points, and shared intent types

Handler/job interfaces:

- `handleCrmSourceBatch(run_id)`
- `resolveCrmIdentity(run_id)`
- `projectCrmProfile(run_id)`
- `evaluateCrmEligibility(run_id)`
- `syncBrevo(run_id)`
- `projectCrmSegments(run_id)`
- `handleCrmPrivacyRequests(run_id)`
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
- `draft_strategy_message_offer`
- `draft_strategy_pricing_experiment`
- `draft_strategy_promotion_plan`
- `draft_strategy_conversion_pipeline`

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
5. If privacy lists exist, run `crm_privacy_suppression_v1` (`request_type = erase` or `unsubscribe`) before lifecycle sends.
6. Execute identity -> projection -> eligibility -> segment workflows.
7. Gate and run Brevo sync.
8. Enable onboarding/retention path once cutover readiness checks pass.
9. Run `crm_strategy_intel_v1` for draft-first strategic recommendations and gated strategy intents.

## Closed-loop cadence (looking ahead)

Use `config/loop_cadence.sample.json` as the explicit target steady-state loop:

1. Daily ingest refresh:
   `collect -> identity -> profile -> eligibility -> segment`
2. Daily recheck refresh:
   run due +7/+14/+28 checks via `crm_recheck_v1`
3. Daily/near-real-time privacy intake:
   run `crm_privacy_suppression_v1` for unsubscribe/deletion request batches
4. Weekly measurement refresh:
   pull KPI views and compare current 28-day vs prior 28-day performance
5. Weekly strategy refresh:
   run `crm_strategy_intel_v1`, gate intents, request approval where required
6. Execution:
   run only approved intents; never bypass kernel gate policy

This keeps the loop explicit: updated interactions change observations, observations
change metrics, metrics change recommendations, recommendations create gated intents.

## Core telemetry views

These are built into `supabase/crm_lane_v1.sql` for direct workspace-level KPI pulls:

1. `v_crm_send_rates`:
   delivery/open/click/CTOR/unsubscribe/bounce/complaint rates
2. `v_crm_segment_rulebook`:
   canonical rule expressions and default thresholds for named segments
3. `v_crm_named_segments_v1`:
   computed customer-level segment memberships for strategy and campaign targeting
4. `v_crm_source_overlap`:
   profile overlap across Substack/Podia/e-junkie source flags
5. `v_crm_activity_cohorts`:
   normalized activity cohorts plus 30-day activation/progress counts
6. `v_crm_pipeline_quality`:
   ingest/identity/eligibility/conflict quality rates
7. `v_crm_strategy_measurement_loop`:
   current-vs-prior window deltas for conversion lift, revenue/contact, unsubscribe delta, complaint delta
8. `v_crm_privacy_requests`:
   workspace-level privacy request volume/status for `unsubscribe` and `erase`

Example query:

```sql
select * from public.v_crm_source_overlap where workspace_id = 'acme';
```
