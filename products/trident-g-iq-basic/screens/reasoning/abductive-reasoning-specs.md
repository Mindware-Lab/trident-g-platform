# Probe Gym v1 — abductive reasoning spec

## 1. Purpose

Probe Gym is the first Reasoning Gym family. Its first mode, **Best Explanation**, trains **abductive reasoning**.

Abductive reasoning here means:

> given a set of observations, infer the **best current explanation**.

The aim is not to train free-form storytelling. The aim is to train disciplined best-fit explanatory reasoning under constrained evidence.

This sits naturally inside the Trident-G **Probe** mission family and supports later transition into:

- Bayesian / evidential updating
- value-of-information reasoning
- Black Box style probe tasks
- live diagnosis and troubleshooting missions

---

## 2. User-facing definition

**Best Explanation**  
You are shown a short set of clues and a small number of candidate explanations.  
Your task is to choose the explanation that best fits the whole pattern.

---

## 3. What this game is training

This game is designed to train the player to:

- compare competing explanations
- resist salient but partial lures
- integrate several clues into one model
- revise an early guess when later evidence changes the balance
- distinguish local symptoms from upstream causes
- prefer the best global fit over the most vivid local fit

---

## 4. What it is not

This game is **not**:

- an open-ended interpretation task
- a pure knowledge quiz
- a creative writing task
- a medical or diagnostic advice tool
- a free-form logic puzzle with multiple equally acceptable answers

Every item must have:

- one keyed best explanation
- wrong options that are wrong for principled reasons
- enough information for a careful solver to answer correctly

---

## 5. Syntax and semantic curriculum

### Syntax
- **verbal only** in v1

### Wrapper types
Probe Gym uses two verbal wrapper types:

- **real-world verbal**
- **artificial micro-world verbal**

### Real-world verbal
Used to:

- introduce new causal templates
- provide intuitive first exposure
- keep the game grounded and mission-relevant
- supply periodic transfer anchors

Examples of real-world domains:

- simple everyday devices
- workflow breakdowns
- scheduling and routing cases
- logistics and handoff problems
- simple systems failures
- classroom / office / household causal cases

### Artificial micro-world verbal
Used to:

- provide scalable repeat training volume
- weaken dependence on familiar meaning
- preserve the same causal structure while varying surface labels
- increase abstraction pressure once the player has learned the template

Artificial micro-world items must be:

- rule-grounded
- stable across repeated play
- logically interpretable
- built from the same latent causal templates as the real-world items

**Pure arbitrary nonsense wording is not allowed.**

### Rule for artificial micro-world items
If artificial terms are used, the game must ensure that the causal structure is still well-defined.

That can happen in two ways:

1. the micro-world rules are shown explicitly in the item  
2. the micro-world rules are stable and have already been learned through repeated exposure

### Semantic ratio policy
The mix of real-world and artificial micro-world items should vary by learning stage.

#### First exposure to a new causal template or difficulty band
- **4 real-world : 1 artificial micro-world**

#### Early consolidation
- **2 real-world : 3 artificial micro-world**

#### Steady-state repeat training after the template is learned
- **1 real-world : 8–10 artificial micro-world**

#### Milestone or transfer checks
- include **1–2 real-world anchor items** per block

### Rationale
Abductive reasoning depends on plausible causal structure. Real-world items teach and anchor the causal form. Artificial micro-world items provide scalable, repeatable training volume once the player has learned the underlying causal grammar.

---

## 6. Core game shell

Every round uses the shared Reasoning Gym shell.

### Prompt card
A short clue set.

### Question
**Which explanation best fits the pattern?**

### Answer format
- usually 2–4 options
- one tap selects and submits

### Feedback
- correct / incorrect
- one-sentence explanation
- highlight the clue or relation that made the difference where possible

### End-of-set summary
- accuracy
- average response time
- difficulty band reached
- process profile

---

## 7. Item structure

Each item should be generated from a hidden causal template.

### Hidden item model
Each item contains:

- `correct_hypothesis`
- `lure_hypotheses[]`
- `clues[]`
- `support_matrix`
- `discriminating_clue_ids[]`
- `lure_clue_ids[]`
- `difficulty_band`
- `wrapper_type`
- `pab`
- class-specific modifiers

### Design rule
One option must be the **best global explanation** of the observed clue set.

Wrong options should usually explain:

- one clue only
- or a subset of clues
- or an early pattern that is later overturned

This keeps distractors psychologically plausible without making the answer ambiguous.

---

## 8. Underlying causal-template logic

Items should be built from recurring causal forms rather than one-off stories.

### Recommended v1 causal templates

1. **Shared upstream cause vs local fault**
2. **Visible symptom vs underlying cause**
3. **One strong lure, one better global fit**
4. **Late discriminating clue overturns early best guess**
5. **Common-cause vs coincidence**
6. **Broken dependency / missing prerequisite**
7. **Local explanation vs system-level explanation**
8. **Single-failure explanation vs distributed-pattern explanation**
9. **Observed absence as a clue**
10. **Timing clue that distinguishes rival causes**

These templates should be reusable across many surface domains and micro-world wrappers.

---

## 9. Clue types

Allowed clue types in v1:

- causal clues
- state-change clues
- dependency clues
- quantity clues
- timing / sequence clues
- described spatial clues
- negative evidence
- exception cues

Examples:

- “The east printer is offline.”
- “Two nearby workstations are also offline.”
- “The network cabinet alarm is on.”
- “Only orders from Bay C are delayed.”
- “The depot is north of the scanner and west of the gate.”
- “No warning alert was sent.”

Artificial micro-world examples are allowed only if the causal rules are grounded.

---

## 10. Difficulty model

Abductive complexity should be defined using the universal reasoning backbone:

**Complexity = PAB + abductive modifiers**

### Core metric
`PAB` = Peak Active Bindings  
The minimum number of relations that must be simultaneously active for an ideal solver to answer correctly.

### Abductive modifiers
Use:

- `H` = live hypothesis competition
- `D` = dependency depth
- `R` = revision requirement

So for this family:

**Abductive complexity = PAB + H + D + R**

### Interpretation

- `PAB` captures how many clue-to-cause or cause-to-effect relations must be held together
- `H` captures how many live rival explanations must genuinely be compared
- `D` captures how many steps away the hidden cause is from the visible symptom
- `R` captures whether a later clue forces a frame shift

---

## 11. Difficulty bands

### Band A — direct fit
- 2 options
- 2 clues
- low PAB
- no frame revision
- obvious best explanation

### Band B — partial lure
- 3 options
- 2–3 clues
- one distractor explains a salient clue well
- requires best-fit comparison

### Band C — multi-clue integration
- 3 options
- 3–4 clues
- correct answer requires combining clues
- moderate PAB

### Band D — shared-cause reasoning
- 3–4 options
- multiple linked symptoms
- system-level explanation beats local symptom explanation
- deeper dependency structure

### Band E — revision required
- early clues support one model
- later clue overturns it
- stronger Flex demand

### Band F — high integration
- 4 options
- multiple plausible explanations
- deeper causal chain or negative evidence
- strongest abductive load in v1

### Difficulty-to-wrapper rule
- New templates or new bands should begin with a real-world-heavy mix
- Higher repetition within the same template and band should shift toward artificial micro-world-heavy practice

---

## 12. Capacity linkage

This game should explicitly connect to the Probe capacity rail:

**Resist → Flex → Relate**

### Resist demand
The player must avoid a salient but partial lure.

Operational signs:
- choosing the vivid local symptom explanation
- choosing the first plausible explanation too quickly
- over-weighting one clue

### Flex demand
The player must revise the current frame when later evidence changes the balance.

Operational signs:
- sticking with an early guess despite disconfirming evidence
- failing to update after a late discriminating clue

### Relate demand
The player must hold several clue relations together.

Operational signs:
- failure to integrate clues
- over-reliance on one relation
- missing shared dependencies or upstream structure

---

## 13. Error classification

Wrong answers should be tagged where possible.

### Core error tags
- `lure_resist_failure`
- `frame_shift_failure`
- `integration_failure`
- `surface_symptom_capture`
- `upstream_dependency_miss`
- `fast_guess_or_timeout`
- `none`

### Optional secondary tags
- `negative_evidence_miss`
- `quantity_cue_miss`
- `timing_cue_miss`
- `spatial_description_miss`

---

## 14. Telemetry

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
- lure-choice rate
- revision-failure rate
- multi-clue integration failure rate
- performance by difficulty band
- performance by modifier profile
- performance by wrapper type
- real-world vs artificial micro-world gap

### Coach-facing summary labels
- **Lure resistance**
- **Frame shift**
- **Pattern holding**
- **Upstream reasoning**

---

## 15. Item-writing and generator rules

### Hard rules
- exactly one keyed best explanation
- every item must be answerable from the provided information
- distractors should be plausible but non-equivalent
- avoid ambiguity unless the ambiguity is explicitly resolved by a final clue
- keep clue wording short
- avoid unnecessary jargon
- do not rely on specialist knowledge
- difficulty should come from structure, not reading burden alone

### Generator workflow
1. choose latent causal template
2. choose difficulty band
3. choose wrapper type
4. instantiate hidden causal graph
5. generate clue set
6. generate candidate explanations
7. compute support matrix
8. choose discriminating clue(s)
9. generate keyed answer
10. generate explanation feedback
11. tag likely error classes

### Newness rule
A puzzle counts as new when at least one of the following changes:

- latent causal structure
- clue pattern
- lure profile
- discriminating clue
- wrapper instantiation
- clue order

Exact repeats should be rare and used mainly for retest, calibration, or transfer checks.

---

## 16. Artificial micro-world design rule

Artificial micro-world items must use **stable invented worlds**, not arbitrary one-off nonsense.

### Requirements
- each micro-world has a small consistent ontology
- each ontology has stable causal rules
- each causal rule can generate many clue patterns
- each clue pattern remains logically keyed
- the player can learn the world over repeated exposure

### Example micro-world structure
A stable artificial world may include:

- source units
- linked downstream units
- visible state markers
- one or more fault types
- one or more local lures

Example pattern:
- source fault affects several downstream units
- local fault affects one unit only
- visible source-state cue confirms the shared cause

The labels may be invented, but the causal logic must be stable.

---

## 17. Example structural template

### Template name
`shared_source_vs_local_fault`

### Hidden structure
- shared upstream cause affects multiple downstream points
- local fault affects one point only
- one visible system indicator confirms shared source failure

### Observed clue pattern
- one visible symptom
- second linked symptom
- upstream state cue

### Correct explanation
- shared upstream cause

### Typical lure
- local fault in the most visible symptom source

---

## 18. Example real-world item

**Clues**
- The corridor light is off.
- Two nearby sockets are also dead.
- The breaker switch is down.

**Question**
Which explanation best fits the pattern?

**Options**
- bulb failure
- circuit trip
- timer shutoff

**Correct**
- circuit trip

**Why**
- Only the circuit trip explains all three clues together.

### Example tags
- `wrapper_type = real_world`
- `pab = 3`
- `h = 2`
- `d = 1`
- `r = 0`
- wrong answer `bulb failure` -> `surface_symptom_capture`

---

## 19. Example artificial micro-world item

**Rules**
- If a `zor trip` happens, the `trex gate` goes down.
- If the `trex gate` is down, nearby `flens` go cold.
- If nearby `flens` go cold, linked `narlits` dim.
- A `miv fault` dims one `narlit` only.

**Clues**
- The `narlit` is dim.
- Two nearby `flens` are cold.
- The `trex gate` is down.

**Question**
Which explanation best fits the pattern?

**Options**
- miv fault
- zor trip
- timer shutoff

**Correct**
- zor trip

**Why**
- Only the `zor trip` explains all three clues together.

### Example tags
- `wrapper_type = artificial_micro_world`
- `pab = 3`
- `h = 2`
- `d = 2`
- `r = 0`

---

## 20. UI copy style

Keep the tone:
- plain
- calm
- non-technical
- older-friendly
- fast to read

Good examples:
- “Best explanation, not first explanation.”
- “Use the whole pattern.”
- “One clue can mislead.”
- “Look for the cause that explains the set.”

---

## 21. Acceptance criteria

Probe Gym v1 is complete when:

- the user can launch a Best Explanation session
- all items are verbal
- every item has one keyed best explanation
- generator supports multiple causal templates
- difficulty bands A–F are working
- telemetry logs PAB and abductive modifiers
- wrong answers can be meaningfully tagged
- end-of-set summary shows core performance signals
- both real-world and artificial micro-world wrappers can run
- wrapper mix can change by learning stage
- artificial items are rule-grounded rather than arbitrary nonsense
- UI remains simple and consistent with the shared shell
- no transfer claim is made from in-gym accuracy alone

---

## 22. Planned next extensions

After v1 stabilises, extend Probe Gym with:

- **Update the Model**  
  Bayesian / evidential revision after a new clue appears

- **Best Next Check**  
  value-of-information selection of the most diagnostic next probe

- later, more artificial micro-world families
- later, syntax swaps
- later, integration with Probe puzzle lab and live missions

---

## One-line summary

**Probe Gym v1 should be a verbal, structurally generated abductive reasoning game in which the player selects the best current explanation from a short clue set, using real-world verbal items to teach and anchor causal templates and rule-grounded artificial micro-world verbal items to provide scalable repeat training, with complexity defined by Peak Active Bindings plus abductive modifiers for hypothesis competition, dependency depth, and revision demand.**
