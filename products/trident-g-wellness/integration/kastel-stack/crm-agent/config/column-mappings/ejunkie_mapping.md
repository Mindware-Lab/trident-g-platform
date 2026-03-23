# e-Junkie CSV Column Mapping (V1 Bootstrap)

| source_column | target_table | target_field | transform | required | default | validation_rule |
|---|---|---|---|---|---|---|
| email | crm_source_records | email_raw | trim+lower | yes | n/a | valid email format |
| order_id | crm_source_records | source_record_id | identity | yes | n/a | non-empty |
| email | crm_profile_projection | primary_email_normalized | trim+lower | yes | n/a | non-empty |
| first_name | crm_profile_projection | first_name | trim | no | null | <= 120 chars |
| last_name | crm_profile_projection | last_name | trim | no | null | <= 120 chars |
| gross_amount | crm_profile_projection | total_spend | decimal | no | 0 | >= 0 |
| payment_status | crm_profile_projection | purchase_count | status_to_purchase_flag | no | 0 | integer |
| purchase_date | crm_profile_projection | last_purchase_at | parse_datetime | no | null | valid timestamp |
| product_name | crm_profile_projection | entitlement_summary_json.ejunkie_product | json_set | no | null | text |
| payment_status | crm_marketing_eligibility | consent_state | map_payment_to_consent_proxy | no | review_required | enum-mapped |
