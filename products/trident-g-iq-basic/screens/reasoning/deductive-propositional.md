# Constraint Gym v1 — deductive / propositional reasoning spec

## 1. Purpose

Constraint Gym is the second Reasoning Gym family. Its job is to train **deductive / propositional reasoning** inside short, verbal, structurally generated rounds.

Deductive reasoning here means:

> given a set of rules, conditions, or constraints, determine what must follow, what remains possible, or what must be ruled out.

The aim is not to train trivia recall. The aim is to train disciplined reasoning from explicit premises.

This family is the clearest home for:
- propositional reasoning
- conditional reasoning
- quantifier-style reasoning
- elimination under constraints
- simple quantity-constrained fit

## 2. User-facing definition

**Constraint Gym**  
You are shown a small set of rules, conditions, or limits.  
Your task is to work out what must follow, what still fits, or what is impossible.

## 3. What this game is training

This family is designed to train the player to:

- separate logical form from surface meaning
- reason from explicit premises
- track conditionals and dependencies
- detect when an option violates a rule
- eliminate impossible alternatives
- hold several constraints together at once
- resist belief-consistent but invalid conclusions
- manage negations, exceptions, and limited quantities

## 4. What it is not

This family is **not**:

- a general knowledge quiz
- an opinion task
- a “most likely in real life” judgement
- a vague interpretation exercise

Every item must have:
- a clear premise set
- one keyed answer or one keyed valid set
- wrong answers that fail for principled logical reasons

## 5. Syntax and semantics

### Syntax
- **verbal only** in v1

### Semantics
- **real-world verbal only** in v1

However, semantic familiarity must not be needed to solve the item. The item should be answerable from the stated form and constraints alone.

Allowed content types:
- task rules
- access rules
- scheduling constraints
- route constraints
- category membership
- simple policy rules
- quantity limits
- conditional permissions or prohibitions

## 6. Core game modes

Constraint Gym v1 should include three modes.

### A. Must Follow?
Given a set of premises, which conclusion must be true?

### B. Which Option Fits?
Given a set of rules, which option satisfies all constraints?

### C. Eliminate the Impossible
Given a set of possibilities and rules, which option or options must be ruled out?

These three modes cover most of the first-pass deductive / propositional space without bloating the build.

## 7. Core game shell

Every round uses the shared Reasoning Gym shell.

### Prompt card
A short set of rules, conditions, or scenario constraints.

### Question
One explicit reasoning judgement, such as:
- Which must follow?
- Which option fits all constraints?
- Which option is impossible?

### Answer format
- usually 2–4 options
- one tap submits
- no free-text response in v1

### Feedback
- correct / incorrect
- one-sentence explanation
- highlight the violated rule or the binding that made the answer necessary

### End-of-set summary
- accuracy
- average response time
- difficulty band reached
- process profile

## 8. Item structure

Each item should be generated from a hidden constraint structure rather than authored only as surface prose.

### Hidden item model
Each item contains:

- `premises[]`
- `candidate_options[]`
- `correct_option_index` or `correct_option_set`
- `constraint_graph`
- `violated_rule_map`
- `difficulty_band`
- `pab`
- deductive modifiers

### Design rule
The answer must be keyed from the **explicitly stated premises**.

Wrong options should fail because they:
- violate a rule
- ignore a quantifier
- break a conditional
- overgeneralise from a premise
- confuse possibility with necessity
- fail a hidden conjunction of constraints

## 9. Underlying logical-template logic

Items should be built from recurring logical forms.

### Recommended v1 logical templates

1. **If–then chain**
2. **Conjunction requirement**
3. **Disjunction with exclusion**
4. **Necessary vs sufficient condition**
5. **All / some / none quantifier pattern**
6. **Mutual exclusion set**
7. **Exactly one / at least one / at most one**
8. **Capacity-limited fit**
9. **Permission vs prohibition**
10. **Conditional exception**
11. **Order constraint with blocking rule**
12. **Belief-bias trap** where plausible meaning conflicts with valid inference

These templates should be reusable across many surface domains.

## 10. Premise and clue types

Allowed inputs in v1:

- conditional rules
- inclusion / exclusion rules
- quantity limits
- role assignments
- route permissions
- temporal constraints
- exception clauses
- category membership rules
- negated rules

Examples:
- “If a task needs approval, it cannot start before review.”
- “All items sent to Bay C must be scanned.”
- “No express order can use Route B.”
- “At most one blue crate can be loaded per run.”
- “If Alex is on duty, Jordan cannot be on Gate 2.”

## 11. Difficulty model

Constraint complexity should be defined using the shared reasoning backbone:

**Complexity = PAB + deductive modifiers**

### Core metric
`PAB` = Peak Active Bindings  
The minimum number of relations that must be simultaneously active for an ideal solver to answer correctly.

### Deductive modifiers
Use:

- `E` = exception / negation load
- `Q` = quantitative comparison load
- `R` = revision or re-parse requirement where an initially tempting reading must be corrected

So for this family:

**Deductive complexity = PAB + E + Q + R**

### Interpretation

- `PAB` captures how many premise bindings must be held together
- `E` captures the load from negation, exception, or prohibition
- `Q` captures numeric or limit-based comparison demand
- `R` captures cases where the player must revise an intuitive but invalid parse

## 12. Difficulty bands

### Band A — direct conditional
- 2 options
- one simple if–then rule
- low PAB
- no exceptions
- obvious must-follow structure

### Band B — conjunction or exclusion
- 3 options
- 2 rules must be coordinated
- one distractor violates one rule only

### Band C — multi-rule fit
- 3–4 options
- 3 constraints must be held together
- moderate PAB
- requires elimination rather than immediate conclusion

### Band D — negation / exception load
- prohibition, exception, or “unless” clause present
- stronger E demand

### Band E — quantity-constrained fit
- simple limits, counts, or capacities
- stronger Q demand

### Band F — belief-bias or parse trap
- surface-plausible option conflicts with the actual logic
- player must reason from form, not intuition
- strongest v1 deductive load

## 13. Capacity linkage

Constraint Gym should map primarily onto:

**Flex → Bind → Relate**

### Flex demand
The player must shift from a surface-plausible reading to the actual logical frame.

Operational signs:
- choosing the “sounds right” answer
- failing to re-parse an exception or conditional correctly

### Bind demand
The player must keep several rule-elements linked correctly.

Operational signs:
- dropping one clause
- mishandling conjunctions
- treating separate conditions as independent when they are not

### Relate demand
The player must coordinate the full set of premises and implications.

Operational signs:
- partial rule application
- failure to compare possibilities globally
- missing deeper consistency across the whole rule set

## 14. Error classification

Wrong answers should be tagged where possible.

### Core error tags
- `belief_bias_capture`
- `conditional_misread`
- `conjunction_drop`
- `negation_or_exception_miss`
- `quantity_limit_miss`
- `global_fit_failure`
- `fast_guess_or_timeout`
- `none`

### Optional secondary tags
- `possibility_vs_necessity_confusion`
- `sufficient_vs_necessary_confusion`
- `mutual_exclusion_miss`
- `order_constraint_miss`

## 15. Telemetry

### Required per-item logs
- `game_family`
- `game_mode`
- `item_id`
- `difficulty_band`
- `pab`
- `e`
- `q`
- `r`
- `is_correct`
- `chosen_option`
- `correct_option`
- `response_time_ms`
- `error_type`
- `timestamp`
- `session_id`
- `user_id`

### Derived metrics
- accuracy
- mean response time
- exception-handling failure rate
- quantity-limit failure rate
- belief-bias capture rate
- performance by difficulty band
- performance by modifier profile

### Coach-facing summary labels
- **Rule holding**
- **Exception handling**
- **Form over meaning**
- **Constraint integration**

## 16. Item-writing and generator rules

### Hard rules
- the answer must follow from the given premises only
- every premise should matter, unless the item is intentionally testing redundancy
- distractors should fail for principled logical reasons
- avoid unnecessary reading burden
- avoid domain knowledge dependence
- do not write trick questions whose only difficulty is confusing wording
- if using real-world semantics, make sure validity depends on the rules, not on plausibility

### Generator workflow
1. choose logical template
2. choose difficulty band
3. instantiate premise structure
4. generate candidate options
5. compute which option follows / fits / fails
6. generate violated-rule map
7. generate explanation feedback
8. tag likely error classes

## 17. Example structural templates

### Template name
`necessary_vs_sufficient`

### Hidden structure
- one condition is required
- another condition is enough but not required
- distractor confuses these

### Example item
**Premises**
- If a pass is marked red, it must be reviewed.
- Some reviewed passes are escalated.
- No unreviewed pass can be escalated.

**Question**
Which statement must be true?

**Options**
- Every reviewed pass is escalated.
- Any escalated pass has been reviewed.
- Any red pass is escalated.

**Correct**
- Any escalated pass has been reviewed.

### Example tags
- `pab = 3`
- `e = 1`
- `q = 0`
- `r = 1`
- wrong answer `Any red pass is escalated` -> `sufficient_vs_necessary_confusion`

## 18. Belief-bias handling

Constraint Gym is the natural place to build from your long-standing work on belief bias and form-versus-semantics separation.

### Design rule
Some items should deliberately contrast:
- a conclusion that sounds plausible
- with the conclusion that actually follows from the premises

But the trap must remain fair:
- the premises must be clear
- the correct answer must be derivable from form
- the item should not depend on obscure factual knowledge

### Why this matters
This lets the game train:
- form over semantic plausibility
- resistance to intuitive but invalid inference
- clean separation of stated rule structure from prior belief

## 19. UI copy style

Keep the tone:
- plain
- calm
- concise
- non-technical
- easy to scan

Good examples:
- “Use the rules, not the guess.”
- “What must follow?”
- “One violated rule is enough.”
- “Check all the constraints.”
- “Plausible is not the same as valid.”

## 20. Acceptance criteria

Constraint Gym v1 is complete when:

- the user can launch all three core modes
- all items are verbal and real-world based
- every item has a keyed logical answer
- generator supports multiple logical templates
- difficulty bands A–F are working
- telemetry logs PAB and deductive modifiers
- wrong answers can be meaningfully tagged
- end-of-set summary shows core performance signals
- belief-bias style items are included but remain fair
- UI remains simple and consistent with the shared shell

## 21. Planned next extensions

After v1 stabilises, extend Constraint Gym with:

- more formal quantifier sets
- richer quantity logic
- artificial micro-world rule sets if needed
- syntax swaps later
- tighter integration with Pattern-style puzzle work
- mission bootcamp links for Allocate and Choose frames

## One-line summary

**Constraint Gym v1 should be a verbal, real-world, structurally generated deductive / propositional reasoning family in which the player infers what must follow, what fits all constraints, or what must be eliminated, with complexity defined by Peak Active Bindings plus modifiers for exception load, quantity comparison load, and revision demand.**
