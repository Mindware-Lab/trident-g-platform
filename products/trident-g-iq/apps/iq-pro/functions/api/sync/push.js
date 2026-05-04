import { getUser, isoOrNow, json, sanitizeDomain, supabaseRest } from "../_shared/supabase.js";

function safeRows(rows, mapper) {
  return Array.isArray(rows) ? rows.map(mapper).filter(Boolean).slice(-180) : [];
}

function summaryPayload(row) {
  return row && typeof row === "object" ? row.payload || {} : {};
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user?.id) return json({ error: "unauthorized" }, 401);
    const body = await request.json().catch(() => ({}));
    const deviceId = String(body.deviceId || "unknown").slice(0, 120);
    const snapshots = safeRows(body.snapshots, (snapshot) => {
      const domain = sanitizeDomain(snapshot.domain);
      if (!domain || !snapshot.storageKey) return null;
      return {
        user_id: user.id,
        device_id: deviceId,
        domain,
        storage_key: String(snapshot.storageKey).slice(0, 120),
        payload: snapshot.payload ?? {},
        local_updated_at: isoOrNow(snapshot.localUpdatedAt),
        updated_at: new Date().toISOString()
      };
    });
    if (snapshots.length) {
      await supabaseRest(env, "sync_snapshots?on_conflict=user_id,device_id,domain", {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(snapshots)
      });
    }

    const summaries = body.summaries && typeof body.summaries === "object" ? body.summaries : {};
    const zoneRuns = safeRows(summaries.zoneRuns, (row) => row.externalId ? ({
      user_id: user.id,
      external_id: String(row.externalId).slice(0, 160),
      occurred_at: isoOrNow(row.occurredAt),
      state: row.state || null,
      confidence: row.confidence || null,
      valid: row.valid === true,
      summary: row.summary || {},
      payload: summaryPayload(row)
    }) : null);
    const capacitySessions = safeRows(summaries.capacitySessions, (row) => row.externalId ? ({
      user_id: user.id,
      external_id: String(row.externalId).slice(0, 160),
      occurred_at: isoOrNow(row.occurredAt),
      mode: row.mode || null,
      summary: row.summary || {},
      payload: summaryPayload(row)
    }) : null);
    const reasoningSessions = safeRows(summaries.reasoningSessions, (row) => row.externalId ? ({
      user_id: user.id,
      external_id: String(row.externalId).slice(0, 160),
      occurred_at: isoOrNow(row.occurredAt),
      family: row.family || null,
      route_class: row.routeClass || null,
      summary: row.summary || {},
      payload: summaryPayload(row)
    }) : null);
    const testResults = safeRows(summaries.testResults, (row) => row.externalId ? ({
      user_id: user.id,
      external_id: String(row.externalId).slice(0, 160),
      occurred_at: isoOrNow(row.occurredAt),
      test_id: row.testId || null,
      summary: row.summary || {},
      payload: summaryPayload(row)
    }) : null);

    const upserts = [
      ["zone_runs?on_conflict=user_id,external_id", zoneRuns],
      ["capacity_sessions?on_conflict=user_id,external_id", capacitySessions],
      ["reasoning_sessions?on_conflict=user_id,external_id", reasoningSessions],
      ["test_results?on_conflict=user_id,external_id", testResults]
    ];
    for (const [path, rows] of upserts) {
      if (!rows.length) continue;
      await supabaseRest(env, path, {
        method: "POST",
        headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(rows)
      });
    }

    return json({ ok: true, snapshots: snapshots.length });
  } catch (error) {
    return json({ error: error.message || "request_failed" }, 500);
  }
}
