# Relation Fit family pack

This pack contains the first fluid-reasoning family for the Reasoning Gym MVP.

## Initial 3-family recommendation
1. **Relation Fit** — relation validation / relation instantiation / same deep relation  
2. **Must Follow** — deduction / necessary consequence / constraint propagation  
3. **Best Rule So Far** — induction / updating / rival-rule tracking  

This pack implements **Family 1 only**.

## Included files
- `relation-fit.real-world.examples.json` — 264 authored real-world items
- `relation-fit.nonsense-grammar.spec.json` — pronounceable nonsense generation rules, morphology, answer types, complexity rules, and adaptive rules
- `relation-fit.generator.js` — ES module to generate nonsense items and adaptive block plans
- `relation-fit.schema.json` — JSON schema for item objects

## Family definition
Core task:
> Identify whether one or more options instantiate a target abstract relation.

Supported subtypes:
- `same_relation_mcq`
- `select_all_valid`
- `relation_satisfaction`
- `multi_relation_validation`

## Answer types
- `single_choice`
- `multi_select`
- optional later: `true_false`

## Complexity axes
- `binding_load`
- `uncertainty_level`
- `control_burden`

## Adaptive rule
Use a block-level UP / HOLD / DOWN decision, mirroring the broader integrated-game logic:
1. stabilise first
2. swap wrapper
3. go faster
4. then increase load / relation complexity

That means the family should keep the same deep kernel while varying the wrapper before pushing tier.

## Suggested webapp use
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
- Tier 1–2 = binary relation validation
- Tier 3 = wrapper swap and multi-select pressure
- Tier 4 = chained or 3-argument relations
- Tier 5 = graph-role / structural isomorphism later
