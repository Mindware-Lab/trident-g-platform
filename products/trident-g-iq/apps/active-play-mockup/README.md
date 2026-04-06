# Trident G Active Play Mock-up

This folder contains a standalone static mock-up for the three active-play screens:

- `Tests`
- `Zone`
- `Capacity`

It is intentionally a visual prototype only. Metrics, game logic, scoring, routing, and telemetry bindings are still placeholders.

## Run locally

From the repo root:

```powershell
python -m http.server 4173 -d products/trident-g-iq/apps/active-play-mockup
```

Or from inside the folder:

```powershell
.\serve.ps1
```

Then open:

```text
http://127.0.0.1:4173/
```

You can switch screens with the top nav or with keyboard shortcuts:

- `1` = Tests
- `2` = Zone
- `3` = Capacity

## Design spec

### Shared shell contract

- The app sits inside a boxed outer shell on a light page background, matching the attached image and HTML.
- The gameplay surface is boxed again inside that shell. No active-play screen renders full-bleed.
- The frame structure is fixed across all three modules:
  - Slot A: top nav
  - Slot B: thin info strip
  - Slot C: boxed game window with colored banner
  - Slot D: response area inside the game window
  - Slot E: coach strip under the game window
  - Slot F: right telemetry rail

### Slot behavior

#### Slot A - Top nav

- Wordmark stays white.
- Tabs are muted by default.
- Active tab uses the module accent and glow underline.
- `Hub` is present but intentionally inactive until the next iteration.

#### Slot B - Thin info strip

- Always shows four compact items:
  - mode context
  - eligibility or state
  - today or progress
  - TG Credit
- TG Credit is always lime and sits at the far right.
- Eligibility uses a bold state pill.

#### Slot C - Game window

- Always boxed.
- Banner carries module identity.
- Banner layout is fixed:
  - left: module name and subtitle
  - right: large stage marker
- Main task area stays dark and sparse.
- Only the current stimulus and response affordances carry strong glow.

#### Slot D - Response area

- Large buttons only.
- Valid and selected actions take the module outline.
- Correct-style confirmation uses lime.
- Error-style response can use red later, but the current mock-up keeps it subtle.

#### Slot E - Coach strip

- One sentence only.
- Left side is a small label.
- Right side is directive and behaviorally useful.
- The strip stays anchored under the game window in every module.

#### Slot F - Telemetry rail

- Compact stack of five cards.
- Each card uses:
  - muted label
  - one dominant number or state
  - short subline
  - simple graphic if needed
- The rail is the main place for live metrics and motivation, not the top nav.

### Color system

- Shared base:
  - background: deep navy-black
  - text: white
  - secondary text: desaturated blue-grey
  - panel lines: low-contrast electric grey
- Module accents:
  - Tests: cyan / ice blue
  - Zone: amber / gold
  - Capacity: electric blue
- Shared semantic colors:
  - TG Credit and reward: lime
  - Transfer Readiness: violet
  - Ready: green-teal
  - Flat: muted steel blue
  - Spun Out: warm orange
  - Locked In: magenta-red

### Typography

- Primary emphasis uses `Orbitron`.
- Labels and structural UI use `Chakra Petch`.
- Explanatory copy uses `Exo 2`.
- The visual hierarchy is:
  - large bold state or metric
  - medium subtitle
  - small spaced caps labels

### Module-specific emphasis

#### Tests

- Measured and evidence-led.
- Telemetry centers on validity, completion, and comparison against prior evidence.
- Response styling is cleaner and less arcade-like.

#### Zone

- Diagnostic and decisive.
- Banner emphasizes state first.
- Telemetry centers on zone score, bits per second, signal profile, and route recommendation.

#### Capacity

- Most game-like of the three.
- Banner emphasizes family, focus, gate, and current N-level.
- Telemetry centers on session average, stable level, trend, Transfer Readiness, and route progress.

### Telemetry placeholders reserved for later binding

The mock-up deliberately leaves the data contract soft, but it reserves visual space for the metrics already implied by the telemetry notes:

- `Average session n-back`
- `Last-3-block consistency`
- family and variant carry-over
- probe and unlock progression
- `Transfer Readiness`
- zone gating state
- control-capacity throughput

The current values are present to prove layout and emphasis only, not final behavior.
