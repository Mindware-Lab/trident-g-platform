# Closed-Loop Cadence Runbook (V1 Target)

## Objective

Make the CRM strategy loop explicit and repeatable so updated interactions continuously
improve segmentation, strategy, and approved execution quality.

## Source of truth

- `config/loop_cadence.sample.json`
- `supabase/crm_lane_v1.sql` telemetry views

## Daily cycle

1. Run ingest/projection chain:
   `crm_collect_sources_v1 -> crm_identity_resolve_v1 -> crm_profile_project_v1 -> crm_eligibility_evaluate_v1 -> crm_segment_project_v1`
2. Run due rechecks:
   `crm_recheck_v1`
3. Run privacy intake when new suppression/deletion requests arrive:
   `crm_privacy_suppression_v1`
4. Confirm pipeline health:
   `select * from public.v_crm_pipeline_quality where workspace_id = '<workspace>';`

## Weekly cycle

1. Pull strategy loop deltas:
   `select * from public.v_crm_strategy_measurement_loop where workspace_id = '<workspace>';`
2. Pull privacy intake status:
   `select * from public.v_crm_privacy_requests where workspace_id = '<workspace>';`
3. Run strategy workflow:
   `crm_strategy_intel_v1`
4. Confirm approval path:
   offer/promo/pricing intents must emit `CrmStrategyApprovalRequested.v1`
5. Execute only approved intents.

## Required loop metrics

The loop should be reviewed at least weekly using:

- conversion rate lift (`conversion_rate_lift`)
- revenue per contact lift (`revenue_per_contact_lift`)
- unsubscribe rate delta (`unsubscribe_rate_delta`)
- complaint rate delta (`complaint_rate_delta`)

## Guardrail

Kernel recommends + gates. n8n executes approved actions only.
