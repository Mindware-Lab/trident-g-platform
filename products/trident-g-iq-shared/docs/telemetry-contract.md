# Telemetry Contract

Telemetry cards are shared-runtime rendered objects with a `type` and a consistent presentation contract:

- `label`
- primary value or state
- optional subline
- optional primitive such as ring, bar, badge, list, sparkline, routing card, or streak strip

Supported card types in the shared runtime:

- `metric`
- `splitMetric`
- `barMetric`
- `ring`
- `list`
- `badge`
- `signalProfile`
- `routing`
- `sparkline`
- `streak`

This keeps telemetry structure portable between `basic` and `max` without forcing identical copy.
