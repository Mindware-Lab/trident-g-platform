# Consumer Vs Coaching Feedback

This document defines the foreground feedback split for `trident-g-iq-basic`.

The rule is simple:

- `trident-g-iq-basic` is the consumer product.
- The consumer layer should feel fun, immediate, and intuitive.
- Technical telemetry stays out of view unless it directly answers "What do I do next?"
- Detailed diagnostic, scoring, and interpretation layers belong to the special coaching programme.

This split is derived from the current basic-app specs:

- Capacity Gym player feedback should stay lean and foreground only the main player-facing pack feedback.
- Zone Coach should route the user cleanly into run, support, reset, or re-check.
- Transfer claims should stay modest and visible as `Transfer Readiness`, not full far transfer.
- The 20-session encoding route must stay behaviorally clear without exposing backend complexity.

## Global Consumer Rule

Each basic-app screen should foreground only:

1. Current mode
2. Current status
3. One clear next action
4. One or two progress signals
5. Reward status

Consumer screens should avoid:

- raw classifier outputs
- item-level psychometrics
- backend routing codes
- dense telemetry boards
- kernel-level portability markers
- technical validity diagnostics unless they change the next action

## Hub

### Consumer-facing

- Current programme route:
  - `20-Day Rewire`
  - `10-Day Programme`
  - `3-Day Sprint`
- Availability state for each route:
  - `20-Day Rewire` available first
  - `10-Day Programme` locked until foundation complete
  - `3-Day Sprint` locked until foundation complete
- Current phase and day count
- Current family and training focus
- Whether today can count as a core session
- Simple next step:
  - `Run Zone first`
  - `Full route available`
  - `Support route only`
- Core progress:
  - `8 of 20 core sessions`
- Support progress:
  - support sessions logged
- Wallet visibility:
  - `Tridents`
  - `Gs`
  - `Trident Credit`
- Simple milestone progress:
  - progress toward the current reward target

### Coaching-only

- In-zone time percentage
- Check-in history and pass rate
- Unlock prerequisite internals
- Reward bucket breakdown
- Reserved versus available credit states
- Redemption cap diagnostics
- Phase-rule exceptions and routing edge cases

## Tests

### Consumer-facing

- Test family:
  - `Fluid reasoning`
  - `Applied intelligence`
- Test state:
  - `Baseline`
  - `Repeat`
  - `Due now`
  - `Completed`
- Eligibility:
  - `Testing allowed now`
  - `Postpone until in zone`
- Progress:
  - item or section count
- Short guidance:
  - `Focus on clean effort, not speed`
- Simple result framing:
  - band, summary, or change versus earlier self
- Reward cue:
  - modest test completion bonus

### Coaching-only

- Raw scores and transformed scores
- Item-level response logs
- Response timing distributions
- Subscale calculations
- Reverse-scored item details
- Validity diagnostics beyond simple allow/postpone messaging
- Comparison tables that are too detailed for the consumer surface

## Zone Coach

### Consumer-facing

- State:
  - `Ready`
  - `Flat`
  - `Spun Out`
  - `Locked In`
- One action recommendation:
  - `Run now`
  - `Activate first`
  - `Regulate first`
  - `Re-check later`
- Session class:
  - `Core session`
  - `Support session`
  - `Recovery / defer`
- Whether today counts toward the 20-session route
- Simple route consequence:
  - `10 blocks`
  - `4-6 blocks`
  - `3-4 blocks`
  - `wrapper reset only`
- Re-check availability
- Optional simple zone score if it helps motivation, but not as the main headline

### Coaching-only

- `bits/second`
- confidence bands and thresholds
- raw classifier outputs
- load, drift, readiness internals
- legacy gate codes
- baseline deviation logic
- diagnostic signal board values
- history and interpretation layers used for coaching decisions

## Capacity Gym

### Consumer-facing

- Persistent context strip:
  - current phase
  - day count
  - current family
  - training focus
  - next gate
- Main five feedback items:
  - `Session average`
  - `Stable level`
  - `Trend`
  - `Transfer Readiness`
  - `Track progress`
- Simple session class from Zone:
  - `Core`
  - `Support`
  - `Reset`
- Whether the session counts toward the 20-session route
- Coach prompt in plain language:
  - `Test carry-over`
  - `Confirm pressure stability`
  - `Deepen the load`
  - `Controlled probe available`
  - `Useful mismatch`
- Reward feed:
  - Tridents earned this session
  - total G balance
  - Trident Credit equivalent
- Family and route progress in intuitive wording, not technical telemetry

### Coaching-only

- last-3-block consistency details
- block-by-block performance breakdown
- lure and mismatch schedule data
- lapse count
- timeout count
- error bursts
- late-session collapse
- re-entry quality after wobble
- swap cost
- portability-rate internals
- fast-speed gate internals
- family mastery rule details
- probe unlock logic details

## Shared Reward Surface

The consumer layer should make reward highly visible, but simple:

- session reward feed uses `Tridents`
- wallet total uses `Gs`
- checkout value uses `Trident Credit`

The consumer UI should show:

- reward gain this session
- total wallet balance
- next milestone target

The coaching programme can additionally show:

- bucket source of each reward
- validation rules for rewards
- reserve / redeem / release states
- wallet audit trail

## Design Consequence For The Basic App

`trident-g-iq-basic` should therefore behave like a dual-surface product:

- `basic consumer surface`
  - playful
  - fast to read
  - low jargon
  - action-led
- `coaching surface`
  - technical
  - explanatory
  - diagnostic
  - suitable for expert review and intervention

The consumer should mainly see:

- where they are
- whether today counts
- what to do next
- whether they are improving
- what they earned

The coach can see the rest.
