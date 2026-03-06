# IQ Capacity Training Coach — SCIENCE.md
Scientific rationale, decision rules, and technical specification (v0.1)

> **Scope note (important):** IQ Capacity Training Coach is a *non-medical* cognitive training tool.
> It is designed to improve **training quality** and to *increase the probability* of **portable gains**
> by (a) reducing “thin automation” and (b) making strategy portability **testable** inside training.
>
> Evidence for far transfer from working-memory training in general is **mixed**. This app therefore
> treats far transfer as an **engineering hypothesis** that must be supported by *in-app proofs*
> (wrapper swaps, boundary tests, real-world deployments), not by claims.

---

## 0) Conceptual model: why this is not “just n-back”

### 0.1 The standard problem: “thin automation”
A major failure mode in brain training is **narrow skill automation**:
people get better at *the wrapper* (surface cues, timing, stimulus quirks), not at portable control policies.
This is a core reason far transfer often fails in the literature.

**Design stance (Trident-G):**
- A gain only counts as “transfer-relevant” if it survives a **wrapper swap** and/or supports a **map inference**
  that was not explicitly trained as a rote response.
- “Clicks” are treated as **candidate operator discoveries** that must be tested for portability immediately.

### 0.2 Two learning modes (simple user experience; two mechanistic regimes)
The app implements a practical duality:

**Type 1 — Tuning (smooth gains):**
- Improve efficiency and stability **within a representation**.
- Expect power-law-like practice curves.

**Type 2 — Restructuring / SR shift (discontinuous gains):**
- Discover a new strategy, chunking, relational coding, or predictive-map-like representation.
- Expect “clicks” and bursty updates.

**Key point:** the app does not require users to learn this theory.
It simply detects likely “click moments” and runs **portability probes**.

---

## 1) App configurations

### 1.1 Standalone use (Capacity Coach only)
User opens Capacity Coach directly and trains.
The app handles:
- game selection,
- within-session game switching (wrapper swaps),
- difficulty adjustments,
- spike capture prompts,
- inference quizzes (relational modes).

### 1.2 Integrated use (Ψ Zone Coach → Capacity Coach)
If the user runs Ψ Zone Coach first, Capacity Coach reads the handoff:
- `psiState` (in-band vs out-of-band),
- `recommendation` (Proceed / Light / Recovery day),
- optional confidence/read-quality flags.

**High-level rule:**
- If Ψ Zone indicates **out-of-band** or **Light**, Capacity Coach defaults to **Standard (tuning)**.
- If Ψ Zone indicates **in-band / Proceed**, Capacity Coach defaults to **Relational (SR/structure)**.

This is training hygiene: SR-heavy work is more state-sensitive.

---

## 2) Games included (v0 set)

### 2.1 Standard (tuning) — Rule-specified n-back (colour/letter/location)
**Stimulus:** all three dimensions appear on every trial.
**Rule:** each block specifies the tracked dimension (colour OR letter OR location).
**Purpose:** train attentional stability, interference control, and flexible updating under controlled wrapper variability.

**N-back levels:** 1–8 (cap configurable)
**Speed:** 3.0 s / 2.0 s / 1.0 s per trial (slider)
**Block length:** `L = 20 + n` trials

### 2.2 Relational (structure / SR) — three relational n-backs

#### A) Graph n-back (edges)
- Fixed node set (e.g., 4 coloured nodes).
- Each trial shows a directed edge between two nodes.
- “Match” = the *edge identity* matches n-back.

#### B) Transitive n-back (relations)
- Letters (subset per block/world).
- Each trial shows a relation such as `A > B` (direction may flip display order).
- “Match” = the *relation key* matches n-back.

#### C) Propositional logic n-back
- Each trial shows a simple proposition (e.g., `If P then Q`, `P`, `Therefore Q?`, etc., implementation-defined).
- “Match” = proposition identity matches n-back.
- (This mode should be implemented with strict, minimal grammar to keep the match rule unambiguous.)

**N-back levels (relational):** 1–3 only (to keep worlds learnable and avoid noise)
**Speed:** 3.0 s / 2.0 s / 1.0 s per trial (slider)
**Block length:** `L = 20 + n` trials

---

## 3) Relational world generation + sequencing (current implementation model)

> The intent is not “random stimuli”. The intent is a **stable relational world** per block,
> which allows SR-like structure extraction and then **inference testing**.

### 3.1 Graph mode world
- Build all directed pairs from node set.
- Select 3 unique directed edges as **baseEdges**.
- Select 1 **foilEdge** from remaining pairs.
- Trials sample from `baseEdges + foilEdge`, with constraints to avoid trivial repetition.

### 3.2 Transitive mode world
- Sample 5 letters; use 4 as base letters.
- Build 3 base relations from letter pairs.
  - `=` relations occur with low probability (e.g., 20%), treated as bidirectional.
  - `>` relations occur with higher probability (e.g., 80%), direction randomised.
- Select a foil relation not already in base.

### 3.3 Match scheduling
- Target match rate ~0.30 (clamped to a narrow band).
- Enforce minimum count and spacing.
- When a match is scheduled, the token at trial `t` is copied from `t−n`.

---

## 4) Session flow (inputs → decisions → interventions → outputs)

### 4.1 Session minimums and structure
- A “standard” session is **10 blocks** minimum.
- After block 10, the user may add **+5 blocks** repeatedly (no hard upper bound),
  as long as they report motivation and remain stable.

### 4.2 Start-of-session selection (simple)
If integrated with Ψ Zone Coach:
- **Proceed / in-band:** default = **Relational day**
- **Light / out-of-band:** default = **Standard day**
- **Recovery:** suggest skip

If standalone:
- user chooses Standard vs Relational,
- app may recommend based on recent history (optional).

---

## 5) Core decision rules (behaviourally simple, scientifically motivated)

### 5.1 Difficulty tuning within a game (Type 1)
Each block computes a minimal performance set:
- `hitRate` (match detection accuracy)
- `falseAlarmRate` (non-match presses)
- optional `dPrime` (if implemented consistently)
- `rtMedian` and `rtIQR` (optional)
- `driftFlag` (heuristic: rising false alarms + slowing + misses)

**Threshold prompts (tunable defaults):**
- If `hitRate ≥ 0.85` AND `falseAlarmRate ≤ 0.15`:
  offer **increase difficulty**:
  - primary: increase `n` by +1 (if below cap),
  - else: increase speed (3s→2s→1s),
  - optional: hand switch (if enabled in standard mode).
- If `hitRate ≤ 0.65` OR `falseAlarmRate ≥ 0.25`:
  offer **decrease difficulty**:
  - primary: decrease `n` by −1 (min 1),
  - else: slow speed (1s→2s→3s).

**User control rule:**
The app *offers* changes; the user confirms.
This preserves motivation and avoids “algorithm tyranny”.

### 5.2 Stick-then-swap wrappers (anti–thin automation)
Rather than switching constantly, the app uses **stick-then-swap**:

- Stay on one wrapper long enough to let a strategy emerge (“stick”).
- Swap wrappers to test portability (“swap”).

**Within-session swapping is explicit**:
- Standard: colour ↔ letter ↔ location (rule changes between blocks)
- Relational: graph ↔ transitive ↔ propositional (between blocks)

**Swap triggers (either):**
1) **Breakthrough / click** detected (see 5.3), OR
2) Motivation dip (“want to swap?” prompt), OR
3) Plateau (3 blocks with no improvement and stable difficulty).

### 5.3 Spike capture + immediate transfer probe (Type 2 handling)
A “breakthrough” is defined as:
- the user successfully increases `n` (e.g., 2→3) **and**
- performance stabilises above threshold for at least one block **and**
- (optional) user self-reports a “click”.

**Rule after breakthrough (same session):**
1) **Immediate transfer probe:** 1–2 blocks on a new wrapper at the *same n*.
   - Standard: swap dimension (colour→location etc.)
   - Relational: swap mode (graph→transitive etc.)
2) If probe holds **fully or partially**:
   - allow one more probe block, then return to consolidate.
3) If probe collapses:
   - stop probing and consolidate on the original wrapper.

**Out-of-band exception:**
If Ψ Zone (or in-session drift) indicates strong state drift, skip probing and consolidate only.
Treat the click as fragile.

**What is stored in spike capture:**
- `candidateStrategyNote` (1 sentence, user-friendly)
- `originalWrapper`
- `probeWrapper`
- `probeOutcome` = Yes / Partial / No
- `n`, `speed`
This becomes a “proof trace” rather than a vibe.

---

## 6) Relational inference quizzes (anti-rote, SR pressure)

After each **relational block**, run a short inference quiz.

### 6.1 Graph quiz (reachability)
- Use only `baseEdges` (exclude foil).
- Generate True/False items such as:
  - “Can A reach B in exactly 2 steps?”
  - “Can A reach B in exactly 3 steps?”
- Score: accuracy + confidence (optional).

### 6.2 Transitive quiz (2-step inference)
- Convert base relations to directed edges (with `=` bidirectional).
- Generate True/False items:
  - “Is A > B?”
- Truth determined by exact-step reachability.

### 6.3 Purpose
These quizzes:
- reward extraction of **structure** rather than surface matching,
- provide an additional “map signal” aligned with SR-like learning,
- create a second channel for detecting “clicks” (quiz accuracy jumps).

---

## 7) Outputs to the user (simple, actionable)

At end of session:
- “Today’s mode”: Standard (tuning) or Relational (structure)
- A short performance summary (trend bars, not a wall of stats)
- Any logged “click” + portability probe result
- A recommendation for next session:
  - repeat and consolidate,
  - swap wrapper earlier,
  - reduce difficulty if drift was high.

If integrated:
- store a minimal handoff back to the Trident-G loop:
  - `capacitySummary` (what improved),
  - `candidateTransfer` (any portable click evidence).

---

## 8) Data & privacy (local-first)
Default storage is local browser storage (`localStorage`), rolling window:
- per-block metrics (minimal set),
- difficulty history,
- swaps (what/when/why),
- spike captures + probe outcomes,
- quiz results (relational only).

No cloud by default.

---

## 9) Scientific rationale (how this maps to evidence and theory)

### 9.1 What working-memory training does (and does not reliably do)
Meta-analyses and reviews show:
- robust improvement on trained tasks and near variants,
- far transfer effects are often small, inconsistent, or absent depending on inclusion criteria and controls.

**Design implication:**
Do not rely on “n-back → IQ” as a claim.
Instead, engineer **transfer tests into the training loop**.

### 9.2 Why wrapper swaps can help (when done correctly)
Variable practice and contextual interference can reduce immediate performance but improve
retention and transfer in many skill domains. The key is to avoid random chaos:
use **stick-then-swap** so a strategy can form, then test portability.

### 9.3 Why relational n-backs are not “just harder n-back”
Relational games are designed to:
- stabilise a **structured world** long enough to learn its relations,
- encourage predictive-map / SR-like coding (successor-style reachability),
- then test for **inference** that cannot be solved by rote matching.

This is closer to the cognitive demands of many “fluid” tasks (structure extraction, relational integration)
than simple stimulus updating alone.

### 9.4 Why “clicks” matter (and why they must be tested)
Discontinuous improvements are common in human learning (insight, re-coding, chunking).
Zhang & Tang provide a mechanistic lens from learning systems where update magnitudes
can become heavy-tailed under information-driven self-organisation (exploration pressure
plus objective tether). This is not direct evidence about humans doing n-back, but it supports
the idea that learning can alternate between:
- small incremental updates and
- bursty reconfiguration events.

**Design implication:**
A click should trigger:
- immediate transfer probe (portability test),
- then consolidation.

### 9.5 Trident-G far transfer logic (internal, not user-facing)
In Trident-G terms, Capacity Coach aims to:
- increase the probability of **portable control policies** (not wrapper tricks),
- provide **proof traces** (swap probes + inference),
- feed the Mindware Coach with evidence of what “generalised”.

This is the bridge between capacity training and real-world performance: not “more reps”,
but reps that are tethered to portability checks.

---

## 9.6 G-Loop integration: mission-tethered training (Zone → Capacity → Mindware)

**Why embed Capacity Coach inside a mission-driven loop?**
A central failure mode in cognitive training is “thin automation”, where control policies become tied to the training wrapper. The G-Loop embedding turns “far transfer” into a **repeatable deployment cycle**: regulate state (Zone), induce candidate control policies (Capacity), then **apply and verify** them in a concrete real-world mission (Mindware → mission). This makes transfer an *observable engineering outcome* rather than a claim.

### Mechanistic rationale (goal-directed generalisation + transfer-appropriate processing)

1. **Goal-tethered memory control:** Computational work on PFC–hippocampal interaction models shows how **top-down goal control** can bias episodic encoding/retrieval towards goal-relevant structure, improving generalisation to novel but structurally related situations. This supports the design choice of *explicit missions* that set the goal/context before (and immediately after) training, so the system has a “query” that selects what should generalise.  
2. **Transfer-appropriate processing:** Classic memory results show performance improves when the *processes trained* match the *processes required at test*. Missions operationalise this by forcing the trained control policy to run under the same processing demands as the user’s real task (comprehension, argumentation, decision trade-offs, or planning under constraints).  
3. **Retrieval practice for portability:** Testing/retrieval can produce better transfer than additional study because it requires reconstructing and applying knowledge rather than re-exposure. Missions can be framed as short “application tests” of the day’s strategy/operator.  
4. **Interleaving/rotation to reduce context-locking:** Interleaving/rotation tends to improve discrimination and transfer (with important boundary conditions), which is consistent with the “wrapper swap” logic at a higher level: rotating *mission wrappers* trains the user to select the right operator under changing demands.  
5. **Goals and implementation:** Goal-setting theory and implementation intentions support the idea that specifying a goal (and a simple if-then plan) increases follow-through and structured execution, which is useful for the Mindware → mission step.  

### Mission wrappers (the “four wrappers” habit)

A **mission** is a small, repeatable, measurable 10–20 minute task that the user genuinely needs to do. It is not “extra homework”; it is a structured deployment of a strategy.

**Comprehension mission** (real text they need to understand)
**Argumentation mission** (evaluate or produce an argument)
**Decision mission** (choose between options under trade-offs)
**Planning & action mission** (execute a plan with constraints)

### Phase 1: Guided rotation (1–2 weeks)

Goal: teach the user the *process* (the 1–12 phases) across all four wrappers, so they learn to (a) identify the wrapper, (b) pick an operator, (c) run it, and (d) check outcomes.

**Protocol:** in the first 1–2 weeks, guide the user through **one mission in each wrapper** (order can be fixed or lightly interleaved). Keep missions small enough to finish even on a “Light” day.

**Evidence captured (minimal):**

* mission type (which wrapper), duration, completion (Y/N)
* a simple outcome check (see below)
* “operator used” (chosen in Mindware Coach)
* confidence + effort (optional)

### Phase 2: User-selected missions (from week 3 onwards)

Goal: shift from guided coverage to **project relevance**, while keeping the wrapper taxonomy as the organising layer.

**Protocol:** the user selects the wrapper that matches their current projects. The app can still recommend a wrapper (e.g., “this reads like a decision under uncertainty”), but the user chooses.

**Transfer logic:** portable gains are credited when:

* a Capacity “click” has at least partial evidence via wrapper swaps/inference probes, **and**
* the same operator/strategy improves at least one mission outcome in a different context (mission wrapper change), within a short window (e.g., same day or next day).

### Suggested integration flow (simple)

1. **Zone Coach:** set state and recommendation (Proceed/Light/Recovery).
2. **Mission selection:** choose today’s mission wrapper (guided in Phase 1, user-selected in Phase 2).
3. **Capacity Coach:** run training with stick-then-swap and spike capture as currently specified.
4. **Mindware Coach:** pick or confirm the operator that will be deployed.
5. **Mission execution:** complete the 10–20 min mission immediately after training when feasible (or schedule within 24 hours).
6. **Mission check:** log a small outcome + reflection note.

### Mission outcome checks (examples)

Keep these lightweight and non-clinical:

* **Comprehension:** 3–5 self-generated questions answered correctly, or a 5-sentence summary scored by a simple rubric (clarity, key points).
* **Argumentation:** a short claim–reasons–evidence structure with a quick self-check for counterargument and warrant.
* **Decision:** a minimal weighted decision matrix completed, plus a 1–2 sentence sensitivity check.
* **Planning & action:** plan created + one concrete step executed; track whether constraints were respected.

---

## 10) References (APA 7) 

Au, J., Sheehan, E., Tsai, N., Duncan, G. J., Buschkuehl, M., & Jaeggi, S. M. (2015). Improving fluid intelligence with training on working memory: A meta-analysis. *Psychonomic Bulletin & Review, 22*(2), 366–377. [https://doi.org/10.3758/s13423-014-0699-x](https://doi.org/10.3758/s13423-014-0699-x) ([PubMed][1])

Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but in a good way: Creating desirable difficulties to enhance learning. In M. A. Gernsbacher, R. W. Pew, L. M. Hough, & J. R. Pomerantz (Eds.), *Psychology and the real world: Essays illustrating fundamental contributions to society* (pp. 56–64). Worth Publishers. ([SCIRP][2])

Brunmair, M., & Richter, T. (2019). Similarity matters: A meta-analysis of interleaved learning and its moderators. *Psychological Bulletin, 145*(11), 1029–1052. [https://doi.org/10.1037/bul0000209](https://doi.org/10.1037/bul0000209)

Butler, A. C. (2010). Repeated testing produces superior transfer of learning relative to repeated studying. *Journal of Experimental Psychology: Learning, Memory, and Cognition, 36*(5), 1118–1133. [https://doi.org/10.1037/a0019902](https://doi.org/10.1037/a0019902)

Dayan, P. (1993). Improving generalization for temporal difference learning: The successor representation. *Neural Computation, 5*(4), 613–624. [https://doi.org/10.1162/neco.1993.5.4.613](https://doi.org/10.1162/neco.1993.5.4.613)

Firth, J., Rivers, I., & Boyle, J. (2021). A systematic review of interleaving as a concept learning strategy. *Review of Education, 9*(2), 642–684. [https://doi.org/10.1002/rev3.3266](https://doi.org/10.1002/rev3.3266)

Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. *American Psychologist, 54*(7), 493–503. [https://doi.org/10.1037/0003-066X.54.7.493](https://doi.org/10.1037/0003-066X.54.7.493)

Locke, E. A., & Latham, G. P. (2002). Building a practically useful theory of goal setting and task motivation: A 35-year odyssey. *American Psychologist, 57*(9), 705–717. [https://doi.org/10.1037/0003-066X.57.9.705](https://doi.org/10.1037/0003-066X.57.9.705)

Melby-Lervåg, M., & Hulme, C. (2013). Is working memory training effective? A meta-analytic review. *Developmental Psychology, 49*(2), 270–291. [https://doi.org/10.1037/a0028228](https://doi.org/10.1037/a0028228)

Morris, C. D., Bransford, J. D., & Franks, J. J. (1977). Levels of processing versus transfer-appropriate processing. *Journal of Verbal Learning and Verbal Behavior, 16*(5), 519–533. [https://doi.org/10.1016/S0022-5371(77)80016-9](https://doi.org/10.1016/S0022-5371%2877%2980016-9) ([ScienceDirect][3])

Sala, G., & Gobet, F. (2017). Working memory training in typically developing children: A meta-analysis of the available evidence. *Developmental Psychology, 53*(4), 671–685. [https://doi.org/10.1037/dev0000265](https://doi.org/10.1037/dev0000265)

Shea, J. B., & Morgan, R. L. (1979). Contextual interference effects on the acquisition, retention, and transfer of a motor skill. *Journal of Experimental Psychology: Human Learning and Memory, 5*(2), 179–187. [https://doi.org/10.1037/0278-7393.5.2.179](https://doi.org/10.1037/0278-7393.5.2.179)

Simons, D. J., Boot, W. R., Charness, N., Gathercole, S. E., Chabris, C. F., Hambrick, D. Z., & Stine-Morrow, E. A. L. (2016). Do “brain-training” programs work? *Psychological Science in the Public Interest, 17*(3), 103–186. [https://doi.org/10.1177/1529100616661983](https://doi.org/10.1177/1529100616661983)

Stachenfeld, K. L., Botvinick, M. M., & Gershman, S. J. (2017). The hippocampus as a predictive map. *Nature Neuroscience, 20*(11), 1643–1653. [https://doi.org/10.1038/nn.4650](https://doi.org/10.1038/nn.4650)

Zhang, X.-Y., & Tang, C. (2025). Heavy-tailed update distributions arise from information-driven self-organization in nonequilibrium learning. *Proceedings of the National Academy of Sciences of the United States of America, 122*(51), e2523012122. [https://doi.org/10.1073/pnas.2523012122](https://doi.org/10.1073/pnas.2523012122)

Zheng, Y., Wolf, N., Ranganath, C., O’Reilly, R. C., & McKee, K. L. (2025). Flexible prefrontal control over hippocampal episodic memory for goal-directed generalization. *arXiv*. [https://doi.org/10.48550/arXiv.2503.02303](https://doi.org/10.48550/arXiv.2503.02303) ([arXiv][4])

 
