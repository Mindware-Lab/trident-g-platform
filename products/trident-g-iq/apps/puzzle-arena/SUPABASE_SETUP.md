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

After the frontend is wired to Supabase reads, add these to Vercel:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

After the Edge Function is added, keep backend secrets in Supabase function secrets, not Vercel browser env:

```text
STRIPE_SECRET_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

For Puzzle Arena leaderboards, Stripe is not needed.

## 5. Quick SQL Smoke Test

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
