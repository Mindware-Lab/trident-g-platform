# Cognitive State Protocol (Zone Coach)

This document explains how Zone Coach estimates and assigns cognitive states in the current browser app implementation.

It has two parts:

1. A **technical description** of the implemented logic (for internal/product/research use)
2. A **general consumer description** (for outward-facing explanation without exposing specific algorithms)

---

## Part 1. Technical Protocol (Implemented Logic)

## 1) Purpose of the classifier

Zone Coach is a **behavioural state-routing tool**.
It does not diagnose a person or measure "brain criticality" directly.

Its purpose is to:

- estimate whether the user is currently in a good state for high-quality cognitive work/training
- identify common out-of-zone response patterns
- provide practical next-step guidance

The current user-facing states are:

- `In the Zone`
- `Flat`
- `Locked In`
- `Spun Out`
- `Session not valid` (quality failure / interrupted probe)

Internal classifier labels map as follows:

- `in_zone` -> `In the Zone`
- `flat` -> `Flat`
- `overloaded_exploit` -> `Locked In`
- `overloaded_explore` -> `Spun Out`
- `invalid` -> `Session not valid`

---

## 2) Core input: masked majority-direction probe (CCC-style behavioural probe)

Zone Coach runs a short masked majority-direction task (MFT-M / CCC-style probe) and extracts trial-by-trial behavioural features.

The probe supports estimation of:

- **CCC throughput (bits/second)** from adaptive exposure timing
- behavioural control quality markers (speed, variability, lapses, error patterns)

The app stores valid completed sessions locally and uses them to compute rolling baselines.

---

## 3) Quality gating before classification (valid vs invalid)

State assignment only proceeds if the session is considered **valid**.

If the run is invalid (for example interruption, focus loss, timing instability, or early termination), the classifier returns:

- state = `invalid`
- confidence = `Low`
- no state-score output

This prevents the app from producing a normal state label from a poor-quality run.

Important implementation detail:

- early stopped / interrupted probes are explicitly handled as invalid and routed to the "repeat the check" flow

---

## 4) Features extracted from the probe

The app computes a feature bundle from probe trials and catch trials.

### Probe performance features (examples used in state routing)

- `n` (usable probe trials)
- accuracy (`acc`)
- median RT (`rtMed`)
- RT coefficient of variation (`rtCV`)
- timeout rate (`timeoutRate`)
- slow lapse rate (`slowLapseRate`)
- RT tail index (`rtTailIndex`)
- fast response rate (`fastRate`)
- fast error rate (`fastErrorRate`)
- RT volatility (`rtVolatility`)
- error burstiness (`errorBurstiness`)
- RT drift over time (`rtSlope`)
- error drift over time (`errSlope`)
- post-error slowing (`PES`)
- RT lag-1 autocorrelation (`rtLag1`)
- throughput proxy (`acc / RT`, secondary to CCC bits/sec)

### Catch-trial quality features

- catch-failure rate (`catchFailRate`)
- catch trial counts and fails

### Support counts used by confidence rules

- `pesSupport` (number of valid post-error observations contributing to PES)

---

## 5) State scoring model (three competing out-of-zone signatures)

For valid sessions, the classifier computes three heuristic score bundles:

- `coldScore` (maps to `Flat`)
- `exploreScore` (maps to `Spun Out` / `overloaded_explore`)
- `exploitScore` (maps to `Locked In` / `overloaded_exploit`)

Each score is built from weighted, thresholded feature transforms.

### 5a) Flat (`coldScore`) signal family

Flat is driven primarily by underpowered / lapse-like signatures, including:

- more timeouts
- more slow lapses
- longer RT tail
- RT drift
- error drift
- catch failures

### 5b) Spun Out (`exploreScore`) signal family

Spun Out is driven primarily by unstable / noisy execution signatures, including:

- higher RT variability (`rtCV`)
- RT volatility
- fast errors
- bursty errors
- fast responding tendency

### 5c) Locked In (`exploitScore`) signal family

Locked In is driven primarily by rigid / over-controlled signatures, including:

- stronger post-error slowing (`PES`)
- slower-but-steady pattern composite
- low fast-error profile
- low RT volatility profile

### 5d) Baseline-relative adjustments (when enough history exists)

If the user has enough prior valid local history (>= 3 valid sessions), the raw state scores are adjusted against recent rolling baselines (EWMA-based comparisons), including deviations in:

- timeout rate (supports Flat score)
- RT variability (supports Spun Out score)
- PES (supports Locked In score)

The classifier also computes an `inZoneBpsPenalty` term when current BPS falls materially below the user’s baseline trend.

This helps prevent false "in-zone" assignments when throughput is depressed relative to the user’s own recent norm.

---

## 6) In-Zone assignment logic (gated first)

The classifier evaluates `In the Zone` first using a rule set rather than simply "lowest of the three scores".

In-zone assignment requires a combination of:

- minimum trial support (`n` threshold)
- low Flat score
- low Spun Out score
- low Locked In score
- low catch-failure rate
- acceptable BPS relative to baseline (once enough history exists)

This is intentionally conservative:

- `In the Zone` is treated as a higher bar than simply "not obviously out of zone"

If the in-zone rule passes:

- state = `in_zone`

If not:

- the app picks whichever out-of-zone score is highest among:
  - `flat`
  - `overloaded_explore`
  - `overloaded_exploit`

---

## 7) Confidence assignment logic

The app outputs a user-facing confidence label:

- `Low`
- `Medium`
- `High`

### 7a) Out-of-zone confidence

For out-of-zone states, confidence is based primarily on the **margin** between the top two competing out-of-zone scores:

- larger margin -> higher confidence
- smaller margin -> lower confidence (mixed pattern / ambiguous signature)

### 7b) In-zone confidence

For in-zone states, confidence depends more on baseline depth and trial support:

- baseline history depth contributes to confidence
- larger trial count can upgrade confidence

### 7c) Confidence downgrades / overrides

Confidence is forced down to `Low` in some cases, including:

- too few usable probe trials
- `Locked In` classification with insufficient PES support (unstable estimate for that pattern)

This makes confidence partly a **data sufficiency** signal, not only a pattern strength signal.

---

## 8) Reasons shown to the user

The classifier returns short reason strings to support the state label.

- `In the Zone` uses a fixed positive reason set (low lapse / low variability / no dominant off-zone signature)
- Out-of-zone states use top contributing features from the winning score family (e.g., timeouts, fast errors, burstiness, strong PES)

These are explanatory summaries, not full feature dumps.

---

## 9) Training gate and recommendation layer (separate from state assignment)

State classification and training guidance are related but separate.

After state + confidence are assigned, the app computes a training gate such as:

- `GO_DEEP`
- `NO_DEEP_TODAY`
- `LOW_CONFIDENCE / SOFT NO`
- `TRY_AGAIN (INVALID)`

This gate depends on:

- state
- confidence
- validity
- baseline readiness (e.g., enough valid prior data)

Then the UI presents state-matched guidance under:

- `Cognitive Training`
- `Work`
- `Other Intervention`

The app explicitly warns against Trident G IQ training in out-of-zone states due to risk of **thin automation** (surface-feature task strategy learning rather than broader transferable gains).

---

## 10) Local baseline and history behaviour

Zone Coach stores valid completed sessions in local browser storage and uses them to build a rolling personal baseline.

Baseline arrays are derived from valid rows only and include measures such as:

- CCC bits/second
- RT variability
- timeout rate
- fast error rate
- PES
- catch-failure rate

Recent history is used for:

- baseline-relative score adjustments
- BPS plausibility checks for in-zone assignment
- local trend graph (bits/second trace)

### Important implementation note

- local history is device/browser-specific (`localStorage`)
- switching device/browser breaks continuity unless data is migrated manually

---

## 11) What this protocol is (and is not)

This protocol is:

- a transparent behavioural routing heuristic for coaching and readiness
- designed for practical decision support in a browser environment
- deliberately conservative about invalid runs and low-confidence classifications

This protocol is not:

- a diagnosis engine
- a psychiatric or neurological assessment
- a direct measurement of brain criticality

---

## Part 2. General Consumer Description (Outward-Facing)

## What makes Zone Coach "smart" (without revealing the internal algorithm)

Zone Coach does more than a simple reaction-time test.

It looks at the **pattern** of your responses across the task, not just whether you were fast or slow on average.

At a high level, the app combines three ideas:

### 1) Throughput (CCC bits/second)

The app estimates how efficiently you are turning brief, uncertain information into a controlled decision.

This gives a practical measure of how ready your system is for demanding cognitive work right now.

### 2) Response quality patterning

Instead of using one score, Zone Coach looks for different signatures such as:

- low-energy / lapse-heavy responding
- rigid over-control
- unstable noisy responding

This helps the app distinguish **different kinds of out-of-zone states**, not just "good" vs "bad".

### 3) Personal baseline context (local trend)

As you use the app, it builds a local history on your device and compares today’s result with your own recent pattern.

That helps the app become more personally meaningful over time, rather than relying only on generic thresholds.

---

## Why the app sometimes says not to train

When you are out of the zone, the app may recommend stabilising first instead of jumping straight into high-challenge cognitive training.

That is because training in a poor state can produce **thin automation**:

- you may get better at the surface pattern of a task
- but not improve the broader, transferable skills the training is meant to support

Zone Coach is designed to protect **training quality**, not just training quantity.

---

## What the app is trying to help you do

Zone Coach helps you:

- spot when you are in a strong window for deep work or training
- recognise the kind of state drift you are in (flat, locked in, or spun out)
- choose a better next step for the next 1-4 hours
- re-check after an intervention and make a better-timed decision

In short, the app adds value by turning a short behavioural probe into a **state-aware recommendation**, rather than giving you only a raw score.

---

## Confidentiality / product note

This outward-facing section intentionally avoids disclosing the specific weights, thresholds, and decision rules used in the implementation.

Those details are part of the app’s internal protocol and can evolve over time as the model is refined.
