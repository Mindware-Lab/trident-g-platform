# Hub Telemetry Spec

Current user-facing reward telemetry uses the shared two-coin economy:

- **g plasticity cells** are earned as whole-number micro rewards.
- **IQ credits** are derived from wallet totals at `100 g = 1 IQ credit`.

Telemetry and storage identifiers may keep legacy internal names until a later cleanup, but visible UI copy should not expose the retired reward labels.

## Wallet Fields

- `walletG`: total whole-number g plasticity cells.
- `iqCredits`: derived display value, `walletG / 100`.
- `transferScore`: 0-100 score with component fields for correctness, complexity hold, stability/efficiency, and portability.

## User-Facing Display

- Session feed: `+N g plasticity cells`.
- Wallet total: `N g plasticity cells`.
- Macro total: `N.NN IQ credits`.
