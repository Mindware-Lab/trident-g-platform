---
Version: v1.1
Date: 2026-03-06
Owner: Mindware Lab (Trident G IQ)
Status: Public protocol publication
Scope: Transfer-invariance training protocol for capacity and control under changed conditions
"Claims boundary": Training/education protocol; far transfer is tested and tracked, not guaranteed
---

# Capacity Gym Transfer Invariance Protocol

## 1) Purpose and scope

Capacity Gym is a cognitive training protocol designed to improve control quality under load and test whether gains carry over beyond the exact practiced wrapper.

## 2) Intervention architecture

- Program horizon: approximately 24 sessions
- Session unit: guided 10-block sessions
- Training families:
  - Hub n-back variants
  - Relational n-back variants (graph/transitive/propositional)
- Session styles: Build, Explore, Stabilise, Switch test, Later check, Reset day

## 3) Core design principles

- Thin automation control (avoid wrapper-only gains)
- Canonical matching principle (meaning/relation before surface)
- One-dial perturbation principle
- Stability-before-escalation principle

## 4) Decision-flow families

1. Route poor-quality blocks to recovery
2. Route breakthroughs to consolidation
3. At plateau, apply one constrained perturbation
4. Evaluate hold/partial hold/collapse under challenge
5. Promote/revert based on outcome
6. Schedule delayed re-checks for durability

## 5) Transfer testing protocol

- Immediate robustness test via game swap under matched demand
- Controlled perturbation test at stable plateau
- Delayed hold test after time gap
- Optional mission bridge logging for real-world carryover checks

## 6) Observables (public categories)

- Block-level quality/performance categories
- Session-level adaptation and probe outcomes
- Longitudinal trajectory and re-check pass/fail patterns

## 7) Open vs protected

Open:
- Constructs, architecture, decision families, transfer-check families, evidence labels

Protected:
- Full threshold tables, anti-gaming constants, proprietary sequencing coefficients

## 8) Claims boundary

Allowed:
- Designed to support transferable cognitive skill
- Carryover is tested under changed conditions

Not allowed:
- Guaranteed far transfer
- Guaranteed IQ-point increases
- Clinical diagnosis/treatment claims

## 9) Related governance

- `../../governance/ETHICS_AND_ALGORITHMIC_TRANSPARENCY.md`
- `../../governance/CLAIMS_AND_SAFETY.md`
- `../../governance/DATA_PUBLICATION_POLICY.md`
