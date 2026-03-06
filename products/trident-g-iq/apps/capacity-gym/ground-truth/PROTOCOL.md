# Capacity Gym Transfer Invariance Protocol

Version: v1.1 (public protocol)
Date: 2026-03-06
Owner: Mindware Lab (Trident G IQ)

## 1) Purpose and scope

Capacity Gym is a cognitive training intervention designed to improve control quality under load and test whether gains carry over beyond the exact practiced task format.

It is a non-clinical protocol for training, education, and self-tracking. It is not diagnosis, treatment, or medical advice.

## 2) Intervention targets (construct level)

The intervention targets four linked capacities:

- working-memory control under time pressure
- attentional stability with interference management
- relational structure tracking across changing surface forms
- recovery and re-entry after disruption

The objective is portability of control policies, not only better same-task scores.

## 3) Intervention architecture

Capacity Gym uses a structured training architecture:

- Program horizon: approximately 24 sessions (scaffold target, not hard stop).
- Session unit: guided 10-block session (with optional extensions after completion).
- Training families:
  - Hub family (attentional updating n-back variants).
  - Relational family (graph, transitive, and propositional relational n-back variants).
- Session styles:
  - Build (`TUNE`)
  - Explore (`EXPLORE`)
  - Stabilise (`TIGHTEN`)
  - Switch test (`PROBE`)
  - Later check (`RECHECK`)
  - Reset day (`RESET`)

When integrated with Zone Coach, readiness can gate intensity before higher-load pathways.

## 4) Core design principles

### 4.1 Thin automation control

A common failure mode is thin automation: improvement tied to one surface wrapper. The protocol counters this by requiring robustness checks under controlled change.

### 4.2 Canonical matching principle

Matching is keyed to canonical task identity (meaning/relation), not only rendering details. This is central to relational modes and supports structure-level learning tests.

### 4.3 One-dial perturbation principle

When challenging a plateau, perturb one control dial at a time where possible (for example speed, interference, or game wrapper). This supports interpretability of the resulting change.

### 4.4 Stability-before-escalation principle

Low-quality blocks route to recovery/stabilisation before further escalation. This prevents policy updates from noisy trials.

## 5) Decision-flow families (public algorithmic logic)

### 5.1 Inputs used

Decision flow uses session/block observables, including:

- outcome band trends (up/hold/down pattern)
- lapse and error-burst quality signals
- plateau and breakthrough signatures
- prior probe/re-check history
- optional readiness handoff signals (if Zone integration is present)

### 5.2 Control states used

The coach routes blocks/sessions through named control states:

- `RECOVER`
- `STABILISE`
- `TUNE`
- `SPIKE_TUNE`
- `CONSOLIDATE`

### 5.3 Public routing skeleton

The intervention follows this family-level logic:

1. If quality is poor, route to recovery.
2. If a clear breakthrough is detected, route to consolidation.
3. If performance is stable but flat, run one controlled perturbation.
4. Evaluate perturbation outcome as hold, partial hold, or collapse.
5. Promote, stabilise, or revert based on that outcome.
6. Schedule later re-checks to test durability after delay.

Detailed threshold values and anti-gaming constants are intentionally not published.

## 6) Transfer testing protocol (what is tested, when, and how)

Capacity Gym treats transfer as an evidence process rather than a claim.

### 6.1 Immediate robustness test

After candidate improvement, test whether performance survives a game swap at comparable difficulty demand.

### 6.2 Controlled perturbation test

At plateau, apply one constrained perturbation to test whether policy quality is robust to demand shifts.

### 6.3 Delayed hold test

Re-check after a delay window to test whether gains persist, not only in-session.

### 6.4 Optional mission bridge

Where mission logging is used, record whether strategy carryover appears in a small real-world task context.

### 6.5 Public evidence labels

For conceptual replication, evidence can be interpreted with these labels:

- `HOLD`: performance remains stable under challenge.
- `PARTIAL_HOLD`: mixed survival with recoverable degradation.
- `COLLAPSE`: performance fails under changed condition and requires stabilisation.

## 7) Observables and logging categories

The protocol publishes logging categories (not private constants) so process can be audited.

### 7.1 Block-level categories

- wrapper/mode, difficulty context, and trial counts
- accuracy/error family metrics
- lapse and burst quality markers
- coach state flags and probe markers
- relational quiz outcomes (where applicable)

### 7.2 Session-level categories

- session type and wrapper family
- block sequence and adaptation trace
- candidate breakthrough notes (if logged)
- transfer probe outcomes

### 7.3 Longitudinal categories

- trend trajectory across sessions
- probe/re-check pass history
- mission carryover markers (if enabled)

## 8) Data and export posture

Default posture is local-first telemetry storage. Core usage does not require cloud account linkage.

Public reporting uses aggregated summaries only. Raw personal logs are not publicly exposed.

Users retain control through app-level export/reset controls.

## 9) Open methods, protected execution (expanded)

### 9.1 Published openly

The following are intentionally public for scientific accountability:

- intervention purpose, boundaries, and intended constructs
- session architecture and training-family structure
- coach state families and routing sequence
- transfer-check families (immediate, perturbation, delayed re-check)
- evidence labels and interpretation categories
- logging schema categories at block/session/longitudinal level
- local-first privacy stance and user export posture

### 9.2 Protected for integrity

The following remain non-public to preserve protocol integrity:

- full threshold tables and coefficient values
- anti-gaming heuristics and guardrails
- exact scheduling constants and proprietary progression tuning
- premium execution scripts not required for conceptual replication

This boundary is "open methods, protected execution": enough detail to replicate principles, without exposing code-level exploit paths.

## 10) Conceptual replication guidance (scientist-facing)

This section specifies a minimum conceptual replication design.

### 10.1 Minimal protocol recipe

A conceptual replication should include:

1. repeated training sessions (not one-off testing),
2. at least two representational wrappers for the same underlying demand,
3. adaptive progression with quality-gated routing,
4. planned game swaps under matched demand,
5. delayed re-checks after training sessions.

### 10.2 Minimum fidelity checklist

To claim conceptual alignment, studies should preserve:

- stability-before-escalation routing,
- one-dial perturbation logic,
- explicit game swap tests (not random variation only),
- delayed durability checks,
- canonical meaning scoring for relational conditions.

### 10.3 Suggested dependent variables

Replications should capture both process and outcome:

- near-task performance trend,
- swap-cost profile (same vs changed wrapper),
- delayed hold profile,
- quality marker trajectory (lapses/error bursts),
- relational inference performance (if relational modes are used).

### 10.4 Falsification patterns

Findings that would challenge protocol assumptions include:

- gains that do not survive any controlled game swap,
- no difference between perturbation-informed routing and random progression,
- no delayed retention beyond immediate in-session improvement.

## 11) Claims boundaries

Allowed posture:

- designed to support transferable cognitive skill,
- we test carryover under changed conditions,
- we track and publish aggregated summaries as evidence matures.

Not allowed:

- guaranteed far transfer,
- guaranteed IQ-point increases,
- clinical diagnosis or treatment claims.

Outcomes vary by user, context, and adherence.

## 12) Changelog

- 2026-03-06: v1.0 initial canonical public protocol publication.
- 2026-03-06: v1.1 expanded public methods detail for conceptual replication.

## 13) Related documents

- `README-CG.md` (product-level overview)
- `SCIENCE-CG.md` (expanded rationale and model notes)
- `MARKET-CG.md` (positioning and safe-claims framing)
- `../ETHICS_AND_TRANSPARENCY.md` (ethics and transparency policy)
- `../SPEC.md` (implementation contract, internal precedence source)
