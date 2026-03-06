# Zone Coach Psi Corridor Protocol

Version: v1.0 (public protocol)
Date: 2026-03-06
Owner: Mindware Lab (Trident G IQ)

## 1) Purpose and scope

Zone Coach is a short readiness and re-entry protocol that estimates whether current cognitive state is suitable for high-quality training or demanding work.

It is a non-clinical coaching and self-regulation tool. It is not diagnosis, treatment, or medical advice.

## 2) What this protocol trains

The protocol targets:

- state-aware training and work routing
- fast, practical re-entry after drift or overload
- disciplined upshift/downshift decisions
- cleaner session quality before higher-load blocks

The goal is better timing and state hygiene for downstream cognitive work, not a medical state label.

## 3) Scientific rationale (public summary)

Performance quality varies with control state. Poorly timed high-load practice can increase noise and promote thin automation.

Zone Coach addresses this through:

- brief behavioural probing
- validity-first gating
- state signature routing
- confidence-aware recommendations

This creates a practical "check first, then choose intensity" loop.

## 4) Core intervention model

The protocol runs as a short cycle:

1. Run a brief behavioural probe
2. Validate run quality before classification
3. Estimate likely state signature
4. Assign confidence based on evidence strength
5. Route next action (proceed, light, reset, or re-check)

Where enough local history exists, current performance is interpreted against baseline trend rather than in isolation.

## 5) Probe and state routing

The app uses a masked majority-direction behavioural probe and computes a compact feature set from timing, errors, lapses, variability, and trend shape.

User-facing states are:

- In the Zone
- Flat
- Locked In
- Spun Out
- Session not valid

Internal signatures are used to route these labels and recommendations. The "In the Zone" label is intentionally conservative and requires quality and plausibility checks.

## 6) Checks used

The protocol uses multiple checks:

- validity gate for interrupted/low-quality runs
- competing state signature comparison
- confidence assignment using separation and support depth
- baseline-relative adjustments when local history is sufficient
- throughput plausibility checks for "In the Zone" assignment

These checks are designed to reduce false certainty and overconfident routing.

## 7) Data and export posture

Default posture is local-first storage. Session summaries and trend rows are stored locally for personal tracking and recommendation quality.

Public publication uses aggregated summaries only. Personal raw logs are not publicly exposed.

Users retain control of their trail through app-level export/reset controls.

## 8) Open methods, protected execution

Published openly:

- protocol purpose and boundaries
- state families and routing logic
- check families and confidence posture
- data categories and privacy stance

Protected for integrity:

- exact thresholds and weighted score constants
- anti-gaming and anti-noise heuristics
- proprietary classifier tuning details

This balances accountability with protocol robustness.

## 9) Claims boundaries

Allowed posture:

- designed to support readiness routing and re-entry
- we test state signatures and confidence before recommendation
- we track and publish aggregated summaries as evidence matures

Not allowed:

- diagnosis or treatment claims
- guaranteed performance outcomes
- guaranteed transfer outcomes

Outputs vary with run quality, baseline depth, context, and user adherence.

## 10) Changelog

- 2026-03-06: Initial canonical public protocol publication.

## 11) Related documents

- `readme-zc.md` (product overview)
- `protocol-zc.md` (expanded technical logic reference)
- `states-zc.md` (state definitions for user-facing language)
- `../COGNITIVE-STATE-PROTOCOL.md` (detailed implementation notes)
