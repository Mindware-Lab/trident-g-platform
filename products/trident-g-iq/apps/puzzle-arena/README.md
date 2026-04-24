# IQMindware Puzzle Arena

Free public puzzle hooks for IQMindware / Trident G IQ.

This app is intended to host short, shareable cognitive puzzle challenges, with new puzzles or variants released regularly. The current first release contains:

- Towers 4x4 Speed Run
- Hidden Foundations 4x4

## Deployment

Recommended Vercel project settings:

- Root directory: `products/trident-g-iq/apps/puzzle-arena`
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

## Planned backend

Supabase will provide:

- daily, weekly, and all-time leaderboards
- fixed daily puzzle seeds
- server-side score validation
- attempt storage for anti-cheat review

## Weekly puzzle structure

Add new puzzle logic under `src/puzzles/`, then expose it through the main game registry/UI. Each puzzle should define:

- puzzle slug
- display title
- seed/date behavior
- score calculation inputs
- leaderboard columns
- instructions text

## Source credit

The Towers and Black Box rule logic is adapted from Simon Tatham's Portable Puzzle Collection, MIT licensed:

https://github.com/ghewgill/puzzles
