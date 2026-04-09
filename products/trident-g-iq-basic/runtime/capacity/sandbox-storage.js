const STORAGE_KEY = "tg_iq_basic_capacity_lab_v1";
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

function clampN(value) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.min(7, Math.round(value)));
}

function normalizeWrapper(value) {
  if (value === "hub_noncat" || value === "hub_concept" || value === "and_cat" || value === "and_noncat") {
    return value;
  }
  return "hub_cat";
}

function createDefaultState() {
  return {
    version: 1,
    settings: {
      wrapper: "hub_cat",
      targetModality: "loc",
      speed: "slow",
      mode: "manual",
      n: 1,
      soundOn: true
    },
    history: []
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
  const resolvedTarget = resolvedWrapper.startsWith("and_")
    ? "conj"
    : entry.targetModality === "col" || entry.targetModality === "sym" || entry.targetModality === "conj"
      ? entry.targetModality
      : "loc";

  return {
    id: typeof entry.id === "string" ? entry.id : `xor_lab_${entry.tsStart}`,
    tsStart: Math.round(entry.tsStart),
    tsEnd: Number.isFinite(entry.tsEnd) ? Math.round(entry.tsEnd) : Math.round(entry.tsStart),
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

function normalizeState(raw) {
  const defaults = createDefaultState();
  if (!isObject(raw) || raw.version !== 1) {
    return defaults;
  }

  const settings = isObject(raw.settings) ? raw.settings : {};
  const history = Array.isArray(raw.history)
    ? raw.history.map(normalizeHistoryEntry).filter(Boolean).slice(0, HISTORY_LIMIT)
    : [];

  return {
    version: 1,
    settings: {
      wrapper: normalizeWrapper(settings.wrapper),
      targetModality: normalizeWrapper(settings.wrapper).startsWith("and_")
        ? "conj"
        : settings.targetModality === "col" || settings.targetModality === "sym" || settings.targetModality === "conj"
          ? settings.targetModality
          : "loc",
      speed: settings.speed === "fast" ? "fast" : "slow",
      mode: settings.mode === "coach" ? "coach" : "manual",
      n: clampN(settings.n),
      soundOn: settings.soundOn !== false
    },
    history
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
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY));
  const state = normalizeState(parsed);
  if (!parsed || parsed.version !== 1) {
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
    history: []
  });
}
