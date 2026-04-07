# Legacy Pull-Across Plan For `trident-g-iq-basic`

## Purpose

This document defines how `trident-g-iq-basic` should reuse material from the legacy `trident-g-iq` product for:

- `Tests`
- `Zone Coach`
- `Capacity Gym`

The important constraint is non-negotiable:

**The new basic app does not inherit the legacy UI.**

We reuse:

- mechanics
- item banks
- assets
- scoring
- state classification logic
- gating rules
- progression logic

We do **not** reuse:

- legacy HTML structure
- legacy CSS
- legacy component layout
- legacy navigation
- legacy visual styling

The new boxed-shell UI in `trident-g-iq-basic` remains the presentation layer for all migrated logic.

## Source Summary

### Tests

Legacy sources:

- `products/trident-g-iq/apps/assessments/sgs12a/index.html`
- `products/trident-g-iq/apps/assessments/sgs12b/index.html`
- `products/trident-g-iq/apps/assessments/psi-cbs/index.html`

Confirmed contents:

- `sgs12a` and `sgs12b`
  - 12-item SgS fluid reasoning forms
  - item bank embedded in JS
  - matrices, verbal, series, and rotation items
  - raw-score and RS-IQ-style scoring logic
  - form-specific image assets under each form folder
- `psi-cbs`
  - `core`, `ad`, and `ai` sections defined in JS data
  - reverse-scored focus items
  - subscale and total scoring logic
  - optional supplementary sections

### Zone Coach

Legacy sources:

- `products/trident-g-iq/apps/zone-coach/index.html`
- `products/trident-g-iq/apps/zone-coach/README.md`
- `products/trident-g-iq/apps/zone-coach/STATES.md`
- `products/trident-g-iq/apps/zone-coach/ground-truth/states-zc.md`

Confirmed contents:

- masked majority-direction CCC probe
- classifier with confidence logic
- four coaching-state outputs
- training gate logic
- recommendation picker
- local history and baseline support

Important legacy state naming:

- `in_zone`
- `flat`
- `overloaded_exploit`
- `overloaded_explore`

New basic-app UI naming should map these to:

- `in_zone` -> `Ready` / `In Zone`
- `flat` -> `Flat`
- `overloaded_exploit` -> `Locked In`
- `overloaded_explore` -> `Spun Out`

### Capacity Gym

Legacy sources:

- `products/trident-g-iq/apps/capacity-gym/stage1/games/hub.js`
- `products/trident-g-iq/apps/capacity-gym/stage1/lib/rng.js`
- `products/trident-g-iq/apps/capacity-gym/stage1/lib/scheduler.js`
- `products/trident-g-iq/apps/capacity-gym/stage1/lib/metrics.js`
- `products/trident-g-iq/apps/capacity-gym/stage1/lib/coach.js`
- `products/trident-g-iq/apps/capacity-gym/stage1/lib/progression.js`
- `products/trident-g-iq/apps/capacity-gym/stage1/lib/storage.js`
- `products/trident-g-iq/apps/capacity-gym/stage1/app.js`

Confirmed contents:

- hub categorical and non-categorical XOR-style n-back logic
- trial scheduling
- lure scheduling
- block scoring
- block-to-block coaching updates
- session summaries
- zone handoff normalization and gating
- session-style decisions: `TUNE`, `EXPLORE`, `TIGHTEN`, `PROBE`, `RECHECK`, `RESET`

This is the correct source for reusing XOR family logic variants 1 and 2.

## Migration Rule By Module

## 1. Tests

### What to pull across

- SgS Form A item definitions and images
- SgS Form B item definitions and images
- SgS raw score and band logic
- Psi-CBS question definitions
- Psi-CBS subscale calculations and section logic
- test-family labels and interpretation copy where still valid

### What not to pull across

- legacy React/Tailwind presentation from the assessment HTML files
- legacy onboarding cards
- legacy result layouts
- legacy screen framing

### New target in `trident-g-iq-basic`

Recommended target folders:

- `products/trident-g-iq-basic/content/tests/`
  - `sgs12a.js`
  - `sgs12b.js`
  - `psi-cbs.js`
- `products/trident-g-iq-basic/assets/tests/`
  - form images copied from legacy sources
- `products/trident-g-iq-basic/runtime/tests/`
  - `scoring.js`
  - `test-session.js`

### Recommended implementation shape

- convert SgS item banks into plain JS manifests
- separate item content from scoring helpers
- separate scoring helpers from shell rendering
- rebuild the `Tests` screen inside the new active-play shell
- use the shell banner/coach/telemetry rail to show evidence-mode status

### UI-level adaptation for the new shell

- SgS and Psi-CBS should appear as sub-modes inside the boxed `Tests` frame
- progress should appear in the right rail and banner, not as legacy assessment pages
- evidence-mode language stays short and shell-native

## 2. Zone Coach

### What to pull across

- classifier logic in `index.html`
- training gate logic:
  - `GO_DEEP`
  - `LOW_CONF_SOFT_NO`
  - `NO_DEEP_TODAY`
  - `TRY_AGAIN_INVALID`
- recommendation selection rules
- state definitions and state copy
- bits/second and confidence outputs

### What not to pull across

- legacy splash flow
- legacy popup system
- legacy result cards
- legacy graph UI
- legacy settings UI

### New target in `trident-g-iq-basic`

Recommended target folders:

- `products/trident-g-iq-basic/runtime/zone/`
  - `classifier.js`
  - `gating.js`
  - `recommendations.js`
  - `handoff.js`
- `products/trident-g-iq-basic/content/zone/`
  - `states.js`
  - `copy.js`

### Required naming adaptation

The classifier can keep the underlying legacy values internally, but the new shell should display:

- `In Zone`
- `Flat`
- `Locked In`
- `Spun Out`

That means the UI layer should translate:

- `overloaded_exploit` -> `Locked In`
- `overloaded_explore` -> `Spun Out`

### Required integration with Capacity

The Zone result must not stop at display.

It needs to produce a handoff object for Capacity containing at least:

- zone/state
- recommendation
- timestamp
- freshness
- confidence
- bits/second

Recommended basic-app handoff contract:

```js
{
  state: "in_zone" | "flat" | "overloaded_exploit" | "overloaded_explore" | "invalid",
  uiState: "In Zone" | "Flat" | "Locked In" | "Spun Out" | "Invalid",
  recommendation: "full" | "light" | "reset" | "recheck",
  confidence: "High" | "Medium" | "Low",
  bitsPerSecond: number | null,
  timestamp: number | null,
  freshSameDay: boolean
}
```

### Capacity consequence in the new shell

Capacity should read the Zone handoff and route the session accordingly:

- `In Zone`
  - full core route available
- `Flat`
  - lighter stabilise/reduced-block route
- `Locked In`
  - lower-pressure reset or wrapper shift route
- `Spun Out`
  - regulate/reset route before standard load
- low confidence or stale
  - conservative reduced route until re-check

The user should be able to explicitly accept the recommendation in the new UI.

## 3. Capacity Gym

### What to pull across first

- hub XOR mechanics from `games/hub.js`
- shared helpers from:
  - `lib/rng.js`
  - `lib/scheduler.js`
  - `lib/metrics.js`
- coach routing logic from `lib/coach.js`
- progression and zone-gating logic from `lib/progression.js`

### What not to pull across

- stage-1 shell UI
- stage-1 route handling
- stage-1 home/history/settings screens
- stage-1 visual assets tied to old layout unless they are true gameplay assets

### Why this is the right starting point

`hub.js` already contains the usable XOR-family core:

- categorical wrapper: `hub_cat`
- non-categorical wrapper: `hub_noncat`
- target modalities:
  - `loc`
  - `col`
  - `sym`
- block schedule:
  - `20 + n` trials
- session structure:
  - `10` blocks
- speed dials:
  - `slow`
  - `fast`
- lure scheduling
- block summary and `n` adjustment

This should become the base engine for Capacity variants before extending to other families.

### New target in `trident-g-iq-basic`

Recommended target folders:

- `products/trident-g-iq-basic/runtime/capacity/`
  - `games/xor.js`
  - `lib/rng.js`
  - `lib/scheduler.js`
  - `lib/metrics.js`
  - `lib/coach.js`
  - `lib/progression.js`
  - `lib/storage.js`
- `products/trident-g-iq-basic/content/capacity/`
  - `wrappers.js`
  - `coach-copy.js`
  - `telemetry-copy.js`
- `products/trident-g-iq-basic/assets/capacity/`
  - gameplay assets that are truly reused

### Adaptation rule

The migrated Capacity engine should expose data for the new shell, not render itself.

That means it should output:

- current stimulus
- block plan
- response classification
- block summary
- coach update
- progression state
- telemetry summary

The new shell then renders those through:

- banner
- game window
- coach strip
- right telemetry rail

## Planned Extraction Order

## Phase 1: Tests content and scoring

1. Extract `sgs12a` and `sgs12b` item banks into plain JS manifests.
2. Copy the required SgS images into `trident-g-iq-basic/assets/tests/`.
3. Extract Psi-CBS section/question data into a plain JS manifest.
4. Extract scoring helpers into `runtime/tests/`.
5. Keep all new rendering in the existing `Tests` shell screen.

## Phase 2: Zone classification and handoff

1. Extract classifier/gating logic from legacy Zone Coach.
2. Extract state copy and state mapping into `content/zone/`.
3. Build a clean `zone handoff` object for the basic app.
4. Feed the handoff into the `Zone` screen and persist it in basic-app storage.
5. Add acceptance flow for the resulting recommendation.

## Phase 3: Capacity XOR engine

1. Extract XOR engine and helpers from `hub.js` and related libs.
2. Rename them to basic-app runtime modules under `runtime/capacity/`.
3. Keep the current new mockup UI and wire the game engine into that shell.
4. Use Zone handoff to choose:
   - core route
   - reduced route
   - reset route
   - re-check route

## Phase 4: Coach and progression integration

1. Extract only the reusable coach/progression logic from stage 1.
2. Remove assumptions tied to old route names or old screens.
3. Re-express outcomes in new-shell language:
   - full route
   - reduced route
   - stabilise first
   - reset first
   - wrapper swap check
   - later check

## New Basic-App Structure To Support This

Recommended additions inside `trident-g-iq-basic`:

```text
content/
  tests/
  zone/
  capacity/

runtime/
  tests/
  zone/
  capacity/

assets/
  tests/
  capacity/
```

This keeps:

- screen shell code separate from imported mechanics
- copied legacy data separate from new UI
- reusable runtime logic separate from mockup CSS and screen definitions

## Non-Reuse Rule

When copying from legacy `trident-g-iq`, only pull:

- JS logic
- item definitions
- assets
- copy that is still valid

Do not pull:

- legacy DOM trees
- legacy styling systems
- Tailwind classes
- old app shells
- old navigation patterns

The new boxed-shell UI is the only UI target for `trident-g-iq-basic`.

## Immediate Next Implementation Tasks

1. Extract SgS item banks and images into `trident-g-iq-basic`.
2. Extract Psi-CBS data and scoring into `trident-g-iq-basic`.
3. Extract Zone classifier and gate logic into `trident-g-iq-basic/runtime/zone/`.
4. Extract XOR engine helpers into `trident-g-iq-basic/runtime/capacity/`.
5. Define the shared Zone-to-Capacity handoff object before wiring any gameplay screens.
