# Trident-G IQ App UX & Communication QA Checklist

## Purpose

Use this checklist to review training apps, coaching apps, assessment flows, and in-session task screens.

The aim is simple: keep apps clear, usable, credible, low-friction, and easy to follow under cognitive load.

## Pass Rule

- all **Critical checks** pass
- at least **18 of 24** standard checks pass
- no red-flag failures

## Spatial Dimensions Contract (mandatory)

Canonical reference:
- `UI_SIZE_CONTRACT.md`

Required shell dimensions:
- Desktop breakpoint: `@media (min-width: 960px)`
- Desktop shell width: `min(900px, calc(100% - 24px))`
- Desktop shell height: `calc(100vh - 36px)` (compact height: `calc(100vh - 18px)` at `max-height: 940px`)
- Mobile breakpoint: `@media (max-width: 520px)`
- Mobile shell width: `100%`
- Mobile shell height: `100dvh`
- Mobile shell edge style: `border-radius: 0; border: none`

Required behavior:
- Desktop core task flows: no-scroll by default.
- Mobile flows: vertical scrolling enabled in main content container.
- Footer nav fixed and always tappable.
- Mobile bottom reserve padding must prevent footer occlusion of primary controls.

Dimension QA checks:
- [ ] Shell dimensions match the contract on desktop and mobile
- [ ] Desktop core tasks are completable without vertical scrolling
- [ ] Mobile content scrolls smoothly where content exceeds viewport
- [ ] Bottom navigation does not overlap critical controls
- [ ] Primary actions remain reachable above footer reserve
- [ ] No scroll snap-back after touch release

## Critical Checks

- [ ] A first-time user can tell what this screen is for within seconds
- [ ] Current task/state/next action is visible without memory load
- [ ] Instructions are plain English
- [ ] Interactive controls look interactive and are easy to tap/click
- [ ] Immediate, unambiguous feedback after actions
- [ ] Text/controls/status are legible on desktop and mobile
- [ ] Error states explain what happened and what to do next
- [ ] Claims stay non-medical unless medically justified

## Standard Checks (24 target)

### 1) First-run clarity and onboarding

- [ ] Opening screen explains app purpose simply
- [ ] First useful action is obvious
- [ ] Onboarding is short and revisitable

### 2) In-session task clarity

- [ ] Current goal/rule is visible on-screen or one tap away
- [ ] User can tell what to do now
- [ ] Help and support controls are consistently placed

### 3) Written communication

- [ ] Text is short and scannable
- [ ] Labels describe user actions clearly
- [ ] Help text appears only where useful

### 4) Visual hierarchy and legibility

- [ ] Main action is visually dominant
- [ ] Prompt/action/feedback/metadata are clearly differentiated
- [ ] Important info is not hidden in low-contrast microtext

### 5) Accessibility and control visibility

- [ ] Strong text contrast
- [ ] Status is not color-only
- [ ] Touch targets are large and spaced well

### 6) Feedback, progress, loading

- [ ] Tap/submission feedback is immediate
- [ ] Pending/success/failure states are visually distinct
- [ ] User can tell waiting vs complete

### 7) Errors, empty states, recovery

- [ ] Errors are plain language with clear next step
- [ ] Empty states explain what to do next
- [ ] User can retry/reset/back out safely

### 8) Intervention trust, burden, safety

- [ ] Intended purpose and target user are clear
- [ ] Claims are modest and believable
- [ ] Safety/scope limits are visible where relevant

## Red-Flag Failures

If any is present, flow fails:

- [ ] User has to remember hidden rules from prior screen
- [ ] Current system state is unclear
- [ ] Core actions are hidden, ambiguous, or icon-only without labels
- [ ] Loading/saving occurs without visible feedback
- [ ] User is trapped in dead-end modal/blocked state
- [ ] Manipulative pressure language or inflated outcome claims

## One-line reminder

Intervention apps should feel easy to enter, easy to follow, and easy to trust, even when tasks are demanding.
