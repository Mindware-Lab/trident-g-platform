# IQ Capacity Coach: Ethics and Algorithmic Transparency

Version: draft v1.0  
Scope: `products/trident-g-iq/apps/capacity-coach` with upstream Zone Coach handoff

## 1) Purpose and Limits

IQ Capacity Coach is a training and education tool for cognitive stability under load.

It is **not** medical advice, diagnosis, or treatment.  
It does **not** guarantee IQ gains.

The app is designed to improve training quality and portability of skills by:
- adapting session type based on readiness and prior performance quality
- testing whether gains survive wrapper/game changes
- checking whether gains still hold later
- encouraging small real-world mission outcomes

## 2) Human Agency Commitments

We optimize outcomes without optimizing people into compliance.

Practical commitments:
- No dark patterns in onboarding, pricing, or retention.
- No coercive recommendation loops.
- No hidden scoring that silently gates user rights or access.
- Recommendations are advisory; user actions remain user-controlled.
- Claims are constrained to training support, not clinical claims.

## 3) What Inputs Are Used

The coach uses the following input categories:

- Upstream readiness gate from Zone Coach:
  - `zone` category (`too_hot`, `in_band`, `too_cold`)
  - `recommendation` (`proceed` or `light`)
  - intervention response bucket from pre/post probe (`improved`, `no_clear_change`, `worsened`, or `unknown`) when available
- Recent training evidence:
  - trend shape (plateau, churn, breakthrough)
  - session data quality flags
  - recent probe/recheck history and passed probe signature
- Program scaffold state:
  - whether current index is a scheduled probe slot or recheck slot
- In-session block logs:
  - level played
  - felt difficulty
  - engagement
  - state drift

## 4) What Outputs Are Produced

The app outputs:
- suggested session type (`Build`, `Explore`, `Stabilise`, `Switch test`, `Later check`, `Reset day`)
- suggested game/wrapper for the next session
- suggested baseline plan for the session
- next-block adjustment suggestions during guided sessions
- transfer-check progress signals (near/mid/far, later hold checks, mission wins)

## 5) Decision Rules (Transparent Families)

We disclose the decision families and sequencing logic.  
We do not publish all exact numeric constants (see Section 9).

### 5.1 Zone gate to session intensity

- If readiness indicates overload, recommendation is conservative (`Reset day` or light stabilisation).
- If readiness indicates underpowered, recommendation is light stabilisation first.
- If readiness is in-band and evidence quality is acceptable, full training pathways are enabled.

### 5.2 Trend-aware next-session logic

Given recent eligible sessions:
- churn/instability -> stabilise (`TIGHTEN`)
- clean breakthrough or planned slot -> switch test (`PROBE`)
- planned later-check with prior passed signature -> recheck (`RECHECK`)
- plateau without overload -> controlled explore (`EXPLORE`)
- otherwise -> build (`TUNE`)

### 5.3 Switch tests and rechecks (far-transfer hygiene)

- Probe sessions test whether gains survive wrapper/game changes.
- Recheck sessions test whether gains still hold later using prior passed signatures where available.
- Evidence is counted only when quality criteria are met.

### 5.4 In-session adaptation (guided 10-block flow)

Per-block quick check updates the next block:
- overload signal (hard/lost thread) -> downshift
- easy + flat -> upshift
- stable sequence -> optional pulse challenge
- otherwise -> hold baseline

### 5.5 Conservative default behavior

When uncertainty or poor-quality signals are present, the system defaults to safer/lighter recommendations rather than aggressive progression.

## 6) Zone Coach Integration Transparency

Capacity Coach consumes Zone handoff data written locally by Zone Coach.

Current integration principles:
- Zone handoff affects session intensity gate.
- Intervention response (pre/post readiness probe effect) can moderate the final recommendation.
- Capacity Coach still requires in-app evidence quality to count transfer-relevant progress.

This means readiness state and training history are combined, not used in isolation.

## 7) Data Ethics and Privacy

Default posture is local-first.

- Primary storage is browser local storage for training state and logs.
- Export/import is supported for portability.
- Users can run core training flows without cloud account requirements.
- We minimize data collection to training-relevant fields.

Boundaries:
- Do not submit identifiable clinical or personal health records through GitHub issues, pull requests, or public channels.
- If research sharing is added, it should be opt-in with separate consent and withdrawal paths.

## 8) Red Rail Resilience Posture

Resilience is treated as an ethics requirement.

Operational principles:
- Portability: users can export key training data.
- Auditability: major behavior changes are tied to versioned code and docs.
- Reversibility: recommendations and rule updates are rollback-capable via version control.
- Graceful degradation: if one component fails, core training should still run in reduced mode.

## 9) Open Methods, Protected Execution

We follow: **open methods, protected execution**.

### Open (for trust and auditability)
- Decision-flow families and sequencing logic
- Input/output schema categories
- Safety and fallback principles
- Local-first data handling model

### Protected (for protocol integrity and anti-gaming)
- Full threshold tables and exact coefficient sets
- Full sequencing constants and anti-gaming heuristics
- Proprietary coaching scripts and premium execution playbooks

Rationale:
- Users and reviewers should understand what drives recommendations.
- Protocol quality should not collapse into easy gaming or shallow replication.

## 10) Claims and Safety Policy

This app supports training, research, and education.

It is not medical treatment and should not be used as a diagnostic system.  
If users are concerned about health or mental health symptoms, they should consult a qualified clinician/GP.

## 11) Human Oversight and Change Governance

For sensitive or high-impact changes:
- use explicit code review
- keep clear changelogs
- retain rollback paths
- prefer conservative release behavior when uncertainty is high

This keeps ethics and reliability enforced through workflow, not slogans.

## 12) Contact and Accountability

If you identify issues in transparency, safety, or misleading claims:
- open a GitHub issue with reproducible details
- include expected vs observed behavior
- include app version/commit if possible

We treat these as quality and trust defects, not just UX feedback.

