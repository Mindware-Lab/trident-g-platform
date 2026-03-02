# Body/ANS State Protocol 

This document explains how Zone Coach estimates and assigns **Body/ANS states** using Polar H10 RR intervals and derived features (HR, HRV, DFA α1).

It mirrors the cognitive protocol structure:

1. Technical protocol (internal/product/research use)
2. Consumer description (outward-facing, no proprietary thresholds)

---

## Part 1. Technical Protocol (Implemented Logic)

## 1) Purpose of the classifier

Zone Coach is a **state-routing tool**.
It does not diagnose medical conditions or measure “autonomic health” directly.

Its purpose is to:
- estimate whether the user’s autonomic system is currently in a **corridor** that supports good learning/work/training
- identify common **out-of-zone** patterns (too low/depleted, too rigid/tight, too noisy/unstable)
- provide practical next-step guidance and **reduce state drift** by encouraging a return toward **allostatic in-zone functioning**
- protect against **load stacking** on constrained days

### User-facing states (body/ANS)
- `In the Zone` *(corridor target)*
- `Subcritical` (optional flavour: `Restorative` vs `Depleted`)
- `Locked In` *(off-zone supercritical: “too tight” mobilisation; recovery back to corridor is the aim)*
- `Spun Out` *(off-zone supercritical: dysregulated mobilisation; stabilise and simplify)*
- `Body signal not valid / Unknown` (quality failure)

> Important: `Locked In` is **not treated as “good readiness”**. It is an **edge/out-of-zone state** where mobilisation is elevated and regulation appears orderly, but the overall pattern is “too tight” and should be time-boxed and guided back toward the corridor.

### Internal labels map as follows
- `body_in_zone` -> `In the Zone`
- `body_subcritical_restorative` -> `Subcritical (Restorative)` (optional)
- `body_subcritical_depleted` -> `Subcritical (Depleted)` (optional)
- `body_overloaded_tight` -> `Locked In`
- `body_overloaded_unstable` -> `Spun Out`
- `body_unknown` -> `Body signal not valid / Unknown`

*(Rename your previous `body_overloaded_exploit`/`body_overloaded_explore` if desired; “tight” vs “unstable” matches the updated taxonomy.)*

---

## 2) Core input: RR intervals + a short standard protocol

Zone Coach records RR intervals via Polar H10 during a short morning protocol:

- Segment A: **Rest-like** (typically during the 3-min CCC task; seated and still)
- Segment B: **Light challenge** (2-min march-in-place/step test; standardised)
- Segment C: **Recovery** (1-min stillness)

This enables:
- a rest-like estimate of autonomic regulation (Segment A)
- regulation-under-load signature (Segment B via DFA α1)
- settling/recovery estimate (Segment C)

---

## 3) Quality gating before classification (valid vs unknown)

Body state assignment only proceeds if the recording is considered usable.

If **unusable** (poor signal quality or missing required segments), return:
- state = `body_unknown`
- confidence = `Low`
- no body-score output (or output with strong “Unknown” flag)

### 3a) Segment requirements (MVP)
- Segment A: minimum clean RR count (e.g. >= 60 beats)
- Segment B: minimum clean RR count (e.g. >= 90 beats) **required** to resolve the supercritical fork
- Segment C: minimum clean RR count (e.g. >= 30 beats) optional but improves confidence

If Segment B is missing or too noisy:
- **Do not** attempt Locked In vs Spun Out on body
- Either:
  - set `body_unknown`, or
  - degrade to “low-resolution body output” (optional) and cap confidence (<= Medium)

### 3b) Artefact gating (simple deterministic)
Mark RR artefacts if:
- RR < 300 ms or RR > 2000 ms
- OR abs change > 20–25% from previous clean RR (simple ectopy/missed-beat proxy)

Compute:
- `artifactRateA`, `artifactRateB`, `artifactRateC`

If `artifactRateB > 0.10` (example):
- downgrade Segment B quality to `noisy`
- cap body confidence and allow `body_unknown` if severe

---

## 4) Features extracted from RR (MVP bundle)

### Segment A (rest-like)
- `hrRest` (bpm)
- `lnRMSSDRest` (ln of RMSSD from clean RR)
- `rrArtifactRateA`

### Segment B (light challenge)
- `hrChallenge` (bpm)
- `dfaA1Challenge` (2-min window)
- `rrArtifactRateB`

### Segment C (recovery)
- `hrRecovery` (bpm; mean over final ~30s if possible)
- `hrRecovery60` = hrChallenge(end) - hrRecovery(end)  (simple settling proxy)
- `rrArtifactRateC`

### Optional supportive transforms (nice-to-have)
- `deltaHR = hrChallenge - hrRest` (mobilisation response)
- `segmentMissingFlags`

---

## 5) State scoring model (three competing out-of-zone signatures)

For usable sessions, compute three score bundles analogous to cognitive routing:

- `coldScore` (maps to `Subcritical`, especially depleted)
- `tightScore` (maps to `Locked In` / “too tight” mobilisation)
- `unstableScore` (maps to `Spun Out` / dysregulated mobilisation)

Each score is built from weighted, thresholded transforms of baseline-relative deviations.

**Important:** “tight” and “unstable” are both treated as **off-zone**. The model does not interpret either as the target corridor.

---

## 6) Baseline-relative adjustments (personalisation)

Zone Coach uses rolling baselines from prior usable sessions (e.g. N=14–24), preferably EWMA-based.

Maintain baseline mean/SD (or EWMA mean + robust spread) for:
- `hrRest`
- `lnRMSSDRest`
- `dfaA1Challenge`
- `hrRecovery60` (optional)
- `deltaHR` (optional)

Compute z-like deviations:
- `zHR = (hrRest - muHR) / sdHR`
- `zRMSSD = (lnRMSSDRest - muRMSSD) / sdRMSSD`
- `zDFA = (dfaA1Challenge - muDFA) / sdDFA`
- `zREC = (hrRecovery60 - muREC) / sdREC`

If baseline depth is weak (<3 usable sessions):
- run conservative “generic” heuristics
- cap confidence (<= Medium)
- avoid hard forks when Segment B quality is borderline

---

## 7) Score families (definitions)

### 7a) Subcritical (`coldScore`)
Subcritical is driven by:
- **under-mobilisation** AND/OR **low reserve**
- especially when regulation markers suggest depletion

Signals (examples):
- under-mobilisation: `zHR` very low (negative) and/or `deltaHR` blunted
- depletion signature: `zRMSSD` suppressed (negative) and/or `zREC` poor
- general fatigue: slow/weak recovery response

Practical interpretation (optional flavour):
- **Subcritical Restorative** if low mobilisation + good regulation and clean settling
- **Subcritical Depleted** if low mobilisation + poor regulation and/or poor settling

### 7b) Spun Out (`unstableScore`)
Spun Out is driven by:
- mobilisation is high, but regulation under load is degraded and/or recovery is messy

Signals (examples):
- mobilisation: `zHR` high and/or `zRMSSD` low (suppressed vagal)
- dysregulation: `zDFA` negative (drops under challenge) and/or `zREC` poor
- noisy physiology: elevated artefact rate during challenge may contribute (softly)

Interpretation:
- an activated, unstable profile that benefits from stabilising interventions and avoiding load stacking.

### 7c) Locked In (`tightScore`) — **off-zone “too tight” mobilisation**
Locked In is driven by:
- mobilisation is elevated, regulation-under-load markers may look orderly, but the overall pattern is **over-constrained/tight** relative to the corridor

Signals (examples; choose a conservative subset for MVP):
- mobilisation elevated: `zHR` high and/or `zRMSSD` below baseline
- regulation markers do **not** show collapse (`zDFA` not strongly negative; recovery not severely poor)
- “tightness” indicators such as:
  - unusually low variability relative to the person’s baseline (when available),
  - unusually strong or prolonged mobilisation with limited settling,
  - repeated recurrence of this state across days (trend-level warning)

Interpretation:
- not “ready for maximal load”, but a sign to **time-box** and include a corridor-return step (downshift/broadening) to avoid drifting into rigid over-reach.

> Implementation note: In MVP, `Locked In` can be treated as a conservative “edge state” bucket for *mobilised but not-collapsing* profiles, with recommendations that emphasise return to in-zone.

---

## 8) In-Zone assignment logic (gated first)

As with cognition, `In the Zone` is a **higher bar** than “not obviously bad”.

In-zone requires:
- usable Segment A and B quality
- artefacts below threshold (especially Segment B)
- no dominant cold/tight/unstable score
- baseline-relative values within a “corridor band”, e.g.:
  - `abs(zHR) <= bandHR`
  - `abs(zRMSSD) <= bandRMSSD`
  - `zDFA >= lowerBoundDFA`
  - (optional) `zREC >= lowerBoundREC`

If in-zone rule passes:
- state = `body_in_zone`

If not:
- choose the highest of the three score families:
  - `coldScore` -> `body_subcritical_(restorative|depleted)`
  - `tightScore` -> `body_overloaded_tight` (Locked In)
  - `unstableScore` -> `body_overloaded_unstable` (Spun Out)

---

## 9) Confidence assignment logic

Zone Coach outputs:
- `Low`
- `Medium`
- `High`

### 9a) Unknown confidence
Forced `Low` if:
- missing Segment B (or too noisy to compute DFA α1)
- extreme artefact rates
- insufficient clean RR counts

### 9b) Out-of-zone confidence
Confidence is based on:
- **margin** between the top two competing score bundles
- segment quality and baseline depth

Example:
- larger margin + good quality + good baseline -> High
- small margin or weak baseline -> Medium/Low

### 9c) In-zone confidence
Depends on:
- baseline depth (more history -> higher confidence)
- low artefacts + clean Segment B
- stability of DFA α1 and recovery signature

### 9d) Confidence downgrades
Force down to `Low` or `Medium` if:
- Segment B artefact rate elevated (even if classification is possible)
- baseline insufficient
- challenge protocol non-compliance suspected (optional: accelerometer check)

---

## 10) Reasons shown to the user (explanations)

Return short reason strings based on dominant contributors:

Examples:
- In-zone: `["within corridor band", "clean recovery", "stable under light load"]`
- Subcritical depleted: `["low reserve", "suppressed recovery", "low mobilisation"]`
- Subcritical restorative: `["restorative downshift", "good regulation"]`
- Locked In: `["mobilised and tight", "time-box load", "return to corridor"]`
- Spun Out: `["mobilised but unstable", "poor settling", "structure dropped under load"]`
- Unknown: `["signal noisy", "challenge missing", "insufficient data"]`

---

## 11) Training gate and recommendation layer (separate from state assignment)

Body state influences:
- whether physical intensity is permitted today
- whether stacking load (late work + hard training) is discouraged
- whether the app should bias toward recovery, stabilisation, or gentle movement

Updated gating (aligned to “Locked In is off-zone”):
- `BODY_CORRIDOR` (in-zone with good confidence)
- `BODY_AMBER` (unknown/low confidence or restorative subcritical)
- `BODY_EDGE` (locked-in; time-box + corridor return; avoid stacking)
- `BODY_RED` (depleted subcritical or spun-out; protect reserve)

This gate combines with MindState and Coupling for final recommendations.

---

## 12) Local baseline and history behaviour

Store usable body sessions locally and compute rolling baselines for:
- hrRest
- lnRMSSDRest
- dfaA1Challenge
- hrRecovery60 (optional)

Use history for:
- baseline-relative score adjustments
- in-zone corridor plausibility checks
- trend graphs (24-day banding once enough data exists)

Important:
- history is local-first and device-specific unless synced.

---

## 13) What this protocol is (and is not)

This protocol is:
- a practical, conservative autonomic routing heuristic
- designed for consumer RR data and short protocols
- explicit about `Unknown` when quality is insufficient

This protocol is not:
- a diagnosis engine
- a medical-grade autonomic assessment
- a direct measurement of “autonomic criticality”

---

## Part 2. General Consumer Description (Outward-Facing)

Zone Coach doesn’t just look at one HRV number.

It uses a short, repeatable check to estimate whether your body is:
- **in the corridor** (In the Zone),
- **downshifted** (Subcritical: restorative vs depleted),
- **too tight** (Locked In),
- **too activated and unstable** (Spun Out),
or whether the signal was too noisy to interpret (Unknown).

Zone Coach also compares today’s pattern to your own baseline, so guidance becomes more personal over time.

When Zone Coach recommends a reset, a gentle movement block, or a recovery downshift, the goal is to move you back toward **allostatic in-zone functioning** and protect training quality and recovery, not maximise effort.
