# Active-Play Mockup UI

This folder is the working location for the unfinished active-play mockup UI in `trident-g-iq-basic`.

Current live mockup routes:

- `http://127.0.0.1:4173/#tests`
- `http://127.0.0.1:4173/#zone`
- `http://127.0.0.1:4173/#capacity`

Purpose:

- keep the in-progress active-play UI work inside the `trident-g-iq-basic` product
- separate unfinished mockup tuning from the stable shared shell contracts
- give the current design iteration a clear home while the screens are still changing

Ownership split:

- `products/trident-g-iq-shared/ui/`
  - stable shared shell primitives, tokens, and reusable runtime-facing styles
- `products/trident-g-iq-basic/mockups/active-play/styles.css`
  - current active-play mockup tuning for the basic product routes

These screens are not final. Once the active-play UI stabilizes, the reusable parts can be promoted into `trident-g-iq-shared`.
