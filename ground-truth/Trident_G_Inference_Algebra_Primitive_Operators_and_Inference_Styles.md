## The Trident-G inference algebra: primitive operators and inference styles

### 0. Purpose and scope

Trident-G requires a minimal operator set that can be recombined across different mission frames, syntaxes, wrappers, and domains without being tied to one topic or task family. The aim of the inference algebra is therefore not to model raw cognition in full, but to define the smallest usable set of rule-like mindware moves by which the G-Loop can set rigour, build and transform relational structure, test and discriminate, commit action, protect viability, and validate portability.

Within the wider Trident-G stack, this appendix specifies the **operator algebra** part of the **language of thought and action**. Mission grammar governs how these operators are sequenced within a mission frame, while the reasoning calculus specifies the main inferential transformations carried out during operator execution. The algebra is therefore one layer in a wider architecture, not the whole of cognition.

These operators are intended to support both mission families already specified in Trident-G: IQ / performance missions such as understanding, argumentation, decision-making, and strategic action, and resilience / self-regulation missions such as shielding attention, recovery, mode calibration, externalisation, and viable re-entry. The same operator set supports both families because self-regulation in Trident-G is explicitly not mindware-free.

### 1. Ontological clarification

The operators are not the raw processing itself. They are the rule-like moves that run over representational objects such as maps, chunks, schemas, claims, hypotheses, action candidates, and external artefacts. They are therefore best treated as **mindware primitives**, not as the capacity substrate that supports them. Working memory and attention keep these objects active and manipulable. The operators specify what to do with them.

This distinction matters. Working memory, attention protection, interference control, re-entry quality, and relational holding power belong primarily to the **Capacity Layer** and the broader **cognitive runtime**. The operator set belongs to the **Mindware Layer**. Relational processing and reasoning is the live bridge between them, running through several operators rather than appearing as a separate seventeenth primitive.

For the same reason, the following should **not** be added as separate primitive operators:

- working-memory holding
- attention protection
- explore vs exploit
- meaning vs moves
- banking or consolidation as such

These are already handled elsewhere in the architecture. Working memory and attention are runtime variables, explore–exploit is a mode policy of the kernel, and Install / Bank is a cross-frame conversion mode rather than an additional primitive.

### 2. Design rule for a primitive operator

A candidate primitive should pass a simple test:

**Can this move be used as a reusable rule-like operation across multiple mission frames, syntaxes, and wrappers, without depending on one topic?**

On that criterion, the canonical **Y1–Y16** set remains the best fit. By contrast, things such as decomposing a problem into subproblems, tracking the problem space, or holding the active representation are all important, but they are better treated as **compositions** or **substrate functions** rather than as additional primitives.

Hierarchical decomposition is usually achieved through **Y4 Map → Y5 Chunk**, often regulated by **Y16 Level control / anti-regress**. Problem-space tracking is largely **Y4 Map** running over a working-memory substrate. Syntax variation is not a new operator either. It belongs to the **syntax layer**, and portability across syntax is tested through syntax swaps rather than by inventing extra primitives.

### 3. Cross-cutting inference styles

The following reasoning types should be treated as **inference styles** or **reasoning modes** layered onto operator execution, not as separate Y-operators. This is the cleanest fit with the ground-truth material, which distinguishes the procedural move from the kind of inference used during that move.

**Deductive reasoning** draws necessary consequences from an accepted schema, rule, or premise set. It is most often expressed through **Y9 Instantiate** and **Y12 Evaluate**.

**Inductive reasoning** generalises from repeated cases, observations, or tests to a broader pattern or rule. It is especially common in **Y8 Abstract**, **Y12 Evaluate**, and **Y14 Validate portability**.

**Abductive reasoning** infers the best current explanation for the available evidence under uncertainty. It is especially common in **Y4 Map** and **Y11 Meta-map**.

**Analogical reasoning** transfers structure by relational role rather than surface similarity. It is centred in **Y7 Analogise**.

**Bayesian or statistical updating** revises confidence in models, claims, or options in light of new evidence. It commonly appears in **Y12 Evaluate**, **Y13 Discriminate / Probe**, and the update phase of action loops.

**Value-of-information reasoning** selects the next probe by asking which question or test would separate the possibilities most efficiently. It is most explicit in **Y13 Discriminate / Probe**.

These reasoning styles may optionally be used as tags on operator runs. In other words, the operators say **what move is being made**, while the reasoning style says **how inference is being carried out during that move**. This keeps the operator algebra compact while preserving the richer reasoning calculus above it.

### 4. Canonical operator set

#### A. Rigour and viability gating

**Y1 — Orient**  
Set the rigour budget for the loop. Y1 decides how much depth, checking, complexity, and caution are warranted now, given stakes, uncertainty, time, and current state. It is the operator-level expression of salience: not another content move, but the move that decides how much loop to run. In IQ / performance missions, Y1 prevents both shallow under-modelling and unnecessary over-analysis. In resilience missions, it helps match effort to viable state. In far transfer, it protects clean credit assignment by preventing over-rigorous work when the system is unstable.

**Y2 — Recover**  
Restore workable corridor occupancy when the loop has become noisy, overheated, flat, or otherwise untrustworthy. Y2 is a true primitive because recovery is not an optional prelude to cognition in Trident-G, but part of the intelligence kernel itself. In IQ / performance missions, it restores the possibility of clean inference. In resilience missions, it is central. In far transfer, it prevents state-contingent errors from being mistaken for structural failure or success.

**Y3 — Externalise / Escalate**  
Offload cognition into stable scaffolds or escalate when clean in-head continuation is no longer viable or safe. This operator preserves progress and safety by routing work into notes, checklists, schedules, delegation, review, or human support. In IQ / performance missions, it prevents forced cognition under unstable conditions. In resilience missions, it is a key safeguard. In far transfer, it supports human-plus-tool general intelligence by allowing the operator policy to continue in another substrate rather than collapse.

#### B. Representational construction and transformation

**Y4 — Map**  
Build the current relational problem space: entities, constraints, relations, options, and value tags. This is the main explicit structure-building operator. In stack terms, it operates over the semantic layer: ontology, situation map, and affordance surface. It is central to comprehension, diagnosis, planning, and argumentation. In resilience use, it can also be directed at one’s own state, triggers, and constraints. In far transfer, it is foundational because portability depends on learning deeper structure rather than surface wrappers alone. Common inference styles here are abductive and inductive.

**Y5 — Chunk**  
Compress a coherent subgraph into a manageable unit. Y5 reduces model weight, packages stable structure, and creates candidate reusable units for later retrieval and recombination. Hierarchical decomposition is usually achieved by **Y4 Map + Y5 Chunk**, optionally regulated by **Y16**. In IQ / performance work, Y5 supports clearer modelling and lower working-memory cost. In resilience work, it can reduce overwhelm by reducing live representational burden. In far transfer, it helps create reusable units that may later become part of bankable scripts.

**Y6 — Unpack**  
Reopen a chunk when it fails, hides dependencies, or proves too coarse. Y6 is indispensable for debugging brittle scripts, locating hidden assumptions, and correcting bad boundaries. In IQ / performance missions, it supports troubleshooting, revision, and deeper analysis. In resilience missions, it prevents over-compressed or emotionally loaded simplifications from being treated as adequate models. In far transfer, it helps distinguish genuinely portable structure from compressed but wrapper-bound tricks.

**Y7 — Analogise**  
Transfer structure by role rather than surface similarity. Y7 supports portability, problem-solving, reframing, and cross-domain reasoning by mapping deeper relational roles from a source case to a target case. In resilience use, analogical reframing can also help restore distance or alternative interpretation. In far transfer, it is one of the clearest bridges from specific experience to portable structure. Its dominant inference style is analogical reasoning.

**Y8 — Abstract**  
Extract a higher-order invariant, schema, or organising rule from repeated cases or maps. Y8 is one of the main routes from live Gf to portable Gc because it asks what remains stable across instances, not what merely worked once. In IQ / performance missions, it supports rule-learning, theory-building, and principled transfer. In resilience missions, it supports general self-regulation routines that apply across states and contexts. In far transfer, it is central because abstraction is one of the main routes to syntax- and wrapper-robust competence. Common inference styles here are inductive and sometimes abductive.

**Y9 — Instantiate**  
Bind a schema, script, or abstract structure to the present case strongly enough to generate implications, expectations, or next moves. Y9 is the main “apply the rule here” operator. In IQ / performance missions, it supports decision-making, planning, diagnosis, and explanation. In resilience missions, it helps translate a general recovery or distancing script into the current episode. In far transfer, it is crucial because transfer is not only about having an abstract rule, but about binding it appropriately to a new case or syntax. Deductive reasoning is often prominent here.

**Y10 — Re-represent**  
Shift framing or level while preserving essential structure. Y10 is the operator for changing representation without losing what matters. It is especially useful when a failure is representational rather than informational: wrong level, wrong framing, wrong granularity, wrong causal picture, or unhelpful surface syntax. In IQ / performance missions, it supports insight, reframing, and better fit between model and problem. In resilience missions, it supports distancing, reappraisal, and reduced salience hijack. In far transfer, it helps preserve deep structure across surface changes.

**Y11 — Meta-map**  
Map relations between maps, models, scripts, or frameworks. Y11 builds structure over structures. It is especially important in theory-building, argument comparison, research synthesis, systems design, and multi-framework planning. In resilience missions, it can support meta-awareness of recurring loops, triggers, and competing self-regulation routines. In far transfer, it helps identify deeper commonalities across syntaxes, wrappers, and domains. Abductive and inductive reasoning are often prominent here.

#### C. Testing and discrimination

**Y12 — Evaluate**  
Assess whether a claim, relation, assumption, or action candidate is good enough to trust. Y12 is the main audit primitive. It includes both external support checks and internal consistency checks, such as contradictions, broken links, missing warrants, category errors, or policy mismatches. In IQ / performance missions, it is central to argument quality, decision quality, and model validity. In resilience missions, it supports reality-checking and reduces drift into emotionally compelling but structurally weak interpretations. In far transfer, it helps prevent premature banking of plausible but unverified routines. Deductive, inductive, and Bayesian forms of evaluation may all appear here.

**Y13 — Discriminate / Probe**  
Design or run the cheapest, highest-value test that best separates competing possibilities. Y13 is the main diagnostic probe operator and is repeatedly highlighted in the protocol as a core move under mismatch. In IQ / performance missions, it supports diagnosis, decision-making, argument testing, and efficient learning. In resilience missions, it helps separate genuine threat from noise, and true constraint from avoidance or distortion. In far transfer, it is essential because portability depends on learning what actually matters, not merely rehearsing what feels plausible. Value-of-information reasoning is most explicit here, and Bayesian or inductive updating often follows from it.

**Y14 — Validate portability**  
Test whether a candidate script or structure actually travels across syntaxes, wrappers, stakes, and boundary conditions. Y14 is the explicit portability threshold operator, not the whole of banking. It asks whether a candidate survives variation strongly enough to become eligible for banking as competence. In IQ / performance missions, it supports generalisation beyond the original training syntax or wrapper. In resilience missions, it helps ensure a self-regulation script still works under different kinds of load and context. In far transfer, it is indispensable. Inductive generalisation across swaps is especially important here. The scaling protocol makes clear that syntax swaps are a subtype of wrapper swap and should usually be the first portability staircase.

#### D. Commitment and meta-control

**Y15 — Satisfice / Commit**  
Stop hovering and choose the next move once the signal is good enough for the current rigour budget. Y15 is not simply action selection, but the discipline of not overthinking beyond salience. In IQ / performance missions, it supports timely execution and realistic stopping rules. In resilience missions, it reduces thrash, rumination, and avoidant overprocessing. In far transfer, it helps ensure that learned scripts become executable rather than endlessly theoretical.

**Y16 — Level control / anti-regress**  
Regulate movement between levels of representation so the loop does not get trapped in over-abstraction, over-detail, or endless recursion. This operator is best defined narrowly as granularity control rather than as recursion in the broad sense. In IQ / performance missions, it supports better problem decomposition and prevents unproductive level-lock. In resilience missions, it can break loops of over-analysis, fixation, or vague globalisation. In far transfer, it helps ensure that the structure being abstracted or applied is at the right level to travel.

### 5. Why this set is balanced

This set covers the full G-Loop without bloating it. It supports the relational central mode through **Y4, Y6, Y7, Y8, Y9, Y10, and Y11**. It supports exploratory widening mainly through **Y4, Y7, Y10, Y11, and Y13**, with **Y1** and salience controlling when widening is warranted. It supports exploitative tightening or mutual-information capture mainly through **Y8, Y9, Y12, Y14, and Y15**. It supports subcritical consolidation and banking through **Y5, Y8, and Y14**, while still treating Install / Bank itself as a cross-frame conversion mode rather than an extra primitive.

It also supports both mission families. The performance side is obvious from the mission templates for understanding, argumentation, decision, and planning. But the resilience side is also covered, because self-regulation in Trident-G is explicitly not mindware-free: reframing, distancing, recovery, cadence control, prioritisation, and externalisation can all be built from **Y1, Y10, Y12, Y15, Y16, Y2, and Y3** without inventing a second algebra. This is also consistent with the scaling architecture, which treats the two mission families as foreground changes on top of one shared operator language rather than separate engines.

Finally, it supports far transfer because portability is already built into the architecture through **Y14**, syntax and wrapper swap logic, boundary characterisation, cue-based retrieval, and conservative banking rules.

### 6. Note on EOU

**Execute–Observe–Update (EOU)** should not be treated as a seventeenth primitive operator. It is a composition pattern for real-world mission execution that packages action and feedback using existing operators, especially **Y9, Y15, Y12, Y13, Y10, Y2, and Y3**. This keeps the primitive set small while still allowing a full action loop in practice.

### 7. Canonical summary

**Y1–Y16** are the primitive operators of the Trident-G inference algebra: compositional mindware moves that act on relational representations in working memory to set rigour, build and transform problem structure, test and discriminate, commit the next move, protect viability, and validate what is portable enough to bank as competence. They sit within the wider **language of thought and action**, whose other component is **mission grammar**, and they operate alongside, not instead of, the **reasoning calculus**, **semantic layer**, **syntax layer**, **subjective interface**, **Ψ-allostatic geometry**, and **cognitive runtime**. Reasoning types such as deductive, inductive, abductive, analogical, Bayesian, and value-of-information reasoning are not additional operators, but cross-cutting inference styles that can be instantiated during operator execution. Syntax variation and syntax swaps are not extra operators either, but surface-form changes used to test whether the same deeper operator demand and semantic structure survive portability checks across forms.