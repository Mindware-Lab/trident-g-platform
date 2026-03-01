# Capacity Gym Game Design Contract (MVP)

## Purpose
This document locks the game-design layer for the current MVP pass so implementation can move fast without drifting from SPEC and coach contracts.

It defines:
- the core player loop,
- deterministic progression rules,
- state and telemetry contracts,
- anti-friction rules,
- phase acceptance criteria.

If this document conflicts with `SPEC.md`, `SPEC.md` is authoritative. If this document conflicts with coach behavior, `COACH_RULES.md` and `RELATIONAL_COACH_RULES.md` are authoritative.

## 1) Core Loop (MVP)
1. Player opens Home/Today and sees:
- recommended entry point,
- mission progress,
- bank units,
- unlock checklist/status.
2. Player starts a session (Hub or unlocked Relational mode).
3. Session runs 10 blocks with coach routing applied block-to-block.
4. Player receives block feedback:
- canonical scoring summary,
- coach action notice (when applicable),
- clean-control badge (when applicable).
5. Session ends and progression is applied once:
- block-band units,
- mission step updates,
- mission bonus if completed,
- streak update,
- unlock re-derivation and sync.
6. Session summary persists to history and appears after refresh.

## 2) Deterministic Economy
### 2.1 Unit awards
- `UP` block: `+2`
- `HOLD` block: `+1`
- `DOWN` block: `+0`

No random multipliers, no hidden adjustments, no pay-to-win modifiers.

### 2.2 Mission bonus
- `+3` units when the daily mission becomes complete.
- Awarded once per day only.

### 2.3 Prestige note
- "All Blocks Clean" is visual recognition only.
- Adds `+0` units.

## 3) Progression Gates
### 3.1 Relational unlock source of truth
- Derive unlock from history, not manual toggles:
  - `relationalUnlocked = catQualified && noncatQualified`
- Sync derived result to:
  - `unlocks.transitive`
  - `unlocks.graph`
  - `unlocks.propositional`
- Sync happens on app load and on each session completion.

### 3.2 Qualifying wrapper session rule (swap-safe)
- Baseline wrapper = `blocksPlanned[0].wrapper`.
- Qualification counts only blocks matching that baseline wrapper.
- Qualifying session requires:
  - final baseline-wrapper block has `nEnd >= 3`
  - at least 3 baseline-wrapper blocks with:
    - `nStart >= 3`
    - `accuracy >= 0.75` (HOLD or UP band)

## 4) Missions and Streaks
### 4.1 Mission tiers
- Tier 0 steps: `["control"]`
  - complete one Hub session today.
- Tier 1 steps: `["reset", "control", "reason"]`
  - `reset`: first trial starts today,
  - `control`: one Hub session completed today,
  - `reason`: one Relational session completed today.

### 4.2 Mid-day unlock policy
- If Relational unlocks mid-day and no session has started yet today:
  - Tier 1 may apply today.
- If any session already started today:
  - keep today's mission shape unchanged,
  - Tier 1 begins tomorrow.

### 4.3 Streak rule
Use calendar-day difference:
- day diff `1`: continue streak,
- day diff `2`: continue via grace day,
- day diff `>= 3`: reset streak.

## 5) Coach Interaction Rules (MVP)
### 5.1 Notices
Coach notices must reflect actual routed action. At minimum:
- `RECOVER`
- `STABILISE`
- `TUNE`
- `SPIKE_TUNE`
- `CONSOLIDATE`

### 5.2 User override (Hub only)
Shown only when next coach state is `TUNE` or `SPIKE_TUNE`:
- `Accept Coach`
- `Try Alternative` (only if valid)

Persist in plan flags:
- `userOverride: "coach" | "alternative"`

### 5.3 Alternative validity constraints
Evaluate last 2 completed blocks:
- speed alternative valid only if no recent speed pulse,
- interference alternative valid only if no recent interference pulse,
- wrapper-swap alternative valid only if no recent swap probe.

If none valid:
- disable alternative button,
- show "Coach recommendation is optimal right now."

## 6) Anti-Friction Rules
1. Runtime guards are authoritative (UI disabled is not enough).
2. One logical action per click target:
- prevent duplicate submissions where state should be single-fire.
3. Controls reflect effective plan when coach override is active.
4. Messages are action-oriented:
- use thresholds (`>=75%`, `>=90%`), avoid false precision.
5. No blocking modal walls for routine progression events.

## 7) Data and Telemetry Contract (MVP)
### 7.1 Storage root (`tg_capacity_gym_v1`)
Must remain backward-safe with additive fields only.

Core progression fields:
- `bankUnits: number`
- `unlocks: { hub_noncat, transitive, graph, propositional }`
- `missionsByDate[dateKey]:`
  - `steps: string[]`
  - `completedSteps: number`
  - `rewardClaimed: boolean`
  - additive: `tier`, `completedStepIds`, `hasSessionStarted`
- `settings:`
  - `streakCurrent`
  - `streakBest`
  - `lastMissionCompletedDate`

### 7.2 Session summary usage
Progression uses stored session and block summaries only.
Do not gate economy on hidden transient values.

### 7.3 Invariants
1. Unlock booleans for relational modes must equal derived history result after sync.
2. `completedSteps` must match bounded completed step IDs.
3. Mission bonus must never be awarded more than once for same date key.
4. Coach override metadata must not alter canonical scoring rules.

## 8) Implementation Phases and Exit Criteria
### Phase A - Design and Contracts
Exit when:
- this contract is published,
- SPEC cross-references are consistent,
- invariants are explicit.

### Phase B - Behavior with Placeholder UI
Exit when:
- unlock guard and checklist work,
- missions/streaks update correctly,
- coach notices and override controls work to contract,
- session completion applies deterministic units/bonus once.

### Phase C - Brand System Pass
Exit when:
- typography/color/spacing/components are unified,
- no behavior or contract regressions.

### Phase D - UX + Balance Polish
Exit when:
- feedback copy is clear in live play,
- reward pacing feels coherent across 10-block sessions,
- no contradictions between displayed settings and effective block plan.

## 9) Acceptance Checklist (for this roadmap)
1. Relational start blocked in UI and handler when locked.
2. Unlock checklist changes only from qualifying evidence in history.
3. Mixed-wrapper Hub session qualifies by baseline wrapper rule only.
4. Tier 0/Tier 1 missions follow day-shape policy exactly.
5. Mission reward applies once/day only.
6. Streak changes follow day diff (1, 2 with grace, >=3 reset).
7. Coach notice text reflects routed action state.
8. Alternative override disabled when last-2 constraints fail.
9. All Blocks Clean note appears with zero economy impact.
10. Refresh preserves all progression and mission state.

