-- IQMindware Puzzle Arena leaderboard schema.
-- Run this in the Supabase SQL Editor for the target project.

create extension if not exists pgcrypto;

create table if not exists public.puzzle_seeds (
  id uuid primary key default gen_random_uuid(),
  game_slug text not null check (game_slug in ('towers-speed-run', 'hidden-foundations')),
  puzzle_seed text not null,
  challenge_date_utc date not null,
  puzzle_descriptor jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (game_slug, challenge_date_utc)
);

create table if not exists public.score_attempts (
  id uuid primary key default gen_random_uuid(),
  game_slug text not null check (game_slug in ('towers-speed-run', 'hidden-foundations')),
  puzzle_seed text not null,
  nickname text not null check (nickname ~ '^[A-Za-z0-9 _-]{2,20}$'),
  nickname_key text generated always as (lower(btrim(nickname))) stored,
  total_score integer not null check (total_score >= 0 and total_score <= 1708),
  survey_score integer check (survey_score is null or (survey_score >= 0 and survey_score <= 740)),
  build_score integer check (build_score is null or (build_score >= 0 and build_score <= 1000)),
  build_seconds integer not null check (build_seconds >= 5 and build_seconds <= 900),
  probe_count integer check (probe_count is null or (probe_count >= 0 and probe_count <= 64)),
  faults_correct integer check (faults_correct is null or (faults_correct >= 0 and faults_correct <= 2)),
  faults_total integer check (faults_total is null or faults_total = 2),
  raw_payload jsonb not null default '{}'::jsonb,
  validation_version text not null default 'local-v1',
  is_valid boolean not null default true,
  rejection_reason text,
  submitted_day_utc date not null default ((now() at time zone 'utc')::date),
  submitted_week_utc date not null default ((date_trunc('week', now() at time zone 'utc'))::date),
  created_at timestamptz not null default now()
);

create index if not exists score_attempts_lookup_idx
  on public.score_attempts (game_slug, puzzle_seed, is_valid, submitted_day_utc, submitted_week_utc);

create index if not exists score_attempts_rank_idx
  on public.score_attempts (game_slug, puzzle_seed, total_score desc, build_seconds asc, created_at asc);

alter table public.puzzle_seeds enable row level security;
alter table public.score_attempts enable row level security;

drop policy if exists "Public can read puzzle seeds" on public.puzzle_seeds;
create policy "Public can read puzzle seeds"
  on public.puzzle_seeds
  for select
  using (true);

drop policy if exists "Public can read valid score attempts" on public.score_attempts;
create policy "Public can read valid score attempts"
  on public.score_attempts
  for select
  using (is_valid = true);

-- Do not add a public insert policy.
-- Score insertion should happen through a Supabase Edge Function using server-side validation.

create or replace function public.get_leaderboard(
  p_game_slug text,
  p_puzzle_seed text,
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
      and puzzle_seed = p_puzzle_seed
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
