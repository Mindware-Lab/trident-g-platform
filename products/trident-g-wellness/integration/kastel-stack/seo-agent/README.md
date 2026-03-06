# SEO Agent (Kastel Stack)

This module adds a review-gated SEO audit and keyword recommendation pipeline for IQMindware.

It is designed for:
- weekly SEO performance monitoring
- per-page keyword opportunity scoring
- AI-assisted recommendations with policy guardrails
- pull-request output only (no auto publish)

## Folder layout

- `workflows/`: n8n workflow JSON stubs
- `schemas/`: machine-readable contracts
- `prompts/`: AI prompt templates
- `config/`: page inventory and scoring weights
- `reports/`: generated weekly outputs

## Quick start

1. Set up n8n (cloud or self-host).
2. Import workflow JSON files from `workflows/`.
3. Add credentials in n8n:
   - Google Search Console API
   - Google Ads API (optional for keyword expansion)
   - GitHub API token
   - OpenAI API key (or your preferred LLM provider)
4. Copy `config/page_inventory.sample.json` and `config/scoring_weights.sample.json` into your working config.
5. Run `seo_collect_weekly` manually first, then enable schedule.
6. Review generated markdown/JSON output in PR before merge.

## Guardrails

- No direct publishing.
- No doorway page suggestions.
- No keyword stuffing.
- Keep people-first content and claim boundaries.

## Required environment variables

- `GSC_SITE_URL` (example: `sc-domain:iqmindware.com`)
- `OPENAI_MODEL` (example: `gpt-5-mini`)
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BASE_BRANCH` (example: `main`)

## Suggested rollout

- Week 1: data collection + technical checks + report only
- Week 2: keyword expansion and scoring
- Week 3: AI recommendations + PR automation
