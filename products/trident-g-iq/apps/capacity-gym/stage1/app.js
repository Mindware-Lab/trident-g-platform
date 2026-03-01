import {
  appendSessionSummary,
  exportGymStateJson,
  getSessionHistory,
  loadGymState,
  saveGymState,
  resetGymState,
  updateSettings
} from "./lib/storage.js";
import {
  HUB_BASE_TRIALS,
  HUB_WRAPPERS,
  HUB_CUE_MS,
  HUB_N_MAX,
  HUB_TARGET_MODALITIES,
  HUB_TOTAL_BLOCKS,
  createHubBlockPlan,
  createHubBlockTrials,
  createHubSessionSummary,
  isHubMatchAtIndex,
  modalityLabel,
  summarizeHubBlock
} from "./games/hub.js";
import {
  REL_BASE_TRIALS,
  REL_CUE_MS,
  REL_N_MAX,
  REL_QUIZ_TIMEOUT_MS,
  REL_TOTAL_BLOCKS,
  createRelationalBlockPlan,
  createRelationalBlockTrials,
  createRelationalSessionSummary,
  isRelationalMatchAtIndex,
  summarizeRelationalBlock
} from "./games/relational.js";
import { hash32 } from "./lib/rng.js";
import { coachUpdateAfterBlock, relationalCoachUpdateAfterBlock } from "./lib/coach.js";
import { transitiveMode } from "./games/transitive.js";
import { graphMode } from "./games/graph.js";
import { propositionalMode } from "./games/propositional.js";
import { resolvePrimaryScreen } from "./ui/screen-coordinator.js";
import { renderPrimaryScreen } from "./ui/screens.js";
import { buildShellViewModel } from "./ui/view-models.js";

const ROUTES = new Set(["home", "play-hub", "play-relational", "history", "settings"]);
const DEFAULT_ROUTE = "home";
const appRoot = document.querySelector("#app");
const initialState = loadStateWithSyncedUnlocks();
const initialSettings = initialState.settings;

const hubPreferences = {
  wrapper: initialSettings.lastWrapper === "hub_noncat" ? "hub_noncat" : "hub_cat",
  speed: initialSettings.lastSpeed === "fast" ? "fast" : "slow",
  interference: initialSettings.lastInterference === "high" ? "high" : "low"
};
const FIRST_RUN_BASELINE_BLOCK = {
  wrapper: "hub_cat",
  n: 1,
  speed: "slow",
  interference: "low"
};

if (isFirstHubRun(initialState)) {
  hubPreferences.wrapper = FIRST_RUN_BASELINE_BLOCK.wrapper;
  hubPreferences.speed = FIRST_RUN_BASELINE_BLOCK.speed;
  hubPreferences.interference = FIRST_RUN_BASELINE_BLOCK.interference;
}

let flash = "";
let flashKind = "success";
let hubSession = null;
let relSession = null;
const REL_MODE_MAP = {
  transitive: transitiveMode,
  graph: graphMode,
  propositional: propositionalMode
};
const hubTimers = {
  cue: null,
  display: null,
  trial: null
};
const relTimers = {
  cue: null,
  display: null,
  trial: null,
  quizTimeout: null,
  quizTick: null,
  quizAdvance: null
};
const DAY_MS = 24 * 60 * 60 * 1000;
const MISSION_TIER0_STEPS = ["control"];
const MISSION_TIER1_STEPS = ["reset", "control", "reason"];
const SPLASH_DURATION_MS = 1500;
const COACH_NOTICE_COPY = Object.freeze({
  RECOVER: "Recovery block scheduled",
  STABILISE: "Stabilise block scheduled",
  TUNE: "Targeted challenge pulse scheduled",
  SPIKE_TUNE: "Probe wrapper block scheduled",
  CONSOLIDATE: "Consolidation block scheduled"
});
const COACH_BRIEFING_COPY = Object.freeze({
  RECOVER: "Next: Recovery block",
  STABILISE: "Next: Stabilise block",
  TUNE: "Next: Targeted challenge pulse",
  SPIKE_TUNE: "Next: Probe wrapper block",
  CONSOLIDATE: "Next: Consolidation block"
});
const uiTimers = {
  splash: null
};
const uiState = {
  showSplash: true,
  splashDismissed: false,
  activeOverlay: "none",
  overlayCanTapDismiss: false,
  pendingUnlockCelebration: false
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toDateKeyLocal(ts = Date.now()) {
  const date = new Date(ts);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function dateKeyToUtcDays(dateKey) {
  if (typeof dateKey !== "string") {
    return null;
  }
  const parts = dateKey.split("-");
  if (parts.length !== 3) {
    return null;
  }
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return Math.floor(Date.UTC(year, month - 1, day) / DAY_MS);
}

function dayDiffByDateKeys(fromDateKey, toDateKey) {
  const fromDays = dateKeyToUtcDays(fromDateKey);
  const toDays = dateKeyToUtcDays(toDateKey);
  if (fromDays === null || toDays === null) {
    return null;
  }
  return toDays - fromDays;
}

function deriveOutcomeBandFromAccuracy(accuracy) {
  const safeAccuracy = Number(accuracy || 0);
  if (safeAccuracy >= 0.9) {
    return "UP";
  }
  if (safeAccuracy < 0.75) {
    return "DOWN";
  }
  return "HOLD";
}

function isCleanBlock(block) {
  return Number(block?.errorBursts || 0) === 0 && Number(block?.lapseCount || 0) === 0;
}

function computeSessionUnits(blocks) {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  let units = 0;
  for (let i = 0; i < safeBlocks.length; i += 1) {
    const band = deriveOutcomeBandFromAccuracy(safeBlocks[i]?.accuracy);
    if (band === "UP") {
      units += 2;
    } else if (band === "HOLD") {
      units += 1;
    }
  }
  return units;
}

function getSessionBaselineWrapper(session) {
  const wrapper = session?.blocksPlanned?.[0]?.wrapper;
  return wrapper === "hub_noncat" ? "hub_noncat" : (wrapper === "hub_cat" ? "hub_cat" : null);
}

function isQualifyingWrapperSession(session, wrapper) {
  if (!session || session.wrapperFamily !== "hub") {
    return false;
  }
  if (getSessionBaselineWrapper(session) !== wrapper) {
    return false;
  }
  const safeBlocks = Array.isArray(session.blocks) ? session.blocks : [];
  const wrapperBlocks = safeBlocks.filter((block) => block?.wrapper === wrapper);
  if (!wrapperBlocks.length) {
    return false;
  }
  const finalWrapperBlock = wrapperBlocks[wrapperBlocks.length - 1];
  if (!finalWrapperBlock || Number(finalWrapperBlock.nEnd || 0) < 3) {
    return false;
  }
  let holdOrUpCount = 0;
  for (let i = 0; i < wrapperBlocks.length; i += 1) {
    const block = wrapperBlocks[i];
    if (Number(block?.nStart || 0) < 3) {
      continue;
    }
    if (Number(block?.accuracy || 0) >= 0.75) {
      holdOrUpCount += 1;
    }
  }
  return holdOrUpCount >= 3;
}

function deriveRelationalUnlockProgress(history) {
  const safeHistory = Array.isArray(history) ? history : [];
  let catQualified = false;
  let noncatQualified = false;
  for (let i = 0; i < safeHistory.length; i += 1) {
    const session = safeHistory[i];
    if (!catQualified && isQualifyingWrapperSession(session, "hub_cat")) {
      catQualified = true;
    }
    if (!noncatQualified && isQualifyingWrapperSession(session, "hub_noncat")) {
      noncatQualified = true;
    }
    if (catQualified && noncatQualified) {
      break;
    }
  }
  return {
    catQualified,
    noncatQualified,
    relationalUnlocked: catQualified && noncatQualified
  };
}

function syncRelationalUnlockFlags(state) {
  const unlockProgress = deriveRelationalUnlockProgress(state?.history);
  const nextUnlockValue = unlockProgress.relationalUnlocked;
  const unlocks = {
    ...(state?.unlocks || {}),
    transitive: nextUnlockValue,
    graph: nextUnlockValue,
    propositional: nextUnlockValue
  };
  const changed = !state?.unlocks
    || state.unlocks.transitive !== unlocks.transitive
    || state.unlocks.graph !== unlocks.graph
    || state.unlocks.propositional !== unlocks.propositional;
  return {
    state: changed ? { ...state, unlocks } : state,
    unlockProgress,
    changed
  };
}

function loadStateWithSyncedUnlocks() {
  const state = loadGymState();
  const sync = syncRelationalUnlockFlags(state);
  if (sync.changed) {
    saveGymState(sync.state);
  }
  return sync.state;
}

function createMissionByTier(tier) {
  const missionTier = tier === "tier1" ? "tier1" : "tier0";
  const steps = missionTier === "tier1" ? MISSION_TIER1_STEPS.slice() : MISSION_TIER0_STEPS.slice();
  return {
    tier: missionTier,
    steps,
    completedStepIds: [],
    completedSteps: 0,
    rewardClaimed: false,
    hasSessionStarted: false
  };
}

function getMissionTierForDay(state, dateKey, unlockProgress) {
  const relationalUnlocked = Boolean(unlockProgress?.relationalUnlocked);
  if (!relationalUnlocked) {
    return "tier0";
  }
  const mission = state?.missionsByDate?.[dateKey];
  if (!mission) {
    return "tier1";
  }
  if (!mission.hasSessionStarted) {
    return "tier1";
  }
  return mission.tier === "tier1" ? "tier1" : "tier0";
}

function normalizeMission(missionRaw, tier) {
  const base = createMissionByTier(tier);
  if (!missionRaw || typeof missionRaw !== "object") {
    return base;
  }
  const steps = Array.isArray(missionRaw.steps) ? missionRaw.steps.filter((step) => typeof step === "string") : base.steps;
  const completedStepIds = Array.isArray(missionRaw.completedStepIds)
    ? missionRaw.completedStepIds.filter((step) => steps.includes(step))
    : [];
  const completedStepsRaw = Number.isFinite(missionRaw.completedSteps) ? Math.floor(missionRaw.completedSteps) : 0;
  return {
    tier: tier || missionRaw.tier || base.tier,
    steps,
    completedStepIds,
    completedSteps: Math.min(steps.length, Math.max(completedStepsRaw, completedStepIds.length)),
    rewardClaimed: Boolean(missionRaw.rewardClaimed),
    hasSessionStarted: Boolean(missionRaw.hasSessionStarted)
  };
}

function ensureMissionForDate(state, dateKey, unlockProgress) {
  const safeState = state && typeof state === "object" ? state : loadGymState();
  const missionTier = getMissionTierForDay(safeState, dateKey, unlockProgress);
  const existing = safeState.missionsByDate?.[dateKey];
  const normalized = normalizeMission(existing, missionTier);
  if (normalized.tier === "tier1") {
    normalized.steps = MISSION_TIER1_STEPS.slice();
    normalized.completedStepIds = normalized.completedStepIds.filter((step) => normalized.steps.includes(step));
    normalized.completedSteps = normalized.completedStepIds.length;
  } else {
    normalized.steps = MISSION_TIER0_STEPS.slice();
    normalized.completedStepIds = normalized.completedStepIds.filter((step) => normalized.steps.includes(step));
    normalized.completedSteps = normalized.completedStepIds.length;
  }
  const unchanged = existing
    && existing.tier === normalized.tier
    && existing.completedSteps === normalized.completedSteps
    && existing.rewardClaimed === normalized.rewardClaimed
    && Boolean(existing.hasSessionStarted) === normalized.hasSessionStarted
    && JSON.stringify(existing.steps || []) === JSON.stringify(normalized.steps)
    && JSON.stringify(existing.completedStepIds || []) === JSON.stringify(normalized.completedStepIds);

  if (unchanged) {
    return { state: safeState, mission: normalized, changed: false };
  }
  return {
    state: {
      ...safeState,
      missionsByDate: {
        ...(safeState.missionsByDate || {}),
        [dateKey]: normalized
      }
    },
    mission: normalized,
    changed: true
  };
}

function markMissionStep(mission, stepId) {
  if (!mission || !Array.isArray(mission.steps) || !mission.steps.includes(stepId)) {
    return mission;
  }
  const completed = Array.isArray(mission.completedStepIds) ? mission.completedStepIds.slice() : [];
  if (!completed.includes(stepId)) {
    completed.push(stepId);
  }
  return {
    ...mission,
    completedStepIds: completed,
    completedSteps: Math.min(mission.steps.length, completed.length)
  };
}

function isMissionComplete(mission) {
  return Boolean(mission && Array.isArray(mission.steps) && mission.steps.length > 0 && mission.completedSteps >= mission.steps.length);
}

function maybeAwardMissionReward(mission, currentBankUnits) {
  const missionComplete = isMissionComplete(mission);
  if (!missionComplete || mission.rewardClaimed) {
    return {
      mission,
      bankUnits: currentBankUnits,
      missionBonusEarned: 0,
      missionJustCompleted: false
    };
  }
  return {
    mission: {
      ...mission,
      rewardClaimed: true
    },
    bankUnits: currentBankUnits + 3,
    missionBonusEarned: 3,
    missionJustCompleted: true
  };
}

function applyMissionStreakOnCompletion(settings, dateKey, missionJustCompleted) {
  const safeSettings = settings && typeof settings === "object" ? settings : {};
  if (!missionJustCompleted) {
    return safeSettings;
  }
  const lastDate = safeSettings.lastMissionCompletedDate;
  const currentStreak = Number.isFinite(safeSettings.streakCurrent) ? safeSettings.streakCurrent : 0;
  const bestStreak = Number.isFinite(safeSettings.streakBest) ? safeSettings.streakBest : 0;
  let nextCurrent = 1;

  if (typeof lastDate === "string") {
    const dayDiff = dayDiffByDateKeys(lastDate, dateKey);
    if (dayDiff === 1 || dayDiff === 2) {
      nextCurrent = Math.max(1, currentStreak + 1);
    } else if (dayDiff === 0) {
      nextCurrent = Math.max(1, currentStreak);
    }
  }
  return {
    ...safeSettings,
    streakCurrent: nextCurrent,
    streakBest: Math.max(bestStreak, nextCurrent),
    lastMissionCompletedDate: dateKey
  };
}

function registerMissionSessionStart() {
  const dateKey = toDateKeyLocal();
  let state = loadGymState();
  const synced = syncRelationalUnlockFlags(state);
  state = synced.state;

  const ensured = ensureMissionForDate(state, dateKey, synced.unlockProgress);
  state = ensured.state;

  let mission = ensured.mission;
  if (!mission.hasSessionStarted) {
    mission = {
      ...mission,
      hasSessionStarted: true
    };
  }
  if (mission.tier === "tier1") {
    mission = markMissionStep(mission, "reset");
  }

  state = {
    ...state,
    missionsByDate: {
      ...(state.missionsByDate || {}),
      [dateKey]: mission
    }
  };
  saveGymState(state);
  return mission;
}

function applySessionProgressAndSave(summary, family) {
  const dateKey = toDateKeyLocal(summary?.tsEnd || Date.now());
  let state = loadGymState();
  const synced = syncRelationalUnlockFlags(state);
  state = synced.state;
  const unlockProgress = synced.unlockProgress;

  const ensured = ensureMissionForDate(state, dateKey, unlockProgress);
  state = ensured.state;
  let mission = ensured.mission;
  const missionWasComplete = isMissionComplete(mission);

  if (family === "hub") {
    mission = markMissionStep(mission, "control");
  } else if (family === "relational" && mission.tier === "tier1") {
    mission = markMissionStep(mission, "reason");
  }

  const sessionUnitsEarned = computeSessionUnits(summary?.blocks || []);
  let bankUnits = Number(state.bankUnits || 0) + sessionUnitsEarned;
  const rewardOutcome = maybeAwardMissionReward(mission, bankUnits);
  mission = rewardOutcome.mission;
  bankUnits = rewardOutcome.bankUnits;
  const missionNowComplete = isMissionComplete(mission);
  const missionJustCompleted = !missionWasComplete && missionNowComplete;

  const nextSettings = applyMissionStreakOnCompletion(state.settings, dateKey, missionJustCompleted);
  const nextState = {
    ...state,
    bankUnits,
    settings: nextSettings,
    missionsByDate: {
      ...(state.missionsByDate || {}),
      [dateKey]: mission
    }
  };
  saveGymState(nextState);

  return {
    sessionUnitsEarned,
    missionBonusEarned: rewardOutcome.missionBonusEarned,
    missionCompletedToday: missionNowComplete,
    missionTier: mission.tier || "tier0",
    missionCompletedSteps: mission.completedSteps || 0,
    missionStepTotal: Array.isArray(mission.steps) ? mission.steps.length : 0,
    bankTotal: bankUnits,
    streakCurrent: Number(nextSettings.streakCurrent || 0),
    streakBest: Number(nextSettings.streakBest || 0),
    unlockProgress,
    allBlocksClean: Array.isArray(summary?.blocks) && summary.blocks.length > 0
      ? summary.blocks.every((block) => isCleanBlock(block))
      : false
  };
}

function getMissionPreview(state, dateKey, unlockProgress) {
  const mission = state?.missionsByDate?.[dateKey];
  if (mission) {
    const tierForToday = getMissionTierForDay(state, dateKey, unlockProgress);
    return normalizeMission(mission, tierForToday);
  }
  return normalizeMission(null, unlockProgress?.relationalUnlocked ? "tier1" : "tier0");
}

function hasRecentPulse(completedBlocks, pulseType, lookback = 2) {
  const safeBlocks = Array.isArray(completedBlocks) ? completedBlocks : [];
  const recent = safeBlocks.slice(-lookback);
  return recent.some((entry) => entry?.plan?.flags?.pulseType === pulseType);
}

function hasRecentSwapProbe(completedBlocks, lookback = 2) {
  const safeBlocks = Array.isArray(completedBlocks) ? completedBlocks : [];
  const recent = safeBlocks.slice(-lookback);
  return recent.some((entry) => Boolean(entry?.plan?.flags?.wasSwapProbe));
}

function getCoachNoticeCopy(coachState, fallbackMessage = "") {
  if (coachState && COACH_NOTICE_COPY[coachState]) {
    return COACH_NOTICE_COPY[coachState];
  }
  return fallbackMessage || "";
}

function getCoachBriefingPreviewCopy(coachState) {
  if (coachState && COACH_BRIEFING_COPY[coachState]) {
    return COACH_BRIEFING_COPY[coachState];
  }
  return "";
}

function makeCoachNarrative(coachState, fallbackMessage = "") {
  return getCoachNoticeCopy(coachState, fallbackMessage);
}

function ensureSplashTimer() {
  if (!uiState.showSplash) {
    if (uiTimers.splash) {
      clearTimeout(uiTimers.splash);
      uiTimers.splash = null;
    }
    return;
  }
  if (uiTimers.splash) {
    return;
  }
  uiTimers.splash = setTimeout(() => {
    uiTimers.splash = null;
    dismissSplashOverlay();
  }, SPLASH_DURATION_MS);
}

function dismissSplashOverlay() {
  if (!uiState.showSplash) {
    return;
  }
  uiState.showSplash = false;
  uiState.splashDismissed = true;
  if (uiTimers.splash) {
    clearTimeout(uiTimers.splash);
    uiTimers.splash = null;
  }
  render();
}

function showBriefingOverlay(canTapDismiss) {
  uiState.activeOverlay = "briefing";
  uiState.overlayCanTapDismiss = Boolean(canTapDismiss);
}

function closeBriefingOverlay() {
  if (uiState.activeOverlay !== "briefing") {
    return;
  }
  uiState.activeOverlay = "none";
  uiState.overlayCanTapDismiss = false;
}

function queueUnlockCelebration() {
  uiState.pendingUnlockCelebration = true;
}

function showUnlockCelebrationIfPending(state) {
  if (!uiState.pendingUnlockCelebration || uiState.showSplash) {
    return;
  }
  if (uiState.activeOverlay !== "none" && uiState.activeOverlay !== "unlock-celebration") {
    return;
  }
  const unlockProgress = deriveRelationalUnlockProgress(state?.history || []);
  if (!unlockProgress.relationalUnlocked) {
    uiState.pendingUnlockCelebration = false;
    return;
  }
  uiState.pendingUnlockCelebration = false;
  uiState.activeOverlay = "unlock-celebration";
}

function dismissUnlockCelebration() {
  uiState.pendingUnlockCelebration = false;
  if (uiState.activeOverlay === "unlock-celebration") {
    uiState.activeOverlay = "none";
  }
}

function resolveHubAlternativePatch(session, pendingPatch) {
  const safePatch = pendingPatch && typeof pendingPatch === "object" ? pendingPatch : {};
  const flags = safePatch.flags && typeof safePatch.flags === "object" ? safePatch.flags : {};
  const lastPlan = session?.completedBlocks?.length
    ? session.completedBlocks[session.completedBlocks.length - 1].plan
    : null;
  const canUseSpeed = !hasRecentPulse(session?.completedBlocks, "speed") && (lastPlan?.speed || "slow") === "slow";
  const canUseInterference = !hasRecentPulse(session?.completedBlocks, "interference") && (lastPlan?.interference || "low") === "low";
  const canUseSwap = !hasRecentSwapProbe(session?.completedBlocks);

  let alternativeType = null;
  if (flags.pulseType === "speed") {
    if (canUseInterference) {
      alternativeType = "interference";
    }
  } else if (flags.pulseType === "interference") {
    if (canUseSpeed) {
      alternativeType = "speed";
    }
  } else if (flags.wasSwapProbe || flags.swapSegment === "B") {
    // Wrapper-swap alternative would be allowed only if no recent swap probe.
    if (!canUseSwap) {
      return null;
    }
    if (canUseSpeed) {
      alternativeType = "speed";
    } else if (canUseInterference) {
      alternativeType = "interference";
    }
  }

  if (!alternativeType) {
    return null;
  }

  const nextFlags = {
    coachState: "TUNE",
    pulseType: alternativeType === "speed" || alternativeType === "interference" ? alternativeType : null,
    swapSegment: null,
    wasSwapProbe: false,
    userOverride: "alternative"
  };

  const base = {
    n: safePatch.n,
    targetModality: safePatch.targetModality,
    wrapper: lastPlan?.wrapper || safePatch.wrapper || "hub_cat"
  };
  if (alternativeType === "speed") {
    return {
      ...base,
      speed: "fast",
      interference: undefined,
      flags: nextFlags
    };
  }
  if (alternativeType === "interference") {
    return {
      ...base,
      speed: undefined,
      interference: "high",
      flags: nextFlags
    };
  }
  return null;
}

function ensureRoute() {
  const raw = (window.location.hash || "").replace(/^#\//, "").trim();
  if (!ROUTES.has(raw)) {
    window.location.hash = `/${DEFAULT_ROUTE}`;
    return null;
  }
  return raw;
}

function setActiveNav(route) {
  const links = document.querySelectorAll(".nav a[data-route]");
  links.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("data-route") === route);
  });
}

function wrapperDisplayName(wrapper) {
  if (wrapper === "hub_noncat") {
    return "Hub Non-Categorical";
  }
  if (wrapper === "hub_cat") {
    return "Hub Categorical";
  }
  if (wrapper === "transitive") {
    return "Transitive";
  }
  if (wrapper === "graph") {
    return "Graph";
  }
  if (wrapper === "propositional") {
    return "Propositional";
  }
  return wrapper || "Unknown";
}

function getDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

function computeSessionVisualStats(summary) {
  const blocks = Array.isArray(summary?.blocks) ? summary.blocks : [];
  if (!blocks.length) {
    return {
      peakN: 1,
      finalN: 1,
      holdUpCount: 0,
      totalBlocks: 0
    };
  }
  let peakN = 1;
  let holdUpCount = 0;
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    peakN = Math.max(peakN, Number(block?.nEnd || block?.nStart || 1));
    if (Number(block?.accuracy || 0) >= 0.75) {
      holdUpCount += 1;
    }
  }
  const finalN = Number(blocks[blocks.length - 1]?.nEnd || blocks[blocks.length - 1]?.nStart || 1);
  return {
    peakN,
    finalN,
    holdUpCount,
    totalBlocks: blocks.length
  };
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value || 0)));
}

function renderAccuracyRing(accuracyPercent, subLabel = "accuracy") {
  const safePct = clampPercent(accuracyPercent);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = (safePct / 100) * circumference;
  return `
    <div class="result-ring-wrap" aria-label="${safePct.toFixed(1)} percent ${escapeHtml(subLabel)}">
      <svg class="result-ring" viewBox="0 0 140 140" role="img">
        <circle cx="70" cy="70" r="${radius}" class="result-ring-bg"></circle>
        <circle cx="70" cy="70" r="${radius}" class="result-ring-fg" stroke-dasharray="${dash} ${circumference}" transform="rotate(-90 70 70)"></circle>
      </svg>
      <div class="result-ring-text">
        <strong>${safePct.toFixed(0)}%</strong>
        <span>${escapeHtml(subLabel)}</span>
      </div>
    </div>
  `;
}

function renderAccuracyBars(blocks) {
  const safeBlocks = Array.isArray(blocks) ? blocks : [];
  if (!safeBlocks.length) {
    return "";
  }
  const bars = safeBlocks.map((block, idx) => {
    const pct = clampPercent(Number(block?.accuracy || 0) * 100);
    const band = deriveOutcomeBandFromAccuracy(Number(block?.accuracy || 0));
    const className = band === "UP" ? "up" : (band === "DOWN" ? "down" : "hold");
    const height = Math.max(8, Math.round((pct / 100) * 74));
    return `<span class="acc-bar ${className}" style="height:${height}px;" title="Block ${idx + 1}: ${pct.toFixed(1)}%"></span>`;
  }).join("");
  return `
    <div class="session-chart-card">
      <p class="kicker">Accuracy by Block</p>
      <div class="acc-bars">${bars}</div>
      <p class="hint">Green = UP, Blue = HOLD, Red = DOWN</p>
    </div>
  `;
}

function updateShellHeaderStats(shellVm) {
  const streakEl = document.querySelector("#shell-streak");
  const bankEl = document.querySelector("#shell-bank");
  if (streakEl) {
    streakEl.textContent = String(Number(shellVm?.streakCurrent || 0));
  }
  if (bankEl) {
    bankEl.textContent = String(Number(shellVm?.bankUnits || 0));
  }
}

function renderFlash() {
  if (!flash) {
    return "";
  }
  return `<div class="status ${flashKind}">${flash}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function clearHubTimers() {
  if (hubTimers.cue) {
    clearTimeout(hubTimers.cue);
  }
  if (hubTimers.display) {
    clearTimeout(hubTimers.display);
  }
  if (hubTimers.trial) {
    clearTimeout(hubTimers.trial);
  }
  hubTimers.cue = null;
  hubTimers.display = null;
  hubTimers.trial = null;
}

function clearRelTimers() {
  if (relTimers.cue) {
    clearTimeout(relTimers.cue);
  }
  if (relTimers.display) {
    clearTimeout(relTimers.display);
  }
  if (relTimers.trial) {
    clearTimeout(relTimers.trial);
  }
  if (relTimers.quizTimeout) {
    clearTimeout(relTimers.quizTimeout);
  }
  if (relTimers.quizTick) {
    clearInterval(relTimers.quizTick);
  }
  if (relTimers.quizAdvance) {
    clearTimeout(relTimers.quizAdvance);
  }
  relTimers.cue = null;
  relTimers.display = null;
  relTimers.trial = null;
  relTimers.quizTimeout = null;
  relTimers.quizTick = null;
  relTimers.quizAdvance = null;
}

function setFlash(message, kind = "success") {
  flash = message;
  flashKind = kind;
}

function clearFlash() {
  flash = "";
  flashKind = "success";
}

function normalizeHubWrapper(value) {
  return value === "hub_noncat" ? "hub_noncat" : "hub_cat";
}

function normalizeHubSpeed(value) {
  return value === "fast" ? "fast" : "slow";
}

function normalizeHubInterference(value) {
  return value === "high" ? "high" : "low";
}

function normalizeHubTargetModality(value, blockIndex) {
  if (HUB_TARGET_MODALITIES.includes(value)) {
    return value;
  }
  return HUB_TARGET_MODALITIES[(blockIndex - 1) % HUB_TARGET_MODALITIES.length];
}

function normalizeCoachFlags(flags) {
  if (!flags || typeof flags !== "object") {
    return undefined;
  }
  return {
    coachState: flags.coachState,
    pulseType: flags.pulseType ?? null,
    swapSegment: flags.swapSegment ?? null,
    wasSwapProbe: Boolean(flags.wasSwapProbe),
    userOverride: flags.userOverride === "coach" || flags.userOverride === "alternative"
      ? flags.userOverride
      : undefined
  };
}

function normalizeRelationalCoachFlags(flags) {
  const safeFlags = flags && typeof flags === "object" ? flags : {};
  return {
    coachState: safeFlags.coachState ?? null,
    pulseType: null,
    swapSegment: null,
    wasSwapProbe: false,
    userOverride: safeFlags.userOverride === "coach" || safeFlags.userOverride === "alternative"
      ? safeFlags.userOverride
      : undefined
  };
}

function isFirstHubRun(state) {
  const safeState = state && typeof state === "object" ? state : loadGymState();
  const hasHubHistory = Array.isArray(safeState.history)
    ? safeState.history.some((entry) => entry && entry.wrapperFamily === "hub")
    : false;
  const hasRunHubBefore = Boolean(safeState.settings?.hasRunHubBefore);
  return !hasHubHistory || !hasRunHubBefore;
}

function resolveNextBlockPreview(session) {
  if (!session || session.status !== "running") {
    return {
      wrapper: normalizeHubWrapper(hubPreferences.wrapper),
      speed: normalizeHubSpeed(hubPreferences.speed),
      interference: normalizeHubInterference(hubPreferences.interference),
      coachState: null
    };
  }

  const patch = session.pendingPlanPatch && typeof session.pendingPlanPatch === "object"
    ? session.pendingPlanPatch
    : {};
  const lastWrapper = session.lastBlockSummary?.wrapper || normalizeHubWrapper(hubPreferences.wrapper);
  return {
    wrapper: patch.wrapper ? normalizeHubWrapper(patch.wrapper) : lastWrapper,
    speed: patch.speed ? normalizeHubSpeed(patch.speed) : normalizeHubSpeed(hubPreferences.speed),
    interference: patch.interference ? normalizeHubInterference(patch.interference) : normalizeHubInterference(hubPreferences.interference),
    coachState: patch.flags?.coachState || null
  };
}

function renderRelationalProgressCard(unlockProgress) {
  const catDone = Boolean(unlockProgress?.catQualified);
  const noncatDone = Boolean(unlockProgress?.noncatQualified);
  const nextNeed = !catDone
    ? "Need: 1 hub_cat session at N>=3 with 3 stable blocks."
    : (!noncatDone ? "Need: 1 hub_noncat session at N>=3 with 3 stable blocks." : "Both wrappers are qualified.");
  return `
    <div class="rel-progress-card">
      <p><strong>Relational Progress</strong></p>
      <p>${catDone ? "[x]" : "[ ]"} hub_cat - ${catDone ? "qualified" : "in progress"}</p>
      <p>${noncatDone ? "[x]" : "[ ]"} hub_noncat - ${noncatDone ? "qualified" : "in progress"}</p>
      <p>${escapeHtml(nextNeed)}</p>
      <details class="rel-progress-help">
        <summary>[?] What counts as stable?</summary>
        <p>Stable = 3 blocks at N>=3 with accuracy >=75%.</p>
      </details>
    </div>
  `;
}

function renderHome(state) {
  const unlockProgress = deriveRelationalUnlockProgress(state.history);
  const todayKey = toDateKeyLocal();
  const mission = getMissionPreview(state, todayKey, unlockProgress);
  const streakCurrent = Number(state.settings?.streakCurrent || 0);
  const streakBest = Number(state.settings?.streakBest || 0);
  const greeting = getDayGreeting();
  const tierLabel = mission.tier === "tier1" ? "Tier 1: Reset - Control - Reason" : "Tier 0: Control";
  const missionSteps = mission.steps.map((stepId, idx) => {
    const done = idx < mission.completedSteps;
    const label = stepId === "reset"
      ? "Start any session"
      : (stepId === "control" ? "Complete one Hub session" : "Complete one Relational session");
    return `<div class="mission-step"><span class="mission-dot ${done ? "done" : ""}"></span><span>${label}</span></div>`;
  }).join("");
  const relModeLocked = !unlockProgress.relationalUnlocked;
  const relLockText = relModeLocked ? "Locked" : "Available";
  return `
    <section class="card">
      <h2>${greeting}</h2>
      <p class="hint">${mission.tier === "tier1" ? "Tier 1 - Reset - Control - Reason" : "Complete a Hub session today."}</p>
      <div class="hero-grid">
        <div class="mission-card">
          <p class="kicker">Daily Mission</p>
          <p><strong>${tierLabel}</strong> <span class="pill-soft">+3 bonus</span></p>
          ${missionSteps}
          <p class="hint">${mission.rewardClaimed ? "Mission reward claimed for today." : "Complete mission to earn +3 bank units."}</p>
        </div>
        <div class="snapshot-card snapshot-list">
          <p><strong>Sessions:</strong> ${state.history.length}</p>
          <p><strong>Bank:</strong> ${state.bankUnits}</p>
          <p><strong>Streak:</strong> ${streakCurrent} (best ${streakBest})</p>
          <p><strong>Relational:</strong> ${unlockProgress.relationalUnlocked ? "Unlocked" : "Locked"}</p>
        </div>
      </div>
      <div class="row">
        <button class="btn primary" data-action="go-play-hub">Start Recommended Session</button>
      </div>
      <p class="hint home-cta-hint">~10 min | Hub (category) | Level 2 recommended</p>
      <div class="mode-panel">
        <p class="kicker">Choose a Mode</p>
        <div class="mode-group">
          <p class="hint">Hub</p>
          <div class="mode-grid mode-grid-hub">
            <div class="mode-tile">
              <img src="../brandingUI/icons/game/location-spatial.svg" alt="" aria-hidden="true">
              <strong>Hub Cat</strong>
              <span>Available</span>
            </div>
            <div class="mode-tile">
              <img src="../brandingUI/icons/game/symbol.svg" alt="" aria-hidden="true">
              <strong>Hub Noncat</strong>
              <span>Available</span>
            </div>
          </div>
        </div>
        <div class="mode-group">
          <p class="hint">Relational</p>
          <div class="mode-grid mode-grid-rel">
            <div class="mode-tile ${relModeLocked ? "locked" : ""}">
              <img src="../brandingUI/icons/game/transitive-order.svg" alt="" aria-hidden="true">
              <strong>Transitive</strong>
              <span>${relLockText}</span>
            </div>
            <div class="mode-tile ${relModeLocked ? "locked" : ""}">
              <img src="../brandingUI/icons/game/graph-directed.svg" alt="" aria-hidden="true">
              <strong>Graph</strong>
              <span>${relLockText}</span>
            </div>
            <div class="mode-tile ${relModeLocked ? "locked" : ""}">
              <img src="../brandingUI/icons/game/propositional.svg" alt="" aria-hidden="true">
              <strong>Propositional</strong>
              <span>${relLockText}</span>
            </div>
          </div>
        </div>
      </div>
      ${renderRelationalProgressCard(unlockProgress)}
      ${renderFlash()}
    </section>
  `;
}

function renderRelationalUnlockChecklist(unlockProgress) {
  return `
    <div class="unlock-checklist">
      <p><strong>Relational Unlock Checklist</strong></p>
      <p>${unlockProgress.catQualified ? "[x]" : "[ ]"} hub_cat qualification ${unlockProgress.catQualified ? "complete" : "pending"}</p>
      <p>${unlockProgress.noncatQualified ? "[x]" : "[ ]"} hub_noncat qualification ${unlockProgress.noncatQualified ? "complete" : "pending"}</p>
    </div>
  `;
}

function renderRelationalModeButtons(locked) {
  const lockAttr = locked ? "disabled" : "";
  return `
    <div class="row">
      <button class="btn primary" data-action="start-relational-session" data-mode="transitive" ${lockAttr}><img class="btn-inline-icon" src="../brandingUI/icons/game/transitive-order.svg" alt="" aria-hidden="true">Start Transitive</button>
      <button class="btn primary" data-action="start-relational-session" data-mode="graph" ${lockAttr}><img class="btn-inline-icon" src="../brandingUI/icons/game/graph-directed.svg" alt="" aria-hidden="true">Start Graph</button>
      <button class="btn primary" data-action="start-relational-session" data-mode="propositional" ${lockAttr}><img class="btn-inline-icon" src="../brandingUI/icons/game/propositional.svg" alt="" aria-hidden="true">Start Propositional</button>
    </div>
  `;
}

function renderHubConfigControls({
  showWrapperSelect = true,
  wrapperLocked = false,
  dialsLocked = false,
  speedValue = hubPreferences.speed,
  interferenceValue = hubPreferences.interference
} = {}) {
  const wrapperLock = wrapperLocked ? "disabled" : "";
  const dialLock = dialsLocked ? "disabled" : "";
  const wrapperControl = showWrapperSelect
    ? `
      <label class="hub-config-item">
        Wrapper
        <select id="hub-wrapper-select" ${wrapperLock}>
          ${HUB_WRAPPERS.map((wrapperId) => (
            `<option value="${wrapperId}" ${hubPreferences.wrapper === wrapperId ? "selected" : ""}>${wrapperId === "hub_noncat" ? "hub_noncat (non-categorical)" : "hub_cat (categorical)"}</option>`
          )).join("")}
        </select>
      </label>
    `
    : `
      <div class="hub-config-item hub-config-readonly">
        <span>Wrapper</span>
        <strong>Coach-controlled during session</strong>
      </div>
    `;
  return `
    <div class="row hub-config-row">
      ${wrapperControl}
      <label class="hub-config-item">
        Speed
        <select id="hub-speed-select" ${dialLock}>
          <option value="slow" ${speedValue === "slow" ? "selected" : ""}>Slow pace</option>
          <option value="fast" ${speedValue === "fast" ? "selected" : ""}>Fast pace</option>
        </select>
      </label>
      <label class="hub-config-item">
        Interference
        <select id="hub-interference-select" ${dialLock}>
          <option value="low" ${interferenceValue === "low" ? "selected" : ""}>Low</option>
          <option value="high" ${interferenceValue === "high" ? "selected" : ""}>High</option>
        </select>
      </label>
    </div>
    <p class="hint">Interference controls how distracting the stream feels. Changes apply to the next block.</p>
  `;
}

function renderHubStimulus(trial, visible, targetLabel, renderMapping, wrapper, runtimeInfo = "") {
  const points = Array.isArray(renderMapping?.markerPositions) ? renderMapping.markerPositions : [];
  const markerDots = points.map((point) => (
    `<span class="hub-marker" style="left:${point.xPct}%;top:${point.yPct}%;"></span>`
  )).join("");

  const point = trial && points[trial.locIdx] ? points[trial.locIdx] : { xPct: 50, yPct: 50 };
  const tokenVisible = Boolean(trial && visible);
  const textColor = trial && trial.display.colourHex.toLowerCase() === "#ffffff" ? "#102033" : "#ffffff";
  const tokenClass = tokenVisible ? "hub-token" : "hub-token hidden";
  const tokenBg = tokenVisible && trial ? trial.display.colourHex : "transparent";
  const tokenText = tokenVisible && trial ? escapeHtml(trial.display.symbolLabel) : "";
  const stimulus = `<div class="${tokenClass}" style="left:${point.xPct}%;top:${point.yPct}%;background:${tokenBg};color:${textColor};">${tokenText}</div>`;

  const meta = trial
    ? visible
      ? "Respond MATCH only if this target stream repeats at N-back."
      : "Hold attention. Response window is still open."
    : "Get ready.";

  return `
    <div class="hub-stimulus">
      <p class="hub-target">Target: <strong>${escapeHtml(targetLabel)}</strong> | Wrapper: <strong>${escapeHtml(wrapperDisplayName(wrapper))}</strong></p>
      ${runtimeInfo ? `<p class="hub-runtime">${escapeHtml(runtimeInfo)}</p>` : ""}
      <div class="hub-arena">
        <div class="hub-ring"></div>
        ${markerDots}
        ${stimulus}
      </div>
      <p class="hub-stimulus-meta">${meta}</p>
    </div>
  `;
}

function renderBlockSummary(block) {
  if (!block) {
    return "";
  }
  const cleanBlock = isCleanBlock(block);
  const outcomeBand = deriveOutcomeBandFromAccuracy(block.accuracy);
  const coachNarrative = makeCoachNarrative(block?.flags?.coachState, "");
  const accuracyPercent = Number(block.accuracy || 0) * 100;
  const blockUnits = outcomeBand === "UP" ? 2 : (outcomeBand === "HOLD" ? 1 : 0);
  return `
    <div class="hub-summary">
      <p class="kicker">Block ${block.blockIndex} Complete</p>
      <div class="result-hero">
        ${renderAccuracyRing(accuracyPercent)}
        <div class="result-hero-side">
          <p class="result-outcome result-outcome-${outcomeBand.toLowerCase()}">${outcomeBand}</p>
          <p>N level: <strong>${block.nStart} -> ${block.nEnd}</strong></p>
          <p>Average response: <strong>${block.meanRtMs ?? "n/a"} ms</strong></p>
        </div>
      </div>
      <div class="result-metric-grid">
        <div class="result-metric"><span>Hits</span><strong>${block.hits}</strong></div>
        <div class="result-metric"><span>Misses</span><strong>${block.misses}</strong></div>
        <div class="result-metric"><span>False Alarms</span><strong>${block.falseAlarms}</strong></div>
        <div class="result-metric"><span>CR</span><strong>${block.correctRejections}</strong></div>
      </div>
      <div class="result-earned-row">
        <span>Block earned</span>
        <strong>+${blockUnits} units</strong>
      </div>
      <p class="hint">Next block targets: >=75% for HOLD, >=90% to advance N.</p>
      ${cleanBlock ? `<p class="status clean">Clean control block.</p>` : ""}
      ${coachNarrative ? `<p class="hint">Coach action: ${escapeHtml(coachNarrative)}</p>` : ""}
    </div>
  `;
}

function renderRelationalStimulus(trial, visible, runtimeInfo = "") {
  const display = trial?.display || {};
  const textVisible = Boolean(trial && visible);
  const cueOrBlankCaption = trial
    ? "Hold attention. Response window is still open."
    : "Get ready.";

  if (display.type === "graph") {
    const nodes = Array.isArray(display.nodes) ? display.nodes : [];
    const nodeMarkup = nodes.map((node) => (
      `<span class="rel-graph-node ${textVisible ? "" : "hidden"}" style="left:${node.xPct}%;top:${node.yPct}%;background:${node.colorHex};"></span>`
    )).join("");
    const arrow = display.arrow;
    const arrowMarkup = textVisible && arrow
      ? `
        <svg class="rel-graph-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <marker id="rel-arrow-head" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0,0 6,3 0,6" fill="#4b5f78"></polygon>
            </marker>
          </defs>
          <line x1="${arrow.x1}" y1="${arrow.y1}" x2="${arrow.x2}" y2="${arrow.y2}" marker-end="url(#rel-arrow-head)"></line>
        </svg>
      `
      : "";
    const caption = textVisible
      ? (display.caption || "")
      : cueOrBlankCaption;
    return `
      <div class="rel-stimulus">
        ${runtimeInfo ? `<p class="hub-runtime">${escapeHtml(runtimeInfo)}</p>` : ""}
        <div class="hub-arena">
          <div class="hub-ring"></div>
          ${nodeMarkup}
          ${arrowMarkup}
        </div>
        <p class="rel-caption">${escapeHtml(caption)}</p>
      </div>
    `;
  }

  const tokenText = textVisible ? escapeHtml(display.text || "") : "";
  const tokenClass = textVisible ? "rel-center-token" : "rel-center-token hidden";
  const caption = textVisible
    ? (display.caption || "")
    : cueOrBlankCaption;
  return `
    <div class="rel-stimulus">
      ${runtimeInfo ? `<p class="hub-runtime">${escapeHtml(runtimeInfo)}</p>` : ""}
      <div class="hub-arena">
        <div class="hub-ring"></div>
        <div class="${tokenClass}">${tokenText}</div>
      </div>
      <p class="rel-caption">${escapeHtml(caption)}</p>
    </div>
  `;
}

function renderRelationalBlockSummary(block) {
  if (!block) {
    return "";
  }
  const cleanBlock = isCleanBlock(block);
  const outcomeBand = deriveOutcomeBandFromAccuracy(block.accuracy);
  const coachNarrative = makeCoachNarrative(block?.flags?.coachState, "");
  const accuracyPercent = Number(block.accuracy || 0) * 100;
  const blockUnits = outcomeBand === "UP" ? 2 : (outcomeBand === "HOLD" ? 1 : 0);
  return `
    <div class="hub-summary">
      <p class="kicker">Block ${block.blockIndex} Complete</p>
      <div class="result-hero">
        ${renderAccuracyRing(accuracyPercent)}
        <div class="result-hero-side">
          <p class="result-outcome result-outcome-${outcomeBand.toLowerCase()}">${outcomeBand}</p>
          <p>N level: <strong>${block.nStart} -> ${block.nEnd}</strong></p>
          <p>Quiz score: <strong>${block.quizCorrect ?? 0}/${block.quizTotal ?? 2}</strong></p>
        </div>
      </div>
      <div class="result-metric-grid">
        <div class="result-metric"><span>Hits</span><strong>${block.hits}</strong></div>
        <div class="result-metric"><span>Misses</span><strong>${block.misses}</strong></div>
        <div class="result-metric"><span>False Alarms</span><strong>${block.falseAlarms}</strong></div>
        <div class="result-metric"><span>Lapses</span><strong>${block.lapseCount}</strong></div>
      </div>
      <div class="result-earned-row">
        <span>Block earned</span>
        <strong>+${blockUnits} units</strong>
      </div>
      <p class="hint">Next block targets: >=75% for HOLD, >=90% to advance N.</p>
      ${cleanBlock ? `<p class="status clean">Clean control block.</p>` : ""}
      ${coachNarrative ? `<p class="hint">Coach action: ${escapeHtml(coachNarrative)}</p>` : ""}
    </div>
  `;
}

function renderPlayHub() {
  const running = Boolean(hubSession && hubSession.status === "running");
  const completed = Boolean(hubSession && hubSession.status === "completed");
  const blockActive = Boolean(hubSession && hubSession.status === "running" && (hubSession.phase === "cue" || hubSession.phase === "trial"));
  const requestedWrapper = normalizeHubWrapper(hubPreferences.wrapper);

  if (!running && !completed) {
    return `
      <section class="card">
        <h2>Hub Training</h2>
        <p class="hint">Choose wrapper, speed, and interference before starting.</p>
        ${renderHubConfigControls({ showWrapperSelect: true, wrapperLocked: false, dialsLocked: false })}
        <div class="row">
          <button class="btn primary" data-action="start-hub-session">Start ${wrapperDisplayName(requestedWrapper)} Session</button>
        </div>
        <p class="hint">Session shape: 10 blocks. Trial count scales with your level.</p>
        ${renderFlash()}
      </section>
    `;
  }

  if (completed) {
    const summary = hubSession.sessionSummary;
    const finalBlock = hubSession.lastBlockSummary;
    const progressDelta = hubSession.progressDelta || null;
    const progressionSummary = progressDelta
      ? `
        <div class="status success">
          <p>Session units: <strong>+${progressDelta.sessionUnitsEarned}</strong></p>
          <p>Mission bonus: <strong>+${progressDelta.missionBonusEarned}</strong></p>
          <p>Bank total: <strong>${progressDelta.bankTotal}</strong></p>
          <p>Streak: <strong>${progressDelta.streakCurrent}</strong> (best ${progressDelta.streakBest})</p>
        </div>
      `
      : "";
    const allCleanNote = progressDelta?.allBlocksClean
      ? `<p class="prestige-note">All Blocks Clean (prestige)</p>`
      : "";
    const visualStats = computeSessionVisualStats(summary);
    const accuracyChart = renderAccuracyBars(summary.blocks);
    return `
      <section class="card">
        <h2>Session Complete</h2>
        <p class="hint">${wrapperDisplayName(summary.blocksPlanned?.[0]?.wrapper)} | 10 blocks</p>
        ${renderHubConfigControls({ showWrapperSelect: true, wrapperLocked: false, dialsLocked: false })}
        <div class="status success">Session complete and saved.</div>
        ${progressionSummary}
        ${allCleanNote}
        <div class="session-stats-grid">
          <div class="session-stat"><span>Peak Level</span><strong>${visualStats.peakN}</strong></div>
          <div class="session-stat"><span>Final Level</span><strong>${visualStats.finalN}</strong></div>
          <div class="session-stat"><span>Stability</span><strong>${visualStats.holdUpCount}/${visualStats.totalBlocks}</strong></div>
        </div>
        ${accuracyChart}
        ${renderBlockSummary(finalBlock)}
        <div class="row">
          <button class="btn" data-action="go-home">Done</button>
          <button class="btn primary" data-action="start-hub-session">Start New Session</button>
        </div>
        ${renderFlash()}
      </section>
    `;
  }

  const block = hubSession.currentBlock;
  const trial = block && block.trialIndex >= 0 ? block.trials[block.trialIndex] : null;
  const trialNumber = block ? block.trialIndex + 1 : 0;
  const trialCount = block ? block.trials.length : 0;
  const responseCaptured = block ? block.responseCaptured : false;
  const targetLabel = block ? modalityLabel(block.plan.targetModality) : "";
  const preview = resolveNextBlockPreview(hubSession);
  const currentWrapper = block
    ? block.plan.wrapper
    : (hubSession.lastBlockSummary?.wrapper || preview.wrapper);
  const currentSpeed = block ? block.plan.speed : (hubSession.lastBlockSummary ? hubSession.lastBlockSummary.speed : "n/a");
  const currentInterference = block ? block.plan.interference : (hubSession.lastBlockSummary ? hubSession.lastBlockSummary.interference : "n/a");
  const coachNotice = hubSession.coachNotice
    ? `<div class="status coach">${escapeHtml(hubSession.coachNotice)}</div>`
    : "";
  const baselineNotice = hubSession.introNotice && hubSession.blockCursor === 0
    ? `<div class="status coach">${escapeHtml(hubSession.introNotice)}</div>`
    : "";
  const pendingPatch = hubSession.pendingPlanPatch && typeof hubSession.pendingPlanPatch === "object"
    ? hubSession.pendingPlanPatch
    : {};
  const hasCoachDialOverride = Boolean(pendingPatch.speed || pendingPatch.interference);
  const coachOverrideNote = hubSession.phase === "block-result" && hasCoachDialOverride
    ? `<p class="hint">Coach override active for next block (${escapeHtml(preview.coachState || "STABILISE")}). Your settings will apply after this coach block.</p>`
    : "";
  const overrideEligible = hubSession.phase === "block-result"
    && (preview.coachState === "TUNE" || preview.coachState === "SPIKE_TUNE");
  const alternativePatch = overrideEligible ? resolveHubAlternativePatch(hubSession, pendingPatch) : null;
  const overrideControls = overrideEligible
    ? `
      <div class="row">
        <button class="btn" data-action="hub-accept-coach">Accept Coach</button>
        <button class="btn" data-action="hub-try-alternative" ${alternativePatch ? "" : "disabled"}>Try Alternative</button>
      </div>
      ${alternativePatch ? "" : `<p class="hint">Coach recommendation is optimal right now.</p>`}
    `
    : "";
  const coachAction = makeCoachNarrative(preview.coachState, "");
  const coachBriefingPreview = getCoachBriefingPreviewCopy(preview.coachState);
  const runtimeInfo = block
    ? `Block ${block.plan.blockIndex}/${HUB_TOTAL_BLOCKS} | Coach: ${block.plan.flags?.coachState || "STABILISE"}`
    : "";

  let phasePanel = "";
  if (hubSession.phase === "briefing") {
    phasePanel = `
      <div class="hub-phase cue">
        <p class="hub-phase-title">Briefing</p>
        <p class="hint">Review the block briefing, then start when ready.</p>
      </div>
    `;
  } else if (hubSession.phase === "cue") {
    phasePanel = `
      <div class="hub-phase cue">
        <p class="hub-phase-title">Focus Cue</p>
        ${renderHubStimulus(null, false, targetLabel, block?.renderMapping, block?.plan?.wrapper || hubPreferences.wrapper, runtimeInfo)}
        <p class="hint">Prepare your attention target.</p>
      </div>
    `;
  } else if (hubSession.phase === "trial") {
    phasePanel = `
      <div class="hub-phase trial">
        <p class="hub-phase-title">Trial ${trialNumber} / ${trialCount}</p>
        <p>Press MATCH when the target stream repeats ${block.plan.n}-back.</p>
        ${renderHubStimulus(trial, block.stimulusVisible, targetLabel, block.renderMapping, block.plan.wrapper, runtimeInfo)}
        <div class="row">
          <button class="btn primary match-btn" data-action="hub-match" ${responseCaptured ? "disabled" : ""}>MATCH (Space)</button>
        </div>
        <p class="hint">${responseCaptured ? "Response recorded for this trial." : "Waiting for response."}</p>
      </div>
    `;
  } else {
    phasePanel = `
      <div class="hub-phase result">
        ${renderBlockSummary(hubSession.lastBlockSummary)}
        ${coachAction ? `<p class="hint">Coach action: ${escapeHtml(coachAction)}</p>` : ""}
        ${overrideControls}
        <div class="row">
          <button class="btn primary" data-action="hub-next-block">Start Next Block</button>
        </div>
      </div>
    `;
  }

  return `
    <section class="card">
      <h2>Hub Training</h2>
      ${renderHubConfigControls({
        showWrapperSelect: false,
        wrapperLocked: true,
        dialsLocked: blockActive,
        speedValue: blockActive && block ? block.plan.speed : hubPreferences.speed,
        interferenceValue: blockActive && block ? block.plan.interference : hubPreferences.interference
      })}
      <div class="running-status-row">
        <span class="running-pill">Block ${hubSession.blockCursor + (hubSession.phase === "block-result" ? 0 : 1)} / ${HUB_TOTAL_BLOCKS}</span>
        <span class="running-pill">N ${hubSession.currentN}</span>
        <span class="running-pill">${wrapperDisplayName(currentWrapper)}</span>
      </div>
      <p>Current settings: <strong>${currentSpeed}</strong> speed, <strong>${currentInterference}</strong> interference.</p>
      ${baselineNotice}
      ${hubSession.phase === "block-result" ? `<p>Next block: <strong>${wrapperDisplayName(preview.wrapper)}</strong>, <strong>${preview.speed}</strong> speed, <strong>${preview.interference}</strong> interference${preview.coachState ? ` | Coach: <strong>${preview.coachState}</strong>` : ""}.</p>` : ""}
      ${hubSession.phase === "block-result" && coachBriefingPreview ? `<p class="hint">${escapeHtml(coachBriefingPreview)}</p>` : ""}
      ${coachOverrideNote}
      ${hubSession.phase === "block-result" ? coachNotice : ""}
      ${phasePanel}
      ${renderFlash()}
    </section>
  `;
}

function renderPlayRelational(state) {
  const unlockProgress = deriveRelationalUnlockProgress(state.history);
  const relationalUnlocked = unlockProgress.relationalUnlocked;
  const running = Boolean(relSession && relSession.status === "running");
  const completed = Boolean(relSession && relSession.status === "completed");
  const modeButtons = renderRelationalModeButtons(!relationalUnlocked);
  const unlockChecklist = renderRelationalUnlockChecklist(unlockProgress);

  if (!running && !completed) {
    return `
      <section class="card">
        <h2>Relational Training</h2>
        <p class="hint">Train transitive, graph, and propositional reasoning with the same MATCH rhythm.</p>
        <p>Unlock status: <strong>${relationalUnlocked ? "Unlocked" : "Locked"}</strong></p>
        ${unlockChecklist}
        ${modeButtons}
        ${!relationalUnlocked ? `<p class="hint">Relational modes unlock after qualifying hub_cat and hub_noncat sessions.</p>` : ""}
        <p class="hint">Play model: MATCH-only responses during trials, then 2 timed quiz prompts per block.</p>
        ${renderFlash()}
      </section>
    `;
  }

  if (completed) {
    const summary = relSession.sessionSummary;
    const finalBlock = relSession.lastBlockSummary;
    const quizCorrect = summary.blocks.reduce((sum, block) => sum + Number(block.quizCorrect || 0), 0);
    const quizTotal = REL_TOTAL_BLOCKS * 2;
    const progressDelta = relSession.progressDelta || null;
    const progressionSummary = progressDelta
      ? `
        <div class="status success">
          <p>Session units: <strong>+${progressDelta.sessionUnitsEarned}</strong></p>
          <p>Mission bonus: <strong>+${progressDelta.missionBonusEarned}</strong></p>
          <p>Bank total: <strong>${progressDelta.bankTotal}</strong></p>
          <p>Streak: <strong>${progressDelta.streakCurrent}</strong> (best ${progressDelta.streakBest})</p>
        </div>
      `
      : "";
    const allCleanNote = progressDelta?.allBlocksClean
      ? `<p class="prestige-note">All Blocks Clean (prestige)</p>`
      : "";
    const visualStats = computeSessionVisualStats(summary);
    const accuracyChart = renderAccuracyBars(summary.blocks);
    return `
      <section class="card">
        <h2>Session Complete</h2>
        <p class="hint">${escapeHtml(wrapperDisplayName(summary.blocksPlanned?.[0]?.wrapper || "unknown"))} | 10 blocks</p>
        <div class="status success">Session complete and saved.</div>
        ${progressionSummary}
        ${allCleanNote}
        <div class="session-stats-grid">
          <div class="session-stat"><span>Peak Level</span><strong>${visualStats.peakN}</strong></div>
          <div class="session-stat"><span>Final Level</span><strong>${visualStats.finalN}</strong></div>
          <div class="session-stat"><span>Stability</span><strong>${visualStats.holdUpCount}/${visualStats.totalBlocks}</strong></div>
        </div>
        <p>Quiz total: <strong>${quizCorrect}/${quizTotal}</strong></p>
        ${accuracyChart}
        ${renderRelationalBlockSummary(finalBlock)}
        <div class="row">
          <button class="btn" data-action="go-home">Done</button>
          <button class="btn primary" data-action="start-relational-session" data-mode="transitive"><img class="btn-inline-icon" src="../brandingUI/icons/game/transitive-order.svg" alt="" aria-hidden="true">Start Transitive</button>
          <button class="btn primary" data-action="start-relational-session" data-mode="graph"><img class="btn-inline-icon" src="../brandingUI/icons/game/graph-directed.svg" alt="" aria-hidden="true">Start Graph</button>
          <button class="btn primary" data-action="start-relational-session" data-mode="propositional"><img class="btn-inline-icon" src="../brandingUI/icons/game/propositional.svg" alt="" aria-hidden="true">Start Propositional</button>
        </div>
        ${renderFlash()}
      </section>
    `;
  }

  const block = relSession.currentBlock;
  const trial = block && block.trialIndex >= 0 ? block.trials[block.trialIndex] : null;
  const trialNumber = block ? block.trialIndex + 1 : 0;
  const trialCount = block ? block.trials.length : 0;
  const responseCaptured = block ? block.responseCaptured : false;
  const coachNotice = relSession.coachNotice && relSession.phase === "block-result"
    ? `<div class="status coach">${escapeHtml(relSession.coachNotice)}</div>`
    : "";
  const coachState = block?.plan?.flags?.coachState;
  const pendingRelCoachState = relSession?.pendingPlanPatch?.flags?.coachState || null;
  const relCoachBriefingPreview = getCoachBriefingPreviewCopy(pendingRelCoachState);
  const runtimeInfo = block
    ? `Block ${block.plan.blockIndex}/${REL_TOTAL_BLOCKS} | ${wrapperDisplayName(relSession.wrapper)}${coachState ? ` | Coach: ${coachState}` : ""}`
    : "";
  const premiseBankMarkup = block && Array.isArray(block.blockMeta?.premiseBankLines) && block.blockMeta.premiseBankLines.length
    ? `
      <div class="premise-bank">
        <p class="hint">Premise bank (${block.blockMeta.premiseBankLines.length}):</p>
        <ul class="premise-bank-list">
          ${block.blockMeta.premiseBankLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
        </ul>
      </div>
    `
    : "";

  let phasePanel = "";
  if (relSession.phase === "briefing") {
    phasePanel = `
      <div class="hub-phase cue">
        <p class="hub-phase-title">Briefing</p>
        <p class="hint">Review the block briefing, then start when ready.</p>
      </div>
    `;
  } else if (relSession.phase === "cue") {
    phasePanel = `
      <div class="hub-phase cue">
        <p class="hub-phase-title">Focus Cue</p>
        <p class="hint">Mode: <strong>${escapeHtml(wrapperDisplayName(relSession.wrapper))}</strong> | Current N: <strong>${relSession.currentN}</strong></p>
        ${premiseBankMarkup}
        ${renderRelationalStimulus(null, false, runtimeInfo)}
        <p class="hint">Prepare for the next trial sequence.</p>
      </div>
    `;
  } else if (relSession.phase === "trial") {
    phasePanel = `
      <div class="hub-phase trial">
        <p class="hub-phase-title">Trial ${trialNumber} / ${trialCount}</p>
        <p>Press MATCH when the current token matches ${block.plan.n}-back.</p>
        ${renderRelationalStimulus(trial, block.stimulusVisible, runtimeInfo)}
        <div class="row">
          <button class="btn primary match-btn" data-action="rel-match" ${responseCaptured ? "disabled" : ""}>MATCH (Space)</button>
        </div>
        <p class="hint">${responseCaptured ? "Response recorded for this trial." : "Waiting for response."}</p>
      </div>
    `;
  } else if (relSession.phase === "quiz") {
    const quizItem = block.quizItems[block.quizIndex];
    const secsLeft = Math.max(0, Math.ceil((block.quizTimeLeftMs || 0) / 1000));
    const quizLocked = Boolean(block.quizAnswerCommitted);
    phasePanel = `
      <div class="hub-phase quiz">
        <p class="hub-phase-title">Quiz ${block.quizIndex + 1} / 2</p>
        <p class="rel-quiz-prompt">${escapeHtml(quizItem.prompt)}</p>
        <p class="hint">Time left: <strong>${secsLeft}s</strong> (timeout = incorrect)</p>
        <div class="row">
          <button class="btn quiz-btn" data-action="rel-quiz-answer" data-answer="true" ${quizLocked ? "disabled" : ""}>TRUE</button>
          <button class="btn quiz-btn" data-action="rel-quiz-answer" data-answer="false" ${quizLocked ? "disabled" : ""}>FALSE</button>
        </div>
      </div>
    `;
  } else {
    phasePanel = `
      <div class="hub-phase result">
        ${renderRelationalBlockSummary(relSession.lastBlockSummary)}
        <div class="row">
          <button class="btn primary" data-action="rel-next-block">Start Next Block</button>
        </div>
      </div>
    `;
  }

  return `
    <section class="card">
      <h2>Relational Training</h2>
      <div class="running-status-row">
        <span class="running-pill">Block ${relSession.blockCursor + (relSession.phase === "block-result" ? 0 : 1)} / ${REL_TOTAL_BLOCKS}</span>
        <span class="running-pill">N ${relSession.currentN}</span>
        <span class="running-pill">${escapeHtml(wrapperDisplayName(relSession.wrapper))}</span>
      </div>
      ${coachNotice}
      ${relSession.phase === "block-result" && relCoachBriefingPreview ? `<p class="hint">${escapeHtml(relCoachBriefingPreview)}</p>` : ""}
      ${phasePanel}
      ${renderFlash()}
    </section>
  `;
}

function renderHistory(history) {
  const items = history.map((session) => {
    const blockCount = Array.isArray(session.blocks) ? session.blocks.length : 0;
    const mode = Array.isArray(session.blocksPlanned) && session.blocksPlanned.length
      ? session.blocksPlanned[0].wrapper
      : "";
    const units = computeSessionUnits(session.blocks || []);
    const stats = computeSessionVisualStats(session);
    const quizCorrectTotal = Array.isArray(session.blocks)
      ? session.blocks.reduce((sum, block) => sum + Number(block.quizCorrect || 0), 0)
      : 0;
    const quizLine = session.wrapperFamily === "relational"
      ? `<p>Quiz: ${quizCorrectTotal}/${REL_TOTAL_BLOCKS * 2}</p>`
      : "";
    const modeText = mode ? wrapperDisplayName(mode) : "";
    return `
      <li class="history-item">
        <p><strong>${escapeHtml(wrapperDisplayName(mode || session.wrapperFamily || "session"))}</strong></p>
        <p>Date: ${escapeHtml(session.dateLocal || "")} | Blocks: ${blockCount}</p>
        <div class="history-mini-grid">
          <span>Peak ${stats.peakN}</span>
          <span>Final ${stats.finalN}</span>
          <span>+${units} units</span>
        </div>
        ${quizLine}
        ${modeText ? `<p class="hint">Mode: ${escapeHtml(modeText)}</p>` : ""}
      </li>
    `;
  }).join("");

  return `
    <section class="card">
      <h2>Progress History</h2>
      <p class="hint">Your completed sessions are saved locally on this device.</p>
      ${renderFlash()}
      ${history.length ? `<ul class="history-list">${items}</ul>` : "<p>No sessions yet.</p>"}
    </section>
  `;
}

function renderSettings(state) {
  return `
    <section class="card">
      <h2>Settings</h2>
      <div class="label-row">
        <label>
          <input class="toggle" id="sound-toggle" type="checkbox" ${state.settings.soundOn ? "checked" : ""}>
          Sound enabled
        </label>
      </div>
      <div class="row">
        <button class="btn" data-action="export-json">Export JSON</button>
        <button class="btn danger" data-action="reset-data">Reset Local Data</button>
      </div>
      <p class="hint">Export gives you a full backup of local training data.</p>
      ${renderFlash()}
    </section>
  `;
}

function renderSplashOverlay() {
  return `
    <div class="app-overlay">
      <div class="overlay-backdrop" data-action="splash-dismiss"></div>
      <div class="overlay-card splash-overlay" data-action="splash-dismiss">
        <img class="splash-logo" src="../brandingUI/Trident-G-Icon.svg" alt="Trident G">
        <h2>Capacity Gym</h2>
        <p>Train your mind.</p>
        <p class="hint">Tap anywhere or press Space / Enter / Escape.</p>
      </div>
    </div>
  `;
}

function renderHubBriefingOverlay() {
  if (!hubSession || hubSession.status !== "running" || hubSession.phase !== "briefing" || !hubSession.currentBlock) {
    return "";
  }
  const block = hubSession.currentBlock;
  const coachPreview = getCoachBriefingPreviewCopy(block.plan?.flags?.coachState);
  const canTapDismiss = uiState.overlayCanTapDismiss;
  return `
    <div class="app-overlay ${canTapDismiss ? "backdrop-dismissable" : ""}">
      <div class="overlay-backdrop" ${canTapDismiss ? 'data-action="briefing-dismiss"' : ""}></div>
      <div class="overlay-card">
        <h3>Block ${block.plan.blockIndex} of ${HUB_TOTAL_BLOCKS}</h3>
        <p>Target: <strong>${escapeHtml(modalityLabel(block.plan.targetModality))}</strong></p>
        <p>N-Back: <strong>${block.plan.n}</strong></p>
        <p>Pace: <strong>${block.plan.speed}</strong> | Interference: <strong>${block.plan.interference}</strong></p>
        <p class="hint">Press MATCH only when the target repeats at N-back.</p>
        ${coachPreview ? `<p class="hint">${escapeHtml(coachPreview)}</p>` : ""}
        <div class="overlay-actions">
          <button class="btn primary" data-action="hub-start-block">Start Block</button>
        </div>
        ${canTapDismiss ? '<p class="hint">Tip: tap outside to start quickly.</p>' : '<p class="hint">Block 1 includes a full start confirmation.</p>'}
      </div>
    </div>
  `;
}

function renderRelationalBriefingOverlay() {
  if (!relSession || relSession.status !== "running" || relSession.phase !== "briefing" || !relSession.currentBlock) {
    return "";
  }
  const block = relSession.currentBlock;
  const coachPreview = getCoachBriefingPreviewCopy(block.plan?.flags?.coachState);
  const canTapDismiss = uiState.overlayCanTapDismiss;
  return `
    <div class="app-overlay ${canTapDismiss ? "backdrop-dismissable" : ""}">
      <div class="overlay-backdrop" ${canTapDismiss ? 'data-action="briefing-dismiss"' : ""}></div>
      <div class="overlay-card">
        <h3>Block ${block.plan.blockIndex} of ${REL_TOTAL_BLOCKS}</h3>
        <p>Mode: <strong>${escapeHtml(wrapperDisplayName(relSession.wrapper))}</strong></p>
        <p>N-Back: <strong>${block.plan.n}</strong></p>
        <p>Pace: <strong>${block.plan.speed}</strong> | Interference: <strong>${block.plan.interference}</strong></p>
        <p class="hint">Press MATCH only when current token matches ${block.plan.n}-back.</p>
        ${coachPreview ? `<p class="hint">${escapeHtml(coachPreview)}</p>` : ""}
        <div class="overlay-actions">
          <button class="btn primary" data-action="rel-start-block">Start Block</button>
        </div>
        ${canTapDismiss ? '<p class="hint">Tip: tap outside to start quickly.</p>' : '<p class="hint">Block 1 includes a full start confirmation.</p>'}
      </div>
    </div>
  `;
}

function renderUnlockCelebrationOverlay() {
  return `
    <div class="app-overlay">
      <div class="overlay-backdrop" data-action="unlock-close"></div>
      <div class="overlay-card">
        <h3>Relational Modes Unlocked</h3>
        <p>You qualified in both Hub wrappers. Relational modes are now available.</p>
        <div class="unlock-icons">
          <span class="unlock-icon"><img src="../brandingUI/icons/game/transitive-order.svg" alt="Transitive"></span>
          <span class="unlock-icon"><img src="../brandingUI/icons/game/graph-directed.svg" alt="Graph"></span>
          <span class="unlock-icon"><img src="../brandingUI/icons/game/propositional.svg" alt="Propositional"></span>
        </div>
        <div class="overlay-actions">
          <button class="btn primary" data-action="unlock-go-relational">Go to Relational</button>
          <button class="btn" data-action="unlock-close">Return Home</button>
        </div>
      </div>
    </div>
  `;
}

function renderActiveOverlay(state) {
  ensureSplashTimer();
  if (uiState.showSplash) {
    return renderSplashOverlay();
  }
  if (uiState.activeOverlay === "briefing") {
    if (hubSession && hubSession.status === "running" && hubSession.phase === "briefing") {
      return renderHubBriefingOverlay();
    }
    if (relSession && relSession.status === "running" && relSession.phase === "briefing") {
      return renderRelationalBriefingOverlay();
    }
    closeBriefingOverlay();
  }
  showUnlockCelebrationIfPending(state);
  if (uiState.activeOverlay === "unlock-celebration") {
    return renderUnlockCelebrationOverlay();
  }
  return "";
}

function dropRunningSessionsIfLeaving(route) {
  if (route !== "play-hub" && hubSession && hubSession.status === "running") {
    clearHubTimers();
    hubSession = null;
    closeBriefingOverlay();
    setFlash("Hub session stopped because you left Play Hub before completion.", "warn");
  }
  if (route !== "play-relational" && relSession && relSession.status === "running") {
    clearRelTimers();
    relSession = null;
    closeBriefingOverlay();
    setFlash("Relational session stopped because you left Play Relational before completion.", "warn");
  }
}

function render() {
  const route = ensureRoute();
  if (!route) {
    return;
  }

  dropRunningSessionsIfLeaving(route);
  const state = loadStateWithSyncedUnlocks();
  updateShellHeaderStats(buildShellViewModel(state));
  setActiveNav(route);
  const primaryScreen = resolvePrimaryScreen({ route, hubSession, relSession, uiState });
  const pageHtml = renderPrimaryScreen(primaryScreen, {
    home: () => renderHome(state),
    hub: () => renderPlayHub(),
    relational: () => renderPlayRelational(state),
    history: () => renderHistory(getSessionHistory()),
    settings: () => renderSettings(state)
  });
  const overlayHtml = renderActiveOverlay(state);
  appRoot.innerHTML = `${pageHtml}${overlayHtml}`;
}

function startHubSession() {
  clearHubTimers();
  clearFlash();
  dismissUnlockCelebration();
  closeBriefingOverlay();
  const state = loadGymState();
  const firstHubRun = isFirstHubRun(state);
  const tsStart = Date.now();
  const selectedWrapper = normalizeHubWrapper(hubPreferences.wrapper);
  const sessionSeed = hash32(String(tsStart));
  const initialWrapper = firstHubRun ? FIRST_RUN_BASELINE_BLOCK.wrapper : selectedWrapper;
  const initialN = firstHubRun ? FIRST_RUN_BASELINE_BLOCK.n : 1;
  const initialSpeed = firstHubRun ? FIRST_RUN_BASELINE_BLOCK.speed : undefined;
  const initialInterference = firstHubRun ? FIRST_RUN_BASELINE_BLOCK.interference : undefined;

  hubSession = {
    status: "running",
    phase: "briefing",
    tsStart,
    sessionSeed,
    blockCursor: 0,
    currentN: 1,
    blocksPlanned: [],
    blocks: [],
    completedBlocks: [],
    coachContext: {
      pendingStabilise: false,
      pendingSwapReturnWrapper: null
    },
    pendingPlanPatch: {
      wrapper: initialWrapper,
      ...(initialN ? { n: initialN } : {}),
      ...(initialSpeed ? { speed: initialSpeed } : {}),
      ...(initialInterference ? { interference: initialInterference } : {}),
      flags: {
        coachState: "STABILISE",
        pulseType: null,
        swapSegment: null,
        wasSwapProbe: false
      }
    },
    introNotice: firstHubRun ? "Starting with a gentle baseline block." : "",
    coachNotice: "",
    missionStartRecorded: false,
    currentBlock: null,
    lastBlockSummary: null,
    sessionSummary: null,
    progressDelta: null
  };

  updateSettings({
    lastWrapper: initialWrapper,
    lastSpeed: hubPreferences.speed,
    lastInterference: hubPreferences.interference
  });

  beginHubBlock();
}

function beginHubBlock() {
  if (!hubSession || hubSession.status !== "running") {
    return;
  }
  if (hubSession.blockCursor >= HUB_TOTAL_BLOCKS) {
    completeHubSession();
    return;
  }

  const blockIndex = hubSession.blockCursor + 1;
  const blockIndexZero = hubSession.blockCursor;
  const lastPlan = hubSession.blocksPlanned.length
    ? hubSession.blocksPlanned[hubSession.blocksPlanned.length - 1]
    : null;
  const pendingPatch = hubSession.pendingPlanPatch && typeof hubSession.pendingPlanPatch === "object"
    ? hubSession.pendingPlanPatch
    : {};
  const pendingFlags = pendingPatch.flags && typeof pendingPatch.flags === "object" ? pendingPatch.flags : {};
  const isOverrideCoachState = pendingFlags.coachState === "TUNE" || pendingFlags.coachState === "SPIKE_TUNE";
  const patchWithDefaultOverride = isOverrideCoachState && !pendingFlags.userOverride
    ? {
      ...pendingPatch,
      flags: {
        ...pendingFlags,
        userOverride: "coach"
      }
    }
    : pendingPatch;

  const wrapper = patchWithDefaultOverride.wrapper
    ? normalizeHubWrapper(patchWithDefaultOverride.wrapper)
    : normalizeHubWrapper(lastPlan?.wrapper || hubPreferences.wrapper);
  const targetModality = normalizeHubTargetModality(patchWithDefaultOverride.targetModality, blockIndex);
  const mappingSeed = wrapper === "hub_noncat"
    ? hash32(`${hubSession.sessionSeed}:hub_noncat:v1:${blockIndexZero}`)
    : undefined;
  const nextN = Number.isFinite(patchWithDefaultOverride.n)
    ? Math.max(1, Math.min(HUB_N_MAX, Math.round(patchWithDefaultOverride.n)))
    : hubSession.currentN;
  const speed = patchWithDefaultOverride.speed
    ? normalizeHubSpeed(patchWithDefaultOverride.speed)
    : normalizeHubSpeed(hubPreferences.speed);
  const interference = patchWithDefaultOverride.interference
    ? normalizeHubInterference(patchWithDefaultOverride.interference)
    : normalizeHubInterference(hubPreferences.interference);
  const flags = normalizeCoachFlags(patchWithDefaultOverride.flags);

  const plan = createHubBlockPlan({
    wrapper,
    blockIndex,
    n: nextN,
    speed,
    interference,
    targetModality,
    mappingSeed,
    flags
  });
  if (plan.flags && flags?.userOverride) {
    plan.flags.userOverride = flags.userOverride;
  }
  const blockBuild = createHubBlockTrials({
    wrapper: plan.wrapper,
    n: plan.n,
    targetModality: plan.targetModality,
    speed: plan.speed,
    interference: plan.interference,
    mappingSeed: plan.mappingSeed,
    baseTrials: HUB_BASE_TRIALS,
    seed: Date.now() + blockIndex
  });
  console.log("[BLOCK START]", {
    blockIndex,
    planSpeed: plan.speed,
    planInterference: plan.interference,
    effectiveSoaMs: blockBuild.soaMs
  });

  hubSession.pendingPlanPatch = {};
  hubSession.blocksPlanned.push(plan);
  hubSession.currentBlock = {
    plan,
    trials: blockBuild.trials,
    soaMs: blockBuild.soaMs,
    displayMs: blockBuild.displayMs,
    renderMapping: blockBuild.renderMapping,
    trialIndex: -1,
    stimulusVisible: false,
    responseCaptured: false,
    responseRtMs: null,
    trialStartedAtMs: 0,
    trialOutcomes: []
  };
  clearHubTimers();
  hubSession.phase = "briefing";
  showBriefingOverlay(blockIndex > 1);
  render();
}

function startHubCue() {
  if (!hubSession || hubSession.status !== "running" || !hubSession.currentBlock) {
    return;
  }
  if (hubSession.phase !== "briefing") {
    return;
  }
  closeBriefingOverlay();
  hubSession.phase = "cue";
  render();
  clearHubTimers();
  hubTimers.cue = setTimeout(() => {
    startHubTrial(0);
  }, HUB_CUE_MS);
}

function startHubTrial(trialIndex) {
  if (!hubSession || hubSession.status !== "running" || !hubSession.currentBlock) {
    return;
  }

  const block = hubSession.currentBlock;
  if (trialIndex === 0 && !hubSession.missionStartRecorded) {
    registerMissionSessionStart();
    hubSession.missionStartRecorded = true;
  }
  block.trialIndex = trialIndex;
  block.stimulusVisible = true;
  block.responseCaptured = false;
  block.responseRtMs = null;
  block.trialStartedAtMs = performance.now();
  hubSession.phase = "trial";

  render();
  if (hubTimers.display) {
    clearTimeout(hubTimers.display);
  }
  if (hubTimers.trial) {
    clearTimeout(hubTimers.trial);
  }

  hubTimers.display = setTimeout(() => {
    if (!hubSession || hubSession.status !== "running" || hubSession.phase !== "trial") {
      return;
    }
    const current = hubSession.currentBlock;
    if (!current || current.trialIndex !== trialIndex) {
      return;
    }
    current.stimulusVisible = false;
    render();
  }, block.displayMs);

  hubTimers.trial = setTimeout(() => {
    finishHubTrial();
  }, block.soaMs);
}

function captureHubResponse() {
  if (!hubSession || hubSession.status !== "running" || hubSession.phase !== "trial" || !hubSession.currentBlock) {
    return false;
  }
  const block = hubSession.currentBlock;
  if (block.responseCaptured) {
    return false;
  }
  block.responseCaptured = true;
  block.responseRtMs = Math.max(0, Math.round(performance.now() - block.trialStartedAtMs));
  render();
  return true;
}

function finishHubTrial() {
  if (!hubSession || hubSession.status !== "running" || !hubSession.currentBlock) {
    return;
  }
  const block = hubSession.currentBlock;
  const trial = block.trials[block.trialIndex];
  const isMatch = isHubMatchAtIndex(block.trials, block.trialIndex, block.plan.n);
  const responded = block.responseCaptured;

  let classification = "correct_rejection";
  let isError = false;
  if (responded && isMatch) {
    classification = "hit";
  } else if (responded && !isMatch) {
    classification = "false_alarm";
    isError = true;
  } else if (!responded && isMatch) {
    classification = "miss";
    isError = true;
  }

  block.trialOutcomes.push({
    trialIndex: block.trialIndex,
    canonKey: trial.canonKey,
    isMatch,
    isLure: Boolean(trial.isLure),
    responded,
    rtMs: responded ? block.responseRtMs : null,
    isError,
    // Hub lapse is defined as timeout on match-required trials only.
    isLapse: !responded && isMatch,
    classification
  });

  if (hubTimers.display) {
    clearTimeout(hubTimers.display);
    hubTimers.display = null;
  }
  if (hubTimers.trial) {
    clearTimeout(hubTimers.trial);
    hubTimers.trial = null;
  }

  const nextTrialIndex = block.trialIndex + 1;
  if (nextTrialIndex < block.trials.length) {
    startHubTrial(nextTrialIndex);
    return;
  }
  finishHubBlock();
}

function finishHubBlock() {
  if (!hubSession || hubSession.status !== "running" || !hubSession.currentBlock) {
    return;
  }

  const block = hubSession.currentBlock;
  const blockSummary = summarizeHubBlock({
    plan: block.plan,
    trials: block.trials,
    trialOutcomes: block.trialOutcomes,
    nMax: HUB_N_MAX
  });

  hubSession.blocks.push(blockSummary.blockResult);
  hubSession.lastBlockSummary = {
    ...blockSummary.blockResult,
    outcomeBand: blockSummary.outcomeBand
  };
  hubSession.completedBlocks.push({
    plan: block.plan,
    result: blockSummary.blockResult,
    outcomeBand: blockSummary.outcomeBand
  });
  hubSession.currentN = blockSummary.nEnd;
  hubSession.blockCursor += 1;
  hubSession.currentBlock = null;

  if (hubSession.blockCursor >= HUB_TOTAL_BLOCKS) {
    completeHubSession();
    return;
  }

  const coachDecision = coachUpdateAfterBlock(hubSession.lastBlockSummary, {
    completedBlocks: hubSession.completedBlocks,
    coachContext: hubSession.coachContext
  });
  if (coachDecision && typeof coachDecision === "object") {
    hubSession.pendingPlanPatch = coachDecision.patch && typeof coachDecision.patch === "object"
      ? coachDecision.patch
      : {};
    hubSession.coachContext = coachDecision.coachContext && typeof coachDecision.coachContext === "object"
      ? coachDecision.coachContext
      : hubSession.coachContext;
    const coachState = coachDecision.patch?.flags?.coachState;
    hubSession.coachNotice = makeCoachNarrative(coachState, typeof coachDecision.notice === "string" ? coachDecision.notice : "");
  } else {
    hubSession.pendingPlanPatch = {};
    hubSession.coachNotice = "";
  }

  hubSession.phase = "block-result";
  render();
}

function completeHubSession() {
  if (!hubSession || hubSession.status !== "running") {
    return;
  }
  clearHubTimers();

  const stateBefore = loadGymState();
  const wasLocked = !deriveRelationalUnlockProgress(stateBefore.history).relationalUnlocked;
  const tsEnd = Date.now();
  const summary = createHubSessionSummary({
    tsStart: hubSession.tsStart,
    tsEnd,
    blocksPlanned: hubSession.blocksPlanned,
    blocks: hubSession.blocks
  });
  appendSessionSummary(summary);
  const progressDelta = applySessionProgressAndSave(summary, "hub");
  const stateAfter = loadStateWithSyncedUnlocks();
  const nowUnlocked = deriveRelationalUnlockProgress(stateAfter.history).relationalUnlocked;
  if (wasLocked && nowUnlocked) {
    queueUnlockCelebration();
  }
  updateSettings({ hasRunHubBefore: true });

  hubSession.status = "completed";
  hubSession.phase = "session-done";
  hubSession.sessionSummary = summary;
  hubSession.progressDelta = progressDelta;
  setFlash("Hub session complete and saved to History.", "success");
  render();
}

function startRelationalSession(mode) {
  const state = loadStateWithSyncedUnlocks();
  const unlockProgress = deriveRelationalUnlockProgress(state.history);
  if (!unlockProgress.relationalUnlocked) {
    setFlash("Relational modes are locked. Complete qualifying hub_cat and hub_noncat sessions first.", "warn");
    render();
    return;
  }

  const modeDef = REL_MODE_MAP[mode];
  if (!modeDef) {
    setFlash("Unknown relational mode.", "warn");
    render();
    return;
  }

  clearRelTimers();
  clearFlash();
  dismissUnlockCelebration();
  closeBriefingOverlay();
  const tsStart = Date.now();
  const sessionSeed = hash32(`${tsStart}:${mode}`);
  relSession = {
    status: "running",
    phase: "briefing",
    wrapper: mode,
    modeDef,
    sessionContext: modeDef.buildSessionContext(sessionSeed),
    tsStart,
    sessionSeed,
    blockCursor: 0,
    currentN: 1,
    blocksPlanned: [],
    blocks: [],
    completedBlocks: [],
    coachContext: {
      pendingStabilise: false,
      consolidateNextSession: false
    },
    pendingPlanPatch: {
      speed: "slow",
      interference: "low",
      flags: {
        coachState: null,
        pulseType: null,
        swapSegment: null,
        wasSwapProbe: false
      }
    },
    coachNotice: "",
    missionStartRecorded: false,
    currentBlock: null,
    lastBlockSummary: null,
    sessionSummary: null,
    progressDelta: null
  };
  beginRelationalBlock();
}

function beginRelationalBlock() {
  if (!relSession || relSession.status !== "running") {
    return;
  }
  if (relSession.blockCursor >= REL_TOTAL_BLOCKS) {
    completeRelationalSession();
    return;
  }

  const blockIndex = relSession.blockCursor + 1;
  const pendingPatch = relSession.pendingPlanPatch && typeof relSession.pendingPlanPatch === "object"
    ? relSession.pendingPlanPatch
    : {};
  const nextN = Number.isFinite(pendingPatch.n)
    ? Math.max(1, Math.min(REL_N_MAX, Math.round(pendingPatch.n)))
    : relSession.currentN;
  const speed = pendingPatch.speed
    ? normalizeHubSpeed(pendingPatch.speed)
    : "slow";
  const interference = pendingPatch.interference
    ? normalizeHubInterference(pendingPatch.interference)
    : "low";
  const flags = normalizeRelationalCoachFlags(pendingPatch.flags);
  const plan = createRelationalBlockPlan({
    wrapper: relSession.wrapper,
    blockIndex,
    n: nextN,
    speed,
    interference,
    flags
  });
  const blockBuild = createRelationalBlockTrials({
    modeDef: relSession.modeDef,
    sessionContext: relSession.sessionContext,
    sessionSeed: relSession.sessionSeed,
    blockIndex,
    n: plan.n,
    speed: plan.speed,
    baseTrials: REL_BASE_TRIALS,
    seed: Date.now() + blockIndex
  });

  relSession.pendingPlanPatch = {
    speed: "slow",
    interference: "low",
    flags: {
      coachState: null,
      pulseType: null,
      swapSegment: null,
      wasSwapProbe: false
    }
  };
  relSession.blocksPlanned.push(plan);
  relSession.currentBlock = {
    plan,
    trials: blockBuild.trials,
    quizItems: blockBuild.quizItems,
    soaMs: blockBuild.soaMs,
    displayMs: blockBuild.displayMs,
    blockVisualState: blockBuild.blockVisualState,
    blockSeed: blockBuild.blockSeed,
    blockMeta: blockBuild.blockMeta,
    trialIndex: -1,
    stimulusVisible: false,
    responseCaptured: false,
    responseRtMs: null,
    trialStartedAtMs: 0,
    trialOutcomes: [],
    quizIndex: -1,
    quizOutcomes: [],
    quizItemStartedAtMs: 0,
    quizTimeLeftMs: REL_QUIZ_TIMEOUT_MS,
    quizAnswerCommitted: false
  };
  clearRelTimers();
  relSession.phase = "briefing";
  showBriefingOverlay(blockIndex > 1);
  render();
}

function startRelationalCue() {
  if (!relSession || relSession.status !== "running" || !relSession.currentBlock) {
    return;
  }
  if (relSession.phase !== "briefing") {
    return;
  }
  closeBriefingOverlay();
  relSession.phase = "cue";
  render();
  clearRelTimers();
  relTimers.cue = setTimeout(() => {
    startRelationalTrial(0);
  }, REL_CUE_MS);
}

function startRelationalTrial(trialIndex) {
  if (!relSession || relSession.status !== "running" || !relSession.currentBlock) {
    return;
  }
  const block = relSession.currentBlock;
  if (trialIndex === 0 && !relSession.missionStartRecorded) {
    registerMissionSessionStart();
    relSession.missionStartRecorded = true;
  }
  block.trialIndex = trialIndex;
  block.stimulusVisible = true;
  block.responseCaptured = false;
  block.responseRtMs = null;
  block.trialStartedAtMs = performance.now();
  relSession.phase = "trial";

  render();
  if (relTimers.display) {
    clearTimeout(relTimers.display);
  }
  if (relTimers.trial) {
    clearTimeout(relTimers.trial);
  }

  relTimers.display = setTimeout(() => {
    if (!relSession || relSession.status !== "running" || relSession.phase !== "trial") {
      return;
    }
    const current = relSession.currentBlock;
    if (!current || current.trialIndex !== trialIndex) {
      return;
    }
    current.stimulusVisible = false;
    render();
  }, block.displayMs);

  relTimers.trial = setTimeout(() => {
    finishRelationalTrial();
  }, block.soaMs);
}

function captureRelationalMatch() {
  if (!relSession || relSession.status !== "running" || relSession.phase !== "trial" || !relSession.currentBlock) {
    return false;
  }
  const block = relSession.currentBlock;
  if (block.responseCaptured) {
    return false;
  }
  block.responseCaptured = true;
  block.responseRtMs = Math.max(0, Math.round(performance.now() - block.trialStartedAtMs));
  render();
  return true;
}

function finishRelationalTrial() {
  if (!relSession || relSession.status !== "running" || !relSession.currentBlock) {
    return;
  }
  const block = relSession.currentBlock;
  const trial = block.trials[block.trialIndex];
  const isMatch = isRelationalMatchAtIndex(block.trials, block.trialIndex, block.plan.n);
  const responded = block.responseCaptured;

  let classification = "correct_rejection";
  let isError = false;
  if (responded && isMatch) {
    classification = "hit";
  } else if (responded && !isMatch) {
    classification = "false_alarm";
    isError = true;
  } else if (!responded && isMatch) {
    classification = "miss";
    isError = true;
  }

  block.trialOutcomes.push({
    trialIndex: block.trialIndex,
    canonKey: trial.canonKey,
    isMatch,
    responded,
    rtMs: responded ? block.responseRtMs : null,
    isError,
    isLapse: !responded && isMatch,
    classification
  });

  if (relTimers.display) {
    clearTimeout(relTimers.display);
    relTimers.display = null;
  }
  if (relTimers.trial) {
    clearTimeout(relTimers.trial);
    relTimers.trial = null;
  }

  const nextTrialIndex = block.trialIndex + 1;
  if (nextTrialIndex < block.trials.length) {
    startRelationalTrial(nextTrialIndex);
    return;
  }
  startRelationalQuizItem(0);
}

function startRelationalQuizItem(quizIndex) {
  if (!relSession || relSession.status !== "running" || !relSession.currentBlock) {
    return;
  }
  const block = relSession.currentBlock;
  if (quizIndex >= block.quizItems.length) {
    finishRelationalBlock();
    return;
  }

  block.quizIndex = quizIndex;
  block.quizItemStartedAtMs = performance.now();
  block.quizTimeLeftMs = REL_QUIZ_TIMEOUT_MS;
  block.quizAnswerCommitted = false;
  relSession.phase = "quiz";

  if (relTimers.quizTimeout) {
    clearTimeout(relTimers.quizTimeout);
  }
  if (relTimers.quizTick) {
    clearInterval(relTimers.quizTick);
  }
  if (relTimers.quizAdvance) {
    clearTimeout(relTimers.quizAdvance);
    relTimers.quizAdvance = null;
  }

  relTimers.quizTimeout = setTimeout(() => {
    submitRelationalQuizAnswer(null);
  }, REL_QUIZ_TIMEOUT_MS);
  relTimers.quizTick = setInterval(() => {
    if (!relSession || relSession.status !== "running" || relSession.phase !== "quiz" || !relSession.currentBlock) {
      return;
    }
    const current = relSession.currentBlock;
    if (current.quizIndex !== quizIndex) {
      return;
    }
    const elapsed = performance.now() - current.quizItemStartedAtMs;
    current.quizTimeLeftMs = Math.max(0, REL_QUIZ_TIMEOUT_MS - Math.round(elapsed));
    render();
  }, 200);

  render();
}

function submitRelationalQuizAnswer(userAnswer) {
  if (!relSession || relSession.status !== "running" || relSession.phase !== "quiz" || !relSession.currentBlock) {
    return;
  }
  const block = relSession.currentBlock;
  if (block.quizAnswerCommitted) {
    return;
  }
  block.quizAnswerCommitted = true;
  if (block.quizIndex < 0 || block.quizIndex >= block.quizItems.length) {
    return;
  }
  const quizItem = block.quizItems[block.quizIndex];
  if (!quizItem) {
    return;
  }
  const nextQuizIndex = block.quizIndex + 1;
  const responseTime = performance.now();
  const rtMs = userAnswer === null
    ? null
    : Math.max(0, Math.round(responseTime - block.quizItemStartedAtMs));
  const isCorrect = userAnswer !== null && userAnswer === quizItem.answerTrue;

  block.quizOutcomes.push({
    prompt: quizItem.prompt,
    answerTrue: quizItem.answerTrue,
    userAnswer,
    isCorrect,
    rtMs
  });

  if (relTimers.quizTimeout) {
    clearTimeout(relTimers.quizTimeout);
    relTimers.quizTimeout = null;
  }
  if (relTimers.quizTick) {
    clearInterval(relTimers.quizTick);
    relTimers.quizTick = null;
  }
  if (relTimers.quizAdvance) {
    clearTimeout(relTimers.quizAdvance);
  }
  relTimers.quizAdvance = setTimeout(() => {
    startRelationalQuizItem(nextQuizIndex);
  }, 80);

  render();
}

function finishRelationalBlock() {
  if (!relSession || relSession.status !== "running" || !relSession.currentBlock) {
    return;
  }
  const block = relSession.currentBlock;
  const blockSummary = summarizeRelationalBlock({
    plan: block.plan,
    trials: block.trials,
    trialOutcomes: block.trialOutcomes,
    quizOutcomes: block.quizOutcomes,
    nMax: REL_N_MAX
  });

  relSession.blocks.push(blockSummary.blockResult);
  relSession.lastBlockSummary = {
    ...blockSummary.blockResult,
    outcomeBand: blockSummary.outcomeBand
  };
  relSession.completedBlocks.push({
    plan: block.plan,
    result: blockSummary.blockResult,
    outcomeBand: blockSummary.outcomeBand
  });
  relSession.currentN = blockSummary.nEnd;
  relSession.blockCursor += 1;
  relSession.currentBlock = null;

  if (relSession.blockCursor >= REL_TOTAL_BLOCKS) {
    completeRelationalSession();
    return;
  }

  const coachDecision = relationalCoachUpdateAfterBlock(relSession.lastBlockSummary, {
    completedBlocks: relSession.completedBlocks,
    coachContext: relSession.coachContext
  });
  if (coachDecision && typeof coachDecision === "object") {
    relSession.pendingPlanPatch = coachDecision.patch && typeof coachDecision.patch === "object"
      ? coachDecision.patch
      : {
        speed: "slow",
        interference: "low",
        flags: {
          coachState: null,
          pulseType: null,
          swapSegment: null,
          wasSwapProbe: false
        }
      };
    relSession.coachContext = coachDecision.coachContext && typeof coachDecision.coachContext === "object"
      ? coachDecision.coachContext
      : relSession.coachContext;
    const coachState = coachDecision.patch?.flags?.coachState;
    relSession.coachNotice = makeCoachNarrative(coachState, typeof coachDecision.notice === "string" ? coachDecision.notice : "");
  } else {
    relSession.pendingPlanPatch = {
      speed: "slow",
      interference: "low",
      flags: {
        coachState: null,
        pulseType: null,
        swapSegment: null,
        wasSwapProbe: false
      }
    };
    relSession.coachNotice = "";
  }

  relSession.phase = "block-result";
  render();
}

function completeRelationalSession() {
  if (!relSession || relSession.status !== "running") {
    return;
  }
  clearRelTimers();

  const stateBefore = loadGymState();
  const wasLocked = !deriveRelationalUnlockProgress(stateBefore.history).relationalUnlocked;
  const tsEnd = Date.now();
  const summary = createRelationalSessionSummary({
    wrapper: relSession.wrapper,
    tsStart: relSession.tsStart,
    tsEnd,
    blocksPlanned: relSession.blocksPlanned,
    blocks: relSession.blocks
  });
  appendSessionSummary(summary);
  const progressDelta = applySessionProgressAndSave(summary, "relational");
  const stateAfter = loadStateWithSyncedUnlocks();
  const nowUnlocked = deriveRelationalUnlockProgress(stateAfter.history).relationalUnlocked;
  if (wasLocked && nowUnlocked) {
    queueUnlockCelebration();
  }

  relSession.status = "completed";
  relSession.phase = "session-done";
  relSession.sessionSummary = summary;
  relSession.progressDelta = progressDelta;
  setFlash("Relational session complete and saved to History.", "success");
  render();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  const action = target.getAttribute("data-action");

  if (action === "splash-dismiss") {
    dismissSplashOverlay();
    return;
  }

  if (uiState.showSplash) {
    return;
  }

  if (action === "hub-start-block") {
    startHubCue();
    return;
  }

  if (action === "rel-start-block") {
    startRelationalCue();
    return;
  }

  if (action === "briefing-dismiss") {
    if (!uiState.overlayCanTapDismiss) {
      return;
    }
    if (hubSession && hubSession.status === "running" && hubSession.phase === "briefing") {
      startHubCue();
      return;
    }
    if (relSession && relSession.status === "running" && relSession.phase === "briefing") {
      startRelationalCue();
      return;
    }
    return;
  }

  if (action === "unlock-go-relational") {
    dismissUnlockCelebration();
    window.location.hash = "/play-relational";
    render();
    return;
  }

  if (action === "unlock-close") {
    dismissUnlockCelebration();
    window.location.hash = "/home";
    render();
    return;
  }

  if (action === "go-play-hub") {
    window.location.hash = "/play-hub";
    return;
  }

  if (action === "go-home") {
    window.location.hash = "/home";
    return;
  }

  if (action === "start-hub-session") {
    startHubSession();
    return;
  }

  if (action === "start-relational-session") {
    const mode = target.getAttribute("data-mode") || "transitive";
    startRelationalSession(mode);
    return;
  }

  if (action === "hub-match") {
    captureHubResponse();
    return;
  }

  if (action === "hub-accept-coach") {
    if (hubSession && hubSession.status === "running" && hubSession.phase === "block-result") {
      const pendingPatch = hubSession.pendingPlanPatch && typeof hubSession.pendingPlanPatch === "object"
        ? hubSession.pendingPlanPatch
        : {};
      const pendingFlags = pendingPatch.flags && typeof pendingPatch.flags === "object"
        ? pendingPatch.flags
        : {};
      hubSession.pendingPlanPatch = {
        ...pendingPatch,
        flags: {
          ...pendingFlags,
          userOverride: "coach"
        }
      };
      render();
    }
    return;
  }

  if (action === "hub-try-alternative") {
    if (hubSession && hubSession.status === "running" && hubSession.phase === "block-result") {
      const pendingPatch = hubSession.pendingPlanPatch && typeof hubSession.pendingPlanPatch === "object"
        ? hubSession.pendingPlanPatch
        : {};
      const alternativePatch = resolveHubAlternativePatch(hubSession, pendingPatch);
      if (!alternativePatch) {
        setFlash("Coach recommendation is optimal right now.", "warn");
        render();
        return;
      }
      hubSession.pendingPlanPatch = {
        ...pendingPatch,
        ...alternativePatch,
        flags: {
          ...(pendingPatch.flags && typeof pendingPatch.flags === "object" ? pendingPatch.flags : {}),
          ...(alternativePatch.flags || {}),
          userOverride: "alternative"
        }
      };
      hubSession.coachNotice = "Alternative challenge selected for next block.";
      render();
    }
    return;
  }

  if (action === "rel-match") {
    captureRelationalMatch();
    return;
  }

  if (action === "hub-next-block") {
    beginHubBlock();
    return;
  }

  if (action === "rel-next-block") {
    beginRelationalBlock();
    return;
  }

  if (action === "rel-quiz-answer") {
    const answer = target.getAttribute("data-answer");
    if (answer === "true") {
      submitRelationalQuizAnswer(true);
      return;
    }
    if (answer === "false") {
      submitRelationalQuizAnswer(false);
      return;
    }
  }

  clearFlash();

  if (action === "export-json") {
    const payload = exportGymStateJson();
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStamp = new Date().toISOString().replaceAll(":", "-");
    a.href = url;
    a.download = `capacity-gym-stage1-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setFlash("Export completed.", "success");
    render();
    return;
  }

  if (action === "reset-data") {
    const confirmed = window.confirm("Reset all Capacity Gym Stage 1 local data?");
    if (!confirmed) {
      setFlash("Reset cancelled.", "warn");
      render();
      return;
    }
    clearHubTimers();
    hubSession = null;
    clearRelTimers();
    relSession = null;
    closeBriefingOverlay();
    dismissUnlockCelebration();
    resetGymState();
    hubPreferences.wrapper = FIRST_RUN_BASELINE_BLOCK.wrapper;
    hubPreferences.speed = FIRST_RUN_BASELINE_BLOCK.speed;
    hubPreferences.interference = FIRST_RUN_BASELINE_BLOCK.interference;
    updateSettings({
      lastWrapper: hubPreferences.wrapper,
      lastSpeed: hubPreferences.speed,
      lastInterference: hubPreferences.interference,
      hasRunHubBefore: false
    });
    setFlash("Local data reset complete.", "success");
    render();
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
    return;
  }
  const wrapperLocked = Boolean(hubSession && hubSession.status === "running");
  const hubLocked = Boolean(hubSession && hubSession.status === "running" && (hubSession.phase === "cue" || hubSession.phase === "trial"));

  if (target.id === "sound-toggle" && target instanceof HTMLInputElement) {
    updateSettings({ soundOn: target.checked });
    setFlash("Settings saved.", "success");
    render();
    return;
  }

  if (target.id === "hub-wrapper-select" && !wrapperLocked) {
    hubPreferences.wrapper = target.value === "hub_noncat" ? "hub_noncat" : "hub_cat";
    updateSettings({ lastWrapper: hubPreferences.wrapper });
    render();
    return;
  }

  if (target.id === "hub-speed-select" && !hubLocked) {
    hubPreferences.speed = target.value === "fast" ? "fast" : "slow";
    updateSettings({ lastSpeed: hubPreferences.speed });
    render();
    return;
  }

  if (target.id === "hub-interference-select" && !hubLocked) {
    hubPreferences.interference = target.value === "high" ? "high" : "low";
    updateSettings({ lastInterference: hubPreferences.interference });
    render();
  }
});

document.addEventListener("keydown", (event) => {
  if (uiState.showSplash) {
    if (event.code === "Space" || event.code === "Enter" || event.code === "Escape") {
      event.preventDefault();
      dismissSplashOverlay();
    }
    return;
  }

  if (uiState.activeOverlay === "briefing" && (event.code === "Space" || event.code === "Enter")) {
    event.preventDefault();
    if (hubSession && hubSession.status === "running" && hubSession.phase === "briefing") {
      startHubCue();
      return;
    }
    if (relSession && relSession.status === "running" && relSession.phase === "briefing") {
      startRelationalCue();
      return;
    }
  }

  if (event.code !== "Space") {
    return;
  }
  const handled = captureHubResponse() || captureRelationalMatch();
  if (handled) {
    event.preventDefault();
  }
});

window.addEventListener("hashchange", render);
render();
