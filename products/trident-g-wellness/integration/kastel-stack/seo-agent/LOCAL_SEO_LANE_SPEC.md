# Kastel Local SEO Lane Spec (v1)

## Lane objective

Run a weekly, weighted local SEO intelligence cycle where:

1. n8n ingests signals.
2. Kernel scores + diagnoses + gates.
3. Shared `action_intents` drive execution.
4. Approved internal tasks are created in GitHub Projects.
5. Outcomes are rechecked after 7/14/28 days.

## Shared objects (no parallel mission/intent model)

- `missions` (`mission_type='seo_local_weekly'`)
- `runs`
- `events` (append-only, canonical `ks.*`)
- `action_intents`

SEO-specific tables extend shared objects through `mission_id` and `run_id`.

## Canonical event/contract envelope

Required envelope keys:

- `contract_name`
- `contract_version`
- `event_name`
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

## Stage discipline (v1)

- Stages 1-5: external writes disabled.
- Stage 6: internal writes allowed (`events`, docs, GitHub tasking).
- Live publish/mutation remains gated and manual.

Automatic in v1:
- ingest, scoring, recommendations, internal tasks, digest notifications.

Not automatic in v1:
- page publishing, GBP mutation, external content edits.

## Tasking rule

No direct recommendation-to-task path.

Required path:

`recommendation -> action_intent(draft) -> gate decision -> connector execution`

This guarantees kernel-controlled gating and audit trace.

## Deferred scope

- D4 remains lightweight in v1: heuristic diagnosis + confidence + evidence refs. Advanced causal ranking is deferred.
- Y-operator trace wiring is deferred post-v1.
- Keep `trace_refs` contract-compatible now so Y-operator can be added without breaking existing integrations.
