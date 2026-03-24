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

create or replace function public.crm_json_flag_true(flags jsonb, candidate_key text)
returns boolean
language sql
immutable
as $$
  select lower(coalesce(flags ->> candidate_key, '')) in ('1', 'true', 't', 'yes', 'y')
$$;

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

create or replace view public.v_crm_send_rates as
with sends as (
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
  group by workspace_id
)
select
  workspace_id,
  sends_observed,
  delivered,
  opened,
  clicked,
  bounced,
  unsubscribed,
  complaints,
  round(delivered::numeric / nullif(sends_observed, 0), 4) as delivery_rate,
  round(opened::numeric / nullif(delivered, 0), 4) as open_rate,
  round(clicked::numeric / nullif(delivered, 0), 4) as click_through_rate,
  round(clicked::numeric / nullif(opened, 0), 4) as click_to_open_rate,
  round(unsubscribed::numeric / nullif(delivered, 0), 4) as unsubscribe_rate,
  round(bounced::numeric / nullif(sends_observed, 0), 4) as bounce_rate,
  round(complaints::numeric / nullif(delivered, 0), 4) as complaint_rate
from sends;

create or replace view public.v_crm_source_overlap as
with source_flags as (
  select
    p.workspace_id,
    p.customer_key,
    (
      public.crm_json_flag_true(p.source_flags_json, 'substack')
      or public.crm_json_flag_true(p.source_flags_json, 'source_substack')
      or p.source_flags_json ? 'substack_tier'
    ) as has_substack,
    (
      public.crm_json_flag_true(p.source_flags_json, 'podia')
      or public.crm_json_flag_true(p.source_flags_json, 'source_podia')
      or p.source_flags_json ? 'podia_customer_id'
    ) as has_podia,
    (
      public.crm_json_flag_true(p.source_flags_json, 'ejunkie')
      or public.crm_json_flag_true(p.source_flags_json, 'e_junkie')
      or public.crm_json_flag_true(p.source_flags_json, 'e-junkie')
      or p.source_flags_json ? 'ejunkie_order_count'
    ) as has_ejunkie
  from public.crm_profile_projection p
),
scored as (
  select
    workspace_id,
    customer_key,
    has_substack,
    has_podia,
    has_ejunkie,
    (
      case when has_substack then 1 else 0 end
      + case when has_podia then 1 else 0 end
      + case when has_ejunkie then 1 else 0 end
    ) as source_count
  from source_flags
)
select
  workspace_id,
  count(*) as profile_count,
  count(*) filter (where has_substack) as profiles_from_substack,
  count(*) filter (where has_podia) as profiles_from_podia,
  count(*) filter (where has_ejunkie) as profiles_from_ejunkie,
  count(*) filter (where source_count >= 2) as overlapping_profiles,
  round((count(*) filter (where source_count >= 2))::numeric / nullif(count(*), 0), 4) as overlap_ratio,
  count(*) filter (where source_count = 3) as all_three_sources
from scored
group by workspace_id;

create or replace view public.v_crm_activity_cohorts as
with normalized as (
  select
    p.workspace_id,
    p.customer_key,
    p.lifecycle_state_projection,
    p.last_activation_at,
    p.last_progress_at,
    case
      when p.substack_engagement_score is null then null
      when p.substack_engagement_score > 1 then least(p.substack_engagement_score / 5.0, 1)
      when p.substack_engagement_score < 0 then 0
      else p.substack_engagement_score
    end as activity_score_norm
  from public.crm_profile_projection p
)
select
  n.workspace_id,
  count(*) as profile_count,
  count(*) filter (where n.activity_score_norm is not null) as scored_profiles,
  round(avg(n.activity_score_norm)::numeric, 4) as avg_activity_score_norm,
  count(*) filter (where n.activity_score_norm >= 0.80) as high_activity_profiles,
  count(*) filter (where n.activity_score_norm >= 0.40 and n.activity_score_norm < 0.80) as medium_activity_profiles,
  count(*) filter (where n.activity_score_norm < 0.40) as low_activity_profiles,
  count(*) filter (where n.last_activation_at >= now() - interval '30 days') as activated_last_30d,
  count(*) filter (where n.last_progress_at >= now() - interval '30 days') as progressed_last_30d,
  count(*) filter (
    where n.lifecycle_state_projection in ('at_risk_7d', 'at_risk_14d', 'lapsed_paid')
  ) as at_risk_profiles,
  count(*) filter (
    where n.activity_score_norm >= 0.80
      and e.marketing_eligibility = 'eligible'
  ) as high_activity_eligible_profiles
from normalized n
left join public.crm_marketing_eligibility e
  on e.customer_key = n.customer_key and e.workspace_id = n.workspace_id
group by n.workspace_id;

create or replace view public.v_crm_pipeline_quality as
with source_rollup as (
  select
    workspace_id,
    count(*) as source_rows,
    count(*) filter (where email_raw is null or btrim(email_raw) = '') as source_rows_missing_email,
    count(distinct lower(btrim(email_raw))) filter (
      where email_raw is not null and btrim(email_raw) <> ''
    ) as distinct_emails_seen
  from public.crm_source_records
  group by workspace_id
),
identity_rollup as (
  select
    workspace_id,
    count(*) as identity_rows,
    count(*) filter (where review_required) as identity_review_required,
    count(*) filter (where confidence < 0.90) as identity_low_confidence_rows
  from public.crm_identity_resolution
  group by workspace_id
),
profile_rollup as (
  select
    workspace_id,
    count(*) as projected_profiles,
    count(*) filter (where review_required) as profiles_review_required
  from public.crm_profile_projection
  group by workspace_id
),
eligibility_rollup as (
  select
    workspace_id,
    count(*) as eligibility_rows,
    count(*) filter (where marketing_eligibility = 'eligible') as eligible_rows,
    count(*) filter (where marketing_eligibility <> 'eligible') as suppressed_or_review_rows
  from public.crm_marketing_eligibility
  group by workspace_id
),
conflict_rollup as (
  select
    workspace_id,
    count(*) filter (where status in ('open', 'in_review')) as open_conflicts,
    count(*) filter (
      where status in ('open', 'in_review') and severity in ('high', 'critical')
    ) as high_conflicts_open
  from public.crm_conflict_review_queue
  group by workspace_id
),
workspace_ids as (
  select workspace_id from source_rollup
  union
  select workspace_id from identity_rollup
  union
  select workspace_id from profile_rollup
  union
  select workspace_id from eligibility_rollup
  union
  select workspace_id from conflict_rollup
)
select
  w.workspace_id,
  coalesce(s.source_rows, 0) as source_rows,
  coalesce(s.source_rows_missing_email, 0) as source_rows_missing_email,
  coalesce(s.distinct_emails_seen, 0) as distinct_emails_seen,
  coalesce(i.identity_rows, 0) as identity_rows,
  coalesce(i.identity_review_required, 0) as identity_review_required,
  coalesce(i.identity_low_confidence_rows, 0) as identity_low_confidence_rows,
  coalesce(p.projected_profiles, 0) as projected_profiles,
  coalesce(p.profiles_review_required, 0) as profiles_review_required,
  coalesce(e.eligibility_rows, 0) as eligibility_rows,
  coalesce(e.eligible_rows, 0) as eligible_rows,
  coalesce(e.suppressed_or_review_rows, 0) as suppressed_or_review_rows,
  coalesce(c.open_conflicts, 0) as open_conflicts,
  coalesce(c.high_conflicts_open, 0) as high_conflicts_open,
  round(coalesce(i.identity_review_required, 0)::numeric / nullif(coalesce(i.identity_rows, 0), 0), 4) as identity_review_rate,
  round(coalesce(e.eligible_rows, 0)::numeric / nullif(coalesce(e.eligibility_rows, 0), 0), 4) as eligibility_rate
from workspace_ids w
left join source_rollup s
  on s.workspace_id = w.workspace_id
left join identity_rollup i
  on i.workspace_id = w.workspace_id
left join profile_rollup p
  on p.workspace_id = w.workspace_id
left join eligibility_rollup e
  on e.workspace_id = w.workspace_id
left join conflict_rollup c
  on c.workspace_id = w.workspace_id;
