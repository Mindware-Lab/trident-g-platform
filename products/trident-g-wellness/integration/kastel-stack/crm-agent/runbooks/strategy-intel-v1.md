# Strategy Intel Runbook (V1)

## Objective

Generate draft-first strategic recommendations for segment messaging, offers, pricing, promotions, and conversion pipeline improvements without bypassing kernel gate policy.

## Inputs

1. Fresh CRM projections in Supabase (`crm_profile_projection`, `crm_marketing_eligibility`, `crm_segment_projection`)
2. `high_value_spend` segment configured and validated
3. Active workspace ID and run ID

## Workflow

1. Run `crm_strategy_intel_v1.n8n.json` with:
   - `workspace_id`
   - `mission_id`
   - `run_id`
   - optional `strategy_window_days`
   - optional `high_value_spend_min`
2. Ensure kernel endpoint returns `CrmStrategyRecommendationsGenerated.v1`.
3. Ensure strategy intents are proposed as `CrmStrategyIntentProposed.v1`.
4. Confirm gate outcomes are `draft`/`approved`/`auto_approved` per policy.
5. Execute only approved intents through existing execution path.

## Guardrails

1. No direct live price mutation from strategy workflow.
2. No unreviewed promotion launch.
3. No suppression/consent override via strategy lane.

## Quick SQL checks

1. Segment counts:
   `select * from public.v_crm_segment_counts where workspace_id = '<workspace>';`
2. Overlap health:
   `select * from public.v_crm_source_overlap where workspace_id = '<workspace>';`
3. High-value parity:
   run `runbooks/sql-proof-high-value-spend-segment.sql`
