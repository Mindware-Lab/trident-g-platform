# Probe Gym v1.1 — Bayesian / evidential update spec

## 1. Purpose

**Update the Model** is the second Probe Gym mode. It trains **Bayesian / evidential update** in a user-facing, verbal-first format.

The purpose is not to teach formal Bayes theorem notation in v1. The purpose is to train the underlying reasoning move:

> when a new clue appears, revise which explanation is strongest.

This mode follows naturally after **Best Explanation**.

- **Best Explanation** trains initial best-fit explanatory reasoning
- **Update the Model** trains revision of that model under new evidence
- **Best Next Check** will later train choice of the most diagnostic next probe

## 2. User-facing definition

**Update the Model**  
You are shown an initial clue set and a small set of candidate explanations.  
Then a new clue appears.  
Your task is to decide which explanation is strongest **now**, after the update.

## 3. What this game is training

This mode is designed to train the player to:

- revise confidence when new evidence appears
- avoid sticking with the first plausible explanation
- distinguish confirming from disconfirming evidence
- notice when one explanation gains more than another
- integrate sequential evidence rather than treating each clue in isolation
- separate “was plausible before” from “is strongest now”

## 4. What it is not

This mode is **not**:

- a formal probability calculator
- a statistics exam
- a pure memory task
- a free-form interpretation exercise
- a trivia test about how likely things are in the real world

Every item must have:
- a clear initial evidence state
- a clear updated evidence state
- one keyed best answer after update
- distractors that fail for principled evidential reasons

## 5. Syntax and semantic curriculum

### Syntax
- **verbal only** in v1.1

### Wrapper types
This mode uses the same wrapper types as Best Explanation:

- **real-world verbal**
- **artificial micro-world verbal**

### Real-world verbal
Used to:
- introduce new update templates
- anchor evidential revision in meaningful cases
- make the game intuitive on first exposure

### Artificial micro-world verbal
Used to:
- provide scalable repeat training volume
- weaken over-reliance on familiar semantics
- preserve the same update structure across many cases

Artificial micro-world items must be:
- rule-grounded
- stable across repeated play
- logically interpretable
- built from the same latent causal templates as the real-world items

### Ratio policy
Use the same phase-based curriculum as Best Explanation.

#### First exposure to a new update template or difficulty band
- **4 real-world : 1 artificial micro-world**

#### Early consolidation
- **2 real-world : 3 artificial micro-world**

#### Steady-state repeat training after the template is learned
- **1 real-world : 8–10 artificial micro-world**

#### Milestone or transfer checks
- include **1–2 real-world anchor items** per block

## 6. Core game shell

Every round uses a two-stage version of the shared Reasoning Gym shell.

### Stage 1 — Initial model
Show:
- an initial clue set
- 2–4 candidate explanations

### Stage 2 — New evidence
Reveal:
- one new clue
- optionally, one brief reminder that the player should now update the model

### Question
**Which explanation best fits the pattern now?**

### Answer format
- usually 2–4 options
- one tap selects and submits

### Feedback
- correct / incorrect
- one-sentence explanation
- identify which explanation gained or lost support because of the new clue

### End-of-set summary
- accuracy
- average response time
- difficulty band reached
- update profile

## 7. Alternative question variants

The primary v1.1 question should remain:

- **Which explanation is strongest now?**

Optional later variants:
- Which explanation lost support?
- Which explanation gained the most support?
- Which explanation is now ruled out?

These should be held back until the main update form is stable.

## 8. Item structure

Each item should be generated from a hidden causal template with staged evidence release.

### Hidden item model
Each item contains:

- `candidate_hypotheses[]`
- `initial_clues[]`
- `update_clue`
- `support_matrix_before`
- `support_matrix_after`
- `correct_option_index`
- `difficulty_band`
- `wrapper_type`
- `pab`
- class-specific modifiers

### Design rule
The correct answer must be determined by the **updated** evidence state, not just the initial clue set.

Wrong options should fail because they:
- were plausible before but not after update
- fit one clue but not the revised pattern
- ignore disconfirming evidence
- over-weight the first clue set
- fail to re-rank the explanations properly

## 9. Underlying evidential-update logic

Items should be built from recurring update forms rather than one-off stories.

### Recommended v1.1 update templates

1. **Initial favourite overturned by new clue**
2. **Two live explanations separated by one diagnostic clue**
3. **Early ambiguity reduced by a late discriminator**
4. **Common-cause vs local-cause resolved by new evidence**
5. **Visible symptom explanation weakened by upstream state cue**
6. **Negative evidence removes one tempting explanation**
7. **Timing clue changes which cause is strongest**
8. **Quantity clue shifts support toward one model**
9. **Dependency clue reveals that an earlier explanation cannot hold**
10. **Late evidence confirms the initially weaker but deeper explanation**

These templates should be reusable across both real-world and artificial micro-world wrappers.

## 10. Clue types

Allowed clue types in v1.1:

- causal clues
- state-change clues
- dependency clues
- quantity clues
- timing / sequence clues
- described spatial clues
- negative evidence
- exception cues

The important additional rule for this mode is:

- the **update clue must matter**
- it must change the support profile in a principled way
- it must not be cosmetic

## 11. Difficulty model

Evidential-update complexity should be defined using the universal reasoning backbone:

**Complexity = PAB + update modifiers**

### Core metric
`PAB` = Peak Active Bindings  
The minimum number of relations that must be simultaneously active for an ideal solver to answer correctly after the update.

### Update modifiers
Use:

- `H` = live hypothesis competition
- `D` = dependency depth
- `R` = revision requirement
- `Q` = quantitative comparison load

So for this family:

**Update complexity = PAB + H + D + R + Q**

### Interpretation

- `PAB` captures how many relations must be held together after the new clue
- `H` captures how many rival explanations remain live
- `D` captures how far the decisive cause is from the visible symptom
- `R` captures how strongly the player must revise the earlier model
- `Q` captures any quantity-based comparison demand in the update

## 12. Difficulty bands

### Band A — gentle update
- 2 options
- initial ambiguity is low
- one new clue clearly confirms one explanation
- low PAB
- low revision demand

### Band B — mild reweighting
- 3 options
- one early favourite remains tempting
- update clue shifts support clearly
- moderate H

### Band C — two live models
- 3 options
- two explanations are plausible before update
- one new clue separates them
- moderate PAB

### Band D — overturn
- initial favourite is wrong after update
- stronger revision demand
- clear Flex pressure

### Band E — dependency update
- new clue acts through an upstream or intermediate relation
- deeper D load
- player must update through a dependency chain

### Band F — high integration update
- 4 options
- multiple live hypotheses
- update clue must be integrated with earlier clues, not treated alone
- strongest v1.1 update load

## 13. Capacity linkage

This mode should map primarily onto:

**Resist → Flex → Relate**

### Resist demand
The player must not cling to the salient first explanation.

Operational signs:
- keeping the early favourite despite disconfirming evidence
- over-weighting the first clue set
- ignoring the diagnostic update clue

### Flex demand
This is the dominant capacity demand in this mode.

Operational signs:
- failure to revise after the update
- partial revision that does not go far enough
- sticking with a stale frame

### Relate demand
The player must integrate the new clue with the earlier clue structure.

Operational signs:
- treating the update clue in isolation
- failing to combine old and new evidence
- missing deeper dependency changes

## 14. Error classification

Wrong answers should be tagged where possible.

### Core error tags
- `stale_model_capture`
- `update_clue_underweight`
- `integration_failure`
- `surface_symptom_capture`
- `upstream_dependency_miss`
- `quantity_update_miss`
- `fast_guess_or_timeout`
- `none`

### Optional secondary tags
- `negative_evidence_miss`
- `timing_update_miss`
- `revision_failure`
- `insufficient_reweighting`

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
- stale-model capture rate
- revision-failure rate
- update-clue underweighting rate
- performance by difficulty band
- performance by modifier profile
- performance by wrapper type
- real-world vs artificial micro-world gap

### Coach-facing summary labels
- **Model updating**
- **Evidence reweighting**
- **Frame revision**
- **Sequential pattern holding**

## 16. Item-writing and generator rules

### Hard rules
- exactly one keyed best explanation after the update
- the initial clue set must support at least two plausible interpretations in most non-trivial items
- the update clue must materially change the support profile
- every item must be answerable from the provided information
- distractors should remain psychologically plausible
- avoid ambiguity unless the update resolves it
- keep wording short
- difficulty should come from update structure, not reading burden alone

### Generator workflow
1. choose latent update template
2. choose difficulty band
3. choose wrapper type
4. instantiate hidden causal graph
5. generate initial clue set
6. generate candidate explanations
7. compute support matrix before update
8. generate update clue
9. compute support matrix after update
10. choose keyed answer
11. generate explanation feedback
12. tag likely error classes

## 17. Newness rule

A puzzle counts as new when at least one of the following changes:

- latent update structure
- initial clue pattern
- update clue
- lure profile
- discriminating relation
- wrapper instantiation
- clue order

Exact repeats should be rare and used mainly for calibration or retest.

## 18. Example structural template

### Template name
`early_local_favourite_overturned_by_upstream_cue`

### Hidden structure
- initial symptom suggests a local fault
- one rival explanation is an upstream shared cause
- late clue reveals that several linked points are affected or that the upstream state is abnormal
- shared-cause explanation becomes strongest after update

### Correct pattern
- initial best guess is local
- updated best explanation is upstream

## 19. Example real-world item

**Initial clues**
- The corridor light is off.
- The lamp in that corridor was flickering earlier.

**Options**
- bulb failure
- circuit trip
- timer shutoff

**New clue**
- Two nearby sockets are also dead.

**Question**
Which explanation best fits the pattern now?

**Correct**
- circuit trip

**Why**
- The new clue makes a shared power explanation stronger than a local bulb explanation.

### Example tags
- `wrapper_type = real_world`
- `pab = 3`
- `h = 2`
- `d = 1`
- `r = 1`
- `q = 0`
- wrong answer `bulb failure` -> `stale_model_capture`

## 20. Example artificial micro-world item

**Rules**
- If a `zor trip` happens, the `trex gate` goes down.
- If the `trex gate` is down, nearby `flens` go cold.
- A `miv fault` dims one `narlit` only.

**Initial clues**
- The `narlit` is dim.

**Options**
- miv fault
- zor trip
- timer shutoff

**New clue**
- Two nearby `flens` are cold.

**Question**
Which explanation best fits the pattern now?

**Correct**
- zor trip

**Why**
- The update clue supports a shared upstream cause rather than a local fault.

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
- “Update the model.”
- “The new clue changes the balance.”
- “What fits best now?”
- “Do not stick with the first guess.”
- “Use both the old and new clues.”

## 22. Acceptance criteria

Update the Model v1.1 is complete when:

- the user can launch an Update the Model session
- all items are verbal
- every item has one keyed best explanation after update
- generator supports multiple update templates
- difficulty bands A–F are working
- telemetry logs PAB and update modifiers
- wrong answers can be meaningfully tagged
- end-of-set summary shows update-specific performance signals
- both real-world and artificial micro-world wrappers can run
- wrapper mix can change by learning stage
- artificial items are rule-grounded rather than arbitrary nonsense
- UI remains simple and consistent with the shared shell

## 23. Planned next extension

The next Probe mode after this should be:

- **Best Next Check**  
  value-of-information selection of the most diagnostic next probe

That completes the Probe family progression:
- best explanation
- update the model
- best next check

## One-line summary

**Update the Model v1.1 should be a verbal, structurally generated evidential-update game in which the player revises which explanation is strongest after a new clue appears, using real-world verbal items to teach and anchor update templates and rule-grounded artificial micro-world verbal items to provide scalable repeat training, with complexity defined by Peak Active Bindings plus modifiers for hypothesis competition, dependency depth, revision demand, and quantitative comparison load.**
