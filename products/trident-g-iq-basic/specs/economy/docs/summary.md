# Economy Summary

The current user-facing economy uses two units:

- **g plasticity cells** are the whole-number micro reward earned from blocks, modules, and sessions.
- **IQ credits** are the derived macro unit shown in wallets and progress surfaces.
- **100 g plasticity cells = 1 IQ credit**.

All learning surfaces should compute a `Transfer Score` first, then convert that score into g plasticity cells.

## Shared Transfer Score

`Transfer Score = Core Correctness + Complexity Hold + Stability / Efficiency + Portability`

- **Core Correctness:** 0-40
- **Complexity Hold:** 0-20
- **Stability / Efficiency:** 0-20
- **Portability:** 0-20
- Total is clamped to 0-100.

## Capacity Gym

Per block:

`gAward = round(2 + 0.06 * TransferScore + improvementBonus + stretchBonus + cleanHoldBonus)`

- **Improvement bonus:** 0-2 g for beating the rolling recent baseline.
- **Stretch bonus:** 0-2 g for holding after wrapper swap, speed increase, or complexity increase.
- **Clean-hold bonus:** 0-3 g for low lapse/timeout burden, no late collapse, and good re-entry.

## Reasoning Lab

Per module:

`gAward = round(3 + 0.08 * TransferScore + bonuses)`

Reasoning Lab should use the same four Transfer Score buckets but fill them with reasoning-specific measures.

## Puzzle Lab

Per full session:

`gAward = round(10 + 0.20 * TransferScore + bonuses)`

Puzzle Lab should use the same four Transfer Score buckets but fill them with puzzle-specific measures, including survey-to-build coupling and efficient completion.

## Programme Completion

The old visible credit/voucher challenge language is retired. Capacity Gym uses a final coin bonus:

`Programme Completion Score = family coverage 0-40 + efficiency gain 0-30 + far-transfer evidence 0-30`

`programmeBonusG = 20 + round(0.6 * ProgrammeCompletionScore)`
