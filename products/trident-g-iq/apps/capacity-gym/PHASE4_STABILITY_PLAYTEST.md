# Capacity Gym Phase 4 Stability + Balancing Playtest Matrix

Purpose:
- validate progression stability before brand-wide styling work,
- tune copy/values only (no architecture/layout redesign in this phase).

## Test setup
1. Serve `stage1/` locally:
   - `cd products/trident-g-iq/apps/capacity-gym/stage1`
   - `python -m http.server 8080`
2. Open `http://localhost:8080/`
3. Use clean state for baseline:
   - Settings -> Reset Local Data

## Matrix

### A) First-run and reset flow
1. Fresh run after reset:
- Expected: mission exists for today, Hub available, Relational locked.
2. Hard refresh:
- Expected: same state persists.
3. Reset again:
- Expected: history cleared, progression reset, no stale mission/reward carryover.

### B) Unlock path (history-derived)
1. Run/prepare non-qualifying hub session:
- Expected: unlock remains locked.
2. Achieve qualifying `hub_cat` evidence only:
- Expected: checklist updates (`hub_cat` complete, `hub_noncat` pending), relational still locked.
3. Achieve qualifying `hub_noncat` evidence:
- Expected: relational unlock becomes available.
4. Mixed-wrapper coach swap session:
- Expected: qualification uses baseline wrapper only; no false qualification from swapped blocks.

### C) Mission tier/day policy
1. Before unlock:
- Expected: Tier 0 mission shape (`control` only).
2. Unlock before any session start that day:
- Expected: Tier 1 can apply same day.
3. Start a session first, then unlock later same day:
- Expected: mission shape does not change until tomorrow.
4. Verify once/day reward:
- Expected: mission +3 applied once only for date key.

### D) Streak behavior
1. Complete mission on day N and day N+1:
- Expected: streak increments.
2. Skip one day, complete on day N+2:
- Expected: streak continues via grace.
3. Skip two or more days:
- Expected: streak resets.

### E) Coach override and visibility
1. Reach TUNE or SPIKE_TUNE block-result:
- Expected: `Accept Coach` + `Try Alternative` controls shown.
2. Create last-2 conflict for alternatives:
- Expected: alternative disabled with "optimal right now" message.
3. Confirm notices across states:
- Expected notice text for RECOVER/STABILISE/TUNE/SPIKE_TUNE/CONSOLIDATE.

### F) Economy and feedback
1. Validate block units:
- UP +2, HOLD +1, DOWN +0.
2. Validate session summary progression delta:
- bank total updates correctly.
3. Clean signals:
- per-block clean badge appears for `errorBursts==0 && lapseCount==0`,
- "All Blocks Clean" appears only as prestige note (+0).

### G) Regression smoke checks
1. Hub block run:
- timing/scoring/lure/N-adaptation unchanged.
2. Relational block run:
- strict MATCH-only go/no-go preserved.
3. History/export:
- summaries persist after refresh/export.

## Balancing notes (copy and numbers only)
- Tune wording for clarity:
  - keep action thresholds explicit (`>=75%` for HOLD, `>=90%` for N-up).
- Do not change core mechanics in this phase:
  - no timing, scoring, lure, or adaptation rule changes.

## Report format
For each section A-G:
- `PASS` or `FAIL`
- short evidence line
- file pointer if bug found

