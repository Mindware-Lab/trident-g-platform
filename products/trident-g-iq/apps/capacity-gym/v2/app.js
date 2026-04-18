import {
  HUB_BASE_TRIALS,
  HUB_N_MAX,
  createHubBlockPlan,
  createHubBlockTrials,
  displayHubTargetLabel,
  isHubMatchAtIndex,
  summarizeHubBlock
} from "./runtime/hub-engine.js?v=20260418-prestarttips";
import {
  initAudio,
  playSfx,
  setAudioEnabled,
  unlockAudioContextFromUserGesture
} from "./runtime/audio.js";
import { hash32 } from "./runtime/rng.js";

const STORAGE_KEY = "tg_iq_live_capacity_v2";
const ECONOMY_KEY = "tg_iq_live_economy_v1";
const ZONE_HANDOFF_KEY = "iqmw.capacity.handoffFromZone";
const ZONE_FALLBACK_KEY = "lastCapacitySession";
const HISTORY_LIMIT = 160;
const ECONOMY_EVENT_LIMIT = 240;
const ZONE_HANDOFF_FRESH_MS = 39 * 60 * 1000;
const COACH_CORE_BLOCKS = 6;
const SUPPORT_BLOCKS = 4;
const PROGRAMME_SESSION_TARGET = 20;
const MAX_SESSION_COUNTER = 999;
const TRAINING_HELP_VIDEO_URL = "https://youtu.be/uOncXapT-j4?si=uJBBaXw7M1vtL2jL";
const TRAINING_HELP_ICON_URL = "./assets/help/help-hex-purple.svg";
const COACH_FAMILY_CYCLE = ["flex", "bind", "relate", "resist", "flex", "relate", "bind", "resist", "relate"];
const RELATE_LADDER = ["relate_vectors", "relate_numbers", "relate_vectors_dual", "relate_numbers_dual"];
const TRANSFER_SPRINT_BLOCKS = 3;
const MANUAL_RECOMMENDATION_FAMILIES = ["flex", "bind", "relate", "resist"];
const COUNTDOWN_STEPS = ["3", "2", "1"];
const COUNTDOWN_STEP_MS = 700;

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
  and_cat: { family: "bind", label: "Bind known", target: ["conj"], complexity: 5 },
  and_noncat: { family: "bind", label: "Bind unknown", target: ["conj"], complexity: 6 },
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
let activeBlock = null;
let viewState = {
  leftOpen: false,
  rightOpen: false,
  centerMode: "play",
  message: "Choose coached progression or manual play, then start a block."
};
const timers = { countdown: null, display: null, sequence: null, trial: null };
let touchStart = null;

initAudio({ enabled: state.settings.soundOn, preloadTier: "p0" });

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

  if (target === "conj") {
    const itemName = wrapper === "and_cat" ? "picture-color item" : "shape-color item";
    return `Press MATCH only when the same ${itemName} repeats; location is not the target.`;
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
    return "Press MATCH when the position repeats; ignore color and symbol.";
  }
  if (target === "col") {
    return "Press MATCH when the color repeats; ignore position and symbol.";
  }

  const symbolName = wrapper === "hub_noncat" ? "symbol" : "letter";
  return `Press MATCH when the ${symbolName} repeats; ignore position and color.`;
}

function blockTipModel(plan) {
  return {
    kicker: "Coach tip",
    title: `${wrapperLabel(plan.wrapper)} / ${displayHubTargetLabel(plan.targetModality, plan.wrapper)} / N-${plan.n}`,
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
    || (zone === "in_band" ? "core" : zone === "subcritical" ? "support" : (zone === "locked_in" || zone === "spun_out") ? "recovery" : "support");
  const defaultBlocks = routeClass === "core" ? COACH_CORE_BLOCKS : routeClass === "support" ? SUPPORT_BLOCKS : 0;
  return {
    sessionId: candidate.sessionId || `zone_${timestamp || Date.now()}`,
    sourceKey,
    timestamp,
    freshSameDay: Number.isFinite(timestamp) ? dateKey(timestamp) === dateKey() : false,
    freshForTraining: isFreshZoneTimestamp(timestamp),
    state: zone,
    uiState: zone === "in_band" ? "In the Zone" : zone === "subcritical" ? "Subcritical" : zone === "locked_in" ? "Locked in" : zone === "spun_out" ? "Spun out" : "Unknown",
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

function currentCoachFamilyNumber() {
  return clamp(completedProgrammeSessions() + 1, 1, MAX_SESSION_COUNTER);
}

function clampSessionCounter(value) {
  return clamp(Math.round(Number(value || 0)), 0, MAX_SESSION_COUNTER);
}

function completedProgrammeSessions() {
  return clampSessionCounter(state.programme.coreSessionNumber);
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
  if (activeBlock || state.currentSession) return;
  viewState.centerMode = "play";
  const handoff = readZoneHandoff();
  const routeClass = handoff?.freshForTraining ? handoff.capacityPlan.routeClass : "core";
  if (routeClass === "recovery") {
    viewState.message = "Zone Coach marked this as a recovery route. Use manual light play only after recovery, or re-check first.";
    triggerSfx("invalid_action");
    render();
    return;
  }
  const sessionNumber = currentCoachFamilyNumber();
  const familyId = routeClass === "core" ? familyForCoreSession(sessionNumber) : "flex";
  const plannedBlocks = routeClass === "core"
    ? COACH_CORE_BLOCKS
    : Math.max(1, Math.min(SUPPORT_BLOCKS, handoff?.capacityPlan?.defaultBlocks || SUPPORT_BLOCKS));
  state.currentSession = {
    id: `capv2_${Date.now()}`,
    mode: "coach",
    routeClass,
    rewardMode: routeClass === "core" ? "core" : "support",
    eligibleForEncoding20: routeClass === "core",
    familyId,
    coreSessionNumber: routeClass === "core" ? sessionNumber : null,
    plannedBlocks,
    blocksCompleted: 0,
    zoneState: handoff?.state || "not_checked",
    zoneFresh: handoff?.freshForTraining === true,
    zoneSource: handoff?.sourceKey || null,
    startedAt: Date.now()
  };
  saveState();
  viewState.message = routeClass === "core"
    ? `Coach session ${sessionNumber} is set to ${familyLabel(familyId)}.`
    : "Support route started with safer Flex blocks.";
  triggerSfx("session_start");
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
  if (activeBlock) {
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
  if (state.currentSession && state.currentSession.id === activeBlock.sessionId) {
    state.currentSession.blocksCompleted += 1;
    if (state.currentSession.blocksCompleted >= state.currentSession.plannedBlocks) {
      const completedSession = state.currentSession;
      state.currentSession = null;
      if (completedSession.routeClass === "core") {
        state.programme.coreSessionNumber = Math.max(state.programme.coreSessionNumber, completedSession.coreSessionNumber || state.programme.coreSessionNumber + 1);
      }
      saveState();
      programmeBonus = maybeAwardProgrammeBonus(completedSession);
    }
  }
  saveState();
  activeBlock = null;
  viewState.message = `${wrapperLabel(entry.wrapper)} saved: ${percent(entry.block.accuracy)} accuracy, Far Transfer Score ${formatScorePercent(transferScore.total)}, +${blockG} g plasticity cells.`;
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

function renderHud() {
  const model = hudModel();
  return `
    <div class="hud" aria-label="Capacity block status">
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

function shouldShowCoachCallout() {
  return !activeBlock && viewState.centerMode !== "stats";
}

function coachCalloutModel() {
  return blockTipModel(displayPlanForHud());
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
      <div class="stats-bars">
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
    </div>
  `;
}

function renderZoneCoachPanel() {
  const handoff = readZoneHandoff();
  const routeLabel = handoff?.freshForTraining
    ? `${handoff.uiState} / ${handoff.capacityPlan.routeClass}`
    : "No fresh Zone handoff";
  return `
    <section class="panel">
      <div class="notice">${escapeHtml(routeLabel)}</div>
      ${renderZoneCoachGraphic(handoff)}
      ${handoff?.freshForTraining ? `<p class="small muted">Source: ${escapeHtml(handoff.sourceKey)}</p>` : ""}
    </section>
  `;
}

function renderZoneCoachGraphic(handoff) {
  const activeZone = handoff?.freshForTraining ? handoff.state : null;
  const label = activeZone ? `${handoff.uiState} highlighted` : "No recent Zone Coach designation highlighted";
  const activeClass = (zone) => activeZone === zone ? " is-active" : "";
  return `
    <div class="zone-flow-graphic" role="img" aria-label="${escapeHtml(label)}">
      <svg viewBox="0 0 360 210" focusable="false" aria-hidden="true">
        <path class="zone-flow-line" d="M12 105H78" />
        <path class="zone-flow-line" d="M122 105H154" />
        <path class="zone-flow-line" d="M198 105H306" />
        <polygon class="zone-flow-arrow" points="306,82 354,105 306,128" />
        <path class="zone-flow-line" d="M188 88L214 46H274" />
        <polygon class="zone-flow-arrow" points="274,23 322,46 274,69" />
        <path class="zone-flow-line" d="M188 122L214 164H274" />
        <polygon class="zone-flow-arrow" points="274,141 322,164 274,187" />
        <g class="zone-node-group${activeClass("subcritical")}">
          <circle class="zone-node" cx="100" cy="105" r="23" />
          <circle class="zone-node-hole" cx="100" cy="105" r="9" />
        </g>
        <g class="zone-node-group${activeClass("in_band")}">
          <circle class="zone-node" cx="176" cy="105" r="23" />
          <circle class="zone-node-hole" cx="176" cy="105" r="9" />
        </g>
        <g class="zone-node-group${activeClass("locked_in")}">
          <circle class="zone-node" cx="216" cy="46" r="23" />
          <circle class="zone-node-hole" cx="216" cy="46" r="9" />
        </g>
        <g class="zone-node-group${activeClass("spun_out")}">
          <circle class="zone-node" cx="216" cy="164" r="23" />
          <circle class="zone-node-hole" cx="216" cy="164" r="9" />
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
      <div class="mode-toggle" role="group" aria-label="Training mode">
        <button class="chip-btn${state.settings.mode === "coach" ? " is-active" : ""}" type="button" data-action="set-mode" data-mode="coach">Coach-led</button>
        <button class="chip-btn${state.settings.mode === "manual" ? " is-active" : ""}" type="button" data-action="set-mode" data-mode="manual">Manual</button>
      </div>
    </section>
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
          const sessionNo = state.programme.coreSessionNumber + index + 1;
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

function renderLeftStrip() {
  return `
    <aside class="strip strip-left" aria-label="Coach and setup strip">
      <div class="strip-inner">
        <div class="strip-head">
          <div>
            <h2 class="strip-title">Zone Coach</h2>
          </div>
          <button class="sheet-close" type="button" data-action="close-sheets" aria-label="Close sheet">x</button>
        </div>
        ${renderZoneCoachPanel()}
        ${renderModePanel()}
        ${state.settings.mode === "manual" ? renderManualPanel() : ""}
        ${state.settings.mode === "manual" ? "" : renderCoachCycle()}
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
              <div class="stat"><span class="mini-label">Label</span><strong>${score ? score.label : "--"}</strong></div>
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
      </div>
    </aside>
  `;
}

function renderPlayControls() {
  const coachSession = activeCoachSession();
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
      ${coachSession ? `<button class="btn btn-primary" type="button" data-action="start-block" ${activeBlock ? "disabled" : ""}>Start next block</button>` : ""}
      ${state.settings.mode === "manual" ? `<button class="btn btn-primary" type="button" data-action="start-block" ${activeBlock ? "disabled" : ""}>Start manual block</button>` : ""}
      ${state.settings.mode === "coach" && !state.currentSession ? `<button class="btn btn-dark" type="button" data-action="start-coach-session" ${activeBlock ? "disabled" : ""}>Start coach session</button>` : ""}
    </div>
  `;
}

function renderPlayCard() {
  const showingStats = viewState.centerMode === "stats" && !activeBlock;
  return `
    <section class="play-card" aria-label="Capacity play surface">
      <div class="mobile-topbar">
        <button class="btn btn-ghost" type="button" data-action="open-left">Coach</button>
        <button class="btn btn-ghost" type="button" data-action="open-right">Stats</button>
      </div>
      ${renderHud()}
      <div class="play-body${showingStats ? " is-stats" : ""}">
        <div class="arena-shell${showingStats ? " is-stats" : ""}">
          ${showingStats ? renderCenterStatsDashboard() : `${arenaMarkup()}${renderCoachCallout()}`}
        </div>
        <div class="play-controls">${renderPlayControls()}</div>
      </div>
    </section>
  `;
}

function render() {
  const classes = ["gym-layout", viewState.leftOpen ? "is-left-open" : "", viewState.rightOpen ? "is-right-open" : ""].filter(Boolean).join(" ");
  appRoot.innerHTML = `
    <div class="${classes}">
      <button class="sheet-backdrop" type="button" data-action="close-sheets" aria-label="Close sheet"></button>
      ${renderLeftStrip()}
      ${renderPlayCard()}
      ${renderRightStrip()}
    </div>
  `;
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
  saveState();
  viewState.centerMode = "play";
  viewState.message = "Session count and session stats reset. Wallet credits and settings are unchanged.";
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
  if (action === "open-left") {
    if (activeBlock?.status === "trial" || activeBlock?.status === "countdown") return;
    triggerSfx("ui_tap_soft");
    viewState.leftOpen = true;
    viewState.rightOpen = false;
    render();
    return;
  }
  if (action === "open-right") {
    if (activeBlock?.status === "trial" || activeBlock?.status === "countdown") return;
    triggerSfx("ui_tap_soft");
    viewState.rightOpen = true;
    viewState.leftOpen = false;
    render();
    return;
  }
  if (action === "show-stats") {
    if (activeBlock) return;
    triggerSfx("ui_tap_soft");
    viewState.centerMode = "stats";
    viewState.leftOpen = false;
    viewState.rightOpen = false;
    render();
    return;
  }
  if (action === "show-play") {
    triggerSfx("ui_tap_soft");
    viewState.centerMode = "play";
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
  if (action === "set-mode") {
    triggerSfx("ui_tap_soft");
    state.settings.mode = target.getAttribute("data-mode") === "manual" ? "manual" : "coach";
    saveState();
    render();
    return;
  }
  if (action === "start-coach-session") {
    beginCoachSession();
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
  const field = target.getAttribute("data-field");
  if (!field || activeBlock) return;
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
  if (!touchStart || activeBlock?.status === "trial" || activeBlock?.status === "countdown") {
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
