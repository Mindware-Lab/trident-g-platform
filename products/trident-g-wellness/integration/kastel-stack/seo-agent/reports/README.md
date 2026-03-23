# Weekly reports

This folder stores generated weekly outputs.

Recommended files per run:
- `seo_snapshot_YYYY-MM-DD.json`
- `keyword_opportunities_YYYY-MM-DD.json`
- `page_briefs_YYYY-MM-DD.json`
- `seo_summary_YYYY-MM-DD.md`
- `seo_issues_ranked_YYYY-MM-DD.json`
- `seo_intents_YYYY-MM-DD.json`
- `seo_rechecks_YYYY-MM-DD.json`

Do not store secrets or raw user-level data in this folder.

Each report artifact should include references to:

- `workspace_id`
- `mission_id`
- `run_id`
- `event_id` (where applicable)

This preserves replayability and alignment with shared append-only event tracing.
