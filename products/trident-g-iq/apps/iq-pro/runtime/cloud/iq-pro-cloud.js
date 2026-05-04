import { createClient } from "@supabase/supabase-js";

const DEVICE_KEY = "tg_iq_pro_device_id_v1";
const SYNC_QUEUE_KEY = "tg_iq_pro_sync_queue_v1";
const SYNC_META_KEY = "tg_iq_pro_sync_meta_v1";
const LOCAL_DEMO_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const DOMAINS = Object.freeze({
  capacity: "tg_iq_live_capacity_v2",
  zone: "tg_iq_basic_zone_runtime_v1",
  tracker: "tg_iq_tracker_v1",
  reasoning: "tg_iq_live_reasoning_v1",
  economy: "tg_iq_live_economy_v1",
  coach: "tg_iq_live_unified_coach_v1",
  activeModule: "tg_iq_live_active_module_v1"
});

const state = {
  configured: false,
  ready: false,
  localDemo: false,
  deviceId: "",
  session: null,
  profile: null,
  entitlements: [],
  supabase: null,
  flushTimer: 0
};

function safeParse(raw, fallback = null) {
  if (!raw || typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return "{}";
  }
}

function env(name, fallback = "") {
  return String(import.meta.env[name] || fallback);
}

function isLocalhost() {
  return LOCAL_DEMO_HOSTS.has(window.location.hostname);
}

function isTruthy(value) {
  return value === true || value === "true" || value === "1";
}

function ensureDeviceId() {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const id = `device_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(DEVICE_KEY, id);
  return id;
}

function loadQueue() {
  const parsed = safeParse(localStorage.getItem(SYNC_QUEUE_KEY), []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveQueue(queue) {
  localStorage.setItem(SYNC_QUEUE_KEY, safeStringify(queue.slice(-200)));
}

function loadMeta() {
  const parsed = safeParse(localStorage.getItem(SYNC_META_KEY), {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function saveMeta(meta) {
  localStorage.setItem(SYNC_META_KEY, safeStringify(meta));
}

function readDomain(domain) {
  const key = DOMAINS[domain];
  if (!key) return null;
  const raw = localStorage.getItem(key);
  if (domain === "activeModule") return raw || "";
  return safeParse(raw, null);
}

function writeDomain(domain, payload, syncedAt) {
  const key = DOMAINS[domain];
  if (!key) return;
  if (domain === "activeModule") {
    localStorage.setItem(key, typeof payload === "string" ? payload : "capacity");
  } else {
    localStorage.setItem(key, safeStringify(payload));
  }
  const meta = loadMeta();
  meta[domain] = { updatedAt: Date.now(), syncedAt: syncedAt || new Date().toISOString() };
  saveMeta(meta);
}

function localPayloadEmpty(domain, payload) {
  if (!payload) return true;
  if (domain === "activeModule") return !payload;
  if (Array.isArray(payload.history) && payload.history.length) return false;
  if (Array.isArray(payload.entries) && payload.entries.length) return false;
  if (payload.active || payload.lastCompleted) return false;
  if (Number(payload.walletG || 0) > 0) return false;
  return true;
}

function currentSnapshot(domain, reason) {
  const key = DOMAINS[domain];
  if (!key) return null;
  const payload = readDomain(domain);
  if (payload == null || payload === "") return null;
  const meta = loadMeta();
  return {
    domain,
    storageKey: key,
    deviceId: state.deviceId,
    localUpdatedAt: new Date().toISOString(),
    reason: reason || "save",
    payload,
    meta: meta[domain] || {}
  };
}

function compactCapacitySession(entry) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry.id || entry.sessionId || entry.tsEnd || entry.tsStart || "");
  if (!id) return null;
  return {
    externalId: id,
    occurredAt: new Date(Number(entry.tsEnd || entry.tsStart || Date.now())).toISOString(),
    mode: entry.rewardMode || entry.routeClass || entry.mode || null,
    summary: {
      wrapper: entry.wrapper,
      routeClass: entry.routeClass,
      n: entry.n,
      accuracy: entry.block?.accuracy ?? entry.accuracy ?? null,
      transferScore: entry.transferScore?.total ?? null,
      rewardState: entry.rewardState || null
    },
    payload: entry
  };
}

function compactZoneRun(entry) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry.sessionId || "");
  if (!id) return null;
  return {
    externalId: id,
    occurredAt: new Date(Number(entry.timestamp || Date.now())).toISOString(),
    state: entry.state || null,
    confidence: entry.confidence || null,
    valid: entry.valid === true,
    summary: {
      bitsPerSecond: entry.bitsPerSecond ?? null,
      invalidReason: entry.invalidReason || null,
      scores: entry.scores || null
    },
    payload: entry
  };
}

function compactReasoningSession(entry) {
  if (!entry || typeof entry !== "object" || entry.type === "session_abandoned") return null;
  const id = String(entry.id || entry.sessionId || entry.tsEnd || "");
  if (!id) return null;
  return {
    externalId: id,
    occurredAt: new Date(Number(entry.tsEnd || entry.updatedAt || entry.startedAt || Date.now())).toISOString(),
    family: entry.family || null,
    routeClass: entry.routeClass || null,
    summary: {
      accuracy: entry.accuracy ?? null,
      transferScore: entry.transferScore?.total ?? null,
      tier: entry.tier ?? null,
      blocksCompleted: entry.blocksCompleted ?? null
    },
    payload: entry
  };
}

function compactTestResult(entry) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry.id || entry.ts || "");
  if (!id) return null;
  return {
    externalId: id,
    occurredAt: new Date(Number(entry.ts || Date.now())).toISOString(),
    testId: entry.testId || null,
    summary: entry.result || {},
    payload: entry
  };
}

function summariesForSnapshot(snapshot) {
  const payload = snapshot.payload || {};
  if (snapshot.domain === "capacity") {
    return { capacitySessions: (payload.history || []).map(compactCapacitySession).filter(Boolean) };
  }
  if (snapshot.domain === "zone") {
    return { zoneRuns: (payload.history || []).map(compactZoneRun).filter(Boolean) };
  }
  if (snapshot.domain === "reasoning") {
    return { reasoningSessions: (payload.history || []).map(compactReasoningSession).filter(Boolean) };
  }
  if (snapshot.domain === "tracker") {
    return { testResults: (payload.entries || []).map(compactTestResult).filter(Boolean) };
  }
  return {};
}

function mergeSummaries(target, source) {
  for (const [key, rows] of Object.entries(source)) {
    if (!Array.isArray(rows) || !rows.length) continue;
    target[key] = [...(target[key] || []), ...rows].slice(-180);
  }
}

async function authedFetch(path, options = {}) {
  if (!state.session?.access_token) {
    return { ok: false, reason: "not_signed_in" };
  }
  const response = await fetch(path, {
    ...options,
    headers: {
      "Authorization": `Bearer ${state.session.access_token}`,
      "Accept": "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, payload };
}

function activeBundleIds() {
  return state.entitlements
    .filter((row) => row && row.status === "active" && row.bundle_id)
    .map((row) => row.bundle_id);
}

function hasCommercialAccess() {
  const required = env("VITE_IQ_PRO_REQUIRED_BUNDLE", "iq_pro");
  const accepted = new Set([required, "iq_pro", "performance_bundle", "cohort_bundle", "premium_1to1"]);
  return activeBundleIds().some((bundleId) => accepted.has(bundleId));
}

function removeOverlay(id) {
  const node = document.getElementById(id);
  if (node) node.remove();
}

function ensureOverlayStyle() {
  if (document.getElementById("iq-pro-cloud-style")) return;
  const style = document.createElement("style");
  style.id = "iq-pro-cloud-style";
  style.textContent = [
    ".iq-pro-cloud-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,11,16,.78);color:#f4f8ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;}",
    ".iq-pro-cloud-card{width:min(520px,calc(100% - 24px));border:1px solid rgba(255,255,255,.16);border-radius:14px;background:rgba(15,18,26,.97);box-shadow:0 18px 44px rgba(0,0,0,.45);padding:18px;}",
    ".iq-pro-cloud-card h2{margin:0;font-size:1.22rem;letter-spacing:0;}",
    ".iq-pro-cloud-card p{margin:9px 0 0;color:#dbe4f4;line-height:1.45;}",
    ".iq-pro-cloud-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px;}",
    ".iq-pro-cloud-row input{flex:1 1 230px;min-height:42px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:#1d2230;color:#f4f8ff;padding:9px 10px;font-size:14px;}",
    ".iq-pro-cloud-row label{display:flex;align-items:center;gap:8px;color:#dbe4f4;font-size:.92rem;}",
    ".iq-pro-cloud-row button{min-height:42px;border-radius:10px;border:1px solid #ccff66;background:#ccff66;color:#0b0b0d;font-weight:800;padding:9px 12px;cursor:pointer;}",
    ".iq-pro-cloud-row button.secondary{border-color:rgba(255,255,255,.24);background:#252b3a;color:#f4f8ff;}",
    ".iq-pro-cloud-status{min-height:18px;margin-top:10px;color:#ffb3c8;font-size:.86rem;}",
    ".iq-pro-cloud-meta{margin-top:10px;color:#93a0b4;font-size:.8rem;}"
  ].join("");
  document.head.appendChild(style);
}

function renderAuthOverlay(message = "") {
  ensureOverlayStyle();
  removeOverlay("iq-pro-cloud-overlay");
  const overlay = document.createElement("div");
  overlay.id = "iq-pro-cloud-overlay";
  overlay.className = "iq-pro-cloud-overlay";
  overlay.innerHTML = [
    '<section class="iq-pro-cloud-card" role="dialog" aria-modal="true" aria-labelledby="iqProCloudTitle">',
    '<h2 id="iqProCloudTitle">Sign in to Trident G IQ Pro</h2>',
    '<p>Enter your email and use the secure sign-in link to unlock cloud sync and paid access.</p>',
    '<div class="iq-pro-cloud-row">',
    '<input id="iqProEmailInput" type="email" autocomplete="email" placeholder="you@example.com">',
    '<button id="iqProEmailButton" type="button">Send link</button>',
    '</div>',
    '<div id="iqProCloudStatus" class="iq-pro-cloud-status"></div>',
    state.localDemo ? '<div class="iq-pro-cloud-row"><button id="iqProLocalDemoButton" class="secondary" type="button">Continue local demo</button></div>' : "",
    '<div class="iq-pro-cloud-meta">Progress remains local until you sign in.</div>',
    '</section>'
  ].join("");
  document.body.appendChild(overlay);
  const status = overlay.querySelector("#iqProCloudStatus");
  if (message) status.textContent = message;
  overlay.querySelector("#iqProEmailButton")?.addEventListener("click", async () => {
    const email = overlay.querySelector("#iqProEmailInput")?.value || "";
    if (!email.trim()) {
      status.textContent = "Enter an email address.";
      return;
    }
    const { error } = await state.supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.href }
    });
    status.textContent = error ? error.message : "Check your email for the sign-in link.";
  });
  overlay.querySelector("#iqProLocalDemoButton")?.addEventListener("click", () => removeOverlay("iq-pro-cloud-overlay"));
}

function renderAccessOverlay() {
  ensureOverlayStyle();
  removeOverlay("iq-pro-cloud-overlay");
  const overlay = document.createElement("div");
  overlay.id = "iq-pro-cloud-overlay";
  overlay.className = "iq-pro-cloud-overlay";
  overlay.innerHTML = [
    '<section class="iq-pro-cloud-card" role="dialog" aria-modal="true" aria-labelledby="iqProAccessTitle">',
    '<h2 id="iqProAccessTitle">IQ Pro access required</h2>',
    '<p>Your account is signed in, but it does not currently have an active Trident G IQ Pro entitlement.</p>',
    '<div class="iq-pro-cloud-row">',
    '<button id="iqProRefreshAccessButton" type="button">Refresh access</button>',
    '<button id="iqProSignOutButton" class="secondary" type="button">Sign out</button>',
    '</div>',
    '<div class="iq-pro-cloud-meta">Purchases and refunds update access through Stripe webhooks.</div>',
    '</section>'
  ].join("");
  document.body.appendChild(overlay);
  overlay.querySelector("#iqProRefreshAccessButton")?.addEventListener("click", refreshAccount);
  overlay.querySelector("#iqProSignOutButton")?.addEventListener("click", async () => {
    await state.supabase.auth.signOut();
    window.location.reload();
  });
}

function renderConfigOverlay() {
  ensureOverlayStyle();
  const overlay = document.createElement("div");
  overlay.id = "iq-pro-cloud-overlay";
  overlay.className = "iq-pro-cloud-overlay";
  overlay.innerHTML = [
    '<section class="iq-pro-cloud-card" role="dialog" aria-modal="true">',
    "<h2>Cloud configuration missing</h2>",
    "<p>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for commercial access and sync.</p>",
    state.localDemo ? '<div class="iq-pro-cloud-row"><button id="iqProLocalDemoButton" class="secondary" type="button">Continue local demo</button></div>' : "",
    "</section>"
  ].join("");
  document.body.appendChild(overlay);
  overlay.querySelector("#iqProLocalDemoButton")?.addEventListener("click", () => removeOverlay("iq-pro-cloud-overlay"));
}

async function refreshAccount() {
  if (!state.supabase) return;
  const sessionResult = await state.supabase.auth.getSession();
  state.session = sessionResult.data.session || null;
  if (!state.session) {
    renderAuthOverlay();
    return;
  }
  const response = await authedFetch("/api/me");
  if (response.ok) {
    state.profile = response.payload.profile || null;
    state.entitlements = response.payload.entitlements || [];
  }
  if (!hasCommercialAccess()) {
    renderAccessOverlay();
    return;
  }
  removeOverlay("iq-pro-cloud-overlay");
  await pullRemoteSnapshots();
  queueAllIqProSync("account_refresh");
}

async function pullRemoteSnapshots() {
  const response = await authedFetch("/api/sync/pull");
  if (!response.ok) return;
  const snapshots = Array.isArray(response.payload.snapshots) ? response.payload.snapshots : [];
  for (const row of snapshots) {
    const domain = row.domain;
    if (!DOMAINS[domain]) continue;
    const local = readDomain(domain);
    if (localPayloadEmpty(domain, local)) {
      writeDomain(domain, row.payload, row.updated_at);
    }
  }
}

export function queueIqProSync(domain, reason = "save") {
  if (!DOMAINS[domain]) return;
  const snapshot = currentSnapshot(domain, reason);
  if (!snapshot) return;
  const queue = loadQueue().filter((row) => !(row.domain === domain && row.deviceId === state.deviceId));
  queue.push(snapshot);
  saveQueue(queue);
  scheduleFlush();
}

export function queueAllIqProSync(reason = "bulk") {
  Object.keys(DOMAINS).forEach((domain) => queueIqProSync(domain, reason));
}

export async function postIqProEvent(eventType, payload = {}) {
  if (!state.session) return { ok: false, reason: "not_signed_in" };
  return authedFetch("/api/events", {
    method: "POST",
    body: JSON.stringify({ eventType, appId: "iq_pro", payload })
  });
}

function scheduleFlush() {
  if (state.flushTimer) window.clearTimeout(state.flushTimer);
  state.flushTimer = window.setTimeout(flushSyncQueue, 1200);
}

async function flushSyncQueue() {
  if (!state.session || !hasCommercialAccess()) return;
  const queue = loadQueue();
  if (!queue.length) return;
  const summaries = {};
  queue.forEach((snapshot) => mergeSummaries(summaries, summariesForSnapshot(snapshot)));
  const response = await authedFetch("/api/sync/push", {
    method: "POST",
    body: JSON.stringify({
      deviceId: state.deviceId,
      snapshots: queue,
      summaries
    })
  });
  if (response.ok) {
    saveQueue([]);
    const meta = loadMeta();
    queue.forEach((snapshot) => {
      meta[snapshot.domain] = { ...(meta[snapshot.domain] || {}), syncedAt: new Date().toISOString() };
    });
    saveMeta(meta);
  }
}

async function showAccountPanel() {
  ensureOverlayStyle();
  removeOverlay("iq-pro-cloud-overlay");
  const overlay = document.createElement("div");
  overlay.id = "iq-pro-cloud-overlay";
  overlay.className = "iq-pro-cloud-overlay";
  const displayName = state.profile?.display_name || "";
  const leaderboardOptIn = state.profile?.leaderboard_opt_in === true;
  overlay.innerHTML = [
    '<section class="iq-pro-cloud-card" role="dialog" aria-modal="true">',
    "<h2>Account</h2>",
    `<p>${state.session ? "Signed in for cloud sync." : "Not signed in."}</p>`,
    '<div class="iq-pro-cloud-row">',
    `<input id="iqProDisplayNameInput" type="text" maxlength="40" placeholder="Display name" value="${displayName.replace(/"/g, "&quot;")}">`,
    "</div>",
    '<div class="iq-pro-cloud-row">',
    `<label><input id="iqProLeaderboardOptIn" type="checkbox"${leaderboardOptIn ? " checked" : ""}> Opt in to future pseudonymous leaderboards</label>`,
    "</div>",
    '<div class="iq-pro-cloud-row">',
    '<button id="iqProSaveProfileButton" type="button">Save profile</button>',
    '<button id="iqProCloseAccountButton" class="secondary" type="button">Close</button>',
    state.session ? '<button id="iqProSignOutAccountButton" class="secondary" type="button">Sign out</button>' : "",
    "</div>",
    '<div id="iqProAccountStatus" class="iq-pro-cloud-status"></div>',
    '<div class="iq-pro-cloud-meta">Data export and deletion requests are routed through support until the admin workflow is live.</div>',
    "</section>"
  ].join("");
  document.body.appendChild(overlay);
  overlay.querySelector("#iqProCloseAccountButton")?.addEventListener("click", () => removeOverlay("iq-pro-cloud-overlay"));
  overlay.querySelector("#iqProSignOutAccountButton")?.addEventListener("click", async () => {
    await state.supabase.auth.signOut();
    window.location.reload();
  });
  overlay.querySelector("#iqProSaveProfileButton")?.addEventListener("click", async () => {
    const status = overlay.querySelector("#iqProAccountStatus");
    if (!state.supabase || !state.session) {
      status.textContent = "Sign in before saving profile settings.";
      return;
    }
    const display_name = overlay.querySelector("#iqProDisplayNameInput")?.value.trim() || null;
    const leaderboard_opt_in = overlay.querySelector("#iqProLeaderboardOptIn")?.checked === true;
    const { error, data } = await state.supabase
      .from("profiles")
      .upsert({ id: state.session.user.id, display_name, leaderboard_opt_in, updated_at: new Date().toISOString() })
      .select()
      .single();
    status.textContent = error ? error.message : "Profile saved.";
    if (!error) state.profile = data;
  });
}

export async function initIqProCloud() {
  state.deviceId = ensureDeviceId();
  state.localDemo = isLocalhost() || isTruthy(env("VITE_IQ_PRO_ALLOW_LOCAL_DEMO", "false"));
  const supabaseUrl = env("VITE_SUPABASE_URL");
  const supabaseAnonKey = env("VITE_SUPABASE_ANON_KEY");
  state.configured = Boolean(supabaseUrl && supabaseAnonKey);

  window.IQProCloud = {
    queueSync: queueIqProSync,
    queueAllSync: queueAllIqProSync,
    postEvent: postIqProEvent,
    showAccount: showAccountPanel,
    flush: flushSyncQueue,
    state
  };

  document.addEventListener("click", (event) => {
    if (event.target?.id === "iqProAccountButton") {
      showAccountPanel();
    }
  });

  if (!state.configured) {
    if (!state.localDemo) renderConfigOverlay();
    state.ready = true;
    return;
  }

  state.supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  state.supabase.auth.onAuthStateChange(() => {
    refreshAccount().catch(() => {});
  });

  await refreshAccount();
  state.ready = true;
}
