# Cutover Big-Bang Runbook

## T-10 to T-7

- Historical bootstrap import.
- Identity resolution and conflict queue triage.
- Suppression list projection.
- Brevo attribute schema parity.
- No-send dry run.

## T-6 to T-3

- Segment shadow projection.
- Brevo sync shadow validation.
- KPI baseline capture.

## T-2 to T-1

- Freeze Podia automations.
- Final delta import.
- Verify dedupe and suppression parity gates.

## T0

- Brevo becomes outbound lifecycle executor.
- Podia shifts to read-only source.
- Activate only `new_buyers`, `course_started_no_progress`, and weekly digest.

## T+1 to T+8

- Daily send-health checks.
- Recheck anomaly review.
- Unlock `lapsed_paid` only after stability gates.
