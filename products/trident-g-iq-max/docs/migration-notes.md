# Migration Notes

`trident-g-iq-max` is the superset product in the new sibling line.

Migration intent:

- inherit the boxed shell, telemetry grammar, and router contracts from `trident-g-iq-shared`
- preserve parity with `trident-g-iq-basic` for `hub`, `tests`, `zone`, and `capacity`
- add the broader reasoning and mission layers without creating a second UI language
- source feature scope from `products/trident-g/` and `ground-truth/`, but do not import runtime code directly from either location

When this product moves to Vite, Vercel, and Supabase, the product boundary should remain the same. The tooling changes should wrap this structure, not replace it.
