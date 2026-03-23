-- SEO lane schema (v1)
-- Assumes shared operational tables exist in public schema:
--   missions, runs, events, action_intents
-- No separate seo_missions/seo_runs/action-intent lifecycle tables are created.

create extension if not exists pgcrypto;

create table if not exists public.seo_check_definitions (
  id uuid primary key default gen_random_uuid(),
  check_id text not null unique,
  label text not null,
  pillar text not null,
  weight numeric(8,4) not null check (weight >= 0),
  scope text not null,
  answer_type text not null,
  source_method text not null,
  autonomy_level text not null,
  risk_class text not null,
  pass_rule jsonb not null default '{}'::jsonb,
  evidence_required jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seo_observations (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  mission_id uuid not null,
  run_id uuid not null,
  site_id text not null,
  scope_type text not null,
  scope_key text not null,
  check_id text not null references public.seo_check_definitions(check_id),
  observation_status text not null check (observation_status in ('pass', 'partial', 'fail')),
  raw_value jsonb not null default '{}'::jsonb,
  normalized_score numeric(8,4) not null check (normalized_score >= 0 and normalized_score <= 1),
  confidence numeric(8,4) not null check (confidence >= 0 and confidence <= 1),
  evidence_refs jsonb not null default '[]'::jsonb,
  contract_name text not null,
  contract_version text not null,
  event_id uuid not null,
  idempotency_key text not null,
  risk_level text not null,
  psi_state text not null,
  producer_domain text not null,
  consumer_domain text not null,
  occurred_at timestamptz not null,
  trace_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (workspace_id, run_id, scope_type, scope_key, check_id, idempotency_key)
);

create table if not exists public.seo_scores (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  mission_id uuid not null,
  run_id uuid not null,
  site_id text not null,
  score_scope text not null check (score_scope in ('check', 'pillar', 'page', 'site')),
  score_key text not null,
  pillar text not null,
  weighted_score numeric(8,4) not null check (weighted_score >= 0 and weighted_score <= 1),
  remaining_opportunity numeric(8,4) not null check (remaining_opportunity >= 0 and remaining_opportunity <= 1),
  negative_contribution numeric(10,4) not null default 0,
  confidence numeric(8,4) not null default 1 check (confidence >= 0 and confidence <= 1),
  contract_name text not null,
  contract_version text not null,
  event_id uuid not null,
  idempotency_key text not null,
  risk_level text not null,
  psi_state text not null,
  producer_domain text not null,
  consumer_domain text not null,
  occurred_at timestamptz not null,
  trace_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (workspace_id, run_id, score_scope, score_key, pillar, idempotency_key)
);

create table if not exists public.seo_recommendations (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  mission_id uuid not null,
  run_id uuid not null,
  site_id text not null,
  page_url text not null,
  query text,
  pillar text not null default 'unassigned',
  bucket text not null check (bucket in ('near_win', 'ctr_rescue', 'decay_page', 'hidden_winner')),
  issue_type text not null,
  priority_score numeric(10,4) not null check (priority_score >= 0),
  recommended_action text not null,
  diagnosis_template text,
  confidence numeric(8,4) not null check (confidence >= 0 and confidence <= 1),
  risk_level text not null,
  autonomy_level text not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  contract_name text not null,
  contract_version text not null,
  event_id uuid not null,
  idempotency_key text not null,
  psi_state text not null,
  producer_domain text not null,
  consumer_domain text not null,
  occurred_at timestamptz not null,
  trace_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.seo_tasks_sync (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  mission_id uuid not null,
  run_id uuid not null,
  recommendation_id uuid not null references public.seo_recommendations(id) on delete cascade,
  action_intent_id uuid not null,
  github_project_id text,
  github_item_id text,
  github_issue_number integer,
  sync_status text not null default 'pending' check (sync_status in ('pending', 'created', 'failed', 'closed')),
  sync_error text,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (action_intent_id)
);

create table if not exists public.seo_rechecks (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  mission_id uuid not null,
  run_id uuid not null,
  action_intent_id uuid not null,
  recommendation_id uuid references public.seo_recommendations(id) on delete set null,
  scheduled_for date not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  outcome_status text check (outcome_status in ('validated', 'inconclusive', 'rejected')),
  metric_deltas jsonb not null default '{}'::jsonb,
  contract_name text,
  contract_version text,
  event_id uuid,
  idempotency_key text,
  risk_level text,
  psi_state text,
  producer_domain text,
  consumer_domain text,
  occurred_at timestamptz,
  trace_refs jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (action_intent_id, scheduled_for)
);

create index if not exists seo_observations_run_idx on public.seo_observations(run_id);
create index if not exists seo_observations_workspace_idx on public.seo_observations(workspace_id, mission_id, run_id);
create index if not exists seo_scores_run_idx on public.seo_scores(run_id);
create index if not exists seo_recommendations_run_idx on public.seo_recommendations(run_id);
create index if not exists seo_recommendations_priority_idx on public.seo_recommendations(priority_score desc);
create index if not exists seo_tasks_sync_status_idx on public.seo_tasks_sync(sync_status);
create index if not exists seo_rechecks_schedule_idx on public.seo_rechecks(scheduled_for, status);

-- Optional foreign keys to shared tables when they exist with `id` columns.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='missions' and column_name='id'
  ) then
    begin
      alter table public.seo_observations
        add constraint seo_observations_mission_fk foreign key (mission_id) references public.missions(id);
    exception when duplicate_object then null;
    end;
    begin
      alter table public.seo_scores
        add constraint seo_scores_mission_fk foreign key (mission_id) references public.missions(id);
    exception when duplicate_object then null;
    end;
    begin
      alter table public.seo_recommendations
        add constraint seo_recommendations_mission_fk foreign key (mission_id) references public.missions(id);
    exception when duplicate_object then null;
    end;
    begin
      alter table public.seo_tasks_sync
        add constraint seo_tasks_sync_mission_fk foreign key (mission_id) references public.missions(id);
    exception when duplicate_object then null;
    end;
    begin
      alter table public.seo_rechecks
        add constraint seo_rechecks_mission_fk foreign key (mission_id) references public.missions(id);
    exception when duplicate_object then null;
    end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='runs' and column_name='id'
  ) then
    begin
      alter table public.seo_observations
        add constraint seo_observations_run_fk foreign key (run_id) references public.runs(id);
    exception when duplicate_object then null;
    end;
    begin
      alter table public.seo_scores
        add constraint seo_scores_run_fk foreign key (run_id) references public.runs(id);
    exception when duplicate_object then null;
    end;
    begin
      alter table public.seo_recommendations
        add constraint seo_recommendations_run_fk foreign key (run_id) references public.runs(id);
    exception when duplicate_object then null;
    end;
    begin
      alter table public.seo_tasks_sync
        add constraint seo_tasks_sync_run_fk foreign key (run_id) references public.runs(id);
    exception when duplicate_object then null;
    end;
    begin
      alter table public.seo_rechecks
        add constraint seo_rechecks_run_fk foreign key (run_id) references public.runs(id);
    exception when duplicate_object then null;
    end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='events' and column_name='id'
  ) then
    begin
      alter table public.seo_observations
        add constraint seo_observations_event_fk foreign key (event_id) references public.events(id);
    exception when duplicate_object then null;
    end;
    begin
      alter table public.seo_scores
        add constraint seo_scores_event_fk foreign key (event_id) references public.events(id);
    exception when duplicate_object then null;
    end;
    begin
      alter table public.seo_recommendations
        add constraint seo_recommendations_event_fk foreign key (event_id) references public.events(id);
    exception when duplicate_object then null;
    end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='action_intents' and column_name='id'
  ) then
    begin
      alter table public.seo_tasks_sync
        add constraint seo_tasks_sync_action_intent_fk foreign key (action_intent_id) references public.action_intents(id);
    exception when duplicate_object then null;
    end;
    begin
      alter table public.seo_rechecks
        add constraint seo_rechecks_action_intent_fk foreign key (action_intent_id) references public.action_intents(id);
    exception when duplicate_object then null;
    end;
  end if;
end $$;

create or replace view public.v_seo_pillar_scores as
select
  workspace_id,
  mission_id,
  run_id,
  site_id,
  pillar,
  avg(weighted_score) as pillar_score,
  avg(remaining_opportunity) as pillar_remaining_opportunity,
  count(*) as record_count
from public.seo_scores
where score_scope in ('check', 'pillar', 'page')
group by workspace_id, mission_id, run_id, site_id, pillar;

create or replace view public.v_seo_top_issues as
select
  workspace_id,
  mission_id,
  run_id,
  site_id,
  page_url,
  query,
  bucket,
  issue_type,
  priority_score,
  confidence,
  risk_level,
  recommended_action
from public.seo_recommendations
order by priority_score desc, confidence desc;

create or replace view public.v_seo_treemap as
select
  workspace_id,
  mission_id,
  run_id,
  site_id,
  pillar,
  issue_type,
  sum(priority_score) as opportunity_weight
from public.seo_recommendations
group by workspace_id, mission_id, run_id, site_id, pillar, issue_type;

create or replace view public.v_seo_remaining_opportunity as
select
  workspace_id,
  mission_id,
  run_id,
  site_id,
  avg(weighted_score) as achieved_score,
  avg(remaining_opportunity) as remaining_score
from public.seo_scores
where score_scope='site'
group by workspace_id, mission_id, run_id, site_id;
