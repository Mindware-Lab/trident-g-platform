# IQMindware Puzzle Arena Build Plan

## Goal

Ship IQMindware Puzzle Arena as a free public puzzle hook for Trident G IQ / IQMindware, with short shareable games, daily leaderboards, Discord/community links, and product CTAs back to IQMindware.

The current first release contains:

- Towers 4x4 Speed Run
- Hidden Foundations 4x4

The intended future cadence is one new puzzle, puzzle variant, or daily challenge format per week.

## Current Local App

Location:

`products/trident-g-iq/apps/puzzle-arena`

Current stack:

- Vite
- TypeScript
- CSS
- localStorage mock leaderboard
- no production backend yet

Build check:

```bash
npm run build
```

## Vercel Deployment Plan

Create a Vercel project connected to the GitHub repo.

Recommended settings:

- Framework preset: Vite
- Root directory: `products/trident-g-iq/apps/puzzle-arena`
- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`

Suggested domain:

- `puzzles.iqmindware.com`

Vercel should handle:

- production deployments from `main`
- preview deployments from feature branches / PRs
- environment variables for Supabase frontend config

## Supabase Backend Plan

Create a Supabase project, probably named:

`iqmindware-puzzle-arena`

Supabase will provide:

- Postgres leaderboard storage
- fixed daily puzzle seeds
- server-side score validation
- attempt history for anti-cheat review
- read APIs for daily, weekly, and all-time leaderboard windows

## Environment Variables

Frontend-safe Vite variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Backend-only Supabase function secrets:

```bash
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose the service role key in browser code.

## Suggested Database Tables

### puzzle_seeds

Stores fixed daily/weekly puzzle seeds.

Suggested columns:

- `id`
- `game_slug`
- `seed`
- `challenge_date_utc`
- `window_type`
- `created_at`
- `puzzle_descriptor`

### score_attempts

Stores every submitted attempt, not just leaderboard winners.

Suggested columns:

- `id`
- `game_slug`
- `puzzle_seed`
- `nickname`
- `score_total`
- `score_survey`
- `score_build`
- `elapsed_seconds`
- `probe_count`
- `faults_correct`
- `faults_total`
- `raw_payload`
- `validation_version`
- `is_valid`
- `rejection_reason`
- `created_at`

Leaderboard queries should display the best valid attempt per nickname, game, seed, and window.

## Row Level Security

Enable RLS on public tables.

Initial policy shape:

- public can read valid leaderboard rows
- browser clients cannot directly insert leaderboard scores
- score insertion happens through a Supabase Edge Function
- service role key is used only inside backend/server-side code

## Edge Function Plan

Create a Supabase Edge Function:

`submit-score`

Responsibilities:

- accept submitted game result
- validate payload shape
- validate puzzle seed
- recompute score server-side
- reject impossible times/scores/probe counts
- insert the attempt
- return accepted score and current rank if practical

## Score Validation Constants

Use shared/tunable constants.

Game 1, Towers 4x4 Speed Run:

- minimum accepted build time: `5s`
- accepted max score: `975`
- score formula: `1000 - timePenalty`
- after 60 seconds, per-second penalty doubles

Game 2, Hidden Foundations 4x4:

- 2 hidden faults
- minimum accepted probe count for 2/2 faults: `3`
- minimum accepted build time: `8s`
- max survey score: `740`
- max build score: `968`
- accepted max total score: `1708`

## Leaderboard Windows

Default public tab:

- daily

Also support:

- weekly
- all-time

Use UTC only.

Weekly convention:

- Monday 00:00 UTC

Tie breakers:

- Game 1: higher score, then faster time, then earlier submission
- Game 2: higher total, then higher fault accuracy, then fewer probes, then faster build time, then earlier submission

## Frontend Integration Plan

Replace localStorage leaderboard with Supabase-backed reads/writes:

- read leaderboard rows from Supabase
- submit results through `submit-score`
- keep localStorage fallback only for development when env vars are missing
- highlight the player's submitted row
- preserve daily/weekly/all-time tabs

## Product Hook Plan

Keep the first screen playable, not a landing page.

Use lightweight CTAs:

- Visit IQMindware
- Join Discord
- share finish screen / score

Primary links:

- IQMindware: `https://www.iqmindware.com/`
- Discord: `https://discord.gg/mY84deEdAC`

## Source Credit

The Towers and Black Box rule logic is adapted from Simon Tatham's Portable Puzzle Collection, MIT licensed:

https://github.com/ghewgill/puzzles

The Puzzle Arena game wrapper, scoring, styling, leaderboard model, and Hidden Foundations hybrid mechanics are custom IQMindware work.
