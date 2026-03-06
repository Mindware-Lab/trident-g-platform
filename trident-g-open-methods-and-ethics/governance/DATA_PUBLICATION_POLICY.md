# DATA_PUBLICATION_POLICY.md

## Scope

This policy governs public publication of aggregate metrics in this repository.

## Privacy and GDPR-safe controls

- Aggregate-only publication; never publish row-level personal data
- Minimum cell threshold: `n >= 20`
- Suppress any cell with `n < 20`
- Apply complementary suppression where back-calculation is possible
- No free-text fields in published aggregate data
- No intersecting rare subgroup slices
- Fixed category bins and fixed reporting cadence
- No differencing attacks across adjacent tables or adjacent time windows

## Allowed data shape

Published aggregates must conform to:
- `schemas/aggregated-metrics.schema.json`
- `schemas/publication-manifest.schema.json`

## Publication cadence

Default cadence is fixed per summary series (for example monthly or quarterly), declared in each manifest.

## Review gate

Each release requires:
- schema validation pass
- suppression policy checks
- manual approver sign-off
