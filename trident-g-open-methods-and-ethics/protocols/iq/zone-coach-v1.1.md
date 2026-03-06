---
Version: v1.1
Date: 2026-03-06
Owner: Mindware Lab (Trident G IQ)
Status: Public protocol publication
Scope: Readiness and re-entry protocol for high-quality cognitive work timing
"Claims boundary": Non-clinical coaching/education protocol; no diagnosis, treatment, or guaranteed outcomes
---

# Zone Coach Psi Corridor Protocol

## 1) Purpose and scope

Zone Coach is a short readiness and re-entry intervention that estimates whether current control state is suitable for high-quality cognitive training or demanding work.

## 2) Intervention targets

- State-aware timing of high-load cognitive work
- Rapid re-entry after overload or underpowered states
- Cleaner go/light/go decisions before training
- Reduction of low-quality training exposure

## 3) Measurement paradigm

Zone Coach uses a short masked majority-direction behavioral probe (MFT-M) to estimate Cognitive Control Capacity (CCC).

Primary outputs:
- CCC throughput estimate (bits/second)
- Response quality signals (timing, lapses, variability, error structure)
- Run validity and confidence indicators

## 4) Classifier logic (public family level)

1. Apply validity gate before state assignment
2. Compute feature families (throughput, lapses, variability, drift, catch quality)
3. Compare competing state signatures
4. Apply conservative in-zone gating
5. Assign confidence label from separation + data sufficiency
6. Route next action (proceed/light/reset/re-check)

User-facing states:
- In the Zone
- Flat
- Locked In
- Spun Out
- Session not valid

## 5) Baseline-relative interpretation

When sufficient valid local history exists, current runs are interpreted against rolling personal baseline to improve calibration.

## 6) Re-check protocol

The protocol supports quick re-check runs after a regulation/intervention step to test directional improvement.

## 7) Open vs protected

Open:
- Purpose, state families, validity-first routing, confidence posture, data categories

Protected:
- Exact thresholds, weighted constants, anti-gaming heuristics, private tuning details

## 8) Claims boundary

Allowed:
- Supports readiness routing and re-entry decisions
- State signatures and confidence are evaluated before recommendations

Not allowed:
- Clinical diagnosis/treatment claims
- Guaranteed performance or transfer outcomes

## 9) Related governance

- `../../governance/ETHICS_AND_ALGORITHMIC_TRANSPARENCY.md`
- `../../governance/CLAIMS_AND_SAFETY.md`
- `../../governance/DATA_PUBLICATION_POLICY.md`
