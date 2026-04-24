-- Update leaderboard RPC for random per-run puzzle seeds.
-- Passing null for p_puzzle_seed aggregates all valid attempts for the game/window.

create or replace function public.get_leaderboard(
  p_game_slug text,
  p_puzzle_seed text default null,
  p_window text default 'daily',
  p_limit integer default 20
)
returns table (
  rank bigint,
  id uuid,
  game_slug text,
  puzzle_seed text,
  nickname text,
  total_score integer,
  survey_score integer,
  build_score integer,
  build_seconds integer,
  probe_count integer,
  faults_correct integer,
  faults_total integer,
  created_at timestamptz
)
language sql
stable
as $$
  with filtered as (
    select *
    from public.score_attempts
    where is_valid = true
      and game_slug = p_game_slug
      and (p_puzzle_seed is null or puzzle_seed = p_puzzle_seed)
      and (
        p_window = 'all-time'
        or (p_window = 'daily' and submitted_day_utc = ((now() at time zone 'utc')::date))
        or (p_window = 'weekly' and submitted_week_utc = ((date_trunc('week', now() at time zone 'utc'))::date))
      )
  ),
  best_per_name as (
    select
      filtered.*,
      row_number() over (
        partition by nickname_key
        order by
          total_score desc,
          coalesce(faults_correct, 0) desc,
          coalesce(probe_count, 999999) asc,
          build_seconds asc,
          created_at asc
      ) as per_name_rank
    from filtered
  ),
  ranked as (
    select
      row_number() over (
        order by
          total_score desc,
          coalesce(faults_correct, 0) desc,
          coalesce(probe_count, 999999) asc,
          build_seconds asc,
          created_at asc
      ) as rank,
      id,
      game_slug,
      puzzle_seed,
      nickname,
      total_score,
      survey_score,
      build_score,
      build_seconds,
      probe_count,
      faults_correct,
      faults_total,
      created_at
    from best_per_name
    where per_name_rank = 1
  )
  select *
  from ranked
  order by rank
  limit least(greatest(p_limit, 1), 100);
$$;
