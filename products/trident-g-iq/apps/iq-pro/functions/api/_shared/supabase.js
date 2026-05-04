export function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export function readBearer(request) {
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : "";
}

export function requiredEnv(env, key) {
  const value = env[key];
  if (!value) throw new Error(`Missing ${key}`);
  return value;
}

export async function getUser(request, env) {
  const token = readBearer(request);
  if (!token) return null;
  const supabaseUrl = requiredEnv(env, "SUPABASE_URL");
  const anonKey = requiredEnv(env, "SUPABASE_ANON_KEY");
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "apikey": anonKey
    }
  });
  if (!response.ok) return null;
  return response.json();
}

export async function supabaseRest(env, path, init = {}) {
  const supabaseUrl = requiredEnv(env, "SUPABASE_URL");
  const serviceKey = requiredEnv(env, "SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${serviceKey}`,
      "apikey": serviceKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Prefer": "return=representation",
      ...(init.headers || {})
    }
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const detail = payload?.message || payload?.hint || response.statusText;
    throw new Error(detail);
  }
  return payload;
}

export function sanitizeEventType(value) {
  return String(value || "").trim().replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 80) || "event";
}

export function sanitizeDomain(value) {
  const domain = String(value || "").trim();
  return ["capacity", "zone", "tracker", "reasoning", "economy", "coach", "activeModule"].includes(domain)
    ? domain
    : "";
}

export function isoOrNow(value) {
  const time = Date.parse(value || "");
  return Number.isFinite(time) ? new Date(time).toISOString() : new Date().toISOString();
}
