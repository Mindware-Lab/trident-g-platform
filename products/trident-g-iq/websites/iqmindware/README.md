# IQMindware Website (v3)

This folder implements the "Far-Transfer + Transparency by Design" plan.

## Core guarantees implemented

- Programme surface explains the far-transfer structure without duplicating deep proof material.
- Plans surface owns commercial routes, one-time pricing, refunds, and optional coaching paths.
- Proof surface with anchored sections:
  - `/proof#claims`
  - `/proof#protocols`
  - `/proof#data`
- Dedicated validation route: `/proof/g-tracker`.
- Data publication policy under `/proof#data`.

## CSS structure

- `assets/css/brand.css`: site brand layer (imports `branding/IQ-Mindware-brand.css` + fallback tokens)
- `assets/css/templates.css`: shared layout/components
- `assets/css/pages/tools.css`: home/start/tools templates
- `assets/css/pages/proof.css`: proof and protocol publication templates
- `assets/css/pages/pricing.css`: pricing matrix and currency switcher
- `assets/css/pages/learn.css`: learn and cases templates
- `assets/css/pages/faq.css`: FAQ page template
- `assets/css/pages/utility-pages.css`: support/legal/about/contact/login baseline

Pages now load CSS in this order:

1. `brand.css`
2. `templates.css`
3. one page-specific file from `assets/css/pages/*`

## Shared rich footer

- All public pages use a shared `site-footer site-footer-rich` block.
- Footer layout and tokens come from `branding/IQ-Mindware-brand.css`.
- `assets/css/templates.css` contains the `site-footer-rich` override that preserves complex footer layout.
- Social links are currently placeholders to platform roots and can be swapped later:
  - YouTube, Instagram, X, LinkedIn, Discord, GitHub, TikTok, Bluesky.

## Contracts

- `site-map.json`
- `nav-config.json`
- `claims-ladder.json`
- `proof-registry.json`
- `protocols.json`
- `pricing-matrix.json`
- `legacy-inventory.csv`
- `redirects.csv`
- `seo-meta.json`
- `proof-cadence.json`

## Validation

Run:

```powershell
python scripts/validate_contracts.py
python scripts/audit_redirects.py
node scripts/build-legacy-routing.mjs
node scripts/validate-legacy-routing.mjs
# Optional preview smoke test:
node scripts/smoke-test-legacy-routing.mjs https://<preview-domain>
```

The script checks mandatory copy, transparency links, pricing commercial-route copy, and forbidden claims terms.

## Deployment

- Cloudflare Pages project: `iqmindware`
- Normal path: commit and push to `main`
- Direct fallback: `powershell -ExecutionPolicy Bypass -File .\scripts\deploy-cloudflare-pages.ps1`
- Full runbook: see `DEPLOY.md`
