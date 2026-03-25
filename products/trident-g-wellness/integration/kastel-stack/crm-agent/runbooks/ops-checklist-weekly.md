# Weekly Ops Checklist

1. Review ingest run status and failed source rows.
2. Clear high-severity conflict queue items.
3. Review suppression deltas before any promotion trigger.
4. Check action intent approvals and execution lag.
5. Review digest metrics and anomalies.
6. Confirm +7/+14/+28 rechecks completed.

## Recommended KPI pulls

1. Source overlap and cross-list hygiene:
   `select * from public.v_crm_source_overlap where workspace_id = '<workspace>';`
2. Send performance rates:
   `select * from public.v_crm_send_rates where workspace_id = '<workspace>';`
3. Activity cohorts and retention risk:
   `select * from public.v_crm_activity_cohorts where workspace_id = '<workspace>';`
4. Pipeline and identity quality:
   `select * from public.v_crm_pipeline_quality where workspace_id = '<workspace>';`
5. Segment proof checks:
   run `runbooks/sql-proof-high-value-spend-segment.sql` for `high_value_spend` parity/mismatch tracking.
6. Closed-loop measurement deltas:
   `select * from public.v_crm_strategy_measurement_loop where workspace_id = '<workspace>';`
7. Privacy suppression/erasure intake status:
   `select * from public.v_crm_privacy_requests where workspace_id = '<workspace>';`
