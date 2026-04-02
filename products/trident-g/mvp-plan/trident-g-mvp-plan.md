# Trident-G MVP Plan

## Purpose

This document defines the **Trident-G MVP** as a playable, proof-first web app built around a shared G-Loop kernel. The MVP is designed to train portable intelligent action rather than wrapper-bound game skill, while keeping the user-facing UI simple and game-like.

The MVP should make the following visibly clear:

- real-world mission performance is the ultimate target
- higher layers depend on lower layers
- viability comes first
- scripts are only banked when they survive transfer checks
- proof of improvement must extend beyond local game scores

---

## Core product principle

The MVP is a **five-part loop**:

**Zone → Capacity → Reasoning → Mission → Real Missions**

This means:

- **Zone** decides whether the system is currently clean enough to train
- **Capacity** supports stable cognition under load
- **Reasoning** trains inferential transformations across forms
- **Mission** trains operator chains for real-use purposes
- **Real Missions** provide the top proof layer through cue-fired deployment and outcome tracking

The app should feel like a coherent game system, not five separate apps stitched together.

---

## Product goals

The MVP has five main goals.

### 1. Train the stack bottom-up
The user should gradually experience that:

- stronger capacity supports cleaner reasoning
- cleaner reasoning supports better operator execution
- better operator execution supports better mission performance
- real mission performance is what matters most

### 2. Keep the player-facing UI minimal
The player should not be overwhelmed with internal theory or technical metrics.

The visible interface should focus on:

- current state
- next best move
- progress through the stack
- scripts earned
- real mission outcomes

### 3. Make far transfer testable
Portability should not be assumed from local scores. It should be demonstrated through a staged proof ladder.

### 4. Keep the MVP local-first
The first version should be a static web app with local-only storage, but with analytics-ready schemas for future sync and cloud ingestion.

### 5. Make the architecture extensible
The MVP should be usable later as the shared core for:

- performance mission packs
- resilience mission packs
- cognitive longevity packs
- corporate plugin packs
- specialised assessment packs

---

## MVP architecture

## 1. Zone / Viability Gate

### Function
The Zone gate checks whether the user is currently in a viable operating state for clean learning and deployment.

### MVP implementation
A short **masked-majority task** or similar brief cognitive control probe, taking roughly **20–40 seconds**.

### Player-facing output
Only one of three states should be shown:

- **Ready**
- **Wobbling**
- **Recover first**

### Routing rules
- **Recover first** → no heavy training, show recovery routine or recovery route
- **Wobbling** → light training only, usually Capacity or lighter Reasoning
- **Ready** → full route available

### Design note
The Zone gate is not just another assessment. It is the entry condition for the whole loop.

---

## 2. Capacity Gym

### Function
This is the runtime-support layer.

It trains the substrate that makes higher cognition runnable under load, especially:

- working memory demand
- interference resistance
- re-entry
- control stability
- viable computation under pressure

### MVP implementation
Reuse the existing **Capacity Gym Stage1** module.

Focus initially on:
- classic n-back
- relational variants
- graph / transitive / propositional variants
- non-categorical modes as appropriate

### Player-facing output
Keep the visible output simple:

- streak
- progression
- challenge level
- one coach prompt if needed

Do not show deep runtime telemetry to the user.

---

## 3. Reasoning Gym

### Function
This is the inferential transformation layer.

It trains cross-cutting reasoning families that can run over different surface syntaxes and semantic wrappers.

### Core reasoning families for MVP
1. Deductive
2. Counterexample / falsification
3. Analogical
4. Bayesian / base-rate
5. Abductive
6. Value-of-information

### Item structure
Every item should have two levels:

- **latent structure**  
  the real formal or causal structure that determines correctness

- **surface rendering**  
  the syntax and semantics the user sees

### Wrapper tiers
Each item can be rendered as:
1. abstract / nonsense
2. neutral concrete
3. mission-framed content

### Belief-bias handling
Quadrant sampling should be used where relevant:
- believable / correct
- believable / incorrect
- unbelievable / correct
- unbelievable / incorrect

### Player-facing output
Simple only:
- correct / not yet
- streak
- progress
- coach prompt

---

## 4. Mission Gym / Mission Bootcamp

### Function
This is the operator-sequencing and mission-deployment layer.

It trains reusable operator strings for real-use purposes.

### Mission frames supported
The schema should support:
- Understand
- Argue
- Choose
- Plan & Do
- Learn

The MVP can foreground the first four if needed, but the model should not exclude Learn.

### Mission chain structure
Use short operator-string chains, for example:

- Evaluate → Counterexample → Probe → Boundary → Compile
- Map → Re-represent → Probe → Commit → Compile
- Evaluate → Probe → Commit → Boundary → Compile

### Abstract twins
Every mission chain should have an **abstract twin**:
- same latent structure
- different wrapper or surface rendering

### Output
Mission chains should end in a **compiled script candidate**, not an automatically banked script.

A script candidate becomes a true banked script only after portability and deployment checks.

---

## 5. Real Missions

### Function
This is the top proof layer.

The app should show whether training is affecting real intelligent action outside the game.

### MVP implementation
A **Mission Ledger / Mission Board** that tracks real-world missions.

### Each mission entry should contain
- mission frame
- mission title
- cue / trigger
- target outcome
- current status
- linked script candidate or banked script
- last deployed time
- deploy count

### Player-facing mission statuses
Use simple colour logic:
- **Green** = success
- **Amber** = partial / unstable
- **Red** = fail / redesign
- **Blue** = ready to deploy
- **Grey** = paused

### Design note
Real mission outcomes are the strongest proof layer in the app. They outrank local game reward.

---

## Portability and far-transfer logic

Portability should be trained and tested through an explicit staircase.

## Portability staircase
1. **Syntax swap**  
   same deep structure, new surface syntax

2. **Wrapper swap**  
   same deep structure, new semantics

3. **Mission-context swap**  
   same deep structure, different mission frame

4. **Delayed re-check**  
   same structure revisited after time delay

5. **Cue-fired real use**  
   use in a live task outside the training wrapper

Only after surviving enough of these should a script candidate become bankable.

---

## Banking logic

### Script candidate
Created when a mission chain compiles into a reusable method shape:
- cue
- steps
- check
- trap / boundary
- stop rule

### Banked script
A script candidate is promoted to a **banked script** only after enough evidence of portability and deployment.

### Minimum MVP bank logic
A candidate should ideally show:
- at least one syntax or wrapper survival event
- at least one delayed re-check survival
- at least one cue-fired real deployment
- at least one real mission outcome that is not just local game success

The exact threshold can be tuned later, but the logic should already exist in MVP.

---

## Player-facing UI

The UI should stay extremely lean.

The player should see only five high-level things on the main hub.

## 1. State tile
Shows:
- Ready
- Wobbling
- Recover first

## 2. Next best move
Only one coach card at a time.

Possible prompts:
- Recover
- Increase challenge
- Switch it up
- Drop one layer
- Deploy in real life
- Save this method

## 3. Stack ladder
Visible vertical ladder:

**Zone**  
↓  
**Capacity**  
↓  
**Reasoning**  
↓  
**Mission**  
↓  
**Real Missions**

This is the clearest way to make the bottom-up support structure visible.

## 4. Banked scripts
Simple summary only:
- saved
- reused
- ready to bank

## 5. Mission board
Show only a few active missions at once.

Visible fields:
- title
- frame
- status colour
- next review

### Important UI rule
Do **not** expose the deep internal signal board on the hub.

No raw:
- drift
- load
- mismatch
- unexpected mismatch
- complexity
- swap matrices
- RT plots
- latent IDs

These stay internal.

---

## Coach prompt vocabulary

The coach should use only six visible action classes.

## 1. Recover
Used when the system is not clean enough for useful training.

## 2. Push
Increase challenge slightly.

## 3. Switch it up
Use a syntax swap, wrapper swap, or alternate but structurally related task.

## 4. Step down
Drop one layer in the stack:
- Mission → Reasoning
- Reasoning → Capacity
- Capacity → Zone

## 5. Deploy
Use the method in a real task.

## 6. Bank
Save the method as a stable script.

---

## Internal telemetry plan

Telemetry is required in MVP, but should remain thin and mostly invisible.

The purpose of telemetry is:

- routing
- plateau detection
- overload detection
- portability tracking
- banking logic
- mission history

If a metric does not support one of those, it likely does not belong in MVP.

## Telemetry ledgers

## 1. State ledger
Tracks Zone and routing decisions.

### Minimum fields
- `session_id`
- `timestamp`
- `zone_state`
- `route_recommendation`
- `state_check_version`

Optional:
- `notes`

## 2. Training ledger
Tracks training events inside the gyms.

### Shared minimum fields
- `session_id`
- `timestamp`
- `gym`
- `task_id`
- `difficulty_level`
- `completed`
- `accuracy`
- `duration_ms`

### Capacity-specific optional fields
- `stability_flag`
- `lapse_count`
- `interference_level`

### Reasoning-specific optional fields
- `syntax_id`
- `wrapper_id`
- `latent_id`
- `correct`
- `swap_type`

### Mission-specific optional fields
- `chain_id`
- `operator_string`
- `boundary_pass`
- `script_candidate_created`

## 3. Transfer ledger
Tracks far-transfer and portability.

### Minimum fields
- `script_id`
- `latent_id`
- `syntax_swap_pass`
- `wrapper_swap_pass`
- `mission_context_pass`
- `delayed_pass`
- `cue_fired_count`
- `real_use_count`
- `bank_status`

### Suggested bank status values
- `none`
- `candidate`
- `holding`
- `banked`

## 4. Mission ledger
Tracks real-world mission deployment.

### Minimum fields
- `mission_id`
- `frame`
- `cue`
- `target_outcome`
- `status`
- `script_id`
- `last_deployed_at`
- `deploy_count`

### Optional fields
- `review_date`
- `notes`

---

## Assessment and proof architecture

The game and the assessment layer should be related but not collapsed into one thing.

The clean structure is:

- simple summary on the G-Loop hub
- richer assessment and proof details in a separate **Proof / Assessments room**

## What appears on the hub
Only compact assessment entry points:
- Zone Check
- Weekly Check
- Proof
- Mission Board

## What lives in the Proof / Assessments room
Use the existing assessment repo items as the starting battery.

### Existing repo-derived assessments
- **SgS-12 A** = reasoning benchmark baseline
- **SgS-12 B** = reasoning benchmark post
- **Psi-CBS** = cognitive bandwidth tracker
- **CRS-10** = resilience tracker
- **EDHS** = applied decision-habit outcome
- optional external Mensa links as benchmark extras

### Recommended tabs
#### 1. State
- Zone Check
- Psi-CBS
- CRS-10

#### 2. Benchmarks
- SgS-12 A / B
- optional external benchmark

#### 3. Applied outcomes
- EDHS
- later mission-specific tests

#### 4. Transfer proof
- Training gains
- Syntax holds
- Wrapper holds
- Cue fired
- Mission improved
- Banked

## Missing assessment pieces to build later
- Zone task if not already implemented elsewhere
- held-out mission-specific tests for Understand / Argue / Choose / Plan & Do / Learn
- corporate / plugin-specific applied tests

---

## Data schemas

## Session event log
Use local JSON logging, analytics-ready.

### Minimum schema
```json
{
  "session_id": "string",
  "timestamp": "ISO-8601",
  "gym": "zone|capacity|reasoning|mission",
  "state": "ready|wobbling|recover",
  "action": "start|complete|swap|deploy|bank",
  "result": "success|partial|fail",
  "accuracy": 0.0,
  "duration_ms": 0
}
```

### Extended schema
```json
{
  "session_id": "string",
  "timestamp": "ISO-8601",
  "gym": "capacity|reasoning|mission",
  "task_id": "string",
  "chain_id": "string",
  "difficulty_level": 0,
  "latent_id": "string",
  "wrapper_id": "string",
  "syntax_id": "string",
  "belief_quadrant": "bc|bi|uc|ui",
  "swap_type": "none|syntax|wrapper|mission_context|delayed",
  "transfer_result": "none|pass|fail",
  "wm_load": 0,
  "accuracy": 0.0,
  "duration_ms": 0,
  "boundary_pass": true
}
```

## Mission ledger entry
```json
{
  "mission_id": "string",
  "frame": "understand|argue|choose|plan_do|learn",
  "cue": "string",
  "target_outcome": "string",
  "status": "ready|partial|success|fail|paused",
  "script_id": "string",
  "last_deployed_at": "ISO-8601",
  "deploy_count": 0,
  "review_date": "ISO-8601",
  "notes": "string"
}
```

## Script candidate / banked script
```json
{
  "script_id": "string",
  "status": "candidate|holding|banked",
  "cue": "string",
  "steps": ["string"],
  "check": "string",
  "trap_or_boundary": "string",
  "stop_rule": "string",
  "source_chain_id": "string",
  "syntax_swap_pass": false,
  "wrapper_swap_pass": false,
  "mission_context_pass": false,
  "delayed_pass": false,
  "real_use_count": 0
}
```

---

## Test plan for MVP

## Functional checks
1. Zone gate routes consistently to Ready, Wobbling, or Recover first.
2. Capacity module launches and records completion.
3. Reasoning items render correctly in abstract, neutral, and mission wrappers.
4. Syntax swaps are injected and recorded.
5. Mission chains produce a script candidate object.
6. Mission Ledger entries can be created and updated.
7. Banked script count updates only after transfer conditions are met.

## Behaviour checks
1. Out-of-band state suppresses heavy training.
2. Plateau can trigger “Switch it up”.
3. Overload can trigger “Step down”.
4. Robust performance can trigger “Deploy”.
5. Sufficient transfer evidence can trigger “Bank”.

## UI checks
1. Hub never shows more than one coach prompt at a time.
2. Stack ladder is clearly readable.
3. Mission Board stays simple and legible.
4. No deep telemetry clutters the hub.

---

## Technical assumptions

- MVP is a static web app
- local-only storage for first release
- existing Capacity Stage1 is reused
- no server-side personalisation in MVP
- no cloud sync required initially
- all schemas should remain analytics-ready for later Supabase or shared-backend migration

---

## Naming guidance

### Internal architecture names
Use these internally in specs and code:

- Zone / Viability Gate
- Capacity Gym
- Reasoning Gym
- Mission Gym
- Real Missions
- Script Candidate
- Banked Script
- Transfer Ledger
- Mission Ledger

### Player-facing names
Prefer simpler labels in the UI:
- Zone
- Capacity
- Reasoning
- Mission
- Real Missions
- Saved Methods
- Weekly Check
- Proof

---

## Terminology key

## Zone
The current viability state for clean training and action. It determines whether the user is ready, wobbling, or should recover first.

## Capacity
The runtime-support layer. It includes working memory, control stability, interference resistance, re-entry, and related substrate functions that make higher cognition runnable under load.

## Reasoning
The inference layer. It includes deductive, abductive, Bayesian, analogical, counterexample, and value-of-information style transformations.

## Mission
The operator-sequencing layer that serves a real-use purpose, such as Understand, Argue, Choose, Plan & Do, or Learn.

## Real mission
A real-world task or challenge outside the game where a learned method is deployed.

## Latent structure
The underlying formal or causal structure that determines the right answer or right method. This is deeper than surface wording or theme.

## Syntax
The surface representational form of the same deeper structure. Examples:
- verbal
- visual
- diagrammatic
- symbolic

A syntax swap changes the form without changing the deeper structure.

## Wrapper
The semantic shell or scenario in which a deeper structure is embedded. Examples:
- nonsense / abstract
- neutral everyday
- work
- health
- planning
- mission-framed content

A wrapper swap changes the scenario while preserving the deeper demand.

## Syntax swap
A portability test where the same deep structure is shown in a different surface form.

## Wrapper swap
A portability test where the same deep structure is shown in a different semantic shell.

## Mission-context swap
A portability test where the same structure is used under a different mission frame.

## Delayed re-check
A portability test where the user encounters the same deeper structure again after a time delay.

## Cue-fired use
A real-world deployment event in which the relevant cue occurs and the user attempts to use the learned method.

## Script candidate
A compiled method extracted from mission play:
**cue → steps → check → trap/boundary → stop rule**

It is not yet considered fully portable.

## Banked script
A script candidate that has survived enough portability and deployment checks to count as reusable competence.

## Boundary / trap
A tempting near-miss or failure condition that helps define where a method should not be used.

## Step down
A coach action that routes the user to a lower layer when the current layer is too demanding:
- Mission → Reasoning
- Reasoning → Capacity
- Capacity → Zone

## Push
A coach action that increases challenge modestly when progress is stable.

## Switch it up
A coach action that perturbs the task through syntax, wrapper, or alternate structurally related form when progress is flatlining.

## Deploy
A coach action that tells the user to use a method in a real task.

## Bank
A coach action that saves a method as a validated reusable script once it has sufficient evidence.

---

## Final MVP design rule

The internal engine may be rich, but the surface should stay simple.

The player should mostly experience:

- a state
- a next move
- a clear ladder
- methods earned
- missions improving

Everything else should support that silently in the background.
