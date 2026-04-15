import {
  REASONING_MODE_IDS,
  reasoningInitialUnlockedNodeIds
} from "../../content/reasoning/catalog.js";

const STORAGE_KEY = "tg_iq_basic_reasoning_v1";
const HISTORY_LIMIT = 48;
const TELEMETRY_LIMIT = 288;

const PAB_WINDOWS = Object.freeze({
  [REASONING_MODE_IDS.BEST_EXPLANATION]: {
    A: { min: 1, max: 2, label: "PAB 1-2" },
    B: { min: 2, max: 2, label: "PAB 2" },
    C: { min: 3, max: 3, label: "PAB 3" },
    D: { min: 3, max: 4, label: "PAB 3-4" }
  },
  [REASONING_MODE_IDS.BEST_NEXT_CHECK]: {
    A: { min: 2, max: 2, label: "PAB 2" },
    B: { min: 2, max: 3, label: "PAB 2-3" },
    C: { min: 3, max: 4, label: "PAB 3-4" }
  }
});

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

function getWindow(modeId, band) {
  return PAB_WINDOWS[modeId]?.[band] || PAB_WINDOWS[modeId]?.A || { min: 1, max: 1, label: "PAB 1" };
}

function normalizeBand(modeId, value) {
  const windows = PAB_WINDOWS[modeId];
  if (typeof value === "string" && Object.hasOwn(windows || {}, value)) {
    return value;
  }
  return "A";
}

function createEmptySummary() {
  return {
    accuracy: null,
    meanRtMs: null,
    lastRoundCredits: 0,
    lastRoundAt: null,
    highestBandReached: null,
    currentRelationLoad: null,
    highestStableRelationLoad: null,
    processProfile: null,
    wrapperMix: null,
    roundsCompleted: 0
  };
}

function createModeState(modeId) {
  const band = "A";
  return {
    currentBand: band,
    streaks: {
      bandBUnlockStreak: 0,
      wrapperMixBandBStreak: 0
    },
    wrapperMixUnlocked: false,
    currentPabWindow: getWindow(modeId, band),
    highestStablePab: 0,
    creditScore: 0,
    highestBandReached: band
  };
}

function createDefaultState() {
  return {
    version: 1,
    launcher: {
      selectedFamilyId: "probe",
      selectedModeId: REASONING_MODE_IDS.BEST_EXPLANATION,
      launchMode: "coach",
      recommendedFamilyId: null,
      recommendedModeId: null
    },
    unlockedNodeIds: [...reasoningInitialUnlockedNodeIds],
    perMode: {
      [REASONING_MODE_IDS.BEST_EXPLANATION]: createModeState(REASONING_MODE_IDS.BEST_EXPLANATION),
      [REASONING_MODE_IDS.BEST_NEXT_CHECK]: createModeState(REASONING_MODE_IDS.BEST_NEXT_CHECK)
    },
    currentRound: null,
    roundHistory: [],
    telemetry: [],
    summaryByMode: {
      [REASONING_MODE_IDS.BEST_EXPLANATION]: createEmptySummary(),
      [REASONING_MODE_IDS.BEST_NEXT_CHECK]: createEmptySummary()
    }
  };
}

function normalizeLauncher(raw) {
  return {
    selectedFamilyId: typeof raw?.selectedFamilyId === "string" ? raw.selectedFamilyId : "probe",
    selectedModeId: typeof raw?.selectedModeId === "string" ? raw.selectedModeId : REASONING_MODE_IDS.BEST_EXPLANATION,
    launchMode: raw?.launchMode === "manual" ? "manual" : "coach",
    recommendedFamilyId: typeof raw?.recommendedFamilyId === "string" ? raw.recommendedFamilyId : null,
    recommendedModeId: typeof raw?.recommendedModeId === "string" ? raw.recommendedModeId : null
  };
}

function normalizeModeState(modeId, raw) {
  const band = normalizeBand(modeId, raw?.currentBand);
  const window = getWindow(modeId, band);
  const highestStablePab = Number.isFinite(raw?.highestStablePab) ? Math.max(0, Math.round(raw.highestStablePab)) : 0;
  return {
    currentBand: band,
    streaks: {
      bandBUnlockStreak: Number.isFinite(raw?.streaks?.bandBUnlockStreak) ? Math.max(0, Math.round(raw.streaks.bandBUnlockStreak)) : 0,
      wrapperMixBandBStreak: Number.isFinite(raw?.streaks?.wrapperMixBandBStreak) ? Math.max(0, Math.round(raw.streaks.wrapperMixBandBStreak)) : 0
    },
    wrapperMixUnlocked: raw?.wrapperMixUnlocked === true,
    currentPabWindow: isObject(raw?.currentPabWindow)
      ? {
          min: Number.isFinite(raw.currentPabWindow.min) ? Math.round(raw.currentPabWindow.min) : window.min,
          max: Number.isFinite(raw.currentPabWindow.max) ? Math.round(raw.currentPabWindow.max) : window.max,
          label: typeof raw.currentPabWindow.label === "string" ? raw.currentPabWindow.label : window.label
        }
      : window,
    highestStablePab,
    creditScore: Number.isFinite(raw?.creditScore) ? Math.max(0, Math.round(raw.creditScore)) : 0,
    highestBandReached: normalizeBand(modeId, raw?.highestBandReached || band)
  };
}

function normalizeRound(round) {
  if (!isObject(round) || typeof round.roundId !== "string" || typeof round.modeId !== "string") {
    return null;
  }
  return round;
}

function normalizeTelemetryEntry(entry) {
  if (!isObject(entry) || typeof entry.item_id !== "string" || typeof entry.game_mode !== "string") {
    return null;
  }
  return entry;
}

function normalizeRoundSummary(summary) {
  if (!isObject(summary) || typeof summary.roundId !== "string" || typeof summary.modeId !== "string") {
    return null;
  }
  return summary;
}

function normalizeSummary(raw) {
  if (!isObject(raw)) {
    return createEmptySummary();
  }
  return {
    accuracy: Number.isFinite(raw.accuracy) ? raw.accuracy : null,
    meanRtMs: Number.isFinite(raw.meanRtMs) ? Math.round(raw.meanRtMs) : null,
    lastRoundCredits: Number.isFinite(raw.lastRoundCredits) ? Math.max(0, Math.round(raw.lastRoundCredits)) : 0,
    lastRoundAt: Number.isFinite(raw.lastRoundAt) ? Math.round(raw.lastRoundAt) : null,
    highestBandReached: typeof raw.highestBandReached === "string" ? raw.highestBandReached : null,
    currentRelationLoad: typeof raw.currentRelationLoad === "string" ? raw.currentRelationLoad : null,
    highestStableRelationLoad: typeof raw.highestStableRelationLoad === "string" ? raw.highestStableRelationLoad : null,
    processProfile: isObject(raw.processProfile) ? raw.processProfile : null,
    wrapperMix: typeof raw.wrapperMix === "string" ? raw.wrapperMix : null,
    roundsCompleted: Number.isFinite(raw.roundsCompleted) ? Math.max(0, Math.round(raw.roundsCompleted)) : 0
  };
}

function normalizeState(raw) {
  if (!isObject(raw) || raw.version !== 1) {
    return createDefaultState();
  }

  return {
    version: 1,
    launcher: normalizeLauncher(raw.launcher),
    unlockedNodeIds: Array.isArray(raw.unlockedNodeIds)
      ? raw.unlockedNodeIds.filter((value) => typeof value === "string")
      : [...reasoningInitialUnlockedNodeIds],
    perMode: {
      [REASONING_MODE_IDS.BEST_EXPLANATION]: normalizeModeState(REASONING_MODE_IDS.BEST_EXPLANATION, raw.perMode?.[REASONING_MODE_IDS.BEST_EXPLANATION]),
      [REASONING_MODE_IDS.BEST_NEXT_CHECK]: normalizeModeState(REASONING_MODE_IDS.BEST_NEXT_CHECK, raw.perMode?.[REASONING_MODE_IDS.BEST_NEXT_CHECK])
    },
    currentRound: normalizeRound(raw.currentRound),
    roundHistory: Array.isArray(raw.roundHistory)
      ? raw.roundHistory.map(normalizeRoundSummary).filter(Boolean).slice(-HISTORY_LIMIT)
      : [],
    telemetry: Array.isArray(raw.telemetry)
      ? raw.telemetry.map(normalizeTelemetryEntry).filter(Boolean).slice(-TELEMETRY_LIMIT)
      : [],
    summaryByMode: {
      [REASONING_MODE_IDS.BEST_EXPLANATION]: normalizeSummary(raw.summaryByMode?.[REASONING_MODE_IDS.BEST_EXPLANATION]),
      [REASONING_MODE_IDS.BEST_NEXT_CHECK]: normalizeSummary(raw.summaryByMode?.[REASONING_MODE_IDS.BEST_NEXT_CHECK])
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

export function loadReasoningState() {
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

export function saveReasoningState(state) {
  return persist(state);
}

export function clearReasoningState() {
  return persist(createDefaultState());
}
