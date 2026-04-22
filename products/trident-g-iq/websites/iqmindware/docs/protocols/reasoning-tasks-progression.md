# Reasoning Tasks Progression Protocol

This document contains the current Reasoning Gym MVP family progression notes from the uploaded family-pack markdown documents.

## Initial 3-Family Recommendation

1. **Relation Fit** - relation validation / relation instantiation / same deep relation
2. **Must Follow** - deduction / necessary consequence / constraint propagation
3. **Best Rule So Far** - induction / updating / rival-rule tracking

## Family 1: Relation Fit

This pack contains the first fluid-reasoning family for the Reasoning Gym MVP.

This pack implements **Family 1 only**.

## Included Files

- `relation-fit.real-world.examples.json` - 264 authored real-world items
- `relation-fit.nonsense-grammar.spec.json` - pronounceable nonsense generation rules, morphology, answer types, complexity rules, and adaptive rules
- `relation-fit.generator.js` - ES module to generate nonsense items and adaptive block plans
- `relation-fit.schema.json` - JSON schema for item objects

## Family Definition

Core task:

> Identify whether one or more options instantiate a target abstract relation.

Supported subtypes:

- `same_relation_mcq`
- `select_all_valid`
- `relation_satisfaction`
- `multi_relation_validation`

## Answer Types

- `single_choice`
- `multi_select`
- optional later: `true_false`

## Complexity Axes

- `binding_load`
- `uncertainty_level`
- `control_burden`

## Adaptive Rule

Use a block-level UP / HOLD / DOWN decision, mirroring the broader integrated-game logic:

1. stabilise first
2. swap wrapper
3. go faster
4. then increase load / relation complexity

That means the family should keep the same deep kernel while varying the wrapper before pushing tier.

## Suggested Webapp Use

- Load real-world items from the JSON file for familiar-wrapper blocks
- Use `relation-fit.generator.js` for nonsense / abstract-wrapper blocks
- Persist block state with:
  - current tier
  - wrapper mode
  - speed mode
  - recent accuracy
  - role-reversal error rate
  - wrapper cost

## Notes

- Tier 1-2 = binary relation validation
- Tier 3 = wrapper swap and multi-select pressure
- Tier 4 = chained or 3-argument relations
- Tier 5 = graph-role / structural isomorphism later

## Family 2: Must Follow

This pack contains the second fluid-reasoning family for the Reasoning Gym MVP.

This pack implements **Family 2 only**.

## Included Files

- `must-follow.real-world.examples.json` - 360 authored real-world items
- `must-follow.nonsense-grammar.spec.json` - pronounceable nonsense generation rules, morphology, answer types, complexity rules, and adaptive rules
- `must-follow.generator.js` - ES module to generate nonsense items and adaptive block plans
- `must-follow.schema.json` - JSON schema for item objects
- `must-follow.generator.txt` - plain-text copy of the JS module

## Family Definition

Core task:

> Decide which conclusion must follow from the premises.

Supported subtypes:

- `must_follow_tf`
- `best_conclusion_mcq`
- `select_all_must_follow`
- optional later: `cannot_follow_mcq`

## Answer Types

- `true_false`
- `single_choice`
- `multi_select`

## Complexity Axes

- `binding_load`
- `uncertainty_level`
- `control_burden`

## Complexity Progression

- Tier 1-2 = short transitive chains and simple quantifier chains
- Tier 3 = longer chains, extra premises, stronger distractors, wrapper swap
- Tier 4 = mixed positive and negative constraints, multi-select pressure
- Tier 5 = multi-conclusion chains with high control burden

## Adaptive Rule

Use a block-level UP / HOLD / DOWN decision, mirroring the broader integrated-game logic:

1. stabilise first
2. swap wrapper
3. go faster
4. then increase load / relation complexity

That means the family should keep the same deep deduction kernel while varying the wrapper before pushing tier.

## Suggested Webapp Use

- Load real-world items from the JSON file for familiar-wrapper blocks
- Use `must-follow.generator.js` for nonsense / abstract-wrapper blocks
- Persist block state with:
  - current tier
  - wrapper mode
  - speed mode
  - recent accuracy
  - transitive-reversal error rate
  - quantifier-scope error rate
  - conditional-chain error rate
  - wrapper cost

## Notes

- The real-world file includes order, set-inclusion, set-exclusion, conditional-chain, and multi-select chain items.
- The nonsense generator currently supports transitive, quantifier, and conditional chain items.
- The family is designed to expand later into richer syllogistic or relational-constraint variants.

## Family 3: Best Rule So Far

This pack contains the third fluid-reasoning family for the Reasoning Gym MVP.

This pack implements **Family 3 only**.

## Included Files

- `best-rule-so-far.real-world.examples.json` - 360 authored real-world items
- `best-rule-so-far.nonsense-grammar.spec.json` - pronounceable nonsense generation rules, morphology, answer types, complexity rules, and adaptive rules
- `best-rule-so-far.generator.js` - ES module to generate nonsense items and adaptive block plans
- `best-rule-so-far.schema.json` - JSON schema for item objects
- `best-rule-so-far.generator.txt` - plain-text copy of the JS module

## Family Definition

Core task:

> Decide which rule currently best explains the observations, which rules remain live, or whether confidence in a current best rule should rise.

Supported subtypes:

- `best_rule_so_far_mcq`
- `confidence_update_tf`
- `select_all_consistent`
- optional later: `rule_ranking_later`

## Answer Types

- `single_choice`
- `true_false`
- `multi_select`

## Complexity Axes

- `binding_load`
- `uncertainty_level`
- `control_burden`

## Complexity Progression

- Tier 1 = simple one-dimensional alternation or +1 ladder rules
- Tier 2 = cycle-of-3 and +2 ladder rules with stronger distractors
- Tier 3 = pair-repeat and longer sequences, plus more rival rules
- Tier 4 = two-feature rules and more confidence-update items
- Tier 5 = high-load feature rules, noisy updates, and multi-select filtering

## Adaptive Rule

Use a block-level UP / HOLD / DOWN decision, mirroring the broader integrated-game logic:

1. stabilise first
2. swap wrapper
3. go faster
4. then increase load / rule complexity

That means the family should keep the same deep induction kernel while varying wrapper before pushing tier.

## Suggested Webapp Use

- Load real-world items from the JSON file for familiar-wrapper blocks
- Use `best-rule-so-far.generator.js` for nonsense / abstract-wrapper blocks
- Persist block state with:
  - current tier
  - wrapper mode
  - speed mode
  - recent accuracy
  - alternation confusion rate
  - cycle confusion rate
  - feature-rule error rate
  - overcommitment rate
  - multi-select overreach
  - wrapper cost

## Notes

- The real-world file includes one-dimensional sequence rules, confidence-update items, and multi-select consistency items.
- The nonsense generator supports alternation, cycle, ladder-step, pair-repeat, and two-feature items.
- The family is designed to expand later into richer causal-model, matrix-rule, and verbal-category induction variants.
