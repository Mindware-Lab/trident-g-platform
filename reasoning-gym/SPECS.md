 # Adaptive Reasoning Gym — overall developer spec

## 1. Product definition

Reasoning Gym is a **single adaptive reasoning game shell** with multiple reasoning families implemented as **block profiles**, not as separate products.

Initial families:

1. **Relation Fit**
   relation validation / relation instantiation / same deep relation
2. **Must Follow**
   deduction / necessary consequence / constraint propagation
3. **Best Rule So Far**
   induction / updating / rival-rule tracking

These three are a sensible first trio for broad fluid reasoning:

* **Relation Fit** gives relation validation and structural consistency
* **Must Follow** gives deduction and consequence tracking
* **Best Rule So Far** gives induction and calibrated model updating

## 2. Core design rule

Use **one engine, one UI shell, one scoring model, one progression logic**.

The family changes:

* deep logical demand
* subtype
* wrapper
* complexity

The shell stays constant:

* same item card layout
* same response controls
* same feedback rhythm
* same adaptive decision system
* same session summary structure

This follows the same “block profile, not separate game” logic already used in the integrated Capacity Gym spec. 

## 3. High-level user flow

### Home

User chooses:

* **Coach-led**
* **Manual**
* **Progress**
* **Help**

### Coach-led session

Engine chooses:

* 2 families for short sessions
* 2–3 families for standard sessions
* block order
* wrapper mix
* speed
* tier progression

### Manual session

User chooses:

* family or mixed families
* wrapper mode
* speed mode
* starting tier
* session length

### Session structure

Default session is a sequence of **blocks**.
A block contains **10 items**.
After each block, the engine makes an **UP / HOLD / DOWN** decision.

### End of session

Show:

* family performance
* wrapper cost
* strongest subtype
* weakest subtype
* transfer score
* next recommendation

---

# 4. Family definitions

## Family 1 — Relation Fit

Core task: identify whether one or more options instantiate a target abstract relation.

Subtypes:

* `same_relation_mcq`
* `select_all_valid`
* `relation_satisfaction`
* `multi_relation_validation`

Answer types:

* `single_choice`
* `multi_select`
* later `true_false`

Real-world bank size: **264 items**

Primary error signals:

* `role_reversal_error_rate`
* `multi_select_overreach`

Typical logical demands:

* binary relation equivalence
* converse mapping
* role preservation
* relation satisfaction
* later chained and structural-role items

## Family 2 — Must Follow

Core task: decide which conclusion must follow from the premises.

Subtypes:

* `must_follow_tf`
* `best_conclusion_mcq`
* `select_all_must_follow`
* later `cannot_follow_mcq`

Answer types:

* `true_false`
* `single_choice`
* `multi_select`

Real-world bank size: **360 items**

Primary error signals:

* `transitive_reversal_error_rate`
* `quantifier_scope_error_rate`
* `conditional_chain_error_rate`
* `multi_select_overreach`

Typical logical demands:

* transitive chains
* set inclusion / exclusion
* conditional chains
* multi-conclusion filtering

## Family 3 — Best Rule So Far

Core task: decide which rule currently best explains the observations, which rules remain live, or whether confidence in a current best rule should rise.

Subtypes:

* `best_rule_so_far_mcq`
* `confidence_update_tf`
* `select_all_consistent`
* later `rule_ranking_later`

Answer types:

* `single_choice`
* `true_false`
* `multi_select`

Real-world bank size: **360 items**

Primary error signals:

* `alternation_confusion_rate`
* `cycle_confusion_rate`
* `feature_rule_error_rate`
* `overcommitment_rate`
* `multi_select_overreach`

Typical logical demands:

* alternation
* cycle-of-3
* ladder rules
* pair-repeat
* two-feature rules
* confidence update

---

# 5. Shared item model

Use one normalised item shape across all families.

```json
{
  "id": "string",
  "family": "relation_fit | must_follow | best_rule_so_far",
  "subtype": "string",
  "wrapper_type": "real_world | nonsense",
  "difficulty_tier": 1,
  "binding_load": 1,
  "uncertainty_level": 1,
  "control_burden": 1,
  "logical_form": "string",
  "premises": ["string"],
  "query": "string",
  "answer_type": "single_choice | true_false | multi_select",
  "options": [
    { "id": "A", "text": "string" }
  ],
  "correct_answer": ["A"],
  "explanation": "string",
  "skill_tags": ["string"]
}
```

Family-specific optional fields:

* `target_relation_type` for Relation Fit and Must Follow
* `target_rule_family` for Best Rule So Far

This matches the schema style already used in the packs and stays aligned with the original reasoning-lab item grammar: **premises → judgement/query → response**. 

---

# 6. Wrapper system

Every family should support two wrapper modes:

* `real_world`
* `nonsense`

The deep logical form stays constant while the surface changes. That is one of the main design principles in the reasoning spec.

## Real-world wrapper

Use authored JSON item banks:

* `relation-fit.real-world.examples.json`
* `must-follow.real-world.examples.json`
* `best-rule-so-far.real-world.examples.json`

## Nonsense wrapper

Use generator modules:

* `relation-fit.generator.js`
* `must-follow.generator.js`
* `best-rule-so-far.generator.js`

Each family also has a nonsense grammar spec file that defines:

* phonotactics
* pronounceable token generation
* grammar patterns
* relation/rule lexicon
* answer types
* complexity rules
* adaptive rules

## Mixed wrapper mode

A block may be:

* fully real-world
* fully nonsense
* mixed

Recommended MVP mixed rule:

* first 5 items real-world
* last 5 items nonsense

This is already how the current generators are set up when wrapper mode becomes `mixed`.

---

# 7. Complexity model

Use one visible difficulty model across all families.

## Binding load

How many items, roles, values, features, or relations must be kept distinct?

## Uncertainty

How much ambiguity remains among live options or live rules?

## Control burden

How much derailment pressure is present?
Examples:

* distractors
* near-miss rules
* role reversals
* tempting but shallow patterns
* multi-select overreach
* time pressure

This should remain the main difficulty framework across the whole game.

## Difficulty tiers

Use a 5-tier ladder for all three families.

### Tier 1

Simple, low-binding, low-uncertainty single-rule items.

### Tier 2

Slightly longer or more confusable items, but still one clean best answer.

### Tier 3

More distractors, stronger wrapper pressure, more live rivals.

### Tier 4

Higher relational complexity, multi-feature or multi-step logic, more multi-select pressure.

### Tier 5

High-load, high-confusion, higher control burden, strong wrapper robustness demand.

Family-specific interpretations:

* **Relation Fit**: binary relation items → wrapper swap / multi-select → chained / 3-argument later
* **Must Follow**: short chains → longer chains / mixed polarity → multi-conclusion filtering
* **Best Rule So Far**: simple alternation / ladder → multi-rule rivalry → two-feature and noisy update items

---

# 8. Adaptive engine

This game should be adaptive in the same basic way as the integrated n-back system.

## Core adaptive rule

After each block, run:

* `UP`
* `HOLD`
* `DOWN`

Progression order:

1. **stabilise first**
2. **swap wrapper**
3. **go faster**
4. **then increase tier / relation complexity**

That progression order should be fixed. It is already the governing rule in the integrated game spec and should carry straight across to Reasoning Gym.

## Default thresholds

Use the same simple first-pass thresholds across all reasoning families:

* `UP` if accuracy ≥ 0.85 and no late collapse
* `DOWN` if accuracy < 0.70 or there is late collapse
* otherwise `HOLD`

## Adaptive state object

Persist this per family and per user:

```json
{
  "current_tier": 1,
  "wrapper_mode": "real_world",
  "speed_mode": "normal",
  "recent_accuracy": 0.82,
  "late_collapse": false,
  "recent_wrapper_cost": 0.08
}
```

Add family-specific error metrics.

### Relation Fit extra state

```json
{
  "recent_role_reversal_error_rate": 0.12,
  "multi_select_overreach": 0.05
}
```

### Must Follow extra state

```json
{
  "transitive_reversal_error_rate": 0.10,
  "quantifier_scope_error_rate": 0.06,
  "conditional_chain_error_rate": 0.14,
  "multi_select_overreach": 0.03
}
```

### Best Rule So Far extra state

```json
{
  "alternation_confusion_rate": 0.08,
  "cycle_confusion_rate": 0.16,
  "feature_rule_error_rate": 0.04,
  "overcommitment_rate": 0.10,
  "multi_select_overreach": 0.06
}
```

## Adaptive focus rules

Each family generator already points to a focus subtype when weakness is detected.

### Relation Fit

* high role-reversal errors → focus `same_relation_mcq`
* high multi-select overreach → focus `relation_satisfaction`
* otherwise bias to `select_all_valid`

### Must Follow

* high transitive reversal → focus `must_follow_tf`
* high quantifier or conditional errors → focus `best_conclusion_mcq`
* high overreach → focus `select_all_must_follow`

### Best Rule So Far

* feature-rule errors → focus two-feature items
* overcommitment or multi-select overreach → focus `select_all_consistent`
* cycle confusion > alternation confusion → focus cycle items
* alternation confusion high → focus alternation
* otherwise bias to `confidence_update_tf`

## Wrapper progression rule

At `UP`:

* if wrapper is `real_world` → move to `mixed`
* else if speed is `normal` and wrapper cost is low → move to `fast`
* else increase tier

At `DOWN`:

* reset speed to `normal`
* reset wrapper to `real_world`
* lower tier by 1
* return to the simplest subtype for that family

That is the same portability-first logic as the rest of the system.

---

# 9. Session scheduler

The reasoning spec already recommends **weighted subset selection**, not pure random spraying. 

For this three-family version, use this hierarchy:

1. **weakness first**
2. **variety second**
3. **wrapper exposure third**
4. **difficulty fourth**

## Coach-led default

### Short session

* 2 blocks
* 2 different families
* 10 items per block

### Standard session

* 3 blocks
* 2–3 families
* 10 items per block

### Long session

* 4–5 blocks
* all 3 families represented
* one mixed-wrapper block guaranteed

## Suggested family weighting

Base weights:

* Relation Fit: 0.34
* Must Follow: 0.33
* Best Rule So Far: 0.33

Then modify:

* add +0.15 to a family with the highest current weakness
* subtract -0.10 from a family used in the last session
* add +0.10 if the family has not yet been exposed in nonsense or mixed mode

Do not repeat the same family three sessions in a row unless it is the clear weakest family.

---

# 10. Block generation logic

Each family pack already supports this model:

* load real-world items from JSON when familiar wrapper is needed
* call the family generator for nonsense items
* build one block of 10 items
* evaluate block
* update state
* choose next block

## Recommended block composition

### Real-world block

Sample 10 authored items that match:

* family
* subtype
* tier
* answer type
* optional target relation / target rule family

### Nonsense block

Generate 10 items on the fly using:

* family generator
* chosen subtype
* tier
* RNG seed

### Mixed block

Use:

* 5 real-world
* 5 nonsense

## Sampling constraints

Within a block:

* avoid duplicate logical forms
* avoid same exact relation type more than 3 times unless doing remedial focus
* avoid same correct answer position more than twice in a row
* for multi-select, vary answer cardinality across the block

---

# 11. Timing and speed modes

Use two speed modes:

* `normal`
* `fast`

Because this is reasoning rather than raw reaction, speed should affect:

* time allowed per item
* explanation duration
* inter-item gap

## Suggested first-pass timings

### Normal

* item time limit: 14–18 s
* feedback: 1.5–2.0 s

### Fast

* item time limit: 9–12 s
* feedback: 0.8–1.2 s

Different subtypes can adjust within that range:

* simple T/F slightly shorter
* multi-select slightly longer

---

# 12. Scoring

Use the same common 100-point structure already defined for the wider system:

* **Core Correctness** = 0–40
* **Complexity Hold** = 0–20
* **Stability / Efficiency** = 0–20
* **Portability** = 0–20

## Reasoning-family interpretation

### Core Correctness

* correct answers
* correct multi-select filtering
* low false positives in select-all items

### Complexity Hold

* performance at current tier
* performance under higher binding load
* performance with higher uncertainty
* performance with higher control burden

### Stability / Efficiency

* low late-block collapse
* low impulsive errors
* steady performance within block
* low timeouts

### Portability

* low drop from real-world to nonsense
* low drop in mixed blocks
* low wrapper cost
* good performance after wrapper swaps

## Family-specific scoring notes

### Relation Fit

Heavier penalty for role-reversal errors.

### Must Follow

Heavier penalty for false must-follow choices and scope mistakes.

### Best Rule So Far

Heavier penalty for premature overcommitment and confusion between rival rule families.

---

# 13. Telemetry

Store block-level telemetry.

```json
{
  "user_id": "u_123",
  "session_id": "sess_001",
  "block_index": 2,
  "family": "must_follow",
  "subtype": "best_conclusion_mcq",
  "wrapper_mode": "mixed",
  "speed_mode": "normal",
  "difficulty_tier": 3,
  "accuracy": 0.8,
  "mean_rt_ms": 6400,
  "timeouts": 1,
  "late_collapse": false,
  "transfer_score": 72,
  "decision": "HOLD",
  "error_metrics": {
    "transitive_reversal_error_rate": 0.15,
    "quantifier_scope_error_rate": 0.05,
    "conditional_chain_error_rate": 0.10,
    "multi_select_overreach": 0.00
  }
}
```

Persist:

* session summary
* block summaries
* rolling family state
* rolling wrapper state
* transfer score history

---

# 14. UI spec

Keep the screen sparse, similar in spirit to the integrated game HUD. 

## In-play HUD

Show:

* family name
* block accuracy
* transfer score
* tier
* blocks left

Optional:

* current wrapper icon
* current speed icon

Do not clutter the screen with too much theory text.

## Main item area

* premises card
* query line
* answer controls

## Answer controls

### Single choice

radio-style buttons

### True / False

two-button response

### Multi-select

checkbox-style response plus confirm button

## Feedback

Very brief:

* correct / incorrect
* one-line explanation

## Choice-point UI

Between blocks, if `UP`, surface only 2–3 options:

* swap wrapper
* go faster
* increase level

This mirrors the broader game logic directly. 

---

# 15. File integration spec

## Recommended folder structure

```text
/src/reasoning/
  /families/
    /relation-fit/
      relation-fit.real-world.examples.json
      relation-fit.nonsense-grammar.spec.json
      relation-fit.generator.js
      relation-fit.schema.json
    /must-follow/
      must-follow.real-world.examples.json
      must-follow.nonsense-grammar.spec.json
      must-follow.generator.js
      must-follow.schema.json
    /best-rule-so-far/
      best-rule-so-far.real-world.examples.json
      best-rule-so-far.nonsense-grammar.spec.json
      best-rule-so-far.generator.js
      best-rule-so-far.schema.json
  /core/
    family-registry.js
    scheduler.js
    scoring.js
    telemetry.js
    state-store.js
    item-loader.js
```

## Family registry

Create one registry file:

```js
export const FAMILY_REGISTRY = {
  relation_fit: {
    label: "Relation Fit",
    realWorldBank: () => import("../families/relation-fit/relation-fit.real-world.examples.json"),
    generator: () => import("../families/relation-fit/relation-fit.generator.js"),
    schema: () => import("../families/relation-fit/relation-fit.schema.json")
  },
  must_follow: {
    label: "Must Follow",
    realWorldBank: () => import("../families/must-follow/must-follow.real-world.examples.json"),
    generator: () => import("../families/must-follow/must-follow.generator.js"),
    schema: () => import("../families/must-follow/must-follow.schema.json")
  },
  best_rule_so_far: {
    label: "Best Rule So Far",
    realWorldBank: () => import("../families/best-rule-so-far/best-rule-so-far.real-world.examples.json"),
    generator: () => import("../families/best-rule-so-far/best-rule-so-far.generator.js"),
    schema: () => import("../families/best-rule-so-far/best-rule-so-far.schema.json")
  }
};
```

## Block generation flow

1. choose family
2. compute plan from saved state
3. pick wrapper mode
4. if real-world, sample authored bank
5. if nonsense, call family generator
6. render block
7. score block
8. update telemetry and family state
9. compute next block plan

---

# 16. MVP defaults

## First public MVP

* coach-led by default
* 10 items per block
* 2–3 blocks per session
* start at tier 1
* wrapper starts at `real_world`
* speed starts at `normal`

## Family launch defaults

### Relation Fit

Default start subtype: `same_relation_mcq`

### Must Follow

Default start subtype: `must_follow_tf`

### Best Rule So Far

Default start subtype: `best_rule_so_far_mcq` with alternation focus

## Progression defaults

* first success: move to mixed wrapper
* second clean success: move to fast mode
* only after that move to next tier

---

# 17. What not to do yet

For MVP, avoid:

* too many families at once
* matrix-style visual generation in the same engine
* long free-form text entry
* full causal-model authoring
* overly many answer formats
* very heavy mission coupling inside this screen

The current three-family set is already coherent and broad enough for an initial fluid-reasoning game.

---

# 18. One-sentence build summary

**Build Reasoning Gym as one adaptive block-based game shell with three initial families — Relation Fit, Must Follow, and Best Rule So Far — using shared item schemas, real-world and nonsense wrappers, a three-axis difficulty model, and an n-back-style UP/HOLD/DOWN progression rule where wrapper robustness is trained before raw complexity.**

 ---
  The key carryovers should be:

* **optional Zone gate / router**
* **core vs support vs recovery routing**
* **20-session coach-led core programme**
* **one engine, one UI shell, different block profiles**
* **UP / HOLD / DOWN after each block**
* **progression order = stability first, wrapper swap second, fast speed third, raw complexity later**

## 1. Overall product structure

Reasoning Gym should have **two entry modes**.

### Manual

This is simple, user-directed play.

The user picks:

* family: `Relation Fit`, `Must Follow`, `Best Rule So Far`
* subtype, if relevant
* wrapper: `real-world`, `nonsense`, or `mixed`
* speed: `normal` or `fast`
* difficulty start tier
* session length

This should feel like free practice and should **not** count toward the 20-session coach programme.

### Coach-led

This is the Trident-G style guided path.

It should:

* recommend a Zone check if none is fresh
* route into `core`, `support`, or `recovery`
* count only **core** sessions toward the 20-session programme
* use a fixed coach plan with adaptive block-by-block shaping
* end with a lightweight **mission handoff** and **script capture**, because the transfer docs explicitly place reasoning inside the larger vertical stack of **Zone → Capacity → Reasoning → Puzzle → Mission handoff → Script / Bank**. 

---

## 2. Coach-led should parallel the far-transfer protocol

The best way to mirror Capacity Gym is **not** to copy its exact family list, but to copy its **governing logic**.

Capacity Gym’s deep rule is:

* keep the kernel fixed
* vary wrapper first
* then speed
* then load / relation complexity 

Reasoning Gym should do the same, but with reasoning items:

### Reasoning coach progression rule

For a given family and subtype:

1. **stabilise on the current logical form in real-world wrapper**
2. **swap wrapper while preserving logical form**
3. **tighten timing / efficiency**
4. **increase complexity**
5. **end with one lightweight transfer prompt**

That fits the transfer documents very closely, because they explicitly say the reasoning layer should keep the logic constant, vary scenario descriptions, use real and nonsense semantics, and scale difficulty by **binding load**, **uncertainty**, and **control burden**.

---

## 3. Session routing

Use the same broad route logic as Capacity Gym.

### Zone handling

Keep Zone **recommended, not compulsory**. The transfer doc also supports Zone as an **adaptive router**, not a compulsory front gate for every session. 

Recommended routes:

* `in_zone` → `core`
* `flat` → `support`
* `locked_in` → `support`
* `spun_out` → `support`
* `invalid` → `recovery` and block coach-led start

### Core route

* counts toward the 20-session programme
* standard session length
* all 3 families available
* wrapper swaps and fast mode allowed
* mission handoff shown at end

### Support route

* does **not** count toward 20
* reduced block count
* easier tiers
* normal speed only
* real-world wrapper only, or at most very light mixed
* mostly `Relation Fit` and simpler `Must Follow`
* no heavy `Best Rule So Far` ambiguity unless performance is clearly clean

### Recovery route

* no normal coach-led reasoning session
* either:

  * Zone only
  * one very light remedial reasoning block
  * or “come back later” plus suggested easier task type

That is closely aligned with the broader routing logic in the far-transfer document, which recommends different doses and different training modes by Zone state. 

---

## 4. Coach-led programme shape

I would make this a **20-core-session programme**, just like Capacity Gym.

### What counts

* only completed `core` coach sessions count
* `support` and `recovery` never increment the 20-session ladder
* manual never increments it

### Core session size

For simplicity and parity with Capacity Gym:

* **6 blocks per core session**
* **4 blocks max for support**
* **1–2 blocks max for recovery**

That keeps the overall feel parallel.

---

## 5. Coach-led family cycle

You have 3 reasoning families, so I’d use a fixed repeating coach cycle rather than pure random assignment.

Recommended **9-session cycle**:

1. `Relation Fit`
2. `Must Follow`
3. `Best Rule So Far`
4. `Relation Fit`
5. `Must Follow`
6. `Best Rule So Far`
7. `Relation Fit`
8. `Must Follow`
9. `Best Rule So Far`

Then repeat.

That is simple, predictable, and easy to implement. If you later want to overweight foundational relation processing, you can bias the first 6 sessions slightly toward `Relation Fit`, but I would keep MVP simpler.

### Why this works

* `Relation Fit` = relation validation / structural consistency
* `Must Follow` = deduction / constraint propagation
* `Best Rule So Far` = induction / updating

So across 20 sessions the user repeatedly revisits:

* **relation validation**
* **deduction**
* **rule updating**

which is a good compact fluid-reasoning spine.

---

## 6. Within-session block plan

This is the part that should most clearly mirror the Trident far-transfer protocol.

For a **core 6-block coach-led session**, I would use:

### Block 1 — settle / baseline

* current family
* easiest stable subtype for that user
* real-world wrapper
* normal speed
* current recommended tier

### Block 2 — same logical form, same wrapper, slightly harder

* same family
* same wrapper
* same subtype or adjacent subtype
* same speed
* confirm stability

### Block 3 — wrapper swap

* same family
* same logical form class
* `mixed` or `nonsense`
* same speed
* same tier unless user is struggling

### Block 4 — second portability block

* same family
* wrapper remains swapped
* same tier or one notch up if Block 3 was strong

### Block 5 — efficiency block

* same family
* same logical form class
* fast timing unlocked if recent performance is strong
* otherwise remain normal and use a slightly cleaner item set

### Block 6 — stretch / bridge block

* same family, or occasionally a closely related subtype bridge
* one notch harder **only if** earlier blocks were clean
* then end session with handoff

That directly expresses:

* stabilise
* swap wrapper
* speed up
* then raise complexity

which is the same progression order the Capacity system uses. 

---

## 7. Adaptive rules inside a session

Use the same simple adjudication:

* `UP`
* `HOLD`
* `DOWN` 

### Suggested reasoning thresholds

For MVP:

* `UP` if accuracy ≥ `85%` and no late collapse
* `DOWN` if accuracy < `70%`
* otherwise `HOLD`

For multi-select items:

* require both decent precision and decent recall, not just total score

For timed blocks:

* also penalise excessive timeouts

### If UP

Apply next in this order:

1. wrapper swap if not yet done
2. fast mode if wrapper hold is already good
3. tier increase
4. subtype complexity increase

### If HOLD

* keep same family and same broad difficulty
* optionally rotate subtype
* keep current wrapper / speed

### If DOWN

* revert to real-world wrapper
* revert to normal speed
* drop one tier
* simplify subtype

---

## 8. Complexity progression by family

This is where the reasoning families need their own ladders.

### Relation Fit

Progression should mainly be:

1. binary relation equivalence
2. role-reversal traps
3. multi-option validity
4. select-all-valid
5. two simultaneous relations
6. chained / ternary relations later

Main complexity signals:

* `binding_load`
* `role assignment pressure`
* `multi-select overreach`

### Must Follow

Progression should mainly be:

1. short transitive chains
2. simple set inclusion/exclusion
3. conditional chains
4. mixed-polarity premises
5. best-conclusion MCQ
6. select-all-must-follow

Main complexity signals:

* number of premises
* chain length
* quantifier / negation interference
* answer overreach

### Best Rule So Far

Progression should mainly be:

1. simple alternation
2. simple ladder
3. cycle-of-3
4. pair-repeat
5. two-feature rules
6. confidence update under live rivals
7. select-all-consistent

Main complexity signals:

* rival rule count
* feature interaction
* ambiguity among candidate rules
* uncertainty level

This matches the shared reasoning-layer complexity model already defined in your documents: **binding load, uncertainty, control burden**.

---

## 9. Timers and efficiency

Yes — I do think timers should be built in, but in a controlled way.

The Capacity design already uses **normal / fast** as a meaningful progression step rather than just raw time pressure, and the scoring docs explicitly treat **stability / efficiency** and **portability** as part of the Transfer Score.

### Recommended timer model

Use two speed modes only:

* `normal`
* `fast`

Support route:

* always `normal`

Core route:

* starts `normal`
* unlocks `fast` only after strong recent performance on the same family/subtype class

### Suggested item timers

For `normal`:

* True/False: `10–12s`
* Single choice: `14–16s`
* Multi-select: `18–22s`

For `fast`:

* True/False: `7–8s`
* Single choice: `10–12s`
* Multi-select: `13–16s`

Then adjust by tier:

* higher `binding_load` or `uncertainty` can add `+1–2s`
* higher `control_burden` does **not** get much extra time, because that is part of the challenge

### Efficiency scoring

Timers should feed:

* timeouts
* mean RT
* late-block slowing
* collapse under time pressure

but should not dominate raw correctness.

---

## 10. Manual mode spec

Manual should stay very lightweight.

### UI controls

* family dropdown
* subtype dropdown, only shown if the family has meaningful subtypes
* wrapper dropdown
* speed dropdown
* starting tier dropdown
* session length dropdown

### Good defaults

* family = last used
* subtype = `auto`
* wrapper = `real-world`
* speed = `normal`
* tier = recommended tier
* session length = `2 blocks`

### Manual should still save

* block telemetry
* best tier
* wrapper exposure
* subtype weakness signals

But it should not advance the formal 20-session coach path.

---

## 11. Coach-led should include a transfer close

This is the biggest difference between “just an adaptive reasoning game” and “a Trident-G reasoning layer”.

The transfer document is very clear that the vertical stack should not end with in-app performance. It should end with:

* lightweight **mission handoff**
* and **script / bank** capture 

So every coach-led core session should end with:

### Handoff prompt

One short prompt linked to the family:

* `Relation Fit` → “Where today will you need to check whether two options are really the same relation rather than just surface lookalikes?”
* `Must Follow` → “What real task today requires identifying what actually follows, rather than what merely feels plausible?”
* `Best Rule So Far` → “Where today will you need to keep two live explanations in play rather than locking onto one too early?”

### Script capture

Three fields:

* `tactic used`
* `where this might apply today`
* `quick trap to avoid`

That keeps the app aligned with the broader mission-handoff and bank logic. 

---

## 12. Scoring and rewards

Use the same shared transfer frame already defined across Capacity, Reasoning, and Puzzle:

* `Core Correctness` 0–40
* `Complexity Hold` 0–20
* `Stability / Efficiency` 0–20
* `Portability` 0–20 

### In Reasoning Gym

* correctness = right answers
* complexity hold = binding load / uncertainty / control burden held cleanly
* stability / efficiency = low collapse, low impulsive misses, good timing control
* portability = wrapper-swap hold across real-world and nonsense

And if you want to keep currency aligned:

* `g = 3 + 0.08 × Transfer Score + bonuses` per reasoning module is still the cleanest shared rule. 

---

## 13. My strongest recommendation

Build Reasoning Gym like this:

### Manual

A simple free-play mode with:

* family dropdown
* optional subtype dropdown
* wrapper, speed, and difficulty choices
* no formal programme progression

### Coach-led

A **20-core-session programme** with:

* optional Zone check
* `core / support / recovery` routing
* **6-block core sessions**
* a fixed 3-family repeating cycle
* within-session progression that mirrors Capacity Gym:

  * stabilise
  * wrapper swap
  * fast mode
  * then complexity
* end-of-session mission handoff and script capture

That gives you a reasoning app that is not just adaptive, but adaptive in a way that **actually parallels the Trident far-transfer protocol**, rather than merely copying n-back mechanics.

 

