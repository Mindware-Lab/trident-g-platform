 # Systems Gym v1 — systems / graph reasoning spec

## 1. Purpose

Systems Gym is the third Reasoning Gym family. Its job is to train **systems reasoning** in a verbal-first format.

Systems reasoning here means:

> given a structured set of nodes, links, flows, dependencies, or handoffs, work out what follows through the system, where the bottleneck sits, or which connection is broken.

The aim is not to train vague “big picture thinking”. The aim is to train explicit reasoning over linked structure.

This family is the clearest home for:

- graph-like reasoning
- dependency tracing
- bottleneck detection
- upstream / downstream reasoning
- propagation through a structured system
- simple invariant checking in linked networks

## 2. User-facing definition

**Systems Gym**  
You are shown a short description of a system: how parts connect, depend on each other, or pass flow between them.  
Your task is to work out what follows, what is broken, or where the blockage is.

## 3. What this family is training

This family is designed to train the player to:

- represent a system as linked structure rather than isolated facts
- track upstream and downstream effects
- identify bottlenecks and broken handoffs
- distinguish local symptoms from structural causes
- follow dependencies across multiple links
- reason about what must propagate and what cannot
- compare whole-system explanations rather than nearest-surface explanations

## 4. What it is not

This family is **not**:

- a broad management simulation
- a vague troubleshooting opinion task
- a pure knowledge quiz
- a free-form strategy game

Every item must have:
- a clearly described system structure
- a keyed correct answer
- wrong answers that fail for principled structural reasons

## 5. Syntax and semantic curriculum

### Syntax
- **verbal only** in v1

### Wrapper types
Systems Gym uses two verbal wrapper types:

- **real-world verbal**
- **artificial micro-world verbal**

### Real-world verbal
Used to:
- introduce system templates
- anchor graph reasoning in meaningful workflow or device scenarios
- make bottlenecks and link failures intuitive

### Artificial micro-world verbal
Used to:
- provide scalable repeat training volume
- separate system structure from familiar semantics
- preserve the same node-link logic across many cases

Artificial micro-world items must be:
- rule-grounded
- stable across repeated play
- logically interpretable
- built from the same latent graph templates as the real-world items

### Ratio policy
Use the same phase-based curriculum as earlier families.

#### First exposure to a new template or difficulty band
- **4 real-world : 1 artificial micro-world**

#### Early consolidation
- **2 real-world : 3 artificial micro-world**

#### Steady-state repeat training after the template is learned
- **1 real-world : 8–10 artificial micro-world**

#### Milestone or transfer checks
- include **1–2 real-world anchor items** per block

## 6. Core game modes

Systems Gym v1 should include three modes.

### A. Find the Bottleneck
Given a described workflow or network, identify the point where flow is constrained, overloaded, or blocked.

### B. Which Link Is Broken?
Given system behaviour and a network description, infer which connection or dependency has failed.

### C. What Follows Through the System?
Given a system state or local change, determine what downstream or linked consequences follow.

These three modes cover the first-pass systems space without overcomplicating the build.

## 7. Core game shell

Every round uses the shared Reasoning Gym shell.

### Prompt card
A short verbal system description with nodes, links, or dependencies.

### Question
One explicit systems judgement, such as:
- Which link is broken?
- Where is the bottleneck?
- What follows through the system?

### Answer format
- usually 2–4 options
- one tap submits
- no free-text response in v1

### Feedback
- correct / incorrect
- one-sentence explanation
- highlight the critical dependency, bottleneck, or propagation path

### End-of-set summary
- accuracy
- average response time
- difficulty band reached
- process profile

## 8. Item structure

Each item should be generated from a hidden system template rather than authored only as surface prose.

### Hidden item model
Each item contains:

- `node_set[]`
- `edge_set[]`
- `dependency_rules[]`
- `observed_state[]`
- `candidate_options[]`
- `correct_option_index`
- `template_id`
- `difficulty_band`
- `wrapper_type`
- `pab`
- class-specific modifiers

### Design rule
The answer must be keyed from the **described system structure** and the stated evidence, not from world knowledge or “most likely in real life” guessing.

Wrong options should fail because they:
- break the dependency structure
- ignore one link or bottleneck
- confuse local and upstream causes
- predict propagation where none should occur
- miss a global consistency constraint

## 9. Underlying graph / system logic

Items should be built from recurring structural templates.

### Recommended v1 system templates

1. **Linear pipeline with one blocked stage**
2. **One upstream source feeding several downstream nodes**
3. **Two branches with one shared bottleneck**
4. **Local failure vs shared-link failure**
5. **Broken handoff between adjacent stages**
6. **Conditional bypass or fallback route**
7. **Overloaded intermediate node**
8. **Missing prerequisite in a dependency chain**
9. **Propagation through a forked system**
10. **Apparent local symptom caused by upstream structural break**

These templates should be reusable across many surface domains and micro-world wrappers.

## 10. Allowed item content types

Allowed real-world system domains in v1:

- logistics workflows
- simple office or classroom systems
- manufacturing or service pipelines
- delivery or handoff chains
- simple IT/network style dependencies without requiring specialist knowledge
- route and gate systems
- resource flow systems

Allowed clue types:
- state-change clues
- dependency clues
- route / position clues
- quantity or queue clues
- negative evidence
- handoff failure clues
- propagation clues
- bottleneck clues

Examples:
- “A feeds B and C.”
- “If B fails, D cannot receive input.”
- “Traffic from X to Z must pass through Y unless Route Q is open.”
- “Orders reach packing only after scan and sort.”
- “Three downstream stations are delayed, but the source station is active.”

## 11. Difficulty model

Systems complexity should be defined using the universal reasoning backbone:

**Complexity = PAB + systems modifiers**

### Core metric
`PAB` = Peak Active Bindings  
The minimum number of relations that must be simultaneously active for an ideal solver to answer correctly.

### Systems modifiers
Use:

- `D` = dependency depth
- `R` = revision / remapping demand
- `Q` = quantitative flow or queue comparison load

Optional later:
- `B` = branching load

So for this family:

**Systems complexity = PAB + D + R + Q**

### Interpretation

- `PAB` captures how many node-link or dependency relations must be simultaneously coordinated
- `D` captures how many steps through the system must be traced
- `R` captures whether an initially local-looking explanation must be revised into a broader structural model
- `Q` captures any queue, count, or throughput comparison demand

## 12. Difficulty bands

### Band A — direct link following
- 2–3 nodes
- simple chain or fork
- low PAB
- no major remapping

### Band B — one hidden bottleneck
- 3–4 nodes
- one tempting local explanation
- one better structural answer
- moderate PAB

### Band C — upstream/downstream tracing
- 4–5 nodes
- multiple linked effects
- moderate dependency depth

### Band D — branch and bottleneck integration
- branching system
- one shared constraint or handoff failure
- stronger Relate demand

### Band E — remapping required
- initial surface symptom suggests a local issue
- correct answer is upstream or structural
- stronger Flex demand

### Band F — high integration system
- 5+ meaningful relations
- deeper dependency chain and/or queue logic
- strongest v1 systems load

## 13. Capacity linkage

Systems Gym should map primarily onto:

**Bind → Flex → Relate**

### Bind demand
The player must keep linked nodes, conditions, or handoffs attached to the right parts of the system.

Operational signs:
- dropping one link
- confusing which node feeds which
- mismatching a dependency to the wrong stage

### Flex demand
The player must revise from a surface symptom to a better structural account.

Operational signs:
- sticking with a local failure interpretation
- failing to remap the system after a clue reveals an upstream issue

### Relate demand
This is the dominant systems demand.

Operational signs:
- failure to integrate multiple links
- missing how one shared node affects several others
- failing to trace propagation through the network

## 14. Error classification

Wrong answers should be tagged where possible.

### Core error tags
- `local_symptom_capture`
- `broken_link_miss`
- `bottleneck_miss`
- `dependency_chain_failure`
- `branch_integration_failure`
- `upstream_downstream_confusion`
- `quantity_flow_miss`
- `fast_guess_or_timeout`
- `none`

### Optional secondary tags
- `bypass_route_miss`
- `handoff_failure_miss`
- `shared_constraint_miss`
- `global_consistency_miss`

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
- bottleneck miss rate
- dependency-chain failure rate
- upstream/downstream confusion rate
- performance by difficulty band
- performance by modifier profile
- performance by wrapper type
- real-world vs artificial micro-world gap

### Coach-facing summary labels
- **Link holding**
- **System tracing**
- **Bottleneck detection**
- **Upstream reasoning**

## 16. Item-writing and generator rules

### Hard rules
- every item must be answerable from the described system structure
- the answer must follow from the stated links and states, not from unstated background knowledge
- wrong options must fail for principled structural reasons
- keep wording short and readable
- avoid specialist jargon
- difficulty should come from system structure, not reading burden alone

### Generator workflow
1. choose system template
2. choose difficulty band
3. choose wrapper type
4. instantiate hidden graph / dependency structure
5. generate observed system state
6. generate candidate options
7. compute keyed answer
8. generate feedback explanation
9. tag likely error classes

## 17. Newness rule

A puzzle counts as new when at least one of the following changes:

- latent graph structure
- bottleneck location
- broken-link location
- propagation pattern
- wrapper instantiation
- clue order
- option order

Exact repeats should be rare and mainly used for calibration or retest.

## 18. Example structural template

### Template name
`shared_bottleneck_with_local_lure`

### Hidden structure
- two branches feed through one shared stage
- one downstream symptom appears local
- correct diagnosis is that the shared middle stage is overloaded or blocked
- wrong answer is the visibly delayed downstream branch itself

### Correct pattern
- the best answer is the shared bottleneck, not the nearest visible symptom source

## 19. Example real-world item

**System**
- Orders move from intake to scan.
- From scan they split to packing and dispatch.
- Dispatch cannot send anything until scan has cleared it.

**Clues**
- Packing is working.
- Dispatch is delayed.
- New orders are queued before scan.

**Question**
Where is the bottleneck?

**Options**
- intake
- scan
- dispatch

**Correct**
- scan

**Why**
- Dispatch depends on scan, and the queue before scan explains why dispatch is delayed while packing can still appear active on older cleared items.

### Example tags
- `wrapper_type = real_world`
- `pab = 3`
- `d = 2`
- `r = 1`
- `q = 0`
- wrong answer `dispatch` -> `local_symptom_capture`

## 20. Example artificial micro-world item

**System**
- `Nors` feed into `Taven`.
- `Taven` splits flow to `Silex` and `Brohm`.
- `Brohm` only receives output once `Taven` clears it.

**Clues**
- `Silex` is still active.
- `Brohm` is delayed.
- New `nors` are queued before `Taven`.

**Question**
Where is the bottleneck?

**Options**
- `Nors`
- `Taven`
- `Brohm`

**Correct**
- `Taven`

**Why**
- The queue before `Taven` and delayed downstream branch show that the shared middle stage is constraining flow.

### Example tags
- `wrapper_type = artificial_micro_world`
- `pab = 3`
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
- “Trace the system.”
- “Look for the shared constraint.”
- “The nearest symptom is not always the cause.”
- “Follow what depends on what.”
- “Find the link that explains the pattern.”

## 22. Acceptance criteria

Systems Gym v1 is complete when:

- the user can launch all three core modes
- all items are verbal
- every item has a keyed structural answer
- generator supports multiple graph / dependency templates
- difficulty bands A–F are working
- telemetry logs PAB and systems modifiers
- wrong answers can be meaningfully tagged
- end-of-set summary shows core systems reasoning signals
- both real-world and artificial micro-world wrappers can run
- wrapper mix can change by learning stage
- artificial items are rule-grounded rather than arbitrary nonsense
- UI remains simple and consistent with the shared shell

## 23. Planned next extension

After Systems Gym stabilises, the next clean family in the build order is:

- **Sequence Gym**

That preserves the path:
- Probe
- Constraint
- Systems
- Sequence
- Reframe

## One-line summary

**Systems Gym v1 should be a verbal, structurally generated systems-reasoning family in which the player identifies bottlenecks, broken links, or downstream consequences from a described node-link system, using real-world verbal items to teach and anchor graph templates and rule-grounded artificial micro-world verbal items to provide scalable repeat training, with complexity defined by Peak Active Bindings plus modifiers for dependency depth, revision demand, and quantitative flow load.**
