# UI Contract

The shared UI contract for `trident-g-iq-basic` and `trident-g-iq-max` is:

- boxed desktop shell on a light page background
- fixed active-play frame with a top nav, info strip, game window, coach strip, and telemetry rail
- one module accent active at a time
- identical shell sizing between sibling products unless a product-specific override is deliberate

Shared CSS lives in `../ui/`. Product roots may override variables and small layout details, but they should not fork the shell structure.
