# SEO Agent (Kastel Stack)

This module implements a weighted Local SEO Intelligence lane for IQMindware.

The architecture split is explicit:

1. Kernel service is the scoring/gating/intent authority.
2. n8n is the ingest + connector execution adapter.
3. Supabase stores shared operational truth (`missions`, `runs`, `events`, `action_intents`) plus SEO-specific tables.
4. GitHub Projects receives only gate-approved Action Intents.

For v1 speed, scoring heuristics may temporarily run in n8n code nodes, but the wire contracts are kernel-shaped so logic can move server-side without schema changes.

## Folder layout

- `workflows/`: importable n8n workflow JSONs
- `schemas/`: lane contracts + payload schemas
- `config/`: page inventory, scoring weights, check definitions
- `prompts/`: AI prompt templates
- `supabase/`: SQL schema for SEO lane tables/views
- `tests/`: scoring parity and contract fixture validation helpers
- `reports/`: generated weekly outputs

## Workflow sequence

1. `seo_collect_weekly_v2.n8n.json`
   - schedule run
   - collect GSC + PageSpeed + crawl signals
   - emit `SeoSignalBatchReceived.v1` envelopes
2. `seo_score_and_diagnose_v1.n8n.json`
   - trigger kernel score/diagnose step
   - persist `SeoScoresComputed.v1` and `SeoRecommendationsGenerated.v1`
3. `seo_intent_and_tasking_v1.n8n.json`
   - recommendations -> `action_intents(draft)` -> gate -> GitHub Projects task
   - explicit approved-intent filter blocks task creation unless gate status is approved
4. `seo_digest_gmail_v1.n8n.json`
   - weekly digest with ranked opportunities + approval state
5. `seo_recheck_v1.n8n.json`
   - delayed +7/+14/+28 rechecks

## Stage discipline (v1)

- Stages 1-5: no external writes.
- Stage 6: internal writes allowed (events/docs/tasks).
- Publish/mutation actions require explicit stricter approval.

Therefore v1 allows automatic:
- ingest, scoring, recommendation generation, internal task creation, internal notifications.

v1 does not allow automatic:
- live page publishing
- GBP mutation
- external content edits

## Contracts and canonical event names

Contract set:
- `SeoSignalBatchReceived.v1`
- `SeoObservationsRecorded.v1`
- `SeoScoresComputed.v1`
- `SeoRecommendationsGenerated.v1`
- `SeoActionIntentProposed.v1`
- `SeoRecheckScheduled.v1`
- `SeoOutcomeRechecked.v1`

Canonical event names used:
- `ks.seo.run.started`
- `ks.seo.observation.recorded`
- `ks.seo.score.computed`
- `ks.seo.recommendation.generated`
- `ks.intent.created`
- `ks.execute.task_created`
- `ks.observe.metrics_recorded`
- `ks.seo.recheck.completed`

## Required environment variables

- `KERNEL_BASE_URL` (example: `https://kernel.internal`)
- `KERNEL_API_KEY` (optional if proxy auth is used)
- `WORKSPACE_ID` (example: `iqmindware`)
- `SEO_SITE_ID` (example: `iqmindware-prod`)
- `SEO_MISSION_NAME` (example: `Weekly local SEO optimisation`)
- `GSC_SITE_URL` (example: `sc-domain:iqmindware.com`)
- `PAGESPEED_API_KEY`
- `SEO_AUDIT_URL` (example: `https://www.iqmindware.com/`)
- `SEO_CRAWL_ENDPOINT` (crawler adapter endpoint)
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_PROJECT_ID`
- `GMAIL_TO` (digest recipient)

## Quick start

1. Import workflows in `workflows/`.
2. Apply SQL in `supabase/seo_lane_v1.sql`.
3. Configure env vars and credentials in n8n.
4. Run `seo_collect_weekly_v2` manually once.
5. Run scoring and intent workflows.
6. Validate output using files in `tests/`.

## Guardrails

- No doorway page suggestions.
- No keyword stuffing.
- People-first copy only.
- Keep claims conservative (skills training; not diagnosis/treatment).
- No direct publish from this lane in v1.

## Maturity note

Y-operator trace wiring is deferred post-v1. `trace_refs` is included now to keep contracts forward-compatible.
