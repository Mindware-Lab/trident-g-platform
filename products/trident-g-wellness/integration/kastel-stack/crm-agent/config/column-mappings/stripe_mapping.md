# Stripe Customer Rollup CSV Mapping (V1 Bootstrap)

| source_column | target_table | target_field | transform | required | default | validation_rule |
|---|---|---|---|---|---|---|
| id | crm_source_records | source_record_id | identity | yes | n/a | non-empty |
| email | crm_source_records | email_raw | trim+lower | yes | n/a | valid email format |
| id | crm_profile_projection | external_keys_json.stripe_customer_id | json_set | yes | n/a | non-empty |
| email | crm_profile_projection | primary_email_normalized | trim+lower | yes | n/a | non-empty |
| name | crm_profile_projection | first_name,last_name | split_name | no | null | <= 120 chars each |
| created (utc) | crm_profile_projection | provenance_json.stripe_created_at | parse_datetime | no | null | valid timestamp |
| total spend | crm_profile_projection | total_spend | decimal | no | 0 | >= 0 |
| payment count | crm_profile_projection | purchase_count | integer | no | 0 | >= 0 |
| refunded volume | crm_conversion_observations | payload_json.refunded_volume | decimal | no | 0 | >= 0 |
| dispute losses | crm_conversion_observations | payload_json.dispute_losses | decimal | no | 0 | >= 0 |
| total spend,refunded volume,dispute losses | crm_conversion_observations | payload_json.net_spend | calc(total-refunded-dispute) | no | 0 | numeric |
| total spend | crm_conversion_observations | payload_json.revenue | decimal | no | 0 | numeric |
