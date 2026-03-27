# CRM Agent (IQ Phase 0 Bootstrap)

This IQ-scoped module holds the fast-launch CRM bootstrap tooling for the
purchase-led Brevo rebuild.

Phase 0 is intentionally file-based:

1. no n8n dependency
2. no Supabase dependency
3. no live Brevo API writes
4. no hidden background sync

Identity is resolved by normalized email only. Names remain descriptive and
must never drive merges.

## Phase 0 Brevo bootstrap export

Use the file-only CLI below for the IQ audience rebuild:

```powershell
python tools/export_phase0_brevo_bootstrap.py `
  --stripe-payments "C:\Users\admin\Downloads\unified_payments.csv" `
  --stripe-customers "C:\Users\admin\Downloads\Stripe_customers.csv" `
  --ejunkie "C:\Users\admin\Downloads\e-junkie-2026-03-23.txt" `
  --podia "C:\Users\admin\Downloads\podia-2026-03-23.txt" `
  --substack "C:\Users\admin\Downloads\substack-2026-03-23.txt" `
  --unsubscribe-csv "C:\Users\admin\Downloads\Unsubscribe list - Sheet1 (1).csv" `
  --out-dir ".\imports\phase0-bootstrap"
```

Primary outputs:

- `brevo_bootstrap_top_4500.csv`
- `brevo_bootstrap_reserve_next_500.csv`
- `customer_universe.csv`
- `contact_action_recommendations.csv`
- `segment_action_playbook.csv`
- `action_counts.csv`
- `suppressed_contacts.csv`
- `review_required_contacts.csv`
- `segment_counts.csv`
- `qa_summary.json`

Optional suppression inputs:

- `--privacy-request-csv`
- `--bounce-csv`
- `--complaint-csv`

Notes:

- timestamps are converted to UTC before launch-window and lifecycle calculations
- `unified_payments.csv` is treated as authoritative Stripe order truth
- `Stripe_customers.csv` is enrichment and QA only
- `post_launch_stripe_buyers` and `launch_promo_buyers` are timing proxies, not exact product-identification segments
- `customer_universe.csv` includes per-contact recommended actions and bootstrap bucket labels

## Included tools

- `tools/export_phase0_brevo_bootstrap.py`
- `tools/normalize_crm_source_exports.py`
- `tools/segment_policy_evaluator.py`

## Test kit

Run the Phase 0 validator from `tests/`:

```powershell
python validate_phase0_bootstrap.py
```
