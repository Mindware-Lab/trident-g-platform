# Trident G IQ Basic

Focused active-play product built on the new sibling UI/runtime layer.

## Scope

- Hub
- Tests
- Zone Coach
- Capacity Gym

## Mockup UI Location

The current in-progress active-play mockup UI for the basic product lives in:

- `products/trident-g-iq-basic/mockups/active-play/`

Current live unfinished routes:

- `http://127.0.0.1:4173/trident-g-iq-basic/#hub`
- `http://127.0.0.1:4173/trident-g-iq-basic/#tests`
- `http://127.0.0.1:4173/trident-g-iq-basic/#zone`
- `http://127.0.0.1:4173/trident-g-iq-basic/#capacity`
- `http://127.0.0.1:4173/trident-g-iq-basic/#capacity-lab`

The shared shell primitives stay in `products/trident-g-iq-shared/ui/`, but route-specific mockup tuning for these active-play screens belongs in the basic mockup folder until the designs are finalized.

## Specs Location

Working product specs for the basic app now live in:

- `products/trident-g-iq-basic/specs/`

That tree currently includes Capacity Gym, Zone Coach, shared telemetry/game-map, and economy docs converted from Word into Markdown, along with source `.docx` files and extracted media where relevant.

## Pull-Across Plan

The current source-to-target migration plan for pulling logic and content from the legacy `trident-g-iq` app into this new boxed-shell product lives in:

- `products/trident-g-iq-basic/docs/legacy-pull-across-plan.md`

That plan explicitly reuses mechanics, item banks, scoring, state classification, and progression logic while excluding legacy UI markup and styling.

## Feedback Surface Rule

The consumer-facing versus coaching-only metric split for the basic product lives in:

- `products/trident-g-iq-basic/docs/consumer-vs-coaching-feedback.md`

This is the working rule for keeping the general-consumer UI fun and intuitive while moving technical telemetry into the separate coaching layer.

## Run locally

```powershell
cd C:\Users\admin\OneDrive\Documents\GitHub\trident-g-platform\products\trident-g-iq-basic
.\serve.ps1
```

Open `http://127.0.0.1:4173/trident-g-iq-basic/#hub`.
