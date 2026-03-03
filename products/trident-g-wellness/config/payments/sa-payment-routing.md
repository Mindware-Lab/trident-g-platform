# South Africa Payment Routing Notes

## Objective

Reduce SA buyer friction for both consumer and corporate flows while keeping entitlements server-truth in Kastel Stack.

## Policy

1. Consumer lane can start with global checkout if local rail is unavailable.
2. Corporate lane should prefer local invoicing/merchant path for procurement ease.
3. Every payment outcome must emit idempotent events and entitlement reconciliation checks.

## Event Requirements

Minimum emitted events:

1. `PurchaseVerified.v1`
2. `EntitlementsGranted.v1`
3. `AccessMismatchDetected.v1` (if grant fails or delays)

## Implementation Note

Keep payment rails configurable by lane via a backend mapping table:

- `lane_id`
- `provider`
- `merchant_account`
- `currency`
- `fallback_provider`

