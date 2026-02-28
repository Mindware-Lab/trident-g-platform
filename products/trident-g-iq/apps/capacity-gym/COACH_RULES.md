

# Capacity Gym — Coach Rules v1.1 (SPEC-consistent)

This document captures the **Coach decision rules** for Capacity Gym in an implementation-ready form.
It is intended to stay consistent with the Capacity Gym **SPEC** while supporting the Trident-G far-transfer “Spike-Tune” logic (plateau → perturb → selection → consolidate).

## Non-negotiables (from SPEC + implementation constraints)

- **Next-block-only updates:** the Coach may only change what happens on the *next* block, based on completed block results.
- **One dial at a time:** the Coach should normally change **one** of: `n`, `speed`, `interference`, or `wrapper`.
- **Recovery override:** when the session becomes **messy** (out-of-band proxy), the Coach may apply a multi-dial recovery block (see Rule 1).
- **`lapseCount` definition:** treat a lapse as **no valid response by SOA end** (timeout).
- **Wrapper lock must not exist:** the runtime must allow **block-level wrapper changes** so swap probes (A→B→A) are possible.

---

## Coach decision rules (implementable, SPEC-consistent)

### 0) Signals the Coach reads (all already in `BlockResult`)

Use these per block:

- `outcomeBand`: `UP / HOLD / DOWN` from accuracy bands (≥ .90 / .75–.89 / < .75).
- `messy`: a conservative out-of-band proxy using **any** of:
  - `lapseCount > 0`, **or**
  - `errorBursts >= 2`, **or**
  - `accuracy < 0.70`.
- `stable`: `outcomeBand ∈ {UP, HOLD}` AND `lapseCount == 0` AND `errorBursts <= 1`.
- (Hub only) `lureFA`: if available, `faOnLures / max(1, lureTrials)` (do **not** gate rewards with this, but it may be used for routing).

These definitions enact the Ψ-gate behaviour without requiring a separate “state” measure.

---

### 1) Non-negotiable routing (runs first after every block)

#### Rule 1 — Messy → RECOVER

If `messy == true`:

- Next block plan (**recovery override**, can change multiple dials):
  - `coachState = "RECOVER"`
  - `speed = "slow"`
  - `interference = "low"`
  - `n = max(nEnd - 1, 1)`
  - `wrapper = "hub_cat"` (if Hub) or **current wrapper** (if Relational)
- After one RECOVER block:
  - If still messy → RECOVER again
  - Else → `STABILISE` for 1 block (slow + low, hold N)

This implements “do not learn from noisy error signals”.

#### Rule 2 — Spike → CONSOLIDATE

Trigger a spike if either:

- `outcomeBand == "UP"` **and** `nEnd > nStart`, **or**
- user marks a `click` event (optional flag + note)

Then:

- set `consolidateCountdownSessions = 1..3` (**sessions**, not blocks)
- during CONSOLIDATE:
  - no wrapper swaps
  - no pulses (no speed/interference flips)
  - keep difficulty moderate (start slow + low; only let N move via the 90/75 rule)

This protects the “fragile / labile” phase after a reconfiguration.

---

### 2) Plateau / piecewise curve rules (the “Spike-Tune engine”)

#### Rule 3 — Plateau detector (SPEC)

Plateau triggers if:

- the last **3** blocks are `HOLD`, none are `DOWN`, **and**
- `wrapper`, `speed`, and `interference` were unchanged across those 3 blocks.

#### Rule 4 — Plateau routing (one dial at a time)

When plateau triggers, choose **exactly one** of the following for the *next* block:

1) **Interference pulse (preferred first)**  
If `interference == "low"` and you have not pulsed interference in the last ~2 blocks:
- set next block: `interference = "high"` (keep wrapper/speed/N fixed)
- flag: `pulseType = "interference"`, `coachState = "TUNE"`

2) **Speed pulse**  
Else if `speed == "slow"` and speed was not pulsed recently:
- set next block: `speed = "fast"` (keep wrapper/interference/N fixed)
- flag: `pulseType = "speed"`, `coachState = "TUNE"`

3) **Wrapper swap probe**  
Else:
- set next block: `wrapper = otherWrapperInFamily` (Hub: `hub_cat ↔ hub_noncat`)
- keep speed/interference/N fixed
- flag: `coachState = "SPIKE_TUNE"`, `swapSegment = "B"` (and mark the previous stable segment as `"A"`)

This implements “plateau → raise constraint or inject controlled entropy” while remaining mechanical and auditable.

---

### 3) How to respond to a pulse/swap result (selection pressure)

#### Rule 5 — Pulse evaluation

After a pulse block (speed or interference):

- If `stable`:
  - promote that dial as baseline for the remainder of the session, **or**
  - schedule one more pulse block (same dial) to confirm.
- If `DOWN` but **not** messy:
  - treat as a **labile transition**: revert to baseline for 1–2 blocks (`STABILISE`), then re-try the pulse later.
- If `messy`:
  - fall back to RECOVER (Rule 1).

#### Rule 6 — Wrapper swap evaluation (“swap cost”)

Define swap outcome:

- `swapFail` if the swap block is `DOWN` **or** becomes `messy`.
- `swapPass` if the swap block is `stable`.

Routing:

- If `swapPass`:
  - return to the original wrapper next block (A→B→A sandwich), **or**
  - keep B as baseline if you explicitly want more novelty.
- If `swapFail` but not messy:
  - treat as “thin automation exposed”: return to wrapper A and run 1–2 `STABILISE` blocks, then do a *nearer* swap later (same family, same speed/interference).
- If `swapFail` and messy:
  - RECOVER.

This is “select for invariance under transformation” in a form that can be implemented immediately.

---

### 4) “Efficiency plateau” drill-down (when N is stuck but control is getting cleaner)

#### Rule 7 — Efficiency plateau trigger

If over the last 3–5 blocks:

- `n` is unchanged (no UP), **and**
- outcomes are HOLD (no DOWN), **and**
- either `errorBursts` trend down **or** `meanRtMs` trends down (optional)

Then route as Plateau (Rule 4), but prefer:

1) speed pulse (fast), then  
2) interference pulse (high), then  
3) wrapper swap.

Mechanistically: “same N, tighter policy” (squeeze cost/variance before attempting a climb).

---

## Session-to-session rules (24-day programme; 3–5 transitions)

### A) Default weekly rhythm (simple, robust)

- **2–3 sessions Exploit:** keep wrapper stable, let N adapt, avoid pulses unless plateau triggers.
- **1 session Perturb:** do **one** swap probe **or** **one** pulse (whichever you did least recently).
- **1–2 sessions Capture:** if you saw a spike or a clean swapPass, run CONSOLIDATE (no swaps/pulses).

Repeat. This naturally produces multiple piecewise learning curves across ~24 days.

### B) When to switch “game family” (Hub ↔ Relational)

For MVP, remain SPEC-faithful:

- sessions are either `wrapperFamily = "hub"` or `"relational"` (do not mix within a session yet).
- unlock Relational when the SPEC unlock condition is met (e.g., `N >= 3` stability across both Hub wrappers).

Then:

- if Relational is unlocked and Hub swap cost is low (swapPass is common), schedule **Relational sessions 1–2×/week** as the next “farther swap radius” (different representational format, same control principles).

---

## Suggested telemetry (additive; no schema bump)

Recommended additive fields (optional but helpful for debugging and history drill-down):

### Per block (`BlockResult`)
- `coachState`: `"RECOVER" | "STABILISE" | "TUNE" | "SPIKE_TUNE" | "CONSOLIDATE"`
- `pulseType`: `"speed" | "interference" | null`
- `swapSegment`: `"A" | "B" | null`
- `wasSwapProbe`: `true/false`

### Per session (`SessionSummary`)
- `consolidateCountdownSessions` (stored in gym state, copied into summary for audit)
- `swapPassCount`, `swapFailCount` (optional counters)



 