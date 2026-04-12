const STORAGE_KEY = "tg_iq_basic_capacity_lab_v2";
const LEGACY_STORAGE_KEY = "tg_iq_basic_capacity_lab_v1";
const HISTORY_LIMIT = 24;
const SESSION_LIMIT = 24;

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

function clampN(value) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.min(7, Math.round(value)));
}

function normalizeWrapper(value) {
  if (value === "relate_angles") {
    return "relate_vectors";
  }
  if (value === "hub_noncat" || value === "hub_concept" || value === "and_cat" || value === "and_noncat" || value === "resist_vectors" || value === "resist_words" || value === "resist_concept" || value === "emotion_faces" || value === "emotion_words" || value === "relate_vectors" || value === "relate_numbers" || value === "relate_vectors_dual" || value === "relate_numbers_dual") {
    return value;
  }
  return "hub_cat";
}

function normalizeTargetModality(wrapper, value) {
  if (wrapper.startsWith("and_")) {
    return "conj";
  }
  if (wrapper === "relate_vectors" || wrapper === "relate_numbers") {
    return value === "sym" ? "sym" : "rel";
  }
  if (wrapper === "relate_vectors_dual" || wrapper === "relate_numbers_dual") {
    return "dual";
  }
  if (wrapper === "resist_vectors") {
    return value === "sym" ? "sym" : "loc";
  }
  if (wrapper === "resist_words") {
    return value === "sym" ? "sym" : "col";
  }
  if (wrapper === "resist_concept") {
    return value === "sym" ? "sym" : "loc";
  }
  if (wrapper === "emotion_faces") {
    return value === "sym" ? "sym" : "loc";
  }
  if (wrapper === "emotion_words") {
    return value === "sym" ? "sym" : "col";
  }
  return value === "col" || value === "sym" ? value : "loc";
}

function createDefaultState() {
  return {
    version: 2,
    settings: {
      wrapper: "hub_cat",
      targetModality: "loc",
      speed: "slow",
      mode: "manual",
      n: 1,
      soundOn: true
    },
    history: [],
    currentSession: null,
    sessionResolutions: []
  };
}

function normalizeHistoryEntry(entry) {
  if (!isObject(entry)) {
    return null;
  }
  const block = isObject(entry.block) ? entry.block : null;
  if (!block || !Number.isFinite(entry.tsStart)) {
    return null;
  }

  const resolvedWrapper = normalizeWrapper(entry.wrapper);
  const resolvedTarget = normalizeTargetModality(resolvedWrapper, entry.targetModality);

  return {
    id: typeof entry.id === "string" ? entry.id : `xor_lab_${entry.tsStart}`,
    tsStart: Math.round(entry.tsStart),
    tsEnd: Number.isFinite(entry.tsEnd) ? Math.round(entry.tsEnd) : Math.round(entry.tsStart),
    sessionId: typeof entry.sessionId === "string" ? entry.sessionId : null,
    zoneState: typeof entry.zoneState === "string" ? entry.zoneState : null,
    routeClass: typeof entry.routeClass === "string" ? entry.routeClass : "core",
    rewardMode: typeof entry.rewardMode === "string" ? entry.rewardMode : "core",
    eligibleForEncoding20: entry.eligibleForEncoding20 === false ? false : true,
    wrapper: resolvedWrapper,
    targetModality: resolvedTarget,
    speed: entry.speed === "fast" ? "fast" : "slow",
    outcomeBand: entry.outcomeBand === "UP" || entry.outcomeBand === "DOWN" ? entry.outcomeBand : "HOLD",
    recommendedN: clampN(entry.recommendedN),
    block: {
      ...block,
      nStart: clampN(block.nStart),
      nEnd: clampN(block.nEnd),
      accuracy: Number.isFinite(block.accuracy) ? block.accuracy : 0,
      meanRtMs: Number.isFinite(block.meanRtMs) ? Math.round(block.meanRtMs) : null
    }
  };
}

function normalizeCurrentSession(session) {
  if (!isObject(session) || typeof session.sessionId !== "string") {
    return null;
  }
  return {
    sessionId: session.sessionId,
    missionRailId: typeof session.missionRailId === "string" ? session.missionRailId : null,
    zoneState: typeof session.zoneState === "string" ? session.zoneState : "invalid",
    uiState: typeof session.uiState === "string" ? session.uiState : "Invalid",
    recommendation: typeof session.recommendation === "string" ? session.recommendation : "defer",
    routeClass: typeof session.routeClass === "string" ? session.routeClass : "support",
    defaultBlocks: Number.isFinite(session.defaultBlocks) ? Math.max(0, Math.round(session.defaultBlocks)) : 0,
    blocksMin: Number.isFinite(session.blocksMin) ? Math.max(0, Math.round(session.blocksMin)) : 0,
    blocksMax: Number.isFinite(session.blocksMax) ? Math.max(0, Math.round(session.blocksMax)) : 0,
    plannedBlocks: Number.isFinite(session.plannedBlocks) ? Math.max(0, Math.round(session.plannedBlocks)) : 0,
    blocksCompleted: Number.isFinite(session.blocksCompleted) ? Math.max(0, Math.round(session.blocksCompleted)) : 0,
    progressionMode: typeof session.progressionMode === "string" ? session.progressionMode : "none",
    swapPolicy: typeof session.swapPolicy === "string" ? session.swapPolicy : "none",
    focusBias: typeof session.focusBias === "string" ? session.focusBias : "stabilise",
    preferredFamilies: Array.isArray(session.preferredFamilies) ? session.preferredFamilies.filter((value) => typeof value === "string") : [],
    blockedFamilies: Array.isArray(session.blockedFamilies) ? session.blockedFamilies.filter((value) => typeof value === "string") : [],
    blockedModes: Array.isArray(session.blockedModes) ? session.blockedModes.filter((value) => typeof value === "string") : [],
    rewardMode: typeof session.rewardMode === "string" ? session.rewardMode : "none",
    eligibleForEncoding20: session.eligibleForEncoding20 === true,
    startedAt: Number.isFinite(session.startedAt) ? Math.round(session.startedAt) : Date.now()
  };
}

function normalizeSessionResolution(resolution) {
  if (!isObject(resolution) || typeof resolution.sessionId !== "string") {
    return null;
  }
  const resolvedClass = resolution.sessionClassResolved === "core" || resolution.sessionClassResolved === "support" || resolution.sessionClassResolved === "recovery"
    ? resolution.sessionClassResolved
    : "support";
  return {
    sessionId: resolution.sessionId,
    countedAsEncoding20: resolution.countedAsEncoding20 === true,
    sessionClassResolved: resolvedClass,
    coreCreditsEarned: Number.isFinite(resolution.coreCreditsEarned) ? Math.max(0, Math.round(resolution.coreCreditsEarned)) : 0,
    supportCreditsEarned: Number.isFinite(resolution.supportCreditsEarned) ? Math.max(0, Math.round(resolution.supportCreditsEarned)) : 0,
    resetCreditsEarned: Number.isFinite(resolution.resetCreditsEarned) ? Math.max(0, Math.round(resolution.resetCreditsEarned)) : 0,
    reasonIfNotCounted: typeof resolution.reasonIfNotCounted === "string" ? resolution.reasonIfNotCounted : null,
    zoneState: typeof resolution.zoneState === "string" ? resolution.zoneState : null,
    rewardMode: typeof resolution.rewardMode === "string" ? resolution.rewardMode : "none",
    blocksPlanned: Number.isFinite(resolution.blocksPlanned) ? Math.max(0, Math.round(resolution.blocksPlanned)) : 0,
    blocksCompleted: Number.isFinite(resolution.blocksCompleted) ? Math.max(0, Math.round(resolution.blocksCompleted)) : 0,
    createdAt: Number.isFinite(resolution.createdAt) ? Math.round(resolution.createdAt) : Date.now()
  };
}

function normalizeState(raw) {
  const defaults = createDefaultState();
  if (!isObject(raw)) {
    return defaults;
  }

  const settings = isObject(raw.settings) ? raw.settings : {};
  const history = Array.isArray(raw.history)
    ? raw.history.map(normalizeHistoryEntry).filter(Boolean).slice(0, HISTORY_LIMIT)
    : [];
  const currentSession = normalizeCurrentSession(raw.currentSession);
  const sessionResolutions = Array.isArray(raw.sessionResolutions)
    ? raw.sessionResolutions.map(normalizeSessionResolution).filter(Boolean).slice(0, SESSION_LIMIT)
    : [];

  return {
    version: 2,
    settings: {
      wrapper: normalizeWrapper(settings.wrapper),
      targetModality: normalizeTargetModality(normalizeWrapper(settings.wrapper), settings.targetModality),
      speed: settings.speed === "fast" ? "fast" : "slow",
      mode: settings.mode === "coach" ? "coach" : "manual",
      n: clampN(settings.n),
      soundOn: settings.soundOn !== false
    },
    history,
    currentSession,
    sessionResolutions
  };
}

function persist(nextState) {
  if (typeof localStorage === "undefined") {
    return nextState;
  }
  const normalized = normalizeState(nextState);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function loadCapacityLabState() {
  if (typeof localStorage === "undefined") {
    return createDefaultState();
  }
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY)) || safeParse(localStorage.getItem(LEGACY_STORAGE_KEY));
  const state = normalizeState(parsed);
  if (!parsed || parsed.version !== 2) {
    persist(state);
  }
  return state;
}

export function updateCapacityLabSettings(patch) {
  const state = loadCapacityLabState();
  return persist({
    ...state,
    settings: {
      ...state.settings,
      ...(isObject(patch) ? patch : {})
    }
  });
}

export function appendCapacityLabHistory(entry) {
  const state = loadCapacityLabState();
  const normalizedEntry = normalizeHistoryEntry(entry);
  if (!normalizedEntry) {
    return state;
  }
  return persist({
    ...state,
    history: [normalizedEntry, ...state.history].slice(0, HISTORY_LIMIT)
  });
}

export function clearCapacityLabHistory() {
  const state = loadCapacityLabState();
  return persist({
    ...state,
    history: [],
    currentSession: null,
    sessionResolutions: []
  });
}

export function updateCapacityLabCurrentSession(session) {
  const state = loadCapacityLabState();
  return persist({
    ...state,
    currentSession: normalizeCurrentSession(session)
  });
}

export function clearCapacityLabCurrentSession() {
  const state = loadCapacityLabState();
  return persist({
    ...state,
    currentSession: null
  });
}

export function appendCapacityLabSessionResolution(resolution) {
  const state = loadCapacityLabState();
  const normalized = normalizeSessionResolution(resolution);
  if (!normalized) {
    return state;
  }
  return persist({
    ...state,
    currentSession: null,
    sessionResolutions: [
      normalized,
      ...state.sessionResolutions.filter((entry) => entry.sessionId !== normalized.sessionId)
    ].slice(0, SESSION_LIMIT)
  });
}
