
# Coach-Led Capacity Gym Transfer Protocols

This document describes how Coach-led Capacity Gym progression works in the current shipped code over the 20-session programme. It is based on the implementation in `capacity-gym/app.js` and `capacity-gym/runtime/hub-engine.js`.

## High-Level Rule

Coach-led Capacity Gym is a 20 core-session programme, but a "core session" is not counted complete when Capacity blocks alone are finished. The app creates a unified coach contract with:

- Capacity target blocks
- Reasoning target items
- Session number
- Capacity family
- Reasoning family
- Whether the session counts toward the core 20

The 20-session counter advances only when both Capacity and Reasoning targets are complete.

## Session Contract

A fresh valid Zone Check, or "skip zone pulse", creates the session contract.

The current route targets are:

| Zone state | Route | Capacity | Reasoning | Counts toward 20 |
|---|---:|---:|---:|---|
| `in_zone` | core | 10 blocks | 10 items | yes |
| `flat` | core | 5 blocks | 8 items | yes |
| `overloaded_exploit` / Locked In | support | 4 blocks | 4 items | no |
| `overloaded_explore` / Spun Out | support | 3 blocks | 4 items | no |
| `invalid` | recovery | 0 | 0 | no |

Over the 20-session programme, only `in_zone` and `flat` routes advance the core session count. Support routes are real coach-led training, but they do not move the 20-session programme forward.

## 20-Session Family Cycle

For core sessions, the Capacity family is chosen from this cycle:

```js
["flex", "bind", "relate", "resist", "flex", "relate", "bind", "resist", "relate"]
```

That 9-session cycle repeats across 20 sessions:

| Session | Phase | Family |
|---:|---|---|
| 1 | Foundation | Flex |
| 2 | Foundation | Bind |
| 3 | Foundation | Relate |
| 4 | Foundation | Resist |
| 5 | Foundation | Flex |
| 6 | Portability | Relate |
| 7 | Portability | Bind |
| 8 | Portability | Resist |
| 9 | Portability | Relate |
| 10 | Portability | Flex |
| 11 | Integration | Bind |
| 12 | Integration | Relate |
| 13 | Integration | Resist |
| 14 | Integration | Flex |
| 15 | Integration | Relate |
| 16 | Transfer | Bind |
| 17 | Transfer | Resist |
| 18 | Transfer | Relate |
| 19 | Transfer | Flex |
| 20 | Transfer | Bind |

The phase labels are:

- Sessions 1-5: Foundation
- Sessions 6-10: Portability
- Sessions 11-15: Integration
- Sessions 16-20: Transfer

## Capacity Families And Wrappers

The family-to-wrapper mapping is:

- `flex`: `hub_cat`, `hub_noncat`, `hub_concept`
- `bind`: `and_cat`, `and_noncat`
- `resist`: `resist_vectors`, `resist_words`, `resist_concept`
- `relate`: `relate_vectors`, `relate_numbers`, `relate_vectors_dual`, `relate_numbers_dual`

The `emotion` family exists in code, but it is not part of the current 20-session coach cycle.

For non-relate families, the next wrapper is selected by counting completed core blocks in that family and taking modulo the wrapper list. This means the wrapper sequence is continuous across the user's history, not reset cleanly at each session.

For `relate`, the coach uses a ladder:

1. Stabilise `relate_vectors` relation target and symbol target.
2. Stabilise `relate_numbers` relation target and symbol target.
3. Move to `relate_vectors_dual`.
4. Move to `relate_numbers_dual`.

A wrapper/target is considered stable when the last 3 matching entries are all at least 75% accurate and end at `N >= 2`.

## Target Selection

Within a wrapper, the coach cycles the target modality.

Examples:

- Flex wrappers use `loc`, `col`, `sym`.
- Bind wrappers use paired targets like `loc_sym`, `loc_col`, `sym_col`.
- Resist wrappers use their available target dimensions.
- Relate mono wrappers use `rel` and `sym`.
- Relate dual wrappers use `dual`.

The target picker looks at the latest completed block for that wrapper and advances to the next target option.

## N-Back Progression

Capacity Gym uses `HUB_N_MAX = 7`.

For core coach sessions:

- If this is the first block of the active session, N starts from prior history for that wrapper, or `N-1` if there is no history.
- Once a coached session is active, N carries forward from the latest completed block in that same session.
- That means N continues across wrapper and target changes inside the session.

For support routes, N is forced to `N-1`.

After each block, N changes by at most one level:

- Accuracy `>= 90%`: `N + 1`
- Accuracy `< 75%`: `N - 1`
- Otherwise: hold N

For standard single-target blocks, this is implemented by `summarizeHubBlock`.

For dual relate blocks, the rule is stricter:

- UP requires relation accuracy `>= 80%`, surface/symbol accuracy `>= 80%`, and average accuracy `>= 90%`.
- DOWN if either stream is `< 75%`, or average accuracy is `< 75%`.

## Speed Progression

Speed is selected per wrapper, not globally.

For core routes:

- Default is slow.
- If the recent history for that wrapper has at least 2 blocks, and all recent checked blocks are `>= 90%` accurate and ended at `N >= 2`, speed becomes fast.
- Otherwise speed remains slow.

For support routes, speed is always slow.

## What Happens When A Capacity Block Finishes

When a block finishes:

1. The block is summarized by `summarizeHubBlock`.
2. The block result is stored in `state.history`.
3. The recommended next N is stored as `recommendedN`.
4. If this is an active coached Capacity session, `capacityCompletedBlocks` is incremented on the unified coach contract.
5. The local Capacity session's `blocksCompleted` is incremented.
6. If all planned Capacity blocks are complete, the Capacity session is closed.
7. If Reasoning remains, the UI directs the user to Reasoning Gym.
8. The 20-session counter does not advance until Reasoning is complete too.

## Important User-Facing Consequence

If a customer completes all Capacity blocks but does not complete the Reasoning target, the app will still show the same core session number. That is intentional in the current code: the unified session is not complete until both parts are done.

The correct customer explanation is:

> In Coach-led mode, a session consists of Capacity Gym plus Reasoning Gym. Capacity block progress should advance continuously within the session, and N-back should carry forward block to block. The programme session count advances only after both Capacity and Reasoning targets are complete.

## Current Code Caveats

- The coach does not precompute a fixed 10-block schedule. It selects the next Capacity block at start time from current history.
- Wrapper progression uses lifetime/core history for that family, so a session may start at a different wrapper depending on prior play.
- The phase labels are stored and displayed, but they do not currently change the selection algorithm directly.
- The older design docs talk about richer Spike-Tune rules, recovery blocks, perturbation windows, and consolidation sessions. The shipped Capacity Gym code currently uses the simpler wrapper/target/N/speed rules described above.
