# G Tracker Evidence Battery Protocol

Version: v1.0 (public protocol)
Date: 2026-03-06
Owner: Mindware Lab (Trident G IQ)

## 1) Purpose and scope

G Tracker is a local-first cognitive evidence battery for repeated measurement across a training or performance cycle.

It is an assessment protocol, not a training intervention. It is non-clinical and not intended for diagnosis, treatment, or high-stakes selection decisions.

## 2) Battery architecture

The battery is designed as three layers:

1. Pre/post outcome checks (baseline and follow-up comparisons)
2. Repeatable trackers (weekly/fortnightly trajectory monitoring)
3. Optional external benchmark checks

This architecture is intended to separate signal from one-off test noise and avoid reliance on in-app game scores as sole evidence.

## 3) Measurement layers and constructs

### 3.1 Reasoning capacity layer

- `SgS-12 A/B` short-form reasoning checks (Form A baseline, Form B follow-up).
- Construct target: practical fluid-reasoning snapshot (pattern/rule inference under novelty).

### 3.2 Applied cognition and resilience layer

- `Psi-CBS Core` (applied cognitive bandwidth)
- `Psi-CBS-AD` optional supplementary module (state-instability/allostatic pressure markers)
- `Psi-CBS-AI` optional supplementary module (AI-use impact on cognitive quality)
- `CRS-10` (cognitive resilience under pressure)
- `EDHS A/B` (everyday decision-habit profile, baseline/follow-up)

### 3.3 Optional external benchmark layer

- Optional Mensa online matrix benchmark (external reference only, not internal validity anchor).

## 4) Validation status registry (public summary)

Status labels used in this protocol:

- `published_foundation`: evidence exists in published sources or established item-bank psychometrics relevant to the measure foundation.
- `published_summary`: practical summary evidence is available for deployment-level use with caveats.
- `in_testing`: pilot/research-informed with ongoing validation work.
- `external_reference`: external test not claimed as internally validated by this battery protocol.

Current module status:

| Module | Construct | Status | Public summary |
|---|---|---|---|
| SgS-12 A/B | Brief fluid reasoning snapshot | published_foundation | Built from public-domain ICAR item families (including matrix, verbal, series, and R3D item types) with published psychometrics; interpreted as short tracking form, not definitive IQ estimate. |
| CRS-10 | Cognitive resilience under pressure | published_summary | Used across multiple samples with reported single-factor structure and good reliability in translated validation reporting; still interpreted as non-clinical self-report. |
| Psi-CBS (Core/AD/AI) | Applied cognitive bandwidth and related markers | in_testing | Pilot evidence supports intended structure and internal consistency; larger-sample validation remains in progress. |
| EDHS A/B | Everyday decision habits | in_testing | Research-informed design adapted from established decision/planning literatures; formal psychometric validation is ongoing. |
| Mensa online benchmark (optional) | External matrix benchmark | external_reference | Useful external comparator when used, but not an internal G Tracker validity claim. |

## 5) Distinction from in-app performance metrics

G Tracker is intentionally positioned as a battery-level evidence layer, not a direct proxy of in-app performance scores.

Key distinctions:

- Uses structured pre/post forms and repeatable cadence rather than only session-game outcomes.
- Combines objective-style reasoning snapshots with applied/resilience/decision self-report markers.
- Surfaces explicit caveats and status labels per measure.
- Supports trend interpretation (up/stable/down/noisy) instead of single-score overclaiming.

## 6) Scoring and interpretation families

The battery reports practical tracking outputs:

- baseline vs follow-up deltas for pre/post measures,
- repeated trend trajectories for cadence measures,
- confidence-aware caveat framing where validation is still in testing.

Interpretation posture is conservative:

- practical signal for self-tracking/program evaluation,
- not clinical inference,
- not high-stakes certification.

## 7) Validation and replication policy

Mindware Lab encourages independent validation and conceptual replication studies of this battery's modules, especially for in-testing measures.

Replication priorities:

- convergent/discriminant validity against relevant comparators,
- test-retest stability under realistic repeat intervals,
- sensitivity to change in intervention contexts,
- robustness of trend interpretation under routine variability.

### 7.1 Copyright and licensing posture

- Mindware-authored modules in this battery (for example Psi-CBS and EDHS) are not tied to closed commercial test-publisher licensing constraints that block independent validation research.
- Independent validation studies are encouraged, with clear citation, transparent methods, and non-clinical claims boundaries.
- Third-party item sources must follow their own terms:
  - ICAR/public-domain item families where used by SgS-12.
  - OMIB/OSF licensing terms where OMIB assets are used.
  - Mensa benchmark remains external and under Mensa terms.

## 8) Data, auditability, and export posture

Default posture is local-first:

- no account required for core battery use,
- session results stored locally,
- export/reset controls for user-controlled audit trail.

Public reporting posture:

- aggregated summaries only,
- no raw personal logs exposed publicly.

## 9) Open methods, protected execution

### 9.1 Published openly

- battery architecture and cadence logic,
- construct-to-module mapping,
- module-level validation status labels and caveats,
- scoring/interpretation families,
- data categories and local-first privacy posture.

### 9.2 Protected for integrity

- exact item-selection seeds and anti-gaming controls,
- implementation-level randomisation and scoring constants,
- proprietary UI/flow heuristics not required for conceptual replication.

This boundary is open methods, protected execution: sufficient detail for scientific scrutiny without exposing exploit paths.

## 10) Claims boundaries

Allowed posture:

- designed for repeated cognitive outcome tracking,
- validity status is module-specific and explicitly declared,
- in-testing modules are clearly identified as ongoing validation.

Not allowed:

- blanket "fully validated battery" claim across all modules,
- diagnosis/treatment claims,
- guaranteed IQ or performance outcomes.

## 11) Changelog

- 2026-03-06: v1.0 initial canonical public battery protocol publication.

## 12) Related documents

- `README-GT.md` (battery overview)
- `VALIDITY-GT.md` (working validation summaries per module)
- `MARKET-GT.md` (positioning and safe-claims framing)
- `../README.md` (app-level overview)
