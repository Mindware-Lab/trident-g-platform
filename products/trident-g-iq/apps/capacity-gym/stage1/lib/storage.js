export const STORAGE_KEY = "tg_capacity_gym_v1";
const HISTORY_LIMIT = 200;

function makeDefaultState() {
  return {
    version: 1,
    settings: {
      lastWrapper: null,
      lastSpeed: null,
      lastInterference: null,
      soundOn: true
    },
    history: [],
    bankUnits: 0,
    unlocks: {
      hub_noncat: true,
      transitive: false,
      graph: false,
      propositional: false
    },
    missionsByDate: {}
  };
}

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

function normalizeState(raw) {
  const defaults = makeDefaultState();
  if (!isObject(raw) || raw.version !== 1) {
    return defaults;
  }

  return {
    version: 1,
    settings: {
      ...defaults.settings,
      ...(isObject(raw.settings) ? raw.settings : {})
    },
    history: Array.isArray(raw.history) ? raw.history.slice(0, HISTORY_LIMIT) : [],
    bankUnits: Number.isFinite(raw.bankUnits) ? raw.bankUnits : 0,
    unlocks: {
      ...defaults.unlocks,
      ...(isObject(raw.unlocks) ? raw.unlocks : {})
    },
    missionsByDate: isObject(raw.missionsByDate) ? raw.missionsByDate : {}
  };
}

export function loadGymState() {
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY));
  const state = normalizeState(parsed);
  if (!parsed || parsed.version !== 1) {
    saveGymState(state);
  }
  return state;
}

export function saveGymState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

export function appendSessionSummary(summary) {
  const state = loadGymState();
  const nextHistory = [summary, ...state.history].slice(0, HISTORY_LIMIT);
  saveGymState({
    ...state,
    history: nextHistory
  });
}

export function getSessionHistory() {
  const state = loadGymState();
  return state.history.slice().sort((a, b) => Number(b.tsStart || 0) - Number(a.tsStart || 0));
}

export function updateSettings(patch) {
  const state = loadGymState();
  saveGymState({
    ...state,
    settings: {
      ...state.settings,
      ...(isObject(patch) ? patch : {})
    }
  });
}

export function exportGymStateJson() {
  const state = loadGymState();
  return JSON.stringify(state, null, 2);
}

export function resetGymState() {
  localStorage.removeItem(STORAGE_KEY);
  const defaults = makeDefaultState();
  saveGymState(defaults);
  return defaults;
}
