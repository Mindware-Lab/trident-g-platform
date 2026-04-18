# Best Rule So Far family pack

This pack contains the third fluid-reasoning family for the Reasoning Gym MVP.

## Initial 3-family recommendation
1. **Relation Fit** — relation validation / relation instantiation / same deep relation  
2. **Must Follow** — deduction / necessary consequence / constraint propagation  
3. **Best Rule So Far** — induction / updating / rival-rule tracking  

This pack implements **Family 3 only**.

## Included files
- `best-rule-so-far.real-world.examples.json` — 360 authored real-world items
- `best-rule-so-far.nonsense-grammar.spec.json` — pronounceable nonsense generation rules, morphology, answer types, complexity rules, and adaptive rules
- `best-rule-so-far.generator.js` — ES module to generate nonsense items and adaptive block plans
- `best-rule-so-far.schema.json` — JSON schema for item objects
- `best-rule-so-far.generator.txt` — plain-text copy of the JS module

## Family definition
Core task:
> Decide which rule currently best explains the observations, which rules remain live, or whether confidence in a current best rule should rise.

Supported subtypes:
- `best_rule_so_far_mcq`
- `confidence_update_tf`
- `select_all_consistent`
- optional later: `rule_ranking_later`

## Answer types
- `single_choice`
- `true_false`
- `multi_select`

## Complexity axes
- `binding_load`
- `uncertainty_level`
- `control_burden`

## Complexity progression
- Tier 1 = simple one-dimensional alternation or +1 ladder rules
- Tier 2 = cycle-of-3 and +2 ladder rules with stronger distractors
- Tier 3 = pair-repeat and longer sequences, plus more rival rules
- Tier 4 = two-feature rules and more confidence-update items
- Tier 5 = high-load feature rules, noisy updates, and multi-select filtering

## Adaptive rule
Use a block-level UP / HOLD / DOWN decision, mirroring the broader integrated-game logic:
1. stabilise first
2. swap wrapper
3. go faster
4. then increase load / rule complexity

That means the family should keep the same deep induction kernel while varying wrapper before pushing tier.

## Suggested webapp use
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
