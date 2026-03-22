# SEO Migration Cleanup

This workflow keeps legacy URL handling repo-driven for Cloudflare Pages.

## File Roles

- `seo/legacy-url-map.csv`
  - Single source of truth for legacy path behavior.
  - Columns: `match_type,old_path,action,target_path,strip_params,notes`.
  - `match_type`: `exact` or `prefix`.
  - `action`: `301`, `410`, or `normalize_query`.
- `seo/mismatch-batch-2026-03-22.csv`
  - Snapshot of the mismatch batch used for reproducible validation and smoke tests.
- `functions/_routes.json`
  - Restricts Pages Functions to legacy-only paths.
- `functions/_generated/legacy-routing.json`
  - Generated lookup artifact consumed by function handlers.
- `_redirects`
  - Root deploy artifact for static redirects.
  - This is the only deploy-authoritative redirect file.
- `public/_redirects`
  - Optional mirror only (convenience/reporting). Not authoritative.

## Decision Rules

- Use `301` only when there is a clear intent-equivalent canonical destination.
- Use `410` for retired legacy URLs with no strong replacement.
- Use `normalize_query` when path is valid but known junk query params create duplicates.
- Preserve unknown query params unless they are explicitly listed in `strip_params`.
- Any legacy family handled by Functions must be excluded from `_redirects`, because `_redirects` do not apply on Pages Function routes.

## Mapping Workflow

1. Add or edit rows in `seo/legacy-url-map.csv`.
2. Keep `old_path` as site path only (no domain, no query string).
3. For query cleanup, list keys in `strip_params` separated by `|`.
4. Prefer `exact` rows for valuable historic URLs.
5. Use `prefix` rows only for deterministic families (for example fully retired tag/category/product families).

## Build, Validate, Smoke Test

From `products/trident-g-iq/websites/iqmindware`:

```powershell
node scripts/build-legacy-routing.mjs
node scripts/validate-legacy-routing.mjs
node scripts/smoke-test-legacy-routing.mjs https://<preview-domain>
```

Optional mirror artifact:

```powershell
node scripts/build-legacy-routing.mjs --mirror-public
```

## Safe Deploy Checklist

1. Run build and validation locally.
2. Confirm `_redirects` has only static `301` lines and no function-family overlap.
3. Confirm `functions/_generated/legacy-routing.json` changed as expected.
4. Run smoke tests against preview deployment.
5. Confirm sitemap and internal links do not point to `410` legacy routes.
