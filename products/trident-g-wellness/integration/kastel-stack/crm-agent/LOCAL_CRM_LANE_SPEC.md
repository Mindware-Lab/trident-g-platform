# LOCAL_CRM_LANE_SPEC.md

## Kastel CRM + Brevo Conversion Lane (V1)

### Status

Draft v1

### Purpose

Define the local implementation spec for the CRM conversion lane inside Kastel Stack.

This lane governs how Kastel ingests legacy and live customer/contact signals, resolves identities, evaluates marketing eligibility, mirrors operational CRM state into Supabase, syncs approved contact state into Brevo, and triggers onboarding plus early-retention flows through approved action intents.

This is a cross-domain orchestration lane, not a new source-of-truth domain.

---

## 1. Operating rule

One object, one owner, one execution path.

This lane must preserve the following ownership pattern:

- Brevo = live CRM/email truth for outbound communications
- Supabase = operational mirror, orchestration history, audit, scoring, eligibility projection, identity resolution, run history
- Stripe / e-Junkie payment layer = payment truth for billing/purchase facts
- n8n = workflow executor and connector runtime
- GitHub = contracts, config, workflow exports, migrations, tests, specs

This lane must not let:

- Supabase silently become the live CRM master
- Brevo silently become the workflow history store
- n8n silently become the hidden database

---

## 2. Domain placement

This lane spans three existing domains.

### D1 Audience and Demand

- contact ingest
- audience attribution
- engagement signals
- lead and subscriber segmentation
- marketing eligibility projection

### D2 Commerce and Entitlements

- purchase verification
- product ownership facts
- lifetime purchase summary
- entitlement reconciliation

### D3 Delivery and Coaching

- onboarding start
- product/course/app activation
- inactivity and adherence detection
- retention-risk signals

This lane should be treated as a CRM orchestration surface across D1 -> D2 -> D3.

---

## 3. V1 business objective

Primary objective:

Migrate Podia-era lifecycle communication into Brevo safely and prove one end-to-end onboarding plus early-retention automation path with full auditability.

V1 should optimise for:

- safe cutover
- identity hygiene
- suppression safety
- onboarding activation
- early churn reduction
- portable internal state

---

## 4. V1 scope

### In scope

- import contacts and customer records from Podia, Substack and e-Junkie
- resolve overlapping identities using deterministic rules
- project portable customer/contact state into Supabase
- sync live contact state and approved attributes to Brevo
- trigger onboarding sequence for new verified buyers
- detect early retention risk and trigger one nudge path
- maintain audit trail through missions, runs, events and action intents
- run delayed re-checks at +7, +14 and +28 days
- weekly KPI/exception digest

### Out of scope

- advanced D4 causal ranking for CRM actions
- complex multi-branch nurture trees
- heavy AI-generated lifecycle copy
- automated consent overrides
- probabilistic multi-email identity graphing
- advanced upgrade/cross-sell automations
- broad reactivation programmes

### 4.1 First operator step: CSV bootstrap

For V1, the expected first practical step is a manual CSV export and ingestion pass from legacy systems before live API syncs are relied on.

Initial operator workflow:

- Export current subscriber/customer CSVs from Substack, Podia and e-Junkie.
- Save the raw exports unchanged in a dated import folder for audit and rollback.
- Ingest those files into `crm_source_records` as the first migration batch.
- Run identity resolution and eligibility projection before any Brevo sync.
- Review conflicts, unclear consent states and suppression mismatches.
- Sync only approved, clean contact state into Brevo.
- Activate only the first approved onboarding/retention paths after readiness checks pass.

V1 bootstrap rule:

Do not import raw legacy CSVs straight into Brevo and start sending immediately.

Required order:

`CSV export -> raw batch ingest -> identity resolution -> profile projection -> eligibility evaluation -> segment projection -> conflict review -> approved Brevo sync -> limited automation activation`

---

## 5. Repo path

```text
products/trident-g-wellness/integration/kastel-stack/crm-agent/
  README.md
  LOCAL_CRM_LANE_SPEC.md
  contracts/
  schemas/
  workflows/
  config/
  tests/
  supabase/
  brevo/
  runbooks/
```

---

## 6. Lane structure

### 6.1 Shared kernel objects reused

This lane reuses only shared platform objects for control and audit:

- `missions`
- `runs`
- `events`
- `action_intents`

### 6.2 Mission types

Recommended mission types:

- `crm_cutover_readiness`
- `crm_realtime_ingest`
- `crm_lifecycle_weekly`
- `crm_recheck_due`

### 6.3 Run types

Suggested run categories:

- source import run
- identity resolution run
- projection/sync run
- lifecycle trigger run
- recheck run

---

## 7. Core flow

### 7.1 Primary proof path

```text
ImportedContact
-> IdentityResolved
-> PurchaseVerified
-> EntitlementsGranted
-> BrevoContactSynced
-> OnboardingSequenceTriggered
-> CustomerActivated | RetentionRiskDetected
-> RecheckRecorded
```

### 7.2 First live segments only

Use only these segments in V1:

- `new_buyers`
- `course_started_no_progress`
- `lapsed_paid`

Defer these to later:

- `high_intent_substack`
- `multi_purchase_customers`
- aggressive upgrade prompts
- broad reactivation branches

---

## 8. Ownership split: Brevo vs Supabase

### 8.1 Brevo owns (live CRM/email truth)

Store and treat as live source in Brevo:

- contact record used for sending
- email address and canonical sendability state
- current subscription/unsubscribe state
- bounce state
- complaint/abuse state
- lists and executable segments used by Brevo automation
- lifecycle email state used by live automations
- campaigns, templates, sends, opens, clicks
- last send timestamps
- Brevo contact attributes needed for live automation
- provider-native IDs

### 8.2 Supabase owns (portable internal mirror and orchestration truth)

Store and treat as durable internal mirror in Supabase:

- missions, runs, events, action intents
- source ingests and raw import batches
- identity resolution ledger
- attribute provenance history
- marketing eligibility projection
- purchase joins and entitlement joins
- internal engagement scores
- retention heuristics
- cutover readiness state
- dispatch observations copied from Brevo
- conversion observations
- recheck results
- anomaly logs
- operator rationale and gating outcomes

### 8.3 Vendor-neutral fields that must never be Brevo-only

These must always exist in Supabase even if mirrored into Brevo:

- `customer_key`
- `ext_id`
- `source_systems`
- `identity_conflict_state`
- `consent_basis`
- `consent_source`
- `consent_captured_at`
- `opt_out_offered_at_collection`
- `purchase_count`
- `total_spend`
- `first_purchase_at`
- `last_purchase_at`
- `entitlement_summary`
- `last_activation_at`
- `last_progress_at`
- `lifecycle_state_projection`
- `review_required`
- `provenance_json`

---

## 9. Stable IDs

Every contact/customer should have:

- internal `customer_key` (UUID)
- `primary_email_normalized`
- optional `external_keys_json` including Brevo contact id, e-Junkie id, Podia id, Stripe customer id, Substack id where available
- Brevo `ext_id` set to the internal `customer_key`

Rule:

- all systems should be joinable through `customer_key`
- email is the deterministic resolution key for V1, but not the only durable identifier

---

## 10. Canonical contract envelope

All inter-step messages must include:

- `contract_name`
- `contract_version`
- `event_id`
- `idempotency_key`
- `workspace_id`
- `mission_id`
- `run_id`
- `risk_level`
- `psi_state`
- `producer_domain`
- `consumer_domain`
- `occurred_at`
- `trace_refs`
- `payload`

Unknown versions must be rejected.
Consumers must be idempotent on `idempotency_key`.

---

## 11. Contracts to add

### 11.1 Ingest and identity

- `CrmSourceBatchReceived.v1`
- `CrmIdentityResolved.v1`
- `CrmConflictQueued.v1`

### 11.2 Projection and eligibility

- `CrmProfileProjectionUpdated.v1`
- `CrmEligibilityEvaluated.v1`
- `CrmSegmentProjectionUpdated.v1`

### 11.3 Brevo sync and lifecycle

- `BrevoContactSyncRequested.v1`
- `BrevoContactSynced.v1`
- `BrevoSegmentSyncRequested.v1`
- `OnboardingSequenceTriggerRequested.v1`
- `RetentionNudgeTriggerRequested.v1`

### 11.4 Observation and proof

- `CrmDispatchObserved.v1`
- `CrmConversionObserved.v1`
- `CrmRecheckCompleted.v1`
- `CrmDeliverabilityAlertRaised.v1`

---

## 12. Event naming

Use canonical append-only `ks.*` names.

Recommended CRM-related events:

- `ks.crm.source.received`
- `ks.crm.identity.resolved`
- `ks.crm.conflict.queued`
- `ks.crm.profile_projection.updated`
- `ks.crm.eligibility.evaluated`
- `ks.crm.segment_projection.updated`
- `ks.crm.brevo.sync_requested`
- `ks.crm.brevo.synced`
- `ks.intent.created`
- `ks.execute.email_dispatched`
- `ks.crm.dispatch.observed`
- `ks.crm.conversion.observed`
- `ks.crm.recheck.completed`
- `ks.observe.metrics_recorded`
- `ks.psi.state_estimated`
- `ks.psi.permission_set`

---

## 13. Supabase data model

### 13.1 Shared platform tables

- `missions`
- `runs`
- `events`
- `action_intents`

### 13.2 CRM mirror tables

Use projection-oriented names.

- `crm_source_records`
- `crm_identity_resolution`
- `crm_profile_projection`
- `crm_marketing_eligibility`
- `crm_engagement_scores`
- `crm_segment_projection`
- `crm_dispatch_observations`
- `crm_conversion_observations`
- `crm_rechecks`
- `crm_brevo_sync_log`
- `crm_conflict_review_queue`

### 13.3 Reporting views

- `v_crm_segment_counts`
- `v_crm_onboarding_funnel`
- `v_crm_retention_risk`
- `v_crm_send_health`
- `v_crm_cutover_readiness`

---

## 14. Identity resolution rules

### 14.1 Primary deterministic rule

Canonical V1 person key = normalised lowercase email.

### 14.2 Auto-merge only when

- same normalised email
- no conflict in suppression or consent status
- no incompatible ownership state
- no high-value ambiguity

### 14.3 Profile projection precedence

For messaging-relevant fields:

1. Brevo live state
2. verified purchase/payment state
3. product/course activity state
4. Substack engagement state

### 14.4 Review-required triggers

Set `review_required=true` when:

- same email but conflicting consent basis
- same email but conflicting suppression state
- multiple emails appear linked to one buyer without a stable verified bridge
- high-value customer with ambiguous merge
- contradictory product ownership facts

### 14.5 Provenance requirement

Every important projected attribute should be traceable by:

- source system
- source record id
- first seen timestamp
- last seen timestamp
- resolution rule
- confidence

---

## 15. Marketing eligibility model

### 15.1 Eligibility states

Use one of:

- `eligible`
- `suppressed_unsubscribed`
- `suppressed_bounced`
- `suppressed_complaint`
- `review_required`
- `transactional_only`

### 15.2 Hard suppression rules

Never send promotional lifecycle messages when:

- unsubscribed in Brevo
- bounced hard
- marked complaint/abuse
- consent basis unclear and policy requires explicit review

### 15.3 Soft-legacy handling for V1

For legacy records:

- preserve original source-level consent/provenance
- default uncertain records to `review_required` or `transactional_only`
- do not broadly assume identical marketing basis across Podia, Substack and e-Junkie

---

## 16. Brevo field mapping

### 16.1 Required Brevo attributes

Recommended minimum attributes synced to Brevo:

- `EXT_ID`
- `FIRSTNAME`
- `LASTNAME`
- `SOURCE_FLAGS`
- `PURCHASE_COUNT`
- `TOTAL_SPEND`
- `LAST_PURCHASE_AT`
- `LAST_ACTIVATION_AT`
- `LAST_PROGRESS_AT`
- `LIFECYCLE_STATE`
- `MARKETING_ELIGIBILITY`
- `REVIEW_REQUIRED`
- `SEGMENT_KEYS`

### 16.2 Do not rely on Brevo only for

- full provenance history
- identity merge ledger
- gating rationale
- mission/run trace
- full recheck history
- domain-crossing joins

---

## 17. n8n workflows

### `crm_collect_sources_v1`

Purpose:

- ingest Podia, Substack, e-Junkie and optional Brevo pullback
- manual CSV bootstrap is the default first-run path in V1; API syncs are secondary until bootstrap is proven
- normalise incoming records
- emit `CrmSourceBatchReceived.v1`

### `crm_identity_resolve_v1`

Purpose:

- normalise email keys
- dedupe
- resolve identities
- emit `CrmIdentityResolved.v1`
- create review queue items where required

### `crm_profile_project_v1`

Purpose:

- project vendor-neutral internal customer/contact state into Supabase
- emit `CrmProfileProjectionUpdated.v1`

### `crm_eligibility_evaluate_v1`

Purpose:

- determine marketing eligibility and suppression class
- emit `CrmEligibilityEvaluated.v1`

### `crm_sync_brevo_v1`

Purpose:

- sync approved contact attributes to Brevo
- emit `BrevoContactSyncRequested.v1`
- log sync result

### `crm_segment_project_v1`

Purpose:

- compute internal segment projection
- sync approved segment memberships to Brevo

### `crm_onboarding_retention_v1`

Purpose:

- detect newly eligible customers
- create lifecycle action intents for onboarding and one retention nudge path

### `crm_digest_gmail_v1`

Purpose:

- send weekly KPI and exception digest

### `crm_recheck_v1`

Purpose:

- complete delayed re-checks at +7 / +14 / +28 days
- record activation, progression, unsubs and anomalies

---

## 18. Action intent types

Use shared `action_intents` only.

Recommended V1 intent types:

- `sync_contact_to_brevo`
- `sync_segment_to_brevo`
- `trigger_onboarding_sequence`
- `trigger_retention_nudge`
- `raise_deliverability_alert`
- `create_crm_review_task`
- `send_weekly_crm_digest`

### 18.1 Intent status lifecycle

Recommended statuses:

- `draft`
- `pending_approval`
- `approved`
- `executed`
- `observed`
- `rejected`
- `rolled_back`

---

## 19. Gate policy

### 19.1 Default autonomy by class

- contact tagging / projection sync = low risk, often auto if idempotent
- onboarding sequence trigger = limited execute after readiness gate
- retention nudge = draft or approved limited execute depending on rule certainty
- suppression reversal = escalate
- consent override = escalate
- deletion involving user data = escalate

### 19.2 Risk examples

Auto:

- sync approved contact attribute to Brevo
- start approved onboarding sequence
- log event in Supabase
- send internal anomaly alert

Draft:

- personalised re-entry prompt
- ambiguous lifecycle nudge
- new segment proposal with uncertainty

Escalate:

- consent override
- suppression removal
- retroactive lifecycle backfill that changes legal basis
- user-data deletion

---

## 20. Internal handlers, ingress points, and shared intent types

### 20.1 Public ingress

- `POST /api/signals/ingest`
- `POST /api/stripe/webhook`

### 20.2 Internal handlers/jobs

Prefer internal job functions over a broad public CRM API:

- `handleCrmSourceBatch(run_id)`
- `resolveCrmIdentity(run_id)`
- `projectCrmProfile(run_id)`
- `evaluateCrmEligibility(run_id)`
- `syncBrevo(run_id)`
- `projectCrmSegments(run_id)`
- `proposeLifecycleIntents(run_id)`
- `executeApprovedIntent(intent_id)`
- `runCrmRechecks()`

---

## 21. Cutover plan

### T-10 to T-7

- historical import
- identity resolution pass
- suppression build
- Brevo attribute schema setup
- template parity check
- no-send dry run

### T-6 to T-3

- internal segment projection
- Brevo shadow sync
- no-send intent generation
- KPI baseline creation
- conflict review queue clean-up

### T-2 to T-1

- freeze Podia automations
- final delta import
- verify dedupe conflicts below threshold
- verify suppression parity
- verify onboarding trigger logic

### T0

- Brevo becomes outbound lifecycle executor
- Podia becomes read-only source
- activate only:
  - `new_buyers` onboarding
  - `course_started_no_progress` recovery
  - weekly digest

### T+1 to T+7

- daily send-health check
- recheck anomaly review
- baseline comparison

### T+8 onward

Only after clean stability:

- enable `lapsed_paid`
- then consider later lifecycle expansion

---

## 22. Proof and recheck discipline

Every send-triggering flow should support:

- dry-run preview before activation
- rollback path where feasible
- delayed re-check at +7 / +14 / +28 days

Rechecks should record:

- delivered
- opened
- clicked
- unsubscribed
- bounced
- complaint
- activated
- progressed
- retained
- anomaly_flag

---

## 23. KPIs

### Day-28 directional KPIs

- onboarding activation rate
- first-week start/progress rate
- early inactivity rate
- unsubscribe rate
- bounce rate
- complaint rate
- identity conflict rate
- suppression sync completeness
- run audit completeness

### Hard readiness gates

Before broader lifecycle expansion:

- zero unresolved high-severity dedupe conflicts
- suppression parity verified
- no unexplained deliverability spike
- every external send traceable to an approved action intent
- all important projected fields attributable to source + rule + timestamp

---

## 24. Test plan

1. Contract validation tests reject payloads missing canonical envelope fields.
2. Unknown contract version is rejected.
3. Idempotency tests prove no duplicate projections, intents or sends on replay.
4. Identity tests prove deterministic merge and proper review queue behaviour.
5. Eligibility tests prove no promotional send when suppression state blocks it.
6. Intent-gate tests prove no Brevo dispatch without approved action intent.
7. End-to-end test passes from source ingest to observed onboarding outcome.
8. Cutover readiness test passes before T0.
9. Recheck tests prove delayed verification entries are created and completed.

---

## 25. Defaults

- CRM truth = Brevo
- operational truth = Supabase
- billing truth = Stripe / payment system
- executor = n8n
- cutover style = big-bang platform switch, phased automation activation
- first business path = onboarding + early retention
- ingest mode = API + CSV hybrid
- autonomy = conservative
- D4 advanced intelligence = deferred beyond simple heuristics
- Y-operator trace = optional in V1, forward-compatible only

---

## 26. One-line lane rule

Brevo owns live customer messaging state. Supabase owns orchestration, provenance, evidence and audit. n8n executes only after kernel gating.
