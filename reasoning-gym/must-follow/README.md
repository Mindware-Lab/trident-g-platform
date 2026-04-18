# Must Follow family pack

This pack contains the second fluid-reasoning family for the Reasoning Gym MVP.

## Initial 3-family recommendation
1. **Relation Fit** — relation validation / relation instantiation / same deep relation  
2. **Must Follow** — deduction / necessary consequence / constraint propagation  
3. **Best Rule So Far** — induction / updating / rival-rule tracking  

This pack implements **Family 2 only**.

## Included files
- `must-follow.real-world.examples.json` — 360 authored real-world items
- `must-follow.nonsense-grammar.spec.json` — pronounceable nonsense generation rules, morphology, answer types, complexity rules, and adaptive rules
- `must-follow.generator.js` — ES module to generate nonsense items and adaptive block plans
- `must-follow.schema.json` — JSON schema for item objects
- `must-follow.generator.txt` — plain-text copy of the JS module

## Family definition
Core task:
> Decide which conclusion must follow from the premises.

Supported subtypes:
- `must_follow_tf`
- `best_conclusion_mcq`
- `select_all_must_follow`
- optional later: `cannot_follow_mcq`

## Answer types
- `true_false`
- `single_choice`
- `multi_select`

## Complexity axes
- `binding_load`
- `uncertainty_level`
- `control_burden`

## Complexity progression
- Tier 1–2 = short transitive chains and simple quantifier chains
- Tier 3 = longer chains, extra premises, stronger distractors, wrapper swap
- Tier 4 = mixed positive and negative constraints, multi-select pressure
- Tier 5 = multi-conclusion chains with high control burden

## Adaptive rule
Use a block-level UP / HOLD / DOWN decision, mirroring the broader integrated-game logic:
1. stabilise first
2. swap wrapper
3. go faster
4. then increase load / relation complexity

That means the family should keep the same deep deduction kernel while varying the wrapper before pushing tier.

## Suggested webapp use
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
