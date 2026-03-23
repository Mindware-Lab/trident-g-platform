# Brevo Integration Notes (V1)

## Integration posture

- Brevo is the live outbound messaging truth.
- Supabase remains the orchestration/provenance mirror.
- Syncs occur only from approved shared action intents.

## Required attributes

- EXT_ID
- EMAIL
- FIRSTNAME
- LASTNAME
- SOURCE_FLAGS
- PURCHASE_COUNT
- TOTAL_SPEND
- LAST_PURCHASE_AT
- LAST_ACTIVATION_AT
- LAST_PROGRESS_AT
- LIFECYCLE_STATE
- MARKETING_ELIGIBILITY
- REVIEW_REQUIRED
- SEGMENT_KEYS

## V1 safeguards

- No direct raw CSV import to Brevo for immediate sends.
- No promotional sends when eligibility is blocked.
- Keep suppression parity checks in cutover runbook before T0.
