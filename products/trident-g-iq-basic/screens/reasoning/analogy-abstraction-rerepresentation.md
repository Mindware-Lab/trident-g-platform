# Reframe Gym v1 — analogy / abstraction / re-representation spec

## 1. Purpose

Reframe Gym is the fifth Reasoning Gym family. Its job is to train **reframing, analogical reasoning, abstraction, and invariant extraction** in a verbal-first format.

Reframing here means:

> given a problem, model, or scenario, shift the representation while preserving the important structure.

The aim is not to train vague creativity. The aim is to train explicit recognition of:

- same structure, different surface
- different structure, similar surface
- higher-order invariants
- better framing for understanding or action
- mapping between cases by role rather than by topic

This family is the clearest home for:

- analogical reasoning
- abstraction
- re-representation
- invariant extraction
- structure-preserving reframing

## 2. User-facing definition

**Reframe Gym**  
You are shown one or more short scenarios, descriptions, or models.  
Your task is to work out which framing preserves the real structure, which analogy is strongest, or what changed and what stayed the same.

## 3. What this family is training

This family is designed to train the player to:

- separate deep structure from surface wording
- recognise when two cases share the same relational pattern
- reject analogies based on topic similarity alone
- identify the invariant across changing wrappers
- shift representation without losing what matters
- choose the framing that better exposes constraints, options, or implications
- extract the organising rule rather than just the story

## 4. What it is not

This family is **not**:

- a free-association exercise
- a creative writing prompt
- a vague “which one feels similar?” task
- a broad philosophy discussion

Every item must have:
- a clearly keyed structural answer
- distractors that fail for principled mapping reasons
- sufficient information to identify the best analogy, reframing, or invariant

## 5. Syntax and semantic curriculum

### Syntax
- **verbal only** in v1

### Wrapper types
Reframe Gym uses two verbal wrapper types:

- **real-world verbal**
- **artificial micro-world verbal**

### Real-world verbal
Used to:
- introduce reframing and analogy templates
- anchor deep structure in meaningful cases
- make “same structure, different surface” intuitive

### Artificial micro-world verbal
Used to:
- provide scalable repeat training
- weaken reliance on familiar domain cues
- preserve the same structure across many wrappers

Artificial micro-world items must be:
- rule-grounded
- stable across repeated play
- logically interpretable
- built from the same latent mapping templates as the real-world items

### Ratio policy
Use the same phase-based curriculum as the earlier families.

#### First exposure to a new template or difficulty band
- **4 real-world : 1 artificial micro-world**

#### Early consolidation
- **2 real-world : 3 artificial micro-world**

#### Steady-state repeat training after the template is learned
- **1 real-world : 8–10 artificial micro-world**

#### Milestone or transfer checks
- include **1–2 real-world anchor items** per block

## 6. Core game modes

Reframe Gym v1 should include three modes.

### A. Same Structure, New Surface
Given several cases, identify which one preserves the same relational structure despite different surface content.

### B. Which Analogy Really Fits?
Given a source case and several candidate analogies, identify the analogy that matches by role structure rather than topic resemblance.

### C. What Changed And What Stayed The Same?
Given two versions of a case or representation, identify the preserved invariant or the critical representational shift.

These three modes cover the first-pass reframe family without overcomplicating the build.

## 7. Core game shell

Every round uses the shared Reasoning Gym shell.

### Prompt card
A short verbal scenario, pair of scenarios, or source-plus-options set.

### Question
One explicit reframe judgement, such as:
- Which case has the same structure?
- Which analogy really fits?
- What stayed the same across the change?
- Which reframing exposes the right relation?

### Answer format
- usually 2–4 options
- one tap submits
- no free-text response in v1

### Feedback
- correct / incorrect
- one-sentence explanation
- highlight the preserved relation, changed frame, or false analogy cue

### End-of-set summary
- accuracy
- average response time
- difficulty band reached
- process profile

## 8. Item structure

Each item should be generated from a hidden mapping or re-representation template rather than authored only as prose.

### Hidden item model
Each item contains:

- `source_structure`
- `candidate_mappings[]`
- `correct_option_index`
- `template_id`
- `difficulty_band`
- `wrapper_type`
- `pab`
- class-specific modifiers

Optional, depending on mode:
- `changed_frame_description`
- `invariant_target`
- `surface_lure_type`

### Design rule
The answer must be keyed from the **deep relational structure**, not from surface similarity, topic familiarity, or wording overlap.

Wrong options should fail because they:
- match the surface topic but not the role structure
- preserve one local feature but break the deeper relation
- change the wrong thing
- fail to preserve the actual invariant
- keep the same words while shifting the real structure

## 9. Underlying reframe logic

Items should be built from recurring mapping templates.

### Recommended v1 reframe templates

1. **Surface-similar but structurally different lure**
2. **Different domain, same role structure**
3. **Change of frame that preserves the invariant**
4. **Wrong level of description vs right level**
5. **Shared dependency pattern across different topics**
6. **Same trade-off, different wrapper**
7. **Same bottleneck structure, different narrative**
8. **Local detail change with global structure preserved**
9. **Two analogies, one role-correct and one topic-similar**
10. **Representation shift that reveals the hidden relation**

These templates should be reusable across many surface domains and micro-world wrappers.

## 10. Allowed item content types

Allowed real-world domains in v1:

- everyday decisions
- workflow or coordination problems
- route or dependency cases
- explanation and diagnosis cases
- trade-off situations
- task and planning structures
- simple causal systems
- argument or comparison structures

Allowed clue types:
- role labels
- dependency clues
- before / after relations
- source / target relations
- local-vs-global differences
- quantity or proportion relations
- constraint patterns
- trade-off patterns

Examples:
- “In both cases, one shared resource constrains two branches.”
- “The wording changes, but the dependency order stays the same.”
- “One option shares the topic. Another shares the structure.”
- “The new representation changes the labels, not the underlying trade-off.”

## 11. Difficulty model

Reframe complexity should be defined using the universal reasoning backbone:

**Complexity = PAB + reframe modifiers**

### Core metric
`PAB` = Peak Active Bindings  
The minimum number of relations that must be simultaneously active for an ideal solver to answer correctly.

### Reframe modifiers
Use:

- `M` = cross-map mapping load
- `R` = representational shift / remapping demand
- `Q` = quantitative or proportional comparison load

Optional later:
- `D` = dependency depth when analogies involve deeper chains

So for this family:

**Reframe complexity = PAB + M + R + Q**

### Interpretation

- `PAB` captures how many source–target or relation-to-relation bindings must be kept active together
- `M` captures the difficulty of mapping across cases or frames
- `R` captures how much the player must shift level or representation
- `Q` captures any quantity, proportion, or trade-off comparison burden

## 12. Difficulty bands

### Band A — obvious structural match
- one source case
- one clearly matching option
- low PAB
- low mapping distance

### Band B — surface lure present
- one tempting topic-similar distractor
- one better structural match
- moderate PAB

### Band C — abstraction required
- deeper invariant must be extracted
- surface wording is less helpful
- moderate `M` and `R`

### Band D — re-representation advantage
- the correct answer depends on shifting to a better representation or level
- stronger Flex demand

### Band E — multiple candidate mappings
- 3–4 plausible options
- player must compare mappings more globally
- stronger Relate demand

### Band F — high abstraction / invariant load
- several active role bindings
- strong surface lure pressure
- highest v1 reframe load

## 13. Capacity linkage

Reframe Gym should map primarily onto:

**Flex → Relate → Resist**

### Flex demand
This is the dominant reframe demand.

Operational signs:
- sticking with the original framing
- choosing the most familiar wording
- failing to shift to the level where the real relation is visible

### Relate demand
The player must coordinate the source and target structures.

Operational signs:
- partial mapping
- preserving one relation but dropping another
- failing to hold several role correspondences together

### Resist demand
The player must avoid seductive but shallow surface matches.

Operational signs:
- choosing the option with the same topic words
- preferring semantic familiarity over structural fit
- getting captured by one salient surface feature

## 14. Error classification

Wrong answers should be tagged where possible.

### Core error tags
- `surface_similarity_capture`
- `failed_reframe_shift`
- `partial_mapping_failure`
- `invariant_miss`
- `wrong_level_of_description`
- `topic_over_structure_choice`
- `quantity_or_ratio_miss`
- `fast_guess_or_timeout`
- `none`

### Optional secondary tags
- `dependency_mapping_miss`
- `tradeoff_structure_miss`
- `role_assignment_confusion`
- `global_structure_miss`

## 15. Telemetry

### Required per-item logs
- `game_family`
- `game_mode`
- `item_id`
- `difficulty_band`
- `wrapper_type`
- `pab`
- `m`
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
- surface-similarity capture rate
- failed-reframe-shift rate
- invariant miss rate
- performance by difficulty band
- performance by modifier profile
- performance by wrapper type
- real-world vs artificial micro-world gap

### Coach-facing summary labels
- **Reframe shift**
- **Structure over surface**
- **Invariant holding**
- **Analogy fit**

## 16. Item-writing and generator rules

### Hard rules
- every item must be answerable from the described structure
- the answer must depend on structural fit, not topic familiarity
- wrong options must fail for principled mapping reasons
- keep wording short and readable
- avoid specialist jargon
- difficulty should come from mapping and reframing load, not reading burden alone

### Generator workflow
1. choose reframe template
2. choose difficulty band
3. choose wrapper type
4. instantiate source structure
5. generate candidate mappings or reframings
6. compute keyed answer
7. generate feedback explanation
8. tag likely error classes

## 17. Newness rule

A puzzle counts as new when at least one of the following changes:

- latent structural template
- source–target mapping
- invariant target
- lure type
- wrapper instantiation
- clue order
- option order

Exact repeats should be rare and mainly used for calibration or retest.

## 18. Example structural template

### Template name
`topic_similar_lure_vs_role_correct_mapping`

### Hidden structure
- one answer shares visible topic content with the source case
- another answer preserves the deeper role pattern
- the correct choice is the structurally matching option
- the wrong choice is the semantically familiar lure

### Correct pattern
- the best answer preserves the relation, not the topic

## 19. Example real-world item

**Source case**
- A project stalls because one shared approval step controls two different workstreams.

**Question**
Which case has the same deep structure?

**Options**
- Two teams are arguing about the same client.
- Two deliveries are delayed because both require one customs clearance.
- One manager prefers one supplier over another.

**Correct**
- Two deliveries are delayed because both require one customs clearance.

**Why**
- Both cases share one common bottleneck that constrains two branches.

### Example tags
- `wrapper_type = real_world`
- `pab = 3`
- `m = 2`
- `r = 1`
- `q = 0`
- wrong answer `Two teams are arguing about the same client.` -> `surface_similarity_capture`

## 20. Example artificial micro-world item

**Source case**
- Two `brohm` routes are stalled because both depend on one `taven gate`.

**Question**
Which case has the same deep structure?

**Options**
- Two `noral` groups use the same colour tag.
- Two `silex` flows are delayed because both need one `trex pass`.
- One `brohm` cart is brighter than another.

**Correct**
- Two `silex` flows are delayed because both need one `trex pass`.

**Why**
- Both cases preserve the shared-dependency bottleneck pattern.

### Example tags
- `wrapper_type = artificial_micro_world`
- `pab = 3`
- `m = 2`
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
- “Look for the same structure, not the same topic.”
- “What stayed the same?”
- “Change the frame, keep the relation.”
- “A good analogy matches by role.”
- “Do not confuse surface similarity with structure.”

## 22. Acceptance criteria

Reframe Gym v1 is complete when:

- the user can launch all three core modes
- all items are verbal
- every item has a keyed structural answer
- generator supports multiple analogy / reframe templates
- difficulty bands A–F are working
- telemetry logs PAB and reframe modifiers
- wrong answers can be meaningfully tagged
- end-of-set summary shows core reframe reasoning signals
- both real-world and artificial micro-world wrappers can run
- wrapper mix can change by learning stage
- artificial items are rule-grounded rather than arbitrary nonsense
- UI remains simple and consistent with the shared shell

## 23. Completion note

With Reframe Gym specified, the initial five-family Reasoning Gym map is complete:

- Probe
- Constraint
- Systems
- Sequence
- Reframe

This gives one coherent verbal-first architecture for the first pass.

## One-line summary

**Reframe Gym v1 should be a verbal, structurally generated reframe-reasoning family in which the player identifies the best analogy, the preserved invariant, or the structurally correct reframing across changing wrappers, using real-world verbal items to teach and anchor mapping templates and rule-grounded artificial micro-world verbal items to provide scalable repeat training, with complexity defined by Peak Active Bindings plus modifiers for cross-map mapping load, representational shift demand, and quantitative comparison load.**
