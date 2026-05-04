import { getUser, json, supabaseRest } from "./_shared/supabase.js";

export async function onRequestGet({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user?.id) return json({ error: "unauthorized" }, 401);

    const profileRows = await supabaseRest(
      env,
      `profiles?select=*&id=eq.${encodeURIComponent(user.id)}`
    );
    const entitlementRows = await supabaseRest(
      env,
      `entitlements?select=bundle_id,status,updated_at,created_at&user_id=eq.${encodeURIComponent(user.id)}`
    );

    return json({
      user: { id: user.id, email: user.email || null },
      profile: profileRows[0] || null,
      entitlements: entitlementRows || []
    });
  } catch (error) {
    return json({ error: error.message || "request_failed" }, 500);
  }
}
