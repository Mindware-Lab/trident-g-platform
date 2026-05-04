# Trident G IQ Pro

Commercial cloud app scaffold seeded from the richer `capacity-gym/v2` runtime.

## Scope

- Vite-built frontend for Cloudflare Pages.
- Cloudflare Pages Functions under `functions/api`.
- Supabase Auth, RLS-backed user data, sync snapshots, session summaries, entitlements, and private events.
- Stripe webhook endpoint for server-truth entitlements.
- Existing `capacity-gym/v2` route is untouched.

`trident-g-iq-max` remains a future guide only; this app launches from the integrated v2 runtime.

## Local Development

```powershell
cd Products\trident-g-iq\apps\iq-pro
npm install
npm run dev
```

Create `.env` from `.env.example` to enable Supabase auth. Without Supabase env vars, localhost can continue as a local demo.

## Cloudflare Pages

Recommended Pages settings:

- Project root: `Products/trident-g-iq/apps/iq-pro`
- Build command: `npm run build`
- Build output directory: `dist`
- Functions directory: `functions`

Set these Cloudflare secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_IQ_PRO`
- `STRIPE_PRICE_PERFORMANCE_BUNDLE`
- `STRIPE_PRICE_COHORT_BUNDLE`
- `STRIPE_PRICE_PREMIUM_1TO1`

Set these public build variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_IQ_PRO_REQUIRED_BUNDLE=iq_pro`
- `VITE_IQ_PRO_ALLOW_LOCAL_DEMO=false`

## Supabase

Run `supabase/migrations/20260428_iq_pro_cloud_schema.sql` in the target Supabase project before enabling production auth.

Client-side access uses Supabase Auth. Privileged writes and Stripe entitlement updates go through Cloudflare Functions with the Supabase service role key.

## Stripe

Use Stripe Checkout Sessions/Billing with Prices. Checkout or subscription metadata must include one of:

- `supabase_user_id`
- `user_id`
- `client_reference_id`

The webhook also accepts `metadata.bundle_id`; otherwise it maps known Stripe Price ids from Cloudflare secrets.
