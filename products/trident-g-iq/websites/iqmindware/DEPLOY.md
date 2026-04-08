# IQMindware Cloudflare Deploy

This site is deployed to the Cloudflare Pages project `iqmindware`.

## Live project

- Project name: `iqmindware`
- Custom domains:
  - `https://iqmindware.com`
  - `https://www.iqmindware.com`
- Site root in this repo:
  - `products/trident-g-iq/websites/iqmindware`

## Normal publish path

Use this when the Cloudflare git integration is healthy.

1. Make the website changes in `products/trident-g-iq/websites/iqmindware`.
2. Keep page-discovery and metadata files in sync for new public pages:
   - `learn/blog/index.html`
   - `learn/index.html`
   - `sitemap.xml` (sitemap index)
   - `sitemap-pages.xml`
   - `sitemap-blog.xml`
   - `sitemap-wiki.xml`
   - `sitemap-tools.xml`
   - `website-inventory.md`
   - `site-map.json`
   - `seo-meta.json`
3. Commit and push to `main`.
4. Check deployment status:

```powershell
npx -y wrangler pages deployment list --project-name iqmindware
```

## Direct fallback publish

Use this when the git-triggered Cloudflare build is failing or delayed.

From `products/trident-g-iq/websites/iqmindware` run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-cloudflare-pages.ps1 `
  -VerifyUrl "https://www.iqmindware.com/"
```

For a specific page:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy-cloudflare-pages.ps1 `
  -VerifyUrl "https://www.iqmindware.com/learn/blog/learning-curves-plateaus-fluency-trap/"
```

What the helper does:

- checks that the parent repo does not contain broken gitlinks/submodules
- deploys the current site directory directly to the `iqmindware` Pages project
- attaches the current git commit hash/message to the deployment
- optionally checks the production URL after deploy

## Fast verification

Deployment list:

```powershell
npx -y wrangler pages deployment list --project-name iqmindware
```

Production status check:

```powershell
$resp = Invoke-WebRequest -Uri "https://www.iqmindware.com/" -UseBasicParsing
$resp.StatusCode
```

Article status check:

```powershell
$resp = Invoke-WebRequest -Uri "https://www.iqmindware.com/learn/blog/learning-curves-plateaus-fluency-trap/" -UseBasicParsing
$resp.StatusCode
```

## Known failure mode

If Cloudflare fails during clone with a submodule error, check the parent repo for committed gitlinks without a matching `.gitmodules` entry.

This previously broke deploys:

- `.tmp/Syllogimous-v4-review`

The parent repo now ignores `.tmp/`, and temporary nested repos should stay untracked.

## Practical rule

Treat `.tmp/`, local review clones, and scratch repos as local-only. Do not commit them into the parent repository index.
