# Kastel Stack Workspace Mapping (Wellness)

Use the existing shared `kastel-stack` backend. Do not create a second stack at this stage.

## Workspace Model

Recommended records:

1. `workspace_id = wellness_sa`
   - lanes: `longevity_sa`, `corporate_sa`
2. `workspace_id = wellness_global` (optional later)
   - lane: `longevity_global`

## Domain Allocation (Wave 1)

1. D1 Audience and Demand
   - lead capture, lead scoring, offer routing
2. D2 Commerce and Entitlements
   - checkout verify, entitlement grant, mismatch reconcile
3. D3 Delivery and Coaching
   - onboarding, coaching credits, booking/reminders, retention trigger
4. D4 Outcomes and Evidence
   - weekly founder KPI snapshot and evidence rollup

## Required Contracts

1. `LeadQualified.v1`
2. `PurchaseVerified.v1`
3. `EntitlementsGranted.v1`
4. `AccessMismatchDetected.v1`
5. `CustomerActivated.v1`
6. `SessionCompleted.v1`
7. `RetentionRiskDetected.v1`
8. `OutcomeSnapshotRecorded.v1`

## Governance Defaults

1. `Draft-for-approval` for customer-facing outputs.
2. `Escalate` for money/legal/high-claim actions.
3. `Auto-run` only for low-risk, reversible operations.

## SEO Agent Module

SEO automation for IQMindware now lives in:

- `products/trident-g-wellness/integration/kastel-stack/seo-agent/`

This module is review-gated and designed for:

1. weekly search/performance snapshot collection
2. keyword opportunity scoring by page intent
3. AI-assisted recommendations written to PR artifacts
