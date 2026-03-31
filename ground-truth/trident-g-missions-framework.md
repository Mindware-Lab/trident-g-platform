# Mission framework, control layers, and feedback distinctions

## B0. Overview

Trident-G uses a single G-Loop kernel, but it is helpful to distinguish four layers rather than treating everything as one flat set of “missions”.

- **Mission frames** answer: what is the loop being run for right now?
- **Control missions** answer: what keeps the loop viable, clean, and repeatable under real conditions?
- **Meta-dials** answer: what slow variables change the geometry, controllability, and ecology of cognition over time?
- **Feedback signals** answer: what fast diagnostic information is telling the loop to simplify, probe, recover, or restructure?

This distinction matters because Trident-G does not treat all cognitive improvement as one thing. Some training is about running the right frame, some is about protecting and restoring the loop, some is about changing the longer-timescale conditions under which the loop runs, and some is about reading fast signals correctly so the right update happens at the right layer.

Both mission families below are defined at a high, language-level purpose layer and draw on the same shared training stack. Capacity training strengthens the stability and flexibility needed to run the loop under load, while mindware training specifies the operator chains, probes, and scripts that the loop runs. The two families differ mainly in which target is foregrounded, not in using separate underlying mechanisms.

Higher-level note on Trident G itself: the mission framework below describes the applied purposes for which the G-Loop is run. At the deeper theoretical level, Trident G is organised as a shaft-and-tines architecture in which the shaft is banked Gc competence, the centre tine is live Gf reasoning, and the outer tines are the dominant explore–exploit branches available under higher engagement. This architecture is governed by two meta-missions: **Viability**, the maintenance and recovery of clean operation within the defended Ψ corridor, and **Expansion**, the enlargement of viable dynamic range and portable operator repertoire through the coordination of exploration, exploitation, and crystallisation into reusable Gc. The mission families below are therefore best understood as high-level purpose frames that sit on top of this common Trident-G architecture.

## B1. Mission frames - IQ / Performance

Mission frames are the purpose frames of the inference engine. They define what counts as a good map, a good test, a good update, and a good stopping point for the current run. The same algebra and operators can be used in every frame, but the success criterion changes by frame.

### B1.1 Understand | Comprehension

**Purpose:** build a usable model of what is going on.  
**Primary success criterion:** a clearer map that predicts, explains, and supports a safe, informative next move.  
**Typical sub-missions:** comprehension, diagnosis, troubleshooting, explanation, teaching-preparation.  
**Typical operator emphasis:** Y0, Y1, Y10, Y2, Y5, Y6, Y9.

### B1.2 Argue | Argumentation

**Purpose:** produce, test, refine, or audit a claim.  
**Primary success criterion:** explicit claim–support discipline with validity checks, counter-consideration, and boundaries.  
**Typical sub-missions:** argument construction, red-team audit, claim comparison, conflict handling between competing claims.  
**Typical operator emphasis:** Y0, Y1, Y5, Y7, Y10, Y12, Y9.

### B1.3 Choose | Decision

**Purpose:** select an action under uncertainty and trade-offs.  
**Primary success criterion:** a justified choice with explicit trade-offs, acknowledged uncertainty, and a clear reason for selection.  
**Typical sub-missions:** decision-making, prioritisation, trade-off handling, ethical choice under uncertainty.  
**Typical operator emphasis:** Y0, Y1, Y7, Y10, Y5, Y6, Y9.

### B1.4 Plan & Do | Strategic action

**Purpose:** turn a map or choice into executable action, then adapt under feedback.  
**Primary success criterion:** an executable sequence with a measurable signal, monitoring, and real-world follow-through.  
**Typical sub-missions:** strategic planning, implementation, negotiation, coordination, creative execution, adaptive follow-through.  
**Typical operator emphasis:** Y0, Y1, Y2, Y6, Y9, EOU, with Y7 or Y10 when mismatch is high.

### B1.5 Learn | Acquisition frame

**Purpose:** acquire, stabilise, and transfer a new capability, method, or schema.  
**Primary success criterion:** the learner can instantiate the skill or schema in a new wrapper, explain the cue, and show early portability.  
**Important note:** architecturally, learning is always on. “Learn” is best treated as a user-facing acquisition frame, while Install / Bank is a cross-frame conversion mode that can follow any mission once something proves reusable. It is not a separate peer mission family in the strong sense.

## B2. Control missions - Resilience / self-regulation

These are not new reasoning frames. They are the outer-loop control missions that keep reasoning viable, protect credit assignment, and preserve portability under distraction, pressure, fatigue, overheat, flatness, and fluctuating salience. Their primary target is not claim quality or decision quality directly, but clean loop execution inside the Ψ-band.

### B2.1 Shield attention

**Purpose:** protect the current loop from distraction, interruption, and stimulus capture.  
**Success criterion:** the task-set stays clean enough for the selected mission to complete with low drift.

### B2.2 Regulate cadence

**Purpose:** set sustainable work–rest timing and recovery so cognition does not decay into fatigue, thrash, or flatness.  
**Success criterion:** better time-on-task stability, timely re-entry, and better matching between challenge and viable state.

### B2.3 Prioritise missions

**Purpose:** rank competing loops and allocate limited attention, time, and effort to the most consequential missions first.  
**Success criterion:** reduced thrash, fewer low-value captures, and higher completion of high-value loops.

### B2.4 Create distance

**Purpose:** preserve detachment, perspective, and emotional control under salience and pressure.  
**Success criterion:** felt pressure does not hijack the map, the test, or the stop rule.

### B2.5 Calibrate mode

**Purpose:** set the right balance between widening and tightening, or between exploration and exploitation, for the current phase and stakes.  
**Success criterion:** the task is being run in the right mode rather than by mood, habit, or panic-grind.

### B2.6 Arbitrate improvisation vs script

**Purpose:** decide when to rely on stored routine and when to switch back to flexible model-based control.  
**Success criterion:** existing scripts are exploited when appropriate, but novelty or failure triggers adaptive rethinking rather than rigid reuse.

### B2.7 Recover and re-enter

**Purpose:** restore viability when the loop leaves the corridor.  
**Success criterion:** faster re-entry, lower excursion cost, and fewer bad updates while out of band.  
**Operator anchors:** Y14 Recover, and Y15 Externalise / Escalate when safe restoration is not possible.

### B2.8 Externalise or escalate

**Purpose:** preserve progress and safety when the loop cannot be kept viable internally.  
**Success criterion:** cognition is offloaded to stable scaffolds, review, scheduling, or support rather than being forced through under unstable conditions.

### B2.9 Practical note on mindware in the self-regulation family

Self-regulation missions are not mindware-free. They often use a different style of mindware from the IQ / performance family, including:

- reframing
- reappraisal
- distancing
- restructuring-style routines
- pacing routines
- recovery scripts
- ecological design rules
- cue-control and start / stop rituals
- prioritisation and defer / park rules

In Trident-G terms, these are still scripts or operator-linked routines. They simply target the conditions under which good reasoning can occur rather than the immediate content of reasoning itself.

## B3. Meta-dials and slow shapers

This layer should be kept conceptually distinct from the fast loop. These are not best understood as in-session missions. They are slower variables that shape controllability, learnability, corridor width, ecological support, and noise over longer timescales. In other words, they change the geometry of cognition rather than merely the content of one run.

### B3.1 Meta-efficacy | Earned agency confidence

This is grounded confidence that one can engage, recover, and act effectively under challenge. In the theory, meta-efficacy increases effective controllability and learnability, raises regulation gain, and lowers the felt cost of acting and updating. Practically, it reduces avoidance and supports stronger re-entry and commitment.

### B3.2 Coherence | Internal consistency and signal reliability

Coherence is the degree to which goals, definitions, signals, and steps hang together. In the theory, higher coherence reduces nuisance noise and improves estimation of corridor distance and control quality. Practically, it reduces confusion-noise and makes monitoring cleaner.

### B3.3 Ecology support | Workspace synergies and life-niche fit

This is the longer-timescale environmental layer. Workspace synergies reduce friction and make good loops easier to repeat. Life-niche fit determines whether the broader role, schedule, constraints, and opportunity structure support or obstruct reliable loop execution. In the theory, this is captured by the niche multiplier and related ecological support terms that shift corridor position, width, and environmental noise floor.

### B3.4 Bias profile | Slow offsets in control geometry

The theory also includes slower offsets such as allostatic drift, agency/gearing bias, and risk tilt. These are not “missions” but longer-timescale tendencies that bias where the system starts, how readily it gears for challenge, and whether uncertainty evokes widening or locking-in by default.

### B3.5 Practical interpretation

So in applied programme design, one can absolutely train or coach for self-efficacy, coherence, and ecology. But these are better described as meta-dial programmes or outer-loop shapers, not as fast mission frames. They influence adherence, consistency, retrieval, viable throughput, learning rate, generalisation pressure, and whether reinforcement can attach to the correct policy rather than to local wrapper cues.

## B4. Feedback signals and routing logic

These are the fast diagnostic signals that tell the loop what kind of update is needed. They should be kept distinct from both mission frames and meta-dials.

### B4.1 Load

**Meaning:** current realised demand, strain, or effort cost.  
**Typical sources:** complexity, time pressure, emotion, distraction, uncertainty.  
**What it is for:** load tells you how hard the situation is on the system right now. It contributes to salience and helps determine whether the current rigour budget is viable.

### B4.2 Drift

**Meaning:** decay of the task-set.  
**Typical manifestations:** wandering attention, rule-blur, slippage, error creep, losing the thread.  
**What it is for:** drift signals control decay. It often means the map or task-set is no longer being held cleanly enough for trustworthy updating. High drift is usually a reason to simplify, reset, or shorten the loop.

### B4.3 Mismatch

**Meaning:** the gap between what the system braced for and what actually hit.  
**Formal sense:** realised load versus expected burden.  
**What it is for:** mismatch is the primary plan–reality or model–reality gap. It tells the loop that the current map, assumptions, or selected move is off. The correct response is not always the same. Acute under-bracing usually calls for tighter control, simplification, and stabilisation. Persistent mismatch or repeated policy failure increases pressure for exploratory restructuring. Over-bracing calls for a leaner loop, reduced unnecessary rigour, and faster commitment, and may reopen safe exploration relative to the prior stance. In all cases, mismatch should route towards updating, probing, or re-bracing rather than mere grinding.

### B4.4 Unexpected mismatch | PEε

**Meaning:** surprise about mismatch, not merely mismatch itself.  
**What it is for:** PEε is the higher-order gate for deeper restructuring. The theory makes a strong distinction here: persistent or unexpectedly unstable mismatch, especially when paired with re-entry failure, is what triggers Type-2 restructuring rather than mere Type-1 tuning. This is the signal that the problem may lie in the structure of the map or operator, not just in execution quality.

### B4.5 Complexity

**Meaning:** the representational burden or model weight of the current map.  
**Important distinction:** complexity is not a feedback signal of the same type as load, drift, or mismatch. It is a property of the map being run: how many moving parts it contains, how hard it is to hold online, and how fragile it becomes under strain. The map rule is therefore: use the simplest map that is accurate enough for the next move. When load or drift is high, simplify hard. When mismatch is high, allow more structure briefly to find what is missing.

### B4.6 Conflict

**Meaning:** competition, incompatibility, or tension somewhere in the system.  
**Important distinction:** conflict is best treated as a source-level cue or local signal, not a master feedback class on the same level as load, drift, or mismatch. It may show up as response competition, competing hypotheses, contradictory claims, or felt dissonance. In practice, conflict usually feeds into salience and then shows up operationally as either mismatch, drift, or a need for Y7 Evaluate or Y10 Discriminate. It is therefore better treated as a trigger for deeper checking than as a separate global right-side dial.

### B4.7 Salience

Salience is not simply another feedback signal. It is the effort-budgeting dial that integrates external demand and internal cost and decides how much modelling, checking, and control is warranted right now. Low salience or low mismatch supports a lean loop. High stakes or high mismatch justifies a heavier loop.

## B5. Relationship between the layers

The layers share the same kernel, but they optimise different things.

Mission frames optimise for mission success: better understanding, stronger arguments, better decisions, cleaner execution, and better acquisition of reusable competence. They also provide the top-level success criteria and reinforcement signals.

Control missions optimise for loop viability and clean execution: more in-band time, lower drift, faster re-entry, less thrash, cleaner mode selection, and better resistance to distraction and overload. They preserve the viability and signal quality needed for clean credit assignment.

Meta-dials optimise the longer-timescale conditions of cognition: controllability, adherence, ecological fit, noise reduction, learning rate, retrieval ecology, and stable opportunity for the loop to run well.

Feedback signals do not define goals. They diagnose what kind of adjustment is needed now: simplify, probe, update, recover, or restructure.

## B6. Practical note on Learn and Install / Bank

To avoid confusion in future materials, the cleanest rule is:

- **Learn** may be kept as a user-facing acquisition frame.
- **Install / Bank** should be treated as a cross-frame conversion mode that can follow any successful mission.

A script counts as banked only after it survives validation, typically via wrapper swap, stake swap, and boundary/trap checks, so the stored unit is portable rather than wrapper-bound.

A script should be treated as strongly bankable only when it is not only validated under swaps and boundaries, but also linked to real or strongly mission-proximal success signals rather than local wrapper reward alone.

## B7. One-line summary

Mission frames define what the loop is for. Control missions keep the loop viable. Meta-dials shape the long-timescale geometry of cognition. Feedback signals tell the loop whether to simplify, probe, recover, or restructure.

# The Trident G synthesis

## 1. Structural architecture

This is the Trident G form itself:

- **Shaft = Gc**, the banked, reusable support structure, the validated operator library or crystallised competence
- **Centre tine = Gf**, the live inference bridge, effortful flexible reasoning in the centre of the loop
- **Outer tines =** the two dominant higher-engagement branches:
  - explore / entropy-widening
  - exploit / mutual-information-tightening

The “centre tine as live bridge” is especially well supported by the theory’s statement that SR-like predictive structure is a computational middle layer between the fast corridor controller and the portable operator library. That is very close in spirit to your claim that Gf is the live relational bridge between viability control and banked Gc.

## 2. Highest-level meta-missions

These sit above the mission appendix and explain what the whole Trident is for.

### Meta-mission 1: Viability

Maintain adaptive allostasis within the defended near-critical Ψ corridor so learning, inference, and action remain clean and recoverable.

That is fully consistent with the computational paper’s core claim that the organism must stay within a defended viability band and with the G-Loop definition as the smallest repeatable cycle that both keeps cognition viable inside the Ψ-band and turns successful runs into reusable know-how.

### Meta-mission 2: Expansion

Expand viable dynamic range and operator repertoire by using fluid reasoning to coordinate entropy-widening exploration and mutual-information-tightening control, then crystallising what survives into portable Gc.

## 3. Applied mission families

These are not the same thing as the two meta-missions. They are the user-facing, high-language-level purposes for which the Trident is run.

### B1 Mission frames — IQ / Performance

- Understand
- Argue
- Choose
- Plan & Do
- Learn

### B2 Control missions — Resilience / Self-regulation

- Shield attention
- Regulate cadence
- Prioritise missions
- Create distance
- Calibrate mode
- Arbitrate improvisation vs script
- Recover / re-enter
- Externalise / escalate
