# **Player Feedback v2 â€” Capacity Gym**

## **A. Purpose**

This revision updates the player-feedback layer so it stays consistent with the revised Capacity Gym architecture:

- **20-Day Rewire first** as the compulsory encoding phase

- **10-Day Programme** as post-foundation consolidation

- **3-Day Sprint** as post-foundation maintenance or reactivation

- **XOR â†’ AND â†’ Interference** as the core encoding backbone

- **Emotional** and **Relational** as post-foundation branches

- **Transfer Readiness** as the honest in-app proxy for carry-over, rather than a claim of full far transfer

The aim is to give the player a feedback layer that is:

- clear

- motivating

- scientifically honest

- cognitively informative

- consistent with the deeper Trident-G portability logic

The player should be able to answer five practical questions at a glance:

1.  How did I do today?

2.  What level is actually stabilised?

3.  Am I improving over time?

4.  Are my gains starting to carry across changes?

5.  What am I training right now, and where am I in the route?

## **B. Design rule for the feedback layer**

The foreground feedback should stay **lean**.

Do not expose the entire backend telemetry board to the player in the main surface UI.

The main player-facing layer should show:

- performance

- stability

- trend

- early portability

- current skill focus and route progress

Deeper kernel telemetry can still be tracked in the background for coaching, analytics, and later proof layers.

This preserves the Trident-G distinction between:

- **player-facing pack feedback**

- **shared kernel telemetry**

## **C. Visible player-facing set â€” revised MVP**

Keep the visible foreground to **5 main feedback items**, but add a **persistent context strip** above them.

### **C1. Persistent context strip**

This should always tell the player:

- **Current phase**

- **Programme position**

- **Current family**

- **Training focus**

- **Next gate**

### **Example**

**Phase 1 â€” Encode  
**Day 8 of 20  
**Family: XOR  
**Training focus: flexibility, selective attention, conceptual abstraction  
Next gate: hold this level after a wrapper swap

This strip answers the most important missing question in the old spec:

**What cognitive function am I training right now?**

## **D. Main 5 player-facing feedback items**

### **1. Session average**

**Label:** Session average  
**Example:** Session average: 2.0

This remains the simple session-level summary of challenge level reached across the 10 blocks.

### **2. Stable level**

**Label:** Stable level  
**Example:** Stable at: 2-back

Subtext should clarify pressure status where relevant:

- Fast speed not yet confirmed

- Fast speed confirmed

- Wrapper hold confirmed

This makes stability more meaningful than simply showing the highest touched level.

### **3. 3-session trend**

**Label:** Trend  
**Example:** Trend: Rising

Recommended values:

- Rising

- Flat

- Volatile

- Recovering

This helps the player see whether their recent pattern is moving up, consolidating, wobbling, or recovering.

### **4. Transfer Readiness**

**Label:** Transfer Readiness  
**Example:** Transfer Readiness: Developing

Recommended supporting subtext:

- Your gains are starting to hold across controlled changes.

- Your gains are starting to travel beyond one wrapper.

- Your gains are beginning to carry into a new skill family.

This remains the player-facing app-only carry-over metric.

### **5. Track progress**

**Label:** Track progress  
**Example:** Encode: Day 8 of 20 \| XOR: 2 of 3 variants stabilised

This replaces the narrower old label **Family mastery progress**.

The new wording is better because the player is progressing through:

- a **phase**

- a **family**

- a **developmental path**

not only a single family in isolation.

## **E. Why â€œTransfer Readinessâ€ should stay**

The app should use:

**Transfer Readiness**

not:

**Far transfer**

because true far transfer in Trident-G is stronger than game carry-over alone.

A stronger far-transfer claim requires more than local in-app success. It requires broader portability, repeated variation, cue-fired use outside the original wrapper, and conservative banking.

So for the MVP, **Transfer Readiness** remains the correct and honest middle ground between:

- raw game score

- and the full Trident-G far-transfer standard

## **F. What Transfer Readiness measures in the MVP**

Transfer Readiness should be a simple, individual-only proxy computed from the playerâ€™s own history.

It should reflect:

- same-family carry-over under wrapper change

- stable performance after controlled perturbation

- fast-speed confirmation as an automaticity gate

- successful carry-over into the next scheduled family or an allowed post-foundation probe family

It should not be presented as proof of full far transfer.

## **G. Revised Transfer Readiness rule set**

## **G1. Inputs**

Compute from the playerâ€™s own history only:

- successful same-family wrapper swaps

- last-3-block consistency after swap

- stable level after swap

- fast-speed confirmation at the current stable level

- successful carry-over into the next scheduled family on the backbone

- successful post-foundation probe-family session

- family mastery status

- phase completion status

## **G2. Level definitions**

### **Early**

No successful same-family swap yet.

**Meaning:  
**You are still building stable control in one wrapper.

### **Emerging**

At least **1 successful same-family swap**.

**Meaning:  
**Your gains are starting to survive a wrapper change inside one family.

### **Developing**

At least:

- **2 successful same-family swaps**

- across at least **2 variants in the same family**

- plus **1 fast-speed confirmation** at the current stable level

**Meaning:  
**Your gains are not only travelling across wrappers. They are beginning to hold under tighter timing.

### **Broadening**

Developing, plus either:

- **1 successful carry-over event into the next scheduled family**, or

- **1 successful post-foundation probe-family session**

**Meaning:  
**Your gains are beginning to travel beyond one family.

### **Strong**

Available only after the foundation phase.

Requires:

- **Phase 1 complete**

- **family mastered** in the current family

- **fast-speed confirmation** in that family

- and either:

  - **successful carry-over into the next family**, or

  - **2 successful post-foundation probe sessions**

**Meaning:  
**You are showing repeated carry-over under controlled changes, not just one good session.

## **H. Formal developer logic**

**î°ƒ**transferReadiness = Early

if successfulSameFamilySwaps \>= 1:

transferReadiness = Emerging

if successfulSameFamilySwaps \>= 2

and successfulVariantsInFamily \>= 2

and fastSpeedConfirmations \>= 1:

transferReadiness = Developing

if transferReadiness == Developing

and (

successfulNextFamilyCarryOver \>= 1

or successfulPostFoundationProbeSessions \>= 1

):

transferReadiness = Broadening

if phaseCompleted("Encode") == true

and familyMastered(currentFamily) == true

and fastSpeedConfirmedInFamily == true

and (

successfulNextFamilyCarryOver \>= 1

or successfulPostFoundationProbeSessions \>= 2

):

transferReadiness = Strong

î°‚

## **I. Definitions used by developer logic**

### **I1. Successful same-family swap**

**î°ƒ**successfulSameFamilySwap = (

last3Consistent == true

and targetStableLevel \>= sourceStableLevel - 1

)

î°‚This keeps the rule modest and practical:

a swap counts as successful when the player holds the level after the wrapper change, or drops by no more than one level while remaining stable.

### **I2. Fast-speed confirmation**

**î°ƒ**fastSpeedConfirmation = (

currentSpeed == fast

and last3Consistent == true

and fastStableLevel \>= normalStableLevel - 1

)

î°‚This is the key motor-habit addition.

It reflects the revised architectureâ€™s rule that speed pressure is part of the proceduralisation gate rather than an optional harder mode.

### **I3. Successful next-family carry-over**

**î°ƒ**successfulNextFamilyCarryOver = (

last3Consistent == true

and enteredFamilyStableLevel \>= enteredFamilyStartLevel

)

î°‚This captures early cross-family carry-over along the intended route.

### **I4. Successful post-foundation probe session**

**î°ƒ**successfulPostFoundationProbeSession = (

phaseCompleted("Encode") == true

and last3Consistent == true

and probeStableLevel \>= probeStartLevel

)

î°‚This makes sure that probe-family broadening is interpreted more strongly only once the compulsory foundation phase exists.

## **J. Relationship between transfer layers**

For the MVP, define two transfer layers.

### **Visible now**

**Transfer Readiness  
**A player-facing, app-only carry-over signal based on the playerâ€™s own history.

### **Hidden now, visible later**

**Cohort-adjusted broader generalisation  
**A stronger expected-vs-observed cross-family transition score using shared cloud data later.

This allows the app to ship now with an honest individual proxy while reserving the stronger broader-generalisation metric for a later evidence layer.

## **K. What should remain hidden for now**

Do **not** surface the full backend telemetry in the main player UI yet.

Keep these hidden or coaching-only for now:

- within-family swap cost

- within-family portability rate

- syntax-swap pass rate

- broader swap cost

- lapse count

- error bursts

- late-session collapse

- re-entry quality

- cue-fired deployment

- banking status

- cohort-adjusted broader generalisation

These still matter at the kernel and coaching layer, but they should not crowd the foreground MVP feedback surface.

## **L. Family-specific skill labels for player feedback**

The placeholder family template should now use the **real family names and functions**, not generic numbered families.

## **L1. XOR**

**Family:** XOR  
**Trains:** flexibility, selective attention, conceptual abstraction  
**Why it matters:** helps you hold the right target while adapting to changing surface forms

## **L2. AND**

**Family:** AND  
**Trains:** feature binding, associational memory  
**Why it matters:** helps you bind multiple features into one usable working-memory representation

## **L3. Interference**

**Family:** Interference  
**Trains:** inhibitory control, conflict resolution, conceptual abstraction  
**Why it matters:** helps you resist the wrong match signal and hold the right rule under conflict

## **L4. Emotional**

**Family:** Emotional  
**Trains:** affective working memory, emotion regulation  
**Why it matters:** helps you keep control when emotionally salient material competes for attention

## **L5. Relational**

**Family:** Relational  
**Trains:** relational integration, fluid reasoning  
**Why it matters:** helps you track patterns and rules between items rather than only isolated tokens

## **M. Placeholder coaching copy â€” revised set**

## **1. Initial onboarding**

**Title:** Start with the foundation  
**Body:** This 20-day block builds your core control pattern first. The aim is to stabilise performance across wrappers and then confirm it under tighter timing.  
**Footer:** Foundation first. Shorter modes unlock later.

## **2. Same-family variant swap prompt**

**Title:** Test carry-over  
**Body:** Stable here. Swap variant to test whether this gain travels across a new wrapper.  
**Footer:** Same family, different wrapper.

## **3. Speed increase prompt**

**Title:** Confirm pressure stability  
**Body:** Stable here. Now confirm the same level at fast speed to test whether control is becoming more automatic.  
**Footer:** Same rule, less time.

## **4. Next n-level prompt**

**Title:** Deepen the load  
**Body:** Wrapper hold and speed hold are in place. Move to the next n-level to deepen the demand.  
**Footer:** Higher load, same control pattern.

## **5. Family probe unlock**

**Title:** Controlled probe available  
**Body:** Progress has flattened here. Probe \[Family Name\] to test whether your gains can hold under a different skill demand.  
**Footer:** Controlled variety, not a reset.

## **6. Successful probe-family feedback**

**Title:** Carry-over detected  
**Body:** Your stability held in \[Family Name\]. That suggests your gains are starting to generalise into a new skill demand.  
**Footer:** You can run one more probe session here.

## **7. Unsuccessful probe-family feedback**

**Title:** Useful mismatch  
**Body:** This family places more demand on \[Skill Focus\]. Return to \[Origin Family\] to stabilise, then retry later.  
**Footer:** Not a setback â€” this helps target the next gain.

## **8. Permanent family unlock**

**Title:** Family unlocked  
**Body:** Youâ€™ve shown stable performance across the wrappers in \[Current Family\] and confirmed the gain under tighter timing. Youâ€™ve unlocked \[Next Family\], which trains \[Skill Focus\].  
**Footer:** New skill family ready.

## **9. Family mastery feedback**

**Title:** Core family mastered  
**Body:** Youâ€™ve stabilised this family across its variants and held the gain under tighter timing. That means your progress is less tied to one wrapper and more likely to travel.  
**Footer:** Next: broaden the skill range.

## **10. Transfer Readiness status copy**

### **Early**

You are building stable control in one wrapper.

### **Emerging**

You are starting to carry performance across wrapper changes.

### **Developing**

Your gains are holding across more than one variant and under tighter timing.

### **Broadening**

Your gains are starting to carry into a different skill family.

### **Strong**

You are showing repeated carry-over under controlled changes.

## **N. Recommended UI wording examples**

### **Example 1 â€” early Rewire session**

**Phase 1 â€” Encode  
**Day 4 of 20  
**Family: XOR  
**Training focus: flexibility, selective attention, conceptual abstraction  
Next gate: test carry-over in a new wrapper

Session average: 1.8  
Stable at: 2-back  
Trend: Rising  
Transfer Readiness: Emerging  
Track progress: Encode Day 4 of 20 \| XOR: 1 of 3 variants stabilised

### **Example 2 â€” later Rewire session**

**Phase 1 â€” Encode  
**Day 14 of 20  
**Family: AND  
**Training focus: feature binding, associational memory  
Next gate: confirm this level at fast speed

Session average: 2.7  
Stable at: 3-back  
Trend: Rising  
Transfer Readiness: Developing  
Track progress: Encode Day 14 of 20 \| AND: 2 of 2 variants stabilised

### **Example 3 â€” post-foundation broadening**

**Phase 2 â€” Consolidate  
**Day 3 of 10  
**Family: Emotional  
**Training focus: affective working memory, emotion regulation  
Next gate: hold this level in a second session

Session average: 2.2  
Stable at: 2-back  
Trend: Recovering  
Transfer Readiness: Broadening  
Track progress: Consolidate Day 3 of 10 \| Emotional: 1 of 2 variants stabilised

## **O. Summary rule**

The revised player-facing layer should be:

- a **persistent context strip** that tells the player the current phase, family, cognitive function, and next gate

- plus **5 foreground feedback items**:

  1.  Session average

  2.  Stable level

  3.  Trend

  4.  Transfer Readiness

  5.  Track progress

This keeps the UI lean while making the player-facing feedback fully consistent with the revised motor-habit architecture.

The key principle is:

**show the player what they are training, where they are in the route, and whether the gain is starting to travel â€” without overstating what has actually been proven.**

