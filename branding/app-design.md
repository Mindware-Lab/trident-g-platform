# Trident-G IQ App UX & Communication QA Checklist

## Purpose

Use this checklist to review training apps, game-like intervention apps, coaching apps, assessment flows, and in-session task screens.

The aim is simple: make the app clear, usable, credible, low-friction, and easy for a thoughtful general adult user to follow, including under cognitive load.

This checklist is for apps where users must understand what to do, what is happening, and what to do next without confusion, overload, or hype.

---

## Core standard

Every app screen and flow should be:

- clear enough to use without guesswork
- light enough to use under cognitive load
- explicit enough that users do not need to remember hidden rules
- accessible enough to work across common visual, motor, and attention differences
- calm and credible enough for a science-based intervention
- structured enough that users can recover quickly from mistakes

---

## Pass rule

An app flow should pass only if:

- all **Critical checks** pass
- at least **18 of 24** standard checks pass
- there are **no red-flag failures**

---

## Critical checks

These must all pass.

- [ ] **A first-time user can tell what this screen is for within a few seconds**
- [ ] **The current task, state, or next action is visible without needing memory**
- [ ] **Instructions are written mainly in plain English**
- [ ] **Interactive elements look interactive and are easy to tap or click**
- [ ] **The app gives immediate, unambiguous feedback after user actions**
- [ ] **Core text, controls, and status indicators are legible on desktop and mobile**
- [ ] **Errors, failed actions, or empty states explain what happened and what to do next**
- [ ] **The app does not overclaim outcomes or sound medical when it is not medical**

---

## Standard checks

### 1) First-run clarity and onboarding

- [ ] The opening screen explains the app’s job in simple terms
- [ ] The first useful action is obvious
- [ ] Onboarding is short, skippable, or easy to revisit
- [ ] The app teaches by doing, not by dumping long instructions up front
- [ ] Permissions, notifications, biometrics, or sensor requests are asked for at the moment they make sense
- [ ] Permission prompts explain why access is needed in user-facing language

### 2) In-session task clarity

- [ ] The current goal or rule is visible on the active screen, or one tap away
- [ ] The user can tell what to do **now**, not just what the app does in general
- [ ] Key controls are labelled clearly or are instantly recognisable
- [ ] Interactive elements are visibly interactive
- [ ] Essential temporary information appears where the user is already looking
- [ ] Repeated help or support elements stay in a consistent place across screens

### 3) Written communication

- [ ] UI text is short and scannable
- [ ] Each screen communicates one main idea or action
- [ ] Jargon and internal theory language are avoided or briefly explained
- [ ] Labels describe user actions clearly
- [ ] Error text is human-readable, not technical
- [ ] Help text is concise and appears only where it is useful

### 4) Visual hierarchy and legibility

- [ ] The most important item on the screen is visually dominant
- [ ] Prompt, action, feedback, and metadata are clearly differentiated
- [ ] Font sizes are comfortably readable without zooming
- [ ] Important information is not buried in tiny labels or low-contrast metadata
- [ ] Bold or visual emphasis is used selectively, not noisily
- [ ] Icons are supported by labels when ambiguity is likely

### 5) Accessibility and control visibility

- [ ] Text contrast is strong enough for comfortable reading
- [ ] The app does not rely on colour alone to signal status or correctness
- [ ] Keyboard focus, selected state, and active state are clearly visible
- [ ] Tap targets are large enough and spaced well enough to avoid accidental taps
- [ ] Drag-only interactions have a non-drag alternative where possible
- [ ] Previously entered information is reused or selectable instead of forcing re-entry

### 6) Feedback, progress, and loading

- [ ] A tap, response, or submission produces immediate visible feedback
- [ ] Success, failure, and pending states are visually distinct
- [ ] Loading states are clearly signalled
- [ ] Multi-step flows show progress
- [ ] The user can tell whether the app is waiting, processing, or complete
- [ ] Notifications, validations, and status cues are used deliberately, not noisily

### 7) Errors, empty states, and recovery

- [ ] Error messages say what went wrong in plain language
- [ ] Error messages include a clear next step
- [ ] Empty states explain why nothing is shown and what to do next
- [ ] The user can undo, retry, back out, or reset where appropriate
- [ ] Important or irreversible actions use confirmation or other error-prevention safeguards
- [ ] The app does not trap the user in a dead-end modal or blocked state

### 8) Intervention trust, burden, and safety

- [ ] The intended purpose of the app is clear
- [ ] The target user is clear
- [ ] The app explains what it tracks and why
- [ ] Claims are modest and believable
- [ ] Safety or scope limits are stated where relevant
- [ ] The design appears workable for lower digital confidence, older users, or fatigued users

---

## Red-flag failures

If any of these are present, the app flow fails.

- [ ] The app opens with a dense instructional wall before the user can do anything
- [ ] The user has to remember task rules from a previous screen
- [ ] The current state of the system is unclear
- [ ] Important temporary information appears outside the user’s main eye-line
- [ ] Key actions are icon-only, ambiguous, or visually hidden
- [ ] Core signals rely on colour alone
- [ ] Text contrast is weak or controls are too small to tap reliably
- [ ] Loading, syncing, or saving happens with little or no visible feedback
- [ ] Permission requests appear too early or without clear explanation
- [ ] Ratings or reviews are requested on first launch or during onboarding
- [ ] Error messages are technical, blamey, or do not explain recovery
- [ ] The app uses manipulative pressure, shame, or streak anxiety to force engagement
- [ ] The app sounds inflated, guaranteed, or medical-style without proper basis
- [ ] The user cannot pause, retry, reset, or exit safely

---

## House rules for Trident-G IQ apps

### Must do

- [ ] The active screen always answers: **What am I doing? What do I press next? How am I doing?**
- [ ] Keep the current rule, prompt, or operator cue visible during demanding tasks
- [ ] Prefer recognition over recall for all task instructions and control options
- [ ] Use one short interactive demo or sample trial instead of long pre-task explanation
- [ ] Show immediate result feedback after each meaningful action or block
- [ ] Keep help in one predictable place throughout the app
- [ ] Explain any sensor, biometric, or data request in plain language before or at request time
- [ ] Make progress history, logs, or export trail easy to find
- [ ] Use calm, restrained language for outcomes and safety
- [ ] Make pause, reset, and recovery states explicit rather than treating them as failure

### Must avoid

- [ ] Hidden gestures for essential actions
- [ ] Dense theory text inside the active training flow
- [ ] Requiring users to remember scoring rules, icons, or state meanings
- [ ] Overstimulating feedback that competes with the task itself
- [ ] Treating “engagement” as pressure rather than usable, meaningful participation
- [ ] Medical-sounding claims for non-medical features
- [ ] Tiny metadata, weak contrast, or cramped cards in high-load screens

---

## Simple score

Use this if you want a quick decision.

- **Pass** = all Critical checks pass, no red flags, and 18–24 standard checks pass
- **Borderline** = all Critical checks pass, no red flags, and 14–17 standard checks pass
- **Fail** = any Critical check fails, any red flag appears, or fewer than 14 standard checks pass

---

## Quick reviewer prompts

Use these when auditing a screen or flow.

1. Can a first-time user tell what to do within a few seconds?
2. Is the current task, state, or rule visible without memory load?
3. Does the interface teach by doing, or by making the user read too much?
4. Are feedback, loading, and progress visible enough to build trust?
5. Could a tired, older, or lower-confidence user still use this screen comfortably?
6. Are permissions, claims, and safety wording calm and proportionate?
7. Can the user recover quickly from mistakes, interruptions, or confusion?
8. Is the app encouraging meaningful use, rather than just pushing for more use?

---

## Suggested use in repo

Apply this checklist to:

- first-run onboarding
- home or dashboard screens
- session runner screens
- assessment flows
- results screens
- history, log, or export screens
- settings and help screens
- paywall or upgrade screens
- permission and notification prompts

Suggested workflow:

1. Review one flow at a time
2. Mark pass, borderline, or fail
3. Fix Critical checks first
4. Fix any red flags
5. Re-test on both desktop and mobile
6. Re-check before shipping

---

## One-line reminder

**Intervention apps should feel easy to enter, easy to follow, and easy to trust — even when the task itself is demanding.**
