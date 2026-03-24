-- SQL proof pack: high_value_spend segment projection
-- Purpose:
-- 1) verify who qualifies by spend threshold
-- 2) verify active high_value_spend segment membership
-- 3) surface projection mismatches
--
-- Change these constants for your workspace/threshold.
with params as (
  select
    'wellness_sa'::text as workspace_id,
    300::numeric as high_value_spend_min
)

-- Query 1: customers who should qualify for high_value_spend
select
  p.workspace_id,
  p.customer_key,
  p.primary_email_normalized,
  p.total_spend,
  p.purchase_count,
  p.lifecycle_state_projection
from public.crm_profile_projection p
join params prm
  on prm.workspace_id = p.workspace_id
where p.total_spend >= prm.high_value_spend_min
order by p.total_spend desc, p.purchase_count desc;

-- Query 2: active high_value_spend segment memberships
with params as (
  select
    'wellness_sa'::text as workspace_id,
    300::numeric as high_value_spend_min
)
select
  s.workspace_id,
  s.customer_key,
  s.segment_key,
  s.segment_version,
  s.updated_at
from public.crm_segment_projection s
join params prm
  on prm.workspace_id = s.workspace_id
where s.segment_key = 'high_value_spend'
  and s.active = true
order by s.updated_at desc;

-- Query 3: mismatch detector (should_be_in_segment != is_in_segment)
with params as (
  select
    'wellness_sa'::text as workspace_id,
    300::numeric as high_value_spend_min
),
candidates as (
  select
    p.workspace_id,
    p.customer_key,
    p.total_spend,
    p.purchase_count,
    (p.total_spend >= prm.high_value_spend_min) as should_be_in_segment
  from public.crm_profile_projection p
  join params prm
    on prm.workspace_id = p.workspace_id
),
active_segment as (
  select
    s.workspace_id,
    s.customer_key,
    true as is_in_segment
  from public.crm_segment_projection s
  join params prm
    on prm.workspace_id = s.workspace_id
  where s.segment_key = 'high_value_spend'
    and s.active = true
)
select
  c.workspace_id,
  c.customer_key,
  c.total_spend,
  c.purchase_count,
  c.should_be_in_segment,
  coalesce(a.is_in_segment, false) as is_in_segment
from candidates c
left join active_segment a
  on a.workspace_id = c.workspace_id
 and a.customer_key = c.customer_key
where c.should_be_in_segment <> coalesce(a.is_in_segment, false)
order by c.total_spend desc;

-- Query 4: summary proof metrics for dashboards/checklists
with params as (
  select
    'wellness_sa'::text as workspace_id,
    300::numeric as high_value_spend_min
),
candidates as (
  select
    p.workspace_id,
    p.customer_key,
    (p.total_spend >= prm.high_value_spend_min) as should_be_in_segment
  from public.crm_profile_projection p
  join params prm
    on prm.workspace_id = p.workspace_id
),
active_segment as (
  select
    s.workspace_id,
    s.customer_key,
    true as is_in_segment
  from public.crm_segment_projection s
  join params prm
    on prm.workspace_id = s.workspace_id
  where s.segment_key = 'high_value_spend'
    and s.active = true
)
select
  c.workspace_id,
  count(*) filter (where c.should_be_in_segment) as should_be_in_segment_count,
  count(*) filter (where coalesce(a.is_in_segment, false)) as active_segment_count,
  count(*) filter (
    where c.should_be_in_segment <> coalesce(a.is_in_segment, false)
  ) as mismatch_count
from candidates c
left join active_segment a
  on a.workspace_id = c.workspace_id
 and a.customer_key = c.customer_key
group by c.workspace_id;
