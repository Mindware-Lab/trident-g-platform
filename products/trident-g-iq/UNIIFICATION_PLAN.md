# UNIIFICATION_PLAN.md

**Target file path:** `products/trident-g-iq/UNIIFICATION_PLAN.md`

## Summary
Three-phase app-suite plan for Trident G-IQ:

1. **Phase 0:** Cohesion + navigation (free/demo-ready).
2. **Phase 0.5:** Week-1 paid activation (client-side soft gate).
3. **Phase 1:** Ship-safe paid release (auth + server entitlements + sync).

This plan keeps legacy routes working, uses Capacity Gym as the design benchmark, and adds paid access progressively.

## Phase 0 — Cohesion + Navigation (Free / Demo-ready)
**Purpose:** unify look/feel and routing.

**Deliverables:**
- Shared UI extraction from Capacity Gym:
- `shared-ui/tokens.css`
- `shared-ui/shell.css`
- `shared-ui/components.css`
- `shared-ui/icons.svg`
- Zone Coach reskin.
- G Tracker hub reskin.
- Suite Launcher v1.
- Alias routes with no route breakage.

**Import order (required):**
1. `shared-ui/tokens.css`
2. `shared-ui/shell.css`
3. `shared-ui/components.css`
4. `app/styles.css` (app-specific bridge)

**Routing and naming:**
- `apps/iq-suite/index.html` is the canonical suite launcher entrypoint.
- Existing technical routes remain valid.
- `apps/g-tracker/index.html` is the marketed alias entrypoint for G Tracker.
- App launch links include `from=iq-suite&bundle=<id>`.
- Apps must preserve existing query params when linking back to suite.

## Phase 0.5 — Week-1 Paid Release (Activation Gate v0.5, Client-side)
**Purpose:** accept payment now, ship coherent paid UX, keep implementation lightweight.

**Scope rule:**
- Paid access in Week-1 is enforced only for apps included in the purchased bundle.
- Everything else remains browseable.

**Gate placement:**
- Suite Launcher gate (primary).
- Per-app deep-link gate (secondary).
- Gate applies only to bundled apps (Zone/Capacity/G Tracker hub as relevant).
- If an app is free/browseable, it must not show activation modal.

**Activation storage contract:**
- Key: `iqmw.activation.v1`
- Fields:
- `isActive: boolean`
- `activatedAt: ISO string`
- `bundleId: string` (authoritative)
- `source: "ejunkie" | "manual"`
- `version: 1`
- `unlockedAppIds?: string[]` (optional display cache only)

**Activation state precedence:**
- If `iqmw.activation.v1.isActive === true`, unlock decisions are derived from `bundleId + bundle-manifests.json`.
- If missing/false, show gate.

**Code validation (Week-1):**
- Implement as client-validated bundle code for speed.
- Public copy should call this “device-based activation (temporary while account login rolls out)”.

**Support footgun note (explicit):**
- Activation is per device/browser.
- Clearing site data or switching device/browser requires code re-entry until Phase 1.

## Phase 1 — Ship-safe Paid Release (Auth + Entitlements + Sync)
**Purpose:** secure licensing and cross-device continuity.

**Deliverables:**
- Supabase auth and session persistence.
- Stripe webhook entitlement updates.
- Per-app gating from server-truth entitlements.
- Cross-device continuity.
- Shared append-only `events` log for activation/gate/entitlement events.

**Data model (minimal):**
- `entitlements` table.
- Shared append-only `events` table.
- RLS: users can read only their own events/entitlements.

**Webhook rules:**
- Idempotent processing by provider event id.
- Purchase/upgrade updates entitlement status.
- Refund/revoke sets `status=revoked` (or `inactive`) and apps lock on next entitlement fetch.

## Public Interfaces / Types
- `app-registry.json`: `appId`, `label`, `route`, `iconRef`, `category`.
- `bundle-manifests.json`: `bundleId`, `label`, `includedAppIds`, `description`, `ctaLabel`.
- `iqmw.launch.context.v1`: `from`, `bundleId`, `entryAppId`, `timestamp`.
- `iqmw.activation.v1`: as defined in Phase 0.5.

## Test Cases
1. Legacy routes continue to work.
2. `apps/iq-suite/index.html` launches correctly and deep-links with context.
3. Shared UI import order is consistent and token overrides do not drift.
4. Phase 0.5 gate appears only on bundled paid apps.
5. Phase 0.5 unlock resolves from `bundleId + manifest` only.
6. Query params persist on return-to-suite links.
7. Phase 1 entitlement changes reflect immediately after fetch.
8. Phase 1 RLS prevents cross-user entitlement/event reads.
9. Refund/revoke transitions lock access as expected.

## Definition of Done
- **Phase 0 done:** shared UI adopted by Capacity benchmark alignment, Zone Coach, and G Tracker hub; Suite Launcher live; route compatibility preserved.
- **Phase 0.5 done:** activation modal in launcher + bundled apps; device activation works; clear temporary activation messaging and reset activation control.
- **Phase 1 done:** auth + webhook entitlements + RLS + cross-device continuity + events log operational.

## Assumptions
- Static-hosted architecture remains for Phases 0 and 0.5.
- Week-1 prioritizes speed and coherence over hard licensing security.
- Capacity Gym remains the benchmark style source.
- G Tracker scope is hub-first before full assessment-page reskin.
