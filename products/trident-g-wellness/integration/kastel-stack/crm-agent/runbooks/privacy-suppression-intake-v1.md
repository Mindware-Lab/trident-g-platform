# Privacy Suppression Intake Runbook (V1)

## Objective

Process explicit unsubscribe/deletion requests as hard privacy controls.

## Input format

One-email-per-line list (for example `Unsubscribe list - Sheet1.csv`).

## Normalize input

```powershell
python tools/normalize_unsubscribe_list.py `
  --input "C:\path\Unsubscribe list - Sheet1.csv" `
  --out-csv ".\imports\privacy\unsubscribe.normalized.csv" `
  --out-json ".\imports\privacy\unsubscribe.records.json" `
  --request-type erase `
  --source-system manual_unsubscribe_list
```

## Intake workflow

1. Import and run `crm_privacy_suppression_v1.n8n.json`.
2. Set:
   - `request_type` = `erase` (or `unsubscribe`)
   - `source_system` = `manual_unsubscribe_list`
   - `records` = normalized JSON `records` array
3. Confirm `CrmPrivacyRequestReceived.v1` event was recorded.

## Verification

```sql
select *
from public.v_crm_privacy_requests
where workspace_id = '<workspace>'
order by last_requested_at desc;
```

## Guardrail

Any `erase` request must block marketing and route to deletion policy execution.
