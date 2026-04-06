# Trident G IQ Migration Strategy

## Purpose

This folder defines the migration path from the current mixed product state into the new product line:

- `products/trident-g-iq/` remains the legacy product tree
- `products/trident-g/` remains the prototype and spec archive
- `products/trident-g-iq-shared/` becomes the shared UI and runtime layer
- `products/trident-g-iq-basic/` becomes the focused active-play product
- `products/trident-g-iq-max/` becomes the expanded full-game product

The strategy is to separate product boundaries first, then modernize the build and backend stack without changing those boundaries again.

## Ground-Truth Requirement

All app development for `trident-g-iq-shared`, `trident-g-iq-basic`, and `trident-g-iq-max` must remain consistent with the authoritative documents in the repository-level `ground-truth/` folder.

This includes:

- product vocabulary
- architecture assumptions
- gameplay and mission logic
- telemetry meaning
- reasoning and transfer framing
- zone and capacity positioning

If implementation details, interface copy, or product behavior diverge from `ground-truth/`, that divergence should be treated as an intentional product change and documented explicitly rather than introduced implicitly during development.

## Why This Structure Migrates Cleanly

This structure is a good precursor for Vite, Vercel, and Supabase because it already separates:

- legacy code from new product code
- shared shell/runtime code from product-specific screens
- the `basic` product from the `max` product
- prototype/spec material from runtime application code

That means the next migration steps can be infrastructure changes, not another application re-org.

## Source To Target Mapping

### Legacy / prototype sources

- `products/trident-g-iq/`
  - current production-oriented IQ tree
- `products/trident-g/`
  - prototype shell, full-game ideas, mission/reasoning specs
- `products/trident-g-iq/apps/active-play-mockup/`
  - seed for the new boxed-shell UI system

### New runtime targets

- `products/trident-g-iq-shared/`
  - design tokens
  - shell layout
  - common runtime helpers
  - nav, router, telemetry contracts
- `products/trident-g-iq-basic/`
  - Hub
  - Tests
  - Zone Coach
  - Capacity Gym
- `products/trident-g-iq-max/`
  - everything in `basic`
  - Reasoning Gym
  - Missions
  - Progress
  - Coach Review

## Migration Principles

1. Keep `basic` and `max` as sibling products.
2. Keep shared UI/runtime in `trident-g-iq-shared`, not inside one app.
3. Treat `ground-truth/` as the authoritative source for product intent, claims, and design constraints.
4. Do not import runtime code directly from `products/trident-g/`.
5. Use `products/trident-g/` only as a source for specs, copy, and feature scope.
6. Promote stable contracts before adding backend dependencies.
7. Migrate deployment tooling after the new folder boundaries are stable.

## Recommended Phases

## Phase 1: Stabilize Static Product Roots

Goal: finish the new folder boundaries with static HTML/CSS/JS products.

Tasks:

- complete `trident-g-iq-basic` as a standalone product
- complete `trident-g-iq-max` as a standalone product
- keep all shared shell/runtime logic in `trident-g-iq-shared`
- confirm that `basic` does not depend on `max`
- confirm that `max` does not depend on legacy `trident-g-iq`

Exit criteria:

- `basic` serves standalone
- `max` serves standalone
- both render the same shared shell contract

## Phase 2: Convert To Vite Without Changing Product Boundaries

Goal: move each new product to a modern frontend toolchain.

Recommended target:

```text
products/
  trident-g-iq-shared/
  trident-g-iq-basic/
  trident-g-iq-max/
```

Each root can become a Vite app or package while preserving the same folder ownership.

Suggested evolution:

- `trident-g-iq-shared/`
  - expose shared CSS, assets, and runtime modules as importable source
- `trident-g-iq-basic/`
  - become a Vite app with its own `package.json`
- `trident-g-iq-max/`
  - become a Vite app with its own `package.json`

Recommended implementation approach:

- start by adding Vite entrypoints that wrap the current `index.html` and `app.js`
- keep the screen manifests and structured screen objects
- keep the shared runtime API stable while migrating the bundler
- only introduce framework code if there is a clear need; Vite does not require React

Exit criteria:

- `basic` runs with `vite`
- `max` runs with `vite`
- shared modules are imported cleanly from `trident-g-iq-shared`

## Phase 3: Add Supabase Behind Shared Data Contracts

Goal: add persistence and auth without coupling screens directly to backend details.

Recommended boundaries:

- `trident-g-iq-shared/`
  - data client helpers
  - typed payload contracts
  - auth/session helpers
- `trident-g-iq-basic/`
  - consumes shared clients for session state, telemetry snapshots, and progress
- `trident-g-iq-max/`
  - consumes the same shared clients plus expanded mission/progression data

Recommended Supabase domains:

- user profile
- session logs
- telemetry snapshots
- test history
- zone check results
- capacity progression
- mission state
- unlock state

Rules:

- UI screens should consume structured data models, not raw query responses
- environment variables should stay inside each product root
- database access patterns should be defined in shared helpers first

Exit criteria:

- auth bootstraps in both products
- shared data client works in both products
- the screen layer still depends on shared contracts, not backend-specific code paths

## Phase 4: Move Deployment To Vercel

Goal: deploy `basic` and `max` as separate Vercel projects or separate targets in one monorepo.

Recommended deployment model:

- Vercel project 1: `trident-g-iq-basic`
- Vercel project 2: `trident-g-iq-max`
- shared code consumed from the same repository

Why this maps cleanly:

- each product already has its own root
- each product already has one public entrypoint
- environment variables can be scoped per deployment target
- preview deployments can be validated independently

Recommended Vercel setup:

- separate project settings for `basic` and `max`
- independent env vars for each app
- preview deployments on pull requests
- Supabase project variables injected per environment

Exit criteria:

- both products build on Vercel
- preview environments run independently
- production cutover does not require repo restructuring

## Phase 5: Cutover And Decommission

Goal: retire legacy surfaces gradually.

Suggested order:

1. complete parity for `basic`
2. launch `basic` preview and validate navigation, shell, telemetry, and progression UX
3. complete `max` placeholder screens using `trident-g` specs
4. launch `max` preview
5. redirect stakeholders to the new products
6. freeze legacy `trident-g-iq` except for urgent fixes

Only after the new line is stable should any old mockup code be removed.

## What Not To Do

- do not make `basic` import from `max`
- do not make `max` import runtime code from `basic`
- do not mix legacy `trident-g-iq/apps/` code into the new product roots
- do not wire screens directly to Supabase queries before shared contracts are defined
- do not treat `products/trident-g/` as a live runtime dependency

## Immediate Next Steps

1. Finish wiring `trident-g-iq-max` as a runnable sibling product.
2. Keep refining the shared shell and component contracts in `trident-g-iq-shared`.
3. Add a small migration checklist for Vite setup in `basic` and `max`.
4. Add a shared data-contract note before any Supabase integration begins.

## Decision Summary

- New products: `trident-g-iq-basic`, `trident-g-iq-max`
- Shared layer: `trident-g-iq-shared`
- Legacy retained: `trident-g-iq`
- Prototype/spec archive retained: `trident-g`
- Migration order: structure first, tooling second, backend third, deployment fourth
