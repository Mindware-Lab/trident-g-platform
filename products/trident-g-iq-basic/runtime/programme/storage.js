import {
  deriveProgrammeView,
  normalizeMissionRailId
} from "./mission.js";

const STORAGE_KEY = "tg_iq_basic_programme_v1";
const DEFAULT_MISSION_RAIL_ID = "probe";

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

function clampCount(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value));
}

function normalizeZoneClass(value) {
  return value === "core" || value === "support" || value === "recovery"
    ? value
    : null;
}

function createDefaultState() {
  return {
    version: 1,
    programType: "20_session",
    missionRailId: DEFAULT_MISSION_RAIL_ID,
    missionLocked: false,
    coreSessionNumber: 0,
    supportSessionCount: 0,
    resetSessionCount: 0,
    lastZoneClass: null,
    programmeComplete: false,
    programmeCompletedAt: null
  };
}

function normalizeState(raw) {
  const defaults = createDefaultState();
  if (!isObject(raw)) {
    return defaults;
  }

  const coreSessionNumber = Math.max(0, Math.min(20, clampCount(raw.coreSessionNumber)));
  const missionRailId = normalizeMissionRailId(raw.missionRailId) || DEFAULT_MISSION_RAIL_ID;
  const programmeComplete = raw.programmeComplete === true || coreSessionNumber >= 20;

  return {
    version: 1,
    programType: "20_session",
    missionRailId,
    missionLocked: false,
    coreSessionNumber,
    supportSessionCount: clampCount(raw.supportSessionCount),
    resetSessionCount: clampCount(raw.resetSessionCount),
    lastZoneClass: normalizeZoneClass(raw.lastZoneClass),
    programmeComplete,
    programmeCompletedAt: programmeComplete && Number.isFinite(raw.programmeCompletedAt)
      ? Math.round(raw.programmeCompletedAt)
      : (programmeComplete ? Date.now() : null)
  };
}

function withDerivedView(state) {
  return {
    ...state,
    ...deriveProgrammeView(state)
  };
}

function persist(nextState) {
  const normalized = normalizeState(nextState);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }
  return withDerivedView(normalized);
}

export function loadProgrammeState() {
  if (typeof localStorage === "undefined") {
    return withDerivedView(createDefaultState());
  }
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY));
  const state = normalizeState(parsed);
  if (!parsed || parsed.version !== 1 || !normalizeMissionRailId(parsed.missionRailId) || parsed.missionLocked === true) {
    persist(state);
  }
  return withDerivedView(state);
}

export function selectMissionRail(missionRailId) {
  const normalizedMissionRailId = normalizeMissionRailId(missionRailId);
  const state = loadProgrammeState();
  if (!normalizedMissionRailId) {
    return state;
  }
  if (state.missionRailId === normalizedMissionRailId && state.missionLocked === false) {
    return state;
  }
  return persist({
    ...state,
    missionRailId: normalizedMissionRailId,
    missionLocked: false
  });
}

export function recordProgrammeResolution(resolution) {
  const state = loadProgrammeState();
  if (!isObject(resolution)) {
    return state;
  }

  let nextState = {
    ...state,
    lastZoneClass: normalizeZoneClass(resolution.sessionClassResolved)
  };

  if (resolution.countedAsEncoding20 === true) {
    nextState.coreSessionNumber = Math.max(0, Math.min(20, state.coreSessionNumber + 1));
  } else if (resolution.sessionClassResolved === "support" && resolution.rewardMode === "reset_only") {
    nextState.resetSessionCount = state.resetSessionCount + 1;
  } else if (resolution.sessionClassResolved === "support") {
    nextState.supportSessionCount = state.supportSessionCount + 1;
  } else if (resolution.sessionClassResolved === "recovery") {
    nextState.resetSessionCount = state.resetSessionCount + 1;
  }

  if (nextState.coreSessionNumber >= 20 && !state.programmeComplete) {
    nextState.programmeComplete = true;
    nextState.programmeCompletedAt = Number.isFinite(resolution.createdAt) ? Math.round(resolution.createdAt) : Date.now();
  }

  return persist(nextState);
}
