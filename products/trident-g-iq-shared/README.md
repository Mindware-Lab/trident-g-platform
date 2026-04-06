# Trident-G IQ Shared

Shared shell, runtime helpers, UI primitives, and contracts for the new sibling product line:

- `../trident-g-iq-basic/`
- `../trident-g-iq-max/`

This root is intentionally product-line level, not legacy-suite level. New work for the shared active-play shell should land here instead of under `products/trident-g-iq/apps/`.

## Structure

- `docs/` shared contracts and implementation notes
- `assets/` reusable brand, icon, and audio placeholders
- `ui/` shared CSS layers
- `runtime/` shared JS helpers for shell rendering, routing, navigation, telemetry, and screen registration
