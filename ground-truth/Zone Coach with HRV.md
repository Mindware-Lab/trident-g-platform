# Zone Coach with HRV

This standalone ground-truth file consolidates the two Zone Coach science documents that define:

- the cognitive task and classification metrics used by the current Zone Coach app
- the HRV and mind-body metrics used to assess the four-zone / four-quadrant state landscape

Primary source files copied into this consolidation:

- `products/trident-g-iq/apps/zone-coach/COGNITIVE-STATE-PROTOCOL.md`
- `products/trident-g-iq/apps/zone-coach/mind-body-flow v2.2.md`

Supporting source reviewed:

- `products/trident-g-iq/apps/zone-coach/SCIENCE.md`

---

## Part 1. Cognitive Task Metrics

Source: `products/trident-g-iq/apps/zone-coach/COGNITIVE-STATE-PROTOCOL.md`

### Purpose of the classifier

Zone Coach is a behavioural state-routing tool. It does not diagnose a person or measure brain criticality directly.

Its purpose is to:

- estimate whether the user is currently in a good state for high-quality cognitive work or training
- identify common out-of-zone response patterns
- provide practical next-step guidance

The current user-facing states are:

- `In the Zone`
- `Flat`
- `Locked In`
- `Spun Out`
- `Session not valid`

Internal classifier labels map as follows:

- `in_zone` -> `In the Zone`
- `flat` -> `Flat`
- `overloaded_exploit` -> `Locked In`
- `overloaded_explore` -> `Spun Out`
- `invalid` -> `Session not valid`

### Core input: masked majority-direction probe

Zone Coach runs a short masked majority-direction task (MFT-M / CCC-style probe) and extracts trial-by-trial behavioural features.

The probe supports estimation of:

- CCC throughput (`bits/second`) from adaptive exposure timing
- behavioural control quality markers from speed, variability, lapses, and error structure

Valid completed sessions are stored locally and used to compute rolling baselines.

### Quality gating before classification

State assignment only proceeds if the session is considered valid.

If the run is invalid, for example because of interruption, focus loss, timing instability, or early termination, the classifier returns:

- `state = invalid`
- `confidence = Low`
- no state-score output

Early stopped or interrupted probes are explicitly routed to the repeat-check flow.

### Features extracted from the probe

The app computes a feature bundle from probe trials and catch trials.

Probe performance features include:

- `n` (usable probe trials)
- `acc` (accuracy)
- `rtMed` (median RT)
- `rtCV` (RT coefficient of variation)
- `timeoutRate`
- `slowLapseRate`
- `rtTailIndex`
- `fastRate`
- `fastErrorRate`
- `rtVolatility`
- `errorBurstiness`
- `rtSlope`
- `errSlope`
- `PES` (post-error slowing)
- `rtLag1` (RT lag-1 autocorrelation)
- `throughputProxy` (`acc / RT`, secondary to CCC bits/sec)

Catch-trial quality features include:

- `catchFailRate`
- catch trial counts and fails

Support counts used by confidence rules include:

- `pesSupport`

### State scoring model

For valid sessions, the classifier computes three heuristic out-of-zone score bundles:

- `coldScore` -> `Flat`
- `exploreScore` -> `Spun Out`
- `exploitScore` -> `Locked In`

Each score is built from weighted, thresholded feature transforms.

#### Flat (`coldScore`) signal family

Flat is driven mainly by underpowered or lapse-like signatures, including:

- more timeouts
- more slow lapses
- longer RT tail
- RT drift
- error drift
- catch failures

#### Spun Out (`exploreScore`) signal family

Spun Out is driven mainly by unstable or noisy execution signatures, including:

- higher `rtCV`
- higher RT volatility
- more fast errors
- more bursty errors
- stronger fast-responding tendency

#### Locked In (`exploitScore`) signal family

Locked In is driven mainly by rigid or over-controlled signatures, including:

- stronger `PES`
- slower-but-steady pattern composite
- low fast-error profile
- low RT volatility profile

### Baseline-relative adjustments

When the user has enough prior valid local history (3 or more valid sessions), the raw state scores are adjusted against recent rolling baselines, including deviations in:

- timeout rate, supporting `Flat`
- RT variability, supporting `Spun Out`
- `PES`, supporting `Locked In`

The classifier also computes an `inZoneBpsPenalty` term when current BPS falls materially below the user's baseline trend. This helps prevent false `In the Zone` assignments when throughput is depressed relative to the user's own recent norm.

### In-Zone assignment logic

`In the Zone` is evaluated first using a rule set rather than simply choosing the lowest of the three out-of-zone scores.

In-zone assignment requires a combination of:

- minimum trial support
- low `Flat` score
- low `Spun Out` score
- low `Locked In` score
- low catch-failure rate
- acceptable BPS relative to baseline, once enough history exists

This is intentionally conservative. `In the Zone` is treated as a higher bar than simply "not obviously out of zone".

If the in-zone rule passes:

- `state = in_zone`

If not:

- the app picks whichever out-of-zone score is highest among `flat`, `overloaded_explore`, and `overloaded_exploit`

### Confidence assignment logic

The app outputs a user-facing confidence label:

- `Low`
- `Medium`
- `High`

For out-of-zone states, confidence is based mainly on the margin between the top two competing out-of-zone scores:

- larger margin -> higher confidence
- smaller margin -> lower confidence

For `In the Zone`, confidence depends more on:

- baseline history depth
- larger trial count

Confidence is forced down to `Low` in some cases, including:

- too few usable probe trials
- `Locked In` with insufficient `PES` support

### Reasons shown to the user

The classifier returns short reason strings to support the state label.

- `In the Zone` uses a fixed positive reason set
- out-of-zone states use top contributing features from the winning score family, such as timeouts, fast errors, burstiness, or strong `PES`

### Training gate and recommendation layer

State classification and training guidance are related but separate.

After state and confidence are assigned, the app computes a training gate such as:

- `GO_DEEP`
- `NO_DEEP_TODAY`
- `LOW_CONFIDENCE / SOFT NO`
- `TRY_AGAIN (INVALID)`

This gate depends on:

- state
- confidence
- validity
- baseline readiness

The UI then presents state-matched guidance under:

- `Cognitive Training`
- `Work`
- `Other Intervention`

### Local baseline and history behaviour

Zone Coach stores valid completed sessions in local browser storage and uses them to build a rolling personal baseline.

Baseline arrays are derived from valid rows only and include measures such as:

- CCC bits/second
- RT variability
- timeout rate
- fast error rate
- `PES`
- catch-failure rate

Recent history is used for:

- baseline-relative score adjustments
- BPS plausibility checks for in-zone assignment
- a local trend graph with an estimated `In the Zone` band once enough in-zone history exists

---

## Part 2. HRV Metrics and Four-Zone Assessment

Source: `products/trident-g-iq/apps/zone-coach/mind-body-flow v2.2.md`

### The 3D state space

The framework defines a shared mind-body state space across three dimensions:

| Dimension | Body (HRV) | Mind (MFT-M) | What It Measures |
|-----------|------------|--------------|------------------|
| Y-Axis: Amplitude | `lnRMSSD` | `bps` | Processing bandwidth / energetic capacity |
| X-Axis: Structure | `DFA alpha1` | `RT lag-1` | Temporal order |
| Z-Axis: Irregularity | `SampEn` | `RT CV` and error burstiness | System noise |

The core tracking and visualization focus on the 2D mind-body plane using the amplitude dimensions. Structure and irregularity act as quality gates.

### Standardizing the currencies

To combine cardiovascular (`lnRMSSD`) and cognitive (`bps`) metrics without one dominating the other, both are converted into personalized z-scores relative to EWMA baselines.

#### Cognitive confidence weighting

Because cognitive data relies on trial-by-trial sampling, shorter assessments have lower statistical power:

```text
Z_mind_weighted =
((Current bps - EWMA_bps) / SD_bps) * (1 - 1 / sqrt(N_trials))
```

#### Physiological confidence weighting

HRV metrics also benefit from longer recordings. The confidence weight is based on recording duration relative to a target such as 180 seconds:

```text
Z_body_weighted =
((Current lnRMSSD - EWMA_lnRMSSD) / SD_lnRMSSD) * min(1, sqrt(duration / 180))
```

#### Baseline adaptation

All EWMA baselines update continuously with new data so the system tracks gradual shifts in the user's set point while remaining responsive to recent changes.

### Quality gates

Raw amplitude or speed is treated as invalid if the system is structurally compromised. Both mind and body gates are continuous rather than binary.

#### Mind gate (`V_mind`)

Optimal cognitive flow corresponds to an `RT lag-1` of about `0.3`. A Gaussian penalty degrades validity as temporal structure drifts:

```text
V_mind = exp(-k_mind * (RT_lag1 - 0.3)^2)
```

with `k_mind = 5`.

#### Body gate (`V_body`)

For the body, `DFA alpha1` has biological boundary conditions, with smoothed transitions:

```text
V_body =
  exp(-k_low * (0.75 - alpha1)^2)   if alpha1 < 0.75
  1                                  if 0.75 <= alpha1 <= 1.15
  exp(-k_high * (alpha1 - 1.15)^2)  if alpha1 > 1.15
```

with:

- `k_low = 10`
- `k_high = 20`

This creates:

- a gentle decay below `0.75` for decoupling
- a steeper decay above `1.15` for rigidity

#### Combined gate

Overall validity is the product:

```text
V_total = V_mind * V_body
```

Points with `V_total < 0.5` are excluded from dynamic range calculations, though they may still be shown as low-quality states.

### Context-aware indices

The relationship between brain and body depends on context. The app calculates one of two indices:

#### Neurovisceral Sync Index

Used in recovery and rest contexts such as breathing exercises, meditation, sleep prep, and pattern flow tasks.

```text
Sync Index =
  (Z_mind_weighted * V_mind) +
  (Z_body_weighted * V_body)
```

Interpretation:

- high positive = both systems improve together

#### Executive Override Index

Used in stress and load contexts such as intense exercise, cold exposure, high-pressure work, or WM challenge.

```text
Override Index =
  (Z_mind_weighted * V_mind) -
  (Z_body_weighted * V_body)
```

Interpretation:

- high positive = cognition stays sharp while the body is stressed

### The four-zone / four-quadrant attractor landscape

The four quadrants are treated as dynamical attractor basins with measurable transition velocities between them.

| Basin / Quadrant | Physiology | Cognition | System Interpretation | Mind-Body Relationship |
|------------------|------------|-----------|------------------------|------------------------|
| The Zenith (Top Right) | Relaxed / Open | Flow (`V_mind` near 1) | Natural attractor, deep recovery, integrated health | High Sync |
| The Clutch (Bottom Right) | Stressed / Rigid | Flow (`V_mind` near 1) | High-energy override, elite performance, metabolically costly | High Override |
| The Drift (Top Left) | Relaxed / Open | Decoupled / Sluggish | Entropy attractor, under-arousal, sleep onset | Low Sync |
| The Crash (Bottom Left) | Stressed / Rigid | Brittle / Errors | Defense attractor, overload, panic | Low Override |

These four zones are determined by the interaction of:

- body amplitude (`lnRMSSD` as weighted z-score)
- mind amplitude (`bps` as weighted z-score)
- structural quality gates (`DFA alpha1` and `RT lag-1`)
- irregularity markers (`SampEn`, `RT CV`, error burstiness)

### Transition velocity

For sessions with multiple measurements, the framework tracks path velocity through state space:

```text
Velocity_t =
sqrt((Z_mind_t+1 - Z_mind_t)^2 + (Z_body_t+1 - Z_body_t)^2) / Delta_t_minutes
```

Interpretation:

- fast transitions between quadrants suggest flexibility
- slow or stalled transitions suggest stickiness
- oscillations suggest instability

Recovery velocity from `Clutch` or `Crash` toward `Zenith` or `Drift` is treated as a resilience metric.

### Stress-recovery cycle protocol

The structured challenge protocol probes both Override and Sync:

| Phase | Duration | Task | Purpose |
|-------|----------|------|---------|
| Baseline | 3 min | MFT-M | Establish resting state |
| High Load | 3-5 min | Adaptive n-back | Test Override |
| Probe 1 | 2 min | MFT-M | Capture stressed state |
| Pattern Flow | 3-4 min | Coherent motion detection | Test Sync |
| Probe 2 | 2 min | MFT-M | Capture recovered state |

Key derived metrics include:

- stress reactivity
- recovery parallel to the stress axis
- elasticity
- flow induction effect

### Multi-timescale dynamic range metrics

The framework distinguishes session traversal from global dynamic range.

#### Session-specific traversal

```text
SessionTraversal =
|P_stress - P_base| + |P_recover - P_stress|
```

Path efficiency compares the actual recovery path with the ideal direct return to baseline:

```text
PathEfficiency =
dot(V_actual, V_ideal) / (|V_actual| * |V_ideal|)
```

#### Global dynamic range

Across all valid points where `V_total >= 0.5`, long-term adaptive capacity is:

```text
GlobalRange = Area(ConvexHull(S_valid))
```

Additional metrics:

- `NormalizedVolume = GlobalRange_current / max(GlobalRange_all_time)`
- population percentile
- composite resilience quotient

---

## Notes From Supporting Science File

`products/trident-g-iq/apps/zone-coach/SCIENCE.md` reinforces that:

- RR-derived HRV input is optional
- the lighter Zone Coach science spec treats `DFA alpha1` mainly as a baseline trend feature
- its implementation note says `DFA alpha1` should not override behavioural readiness outputs directly

That means the strongest current source for the explicit HRV-based four-zone assessment is still `mind-body-flow v2.2.md`, while the strongest source for the cognitive task metrics is `COGNITIVE-STATE-PROTOCOL.md`.
