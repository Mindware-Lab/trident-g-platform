# Entitlement Client Contract (Phase 1)

This contract defines the minimum client/server interfaces needed to replace Phase 0.5 device activation with server-truth access control.

## 1) Client assumptions

- User is authenticated (Supabase auth session exists).
- Client requests entitlements for the authenticated user only.
- Client does not mutate entitlements directly.
- Client may POST event records to a dedicated events endpoint using the same bearer auth.

## 2) Server-truth response shape

Example entitlement payload returned to client:

```json
{
  "userId": "uuid",
  "fetchedAt": "2026-03-02T12:00:00.000Z",
  "entitlements": [
    {
      "bundleId": "performance_bundle",
      "status": "active",
      "updatedAt": "2026-03-02T11:59:00.000Z"
    }
  ]
}
```

## 3) Access rule

Client resolves app access by:

1. `activeBundles = entitlements.filter(status === "active")`
2. derive allowed app IDs from `bundle-manifests.json`
3. app is unlocked if in derived set

No local override should grant access when server says no.

## 4) Lock timing rule

- Refund/revoke webhook sets entitlement status to `revoked` or `inactive`.
- Apps lock on the next entitlement fetch cycle.
- Recommended poll/refresh triggers:
  - app launch
  - route change
  - manual refresh in settings

## 5) Event logging

Clients append user events into `public.events`:

- `event_type=app_gate_allow|app_gate_deny|activation_attempt|activation_success`
- include `app_id`, `bundle_id`, and a lightweight JSON payload

Client hook:

- `window.IQEntitlementsClient.postEvent(eventType, payload)`
- if events endpoint is not configured, logging is skipped (no-blocking behavior)

RLS must enforce:

- users read their own rows only
- users insert rows for themselves only
