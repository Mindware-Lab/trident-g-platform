# Reasoning Gym v1 — universal specification

## Purpose

Reasoning Gym v1 is the first dedicated reasoning layer in Trident-G. Its job is to train **reasoning forms** directly, while keeping the first implementation simple, inspectable, and easy to scale.

The first release is **verbal-first**. This means the surface syntax is verbal, but verbal items may still carry:

- quantities and simple tables
- described spatial relations
- described graphs, routes, and dependencies
- causal patterns
- analogies and reframings

This allows one clean syntax to be implemented first, while still engaging deeper structural and relational representations.

## Core design rule

**Reasoning Gym v1 = verbal syntax only**

However, verbal items may describe:

- causal patterns
- quantities and trade-offs
- routes and positions
- node-link systems
- analogies and reframings

This follows the Trident-G distinction between:

- **operator algebra** = what move is being made
- **reasoning calculus** = what inference style is being used
- **syntax** = how the problem is rendered at the surface

The aim of v1 is to train the **reasoning form**, not to maximise sensory variety on day one.

## Universal specification for all reasoning games

All Reasoning Gym games should follow these shared rules.

### 1. Shared syntax rule

- v1 uses **verbal syntax only**
- items may include plain text, quantities, and described space
- no separate visual syntax is required in v1
- later syntax swaps may be added, but they are not part of the first pass

### 2. Shared game shell

Every reasoning game should use one common shell.

**Prompt card**  
Short evidence, rules, or scenario.

**Question**  
One explicit reasoning judgement.

**Answer format**
- usually 2–4 choices
- optionally T/F or yes/no for fast drills
- no free-text answer in v1

**Feedback**
- correct or incorrect
- one-sentence reason
- highlight the key discriminating relation where possible

**End-of-set summary**
- accuracy
- average response time
- difficulty band reached
- basic process profile

### 3. Shared content rule

Items should be generated from **underlying structural templates**, not written only as surface stories.

That means each item should have:
- a hidden logical or causal structure
- an explicit keyed answer
- distractors that are wrong for principled reasons
- a renderer that turns the structure into verbal form

### 4. Shared progression rule

The universal progression backbone for all reasoning games is:

**Reasoning complexity = Peak Active Bindings (PAB) + class-specific modifiers**

#### Peak Active Bindings (PAB)

`PAB` = the minimum number of structured relations that must be simultaneously active for an ideal solver to get the item right.

This is the main complexity metric across the whole Reasoning Gym.

Examples of active relations:
- clue-to-cause links
- premise-to-conclusion links
- before-after dependencies
- node-edge dependencies
- role mappings across scenarios
- evidence-to-hypothesis update links

### 5. Shared class-specific modifiers

Different reasoning families add different secondary demands. Use these modifiers where relevant:

- `H` = live hypothesis competition
- `D` = dependency depth
- `R` = revision requirement
- `E` = exception / negation load
- `Q` = quantitative comparison load
- `M` = cross-map mapping load

So:

**Complexity = PAB + class modifiers**

This keeps one progression spine across the whole Reasoning Gym without pretending every reasoning class is identical.

### 6. Shared telemetry rule

All reasoning games should log:

- `game_family`
- `game_mode`
- `item_id`
- `difficulty_level`
- `pab`
- class-specific modifiers used
- `is_correct`
- `chosen_option`
- `correct_option`
- `response_time_ms`
- `error_type`
- `timestamp`
- `session_id`
- `user_id`

Derived metrics should include:

- accuracy
- average response time
- performance by difficulty band
- performance by modifier profile
- stability across a block

### 7. Shared error-tagging rule

Where possible, wrong answers should be tagged by failure type rather than only marked wrong.

Core tags:
- lure / distractor capture
- integration failure
- revision failure
- exception failure
- quantity comparison failure
- mapping failure
- fast guess / timeout

### 8. Shared relation to Capacity Gym

Reasoning Gym should remain aligned with the Capacity Gym substrate logic.

The common bridging principle is:

- **Resist** = lure pressure, distractor capture, exception handling
- **Flex** = revision demand, frame shift, remapping
- **Relate** = simultaneous binding, dependency integration, multi-relation coordination

This does **not** mean reasoning games are reduced to capacity games. It means the reasoning layer and capacity layer share a common load language.

### 9. Shared item-writing rule

All items should be:

- short
- legible
- structurally clean
- unambiguous
- answerable from the information provided
- difficult for principled reasons, not trick wording

Avoid:
- vague open interpretation
- unnecessary jargon
- trivia dependence
- ambiguous distractors with no keyed best answer
- complexity created only by long reading load

### 10. Shared v1 wrapper rule

For v1, all reasoning games should use **real-world semantics only**, unless an artificial micro-world is explicitly defined and taught.

This is especially important for abductive items. Pure nonsense wording is not sufficient unless the causal rules of the micro-world are made explicit.

## Reasoning families in v1

Reasoning Gym v1 should be organised into five mission-linked verbal game families.

### 1. Probe Gym

This is the abductive cluster.

**Game modes**
- **Best explanation**
- **Update the model**
- **Best next check**

**Reasoning emphasis**
- abductive
- Bayesian / evidential update
- value-of-information

**Typical verbal item types**
- evidence statements
- rival explanations
- one further observation that changes the balance
- choose the best next question or test

### 2. Constraint Gym

This is the cleanest home for deductive and propositional reasoning.

**Game modes**
- **Must follow?**
- **Which option fits all constraints?**
- **Eliminate the impossible**

**Reasoning emphasis**
- deductive
- propositional
- quantifier-style and condition-rule reasoning
- some quantitative fit checking

**Typical verbal item types**
- if–then rules
- all / some / none relations
- mutually exclusive conditions
- capacity limits
- simple numeric constraints embedded in text

### 3. Systems Gym

This is verbal graph and system reasoning.

**Game modes**
- **Find the bottleneck**
- **Which link is broken?**
- **What follows through the system?**

**Reasoning emphasis**
- relational graph reasoning
- causal structure reasoning
- dependency tracing
- invariant checking

**Typical verbal item types**
- “A feeds B and C”
- “If D fails, E and F are affected unless G is open”
- “Traffic from X to Z must pass through Y unless route Q is active”

### 4. Sequence Gym

This is order and dependency reasoning.

**Game modes**
- **What comes next?**
- **Which order works?**
- **Best next step**

**Reasoning emphasis**
- deductive order reasoning
- dependency reasoning
- means–ends sequencing
- temporal reasoning

**Typical verbal item types**
- ordered tasks
- blocked dependencies
- preconditions
- legal / illegal next moves
- short project or route descriptions

### 5. Reframe Gym

This is analogical and representational change.

**Game modes**
- **Same structure, new surface**
- **Which analogy really fits?**
- **What changed and what stayed the same?**

**Reasoning emphasis**
- analogical
- abstraction
- re-representation
- invariant extraction

**Typical verbal item types**
- paired short scenarios
- compare deep relation rather than topic
- choose which framing preserves the real structure

## Handling quantity and space in a verbal-first system

Spatial and quantitative reasoning can still be trained inside verbal syntax.

### Verbal + quantity
Examples:
- counts
- limits
- probabilities
- costs
- weighted trade-offs

### Verbal + spatial description
Examples:
- “The station is north of the depot and west of the tower.”
- “A courier leaving the depot must pass the gate before reaching the lab.”
- “If the east corridor is blocked, traffic from Room A to Room C must go through Room B.”

### Verbal + system description
Examples:
- routes
- workflows
- dependency networks
- upstream/downstream failures

So in practice, v1 has three useful verbal subtypes:

- **plain verbal**
- **verbal + quantity**
- **verbal + described space / system structure**

## Family-to-reasoning mapping

| Gym | Main reasoning styles | Good verbal subtypes |
|---|---|---|
| Probe | Abductive, Bayesian, VOI | evidence statements, causal cues |
| Constraint | Deductive, propositional, quantitative fit | rules, conditions, limits |
| Systems | Causal, graph, dependency | workflow and network descriptions |
| Sequence | Order, dependency, means–ends | temporal and task ordering |
| Reframe | Analogical, abstraction, invariant | paired scenarios, reframings |

## Build order

Recommended build order for v1:

1. **Probe Gym**
2. **Constraint Gym**
3. **Sequence Gym**
4. **Systems Gym**
5. **Reframe Gym**

Rationale:
- start with the strongest abductive family
- then build clear deductive/propositional work
- then order/dependency reasoning
- then broader system structure
- then analogical and representational transfer

## First implementation recommendation

The first fully specified family should be:

**Probe Gym → Best Explanation**

Why:
- it is tightly aligned with the mission framework
- it has a clear multiple-choice format
- it supports a principled causal-template generator
- it connects cleanly to Resist / Flex / Relate
- it provides a strong model for later families

## One-line summary

**Reasoning Gym v1 should be built as a verbal-first, structurally generated reasoning layer with one shared shell, one shared complexity backbone based on Peak Active Bindings, and five mission-linked families that differ by reasoning emphasis rather than by syntax.**
