import { normalizeZoneState } from "./classifier.js";
import { buildZoneHandoff, uiStateLabel } from "./handoff.js";

const STORAGE_KEY = "tg_iq_basic_zone_runtime_v1";
const HISTORY_LIMIT = 24;

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeParse(raw) {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeSummary(summary) {
  if (!isObject(summary) || typeof summary.sessionId !== "string") {
    return null;
  }
  return {
    sessionId: summary.sessionId,
    timestamp: Number.isFinite(summary.timestamp) ? Math.round(summary.timestamp) : Date.now(),
    valid: summary.valid === true,
    invalidReason: typeof summary.invalidReason === "string" ? summary.invalidReason : null,
    state: normalizeZoneState(summary.state),
    confidence: summary.confidence === "High" || summary.confidence === "Medium" ? summary.confidence : "Low",
    reasons: Array.isArray(summary.reasons) ? summary.reasons.filter((value) => typeof value === "string") : [],
    bitsPerSecond: Number.isFinite(summary.bitsPerSecond) ? Number(summary.bitsPerSecond) : null,
    timing: isObject(summary.timing) ? {
      frameMs: Number.isFinite(summary.timing.frameMs) ? Number(summary.timing.frameMs) : null,
      hz: Number.isFinite(summary.timing.hz) ? Number(summary.timing.hz) : null,
      droppedFrac: Number.isFinite(summary.timing.droppedFrac) ? Number(summary.timing.droppedFrac) : null
    } : { frameMs: null, hz: null, droppedFrac: null },
    probeDurFrames: isObject(summary.probeDurFrames) ? {
      easy: Number.isFinite(summary.probeDurFrames.easy) ? Math.round(summary.probeDurFrames.easy) : null,
      hard: Number.isFinite(summary.probeDurFrames.hard) ? Math.round(summary.probeDurFrames.hard) : null,
      catch: Number.isFinite(summary.probeDurFrames.catch) ? Math.round(summary.probeDurFrames.catch) : null
    } : null,
    features: isObject(summary.features) ? summary.features : {},
    counts: isObject(summary.counts) ? summary.counts : {},
    baselines: isObject(summary.baselines) ? summary.baselines : {},
    scores: isObject(summary.scores) ? summary.scores : null
  };
}

function normalizeHandoff(handoff) {
  if (!isObject(handoff) || typeof handoff.sessionId !== "string") {
    return null;
  }
  const fallback = buildZoneHandoff({
    sessionId: handoff.sessionId,
    state: handoff.state,
    confidence: handoff.confidence,
    bitsPerSecond: handoff.bitsPerSecond,
    timestamp: handoff.timestamp
  });
  return {
    ...fallback,
    freshForSession: handoff.freshForSession !== false,
    recommendation: typeof handoff.recommendation === "string" ? handoff.recommendation : fallback.recommendation,
    uiState: typeof handoff.uiState === "string" ? handoff.uiState : uiStateLabel(handoff.state),
    capacityPlan: isObject(handoff.capacityPlan) ? {
      ...fallback.capacityPlan,
      ...handoff.capacityPlan
    } : fallback.capacityPlan
  };
}

function createDefaultState() {
  return {
    version: 1,
    history: [],
    latestSummary: null,
    latestHandoff: null
  };
}

function normalizeState(raw) {
  if (!isObject(raw) || raw.version !== 1) {
    return createDefaultState();
  }
  return {
    version: 1,
    history: Array.isArray(raw.history) ? raw.history.map(normalizeSummary).filter(Boolean).slice(-HISTORY_LIMIT) : [],
    latestSummary: normalizeSummary(raw.latestSummary),
    latestHandoff: normalizeHandoff(raw.latestHandoff)
  };
}

function persist(nextState) {
  const normalized = normalizeState(nextState);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function loadZoneRuntimeState() {
  if (typeof localStorage === "undefined") {
    return createDefaultState();
  }
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY));
  const state = normalizeState(parsed);
  if (!parsed || parsed.version !== 1) {
    persist(state);
  }
  return state;
}

export function saveZoneRun(summary, handoff) {
  const state = loadZoneRuntimeState();
  const normalizedSummary = normalizeSummary(summary);
  const normalizedHandoff = normalizeHandoff(handoff);
  if (!normalizedSummary) {
    return state;
  }
  return persist({
    ...state,
    history: [...state.history.filter((entry) => entry.sessionId !== normalizedSummary.sessionId), normalizedSummary].slice(-HISTORY_LIMIT),
    latestSummary: normalizedSummary,
    latestHandoff: normalizedHandoff
  });
}

export function loadLatestZoneHandoff() {
  return loadZoneRuntimeState().latestHandoff;
}
