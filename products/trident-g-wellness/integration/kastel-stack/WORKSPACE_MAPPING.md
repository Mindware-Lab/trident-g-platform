# Kastel Stack Workspace Mapping (Wellness)

Use the existing shared `kastel-stack` backend. Do not create a second stack at this stage.

## Workspace Model

Recommended records:

1. `workspace_id = wellness_sa`
   - lanes: `longevity_sa`, `corporate_sa`
2. `workspace_id = wellness_global` (optional later)
   - lane: `longevity_global`

## Domain Allocation (Wave 1)

1. D1 Audience and Demand
   - lead capture, lead scoring, offer routing
2. D2 Commerce and Entitlements
   - checkout verify, entitlement grant, mismatch reconcile
3. D3 Delivery and Coaching
   - onboarding, coaching credits, booking/reminders, retention trigger
4. D4 Outcomes and Evidence
   - weekly founder KPI snapshot and evidence rollup

## Required Contracts

1. `LeadQualified.v1`
2. `PurchaseVerified.v1`
3. `EntitlementsGranted.v1`
4. `AccessMismatchDetected.v1`
5. `CustomerActivated.v1`
6. `SessionCompleted.v1`
7. `RetentionRiskDetected.v1`
8. `OutcomeSnapshotRecorded.v1`
9. `SeoSignalBatchReceived.v1`
10. `SeoObservationsRecorded.v1`
11. `SeoScoresComputed.v1`
12. `SeoRecommendationsGenerated.v1`
13. `SeoActionIntentProposed.v1`
14. `SeoRecheckScheduled.v1`
15. `SeoOutcomeRechecked.v1`

## Governance Defaults

1. `Draft-for-approval` for customer-facing outputs.
2. `Escalate` for money/legal/high-claim actions.
3. `Auto-run` only for low-risk, reversible operations.

## SEO Agent Module

SEO automation for IQMindware now lives in:

- `products/trident-g-wellness/integration/kastel-stack/seo-agent/`

This module is review-gated and designed for:

1. weekly search/performance snapshot collection
2. keyword opportunity scoring by page intent
3. weighted issue scoring and diagnosis linked to `missions`/`runs`
4. AI-assisted recommendations written to PR artifacts
5. Action Intent-gated task creation into GitHub Projects

## CRM Agent Module

CRM automation for Brevo cutover and lifecycle control now lives in:

- `products/trident-g-wellness/integration/kastel-stack/crm-agent/`

### CRM Mission Types

1. `crm_cutover_readiness`
2. `crm_realtime_ingest`
3. `crm_lifecycle_weekly`
4. `crm_recheck_due`

### CRM Contracts

1. `CrmSourceBatchReceived.v1`
2. `CrmIdentityResolved.v1`
3. `CrmConflictQueued.v1`
4. `CrmProfileProjectionUpdated.v1`
5. `CrmEligibilityEvaluated.v1`
6. `CrmSegmentProjectionUpdated.v1`
7. `BrevoContactSyncRequested.v1`
8. `BrevoContactSynced.v1`
9. `BrevoSegmentSyncRequested.v1`
10. `OnboardingSequenceTriggerRequested.v1`
11. `RetentionNudgeTriggerRequested.v1`
12. `CrmDispatchObserved.v1`
13. `CrmConversionObserved.v1`
14. `CrmRecheckCompleted.v1`
15. `CrmDeliverabilityAlertRaised.v1`
16. `CrmStrategyRecommendationsGenerated.v1`
17. `CrmStrategyIntentProposed.v1`
18. `CrmStrategyApprovalRequested.v1`
19. `CrmPrivacyRequestReceived.v1`

### CRM Events (append-only `events`)

1. `ks.crm.source.received`
2. `ks.crm.identity.resolved`
3. `ks.crm.conflict.queued`
4. `ks.crm.profile_projection.updated`
5. `ks.crm.eligibility.evaluated`
6. `ks.crm.segment_projection.updated`
7. `ks.crm.brevo.sync_requested`
8. `ks.crm.brevo.synced`
9. `ks.crm.dispatch.observed`
10. `ks.crm.conversion.observed`
11. `ks.crm.recheck.completed`
12. `ks.crm.strategy.recommendations_generated`
13. `ks.intent.created`
14. `ks.intent.approval_requested`
15. `ks.crm.privacy.request.received`
16. `ks.execute.email_dispatched`
17. `ks.observe.metrics_recorded`

### CRM Workflow References

1. `crm_collect_sources_v1.n8n.json`
2. `crm_identity_resolve_v1.n8n.json`
3. `crm_profile_project_v1.n8n.json`
4. `crm_eligibility_evaluate_v1.n8n.json`
5. `crm_sync_brevo_v1.n8n.json`
6. `crm_segment_project_v1.n8n.json`
7. `crm_onboarding_retention_v1.n8n.json`
8. `crm_digest_gmail_v1.n8n.json`
9. `crm_recheck_v1.n8n.json`
10. `crm_strategy_intel_v1.n8n.json`
11. `crm_privacy_suppression_v1.n8n.json`

### CRM Closed-Loop Cadence Reference

- `crm-agent/config/loop_cadence.sample.json`
- `crm-agent/runbooks/closed-loop-cadence-v1.md`

### Shared CRM Intent Types

1. `sync_contact_to_brevo`
2. `sync_segment_to_brevo`
3. `trigger_onboarding_sequence`
4. `trigger_retention_nudge`
5. `raise_deliverability_alert`
6. `create_crm_review_task`
7. `send_weekly_crm_digest`
8. `draft_strategy_message_offer`
9. `draft_strategy_pricing_experiment`
10. `draft_strategy_promotion_plan`
11. `draft_strategy_conversion_pipeline`
