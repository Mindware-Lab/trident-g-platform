## Core G-Loop signals and routing logic

### C0. Overview

For practical Trident-G use, the loop can be governed by a compact set of operational signals that sit above the deeper computational variables. These signals are not separate from the theory. They are the coaching-facing control board derived from the underlying quantities F, G, F★, x, ξ, ε, together with salience and map-cost considerations. The recommended signal set is: load, drift, mismatch, unexpected mismatch, salience, complexity, and conflict.

The key distinction is that some of these are core state or error signals, while others are routing, budgeting, or map-management signals. Load and mismatch are closest to the underlying Trident variables. Drift is a practical indicator of deteriorating control. Unexpected mismatch is the escalation signal for deeper restructuring. Salience sets rigour. Complexity belongs to the map dial. Conflict is best treated as an important cue source rather than a master scalar in its own right.

In practice, these signals are often encountered through a subjective interface of feelings, urges, motivations, emotions, and felt significance. Coaching should therefore treat emotion as signal-bearing but fallible rather than as mere noise or as infallible truth.

A further theoretical clarification is important. Mismatch is not a simple one-step switch between explore and exploit. Acute worse-than-expected reality typically produces short-horizon tightening and damage-control. Persistent mismatch, repeated policy failure, or failed re-entry builds pressure for exploratory restructuring. Easier-than-expected reality relaxes unnecessary bracing, supports consolidation of the current policy, and may reopen safe exploration relative to the previous stance. In that sense, reinforcement learning is central, but it is embedded inside a broader Trident-G architecture of allostasis, salience, subjectivity, and portability testing.

### C1. Load

**Definition:** the current realised burden, strain, or effort cost being imposed on the system.

**Computational mapping:** load maps most closely to F(t), the realised allostatic or free-energy burden. When expressed relative to the defended corridor, it maps to x(t) = F(t) − F★(t), that is, current deviation from the corridor centre.

**Practical meaning:** how hard the situation is on the organism or learner right now, given complexity, time pressure, distraction, emotional strain, motivational conflict, uncertainty, and bodily cost. In the user-facing G-Loop language, load is the strain level or mental effort cost.

**Primary use in the loop:** load tells the system whether the current loop is still viable. High load does not automatically mean failure, but it does mean the rigour budget, pacing, and action scope may need adjusting. If load rises without good control, the loop should simplify, shorten, stabilise, or recover rather than merely push harder.

### C2. Drift

**Definition:** decay of the current task-set or control state.

**Computational status:** drift is best treated as an operational telemetry signal, not as one of the original primitive scalars in the December 2025 computational paper. It is a practical marker that the system is losing hold of the active set, with slipping attention, blurred rules, creeping errors, or degraded stability.

**Practical meaning:** wandering, loss of thread, state drift, rule-blur, unstable performance, or rising error bursts. Drift usually means that even if the map is notionally good, the system is no longer holding or executing it cleanly enough for trustworthy updating.

**Primary use in the loop:** drift is mainly a credit-assignment warning signal. High drift means that learning conditions are getting noisy. The default response is usually to reduce model weight, narrow the loop, stabilise, recover, or shorten the action cycle. In other words, drift is a strong cue to simplify before interpreting too much.

### C3. Mismatch

**Definition:** the gap between what the system braced for and what actually occurred.

**Computational mapping:** mismatch maps directly to ε(t) = F(t) − G(t). This is the cleanest one-to-one mapping in the framework. It captures whether the niche is harsher than expected or easier than expected.

**Practical meaning:** plan–reality gap, prediction miss, or the sense that the current model, policy, or bracing level is off. In the applied G-Loop wording, mismatch means “something does not add up” because realised conditions differ from expected burden.

**Interpretation:**

- **Positive mismatch / under-bracing:** reality is harsher than expected.
- **Negative mismatch / over-bracing:** reality is easier than expected.
- **Near-zero mismatch:** actual and expected load are broadly aligned.

**Directional note for control and reinforcement learning:** mismatch is not a simple direct switch between explore and exploit.

Acute positive mismatch usually triggers tighter control first. The short-horizon move is often to narrow, simplify, stabilise, and exploit whatever currently looks most likely to pull load back towards the corridor.

Persistent positive mismatch weakens confidence in the currently failing policy. Over repeated episodes, it builds pressure for exploratory restructuring, alternative policies, or revised state abstractions when ordinary control is no longer working.

Acute negative mismatch relaxes unnecessary bracing. It supports consolidation of the just-used policy and reduces rigid avoidance. Relative to the previous over-braced stance, it may also permit broader safe exploration.

**Primary use in the loop:** mismatch is the main signal to update the map or adjust the move, not to grind harder. It is also central for reinforcement-learning-style credit assignment: it tells the system whether the active policy family is being confirmed, strained, or undermined. In Trident-G terms, however, reinforcement alone is not enough for far transfer. A policy should only be promoted towards Gc when it later survives swaps, traps, and real missions, rather than merely producing a local reward signal in one wrapper.

### C4. Unexpected mismatch

**Definition:** surprise about mismatch, not merely mismatch itself.

**Computational mapping:** this corresponds to the later Trident-G refinement PEε, the mismatch prediction error, defined as mismatch relative to what mismatch was expected in that context.

**Practical meaning:** the system is not just wrong about the world, but wrong in a way that is more unstable or surprising than the current model predicted. This is a higher-order signal that the present representation, trigger, or operator boundary may be wrong at a deeper level.

**Primary use in the loop:** unexpected mismatch is the escalation signal for deeper revision. In the later theory and protocol, high unexpected mismatch, especially when paired with re-entry failure, is what increases the probability that the system should move from ordinary Type-1 tuning into Type-2 restructuring. In practice, this means: stop merely tuning execution and consider revising the schema, boundary, trigger, or state abstraction itself.

**Relation to reinforcement learning:** ordinary mismatch can strengthen or weaken policies. Unexpected mismatch is the stronger signal that ordinary policy updating may be insufficient because the problem lies in the model, not just the action weights. It therefore plays a key role in moving from incremental reinforcement to structural learning.

### C5. Salience

**Definition:** the rigour-budgeting signal that determines how much modelling, checking, and effort is warranted right now.

**Computational mapping:** salience corresponds to the paper’s salience–allostasis hub, which pools internal and external signals and helps determine valuation, σ-fields, and the value difference that shapes explore–exploit tilt. In later wording, salience is a precision-weighted integration of interoceptive and exteroceptive demand signals.

**Practical meaning:** stakes check, importance dial, attention budget. Salience determines whether the loop should stay lean and probe cheaply, or briefly allow more structure and stronger validation because the stakes justify it.

**Primary use in the loop:** salience sets the rigour budget. Low salience supports a lighter loop. High salience or high mismatch justifies more explicit mapping, stronger checks, or more cautious commitment. Salience is therefore not just another signal alongside load and mismatch. It is the signal that tells the loop how much loop to run.

**Relation to subjectivity and mode tilt:** salience is often lived as urgency, importance, pressure, significance, temptation, or threat. These feelings may track real demand, but they may also be distorted by fatigue, over-bracing, stale priors, or emotional capture. Salience therefore helps determine whether the system treats a given surprise as something to tighten around, probe, or escalate, while still requiring evaluation rather than blind obedience to felt pressure.

### C6. Complexity

**Definition:** the representational burden or model weight of the current map.

**Computational status:** complexity is not a prediction-error signal. It belongs to the map dial, not to the state-error family. In the later theory, a good map is the simplest one that is accurate enough to guide the next move, given current stakes and state.

**Practical meaning:** how many moving parts the model is tracking, how costly it is to hold online, and how fragile it becomes under load and state drift.

**Primary use in the loop:** complexity helps regulate the accuracy–complexity trade-off.

- If load or drift is high, simplify hard.
- If mismatch is high, allow more structure briefly to find the missing constraint, wrong relation, or bad assumption.

Complexity therefore answers a different question from mismatch. Mismatch asks, “Is my model wrong?” Complexity asks, “Is my model too heavy for the current state and stakes?”

### C7. Conflict

**Definition:** competition, incompatibility, or tension in response selection, claim structure, incentives, evidence, or goals.

**Computational status:** conflict is best treated as a cue source, not as a master scalar on the same level as load or mismatch. In the wider theory, conflict is one of the external demand or uncertainty cues that can drive salience and bracing.

**Practical meaning:** competing actions, rival hypotheses, contradictory claims, motivational clashes, or the sense that different parts of the map are pulling in incompatible directions.

**Primary use in the loop:** conflict usually routes towards Y12 Evaluate or Y13 Discriminate / Probe rather than being treated as a top-level loop state by itself. In practical terms, conflict says: “A local separation problem exists here. Run an evaluation or design a discriminating probe.” It is therefore a trigger for deeper checking rather than the main control-board scalar.

### C7A. Subjective interface of the signal board

The operational signals of the G-Loop are not only abstract control variables. They are also lived subjectively. In Trident-G, feelings, motivations, emotions, urges, and felt significance are one of the main ways the organism encounters load, salience, conflict, and the affordance surface.

This means that subjective experience is neither outside the signal board nor identical with it. Rather, it is the lived interface through which the signal board is often first encountered in practice. Pressure, dread, urgency, attraction, aversion, confidence, confusion, and felt overload may all reflect real signal conditions in the loop, but they may also reflect over-bracing, stale priors, fatigue, or distorted appraisal.

Practically, this means:

- rising emotional pressure may indicate rising **load**
- felt importance or urgency may reflect **salience**
- felt “something is off” may track **mismatch**
- repeated shock, instability, or disorientation may indicate **unexpected mismatch**
- affective capture may worsen **drift**
- rumination, inner conflict, or competing pulls may be one subjective face of **conflict**

The coaching rule is therefore: treat subjectivity as **signal-rich but fallible**. It should inform routing, but not replace probing, evaluation, simplification, recovery, or re-mapping.

### C8. Signal priority and routing rule

The signals above should not be read as seven equal lights on a dashboard. They play different roles.

**Core state and error signals**

- load
- mismatch
- unexpected mismatch

**Control-quality signal**

- drift

**Rigour-budgeting signal**

- salience

**Map-cost signal**

- complexity

**Cue-source / local trigger**

- conflict

This yields the following default routing logic:

1. **Check load and drift first.**  
   If either is high enough to threaten viable control, simplify, stabilise, recover, or externalise before drawing strong conclusions.

2. **Use mismatch to decide whether the map or policy is miscalibrated.**  
   Mismatch is the main signal for updating the current model or bracing level. In the short term, positive mismatch usually tightens control. Across repeated failures, it increases pressure for restructuring.

3. **Use unexpected mismatch to decide whether deeper restructuring is needed.**  
   When mismatch is unstable and ordinary re-entry or tuning is failing, escalate from tuning to structural revision.

4. **Use salience to set how much loop to run.**  
   Higher stakes justify more map detail, stronger checks, and more cautious stopping rules. Lower stakes justify leaner loops.

5. **Use complexity to manage map weight.**  
   A model can be correct in principle but too heavy for the present state. Complexity helps stop the loop from collapsing under its own representational cost.

6. **Use conflict as a cue to evaluate or discriminate.**  
   Conflict is usually a sign that the system needs a sharper local test rather than more generic effort.

7. **Use reinforcement signals conservatively for banking.**  
   Policy strengthening or weakening can happen quickly, but banking into Gc should occur only after portability checks, boundary characterisation, and real-world mission success. Otherwise reward may reinforce wrapper-bound habits rather than far-transfer competence.

### C9. One-line definitions

**Load:** how much burden is actually being carried.  
**Drift:** how much the task-set is decaying.  
**Mismatch:** how far reality differs from what was braced for.  
**Unexpected mismatch:** how surprisingly unstable that mismatch is.  
**Salience:** how much rigour the loop should spend.  
**Complexity:** how heavy the current map is to hold and run.  
**Conflict:** where local incompatibility or competition requires sharper checking.

### C10. Summary statement

Load and mismatch are the main practical faces of the underlying Trident state variables. Drift tracks control decay. Unexpected mismatch is the restructuring gate. Salience sets rigour. Complexity governs model weight. Conflict is a cue source that routes the loop towards evaluation or discrimination. Subjective experience is the lived interface through which many of these signals are first encountered, but it should be treated as signal-rich and fallible rather than as either mere noise or infallible truth. Reinforcement-learning-style credit assignment is central for policy updating, but far-transfer Gc requires that reinforced policies also survive abstraction, portability checks, and real missions before they are banked as reusable competence.
