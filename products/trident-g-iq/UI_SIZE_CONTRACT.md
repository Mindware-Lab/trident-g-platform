# UI Size Contract (Trident G-IQ)

This is the baseline shell sizing contract for all Trident G-IQ apps.

Use this for:
- current app QA checks
- new app build defaults
- reskin/refactor acceptance checks

## Contract v2

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
- Keep no-scroll behavior.
- Reduce vertical spacing (header/card paddings, nav reserve) so core panel tasks remain fully reachable without clipping.

### 3) Mobile Edge Style
- `border-radius: 0`
- `border: none`

### 4) No-Scroll Rule
- `html, body { height: 100%; overflow: hidden; }`
- App shell and root content must fit the viewport without page scrolling.

## Recommended Layout Contract

- Reserve bottom nav space inside the shell using bottom padding.
- Desktop default reserve target: `~80px`.
- Desktop compact-height reserve target: `~76px`.
- Mobile reserve target: `~92px` (unless app-specific nav is smaller).
- Use panel/card switching for dense content instead of long scroll stacks.
- Keep primary actions visible within the viewport.

## Quick QA Checklist

1. Desktop shell never exceeds `900px` width.
2. Desktop shell keeps full app visible with no page scroll.
3. Desktop compact-height mode triggers at `<= 940px` and preserves task reachability.
4. Mobile shell uses full viewport height (`100dvh`), edge-to-edge.
5. Bottom nav never overlaps critical controls.
6. No vertical scroll is needed to complete core panel actions.

## Optional Console Check

```js
const s = document.querySelector('.gt-shell,.zoneAppShell,.shell,.suite-shell,.cohort-shell,.premium-shell,.app-shell');
console.log(s?.getBoundingClientRect(), window.innerWidth, window.innerHeight);
```
