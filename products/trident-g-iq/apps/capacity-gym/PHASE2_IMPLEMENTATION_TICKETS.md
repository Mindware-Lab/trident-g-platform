# Capacity Gym Phase 2 Implementation Tickets (MVP Progression)

This backlog operationalizes `GAME_DESIGN_CONTRACT.md` for rapid implementation with placeholder UI.

Scope guard:
- Keep Hub and Relational core mechanics unchanged.
- Implement progression behavior, visibility, and QA hardening only.

## Delivery order
1. Unlock engine and runtime guards
2. Mission and streak engine
3. Session completion integration
4. Coach notice/override UX hardening
5. Competence feedback and prestige notes
6. Acceptance QA sweep

## Ticket P2-01 - Unlock derivation and hard gating
Priority: P0  
Estimate: 25 min  
Dependencies: none

Goal:
- Relational lock is enforced in UI and handler.
- Unlock is derived from history and synced to unlock flags.

Acceptance:
1. Relational buttons disabled when locked.
2. Direct handler call still blocks start when locked.
3. Unlock flips only when both hub wrappers qualify by rule.

## Ticket P2-02 - Wrapper-safe qualification logic
Priority: P0  
Estimate: 20 min  
Dependencies: P2-01

Goal:
- Qualifying evidence is robust when coach swaps wrappers mid-session.

Rule:
- Baseline wrapper is `blocksPlanned[0].wrapper`.
- Only baseline-wrapper blocks count for that session qualification.
- Thresholds:
  - final baseline-wrapper `nEnd >= 3`
  - at least 3 baseline-wrapper blocks with `nStart >= 3` and `accuracy >= 0.75`

Acceptance:
1. Mixed-wrapper session does not falsely qualify the other wrapper.
2. Qualifying and non-qualifying edge cases pass manual checks.

## Ticket P2-03 - Mission tier engine and day-shape policy
Priority: P0  
Estimate: 30 min  
Dependencies: P2-01

Goal:
- Tier 0 and Tier 1 missions are deterministic and day-consistent.

Rules:
- Tier 0: `["control"]`
- Tier 1: `["reset","control","reason"]`
- Mid-day unlock:
  - if no session started today, Tier 1 may apply today
  - otherwise keep today's shape, switch tomorrow

Acceptance:
1. Tier generation matches unlock/day-start policy.
2. Tier 1 steps update correctly from actual session flow.
3. Mission reward applies once/day only.

## Ticket P2-04 - Streak engine (calendar-day logic)
Priority: P0  
Estimate: 15 min  
Dependencies: P2-03

Goal:
- Streak uses date-key day diff, not rolling 24-hour windows.

Rules:
- day diff 1: continue
- day diff 2: continue with grace
- day diff >= 3: reset

Acceptance:
1. Day-diff edge cases behave deterministically.
2. Current and best streak persist across refresh.

## Ticket P2-05 - Session completion progression apply-once path
Priority: P0  
Estimate: 25 min  
Dependencies: P2-01, P2-03, P2-04

Goal:
- One completion pipeline applies units, mission, streak, unlock sync once per completed session.

Rules:
- Units by outcome band only:
  - `UP +2`, `HOLD +1`, `DOWN +0`
- Mission bonus:
  - `+3` once/day on mission completion

Acceptance:
1. Session completion updates all progression fields exactly once.
2. No hidden telemetry gates alter economy.

## Ticket P2-06 - Coach notices and override controls (Hub)
Priority: P1  
Estimate: 20 min  
Dependencies: P2-05

Goal:
- Coach actions are visible and override behavior is constrained.

Rules:
- Show notices for:
  - `RECOVER`, `STABILISE`, `TUNE`, `SPIKE_TUNE`, `CONSOLIDATE`
- Override shown only for `TUNE`/`SPIKE_TUNE`.
- Alternative valid only if last-2 constraints allow:
  - no recent speed pulse for speed alternative
  - no recent interference pulse for interference alternative
  - no recent swap probe for wrapper-swap alternative

Acceptance:
1. Invalid alternative path is disabled with explanatory message.
2. `flags.userOverride` persists as `"coach"` or `"alternative"`.
3. Override does not alter scoring or unlock logic.

## Ticket P2-07 - Competence feedback and prestige note
Priority: P1  
Estimate: 15 min  
Dependencies: P2-05

Goal:
- Add lightweight informational feedback without false precision.

Rules:
- Show threshold wording:
  - `Next block targets: >=75% for HOLD, >=90% to advance N.`
- Per-block clean badge:
  - `errorBursts == 0 && lapseCount == 0`
- Session note:
  - `All Blocks Clean` prestige only (`+0` units)

Acceptance:
1. Copy appears in block/session result views.
2. Prestige note has zero economy effect.

## Ticket P2-08 - Data contract safety and migration tolerance
Priority: P1  
Estimate: 20 min  
Dependencies: P2-03, P2-05

Goal:
- Keep storage backward-safe and contract-stable.

Required fields:
- `missionsByDate[date]` canonical:
  - `steps`, `completedSteps`, `rewardClaimed`
- additive:
  - `tier`, `completedStepIds`, `hasSessionStarted`
- settings:
  - `streakCurrent`, `streakBest`, `lastMissionCompletedDate`

Acceptance:
1. `completedSteps` remains synchronized with completed step IDs.
2. Reload after reset/import preserves valid progression state.

## Ticket P2-09 - Manual QA sweep (contract pass/fail)
Priority: P0  
Estimate: 15 min  
Dependencies: P2-01 through P2-08

Run:
1. Relational lock bypass attempt (UI and handler).
2. Wrapper qualification edge cases.
3. Mid-day unlock mission shape policy.
4. Once/day mission reward.
5. Streak day-diff cases.
6. Coach override validity constraints.
7. All Blocks Clean zero-impact check.
8. Refresh persistence checks.

Output:
- PASS/FAIL list with defect notes and file pointers.

