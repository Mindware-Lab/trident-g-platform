# Zone Coach Psi Corridor Protocol

Version: v1.1 (public protocol)
Date: 2026-03-06
Owner: Mindware Lab (Trident G IQ)

## 1) Purpose and scope

Zone Coach is a short readiness and re-entry intervention that estimates whether current control state is suitable for high-quality cognitive training or demanding work.

It is a non-clinical coaching and self-regulation tool. It is not diagnosis, treatment, or medical advice.

## 2) Intervention targets (construct level)

The protocol targets:

- state-aware timing of high-load cognitive work
- rapid re-entry after overload or underpowered states
- cleaner go-light-go decisions before training
- reduction of low-quality training exposure that can drive thin automation

The objective is better state hygiene for downstream cognitive performance, not a medical state label.

## 3) Measurement paradigm: MFT-M for CCC

### 3.1 Probe task

Zone Coach uses a short masked majority-direction behavioural probe (MFT-M) to estimate Cognitive Control Capacity (CCC).

### 3.2 Primary measurement outputs

The probe yields:

- CCC throughput estimate (bits/second)
- behavioural control markers from speed, variability, lapses, and error structure
- quality signals needed for validity and confidence gating

### 3.3 Probe quality design

The measurement design includes:

- short-duration, repeatable runs
- explicit invalid-run handling
- optional quick re-check mode after intervention
- local trend accumulation for baseline-relative interpretation

## 4) Classification architecture (public logic)

### 4.1 Validity gate first

State classification proceeds only if run quality is acceptable. Interrupted or poor-quality probes are routed to `Session not valid` with low confidence and a re-check recommendation.

### 4.2 Feature families used

The classifier uses feature families rather than a single score:

- throughput and core performance quality
- lapse and timeout structure
- response-time dispersion and tail behaviour
- fast-error and burstiness patterns
- drift over time within run
- catch-trial quality signals
- post-error control signatures

### 4.3 Competing state signatures

For valid runs, the system evaluates competing out-of-zone signatures and a conservative in-zone gate:

- underpowered/lapse-heavy signature (`Flat`)
- rigid over-control signature (`Locked In`)
- unstable/noisy high-arousal signature (`Spun Out`)
- conservative high-quality control signature (`In the Zone`)

### 4.4 Baseline-relative moderation

When sufficient local history exists, the classifier interprets current signals relative to rolling personal baseline before final assignment.

### 4.5 Confidence assignment

Confidence is estimated from signal separation and data sufficiency, then surfaced as low/medium/high.

## 5) State taxonomy and recommendation routing

### 5.1 User-facing states

- `In the Zone`
- `Flat`
- `Locked In`
- `Spun Out`
- `Session not valid`

### 5.2 Recommendation gate

State and confidence are mapped to an action gate for the next block of work, for example:

- proceed with higher-load work
- run light/stabilisation work
- reset and re-check
- repeat probe when invalid or low-confidence

The recommendation layer is separate from raw state assignment and is intentionally conservative under uncertainty.

## 6) Re-check and longitudinal protocol

Zone Coach is designed for repeated use, not one-off classification.

### 6.1 Re-check principle

After an intervention (for example brief regulation/reset step), users can run a quick re-check to test whether state improved in the intended direction.

### 6.2 Baseline trend principle

Valid sessions build local personal baseline and trend context. Assignment and guidance become more individualized as valid history accumulates.

### 6.3 Durability and handoff principle

State guidance is used to support downstream training/work timing and can optionally feed readiness context into adjacent protocol layers.

## 7) Observables and logging categories

The protocol publishes schema categories for auditability without exposing private constants.

### 7.1 Session-level categories

- timestamped CCC throughput outputs
- assigned state label and confidence label
- validity outcome and re-check markers

### 7.2 Feature-family categories

- central performance and variability markers
- lapse/error/burst markers
- catch-trial quality markers
- baseline-relative delta markers

### 7.3 Longitudinal categories

- rolling trend rows
- in-zone band estimation support rows
- run-quality history for confidence calibration

## 8) Data and export posture

Default posture is local-first storage. Session summaries and trend rows are stored locally for personal tracking and recommendation quality.

Public publication uses aggregated summaries only. Raw personal logs are not publicly exposed.

Users retain control through app-level export/reset controls.

## 9) Open methods, protected execution (expanded)

### 9.1 Published openly

The following are intentionally public for scientific accountability:

- intervention purpose and non-clinical boundaries
- MFT-M measurement role and CCC construct framing
- validity-first classifier architecture
- state families and recommendation-gate logic
- confidence and baseline-relative interpretation families
- logging schema categories and local-first privacy posture

### 9.2 Protected for integrity

The following remain non-public to preserve protocol integrity:

- exact thresholds and weighted score coefficients
- anti-gaming and anti-noise guardrail details
- proprietary classifier tuning and calibration constants
- implementation-level decision tables not required for conceptual replication

This boundary is "open methods, protected execution": enough detail for conceptual replication, without exposing exploit paths.

## 10) Conceptual replication guidance (scientist-facing)

This section defines the minimum design for conceptual replication studies.

### 10.1 Minimal protocol recipe

A conceptual replication should include:

1. a short masked behavioural control probe with repeated runs,
2. a validity gate before state assignment,
3. multiple competing state signatures rather than single-threshold classification,
4. confidence assignment and uncertainty-aware routing,
5. baseline-relative interpretation after sufficient prior valid runs.

### 10.2 Minimum fidelity checklist

To claim conceptual alignment, studies should preserve:

- explicit invalid-run handling,
- separate classification and recommendation layers,
- conservative in-zone assignment logic,
- repeated-use trend accumulation,
- re-check after intervention pathway.

### 10.3 Suggested dependent variables

Replications should capture both measurement and routing quality:

- classification stability across repeated valid runs,
- confidence calibration versus signal separation,
- intervention-response change in quick re-checks,
- reduction in low-quality high-load training starts,
- downstream timing alignment with recommended intensity gates.

### 10.4 Falsification patterns

Findings that would challenge protocol assumptions include:

- no benefit of validity gating versus ungated assignment,
- no improvement in calibration from baseline-relative interpretation,
- recommendation routing performing no better than non-state-aware timing.

## 11) Claims boundaries

Allowed posture:

- designed to support readiness routing and re-entry,
- we evaluate state signatures and confidence before recommendation,
- we track and publish aggregated summaries as evidence matures.

Not allowed:

- diagnosis or treatment claims,
- guaranteed performance outcomes,
- guaranteed transfer outcomes.

Outputs vary with run quality, baseline depth, context, and adherence.

## 12) Changelog

- 2026-03-06: v1.0 initial canonical public protocol publication.
- 2026-03-06: v1.1 expanded public methods detail for conceptual replication.

## 13) Related documents

- `readme-zc.md` (product overview)
- `protocol-zc.md` (expanded technical logic reference)
- `states-zc.md` (state definitions for user-facing language)
- `../COGNITIVE-STATE-PROTOCOL.md` (detailed implementation notes)
