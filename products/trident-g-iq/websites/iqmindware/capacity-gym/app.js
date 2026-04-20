import {
  HUB_BASE_TRIALS,
  HUB_N_MAX,
  createHubBlockPlan,
  createHubBlockTrials,
  displayHubTargetLabel,
  isHubMatchAtIndex,
  summarizeHubBlock
} from "./runtime/hub-engine.js?v=20260419-mfprogress";
import {
  initAudio,
  playSfx,
  setAudioEnabled,
  unlockAudioContextFromUserGesture
} from "./runtime/audio.js";
import { hash32 } from "./runtime/rng.js";
import { createZoneProbeController } from "./runtime/zone/probe.js";
import { buildZoneHandoff } from "./runtime/zone/handoff.js";
import { loadZoneRuntimeState, saveZoneRun } from "./runtime/zone/storage.js";
import {
  REASONING_FAMILIES,
  REASONING_MANUAL_ITEM_OPTIONS,
  REASONING_SESSION_TARGET,
  REASONING_STORAGE_KEY,
  buildReasoningBlock,
  completedReasoningSessions,
  createDefaultReasoningState,
  createTacticCapture,
  isFreshReasoningSession,
  itemTimeLimitMs,
  nextReasoningSessionNumber,
  normalizeReasoningState,
  parseReasoningJson,
  planReasoningSession,
  reasoningFamilyForCoreSession,
  reasoningFamilyLabel,
  reasoningGAward,
  reasoningSessionsToGo,
  reasoningSessionStats,
  reasoningSubtypeLabel,
  scoreReasoningResponse,
  summarizeReasoningBlock,
  updateReasoningFamilyState
} from "./runtime/reasoning/engine.js?v=20260419-sessioncount";
import {
  TRACKER_LEGACY_STORAGE_KEY,
  TRACKER_PSI_OPTIONS,
  TRACKER_PSI_SECTIONS,
  TRACKER_STORAGE_KEY,
  TRACKER_TESTS,
  TRACKER_TEST_BY_ID,
  createDefaultTrackerState,
  createTrackerEntry,
  createTrackerSession,
  latestTrackerEntry,
  latestTrackerFieldEntry,
  mergeLegacyTrackerState,
  normalizeTrackerState,
  parseTrackerJson,
  psiQuestionList,
  scoreTrackerSession,
  trackerManifestFor,
  trackerSeries
} from "./runtime/tracker/engine.js?v=20260420-tracker";

const STORAGE_KEY = "tg_iq_live_capacity_v2";
const ECONOMY_KEY = "tg_iq_live_economy_v1";
const ACTIVE_MODULE_KEY = "tg_iq_live_active_module_v1";
const UNIFIED_COACH_KEY = "tg_iq_live_unified_coach_v1";
const ZONE_HANDOFF_KEY = "iqmw.capacity.handoffFromZone";
const ZONE_FALLBACK_KEY = "lastCapacitySession";
const HISTORY_LIMIT = 160;
const ECONOMY_EVENT_LIMIT = 240;
const ZONE_HANDOFF_FRESH_MS = 39 * 60 * 1000;
const COACH_CORE_BLOCKS = 10;
const SUPPORT_BLOCKS = 4;
const PROGRAMME_SESSION_TARGET = 20;
const MAX_SESSION_COUNTER = 999;
const TRAINING_HELP_VIDEO_URL = "https://youtu.be/uOncXapT-j4?si=uJBBaXw7M1vtL2jL";
const TRAINING_HELP_ICON_URL = "./assets/help/help-hex-blue.svg";
const MODE_HELP_ICON_URL = "./assets/help/help-hex-purple.svg";
const ZONE_HELP_ICON_URL = "./assets/help/help-hex-gold.svg";
const TRACKER_HELP_ICON_URL = "./assets/help/help-hex-gold.svg";
const IQMINDWARE_LOGO_URL = "./assets/brand/iqmindware-logo.png?v=20260420-iqlogo";
const COACH_FAMILY_CYCLE = ["flex", "bind", "relate", "resist", "flex", "relate", "bind", "resist", "relate"];
const RELATE_LADDER = ["relate_vectors", "relate_numbers", "relate_vectors_dual", "relate_numbers_dual"];
const TRANSFER_SPRINT_BLOCKS = 3;
const MANUAL_RECOMMENDATION_FAMILIES = ["flex", "bind", "relate", "resist"];
const COUNTDOWN_STEPS = ["3", "2", "1"];
const COUNTDOWN_STEP_MS = 700;
const COACH_ROUTE_TARGETS = {
  in_zone: { routeClass: "core", capacityBlocks: 10, reasoningItems: 10, countsTowardCore20: true, label: "In Zone" },
  flat: { routeClass: "core", capacityBlocks: 5, reasoningItems: 8, countsTowardCore20: true, label: "Flat" },
  overloaded_exploit: { routeClass: "support", capacityBlocks: 4, reasoningItems: 4, countsTowardCore20: false, label: "Locked In" },
  overloaded_explore: { routeClass: "support", capacityBlocks: 3, reasoningItems: 4, countsTowardCore20: false, label: "Spun Out" },
  invalid: { routeClass: "recovery", capacityBlocks: 0, reasoningItems: 0, countsTowardCore20: false, label: "Invalid" }
};

const FAMILY_META = {
  flex: { label: "Flex", wrappers: ["hub_cat", "hub_noncat", "hub_concept"] },
  bind: { label: "Bind", wrappers: ["and_cat", "and_noncat"] },
  resist: { label: "Resist", wrappers: ["resist_vectors", "resist_words", "resist_concept"] },
  emotion: { label: "Emotion", wrappers: ["emotion_faces", "emotion_words"] },
  relate: { label: "Relate", wrappers: RELATE_LADDER }
};

const WRAPPER_META = {
  hub_cat: { family: "flex", label: "Flex known", target: ["loc", "col", "sym"], complexity: 2 },
  hub_noncat: { family: "flex", label: "Flex unknown", target: ["loc", "col", "sym"], complexity: 3 },
  hub_concept: { family: "flex", label: "Flex concept", target: ["loc", "col", "sym"], complexity: 4 },
  and_cat: { family: "bind", label: "Bind known", target: ["loc_sym", "loc_col", "sym_col"], complexity: 5 },
  and_noncat: { family: "bind", label: "Bind unknown", target: ["loc_sym", "loc_col", "sym_col"], complexity: 6 },
  resist_vectors: { family: "resist", label: "Resist vectors", target: ["loc", "sym"], complexity: 5 },
  resist_words: { family: "resist", label: "Resist words", target: ["col", "sym"], complexity: 5 },
  resist_concept: { family: "resist", label: "Resist concept", target: ["loc", "sym"], complexity: 6 },
  emotion_faces: { family: "emotion", label: "Emotion faces", target: ["loc", "sym"], complexity: 5 },
  emotion_words: { family: "emotion", label: "Emotion words", target: ["col", "sym"], complexity: 5 },
  relate_vectors: { family: "relate", label: "Relate vectors mono", target: ["rel", "sym"], complexity: 6 },
  relate_numbers: { family: "relate", label: "Relate numbers mono", target: ["rel", "sym"], complexity: 7 },
  relate_vectors_dual: { family: "relate", label: "Relate vectors dual", target: ["dual"], complexity: 8 },
  relate_numbers_dual: { family: "relate", label: "Relate numbers dual", target: ["dual"], complexity: 9 }
};

const PREVIEW_MARKERS = [
  { xPct: 50, yPct: 8 },
  { xPct: 92, yPct: 50 },
  { xPct: 50, yPct: 92 },
  { xPct: 8, yPct: 50 }
];

const appRoot = document.querySelector("#app");
let state = loadState();
let economy = loadEconomy();
let reasoningState = loadReasoningState();
let trackerState = loadTrackerState();
let coachState = loadUnifiedCoachState();
let zonePulseState = createZonePulseState();
let activeBlock = null;
let activeReasoningBlock = null;
let activeTrackerSession = null;
let viewState = {
  leftOpen: false,
  rightOpen: false,
  modeHelpOpen: false,
  zoneHelpOpen: false,
  trackerHelpOpen: false,
  appHelpOpen: false,
  privacyHelpOpen: false,
  centerMode: "play",
  message: "Choose coached progression or manual play, then start a block.",
  activeModule: loadActiveModule(),
  reasoningBusy: false,
  reasoningCloseSession: null
};
const timers = { countdown: null, display: null, sequence: null, trial: null, zoneCountdown: null, reasoning: null };
let touchStart = null;
const trackerImagePreloadCache = new Map();

initAudio({ enabled: state.settings.soundOn, preloadTier: "p0" });

function trackerStemImageUrls(testId = null) {
  const ids = testId ? [testId] : ["sgs12_pre", "sgs12_post"];
  return ids.flatMap((id) => {
    const manifest = trackerManifestFor(id);
    return (manifest.items || []).map((item) => item.stemImageUrl).filter(Boolean);
  });
}

function imageWithRetryUrl(url, token) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}img_retry=${encodeURIComponent(token)}`;
}

function preloadTrackerImage(url, retries = 1) {
  if (!url || typeof Image === "undefined") return Promise.resolve(false);
  if (trackerImagePreloadCache.has(url)) return trackerImagePreloadCache.get(url);
  let attempt = 0;
  const seed = Date.now();
  const promise = new Promise((resolve) => {
    const run = () => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(true);
      img.onerror = () => {
        if (attempt < retries) {
          attempt += 1;
          img.src = imageWithRetryUrl(url, `${seed}_${attempt}`);
        } else {
          resolve(false);
        }
      };
      img.src = attempt === 0 ? url : imageWithRetryUrl(url, `${seed}_${attempt}`);
    };
    run();
  });
  trackerImagePreloadCache.set(url, promise);
  return promise;
}

function prewarmTrackerImages(testId = null) {
  const urls = Array.from(new Set(trackerStemImageUrls(testId)));
  if (!urls.length) return;
  Promise.allSettled(urls.map((url) => preloadTrackerImage(url, 1))).catch(() => {});
}

prewarmTrackerImages();

function isSoundOn() {
  return state.settings.soundOn !== false;
}

function syncSoundToggle() {
  const button = document.querySelector("[data-sound-toggle]");
  if (!button) return;
  const enabled = isSoundOn();
  button.textContent = enabled ? "Audio on" : "Audio off";
  button.setAttribute("aria-pressed", enabled ? "true" : "false");
  button.setAttribute("aria-label", enabled ? "Turn Capacity Gym audio off" : "Turn Capacity Gym audio on");
  button.classList.toggle("is-muted", !enabled);
}

function ensureModuleSwitch() {
  const brand = document.querySelector(".capacity-v2-brand");
  const actions = document.querySelector(".capacity-v2-brand-actions");
  if (!brand || !actions) return;
  let switcher = document.querySelector("[data-module-switch]");
  if (!switcher) {
    switcher = document.createElement("div");
    switcher.className = "capacity-module-switch";
    switcher.setAttribute("data-module-switch", "");
    brand.insertBefore(switcher, actions);
  }
  const active = viewState.activeModule === "reasoning" || viewState.activeModule === "tracker" ? viewState.activeModule : "capacity";
  const helpDisabled = anyGameplayActive();
  switcher.innerHTML = `
    <button class="module-switch-btn${active === "capacity" ? " is-active" : ""}" type="button" data-action="set-module" data-module="capacity" aria-pressed="${active === "capacity" ? "true" : "false"}">Capacity Gym</button>
    <button class="module-switch-btn${active === "reasoning" ? " is-active" : ""}" type="button" data-action="set-module" data-module="reasoning" aria-pressed="${active === "reasoning" ? "true" : "false"}">Reasoning Gym</button>
    <button class="module-switch-btn${active === "tracker" ? " is-active" : ""}" type="button" data-action="set-module" data-module="tracker" aria-pressed="${active === "tracker" ? "true" : "false"}">Tracker</button>
    <button class="module-switch-btn module-help-btn" type="button" data-action="toggle-app-help" aria-haspopup="dialog" aria-expanded="${viewState.appHelpOpen ? "true" : "false"}" ${helpDisabled ? "disabled" : ""}>Help</button>
  `;
}

function unlockAudioGesture() {
  if (!isSoundOn()) return false;
  return unlockAudioContextFromUserGesture();
}

function triggerSfx(eventId) {
  if (!isSoundOn()) return false;
  return playSfx(eventId);
}

function scheduleSfx(eventId, delayMs = 0) {
  if (!isSoundOn()) return;
  window.setTimeout(() => {
    triggerSfx(eventId);
  }, Math.max(0, Math.round(delayMs)));
}

function setSoundOn(enabled) {
  state.settings.soundOn = Boolean(enabled);
  saveState();
  setAudioEnabled(state.settings.soundOn);
  if (state.settings.soundOn) {
    unlockAudioContextFromUserGesture();
    playSfx("ui_tap_soft");
  }
  syncSoundToggle();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseJson(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function percent(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : "--";
}

function clampN(value) {
  return clamp(Number.isFinite(Number(value)) ? Math.round(Number(value)) : 1, 1, HUB_N_MAX);
}

function normalizeNSetting(value, sourceVersion = 3) {
  if (String(value || "").trim().toLowerCase() === "auto") return "auto";
  if (sourceVersion < 3) return "auto";
  return clampN(value);
}

function wrapperFamily(wrapper) {
  return WRAPPER_META[wrapper]?.family || "flex";
}

function familyLabel(familyId) {
  return FAMILY_META[familyId]?.label || "Flex";
}

function wrapperLabel(wrapper) {
  return WRAPPER_META[wrapper]?.label || "Flex known";
}

function targetOptions(wrapper) {
  return WRAPPER_META[wrapper]?.target || ["loc", "col", "sym"];
}

function normalizeWrapper(value) {
  return WRAPPER_META[value] ? value : "hub_cat";
}

function normalizeTarget(wrapper, value) {
  const options = targetOptions(wrapper);
  return options.includes(value) ? value : options[0];
}

function targetLabel(target, wrapper) {
  return displayHubTargetLabel(target, wrapper).toLowerCase();
}

function turnsBackLabel(n) {
  const turns = clampN(n);
  return `${turns} turn${turns === 1 ? "" : "s"} ago`;
}

function blockTipRule(plan) {
  const wrapper = plan.wrapper;
  const target = plan.targetModality;

  if (target === "dual") {
    if (wrapper === "relate_numbers_dual") {
      return "Track both streams: press F for direction matches and L for number-relation matches.";
    }
    return "Track both streams: press F for orientation matches and L for relation matches.";
  }

  if (wrapper === "and_cat" || wrapper === "and_noncat") {
    const objectName = wrapper === "and_cat" ? "animal" : "shape";
    if (target === "loc_sym") {
      return `Press MATCH only when the same location-${objectName} pair repeats; ignore color.`;
    }
    if (target === "loc_col") {
      return `Press MATCH only when the same location-color pair repeats; ignore ${objectName}.`;
    }
    return `Press MATCH only when the same ${objectName}-color pair repeats; ignore location.`;
  }

  if (wrapper === "relate_vectors") {
    if (target === "rel") return "Press MATCH when the arrow relation repeats - same, outwards, inwards, diagonal.";
    return "Press MATCH when the arrow orientation repeats; ignore relation.";
  }

  if (wrapper === "relate_numbers") {
    if (target === "rel") return "Press MATCH when the number relation repeats - same, one-up, one-down or random.";
    return "Press MATCH when the pair direction repeats; ignore the number relation.";
  }

  if (wrapper === "resist_vectors") {
    if (target === "loc") return "Press MATCH when the position repeats; ignore arrow direction.";
    return "Press MATCH when the arrow direction repeats; ignore position.";
  }

  if (wrapper === "resist_words") {
    if (target === "col") return "Press MATCH when the ink color repeats; ignore the word.";
    return "Press MATCH when the word repeats; ignore ink color.";
  }

  if (wrapper === "resist_concept") {
    if (target === "loc") return "Press MATCH when the location zone repeats; ignore the cue direction.";
    return "Press MATCH when the direction concept repeats; ignore location zone and picture style.";
  }

  if (wrapper === "emotion_faces") {
    if (target === "loc") return "Press MATCH when the face position repeats; ignore the emotion.";
    return "Press MATCH when the emotion repeats; ignore position.";
  }

  if (wrapper === "emotion_words") {
    if (target === "col") return "Press MATCH when the ink color repeats; ignore the emotion word.";
    return "Press MATCH when the emotion category repeats; ignore ink color.";
  }

  if (wrapper === "hub_concept") {
    if (target === "loc") return "Press MATCH when the location zone repeats; ignore color category and letter.";
    if (target === "col") return "Press MATCH when the color category repeats; ignore location zone and letter.";
    return "Press MATCH when the letter repeats across font and case changes; ignore zone and color category.";
  }

  if (target === "loc") {
    const ignoredItem = wrapper === "hub_noncat" ? "shape" : "symbol";
    return `Press MATCH when the position repeats; ignore color and ${ignoredItem}.`;
  }
  if (target === "col") {
    const ignoredItem = wrapper === "hub_noncat" ? "shape" : "symbol";
    return `Press MATCH when the color repeats; ignore position and ${ignoredItem}.`;
  }

  const symbolName = wrapper === "hub_noncat" ? "shape" : "letter";
  return `Press MATCH when the ${symbolName} repeats; ignore position and color.`;
}

function blockTipModel(plan) {
  return {
    kicker: "Coach tip",
    title: `YOUR N-BACK LEVEL IS N-${plan.n}`,
    body: `Compare each cue with the one from ${turnsBackLabel(plan.n)}. ${blockTipRule(plan)}`
  };
}

function dateKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isFreshZoneTimestamp(timestamp) {
  if (!Number.isFinite(timestamp)) return false;
  const ageMs = Date.now() - timestamp;
  return ageMs >= 0 && ageMs <= ZONE_HANDOFF_FRESH_MS;
}

function createDefaultState() {
  return {
    version: 4,
    settings: { mode: "coach", wrapper: "hub_cat", targetModality: "loc", n: "auto", speed: "slow", soundOn: true },
    currentSession: null,
    programme: { coreSessionNumber: 0, manualSessionNumber: 0, programmeBonusAwarded: false, programmeCompletedAt: null },
    history: []
  };
}

function normalizeState(raw) {
  const defaults = createDefaultState();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  const settings = raw.settings && typeof raw.settings === "object" ? raw.settings : {};
  const sourceVersion = Number.isFinite(Number(raw.version)) ? Math.round(Number(raw.version)) : 0;
  const wrapper = normalizeWrapper(settings.wrapper);
  const history = Array.isArray(raw.history) ? raw.history.filter((entry) => entry && typeof entry === "object").slice(0, HISTORY_LIMIT) : [];
  const programme = raw.programme && typeof raw.programme === "object" ? raw.programme : {};
  const inferredManualSessionNumber = history.filter((entry) => entry.routeClass === "manual" || entry.rewardMode === "manual").length;
  return {
    version: 4,
    settings: {
      mode: sourceVersion < 4 ? "coach" : (settings.mode === "manual" ? "manual" : "coach"),
      wrapper,
      targetModality: normalizeTarget(wrapper, settings.targetModality),
      n: normalizeNSetting(settings.n, sourceVersion),
      speed: settings.speed === "fast" ? "fast" : "slow",
      soundOn: settings.soundOn !== false
    },
    currentSession: raw.currentSession && typeof raw.currentSession === "object" ? raw.currentSession : null,
    programme: {
      coreSessionNumber: clampSessionCounter(programme.coreSessionNumber),
      manualSessionNumber: Object.prototype.hasOwnProperty.call(programme, "manualSessionNumber")
        ? clampSessionCounter(programme.manualSessionNumber)
        : clampSessionCounter(inferredManualSessionNumber),
      programmeBonusAwarded: programme.programmeBonusAwarded === true,
      programmeCompletedAt: Number.isFinite(programme.programmeCompletedAt) ? Math.round(programme.programmeCompletedAt) : null
    },
    history
  };
}

function loadState() {
  if (typeof localStorage === "undefined") return createDefaultState();
  const loaded = normalizeState(parseJson(localStorage.getItem(STORAGE_KEY)));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
  return loaded;
}

function saveState(nextState = state) {
  state = normalizeState(nextState);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  return state;
}

function loadActiveModule() {
  if (typeof localStorage === "undefined") return "capacity";
  const stored = localStorage.getItem(ACTIVE_MODULE_KEY);
  return stored === "reasoning" || stored === "tracker" ? stored : "capacity";
}

function saveActiveModule(moduleId) {
  viewState.activeModule = moduleId === "reasoning" || moduleId === "tracker" ? moduleId : "capacity";
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ACTIVE_MODULE_KEY, viewState.activeModule);
  }
  return viewState.activeModule;
}

function loadTrackerState() {
  if (typeof localStorage === "undefined") return createDefaultTrackerState();
  const rawState = parseTrackerJson(localStorage.getItem(TRACKER_STORAGE_KEY));
  const rawLegacy = parseTrackerJson(localStorage.getItem(TRACKER_LEGACY_STORAGE_KEY));
  const loaded = mergeLegacyTrackerState(normalizeTrackerState(rawState), rawLegacy);
  localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(loaded));
  return loaded;
}

function saveTrackerState(nextState = trackerState) {
  trackerState = normalizeTrackerState(nextState);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(TRACKER_STORAGE_KEY, JSON.stringify(trackerState));
  }
  return trackerState;
}

function loadReasoningState() {
  if (typeof localStorage === "undefined") return createDefaultReasoningState();
  const loaded = normalizeReasoningState(parseReasoningJson(localStorage.getItem(REASONING_STORAGE_KEY)));
  localStorage.setItem(REASONING_STORAGE_KEY, JSON.stringify(loaded));
  return loaded;
}

function saveReasoningState(nextState = reasoningState) {
  reasoningState = normalizeReasoningState(nextState);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(REASONING_STORAGE_KEY, JSON.stringify(reasoningState));
  }
  return reasoningState;
}

function createDefaultUnifiedCoachState() {
  return {
    version: 1,
    active: null,
    lastCompleted: null,
    programme: { coreSessionNumber: 0, supportSessionNumber: 0 },
    history: []
  };
}

function normalizeCoachContract(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const routeState = zoneRouteState(raw.routeState || raw.zone_state);
  const targets = COACH_ROUTE_TARGETS[routeState] || COACH_ROUTE_TARGETS.invalid;
  const capacityTargetBlocks = Math.max(0, Math.round(Number(raw.capacityTargetBlocks ?? raw.capacity_target_blocks ?? targets.capacityBlocks) || 0));
  const reasoningTargetItems = Math.max(0, Math.round(Number(raw.reasoningTargetItems ?? raw.reasoning_target_items ?? targets.reasoningItems) || 0));
  const status = raw.status === "complete" ? "complete" : "active";
  return {
    id: String(raw.id || `coach_${Date.now()}`),
    status,
    sessionNumber: clampSessionCounter(raw.sessionNumber ?? raw.session_number ?? 1) || 1,
    phase: raw.phase || phaseForCoachSession(raw.sessionNumber ?? raw.session_number ?? 1).id,
    routeState,
    routeClass: raw.routeClass || raw.route_class || targets.routeClass,
    routeLabel: raw.routeLabel || raw.route_label || targets.label,
    countsTowardCore20: raw.countsTowardCore20 ?? raw.counts_toward_core_20 ?? targets.countsTowardCore20,
    capacityTargetBlocks,
    reasoningTargetItems,
    capacityCompletedBlocks: clamp(Math.round(Number(raw.capacityCompletedBlocks ?? raw.capacity_completed_blocks ?? 0) || 0), 0, capacityTargetBlocks),
    reasoningCompletedItems: clamp(Math.round(Number(raw.reasoningCompletedItems ?? raw.reasoning_completed_items ?? 0) || 0), 0, reasoningTargetItems),
    capacitySessionId: raw.capacitySessionId || raw.capacity_session_id || null,
    reasoningSessionId: raw.reasoningSessionId || raw.reasoning_session_id || null,
    capacityFamily: raw.capacityFamily || raw.capacity_family || null,
    reasoningFamily: raw.reasoningFamily || raw.reasoning_family || null,
    zoneTimestamp: Number.isFinite(Number(raw.zoneTimestamp ?? raw.zone_timestamp)) ? Math.round(Number(raw.zoneTimestamp ?? raw.zone_timestamp)) : null,
    zoneSource: raw.zoneSource || raw.zone_source || null,
    startedAt: Number.isFinite(Number(raw.startedAt ?? raw.started_at)) ? Math.round(Number(raw.startedAt ?? raw.started_at)) : Date.now(),
    updatedAt: Number.isFinite(Number(raw.updatedAt ?? raw.updated_at)) ? Math.round(Number(raw.updatedAt ?? raw.updated_at)) : Date.now(),
    completedAt: Number.isFinite(Number(raw.completedAt ?? raw.completed_at)) ? Math.round(Number(raw.completedAt ?? raw.completed_at)) : null
  };
}

function normalizeUnifiedCoachState(raw) {
  const defaults = createDefaultUnifiedCoachState();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  const programme = raw.programme && typeof raw.programme === "object" ? raw.programme : {};
  return {
    version: 1,
    active: normalizeCoachContract(raw.active),
    lastCompleted: normalizeCoachContract(raw.lastCompleted),
    programme: {
      coreSessionNumber: clampSessionCounter(programme.coreSessionNumber),
      supportSessionNumber: clampSessionCounter(programme.supportSessionNumber)
    },
    history: Array.isArray(raw.history) ? raw.history.map(normalizeCoachContract).filter(Boolean).slice(0, 60) : []
  };
}

function loadUnifiedCoachState() {
  if (typeof localStorage === "undefined") return createDefaultUnifiedCoachState();
  const loaded = normalizeUnifiedCoachState(parseJson(localStorage.getItem(UNIFIED_COACH_KEY)));
  const legacyCore = Math.max(
    clampSessionCounter(state?.programme?.coreSessionNumber),
    clampSessionCounter(reasoningState?.programme?.coreSessionNumber)
  );
  loaded.programme.coreSessionNumber = Math.max(loaded.programme.coreSessionNumber, legacyCore);
  localStorage.setItem(UNIFIED_COACH_KEY, JSON.stringify(loaded));
  return loaded;
}

function saveUnifiedCoachState(nextState = coachState) {
  coachState = normalizeUnifiedCoachState(nextState);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(UNIFIED_COACH_KEY, JSON.stringify(coachState));
  }
  return coachState;
}

function createDefaultEconomy() {
  return { version: 1, walletG: 0, events: [] };
}

function normalizeEconomy(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return createDefaultEconomy();
  return {
    version: 1,
    walletG: Math.max(0, Math.round(Number(raw.walletG || 0))),
    events: Array.isArray(raw.events) ? raw.events.filter((entry) => entry && typeof entry === "object").slice(0, ECONOMY_EVENT_LIMIT) : []
  };
}

function loadEconomy() {
  if (typeof localStorage === "undefined") return createDefaultEconomy();
  const loaded = normalizeEconomy(parseJson(localStorage.getItem(ECONOMY_KEY)));
  localStorage.setItem(ECONOMY_KEY, JSON.stringify(loaded));
  return loaded;
}

function saveEconomy(nextEconomy = economy) {
  economy = normalizeEconomy(nextEconomy);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(ECONOMY_KEY, JSON.stringify(economy));
  }
  return economy;
}

function addGEvent(event) {
  const g = Math.max(0, Math.round(Number(event?.g || 0)));
  return saveEconomy({
    version: 1,
    walletG: economy.walletG + g,
    events: [
      {
        id: event.id || `g_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        ts: Number.isFinite(event.ts) ? Math.round(event.ts) : Date.now(),
        source: event.source || "capacity_block",
        label: event.label || "Capacity reward",
        g,
        meta: event.meta && typeof event.meta === "object" ? event.meta : {}
      },
      ...economy.events
    ].slice(0, ECONOMY_EVENT_LIMIT)
  });
}

function normalizeZoneValue(zoneValue, recommendationValue) {
  const zone = String(zoneValue || "").trim().toLowerCase();
  const recommendation = String(recommendationValue || "").trim().toLowerCase();
  if (zone === "subcritical" || zone === "too_cold" || zone === "below_band" || zone === "flat") return "subcritical";
  if (zone === "locked_in" || zone === "locked-in" || zone === "locked in" || zone === "overloaded_exploit") return "locked_in";
  if (zone === "spun_out" || zone === "spun-out" || zone === "spun out" || zone === "too_hot" || zone === "overloaded_explore") return "spun_out";
  if (zone === "in_band" || zone === "in_zone" || zone === "psi") return "in_band";
  if (zone === "invalid" || zone === "check_invalid") return "invalid";
  if (recommendation === "light") return "subcritical";
  if (recommendation === "proceed" || recommendation === "full") return "in_band";
  return "unknown";
}

function normalizeZoneCandidate(candidate, sourceKey) {
  if (!candidate || typeof candidate !== "object") return null;
  const gate = candidate.gate && typeof candidate.gate === "object" ? candidate.gate : {};
  const timestamp = Number.isFinite(candidate.timestamp)
    ? Math.round(candidate.timestamp)
    : (Number.isFinite(Date.parse(candidate.timestamp)) ? Date.parse(candidate.timestamp) : null);
  const zone = normalizeZoneValue(gate.zone || candidate.zone || candidate.state || candidate.router?.state, gate.recommendation || candidate.recommendation);
  const routeClass = candidate.capacityPlan?.routeClass
    || (zone === "in_band" ? "core" : zone === "subcritical" ? "support" : (zone === "locked_in" || zone === "spun_out" || zone === "invalid") ? "recovery" : "support");
  const defaultBlocks = routeClass === "core" ? COACH_CORE_BLOCKS : routeClass === "support" ? SUPPORT_BLOCKS : 0;
  return {
    sessionId: candidate.sessionId || `zone_${timestamp || Date.now()}`,
    sourceKey,
    timestamp,
    freshSameDay: Number.isFinite(timestamp) ? dateKey(timestamp) === dateKey() : false,
    freshForTraining: isFreshZoneTimestamp(timestamp),
    state: zone,
    uiState: zone === "in_band" ? "In the Zone" : zone === "subcritical" ? "Subcritical" : zone === "locked_in" ? "Locked in" : zone === "spun_out" ? "Spun out" : zone === "invalid" ? "Invalid" : "Unknown",
    recommendation: gate.recommendation || candidate.recommendation || (routeClass === "core" ? "proceed" : "light"),
    capacityPlan: {
      routeClass,
      defaultBlocks: Number.isFinite(candidate.capacityPlan?.defaultBlocks) ? Math.round(candidate.capacityPlan.defaultBlocks) : defaultBlocks,
      blocksMin: Number.isFinite(candidate.capacityPlan?.blocksMin) ? Math.round(candidate.capacityPlan.blocksMin) : Math.max(0, defaultBlocks - 1),
      blocksMax: Number.isFinite(candidate.capacityPlan?.blocksMax) ? Math.round(candidate.capacityPlan.blocksMax) : defaultBlocks,
      progressionMode: candidate.capacityPlan?.progressionMode || (routeClass === "core" ? "build" : "stabilise"),
      swapPolicy: candidate.capacityPlan?.swapPolicy || (routeClass === "core" ? "normal" : "none"),
      focusBias: candidate.capacityPlan?.focusBias || (routeClass === "core" ? "portable_control" : "stability"),
      preferredFamilies: Array.isArray(candidate.capacityPlan?.preferredFamilies) ? candidate.capacityPlan.preferredFamilies : [],
      blockedFamilies: Array.isArray(candidate.capacityPlan?.blockedFamilies) ? candidate.capacityPlan.blockedFamilies : [],
      blockedModes: Array.isArray(candidate.capacityPlan?.blockedModes) ? candidate.capacityPlan.blockedModes : [],
      rewardMode: candidate.capacityPlan?.rewardMode || (routeClass === "core" ? "core" : routeClass === "support" ? "support" : "reset_only"),
      eligibleForEncoding20: candidate.capacityPlan?.eligibleForEncoding20 === true || routeClass === "core"
    }
  };
}

function readZoneHandoff() {
  if (typeof localStorage === "undefined") return null;
  const primary = normalizeZoneCandidate(parseJson(localStorage.getItem(ZONE_HANDOFF_KEY)), ZONE_HANDOFF_KEY);
  const fallback = normalizeZoneCandidate(parseJson(localStorage.getItem(ZONE_FALLBACK_KEY)), ZONE_FALLBACK_KEY);
  if (!primary) return fallback;
  if (!fallback) return primary;
  if (!Number.isFinite(primary.timestamp)) return fallback;
  if (!Number.isFinite(fallback.timestamp)) return primary;
  return primary.timestamp >= fallback.timestamp ? primary : fallback;
}

function createZonePulseState() {
  const persisted = loadZoneRuntimeState();
  return {
    phase: persisted.latestSummary ? "result" : "idle",
    history: persisted.history.slice(),
    latestSummary: persisted.latestSummary,
    latestHandoff: persisted.latestHandoff,
    live: {
      progressPct: 0,
      trialCount: 0,
      counts: { stair: 0, probe: 0, catch: 0 },
      qualityText: "Ready"
    },
    controller: null,
    activeRunId: null,
    countdownStep: 0,
    cancelled: false
  };
}

function zoneRouteState(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "in_band" || raw === "in_zone" || raw === "psi") return "in_zone";
  if (raw === "subcritical" || raw === "too_cold" || raw === "below_band" || raw === "flat") return "flat";
  if (raw === "locked_in" || raw === "locked-in" || raw === "locked in" || raw === "overloaded_exploit") return "overloaded_exploit";
  if (raw === "spun_out" || raw === "spun-out" || raw === "spun out" || raw === "too_hot" || raw === "overloaded_explore") return "overloaded_explore";
  return "invalid";
}

function zoneRouteClass(routeState) {
  if (routeState === "in_zone") return "core";
  if (routeState === "flat") return "support";
  if (routeState === "overloaded_explore" || routeState === "overloaded_exploit") return "recovery";
  return "recovery";
}

function zoneRouteLabel(routeState) {
  if (routeState === "in_zone") return "In Zone";
  if (routeState === "flat") return "Flat";
  if (routeState === "overloaded_explore") return "Spun Out";
  if (routeState === "overloaded_exploit") return "Locked In";
  return "Invalid";
}

function zoneDisplaySnapshot() {
  const latestSummary = zonePulseState.latestSummary;
  const handoff = readZoneHandoff();
  const freshSummary = latestSummary && isFreshZoneTimestamp(latestSummary.timestamp);
  const freshHandoff = handoff?.freshForTraining;
  if (freshSummary && (!freshHandoff || latestSummary.timestamp >= (handoff.timestamp || 0))) {
    const routeState = zoneRouteState(latestSummary.state);
    return {
      source: "runtime",
      fresh: true,
      valid: latestSummary.valid === true,
      routeState,
      routeClass: zoneRouteClass(routeState),
      label: zoneRouteLabel(routeState),
      confidence: latestSummary.confidence || "Low",
      bitsPerSecond: latestSummary.bitsPerSecond,
      timestamp: latestSummary.timestamp,
      summary: latestSummary
    };
  }
  if (freshHandoff) {
    const routeState = zoneRouteState(handoff.state);
    return {
      source: handoff.sourceKey,
      fresh: true,
      valid: routeState !== "invalid",
      routeState,
      routeClass: handoff.capacityPlan?.routeClass || zoneRouteClass(routeState),
      label: zoneRouteLabel(routeState),
      confidence: handoff.confidence || "--",
      bitsPerSecond: handoff.bitsPerSecond,
      timestamp: handoff.timestamp,
      summary: null
    };
  }
  return {
    source: null,
    fresh: false,
    valid: false,
    routeState: "invalid",
    routeClass: null,
    label: "Awaiting check",
    confidence: "--",
    bitsPerSecond: null,
    timestamp: null,
    summary: latestSummary || null
  };
}

function phaseForCoachSession(sessionNumber) {
  const n = Math.max(1, Math.round(Number(sessionNumber || 1)));
  if (n <= 5) return { id: "foundation", label: "Foundation", copy: "build clean habits with easier forms first" };
  if (n <= 10) return { id: "portability", label: "Portability", copy: "carry the skill into less familiar forms" };
  if (n <= 15) return { id: "integration", label: "Integration", copy: "combine skills under more control pressure" };
  return { id: "transfer", label: "Transfer", copy: "hold the skill in the hardest transfer forms" };
}

function completedUnifiedCoreSessions() {
  return Math.max(
    clampSessionCounter(coachState?.programme?.coreSessionNumber),
    clampSessionCounter(state?.programme?.coreSessionNumber),
    clampSessionCounter(reasoningState?.programme?.coreSessionNumber)
  );
}

function currentCoachContract() {
  return coachState.active?.status === "active" ? coachState.active : null;
}

function coachContractForDisplay() {
  return currentCoachContract() || coachState.lastCompleted || null;
}

function coachTargetsForSnapshot(snapshot = {}) {
  const routeState = zoneRouteState(snapshot.routeState || snapshot.state);
  return COACH_ROUTE_TARGETS[routeState] || COACH_ROUTE_TARGETS.invalid;
}

function coachContractIsComplete(contract) {
  if (!contract) return false;
  return Number(contract.capacityCompletedBlocks || 0) >= Number(contract.capacityTargetBlocks || 0)
    && Number(contract.reasoningCompletedItems || 0) >= Number(contract.reasoningTargetItems || 0);
}

function capacityRemainingForContract(contract = currentCoachContract()) {
  if (!contract) return 0;
  return Math.max(0, Number(contract.capacityTargetBlocks || 0) - Number(contract.capacityCompletedBlocks || 0));
}

function reasoningRemainingForContract(contract = currentCoachContract()) {
  if (!contract) return 0;
  return Math.max(0, Number(contract.reasoningTargetItems || 0) - Number(contract.reasoningCompletedItems || 0));
}

function capacityRouteStartLabel(contract) {
  if (!contract) return "Start Capacity route";
  if (contract.routeClass === "support") return "Start support training";
  if (contract.routeState === "flat") return "Start reduced Capacity route";
  return "Start Capacity route";
}

function coachContractPrimaryActionMarkup(contract, options = {}) {
  if (!contract) return "";
  const disabled = options.disabled ? "disabled" : "";
  if (capacityRemainingForContract(contract) > 0) {
    return `<button class="btn btn-primary" type="button" data-action="start-coach-session" ${disabled}>${escapeHtml(capacityRouteStartLabel(contract))}</button>`;
  }
  if (reasoningRemainingForContract(contract) > 0) {
    return `<button class="btn btn-primary" type="button" data-action="switch-to-reasoning" ${disabled}>Go to Reasoning Gym</button>`;
  }
  return `<button class="btn btn-primary" type="button" data-action="show-play" ${disabled}>Return to gameplay</button>`;
}

function zoneRouteReadyCopy(summary, contract = currentCoachContract()) {
  if (!summary?.valid) return summary?.invalidReason || "This pulse did not validate.";
  const routeState = contract?.routeState || zoneRouteState(summary.state);
  const targets = contract
    ? {
        routeClass: contract.routeClass,
        capacityBlocks: Number(contract.capacityTargetBlocks || 0),
        reasoningItems: Number(contract.reasoningTargetItems || 0)
      }
    : coachTargetsForSnapshot({ routeState });
  const capacityBlocks = Number(targets.capacityBlocks || 0);
  const reasoningItems = Number(targets.reasoningItems || 0);
  const capacityLabel = `${capacityBlocks} Capacity block${capacityBlocks === 1 ? "" : "s"}`;
  const reasoningLabel = `${reasoningItems} Reasoning item${reasoningItems === 1 ? "" : "s"}`;
  if (targets.routeClass === "support") {
    return `A lighter support route is ready: ${capacityLabel} and ${reasoningLabel}.`;
  }
  if (routeState === "flat") {
    return `A reduced core route is ready: ${capacityLabel} and ${reasoningLabel}.`;
  }
  return `Full coach route ready: ${capacityLabel} and ${reasoningLabel}.`;
}

function syncLegacyProgrammeCounters(coreSessionNumber) {
  const completed = clampSessionCounter(coreSessionNumber);
  state.programme.coreSessionNumber = Math.max(clampSessionCounter(state.programme.coreSessionNumber), completed);
  reasoningState.programme.coreSessionNumber = Math.max(clampSessionCounter(reasoningState.programme.coreSessionNumber), completed);
  saveState();
  saveReasoningState();
}

function completeUnifiedCoachContractIfReady() {
  const contract = currentCoachContract();
  if (!coachContractIsComplete(contract)) {
    saveUnifiedCoachState();
    return null;
  }
  const completed = {
    ...contract,
    status: "complete",
    completedAt: Date.now(),
    updatedAt: Date.now()
  };
  coachState.active = null;
  coachState.lastCompleted = completed;
  coachState.history = [completed, ...coachState.history].slice(0, 60);
  if (completed.countsTowardCore20) {
    coachState.programme.coreSessionNumber = Math.max(clampSessionCounter(coachState.programme.coreSessionNumber), completed.sessionNumber);
    syncLegacyProgrammeCounters(coachState.programme.coreSessionNumber);
  } else {
    coachState.programme.supportSessionNumber = clampSessionCounter(coachState.programme.supportSessionNumber + 1);
  }
  saveUnifiedCoachState();
  return completed;
}

function createUnifiedCoachContract(snapshot = zoneDisplaySnapshot()) {
  if (!snapshot?.fresh || snapshot.valid !== true) {
    return {
      ok: false,
      reason: "zone_required",
      message: "Run a clean Zone Check first. It sets today's Capacity and Reasoning targets."
    };
  }
  const targets = coachTargetsForSnapshot(snapshot);
  if (targets.routeClass === "recovery") {
    return {
      ok: false,
      reason: "recovery",
      message: "Zone Check says recovery today. Repeat the check later or use light manual practice."
    };
  }
  const sessionNumber = clamp(completedUnifiedCoreSessions() + 1, 1, PROGRAMME_SESSION_TARGET);
  const phase = phaseForCoachSession(sessionNumber);
  const capacityFamily = targets.routeClass === "core" ? familyForCoreSession(sessionNumber) : "flex";
  const reasoningFamily = targets.routeClass === "core"
    ? reasoningFamilyForCoreSession(sessionNumber)
    : (snapshot.routeState === "overloaded_exploit" ? "must_follow" : "relation_fit");
  const contract = {
    id: `coach_${Date.now()}`,
    status: "active",
    sessionNumber,
    phase: phase.id,
    routeState: zoneRouteState(snapshot.routeState),
    routeClass: targets.routeClass,
    routeLabel: targets.label,
    countsTowardCore20: targets.countsTowardCore20,
    capacityTargetBlocks: targets.capacityBlocks,
    reasoningTargetItems: targets.reasoningItems,
    capacityCompletedBlocks: 0,
    reasoningCompletedItems: 0,
    capacitySessionId: null,
    reasoningSessionId: null,
    capacityFamily,
    reasoningFamily,
    zoneTimestamp: Number.isFinite(snapshot.timestamp) ? Math.round(snapshot.timestamp) : Date.now(),
    zoneSource: snapshot.source || null,
    startedAt: Date.now(),
    updatedAt: Date.now(),
    completedAt: null
  };
  coachState.active = contract;
  coachState.lastCompleted = null;
  saveUnifiedCoachState();
  return { ok: true, contract };
}

function createSkippedZoneSnapshot() {
  return {
    fresh: true,
    valid: true,
    routeState: "in_zone",
    state: "in_zone",
    routeClass: "core",
    label: "Zone skipped",
    confidence: "Skipped",
    timestamp: Date.now(),
    source: "zone_skipped"
  };
}

function ensureSkippedCoachContract() {
  const current = currentCoachContract();
  if (current) return { ok: true, contract: current };
  const result = createUnifiedCoachContract(createSkippedZoneSnapshot());
  if (result.ok) {
    result.contract.routeLabel = "Zone skipped";
    result.contract.zoneSource = "zone_skipped";
    result.contract.zoneSkipped = true;
    result.contract.updatedAt = Date.now();
    saveUnifiedCoachState();
  }
  return result;
}

function ensureUnifiedCoachContract() {
  const current = currentCoachContract();
  if (current) return { ok: true, contract: current };
  return createUnifiedCoachContract(zoneDisplaySnapshot());
}

function maybeCreateCoachContractFromZoneSummary(summary) {
  if (!summary?.valid || currentCoachContract()) return null;
  if (state.settings.mode !== "coach" && reasoningState.settings.mode !== "coach") return null;
  return createUnifiedCoachContract(zoneDisplaySnapshot());
}

function recordUnifiedCapacityBlock(sessionId) {
  const contract = currentCoachContract();
  if (!contract || !sessionId || contract.capacitySessionId !== sessionId) return null;
  contract.capacityCompletedBlocks = Math.min(contract.capacityTargetBlocks, Number(contract.capacityCompletedBlocks || 0) + 1);
  contract.updatedAt = Date.now();
  return completeUnifiedCoachContractIfReady();
}

function recordUnifiedReasoningItems(sessionId, itemCount) {
  const contract = currentCoachContract();
  if (!contract || !sessionId || contract.reasoningSessionId !== sessionId) return null;
  const increment = Math.max(0, Math.round(Number(itemCount || 0)));
  contract.reasoningCompletedItems = Math.min(contract.reasoningTargetItems, Number(contract.reasoningCompletedItems || 0) + increment);
  contract.updatedAt = Date.now();
  return completeUnifiedCoachContractIfReady();
}

function latestCoachTrainingTimestamp() {
  const rows = state.history
    .filter((entry) => entry && entry.rewardMode !== "manual" && (entry.routeClass === "core" || entry.routeClass === "support"))
    .map((entry) => Number(entry.tsEnd || entry.tsStart))
    .filter(Number.isFinite);
  return rows.length ? Math.max(...rows) : 0;
}

function coachZonePreflightStatus() {
  if (currentCoachContract()) {
    return { recommended: false, reason: "contract_locked", snapshot: zoneDisplaySnapshot() };
  }
  const session = activeCoachSession();
  const beforeFirstSessionBlock = !session || Math.max(0, Number(session.blocksCompleted || 0)) === 0;
  if (state.settings.mode !== "coach" || !beforeFirstSessionBlock || activeBlock || zonePulseIsRunning()) {
    return { recommended: false, reason: "not_applicable", snapshot: zoneDisplaySnapshot() };
  }
  const snapshot = zoneDisplaySnapshot();
  const lastCoachTs = latestCoachTrainingTimestamp();
  const zoneTs = Number(snapshot.timestamp);
  if (!snapshot.fresh || !Number.isFinite(zoneTs)) {
    return { recommended: true, reason: "missing", snapshot };
  }
  if (!snapshot.valid) {
    return { recommended: true, reason: "invalid", snapshot };
  }
  if (zoneTs <= lastCoachTs) {
    return { recommended: true, reason: "used", snapshot };
  }
  return { recommended: false, reason: "fresh", snapshot };
}

function shouldRecommendCoachZonePreflight() {
  return coachZonePreflightStatus().recommended;
}

function zonePulseIsRunning() {
  return zonePulseState.phase === "running" || zonePulseState.phase === "countdown";
}

function zonePulseIsLive() {
  return zonePulseState.phase === "running";
}

function reasoningBlockIsActive() {
  return Boolean(activeReasoningBlock && activeReasoningBlock.status !== "summary" && activeReasoningBlock.status !== "complete");
}

function trackerTestIsActive() {
  return Boolean(activeTrackerSession && activeTrackerSession.status !== "results");
}

function anyGameplayActive() {
  return Boolean(activeBlock || zonePulseIsRunning() || reasoningBlockIsActive() || trackerTestIsActive() || viewState.reasoningBusy);
}

function formatBitsPerSecond(value) {
  return Number.isFinite(value) ? value.toFixed(2) : "--";
}

function formatMetricPct(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : "--";
}

function persistCapacityZoneHandoff(summary, handoff) {
  if (typeof localStorage === "undefined" || !summary || !handoff) return;
  const routeState = zoneRouteState(summary.state);
  const routeClass = handoff.capacityPlan?.routeClass || zoneRouteClass(routeState);
  const payload = {
    ...handoff,
    schemaVersion: "iqmw_capacity_handoff_v2",
    sourceApp: "capacity_gym_zone_check",
    timestamp: Number.isFinite(summary.timestamp) ? Math.round(summary.timestamp) : Date.now(),
    state: routeState,
    uiState: zoneRouteLabel(routeState),
    gate: {
      zone: routeState,
      recommendation: handoff.recommendation
    },
    capacityPlan: {
      ...handoff.capacityPlan,
      routeClass
    }
  };
  localStorage.setItem(ZONE_HANDOFF_KEY, JSON.stringify(payload));
  localStorage.setItem(ZONE_FALLBACK_KEY, JSON.stringify({
    schemaVersion: "mw_handoff_v1",
    timestamp: payload.timestamp,
    zone: routeState,
    recommendation: handoff.recommendation,
    capacityFocus: payload.capacityPlan?.focusBias || null,
    routeClass
  }));
}

function currentCoachFamilyNumber() {
  return clamp(completedProgrammeSessions() + 1, 1, MAX_SESSION_COUNTER);
}

function clampSessionCounter(value) {
  return clamp(Math.round(Number(value || 0)), 0, MAX_SESSION_COUNTER);
}

function completedProgrammeSessions() {
  return completedUnifiedCoreSessions();
}

function completedManualSessions() {
  return clampSessionCounter(state.programme.manualSessionNumber);
}

function nextManualSessionNumber() {
  return clamp(completedManualSessions() + 1, 1, MAX_SESSION_COUNTER);
}

function programmeSessionsToGo() {
  return Math.max(0, PROGRAMME_SESSION_TARGET - Math.min(PROGRAMME_SESSION_TARGET, completedProgrammeSessions()));
}

function programmeSessionDisplay() {
  const completed = completedProgrammeSessions();
  return `${Math.min(PROGRAMME_SESSION_TARGET, completed)}/${PROGRAMME_SESSION_TARGET}`;
}

function nextCoachSessionDisplay() {
  const completed = completedProgrammeSessions();
  if (completed >= PROGRAMME_SESSION_TARGET) return programmeSessionDisplay();
  return `${currentCoachFamilyNumber()}/${PROGRAMME_SESSION_TARGET}`;
}

function currentSessionDisplay() {
  return state.settings.mode === "coach" ? nextCoachSessionDisplay() : `${nextManualSessionNumber()}`;
}

function sessionsToGoDisplay() {
  return state.settings.mode === "coach" ? `${programmeSessionsToGo()}` : "-";
}

function familyForCoreSession(sessionNumber) {
  return COACH_FAMILY_CYCLE[(Math.max(1, sessionNumber) - 1) % COACH_FAMILY_CYCLE.length];
}

function historyFor(predicate) {
  return state.history.filter(predicate);
}

function latest(predicate) {
  return state.history.find(predicate) || null;
}

function blockAccuracy(entry) {
  return Number(entry?.block?.accuracy || 0);
}

function blockEndN(entry) {
  return clampN(entry?.block?.nEnd || entry?.recommendedN || entry?.block?.nStart || 1);
}

function stableWrapper(wrapper, target = null) {
  const entries = state.history
    .filter((entry) => entry.wrapper === wrapper && (!target || entry.targetModality === target))
    .slice(0, 3);
  return entries.length >= 3 && entries.every((entry) => blockAccuracy(entry) >= 0.75 && blockEndN(entry) >= 2);
}

function pickRelateWrapper() {
  if (!stableWrapper("relate_vectors", "rel") || !stableWrapper("relate_vectors", "sym")) return "relate_vectors";
  if (!stableWrapper("relate_numbers", "rel") || !stableWrapper("relate_numbers", "sym")) return "relate_numbers";
  if (!stableWrapper("relate_vectors_dual")) return "relate_vectors_dual";
  return "relate_numbers_dual";
}

function pickRelateTarget(wrapper) {
  if (wrapper === "relate_vectors_dual" || wrapper === "relate_numbers_dual") return "dual";
  if (!stableWrapper(wrapper, "rel")) return "rel";
  if (!stableWrapper(wrapper, "sym")) return "sym";
  const last = latest((entry) => entry.wrapper === wrapper);
  return last?.targetModality === "rel" ? "sym" : "rel";
}

function pickFamilyWrapper(familyId) {
  if (familyId === "relate") return pickRelateWrapper();
  const wrappers = FAMILY_META[familyId]?.wrappers || FAMILY_META.flex.wrappers;
  const completed = historyFor((entry) => wrapperFamily(entry.wrapper) === familyId && entry.rewardMode === "core").length;
  return wrappers[completed % wrappers.length];
}

function pickFamilyTarget(wrapper) {
  if (wrapper.startsWith("relate_")) return pickRelateTarget(wrapper);
  const options = targetOptions(wrapper);
  if (options.length === 1) return options[0];
  const last = latest((entry) => entry.wrapper === wrapper);
  const index = Math.max(-1, options.indexOf(last?.targetModality));
  return options[(index + 1) % options.length];
}

function recommendedNForWrapper(wrapper, routeClass) {
  if (routeClass === "support") return 1;
  const last = latest((entry) => entry.wrapper === wrapper);
  if (!last) return 1;
  return clampN(last.recommendedN || last.block?.nEnd || 1);
}

function recommendedManualN(wrapper, targetModality) {
  const lastForTarget = latest((entry) => entry.wrapper === wrapper && entry.targetModality === targetModality);
  const lastForWrapper = latest((entry) => entry.wrapper === wrapper);
  const last = lastForTarget || lastForWrapper;
  return clampN(last?.recommendedN || last?.block?.nEnd || 1);
}

function recommendedSpeedForWrapper(wrapper, routeClass) {
  if (routeClass !== "core") return "slow";
  const recent = state.history.filter((entry) => entry.wrapper === wrapper).slice(0, 3);
  return recent.length >= 2 && recent.every((entry) => blockAccuracy(entry) >= 0.9 && blockEndN(entry) >= 2) ? "fast" : "slow";
}

function activeCoachSession() {
  return state.settings.mode === "coach" && state.currentSession?.mode === "coach"
    ? state.currentSession
    : null;
}

function resolveNextBlockSettings() {
  const session = activeCoachSession();
  if (session) {
    const familyId = session.routeClass === "core" ? session.familyId : "flex";
    const wrapper = pickFamilyWrapper(familyId);
    return {
      wrapper,
      targetModality: pickFamilyTarget(wrapper),
      n: recommendedNForWrapper(wrapper, session.routeClass),
      speed: recommendedSpeedForWrapper(wrapper, session.routeClass),
      rewardMode: session.routeClass === "core" ? "core" : "support"
    };
  }
  const wrapper = state.settings.wrapper;
  const targetModality = pickFamilyTarget(wrapper);
  return {
    wrapper,
    targetModality,
    n: state.settings.n === "auto" ? recommendedManualN(wrapper, targetModality) : clampN(state.settings.n),
    speed: state.settings.speed,
    rewardMode: "manual"
  };
}

function resolveCoachBlockSettings() {
  const session = state.currentSession;
  const routeClass = session?.routeClass || "core";
  const familyId = routeClass === "core"
    ? (session?.familyId || familyForCoreSession(currentCoachFamilyNumber()))
    : "flex";
  const wrapper = pickFamilyWrapper(familyId);
  return {
    wrapper,
    targetModality: pickFamilyTarget(wrapper),
    n: recommendedNForWrapper(wrapper, routeClass),
    speed: recommendedSpeedForWrapper(wrapper, routeClass),
    rewardMode: routeClass === "core" ? "core" : "support"
  };
}

function displayPlanForHud() {
  if (activeBlock?.plan) return activeBlock.plan;
  return state.settings.mode === "coach" ? resolveCoachBlockSettings() : resolveNextBlockSettings();
}

function projectedNextN(plan) {
  if (activeBlock?.plan && plan === activeBlock.plan && activeBlock.trialOutcomes.length) {
    try {
      const summary = summarizeHubBlock({
        plan: activeBlock.plan,
        trials: activeBlock.trials,
        trialOutcomes: activeBlock.trialOutcomes,
        nMax: HUB_N_MAX
      });
      return clampN(summary.nEnd);
    } catch {
      return clampN(plan.n);
    }
  }
  const last = state.history[0];
  if (!activeBlock && last?.wrapper === plan.wrapper && last?.targetModality === plan.targetModality) {
    return clampN(last.recommendedN || last.block?.nEnd || plan.n);
  }
  return clampN(plan.n);
}

function recommendedManualFamilyId() {
  const recentFamilies = state.history
    .slice(0, TRANSFER_SPRINT_BLOCKS)
    .map((entry) => wrapperFamily(entry.wrapper))
    .filter(Boolean);
  const cycleFamily = familyForCoreSession(currentCoachFamilyNumber());
  if (!recentFamilies.includes(cycleFamily)) return cycleFamily;
  return MANUAL_RECOMMENDATION_FAMILIES.find((familyId) => !recentFamilies.includes(familyId)) || cycleFamily;
}

function beginCoachSession() {
  if (activeBlock || state.currentSession || zonePulseIsRunning()) return;
  viewState.centerMode = "play";
  const contractResult = ensureUnifiedCoachContract();
  if (!contractResult.ok) {
    viewState.message = contractResult.message;
    triggerSfx("invalid_action");
    render();
    return;
  }
  const contract = contractResult.contract;
  const remainingBlocks = capacityRemainingForContract(contract);
  if (remainingBlocks <= 0) {
    viewState.message = reasoningRemainingForContract(contract) > 0
      ? "Capacity is done for this session. Switch to Reasoning Gym to finish the session."
      : "Capacity is done for this session.";
    triggerSfx("ui_tap_soft");
    render();
    return;
  }
  const routeClass = contract.routeClass;
  const sessionNumber = contract.sessionNumber;
  const familyId = routeClass === "core" ? (contract.capacityFamily || familyForCoreSession(sessionNumber)) : "flex";
  const plannedBlocks = remainingBlocks;
  const sessionId = `capv2_${Date.now()}`;
  state.currentSession = {
    id: sessionId,
    mode: "coach",
    routeClass,
    rewardMode: routeClass === "core" ? "core" : "support",
    eligibleForEncoding20: contract.countsTowardCore20 === true,
    familyId,
    coreSessionNumber: routeClass === "core" ? sessionNumber : null,
    plannedBlocks,
    blocksCompleted: 0,
    zoneState: contract.routeState,
    zoneFresh: true,
    zoneSource: contract.zoneSource || null,
    startedAt: Date.now()
  };
  contract.capacitySessionId = sessionId;
  contract.capacityFamily = familyId;
  contract.updatedAt = Date.now();
  saveUnifiedCoachState();
  saveState();
  viewState.message = routeClass === "core"
    ? `Session ${sessionNumber} capacity route: ${familyLabel(familyId)}. Complete ${plannedBlocks} block${plannedBlocks === 1 ? "" : "s"}, then switch to Reasoning Gym.`
    : `Support capacity route: ${plannedBlocks} stabilising block${plannedBlocks === 1 ? "" : "s"}.`;
  triggerSfx("session_start");
  render();
}

function skipZonePulseAndStartCoachRoute() {
  if (anyGameplayActive()) {
    triggerSfx("invalid_action");
    return;
  }
  const contractResult = ensureSkippedCoachContract();
  if (!contractResult.ok) {
    viewState.message = contractResult.message || "Could not skip Zone Pulse.";
    triggerSfx("invalid_action");
    render();
    return;
  }
  viewState.centerMode = "play";
  state.settings.mode = "coach";
  reasoningState.settings.mode = "coach";
  saveState();
  saveReasoningState();
  if (viewState.activeModule === "reasoning" && capacityRemainingForContract(contractResult.contract) > 0) {
    saveActiveModule("capacity");
  }
  viewState.message = "Zone Pulse skipped for this session. Your standard coach-led route is ready.";
  triggerSfx("ui_tap_soft");
  if (viewState.activeModule === "capacity" && !state.currentSession) {
    beginCoachSession();
    return;
  }
  render();
}

function clearTimers() {
  Object.keys(timers).forEach((key) => {
    if (timers[key]) {
      clearTimeout(timers[key]);
      timers[key] = null;
    }
  });
}

function beginCountdown(stepIndex = 0) {
  if (!activeBlock) return;
  clearTimers();
  activeBlock.status = "countdown";
  activeBlock.pausedFromStatus = null;
  activeBlock.trialIndex = -1;
  activeBlock.stimulusVisible = false;
  activeBlock.trialVisualStage = 0;
  activeBlock.countdownStep = Math.max(0, Math.min(COUNTDOWN_STEPS.length - 1, stepIndex));
  viewState.leftOpen = false;
  viewState.rightOpen = false;
  viewState.message = `Starting block: ${wrapperLabel(activeBlock.plan.wrapper)}, match the ${targetLabel(activeBlock.plan.targetModality, activeBlock.plan.wrapper)}.`;
  render();
  timers.countdown = setTimeout(() => advanceCountdown(activeBlock.countdownStep), COUNTDOWN_STEP_MS);
}

function advanceCountdown(expectedStep) {
  if (!activeBlock || activeBlock.status !== "countdown" || activeBlock.countdownStep !== expectedStep) return;
  if (expectedStep < COUNTDOWN_STEPS.length - 1) {
    beginCountdown(expectedStep + 1);
    return;
  }
  startTrial(0);
}

function startBlock() {
  if (activeBlock || zonePulseIsRunning()) {
    triggerSfx("invalid_action");
    return;
  }
  viewState.centerMode = "play";
  const settings = resolveNextBlockSettings();
  const tsStart = Date.now();
  const blockIndex = state.history.length + 1;
  const mappingSeed = hash32(`${tsStart}:${settings.wrapper}:${settings.targetModality}:${blockIndex}`);
  const plan = createHubBlockPlan({
    wrapper: settings.wrapper,
    blockIndex,
    n: settings.n,
    speed: settings.speed,
    targetModality: settings.targetModality,
    mappingSeed
  });
  const build = createHubBlockTrials({
    wrapper: plan.wrapper,
    n: plan.n,
    targetModality: plan.targetModality,
    speed: plan.speed,
    mappingSeed: plan.mappingSeed,
    baseTrials: HUB_BASE_TRIALS,
    seed: tsStart
  });
  activeBlock = {
    tsStart,
    plan,
    trials: build.trials,
    renderMapping: build.renderMapping,
    soaMs: build.soaMs,
    displayMs: build.displayMs,
    trialIndex: -1,
    status: "countdown",
    stimulusVisible: false,
    trialVisualStage: 0,
    countdownStep: 0,
    responseCaptured: false,
    responseRtMs: null,
    responseRelCaptured: false,
    responseSymCaptured: false,
    responseRelRtMs: null,
    responseSymRtMs: null,
    trialStartedAtMs: 0,
    trialOutcomes: [],
    sessionId: settings.rewardMode === "manual" ? null : state.currentSession?.id || null,
    rewardMode: settings.rewardMode
  };
  viewState.message = `Get ready: ${wrapperLabel(plan.wrapper)}, match the ${targetLabel(plan.targetModality, plan.wrapper)} from ${plan.n} turns ago.`;
  triggerSfx("block_start");
  beginCountdown();
}

function trialSequenceGapMs(trial) {
  return Number.isFinite(trial?.display?.sequenceGapMs) ? Math.max(0, Math.round(trial.display.sequenceGapMs)) : 0;
}

function startTrial(index) {
  if (!activeBlock) return;
  clearTimers();
  activeBlock.trialIndex = index;
  activeBlock.status = "trial";
  activeBlock.pausedFromStatus = null;
  activeBlock.stimulusVisible = true;
  activeBlock.trialVisualStage = trialSequenceGapMs(activeBlock.trials[index]) > 0 ? 1 : 2;
  activeBlock.responseCaptured = false;
  activeBlock.responseRtMs = null;
  activeBlock.responseRelCaptured = false;
  activeBlock.responseSymCaptured = false;
  activeBlock.responseRelRtMs = null;
  activeBlock.responseSymRtMs = null;
  activeBlock.trialStartedAtMs = performance.now();
  viewState.leftOpen = false;
  viewState.rightOpen = false;
  render();
  scheduleTrialTimers(index);
}

function scheduleTrialTimers(index) {
  const trial = activeBlock?.trials[index];
  const sequenceGap = trialSequenceGapMs(trial);
  if (sequenceGap > 0) {
    timers.sequence = setTimeout(() => {
      if (!activeBlock || activeBlock.trialIndex !== index) return;
      activeBlock.trialVisualStage = 2;
      render();
    }, sequenceGap);
  }
  timers.display = setTimeout(() => {
    if (!activeBlock || activeBlock.trialIndex !== index) return;
    activeBlock.stimulusVisible = false;
    render();
  }, activeBlock.displayMs);
  timers.trial = setTimeout(() => {
    if (!activeBlock || activeBlock.trialIndex !== index) return;
    finishTrial();
  }, activeBlock.soaMs);
}

function pauseActiveBlock() {
  if (!activeBlock || activeBlock.status === "paused") return;
  const pausedFromStatus = activeBlock.status;
  clearTimers();
  activeBlock.status = "paused";
  activeBlock.pausedFromStatus = pausedFromStatus;
  activeBlock.stimulusVisible = false;
  viewState.message = "Paused. Resume restarts the current trial window; Stop cancels this block with no credit.";
  triggerSfx("pause_on");
  render();
}

function resumeActiveBlock() {
  if (!activeBlock || activeBlock.status !== "paused") return;
  const resumeIndex = Math.max(0, activeBlock.trialIndex);
  const pausedFromStatus = activeBlock.pausedFromStatus || "trial";
  viewState.message = "Resuming block.";
  triggerSfx("resume_on");
  if (pausedFromStatus === "countdown" || activeBlock.trialIndex < 0) {
    beginCountdown();
    return;
  }
  startTrial(resumeIndex);
}

function stopActiveBlock() {
  if (!activeBlock) return;
  clearTimers();
  activeBlock = null;
  viewState.centerMode = "play";
  viewState.message = "Block stopped. No credit was awarded and session progress was not advanced.";
  triggerSfx("session_stop_discard");
  render();
}

function destroyZonePulseController() {
  if (zonePulseState.controller) {
    zonePulseState.controller.destroy();
    zonePulseState.controller = null;
  }
}

function updateZonePulseLiveDom() {
  const progress = Math.round(zonePulseState.live.progressPct || 0);
  const progressFill = document.querySelector("[data-zone-pulse-progress-fill]");
  const progressLabel = document.querySelector("[data-zone-pulse-progress-label]");
  const quality = document.querySelector("[data-zone-pulse-quality]");
  const counts = document.querySelector("[data-zone-pulse-counts]");
  if (progressFill) progressFill.style.width = `${clamp(progress, 0, 100)}%`;
  if (progressLabel) progressLabel.textContent = `${clamp(progress, 0, 100)}% complete`;
  if (quality) quality.textContent = zonePulseState.live.qualityText || "Stay on one screen";
  if (counts) {
    const liveCounts = zonePulseState.live.counts || {};
    counts.textContent = `Trials ${zonePulseState.live.trialCount || 0} | S:${liveCounts.stair || 0} P:${liveCounts.probe || 0} C:${liveCounts.catch || 0}`;
  }
}

function ensureZonePulseController() {
  const canvas = document.querySelector("[data-zone-pulse-canvas]");
  if (!canvas) return null;
  if (zonePulseState.controller) return zonePulseState.controller;
  zonePulseState.controller = createZoneProbeController({
    canvas,
    onStatus(status) {
      zonePulseState.live = {
        progressPct: Number.isFinite(status.progressPct) ? status.progressPct : zonePulseState.live.progressPct,
        trialCount: Number.isFinite(status.trialCount) ? status.trialCount : zonePulseState.live.trialCount,
        counts: status.counts || zonePulseState.live.counts || { stair: 0, probe: 0, catch: 0 },
        qualityText: status.qualityText || zonePulseState.live.qualityText || "Stay on one screen"
      };
      updateZonePulseLiveDom();
    },
    onComplete(summary) {
      if (zonePulseState.cancelled || !summary) return;
      const handoff = buildZoneHandoff(summary);
      const saved = saveZoneRun(summary, handoff);
      persistCapacityZoneHandoff(summary, handoff);
      zonePulseState.history = saved.history.slice();
      zonePulseState.latestSummary = saved.latestSummary;
      zonePulseState.latestHandoff = saved.latestHandoff;
      zonePulseState.phase = summary.valid ? "result" : "invalid";
      zonePulseState.activeRunId = null;
      const contractResult = maybeCreateCoachContractFromZoneSummary(summary);
      destroyZonePulseController();
      viewState.centerMode = "zone";
      viewState.message = summary.valid
        ? contractResult?.ok
          ? `Zone Check complete. Today's coached session is set: ${contractResult.contract.capacityTargetBlocks} Capacity blocks and ${contractResult.contract.reasoningTargetItems} Reasoning items.`
          : `Zone Check complete: ${zoneRouteLabel(zoneRouteState(summary.state))}, ${formatBitsPerSecond(summary.bitsPerSecond)} bits/sec.`
        : "Zone Check did not validate. Run a clean pulse before treating it as a route.";
      render();
    }
  });
  return zonePulseState.controller;
}

function showZonePulse() {
  if (activeBlock || activeReasoningBlock || zonePulseIsRunning()) {
    triggerSfx("invalid_action");
    return;
  }
  viewState.centerMode = "zone";
  zonePulseState.phase = "ready";
  viewState.leftOpen = false;
  viewState.rightOpen = false;
  viewState.message = "Zone Check ready. Take the 3 minute zone pulse when you want a fresh route.";
  triggerSfx("ui_tap_soft");
  render();
  ensureZonePulseController();
}

function startZonePulse() {
  if (activeBlock || activeReasoningBlock || zonePulseIsRunning() || zonePulseState.cancelled) {
    triggerSfx("invalid_action");
    if (zonePulseState.cancelled) {
      viewState.message = "Zone pulse is finishing its stop. Try again in a moment.";
      render();
    }
    return;
  }
  destroyZonePulseController();
  zonePulseState.cancelled = false;
  beginZonePulseCountdown(0);
}

function beginZonePulseCountdown(stepIndex = 0) {
  if (activeBlock || zonePulseState.cancelled) return;
  if (timers.zoneCountdown) {
    clearTimeout(timers.zoneCountdown);
    timers.zoneCountdown = null;
  }
  zonePulseState.phase = "countdown";
  zonePulseState.countdownStep = Math.max(0, Math.min(COUNTDOWN_STEPS.length - 1, stepIndex));
  zonePulseState.live = {
    progressPct: 0,
    trialCount: 0,
    counts: { stair: 0, probe: 0, catch: 0 },
    qualityText: `Starting in ${COUNTDOWN_STEPS[zonePulseState.countdownStep]}`
  };
  viewState.centerMode = "zone";
  viewState.leftOpen = false;
  viewState.rightOpen = false;
  viewState.message = "Zone pulse starting. Get ready for the masked arrows.";
  render();
  timers.zoneCountdown = setTimeout(() => advanceZonePulseCountdown(zonePulseState.countdownStep), COUNTDOWN_STEP_MS);
}

function advanceZonePulseCountdown(expectedStep) {
  if (zonePulseState.phase !== "countdown" || zonePulseState.countdownStep !== expectedStep || zonePulseState.cancelled) return;
  if (expectedStep < COUNTDOWN_STEPS.length - 1) {
    beginZonePulseCountdown(expectedStep + 1);
    return;
  }
  if (timers.zoneCountdown) {
    clearTimeout(timers.zoneCountdown);
    timers.zoneCountdown = null;
  }
  startZonePulseRuntime();
}

function startZonePulseRuntime() {
  if (activeBlock || zonePulseState.cancelled) return;
  zonePulseState.phase = "running";
  zonePulseState.activeRunId = `zonepulse_${Date.now()}`;
  zonePulseState.live = {
    progressPct: 0,
    trialCount: 0,
    counts: { stair: 0, probe: 0, catch: 0 },
    qualityText: "Calibrating display timing"
  };
  viewState.centerMode = "zone";
  viewState.leftOpen = false;
  viewState.rightOpen = false;
  viewState.message = "Zone pulse live. Choose the masked arrow majority: left or right.";
  triggerSfx("session_start");
  render();
  const controller = ensureZonePulseController();
  if (!controller) {
    zonePulseState.phase = "ready";
    viewState.message = "Zone Check could not start because the task canvas was not found.";
    render();
    return;
  }
  controller.start({ historyRows: zonePulseState.history }).catch((error) => {
    if (zonePulseState.cancelled) return;
    zonePulseState.phase = "invalid";
    zonePulseState.latestSummary = {
      sessionId: `zonepulse_${Date.now()}`,
      timestamp: Date.now(),
      valid: false,
      invalidReason: error instanceof Error ? error.message : "Zone pulse failed",
      state: "invalid",
      confidence: "Low",
      reasons: ["Zone pulse failed"],
      bitsPerSecond: null,
      features: {},
      counts: {}
    };
    destroyZonePulseController();
    viewState.message = "Zone pulse failed before a result could be computed.";
    render();
  }).finally(() => {
    if (zonePulseState.cancelled) {
      zonePulseState.cancelled = false;
      zonePulseState.activeRunId = null;
    }
  });
}

function stopZonePulse() {
  if (!zonePulseIsRunning()) return;
  const wasCountdown = zonePulseState.phase === "countdown";
  zonePulseState.cancelled = true;
  zonePulseState.activeRunId = null;
  if (timers.zoneCountdown) {
    clearTimeout(timers.zoneCountdown);
    timers.zoneCountdown = null;
  }
  destroyZonePulseController();
  zonePulseState.phase = zonePulseState.latestSummary ? "result" : "ready";
  zonePulseState.countdownStep = 0;
  zonePulseState.live = {
    progressPct: 0,
    trialCount: 0,
    counts: { stair: 0, probe: 0, catch: 0 },
    qualityText: "Stopped"
  };
  viewState.centerMode = "zone";
  viewState.message = "Zone pulse stopped. No route was saved.";
  triggerSfx("session_stop_discard");
  render();
  ensureZonePulseController();
  if (wasCountdown) {
    zonePulseState.cancelled = false;
  }
}

function submitZonePulse(direction) {
  if (!zonePulseIsLive() || !zonePulseState.controller) return false;
  zonePulseState.controller.submit(direction === "left" ? "ArrowLeft" : "ArrowRight");
  triggerSfx("match_primary_press");
  return true;
}

function clearReasoningTimer() {
  if (timers.reasoning) {
    clearTimeout(timers.reasoning);
    timers.reasoning = null;
  }
}

function currentReasoningSessionDisplay() {
  return reasoningState.settings.mode === "coach"
    ? `${Math.min(REASONING_SESSION_TARGET, completedUnifiedCoreSessions())}/${REASONING_SESSION_TARGET}`
    : `${Math.max(1, Number(reasoningState.programme.manualSessionNumber || 0) + 1)}`;
}

function reasoningSessionToGoDisplay() {
  return reasoningState.settings.mode === "coach"
    ? `${Math.max(0, REASONING_SESSION_TARGET - Math.min(REASONING_SESSION_TARGET, completedUnifiedCoreSessions()))}`
    : "-";
}

function reasoningZoneRecommendation() {
  if (reasoningState.settings.mode !== "coach" || activeReasoningBlock || activeBlock || zonePulseIsRunning()) {
    return { recommended: false, copy: "" };
  }
  if (currentCoachContract()) {
    return { recommended: false, copy: "" };
  }
  const snapshot = zoneDisplaySnapshot();
  if (!snapshot.fresh) {
    return {
      recommended: true,
      copy: "Start with a 'zone pulse' so the coach can set today's Capacity and Reasoning targets. It's also effective brain training for cognition."
    };
  }
  if (snapshot.routeState === "invalid") {
    return {
      recommended: true,
      copy: "Your last Zone Check did not validate. Run a clean pulse before Coach-led reasoning."
    };
  }
  return { recommended: false, copy: "" };
}

function markStaleReasoningPartial() {
  const session = reasoningState.currentSession;
  if (!session || session.status !== "partial" || isFreshReasoningSession(session)) return false;
  reasoningState.history = [
    {
      id: `reason_abandoned_${Date.now()}`,
      type: "session_abandoned",
      sessionId: session.id,
      family: session.family,
      routeClass: session.routeClass,
      blocksCompleted: session.blocksCompleted || 0,
      plannedBlocks: session.plannedBlocks || 0,
      tsEnd: Date.now()
    },
    ...reasoningState.history
  ].slice(0, 180);
  reasoningState.currentSession = null;
  saveReasoningState();
  return true;
}

function beginReasoningCoachSession() {
  if (anyGameplayActive()) {
    triggerSfx("invalid_action");
    return;
  }
  if (reasoningState.currentSession?.status === "partial" && isFreshReasoningSession(reasoningState.currentSession)) {
    reasoningState.currentSession.status = "active";
    reasoningState.currentSession.updatedAt = Date.now();
    saveReasoningState();
    viewState.message = "Reasoning session resumed. Completed blocks are already banked.";
    triggerSfx("session_start");
    render();
    return;
  }
  markStaleReasoningPartial();
  const contractResult = ensureUnifiedCoachContract();
  if (!contractResult.ok) {
    viewState.message = contractResult.message;
    triggerSfx("invalid_action");
    render();
    return;
  }
  const contract = contractResult.contract;
  const remainingItems = reasoningRemainingForContract(contract);
  if (remainingItems <= 0) {
    viewState.message = capacityRemainingForContract(contract) > 0
      ? "Reasoning is already done for this session. Switch back to Capacity Gym to finish the remaining blocks."
      : "Reasoning is already done for this session.";
    triggerSfx("ui_tap_soft");
    render();
    return;
  }
  const routeClass = contract.routeClass;
  const family = routeClass === "core"
    ? (contract.reasoningFamily || reasoningFamilyForCoreSession(contract.sessionNumber))
    : (contract.routeState === "overloaded_exploit" ? "must_follow" : "relation_fit");
  const itemsPerBlock = routeClass === "core" && contract.routeState !== "flat" ? 5 : Math.min(4, remainingItems);
  const planned = {
    blocked: false,
    id: `reason_${Date.now()}`,
    mode: "coach",
    status: "active",
    routeClass,
    routeState: contract.routeState,
    family,
    coreSessionNumber: contract.countsTowardCore20 ? contract.sessionNumber : null,
    plannedBlocks: Math.max(1, Math.ceil(remainingItems / Math.max(1, itemsPerBlock))),
    itemsPerBlock,
    blocksCompleted: 0,
    startedAt: Date.now(),
    updatedAt: Date.now()
  };
  reasoningState.currentSession = planned;
  contract.reasoningSessionId = planned.id;
  contract.reasoningFamily = family;
  contract.updatedAt = Date.now();
  saveUnifiedCoachState();
  saveReasoningState();
  viewState.message = `${reasoningFamilyLabel(planned.family)} reasoning route ready: ${remainingItems} item${remainingItems === 1 ? "" : "s"} to finish today's session.`;
  triggerSfx("session_start");
  render();
}

async function startReasoningBlock({ manual = false } = {}) {
  if (activeBlock || zonePulseIsRunning() || activeReasoningBlock || viewState.reasoningBusy) {
    triggerSfx("invalid_action");
    return;
  }
  viewState.reasoningBusy = true;
  viewState.message = "Loading reasoning items...";
  render();
  try {
    const session = manual ? null : reasoningState.currentSession;
    const manualSettings = manual ? normalizeReasoningManualSettings(reasoningState.settings) : null;
    if (manual) {
      reasoningState.settings = manualSettings;
      saveReasoningState();
    }
    const block = await buildReasoningBlock({
      state: reasoningState,
      session,
      mode: manual ? "manual" : "coach",
      manualSettings,
      blockIndex: manual ? reasoningState.history.filter((entry) => entry.mode === "manual").length : Number(session?.blocksCompleted || 0)
    });
    activeReasoningBlock = {
      ...block,
      status: "question",
      itemIndex: 0,
      selectedIds: [],
      outcomes: [],
      itemStartedAt: Date.now()
    };
    viewState.reasoningBusy = false;
    viewState.reasoningCloseSession = null;
    viewState.message = "Reasoning block live. Read the signal, choose cleanly.";
    triggerSfx("session_start");
    render();
    scheduleReasoningTimeout();
  } catch (error) {
    viewState.reasoningBusy = false;
    viewState.message = `Reasoning Gym could not load: ${error instanceof Error ? error.message : "unknown error"}`;
    triggerSfx("invalid_action");
    render();
  }
}

function currentReasoningItem() {
  if (!activeReasoningBlock) return null;
  return activeReasoningBlock.items[activeReasoningBlock.itemIndex] || null;
}

function scheduleReasoningTimeout() {
  clearReasoningTimer();
  const item = currentReasoningItem();
  if (!item || activeReasoningBlock?.status !== "question") return;
  const limitMs = itemTimeLimitMs(item, activeReasoningBlock.plan.speed);
  if (!Number.isFinite(limitMs)) return;
  timers.reasoning = setTimeout(() => submitReasoningAnswer({ timedOut: true }), limitMs);
}

function toggleReasoningOption(optionId) {
  const item = currentReasoningItem();
  if (!item || activeReasoningBlock?.status !== "question") return;
  if (item.answer_type !== "multi_select") {
    activeReasoningBlock.selectedIds = [optionId];
    render();
    return;
  }
  const selected = new Set(activeReasoningBlock.selectedIds || []);
  if (selected.has(optionId)) selected.delete(optionId);
  else selected.add(optionId);
  activeReasoningBlock.selectedIds = [...selected];
  render();
}

function submitReasoningAnswer({ selectedIds = null, timedOut = false } = {}) {
  const item = currentReasoningItem();
  if (!item || activeReasoningBlock?.status !== "question") return;
  clearReasoningTimer();
  const selected = selectedIds || activeReasoningBlock.selectedIds || [];
  const elapsedMs = Date.now() - activeReasoningBlock.itemStartedAt;
  const outcome = scoreReasoningResponse(item, selected, elapsedMs, timedOut);
  activeReasoningBlock.outcomes.push(outcome);
  activeReasoningBlock.lastOutcome = outcome;
  activeReasoningBlock.status = "feedback";
  activeReasoningBlock.selectedIds = [];
  triggerSfx(outcome.isCorrect ? "trial_hit" : "match_primary_press");
  render();
}

function isFinalReasoningItem(block = activeReasoningBlock) {
  if (!block) return false;
  return Number(block.itemIndex || 0) >= Math.max(0, Number(block.items?.length || 1) - 1);
}

function reasoningCompletionAction(block = activeReasoningBlock) {
  if (!block || block.mode === "manual") return "finish_session";
  const session = reasoningState.currentSession;
  if (!session || session.id !== block.sessionId) return "finish_session";
  const completedAfterThisBlock = Number(session.blocksCompleted || 0) + 1;
  const plannedBlocks = Math.max(1, Number(session.plannedBlocks || 1));
  return completedAfterThisBlock < plannedBlocks ? "next_block" : "finish_session";
}

function reasoningCompletionButtonLabel(block = activeReasoningBlock) {
  return reasoningCompletionAction(block) === "next_block" ? "Next block" : "Finish session";
}

async function advanceReasoningItem() {
  if (!activeReasoningBlock || activeReasoningBlock.status !== "feedback") return;
  if (activeReasoningBlock.itemIndex < activeReasoningBlock.items.length - 1) {
    activeReasoningBlock.itemIndex += 1;
    activeReasoningBlock.status = "question";
    activeReasoningBlock.selectedIds = [];
    activeReasoningBlock.lastOutcome = null;
    activeReasoningBlock.itemStartedAt = Date.now();
    render();
    scheduleReasoningTimeout();
    return;
  }
  await finishReasoningBlock({ nextStep: reasoningCompletionAction(activeReasoningBlock) });
}

async function finishReasoningBlock({ nextStep = "finish_session" } = {}) {
  if (!activeReasoningBlock) return;
  const completedBlock = activeReasoningBlock;
  clearReasoningTimer();
  const summary = summarizeReasoningBlock(completedBlock, completedBlock.outcomes);
  const blockG = reasoningGAward(summary.transferScore, summary);
  const wallet = addGEvent({
    source: "reasoning_block",
    label: `${reasoningFamilyLabel(summary.family)} reasoning block`,
    g: blockG,
    meta: { family: summary.family, transferScore: summary.transferScore.total, decision: summary.decision }
  });
  const entry = {
    ...summary,
    rewardState: {
      blockG,
      walletG: wallet.walletG,
      iqCredits: wallet.walletG / 100
    }
  };
  let nextState = updateReasoningFamilyState(reasoningState, summary);
  nextState.history = [entry, ...nextState.history].slice(0, 180);
  let completedSession = null;
  const unifiedReasoningSession = currentCoachContract()?.reasoningSessionId === completedBlock.sessionId;
  if (summary.mode === "manual") {
    nextState.programme.manualSessionNumber = Math.max(Number(nextState.programme.manualSessionNumber || 0), Number(nextState.programme.manualSessionNumber || 0) + 1);
  } else if (nextState.currentSession?.id === completedBlock.sessionId) {
    nextState.currentSession.blocksCompleted = Number(nextState.currentSession.blocksCompleted || 0) + 1;
    nextState.currentSession.updatedAt = Date.now();
    if (nextState.currentSession.blocksCompleted >= nextState.currentSession.plannedBlocks) {
      completedSession = { ...nextState.currentSession, status: "complete", completedAt: Date.now() };
      if (completedSession.routeClass === "core" && !unifiedReasoningSession) {
        nextState.programme.coreSessionNumber = Math.max(Number(nextState.programme.coreSessionNumber || 0), Number(completedSession.coreSessionNumber || 0));
      }
      nextState.currentSession = null;
    }
  }
  saveReasoningState(nextState);
  const unifiedCompleted = unifiedReasoningSession ? recordUnifiedReasoningItems(completedBlock.sessionId, summary.items) : null;
  playBlockRewardSfx(summary.tier, summary.decision === "UP" ? summary.tier + 1 : summary.decision === "DOWN" ? summary.tier - 1 : summary.tier, blockG, null);
  activeReasoningBlock = null;
  viewState.reasoningCloseSession = null;

  if (nextStep === "next_block" && reasoningState.currentSession) {
    viewState.message = `${reasoningFamilyLabel(summary.family)} block saved: ${percent(summary.accuracy)} accuracy. Loading next block.`;
    render();
    await startReasoningBlock({ manual: false });
    return;
  }

  const finishedCopy = unifiedCompleted
    ? "Session complete."
    : completedSession
      ? "Reasoning target complete."
      : "Reasoning block saved.";
  viewState.message = `${finishedCopy} ${reasoningFamilyLabel(summary.family)}: ${percent(summary.accuracy)} accuracy, Reasoning Transfer ${formatScorePercent(summary.transferScore.total)}, +${blockG} g.`;
  if (!unifiedCompleted && currentCoachContract() && reasoningRemainingForContract() <= 0 && capacityRemainingForContract() > 0) {
    viewState.message = `Reasoning target complete. Nice work. Switch back to Capacity Gym to finish ${capacityRemainingForContract()} block${capacityRemainingForContract() === 1 ? "" : "s"}.`;
  }
  render();
}

function stopReasoningBlock() {
  clearReasoningTimer();
  if (activeReasoningBlock) {
    const session = reasoningState.currentSession;
    if (session && session.id === activeReasoningBlock.sessionId && Number(session.blocksCompleted || 0) > 0) {
      session.status = "partial";
      session.updatedAt = Date.now();
      saveReasoningState();
    }
  }
  activeReasoningBlock = null;
  viewState.message = "Reasoning block stopped. Completed blocks stay saved; this session has not advanced.";
  triggerSfx("session_stop_discard");
  render();
}

function saveReasoningTacticCapture() {
  const session = viewState.reasoningCloseSession;
  if (!session) return;
  const capture = createTacticCapture(session, {
    tacticUsed: document.querySelector("[data-reasoning-capture='tacticUsed']")?.value,
    trapToAvoid: document.querySelector("[data-reasoning-capture='trapToAvoid']")?.value,
    takeaway: document.querySelector("[data-reasoning-capture='takeaway']")?.value,
    reusable: document.querySelector("[data-reasoning-capture='reusable']")?.checked === true
  });
  reasoningState.tacticCaptures = [capture, ...reasoningState.tacticCaptures].slice(0, 80);
  saveReasoningState();
  viewState.reasoningCloseSession = null;
  viewState.message = "Reasoning tactic captured.";
  triggerSfx("credit_award_small");
  render();
}

function isMatchWindowOpen() {
  if (!activeBlock || activeBlock.status !== "trial") return false;
  if (activeBlock.plan.targetModality === "dual") {
    if (activeBlock.responseRelCaptured && activeBlock.responseSymCaptured) return false;
  } else if (activeBlock.responseCaptured) {
    return false;
  }
  const trial = activeBlock.trials[activeBlock.trialIndex];
  return trialSequenceGapMs(trial) === 0 || activeBlock.trialVisualStage >= 2;
}

function sfxForResponsePress(responseKey = "primary") {
  if (!activeBlock) return "match_primary_press";
  if (activeBlock.plan.targetModality === "dual") {
    const dimension = responseKey === "rel" ? "rel" : "sym";
    const isCurrentMatch = isHubMatchAtIndex(activeBlock.trials, activeBlock.trialIndex, activeBlock.plan.n, dimension);
    if (isCurrentMatch) return "trial_hit";
    return dimension === "rel" ? "match_object_press" : "match_spatial_press";
  }
  const isCurrentMatch = isHubMatchAtIndex(activeBlock.trials, activeBlock.trialIndex, activeBlock.plan.n, activeBlock.plan.targetModality);
  return isCurrentMatch ? "trial_hit" : "match_primary_press";
}

function captureResponse(kind = "primary") {
  if (!isMatchWindowOpen()) return false;
  if (activeBlock.plan.targetModality === "dual") {
    const responseKey = kind === "rel" ? "rel" : "sym";
    const capturedKey = responseKey === "rel" ? "responseRelCaptured" : "responseSymCaptured";
    const rtKey = responseKey === "rel" ? "responseRelRtMs" : "responseSymRtMs";
    if (activeBlock[capturedKey]) return false;
    activeBlock[capturedKey] = true;
    activeBlock[rtKey] = Math.max(0, Math.round(performance.now() - activeBlock.trialStartedAtMs));
    triggerSfx(sfxForResponsePress(responseKey));
    render();
    return true;
  }
  activeBlock.responseCaptured = true;
  activeBlock.responseRtMs = Math.max(0, Math.round(performance.now() - activeBlock.trialStartedAtMs));
  triggerSfx(sfxForResponsePress(kind));
  render();
  return true;
}

function classifyResponse(responded, isMatch) {
  if (responded && isMatch) return "hit";
  if (responded && !isMatch) return "false_alarm";
  if (!responded && isMatch) return "miss";
  return "correct_rejection";
}

function sfxForTrialOutcome(outcome) {
  if (!outcome || typeof outcome !== "object") return null;
  if ("classificationRel" in outcome || "classificationSym" in outcome) {
    if (outcome.classificationRel === "false_alarm" || outcome.classificationSym === "false_alarm") return "trial_false_alarm";
    if (outcome.classificationRel === "miss" || outcome.classificationSym === "miss") return "trial_miss";
    return null;
  }
  if (outcome.classification === "false_alarm") return "trial_false_alarm";
  if (outcome.classification === "miss") return "trial_miss";
  return null;
}

function finishTrial() {
  if (!activeBlock) return;
  const trial = activeBlock.trials[activeBlock.trialIndex];
  let outcome = null;
  if (activeBlock.plan.targetModality === "dual") {
    const isMatchRel = isHubMatchAtIndex(activeBlock.trials, activeBlock.trialIndex, activeBlock.plan.n, "rel");
    const isMatchSym = isHubMatchAtIndex(activeBlock.trials, activeBlock.trialIndex, activeBlock.plan.n, "sym");
    const respondedRel = Boolean(activeBlock.responseRelCaptured);
    const respondedSym = Boolean(activeBlock.responseSymCaptured);
    const classificationRel = classifyResponse(respondedRel, isMatchRel);
    const classificationSym = classifyResponse(respondedSym, isMatchSym);
    const isError = classificationRel === "miss" || classificationRel === "false_alarm" || classificationSym === "miss" || classificationSym === "false_alarm";
    outcome = {
      trialIndex: activeBlock.trialIndex,
      canonRelKey: trial.canonRelKey,
      canonSymKey: trial.canonSymKey,
      isMatchRel,
      isMatchSym,
      respondedRel,
      respondedSym,
      responseRelRtMs: respondedRel ? activeBlock.responseRelRtMs : null,
      responseSymRtMs: respondedSym ? activeBlock.responseSymRtMs : null,
      classificationRel,
      classificationSym,
      classification: isError ? "error" : "ok",
      isError,
      isLapse: (!respondedRel && isMatchRel) || (!respondedSym && isMatchSym),
      isLure: false
    };
    activeBlock.trialOutcomes.push(outcome);
  } else {
    const isMatch = isHubMatchAtIndex(activeBlock.trials, activeBlock.trialIndex, activeBlock.plan.n, activeBlock.plan.targetModality);
    const responded = Boolean(activeBlock.responseCaptured);
    const classification = classifyResponse(responded, isMatch);
    outcome = {
      trialIndex: activeBlock.trialIndex,
      canonKey: trial.canonKey,
      isMatch,
      isLure: Boolean(trial.isLure),
      responded,
      rtMs: responded ? activeBlock.responseRtMs : null,
      isError: classification === "miss" || classification === "false_alarm",
      isLapse: !responded && isMatch,
      classification
    };
    activeBlock.trialOutcomes.push(outcome);
  }
  const outcomeSfx = sfxForTrialOutcome(outcome);
  if (outcomeSfx) triggerSfx(outcomeSfx);
  const nextIndex = activeBlock.trialIndex + 1;
  if (nextIndex < activeBlock.trials.length) {
    startTrial(nextIndex);
    return;
  }
  finishBlock();
}

function liveAccuracy() {
  if (!activeBlock || !activeBlock.trialOutcomes.length) return null;
  const total = activeBlock.trialOutcomes.length;
  if (activeBlock.plan.targetModality === "dual") {
    let relOk = 0;
    let symOk = 0;
    activeBlock.trialOutcomes.forEach((outcome) => {
      if (outcome.classificationRel === "hit" || outcome.classificationRel === "correct_rejection") relOk += 1;
      if (outcome.classificationSym === "hit" || outcome.classificationSym === "correct_rejection") symOk += 1;
    });
    return ((relOk / total) + (symOk / total)) / 2;
  }
  let ok = 0;
  activeBlock.trialOutcomes.forEach((outcome) => {
    if (outcome.classification === "hit" || outcome.classification === "correct_rejection") ok += 1;
  });
  return ok / total;
}

function liveAccuracyForMode(targetModality) {
  if (!activeBlock || !activeBlock.trialOutcomes.length) return null;
  if (activeBlock.plan.targetModality !== "dual") {
    return targetModality === activeBlock.plan.targetModality ? liveAccuracy() : null;
  }
  const key = targetModality === "rel" ? "classificationRel" : "classificationSym";
  let ok = 0;
  activeBlock.trialOutcomes.forEach((outcome) => {
    if (outcome[key] === "hit" || outcome[key] === "correct_rejection") ok += 1;
  });
  return ok / activeBlock.trialOutcomes.length;
}

function numericScore(value) {
  return Number.isFinite(value) ? value : null;
}

function dualSecondaryTargetLabel(wrapper) {
  if (wrapper === "relate_numbers_dual") return "DIRECTION";
  if (wrapper === "relate_vectors_dual") return "ORIENTATION";
  return "SURFACE";
}

function accuracyModeModel() {
  const last = state.history[0] || null;
  const source = activeBlock
    ? { wrapper: activeBlock.plan.wrapper, targetModality: activeBlock.plan.targetModality, entry: null }
    : last
      ? { wrapper: last.wrapper, targetModality: last.targetModality, entry: last }
      : { ...resolveNextBlockSettings(), entry: null };

  if (source.targetModality === "dual") {
    return [
      {
        label: "MODE 1",
        target: "RELATION",
        score: activeBlock ? liveAccuracyForMode("rel") : numericScore(source.entry?.block?.accuracyRel),
        tracked: true
      },
      {
        label: "MODE 2",
        target: dualSecondaryTargetLabel(source.wrapper),
        score: activeBlock ? liveAccuracyForMode("sym") : numericScore(source.entry?.block?.accuracySym),
        tracked: true
      }
    ];
  }

  return [
    {
      label: "MODE 1",
      target: displayHubTargetLabel(source.targetModality, source.wrapper),
      score: activeBlock ? liveAccuracyForMode(source.targetModality) : source.entry ? blockAccuracy(source.entry) : null,
      tracked: true
    },
    {
      label: "MODE 2",
      target: "Not tracked",
      score: null,
      tracked: false
    }
  ];
}

function scoreCoreCorrectness(accuracy) {
  const acc = clamp(Number(accuracy || 0), 0, 1);
  if (acc >= 0.9) return Math.round(36 + ((acc - 0.9) / 0.1) * 4);
  if (acc >= 0.8) return Math.round(30 + ((acc - 0.8) / 0.1) * 5);
  if (acc >= 0.7) return Math.round(22 + ((acc - 0.7) / 0.1) * 7);
  if (acc >= 0.6) return Math.round(12 + ((acc - 0.6) / 0.1) * 9);
  return Math.round((acc / 0.6) * 11);
}

function scoreComplexityHold(block, plan, outcomeBand) {
  const accuracy = Number(block.accuracy || 0);
  if (accuracy < 0.7 || outcomeBand === "DOWN") return 0;
  const nPoints = clamp((Number(block.nEnd || plan.n || 1) / 4) * 9, 2, 9);
  const speedPoints = plan.speed === "fast" ? 4 : 1.5;
  const familyPoints = clamp((WRAPPER_META[plan.wrapper]?.complexity || 2) * 0.9, 2, 7);
  const cleanFactor = accuracy >= 0.9 ? 1 : accuracy >= 0.85 ? 0.86 : accuracy >= 0.8 ? 0.72 : 0.52;
  return Math.round(clamp((nPoints + speedPoints + familyPoints) * cleanFactor, 0, 20));
}

function lateCollapsePenalty(trialOutcomes) {
  if (!Array.isArray(trialOutcomes) || trialOutcomes.length < 8) return 0;
  const midpoint = Math.floor(trialOutcomes.length / 2);
  const first = trialOutcomes.slice(0, midpoint);
  const last = trialOutcomes.slice(midpoint);
  const errorRate = (rows) => rows.filter((row) => row.isError).length / Math.max(1, rows.length);
  return errorRate(last) - errorRate(first) > 0.18 ? 4 : 0;
}

function scoreStabilityEfficiency(block, trialOutcomes) {
  const trials = Math.max(1, Number(block.trials || trialOutcomes?.length || 1));
  const lapseRate = Number(block.lapseCount || 0) / trials;
  const faRate = Number(block.falseAlarms || 0) / Math.max(1, Number(block.falseAlarms || 0) + Number(block.correctRejections || 0));
  let score = 20;
  score -= clamp(lapseRate * 38, 0, 7);
  score -= clamp(faRate * 16, 0, 5);
  score -= clamp(Number(block.errorBursts || 0) * 3, 0, 6);
  score -= lateCollapsePenalty(trialOutcomes);
  return Math.round(clamp(score, 0, 20));
}

function scorePortability(entry, priorHistory) {
  const prior = priorHistory[0] || null;
  let score = 0;
  if (prior && wrapperFamily(prior.wrapper) === wrapperFamily(entry.wrapper) && prior.wrapper !== entry.wrapper && blockAccuracy(entry) >= 0.8 && blockEndN(entry) >= Math.max(1, blockEndN(prior) - 1)) score += 6;
  if (entry.speed === "fast" && blockAccuracy(entry) >= 0.85) score += 4;
  if (prior && wrapperFamily(prior.wrapper) !== wrapperFamily(entry.wrapper) && blockAccuracy(entry) >= 0.8) score += 5;
  if (entry.outcomeBand !== "DOWN" && blockAccuracy(entry) >= 0.85 && Number(entry.block?.errorBursts || 0) <= 1) score += 5;
  return Math.round(clamp(score, 0, 20));
}

function transferLabel(total) {
  if (total >= 90) return "Strong";
  if (total >= 75) return "Broadening";
  if (total >= 50) return "Developing";
  if (total >= 25) return "Emerging";
  return "Early";
}

function computeTransferScore(entry, trialOutcomes, priorHistory = state.history) {
  const coreCorrectness = scoreCoreCorrectness(entry.block.accuracy);
  const complexityHold = scoreComplexityHold(entry.block, entry, entry.outcomeBand);
  const stabilityEfficiency = scoreStabilityEfficiency(entry.block, trialOutcomes);
  const portability = scorePortability(entry, priorHistory);
  const total = clamp(coreCorrectness + complexityHold + stabilityEfficiency + portability, 0, 100);
  return { total, coreCorrectness, complexityHold, stabilityEfficiency, portability, label: transferLabel(total) };
}

function estimateLiveTransferScore() {
  if (!activeBlock) return latestTransferScore();
  const accuracy = liveAccuracy();
  if (!Number.isFinite(accuracy)) return null;
  const block = {
    accuracy,
    trials: activeBlock.trialOutcomes.length,
    nStart: activeBlock.plan.n,
    nEnd: activeBlock.plan.n,
    lapseCount: activeBlock.trialOutcomes.filter((entry) => entry.isLapse).length,
    falseAlarms: activeBlock.trialOutcomes.filter((entry) => entry.classification === "false_alarm" || entry.classificationRel === "false_alarm" || entry.classificationSym === "false_alarm").length,
    correctRejections: activeBlock.trialOutcomes.filter((entry) => entry.classification === "correct_rejection" || entry.classificationRel === "correct_rejection" || entry.classificationSym === "correct_rejection").length,
    errorBursts: 0
  };
  return computeTransferScore({
    wrapper: activeBlock.plan.wrapper,
    targetModality: activeBlock.plan.targetModality,
    speed: activeBlock.plan.speed,
    outcomeBand: "HOLD",
    block
  }, activeBlock.trialOutcomes, state.history);
}

function rollingAccuracyBaseline(wrapper) {
  const rows = state.history.filter((entry) => entry.wrapper === wrapper).slice(0, 5);
  if (!rows.length) return null;
  return rows.reduce((sum, entry) => sum + blockAccuracy(entry), 0) / rows.length;
}

function computeBonuses(entry, transferScore) {
  const baseline = rollingAccuracyBaseline(entry.wrapper);
  let improvementBonus = 0;
  if (Number.isFinite(baseline)) {
    const lift = blockAccuracy(entry) - baseline;
    improvementBonus = lift >= 0.1 ? 2 : lift >= 0.05 ? 1 : 0;
  } else if (blockAccuracy(entry) >= 0.9) {
    improvementBonus = 1;
  }

  const prior = state.history[0] || null;
  let stretchSignals = 0;
  if (prior && prior.wrapper !== entry.wrapper && blockAccuracy(entry) >= 0.8) stretchSignals += 1;
  if (prior && prior.speed !== entry.speed && entry.speed === "fast" && blockAccuracy(entry) >= 0.85) stretchSignals += 1;
  if (prior && Number(entry.block?.nStart || 1) > Number(prior.block?.nStart || 1) && blockAccuracy(entry) >= 0.8) stretchSignals += 1;

  let cleanHoldBonus = 0;
  if (entry.outcomeBand !== "DOWN") cleanHoldBonus += 1;
  if (Number(entry.block?.errorBursts || 0) === 0) cleanHoldBonus += 1;
  if (Number(entry.block?.lapseCount || 0) <= 1 && transferScore.stabilityEfficiency >= 16) cleanHoldBonus += 1;

  return {
    improvementBonus,
    stretchBonus: clamp(stretchSignals, 0, 2),
    cleanHoldBonus: clamp(cleanHoldBonus, 0, 3)
  };
}

function computeGAward(transferScore, bonuses) {
  return Math.round(2 + 0.06 * transferScore.total + bonuses.improvementBonus + bonuses.stretchBonus + bonuses.cleanHoldBonus);
}

function sessionEarnedG(sessionId, extra = 0) {
  if (!sessionId) return extra;
  return state.history
    .filter((entry) => entry.sessionId === sessionId)
    .reduce((sum, entry) => sum + Number(entry.rewardState?.blockG || 0), extra);
}

function computeProgrammeCompletionScore() {
  const coreHistory = state.history.filter((entry) => entry.rewardMode === "core");
  const familiesCovered = ["flex", "bind", "resist", "relate"].filter((familyId) => coreHistory.some((entry) => wrapperFamily(entry.wrapper) === familyId)).length;
  const familyCoverage = Math.round((familiesCovered / 4) * 40);
  const chronological = coreHistory.slice().reverse();
  const early = chronological.slice(0, 6);
  const late = chronological.slice(-6);
  const avg = (rows, pick) => rows.length ? rows.reduce((sum, row) => sum + pick(row), 0) / rows.length : 0;
  const earlyRt = avg(early, (entry) => Number(entry.block?.meanRtMs || 1200));
  const lateRt = avg(late, (entry) => Number(entry.block?.meanRtMs || 1200));
  const earlyAcc = avg(early, blockAccuracy);
  const lateAcc = avg(late, blockAccuracy);
  const speedGain = earlyRt > 0 ? clamp((earlyRt - lateRt) / earlyRt, 0, 0.25) / 0.25 : 0;
  const accGain = clamp(lateAcc - earlyAcc, 0, 0.15) / 0.15;
  const efficiencyGain = Math.round(((speedGain * 0.55) + (accGain * 0.45)) * 30);
  const recentRows = coreHistory.slice(0, 8);
  const recentPortability = recentRows.reduce((sum, entry) => sum + Number(entry.transferScore?.portability || 0), 0) / Math.max(1, recentRows.length);
  const farTransferEvidence = Math.round(clamp(recentPortability / 20, 0, 1) * 30);
  return {
    total: clamp(familyCoverage + efficiencyGain + farTransferEvidence, 0, 100),
    familyCoverage,
    efficiencyGain,
    farTransferEvidence
  };
}

function maybeAwardProgrammeBonus(completedSession) {
  if (!completedSession || completedSession.routeClass !== "core") return null;
  if (state.programme.programmeBonusAwarded || state.programme.coreSessionNumber < PROGRAMME_SESSION_TARGET) return null;
  const programmeScore = computeProgrammeCompletionScore();
  const bonusG = 20 + Math.round(0.6 * programmeScore.total);
  const wallet = addGEvent({
    source: "capacity_programme_bonus",
    label: "20-session programme completion",
    g: bonusG,
    meta: { programmeScore }
  });
  state.programme.programmeBonusAwarded = true;
  state.programme.programmeCompletedAt = Date.now();
  saveState();
  return { bonusG, programmeScore, walletG: wallet.walletG, iqCredits: wallet.walletG / 100 };
}

function playBlockRewardSfx(startN, endN, blockG, programmeBonus) {
  const levelEvent = endN > startN
    ? "n_level_up"
    : endN < startN
      ? "n_level_down"
      : "block_complete_neutral";
  triggerSfx(levelEvent);
  scheduleSfx(blockG >= 9 ? "credit_award_large" : "credit_award_small", 150);
  if (programmeBonus) {
    scheduleSfx("programme_bonus", 360);
  }
}

function finishBlock() {
  if (!activeBlock) return;
  clearTimers();
  const summary = summarizeHubBlock({
    plan: activeBlock.plan,
    trials: activeBlock.trials,
    trialOutcomes: activeBlock.trialOutcomes,
    nMax: HUB_N_MAX
  });
  const session = state.currentSession?.id === activeBlock.sessionId ? state.currentSession : null;
  const manualSessionNumber = activeBlock.rewardMode === "manual" ? nextManualSessionNumber() : null;
  const baseEntry = {
    id: `capv2_${activeBlock.tsStart}`,
    tsStart: activeBlock.tsStart,
    tsEnd: Date.now(),
    sessionId: activeBlock.sessionId,
    zoneState: session?.zoneState || null,
    routeClass: session?.routeClass || "manual",
    coreSessionNumber: session?.coreSessionNumber || null,
    manualSessionNumber,
    rewardMode: activeBlock.rewardMode,
    wrapper: activeBlock.plan.wrapper,
    targetModality: activeBlock.plan.targetModality,
    speed: activeBlock.plan.speed,
    outcomeBand: summary.outcomeBand,
    recommendedN: summary.nEnd,
    block: summary.blockResult
  };
  const transferScore = computeTransferScore(baseEntry, activeBlock.trialOutcomes, state.history);
  const bonuses = computeBonuses(baseEntry, transferScore);
  const blockG = computeGAward(transferScore, bonuses);
  const wallet = addGEvent({
    source: "capacity_block",
    label: `${familyLabel(wrapperFamily(baseEntry.wrapper))} block`,
    g: blockG,
    meta: { wrapper: baseEntry.wrapper, transferScore: transferScore.total, bonuses }
  });
  const entry = {
    ...baseEntry,
    transferScore,
    bonuses,
    rewardState: {
      blockG,
      sessionG: sessionEarnedG(activeBlock.sessionId, blockG),
      walletG: wallet.walletG,
      iqCredits: wallet.walletG / 100
    }
  };

  state.history = [entry, ...state.history].slice(0, HISTORY_LIMIT);
  state.settings.wrapper = baseEntry.wrapper;
  state.settings.targetModality = baseEntry.targetModality;
  state.settings.speed = baseEntry.speed;
  if (manualSessionNumber) {
    state.programme.manualSessionNumber = clampSessionCounter(Math.max(completedManualSessions(), manualSessionNumber));
  }

  let programmeBonus = null;
  let unifiedCompleted = null;
  if (state.currentSession && state.currentSession.id === activeBlock.sessionId) {
    unifiedCompleted = recordUnifiedCapacityBlock(state.currentSession.id);
    state.currentSession.blocksCompleted += 1;
    if (state.currentSession.blocksCompleted >= state.currentSession.plannedBlocks) {
      const completedSession = state.currentSession;
      state.currentSession = null;
      if (completedSession.routeClass === "core" && !currentCoachContract() && !unifiedCompleted) {
        state.programme.coreSessionNumber = Math.max(state.programme.coreSessionNumber, completedSession.coreSessionNumber || state.programme.coreSessionNumber + 1);
      }
      saveState();
      if (!completedSession.eligibleForEncoding20 || !currentCoachContract()) {
        programmeBonus = maybeAwardProgrammeBonus(completedSession);
      }
    }
  }
  saveState();
  activeBlock = null;
  viewState.message = unifiedCompleted
    ? `Session complete. Strong finish: Capacity and Reasoning are both done. +${blockG} g plasticity cells.`
    : `${wrapperLabel(entry.wrapper)} saved: ${percent(entry.block.accuracy)} accuracy, Far Transfer Score ${formatScorePercent(transferScore.total)}, +${blockG} g plasticity cells.`;
  if (!unifiedCompleted && currentCoachContract() && capacityRemainingForContract() <= 0 && reasoningRemainingForContract() > 0) {
    viewState.message = `Capacity target complete. Good work. Switch to Reasoning Gym to finish ${reasoningRemainingForContract()} reasoning item${reasoningRemainingForContract() === 1 ? "" : "s"}.`;
  }
  if (programmeBonus) viewState.message += ` Programme complete bonus: +${programmeBonus.bonusG} g.`;
  playBlockRewardSfx(baseEntry.block.nStart, summary.nEnd, blockG, programmeBonus);
  render();
}

function assetUrl(url) {
  if (!url) return "";
  if (url.startsWith("./assets/")) {
    return `https://mindware-lab.github.io/trident-g-platform/products/trident-g-iq-basic/${url.slice(2)}`;
  }
  return url;
}

function renderRelateVectorTokenMarkup(token, visible) {
  const point = token?.pointPct || { xPct: 50, yPct: 50 };
  const rotationDeg = Number(token?.angleDeg || 0) + 90;
  return `
    <div class="capacity-hub-token capacity-hub-token--relate${visible ? "" : " is-hidden"}" style="left:${point.xPct}%;top:${point.yPct}%;">
      <svg class="capacity-relate-arrow" viewBox="0 0 48 48" aria-hidden="true" style="transform:rotate(${rotationDeg}deg);">
        <path d="M24 6 39 23H30V42H18V23H9L24 6Z"></path>
      </svg>
    </div>
  `;
}

function renderRelateNumberTokenMarkup(token, visible, isVisibleNow) {
  const point = token?.pointPct || { xPct: 50, yPct: 50 };
  return `
    <div class="capacity-hub-token capacity-hub-token--relate-number${visible && isVisibleNow ? "" : " is-hidden"}" style="left:${point.xPct}%;top:${point.yPct}%;">
      <span class="capacity-relate-number-value">${escapeHtml(token?.value ?? "")}</span>
    </div>
  `;
}

function arenaWrapperClass(wrapper) {
  const activeWrapper = String(wrapper || "");
  if (activeWrapper === "hub_noncat") return "is-noncat";
  if (activeWrapper === "hub_concept") return "is-concept";
  if (activeWrapper === "resist_vectors") return "is-resist";
  if (activeWrapper === "resist_words" || activeWrapper === "emotion_words") return "is-resist is-resist-words";
  if (activeWrapper === "resist_concept") return "is-resist is-resist-concept";
  if (activeWrapper === "relate_vectors" || activeWrapper === "relate_vectors_dual" || activeWrapper === "relate_numbers" || activeWrapper === "relate_numbers_dual") return "is-relate";
  if (activeWrapper.startsWith("and_")) return activeWrapper === "and_noncat" ? "is-and is-and-remap" : "is-and";
  return "is-cat";
}

function renderCountdownMarkup() {
  if (activeBlock?.status !== "countdown") return "";
  const value = COUNTDOWN_STEPS[activeBlock.countdownStep] || COUNTDOWN_STEPS[0];
  return `<div class="capacity-countdown" aria-live="assertive">${escapeHtml(value)}</div>`;
}

function arenaMarkup() {
  const trial = activeBlock && activeBlock.trialIndex >= 0 ? activeBlock.trials[activeBlock.trialIndex] : null;
  const wrapper = activeBlock?.plan?.wrapper || state.settings.wrapper;
  const wrapperClass = arenaWrapperClass(wrapper);
  const pausedClass = activeBlock?.status === "paused" ? " is-paused" : "";
  const points = activeBlock?.renderMapping?.markerPositions?.length ? activeBlock.renderMapping.markerPositions : PREVIEW_MARKERS;
  const hideMarkers = wrapper === "hub_noncat" || wrapper === "hub_concept" || wrapper === "and_noncat" || wrapper === "resist_words" || wrapper === "emotion_words" || wrapper === "resist_concept";
  const markers = hideMarkers ? "" : points.map((point) => `<span class="capacity-hub-marker" style="left:${point.xPct}%;top:${point.yPct}%;"></span>`).join("");
  const visible = Boolean(trial && (activeBlock?.status === "trial" || activeBlock?.status === "paused") && activeBlock.stimulusVisible);
  const countdown = renderCountdownMarkup();
  const isRelateVectorWrapper = wrapper === "relate_vectors" || wrapper === "relate_vectors_dual";
  const isRelateNumbersWrapper = wrapper === "relate_numbers" || wrapper === "relate_numbers_dual";

  if (isRelateVectorWrapper) {
    const relationTokens = Array.isArray(trial?.display?.pairTokens)
      ? trial.display.pairTokens.map((token) => renderRelateVectorTokenMarkup(token, visible)).join("")
      : "";
    return `<div class="capacity-hub-arena ${wrapperClass}${pausedClass}"><div class="capacity-hub-ring"></div>${markers}${countdown}${relationTokens}</div>`;
  }

  if (isRelateNumbersWrapper) {
    const showFirst = Boolean(visible && activeBlock?.trialVisualStage >= 1);
    const showSecond = Boolean(visible && activeBlock?.trialVisualStage >= 2);
    return `
      <div class="capacity-hub-arena ${wrapperClass}${pausedClass}">
        <div class="capacity-hub-ring"></div>
        ${markers}
        ${countdown}
        ${trial ? renderRelateNumberTokenMarkup(trial.display.firstToken, visible, showFirst) : ""}
        ${trial ? renderRelateNumberTokenMarkup(trial.display.secondToken, visible, showSecond) : ""}
      </div>
    `;
  }

  const point = trial?.display?.pointPct || (trial && points[trial.locIdx] ? points[trial.locIdx] : { xPct: 50, yPct: 50 });
  const background = visible ? String(trial?.display?.colourHex || "#ffffff") : "transparent";
  const fallbackTextColor = String(trial?.display?.colourHex || "").toLowerCase() === "#ffffff" ? "#102033" : "#ffffff";
  const textColor = trial?.display?.textHex || fallbackTextColor;
  const isWordWrapper = wrapper === "resist_words" || wrapper === "emotion_words";
  const isShape = Boolean(trial?.display?.symbolSvgPath);
  let token = "";
  if (visible) {
    if (trial?.display?.symbolImageUrl) {
      token = `<img src="${escapeHtml(assetUrl(trial.display.symbolImageUrl))}" alt="">`;
    } else if (trial?.display?.symbolSvgPath) {
      const rounded = trial.display.symbolSvgRounded ? " is-rounded" : "";
      token = `<svg class="capacity-hub-symbol${rounded}" viewBox="-1 -1 2 2" aria-hidden="true"><path d="${escapeHtml(trial.display.symbolSvgPath)}"></path></svg>`;
    } else {
      token = escapeHtml(trial?.display?.symbolLabel || "");
    }
  }
  const fontFamily = trial?.display?.symbolFontFamily ? `font-family:${trial.display.symbolFontFamily};` : "";
  const fontWeight = trial?.display?.symbolFontWeight ? `font-weight:${trial.display.symbolFontWeight};` : "";
  const fontStyle = trial?.display?.symbolFontStyle ? `font-style:${trial.display.symbolFontStyle};` : "";
  const shapeColor = trial?.display?.colourHex || "#ffffff";
  const tokenChrome = isWordWrapper ? "background:transparent;border:0;border-radius:0;box-shadow:none;" : "";

  return `
    <div class="capacity-hub-arena ${wrapperClass}${pausedClass}">
      <div class="capacity-hub-ring"></div>
      ${markers}
      ${countdown}
      <div class="capacity-hub-token${visible ? "" : " is-hidden"}${isShape ? " is-shape" : ""}${isWordWrapper ? " is-word" : ""}" style="left:${point.xPct}%;top:${point.yPct}%;background:${isShape || isWordWrapper ? "transparent" : background};color:${visible ? (isShape || isWordWrapper ? shapeColor : textColor) : "transparent"};${tokenChrome}${fontFamily}${fontWeight}${fontStyle}">${token}</div>
    </div>
  `;
}

function latestTransferScore() {
  return state.history[0]?.transferScore || null;
}

function blocksLeft() {
  const session = activeBlock?.sessionId && state.currentSession?.id === activeBlock.sessionId
    ? state.currentSession
    : activeCoachSession();
  if (activeBlock?.sessionId && session?.id === activeBlock.sessionId) {
    return Math.max(0, session.plannedBlocks - session.blocksCompleted);
  }
  if (session) return Math.max(0, session.plannedBlocks - session.blocksCompleted);
  return activeBlock ? 1 : 0;
}

function transferSprintModel() {
  const sessionId = activeBlock?.sessionId || activeCoachSession()?.id || null;
  const recentEntries = state.history
    .filter((entry) => !sessionId || entry.sessionId === sessionId)
    .slice(0, activeBlock ? TRANSFER_SPRINT_BLOCKS - 1 : TRANSFER_SPRINT_BLOCKS)
    .reverse();
  const samples = recentEntries.map((entry) => {
    const total = Number(entry?.transferScore?.total);
    return Number.isFinite(total) ? clamp(total, 0, 100) : null;
  });
  if (activeBlock) {
    const liveScore = estimateLiveTransferScore();
    const total = Number(liveScore?.total);
    samples.push(Number.isFinite(total) ? clamp(total, 0, 100) : null);
  }
  const visibleSamples = samples.slice(-TRANSFER_SPRINT_BLOCKS);
  while (visibleSamples.length < TRANSFER_SPRINT_BLOCKS) visibleSamples.unshift(null);
  const scored = visibleSamples.filter((score) => Number.isFinite(score));
  const average = scored.length
    ? Math.round(scored.reduce((sum, score) => sum + score, 0) / scored.length)
    : null;
  return { samples: visibleSamples, count: scored.length, average };
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function programmeSessionGroups() {
  const manualMode = state.settings.mode === "manual";
  const groups = [];
  const byKey = new Map();
  const chronological = state.history
    .slice()
    .reverse()
    .filter((entry) => entry && (manualMode
      ? (entry.routeClass === "manual" || entry.rewardMode === "manual")
      : (entry.routeClass === "core" || entry.rewardMode === "core")));

  chronological.forEach((entry) => {
    const key = entry.sessionId || entry.id || `block_${entry.tsStart || groups.length}`;
    const numberedSession = manualMode ? entry.manualSessionNumber : entry.coreSessionNumber;
    let group = byKey.get(key);
    if (!group) {
      group = {
        key,
        sessionNumber: Number.isFinite(numberedSession) ? Math.round(numberedSession) : null,
        tsStart: Number.isFinite(entry.tsStart) ? entry.tsStart : 0,
        tsEnd: Number.isFinite(entry.tsEnd) ? entry.tsEnd : 0,
        entries: []
      };
      byKey.set(key, group);
      groups.push(group);
    }
    if (!Number.isFinite(group.sessionNumber) && Number.isFinite(numberedSession)) {
      group.sessionNumber = Math.round(numberedSession);
    }
    if (Number.isFinite(entry.tsStart) && (!group.tsStart || entry.tsStart < group.tsStart)) group.tsStart = entry.tsStart;
    if (Number.isFinite(entry.tsEnd) && entry.tsEnd > group.tsEnd) group.tsEnd = entry.tsEnd;
    group.entries.push(entry);
  });

  return groups.map((group, index) => {
    const avgN = average(group.entries.map((entry) => blockEndN(entry)));
    const avgTransfer = average(group.entries.map((entry) => Number(entry?.transferScore?.total)));
    const sessionNumber = Number.isFinite(group.sessionNumber) ? group.sessionNumber : index + 1;
    return {
      sessionNumber,
      label: `${sessionNumber}`,
      avgN,
      avgTransfer,
      blockCount: group.entries.length,
      isCurrent: state.currentSession?.id === group.key
    };
  });
}

function sessionStatsModel() {
  const manualMode = state.settings.mode === "manual";
  const groups = programmeSessionGroups();
  const rolling = groups.length > PROGRAMME_SESSION_TARGET;
  const visibleGroups = rolling ? groups.slice(-PROGRAMME_SESSION_TARGET) : groups;
  const slots = Array.from({ length: PROGRAMME_SESSION_TARGET }, (_, index) => {
    const group = visibleGroups[index] || null;
    return group ? { ...group, slot: index + 1 } : { slot: index + 1, label: `${index + 1}`, empty: true };
  });
  const populated = slots.filter((slot) => !slot.empty);
  return {
    slots,
    rolling,
    manualMode,
    completed: manualMode ? completedManualSessions() : completedProgrammeSessions(),
    completedDisplay: manualMode ? `${completedManualSessions()}` : programmeSessionDisplay(),
    sessionsToGo: manualMode ? "-" : programmeSessionsToGo(),
    avgN: average(populated.map((slot) => slot.avgN)),
    avgTransfer: average(populated.map((slot) => slot.avgTransfer))
  };
}

function zoneBitsStatsModel() {
  const rows = zonePulseState.history
    .filter((entry) => entry?.valid && Number.isFinite(entry.bitsPerSecond))
    .slice(-PROGRAMME_SESSION_TARGET);
  const slots = Array.from({ length: PROGRAMME_SESSION_TARGET }, (_, index) => {
    const row = rows[index] || null;
    return row ? {
      slot: index + 1,
      label: `${index + 1}`,
      bitsPerSecond: row.bitsPerSecond,
      state: zoneRouteState(row.state)
    } : {
      slot: index + 1,
      label: `${index + 1}`,
      empty: true
    };
  });
  const maxBits = Math.max(1, ...rows.map((entry) => Number(entry.bitsPerSecond)).filter(Number.isFinite));
  return {
    slots,
    maxValue: Math.max(1, Math.ceil(maxBits * 1.15))
  };
}

function hudModel() {
  const plan = displayPlanForHud();
  const family = wrapperFamily(plan.wrapper);
  return {
    items: [
      ["Game", familyLabel(family)],
      ["Target", displayHubTargetLabel(plan.targetModality, plan.wrapper)],
      ["Memory", `N-${plan.n}`]
    ]
  };
}

function zoneHudModel() {
  const snapshot = zoneDisplaySnapshot();
  const progressLabel = zonePulseIsRunning() ? `${Math.round(zonePulseState.live.progressPct || 0)}%` : snapshot.confidence;
  return {
    items: [
      ["Zone", snapshot.fresh ? snapshot.label : "Pending"],
      ["Bits/sec", formatBitsPerSecond(snapshot.bitsPerSecond)],
      ["Control", progressLabel || "--"]
    ]
  };
}

function reasoningHudModel() {
  const latest = reasoningState.history.find((entry) => entry && entry.type !== "session_abandoned") || null;
  const family = activeReasoningBlock?.plan?.family
    || reasoningState.currentSession?.family
    || reasoningState.settings.family;
  const accuracy = activeReasoningBlock?.outcomes?.length
    ? percent(activeReasoningBlock.outcomes.filter((outcome) => outcome.isCorrect).length / activeReasoningBlock.outcomes.length)
    : latest ? percent(latest.accuracy) : "--";
  const transfer = latest?.transferScore ? formatScorePercent(latest.transferScore.total) : "--";
  return {
    items: [
      ["Family", reasoningFamilyLabel(family)],
      ["Accuracy", accuracy],
      ["Transfer", transfer]
    ]
  };
}

function renderHud() {
  const model = viewState.centerMode === "zone"
    ? zoneHudModel()
    : viewState.activeModule === "reasoning" ? reasoningHudModel()
      : viewState.activeModule === "tracker" ? trackerHudModel()
        : hudModel();
  const ariaLabel = viewState.activeModule === "reasoning"
    ? "Reasoning block status"
    : viewState.activeModule === "tracker" ? "Tracker status" : "Capacity block status";
  return `
    <div class="hud" aria-label="${ariaLabel}">
      <div class="hud-status">
        ${model.items.map(([label, value]) => `
          <div class="hud-item">
            <span class="hud-label">${escapeHtml(label)}</span>
            <strong class="hud-value">${escapeHtml(value)}</strong>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderCoachSessionBar() {
  if (viewState.centerMode === "stats") return "";
  const coachSelected = state.settings.mode === "coach" || reasoningState.settings.mode === "coach";
  const contract = coachContractForDisplay();
  if (!contract && !coachSelected) return "";
  const completedSessions = clamp(completedUnifiedCoreSessions(), 0, PROGRAMME_SESSION_TARGET);
  const sessionsToGo = Math.max(0, PROGRAMME_SESSION_TARGET - completedSessions);
  const remainingPct = clamp(Math.round((sessionsToGo / PROGRAMME_SESSION_TARGET) * 100), 0, 100);
  return `
    <div class="coach-session-bar" aria-label="${escapeHtml(`${sessionsToGo} coached sessions to go`)}">
      <span class="coach-session-label">Sessions to go</span>
      <div class="coach-session-progress" style="--session-progress:${remainingPct}%;" aria-label="${escapeHtml(`${sessionsToGo} of ${PROGRAMME_SESSION_TARGET} sessions remaining`)}">
        <div class="coach-session-track"><span></span></div>
      </div>
    </div>
  `;
}

function shouldShowCoachCallout() {
  return !activeBlock && viewState.centerMode !== "stats" && viewState.centerMode !== "zone";
}

function coachCalloutModel() {
  const contract = currentCoachContract();
  if (contract) {
    if (capacityRemainingForContract(contract) <= 0 && reasoningRemainingForContract(contract) > 0) {
      return {
        kicker: "Coach tip",
        title: "Capacity done. Move to Reasoning Gym.",
        body: `Good work. You have ${reasoningRemainingForContract(contract)} reasoning item${reasoningRemainingForContract(contract) === 1 ? "" : "s"} left to complete this session.`
      };
    }
    if (contract.capacityCompletedBlocks > 0 && contract.capacityCompletedBlocks % 3 === 0) {
      return {
        kicker: "Coach tip",
        title: "Nice progress. Keep this pace.",
        body: `You have finished ${contract.capacityCompletedBlocks} of ${contract.capacityTargetBlocks} Capacity blocks. Stay steady; Reasoning Gym comes after this target.`
      };
    }
    const phase = phaseForCoachSession(contract.sessionNumber);
    return {
      kicker: "Coach tip",
      title: `${phase.label} session: Capacity first`,
      body: `Finish today's Capacity blocks first. Then switch to Reasoning Gym to turn the same control skill into logic practice.`
    };
  }
  if (coachState.lastCompleted?.status === "complete") {
    return {
      kicker: "Coach tip",
      title: "Session complete",
      body: "Good work. Your Capacity and Reasoning targets are both done. Run a fresh Zone Check next time to set the next session."
    };
  }
  const preflight = coachZonePreflightStatus();
  if (preflight.recommended) {
    const body = preflight.reason === "used"
      ? "Your last Zone Check was before your last training session. Test your zone again so the coach can set today's target."
      : preflight.reason === "invalid"
        ? "Your last Zone Check did not validate. Run a clean 3-minute pulse before starting coach-led training."
        : "Start with a 'zone pulse' so the coach can set today's Capacity and Reasoning targets. It's also effective brain training for cognition.";
    return {
      kicker: "Coach tip",
      title: "Test your zone / 3 min",
      body
    };
  }
  const tip = blockTipModel(displayPlanForHud());
  return {
    ...tip,
    body: `Match what matters from ${turnsBackLabel(displayPlanForHud().n)} ago. Ignore the features that are not part of this block.`
  };
}

function renderCoachCallout() {
  if (!shouldShowCoachCallout()) return "";
  const callout = coachCalloutModel();
  return `
    <div class="coach-callout" role="status" aria-live="polite">
      <span>${escapeHtml(callout.kicker)}</span>
      <strong>${escapeHtml(callout.title)}</strong>
      <p>${escapeHtml(callout.body)}</p>
    </div>
  `;
}

function formatGraphValue(value, digits = 0) {
  if (!Number.isFinite(value)) return "--";
  return digits > 0 ? value.toFixed(digits) : `${Math.round(value)}`;
}

function formatScorePercent(value) {
  if (!Number.isFinite(value)) return "--";
  return `${Math.round(value)}%`;
}

function renderSessionBarChart({ title, subtitle, valueKey, maxValue, unit = "", digits = 0, model }) {
  return `
    <section class="stats-graph" aria-label="${escapeHtml(title)}">
      <div class="stats-graph-head">
        <div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(subtitle)}</p>
        </div>
      </div>
      <div class="stats-bars" style="--stats-bars-count:${Math.max(1, model.slots.length)};">
        ${model.slots.map((slot) => {
          const value = Number(slot[valueKey]);
          const hasValue = !slot.empty && Number.isFinite(value);
          const pct = hasValue ? clamp((value / maxValue) * 100, 2, 100) : 0;
          const displayValue = hasValue ? `${formatGraphValue(value, digits)}${unit}` : "No data";
          const sessionLabel = slot.empty ? `Session ${slot.slot}` : `Session ${slot.label}`;
          return `
            <div class="stats-bar${hasValue ? "" : " is-empty"}${slot.isCurrent ? " is-current" : ""}" title="${escapeHtml(`${sessionLabel}: ${displayValue}`)}">
              <i style="--bar:${pct}%;"></i>
              <span>${escapeHtml(slot.label)}</span>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderCenterStatsDashboard() {
  const model = sessionStatsModel();
  const zoneBitsModel = zoneBitsStatsModel();
  const rangeLabel = model.manualMode
    ? (model.rolling ? "Last 20 manual sessions" : "Manual session history")
    : (model.rolling ? "Last 20 coach sessions" : "20-session programme");
  const sessionSubtitle = model.manualMode
    ? "Mean held N across each manual session."
    : "Mean held N across each coached core session.";
  return `
    <div class="center-stats-dashboard">
      <div class="center-stats-head">
        <div>
          <span class="stats-kicker">${escapeHtml(rangeLabel)}</span>
          <h2>Capacity Progress</h2>
        </div>
        <button class="btn btn-ghost" type="button" data-action="show-play">Return to gameplay</button>
      </div>
      <div class="center-stats-summary">
        <div class="stat"><span class="mini-label">Completed</span><strong>${model.completedDisplay}</strong></div>
        <div class="stat"><span class="mini-label">Sessions to go</span><strong>${model.sessionsToGo}</strong></div>
        <div class="stat"><span class="mini-label">Avg N-back</span><strong>${formatGraphValue(model.avgN, 1)}</strong></div>
        <div class="stat"><span class="mini-label">Avg Far Transfer</span><strong>${formatScorePercent(model.avgTransfer)}</strong></div>
      </div>
      ${renderSessionBarChart({
        title: "N-back average per session",
        subtitle: sessionSubtitle,
        valueKey: "avgN",
        maxValue: HUB_N_MAX,
        digits: 1,
        model
      })}
      ${renderSessionBarChart({
        title: "Far Transfer Score per session",
        subtitle: "Mean far transfer score across blocks in each session.",
        valueKey: "avgTransfer",
        maxValue: 100,
        unit: "%",
        model
      })}
      ${renderSessionBarChart({
        title: "Zone Check bits/sec",
        subtitle: "Last 20 valid 3-minute zone pulse recordings.",
        valueKey: "bitsPerSecond",
        maxValue: zoneBitsModel.maxValue,
        unit: "",
        digits: 2,
        model: zoneBitsModel
      })}
    </div>
  `;
}

function reasoningProgrammeGroups() {
  const groups = [];
  const byKey = new Map();
  reasoningState.history
    .filter((entry) => entry && entry.type !== "session_abandoned" && (reasoningState.settings.mode === "manual" ? entry.mode === "manual" : entry.routeClass === "core"))
    .slice()
    .reverse()
    .forEach((entry) => {
      const key = entry.sessionId || entry.id;
      if (!byKey.has(key)) {
        const group = {
          key,
          label: `${groups.length + 1}`,
          slot: groups.length + 1,
          entries: []
        };
        byKey.set(key, group);
        groups.push(group);
      }
      byKey.get(key).entries.push(entry);
    });
  return groups.map((group, index) => {
    const avgAccuracy = average(group.entries.map((entry) => Number(entry.accuracy)));
    const avgTransfer = average(group.entries.map((entry) => Number(entry.transferScore?.total)));
    const avgTier = average(group.entries.map((entry) => Number(entry.tier)));
    return {
      ...group,
      slot: index + 1,
      label: `${index + 1}`,
      avgAccuracy: Number.isFinite(avgAccuracy) ? avgAccuracy * 100 : null,
      avgTransfer,
      avgTier,
      isCurrent: reasoningState.currentSession?.id === group.key
    };
  });
}

function reasoningStatsModel() {
  const manualMode = reasoningState.settings.mode === "manual";
  const groups = reasoningProgrammeGroups();
  const visibleGroups = groups.slice(-REASONING_SESSION_TARGET);
  const slots = Array.from({ length: REASONING_SESSION_TARGET }, (_, index) => {
    const group = visibleGroups[index] || null;
    return group ? { ...group, slot: index + 1 } : { slot: index + 1, label: `${index + 1}`, empty: true };
  });
  const populated = slots.filter((slot) => !slot.empty);
  return {
    slots,
    manualMode,
    completed: manualMode ? Number(reasoningState.programme.manualSessionNumber || 0) : completedReasoningSessions(reasoningState),
    completedDisplay: manualMode ? `${Number(reasoningState.programme.manualSessionNumber || 0)}` : `${Math.min(REASONING_SESSION_TARGET, completedReasoningSessions(reasoningState))}/${REASONING_SESSION_TARGET}`,
    sessionsToGo: manualMode ? "-" : reasoningSessionsToGo(reasoningState),
    avgAccuracy: average(populated.map((slot) => slot.avgAccuracy)),
    avgTransfer: average(populated.map((slot) => slot.avgTransfer)),
    avgTier: average(populated.map((slot) => slot.avgTier))
  };
}

function renderReasoningStatsDashboard() {
  const model = reasoningStatsModel();
  const rangeLabel = model.manualMode ? "Reasoning practice history" : "Reasoning 20-session programme";
  return `
    <div class="center-stats-dashboard reasoning-stats-dashboard">
      <div class="center-stats-head">
        <div>
          <span class="stats-kicker">${escapeHtml(rangeLabel)}</span>
          <h2>Reasoning Progress</h2>
        </div>
        <button class="btn btn-ghost" type="button" data-action="show-play">Return to gameplay</button>
      </div>
      <div class="center-stats-summary">
        <div class="stat"><span class="mini-label">Completed</span><strong>${escapeHtml(model.completedDisplay)}</strong></div>
        <div class="stat"><span class="mini-label">Sessions to go</span><strong>${escapeHtml(String(model.sessionsToGo))}</strong></div>
        <div class="stat"><span class="mini-label">Avg Tier</span><strong>${formatGraphValue(model.avgTier, 1)}</strong></div>
        <div class="stat"><span class="mini-label">Avg Transfer</span><strong>${formatScorePercent(model.avgTransfer)}</strong></div>
      </div>
      ${renderSessionBarChart({
        title: "Average tier per session",
        subtitle: "Mean reasoning tier held across each reasoning session.",
        valueKey: "avgTier",
        maxValue: 5,
        digits: 1,
        model
      })}
      ${renderSessionBarChart({
        title: "Reasoning transfer per session",
        subtitle: "Mean reasoning transfer score across blocks.",
        valueKey: "avgTransfer",
        maxValue: 100,
        unit: "%",
        model
      })}
      ${renderSessionBarChart({
        title: "Accuracy per session",
        subtitle: "Mean reasoning accuracy across each session.",
        valueKey: "avgAccuracy",
        maxValue: 100,
        unit: "%",
        model
      })}
    </div>
  `;
}

function trackerSelectedTest() {
  return TRACKER_TEST_BY_ID[trackerState.settings.selectedTest] || TRACKER_TEST_BY_ID.sgs12_pre;
}

function formatTrackerScore(value, digits = 1) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(digits).replace(/\.0$/, "") : "--";
}

function trackerLatestSummary() {
  const pre = latestTrackerEntry(trackerState, "sgs12_pre");
  const post = latestTrackerEntry(trackerState, "sgs12_post");
  const psi = latestTrackerEntry(trackerState, "psi_cbs");
  const psiCore = latestTrackerFieldEntry(trackerState, "psi_cbs", "core");
  const psiAd = latestTrackerFieldEntry(trackerState, "psi_cbs", "ad");
  const psiAi = latestTrackerFieldEntry(trackerState, "psi_cbs", "ai");
  const preIq = Number(pre?.result?.rsIq);
  const postIq = Number(post?.result?.rsIq);
  const delta = Number.isFinite(preIq) && Number.isFinite(postIq) ? postIq - preIq : null;
  return { pre, post, psi, psiCore, psiAd, psiAi, preIq, postIq, delta };
}

function trackerHudModel() {
  const selected = trackerSelectedTest();
  if (activeTrackerSession?.status === "question") {
    const done = Number(activeTrackerSession.index || 0) + 1;
    const total = Number(activeTrackerSession.totalItems || 1);
    return {
      items: [
        ["Test", activeTrackerSession.label],
        ["Progress", `${Math.min(done, total)}/${total}`],
        ["Score", "Pending"]
      ]
    };
  }
  const latest = trackerLatestSummary();
  return {
    items: [
      ["Tracker", selected.shortLabel],
      ["SgS pre", Number.isFinite(latest.preIq) ? `${latest.preIq}` : "--"],
      ["Psi Core", formatTrackerScore(latest.psiCore?.result?.core)]
    ]
  };
}

function trackerSeriesModel(testId, field, count = 10) {
  const rows = trackerSeries(trackerState, testId, field, count);
  const slots = Array.from({ length: count }, (_, index) => {
    const row = rows[index] || null;
    return row ? { ...row, slot: index + 1 } : { slot: index + 1, label: `${index + 1}`, empty: true };
  });
  const maxValue = Math.max(5, ...rows.map((row) => Number(row.value)).filter(Number.isFinite));
  return { slots, maxValue };
}

function trackerSgsOutcomeModel() {
  const latest = trackerLatestSummary();
  const values = [
    { label: "Pre", value: latest.preIq },
    { label: "Post", value: latest.postIq }
  ];
  const maxValue = Math.max(160, ...values.map((item) => Number(item.value)).filter(Number.isFinite));
  return {
    slots: values.map((item, index) => Number.isFinite(item.value)
      ? { slot: index + 1, label: item.label, value: item.value }
      : { slot: index + 1, label: item.label, empty: true }),
    maxValue
  };
}

function renderTrackerLineChart({ title, subtitle, field }) {
  const model = trackerSeriesModel("psi_cbs", field, 10);
  const minValue = 1;
  const maxValue = 5;
  const left = 10;
  const right = 4;
  const top = 5;
  const bottom = 37;
  const plotWidth = 100 - left - right;
  const plotHeight = bottom - top;
  const points = model.slots
    .filter((slot) => !slot.empty && Number.isFinite(Number(slot.value)))
    .map((slot) => {
      const value = clamp(Number(slot.value), minValue, maxValue);
      const x = left + ((Number(slot.slot || 1) - 1) / Math.max(1, model.slots.length - 1)) * plotWidth;
      const y = bottom - ((value - minValue) / (maxValue - minValue)) * plotHeight;
      return { x, y, value, label: slot.label };
    });
  const pathPoints = points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const latest = points.length ? points[points.length - 1].value : null;
  const first = points.length ? points[0].value : null;
  const delta = Number.isFinite(latest) && Number.isFinite(first) ? latest - first : null;
  const deltaLabel = Number.isFinite(delta) ? `${delta >= 0 ? "+" : ""}${formatGraphValue(delta, 1)}` : "--";
  return `
    <section class="stats-graph tracker-line-chart" aria-label="${escapeHtml(title)}">
      <div class="stats-graph-head">
        <div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <strong>${escapeHtml(deltaLabel)}</strong>
      </div>
      <div class="tracker-line-plot">
        <svg viewBox="0 0 100 44" role="img" aria-label="${escapeHtml(`${title} trend over the last 10 scores`)}">
          <line class="tracker-line-axis" x1="${left}" y1="${top}" x2="${left}" y2="${bottom}"></line>
          <line class="tracker-line-axis" x1="${left}" y1="${bottom}" x2="${100 - right}" y2="${bottom}"></line>
          ${[1, 2, 3, 4, 5].map((value) => {
            const y = bottom - ((value - minValue) / (maxValue - minValue)) * plotHeight;
            return `<line class="tracker-line-grid" x1="${left}" y1="${y.toFixed(2)}" x2="${100 - right}" y2="${y.toFixed(2)}"></line>`;
          }).join("")}
          ${model.slots.map((slot) => {
            const x = left + ((Number(slot.slot || 1) - 1) / Math.max(1, model.slots.length - 1)) * plotWidth;
            return `<line class="tracker-line-tick" x1="${x.toFixed(2)}" y1="${bottom}" x2="${x.toFixed(2)}" y2="${(bottom + 2.2).toFixed(2)}"></line>`;
          }).join("")}
          ${pathPoints ? `<polyline class="tracker-line-series" points="${pathPoints}"></polyline>` : ""}
          ${points.map((point) => `<circle class="tracker-line-point" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="1.45"><title>${escapeHtml(`Run ${point.label}: ${formatGraphValue(point.value, 1)}`)}</title></circle>`).join("")}
        </svg>
        ${points.length ? "" : `<span class="tracker-line-empty">No data yet</span>`}
        <div class="tracker-line-labels" aria-hidden="true">
          ${model.slots.map((slot) => `<span>${escapeHtml(slot.label)}</span>`).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderTrackerStatsDashboard() {
  const latest = trackerLatestSummary();
  return `
    <div class="center-stats-dashboard tracker-stats-dashboard">
      <div class="center-stats-head">
        <div>
          <span class="stats-kicker">Assessment tracker</span>
          <h2>Tracker Progress</h2>
        </div>
      </div>
      <div class="center-stats-summary tracker-iq-summary">
        <div class="stat"><span class="mini-label">IQ test pre training</span><strong>${Number.isFinite(latest.preIq) ? latest.preIq : "--"}</strong></div>
        <div class="stat"><span class="mini-label">IQ test post training</span><strong>${Number.isFinite(latest.postIq) ? latest.postIq : "--"}</strong></div>
      </div>
      ${renderTrackerLineChart({
        title: "Psi-CBS Core last 10",
        subtitle: "Higher means stronger applied focus and processing.",
        field: "core"
      })}
      ${renderTrackerLineChart({
        title: "Psi-CBS AD last 10",
        subtitle: "Higher means more dysregulation/load.",
        field: "ad"
      })}
      ${renderTrackerLineChart({
        title: "Psi-CBS AI last 10",
        subtitle: "Higher means better AI multiplier effect.",
        field: "ai"
      })}
    </div>
  `;
}

function renderZonePulseMetric(label, value) {
  return `<div class="stat"><span class="mini-label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderZonePulseResult() {
  const summary = zonePulseState.latestSummary;
  if (!summary) return "";
  const routeState = zoneRouteState(summary.state);
  const contract = currentCoachContract();
  const probe = summary.features?.probe || {};
  const reasons = Array.isArray(summary.reasons) && summary.reasons.length ? summary.reasons : [summary.invalidReason || "Run another clean pulse"];
  return `
    <div class="zone-pulse-result">
      <span class="stats-kicker">Zone Check result</span>
      <h2>${escapeHtml(zoneRouteLabel(routeState))}</h2>
      <p>${escapeHtml(zoneRouteReadyCopy(summary, contract))}</p>
      <div class="zone-pulse-metrics">
        ${renderZonePulseMetric("Bits/sec", formatBitsPerSecond(summary.bitsPerSecond))}
        ${renderZonePulseMetric("Confidence", summary.confidence || "Low")}
        ${renderZonePulseMetric("Probe", Number.isFinite(summary.counts?.probeTrials) ? `${summary.counts.probeTrials}` : "--")}
        ${renderZonePulseMetric("Catch fail", formatMetricPct(summary.features?.catchFailRate))}
        ${renderZonePulseMetric("RT med", Number.isFinite(probe.rtMed) ? `${probe.rtMed}ms` : "--")}
        ${renderZonePulseMetric("RT var", Number.isFinite(probe.rtCV) ? probe.rtCV.toFixed(2) : "--")}
        ${renderZonePulseMetric("Lapse", formatMetricPct(probe.slowLapseRate))}
        ${renderZonePulseMetric("Timeout", formatMetricPct(probe.timeoutRate))}
      </div>
      <div class="zone-pulse-reasons">
        ${reasons.slice(0, 3).map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}
      </div>
    </div>
  `;
}

function renderZonePulseTask() {
  const running = zonePulseIsLive();
  const countdown = zonePulseState.phase === "countdown";
  const showResult = !running && zonePulseState.latestSummary && (zonePulseState.phase === "result" || zonePulseState.phase === "invalid");
  if (showResult) return renderZonePulseResult();
  const countdownValue = COUNTDOWN_STEPS[zonePulseState.countdownStep] || COUNTDOWN_STEPS[0];
  return `
    <div class="zone-pulse-stage${running ? " is-running" : ""}${countdown ? " is-countdown" : ""}">
      <div class="zone-pulse-canvas-wrap">
        <canvas class="zone-pulse-canvas" data-zone-pulse-canvas aria-label="Masked majority arrow task"></canvas>
        ${countdown ? `<div class="capacity-countdown zone-pulse-countdown" aria-live="assertive">${escapeHtml(countdownValue)}</div>` : ""}
      </div>
      ${running ? `
        <div class="zone-pulse-progress">
          <div class="zone-pulse-progress-bar"><span data-zone-pulse-progress-fill style="width:${Math.round(zonePulseState.live.progressPct || 0)}%;"></span></div>
          <div class="zone-pulse-progress-copy">
            <span data-zone-pulse-progress-label>${Math.round(zonePulseState.live.progressPct || 0)}% complete</span>
            <span data-zone-pulse-counts>Trials ${zonePulseState.live.trialCount || 0} | S:${zonePulseState.live.counts?.stair || 0} P:${zonePulseState.live.counts?.probe || 0} C:${zonePulseState.live.counts?.catch || 0}</span>
          </div>
          <p data-zone-pulse-quality>${escapeHtml(zonePulseState.live.qualityText || "Stay on one screen")}</p>
        </div>
      ` : countdown ? `
        <div class="zone-pulse-progress">
          <div class="zone-pulse-progress-bar"><span data-zone-pulse-progress-fill style="width:0%;"></span></div>
          <div class="zone-pulse-progress-copy">
            <span>Starting</span>
            <span>Get ready</span>
          </div>
          <p>${escapeHtml(zonePulseState.live.qualityText || "Starting")}</p>
        </div>
      ` : `
        <div class="coach-callout zone-pulse-tip" role="status" aria-live="polite">
          <span>Coach tip</span>
          <strong>Zone Check / 3 min</strong>
          <p>Choose LEFT or RIGHT based on the direction most arrows point. Wait for the arrows before you decide. Use your best hunch if unclear.</p>
        </div>
      `}
    </div>
  `;
}

function renderZoneCheckPanel() {
  const snapshot = zoneDisplaySnapshot();
  const contract = currentCoachContract();
  const targetRoute = coachTargetsForSnapshot(snapshot);
  const controlsDisabled = activeBlock || activeReasoningBlock || zonePulseIsRunning();
  const routeLabel = snapshot.fresh
    ? `${snapshot.label} / ${targetRoute.routeClass || "check"}`
    : "No fresh Zone pulse";
  return `
    <section class="panel">
      <div class="notice">${escapeHtml(routeLabel)}</div>
      ${renderZoneCheckGraphic(snapshot)}
      <div class="zone-pulse-action-row">
        <div class="zone-pulse-main-actions">
          ${contract
            ? `<button class="btn btn-primary zone-pulse-launch" type="button" data-action="toggle-zone-help" ${controlsDisabled ? "disabled" : ""}>Trident G Zones Info</button>`
            : `<button class="btn btn-primary zone-pulse-launch" type="button" data-action="show-zone-pulse" ${controlsDisabled ? "disabled" : ""}>Test your zone</button>`}
          ${!contract && state.settings.mode === "coach" ? `<button class="btn btn-ghost zone-pulse-launch" type="button" data-action="skip-zone-pulse" ${controlsDisabled ? "disabled" : ""}>Skip zone pulse</button>` : ""}
        </div>
        <button class="zone-pulse-help-btn" type="button" data-action="toggle-zone-help" aria-label="Open Zone Check help" title="Open Zone Check help">
          <img src="${ZONE_HELP_ICON_URL}" alt="" aria-hidden="true">
        </button>
      </div>
    </section>
  `;
}

function renderZoneCheckGraphic(snapshot) {
  const activeZone = snapshot?.fresh && snapshot.routeState !== "invalid" ? snapshot.routeState : null;
  const label = activeZone ? `${snapshot.label} route highlighted` : "No recent Zone Check designation highlighted";
  const activeClass = (zone) => activeZone === zone ? " is-active" : "";
  return `
    <div class="zone-trident-graphic" role="img" aria-label="${escapeHtml(label)}">
      <svg viewBox="0 0 360 210" focusable="false" aria-hidden="true">
        <path class="zone-trident-line" d="M18 105H110" />
        <path class="zone-trident-line" d="M150 105H302" />
        <polygon class="zone-trident-arrow" points="302,80 354,105 302,130" />
        <path class="zone-trident-line" d="M150 105L194 50H286" />
        <polygon class="zone-trident-arrow" points="286,25 338,50 286,75" />
        <path class="zone-trident-line" d="M150 105L194 160H286" />
        <polygon class="zone-trident-arrow" points="286,135 338,160 286,185" />
        <g class="zone-trident-node-group${activeClass("flat")}">
          <circle class="zone-trident-node" cx="104" cy="105" r="23" />
          <circle class="zone-trident-node-hole" cx="104" cy="105" r="9" />
        </g>
        <g class="zone-trident-node-group${activeClass("in_zone")}">
          <circle class="zone-trident-node" cx="152" cy="105" r="23" />
          <circle class="zone-trident-node-hole" cx="152" cy="105" r="9" />
        </g>
        <g class="zone-trident-node-group${activeClass("overloaded_exploit")}">
          <circle class="zone-trident-node" cx="220" cy="50" r="23" />
          <circle class="zone-trident-node-hole" cx="220" cy="50" r="9" />
        </g>
        <g class="zone-trident-node-group${activeClass("overloaded_explore")}">
          <circle class="zone-trident-node" cx="220" cy="160" r="23" />
          <circle class="zone-trident-node-hole" cx="220" cy="160" r="9" />
        </g>
      </svg>
    </div>
  `;
}

function renderModePanel() {
  return `
    <section class="panel training-panel">
      <div class="training-title-row">
        <h2 class="strip-title training-title">Capacity Training</h2>
        <a class="training-help-link" href="${TRAINING_HELP_VIDEO_URL}" target="_blank" rel="noopener noreferrer" aria-label="Open Capacity Training help video" title="Open Capacity Training help video">
          <img src="${TRAINING_HELP_ICON_URL}" alt="" aria-hidden="true">
        </a>
      </div>
      <p class="small muted training-prompt">SELECT COACH LED OR MANUAL</p>
      <div class="mode-select-row">
        <div class="mode-toggle" role="group" aria-label="Training mode">
          <button class="chip-btn${state.settings.mode === "coach" ? " is-active" : ""}" type="button" data-action="set-mode" data-mode="coach">Coach-led</button>
          <button class="chip-btn${state.settings.mode === "manual" ? " is-active" : ""}" type="button" data-action="set-mode" data-mode="manual">Manual</button>
        </div>
        <button class="mode-help-btn" type="button" data-action="toggle-mode-help" aria-label="Open training mode help" title="Open training mode help">
          <img src="${MODE_HELP_ICON_URL}" alt="" aria-hidden="true">
        </button>
      </div>
    </section>
  `;
}

function renderModeHelpModal() {
  if (!viewState.modeHelpOpen) return "";
  return `
    <div class="mode-help-backdrop" data-action="close-mode-help">
      <section class="mode-help-dialog" role="dialog" aria-modal="true" aria-labelledby="modeHelpTitle" data-dialog-panel>
        <button class="mode-help-close" type="button" data-action="close-mode-help" aria-label="Close training mode help">x</button>
        <span class="mode-help-kicker">Training mode help</span>
        <h2 id="modeHelpTitle">Coach-led or manual</h2>
        <div class="mode-help-section">
          <h3>Coach-led</h3>
          <p>Enter the guided mission route. The Trident G Far Transfer (H) Protocol chooses your next arena, target, pace, and N-back level from your recent accuracy, stability, and transfer score, keeping each block calibrated for progression.</p>
        </div>
        <div class="mode-help-section">
          <h3>Manual</h3>
          <p>Free-play mode. Choose your game from the menu, set your pace, and pick your N-back loadout. Auto N-back levels up or down from performance, or you can lock a fixed N-back for focused practice.</p>
        </div>
      </section>
    </div>
  `;
}

function renderZoneHelpModal() {
  if (!viewState.zoneHelpOpen) return "";
  return `
    <div class="mode-help-backdrop zone-help-backdrop" data-action="close-zone-help">
      <section class="mode-help-dialog zone-help-dialog" role="dialog" aria-modal="true" aria-labelledby="zoneHelpTitle" data-dialog-panel>
        <button class="mode-help-close zone-help-close" type="button" data-action="close-zone-help" aria-label="Close Zone Check help">x</button>
        <span class="mode-help-kicker zone-help-kicker">Zone pulse help</span>
        <h2 id="zoneHelpTitle">3-minute control scan</h2>
        <div class="mode-help-section zone-help-section">
          <h3>Bits/sec</h3>
          <p>The pulse estimates how many bits per second your mental workspace can process under masked pressure.</p>
        </div>
        <div class="mode-help-section zone-help-section">
          <h3>Zone route</h3>
          <p>It assigns your current route: Flat, In Zone, Spun Out, or Locked In. Being In Zone helps training transfer beyond the game into real cognitive capacity.</p>
        </div>
        <div class="mode-help-section zone-help-section">
          <h3>Trident graphic</h3>
          <p>The centre path is In Zone. The left node is Flat, so the coach gives a reduced core route. The upper branch is Locked In, so the coach gives lower-demand reset/control work. The lower branch is Spun Out, so the coach gives stabilising work before heavier training.</p>
        </div>
        <div class="mode-help-section zone-help-section">
          <h3>Training signal</h3>
          <p>Evidence from this task family says it can help train selective attention, verbal learning, working memory, and flexibility.</p>
        </div>
      </section>
    </div>
  `;
}

function trackerHelpContentFor(test) {
  if (test?.id === "psi_cbs") {
    return {
      title: "Psi-Band Cognitive Bandwidth Scale (Psi-CBS)",
      html: `
        <p><strong>What it is:</strong> A brief self-report measure for tracking everyday cognitive performance over the past two weeks.</p>
        <section class="mode-help-section tracker-help-section">
          <h3>What the sections measure</h3>
          <p><strong>Psi-CBS Core - Applied General Intelligence (G):</strong> Focus stability, error resistance, active processing, and learning/transfer in everyday work/study/project contexts.</p>
          <p><strong>Psi-CBS-AD - Cognitive Health &amp; Resilience:</strong> Supplementary items tracking allostatic dysregulation / state-instability patterns.</p>
          <p><strong>Psi-CBS-AI - AI-Use Intelligence:</strong> Supplementary items tracking how AI tool use helps or hinders cognitive performance and workflow quality.</p>
        </section>
        <section class="mode-help-section tracker-help-section">
          <h3>How it works</h3>
          <p>Responses use a 5-point frequency scale (Never to Very often).</p>
          <p>The Core score is summarised from focus and processing subscales.</p>
          <p>Some Core items are reverse-scored internally to maintain correct score direction.</p>
          <p>Optional AD and AI sections provide additional pattern information rather than a diagnosis.</p>
        </section>
        <section class="mode-help-section tracker-help-section">
          <h3>Current validation status</h3>
          <p>Pilot evidence supports the intended structure and internal consistency of Psi-CBS, but current evidence is still limited (including smaller samples). Treat it as a practical tracking tool while further validation studies are ongoing.</p>
        </section>
        <section class="mode-help-section tracker-help-section">
          <h3>Intended use</h3>
          <p>Self-tracking and product/research use.</p>
          <p>Tracking change over time, especially with consistent testing conditions.</p>
          <p>Not a clinical or diagnostic assessment.</p>
        </section>
      `
    };
  }
  return {
    title: "Short g Scale (SgS-12)",
    html: `
      <p><strong>What it is:</strong> A brief reasoning check that looks at how well you solve unfamiliar problems using patterns and simple rules.</p>
      <section class="mode-help-section tracker-help-section">
        <h3>What it measures</h3>
        <p>SgS-12 is designed to capture fluid reasoning. That is your ability to spot patterns, infer rules, and work things out when you have not seen the problem before.</p>
      </section>
      <section class="mode-help-section tracker-help-section">
        <h3>How it works</h3>
        <p>You answer 12 multiple-choice questions. Items include things like pattern matrices, letter-number sequences, mental rotation, and a few short verbal reasoning questions. There are two versions (Form A and Form B) so you can repeat it later without seeing the exact same items.</p>
      </section>
      <section class="mode-help-section tracker-help-section">
        <h3>Taking the test</h3>
        <p>There is no time limit, so it is about careful thinking rather than rushing. Most people finish in just a few minutes, but you can take a little longer if you need to.</p>
      </section>
      <section class="mode-help-section tracker-help-section">
        <h3>Current validation status</h3>
        <p>SgS-12 is built from public-domain items drawn from the International Cognitive Ability Resource (ICAR) test bank - specifically ICAR Matrix Reasoning items, plus the same ICAR family of Verbal Reasoning and Letter-Number Series item types, alongside ICAR's Three-Dimensional Rotation (R3D) items. These ICAR/R3D item sets have published psychometrics and large-sample norms, so the questions are not home-made puzzles but established item types with known difficulty and reliability characteristics. Because SgS-12 uses only 12 items, it is best treated as a practical reasoning snapshot and for tracking change over time, rather than as a definitive IQ test.</p>
      </section>
      <section class="mode-help-section tracker-help-section">
        <h3>Intended use</h3>
        <p><strong>Good for:</strong> self-tracking, baseline vs follow-up measurement in Trident G - IQ training, and product/research use.</p>
        <p><strong>Not for:</strong> clinical diagnosis or high-stakes decisions.</p>
      </section>
    `
  };
}

function renderTrackerHelpModal() {
  if (!viewState.trackerHelpOpen) return "";
  const help = trackerHelpContentFor(trackerSelectedTest());
  return `
    <div class="mode-help-backdrop tracker-help-backdrop" data-action="close-tracker-help">
      <section class="mode-help-dialog tracker-help-dialog" role="dialog" aria-modal="true" aria-labelledby="trackerHelpTitle" data-dialog-panel>
        <button class="mode-help-close tracker-help-close" type="button" data-action="close-tracker-help" aria-label="Close Tracker help">x</button>
        <span class="mode-help-kicker tracker-help-kicker">Tracker info</span>
        <h2 id="trackerHelpTitle">${escapeHtml(help.title)}</h2>
        <div class="tracker-help-copy">
          ${help.html}
        </div>
      </section>
    </div>
  `;
}

function renderAppHelpModal() {
  if (!viewState.appHelpOpen) return "";
  return `
    <div class="mode-help-backdrop app-help-backdrop" data-action="close-app-help">
      <section class="mode-help-dialog app-help-dialog" role="dialog" aria-modal="true" aria-labelledby="appHelpTitle" data-dialog-panel>
        <button class="mode-help-close app-help-close" type="button" data-action="close-app-help" aria-label="Close app help">x</button>
        <span class="mode-help-kicker app-help-kicker">Trident G IQ - Pro Help</span>
        <h2 id="appHelpTitle">How The Programme Works</h2>
        <div class="app-help-copy">
          <section class="mode-help-section app-help-section">
            <h3>1. Coach-led programme</h3>
            <p>Trident G IQ - Pro is built around a Coach-led training programme designed to improve general intelligence through a far-transfer protocol. The coach chooses the next training route for you, sets the workload, and guides you across Capacity Gym, Reasoning Gym, and Tracker.</p>
            <p>The programme uses two kinds of progression.</p>
            <p><strong>Horizontal transfer</strong> means practising the same underlying mental skill across different surface forms. For example, the app may train the same working-memory control demand with letters, locations, objects, relations, real-world meanings, and nonsense meanings. The goal is to stop the skill being tied to one familiar game format.</p>
            <p><strong>Vertical transfer</strong> means gradually increasing the level of reasoning demand. The coach moves from easier recognition and control tasks toward deeper relational binding, rule use, inference, and fluid reasoning challenges.</p>
            <p>Together, the horizontal and vertical protocol is intended to make training less like memorising one game and more like building flexible thinking capacity.</p>
          </section>
          <section class="mode-help-section app-help-section">
            <h3>2. The 20-day training structure</h3>
            <p>The Coach-led programme is organised as a 20-day training pathway. The programme starts and ends with short cognitive tests in the Tracker so you can compare baseline and post-training scores.</p>
            <p>Use the pre-training SgS-12 test before the programme begins. Use the post-training SgS-12 test after completing the programme. The Tracker also includes Psi-CBS scales for tracking everyday cognitive performance, resilience, and AI-use effects over time. It is recommended to take Psi-CBS every 5 sessions so you can see gains and state changes across the programme.</p>
          </section>
          <section class="mode-help-section app-help-section">
            <h3>3. Zone Pulse before training</h3>
            <p>Before each day's training, it is recommended to complete the 3-minute Zone Pulse task. This task is the Majority Function Task.</p>
            <p>In each trial, you respond to the direction most arrows are pointing. The task estimates your cognitive control capacity in bits per second. This gives the coach an objective signal about whether today should be a full training day, a reduced route, or a lighter stabilising session.</p>
            <p>There is evidence that this kind of cognitive control task can itself act as brain training. In Trident G IQ - Pro, it also helps set the right training dose for the day.</p>
            <p>You can skip Zone Pulse if needed, but the best Coach-led experience comes from taking it regularly.</p>
          </section>
          <section class="mode-help-section app-help-section">
            <h3>4. Capacity Gym</h3>
            <p>Capacity Gym trains the run-time efficiency of thinking. It uses N-back tasks, including novel relational N-back tasks, to train working memory, attention control, binding, and flexible updating.</p>
            <p>The key idea is that reasoning depends not only on knowing rules, but on holding the right information active while ignoring what does not matter. Capacity Gym trains that mental workspace under controlled pressure.</p>
            <p>As you improve, the coach can adjust N-back level, speed, wrapper type, and task family.</p>
          </section>
          <section class="mode-help-section app-help-section">
            <h3>5. Reasoning Gym</h3>
            <p>Reasoning Gym trains inference and fluid reasoning more directly. It uses tasks such as relation matching, constraint solving, and must-follow reasoning.</p>
            <p>Capacity Gym prepares the run-time control system. Reasoning Gym then asks you to use that control for rule-based thinking, slot resolution, and logical inference.</p>
            <p>The coach alternates real-world and nonsense forms so the skill is not dependent on familiar meanings alone.</p>
          </section>
          <section class="mode-help-section app-help-section">
            <h3>6. Tracker</h3>
            <p>Tracker is where you collect evidence of progress.</p>
            <ul>
              <li><strong>SgS-12 Pre</strong> is for a baseline fluid reasoning snapshot before training.</li>
              <li><strong>SgS-12 Post</strong> is for a follow-up snapshot after training.</li>
              <li><strong>Psi-CBS</strong> is recommended every 5 sessions to track applied cognition, resilience/load, and AI-use effects over time.</li>
            </ul>
            <p>Tracker scores do not award training credit and do not change the coach route. They are there to measure progress.</p>
          </section>
          <section class="mode-help-section app-help-section">
            <h3>7. Manual mode</h3>
            <p>Manual mode lets you explore the games yourself. You can choose any available Capacity or Reasoning game, adjust difficulty or speed where available, and experiment with training according to your own preference.</p>
            <p>Manual mode is useful for review, practice, and curiosity. Coach-led mode is recommended when you want the structured 20-day far-transfer programme.</p>
          </section>
          <section class="mode-help-section app-help-section">
            <h3>Best use</h3>
            <p>Take the pre-training Tracker test, train in Coach-led mode, use Zone Pulse before each daily session when possible, complete both Capacity and Reasoning targets, take Psi-CBS every 5 sessions, and take the post-training Tracker test at the end.</p>
          </section>
        </div>
      </section>
    </div>
  `;
}

function renderPrivacyHelpModal() {
  if (!viewState.privacyHelpOpen) return "";
  return `
    <div class="mode-help-backdrop privacy-help-backdrop" data-action="close-privacy-help">
      <section class="mode-help-dialog privacy-help-dialog" role="dialog" aria-modal="true" aria-labelledby="privacyHelpTitle" data-dialog-panel>
        <button class="mode-help-close privacy-help-close" type="button" data-action="close-privacy-help" aria-label="Close privacy help">x</button>
        <span class="mode-help-kicker privacy-help-kicker">Privacy</span>
        <h2 id="privacyHelpTitle">Your Data Stays Local</h2>
        <div class="privacy-help-copy">
          <section class="mode-help-section privacy-help-section">
            <h3>Local storage</h3>
            <p>Trident G IQ - Pro stores your training scores, Tracker results, settings, and progress locally in this browser on this device. The app does not need an account or server upload for these scores to work.</p>
          </section>
          <section class="mode-help-section privacy-help-section">
            <h3>Protection</h3>
            <p>Your data is protected by keeping it on your own device rather than sending it to a central database. Anyone with access to this browser profile may still be able to see local progress, so use your normal device security and browser profile controls.</p>
          </section>
          <section class="mode-help-section privacy-help-section">
            <h3>Compliance</h3>
            <p>The app is designed to support GDPR-aligned and ethically responsible use: data minimisation, local control, clear purpose, and no hidden scoring upload from this app interface.</p>
            <p>Clearing browser storage or using another device/browser may remove or hide local progress data.</p>
          </section>
        </div>
      </section>
    </div>
  `;
}

function renderManualPanel() {
  const wrapper = state.settings.wrapper;
  return `
    <section class="panel">
      <h3>Manual suite</h3>
      <div class="control-grid">
        <div class="field">
          <label for="wrapperSelect">Game type</label>
          <select id="wrapperSelect" data-field="wrapper" ${activeBlock ? "disabled" : ""}>
            ${Object.keys(WRAPPER_META).map((key) => `<option value="${key}" ${key === wrapper ? "selected" : ""}>${escapeHtml(wrapperLabel(key))}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="nSelect">N-back</label>
          <select id="nSelect" data-field="n" ${activeBlock ? "disabled" : ""}>
            <option value="auto" ${state.settings.n === "auto" ? "selected" : ""}>Auto</option>
            ${Array.from({ length: HUB_N_MAX }, (_, index) => index + 1).map((n) => `<option value="${n}" ${n === state.settings.n ? "selected" : ""}>${n}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="speedSelect">Speed</label>
          <select id="speedSelect" data-field="speed" ${activeBlock ? "disabled" : ""}>
            <option value="slow" ${state.settings.speed === "slow" ? "selected" : ""}>Slow</option>
            <option value="fast" ${state.settings.speed === "fast" ? "selected" : ""}>Fast</option>
          </select>
        </div>
      </div>
    </section>
  `;
}

function renderCoachCycle() {
  const next = currentCoachFamilyNumber();
  return `
    <section class="panel">
      <h3>Coach cycle</h3>
      <p class="small muted coach-cycle-subtitle">20 sessions total</p>
      <div class="cycle-list">
        ${COACH_FAMILY_CYCLE.map((familyId, index) => {
          const sessionNo = completedUnifiedCoreSessions() + index + 1;
          return `
            <div class="cycle-item${index === 0 ? " is-current" : ""}">
              <span>${sessionNo}. ${escapeHtml(familyLabel(familyId))}</span>
              <strong>${familyId === "relate" ? "Relation" : "Core"}</strong>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function reasoningManualDifficultyOptions(familyId, subtype) {
  if (familyId === "relation_fit") {
    return subtype === "resolve_slots" ? [4, 5] : [1, 2, 3];
  }
  if (familyId === "must_follow") {
    return subtype === "select_forced" ? [4, 5] : [1, 2, 3];
  }
  return [1, 2, 3, 4, 5];
}

function normalizeReasoningManualDifficulty(value, familyId, subtype) {
  const options = reasoningManualDifficultyOptions(familyId, subtype);
  const tier = value === "auto" ? options[0] : clamp(Math.round(Number(value || options[0])), options[0], options[options.length - 1]);
  if (options.includes(tier)) return tier;
  return options.reduce((best, option) => Math.abs(option - tier) < Math.abs(best - tier) ? option : best, options[0]);
}

function normalizeReasoningManualSettings(settings) {
  const family = REASONING_FAMILIES[settings.family] ? settings.family : "relation_fit";
  const familyMeta = REASONING_FAMILIES[family] || REASONING_FAMILIES.relation_fit;
  const subtype = settings.subtype !== "auto" && familyMeta.subtypes[settings.subtype]
    ? settings.subtype
    : familyMeta.defaultSubtype;
  return {
    ...settings,
    family,
    subtype,
    tier: normalizeReasoningManualDifficulty(settings.tier, family, subtype)
  };
}

function renderReasoningTrainingPanel() {
  const settings = reasoningState.settings;
  const familyKeys = Object.keys(REASONING_FAMILIES);
  const familyMeta = REASONING_FAMILIES[settings.family] || REASONING_FAMILIES.relation_fit;
  const subtypeEntries = Object.entries(familyMeta.subtypes).filter(([value]) => value !== "auto");
  const selectedSubtype = settings.subtype !== "auto" && familyMeta.subtypes[settings.subtype]
    ? settings.subtype
    : familyMeta.defaultSubtype;
  const difficultyOptions = reasoningManualDifficultyOptions(settings.family, selectedSubtype);
  const selectedDifficulty = normalizeReasoningManualDifficulty(settings.tier, settings.family, selectedSubtype);
  const settingsLocked = anyGameplayActive() || viewState.reasoningBusy;
  const settingsLockAttr = settingsLocked ? "disabled" : "";
  return `
    <section class="panel reasoning-training-panel">
      <div class="training-title-row">
        <h2 class="strip-title training-title">Reasoning Training</h2>
      </div>
      <p class="small muted training-prompt">SELECT COACH LED OR MANUAL</p>
      <div class="mode-help-layout">
        <div class="mode-buttons">
          <button class="chip-btn${settings.mode === "coach" ? " is-active" : ""}" type="button" data-action="set-reasoning-mode" data-mode="coach" ${settingsLockAttr}>Coach-led</button>
          <button class="chip-btn${settings.mode === "manual" ? " is-active" : ""}" type="button" data-action="set-reasoning-mode" data-mode="manual" ${settingsLockAttr}>Manual</button>
        </div>
      </div>
      ${settings.mode === "manual" ? `
        <div class="manual-suite reasoning-suite${settingsLocked ? " is-locked" : ""}">
          <div class="field">
            <label>Family</label>
            <select data-reasoning-field="family" ${settingsLockAttr}>
              ${familyKeys.map((familyId) => `<option value="${familyId}" ${settings.family === familyId ? "selected" : ""}>${escapeHtml(REASONING_FAMILIES[familyId].label)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Subgame</label>
            <select data-reasoning-field="subtype" ${settingsLockAttr}>
              ${subtypeEntries.map(([value, label]) => `<option value="${value}" ${selectedSubtype === value ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Speed</label>
            <select data-reasoning-field="speed" ${settingsLockAttr}>
              ${["untimed", "normal", "fast"].map((value) => `<option value="${value}" ${settings.speed === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Difficulty</label>
            <select data-reasoning-field="tier" ${settingsLockAttr}>
              ${difficultyOptions.map((tier) => `<option value="${tier}" ${selectedDifficulty === tier ? "selected" : ""}>${tier}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label>Items</label>
            <select data-reasoning-field="itemsPerBlock" ${settingsLockAttr}>
              ${REASONING_MANUAL_ITEM_OPTIONS.map((count) => `<option value="${count}" ${settings.itemsPerBlock === count ? "selected" : ""}>${count}</option>`).join("")}
            </select>
          </div>
        </div>
      ` : ""}
    </section>
  `;
}

function renderReasoningLeftStrip() {
  return `
    <aside class="strip strip-left" aria-label="Reasoning coach and setup strip">
      <div class="strip-inner">
        <div class="strip-head">
          <button class="sheet-close" type="button" data-action="close-sheets" aria-label="Close sheet">x</button>
          <div>
            <h2 class="strip-title">Zone Check</h2>
          </div>
        </div>
        ${renderZoneCheckPanel()}
        ${renderReasoningTrainingPanel()}
        ${renderLiveCoachingLink()}
      </div>
    </aside>
  `;
}

function renderReasoningOptionButton(item, option) {
  const selected = activeReasoningBlock?.selectedIds?.includes(option.id);
  const isFeedback = activeReasoningBlock?.status === "feedback";
  const outcome = activeReasoningBlock?.lastOutcome;
  const correct = isFeedback && outcome?.correct?.includes(option.id);
  const wrong = isFeedback && outcome?.selected?.includes(option.id) && !correct;
  return `
    <button class="reasoning-option${selected ? " is-selected" : ""}${correct ? " is-correct" : ""}${wrong ? " is-wrong" : ""}" type="button" data-action="reasoning-option" data-option="${escapeHtml(option.id)}" ${isFeedback ? "disabled" : ""}>
      <span>${escapeHtml(option.id)}</span>
      <strong>${escapeHtml(option.text)}</strong>
    </button>
  `;
}

function renderReasoningItemCard() {
  const item = currentReasoningItem();
  if (!item || !activeReasoningBlock) return "";
  const outcome = activeReasoningBlock.lastOutcome;
  const feedback = activeReasoningBlock.status === "feedback";
  const ruleText = item.rule_text || item.display_rule || "";
  const premises = Array.isArray(item.display_premises) ? item.display_premises : (item.premises || []);
  const prompt = item.prompt_text || item.query || "Choose the best answer.";
  const hint = item.hint_text || item.helper_text || "";
  const feedbackStatus = outcome?.isCorrect ? "Correct" : "Incorrect";
  return `
    <div class="reasoning-item-card">
      ${ruleText ? `<div class="reasoning-rule-card">
        ${ruleText ? `<strong>${escapeHtml(ruleText)}</strong>` : ""}
      </div>` : ""}
      ${premises.length ? `<div class="reasoning-premises">
        ${premises.map((premise) => `<p>${escapeHtml(premise)}</p>`).join("")}
      </div>` : ""}
      <div class="reasoning-query">${escapeHtml(prompt)}</div>
      ${hint ? `<div class="reasoning-hint">${escapeHtml(hint)}</div>` : ""}
      <div class="reasoning-options${item.answer_type === "true_false" ? " is-binary" : ""}">
        ${(item.options || []).map((option) => renderReasoningOptionButton(item, option)).join("")}
      </div>
      ${activeReasoningBlock.status === "question" ? `
        <button class="btn btn-primary reasoning-submit" type="button" data-action="reasoning-submit">Submit Answer</button>
      ` : ""}
      ${feedback ? `
        <div class="reasoning-feedback-tip ${outcome?.isCorrect ? "is-correct" : "is-incorrect"}" role="status" aria-live="polite">
          <strong>${escapeHtml(feedbackStatus)}</strong>
        </div>
      ` : ""}
    </div>
  `;
}

function renderReasoningBlockSummary() {
  const summary = activeReasoningBlock?.summary;
  if (!summary) return "";
  return `
    <div class="reasoning-summary-card">
      <span class="stats-kicker">Reasoning block result</span>
      <h2>${escapeHtml(reasoningFamilyLabel(summary.family))}</h2>
      <div class="zone-pulse-metrics">
        ${renderZonePulseMetric("Accuracy", percent(summary.accuracy))}
        ${renderZonePulseMetric("Decision", summary.decision)}
        ${renderZonePulseMetric("Transfer", formatScorePercent(summary.transferScore.total))}
        ${renderZonePulseMetric("Tier", String(summary.tier))}
        ${renderZonePulseMetric("Wrapper", summary.wrapper.replace("_", " "))}
        ${renderZonePulseMetric("Timeouts", String(summary.timeouts))}
      </div>
      <button class="btn btn-primary" type="button" data-action="clear-reasoning-summary">Continue</button>
    </div>
  `;
}

function renderReasoningTacticCapture() {
  const session = viewState.reasoningCloseSession;
  if (!session) return "";
  return `
    <div class="reasoning-summary-card reasoning-capture-card">
      <span class="stats-kicker">Session close</span>
      <h2>${escapeHtml(reasoningFamilyLabel(session.family))} tactic capture</h2>
      <div class="reasoning-capture-grid">
        <label>Tactic used<input data-reasoning-capture="tacticUsed" maxlength="90" placeholder="Name the move you used"></label>
        <label>Quick trap to avoid<input data-reasoning-capture="trapToAvoid" maxlength="90" placeholder="What nearly fooled you?"></label>
        <label>One-line takeaway<input data-reasoning-capture="takeaway" maxlength="110" placeholder="Keep it sharp and portable"></label>
        <label class="reasoning-check"><input type="checkbox" data-reasoning-capture="reusable"> Save as reusable tactic</label>
      </div>
      <button class="btn btn-primary" type="button" data-action="save-reasoning-capture">Save close</button>
    </div>
  `;
}

function renderReasoningIntro() {
  const session = reasoningState.currentSession;
  const rec = reasoningZoneRecommendation();
  const contract = currentCoachContract();
  if (contract && capacityRemainingForContract(contract) > 0 && reasoningRemainingForContract(contract) > 0) {
    return `
      <div class="coach-callout reasoning-coach-tip" role="status" aria-live="polite">
        <span>Coach tip</span>
        <strong>Do Capacity Gym first</strong>
        <p>${escapeHtml(`You still have ${capacityRemainingForContract(contract)} Capacity block${capacityRemainingForContract(contract) === 1 ? "" : "s"} before the Reasoning part of this session.`)}</p>
      </div>
    `;
  }
  if (contract && capacityRemainingForContract(contract) <= 0 && reasoningRemainingForContract(contract) > 0) {
    return `
      <div class="coach-callout reasoning-coach-tip" role="status" aria-live="polite">
        <span>Coach tip</span>
        <strong>Reasoning is next</strong>
        <p>${escapeHtml(`Capacity is complete. Finish ${reasoningRemainingForContract(contract)} reasoning item${reasoningRemainingForContract(contract) === 1 ? "" : "s"} to complete the session.`)}</p>
      </div>
    `;
  }
  if (coachState.lastCompleted?.status === "complete") {
    return `
      <div class="coach-callout reasoning-coach-tip" role="status" aria-live="polite">
        <span>Coach tip</span>
        <strong>Session complete</strong>
        <p>Good work. Your Capacity and Reasoning targets are complete. Next session starts with a fresh Zone Check.</p>
      </div>
    `;
  }
  const family = session?.family || (reasoningState.settings.mode === "coach" ? reasoningFamilyForCoreSession(completedUnifiedCoreSessions() + 1) : reasoningState.settings.family);
  const title = rec.recommended
    ? "Test your zone / 3 min"
    : session
      ? `Next block / ${reasoningFamilyLabel(family)}`
      : reasoningState.settings.mode === "coach"
        ? `${reasoningFamilyLabel(family)} route ready`
        : "Manual reasoning ready";
  const body = rec.recommended
    ? rec.copy
    : "Read the signal, lock the rule, and carry the tactic forward.";
  return `
    <div class="coach-callout reasoning-coach-tip" role="status" aria-live="polite">
      <span>Coach tip</span>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(body)}</p>
    </div>
  `;
}

function renderReasoningArena() {
  if (viewState.reasoningCloseSession) return renderReasoningTacticCapture();
  if (activeReasoningBlock?.status === "summary") return renderReasoningBlockSummary();
  if (activeReasoningBlock) return renderReasoningItemCard();
  return `<div class="arena-placeholder" aria-hidden="true"></div>`;
}

function renderReasoningCoachSlot() {
  if (viewState.centerMode === "stats" || viewState.centerMode === "zone") return "";
  if (viewState.reasoningCloseSession || activeReasoningBlock) return "";
  return renderReasoningIntro();
}

function reasoningFamilyChipLabel(familyId) {
  if (familyId === "relation_fit") return "Rel Fit";
  if (familyId === "must_follow") return "Follow";
  return reasoningFamilyLabel(familyId);
}

function renderIqMindwareFooter() {
  return `
    <div class="iqmindware-footer">
      <a class="iqmindware-strip-link" href="https://iqmindware.com/" target="_blank" rel="noopener noreferrer" aria-label="Open IQMindware website">
        <img src="${IQMINDWARE_LOGO_URL}" alt="" loading="lazy">
        <span>IQMindware.com</span>
      </a>
      <button class="iqmindware-privacy-link" type="button" data-action="toggle-privacy-help">Privacy</button>
    </div>
  `;
}

function currentTrackerQuestion() {
  if (!activeTrackerSession || activeTrackerSession.status !== "question") return null;
  if (activeTrackerSession.type === "sgs") {
    const manifest = trackerManifestFor(activeTrackerSession.testId);
    return manifest.items[activeTrackerSession.index] || null;
  }
  const questions = psiQuestionList({ includeAi: true, sections: activeTrackerSession.selectedPsiSections });
  return questions[activeTrackerSession.index] || null;
}

function trackerPsiQuestionList() {
  return psiQuestionList({ includeAi: true, sections: activeTrackerSession?.selectedPsiSections || { core: true } });
}

function trackerSelectedPsiCount() {
  return Object.values(activeTrackerSession?.selectedPsiSections || {}).filter(Boolean).length;
}

function renderLiveCoachingLink() {
  return `
    <a class="live-coaching-link" href="https://www.iqmindware.com/coaching/" target="_blank" rel="noopener noreferrer">
      Book live coaching
    </a>
  `;
}

function renderTrackerLeftStrip() {
  const selected = trackerSelectedTest();
  const disabled = trackerTestIsActive() ? "disabled" : "";
  return `
    <aside class="strip strip-left tracker-left-strip" aria-label="Tracker setup strip">
      <div class="strip-inner">
        <div class="strip-head">
          <div>
            <h2 class="strip-title">Tracker</h2>
            <p class="tracker-strip-guide">Choose a short validated test as evidence for your training gains. The Psi-CBS can be taken each week to track progress.</p>
          </div>
          <button class="sheet-close" type="button" data-action="close-sheets" aria-label="Close sheet">x</button>
        </div>
        <section class="panel tracker-panel">
          <label class="mini-label" for="trackerTestSelect">Test</label>
          <select id="trackerTestSelect" data-tracker-field="selectedTest" ${disabled}>
            ${TRACKER_TESTS.map((test) => `<option value="${test.id}" ${selected.id === test.id ? "selected" : ""}>${escapeHtml(test.label)}</option>`).join("")}
          </select>
          <div class="tracker-test-note">
            <strong>${escapeHtml(selected.shortLabel)}</strong>
            <p>${escapeHtml(selected.note)}</p>
            <span>${escapeHtml(`${selected.estimateMinutes} min estimate`)}</span>
          </div>
          <button class="btn btn-primary tracker-start-btn" type="button" data-action="start-tracker-test" ${disabled}>Start test</button>
        </section>
        ${renderLiveCoachingLink()}
      </div>
    </aside>
  `;
}

function renderTrackerIntro() {
  const selected = trackerSelectedTest();
  const helpLabel = selected.id === "psi_cbs" ? "Open Psi-CBS help" : "Open SgS-12 help";
  const helpButton = selected.type === "sgs" || selected.id === "psi_cbs"
    ? `<button class="tracker-help-btn" type="button" data-action="toggle-tracker-help" aria-label="${helpLabel}" title="${helpLabel}">
        <img src="${TRACKER_HELP_ICON_URL}" alt="" aria-hidden="true">
      </button>`
    : "";
  return `
    <div class="tracker-intro-card">
      ${helpButton}
      <span class="stats-kicker tracker-intro-kicker">Training evidence</span>
      <h2>${escapeHtml(selected.label)}</h2>
      <p>${escapeHtml(selected.note)}</p>
      <div class="tracker-intro-grid">
        <div class="stat"><span class="mini-label">Time</span><strong>${escapeHtml(String(selected.estimateMinutes))}m</strong></div>
        <div class="stat"><span class="mini-label">Mode</span><strong>${selected.type === "sgs" ? "IQ" : "Psi"}</strong></div>
        <div class="stat"><span class="mini-label">Records</span><strong>${trackerState.entries.filter((entry) => entry.testId === selected.id).length}</strong></div>
      </div>
    </div>
  `;
}

function renderTrackerSgsQuestion() {
  const manifest = trackerManifestFor(activeTrackerSession.testId);
  const item = currentTrackerQuestion();
  const index = Number(activeTrackerSession.index || 0);
  if (!item) return "";
  return `
    <div class="tracker-question-card tracker-sgs-card is-${escapeHtml(item.kind || "item")}">
      <div class="tracker-question-head">
        <span class="stats-kicker">${escapeHtml(activeTrackerSession.label)}</span>
        <strong>${index + 1}/${manifest.items.length}</strong>
      </div>
      <h2>${escapeHtml(item.prompt)}</h2>
      ${item.stemImageUrl ? `<div class="tracker-stem-frame"><img src="${escapeHtml(item.stemImageUrl)}" alt="Reasoning item ${escapeHtml(item.id)}" loading="eager" decoding="async" fetchpriority="high"></div>` : ""}
      <div class="tracker-option-grid">
        ${(item.responseOptions || []).map((option, optionIndex) => `
          <button class="tracker-option-btn" type="button" data-action="tracker-answer" data-value="${optionIndex}">
            <span>${escapeHtml(String(option))}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderTrackerPsiSectionSelect() {
  const selected = activeTrackerSession?.selectedPsiSections || {};
  return `
    <div class="tracker-question-card tracker-psi-card tracker-section-select">
      <span class="stats-kicker">Psi-CBS setup</span>
      <h2>Select which sections to complete:</h2>
      <div class="tracker-section-copy">
        <p>The Ψ-CBS is a brief self-report measure for tracking everyday cognitive performance over the past two weeks. The Core scale measures focus stability, error resistance, active processing, and learning/transfer.</p>
        <p>Optional supplementary tests assess allostatic dysregulation patterns (Ψ-CBS-AD) and AI tool multiplier effects (Ψ-CBS-AI).</p>
      </div>
      <div class="tracker-subtest-list">
        ${TRACKER_PSI_SECTIONS.map((section) => `
          <button class="tracker-subtest-btn${selected[section.id] ? " is-selected" : ""}" type="button" data-action="toggle-tracker-psi-section" data-section="${escapeHtml(section.id)}" aria-pressed="${selected[section.id] ? "true" : "false"}">
            <span class="tracker-subtest-check" aria-hidden="true"></span>
            <strong>${escapeHtml(section.label)}</strong>
            <em>${escapeHtml(section.duration)}</em>
          </button>
        `).join("")}
      </div>
      <button class="btn btn-primary tracker-start-btn" type="button" data-action="begin-tracker-psi-sections" ${trackerSelectedPsiCount() ? "" : "disabled"}>Begin selected subtests</button>
    </div>
  `;
}

function renderTrackerPsiQuestion() {
  const questions = trackerPsiQuestionList();
  const question = currentTrackerQuestion();
  const index = Number(activeTrackerSession.index || 0);
  if (!question) return "";
  return `
    <div class="tracker-question-card tracker-psi-card">
      <div class="tracker-question-head">
        <span class="stats-kicker">${escapeHtml(question.label)}</span>
        <strong>${index + 1}/${questions.length}</strong>
      </div>
      <h2>${escapeHtml(question.text)}</h2>
      <div class="tracker-option-grid tracker-scale-grid">
        ${TRACKER_PSI_OPTIONS.map((option) => `
          <button class="tracker-option-btn" type="button" data-action="tracker-answer" data-value="${option.value}">
            <strong>${option.value}</strong>
            <span>${escapeHtml(option.label)}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function renderTrackerResult() {
  const session = activeTrackerSession;
  const result = session?.result || null;
  if (!session || !result) return renderTrackerIntro();
  if (session.type === "sgs") {
    return `
      <div class="tracker-result-card">
        <span class="stats-kicker">Saved result</span>
        <h2>${escapeHtml(session.label)}</h2>
        <div class="center-stats-summary tracker-result-summary">
          <div class="stat"><span class="mini-label">Raw</span><strong>${escapeHtml(`${result.raw}/${result.maxRaw}`)}</strong></div>
          <div class="stat"><span class="mini-label">RS-IQ</span><strong>${escapeHtml(String(result.rsIq))}</strong></div>
          <div class="stat"><span class="mini-label">Type</span><strong>Snapshot</strong></div>
          <div class="stat"><span class="mini-label">Saved</span><strong>Yes</strong></div>
        </div>
        <p>RS-IQ is an internal reasoning snapshot score for tracking change, not a clinical IQ score.</p>
      </div>
    `;
  }
  return `
    <div class="tracker-result-card">
      <span class="stats-kicker">Saved result</span>
      <h2>Psi-CBS</h2>
      <div class="center-stats-summary tracker-result-summary">
        <div class="stat"><span class="mini-label">Core</span><strong>${formatTrackerScore(result.core)}</strong></div>
        <div class="stat"><span class="mini-label">AD</span><strong>${formatTrackerScore(result.ad)}</strong></div>
        <div class="stat"><span class="mini-label">AI</span><strong>${result.aiApplicable ? formatTrackerScore(result.ai) : "N/A"}</strong></div>
        <div class="stat"><span class="mini-label">Saved</span><strong>Yes</strong></div>
      </div>
      <p>Core tracks applied focus and processing. AD is load/dysregulation. AI tracks whether AI tools helped or hindered cognitive work.</p>
    </div>
  `;
}

function renderTrackerArena() {
  if (activeTrackerSession?.status === "results") return renderTrackerResult();
  if (activeTrackerSession?.status === "section_select") return renderTrackerPsiSectionSelect();
  if (activeTrackerSession?.status === "question") {
    return activeTrackerSession.type === "sgs" ? renderTrackerSgsQuestion() : renderTrackerPsiQuestion();
  }
  return renderTrackerIntro();
}

function renderTrackerPlayControls() {
  if (viewState.centerMode === "stats") {
    return `<div class="response-row"><button class="btn btn-primary tracker-return-btn" type="button" data-action="show-play">Return to tracker</button></div>`;
  }
  if (activeTrackerSession?.status === "section_select") {
    return `<div class="response-row"><button class="response-btn is-stop" type="button" data-action="stop-tracker-test">Stop test</button></div>`;
  }
  if (activeTrackerSession?.status === "question") {
    return `<div class="response-row"><button class="response-btn is-stop" type="button" data-action="stop-tracker-test">Stop test</button></div>`;
  }
  if (activeTrackerSession?.status === "results") {
    return `<div class="response-row"><button class="btn btn-primary" type="button" data-action="clear-tracker-result">Continue</button></div>`;
  }
  return `<div class="response-row"><button class="btn btn-primary tracker-start-btn" type="button" data-action="start-tracker-test">Start test</button></div>`;
}

function renderTrackerPlayCard() {
  const showingStats = viewState.centerMode === "stats";
  return `
    <section class="play-card tracker-play-card${showingStats ? " is-stats-view" : ""}" aria-label="Tracker play surface">
      <div class="mobile-topbar">
        <button class="btn btn-ghost" type="button" data-action="open-left">Tests</button>
        <button class="btn btn-ghost" type="button" data-action="open-right">Scores</button>
      </div>
      ${showingStats ? "" : renderHud()}
      <div class="play-body${showingStats ? " is-stats" : ""} is-tracker">
        <div class="arena-shell${showingStats ? " is-stats" : ""} is-tracker">
          ${showingStats ? renderTrackerStatsDashboard() : renderTrackerArena()}
        </div>
        <div class="play-coach-slot"></div>
        <div class="play-controls">${renderTrackerPlayControls()}</div>
      </div>
    </section>
  `;
}

function renderTrackerRightStrip() {
  const latest = trackerLatestSummary();
  return `
    <aside class="strip strip-right tracker-right-strip" aria-label="Tracker scores strip">
      <div class="strip-inner">
        <div class="strip-head strip-head-close">
          <button class="sheet-close" type="button" data-action="close-sheets" aria-label="Close sheet">x</button>
        </div>
        <section class="panel score-panel">
          <h2 class="strip-title panel-strip-title">SCORES</h2>
          <div class="stat-grid tracker-score-grid">
            <div class="stat"><span class="mini-label">SgS Pre</span><strong>${Number.isFinite(latest.preIq) ? latest.preIq : "--"}</strong></div>
            <div class="stat"><span class="mini-label">SgS Post</span><strong>${Number.isFinite(latest.postIq) ? latest.postIq : "--"}</strong></div>
            <div class="stat"><span class="mini-label">Change</span><strong>${Number.isFinite(latest.delta) ? `${latest.delta >= 0 ? "+" : ""}${latest.delta}` : "--"}</strong></div>
        <div class="stat"><span class="mini-label">Psi Core</span><strong>${formatTrackerScore(latest.psiCore?.result?.core)}</strong></div>
        <div class="stat"><span class="mini-label">Psi AD</span><strong>${formatTrackerScore(latest.psiAd?.result?.ad)}</strong></div>
        <div class="stat"><span class="mini-label">Psi AI</span><strong>${formatTrackerScore(latest.psiAi?.result?.ai)}</strong></div>
          </div>
          <button class="btn btn-ghost right-stats-btn${viewState.centerMode === "stats" ? " is-selected" : ""}" type="button" data-action="show-stats" aria-pressed="${viewState.centerMode === "stats" ? "true" : "false"}" ${trackerTestIsActive() ? "disabled" : ""}>Stats</button>
        </section>
        ${renderIqMindwareFooter()}
      </div>
    </aside>
  `;
}

function renderReasoningRightStrip() {
  const stats = reasoningSessionStats(reasoningState.history.filter((entry) => entry.type !== "session_abandoned"));
  const latest = stats.latest;
  const latestFamilyLabel = latest ? reasoningFamilyLabel(latest.family) : "--";
  const latestFamilyChip = latest ? reasoningFamilyChipLabel(latest.family) : "--";
  return `
    <aside class="strip strip-right" aria-label="Reasoning stats and wallet strip">
      <div class="strip-inner">
        <div class="strip-head strip-head-close">
          <button class="sheet-close" type="button" data-action="close-sheets" aria-label="Close sheet">x</button>
        </div>
        <section class="panel score-panel">
          <h2 class="strip-title panel-strip-title">SCORES</h2>
          <div class="coin-stack">
            <div class="coin">
              <img class="coin-icon" src="./assets/coins/g-plasticity-cell.png?v=20260417-coin2" alt="" loading="lazy">
              <strong>${economy.walletG} g</strong>
              <span class="coin-label">brain cell credit</span>
            </div>
            <div class="coin iq">
              <img class="coin-icon" src="./assets/coins/iq-credit.png?v=20260417-coin2" alt="" loading="lazy">
              <strong>${(economy.walletG / 100).toFixed(2)} IQ</strong>
              <span class="coin-label">IQ point credit</span>
            </div>
          </div>
          <h3 class="reasoning-strip-heading">Reasoning</h3>
          <div class="stat-grid">
            <div class="stat"><span class="mini-label">Family</span><strong class="reasoning-family-chip" title="${escapeHtml(latestFamilyLabel)}">${escapeHtml(latestFamilyChip)}</strong></div>
            <div class="stat"><span class="mini-label">Tier</span><strong>${escapeHtml(latest ? String(latest.tier) : "--")}</strong></div>
            <div class="stat"><span class="mini-label">Accuracy</span><strong>${latest ? percent(latest.accuracy) : "--"}</strong></div>
            <div class="stat"><span class="mini-label">Transfer</span><strong>${latest ? formatScorePercent(latest.transferScore?.total) : "--"}</strong></div>
          </div>
          <button class="btn btn-ghost right-stats-btn${viewState.centerMode === "stats" ? " is-selected" : ""}" type="button" data-action="show-stats" aria-pressed="${viewState.centerMode === "stats" ? "true" : "false"}" ${activeReasoningBlock ? "disabled" : ""}>Stats</button>
        </section>
        <section class="panel">
          <h2 class="strip-title panel-strip-title">GAME PLAY</h2>
          <div class="stat-grid">
            <div class="stat"><span class="mini-label">Current Session</span><strong>${escapeHtml(currentReasoningSessionDisplay())}</strong></div>
            <div class="stat"><span class="mini-label">Sessions To Go</span><strong>${escapeHtml(reasoningSessionToGoDisplay())}</strong></div>
          </div>
          <button class="btn btn-ghost right-stats-btn" type="button" data-action="reset-reasoning-sessions" ${activeReasoningBlock ? "disabled" : ""}>Reset reasoning</button>
        </section>
        ${renderIqMindwareFooter()}
      </div>
    </aside>
  `;
}

function renderReasoningPlayControls() {
  if (viewState.centerMode === "zone") return renderPlayControls();
  if (viewState.centerMode === "stats") {
    return `<div class="response-row"><button class="btn btn-primary" type="button" data-action="show-play">Return to gameplay</button></div>`;
  }
  if (viewState.reasoningBusy) {
    return `<div class="response-row"><button class="btn btn-dark" type="button" disabled>Loading signals</button></div>`;
  }
  if (activeReasoningBlock?.status === "question") {
    return `<div class="response-row"><button class="response-btn is-stop" type="button" data-action="stop-reasoning-block">Stop</button></div>`;
  }
  if (activeReasoningBlock?.status === "feedback") {
    const label = isFinalReasoningItem(activeReasoningBlock) ? reasoningCompletionButtonLabel(activeReasoningBlock) : "Next item";
    return `<div class="response-row"><button class="response-btn" type="button" data-action="reasoning-next">${escapeHtml(label)}</button></div>`;
  }
  if (activeReasoningBlock?.status === "summary") {
    return `<div class="response-row"><button class="btn btn-primary" type="button" data-action="clear-reasoning-summary">Continue</button></div>`;
  }
  if (viewState.reasoningCloseSession) {
    return `<div class="response-row"><button class="btn btn-primary" type="button" data-action="save-reasoning-capture">Save close</button><button class="btn btn-ghost" type="button" data-action="skip-reasoning-capture">Skip</button></div>`;
  }
  const rec = reasoningZoneRecommendation();
  const session = reasoningState.currentSession;
  const contract = currentCoachContract();
  return `
    <div class="response-row">
      ${reasoningState.settings.mode === "coach" && contract && capacityRemainingForContract(contract) > 0 ? `<button class="btn btn-primary" type="button" data-action="switch-to-capacity">Go to Capacity Gym</button>` : ""}
      ${reasoningState.settings.mode === "coach" && rec.recommended && !contract ? `<button class="btn btn-primary" type="button" data-action="show-zone-pulse">Test your zone</button>` : ""}
      ${reasoningState.settings.mode === "coach" && rec.recommended && !contract ? `<button class="btn btn-ghost" type="button" data-action="skip-zone-pulse">Skip zone pulse</button>` : ""}
      ${reasoningState.settings.mode === "coach" && !session && ((!contract && !rec.recommended) || (contract && capacityRemainingForContract(contract) <= 0 && reasoningRemainingForContract(contract) > 0)) ? `<button class="btn btn-primary" type="button" data-action="start-reasoning-session">Start reasoning session</button>` : ""}
      ${reasoningState.settings.mode === "coach" && session ? `<button class="btn btn-primary" type="button" data-action="start-reasoning-block">Start reasoning block</button>` : ""}
      ${reasoningState.settings.mode === "coach" && session ? `<button class="btn btn-ghost" type="button" data-action="show-zone-pulse">Test your zone</button>` : ""}
      ${reasoningState.settings.mode === "manual" ? `<button class="btn btn-primary" type="button" data-action="start-reasoning-manual">Start manual reasoning</button>` : ""}
    </div>
  `;
}

function renderReasoningPlayCard() {
  const showingStats = viewState.centerMode === "stats";
  const showingZone = viewState.centerMode === "zone";
  const sessionBar = showingStats ? "" : renderCoachSessionBar();
  return `
    <section class="play-card reasoning-play-card${showingStats ? " is-stats-view" : ""}${sessionBar ? " has-session-bar" : ""}" aria-label="Reasoning play surface">
      <div class="mobile-topbar">
        <button class="btn btn-ghost" type="button" data-action="open-left">Coach</button>
        <button class="btn btn-ghost" type="button" data-action="open-right">Stats</button>
      </div>
      ${sessionBar}
      ${showingStats ? "" : renderHud()}
      <div class="play-body${showingStats ? " is-stats" : ""}${showingZone ? " is-zone" : ""} is-reasoning">
        <div class="arena-shell${showingStats ? " is-stats" : ""}${showingZone ? " is-zone" : ""} is-reasoning">
          ${showingStats ? renderReasoningStatsDashboard() : showingZone ? renderZonePulseTask() : renderReasoningArena()}
        </div>
        <div class="play-coach-slot">${renderReasoningCoachSlot()}</div>
        <div class="play-controls">${renderReasoningPlayControls()}</div>
      </div>
    </section>
  `;
}

function renderLeftStrip() {
  return `
    <aside class="strip strip-left" aria-label="Coach and setup strip">
      <div class="strip-inner">
        <div class="strip-head">
          <div>
            <h2 class="strip-title">Zone Check</h2>
          </div>
          <button class="sheet-close" type="button" data-action="close-sheets" aria-label="Close sheet">x</button>
        </div>
        ${renderZoneCheckPanel()}
        ${renderModePanel()}
        ${state.settings.mode === "manual" ? renderManualPanel() : ""}
        ${renderLiveCoachingLink()}
      </div>
    </aside>
  `;
}

function renderFamilyProgress() {
  const coachSession = activeCoachSession();
  return `
    <section class="panel">
      <h3>Family progress</h3>
      <div class="family-list">
        ${Object.keys(FAMILY_META).map((familyId) => {
          const count = state.history.filter((entry) => wrapperFamily(entry.wrapper) === familyId).length;
          const isCurrent = coachSession?.familyId === familyId;
          return `
            <div class="family-item${isCurrent ? " is-current" : ""}">
              <span>${escapeHtml(familyLabel(familyId))}</span>
              <strong>${count}</strong>
            </div>
          `;
        }).join("")}
      </div>
    </section>
    <section class="panel">
      <h3>Relate ladder</h3>
      <div class="family-list">
        ${RELATE_LADDER.map((wrapper) => {
          const done = stableWrapper(wrapper) || (wrapper === "relate_vectors" && stableWrapper(wrapper, "rel") && stableWrapper(wrapper, "sym")) || (wrapper === "relate_numbers" && stableWrapper(wrapper, "rel") && stableWrapper(wrapper, "sym"));
          return `
            <div class="family-item${pickRelateWrapper() === wrapper ? " is-current" : ""}">
              <span>${escapeHtml(wrapperLabel(wrapper))}</span>
              <strong>${done ? "Stable" : "Open"}</strong>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function gameplayStatsModel() {
  const last = state.history[0] || null;
  const plan = displayPlanForHud();
  return {
    lastNBack: last ? `N-${blockEndN(last)}` : "--",
    nextNBack: `N-${projectedNextN(plan)}`,
    currentSession: currentSessionDisplay(),
    sessionsToGo: sessionsToGoDisplay()
  };
}

function renderRightStrip() {
  const score = latestTransferScore();
  const last = state.history[0] || null;
  const gameplayStats = gameplayStatsModel();
  const accuracyModes = accuracyModeModel();
  return `
    <aside class="strip strip-right" aria-label="Stats and wallet strip">
      <div class="strip-inner">
        <div class="strip-head strip-head-close">
          <button class="sheet-close" type="button" data-action="close-sheets" aria-label="Close sheet">x</button>
        </div>
        <section class="panel score-panel">
          <h2 class="strip-title panel-strip-title">SCORES</h2>
          <div class="coin-stack">
            <div class="coin">
              <img class="coin-icon" src="./assets/coins/g-plasticity-cell.png?v=20260417-coin2" alt="" loading="lazy">
              <strong>${economy.walletG} g</strong>
              <span class="coin-label">brain cell credit</span>
            </div>
            <div class="coin iq">
              <img class="coin-icon" src="./assets/coins/iq-credit.png?v=20260417-coin2" alt="" loading="lazy">
              <strong>${(economy.walletG / 100).toFixed(2)} IQ</strong>
              <span class="coin-label">IQ point credit</span>
            </div>
          </div>
          <div class="right-subsection">
            <h3>Accuracy</h3>
            <div class="stat-grid accuracy-mode-grid">
              ${accuracyModes.map((mode) => `
                <div class="stat accuracy-mode-card${mode.tracked ? "" : " is-empty"}">
                  <span class="mini-label">${escapeHtml(mode.label)}</span>
                  <span class="accuracy-mode-target">${escapeHtml(mode.target)}</span>
                  <strong class="accuracy-mode-score">${percent(mode.score)}</strong>
                </div>
              `).join("")}
            </div>
            ${last ? `<p class="small muted">Last block: ${escapeHtml(wrapperLabel(last.wrapper))}.</p>` : ""}
          </div>
          <div class="right-subsection">
            <h3>Far Transfer Score</h3>
            <div class="stat-grid">
              <div class="stat"><span class="mini-label">Score</span><strong>${score ? formatScorePercent(score.total) : "--"}</strong></div>
              <div class="stat"><span class="mini-label">Label</span><strong class="transfer-label-value">${score ? score.label : "--"}</strong></div>
            </div>
            <button class="btn btn-ghost right-stats-btn${viewState.centerMode === "stats" ? " is-selected" : ""}" type="button" data-action="show-stats" aria-pressed="${viewState.centerMode === "stats" ? "true" : "false"}" ${activeBlock ? "disabled" : ""}>Stats</button>
          </div>
        </section>
        <section class="panel gameplay-panel">
          <h2 class="strip-title panel-strip-title">GAME PLAY</h2>
          <div class="stat-grid">
            <div class="stat"><span class="mini-label">Last N-Back</span><strong>${gameplayStats.lastNBack}</strong></div>
            <div class="stat"><span class="mini-label">Next N-back</span><strong>${gameplayStats.nextNBack}</strong></div>
            <div class="stat"><span class="mini-label">Current Session</span><strong>${gameplayStats.currentSession}</strong></div>
            <div class="stat"><span class="mini-label">Sessions To Go</span><strong>${gameplayStats.sessionsToGo}</strong></div>
          </div>
          <button class="btn btn-ghost right-stats-btn" type="button" data-action="reset-sessions" ${activeBlock ? "disabled" : ""}>Reset sessions</button>
        </section>
        ${renderIqMindwareFooter()}
      </div>
    </aside>
  `;
}

function renderPlayControls() {
  const coachSession = activeCoachSession();
  const recommendZonePreflight = shouldRecommendCoachZonePreflight();
  const contract = currentCoachContract();
  if (viewState.centerMode === "zone") {
    if (zonePulseState.phase === "countdown") {
      return `
        <div class="response-row zone-response-row">
          <button class="response-btn is-stop" type="button" data-action="stop-zone-pulse">Stop</button>
        </div>
      `;
    }
    if (zonePulseIsLive()) {
      return `
        <div class="response-row zone-response-row">
          <button class="response-btn secondary" type="button" data-action="zone-left"><span class="keycap zone-keycap">←</span> Left</button>
          <button class="response-btn" type="button" data-action="zone-right">Right <span class="keycap zone-keycap">→</span></button>
          <button class="response-btn is-stop" type="button" data-action="stop-zone-pulse">Stop</button>
        </div>
      `;
    }
    if (contract) {
      return `
        <div class="response-row">
          ${coachContractPrimaryActionMarkup(contract, { disabled: activeBlock })}
          <button class="btn btn-ghost" type="button" data-action="show-play">Return to gameplay</button>
        </div>
      `;
    }
    return `
      <div class="response-row">
        <button class="btn btn-primary" type="button" data-action="start-zone-pulse" ${activeBlock ? "disabled" : ""}>Start zone pulse</button>
        <button class="btn btn-ghost" type="button" data-action="show-play">Return to gameplay</button>
      </div>
    `;
  }
  if (activeBlock?.status === "paused") {
    return `
      <div class="response-row">
        <button class="response-btn is-control" type="button" data-action="resume-block">Resume</button>
        <button class="response-btn is-stop" type="button" data-action="stop-block">Stop</button>
      </div>
    `;
  }
  if (activeBlock?.status === "trial" || activeBlock?.status === "countdown") {
    if (activeBlock.plan.targetModality === "dual") {
      return `
        <div class="response-row">
          <button class="response-btn is-control" type="button" data-action="pause-block">Pause</button>
          <button class="response-btn secondary" type="button" data-action="respond-sym"><span class="keycap">F</span> Spatial / surface match</button>
          <button class="response-btn" type="button" data-action="respond-rel"><span class="keycap">L</span> Object / relation match</button>
          <button class="response-btn is-stop" type="button" data-action="stop-block">Stop</button>
        </div>
      `;
    }
    return `
      <div class="response-row">
        <button class="response-btn is-control" type="button" data-action="pause-block">Pause</button>
        <button class="response-btn" type="button" data-action="respond">MATCH</button>
        <button class="response-btn is-stop" type="button" data-action="stop-block">Stop</button>
      </div>
    `;
  }
  if (viewState.centerMode === "stats") {
    return `
      <div class="response-row">
        <button class="btn btn-primary" type="button" data-action="show-play">Return to gameplay</button>
      </div>
    `;
  }
  return `
    <div class="response-row">
      ${contract && capacityRemainingForContract(contract) <= 0 && reasoningRemainingForContract(contract) > 0 ? `<button class="btn btn-primary" type="button" data-action="switch-to-reasoning">Go to Reasoning Gym</button>` : ""}
      ${coachSession ? `<button class="btn btn-primary" type="button" data-action="start-block" ${activeBlock ? "disabled" : ""}>Start next block</button>` : ""}
      ${coachSession && state.settings.mode === "coach" ? `<button class="btn btn-ghost" type="button" data-action="show-zone-pulse" ${activeBlock ? "disabled" : ""}>Test your zone</button>` : ""}
      ${state.settings.mode === "manual" ? `<button class="btn btn-primary" type="button" data-action="start-block" ${activeBlock ? "disabled" : ""}>Start manual block</button>` : ""}
      ${state.settings.mode === "coach" && !state.currentSession && !contract && recommendZonePreflight ? `<button class="btn btn-primary" type="button" data-action="show-zone-pulse" ${activeBlock ? "disabled" : ""}>Test your zone</button>` : ""}
      ${state.settings.mode === "coach" && !state.currentSession && !contract && recommendZonePreflight ? `<button class="btn btn-ghost" type="button" data-action="skip-zone-pulse" ${activeBlock ? "disabled" : ""}>Skip zone pulse</button>` : ""}
      ${state.settings.mode === "coach" && !state.currentSession && ((!contract && !recommendZonePreflight) || (contract && capacityRemainingForContract(contract) > 0)) ? `<button class="btn btn-primary" type="button" data-action="start-coach-session" ${activeBlock ? "disabled" : ""}>Start capacity session</button>` : ""}
    </div>
  `;
}

function renderPlayCard() {
  const showingStats = viewState.centerMode === "stats" && !activeBlock;
  const showingZone = viewState.centerMode === "zone";
  const sessionBar = showingStats ? "" : renderCoachSessionBar();
  const manualCapacity = state.settings.mode === "manual" && !showingStats && !showingZone;
  return `
    <section class="play-card${showingStats ? " is-stats-view" : ""}${sessionBar ? " has-session-bar" : ""}${manualCapacity ? " is-manual-capacity" : ""}" aria-label="Capacity play surface">
      <div class="mobile-topbar">
        <button class="btn btn-ghost" type="button" data-action="open-left">Coach</button>
        <button class="btn btn-ghost" type="button" data-action="open-right">Stats</button>
      </div>
      ${sessionBar}
      ${showingStats ? "" : renderHud()}
      <div class="play-body${showingStats ? " is-stats" : ""}${showingZone ? " is-zone" : ""}">
        <div class="arena-shell${showingStats ? " is-stats" : ""}${showingZone ? " is-zone" : ""}">
          ${showingStats ? renderCenterStatsDashboard() : showingZone ? renderZonePulseTask() : arenaMarkup()}
        </div>
        <div class="play-coach-slot">${showingStats || showingZone ? "" : renderCoachCallout()}</div>
        <div class="play-controls">${renderPlayControls()}</div>
      </div>
    </section>
  `;
}

function render() {
  const classes = ["gym-layout", viewState.leftOpen ? "is-left-open" : "", viewState.rightOpen ? "is-right-open" : ""].filter(Boolean).join(" ");
  const leftStrip = viewState.activeModule === "tracker" ? renderTrackerLeftStrip()
    : viewState.activeModule === "reasoning" ? renderReasoningLeftStrip() : renderLeftStrip();
  const playCard = viewState.activeModule === "tracker" ? renderTrackerPlayCard()
    : viewState.activeModule === "reasoning" ? renderReasoningPlayCard() : renderPlayCard();
  const rightStrip = viewState.activeModule === "tracker" ? renderTrackerRightStrip()
    : viewState.activeModule === "reasoning" ? renderReasoningRightStrip() : renderRightStrip();
  appRoot.innerHTML = `
    <div class="${classes}">
      <button class="sheet-backdrop" type="button" data-action="close-sheets" aria-label="Close sheet"></button>
      ${leftStrip}
      ${playCard}
      ${rightStrip}
    </div>
    ${renderModeHelpModal()}
    ${renderZoneHelpModal()}
    ${renderTrackerHelpModal()}
    ${renderAppHelpModal()}
    ${renderPrivacyHelpModal()}
  `;
  ensureModuleSwitch();
}

function updateSettingsField(field, value) {
  const settings = { ...state.settings };
  if (field === "wrapper") {
    settings.wrapper = normalizeWrapper(value);
    settings.targetModality = pickFamilyTarget(settings.wrapper);
  } else if (field === "targetModality") {
    settings.targetModality = normalizeTarget(settings.wrapper, value);
  } else if (field === "n") {
    settings.n = normalizeNSetting(value);
  } else if (field === "speed") {
    settings.speed = value === "fast" ? "fast" : "slow";
  }
  state.settings = settings;
  saveState();
  render();
}

function resetLocalData() {
  if (!window.confirm("Reset Capacity Gym v2 local progress and g plasticity cells on this device?")) return;
  clearTimers();
  activeBlock = null;
  state = createDefaultState();
  economy = createDefaultEconomy();
  saveState(state);
  saveEconomy(economy);
  setAudioEnabled(state.settings.soundOn);
  syncSoundToggle();
  viewState.centerMode = "play";
  viewState.message = "Local Capacity Gym v2 data reset.";
  triggerSfx("ui_tap_soft");
  render();
}

function resetSessions() {
  if (activeBlock) {
    triggerSfx("invalid_action");
    return;
  }
  if (!window.confirm("Reset session count and clear session history/graphs on this device? Wallet credits and settings stay unchanged.")) return;
  state.currentSession = null;
  state.programme = {
    coreSessionNumber: 0,
    manualSessionNumber: 0,
    programmeBonusAwarded: false,
    programmeCompletedAt: null
  };
  state.history = [];
  coachState = createDefaultUnifiedCoachState();
  saveUnifiedCoachState(coachState);
  saveState();
  viewState.centerMode = "play";
  viewState.message = "Session count and session stats reset. Wallet credits and settings are unchanged.";
  triggerSfx("ui_tap_soft");
  render();
}

function startTrackerTest() {
  if (anyGameplayActive()) {
    triggerSfx("invalid_action");
    return;
  }
  prewarmTrackerImages(trackerSelectedTest().id);
  activeTrackerSession = createTrackerSession(trackerSelectedTest().id);
  viewState.centerMode = "play";
  viewState.leftOpen = false;
  viewState.rightOpen = false;
  viewState.message = `${activeTrackerSession.label} started.`;
  triggerSfx("ui_tap_soft");
  render();
}

function saveCompletedTrackerSession() {
  if (!activeTrackerSession) return;
  const entry = createTrackerEntry(activeTrackerSession);
  activeTrackerSession.result = entry.result;
  activeTrackerSession.status = "results";
  trackerState.entries = [...trackerState.entries, entry].slice(-160);
  saveTrackerState();
  viewState.message = `${activeTrackerSession.label} result saved.`;
  triggerSfx("block_complete");
}

function answerTrackerQuestion(value) {
  if (!activeTrackerSession || activeTrackerSession.status !== "question") return;
  if (activeTrackerSession.type === "sgs") {
    const manifest = trackerManifestFor(activeTrackerSession.testId);
    activeTrackerSession.answers[activeTrackerSession.index] = Number(value);
    if (activeTrackerSession.index >= manifest.items.length - 1) {
      saveCompletedTrackerSession();
    } else {
      activeTrackerSession.index += 1;
      triggerSfx("ui_tap_soft");
    }
    render();
    return;
  }

  const questions = trackerPsiQuestionList();
  const question = questions[activeTrackerSession.index];
  if (!question) return;
  activeTrackerSession.answers[question.id] = Number(value);
  if (activeTrackerSession.index >= questions.length - 1) {
    saveCompletedTrackerSession();
  } else {
    activeTrackerSession.index += 1;
    triggerSfx("ui_tap_soft");
  }
  render();
}

function toggleTrackerPsiSection(sectionId) {
  if (!activeTrackerSession || activeTrackerSession.status !== "section_select") return;
  if (!TRACKER_PSI_SECTIONS.some((section) => section.id === sectionId)) return;
  activeTrackerSession.selectedPsiSections = {
    ...(activeTrackerSession.selectedPsiSections || { core: true }),
    [sectionId]: !activeTrackerSession.selectedPsiSections?.[sectionId]
  };
  triggerSfx("ui_tap_soft");
  render();
}

function beginTrackerPsiSections() {
  if (!activeTrackerSession || activeTrackerSession.status !== "section_select") return;
  const questions = trackerPsiQuestionList();
  if (!questions.length) {
    triggerSfx("invalid_action");
    return;
  }
  activeTrackerSession.index = 0;
  activeTrackerSession.totalItems = questions.length;
  activeTrackerSession.status = "question";
  render();
}

function stopTrackerTest() {
  if (!activeTrackerSession) return;
  activeTrackerSession = null;
  viewState.message = "Tracker test stopped. No score was saved.";
  triggerSfx("ui_tap_soft");
  render();
}

document.addEventListener("pointerdown", () => {
  unlockAudioGesture();
}, { passive: true });

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  unlockAudioGesture();
  const action = target.getAttribute("data-action");
  if (action === "toggle-sound") {
    setSoundOn(!isSoundOn());
    return;
  }
  if (action === "set-module") {
    const requestedModule = target.getAttribute("data-module");
    const moduleId = requestedModule === "reasoning" || requestedModule === "tracker" ? requestedModule : "capacity";
    if (moduleId === viewState.activeModule) return;
    if (anyGameplayActive()) {
      triggerSfx("invalid_action");
      return;
    }
    saveActiveModule(moduleId);
    viewState.centerMode = "play";
    viewState.leftOpen = false;
    viewState.rightOpen = false;
    viewState.reasoningCloseSession = null;
    viewState.modeHelpOpen = false;
    viewState.zoneHelpOpen = false;
    viewState.trackerHelpOpen = false;
    viewState.appHelpOpen = false;
    viewState.privacyHelpOpen = false;
    triggerSfx("ui_tap_soft");
    render();
    return;
  }
  if (action === "switch-to-reasoning" || action === "switch-to-capacity") {
    if (anyGameplayActive()) {
      triggerSfx("invalid_action");
      return;
    }
    saveActiveModule(action === "switch-to-reasoning" ? "reasoning" : "capacity");
    viewState.centerMode = "play";
    viewState.leftOpen = false;
    viewState.rightOpen = false;
    viewState.reasoningCloseSession = null;
    viewState.appHelpOpen = false;
    viewState.privacyHelpOpen = false;
    viewState.message = action === "switch-to-reasoning"
      ? "Reasoning Gym is ready. Finish the logic items to complete this session."
      : "Capacity Gym is ready. Finish the remaining blocks to complete this session.";
    triggerSfx("ui_tap_soft");
    render();
    return;
  }
  if (action === "open-left") {
    if (activeBlock?.status === "trial" || activeBlock?.status === "countdown" || zonePulseIsRunning() || activeReasoningBlock || trackerTestIsActive()) return;
    triggerSfx("ui_tap_soft");
    viewState.leftOpen = true;
    viewState.rightOpen = false;
    render();
    return;
  }
  if (action === "open-right") {
    if (activeBlock?.status === "trial" || activeBlock?.status === "countdown" || zonePulseIsRunning() || activeReasoningBlock || trackerTestIsActive()) return;
    triggerSfx("ui_tap_soft");
    viewState.rightOpen = true;
    viewState.leftOpen = false;
    render();
    return;
  }
  if (action === "show-stats") {
    if (activeBlock || zonePulseIsRunning() || activeReasoningBlock || trackerTestIsActive()) return;
    triggerSfx("ui_tap_soft");
    viewState.centerMode = "stats";
    viewState.leftOpen = false;
    viewState.rightOpen = false;
    render();
    return;
  }
  if (action === "show-play") {
    if (zonePulseIsRunning()) return;
    destroyZonePulseController();
    triggerSfx("ui_tap_soft");
    viewState.centerMode = "play";
    render();
    return;
  }
  if (action === "set-reasoning-mode") {
    if (anyGameplayActive()) return;
    reasoningState.settings.mode = target.getAttribute("data-mode") === "manual" ? "manual" : "coach";
    if (reasoningState.settings.mode === "manual") {
      const familyMeta = REASONING_FAMILIES[reasoningState.settings.family] || REASONING_FAMILIES.relation_fit;
      if (reasoningState.settings.subtype === "auto" || !familyMeta.subtypes[reasoningState.settings.subtype]) {
        reasoningState.settings.subtype = familyMeta.defaultSubtype;
      }
      if (reasoningState.settings.tier === "auto") {
        reasoningState.settings.tier = 1;
      }
      reasoningState.settings = normalizeReasoningManualSettings(reasoningState.settings);
    }
    reasoningState.currentSession = null;
    saveReasoningState();
    viewState.reasoningCloseSession = null;
    triggerSfx("ui_tap_soft");
    render();
    return;
  }
  if (action === "start-reasoning-session") {
    beginReasoningCoachSession();
    return;
  }
  if (action === "start-reasoning-block") {
    startReasoningBlock({ manual: false });
    return;
  }
  if (action === "start-reasoning-manual") {
    startReasoningBlock({ manual: true });
    return;
  }
  if (action === "reasoning-option") {
    toggleReasoningOption(target.getAttribute("data-option"));
    return;
  }
  if (action === "reasoning-submit") {
    submitReasoningAnswer();
    return;
  }
  if (action === "reasoning-next") {
    advanceReasoningItem();
    return;
  }
  if (action === "stop-reasoning-block") {
    stopReasoningBlock();
    return;
  }
  if (action === "clear-reasoning-summary") {
    activeReasoningBlock = null;
    triggerSfx("ui_tap_soft");
    render();
    return;
  }
  if (action === "save-reasoning-capture") {
    saveReasoningTacticCapture();
    return;
  }
  if (action === "skip-reasoning-capture") {
    viewState.reasoningCloseSession = null;
    triggerSfx("ui_tap_soft");
    render();
    return;
  }
  if (action === "reset-reasoning-sessions") {
    if (activeReasoningBlock) return;
    if (!window.confirm("Reset Reasoning Gym session count and reasoning history on this device? Wallet credits stay unchanged.")) return;
    reasoningState = createDefaultReasoningState();
    coachState = createDefaultUnifiedCoachState();
    state.programme.coreSessionNumber = 0;
    state.currentSession = null;
    saveUnifiedCoachState(coachState);
    saveState();
    saveReasoningState(reasoningState);
    viewState.centerMode = "play";
    viewState.reasoningCloseSession = null;
    triggerSfx("ui_tap_soft");
    render();
    return;
  }
  if (action === "start-tracker-test") {
    startTrackerTest();
    return;
  }
  if (action === "tracker-answer") {
    answerTrackerQuestion(target.getAttribute("data-value"));
    return;
  }
  if (action === "toggle-tracker-psi-section") {
    toggleTrackerPsiSection(target.getAttribute("data-section"));
    return;
  }
  if (action === "begin-tracker-psi-sections") {
    beginTrackerPsiSections();
    return;
  }
  if (action === "stop-tracker-test") {
    stopTrackerTest();
    return;
  }
  if (action === "clear-tracker-result") {
    activeTrackerSession = null;
    triggerSfx("ui_tap_soft");
    render();
    return;
  }
  if (action === "close-sheets") {
    triggerSfx("ui_tap_soft");
    viewState.leftOpen = false;
    viewState.rightOpen = false;
    render();
    return;
  }
  if (action === "toggle-mode-help") {
    triggerSfx("ui_tap_soft");
    viewState.modeHelpOpen = !viewState.modeHelpOpen;
    viewState.zoneHelpOpen = false;
    viewState.trackerHelpOpen = false;
    viewState.appHelpOpen = false;
    viewState.privacyHelpOpen = false;
    render();
    return;
  }
  if (action === "toggle-zone-help") {
    triggerSfx("ui_tap_soft");
    viewState.zoneHelpOpen = !viewState.zoneHelpOpen;
    viewState.modeHelpOpen = false;
    viewState.trackerHelpOpen = false;
    viewState.appHelpOpen = false;
    viewState.privacyHelpOpen = false;
    render();
    return;
  }
  if (action === "toggle-tracker-help") {
    triggerSfx("ui_tap_soft");
    viewState.trackerHelpOpen = !viewState.trackerHelpOpen;
    viewState.modeHelpOpen = false;
    viewState.zoneHelpOpen = false;
    viewState.appHelpOpen = false;
    viewState.privacyHelpOpen = false;
    render();
    return;
  }
  if (action === "toggle-app-help") {
    if (anyGameplayActive()) {
      triggerSfx("invalid_action");
      return;
    }
    triggerSfx("ui_tap_soft");
    viewState.appHelpOpen = !viewState.appHelpOpen;
    viewState.modeHelpOpen = false;
    viewState.zoneHelpOpen = false;
    viewState.trackerHelpOpen = false;
    viewState.privacyHelpOpen = false;
    render();
    return;
  }
  if (action === "toggle-privacy-help") {
    triggerSfx("ui_tap_soft");
    viewState.privacyHelpOpen = !viewState.privacyHelpOpen;
    viewState.modeHelpOpen = false;
    viewState.zoneHelpOpen = false;
    viewState.trackerHelpOpen = false;
    viewState.appHelpOpen = false;
    render();
    return;
  }
  if (action === "close-mode-help") {
    if (event.target.closest("[data-dialog-panel]") && !event.target.closest(".mode-help-close")) return;
    triggerSfx("ui_tap_soft");
    viewState.modeHelpOpen = false;
    render();
    return;
  }
  if (action === "close-zone-help") {
    if (event.target.closest("[data-dialog-panel]") && !event.target.closest(".zone-help-close")) return;
    triggerSfx("ui_tap_soft");
    viewState.zoneHelpOpen = false;
    render();
    return;
  }
  if (action === "close-tracker-help") {
    if (event.target.closest("[data-dialog-panel]") && !event.target.closest(".tracker-help-close")) return;
    triggerSfx("ui_tap_soft");
    viewState.trackerHelpOpen = false;
    render();
    return;
  }
  if (action === "close-app-help") {
    if (event.target.closest("[data-dialog-panel]") && !event.target.closest(".app-help-close")) return;
    triggerSfx("ui_tap_soft");
    viewState.appHelpOpen = false;
    render();
    return;
  }
  if (action === "close-privacy-help") {
    if (event.target.closest("[data-dialog-panel]") && !event.target.closest(".privacy-help-close")) return;
    triggerSfx("ui_tap_soft");
    viewState.privacyHelpOpen = false;
    render();
    return;
  }
  if (action === "set-mode") {
    if (zonePulseIsRunning()) return;
    triggerSfx("ui_tap_soft");
    state.settings.mode = target.getAttribute("data-mode") === "manual" ? "manual" : "coach";
    viewState.modeHelpOpen = false;
    viewState.zoneHelpOpen = false;
    viewState.trackerHelpOpen = false;
    viewState.appHelpOpen = false;
    viewState.privacyHelpOpen = false;
    saveState();
    render();
    return;
  }
  if (action === "start-coach-session") {
    beginCoachSession();
    return;
  }
  if (action === "show-zone-pulse") {
    showZonePulse();
    return;
  }
  if (action === "skip-zone-pulse") {
    skipZonePulseAndStartCoachRoute();
    return;
  }
  if (action === "recheck-replan-session") {
    if (anyGameplayActive()) {
      triggerSfx("invalid_action");
      return;
    }
    if (!window.confirm("Re-check and set a new target for this coached session? Current unfinished coached progress will be replaced.")) return;
    coachState.active = null;
    state.currentSession = null;
    reasoningState.currentSession = null;
    saveUnifiedCoachState();
    saveState();
    saveReasoningState();
    viewState.message = "Run a fresh Zone Check to set a new Capacity and Reasoning target.";
    showZonePulse();
    return;
  }
  if (action === "start-zone-pulse") {
    startZonePulse();
    return;
  }
  if (action === "zone-left") {
    submitZonePulse("left");
    return;
  }
  if (action === "zone-right") {
    submitZonePulse("right");
    return;
  }
  if (action === "stop-zone-pulse") {
    stopZonePulse();
    return;
  }
  if (action === "clear-session") {
    triggerSfx("ui_tap_soft");
    state.currentSession = null;
    saveState();
    viewState.message = "Current coach session cleared. Completed history and wallet are unchanged.";
    render();
    return;
  }
  if (action === "start-block") {
    startBlock();
    return;
  }
  if (action === "pause-block") {
    pauseActiveBlock();
    return;
  }
  if (action === "resume-block") {
    resumeActiveBlock();
    return;
  }
  if (action === "stop-block") {
    stopActiveBlock();
    return;
  }
  if (action === "respond") {
    captureResponse("primary");
    return;
  }
  if (action === "respond-rel") {
    captureResponse("rel");
    return;
  }
  if (action === "respond-sym") {
    captureResponse("sym");
    return;
  }
  if (action === "reset-local") {
    resetLocalData();
    return;
  }
  if (action === "reset-sessions") {
    resetSessions();
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLSelectElement || target instanceof HTMLInputElement)) return;
  const trackerField = target.getAttribute("data-tracker-field");
  if (trackerField) {
    if (anyGameplayActive()) return;
    if (trackerField === "selectedTest") {
      trackerState.settings.selectedTest = TRACKER_TEST_BY_ID[target.value] ? target.value : "sgs12_pre";
      activeTrackerSession = null;
      saveTrackerState();
      unlockAudioGesture();
      triggerSfx("ui_tap_soft");
      render();
    }
    return;
  }
  const reasoningField = target.getAttribute("data-reasoning-field");
  if (reasoningField) {
    if (anyGameplayActive()) return;
    const settings = { ...reasoningState.settings };
    if (reasoningField === "family") {
      settings.family = REASONING_FAMILIES[target.value] ? target.value : "relation_fit";
      settings.subtype = REASONING_FAMILIES[settings.family]?.defaultSubtype || "same_relation";
    } else if (reasoningField === "subtype") {
      const familyMeta = REASONING_FAMILIES[settings.family] || REASONING_FAMILIES.relation_fit;
      settings.subtype = familyMeta.subtypes[target.value] && target.value !== "auto"
        ? target.value
        : familyMeta.defaultSubtype;
    } else if (reasoningField === "speed") {
      settings.speed = target.value === "untimed" ? "untimed" : target.value === "fast" ? "fast" : "normal";
    } else if (reasoningField === "tier") {
      settings.tier = clamp(Math.round(Number(target.value || 1)), 1, 5);
    } else if (reasoningField === "itemsPerBlock") {
      const count = Math.round(Number(target.value || 5));
      settings.itemsPerBlock = REASONING_MANUAL_ITEM_OPTIONS.includes(count) ? count : 5;
    }
    reasoningState.settings = normalizeReasoningManualSettings(settings);
    saveReasoningState();
    unlockAudioGesture();
    triggerSfx("ui_tap_soft");
    render();
    return;
  }
  const field = target.getAttribute("data-field");
  if (!field || activeBlock || zonePulseIsRunning() || activeReasoningBlock || trackerTestIsActive()) return;
  unlockAudioGesture();
  triggerSfx("ui_tap_soft");
  updateSettingsField(field, target.value);
});

function isInteractiveKeyTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("input, textarea, select, button, a[href], [contenteditable], [role='button'], [role='link']"));
}

document.addEventListener("keydown", (event) => {
  if (isInteractiveKeyTarget(event.target)) return;
  if (event.repeat) return;
  unlockAudioGesture();
  if (zonePulseIsRunning()) {
    if (event.code === "ArrowLeft") {
      if (submitZonePulse("left")) event.preventDefault();
      return;
    }
    if (event.code === "ArrowRight") {
      if (submitZonePulse("right")) event.preventDefault();
      return;
    }
    return;
  }
  if (activeTrackerSession?.status === "question") {
    if (activeTrackerSession.type === "psi") {
      const value = Number(event.key);
      if (value >= 1 && value <= 5) {
        answerTrackerQuestion(value);
        event.preventDefault();
      }
      return;
    }
    if (activeTrackerSession.type === "sgs") {
      const item = currentTrackerQuestion();
      const key = event.key.toUpperCase();
      const optionIndex = (item?.responseOptions || []).findIndex((option) => String(option).toUpperCase() === key);
      if (optionIndex >= 0) {
        answerTrackerQuestion(optionIndex);
        event.preventDefault();
      }
      return;
    }
  }
  if (activeReasoningBlock?.status === "question") {
    const item = currentReasoningItem();
    const key = event.key.toUpperCase();
    if (item?.answer_type === "multi_select" && key === "ENTER") {
      submitReasoningAnswer();
      event.preventDefault();
      return;
    }
    const option = item?.options?.find((entry) => entry.id === key);
    if (option) {
      toggleReasoningOption(option.id);
      event.preventDefault();
      return;
    }
  } else if (activeReasoningBlock?.status === "feedback" && (event.code === "Space" || event.code === "Enter")) {
    advanceReasoningItem();
    event.preventDefault();
    return;
  }
  if (event.code === "KeyP") {
    if (activeBlock?.status === "paused") resumeActiveBlock();
    else if (activeBlock) pauseActiveBlock();
    event.preventDefault();
    return;
  }
  if (activeBlock?.plan?.targetModality === "dual") {
    if (event.code === "KeyF") {
      unlockAudioGesture();
      if (captureResponse("sym")) event.preventDefault();
      return;
    }
    if (event.code === "KeyL" || event.code === "KeyJ") {
      unlockAudioGesture();
      if (captureResponse("rel")) event.preventDefault();
      return;
    }
    return;
  }
  if (event.code === "Space" || event.code === "Enter") {
    unlockAudioGesture();
    if (captureResponse("primary")) event.preventDefault();
    return;
  }
  if (event.code === "ArrowLeft" || event.code === "KeyF") {
    unlockAudioGesture();
    if (captureResponse("sym")) event.preventDefault();
    return;
  }
  if (event.code === "ArrowRight" || event.code === "KeyJ") {
    unlockAudioGesture();
    if (captureResponse("rel")) event.preventDefault();
  }
});

document.addEventListener("touchstart", (event) => {
  if (!event.touches || event.touches.length !== 1) return;
  unlockAudioGesture();
  const touch = event.touches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });

document.addEventListener("touchend", (event) => {
  if (!touchStart || activeBlock?.status === "trial" || activeBlock?.status === "countdown" || zonePulseIsRunning() || activeReasoningBlock || trackerTestIsActive()) {
    touchStart = null;
    return;
  }
  const touch = event.changedTouches && event.changedTouches[0];
  if (!touch) {
    touchStart = null;
    return;
  }
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
  if (dx > 0) {
    viewState.leftOpen = true;
    viewState.rightOpen = false;
  } else {
    viewState.rightOpen = true;
    viewState.leftOpen = false;
  }
  triggerSfx("ui_tap_soft");
  render();
}, { passive: true });

render();
syncSoundToggle();
