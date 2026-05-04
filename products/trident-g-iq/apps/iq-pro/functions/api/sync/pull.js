import { getUser, json, supabaseRest } from "../_shared/supabase.js";

export async function onRequestGet({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user?.id) return json({ error: "unauthorized" }, 401);
    const rows = await supabaseRest(
      env,
      `sync_snapshots?select=device_id,domain,storage_key,payload,local_updated_at,updated_at&user_id=eq.${encodeURIComponent(user.id)}&order=updated_at.desc`
    );
    return json({ snapshots: rows || [] });
  } catch (error) {
    return json({ error: error.message || "request_failed" }, 500);
  }
}
