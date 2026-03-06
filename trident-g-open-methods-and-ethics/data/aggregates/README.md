# Aggregates Folder

This folder is for published aggregate-only metric tables.

Rules:
- No row-level user data
- No free-text fields
- Suppress any cell where `cohort_n < 20`
- Apply complementary suppression to prevent back-calculation

Each release must include a manifest file conforming to:
- `../../schemas/publication-manifest.schema.json`
