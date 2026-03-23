-- CRM lane schema (v1)
-- Shared platform tables reused:
--   missions, runs, events, action_intents
-- No parallel crm_missions/crm_runs/crm_intents tables are created.

create extension if not exists pgcrypto;

create table if not exists public.crm_source_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  mission_id uuid not null,
  run_id uuid not null,
  source_system text not null,
  source_record_id text not null,
  record_type text not null,
  email_raw text,
  payload_json jsonb not null default '{}'::jsonb,
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
  unique (workspace_id, run_id, source_system, source_record_id, idempotency_key)
);

create table if not exists public.crm_identity_resolution (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  mission_id uuid not null,
  run_id uuid not null,
  customer_key uuid not null,
  primary_email_normalized text not null,
  source_system text not null,
  source_record_id text not null,
  resolution_action text not null,
  resolution_rule text not null,
  confidence numeric(8,4) not null check (confidence >= 0 and confidence <= 1),
  review_required boolean not null default false,
  conflict_reason text,
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
  unique (workspace_id, run_id, source_system, source_record_id, idempotency_key)
);

create table if not exists public.crm_profile_projection (
  customer_key uuid not null,
  workspace_id text not null,
  mission_id uuid not null,
  run_id uuid not null,
  primary_email_normalized text not null,
  first_name text,
  last_name text,
  source_flags_json jsonb not null default '{}'::jsonb,
  external_keys_json jsonb not null default '{}'::jsonb,
  total_spend numeric(12,2) not null default 0,
  purchase_count integer not null default 0,
  first_purchase_at timestamptz,
  last_purchase_at timestamptz,
  entitlement_summary_json jsonb not null default '{}'::jsonb,
  last_activation_at timestamptz,
  last_progress_at timestamptz,
  substack_engagement_score numeric(8,4),
  lifecycle_state_projection text not null,
  review_required boolean not null default false,
  provenance_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (customer_key, workspace_id)
);

create table if not exists public.crm_marketing_eligibility (
  customer_key uuid not null,
  workspace_id text not null,
  mission_id uuid not null,
  run_id uuid not null,
  consent_state text not null,
  consent_basis text,
  consent_source text,
  consent_captured_at timestamptz,
  opt_out_offered_at_collection timestamptz,
  last_unsubscribed_at timestamptz,
  bounce_state text,
  complaint_state text,
  marketing_eligibility text not null check (marketing_eligibility in ('eligible','suppressed_unsubscribed','suppressed_bounced','suppressed_complaint','review_required','transactional_only')),
  eligibility_reason text not null,
  brevo_contact_id text,
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
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (customer_key, workspace_id)
);

create table if not exists public.crm_engagement_scores (
  id uuid primary key default gen_random_uuid(),
  customer_key uuid not null,
  workspace_id text not null,
  mission_id uuid not null,
  run_id uuid not null,
  score_type text not null,
  score_value numeric(10,4) not null,
  score_inputs_json jsonb not null default '{}'::jsonb,
  backend text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, customer_key, run_id, score_type)
);

create table if not exists public.crm_segment_projection (
  id uuid primary key default gen_random_uuid(),
  customer_key uuid not null,
  workspace_id text not null,
  mission_id uuid not null,
  run_id uuid not null,
  segment_key text not null,
  segment_version text not null,
  source text not null,
  active boolean not null default true,
  reason_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, customer_key, segment_key, segment_version, run_id)
);

create table if not exists public.crm_dispatch_observations (
  id uuid primary key default gen_random_uuid(),
  customer_key uuid,
  workspace_id text not null,
  mission_id uuid,
  run_id uuid,
  brevo_message_id text not null,
  dispatch_type text not null,
  campaign_key text,
  sequence_key text,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  unsubscribed_at timestamptz,
  bounced_at timestamptz,
  complaint_at timestamptz,
  payload_json jsonb not null default '{}'::jsonb,
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
  created_at timestamptz not null default now(),
  unique (workspace_id, brevo_message_id)
);

create table if not exists public.crm_conversion_observations (
  id uuid primary key default gen_random_uuid(),
  customer_key uuid,
  workspace_id text not null,
  mission_id uuid,
  run_id uuid,
  conversion_type text not null,
  source_system text not null,
  observed_at timestamptz not null,
  payload_json jsonb not null default '{}'::jsonb,
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
  created_at timestamptz not null default now()
);

create table if not exists public.crm_rechecks (
  id uuid primary key default gen_random_uuid(),
  customer_key uuid,
  workspace_id text not null,
  mission_id uuid not null,
  run_id uuid not null,
  related_intent_id uuid,
  related_dispatch_id uuid references public.crm_dispatch_observations(id) on delete set null,
  due_at timestamptz not null,
  check_type text not null,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  result_json jsonb not null default '{}'::jsonb,
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
  unique (workspace_id, related_intent_id, due_at, check_type)
);

create table if not exists public.crm_brevo_sync_log (
  id uuid primary key default gen_random_uuid(),
  customer_key uuid,
  workspace_id text not null,
  mission_id uuid,
  run_id uuid,
  direction text not null check (direction in ('push','pull')),
  sync_type text not null,
  brevo_contact_id text,
  payload_hash text,
  status text not null,
  error_text text,
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
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_conflict_review_queue (
  id uuid primary key default gen_random_uuid(),
  workspace_id text not null,
  mission_id uuid,
  run_id uuid,
  customer_key uuid,
  conflict_type text not null,
  severity text not null,
  details_json jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','in_review','resolved','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists crm_source_records_run_idx on public.crm_source_records(run_id);
create index if not exists crm_identity_resolution_run_idx on public.crm_identity_resolution(run_id);
create index if not exists crm_profile_projection_lifecycle_idx on public.crm_profile_projection(workspace_id, lifecycle_state_projection);
create index if not exists crm_marketing_eligibility_state_idx on public.crm_marketing_eligibility(workspace_id, marketing_eligibility);
create index if not exists crm_segment_projection_segment_idx on public.crm_segment_projection(workspace_id, segment_key, active);
create index if not exists crm_dispatch_observations_campaign_idx on public.crm_dispatch_observations(workspace_id, campaign_key);
create index if not exists crm_rechecks_due_idx on public.crm_rechecks(workspace_id, due_at, status);
create index if not exists crm_conflict_review_queue_status_idx on public.crm_conflict_review_queue(workspace_id, status, severity);

-- Optional foreign keys to shared tables when available.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='missions' and column_name='id'
  ) then
    begin alter table public.crm_source_records add constraint crm_source_records_mission_fk foreign key (mission_id) references public.missions(id); exception when duplicate_object then null; end;
    begin alter table public.crm_identity_resolution add constraint crm_identity_resolution_mission_fk foreign key (mission_id) references public.missions(id); exception when duplicate_object then null; end;
    begin alter table public.crm_profile_projection add constraint crm_profile_projection_mission_fk foreign key (mission_id) references public.missions(id); exception when duplicate_object then null; end;
    begin alter table public.crm_marketing_eligibility add constraint crm_marketing_eligibility_mission_fk foreign key (mission_id) references public.missions(id); exception when duplicate_object then null; end;
    begin alter table public.crm_engagement_scores add constraint crm_engagement_scores_mission_fk foreign key (mission_id) references public.missions(id); exception when duplicate_object then null; end;
    begin alter table public.crm_segment_projection add constraint crm_segment_projection_mission_fk foreign key (mission_id) references public.missions(id); exception when duplicate_object then null; end;
    begin alter table public.crm_rechecks add constraint crm_rechecks_mission_fk foreign key (mission_id) references public.missions(id); exception when duplicate_object then null; end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='runs' and column_name='id'
  ) then
    begin alter table public.crm_source_records add constraint crm_source_records_run_fk foreign key (run_id) references public.runs(id); exception when duplicate_object then null; end;
    begin alter table public.crm_identity_resolution add constraint crm_identity_resolution_run_fk foreign key (run_id) references public.runs(id); exception when duplicate_object then null; end;
    begin alter table public.crm_profile_projection add constraint crm_profile_projection_run_fk foreign key (run_id) references public.runs(id); exception when duplicate_object then null; end;
    begin alter table public.crm_marketing_eligibility add constraint crm_marketing_eligibility_run_fk foreign key (run_id) references public.runs(id); exception when duplicate_object then null; end;
    begin alter table public.crm_engagement_scores add constraint crm_engagement_scores_run_fk foreign key (run_id) references public.runs(id); exception when duplicate_object then null; end;
    begin alter table public.crm_segment_projection add constraint crm_segment_projection_run_fk foreign key (run_id) references public.runs(id); exception when duplicate_object then null; end;
    begin alter table public.crm_rechecks add constraint crm_rechecks_run_fk foreign key (run_id) references public.runs(id); exception when duplicate_object then null; end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='events' and column_name='id'
  ) then
    begin alter table public.crm_source_records add constraint crm_source_records_event_fk foreign key (event_id) references public.events(id); exception when duplicate_object then null; end;
    begin alter table public.crm_identity_resolution add constraint crm_identity_resolution_event_fk foreign key (event_id) references public.events(id); exception when duplicate_object then null; end;
    begin alter table public.crm_marketing_eligibility add constraint crm_marketing_eligibility_event_fk foreign key (event_id) references public.events(id); exception when duplicate_object then null; end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='action_intents' and column_name='id'
  ) then
    begin alter table public.crm_rechecks add constraint crm_rechecks_action_intent_fk foreign key (related_intent_id) references public.action_intents(id); exception when duplicate_object then null; end;
  end if;
end $$;

create or replace view public.v_crm_segment_counts as
select
  workspace_id,
  segment_key,
  count(*) filter (where active) as active_count,
  count(*) as total_records
from public.crm_segment_projection
group by workspace_id, segment_key;

create or replace view public.v_crm_onboarding_funnel as
select
  p.workspace_id,
  count(*) as profile_count,
  count(*) filter (where p.lifecycle_state_projection = 'new_unactivated') as new_unactivated,
  count(*) filter (where p.lifecycle_state_projection = 'active_learning') as active_learning,
  count(*) filter (where p.lifecycle_state_projection = 'retained_30d') as retained_30d,
  count(*) filter (where e.marketing_eligibility = 'eligible') as eligible_contacts
from public.crm_profile_projection p
left join public.crm_marketing_eligibility e
  on e.customer_key = p.customer_key and e.workspace_id = p.workspace_id
group by p.workspace_id;

create or replace view public.v_crm_retention_risk as
select
  workspace_id,
  lifecycle_state_projection,
  count(*) as contacts
from public.crm_profile_projection
where lifecycle_state_projection in ('at_risk_7d', 'at_risk_14d', 'lapsed_paid')
group by workspace_id, lifecycle_state_projection;

create or replace view public.v_crm_send_health as
select
  workspace_id,
  count(*) as sends_observed,
  count(*) filter (where delivered_at is not null) as delivered,
  count(*) filter (where opened_at is not null) as opened,
  count(*) filter (where clicked_at is not null) as clicked,
  count(*) filter (where bounced_at is not null) as bounced,
  count(*) filter (where unsubscribed_at is not null) as unsubscribed,
  count(*) filter (where complaint_at is not null) as complaints
from public.crm_dispatch_observations
group by workspace_id;

create or replace view public.v_crm_cutover_readiness as
select
  p.workspace_id,
  count(*) as profiles,
  count(*) filter (where p.review_required) as profiles_review_required,
  count(*) filter (where e.marketing_eligibility in ('suppressed_unsubscribed','suppressed_bounced','suppressed_complaint','review_required')) as suppressed_or_review,
  count(*) filter (where q.status in ('open','in_review') and q.severity in ('high','critical')) as high_conflicts_open
from public.crm_profile_projection p
left join public.crm_marketing_eligibility e
  on e.customer_key = p.customer_key and e.workspace_id = p.workspace_id
left join public.crm_conflict_review_queue q
  on q.customer_key = p.customer_key and q.workspace_id = p.workspace_id
group by p.workspace_id;
