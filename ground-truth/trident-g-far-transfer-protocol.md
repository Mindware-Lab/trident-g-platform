# Appendix X. Far-transfer protocol and reinforcement architecture

## X0. Purpose and scope

Trident-G tackles the far-transfer problem by training two things together: a universal inference-and-validation algebra and the capacity to run it reliably under load, inside a defended Ψ corridor. Portability is not assumed. It is demonstrated through wrapper swaps, stake swaps, boundary checks, and cue-fired real-world missions, then compiled into reusable mindware scripts only when it survives those tests.

In this appendix, far transfer means portable operator reliability: a learned operator or script can be retrieved under changed wrappers, still improve performance or decision quality for the right reason, and fire from real-world cues across time and context rather than only inside the original training wrapper.

## X1. Core claim

Far transfer in Trident-G is produced by a repeated cycle of:

stabilise → perturb → select invariants → bank → deploy

Capacity training widens usable computation inside the Ψ-band by improving stability, re-entry, updating, and interference control. Mindware training specifies the operator chains, probes, checks, and boundaries to run. Swap tests and real missions then apply selection pressure so that what survives is not a wrapper-bound trick but a portable operator policy.

Relational processing is the live bridge between these layers. It holds, transforms, compares, and tests task-relevant structure under current constraints, allowing fluid discoveries to become validated Gc only when they survive portability checks.

## X2. Architectural distinction: what does what

Far-transfer training in Trident-G should be implemented across four distinct layers.

Mission frames define what the loop is for right now. They provide the top-level success criteria and therefore the highest-level reinforcement signals: better understanding, stronger arguments, better decisions, cleaner execution, and successful acquisition of a reusable capability.

Control missions protect loop viability and clean credit assignment. Their target is not truth or performance directly, but in-band execution: lower drift, better cadence, stronger shielding from distraction, faster re-entry, and fewer bad updates while out of band.

Meta-dials are slower shapers of the geometry of cognition. Meta-efficacy, coherence, workspace synergies, and life-niche fit change controllability, adherence, learning rate, and whether reinforcement attaches to the correct policy rather than to local wrapper cues.

Feedback signals are fast diagnostic signals. They do not define the goal. They tell the loop whether to simplify, probe, recover, update, or restructure.

## X3. Definition of far-transfer evidence

Trident-G should distinguish between two levels.

Transfer observed is the minimum proof-of-life threshold. A candidate operator counts as observed transfer only when it survives at least one wrapper swap and is also triggered and enacted in at least one real situation.

Reliable far transfer is the stronger threshold for treating a script as genuinely installed. A candidate should show success across at least two distinct wrapper swaps, at least three cue-fired deployments across at least two different days, some boundary discrimination for tempting-but-wrong near misses, and stability under mild load variation such as time pressure, distraction, or mild stress.

## X4. The far-transfer protocol

### X4.1 Ψ-gate first

Learning should only be intensified when the user is sufficiently in band. Out-of-band training contaminates credit assignment because the system starts learning how to survive the state rather than how to preserve task structure. High load, high drift, or repeated re-entry failure should route first to recovery, simplification, or externalisation.

### X4.2 Build the smallest usable map

The map should be the simplest model that is accurate enough to guide the next move under current stakes. When load or drift is high, simplify hard. When mismatch is high, allow more structure briefly to identify the missing constraint, wrong relation, or wrong value assumption.

### X4.3 Test by probe first, then validate

Testing is the anti-thin-automation safeguard. A probe is a cheap discriminating check that helps locate what is wrong. Validation is a stronger check that asks whether the candidate structure survives variation, boundaries, and edge cases. Banking should never be based on plausibility alone.

### X4.4 Use controlled perturbations as selection pressure

Wrapper swaps, stake swaps, boundary/trap probes, and delayed re-checks are not optional variety. They are the mechanism that selects for deep invariants rather than surface bindings. Near swaps test surface robustness, mid swaps test family-level or frame-level invariance, and far swaps test context invariance and cue firing.

### X4.5 Treat spikes as candidates, not proof

A click or spike is a candidate Type-2 installation, not far transfer by default. It should be captured, minimally probed while still labile, then stabilised and only later banked if it survives swap tests and delayed re-checks. Same-day euphoria is not enough.

### X4.6 Bank only after portability validation

Install / Bank is a cross-frame conversion mode, not a separate mission family. A script becomes bankable only after portability testing, boundary/trap characterisation, and linkage to real or strongly mission-proximal success signals rather than local wrapper reward.

## X5. Reinforcement architecture for far transfer

The reinforcement system should be implemented as a hierarchy.

### X5.1 Ground-truth reinforcement

The strongest reinforcement signal is real-world mission success or a strongly mission-proximal success signal. Internal training scores matter, but they are subordinate. Trident-G explicitly places real mission outcomes above local practice reward so that the system learns what improves the ecological objective function rather than what merely wins inside one wrapper.

### X5.2 Process reinforcement

A second layer of reinforcement should strengthen robust control dynamics, not just peak scores. Useful process-level markers include lower variability, fewer error bursts, lower drift, faster re-entry, lower swap cost, and stronger recovery slope after perturbation. These indicate that the policy is becoming more stable and more likely to travel across wrappers and stakes.

### X5.3 Credit-assignment reinforcement

Mismatch is the main reinforcement-learning-style credit-assignment signal. It tells the system whether the active policy family is being confirmed, strained, or undermined. But mismatch should update the map or policy, not simply increase effort. Acute positive mismatch usually calls for tightening, simplification, and stabilisation. Persistent mismatch increases pressure for exploratory restructuring. Negative mismatch supports leaner control and selective consolidation.

Unexpected mismatch, or PEε, is the escalation signal for deeper restructuring. It says the problem may lie in the representation, cue, operator boundary, or state abstraction itself rather than only in execution. This is the main gate from ordinary Type-1 tuning into Type-2 restructuring, especially when paired with re-entry failure.

### X5.4 No-bank rule

Reinforcement can strengthen or weaken policies quickly, but it must be used conservatively for banking. A policy should not be promoted to Gc simply because it produced local reward in one wrapper. It must also survive abstraction, portability checks, boundary characterisation, and real missions.

## X6. The fast signals and what they do

Load signals how hard the situation is right now and whether the current loop is still viable. High load calls for simplification, pacing changes, stabilisation, or recovery rather than blind intensification.

Drift is the main warning that credit assignment is becoming noisy. When drift rises, the current task-set is decaying, so learning should not be interpreted too aggressively. The default move is to simplify, narrow the loop, stabilise, or reset.

Mismatch is the plan–reality gap. It indicates that the current map, assumptions, or chosen move is off. It routes towards updating, probing, or re-bracing rather than grinding.

Unexpected mismatch is the higher-order restructuring gate. When mismatch becomes surprisingly unstable, the system should stop mere tuning and consider revising the schema, boundary, trigger, or state abstraction.

Salience is not another reward signal. It is the rigour-budgeting dial that determines how much loop to run. Low salience supports lean probes and fast commitment. High salience justifies richer mapping, stronger checks, and stricter stopping rules.

Complexity is a property of the map, not a reward signal. It governs representational weight: when load or drift is high, simplify; when mismatch is high, temporarily allow more structure.

Conflict is best treated as a cue source. It should usually route towards Y7 Evaluate or Y10 Discriminate rather than being treated as a master scalar in its own right.

## X7. Practical reinforcement-routing rules

The following routing rules should be treated as canonical.

If the cue did not fire, treat the problem as one of retrieval or environmental triggering, not basic capability.

If the cue fired but the operator failed, treat the problem as portability or script-fit failure. Refine boundaries, probes, or the cue itself.

If drills look good but the policy collapses under pressure, treat the problem as state stability, corridor control, or insufficient Type-1 robustness, not as a fully installed script.

If mismatch is persistent but explainable and re-entry works, stay in Type-1 tuning: improve efficiency, calibration, switching, interference control, and volatility reduction.

If mismatch is unexpectedly unstable, drift repeats, and re-entry is failing, escalate to Type-2 restructuring: revise the representation, cue, invariant, or operator chain rather than pushing harder.

## X8. What counts as a banked unit

A banked mindware script should be stored as a compact retrieval unit:

cue/trigger → steps/operators → check → boundaries/traps → stop rule

Without explicit cueing and boundary notes, the stored unit is likely to be wrapper-bound rather than portable. Gc in Trident-G is not mere memory. It is validated memory: what has survived wrapper swaps, stake swaps, and boundary checks strongly enough to be trusted as portable competence.

## X9. Canonical one-paragraph summary

Far transfer in Trident-G is driven by Ψ-gated learning that selects for invariance. Capacity training makes cognition stable, flexible, and cheap enough to run cleanly under load. Mindware training teaches the operator chains that act on relational structure. Controlled perturbations, especially wrapper swaps, stake swaps, and boundary probes, then test whether gains preserve deep structure rather than surface bindings. Reinforcement is mission-first and banked conservatively: real or strongly mission-proximal success signals outrank local practice reward, mismatch drives updating, unexpected mismatch gates restructuring, and only policies that survive swaps, boundaries, cue-fired deployment, and delayed re-check are promoted into Gc as reusable competence.

## X10. Scope note

This protocol is designed to support healthy performance habits and more reliable intelligent action. It should not be framed as medical treatment or as a guaranteed outcome system. If users are concerned about anxiety, sleep, mood, pain, or other health issues, they should speak with their GP.
