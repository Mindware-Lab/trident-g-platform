# Screen Shell Contract

Every screen in the new product line should provide:

- `id`
- `module`
- `banner`
- `info`
- `coach`
- `taskHtml`
- `responseHtml`
- `telemetryCards`

The shared shell renders those fields into the fixed frame:

1. top nav
2. info strip
3. boxed game window with colored banner
4. response area inside the window
5. coach strip under the window
6. telemetry rail on the right

`taskHtml` and `responseHtml` are currently allowed to stay as HTML strings for speed. Navigation, banner, coach, and telemetry should stay structured.

Optional:

- `mount({ root, screen, router })`

If present, `mount` is called after the shell renders the screen. It may return a cleanup function, which will be called before the next screen render. Use this for screen-local timers, keyboard handlers, or live DOM updates that do not fit the static screen contract.
