import { json, requiredEnv, supabaseRest } from "../_shared/supabase.js";

const ACTIVE_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated"
]);

const INACTIVE_EVENTS = new Set([
  "customer.subscription.paused",
  "customer.subscription.trial_will_end"
]);

const REVOKED_EVENTS = new Set([
  "charge.refunded",
  "customer.subscription.deleted"
]);

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(left, right) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}

async function hmacSha256Hex(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyStripeSignature(rawBody, signatureHeader, secret) {
  const parts = Object.fromEntries(
    String(signatureHeader || "")
      .split(",")
      .map((part) => part.split("="))
      .filter((pair) => pair.length === 2)
  );
  const timestamp = parts.t;
  const v1 = parts.v1;
  if (!timestamp || !v1) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;
  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`);
  return timingSafeEqual(hexToBytes(expected), hexToBytes(v1));
}

function eventStatus(type) {
  if (ACTIVE_EVENTS.has(type)) return "active";
  if (INACTIVE_EVENTS.has(type)) return "inactive";
  if (REVOKED_EVENTS.has(type)) return "revoked";
  return null;
}

function priceMapping(env) {
  return {
    [env.STRIPE_PRICE_IQ_PRO]: "iq_pro",
    [env.STRIPE_PRICE_PERFORMANCE_BUNDLE]: "performance_bundle",
    [env.STRIPE_PRICE_COHORT_BUNDLE]: "cohort_bundle",
    [env.STRIPE_PRICE_PREMIUM_1TO1]: "premium_1to1"
  };
}

function resolvePriceId(object) {
  return object?.metadata?.price_id
    || object?.items?.data?.[0]?.price?.id
    || object?.lines?.data?.[0]?.price?.id
    || object?.plan?.id
    || "";
}

function resolveBundleId(env, object) {
  const explicit = object?.metadata?.bundle_id;
  if (explicit) return String(explicit);
  return priceMapping(env)[resolvePriceId(object)] || "";
}

function resolveUserId(object) {
  return object?.metadata?.supabase_user_id
    || object?.metadata?.user_id
    || object?.client_reference_id
    || "";
}

async function alreadyProcessed(env, stripeEventId) {
  const rows = await supabaseRest(
    env,
    `stripe_event_log?select=stripe_event_id&stripe_event_id=eq.${encodeURIComponent(stripeEventId)}&limit=1`
  );
  return Array.isArray(rows) && rows.length > 0;
}

export async function onRequestPost({ request, env }) {
  try {
    const rawBody = await request.text();
    const signatureHeader = request.headers.get("Stripe-Signature") || "";
    const secret = requiredEnv(env, "STRIPE_WEBHOOK_SECRET");
    const valid = await verifyStripeSignature(rawBody, signatureHeader, secret);
    if (!valid) return json({ error: "invalid_signature" }, 400);

    const event = JSON.parse(rawBody);
    if (!event?.id || !event?.type) return json({ error: "invalid_event" }, 400);
    if (await alreadyProcessed(env, event.id)) return json({ ok: true, message: "already_processed" });

    const object = event.data?.object || {};
    const status = eventStatus(event.type);
    const userId = resolveUserId(object);
    const bundleId = resolveBundleId(env, object);

    if (status && userId && bundleId) {
      await supabaseRest(env, "entitlements?on_conflict=user_id,bundle_id", {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({
          user_id: userId,
          bundle_id: bundleId,
          status,
          source: "stripe_webhook",
          stripe_customer_id: object.customer || null,
          stripe_subscription_id: object.subscription || object.id || null,
          updated_at: new Date().toISOString()
        })
      });

      await supabaseRest(env, "events", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          event_type: "entitlement_update",
          app_id: "iq_pro",
          bundle_id: bundleId,
          source: "stripe_webhook",
          payload: {
            stripeEventId: event.id,
            stripeEventType: event.type,
            status
          }
        })
      });
    }

    await supabaseRest(env, "stripe_event_log", {
      method: "POST",
      body: JSON.stringify({
        stripe_event_id: event.id,
        event_type: event.type,
        payload: event
      })
    });

    return json({
      ok: true,
      message: status && userId && bundleId ? "processed" : "ignored_event_type_or_missing_metadata"
    });
  } catch (error) {
    return json({ error: error.message || "request_failed" }, 500);
  }
}
