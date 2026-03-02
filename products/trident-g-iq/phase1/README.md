# Phase 1 Implementation Scaffold

This folder contains the ship-safe paid release scaffold for:

- Supabase auth/session
- server-truth entitlements
- Stripe webhook updates
- append-only events log

## Files

- `supabase_schema.sql`: baseline schema + RLS policies
- `stripe_webhook.ts`: idempotent webhook handler template
- `entitlement_client_contract.md`: frontend/backend contract

## Notes

- This scaffold is implementation-ready but requires environment secrets and deployment wiring.
- Week-1 device activation remains in place until server-truth entitlement endpoints are live.

