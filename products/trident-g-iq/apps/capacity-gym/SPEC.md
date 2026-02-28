
# SPEC.md — Capacity Gym (Hub + Relational N-Backs + Coach + MVP Gamification)
Version: v1 (MVP, static GitHub Pages + localStorage)  
Next: migrate to Vite/Vercel + Supabase events (same data contracts)

---

## 0) Purpose (what we’re building)
**Capacity Gym** is a web app that trains “Type-1 capacity” for Trident-G: clean control, recovery, and portability under controlled perturbations.  
It ships as a **static HTML/CSS/JS** app first (GitHub Pages) with **localStorage** persistence.

**Games in MVP**
1) **Hub game:** Cued 3-modality n-back (categorical + non-categorical wrappers)  
2) **Relational n-backs:**  
   - Transitive (order) n-back  
   - Graph (directed edge) n-back  
   - Propositional implication n-back  

A **coach** schedules blocks and sessions (Spike-Tune style: one dial at a time + wrapper swaps + consolidation after spikes).

A lightweight **gamification overlay** improves motivation: banked units + daily 3-step mission + visible “coach notices”.

---

## 1) Non-negotiables (constants and boundary conditions)

### 1.1 Timing
- Two speeds (SOA, fixed within a block):
  - **SLOW:** 3000 ms
  - **FAST:** 1400 ms
- Stimulus display: ~60–70% of SOA (but response allowed until SOA end)

### 1.2 Session structure (all games)
- **10 blocks per session**
- Trials per block: `T = baseTrials + N`
  - `baseTrials = 20` (default)
- Target match rate: ~**30%** of eligible trials are true matches

### 1.3 N limits
- **Hub:** `N ∈ [1..N_MAX_HUB]`, default `N_MAX_HUB = 7` (config)
- **Relational games:** `N ∈ [1..3]` (hard cap)

### 1.4 Adaptive N rule (MVP; literature-consistent bands)
Compute block accuracy including non-responses:
- `accuracy = (hits + correctRejections) / totalTrials`

Then:
- If `accuracy ≥ 0.90` → `N = min(N+1, N_MAX)`
- Else if `accuracy < 0.75` → `N = max(N-1, 1)`
- Else → hold N

**Notes**
- Evaluate once per block (not per trial)
- N changes by at most 1 per block (implied)

### 1.5 Interference toggle
Two levels (implemented via lure scheduling; no new controls added):
- **LOW:** lureRate = 0.10 of non-match trials are lures
- **HIGH:** lureRate = 0.25 of non-match trials are lures

**Important edge case**
- If `N === 1`: disable “n−1 lures”; use shared-node / repetition / cross-feature lures only.

### 1.6 Canonical scoring (non-negotiable)
All matching is based on **canonical meaning** (a stable key), not surface rendering.
Each trial must have:
- `canonKey: string`
- `display: (rendered form)`

Match rule:
- trial `i` is a match iff `canonKey[i] === canonKey[i-N]`

### 1.7 Post-block mini-quizzes (relational games + optional hub later)
- Exactly **2 items per block**
- Each item is timeboxed **6–8 seconds**
- Prompts must match scoring semantics:
  - Use **exact-2 step** phrasing if scoring exact-2
- Default: no explanations mid-session; optional brief feedback flash

---

## 2) UX / Screens (MVP)

### 2.1 Routes
- **Home / Today**: start recommended session, daily mission, bank units, unlock status
- **Play Hub**
- **Play Relational** (mode select, locked/unlocked)
- **History**: session list + detail view
- **Settings**: toggles (sounds, keybinds, colour-blind safe palette, reset local data, export JSON)

### 2.2 Visible “coach notices”
When coach triggers a change, show a small banner/toast:
- “Plateau detected → running a probe wrapper block”
- “Overload detected → switching to recovery block”
- “Breakthrough detected → consolidation window”

These messages do not require speculative thresholds; they reflect the coach’s chosen action.

---

## 3) File / module structure (static MVP)

Recommended:
- `index.html`
- `styles.css`
- `app.js` (router + global state)
- `lib/`
  - `rng.js` (seeded RNG)
  - `storage.js` (versioned localStorage)
  - `metrics.js` (hit/miss/fa/cr, accuracy, RT, bursts)
  - `scheduler.js` (match scheduling, lure scheduling)
  - `coach.js` (session plan generator + optional next-block updates)
- `games/`
  - `hub.js`
  - `transitive.js`
  - `graph.js`
  - `propositional.js`

No build step in MVP. Later migration keeps the same contracts.

---

## 4) Data contracts (must be stable for migration)

### 4.1 Core types
```ts
type SpeedId = "slow" | "fast";
type InterferenceId = "low" | "high";
type WrapperId = "hub_cat" | "hub_noncat" | "transitive" | "graph" | "propositional";

type BlockPlan = {
  blockIndex: number;      // 1..10
  wrapper: WrapperId;
  n: number;
  speed: SpeedId;
  interference: InterferenceId;
  targetModality?: "loc"|"col"|"sym";  // hub only
  mappingSeed?: number;                // hub noncat only (to reproduce palettes/symbol sets)
  flags?: {
    pulseType?: "speed"|"interference"|null;
    swapSegment?: "A"|"B"|null;
    coachState?: "RECOVER"|"STABILISE"|"TUNE"|"SPIKE_TUNE"|"CONSOLIDATE";
    wasSwapProbe?: boolean;
  };
};

type BlockResult = {
  blockIndex: number;
  wrapper: WrapperId;
  nStart: number;
  nEnd: number;
  speed: SpeedId;
  interference: InterferenceId;
  targetModality?: "loc"|"col"|"sym";
  trials: number;

  // scoring
  hits: number; misses: number; falseAlarms: number; correctRejections: number;
  accuracy: number;          // (hits + cr) / trials

  // timing
  meanRtMs: number|null;
  rtSdMs: number|null;

  // reliability extras (logged; not gating in MVP)
  lapseCount: number;        // timeouts
  errorBursts: number;       // ≥3 errors within any 8-trial window

  // lure diagnostics (hub strongly recommended)
  faOnLures?: number;
  lureTrials?: number;

  // optional coach mirrors (authoritative source is BlockPlan.flags)
  coachState?: "RECOVER"|"STABILISE"|"TUNE"|"SPIKE_TUNE"|"CONSOLIDATE";
  pulseType?: "speed"|"interference"|null;
  swapSegment?: "A"|"B"|null;
  wasSwapProbe?: boolean;

  // relational quiz
  quizCorrect?: number;      // 0..2
  quizTotal?: number;        // 2
};
````

### 4.2 SessionSummary

```ts
type SessionSummary = {
  id: string;
  tsStart: number;
  tsEnd: number;
  dateLocal: string;          // YYYY-MM-DD
  wrapperFamily: "hub"|"relational";
  blocksPlanned: BlockPlan[];
  blocks: BlockResult[];
  notes?: {
    click?: boolean;
    clickNote?: string;
  };
};
```

### 4.3 localStorage keys (versioned)

* `tg_capacity_gym_v1` (single root object)

```ts
type GymState = {
  version: 1;
  settings: {
    lastWrapper?: WrapperId;
    lastSpeed?: SpeedId;
    lastInterference?: InterferenceId;
    soundOn?: boolean;
  };
  history: SessionSummary[];             // rolling window, e.g. last 200 sessions

  // gamification
  bankUnits: number;
  unlocks: {
    hub_noncat: boolean;
    transitive: boolean;
    graph: boolean;
    propositional: boolean;
  };
  missionsByDate: Record<string, {
    steps: string[];                     // e.g. ["reset","control","reason"]
    completedSteps: number;              // 0..3
    rewardClaimed: boolean;
  }>;
};
```

---

## 5) Shared mechanics (scoring, RT, bursts)

### 5.1 Response model (strict)

* Input: Spacebar + “MATCH” button
* First response per trial counts; additional inputs ignored until next trial
* Response window: full SOA
* No response:

  * If match trial → miss
  * If non-match → correct rejection
* RT: stimulus onset → first response; `null` if no response

### 5.2 Error bursts

* Define an “error” as miss OR false alarm
* `errorBursts = count of windows (size=8 trials) with ≥3 errors`

  * Overlapping windows allowed (simplest)
  * Alternatively count unique burst occurrences (acceptable if documented)

### 5.3 Lapses

* MVP: lapse = timeout (no response by SOA end) on any trial
* Store `lapseCount` per block

---

## 6) Coach (Spike-Tune) — MVP implementation rules

### 6.1 Coach outputs a SessionPlan

Before a session starts:

* `coachPlanSession(gymState) -> BlockPlan[10]`
  The session plan is a 10-block schedule (wrapper, N, speed, interference, targetModality if hub).

### 6.2 Coach may adjust only the *next* block

After each block:

* `coachUpdateAfterBlock(lastBlockResult, partialSession) -> Partial<BlockPlanNext>`
  Constraints:
* may change **next block only**
* may change **at most one dial**:

  * N OR speed OR interference OR wrapper (never multiple)
* if things go messy, coach can force a recovery block (multi-dial override allowed)
* runtime must allow block-level wrapper changes (no session-level wrapper lock)

### 6.3 Coach states (labels; MVP logic can be minimal)

* RECOVER: slow + low, N down 1
* STABILISE: slow + low, hold N
* TUNE: one-dial pulse blocks (speed OR interference)
* SPIKE_TUNE: plateau routing + wrapper swap probe
* CONSOLIDATE: hold wrapper + moderate settings for 1–3 sessions after spike

### 6.4 Plateau detection (minimal, non-speculative)

Plateau trigger (simple MVP):

* last **3 blocks** were HOLD (no UP) and none were DOWN, at the same wrapper/speed/interference

When plateau triggers, schedule exactly one perturbation for the next block in this order:

1. interference pulse (if currently low and not pulsed recently)
2. else speed pulse (if currently slow and not pulsed recently)
3. else wrapper swap probe (A->B segment), keeping other dials fixed

### 6.5 Pulse / swap evaluation (minimal)

After a pulse block:

* if stable, promote that dial as baseline or run one confirmation pulse
* if DOWN but not messy, run 1-2 STABILISE blocks and retry later
* if messy, route to RECOVER

After a wrapper swap probe:

* if stable, return B->A next block (or keep B intentionally)
* if DOWN but not messy, return to A and STABILISE for 1-2 blocks
* if messy, route to RECOVER

### 6.6 Breakthrough (spike) detection (minimal)

A spike event occurs if:

* the block outcome is UP (accuracy >= 0.90) and N increases, OR
* user marks click and adds a note

After spike:

* next 1-3 sessions: CONSOLIDATE (no swaps; no pulses; moderate difficulty)

---

## 7) Gamification (MVP-safe, non-speculative)

### 7.1 Banked units (progress economy)

Award units based ONLY on block outcome bands:

* If block outcome is **UP** → +2 units
* If **HOLD** → +1 unit
* If **DOWN** → +0 units (or +1 if you prefer softer feel; decide once)

No other metrics (FA/bursts/quiz) gate rewards in MVP.

### 7.2 Daily 3-step mission

Each local day (`YYYY-MM-DD`) generate:

* `steps = ["reset","control","reason"]` (or variants)
  Completion:
* completing the planned session increments steps
  Reward:
* +3 units when mission completed (once per day)

### 7.3 Unlocks

Unlocks use only accuracy/N-based evidence (no speculative stability thresholds).

**Unlock Hub non-categorical**

* available immediately (recommended), or after 1 completed hub session

**Unlock relational games**
Unlock when player achieves “stable performance at N ≥ 3” in hub, defined as:

* Complete 1 **hub_cat** session AND 1 **hub_noncat** session where:

  * Final `NEnd ≥ 3`, AND
  * At least **3 blocks** at `N ≥ 3` had outcomes HOLD or UP (not DOWN)

This uses only the 90/75 banding plus N ≥ 3.

---

## 8) Hub Game Spec (Cued 3-modality n-back)

### 8.1 Core idea

Each trial displays (location, colour, symbol). Each block cues one modality (loc/col/sym).
User responds “MATCH” when the **cued modality** matches N-back.

### 8.2 Wrappers

* **hub_cat**:

  * 4 fixed locations (square on faded circle)
  * 4 categorical colours (e.g. red/blue/black/white)
  * 4 fixed symbols (e.g. A/B/C/D)
* **hub_noncat**:

  * block-wise location rotation `rot ∈ {0,1,2,3}`
  * block-wise colour palette shift (e.g. baseHue shifts)
  * block-wise symbol set changes (choose 4 from a larger pool)

### 8.3 Canonical trial values

For each trial store:

* `locIdx ∈ {0..3}`
* `colIdx ∈ {0..3}`
* `symIdx ∈ {0..3}`

Matching checks use ONLY canonical indices, never the surface render.

### 8.4 Match scheduling

For the target modality stream (selected per block):

* schedule ~30% match indices among `[N..T-1]`, no adjacency, no last-two-both-match
* on match indices `i`: `target[i] = target[i-N]`
* on non-match indices `i`: ensure `target[i] != target[i-N]`

### 8.5 Interference (hub)

Lure trials are **cross-feature lures**:

* On a target **non-match** trial:

  * force exactly one ignored modality to be an N-match
  * keep the other ignored modality non-match (preferred)

LOW: lureRate 0.10 of non-match trials
HIGH: lureRate 0.25 of non-match trials

Log:

* `lureTrials`
* `faOnLures`

### 8.6 Target modality cue

At block start show cue (LOCATION / COLOUR / SYMBOL) for ~1200ms.

---

## 9) Relational Game Specs (N_MAX = 3)

All relational games:

* N ∈ {1,2,3}
* tokens are relations with **canonical meaning**
* surface varies without changing canonical key
* each block ends with a 2-item timed quiz

### 9.1 Transitive (order) n-back

Stimulus selection per session:

* pick 5 letters from safe pool:

  * `["A","B","C","D","E","F","H","J","K","M","N","P","R","T","V","W","X","Y","Z"]`
* choose 4 chain letters L0..L3 + 1 distractor letter D

Core premises (exactly 3):

* `L0 > L1`
* `L1 > L2`
* `L2 > L3`

Canonical token:

* always store as `ORD:hi>lo` (directional)
  Surface render:
* show either `hi > lo` or `lo < hi` (flip)

No equality `=` in MVP.

Allowed token pool:

* core premises plus distractor relations that do NOT create alternative paths among chain letters.

Quiz (2 items, exact-2):
Prompt: “Can you infer X > Y in exactly 2 steps (via one intermediate)?”
Truth:

* exact-2: `L0 > L2`, `L1 > L3`
* hard tier (labelled exact-3, optional later): `L0 > L3`

### 9.2 Graph (directed edge) n-back

Nodes: 4 colours (R,G,B,Y), identity by colour only. Layout may rotate/permutate visually.

Core edges (exactly 3, directed only):

* `R → G`
* `G → B`
* `B → Y`

Canonical token key:

* `EDGE:R->G` etc.

Token pool:

* only these 3 edges (avoid accidental paths)

Quiz (2 items, exact-2):
Prompt: “Is there a path from X to Y in exactly 2 steps?”
Truth:

* exact-2: `R→B`, `G→Y`
* hard tier (labelled exact-3, optional): `R→Y`

---

## 9.3 Propositional inference-rule n-back (MP / MT / DS)

**Purpose:** Train propositional “rule following” and premise integration using three intuitive inference patterns, with surface variation (symbolic vs verbal) but canonical, stable scoring.

### Symbols

Fixed symbols in MVP: `{P, Q, R, S}`.

Within each **block**, use two disjoint variable pairs to avoid cross-entanglement:

* Pair A uses `{P, Q}`
* Pair B uses `{R, S}`

### Response model (Stage 4 go/no-go)

Trials are **MATCH-only**:

* Press **Space** for MATCH only.
* No response on non-match = **correct rejection (CR)**.
* No response on match = **miss** and counts as **lapse** (match omission).

### Canonical premise tokens (trial items)

Trials present **single statements** drawn from a block’s premise bank (see below). Each statement has a canonical token key:

* Atomic: `ATOM:P` (and similarly Q, R, S)
* Negation: `NOT:P`
* Implication: `IMP:P->Q`
* Disjunction (commutative canonicalisation): `OR:P|Q`
  Canonicalise by sorting the pair, so `OR:P|Q` == `OR:Q|P`.

**Important:** Matching is always by canonical key at `i − N`, never by surface wording.

### Surface variants (symbolic vs verbal)

Each time a premise token is shown, render it in one of two surface families:

**Symbolic**

* `P`
* `¬P`
* `P → Q`
* `P ∨ Q` (or optionally `Q ∨ P` as a surface flip)

**Verbal**

* `P is true`
* `P is not true`
* `If P then Q`
* `Either P or Q`

Surface choice is random per presentation, but must remain **meaning-preserving**.

### Block structure: “premise bank” + trials

Each block defines a small **premise bank** containing **exactly 4 premises**: two independent inference instances (A and B), each instance contributing **two premises**.

At block start (cue), show the premise bank (4 items). During trials, present one premise per trial, sampled from this bank with surface variation.

### Inference instances (what can appear in a block)

For each pair (A: P/Q, B: R/S), sample one rule type from:

1. **Modus Ponens (MP)**
   Premises: `ATOM:P` and `IMP:P->Q`
   Conclusion: `ATOM:Q`

2. **Modus Tollens (MT)**
   Premises: `NOT:Q` and `IMP:P->Q`
   Conclusion: `NOT:P`

3. **Disjunctive Syllogism (DS)**
   Premises: `OR:P|Q` and `NOT:P`
   Conclusion: `ATOM:Q`
   (Optionally allow the symmetric DS variant: `OR:P|Q` and `NOT:Q` ⟹ `ATOM:P`.)

So a block always contains **two** instances (one for P/Q and one for R/S), giving 4 premises total.

### Token pool (trials)

Token pool for the block is **only** the block’s premise bank (4 canonical tokens).

Trials per block: `T = 20 + N` with `N ∈ [1..3]`.

Match scheduling: ~30% of eligible indices `[N..T−1]` (as per shared Stage-4 scheduler).

### Quiz (2 items, exact-2 premise integration)

Each block ends with **exactly 2 timed TRUE/FALSE questions** (6–8s each; MVP uses the global Stage-4 quiz timeout).

Quiz items are **map queries** over the block’s premise bank and must require combining **two premises** (the exact-2 pattern). They are **not** derived from which trials happened to be n-back matches.

**Quiz item format (TRUE/FALSE buttons):**
Example prompt: “From the block premises, **Q is true**.”

**Quiz construction rule:**

* Quiz item #1 targets the conclusion of instance A (P/Q).
* Quiz item #2 targets the conclusion of instance B (R/S).

For each item, choose whether the displayed statement is:

* **True:** the valid conclusion for that instance (MP→Q, MT→¬P, DS→Q), **or**
* **False foil:** a near-miss statement that is *not* entailed by the instance.

Recommended default: 1 true + 1 false per block (random order), but allow either to be true/false independently if you prefer.

**Foil rules (must not be directly present as a premise):**

* For MP (premises `P` and `P→Q`): use foils like `¬Q` or `¬P`.
* For MT (premises `¬Q` and `P→Q`): use foils like `Q` or `P`.
* For DS (premises `P∨Q` and `¬P`): use foils like `¬Q` or `P`.

**Do not** ask about a statement that appears verbatim in the premise bank (avoid trivially true items).

### Notes / exclusions (MVP)

* No contrapositive equivalence as a “free rewrite”. MT is included as a **rule pattern**, not as permission to rewrite `P→Q` into `¬Q→¬P`.
* No nested negations, no biconditionals, no conjunctions.
* Keep the block premise bank small and stable to maintain intuitiveness.

---

## 10) Acceptance tests (MVP)

### 10.1 App-level

* Loads as a static site (no build tools)
* History persists across refresh
* Export JSON produces a valid file
* Reset wipes localStorage safely

### 10.2 Hub game

* Runs 10 blocks/session; each block has cue + trials + results
* Noncat wrapper changes presentation per block but canonical scoring remains correct
* Interference toggle increases lure frequency; lure FA is logged
* N adapts by 90/75 rule; N stays within [1..N_MAX_HUB]

### 10.3 Relational games

* Each mode runs 10 blocks/session; N stays within [1..3]
* Canonical scoring works (surface flips do not affect matching)
* Quiz appears after each block; 2 items; timed
* N adapts by 90/75 rule (within [1..3])

### 10.4 Coach + gamification

* Coach generates a 10-block plan and shows it (or “coach recommended”)
* Bank units increase as blocks complete (UP/HOLD/DOWN only)
* Daily mission is generated and can be completed once/day
* Relational games unlock when unlock rule is met (N ≥ 3 stability in both hub wrappers)

---

## 11) Migration notes (later)

When moving to Vite/Vercel + Supabase:

* Keep the same `SessionSummary` payload
* Append one event per session to Supabase `events`
* Local-first remains the source of truth; cloud is sync

---


