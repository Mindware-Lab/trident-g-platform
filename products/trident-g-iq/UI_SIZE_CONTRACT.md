# UI Size Contract (Trident G-IQ)

This is the baseline shell sizing contract for all Trident G-IQ apps.

Use this for:
- current app QA checks
- new app build defaults
- reskin/refactor acceptance checks

## Contract v1

### 1) Breakpoints
- Desktop/laptop: `@media (min-width: 960px)`
- Mobile: `@media (max-width: 520px)`

### 2) Shell Width and Height
- Desktop width: `min(900px, calc(100% - 24px))`
- Desktop height: `calc(100vh - 36px)`
- Mobile width: `100%`
- Mobile height: `100dvh`

### 3) Mobile Edge Style
- `border-radius: 0`
- `border: none`

### 4) No-Scroll Rule
- `html, body { height: 100%; overflow: hidden; }`
- App shell and root content must fit the viewport without page scrolling.

## Recommended Layout Contract

- Reserve bottom nav space inside the shell using bottom padding (for example `~92px`).
- Use panel/card switching for dense content instead of long scroll stacks.
- Keep primary actions visible within the viewport.

## Quick QA Checklist

1. Desktop shell never exceeds `900px` width.
2. Desktop shell keeps full app visible with no page scroll.
3. Mobile shell uses full viewport height (`100dvh`), edge-to-edge.
4. Bottom nav never overlaps critical controls.
5. No vertical scroll is needed to complete core panel actions.

## Optional Console Check

```js
const s = document.querySelector('.gt-shell,.zoneAppShell,.shell,.suite-shell,.cohort-shell,.premium-shell,.app-shell');
console.log(s?.getBoundingClientRect(), window.innerWidth, window.innerHeight);
```

