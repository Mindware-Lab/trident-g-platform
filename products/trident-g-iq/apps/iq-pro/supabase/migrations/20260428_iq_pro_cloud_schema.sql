-- Trident G IQ Pro cloud app schema.
-- Run in the target Supabase project before enabling Cloudflare API endpoints.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 40),
  leaderboard_opt_in boolean not null default false,
  privacy_region text not null default 'eu_uk',
  export_requested_at timestamptz,
  delete_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bundle_id text not null,
  status text not null check (status in ('active', 'inactive', 'revoked')),
  source text not null default 'stripe_webhook',
  stripe_customer_id text,
  stripe_subscription_id text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, bundle_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  app_id text,
  bundle_id text,
  source text not null default 'client',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.sync_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  domain text not null check (domain in ('capacity', 'zone', 'tracker', 'reasoning', 'economy', 'coach', 'activeModule')),
  storage_key text not null,
  payload jsonb not null default '{}'::jsonb,
  local_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, device_id, domain)
);

create table if not exists public.zone_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_id text not null,
  occurred_at timestamptz not null,
  state text,
  confidence text,
  valid boolean not null default false,
  summary jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create table if not exists public.capacity_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_id text not null,
  occurred_at timestamptz not null,
  mode text,
  summary jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create table if not exists public.reasoning_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_id text not null,
  occurred_at timestamptz not null,
  family text,
  route_class text,
  summary jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_id text not null,
  occurred_at timestamptz not null,
  test_id text,
  summary jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, external_id)
);

create table if not exists public.leaderboard_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  score_kind text not null,
  score_value numeric not null,
  period_start date,
  is_public boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_event_log (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

create index if not exists entitlements_user_idx on public.entitlements(user_id);
create index if not exists entitlements_status_idx on public.entitlements(status);
create index if not exists events_user_created_idx on public.events(user_id, created_at desc);
create index if not exists events_type_idx on public.events(event_type);
create index if not exists sync_snapshots_user_updated_idx on public.sync_snapshots(user_id, updated_at desc);
create index if not exists zone_runs_user_occurred_idx on public.zone_runs(user_id, occurred_at desc);
create index if not exists capacity_sessions_user_occurred_idx on public.capacity_sessions(user_id, occurred_at desc);
create index if not exists reasoning_sessions_user_occurred_idx on public.reasoning_sessions(user_id, occurred_at desc);
create index if not exists test_results_user_occurred_idx on public.test_results(user_id, occurred_at desc);
create index if not exists leaderboard_public_rank_idx on public.leaderboard_scores(is_public, score_kind, period_start, score_value desc);

alter table public.profiles enable row level security;
alter table public.entitlements enable row level security;
alter table public.events enable row level security;
alter table public.sync_snapshots enable row level security;
alter table public.zone_runs enable row level security;
alter table public.capacity_sessions enable row level security;
alter table public.reasoning_sessions enable row level security;
alter table public.test_results enable row level security;
alter table public.leaderboard_scores enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists entitlements_select_own on public.entitlements;
create policy entitlements_select_own on public.entitlements
for select using (auth.uid() = user_id);

drop policy if exists events_select_own on public.events;
create policy events_select_own on public.events
for select using (auth.uid() = user_id);

drop policy if exists events_insert_own on public.events;
create policy events_insert_own on public.events
for insert with check (auth.uid() = user_id);

drop policy if exists sync_snapshots_own on public.sync_snapshots;
create policy sync_snapshots_own on public.sync_snapshots
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists zone_runs_own on public.zone_runs;
create policy zone_runs_own on public.zone_runs
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists capacity_sessions_own on public.capacity_sessions;
create policy capacity_sessions_own on public.capacity_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists reasoning_sessions_own on public.reasoning_sessions;
create policy reasoning_sessions_own on public.reasoning_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists test_results_own on public.test_results;
create policy test_results_own on public.test_results
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists leaderboard_select_public on public.leaderboard_scores;
create policy leaderboard_select_public on public.leaderboard_scores
for select using (is_public = true);

drop policy if exists leaderboard_manage_own on public.leaderboard_scores;
create policy leaderboard_manage_own on public.leaderboard_scores
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke update on public.events from anon, authenticated;
revoke delete on public.events from anon, authenticated;
