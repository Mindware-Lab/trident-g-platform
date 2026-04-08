# Hub Telemetry Spec

This document defines every telemetry item currently shown on the `trident-g-iq-basic` Hub screen and how it should be measured in the `basic` product.

The Hub is the summary layer. It should show:

- cross-module status
- long-term or cross-session progress
- wallet/reward state
- one recommended mission

It should not expose the full coaching telemetry board.

## Important guardrail

The Hub currently shows a `Far Transfer` badge on the Capacity card because that is the chosen UI wording.

In `trident-g-iq-basic`, that badge should still be treated as an explainer label, not a literal proof claim. The measurable quantities underneath it are:

- `WM capacity gain estimate`
- cognitive skill gains from baseline
- test change summaries

The actual pack-level carry-over proxy defined in the repo docs remains `Transfer Readiness`.

## 1. Mission Panel

### 1.1 `Recommended mission`

Type:
- decision output, not a score

Purpose:
- surface the next best sequence across `Tests`, `Zone`, and `Capacity`

How to derive it:
- start from the current programme state
- check whether a scheduled test is due
- check latest fresh Zone result
- check current family / next gate in Capacity

Recommended decision order:
1. Resolve the active programme:
   - `20-Day Rewire`
   - `10-Day Programme`
   - `3-Day Sprint`
2. Resolve the current training day index inside that programme.
3. Check whether the day is:
   - first day
   - every 5th training day
   - last day
4. Insert `Assess Zone` before any Capacity session.
5. Set the training step to the next scheduled Capacity family / task from the previous valid Capacity session.

Canonical `basic` mission algorithm:

#### First day of programme

```text
Take all tests > Assess Zone > Do first XOR n-back session
```

`Take all tests` means the opening evidence bundle for the product.

#### General training day

```text
Assess Zone > Do next Capacity n-back session
```

`next Capacity n-back session` is determined by the previous valid Capacity session:
- next family
- next variant
- wrapper swap requirement
- fast-speed gate
- held or advanced level

#### Every 5th training day

```text
Take Psi-CBS Test > Assess Zone > Do next Capacity n-back session
```

Rule:
- insert `Psi-CBS` on every 5th training day of the active programme

#### Last day of programme

```text
Assess Zone > Train scheduled n-back session > Take all tests
```

Recommended pseudocode:

```text
if programme_day == 1:
  mission = [all_tests, assess_zone, first_xor_session]
else if programme_day == programme_length:
  mission = [assess_zone, scheduled_capacity_session, all_tests]
else if programme_day % 5 == 0:
  mission = [psi_cbs, assess_zone, scheduled_capacity_session]
else:
  mission = [assess_zone, scheduled_capacity_session]
```

Example output:
- `Take Psi-CBS Test > Assess Zone > Train Emotional N-Back`

Source:
- new Hub orchestration logic in `basic`
- test cadence from legacy assessments
- zone freshness and route class from legacy Zone Coach
- family scheduler from Capacity route state

Status:
- new derived UI output

### 1.2 `Training rate` ring

Visible UI:
- `40%`
- inner label `Efficiency`

Type:
- summary adherence / cadence metric

Definition:
- percent of days trained since the active programme was started

Canonical rule:
- `100%` = the user trained every day since the programme started

Recommended formula:

```text
training_rate_pct =
  round(100 * trained_days_since_programme_start / elapsed_programme_days)
```

Where:
- `trained_days_since_programme_start` = count of calendar days since the current programme started with at least one completed Capacity session
- `elapsed_programme_days` = inclusive day count from programme start date to today
- a completed session can be:
  - `core`
  - `support`
  - `recovery micro-session`

Status:
- new derived metric for `basic`

### 1.3 Recent training strip under the ring

Type:
- binary recent-activity history graph

Definition:
- 20-segment recent day strip showing which recent days contained training activity

Measurement:
- one segment per day
- green = at least one completed Capacity session on that day
- grey = no Capacity session logged on that day

Recommended window:
- trailing 20 calendar days

Recommended data source:
- Capacity session history in `basic` storage / Supabase session table

Status:
- new derived graph for `basic`

## 2. Programme Cards

These are telemetry-bearing route cards, not just static labels.

## 2.1 `20 Baseline Rewire`

Visible items:
- stage `20`
- status `Complete`
- 20-segment fully green bar

Definition:
- progress through the mandatory `20 core encoding sessions`

Measurement:

```text
baseline_rewire_completed_sessions =
  count(valid_core_sessions_in_encode_phase)
```

Completion rule:
- only `Ready / In Zone` full sessions count
- Flat / Spun Out / Locked In support sessions do not count

Source:
- `zone-coach.md`
- `governing-telemetry-and-game-map-v1.md`

Display rule:
- segment count = 20
- green segments on = `min(20, baseline_rewire_completed_sessions)`
- status:
  - `Complete` if `completed_sessions >= 20`
  - otherwise `Active`

Status:
- direct from route/session-count state once implemented

### 2.2 `10 Targeted Rewire`

Visible items:
- stage `10`
- status `Active`
- 10-segment strip with a few green segments

Definition:
- progress through the post-foundation 10-session consolidation cycle

Measurement:

```text
targeted_rewire_completed_sessions =
  count(completed_sessions_in_current_10_day_programme)
```

Unlock rule:
- available only after `20-Day Rewire` completion

Display rule:
- segment count = 10
- green segments on = completed sessions in the active 10-session cycle
- status:
  - `Locked` before unlock
  - `Active` while in progress
  - `Complete` at 10 of 10

Status:
- direct from route/session state

### 2.3 `3 Sprint`

Visible items:
- stage `3`
- status `Select`
- 10-segment preview strip currently showing one green segment

Recommended measurement model:
- use a 3-session sprint progress count, but keep a compact segmented preview for style consistency

Measurement:

```text
sprint_completed_sessions =
  count(completed_sessions_in_current_or_last_sprint_cycle)
```

Recommended display mapping:
- use 10 visual segments for consistency
- fill proportionally:

```text
segments_on = round((sprint_completed_sessions / 3) * 10)
```

Status meaning:
- `Select` = unlocked but not the active route
- `Active` = sprint currently selected
- `Complete` = 3 of 3 finished

Status:
- direct from route/session state

## 3. Wallet Panel

## 3.1 `G wallet balance`

Visible item:
- `3.8 G`

Definition:
- macro wallet balance shown in Gs

Measurement:

```text
wallet_g = available_tridents / 1000
```

Source:
- server-side wallet balance
- do not derive from client-only UI state

Source-of-truth tables from repo doc:
- `credit_accounts`
- `credit_ledger`

Status:
- direct from reward ledger / wallet service

### 3.2 `Tridents`

Visible item:
- `3,800 Tridents`

Definition:
- base in-app currency balance

Measurement:

```text
available_tridents = sum(earn) - sum(redeem) - sum(reserve) + sum(release)
```

Status:
- direct from reward ledger / wallet service

UI rule:
- color the Trident coin in the same orange/gold family as the Trident digits for better wallet consistency

### 3.3 `Trident Credit`

Visible item:
- `$38`

Definition:
- redeemable store value linked to the wallet

Canonical rule chosen for `basic`:

```text
1 G = $10
```

So:

```text
trident_credit_usd = wallet_g * 10
```

Currency-display rule:
- default to USD
- if reliable user locale / currency is available from IP or account settings, display the local-denominator value instead
- use USD as the canonical backend base value and convert only for display

Recommended implementation:
- keep wallet source of truth in:
  - Tridents
  - G
  - USD-equivalent Trident Credit

Display formula:

```text
display_credit = convert_usd_to_user_currency(trident_credit_usd, user_currency)
```

Fallback:
- if user currency is unavailable, show USD

Status:
- direct from wallet service once local-currency display conversion is wired

## 4. Zone Summary Card

## 4.1 `Bits/second cognitive capacity`

Visible item:
- `3 bits/sec`

Definition:
- latest valid CCC throughput estimate from Zone Coach

Exact meaning from the legacy Zone app:
- behavioural throughput estimate
- how much task-relevant information the user can bring under control per unit time in the Zone paradigm
- estimated in bits/second using uncertainty (entropy) and brief exposure-time manipulations

Source references:
- legacy Zone Coach `index.html`
- `COGNITIVE-STATE-PROTOCOL.md`

Basic-app rule:
- use the latest fresh valid Zone check
- if stale, either dim the value or mark it stale

Status:
- direct from legacy Zone classifier/probe output

### 4.2 `In-zone trend` sparkline

Visible graph:
- gold line sparkline

Definition:
- short recent trend of valid Zone throughput readings

Recommended measurement window:
- last 8 valid Zone checks

Value plotted:
- CCC bits/second from each check

Eligibility:
- valid full checks and valid quick re-checks only
- exclude invalid/focus-lost runs

Status:
- direct from Zone history once persisted in `basic`

### 4.3 `In-the-zone consistency per session` state dots

Visible graph:
- colored dots with legend for:
  - `In the zone`
  - `Flat`
  - `Spun out`
  - `Locked in`

Definition:
- recent session-level state classifications used to route training

Recommended measurement window:
- last 7 valid training days / route decisions

Measurement:
- one dot per day or session
- value = final state used for that day’s route

State mapping:
- `in_zone` -> `In the zone`
- `flat` -> `Flat`
- `overloaded_explore` -> `Spun out`
- `overloaded_exploit` -> `Locked in`

Status:
- direct from legacy Zone state classifier plus new Hub history selection

## 5. Capacity Summary Card

## 5.1 `WM capacity gain estimate`

Visible item:
- `2.0 -> 3.0`

Definition:
- baseline vs current estimated working-memory capacity in n-back-equivalent units

This should not be a raw single-session peak.

Recommended session-level estimate:

```text
session_wm_capacity_estimate =
  round_1_decimal((average_session_n_back + stable_level_n_back) / 2)
```

Where:
- `average_session_n_back` = session average across the 10 blocks
- `stable_level_n_back` = highest level satisfying last-3-block consistency

Recommended Hub baseline/current windows:

```text
baseline_capacity =
  mean(first_2_valid_core_sessions.session_wm_capacity_estimate)

current_capacity =
  mean(last_3_valid_core_sessions.session_wm_capacity_estimate)
```

Why this is the right measure:
- it combines the two governing Capacity metrics already defined in the repo:
  - average session n-back
  - last-3-block consistency / stable level

Status:
- new derived metric built from legacy Capacity progression outputs

### 5.2 Baseline vs current comparison bars

Visible graph:
- two horizontal bars:
  - `Baseline`
  - `Current`

Definition:
- visual normalization of `baseline_capacity` and `current_capacity`

Recommended scaling:
- normalize to a fixed 0-4 n-back display range in MVP

Example:

```text
bar_pct = clamp((capacity_estimate / 4.0) * 100, 0, 100)
```

If later needed:
- move to `0-5` once users regularly clear 4-back

Status:
- new derived graph

### 5.3 `Cognitive skill gains from baseline` bars

Visible graph:
- five horizontal skill bars

Visible labels:
- Flexibility
- Binding
- Conflict control
- Affective control
- Relational reasoning

Definition:
- family-progress proxies mapped into the five main skill clusters

Recommended first-pass mapping:
- `Flexibility` = XOR family progress
- `Binding` = AND family progress
- `Conflict control` = Interference family progress
- `Affective control` = Emotional family progress
- `Relational reasoning` = Relational family progress

Recommended family progress formula:

```text
family_progress_pct =
  0.40 * (stabilised_variants / total_variants_in_family)
  + 0.20 * (same_family_swap_holds / expected_swap_holds_in_family)
  + 0.20 * (fast_speed_confirmed_variants / total_variants_in_family)
  + 0.20 * family_mastery_flag
```

Where:
- `family_mastery_flag` = `1` if family mastery achieved, else `0`

Why this is the cleanest Hub version:
- it stays faithful to the family-to-skill mapping in the repo docs
- it avoids exposing coaching-only telemetry like swap cost and lapse burden

Status:
- new derived metric layer for `basic`

### 5.4 `Far Transfer` badge and `Learn more`

Type:
- label / explainer affordance, not a measured variable by itself

Basic-app rule:
- clicking `Learn more` should explain that this card is an estimate built from:
  - Capacity gains
  - cognitive skill progression
  - test change
  - transfer-readiness milestones

Status:
- not telemetry; explanatory UI

## 6. Tests Summary Card

## 6.1 `Psychometric IQ score`

Visible item:
- `100 -> 115`

Definition:
- baseline vs latest `RS-IQ` from the short fluid-reasoning tests

Measurement source:
- legacy `SgS-12A`
- legacy `SgS-12B`

Legacy scoring rule:

```text
raw_score = count(correct_answers)
rs_iq = clamp(round(100 + 15 * ((raw_score - 5.4) / 1.6)), 40, 160)
```

Recommended Hub mapping:
- baseline = first valid `SgS-12A` RS-IQ
- latest = most recent valid `SgS-12B` RS-IQ

Important note:
- this is a non-clinical `Reasoning Snapshot IQ-equivalent`
- the Hub should never imply WAIS-style formal psychometric certification

Status:
- direct from legacy SgS scoring

### 6.2 Mini two-bar graph next to the psychometric score

Visible graph:
- two simple green bars

Definition:
- visual comparison of the same two values used in the `100 -> 115` display

Measurement:
- left bar = baseline `RS-IQ`
- right bar = latest `RS-IQ`

Status:
- direct from the same SgS values

### 6.3 `Applied intelligence scores`

This area contains three separate score lines and three sparklines.

### 6.3.1 `Applied G`

Visible item:
- example `58 -> 66`

Definition:
- normalized score from `Psi-CBS Core - Applied General Intelligence (G)`

Legacy source:
- `Psi-CBS` core total score already exists
- computed from focus and processing items, with reverse scoring where required

Legacy raw output:

```text
core_total = average(all_core_item_scores)    // 1.0 to 5.0
```

Recommended Hub normalization:

```text
applied_g_index = round(((core_total - 1) / 4) * 100)
```

Status:
- direct from legacy core score plus new Hub normalization

### 6.3.2 `Resilience`

Visible item:
- example `61 -> 70`

Definition:
- positive resilience score derived from `Psi-CBS-AD`

Legacy source:
- `Psi-CBS-AD` currently outputs a dysregulation total
- higher raw value means more dysregulation

Recommended Hub inversion:

```text
ad_total = average(all_ad_item_scores)    // 1.0 to 5.0, higher = worse
resilience_index = round(100 - (((ad_total - 1) / 4) * 100))
```

This makes the Hub more intuitive:
- higher score = better resilience

Status:
- new derived index using legacy AD total

### 6.3.3 `AI-IQ`

Visible item:
- example `56 -> 68`

Definition:
- derived AI-use intelligence index from `Psi-CBS-AI`

Current legacy state:
- the legacy AI section stores positive and negative pair scores
- there is no single `AI-IQ` composite already defined in the pulled code

Recommended first-pass `basic` formula:

```text
mean_positive = average(all_positive_ai_items)   // 1.0 to 5.0
mean_negative = average(all_negative_ai_items)   // 1.0 to 5.0
ai_iq_index = round(clamp(50 + 12.5 * (mean_positive - mean_negative), 0, 100))
```

Why:
- equal positive and negative effect -> ~50
- strong positive with low negative drag -> higher score
- strong negative dependence / drag -> lower score

Status:
- new derived composite required in `basic`

### 6.4 Applied intelligence sparklines

Visible graphs:
- one small line chart for each of:
  - Applied G
  - Resilience
  - AI-IQ

Definition:
- recent history trend for each metric

Recommended measurement window:
- last 6 valid saved administrations of that metric

Plot values:
- `applied_g_index`
- `resilience_index`
- `ai_iq_index`

Status:
- direct once normalized/derived scores are stored historically

## 7. Items on the Hub that are not telemetry

These are visible but should not be treated as measured telemetry:

- top navigation
- `Rewards` badge
- `Click on the mission elements to access the tasks`
- IQ Mindware store banner
- shopping cart icon
- `Learn more` button

They are navigation or explanatory UI only.

## 8. What is directly measurable now vs what still needs derivation

### Direct from reused legacy logic

- Zone `bits/second`
- Zone state classification
- SgS raw score and `RS-IQ`
- Psi-CBS core total
- Psi-CBS-AD total
- reward ledger balances once wallet service is wired
- counted core-session progress

### New derived metrics required in `basic`

- recommended mission sequence
- training-rate ring
- recent training-day strip
- WM capacity gain estimate
- normalized baseline/current comparison bars
- skill-gain bars by family / skill cluster
- normalized `Applied G`
- inverted `Resilience`
- composite `AI-IQ`
- all Hub sparklines except the raw Zone throughput trace

## 9. Recommended implementation rule

The Hub should store and compute its telemetry from three sources only:

1. `tests history`
2. `zone history`
3. `capacity session history`

Then derive all Hub summaries from those stored histories, not from transient UI state.

That keeps the screen stable, auditable, and migration-friendly for the later Vite / Vercel / Supabase stack.
