import { getUser, json, sanitizeEventType, supabaseRest } from "./_shared/supabase.js";

export async function onRequestPost({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user?.id) return json({ error: "unauthorized" }, 401);
    const body = await request.json().catch(() => ({}));
    const row = {
      user_id: user.id,
      event_type: sanitizeEventType(body.eventType),
      app_id: body.appId ? String(body.appId).slice(0, 80) : "iq_pro",
      bundle_id: body.bundleId ? String(body.bundleId).slice(0, 80) : null,
      source: "client",
      payload: body.payload && typeof body.payload === "object" ? body.payload : {}
    };
    await supabaseRest(env, "events", {
      method: "POST",
      body: JSON.stringify(row)
    });
    return json({ ok: true });
  } catch (error) {
    return json({ error: error.message || "request_failed" }, 500);
  }
}
