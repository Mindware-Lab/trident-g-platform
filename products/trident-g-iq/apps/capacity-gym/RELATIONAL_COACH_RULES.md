## Relational Coach v1 Spec (Stage 4)

### Goal

Apply far-transfer coaching principles (stability → controlled perturbation → consolidate) to **relational n-back** sessions without increasing complexity or destabilising user experience.

### Non-negotiables

1. **Single-mode per session**
   A relational session runs **one mode only**: `transitive` *or* `graph` *or* `propositional`. No mode switching within a 10-block session.

2. **N cap remains**
   Relational `N ∈ {1,2,3}` with `N_MAX = 3`.

3. **Go/no-go lapse semantics**
   Relational trials are MATCH-only.
   `lapseCount` counts **match omissions only** (response-required timeouts). Correct rejections are not lapses.

4. **Minimal dials (v1)**
   Relational Coach v1 does **not** schedule speed/interference pulses.
   It only steers:

* `n` (via existing 90/75 rule)
* optional **stabilisation routing** (`RECOVER` / `STABILISE`) when a block is messy
* **session-to-session mode selection** (see §6)

---

## 1) Per-block signals (computed from `BlockResult`)

Use these signals after each block:

* `outcomeBand`:

  * `UP` if `accuracy >= 0.90`
  * `DOWN` if `accuracy < 0.75`
  * else `HOLD`
* `messy` if any of:

  * `lapseCount > 0`, or
  * `errorBursts >= 2`, or
  * `accuracy < 0.70`
* `stable` if:

  * `outcomeBand in {UP,HOLD}` AND `lapseCount == 0` AND `errorBursts <= 1`

**Plateau detector (relational)**
Trigger plateau if the last **3** blocks are `HOLD`, none are `DOWN`, and the mode is unchanged (always true within-session).
(If this is too rare at N=1–2, you may reduce to last **2** blocks HOLD in a later tuning pass.)

---

## 2) Per-block routing (next block only)

Relational blocks already adapt `n` with the 90/75 rule. Coach v1 adds only *stability routing*:

### Rule R1 — Messy → RECOVER (override)

If `messy == true`, schedule next block as:

* `coachState = "RECOVER"`
* `nNext = max(nEnd - 1, 1)` (floor at 1)
* Keep `wrapper = current relational mode` (no mode swap)
* Keep other controls at defaults (`speed="slow"`, `interference="low"` if those fields exist but are not surfaced)

After one RECOVER block:

* If still messy → RECOVER again
* Else → schedule one `STABILISE` block:

  * `coachState="STABILISE"`
  * `nNext = nEnd` (hold)
  * defaults as above

### Rule R2 — Spike → CONSOLIDATE (lightweight)

Define a spike as: `outcomeBand == "UP"` and `nEnd > nStart`.

When a spike occurs:

* set `coachState = "CONSOLIDATE"` for the **next 1 session** (session-level flag)
* within the session, do not introduce new perturbations (none exist in v1)
* allow the standard 90/75 `n` adaptation to run normally

(This is mainly for telemetry and future expansion.)

### Rule R3 — Otherwise: normal progression

If not messy:

* run standard 90/75 `n` adaptation unchanged
* `coachState` can be `"TUNE"` or `null`

---

## 3) BlockPlan annotations (required)

For every relational block, write these to `BlockPlan.flags`:

* `coachState`: `"RECOVER" | "STABILISE" | "TUNE" | "CONSOLIDATE" | null`
* `pulseType`: always `null` in v1
* `swapSegment`: always `null` in v1
* `wasSwapProbe`: always `false` in v1

These are authoritative for audit and History drill-down.

---

## 4) UI/UX (minimal)

* Show the same small coach notice banner used in Hub when `coachState` is not null:

  * “Recovery block scheduled”, “Stabilise next”, etc.
* Do not expose mode switching within session.
* Keep relational sessions feeling consistent and learnable.

---

## 5) Session summaries (for switching logic)

Maintain per-mode session-level rollups (can be computed from `SessionSummary.blocks[]`):

Per session:

* `mode` (`transitive|graph|propositional`)
* `nMaxReached`
* `meanAccuracy`
* `quizTotalCorrect` (sum quizCorrect across 10 blocks; total items = 20)
* `messyBlockCount` (count blocks where `messy == true`)
* `plateauSeen` (true/false)

These can be computed on save and stored in summary or derived on load.

---

## 6) Session-to-session mode switching (evidence-driven)

Mode switching happens **between sessions**, not within.

### Rule S1 — Do not switch when messy

If the last relational session had:

* `messyBlockCount >= 2` **or**
* `meanAccuracy < 0.75`
  → next relational session stays on the **same mode** (re-entry), start at `n = max(lastN - 1, 1)` with defaults.

### Rule S2 — Promote within mode (rare but supported)

If (within the last session) the user achieved:

* at least **2 blocks** at `N=2` with `accuracy >= 0.90` **and** `quizCorrect >= 1` (out of 2)
  → allow the *next session* to attempt `N=3` for that mode (still capped at 3).

(If they fall back, revert naturally via 90/75.)

### Rule S3 — Switch mode on stable plateau

If the user has plateaued stably at `N=2` for **two sessions** in the same mode, where each session meets:

* `meanAccuracy in [0.75..0.89]`
* `messyBlockCount == 0`
* quiz improving or steady (`quizTotalCorrect` not decreasing)
  → schedule next relational session as a **different mode** (representational swap) at `N=2` (or `N=1` if cautious).

Mode rotation suggestion: `transitive → graph → propositional → transitive`.

### Rule S4 — Weekly cadence alternative (optional, simpler)

Instead of evidence-driven switching, optionally use a fixed cadence:

* 2 sessions Transitive
* 2 sessions Graph
* 2 sessions Propositional
* repeat

(This can be offered as a “Structured rotation” setting later.)

---

## 7) Implementation scope

For Stage 4:

* Implement **R1 + BlockPlan.flags + coach banner** for relational.
* Defer S1–S4 mode switching automation until you add a “next session recommendation” UI (or a small planner).
