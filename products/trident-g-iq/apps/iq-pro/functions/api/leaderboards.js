import { json, supabaseRest } from "./_shared/supabase.js";

export async function onRequestGet({ env }) {
  try {
    const rows = await supabaseRest(
      env,
      "leaderboard_scores?select=display_name,score_kind,score_value,period_start,created_at&is_public=eq.true&order=score_value.desc&limit=25"
    );
    return json({ leaderboardsEnabled: false, scores: rows || [] });
  } catch (error) {
    return json({ leaderboardsEnabled: false, scores: [], error: error.message || "request_failed" }, 200);
  }
}
