# Capacity Gym Transfer Invariance Protocol

Version: v1.0 (public protocol)
Date: 2026-03-06
Owner: Mindware Lab (Trident G IQ)

## 1) Purpose and scope

Capacity Gym is a cognitive skills training intervention designed to improve control quality under load and to test whether gains carry over beyond the exact game format.

This is a non-clinical protocol for training, education, and self-tracking. It is not diagnosis, treatment, or medical advice.

## 2) What this protocol trains

The protocol targets:

- working-memory control under time pressure
- attention stability and interference management
- relational processing across changing representations
- recovery and re-entry after disruption

The design goal is portability of trained control policies, not just better performance on one repeated wrapper.

## 3) Scientific rationale (public summary)

A common failure mode in cognitive training is thin automation: users improve at the practiced surface format but gains do not hold under change.

Capacity Gym addresses this by combining:

- adaptive challenge control
- controlled perturbations
- game swaps (representation changes)
- delayed re-checks

Progress is treated as stronger when it survives changed conditions, not only when same-format scores rise.

## 4) Core intervention model

The coaching loop follows a practical sequence:

1. Stabilize signal quality
2. Apply controlled challenge
3. Test robustness under change
4. Consolidate what holds
5. Re-check later for durability

This is implemented as open method logic, while detailed thresholds and anti-gaming heuristics remain protected.

## 5) Training families used

Capacity Gym includes two training families:

- Hub n-back variants for controlled attentional and updating demands
- Relational n-back variants for structure tracking and meaning-preserving shifts

Relational variants are designed so matching is keyed to canonical relation identity rather than only surface form.

## 6) Transfer checks used

The protocol uses multiple checks rather than a single score:

- game swaps: test whether gains hold when representation changes
- boundary and perturbation probes: challenge one control dial at a time
- delayed re-checks: test whether gains hold after a time gap
- consolidation blocks: bank improvements before further escalation

Where available in the stack, readiness gating moderates challenge intensity before higher-load pathways.

## 7) Data and export posture

Default posture is local-first training telemetry. The app records session and block summaries needed for progression and audit of training quality.

Public reporting uses aggregated summaries only. Personal raw logs are not publicly exposed.

Users retain control of their own trail through app-level export/reset controls.

## 8) Open methods, protected execution

Published openly:

- intervention goals and boundaries
- decision-flow families
- transfer-check families
- logging categories and privacy posture

Protected for integrity:

- full threshold tables
- anti-gaming constants and heuristics
- proprietary sequencing coefficients and premium playbooks

This balances inspectability with protocol robustness.

## 9) Claims boundaries

Allowed posture:

- designed to support transferable cognitive skill
- we test carryover under changed conditions
- we track and publish aggregated summaries as evidence matures

Not allowed:

- guaranteed far transfer
- guaranteed IQ-point increases
- clinical diagnosis or treatment claims

Outcomes vary by user, context, and adherence.

## 10) Changelog

- 2026-03-06: Initial canonical public protocol publication.

## 11) Related documents

- `README-CG.md` (product-level overview)
- `SCIENCE-CG.md` (expanded scientific rationale)
- `MARKET-CG.md` (positioning and safe claims framing)
- `../ETHICS_AND_TRANSPARENCY.md` (ethics and transparency policy)
