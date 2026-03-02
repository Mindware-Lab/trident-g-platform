/**
 * Phase 1 webhook template:
 * - verify Stripe signature
 * - process events idempotently via stripe_event_log
 * - upsert entitlements with server-truth status
 * - append events log entries
 *
 * Adapt this file to your runtime (Edge Function, Node server, or serverless function).
 */

type EntitlementStatus = "active" | "inactive" | "revoked";

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

interface SupabaseAdminClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

function mapStripeEventToStatus(eventType: string): EntitlementStatus | null {
  if (
    eventType === "checkout.session.completed" ||
    eventType === "customer.subscription.created" ||
    eventType === "customer.subscription.updated"
  ) {
    return "active";
  }
  if (
    eventType === "customer.subscription.paused" ||
    eventType === "customer.subscription.trial_will_end"
  ) {
    return "inactive";
  }
  if (
    eventType === "charge.refunded" ||
    eventType === "customer.subscription.deleted"
  ) {
    return "revoked";
  }
  return null;
}

function mapStripePriceToBundleId(priceId: string): string | null {
  const mapping: Record<string, string> = {
    // Replace with real Stripe price IDs:
    "price_g_tracker": "g_tracker",
    "price_zone_coach": "zone_coach",
    "price_performance_bundle": "performance_bundle",
    "price_cohort_bundle": "cohort_bundle",
    "price_premium_1to1": "premium_1to1"
  };
  return mapping[priceId] || null;
}

async function alreadyProcessed(db: SupabaseAdminClient, stripeEventId: string): Promise<boolean> {
  const result = await db.query<{ stripe_event_id: string }>(
    "select stripe_event_id from public.stripe_event_log where stripe_event_id = $1 limit 1",
    [stripeEventId]
  );
  return result.rows.length > 0;
}

async function markProcessed(db: SupabaseAdminClient, event: StripeEvent): Promise<void> {
  await db.query(
    "insert into public.stripe_event_log (stripe_event_id, event_type, payload) values ($1, $2, $3)",
    [event.id, event.type, JSON.stringify(event)]
  );
}

async function upsertEntitlement(
  db: SupabaseAdminClient,
  userId: string,
  bundleId: string,
  status: EntitlementStatus,
  source: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<void> {
  await db.query(
    `insert into public.entitlements
      (user_id, bundle_id, status, source, stripe_customer_id, stripe_subscription_id, updated_at)
     values ($1, $2, $3, $4, $5, $6, now())
     on conflict (user_id, bundle_id)
     do update set
       status = excluded.status,
       source = excluded.source,
       stripe_customer_id = excluded.stripe_customer_id,
       stripe_subscription_id = excluded.stripe_subscription_id,
       updated_at = now()`,
    [userId, bundleId, status, source, stripeCustomerId || null, stripeSubscriptionId || null]
  );
}

async function appendServerEvent(
  db: SupabaseAdminClient,
  userId: string,
  eventType: string,
  appId: string | null,
  bundleId: string | null,
  payload: Record<string, unknown>
): Promise<void> {
  await db.query(
    "insert into public.events (user_id, event_type, app_id, bundle_id, source, payload) values ($1, $2, $3, $4, 'stripe_webhook', $5)",
    [userId, eventType, appId, bundleId, JSON.stringify(payload)]
  );
}

/**
 * Main webhook flow (pseudo-runtime):
 * 1) verify signature -> parse StripeEvent
 * 2) skip duplicates by stripe_event_log
 * 3) resolve user + bundle from Stripe payload metadata
 * 4) upsert entitlements
 * 5) append events row
 * 6) mark processed
 */
export async function handleStripeWebhook(
  db: SupabaseAdminClient,
  event: StripeEvent,
  resolvedUserId: string,
  resolvedPriceId: string,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<{ ok: boolean; message: string }> {
  if (await alreadyProcessed(db, event.id)) {
    return { ok: true, message: "already_processed" };
  }

  const status = mapStripeEventToStatus(event.type);
  const bundleId = mapStripePriceToBundleId(resolvedPriceId);

  if (!status || !bundleId) {
    await markProcessed(db, event);
    return { ok: true, message: "ignored_event_type_or_bundle" };
  }

  await upsertEntitlement(
    db,
    resolvedUserId,
    bundleId,
    status,
    "stripe_webhook",
    stripeCustomerId,
    stripeSubscriptionId
  );

  await appendServerEvent(
    db,
    resolvedUserId,
    "entitlement_update",
    null,
    bundleId,
    {
      stripeEventId: event.id,
      stripeEventType: event.type,
      status
    }
  );

  await markProcessed(db, event);
  return { ok: true, message: "processed" };
}

