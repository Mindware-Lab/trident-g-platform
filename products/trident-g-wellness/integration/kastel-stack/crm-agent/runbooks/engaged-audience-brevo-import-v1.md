# Engaged Audience Brevo Import (V1)

## Objective

Build a controlled, compliance-safe engaged audience list (cap: 5000) from Supabase and import/sync it into Brevo.

## Prerequisites

1. CRM lane is refreshed: `collect -> identity -> profile -> eligibility -> segment`.
2. `crm_privacy_requests` is current (unsubscribe/erase intake run).
3. `crm_marketing_eligibility` has up-to-date suppression state.
4. `v_crm_named_segments_v1` exists in Supabase.

## SQL source of truth

Use:

- `runbooks/sql-export-engaged-brevo-import.sql`

What it enforces:

1. `marketing_eligibility = 'eligible'`
2. exclude active privacy requests (`unsubscribe`/`erase`)
3. prioritize: `high_value_engaged` -> `repeat_buyers` -> `engaged_non_buyers` -> `new_buyers_30d`
4. dedupe by email
5. limit to `max_rows` (default `5000`)

## n8n setup patterns

### Pattern A (fastest bootstrap, manual Brevo import)

1. Run Query 2 from `sql-export-engaged-brevo-import.sql` in Supabase SQL editor.
2. Export result as CSV.
3. Import CSV in Brevo contacts import UI with fields:
   - `EMAIL`, `FIRSTNAME`, `LASTNAME`, `EXT_ID`, `SEGMENT_KEYS`, `TOTAL_SPEND`, `PURCHASE_COUNT`, `ACTIVITY_SCORE_NORM`, `LIFECYCLE_STATE`
4. Keep query output as proof artifact for the run.

### Pattern B (n8n automated sync)

1. `Cron` (or `Manual Trigger`)
2. `Postgres` node (Supabase connection) running Query 2 logic
3. `IF` node:
   - true branch only if rows > 0
4. `Split In Batches` (recommended 200-500)
5. Brevo sync node path:
   - preferred: route through existing `crm_sync_brevo_v1` (intent/gate-preserving)
   - fallback: direct Brevo upsert node if you are in controlled bootstrap mode
6. `Postgres` node write sync results to `crm_brevo_sync_log`

## Governance note

Preferred path remains: kernel decides, n8n executes approved actions.  
For direct bootstrap imports, keep runs auditable and temporary.

## Post-run checks

1. Run Query 1 in `sql-export-engaged-brevo-import.sql` for segment distribution proof.
2. Confirm no contacts in import overlap with:
   - `suppressed_privacy_or_unsubscribed`
3. Check:
   - `v_crm_send_rates`
   - `v_crm_strategy_measurement_loop`
