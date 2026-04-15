# Sequence Gym v1 — sequence / dependency reasoning spec

## 1. Purpose

Sequence Gym is the fourth Reasoning Gym family. Its job is to train **sequence and dependency reasoning** in a verbal-first format.

Sequence reasoning here means:

> given a set of steps, dependencies, and constraints, work out what can happen next, what order is valid, or what move best advances the path.

The aim is not to train vague planning confidence. The aim is to train explicit reasoning over:

- order
- dependency
- preconditions
- legal next moves
- blocked vs executable steps
- means–ends progression

This family is the clearest home for:

- order reasoning
- dependency reasoning
- temporal sequencing
- means–ends style next-step reasoning
- executable-action judgement under constraints

## 2. User-facing definition

**Sequence Gym**  
You are shown a short task sequence, route, or dependency structure.  
Your task is to work out what comes next, which order works, or which next move is actually executable.

## 3. What this family is training

This family is designed to train the player to:

- track what must come before what
- distinguish legal and illegal next steps
- notice hidden preconditions
- keep a route or task sequence coherent across multiple dependencies
- identify blocked moves vs executable moves
- choose the next step that preserves progress through the problem space
- distinguish a superficially attractive action from the actually valid one

## 4. What it is not

This family is **not**:

- a broad life-planning exercise
- a general productivity game
- a free-form strategy simulator
- a vague “what seems sensible?” judgement task

Every item must have:
- a clearly described order or dependency structure
- a keyed correct answer
- wrong answers that fail for principled sequencing reasons

## 5. Syntax and semantic curriculum

### Syntax
- **verbal only** in v1

### Wrapper types
Sequence Gym uses two verbal wrapper types:

- **real-world verbal**
- **artificial micro-world verbal**

### Real-world verbal
Used to:
- introduce sequence templates
- anchor order reasoning in meaningful tasks, routes, and workflows
- make preconditions and legal next moves intuitive

### Artificial micro-world verbal
Used to:
- provide scalable repeat training
- separate sequence structure from familiar semantic content
- preserve the same dependency logic across many cases

Artificial micro-world items must be:
- rule-grounded
- stable across repeated play
- logically interpretable
- built from the same latent sequence templates as the real-world items

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

Sequence Gym v1 should include three modes.

### A. What Comes Next?
Given a current sequence state and its constraints, identify the next valid step.

### B. Which Order Works?
Given several steps and constraints, choose the order that satisfies them all.

### C. Best Next Step
Given a blocked or partially completed sequence, choose the next executable move that best advances progress.

These three modes cover the first-pass sequence family without overcomplicating the build.

## 7. Core game shell

Every round uses the shared Reasoning Gym shell.

### Prompt card
A short verbal description of tasks, dependencies, route order, or preconditions.

### Question
One explicit sequence judgement, such as:
- What comes next?
- Which order works?
- Which next step is executable?

### Answer format
- usually 2–4 options
- one tap submits
- no free-text response in v1

### Feedback
- correct / incorrect
- one-sentence explanation
- highlight the blocking condition, legal order, or decisive dependency

### End-of-set summary
- accuracy
- average response time
- difficulty band reached
- process profile

## 8. Item structure

Each item should be generated from a hidden sequence template rather than authored only as surface prose.

### Hidden item model
Each item contains:

- `step_set[]`
- `dependency_rules[]`
- `current_state`
- `candidate_options[]`
- `correct_option_index`
- `template_id`
- `difficulty_band`
- `wrapper_type`
- `pab`
- class-specific modifiers

### Design rule
The answer must be keyed from the **described order and dependency structure**, not from what sounds generally efficient.

Wrong options should fail because they:
- violate a precondition
- skip a necessary step
- reverse a required order
- select an attractive but blocked action
- fail to preserve the dependency chain
- confuse a future step with the next legal step

## 9. Underlying sequence logic

Items should be built from recurring structural templates.

### Recommended v1 sequence templates

1. **Simple prerequisite chain**
2. **Two branches with one shared prerequisite**
3. **Blocked next move vs executable support move**
4. **Required order with one tempting reversal**
5. **Means–ends next-step problem**
6. **One legal order among several plausible orders**
7. **Dependency unlock template**
8. **Route with one unavoidable intermediate node**
9. **Parallelisable steps with one non-parallelisable dependency**
10. **Local attractive step vs globally correct next step**

These templates should be reusable across many surface domains and micro-world wrappers.

## 10. Allowed item content types

Allowed real-world sequence domains in v1:

- simple project tasks
- route and navigation sequences
- logistics and delivery steps
- setup / preparation sequences
- workflow handoffs
- task dependencies in office or classroom settings
- simple operational procedures

Allowed clue types:
- before / after constraints
- preconditions
- blocked step indicators
- route order constraints
- timing constraints
- dependency unlocks
- resource availability cues
- legal / illegal move clues

Examples:
- “Task C cannot begin until A and B are complete.”
- “You must pass the scanner before the gate.”
- “The package cannot be sealed until it is labelled.”
- “Route Z is available only after Checkpoint Y.”
- “Two steps may happen in either order unless the tool is already in use.”

## 11. Difficulty model

Sequence complexity should be defined using the universal reasoning backbone:

**Complexity = PAB + sequence modifiers**

### Core metric
`PAB` = Peak Active Bindings  
The minimum number of relations that must be simultaneously active for an ideal solver to answer correctly.

### Sequence modifiers
Use:

- `D` = dependency depth
- `R` = revision / remapping demand
- `Q` = quantitative or timing comparison load

Optional later:
- `B` = branching load

So for this family:

**Sequence complexity = PAB + D + R + Q**

### Interpretation

- `PAB` captures how many order or dependency relations must be kept active together
- `D` captures how many steps ahead the player must reason
- `R` captures whether the player must abandon an attractive but blocked path
- `Q` captures any quantity, timing, or scheduling comparison burden

## 12. Difficulty bands

### Band A — direct order
- 2–3 steps
- one clear next move
- low PAB
- no major remapping

### Band B — one blocked lure
- 3–4 steps
- one attractive but illegal next move
- one better executable move
- moderate PAB

### Band C — dependency integration
- 4–5 steps
- multiple preconditions or branching dependencies
- moderate dependency depth

### Band D — legal next step vs best-looking step
- stronger means–ends tension
- one visible target step is not yet executable
- stronger Flex demand

### Band E — branch and timing integration
- branching sequence with timing or resource interaction
- stronger Relate demand

### Band F — high integration sequence
- 5+ meaningful order relations
- deeper dependency chain and/or timing load
- strongest v1 sequence load

## 13. Capacity linkage

Sequence Gym should map primarily onto:

**Flex → Resist → Relate**

### Flex demand
This is the dominant sequence demand.

Operational signs:
- choosing a step that looks right globally but is not yet executable
- failing to revise from goal attraction to current legality
- skipping to a later step before a prerequisite is satisfied

### Resist demand
The player must avoid attractive but blocked moves.

Operational signs:
- selecting the most salient end-goal action
- selecting the most obvious next action without checking dependencies
- over-weighting a local cue

### Relate demand
The player must keep the full dependency structure coherent.

Operational signs:
- losing one dependency in a chain
- missing that two steps share one prerequisite
- failing to integrate route or task constraints across the whole sequence

## 14. Error classification

Wrong answers should be tagged where possible.

### Core error tags
- `goal_capture_before_prerequisite`
- `blocked_step_choice`
- `dependency_chain_failure`
- `order_reversal`
- `branch_integration_failure`
- `means_ends_miss`
- `timing_or_quantity_miss`
- `fast_guess_or_timeout`
- `none`

### Optional secondary tags
- `shared_prerequisite_miss`
- `route_checkpoint_miss`
- `parallel_vs_serial_confusion`
- `global_path_miss`

## 15. Telemetry

### Required per-item logs
- `game_family`
- `game_mode`
- `item_id`
- `difficulty_band`
- `wrapper_type`
- `pab`
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
- blocked-step choice rate
- dependency-chain failure rate
- goal-capture rate
- performance by difficulty band
- performance by modifier profile
- performance by wrapper type
- real-world vs artificial micro-world gap

### Coach-facing summary labels
- **Next-step control**
- **Dependency holding**
- **Blocked-move resistance**
- **Goal-to-action sequencing**

## 16. Item-writing and generator rules

### Hard rules
- every item must be answerable from the stated order and dependency structure
- the answer must follow from the described sequence, not from unstated common sense
- wrong options must fail for principled sequencing reasons
- keep wording short and readable
- avoid specialist jargon
- difficulty should come from sequence structure, not reading burden alone

### Generator workflow
1. choose sequence template
2. choose difficulty band
3. choose wrapper type
4. instantiate hidden order / dependency structure
5. generate current state
6. generate candidate options
7. compute keyed answer
8. generate feedback explanation
9. tag likely error classes

## 17. Newness rule

A puzzle counts as new when at least one of the following changes:

- latent sequence structure
- blocked-step location
- prerequisite pattern
- branch structure
- wrapper instantiation
- clue order
- option order

Exact repeats should be rare and mainly used for calibration or retest.

## 18. Example structural template

### Template name
`goal_step_blocked_by_hidden_prerequisite`

### Hidden structure
- a target step looks like the best next action
- that step is not yet legal because one prerequisite remains unmet
- the correct answer is the prerequisite-unlocking step
- the wrong answer is the visible goal step

### Correct pattern
- the best next move is the step that unlocks the path, not the step closest to the goal

## 19. Example real-world item

**Steps**
- Print the shipping label.
- Attach the label to the parcel.
- Seal the parcel.
- Dispatch the parcel.

**Current state**
- The parcel is packed.
- The label has not been printed yet.

**Question**
Which step should happen next?

**Options**
- attach the label
- seal the parcel
- print the shipping label

**Correct**
- print the shipping label

**Why**
- Attaching or sealing depends on having the label ready first, so the next executable move is to print it.

### Example tags
- `wrapper_type = real_world`
- `pab = 2`
- `d = 1`
- `r = 1`
- `q = 0`
- wrong answer `seal the parcel` -> `goal_capture_before_prerequisite`

## 20. Example artificial micro-world item

**Steps**
- Prepare the `silex key`.
- Place the `silex key` in the `noral slot`.
- Open the `trex gate`.
- Send the `brohm cart` through.

**Current state**
- The cart is ready.
- The key has not been prepared.

**Question**
Which step should happen next?

**Options**
- open the `trex gate`
- send the `brohm cart` through
- prepare the `silex key`

**Correct**
- prepare the `silex key`

**Why**
- The visible goal actions are blocked until the key is prepared and placed.

### Example tags
- `wrapper_type = artificial_micro_world`
- `pab = 2`
- `d = 1`
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
- “What can happen next?”
- “Check what is actually unlocked.”
- “The nearest goal is not always the next move.”
- “Follow the dependencies.”
- “Choose the step that opens the path.”

## 22. Acceptance criteria

Sequence Gym v1 is complete when:

- the user can launch all three core modes
- all items are verbal
- every item has a keyed sequence answer
- generator supports multiple order / dependency templates
- difficulty bands A–F are working
- telemetry logs PAB and sequence modifiers
- wrong answers can be meaningfully tagged
- end-of-set summary shows core sequence reasoning signals
- both real-world and artificial micro-world wrappers can run
- wrapper mix can change by learning stage
- artificial items are rule-grounded rather than arbitrary nonsense
- UI remains simple and consistent with the shared shell

## 23. Planned next extension

After Sequence Gym stabilises, the next clean family in the build order is:

- **Reframe Gym**

That preserves the path:
- Probe
- Constraint
- Systems
- Sequence
- Reframe

## One-line summary

**Sequence Gym v1 should be a verbal, structurally generated sequence-reasoning family in which the player identifies what comes next, which order works, or which next step is actually executable from a described dependency structure, using real-world verbal items to teach and anchor sequence templates and rule-grounded artificial micro-world verbal items to provide scalable repeat training, with complexity defined by Peak Active Bindings plus modifiers for dependency depth, revision demand, and quantitative or timing load.**
