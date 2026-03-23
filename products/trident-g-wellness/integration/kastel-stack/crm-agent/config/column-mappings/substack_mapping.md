# Substack CSV Column Mapping (V1 Bootstrap)

| source_column | target_table | target_field | transform | required | default | validation_rule |
|---|---|---|---|---|---|---|
| email | crm_source_records | email_raw | trim+lower | yes | n/a | valid email format |
| email | crm_profile_projection | primary_email_normalized | trim+lower | yes | n/a | non-empty |
| first_name | crm_profile_projection | first_name | trim | no | null | <= 120 chars |
| last_name | crm_profile_projection | last_name | trim | no | null | <= 120 chars |
| subscriber_state | crm_marketing_eligibility | consent_state | map_substack_state | yes | review_required | enum-mapped |
| subscribed_at | crm_marketing_eligibility | consent_captured_at | parse_datetime | no | null | valid timestamp |
| subscription_tier | crm_profile_projection | source_flags_json.substack_tier | json_set | no | free | text |
| last_open_at | crm_engagement_scores | score_inputs_json.last_open_at | parse_datetime | no | null | valid timestamp |
| last_click_at | crm_engagement_scores | score_inputs_json.last_click_at | parse_datetime | no | null | valid timestamp |
