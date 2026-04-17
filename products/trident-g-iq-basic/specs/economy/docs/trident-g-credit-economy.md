# g Plasticity Cells and IQ Credits Economy

This document supersedes the previous reward wording. User-facing surfaces should use **g plasticity cells** and **IQ credits**.

## Units

- **g plasticity cells**: whole-number micro rewards earned from blocks, modules, and sessions.
- **IQ credits**: derived macro progress unit.
- **100 g plasticity cells = 1 IQ credit**.

The app should store whole-number g plasticity cells and derive IQ credits from the wallet total. Do not show USD-equivalent credit or coaching-voucher language in the product.

## Shared Scoring Flow

Every mode computes a Transfer Score first:

`Transfer Score = Core Correctness + Complexity Hold + Stability / Efficiency + Portability`

- Core Correctness: 0-40
- Complexity Hold: 0-20
- Stability / Efficiency: 0-20
- Portability: 0-20

Then each mode converts the Transfer Score into g plasticity cells.

## Mode Conversion

- Capacity Gym block: `round(2 + 0.06 * TransferScore + bonuses)`
- Reasoning Lab module: `round(3 + 0.08 * TransferScore + bonuses)`
- Puzzle Lab session: `round(10 + 0.20 * TransferScore + bonuses)`

Shared bonuses stay small:

- Improvement bonus: 0-2 g.
- Stretch bonus: 0-2 g.
- Clean-hold bonus: 0-3 g.

## Capacity Gym Programme Bonus

At programme completion:

`Programme Completion Score = family coverage 0-40 + efficiency gain 0-30 + far-transfer evidence 0-30`

`programmeBonusG = 20 + round(0.6 * ProgrammeCompletionScore)`

This replaces the old visible completion reward language.
