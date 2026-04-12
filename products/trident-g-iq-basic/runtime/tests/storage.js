const STORAGE_KEY = "tg_iq_basic_tests_runtime_v1";
const HISTORY_LIMIT = 48;

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

function normalizeRun(run) {
  if (!isObject(run) || typeof run.runId !== "string" || typeof run.testId !== "string") {
    return null;
  }
  return {
    runId: run.runId,
    testId: run.testId,
    label: typeof run.label === "string" ? run.label : run.testId,
    mode: typeof run.mode === "string" ? run.mode : "unknown",
    startedAt: Number.isFinite(run.startedAt) ? Math.round(run.startedAt) : Date.now(),
    finishedAt: Number.isFinite(run.finishedAt) ? Math.round(run.finishedAt) : Date.now(),
    status: run.status === "complete" ? "complete" : "complete",
    zoneSnapshot: isObject(run.zoneSnapshot) ? run.zoneSnapshot : null,
    result: isObject(run.result) ? run.result : {}
  };
}

function createDefaultState() {
  return {
    version: 1,
    runs: [],
    profile: {
      usesAi: null
    }
  };
}

function normalizeState(raw) {
  if (!isObject(raw) || raw.version !== 1) {
    return createDefaultState();
  }
  return {
    version: 1,
    runs: Array.isArray(raw.runs) ? raw.runs.map(normalizeRun).filter(Boolean).slice(-HISTORY_LIMIT) : [],
    profile: {
      usesAi:
        raw.profile?.usesAi === true ? true : raw.profile?.usesAi === false ? false : null
    }
  };
}

function persist(state) {
  const normalized = normalizeState(state);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function loadTestsRuntimeState() {
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

export function saveCompletedTestRun(run) {
  const state = loadTestsRuntimeState();
  const normalizedRun = normalizeRun(run);
  if (!normalizedRun) {
    return state;
  }
  return persist({
    ...state,
    runs: [...state.runs.filter((entry) => entry.runId !== normalizedRun.runId), normalizedRun].slice(-HISTORY_LIMIT)
  });
}

export function saveTestsProfile(profilePatch) {
  const state = loadTestsRuntimeState();
  const nextProfile = {
    ...state.profile,
    ...profilePatch
  };
  return persist({
    ...state,
    profile: {
      usesAi: nextProfile.usesAi === true ? true : nextProfile.usesAi === false ? false : null
    }
  });
}

export function clearTestsRuntimeState() {
  return persist(createDefaultState());
}
