# UI Size Contract (Trident G-IQ)

This is the baseline shell sizing contract for all Trident G-IQ apps.

Use this for:
- current app QA checks
- new app build defaults
- reskin/refactor acceptance checks

## Contract v3

### 1) Breakpoints
- Desktop/laptop: `@media (min-width: 960px)`
- Mobile: `@media (max-width: 520px)`

### 2) Shell Width and Height
- Desktop width: `min(900px, calc(100% - 24px))`
- Desktop height: `calc(100vh - 36px)`
- Mobile width: `100%`
- Mobile height: `100dvh`

### 2.1) Desktop Compact-Height Mode (required)
- Trigger: `@media (max-height: 940px)`
- Shell height: `calc(100vh - 18px)`
- Keep desktop no-scroll behavior.
- Reduce vertical spacing so core actions remain fully reachable without clipping.

### 3) Edge Style
- Mobile shell: `border-radius: 0`, `border: none`
- Desktop shell: rounded corners preserved

### 4) Scroll Behavior (required)
- Page root remains locked: `html, body { height: 100%; overflow: hidden; }`
- Desktop: no in-shell vertical scrolling for core task flows.
- Mobile: allow vertical scrolling in the main content container, with fixed footer nav.

### 4.1) Mobile Scroll Container Contract
- `overflow-y: auto`
- `overflow-x: hidden`
- `-webkit-overflow-scrolling: touch`
- `overscroll-behavior-y: contain`
- bottom reserve padding for fixed nav:
  - `padding-bottom: calc(112px + env(safe-area-inset-bottom))` minimum
  - increase to `calc(140px + env(safe-area-inset-bottom))` when forms/actions near footer get occluded
- `scroll-padding-bottom: calc(124px + env(safe-area-inset-bottom))` recommended

### 4.2) Fixed Footer Contract
- Footer nav must remain tappable above content:
  - `position: fixed; left: 0; right: 0; bottom: 0;`
  - `z-index` above content layers
- Bottom nav must never occlude primary action buttons at rest.

## Quick QA Checklist

1. Desktop shell never exceeds `900px` width.
2. Desktop shell stays within the monitor viewport and preserves no-scroll core flows.
3. Desktop compact-height mode triggers at `<= 940px` and keeps actions reachable.
4. Mobile shell is edge-to-edge and uses full viewport height (`100dvh`).
5. Mobile content scrolls when needed; fixed footer remains tappable.
6. No snap-back behavior after release on scroll gestures.
7. Primary action buttons remain reachable above footer reserve.

## Optional Console Check

```js
const s = document.querySelector('.gt-shell,.zoneAppShell,.shell,.suite-shell,.cohort-shell,.premium-shell,.app-shell');
console.log(s?.getBoundingClientRect(), window.innerWidth, window.innerHeight);
```
