-- SQL export pack: engaged audience (<5000) for Brevo rebuild/import
-- Purpose:
-- 1) produce a compliance-safe, engaged subset for rebuild campaigns
-- 2) enforce eligibility + privacy suppression exclusion
-- 3) cap list size for controlled import batches
--
-- Update these constants before running.
with params as (
  select
    'wellness_sa'::text as workspace_id,
    5000::integer as max_rows
),
privacy_blocklist as (
  select
    workspace_id,
    lower(email_normalized) as email_normalized,
    bool_or(status in ('pending', 'applied') and request_type in ('unsubscribe', 'erase')) as blocked
  from public.crm_privacy_requests
  group by workspace_id, lower(email_normalized)
),
segment_flags as (
  select
    workspace_id,
    customer_key,
    bool_or(segment_key = 'high_value_engaged') as is_high_value_engaged,
    bool_or(segment_key = 'repeat_buyers') as is_repeat_buyer,
    bool_or(segment_key = 'engaged_non_buyers') as is_engaged_non_buyer,
    bool_or(segment_key = 'new_buyers_30d') as is_new_buyer_30d,
    array_agg(
      segment_key
      order by case segment_key
        when 'high_value_engaged' then 1
        when 'repeat_buyers' then 2
        when 'engaged_non_buyers' then 3
        when 'new_buyers_30d' then 4
        when 'high_value_spend' then 5
        else 99
      end,
      segment_key
    ) as segment_keys
  from public.v_crm_named_segments_v1
  group by workspace_id, customer_key
),
candidates as (
  select
    p.workspace_id,
    p.customer_key::text as ext_id,
    lower(btrim(p.primary_email_normalized)) as email,
    p.first_name,
    p.last_name,
    p.total_spend,
    p.purchase_count,
    p.first_purchase_at,
    p.last_purchase_at,
    p.lifecycle_state_projection,
    p.updated_at,
    case
      when p.substack_engagement_score is null then null
      when p.substack_engagement_score > 1 then least(p.substack_engagement_score / 5.0, 1)
      when p.substack_engagement_score < 0 then 0
      else p.substack_engagement_score
    end as activity_score_norm,
    lower(e.marketing_eligibility) as marketing_eligibility,
    coalesce(pb.blocked, false) as privacy_blocked,
    coalesce(sf.is_high_value_engaged, false) as is_high_value_engaged,
    coalesce(sf.is_repeat_buyer, false) as is_repeat_buyer,
    coalesce(sf.is_engaged_non_buyer, false) as is_engaged_non_buyer,
    coalesce(sf.is_new_buyer_30d, false) as is_new_buyer_30d,
    coalesce(sf.segment_keys, array[]::text[]) as segment_keys
  from public.crm_profile_projection p
  join params prm
    on prm.workspace_id = p.workspace_id
  join public.crm_marketing_eligibility e
    on e.workspace_id = p.workspace_id and e.customer_key = p.customer_key
  left join privacy_blocklist pb
    on pb.workspace_id = p.workspace_id
   and pb.email_normalized = lower(btrim(p.primary_email_normalized))
  left join segment_flags sf
    on sf.workspace_id = p.workspace_id
   and sf.customer_key = p.customer_key
  where p.primary_email_normalized is not null
    and btrim(p.primary_email_normalized) <> ''
    and lower(e.marketing_eligibility) = 'eligible'
    and coalesce(pb.blocked, false) = false
    and (
      coalesce(sf.is_high_value_engaged, false)
      or coalesce(sf.is_repeat_buyer, false)
      or coalesce(sf.is_engaged_non_buyer, false)
      or coalesce(sf.is_new_buyer_30d, false)
    )
),
deduped as (
  select
    c.*,
    row_number() over (
      partition by c.workspace_id, c.email
      order by
        case
          when c.is_high_value_engaged then 1
          when c.is_repeat_buyer then 2
          when c.is_engaged_non_buyer then 3
          when c.is_new_buyer_30d then 4
          else 9
        end,
        c.activity_score_norm desc nulls last,
        c.total_spend desc,
        c.purchase_count desc,
        c.last_purchase_at desc nulls last,
        c.updated_at desc
    ) as email_rank
  from candidates c
),
final_rank as (
  select
    d.*,
    row_number() over (
      order by
        case
          when d.is_high_value_engaged then 1
          when d.is_repeat_buyer then 2
          when d.is_engaged_non_buyer then 3
          when d.is_new_buyer_30d then 4
          else 9
        end,
        d.activity_score_norm desc nulls last,
        d.total_spend desc,
        d.purchase_count desc,
        d.last_purchase_at desc nulls last
    ) as global_rank
  from deduped d
  where d.email_rank = 1
)

-- Query 1: pre-export QA summary
select
  workspace_id,
  count(*) as candidates_after_dedupe,
  count(*) filter (where is_high_value_engaged) as high_value_engaged_count,
  count(*) filter (where is_repeat_buyer) as repeat_buyer_count,
  count(*) filter (where is_engaged_non_buyer) as engaged_non_buyer_count,
  count(*) filter (where is_new_buyer_30d) as new_buyer_30d_count
from final_rank
group by workspace_id;

-- Query 2: export payload for Brevo CSV import (capped)
with params as (
  select
    'wellness_sa'::text as workspace_id,
    5000::integer as max_rows
),
privacy_blocklist as (
  select
    workspace_id,
    lower(email_normalized) as email_normalized,
    bool_or(status in ('pending', 'applied') and request_type in ('unsubscribe', 'erase')) as blocked
  from public.crm_privacy_requests
  group by workspace_id, lower(email_normalized)
),
segment_flags as (
  select
    workspace_id,
    customer_key,
    bool_or(segment_key = 'high_value_engaged') as is_high_value_engaged,
    bool_or(segment_key = 'repeat_buyers') as is_repeat_buyer,
    bool_or(segment_key = 'engaged_non_buyers') as is_engaged_non_buyer,
    bool_or(segment_key = 'new_buyers_30d') as is_new_buyer_30d,
    array_agg(
      segment_key
      order by case segment_key
        when 'high_value_engaged' then 1
        when 'repeat_buyers' then 2
        when 'engaged_non_buyers' then 3
        when 'new_buyers_30d' then 4
        when 'high_value_spend' then 5
        else 99
      end,
      segment_key
    ) as segment_keys
  from public.v_crm_named_segments_v1
  group by workspace_id, customer_key
),
candidates as (
  select
    p.workspace_id,
    p.customer_key::text as ext_id,
    lower(btrim(p.primary_email_normalized)) as email,
    p.first_name,
    p.last_name,
    p.total_spend,
    p.purchase_count,
    p.last_purchase_at,
    p.lifecycle_state_projection,
    p.updated_at,
    case
      when p.substack_engagement_score is null then null
      when p.substack_engagement_score > 1 then least(p.substack_engagement_score / 5.0, 1)
      when p.substack_engagement_score < 0 then 0
      else p.substack_engagement_score
    end as activity_score_norm,
    lower(e.marketing_eligibility) as marketing_eligibility,
    coalesce(pb.blocked, false) as privacy_blocked,
    coalesce(sf.is_high_value_engaged, false) as is_high_value_engaged,
    coalesce(sf.is_repeat_buyer, false) as is_repeat_buyer,
    coalesce(sf.is_engaged_non_buyer, false) as is_engaged_non_buyer,
    coalesce(sf.is_new_buyer_30d, false) as is_new_buyer_30d,
    coalesce(sf.segment_keys, array[]::text[]) as segment_keys
  from public.crm_profile_projection p
  join params prm
    on prm.workspace_id = p.workspace_id
  join public.crm_marketing_eligibility e
    on e.workspace_id = p.workspace_id and e.customer_key = p.customer_key
  left join privacy_blocklist pb
    on pb.workspace_id = p.workspace_id
   and pb.email_normalized = lower(btrim(p.primary_email_normalized))
  left join segment_flags sf
    on sf.workspace_id = p.workspace_id
   and sf.customer_key = p.customer_key
  where p.primary_email_normalized is not null
    and btrim(p.primary_email_normalized) <> ''
    and lower(e.marketing_eligibility) = 'eligible'
    and coalesce(pb.blocked, false) = false
    and (
      coalesce(sf.is_high_value_engaged, false)
      or coalesce(sf.is_repeat_buyer, false)
      or coalesce(sf.is_engaged_non_buyer, false)
      or coalesce(sf.is_new_buyer_30d, false)
    )
),
deduped as (
  select
    c.*,
    row_number() over (
      partition by c.workspace_id, c.email
      order by
        case
          when c.is_high_value_engaged then 1
          when c.is_repeat_buyer then 2
          when c.is_engaged_non_buyer then 3
          when c.is_new_buyer_30d then 4
          else 9
        end,
        c.activity_score_norm desc nulls last,
        c.total_spend desc,
        c.purchase_count desc,
        c.last_purchase_at desc nulls last,
        c.updated_at desc
    ) as email_rank
  from candidates c
),
final_rank as (
  select
    d.*,
    row_number() over (
      order by
        case
          when d.is_high_value_engaged then 1
          when d.is_repeat_buyer then 2
          when d.is_engaged_non_buyer then 3
          when d.is_new_buyer_30d then 4
          else 9
        end,
        d.activity_score_norm desc nulls last,
        d.total_spend desc,
        d.purchase_count desc,
        d.last_purchase_at desc nulls last
    ) as global_rank
  from deduped d
  where d.email_rank = 1
)
select
  fr.email as "EMAIL",
  coalesce(fr.first_name, '') as "FIRSTNAME",
  coalesce(fr.last_name, '') as "LASTNAME",
  fr.ext_id as "EXT_ID",
  array_to_string(fr.segment_keys, '|') as "SEGMENT_KEYS",
  fr.total_spend as "TOTAL_SPEND",
  fr.purchase_count as "PURCHASE_COUNT",
  fr.activity_score_norm as "ACTIVITY_SCORE_NORM",
  fr.lifecycle_state_projection as "LIFECYCLE_STATE"
from final_rank fr
join params prm
  on prm.workspace_id = fr.workspace_id
where fr.global_rank <= prm.max_rows
order by fr.global_rank;
