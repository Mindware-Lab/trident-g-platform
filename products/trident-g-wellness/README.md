# Trident G Wellness

Brand-separated wellness product line built on the same protocol backbone (CCC + ANS routing) and the same Kastel Stack control-plane patterns used in Trident G products.

This folder is structured so it can be lifted into its own standalone repository with minimal changes.

## Current Direction

- Primary wedge: `Longevity South Africa` (consumer-first validation).
- Secondary wedge: `Corporate Wellness South Africa` (after evidence and case studies).
- Shared core: same measurement engine, same safety/routing model, lane-specific copy/offers/dashboards.

## Layout

- `apps/`
  - `zone-coach-wellness/` -> core product app (wellness-branded Zone Coach variant)
  - `longevity-sa-site/` -> SA consumer funnel wrapper
  - `corporate-sa-site/` -> SA corporate funnel wrapper
- `docs/`
  - `protocols/` -> core protocol docs and links
  - `markets/` -> lane strategy and positioning
  - `operations/` -> lane operating model and contribution rules
  - `legal/` -> brand/IP and governance boundaries
  - `science/` -> scientific rationale and references
- `config/`
  - `lanes/` -> lane manifests and routing defaults
  - `offers/` -> offer IDs and activation policy
  - `payments/` -> region-specific payment-routing notes
- `integration/`
  - `kastel-stack/` -> workspace/domain mapping and event-contract references
- `general-information/` -> legacy docs retained for continuity

## Wave 1 Workflow Scope (Wellness)

1. Checkout to entitlement grant/reconcile (D2)
2. Activation and onboarding route (D2 -> D3)
3. Coaching credits, booking, reminders (D3)
4. Lead scoring and offer routing (D1 -> D2)
5. At-risk retention trigger (D3)
6. Founder KPI weekly snapshot (D2/D3)

## Multi-Workspace Rule

Use one shared `kastel-stack` backend, while isolating this venture with:

- Separate `workspace_id`
- Separate lanes and entitlements
- Separate legal/policy configuration
- Separate payment-routing policy (including SA-local procurement paths)

## Next Steps

1. Move this folder to a dedicated repository (`trident-g-wellness`) when ready.
2. Hook app wrappers to the wellness workspace in `kastel-stack`.
3. Implement lane-specific onboarding questions and recommendation copy.
4. Add SA-local payment integration path for corporate lane.
