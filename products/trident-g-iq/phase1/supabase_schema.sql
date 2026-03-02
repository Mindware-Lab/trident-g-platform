-- Trident G-IQ Phase 1
-- Supabase schema for secure entitlements and append-only events.

create extension if not exists "pgcrypto";

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

create index if not exists entitlements_user_idx on public.entitlements(user_id);
create index if not exists entitlements_status_idx on public.entitlements(status);

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

create index if not exists events_user_idx on public.events(user_id);
create index if not exists events_type_idx on public.events(event_type);
create index if not exists events_created_idx on public.events(created_at desc);

create table if not exists public.stripe_event_log (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  processed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb
);

alter table public.entitlements enable row level security;
alter table public.events enable row level security;

drop policy if exists entitlements_select_own on public.entitlements;
create policy entitlements_select_own
on public.entitlements
for select
using (auth.uid() = user_id);

drop policy if exists events_select_own on public.events;
create policy events_select_own
on public.events
for select
using (auth.uid() = user_id);

drop policy if exists events_insert_own on public.events;
create policy events_insert_own
on public.events
for insert
with check (auth.uid() = user_id);

-- No direct client-side update/delete on append-only events.
revoke update on public.events from anon, authenticated;
revoke delete on public.events from anon, authenticated;

