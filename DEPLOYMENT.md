# Static Deployment

## Cloudflare Pages

Use Cloudflare Pages connected directly to GitHub for this static repo.

Reference docs:

- <https://developers.cloudflare.com/pages/framework-guides/deploy-anything/>
- <https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/>
- <https://developers.cloudflare.com/pages/configuration/custom-domains/>

1. Open Cloudflare and go to **Workers & Pages -> Create application -> Pages -> Import existing Git repository**.
2. Select this repository.
3. Use these build settings:
   - Production branch: `main`
   - Framework preset: none / static HTML
   - Build command: blank or `exit 0`
   - Build output directory: `.`
4. Deploy the first build.
5. Add the custom domain inside the Cloudflare Pages project after the first successful deploy.

## Verification Routes

Check these routes after the preview deploy and again after the custom domain is attached:

- `/`
- `/go/capacity/`
- `/capacity-gym/`
- `/products/trident-g-iq/`
- `/products/trident-g-iq/apps/iq-suite/`
- `/products/trident-g-iq/apps/zone-coach/`
- `/products/trident-g-iq/apps/capacity-gym/`
- `/products/trident-g-iq/apps/capacity-gym/stage1/`

For an IQMindware website-only Pages project, set the build output directory to `products/trident-g-iq/websites/iqmindware` instead of `.`. That subtree also contains `/capacity-gym/`, while `/apps/capacity-gym/stage1/` remains available as the rollback route.

## Scope

This deployment is static-only. Browser `localStorage` handles local progress, Zone handoff, and Capacity Gym v2 state. Accounts, payments, server-side saved progress, AI calls, or database-backed dashboards need a later backend layer such as Cloudflare Pages Functions, Workers, Supabase, Firebase, or another API server.
