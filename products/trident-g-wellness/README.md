# Trident G Wellness

Brand-separated wellness product line built on the same protocol backbone (CCC MindState + body-readiness routing) and the same Kastel Stack control-plane patterns used across Trident G products.

This folder is structured so it can be lifted into its own standalone repository with minimal changes.

## Current Direction

- Primary wedge: `Longevity South Africa` (consumer-first validation).
- Secondary wedge: `Corporate Wellness South Africa` (after evidence and case studies).
- Shared core: one measurement engine, one safety/routing model, lane-specific copy/offers/dashboards.

## Measurement Modes (what “the protocol” means)

### Mode A — Full Mind–Body (Polar H10 RR stream)
Gold-standard body classification using RR-derived features (HR/HRV + DFA α1 under light load).
- **6-min Core check:** Baseline 1:00 → CCC 3:00 → Light challenge 2:00
- **7-min Full check:** Baseline 1:00 → CCC 3:00 → Light challenge 2:00 → Seated recovery 1:00 (improves confidence via settling)

### Mode B — Mind + Wearable Proxy (WHOOP/Fitbit/Apple Watch)
MindState from CCC plus wearable-derived readiness proxies (sleep HRV/recovery/resting HR etc.).
- BodyState remains “unknown” in strict ANS terms.
- The app uses proxies as conservative guardrails and trend indicators (not full body-state labels).

### Mode C — Mind + Breath Hint (phone mic)
Optional mic-derived breathing rate/steadiness used for self-regulation feedback and interpretation support.
- Treated as an adjunct channel with strict confidence gating.

## Layout

- `apps/`
  - `zone-coach-wellness/` -> core product app (wellness-branded Zone Coach variant)
  - `longevity-sa-site/` -> SA consumer funnel wrapper
  - `corporate-sa-site/` -> SA corporate funnel wrapper
- `docs/`
  - `protocols/` -> protocol docs by mode (H10 full, wearable proxy, breath adjunct)
  - `markets/` -> lane strategy and positioning
  - `operations/` -> lane operating model and contribution rules
  - `legal/` -> brand/IP and governance boundaries
  - `science/` -> scientific rationale and references (incl. proxy limitations)
- `config/`
  - `lanes/` -> lane manifests and routing defaults
  - `offers/` -> offer IDs and activation policy
  - `payments/` -> region-specific payment-routing notes
- `integrations/`
  - `kastel-stack/` -> workspace/domain mapping and event-contract references
  - `wearables/` -> OAuth scopes, data mappings, proxy definitions, consent notes
- `general-information/` -> legacy docs retained for continuity
