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

 
