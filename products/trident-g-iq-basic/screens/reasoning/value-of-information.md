# Probe Gym v1.2 — value-of-information / best next check spec

## 1. Purpose

**Best Next Check** is the third Probe Gym mode. It trains **value-of-information reasoning** in a verbal-first, user-facing format.

The purpose is not to teach formal information theory. The purpose is to train the practical reasoning move:

> given several live explanations, choose the **next check** that would separate them most efficiently.

This mode follows naturally after:

- **Best Explanation** — choose the strongest current explanation
- **Update the Model** — revise that explanation after a new clue
- **Best Next Check** — choose the most diagnostic next probe

## 2. User-facing definition

**Best Next Check**  
You are shown a short clue set, a small number of candidate explanations, and several possible checks.  
Your task is to choose the check that would best reduce uncertainty or separate the live explanations.

## 3. What this game is training

This mode is designed to train the player to:

- distinguish informative from uninformative checks
- choose a probe that separates live hypotheses rather than merely collecting more data
- avoid low-value but tempting checks
- notice when a check would confirm several explanations equally and is therefore weak
- think in terms of **discrimination power**, not just curiosity
- prefer the cheapest high-value probe over broad but unfocused information gathering

## 4. What it is not

This mode is **not**:

- a general “what would you do?” opinion task
- a broad strategy simulation
- a free-form planning exercise
- a pure knowledge quiz
- an arbitrary “best practice” judgement

Every item must have:
- a clear set of live candidate explanations
- a clear set of possible checks
- one keyed best next check
- wrong options that are wrong for principled informational reasons

## 5. Syntax and semantic curriculum

### Syntax
- **verbal only** in v1.2

### Wrapper types
This mode uses the same wrapper types as the earlier Probe modes:

- **real-world verbal**
- **artificial micro-world verbal**

### Real-world verbal
Used to:
- introduce new VOI templates
- anchor probe selection in meaningful scenarios
- make the notion of “diagnostic check” intuitive

### Artificial micro-world verbal
Used to:
- provide scalable repeat training
- separate informational structure from familiar semantics
- preserve the same underlying diagnostic logic across many cases

Artificial micro-world items must be:
- rule-grounded
- stable across repeated play
- logically interpretable
- built from the same latent causal templates as the real-world items

### Ratio policy
Use the same phase-based curriculum as the earlier Probe modes.

#### First exposure to a new template or difficulty band
- **4 real-world : 1 artificial micro-world**

#### Early consolidation
- **2 real-world : 3 artificial micro-world**

#### Steady-state repeat training after the template is learned
- **1 real-world : 8–10 artificial micro-world**

#### Milestone or transfer checks
- include **1–2 real-world anchor items** per block

## 6. Core game shell

Every round uses a diagnostic-choice version of the shared Reasoning Gym shell.

### Prompt card
Show:
- initial clue set
- candidate explanations
- possible next checks

### Question
**Which next check would best separate the explanations?**

### Answer format
- usually 2–4 check options
- one tap selects and submits

### Feedback
- correct / incorrect
- one-sentence explanation
- explain which hypotheses the chosen check would or would not separate

### End-of-set summary
- accuracy
- average response time
- difficulty band reached
- probe-selection profile

## 7. Alternative question variants

The primary v1.2 question should remain:

- **Which next check is best?**

Optional later variants:
- Which check is least useful?
- Which check would rule out the most explanations?
- Which check is broad but low value?
- Which check is diagnostic at lowest cost?

These should come later, not in the first pass.

## 8. Item structure

Each item should be generated from a hidden causal template plus a probe-discrimination matrix.

### Hidden item model
Each item contains:

- `candidate_hypotheses[]`
- `initial_clues[]`
- `probe_options[]`
- `probe_discrimination_matrix`
- `correct_option_index`
- `difficulty_band`
- `wrapper_type`
- `pab`
- class-specific modifiers

### Design rule
The keyed best next check must be the one that gives the strongest expected discrimination among the live explanations, not simply the most interesting or the most general check.

Wrong options should fail because they:
- would support several hypotheses equally
- would not change the ranking of the live models much
- are too downstream or too indirect
- gather data that is already largely implied
- are broad but not discriminative

## 9. Underlying VOI logic

Items should be built from recurring diagnostic-probe structures.

### Recommended v1.2 templates

1. **Two live explanations, one decisive separator**
2. **One tempting but low-yield check vs one high-yield check**
3. **Shared downstream symptom vs upstream discriminating test**
4. **Broad check vs narrow decisive probe**
5. **Confirmatory check vs truly separating check**
6. **Costly broad probe vs cheap local discriminator**
7. **Visible symptom check vs source-state check**
8. **Negative evidence probe that would collapse one explanation**
9. **Timing check that distinguishes rival mechanisms**
10. **Dependency check that reveals whether the issue is local or shared**

These templates should be reusable across both real-world and artificial micro-world wrappers.

## 10. Allowed clue and check types

### Allowed clue types
- causal clues
- state-change clues
- dependency clues
- quantity clues
- timing / sequence clues
- described spatial clues
- negative evidence
- exception cues

### Allowed check types
- inspect an upstream state
- test a linked downstream point
- compare another location / instance
- query timing or sequence history
- check whether a shared dependency is active
- test a condition that only one hypothesis predicts
- inspect a boundary case
- run a comparison that distinguishes local vs shared cause

The key rule is:
- the best check must be **diagnostic**, not just additional information

## 11. Difficulty model

VOI complexity should be defined using the universal reasoning backbone:

**Complexity = PAB + VOI modifiers**

### Core metric
`PAB` = Peak Active Bindings  
The minimum number of relations that must be simultaneously active for an ideal solver to choose the best next check.

### VOI modifiers
Use:

- `H` = live hypothesis competition
- `D` = dependency depth
- `R` = revision anticipation demand
- `Q` = quantitative comparison load

So for this family:

**VOI complexity = PAB + H + D + R + Q**

### Interpretation

- `PAB` captures how many clue–hypothesis–probe relations must be coordinated
- `H` captures how many live explanations are still in play
- `D` captures how far the diagnostic check sits from the visible symptom
- `R` captures whether the player must anticipate a major re-ranking if the check comes back a certain way
- `Q` captures any quantity-based comparison burden

## 12. Difficulty bands

### Band A — simple separator
- 2 explanations
- 2 check options
- one check clearly separates the live models
- low PAB

### Band B — tempting low-value check
- 3 check options
- one obvious but weak check
- one better discriminating check
- moderate Resist demand

### Band C — two-step discrimination
- 2–3 live explanations
- the best check targets an upstream difference
- moderate PAB and D load

### Band D — local vs shared probe
- visible symptoms tempt a local check
- best check targets shared source or dependency
- stronger Relate demand

### Band E — revision-aware check choice
- the player must choose the check that would most strongly change the model
- stronger Flex / revision anticipation

### Band F — high-complexity diagnostic selection
- 3–4 live explanations
- 4 check options
- broad vs narrow vs decisive trade-off
- strongest v1.2 VOI load

## 13. Capacity linkage

This mode should map primarily onto:

**Resist → Flex → Relate**

### Resist demand
The player must avoid seductive but low-value checks.

Operational signs:
- picking the most obvious symptom check
- choosing a broad but uninformative check
- choosing a probe that merely repeats what is already known

### Flex demand
The player must anticipate how a check would change the model.

Operational signs:
- failing to choose the check that would most re-rank the explanations
- choosing a check that confirms rather than separates
- preferring status quo-compatible checks

### Relate demand
The player must coordinate clues, candidate explanations, and probe consequences.

Operational signs:
- failing to link probe results to the live model set
- missing dependency structure
- choosing a locally sensible but globally weak test

## 14. Error classification

Wrong answers should be tagged where possible.

### Core error tags
- `salient_but_low_value_probe`
- `confirmatory_probe_capture`
- `upstream_discrimination_miss`
- `integration_failure`
- `revision_anticipation_failure`
- `quantity_probe_miss`
- `fast_guess_or_timeout`
- `none`

### Optional secondary tags
- `negative_evidence_probe_miss`
- `timing_probe_miss`
- `local_vs_shared_probe_miss`
- `redundant_check_choice`

## 15. Telemetry

### Required per-item logs
- `game_family`
- `game_mode`
- `item_id`
- `difficulty_band`
- `wrapper_type`
- `pab`
- `h`
- `d`
- `r`
- `q`
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
- low-value probe capture rate
- upstream discrimination miss rate
- revision anticipation failure rate
- performance by difficulty band
- performance by modifier profile
- performance by wrapper type
- real-world vs artificial micro-world gap

### Coach-facing summary labels
- **Probe choice**
- **Diagnostic sharpness**
- **Upstream checking**
- **Model-separating judgement**

## 16. Item-writing and generator rules

### Hard rules
- exactly one keyed best next check
- live explanations must genuinely differ in what they predict
- the best probe must separate the live models better than the alternatives
- every item must be answerable from the provided information
- distractor checks should be psychologically plausible
- avoid arbitrary “expert knowledge” answers
- keep wording short
- difficulty should come from diagnostic structure, not reading burden alone

### Generator workflow
1. choose latent VOI template
2. choose difficulty band
3. choose wrapper type
4. instantiate hidden causal graph
5. generate initial clue set
6. generate candidate explanations
7. generate probe options
8. compute probe discrimination matrix
9. choose keyed best probe
10. generate explanation feedback
11. tag likely error classes

## 17. Newness rule

A puzzle counts as new when at least one of the following changes:

- latent diagnostic structure
- initial clue pattern
- candidate explanation set
- probe option set
- decisive separating relation
- wrapper instantiation
- clue or option order

Exact repeats should be rare and used mainly for calibration or retest.

## 18. Example structural template

### Template name
`local_symptom_check_vs_shared_source_check`

### Hidden structure
- one local explanation predicts a fault at the visible point only
- one shared explanation predicts linked failures elsewhere
- the best next check is to inspect a second linked point or source-state marker
- the tempting wrong check is to inspect the already visible symptom more closely

### Correct pattern
- best next check targets the point of divergence between the live explanations

## 19. Example real-world item

**Clues**
- The corridor light is off.
- The lamp in that corridor was flickering earlier.

**Possible explanations**
- bulb failure
- circuit trip
- timer shutoff

**Possible next checks**
- inspect the bulb
- test a nearby socket
- check the wall paint around the lamp

**Question**
Which next check would best separate the explanations?

**Correct**
- test a nearby socket

**Why**
- A nearby dead socket would support a shared power problem, while a live socket would leave a local bulb failure more likely.

### Example tags
- `wrapper_type = real_world`
- `pab = 3`
- `h = 2`
- `d = 1`
- `r = 1`
- `q = 0`
- wrong answer `inspect the bulb` -> `confirmatory_probe_capture`

## 20. Example artificial micro-world item

**Rules**
- If a `zor trip` happens, the `trex gate` goes down.
- If the `trex gate` is down, nearby `flens` go cold.
- A `miv fault` dims one `narlit` only.

**Clues**
- The `narlit` is dim.

**Possible explanations**
- miv fault
- zor trip
- timer shutoff

**Possible next checks**
- inspect the `narlit`
- test a nearby `flen`
- polish the `narlit` housing

**Question**
Which next check would best separate the explanations?

**Correct**
- test a nearby `flen`

**Why**
- A cold nearby `flen` would support the shared upstream explanation rather than a local fault.

### Example tags
- `wrapper_type = artificial_micro_world`
- `pab = 3`
- `h = 2`
- `d = 2`
- `r = 1`
- `q = 0`

## 21. UI copy style

Keep the tone:
- plain
- calm
- non-technical
- older-friendly
- fast to read

Good examples:
- “Choose the best next check.”
- “Which test would separate the explanations?”
- “A good check changes the balance.”
- “Do not just look harder at the same symptom.”
- “Probe where the explanations differ.”

## 22. Acceptance criteria

Best Next Check v1.2 is complete when:

- the user can launch a Best Next Check session
- all items are verbal
- every item has one keyed best next check
- generator supports multiple VOI templates
- difficulty bands A–F are working
- telemetry logs PAB and VOI modifiers
- wrong answers can be meaningfully tagged
- end-of-set summary shows probe-selection performance signals
- both real-world and artificial micro-world wrappers can run
- wrapper mix can change by learning stage
- artificial items are rule-grounded rather than arbitrary nonsense
- UI remains simple and consistent with the shared shell

## 23. Probe family completion note

With this mode implemented, the first Probe family is complete at v1 level:

- **Best Explanation**
- **Update the Model**
- **Best Next Check**

This gives one coherent introductory cluster for:
- abductive reasoning
- evidential updating
- value-of-information reasoning

## One-line summary

**Best Next Check v1.2 should be a verbal, structurally generated value-of-information game in which the player selects the most diagnostic next probe for separating live explanations, using real-world verbal items to teach and anchor diagnostic templates and rule-grounded artificial micro-world verbal items to provide scalable repeat training, with complexity defined by Peak Active Bindings plus modifiers for hypothesis competition, dependency depth, revision anticipation, and quantitative comparison load.**
