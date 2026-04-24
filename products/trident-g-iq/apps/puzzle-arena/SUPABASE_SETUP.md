# Supabase Leaderboard Setup

This is the first backend step for IQMindware Puzzle Arena leaderboards.

## 1. Run The Schema

In Supabase:

1. Open the `HRP Lab / IQ Mindware` project.
2. Go to `SQL Editor`.
3. Open this repo file:

   `products/trident-g-iq/apps/puzzle-arena/supabase/migrations/20260424_0001_leaderboard_schema.sql`

4. Paste the SQL into Supabase.
5. Click `Run`.

This creates:

- `puzzle_seeds`
- `score_attempts`
- RLS read policies
- `get_leaderboard(...)` RPC function

Then run:

`products/trident-g-iq/apps/puzzle-arena/supabase/migrations/20260424_0002_leaderboard_all_random_runs.sql`

This updates `get_leaderboard(...)` so the app can use random per-run puzzle seeds while still showing a daily/weekly leaderboard across all runs.

Public clients can read valid leaderboard rows, but they cannot insert scores directly.

## 2. What This Enables

The frontend will later call:

```ts
supabase.rpc("get_leaderboard", {
  p_game_slug: "towers-speed-run",
  p_puzzle_seed: "towers-speed-run:2026-04-24",
  p_window: "daily",
  p_limit: 20,
});
```

Supported windows:

- `daily`
- `weekly`
- `all-time`

The RPC returns the best valid attempt per nickname for the selected game, seed, and window.

## 3. Why There Is No Public Insert Policy

Score submissions must go through a server-side function.

The next backend step is a Supabase Edge Function named:

`submit-score`

That function will:

- verify the submitted payload
- recompute score server-side
- reject impossible scores
- insert into `score_attempts`

The browser should never directly insert scores into `score_attempts`.

## 4. Vercel Environment Variables Later

The frontend is wired to Supabase reads and score submission. Add these to Vercel:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Find them in Supabase:

`Project Settings` -> `Data API`

Use:

- Project URL
- anon public key

Keep backend secrets in Supabase function secrets, not Vercel browser env:

```text
SUPABASE_SERVICE_ROLE_KEY=
```

For Puzzle Arena leaderboards, Stripe is not needed.

## 5. Deploy The Edge Function

The secure score write endpoint lives here:

`supabase/functions/submit-score/index.ts`

It recomputes scores server-side and inserts into `score_attempts`.

Recommended deploy path:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy submit-score --no-verify-jwt
```

The project ref is visible in the Supabase project URL and settings.

If needed, set the service role secret explicitly:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Supabase usually provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` automatically inside Edge Functions, but confirm in your function settings if deployment fails.

## 6. Quick SQL Smoke Test

After running the migration, this should return an empty result, not an error:

```sql
select *
from public.get_leaderboard(
  'towers-speed-run',
  'towers-speed-run:2026-04-24',
  'daily',
  20
);
```

## 7. Frontend Behavior

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are absent, the app keeps using the localStorage mock leaderboard.

If both variables are present:

- leaderboard tabs read from `get_leaderboard(...)`
- score submission calls the `submit-score` Edge Function
- if the Edge Function is not deployed yet, nickname submission will show a submission error
