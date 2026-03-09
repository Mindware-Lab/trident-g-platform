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
import {
  EMO_BASE_TRIALS,
  EMO_CUE_MS,
  EMO_MODES,
  EMO_N_MAX,
  EMO_TOTAL_BLOCKS,
  createEmotionBlockPlan,
  createEmotionBlockTrials,
  createEmotionSessionSummary,
  emotionModeLabel,
  emotionModeTarget,
  isEmotionMatchAtIndex,
  summarizeEmotionBlock
} from "./games/emotion.js";
import { hash32 } from "./lib/rng.js";
import { coachUpdateAfterBlock, relationalCoachUpdateAfterBlock } from "./lib/coach.js";
import {
  applyEmotionTransferOutcome,
  applyZoneToEmotionProgression,
  applyHubTransferOutcome,
  applyZoneToProgression,
  computeEmotionSessionStyle,
  computeHubSessionStyle,
  describeSessionStyle,
  formatRemainingDuration,
  normalizeEmotionProgression,
  normalizeProgression,
  otherHubWrapper,
  readZoneHandoffFromStorage
} from "./lib/progression.js";
import { transitiveMode } from "./games/transitive.js";
import { graphMode } from "./games/graph.js";
import { propositionalMode } from "./games/propositional.js";
import {
  initAudio,
  unlockAudioContextFromUserGesture,
  setAudioEnabled,
  playSfx
} from "./lib/audio.js";
import { loadEmotionAssets, preloadEmotionImages } from "./lib/emotion-assets.js";
import { resolvePrimaryScreen } from "./ui/screen-coordinator.js";
import { renderPrimaryScreen } from "./ui/screens.js";
import { buildShellViewModel } from "./ui/view-models.js";

const TEMP_RELATIONAL_UNLOCK_FOR_INSPECTION = false;
const ROUTES = new Set(["home", "play-hub", "play-emotion", "play-relational", "history", "settings"]);
const DEFAULT_ROUTE = "home";
const appRoot = document.querySelector("#app");
const initialState = loadStateWithSyncedUnlocks();
const initialSettings = initialState.settings;
initAudio({
  enabled: Boolean(initialSettings.soundOn),
  preloadTier: "p0"
});

const hubPreferences = {
  wrapper: initialSettings.lastWrapper === "hub_noncat" ? "hub_noncat" : "hub_cat",
  speed: initialSettings.lastSpeed === "fast" ? "fast" : "slow",
  interference: initialSettings.lastInterference === "high" ? "high" : "low"
};
const emotionPreferences = {
  mode: EMO_MODES.includes(initialSettings.lastEmotionMode) ? initialSettings.lastEmotionMode : "emo_loc",
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
let emotionSession = null;
let relSession = null;
let helpGraphicsPreloadScheduled = false;
const helpGraphicsPreloadedPaths = new Set();
const helpGraphicsPreloadRefs = [];
const helpGraphicPreloadLinks = new Set();
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
const emotionTimers = {
  cue: null,
  display: null,
  trial: null
};
const relTimers = {
  cue: null,
  display: null,
  trial: null,
  quizTimeout: null,
  quizTimeoutFrame: null,
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
  SPIKE_TUNE: "Probe game block scheduled",
  CONSOLIDATE: "Consolidation block scheduled"
});
const COACH_BRIEFING_COPY = Object.freeze({
  RECOVER: "Next: Recovery block",
  STABILISE: "Next: Stabilise block",
  TUNE: "Next: Targeted challenge pulse",
  SPIKE_TUNE: "Next: Probe game block",
  CONSOLIDATE: "Next: Consolidation block"
});
const HELP_ICON_PATH = "../brandingUI/icons/status/help-information.svg";
const HUB_MATCH_EXAMPLE_IMAGES = Object.freeze([
  Object.freeze({
    path: "./help-graphics/hub-colour-1back-match.svg",
    alt: "Two displays showing a colour 1-back match.",
    label: "COLOUR 1-back match"
  }),
  Object.freeze({
    path: "./help-graphics/hub-colour-2back-match.svg",
    alt: "Three displays showing a colour 2-back match.",
    label: "COLOUR 2-back match"
  }),
  Object.freeze({
    path: "./help-graphics/hub-location-1back-match.svg",
    alt: "Two displays showing a location 1-back match.",
    label: "LOCATION 1-back match"
  }),
  Object.freeze({
    path: "./help-graphics/hub-location-2back-match.svg",
    alt: "Three displays showing a location 2-back match.",
    label: "LOCATION 2-back match"
  })
]);
const HUB_NONCAT_MATCH_EXAMPLE_IMAGES = Object.freeze([
  Object.freeze({
    path: "./help-graphics/hub-noncat-colour-1back-match.svg",
    alt: "Two displays showing a non-categorical colour 1-back match.",
    label: "COLOUR 1-back match"
  }),
  Object.freeze({
    path: "./help-graphics/hub-noncat-colour-2back-match.svg",
    alt: "Three displays showing a non-categorical colour 2-back match.",
    label: "COLOUR 2-back match"
  }),
  Object.freeze({
    path: "./help-graphics/hub-noncat-location-1back-match.svg",
    alt: "Two displays showing a non-categorical location 1-back match.",
    label: "LOCATION 1-back match"
  }),
  Object.freeze({
    path: "./help-graphics/hub-noncat-location-2back-match.svg",
    alt: "Three displays showing a non-categorical location 2-back match.",
    label: "LOCATION 2-back match"
  })
]);
const EMOTION_MATCH_EXAMPLE_IMAGES = Object.freeze([
  Object.freeze({
    path: "./help-graphics/emotion-colour-1back-match.svg",
    alt: "Two emotional displays showing a colour 1-back match.",
    label: "COLOUR 1-back match"
  }),
  Object.freeze({
    path: "./help-graphics/emotion-colour-2back-match.svg",
    alt: "Three emotional displays showing a colour 2-back match.",
    label: "COLOUR 2-back match"
  }),
  Object.freeze({
    path: "./help-graphics/emotion-location-1back-match.svg",
    alt: "Two emotional displays showing a location 1-back match.",
    label: "LOCATION 1-back match"
  }),
  Object.freeze({
    path: "./help-graphics/emotion-location-2back-match.svg",
    alt: "Three emotional displays showing a location 2-back match.",
    label: "LOCATION 2-back match"
  })
]);
const REL_PROPOSITIONAL_MATCH_EXAMPLES = Object.freeze([
  Object.freeze({
    path: "./help-graphics/rel-propositional-1back-match.svg",
    alt: "Two displays showing a propositional 1-back match with different surface notation.",
    label: "Propositional 1-back match"
  }),
  Object.freeze({
    path: "./help-graphics/rel-propositional-2back-match.svg",
    alt: "Three displays showing a propositional 2-back match with different surface notation.",
    label: "Propositional 2-back match"
  })
]);
const REL_GRAPH_MATCH_EXAMPLES = Object.freeze([
  Object.freeze({
    path: "./help-graphics/rel-graph-1back-match.svg",
    alt: "Two displays showing a graph 1-back directed-edge match.",
    label: "Graph 1-back match"
  }),
  Object.freeze({
    path: "./help-graphics/rel-graph-2back-match.svg",
    alt: "Three displays showing a graph 2-back directed-edge match.",
    label: "Graph 2-back match"
  })
]);
const REL_TRANSITIVE_MATCH_EXAMPLES = Object.freeze([
  Object.freeze({
    path: "./help-graphics/rel-transitive-1back-match.svg",
    alt: "Two displays showing a transitive 1-back match with alternate surface form.",
    label: "Transitive 1-back match"
  }),
  Object.freeze({
    path: "./help-graphics/rel-transitive-2back-match.svg",
    alt: "Three displays showing a transitive 2-back match with alternate surface form.",
    label: "Transitive 2-back match"
  })
]);
const HELP_TOPICS = Object.freeze({
  "hub-cat-how": {
    title: "How to Play: Hub Categorical",
    images: HUB_MATCH_EXAMPLE_IMAGES,
    lines: [
      "There are 3 features in each display: location, colour, and letter. Keep track of the cued feature.",
      "Press MATCH (or Space) only when the target repeats at n-back. A 1-back and 2-back match (for two different features) are shown above. Depending on performance, your N-back level could be 3, 4 or higher.",
      "Ignore non-target changes, and do not tap on non-matches.",
      "Relational unlock also requires a stable Emotional dual session after qualifying both Hub games."
    ]
  },
  "hub-noncat-how": {
    title: "How to Play: Hub Non-Categorical",
    images: HUB_NONCAT_MATCH_EXAMPLE_IMAGES,
    lines: [
      "There are 3 features in each display: location, colour, and symbol. Keep track of the cued feature.",
      "Press MATCH (or Space) only when the feature repeats at n-back. A 1-back and 2-back match (for two different features) are shown above. Depending on performance, your N-back level could be 3, 4 or higher.",
      "Ignore non-target changes, and do not tap on non-matches.",
      "Relational unlock also requires a stable Emotional dual session after qualifying both Hub games."
    ]
  },
  "rel-transitive-how": {
    title: "How to Play: Transitive",
    images: REL_TRANSITIVE_MATCH_EXAMPLES,
    lines: [
      "Press MATCH when the same underlying relation repeats at n-back.",
      "Surface wording can change (A > B and B < A can be the same relation).",
      "After the stream: 2 timed True/False quiz items.",
      "Quiz answers must follow from the block premise model.",
      "Examples above show 1-back and 2-back match patterns."
    ]
  },
  "rel-graph-how": {
    title: "How to Play: Graph",
    images: REL_GRAPH_MATCH_EXAMPLES,
    lines: [
      "Press MATCH when the same directed edge repeats at n-back.",
      "Node positions can move, but edge direction defines meaning.",
      "After the stream: 2 timed True/False quiz items.",
      "Quiz checks whether a directed path exists in exactly 2 steps.",
      "Examples above show 1-back and 2-back match patterns."
    ]
  },
  "rel-propositional-how": {
    title: "How to Play: Propositional",
    images: REL_PROPOSITIONAL_MATCH_EXAMPLES,
    lines: [
      "Press MATCH when the same canonical premise repeats at n-back.",
      "Surface can be symbolic or verbal while meaning stays fixed.",
      "After the stream: 2 timed True/False quiz items.",
      "Use session premises to decide if each quiz statement is true.",
      "Examples above show 1-back and 2-back match patterns."
    ]
  },
  "hub-metrics": {
    title: "Block Stats",
    lines: [
      "Hits = correct MATCH taps.",
      "Misses = times a MATCH was expected but not tapped.",
      "Extra taps = taps when no MATCH was present.",
      "Correct skips = correct no-tap moments."
    ]
  },
  "emotion-how": {
    title: "How to Play: Emotional N-Back",
    images: EMOTION_MATCH_EXAMPLE_IMAGES,
    links: [
      {
        label: "Watch explainer video (classic dual n-back)",
        href: "https://youtu.be/fE4Z0vuj_As?si=mLbE_EJlEsqyuXup"
      }
    ],
    lines: [
      "Faces move around 4 ring locations; words stream in the center.",
      "Track location or colour in mono mode, or both in dual mode.",
      "Ignore expression and word meaning unless the current target requires it.",
      "Touch: LOCATION MATCH and COLOUR MATCH buttons.",
      "Keyboard: Left Arrow = LOCATION MATCH, Right Arrow = COLOUR MATCH.",
      "Coach recommends when to stay, speed up, add interference, or switch games."
    ]
  },
  "training-progression": {
    title: "How to Progress Through Training",
    imagePath: "./help-graphics/training-progression-flow.svg",
    imageAlt: "Flow diagram showing start choice, coach guidance, transfer checks, and unlock gates.",
    lines: [
      "Goal: build capacity that transfers across games, not just one-game score gains."
    ],
    sections: [
      {
        heading: "1) Start Choice",
        points: [
          "You can start with Hub (category), Hub (non-categorical), or Emotional DNB.",
          "Use Start Recommended Session when possible for the best progression path."
        ]
      },
      {
        heading: "2) Coach Guidance For Far Transfer",
        points: [
          "Coach may keep you in one game for a short run, then suggest a switch to test transfer.",
          "Coach adjusts speed/interference and schedules swap checks when performance plateaus in-band.",
          "Zone gate controls load: too hot = reset, stale/unclear/too cold = stabilise, in-band = tune/explore/probe/recheck."
        ]
      },
      {
        heading: "3) Banking Rules",
        points: [
          "Training Bank = immediate points for block performance (+2 UP, +1 HOLD).",
          "Transfer Bank = strict durability evidence only.",
          "Transfer Bank requires Probe pass (block 4 swap + block 5 return) and Later Check pass after at least 24 hours."
        ]
      },
      {
        heading: "4) Unlock Sequence",
        points: [
          "Emotional Dual unlock: first pass BOTH Emotional Location and Emotional Colour mono competence.",
          "Mono competence: final level >=2-back and 3 stable blocks at >=2-back (>=75% accuracy).",
          "Relational unlock: Hub category + Hub non-categorical + Emotional dual competence.",
          "Hub competence: final level >=3-back and 3 stable blocks at >=3-back (>=75% accuracy).",
          "Emotional dual competence: final level >=2-back and 3 stable dual blocks at >=2-back (both dimensions >=75%)."
        ]
      }
    ]
  },
  "rel-metrics": {
    title: "Relational Stats",
    lines: [
      "Hits/Misses track MATCH timing during stream trials.",
      "Quiz score is your reasoning check after each block.",
      "Level moves up with strong accuracy and holds when stable."
    ]
  }
});
const UI_TAP_ACTIONS = new Set([
  "go-home",
  "go-play-hub",
  "go-play-emotion",
  "go-play-relational",
  "go-history",
  "go-settings",
  "show-help",
  "help-close",
  "hub-next-block",
  "rel-next-block",
  "start-hub-session",
  "start-emotion-session",
  "start-relational-session",
  "emotion-start-block",
  "emotion-next-block",
  "emotion-match-loc",
  "emotion-match-col",
  "emotion-toggle-pause",
  "emotion-stop-session",
  "import-zone-handoff",
  "unlock-go-relational",
  "unlock-close"
]);
const uiTimers = {
  splash: null
};
const uiState = {
  showSplash: true,
  splashDismissed: false,
  activeOverlay: "none",
  overlayCanTapDismiss: false,
  pendingUnlockCelebration: false,
  helpTopic: null
};
let audioFullPreloadRequested = false;
let emotionAssetsCache = null;

function collectTopicGraphicPaths(topic) {
  if (!topic || typeof topic !== "object") {
    return [];
  }
  const paths = [];
  if (Array.isArray(topic.images)) {
    for (let i = 0; i < topic.images.length; i += 1) {
      const path = topic.images[i]?.path;
      if (typeof path === "string" && path.trim()) {
        paths.push(path.trim());
      }
    }
  }
  if (typeof topic.imagePath === "string" && topic.imagePath.trim()) {
    paths.push(topic.imagePath.trim());
  }
  return paths;
}

function injectHelpGraphicPreloadLink(path, priority = "auto") {
  if (
    typeof path !== "string" ||
    !path ||
    helpGraphicPreloadLinks.has(path) ||
    typeof document === "undefined" ||
    !document.head
  ) {
    return;
  }
  helpGraphicPreloadLinks.add(path);
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = path;
  if (priority === "high") {
    link.fetchPriority = "high";
  }
  document.head.appendChild(link);
}

function preloadHelpGraphicPath(path, priority = "auto") {
  if (typeof path !== "string" || !path) {
    return;
  }
  const normalized = path.trim();
  if (!normalized) {
    return;
  }
  injectHelpGraphicPreloadLink(normalized, priority);
  if (helpGraphicsPreloadedPaths.has(normalized)) {
    return;
  }
  helpGraphicsPreloadedPaths.add(normalized);
  const img = new Image();
  img.decoding = "async";
  img.loading = "eager";
  if (priority === "high") {
    img.fetchPriority = "high";
  }
  img.src = normalized;
  if (typeof img.decode === "function") {
    img.decode().catch(() => {});
  }
  helpGraphicsPreloadRefs.push(img);
  if (helpGraphicsPreloadRefs.length > 48) {
    helpGraphicsPreloadRefs.splice(0, helpGraphicsPreloadRefs.length - 48);
  }
}

function preloadHelpGraphicsForTopic(topicId, priority = "auto") {
  if (!topicId || !HELP_TOPICS[topicId]) {
    return;
  }
  const paths = collectTopicGraphicPaths(HELP_TOPICS[topicId]);
  for (let i = 0; i < paths.length; i += 1) {
    preloadHelpGraphicPath(paths[i], priority);
  }
}

function preloadCriticalHelpGraphics() {
  const priorityTopics = [
    "rel-transitive-how",
    "rel-graph-how",
    "rel-propositional-how"
  ];
  for (let i = 0; i < priorityTopics.length; i += 1) {
    preloadHelpGraphicsForTopic(priorityTopics[i], "high");
  }
}

function scheduleHelpGraphicsPreload() {
  if (helpGraphicsPreloadScheduled) {
    return;
  }
  helpGraphicsPreloadScheduled = true;
  preloadCriticalHelpGraphics();
  const run = () => {
    const allPaths = [];
    for (const topic of Object.values(HELP_TOPICS)) {
      allPaths.push(...collectTopicGraphicPaths(topic));
    }
    allPaths.forEach((path) => preloadHelpGraphicPath(path));
  };
  window.setTimeout(run, 120);
}

scheduleHelpGraphicsPreload();

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

function getProgressionState(state) {
  return normalizeProgression(state?.progression);
}

function getEmotionProgressionState(state) {
  return normalizeEmotionProgression(state?.emotionProgression);
}

function getSavedZoneForNow(state, nowTs = Date.now(), track = "hub") {
  const progression = track === "emotion"
    ? getEmotionProgressionState(state)
    : getProgressionState(state);
  const zone = progression.lastZone && typeof progression.lastZone === "object"
    ? progression.lastZone
    : null;
  if (!zone) {
    return null;
  }
  const zoneDay = Number.isFinite(zone.timestamp) ? toDateKeyLocal(zone.timestamp) : null;
  const nowDay = toDateKeyLocal(nowTs);
  return {
    ...zone,
    freshSameDay: Boolean(zoneDay && zoneDay === nowDay)
  };
}

function buildZoneStatusCopy(zone) {
  if (!zone) {
    return {
      title: "No Zone result imported",
      detail: "Run Zone Coach and import the latest result in Settings."
    };
  }
  const freshness = zone.freshSameDay ? "Fresh today" : "Stale";
  if (zone.zone === "in_band") {
    const detail = zone.freshSameDay
      ? "Ready for normal progression."
      : "Zone result is from a previous day. Import a fresh Zone check to unlock normal progression.";
    return {
      title: `In-band (${freshness})`,
      detail
    };
  }
  if (zone.zone === "too_hot") {
    return {
      title: `Out of band: overloaded (${freshness})`,
      detail: "Use reset settings and avoid transfer checks today."
    };
  }
  if (zone.zone === "too_cold") {
    return {
      title: `Out of band: underpowered (${freshness})`,
      detail: "Use stabilise settings before high challenge."
    };
  }
  return {
    title: `Zone unclear (${freshness})`,
    detail: "Fallback to stabilise settings until a clear Zone result is imported."
  };
}

function getHubStyleDecision(state, nowTs = Date.now()) {
  const progression = getProgressionState(state);
  const zone = getSavedZoneForNow(state, nowTs);
  return computeHubSessionStyle({
    history: Array.isArray(state?.history) ? state.history : [],
    progression,
    zoneHandoff: zone,
    nowTs
  });
}

function getEmotionStyleDecision(state, nowTs = Date.now()) {
  const progression = getEmotionProgressionState(state);
  const zone = getSavedZoneForNow(state, nowTs, "emotion");
  return computeEmotionSessionStyle({
    history: Array.isArray(state?.history) ? state.history : [],
    progression,
    zoneHandoff: zone,
    nowTs
  });
}

function recentCapacitySessions(historyRaw) {
  const history = Array.isArray(historyRaw) ? historyRaw : [];
  return history.filter((entry) => entry?.wrapperFamily === "hub" || entry?.wrapperFamily === "emotion");
}

function countConsecutiveFamily(historyRaw, family) {
  const history = recentCapacitySessions(historyRaw);
  let count = 0;
  for (let i = 0; i < history.length; i += 1) {
    if (history[i]?.wrapperFamily !== family) {
      break;
    }
    count += 1;
  }
  return count;
}

function getCoachCapacityRecommendation(state) {
  const history = recentCapacitySessions(state?.history);
  const lastFamily = history.length ? history[0]?.wrapperFamily : null;
  const hubStyle = getHubStyleDecision(state);
  const emotionStyle = getEmotionStyleDecision(state);
  const persistWindow = 3;

  if (lastFamily === "hub") {
    const streak = countConsecutiveFamily(state?.history, "hub");
    if (streak > 0 && streak < persistWindow) {
      return {
        family: "hub",
        routeAction: "go-play-hub",
        label: "Hub",
        reason: `Coach recommends: stay with Hub for session ${streak + 1}/${persistWindow}.`
      };
    }
    if (hubStyle.style === "EXPLORE") {
      return {
        family: "emotion",
        routeAction: "go-play-emotion",
        label: "Emotional",
        reason: "Coach recommends: switch to Emotional to test transfer after Hub plateau."
      };
    }
    return {
      family: "hub",
      routeAction: "go-play-hub",
      label: "Hub",
      reason: "Coach recommends: continue Hub progression."
    };
  }

  if (lastFamily === "emotion") {
    const streak = countConsecutiveFamily(state?.history, "emotion");
    if (streak > 0 && streak < persistWindow) {
      return {
        family: "emotion",
        routeAction: "go-play-emotion",
        label: "Emotional",
        reason: `Coach recommends: stay with Emotional for session ${streak + 1}/${persistWindow}.`
      };
    }
    if (emotionStyle.style === "EXPLORE") {
      return {
        family: "hub",
        routeAction: "go-play-hub",
        label: "Hub",
        reason: "Coach recommends: switch to Hub to test transfer after Emotional plateau."
      };
    }
    return {
      family: "emotion",
      routeAction: "go-play-emotion",
      label: "Emotional",
      reason: "Coach recommends: continue Emotional progression."
    };
  }

  return {
    family: "hub",
    routeAction: "go-play-hub",
    label: "Hub",
    reason: "Coach recommends: start with Hub baseline."
  };
}

function renderSessionStyleBadge(style) {
  const styleCopy = describeSessionStyle(style);
  return `
    <span class="session-style-pill" aria-label="Session style">
      <strong>${escapeHtml(styleCopy.shortLabel)}</strong>
      <span>${escapeHtml(styleCopy.label)}</span>
    </span>
  `;
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

function getEmotionSessionBaselineMode(session) {
  const mode = session?.emotionalMode || session?.blocksPlanned?.[0]?.mode || session?.blocksPlanned?.[0]?.wrapper;
  if (mode === "emo_col") {
    return "emo_col";
  }
  if (mode === "emo_dual") {
    return "emo_dual";
  }
  return "emo_loc";
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
  let emoLocQualified = false;
  let emoColQualified = false;
  let emoDualQualified = false;
  for (let i = 0; i < safeHistory.length; i += 1) {
    const session = safeHistory[i];
    if (!catQualified && isQualifyingWrapperSession(session, "hub_cat")) {
      catQualified = true;
    }
    if (!noncatQualified && isQualifyingWrapperSession(session, "hub_noncat")) {
      noncatQualified = true;
    }
    if (!emoLocQualified && isQualifyingEmotionMonoSession(session, "emo_loc")) {
      emoLocQualified = true;
    }
    if (!emoColQualified && isQualifyingEmotionMonoSession(session, "emo_col")) {
      emoColQualified = true;
    }
    if (!emoDualQualified && isQualifyingEmotionDualSession(session)) {
      emoDualQualified = true;
    }
    if (catQualified && noncatQualified && emoLocQualified && emoColQualified && emoDualQualified) {
      break;
    }
  }
  const unlockOverrideActive = TEMP_RELATIONAL_UNLOCK_FOR_INSPECTION === true;
  const emotionDualUnlocked = emoLocQualified && emoColQualified;
  const relationalUnlockedByCriteria = catQualified && noncatQualified && emoDualQualified;
  return {
    catQualified,
    noncatQualified,
    emoLocQualified,
    emoColQualified,
    emoDualQualified,
    emotionDualUnlocked,
    unlockOverrideActive,
    relationalUnlocked: unlockOverrideActive || relationalUnlockedByCriteria
  };
}

function isQualifyingEmotionMonoSession(session, mode) {
  if (!session || session.wrapperFamily !== "emotion") {
    return false;
  }
  if (getEmotionSessionBaselineMode(session) !== mode) {
    return false;
  }
  const safeBlocks = Array.isArray(session.blocks) ? session.blocks : [];
  const modeBlocks = safeBlocks.filter((block) => block?.mode === mode);
  if (!modeBlocks.length) {
    return false;
  }
  const final = modeBlocks[modeBlocks.length - 1];
  if (!final || Number(final.nEnd || 0) < 2) {
    return false;
  }
  let stableCount = 0;
  for (let i = 0; i < modeBlocks.length; i += 1) {
    const block = modeBlocks[i];
    if (Number(block?.nStart || 0) < 2) {
      continue;
    }
    if (Number(block?.accuracy || 0) >= 0.75) {
      stableCount += 1;
    }
  }
  return stableCount >= 3;
}

function isQualifyingEmotionDualSession(session) {
  if (!session || session.wrapperFamily !== "emotion") {
    return false;
  }
  if (getEmotionSessionBaselineMode(session) !== "emo_dual") {
    return false;
  }
  const safeBlocks = Array.isArray(session.blocks) ? session.blocks : [];
  const dualBlocks = safeBlocks.filter((block) => block?.mode === "emo_dual");
  if (!dualBlocks.length) {
    return false;
  }
  const final = dualBlocks[dualBlocks.length - 1];
  if (!final || Number(final.nEnd || 0) < 2) {
    return false;
  }
  let stableCount = 0;
  for (let i = 0; i < dualBlocks.length; i += 1) {
    const block = dualBlocks[i];
    if (Number(block?.nStart || 0) < 2) {
      continue;
    }
    if (Number(block?.accuracyLoc || 0) >= 0.75 && Number(block?.accuracyCol || 0) >= 0.75) {
      stableCount += 1;
    }
  }
  return stableCount >= 3;
}

function syncRelationalUnlockFlags(state) {
  const unlockProgress = deriveRelationalUnlockProgress(state?.history);
  const nextUnlockValue = unlockProgress.relationalUnlocked;
  const unlocks = {
    ...(state?.unlocks || {}),
    emotionDual: Boolean(unlockProgress.emotionDualUnlocked),
    transitive: nextUnlockValue,
    graph: nextUnlockValue,
    propositional: nextUnlockValue
  };
  const changed = !state?.unlocks
    || state.unlocks.emotionDual !== unlocks.emotionDual
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

function importLatestZoneHandoffToGymState() {
  const nowTs = Date.now();
  const handoff = readZoneHandoffFromStorage(nowTs);
  if (!handoff) {
    setFlash("No Zone result found. Run Zone Coach first, then import here.", "warn");
    return false;
  }
  const state = loadGymState();
  const progression = applyZoneToProgression(state.progression, handoff);
  const emotionProgression = applyZoneToEmotionProgression(state.emotionProgression, handoff);
  saveGymState({
    ...state,
    progression,
    emotionProgression
  });
  const zoneCopy = buildZoneStatusCopy(handoff);
  if (handoff.freshSameDay) {
    setFlash(`Zone result imported: ${zoneCopy.title}.`, "success");
  } else {
    setFlash(`Zone result imported but stale: ${zoneCopy.title}. Run Zone Coach again today for full gating.`, "warn");
  }
  return true;
}

function applySessionProgressAndSave(summary, family, options = {}) {
  const dateKey = toDateKeyLocal(summary?.tsEnd || Date.now());
  let state = loadGymState();
  const synced = syncRelationalUnlockFlags(state);
  state = synced.state;
  const unlockProgress = synced.unlockProgress;

  const ensured = ensureMissionForDate(state, dateKey, unlockProgress);
  state = ensured.state;
  let mission = ensured.mission;
  const missionWasComplete = isMissionComplete(mission);

  if (family === "hub" || family === "emotion") {
    mission = markMissionStep(mission, "control");
  } else if (family === "relational" && mission.tier === "tier1") {
    mission = markMissionStep(mission, "reason");
  }

  const sessionUnitsEarned = computeSessionUnits(summary?.blocks || []);
  let bankUnits = Number(state.bankUnits || 0) + sessionUnitsEarned;
  let transferBankUnits = Number(state.transferBankUnits || 0);
  let progression = getProgressionState(state);
  let emotionProgression = getEmotionProgressionState(state);
  const rewardOutcome = maybeAwardMissionReward(mission, bankUnits);
  mission = rewardOutcome.mission;
  bankUnits = rewardOutcome.bankUnits;
  const missionNowComplete = isMissionComplete(mission);
  const missionJustCompleted = !missionWasComplete && missionNowComplete;

  let transferBankDelta = 0;
  let transferEvidence = {
    status: "not_counted",
    title: "Transfer check not counted",
    detail: "This session focused on standard training."
  };
  if (family === "hub") {
    const precomputed = options?.hubTransferOutcome && typeof options.hubTransferOutcome === "object"
      ? options.hubTransferOutcome
      : null;
    const transferOutcome = precomputed || applyHubTransferOutcome({
      progression,
      summary,
      sessionStyle: summary?.sessionStyle || null,
      nowTs: Number(summary?.tsEnd || Date.now())
    });
    progression = transferOutcome.progression;
    progression.hubSessionIndex = Math.max(0, Number(progression.hubSessionIndex || 0)) + 1;
    transferBankDelta = Number(transferOutcome.transferDelta || 0);
    transferEvidence = transferOutcome.transferEvidence || transferEvidence;
    transferBankUnits += transferBankDelta;
  } else if (family === "emotion") {
    const precomputed = options?.emotionTransferOutcome && typeof options.emotionTransferOutcome === "object"
      ? options.emotionTransferOutcome
      : null;
    const transferOutcome = precomputed || applyEmotionTransferOutcome({
      progression: emotionProgression,
      summary,
      sessionStyle: summary?.sessionStyle || null,
      nowTs: Number(summary?.tsEnd || Date.now())
    });
    emotionProgression = transferOutcome.progression;
    emotionProgression.emotionSessionIndex = Math.max(0, Number(emotionProgression.emotionSessionIndex || 0)) + 1;
    transferBankDelta = Number(transferOutcome.transferDelta || 0);
    transferEvidence = transferOutcome.transferEvidence || transferEvidence;
    transferBankUnits += transferBankDelta;
  }

  const nextSettings = applyMissionStreakOnCompletion(state.settings, dateKey, missionJustCompleted);
  const nextState = {
    ...state,
    bankUnits,
    transferBankUnits,
    progression,
    emotionProgression,
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
    transferBankDelta,
    transferBankTotal: transferBankUnits,
    transferEvidence,
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

function openHelpOverlay(topic) {
  if (!topic || !HELP_TOPICS[topic]) {
    return;
  }
  preloadHelpGraphicsForTopic(topic, "high");
  uiState.helpTopic = topic;
  uiState.activeOverlay = "help";
  uiState.overlayCanTapDismiss = true;
  render();
}

function closeHelpOverlay() {
  uiState.helpTopic = null;
  if (uiState.activeOverlay === "help") {
    uiState.activeOverlay = "none";
  }
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
  playSfx("unlock_relational");
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
  if (wrapper === "emo_loc") {
    return "Emotional Location";
  }
  if (wrapper === "emo_col") {
    return "Emotional Colour";
  }
  if (wrapper === "emo_dual") {
    return "Emotional Dual";
  }
  if (wrapper === "emotion") {
    return "Emotional";
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

function wrapperIconPath(wrapper) {
  if (wrapper === "hub_cat") {
    return "../brandingUI/icons/game/location-response.svg";
  }
  if (wrapper === "hub_noncat") {
    return "../brandingUI/icons/game/symbol-response.svg";
  }
  if (wrapper === "emo_loc") {
    return "../brandingUI/icons/game/location-response.svg";
  }
  if (wrapper === "emo_col") {
    return "../brandingUI/icons/game/colour-response.svg";
  }
  if (wrapper === "emo_dual" || wrapper === "emotion") {
    return "../brandingUI/icons/game/location-response.svg";
  }
  if (wrapper === "transitive") {
    return "../brandingUI/icons/game/transitive-order.svg";
  }
  if (wrapper === "graph") {
    return "../brandingUI/icons/game/graph-directed.svg";
  }
  if (wrapper === "propositional") {
    return "../brandingUI/icons/game/propositional.svg";
  }
  return "../brandingUI/icons/tab-bar/history.svg";
}

function helpTopicForHubWrapper(wrapper) {
  return wrapper === "hub_noncat" ? "hub-noncat-how" : "hub-cat-how";
}

function helpTopicForRelWrapper(wrapper) {
  if (wrapper === "graph") {
    return "rel-graph-how";
  }
  if (wrapper === "propositional") {
    return "rel-propositional-how";
  }
  return "rel-transitive-how";
}

function renderHelpButton(topic, label = "How to play") {
  if (!HELP_TOPICS[topic]) {
    return "";
  }
  return `
    <button class="btn subtle help-icon-btn" data-action="show-help" data-topic="${topic}">
      <img class="btn-inline-icon" src="${HELP_ICON_PATH}" alt="" aria-hidden="true">${escapeHtml(label)}
    </button>
  `;
}

function renderHelpMiniButton(topic, label = "How to play this game") {
  if (!HELP_TOPICS[topic]) {
    return "";
  }
  return `
    <button class="topbar-mini-help" data-action="show-help" data-topic="${topic}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">
      <img src="${HELP_ICON_PATH}" alt="" aria-hidden="true">
    </button>
  `;
}

function displayHubTargetLabel(targetModality, wrapper) {
  const base = modalityLabel(targetModality);
  if (wrapper === "hub_cat" && targetModality === "sym") {
    return "LETTER";
  }
  return base;
}

function targetModalityIconPath(targetLabel) {
  const text = String(targetLabel || "").toLowerCase();
  if (text.includes("location")) {
    return "../brandingUI/icons/game/location-response.svg";
  }
  if (text.includes("colour") || text.includes("color")) {
    return "../brandingUI/icons/game/colour-response.svg";
  }
  if (text.includes("letter")) {
    return "../brandingUI/icons/game/letter-response.svg";
  }
  if (text.includes("symbol")) {
    return "../brandingUI/icons/game/symbol-response.svg";
  }
  return "";
}

function renderTargetModalityLegend(targetModality, wrapper) {
  const isCategorical = wrapper === "hub_cat";
  const letterOrSymbol = isCategorical ? "LETTER" : "SYMBOL";
  const items = [
    {
      id: "loc",
      label: "LOCATION",
      icon: "../brandingUI/icons/game/location-response.svg"
    },
    {
      id: "col",
      label: "COLOUR",
      icon: "../brandingUI/icons/game/colour-response.svg"
    },
    {
      id: "sym",
      label: letterOrSymbol,
      icon: isCategorical
        ? "../brandingUI/icons/game/letter-response.svg"
        : "../brandingUI/icons/game/symbol-response.svg"
    }
  ];
  return `
    <div class="target-legend-row" aria-label="Target options">
      ${items.map((item) => `
        <span class="target-legend-item ${targetModality === item.id ? "active" : ""}">
          <img src="${item.icon}" alt="" aria-hidden="true">
          ${escapeHtml(item.label)}
        </span>
      `).join("")}
    </div>
  `;
}

function coachStateDisplayLabel(coachState) {
  if (coachState === "RECOVER") {
    return "RECOVERY";
  }
  if (coachState === "STABILISE") {
    return "STABILISE";
  }
  if (coachState === "TUNE") {
    return "CHALLENGE";
  }
  if (coachState === "SPIKE_TUNE") {
    return "PROBE";
  }
  if (coachState === "CONSOLIDATE") {
    return "CONSOLIDATE";
  }
  return "STABILISE";
}

function coachStateIconPath(coachState) {
  if (coachState === "RECOVER" || coachState === "STABILISE") {
    return "../brandingUI/icons/status/recovery-stabilize.svg";
  }
  if (coachState === "TUNE" || coachState === "SPIKE_TUNE") {
    return "../brandingUI/icons/status/spike-breakthrough.svg";
  }
  if (coachState === "CONSOLIDATE") {
    return "../brandingUI/icons/status/clean-control.svg";
  }
  return "../brandingUI/icons/status/recovery-stabilize.svg";
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

function transferEvidenceTone(status) {
  if (status === "banked") {
    return "success";
  }
  if (status === "failed" || status === "no_pending") {
    return "warn";
  }
  return "info";
}

function transferEvidenceStatusLabel(status) {
  if (status === "banked") {
    return "Banked";
  }
  if (status === "pending_recheck") {
    return "Pending later check";
  }
  if (status === "not_counted_early") {
    return "Too early";
  }
  if (status === "failed") {
    return "Failed later check";
  }
  if (status === "no_pending") {
    return "No pending candidate";
  }
  return "Not counted";
}

function renderTransferEvidenceCard(transferEvidence) {
  if (!transferEvidence || typeof transferEvidence !== "object") {
    return "";
  }
  const status = String(transferEvidence.status || "not_counted");
  const tone = transferEvidenceTone(status);
  const statusLabel = transferEvidenceStatusLabel(status);
  const title = transferEvidence.title || "Transfer evidence";
  let detail = transferEvidence.detail || "";
  if (status === "not_counted_early" && Number.isFinite(transferEvidence.remainingMs)) {
    detail = `${detail} Remaining delay: ${formatRemainingDuration(transferEvidence.remainingMs)}.`;
  }
  return `
    <div class="transfer-evidence-card transfer-evidence-${tone}" role="status" aria-live="polite">
      <p class="kicker">Transfer Evidence</p>
      <p class="hint"><strong>Status:</strong> ${escapeHtml(statusLabel)}</p>
      <p><strong>${escapeHtml(title)}</strong></p>
      <p class="hint">${escapeHtml(detail)}</p>
    </div>
  `;
}

function renderZoneStateCard(zone, styleDecision) {
  const zoneCopy = buildZoneStatusCopy(zone);
  const styleCopy = describeSessionStyle(styleDecision?.style || "TUNE");
  const reason = styleDecision?.reason || styleCopy.description;
  const pendingCandidate = styleDecision?.pendingCandidate || null;
  const remainingMs = pendingCandidate && pendingCandidate.eligibleNow === false && Number.isFinite(pendingCandidate.eligibleAfterTs)
    ? Math.max(0, pendingCandidate.eligibleAfterTs - Date.now())
    : null;
  const waitingLine = Number.isFinite(remainingMs)
    ? `<p class="hint"><strong>Later check opens in:</strong> ${escapeHtml(formatRemainingDuration(remainingMs))}</p>`
    : "";
  return `
    <div class="training-state-card">
      <p class="kicker">Today's training state</p>
      <div class="training-state-head">
        ${renderSessionStyleBadge(styleDecision?.style || "TUNE")}
      </div>
      <p><strong>Zone:</strong> ${escapeHtml(zoneCopy.title)}</p>
      <p class="hint">${escapeHtml(zoneCopy.detail)}</p>
      <p class="hint"><strong>Next:</strong> ${escapeHtml(reason)}</p>
      ${waitingLine}
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

function clearEmotionTimers() {
  if (emotionTimers.cue) {
    clearTimeout(emotionTimers.cue);
  }
  if (emotionTimers.display) {
    clearTimeout(emotionTimers.display);
  }
  if (emotionTimers.trial) {
    clearTimeout(emotionTimers.trial);
  }
  emotionTimers.cue = null;
  emotionTimers.display = null;
  emotionTimers.trial = null;
}

async function ensureEmotionAssetsLoaded() {
  if (emotionAssetsCache) {
    return emotionAssetsCache;
  }
  const assets = await loadEmotionAssets();
  emotionAssetsCache = assets;
  return assets;
}

function replaceFailedEmotionFaces(trialsRaw, failedSources, fallbackFace) {
  const trials = Array.isArray(trialsRaw) ? trialsRaw : [];
  const failed = new Set(Array.isArray(failedSources) ? failedSources : []);
  const fallbackSrc = fallbackFace?.src ? String(fallbackFace.src) : "";
  if (!failed.size || !fallbackSrc) {
    return trials;
  }
  return trials.map((trial) => {
    const faceSrc = String(trial?.display?.faceSrc || trial?.faceSrc || "");
    if (!failed.has(faceSrc)) {
      return trial;
    }
    return {
      ...trial,
      faceSrc: fallbackSrc,
      faceEmotion: String(fallbackFace?.emotion || trial?.faceEmotion || "neutral"),
      display: {
        ...(trial?.display || {}),
        faceSrc: fallbackSrc,
        faceEmotion: String(fallbackFace?.emotion || trial?.display?.faceEmotion || "neutral")
      }
    };
  });
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
  if (relTimers.quizTimeoutFrame) {
    cancelAnimationFrame(relTimers.quizTimeoutFrame);
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
  relTimers.quizTimeoutFrame = null;
  relTimers.quizTick = null;
  relTimers.quizAdvance = null;
}

function setFlash(message, kind = "success", options = {}) {
  flash = message;
  flashKind = kind;
  const playWarningSound = options && typeof options === "object"
    ? options.playWarningSound !== false
    : true;
  if (kind === "warn" && message && playWarningSound) {
    playSfx("warning_flash");
  }
}

function clearFlash() {
  flash = "";
  flashKind = "success";
}

function warmAudioAfterSessionStart() {
  if (audioFullPreloadRequested) {
    return;
  }
  audioFullPreloadRequested = true;
  initAudio({
    enabled: Boolean(loadGymState().settings?.soundOn),
    preloadTier: "all"
  });
}

function outcomeSfxFromClassification(classification) {
  if (classification === "hit") {
    return "trial_hit";
  }
  if (classification === "false_alarm") {
    return "trial_false_alarm";
  }
  if (classification === "miss") {
    return "trial_miss";
  }
  return "";
}

function hubTrialAudioBaseKey(block) {
  return `hub:block-${Number(block?.plan?.blockIndex || 0)}:trial-${Number(block?.trialIndex || 0)}`;
}

function relationalTrialAudioBaseKey(block) {
  return `rel:block-${Number(block?.plan?.blockIndex || 0)}:trial-${Number(block?.trialIndex || 0)}`;
}

function emotionTrialAudioBaseKey(block) {
  return `emo:block-${Number(block?.plan?.blockIndex || 0)}:trial-${Number(block?.trialIndex || 0)}`;
}

function playHubTrialOutcomeSfx(block, classification) {
  const eventId = outcomeSfxFromClassification(classification);
  if (!eventId) {
    return;
  }
  playSfx(eventId, {
    onceKey: `${hubTrialAudioBaseKey(block)}:outcome`
  });
}

function playRelationalTrialOutcomeSfx(block, classification) {
  const eventId = outcomeSfxFromClassification(classification);
  if (!eventId) {
    return;
  }
  playSfx(eventId, {
    onceKey: `${relationalTrialAudioBaseKey(block)}:outcome`
  });
}

function playEmotionTrialOutcomeSfx(block, classification) {
  const eventId = outcomeSfxFromClassification(classification);
  if (!eventId) {
    return;
  }
  playSfx(eventId, {
    onceKey: `${emotionTrialAudioBaseKey(block)}:outcome`
  });
}

function playBlockProgressSfx(blockResult) {
  const nStart = Number(blockResult?.nStart || 0);
  const nEnd = Number(blockResult?.nEnd || nStart);
  if (nEnd > nStart) {
    playSfx("n_level_up");
    return;
  }
  if (nEnd < nStart) {
    playSfx("n_level_down");
    return;
  }
  playSfx("block_complete_neutral");
}

function playSessionRewardSfx(progressDelta) {
  playSfx("session_complete");
  if (Number(progressDelta?.sessionUnitsEarned || 0) > 0) {
    playSfx("bank_units_awarded", { delayMs: 120 });
  }
  if (Number(progressDelta?.missionBonusEarned || 0) > 0) {
    playSfx("mission_bonus_awarded", { delayMs: 520 });
  }
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

function normalizeEmotionSpeed(value) {
  return value === "fast" ? "fast" : "slow";
}

function normalizeEmotionInterference(value) {
  return value === "high" ? "high" : "low";
}

function normalizeEmotionModeForPlan(value) {
  if (value === "emo_col") {
    return "emo_col";
  }
  if (value === "emo_dual") {
    return "emo_dual";
  }
  return "emo_loc";
}

function otherEmotionMonoMode(mode) {
  return mode === "emo_col" ? "emo_loc" : "emo_col";
}

function otherRepresentationPack(pack) {
  return pack === "B" ? "A" : "B";
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

function normalizeEmotionCoachPatch(patch) {
  const safePatch = patch && typeof patch === "object" ? patch : {};
  const safeFlags = safePatch.flags && typeof safePatch.flags === "object" ? safePatch.flags : {};
  return {
    ...(Number.isFinite(safePatch.n) ? { n: Math.max(1, Math.round(safePatch.n)) } : {}),
    ...(safePatch.speed ? { speed: normalizeEmotionSpeed(safePatch.speed) } : {}),
    ...(safePatch.interference ? { interference: normalizeEmotionInterference(safePatch.interference) } : {}),
    flags: {
      coachState: safeFlags.coachState,
      pulseType: safeFlags.pulseType ?? null,
      swapSegment: safeFlags.swapSegment ?? null,
      wasSwapProbe: Boolean(safeFlags.wasSwapProbe),
      userOverride: safeFlags.userOverride === "coach" || safeFlags.userOverride === "alternative"
        ? safeFlags.userOverride
        : undefined
    }
  };
}

function applyHubSessionStylePatch(session, patch, blockIndex, lastPlan) {
  const safePatch = patch && typeof patch === "object" ? { ...patch } : {};
  const safeFlags = safePatch.flags && typeof safePatch.flags === "object" ? { ...safePatch.flags } : {};
  const style = session?.sessionStyle || "TUNE";
  const baselineWrapper = session?.baselineWrapper === "hub_noncat" ? "hub_noncat" : "hub_cat";

  if (style === "RESET" || style === "TIGHTEN") {
    const currentN = Number.isFinite(safePatch.n) ? safePatch.n : Number(session?.currentN || 1);
    safePatch.wrapper = baselineWrapper;
    safePatch.speed = "slow";
    safePatch.interference = "low";
    safePatch.n = style === "RESET"
      ? Math.max(1, Math.min(2, Math.round(currentN)))
      : Math.max(1, Math.round(currentN));
    safePatch.flags = {
      coachState: style === "RESET" ? "RECOVER" : "STABILISE",
      pulseType: null,
      swapSegment: null,
      wasSwapProbe: false,
      userOverride: "coach"
    };
    return safePatch;
  }

  if (style === "PROBE" && blockIndex === 4) {
    const probeN = Number.isFinite(safePatch.n) ? Math.max(1, Math.round(safePatch.n)) : Math.max(1, Number(session?.currentN || 1));
    const probeSpeed = safePatch.speed ? normalizeHubSpeed(safePatch.speed) : normalizeHubSpeed(lastPlan?.speed || hubPreferences.speed);
    const probeInterference = safePatch.interference
      ? normalizeHubInterference(safePatch.interference)
      : normalizeHubInterference(lastPlan?.interference || hubPreferences.interference);
    const targetModality = normalizeHubTargetModality(safePatch.targetModality || lastPlan?.targetModality, blockIndex);
    const swapWrapper = otherHubWrapper(baselineWrapper);
    session.probeRunConfig = {
      baselineWrapper,
      swapWrapper,
      n: probeN,
      speed: probeSpeed,
      interference: probeInterference,
      targetModality
    };
    return {
      ...safePatch,
      wrapper: swapWrapper,
      n: probeN,
      speed: probeSpeed,
      interference: probeInterference,
      targetModality,
      flags: {
        ...safeFlags,
        coachState: "SPIKE_TUNE",
        pulseType: null,
        swapSegment: "B",
        wasSwapProbe: true,
        userOverride: "coach"
      }
    };
  }

  if (style === "PROBE" && blockIndex === 5 && session?.probeRunConfig) {
    return {
      ...safePatch,
      wrapper: session.probeRunConfig.baselineWrapper,
      n: session.probeRunConfig.n,
      speed: session.probeRunConfig.speed,
      interference: session.probeRunConfig.interference,
      targetModality: session.probeRunConfig.targetModality,
      flags: {
        ...safeFlags,
        coachState: "SPIKE_TUNE",
        pulseType: null,
        swapSegment: "A",
        wasSwapProbe: true,
        userOverride: "coach"
      }
    };
  }

  if (style === "RECHECK" && session?.recheckSignature && blockIndex === 4) {
    const signature = session.recheckSignature;
    session.recheckRunConfig = {
      baselineWrapper: signature.baselineWrapper,
      swapWrapper: signature.swapWrapper,
      n: signature.n,
      speed: signature.speed,
      interference: signature.interference,
      targetModality: signature.targetModality
    };
    return {
      ...safePatch,
      wrapper: signature.swapWrapper,
      n: signature.n,
      speed: signature.speed,
      interference: signature.interference,
      targetModality: signature.targetModality,
      flags: {
        ...safeFlags,
        coachState: "SPIKE_TUNE",
        pulseType: null,
        swapSegment: "B",
        wasSwapProbe: true,
        userOverride: "coach"
      }
    };
  }

  if (style === "RECHECK" && session?.recheckRunConfig && blockIndex === 5) {
    const config = session.recheckRunConfig;
    return {
      ...safePatch,
      wrapper: config.baselineWrapper,
      n: config.n,
      speed: config.speed,
      interference: config.interference,
      targetModality: config.targetModality,
      flags: {
        ...safeFlags,
        coachState: "SPIKE_TUNE",
        pulseType: null,
        swapSegment: "A",
        wasSwapProbe: true,
        userOverride: "coach"
      }
    };
  }

  safePatch.flags = {
    ...safeFlags
  };
  return safePatch;
}

function applyEmotionSessionStylePatch(session, patch, blockIndex, lastPlan) {
  const safePatch = patch && typeof patch === "object" ? { ...patch } : {};
  const safeFlags = safePatch.flags && typeof safePatch.flags === "object" ? { ...safePatch.flags } : {};
  const style = session?.sessionStyle || "TUNE";
  const baselineMode = normalizeEmotionModeForPlan(session?.baselineMode);
  const baselinePack = session?.baselineRepresentationPack === "B" ? "B" : "A";
  const planPack = lastPlan?.representationPack === "B" ? "B" : baselinePack;

  if (style === "RESET" || style === "TIGHTEN") {
    const currentN = Number.isFinite(safePatch.n) ? safePatch.n : Number(session?.currentN || 1);
    safePatch.mode = baselineMode;
    safePatch.representationPack = baselinePack;
    safePatch.speed = "slow";
    safePatch.interference = "low";
    safePatch.n = style === "RESET"
      ? Math.max(1, Math.min(2, Math.round(currentN)))
      : Math.max(1, Math.round(currentN));
    safePatch.flags = {
      coachState: style === "RESET" ? "RECOVER" : "STABILISE",
      pulseType: null,
      swapSegment: null,
      wasSwapProbe: false,
      userOverride: "coach"
    };
    return safePatch;
  }

  if (style === "PROBE" && blockIndex === 4) {
    const probeN = Number.isFinite(safePatch.n) ? Math.max(1, Math.round(safePatch.n)) : Math.max(1, Number(session?.currentN || 1));
    const probeSpeed = safePatch.speed
      ? normalizeEmotionSpeed(safePatch.speed)
      : normalizeEmotionSpeed(lastPlan?.speed || emotionPreferences.speed);
    const probeInterference = safePatch.interference
      ? normalizeEmotionInterference(safePatch.interference)
      : normalizeEmotionInterference(lastPlan?.interference || emotionPreferences.interference);

    if (baselineMode === "emo_dual") {
      const fromPack = planPack;
      const toPack = otherRepresentationPack(fromPack);
      session.probeRunConfig = {
        baselineMode: "emo_dual",
        swapMode: "emo_dual",
        n: probeN,
        speed: probeSpeed,
        interference: probeInterference,
        representationFrom: fromPack,
        representationTo: toPack
      };
      return {
        ...safePatch,
        mode: "emo_dual",
        representationPack: toPack,
        n: probeN,
        speed: probeSpeed,
        interference: probeInterference,
        flags: {
          ...safeFlags,
          coachState: "SPIKE_TUNE",
          pulseType: null,
          swapSegment: "B",
          wasSwapProbe: true,
          userOverride: "coach"
        }
      };
    }

    const swapMode = otherEmotionMonoMode(baselineMode);
    session.probeRunConfig = {
      baselineMode,
      swapMode,
      n: probeN,
      speed: probeSpeed,
      interference: probeInterference,
      representationFrom: planPack,
      representationTo: planPack
    };
    return {
      ...safePatch,
      mode: swapMode,
      representationPack: planPack,
      n: probeN,
      speed: probeSpeed,
      interference: probeInterference,
      flags: {
        ...safeFlags,
        coachState: "SPIKE_TUNE",
        pulseType: null,
        swapSegment: "B",
        wasSwapProbe: true,
        userOverride: "coach"
      }
    };
  }

  if (style === "PROBE" && blockIndex === 5 && session?.probeRunConfig) {
    const config = session.probeRunConfig;
    return {
      ...safePatch,
      mode: normalizeEmotionModeForPlan(config.baselineMode),
      representationPack: config.representationFrom === "B" ? "B" : "A",
      n: config.n,
      speed: normalizeEmotionSpeed(config.speed),
      interference: normalizeEmotionInterference(config.interference),
      flags: {
        ...safeFlags,
        coachState: "SPIKE_TUNE",
        pulseType: null,
        swapSegment: "A",
        wasSwapProbe: true,
        userOverride: "coach"
      }
    };
  }

  if (style === "RECHECK" && session?.recheckSignature && blockIndex === 4) {
    const signature = session.recheckSignature;
    const signatureBaselineMode = normalizeEmotionModeForPlan(signature.baselineMode);
    const signatureSwapMode = normalizeEmotionModeForPlan(signature.swapMode);
    const fromPack = signature.representationFrom === "B" ? "B" : "A";
    const toPack = signature.representationTo === "B" ? "B" : "A";
    session.recheckRunConfig = {
      baselineMode: signatureBaselineMode,
      swapMode: signatureSwapMode,
      n: Number.isFinite(signature.n) ? Math.max(1, Math.round(signature.n)) : Math.max(1, Number(session?.currentN || 1)),
      speed: normalizeEmotionSpeed(signature.speed),
      interference: normalizeEmotionInterference(signature.interference),
      representationFrom: fromPack,
      representationTo: toPack
    };
    return {
      ...safePatch,
      mode: signatureSwapMode,
      representationPack: signatureBaselineMode === "emo_dual" ? toPack : fromPack,
      n: session.recheckRunConfig.n,
      speed: session.recheckRunConfig.speed,
      interference: session.recheckRunConfig.interference,
      flags: {
        ...safeFlags,
        coachState: "SPIKE_TUNE",
        pulseType: null,
        swapSegment: "B",
        wasSwapProbe: true,
        userOverride: "coach"
      }
    };
  }

  if (style === "RECHECK" && session?.recheckRunConfig && blockIndex === 5) {
    const config = session.recheckRunConfig;
    return {
      ...safePatch,
      mode: normalizeEmotionModeForPlan(config.baselineMode),
      representationPack: config.representationFrom === "B" ? "B" : "A",
      n: config.n,
      speed: normalizeEmotionSpeed(config.speed),
      interference: normalizeEmotionInterference(config.interference),
      flags: {
        ...safeFlags,
        coachState: "SPIKE_TUNE",
        pulseType: null,
        swapSegment: "A",
        wasSwapProbe: true,
        userOverride: "coach"
      }
    };
  }

  safePatch.mode = safePatch.mode
    ? normalizeEmotionModeForPlan(safePatch.mode)
    : normalizeEmotionModeForPlan(lastPlan?.mode || baselineMode);
  safePatch.representationPack = safePatch.representationPack === "B" ? "B" : planPack;
  safePatch.flags = {
    ...safeFlags
  };
  return safePatch;
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
  const emoLocDone = Boolean(unlockProgress?.emoLocQualified);
  const emoColDone = Boolean(unlockProgress?.emoColQualified);
  const emoDualDone = Boolean(unlockProgress?.emoDualQualified);
  const unlockOverrideActive = Boolean(unlockProgress?.unlockOverrideActive);
  const unlockHint = unlockOverrideActive
    ? "Relational unlock is temporarily forced ON for inspection."
    : (catDone && noncatDone && emoDualDone
      ? "Relational modes are now available."
      : "Qualify in Hub cat + Hub non-categorical + Emotional dual to unlock Relational.");
  return `
    <div class="rel-progress-card">
      <p class="kicker">Relational Unlock</p>
      <div class="rel-progress-line">
        <span class="rel-progress-pill ${catDone ? "done" : ""}">
          <img class="rel-progress-icon" src="../brandingUI/icons/status/${catDone ? "unlock.svg" : "lock.svg"}" alt="" aria-hidden="true">
          Hub (cat)
        </span>
        <span class="rel-progress-pill ${noncatDone ? "done" : ""}">
          <img class="rel-progress-icon" src="../brandingUI/icons/status/${noncatDone ? "unlock.svg" : "lock.svg"}" alt="" aria-hidden="true">
          Hub (non-categorical)
        </span>
        <span class="rel-progress-pill ${emoLocDone ? "done" : ""}">
          <img class="rel-progress-icon" src="../brandingUI/icons/status/${emoLocDone ? "unlock.svg" : "lock.svg"}" alt="" aria-hidden="true">
          Emotion (location)
        </span>
        <span class="rel-progress-pill ${emoColDone ? "done" : ""}">
          <img class="rel-progress-icon" src="../brandingUI/icons/status/${emoColDone ? "unlock.svg" : "lock.svg"}" alt="" aria-hidden="true">
          Emotion (colour)
        </span>
        <span class="rel-progress-pill ${emoDualDone ? "done" : ""}">
          <img class="rel-progress-icon" src="../brandingUI/icons/status/${emoDualDone ? "unlock.svg" : "lock.svg"}" alt="" aria-hidden="true">
          Emotion (dual)
        </span>
      </div>
      <p class="hint">${unlockHint}</p>
      <details class="rel-progress-help">
        <summary><img src="../brandingUI/icons/status/help-information.svg" alt="" aria-hidden="true">What counts as stable?</summary>
        <p>Stable = 3 blocks at N >= 3 (Hub) or N >= 2 (Emotional) with accuracy >= 75%.</p>
      </details>
    </div>
  `;
}

function renderBottomTab(activeTab) {
  const items = [
    { id: "home", label: "Home", icon: "home.svg", action: "go-home" },
    { id: "hub", label: "Hub", icon: "play-hub.svg", action: "go-play-hub" },
    { id: "relational", label: "Relational", icon: "play-relational.svg", action: "go-play-relational" },
    { id: "history", label: "Progress", icon: "history.svg", action: "go-history" },
    { id: "settings", label: "Settings", icon: "settings.svg", action: "go-settings" }
  ];
  return `
    <nav class="bottom-tab-nav" aria-label="Primary">
      ${items.map((item) => `
        <button class="bottom-tab-btn ${activeTab === item.id ? "active" : ""}" data-action="${item.action}" aria-label="${escapeHtml(item.label)}">
          <img src="../brandingUI/icons/tab-bar/${item.icon}" alt="" aria-hidden="true">
          <span>${escapeHtml(item.label)}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function renderHome(state) {
  const unlockProgress = deriveRelationalUnlockProgress(state.history);
  const progression = getProgressionState(state);
  const emotionProgression = getEmotionProgressionState(state);
  const coachRecommendation = getCoachCapacityRecommendation(state);
  const styleDecision = coachRecommendation.family === "emotion"
    ? getEmotionStyleDecision(state)
    : getHubStyleDecision(state);
  const zone = coachRecommendation.family === "emotion"
    ? getSavedZoneForNow(state, Date.now(), "emotion")
    : getSavedZoneForNow(state);
  const todayKey = toDateKeyLocal();
  const mission = getMissionPreview(state, todayKey, unlockProgress);
  const streakCurrent = Number(state.settings?.streakCurrent || 0);
  const streakBest = Number(state.settings?.streakBest || 0);
  const greeting = getDayGreeting();
  const transferBankUnits = Number(state.transferBankUnits || 0);
  const missionSteps = mission.steps.map((stepId, idx) => {
    const done = idx < mission.completedSteps;
    const label = stepId === "reset"
      ? "Start any session"
      : (stepId === "control" ? "Complete a Hub or Emotional session" : "Complete a Relational session");
    return `
      <div class="mission-step">
        <img
          class="mission-step-icon ${done ? "done" : ""}"
          src="../brandingUI/icons/${done ? "gamification/mission-complete.svg" : "status/lock.svg"}"
          alt=""
          aria-hidden="true"
        >
        <span>${label}</span>
      </div>
    `;
  }).join("");
  const relModeLocked = !unlockProgress.relationalUnlocked;
  const emotionDualLocked = !unlockProgress.emotionDualUnlocked;
  const relLockText = relModeLocked ? "Locked" : "Available";
  const emotionTileStatus = emotionDualLocked ? "Dual locked (mono first)" : "Available";
  const subtitle = mission.tier === "tier1"
    ? "Tier 1 - Reset - Control - Reason"
    : "Complete a Hub or Emotional session today";
  return `
    <section class="card has-bottom-tab game-screen">
      <div class="game-topbar">
        <div class="game-topbar-brand">
          <button class="topbar-icon-btn" data-action="go-home" aria-label="Home">
            <img src="../brandingUI/icons/tab-bar/home.svg" alt="" aria-hidden="true">
          </button>
          <strong>IQ Capacity</strong>
        </div>
        <div class="game-topbar-stats">
          <span><img src="../brandingUI/icons/gamification/streak-flame.svg" alt="" aria-hidden="true"> ${streakCurrent}</span>
          <span class="bank-pill"><img src="../brandingUI/icons/gamification/bank-units.svg" alt="" aria-hidden="true"> Training ${state.bankUnits}</span>
          <span class="transfer-pill" role="status">Transfer ${transferBankUnits}</span>
        </div>
      </div>
      <h2>${greeting}</h2>
      <p class="hint">${subtitle}</p>
      ${renderZoneStateCard(zone, styleDecision)}
      <div class="mission-card">
        <div class="mission-header-row">
          <p class="kicker">Daily Mission ${mission.tier === "tier1" ? "- Tier 1" : ""}</p>
          <span class="pill-soft">+3 bonus</span>
        </div>
        ${missionSteps}
        <p class="hint">${mission.rewardClaimed ? "Mission reward claimed for today." : "Complete mission to earn +3 bank units."}</p>
      </div>
      <div class="row help-action-row">
        ${renderHelpButton("training-progression", "How to progress through training")}
      </div>
      <div class="row home-primary-row">
        <button
          class="btn primary home-primary-btn"
          data-action="${coachRecommendation.routeAction}"
          ${coachRecommendation.family === "hub" ? 'data-wrapper="hub_cat"' : ""}
          ${coachRecommendation.family === "emotion" ? `data-mode="${escapeHtml(emotionPreferences.mode)}"` : ""}
        >
          <img class="btn-inline-icon btn-inline-icon-lg" src="../brandingUI/icons/tab-bar/play-hub.svg" alt="" aria-hidden="true">
          Start Recommended ${escapeHtml(coachRecommendation.label)} Session
        </button>
      </div>
      <p class="hint home-cta-hint">~10 min | ${escapeHtml(coachRecommendation.reason)}</p>
      <div class="mode-panel">
        <p class="kicker">Choose a Mode</p>
        <div class="mode-group">
          <div class="mode-grid mode-grid-hub">
            <button class="mode-tile mode-action" data-action="go-play-hub" data-wrapper="hub_cat">
              <img src="../brandingUI/icons/game/location-response.svg" alt="" aria-hidden="true">
              <strong>Hub (category)</strong>
              <span>Available</span>
            </button>
            <button class="mode-tile mode-action" data-action="go-play-hub" data-wrapper="hub_noncat">
              <img src="../brandingUI/icons/game/symbol-response.svg" alt="" aria-hidden="true">
              <strong>Hub (non-categorical)</strong>
              <span>Available</span>
            </button>
            <button class="mode-tile mode-action" data-action="go-play-emotion" data-mode="${escapeHtml(normalizeEmotionMode(emotionPreferences.mode))}">
              <img src="../brandingUI/icons/game/emotional-face.svg" alt="" aria-hidden="true">
              <strong>Emotional DNB</strong>
              <span>${emotionTileStatus}</span>
            </button>
          </div>
        </div>
        <div class="mode-group">
          <div class="mode-grid mode-grid-rel">
            <button class="mode-tile mode-action ${relModeLocked ? "locked" : ""}" data-action="go-play-relational" ${relModeLocked ? "disabled" : ""}>
              <img src="../brandingUI/icons/game/transitive-order.svg" alt="" aria-hidden="true">
              <strong>Transitive</strong>
              <span>${relLockText}</span>
            </button>
            <button class="mode-tile mode-action ${relModeLocked ? "locked" : ""}" data-action="go-play-relational" ${relModeLocked ? "disabled" : ""}>
              <img src="../brandingUI/icons/game/graph-directed.svg" alt="" aria-hidden="true">
              <strong>Graph</strong>
              <span>${relLockText}</span>
            </button>
            <button class="mode-tile mode-action ${relModeLocked ? "locked" : ""}" data-action="go-play-relational" ${relModeLocked ? "disabled" : ""}>
              <img src="../brandingUI/icons/game/propositional.svg" alt="" aria-hidden="true">
              <strong>Propositional</strong>
              <span>${relLockText}</span>
            </button>
          </div>
        </div>
      </div>
      ${renderRelationalProgressCard(unlockProgress)}
      <div class="snapshot-card snapshot-list">
        <p><strong>Sessions:</strong> ${state.history.length}</p>
        <p><strong>Streak:</strong> ${streakCurrent} (best ${streakBest})</p>
        <p><strong>Training bank:</strong> ${state.bankUnits}</p>
        <p><strong>Transfer bank:</strong> ${transferBankUnits}</p>
        <p><strong>Pending later checks:</strong> ${(progression.pendingCandidateId ? 1 : 0) + (emotionProgression.pendingCandidateId ? 1 : 0)}</p>
      </div>
      ${renderFlash()}
      ${renderBottomTab("home")}
    </section>
  `;
}
function renderRelationalUnlockChecklist(unlockProgress) {
  return `
    <div class="unlock-checklist">
      <p><strong>Relational Unlock Checklist</strong></p>
      <p>${unlockProgress.catQualified ? "[x]" : "[ ]"} hub_cat qualification ${unlockProgress.catQualified ? "complete" : "pending"}</p>
      <p>${unlockProgress.noncatQualified ? "[x]" : "[ ]"} Hub non-categorical qualification ${unlockProgress.noncatQualified ? "complete" : "pending"}</p>
      <p>${unlockProgress.emoLocQualified ? "[x]" : "[ ]"} Emotional location qualification ${unlockProgress.emoLocQualified ? "complete" : "pending"}</p>
      <p>${unlockProgress.emoColQualified ? "[x]" : "[ ]"} Emotional colour qualification ${unlockProgress.emoColQualified ? "complete" : "pending"}</p>
      <p>${unlockProgress.emoDualQualified ? "[x]" : "[ ]"} Emotional dual qualification ${unlockProgress.emoDualQualified ? "complete" : "pending"}</p>
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
        Game
        <select id="hub-wrapper-select" ${wrapperLock}>
          ${HUB_WRAPPERS.map((wrapperId) => (
            `<option value="${wrapperId}" ${hubPreferences.wrapper === wrapperId ? "selected" : ""}>${wrapperId === "hub_noncat" ? "Hub (non-categorical)" : "Hub (category)"}</option>`
          )).join("")}
        </select>
      </label>
    `
    : `
      <div class="hub-config-item hub-config-readonly">
        <span>Game</span>
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
  const wrapperClass = wrapper === "hub_noncat" ? "hub-stimulus-noncat" : "hub-stimulus-cat";
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
  const targetIconPath = targetModalityIconPath(targetLabel);
  const targetIcon = targetIconPath
    ? `<img class="target-mode-icon" src="${targetIconPath}" alt="" aria-hidden="true">`
    : '<span class="target-mode-dot" aria-hidden="true"></span>';

  return `
    <div class="hub-stimulus ${wrapperClass}">
      <p class="hub-target">Target: ${targetIcon}<strong>${escapeHtml(targetLabel)}</strong> | Game: <strong>${escapeHtml(wrapperDisplayName(wrapper))}</strong></p>
      ${runtimeInfo ? `<p class="hub-runtime">${escapeHtml(runtimeInfo)}</p>` : ""}
      <div class="hub-arena">
        <div class="hub-ring"></div>
        ${markerDots}
        ${stimulus}
      </div>
    </div>
  `;
}

function renderBlockSummary(block) {
  if (!block) {
    return "";
  }
  const outcomeBand = deriveOutcomeBandFromAccuracy(block.accuracy);
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
      <div class="row summary-help-row">
        <button class="btn subtle" data-action="show-help" data-topic="hub-metrics">What do these stats mean?</button>
      </div>
    </div>
  `;
}

function renderRelationalStimulus(trial, visible, runtimeInfo = "") {
  const display = trial?.display || {};
  const textVisible = Boolean(trial && visible);

  if (display.type === "graph") {
    const arrowColor = "#acc0dd";
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
              <polygon points="0,0 6,3 0,6" fill="${arrowColor}"></polygon>
            </marker>
          </defs>
          <line x1="${arrow.x1}" y1="${arrow.y1}" x2="${arrow.x2}" y2="${arrow.y2}" stroke="${arrowColor}" marker-end="url(#rel-arrow-head)"></line>
        </svg>
      `
      : "";
    return `
      <div class="rel-stimulus rel-stimulus-graph">
        ${runtimeInfo ? `<p class="hub-runtime">${escapeHtml(runtimeInfo)}</p>` : ""}
        <div class="hub-arena">
          <div class="hub-ring"></div>
          ${nodeMarkup}
          ${arrowMarkup}
        </div>
      </div>
    `;
  }

  const tokenText = textVisible ? escapeHtml(display.text || "") : "";
  const tokenClass = textVisible ? "rel-center-token" : "rel-center-token hidden";
  return `
    <div class="rel-stimulus">
      ${runtimeInfo ? `<p class="hub-runtime">${escapeHtml(runtimeInfo)}</p>` : ""}
      <div class="hub-arena">
        <div class="hub-ring"></div>
        <div class="${tokenClass}">${tokenText}</div>
      </div>
    </div>
  `;
}

function renderRelationalBlockSummary(block) {
  if (!block) {
    return "";
  }
  const outcomeBand = deriveOutcomeBandFromAccuracy(block.accuracy);
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
      <div class="row summary-help-row">
        <button class="btn subtle" data-action="show-help" data-topic="rel-metrics">What do these stats mean?</button>
      </div>
    </div>
  `;
}

function renderPlayHub() {
  const state = loadGymState();
  const zone = getSavedZoneForNow(state);
  const styleDecision = getHubStyleDecision(state);
  const styleCopy = describeSessionStyle(styleDecision.style);
  const transferBankUnits = Number(state.transferBankUnits || 0);
  const running = Boolean(hubSession && hubSession.status === "running");
  const completed = Boolean(hubSession && hubSession.status === "completed");
  const requestedWrapper = normalizeHubWrapper(hubPreferences.wrapper);

  if (!running && !completed) {
    return `
      <section class="card game-screen has-bottom-tab">
        <div class="game-topbar">
          <div class="game-topbar-brand">
            <button class="topbar-icon-btn" data-action="go-home" aria-label="Home">
              <img src="../brandingUI/icons/tab-bar/home.svg" alt="" aria-hidden="true">
            </button>
            <strong>Hub</strong>
          </div>
          <div class="game-topbar-stats">
            <span class="bank-pill"><img src="../brandingUI/icons/gamification/bank-units.svg" alt="" aria-hidden="true"> Training ${state.bankUnits || 0}</span>
            <span class="transfer-pill">Transfer ${transferBankUnits}</span>
          </div>
        </div>
        <h2>Hub Session</h2>
        <p class="hint">Choose your setup, then start a 10-block session.</p>
        <div class="stage-panel">
          <p class="kicker">Recommended session style</p>
          ${renderSessionStyleBadge(styleDecision.style)}
          <p class="hint">${escapeHtml(styleCopy.description)}</p>
          <p class="hint">${escapeHtml(styleDecision.reason)}</p>
        </div>
        ${renderZoneStateCard(zone, styleDecision)}
        <div class="stage-panel">
          ${renderHubConfigControls({ showWrapperSelect: true, wrapperLocked: false, dialsLocked: false })}
          <div class="row home-primary-row">
            <button class="btn primary home-primary-btn" data-action="start-hub-session">Start ${wrapperDisplayName(requestedWrapper)} Session</button>
          </div>
        </div>
        <div class="row help-action-row">
          ${renderHelpButton(helpTopicForHubWrapper(requestedWrapper), "How to play this game")}
        </div>
        <div class="row home-footer-actions">
          ${renderHelpButton("training-progression", "How to progress through training")}
        </div>
        ${renderFlash()}
        ${renderBottomTab("hub")}
      </section>
    `;
  }

  if (completed) {
    const summary = hubSession.sessionSummary;
    const completedWrapper = summary.blocksPlanned?.[0]?.wrapper || "hub_cat";
    const progressDelta = hubSession.progressDelta || null;
    const visualStats = computeSessionVisualStats(summary);
    const accuracyChart = renderAccuracyBars(summary.blocks);
    const progressionSummary = progressDelta
      ? `
        <div class="result-earned-row session-earned-box">
          <span>Session earned</span>
          <strong>+${progressDelta.sessionUnitsEarned + progressDelta.missionBonusEarned} units</strong>
        </div>
        <div class="session-bank-lines">
          <p>Session earned: <strong>+${progressDelta.sessionUnitsEarned}</strong></p>
          <p>Mission bonus: <strong>+${progressDelta.missionBonusEarned}</strong></p>
          <p>Total bank: <strong>${progressDelta.bankTotal}</strong></p>
          <p>Transfer bank earned: <strong>+${progressDelta.transferBankDelta || 0}</strong></p>
          <p>Transfer bank total: <strong>${progressDelta.transferBankTotal || transferBankUnits}</strong></p>
          <p>Streak: <strong>${progressDelta.streakCurrent}</strong> (best ${progressDelta.streakBest})</p>
        </div>
      `
      : "";
    const allCleanNote = progressDelta?.allBlocksClean
      ? `<p class="prestige-note">All Blocks Clean (prestige)</p>`
      : "";
    const transferEvidenceCard = progressDelta?.transferEvidence
      ? renderTransferEvidenceCard(progressDelta.transferEvidence)
      : "";

    return `
      <section class="card game-screen has-bottom-tab">
        <div class="game-topbar">
          <div class="game-topbar-brand"><strong>Session Complete</strong></div>
          <div class="game-topbar-stats">
            <span class="bank-pill"><img src="../brandingUI/icons/gamification/bank-units.svg" alt="" aria-hidden="true"> Training ${progressDelta?.bankTotal || state.bankUnits || 0}</span>
            <span class="transfer-pill">Transfer ${progressDelta?.transferBankTotal || transferBankUnits}</span>
          </div>
        </div>
        <h2>${wrapperDisplayName(completedWrapper)}</h2>
        <p class="hint">10 blocks completed</p>
        <div class="session-stats-grid">
          <div class="session-stat"><span>Peak Level</span><strong>${visualStats.peakN}</strong></div>
          <div class="session-stat"><span>Final Level</span><strong>${visualStats.finalN}</strong></div>
          <div class="session-stat"><span>Stability</span><strong>${visualStats.holdUpCount}/${visualStats.totalBlocks}</strong></div>
        </div>
        ${accuracyChart}
        ${progressionSummary}
        ${transferEvidenceCard}
        ${allCleanNote}
        <div class="row help-action-row">
          ${renderHelpButton(helpTopicForHubWrapper(completedWrapper), "How to play this game")}
        </div>
        <div class="row home-primary-row">
          <button class="btn primary home-primary-btn" data-action="start-hub-session"><img class="btn-inline-icon btn-inline-icon-lg" src="../brandingUI/icons/tab-bar/play-hub.svg" alt="" aria-hidden="true">Play Again</button>
        </div>
        <div class="row home-footer-actions">
          <button class="btn" data-action="go-home"><img class="btn-inline-icon" src="../brandingUI/icons/tab-bar/home.svg" alt="" aria-hidden="true">Return Home</button>
        </div>
        ${renderFlash()}
        ${renderBottomTab("hub")}
      </section>
    `;
  }

  const block = hubSession.currentBlock;
  const trial = block && block.trialIndex >= 0 ? block.trials[block.trialIndex] : null;
  const trialNumber = block ? block.trialIndex + 1 : 0;
  const trialCount = block ? block.trials.length : 0;
  const responseCaptured = block ? block.responseCaptured : false;
  const hubTrialPaused = Boolean(hubSession?.trialPaused);
  const targetLabel = block ? displayHubTargetLabel(block.plan.targetModality, block.plan.wrapper) : "";
  const preview = resolveNextBlockPreview(hubSession);
  const currentWrapper = block
    ? block.plan.wrapper
    : (hubSession.lastBlockSummary?.wrapper || preview.wrapper);
  const pendingPatch = hubSession.pendingPlanPatch && typeof hubSession.pendingPlanPatch === "object"
    ? hubSession.pendingPlanPatch
    : {};
  const activeStyle = hubSession.sessionStyle || styleDecision.style;
  const activeStyleCopy = describeSessionStyle(activeStyle);
  const styleDisablesOverride = activeStyle === "RESET" || activeStyle === "TIGHTEN";
  const overrideEligible = hubSession.phase === "block-result"
    && !styleDisablesOverride
    && (preview.coachState === "TUNE" || preview.coachState === "SPIKE_TUNE");
  const alternativePatch = overrideEligible ? resolveHubAlternativePatch(hubSession, pendingPatch) : null;
  const overrideControls = overrideEligible
    ? `
      <div class="coach-choice-box">
        <p class="kicker">Coach Suggests</p>
        <p>${escapeHtml(hubSession.coachNotice || "Targeted challenge route for next block")}</p>
        <div class="row">
          <button class="btn" data-action="hub-accept-coach">Accept Coach</button>
          <button class="btn" data-action="hub-try-alternative" ${alternativePatch ? "" : "disabled"}>Try Alternative</button>
        </div>
        ${alternativePatch ? "" : `<p class="hint">Coach recommendation is optimal right now.</p>`}
      </div>
    `
    : "";

  const trialProgressPct = trialCount > 0 ? Math.max(0, Math.min(100, Math.round((trialNumber / trialCount) * 100))) : 0;

  let phasePanel = "";
  if (hubSession.phase === "briefing") {
    phasePanel = `
      <div class="stage-panel">
        <p class="kicker">Block ${hubSession.blockCursor + 1} of ${HUB_TOTAL_BLOCKS}</p>
        <h3>Ready?</h3>
        <p class="hint">Check the block briefing and press Start Block.</p>
      </div>
    `;
  } else if (hubSession.phase === "cue") {
    phasePanel = `
      <div class="stage-panel trial-stage">
        <p class="kicker">Target</p>
        <div class="cue-target-card">${escapeHtml(targetLabel)}</div>
        <p class="hint">Starting now...</p>
      </div>
    `;
  } else if (hubSession.phase === "trial") {
    const showPauseControl = block?.plan?.wrapper === "hub_cat" || block?.plan?.wrapper === "hub_noncat";
    const pauseControls = showPauseControl
      ? `
        <div class="row pause-control-row">
          <button class="btn subtle pause-btn" data-action="hub-toggle-pause">${hubTrialPaused ? "Resume" : "Pause"}</button>
          <button class="btn subtle stop-btn" data-action="hub-stop-session">Stop</button>
        </div>
      `
      : "";
    phasePanel = `
      <div class="stage-panel trial-stage">
        <div class="trial-progress-track"><span style="width:${trialProgressPct}%;"></span></div>
        <p class="hint">Trial ${trialNumber}/${trialCount}</p>
        ${renderHubStimulus(trial, block.stimulusVisible, targetLabel, block.renderMapping, block.plan.wrapper)}
        <button class="btn primary match-btn game-match-btn" data-action="hub-match" ${(responseCaptured || hubTrialPaused) ? "disabled" : ""}>MATCH</button>
        ${pauseControls}
      </div>
    `;
  } else {
    const coachState = preview.coachState || "STABILISE";
    const coachLabel = coachStateDisplayLabel(coachState);
    const coachIcon = coachStateIconPath(coachState);
    phasePanel = `
      <div class="stage-panel result-stage">
        ${renderBlockSummary(hubSession.lastBlockSummary)}
        <div class="coach-next-block">
          <p class="coach-next-title">Coach-led next block: ${escapeHtml(coachLabel)}</p>
          <img class="coach-next-icon" src="${coachIcon}" alt="" aria-hidden="true">
        </div>
        ${overrideControls}
        <button class="btn primary home-primary-btn" data-action="hub-next-block">Next Block</button>
      </div>
    `;
  }

  return `
    <section class="card game-screen play-session-screen">
      <div class="game-topbar">
        <div class="game-topbar-brand">
          <span>Block ${hubSession.blockCursor + (hubSession.phase === "block-result" ? 0 : 1)}/${HUB_TOTAL_BLOCKS}</span>
          <span>Level ${hubSession.currentN}</span>
        </div>
        <div class="game-topbar-stats">
          <span class="bank-pill"><img src="../brandingUI/icons/gamification/bank-units.svg" alt="" aria-hidden="true"> Training ${state.bankUnits || 0}</span>
          <span class="transfer-pill">Transfer ${transferBankUnits}</span>
          ${renderHelpMiniButton(helpTopicForHubWrapper(currentWrapper))}
        </div>
      </div>
      <p class="hint run-context-line">${wrapperDisplayName(currentWrapper)} game | ${escapeHtml(activeStyleCopy.label)}</p>
      ${phasePanel}
      ${renderFlash()}
    </section>
  `;
}

function normalizeEmotionMode(value) {
  return EMO_MODES.includes(value) ? value : "emo_loc";
}

function emotionModeToLabel(mode) {
  if (mode === "emo_col") {
    return "Emotional Colour";
  }
  if (mode === "emo_dual") {
    return "Emotional Dual";
  }
  return "Emotional Location";
}

function renderEmotionStimulus(trial, visible, mode, renderMapping, runtimeInfo = "") {
  const points = Array.isArray(renderMapping?.markerPositions) ? renderMapping.markerPositions : [];
  const markerDots = points.map((point) => (
    `<span class="hub-marker" style="left:${point.xPct}%;top:${point.yPct}%;"></span>`
  )).join("");
  const point = trial && points[trial.locIdx] ? points[trial.locIdx] : { xPct: 50, yPct: 50 };
  const tokenVisible = Boolean(trial && visible);
  const faceSrc = tokenVisible ? String(trial?.display?.faceSrc || trial?.faceSrc || "") : "";
  const wordText = tokenVisible ? escapeHtml(trial?.display?.wordText || trial?.wordText || "") : "";
  const wordPixelColour = tokenVisible ? String(trial?.display?.colourHex || "#ffffff") : "transparent";
  const normalizedColour = wordPixelColour.toLowerCase();
  const wordTextColor = normalizedColour;
  const shadowColor = normalizedColour === "#ffffff" ? "rgba(7,11,19,0.95)" : "rgba(7,11,19,0.88)";
  const faceToken = tokenVisible
    ? `<img class="emotion-face-token" src="${faceSrc}" alt="" style="left:${point.xPct}%;top:${point.yPct}%;">`
    : `<img class="emotion-face-token hidden" src="" alt="" style="left:${point.xPct}%;top:${point.yPct}%;">`;
  const wordToken = tokenVisible
    ? `<div class="emotion-word-token" style="color:${wordTextColor};--emotion-word-shadow:${shadowColor};">${wordText}</div>`
    : `<div class="emotion-word-token hidden"></div>`;
  return `
    <div class="hub-stimulus emotion-stimulus">
      <p class="hub-target">Target: <strong>${escapeHtml(emotionModeTarget(mode))}</strong> | Game: <strong>${escapeHtml(emotionModeToLabel(mode))}</strong></p>
      ${runtimeInfo ? `<p class="hub-runtime">${escapeHtml(runtimeInfo)}</p>` : ""}
      <div class="hub-arena">
        <div class="hub-ring"></div>
        ${markerDots}
        ${faceToken}
        ${wordToken}
      </div>
    </div>
  `;
}

function renderEmotionBlockSummary(block) {
  if (!block) {
    return "";
  }
  const outcomeBand = deriveOutcomeBandFromAccuracy(block.accuracy);
  const accuracyPercent = Number(block.accuracy || 0) * 100;
  const blockUnits = outcomeBand === "UP" ? 2 : (outcomeBand === "HOLD" ? 1 : 0);
  const dualLines = block.mode === "emo_dual"
    ? `
      <div class="result-metric"><span>Loc Acc</span><strong>${Math.round(Number(block.accuracyLoc || 0) * 100)}%</strong></div>
      <div class="result-metric"><span>Col Acc</span><strong>${Math.round(Number(block.accuracyCol || 0) * 100)}%</strong></div>
    `
    : "";
  return `
    <div class="hub-summary">
      <p class="kicker">Block ${block.blockIndex} Complete</p>
      <div class="result-hero">
        ${renderAccuracyRing(accuracyPercent)}
        <div class="result-hero-side">
          <p class="result-outcome result-outcome-${outcomeBand.toLowerCase()}">${outcomeBand}</p>
          <p>N level: <strong>${block.nStart} -> ${block.nEnd}</strong></p>
          <p>Mode: <strong>${escapeHtml(emotionModeToLabel(block.mode || "emo_loc"))}</strong></p>
        </div>
      </div>
      <div class="result-metric-grid">
        <div class="result-metric"><span>Hits</span><strong>${block.hits}</strong></div>
        <div class="result-metric"><span>Misses</span><strong>${block.misses}</strong></div>
        <div class="result-metric"><span>False Alarms</span><strong>${block.falseAlarms}</strong></div>
        <div class="result-metric"><span>CR</span><strong>${block.correctRejections}</strong></div>
        ${dualLines}
      </div>
      <div class="result-earned-row">
        <span>Block earned</span>
        <strong>+${blockUnits} units</strong>
      </div>
    </div>
  `;
}

function renderPlayEmotion() {
  const state = loadGymState();
  const unlockProgress = deriveRelationalUnlockProgress(state.history);
  const zone = getSavedZoneForNow(state, Date.now(), "emotion");
  const styleDecision = getEmotionStyleDecision(state);
  const styleCopy = describeSessionStyle(styleDecision.style);
  const transferBankUnits = Number(state.transferBankUnits || 0);
  const running = Boolean(emotionSession && emotionSession.status === "running");
  const completed = Boolean(emotionSession && emotionSession.status === "completed");
  const requestedMode = normalizeEmotionMode(emotionPreferences.mode);
  const dualLocked = !unlockProgress.emotionDualUnlocked;
  const setupMode = dualLocked && requestedMode === "emo_dual" ? "emo_loc" : requestedMode;

  if (!running && !completed) {
    const dualHint = dualLocked
      ? '<p class="hint">Dual mode unlocks after stable 2-back in both mono emotional modes.</p>'
      : "";
    return `
      <section class="card game-screen has-bottom-tab">
        <div class="game-topbar">
          <div class="game-topbar-brand">
            <button class="topbar-icon-btn" data-action="go-home" aria-label="Home">
              <img src="../brandingUI/icons/tab-bar/home.svg" alt="" aria-hidden="true">
            </button>
            <strong>Emotional</strong>
          </div>
          <div class="game-topbar-stats">
            <span class="bank-pill"><img src="../brandingUI/icons/gamification/bank-units.svg" alt="" aria-hidden="true"> Training ${state.bankUnits || 0}</span>
            <span class="transfer-pill">Transfer ${transferBankUnits}</span>
          </div>
        </div>
        <h2>Emotional Session</h2>
        <p class="hint">Track location, colour, or both in a 10-block session.</p>
        <div class="stage-panel">
          <p class="kicker">Recommended session style</p>
          ${renderSessionStyleBadge(styleDecision.style)}
          <p class="hint">${escapeHtml(styleCopy.description)}</p>
          <p class="hint">${escapeHtml(styleDecision.reason)}</p>
        </div>
        ${renderZoneStateCard(zone, styleDecision)}
        <div class="stage-panel">
          <div class="row hub-config-row">
            <label class="hub-config-item">
              Emotional mode
              <select id="emotion-mode-select">
                <option value="emo_loc" ${setupMode === "emo_loc" ? "selected" : ""}>Location</option>
                <option value="emo_col" ${setupMode === "emo_col" ? "selected" : ""}>Colour</option>
                <option value="emo_dual" ${setupMode === "emo_dual" ? "selected" : ""} ${dualLocked ? "disabled" : ""}>Dual</option>
              </select>
            </label>
            <label class="hub-config-item">
              Speed
              <select id="emotion-speed-select">
                <option value="slow" ${emotionPreferences.speed === "slow" ? "selected" : ""}>Slow pace</option>
                <option value="fast" ${emotionPreferences.speed === "fast" ? "selected" : ""}>Fast pace</option>
              </select>
            </label>
            <label class="hub-config-item">
              Interference
              <select id="emotion-interference-select">
                <option value="low" ${emotionPreferences.interference === "low" ? "selected" : ""}>Low</option>
                <option value="high" ${emotionPreferences.interference === "high" ? "selected" : ""}>High</option>
              </select>
            </label>
          </div>
          ${dualHint}
          <div class="row home-primary-row">
            <button class="btn primary home-primary-btn" data-action="start-emotion-session">Start ${escapeHtml(emotionModeLabel(setupMode))} Session</button>
          </div>
        </div>
        <div class="row help-action-row">
          ${renderHelpButton("emotion-how", "How to play Emotional")}
        </div>
        ${renderFlash()}
        ${renderBottomTab("hub")}
      </section>
    `;
  }

  if (completed) {
    const summary = emotionSession.sessionSummary;
    const completedMode = summary.emotionalMode || "emo_loc";
    const progressDelta = emotionSession.progressDelta || null;
    const visualStats = computeSessionVisualStats(summary);
    const accuracyChart = renderAccuracyBars(summary.blocks);
    const progressionSummary = progressDelta
      ? `
        <div class="result-earned-row session-earned-box">
          <span>Session earned</span>
          <strong>+${progressDelta.sessionUnitsEarned + progressDelta.missionBonusEarned} units</strong>
        </div>
        <div class="session-bank-lines">
          <p>Session earned: <strong>+${progressDelta.sessionUnitsEarned}</strong></p>
          <p>Mission bonus: <strong>+${progressDelta.missionBonusEarned}</strong></p>
          <p>Total bank: <strong>${progressDelta.bankTotal}</strong></p>
          <p>Transfer bank earned: <strong>+${progressDelta.transferBankDelta || 0}</strong></p>
          <p>Transfer bank total: <strong>${progressDelta.transferBankTotal || transferBankUnits}</strong></p>
          <p>Streak: <strong>${progressDelta.streakCurrent}</strong> (best ${progressDelta.streakBest})</p>
        </div>
      `
      : "";
    const transferEvidenceCard = progressDelta?.transferEvidence
      ? renderTransferEvidenceCard(progressDelta.transferEvidence)
      : "";
    return `
      <section class="card game-screen has-bottom-tab">
        <div class="game-topbar">
          <div class="game-topbar-brand"><strong>Session Complete</strong></div>
          <div class="game-topbar-stats">
            <span class="bank-pill"><img src="../brandingUI/icons/gamification/bank-units.svg" alt="" aria-hidden="true"> Training ${progressDelta?.bankTotal || state.bankUnits || 0}</span>
            <span class="transfer-pill">Transfer ${progressDelta?.transferBankTotal || transferBankUnits}</span>
          </div>
        </div>
        <h2>${escapeHtml(emotionModeToLabel(completedMode))}</h2>
        <p class="hint">10 blocks completed</p>
        <div class="session-stats-grid">
          <div class="session-stat"><span>Peak Level</span><strong>${visualStats.peakN}</strong></div>
          <div class="session-stat"><span>Final Level</span><strong>${visualStats.finalN}</strong></div>
          <div class="session-stat"><span>Stability</span><strong>${visualStats.holdUpCount}/${visualStats.totalBlocks}</strong></div>
        </div>
        ${accuracyChart}
        ${progressionSummary}
        ${transferEvidenceCard}
        <div class="row help-action-row">
          ${renderHelpButton("emotion-how", "How to play Emotional")}
        </div>
        <div class="row home-primary-row">
          <button class="btn primary home-primary-btn" data-action="start-emotion-session"><img class="btn-inline-icon btn-inline-icon-lg" src="../brandingUI/icons/tab-bar/play-hub.svg" alt="" aria-hidden="true">Play Again</button>
        </div>
        <div class="row home-footer-actions">
          <button class="btn" data-action="go-home"><img class="btn-inline-icon" src="../brandingUI/icons/tab-bar/home.svg" alt="" aria-hidden="true">Return Home</button>
        </div>
        ${renderFlash()}
        ${renderBottomTab("hub")}
      </section>
    `;
  }

  const block = emotionSession.currentBlock;
  const trial = block && block.trialIndex >= 0 ? block.trials[block.trialIndex] : null;
  const trialNumber = block ? block.trialIndex + 1 : 0;
  const trialCount = block ? block.trials.length : 0;
  const responseLocCaptured = block ? block.responseLocCaptured : false;
  const responseColCaptured = block ? block.responseColCaptured : false;
  const paused = Boolean(emotionSession?.trialPaused);
  const activeMode = block?.plan?.mode || emotionSession.mode;
  const targetLabel = emotionModeTarget(activeMode);
  const trialProgressPct = trialCount > 0 ? Math.max(0, Math.min(100, Math.round((trialNumber / trialCount) * 100))) : 0;

  let phasePanel = "";
  if (emotionSession.phase === "loading") {
    phasePanel = `
      <div class="stage-panel trial-stage">
        <p class="kicker">Preparing</p>
        <h3>Preparing stimuli...</h3>
        <p class="hint">Faces are preloading for smooth playback.</p>
      </div>
    `;
  } else if (emotionSession.phase === "briefing") {
    phasePanel = `
      <div class="stage-panel">
        <p class="kicker">Block ${emotionSession.blockCursor + 1} of ${EMO_TOTAL_BLOCKS}</p>
        <h3>Ready?</h3>
        <p class="hint">Target: ${escapeHtml(targetLabel)} at ${block?.plan?.n || emotionSession.currentN}-back.</p>
        <button class="btn primary home-primary-btn" data-action="emotion-start-block">Start Block</button>
      </div>
    `;
  } else if (emotionSession.phase === "cue") {
    phasePanel = `
      <div class="stage-panel trial-stage">
        <p class="kicker">Target</p>
        <div class="cue-target-card">${escapeHtml(targetLabel)}</div>
        <p class="hint">Starting now...</p>
      </div>
    `;
  } else if (emotionSession.phase === "trial") {
    const locEnabled = activeMode === "emo_loc" || activeMode === "emo_dual";
    const colEnabled = activeMode === "emo_col" || activeMode === "emo_dual";
    phasePanel = `
      <div class="stage-panel trial-stage">
        <div class="trial-progress-track"><span style="width:${trialProgressPct}%;"></span></div>
        <p class="hint">Trial ${trialNumber}/${trialCount}</p>
        ${renderEmotionStimulus(trial, block.stimulusVisible, activeMode, block.renderMapping)}
        <div class="row">
          <button class="btn primary match-btn" data-action="emotion-match-loc" ${(!locEnabled || responseLocCaptured || paused) ? "disabled" : ""}>LOCATION MATCH</button>
          <button class="btn primary match-btn" data-action="emotion-match-col" ${(!colEnabled || responseColCaptured || paused) ? "disabled" : ""}>COLOUR MATCH</button>
        </div>
        <p class="hint">Keys: Left Arrow = Location, Right Arrow = Colour.</p>
        <div class="row pause-control-row">
          <button class="btn subtle pause-btn" data-action="emotion-toggle-pause">${paused ? "Resume" : "Pause"}</button>
          <button class="btn subtle stop-btn" data-action="emotion-stop-session">Stop</button>
        </div>
      </div>
    `;
  } else {
    const nextPatch = emotionSession.pendingPlanPatch && typeof emotionSession.pendingPlanPatch === "object"
      ? emotionSession.pendingPlanPatch
      : {};
    const nextSpeed = nextPatch.speed ? normalizeEmotionSpeed(nextPatch.speed) : normalizeEmotionSpeed(emotionPreferences.speed);
    const nextInterference = nextPatch.interference
      ? normalizeEmotionInterference(nextPatch.interference)
      : normalizeEmotionInterference(emotionPreferences.interference);
    phasePanel = `
      <div class="stage-panel result-stage">
        ${renderEmotionBlockSummary(emotionSession.lastBlockSummary)}
        ${emotionSession.coachNotice ? `<p class="hint"><strong>Coach recommends:</strong> ${escapeHtml(emotionSession.coachNotice)}</p>` : ""}
        <p class="hint"><strong>Next block:</strong> ${escapeHtml(nextSpeed)} speed, ${escapeHtml(nextInterference)} interference.</p>
        <button class="btn primary home-primary-btn" data-action="emotion-next-block">Next Block</button>
      </div>
    `;
  }

  return `
    <section class="card game-screen play-session-screen">
      <div class="game-topbar">
        <div class="game-topbar-brand">
          <span>Block ${emotionSession.blockCursor + (emotionSession.phase === "block-result" ? 0 : 1)}/${EMO_TOTAL_BLOCKS}</span>
          <span>Level ${emotionSession.currentN}</span>
        </div>
        <div class="game-topbar-stats">
          <span class="bank-pill"><img src="../brandingUI/icons/gamification/bank-units.svg" alt="" aria-hidden="true"> Training ${state.bankUnits || 0}</span>
          <span class="transfer-pill">Transfer ${transferBankUnits}</span>
          ${renderHelpMiniButton("emotion-how")}
        </div>
      </div>
      <p class="hint run-context-line">${escapeHtml(emotionModeToLabel(activeMode))} | ${escapeHtml(describeSessionStyle(emotionSession.sessionStyle || "TUNE").label)}</p>
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

  if (!running && !completed) {
    const lockText = unlockProgress.unlockOverrideActive
      ? "Relational unlock override is active for inspection."
      : (relationalUnlocked
        ? "Relational modes are available."
        : "Complete both Hub games and Emotional dual to unlock Relational.");
    return `
      <section class="card game-screen">
        <div class="game-topbar">
          <div class="game-topbar-brand">
            <button class="topbar-icon-btn" data-action="go-home" aria-label="Home">
              <img src="../brandingUI/icons/tab-bar/home.svg" alt="" aria-hidden="true">
            </button>
            <strong>Relational</strong>
          </div>
          <div class="game-topbar-stats">
            <span class="bank-pill"><img src="../brandingUI/icons/gamification/bank-units.svg" alt="" aria-hidden="true"> ${state.bankUnits}</span>
          </div>
        </div>
        <h2>Choose Relational Mode</h2>
        <p class="hint">MATCH rhythm plus 2 timed quiz prompts each block.</p>
        <div class="mode-panel">
          <div class="mode-grid mode-grid-rel">
            <button class="mode-tile mode-action" data-action="start-relational-session" data-mode="transitive" ${relationalUnlocked ? "" : "disabled"}>
              <img src="../brandingUI/icons/game/transitive-order.svg" alt="" aria-hidden="true">
              <strong>Transitive</strong>
              <span>${relationalUnlocked ? "Available" : "Locked"}</span>
            </button>
            <button class="mode-tile mode-action" data-action="start-relational-session" data-mode="graph" ${relationalUnlocked ? "" : "disabled"}>
              <img src="../brandingUI/icons/game/graph-directed.svg" alt="" aria-hidden="true">
              <strong>Graph</strong>
              <span>${relationalUnlocked ? "Available" : "Locked"}</span>
            </button>
            <button class="mode-tile mode-action" data-action="start-relational-session" data-mode="propositional" ${relationalUnlocked ? "" : "disabled"}>
              <img src="../brandingUI/icons/game/propositional.svg" alt="" aria-hidden="true">
              <strong>Propositional</strong>
              <span>${relationalUnlocked ? "Available" : "Locked"}</span>
            </button>
          </div>
          <div class="row mode-help-row">
            ${renderHelpButton("rel-transitive-how", "Transitive help")}
            ${renderHelpButton("rel-graph-how", "Graph help")}
            ${renderHelpButton("rel-propositional-how", "Propositional help")}
          </div>
        </div>
        ${renderRelationalProgressCard(unlockProgress)}
        <p class="hint">${lockText}</p>
        <div class="row home-footer-actions">
          <button class="btn" data-action="go-home"><img class="btn-inline-icon" src="../brandingUI/icons/tab-bar/home.svg" alt="" aria-hidden="true">Return Home</button>
        </div>
        ${renderFlash()}
      </section>
    `;
  }

  if (completed) {
    const summary = relSession.sessionSummary;
    const completedWrapper = summary.blocksPlanned?.[0]?.wrapper || "transitive";
    const quizCorrect = summary.blocks.reduce((sum, block) => sum + Number(block.quizCorrect || 0), 0);
    const quizTotal = REL_TOTAL_BLOCKS * 2;
    const progressDelta = relSession.progressDelta || null;
    const visualStats = computeSessionVisualStats(summary);
    const accuracyChart = renderAccuracyBars(summary.blocks);
    const progressionSummary = progressDelta
      ? `
        <div class="result-earned-row session-earned-box">
          <span>Session earned</span>
          <strong>+${progressDelta.sessionUnitsEarned + progressDelta.missionBonusEarned} units</strong>
        </div>
        <div class="session-bank-lines">
          <p>Session earned: <strong>+${progressDelta.sessionUnitsEarned}</strong></p>
          <p>Mission bonus: <strong>+${progressDelta.missionBonusEarned}</strong></p>
          <p>Total bank: <strong>${progressDelta.bankTotal}</strong></p>
          <p>Streak: <strong>${progressDelta.streakCurrent}</strong> (best ${progressDelta.streakBest})</p>
        </div>
      `
      : "";
    const allCleanNote = progressDelta?.allBlocksClean
      ? `<p class="prestige-note">All Blocks Clean (prestige)</p>`
      : "";

    return `
      <section class="card game-screen">
        <div class="game-topbar">
          <div class="game-topbar-brand"><strong>Session Complete</strong></div>
          <div class="game-topbar-stats">
            <span class="bank-pill"><img src="../brandingUI/icons/gamification/bank-units.svg" alt="" aria-hidden="true"> ${progressDelta?.bankTotal || state.bankUnits}</span>
          </div>
        </div>
        <h2>${wrapperDisplayName(completedWrapper)}</h2>
        <p class="hint">Quiz total ${quizCorrect}/${quizTotal}</p>
        <div class="session-stats-grid">
          <div class="session-stat"><span>Peak Level</span><strong>${visualStats.peakN}</strong></div>
          <div class="session-stat"><span>Final Level</span><strong>${visualStats.finalN}</strong></div>
          <div class="session-stat"><span>Stability</span><strong>${visualStats.holdUpCount}/${visualStats.totalBlocks}</strong></div>
        </div>
        ${accuracyChart}
        ${progressionSummary}
        ${allCleanNote}
        <div class="row help-action-row">
          ${renderHelpButton(helpTopicForRelWrapper(completedWrapper), "How to play this game")}
        </div>
        <div class="row home-primary-row">
          <button class="btn primary home-primary-btn" data-action="start-relational-session" data-mode="transitive"><img class="btn-inline-icon btn-inline-icon-lg" src="../brandingUI/icons/tab-bar/play-relational.svg" alt="" aria-hidden="true">Play Again</button>
        </div>
        <div class="row home-footer-actions">
          <button class="btn" data-action="go-home"><img class="btn-inline-icon" src="../brandingUI/icons/tab-bar/home.svg" alt="" aria-hidden="true">Return Home</button>
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
  const relTrialPaused = Boolean(relSession?.trialPaused);
  const trialProgressPct = trialCount > 0 ? Math.max(0, Math.min(100, Math.round((trialNumber / trialCount) * 100))) : 0;

  let phasePanel = "";
  if (relSession.phase === "briefing") {
    phasePanel = `
      <div class="stage-panel">
        <p class="kicker">Block ${relSession.blockCursor + 1} of ${REL_TOTAL_BLOCKS}</p>
        <h3>Ready?</h3>
        <p class="hint">Read the briefing and press Start Block.</p>
      </div>
    `;
  } else if (relSession.phase === "cue") {
    phasePanel = `
      <div class="stage-panel trial-stage">
        <p class="kicker">Target</p>
        <div class="cue-target-card">${escapeHtml(relSession.wrapper.toUpperCase())}</div>
        <p class="hint">Starting now...</p>
      </div>
    `;
  } else if (relSession.phase === "trial") {
    const pauseControls = `
      <div class="row pause-control-row">
        <button class="btn subtle pause-btn" data-action="rel-toggle-pause">${relTrialPaused ? "Resume" : "Pause"}</button>
        <button class="btn subtle stop-btn" data-action="rel-stop-session">Stop</button>
      </div>
    `;
    phasePanel = `
      <div class="stage-panel trial-stage">
        <div class="trial-progress-track"><span style="width:${trialProgressPct}%;"></span></div>
        <p class="hint">Trial ${trialNumber}/${trialCount}</p>
        ${renderRelationalStimulus(trial, block.stimulusVisible)}
        <button class="btn primary match-btn game-match-btn" data-action="rel-match" ${(responseCaptured || relTrialPaused) ? "disabled" : ""}>MATCH</button>
        ${pauseControls}
      </div>
    `;
  } else if (relSession.phase === "quiz") {
    const quizItem = block.quizItems[block.quizIndex];
    const secsLeft = Math.max(0, Math.ceil((block.quizTimeLeftMs || 0) / 1000));
    const quizLocked = Boolean(block.quizAnswerCommitted);
    const timePct = Math.max(0, Math.min(100, Math.round(((block.quizTimeLeftMs || 0) / REL_QUIZ_TIMEOUT_MS) * 100)));
    phasePanel = `
      <div class="stage-panel quiz-stage">
        <div class="quiz-head-row">
          <span>Question ${block.quizIndex + 1} of 2</span>
          <span class="quiz-chip">Quiz</span>
        </div>
        <div class="quiz-card">
          <p class="kicker">Is this true?</p>
          <p class="rel-quiz-prompt">${escapeHtml(quizItem.prompt)}</p>
        </div>
        <div class="row quiz-action-row">
          <button class="btn quiz-btn" data-action="rel-quiz-answer" data-answer="true" ${quizLocked ? "disabled" : ""}>True</button>
          <button class="btn quiz-btn" data-action="rel-quiz-answer" data-answer="false" ${quizLocked ? "disabled" : ""}>False</button>
        </div>
        <div class="quiz-timer-row">
          <div class="trial-progress-track"><span style="width:${timePct}%;"></span></div>
          <p class="hint">${secsLeft}s remaining</p>
        </div>
      </div>
    `;
  } else {
    const coachBriefingPreview = getCoachBriefingPreviewCopy(relSession?.pendingPlanPatch?.flags?.coachState || null);
    phasePanel = `
      <div class="stage-panel result-stage">
        ${renderRelationalBlockSummary(relSession.lastBlockSummary)}
        ${coachBriefingPreview ? `<p class="hint">${escapeHtml(coachBriefingPreview)}</p>` : ""}
        <button class="btn primary home-primary-btn" data-action="rel-next-block">Next Block</button>
      </div>
    `;
  }

  return `
    <section class="card game-screen play-session-screen">
      <div class="game-topbar">
        <div class="game-topbar-brand">
          <span>Block ${relSession.blockCursor + (relSession.phase === "block-result" ? 0 : 1)}/${REL_TOTAL_BLOCKS}</span>
          <span>Level ${relSession.currentN}</span>
        </div>
        <div class="game-topbar-stats">
          <span class="bank-pill"><img src="../brandingUI/icons/gamification/bank-units.svg" alt="" aria-hidden="true"> ${state.bankUnits}</span>
          ${renderHelpMiniButton(helpTopicForRelWrapper(relSession.wrapper))}
        </div>
      </div>
      <p class="hint run-context-line">${wrapperDisplayName(relSession.wrapper)} game</p>
      ${phasePanel}
      ${renderFlash()}
    </section>
  `;
}
function renderHistory(history) {
  const recent = history.slice(0, 5);
  const peakSeries = recent.map((session) => computeSessionVisualStats(session).peakN);
  const accSeries = recent.map((session) => {
    const blocks = Array.isArray(session.blocks) ? session.blocks : [];
    if (!blocks.length) {
      return 0;
    }
    const mean = blocks.reduce((sum, block) => sum + Number(block?.accuracy || 0), 0) / blocks.length;
    return Math.round(mean * 100);
  });
  const maxPeak = peakSeries.length ? Math.max(...peakSeries, 1) : 1;
  const peakPoints = peakSeries.length
    ? peakSeries.map((value, idx) => `${(idx / Math.max(peakSeries.length - 1, 1)) * 100},${100 - ((value / maxPeak) * 100)}`).join(" ")
    : "";
  const maxAcc = 100;
  const accPoints = accSeries.length
    ? accSeries.map((value, idx) => `${(idx / Math.max(accSeries.length - 1, 1)) * 100},${100 - ((value / maxAcc) * 100)}`).join(" ")
    : "";

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
    const styleLine = session.wrapperFamily === "hub" && session.sessionStyle
      ? `<p class="hint">Session style: ${escapeHtml(describeSessionStyle(session.sessionStyle).label)}</p>`
      : "";
    const transferLine = session.wrapperFamily === "hub" && session.transferEvidence?.title
      ? `<p class="hint">Transfer: ${escapeHtml(session.transferEvidence.title)}</p>`
      : "";
    const modeText = mode ? wrapperDisplayName(mode) : "";
    const modeIcon = wrapperIconPath(mode || session.wrapperFamily);
    return `
      <li class="history-item">
        <p class="history-item-title">
          <img class="history-item-icon" src="${modeIcon}" alt="" aria-hidden="true">
          <strong>${escapeHtml(wrapperDisplayName(mode || session.wrapperFamily || "session"))}</strong>
        </p>
        <p>Date: ${escapeHtml(session.dateLocal || "")} | Blocks: ${blockCount}</p>
        <div class="history-mini-grid">
          <span>Peak ${stats.peakN}</span>
          <span>Final ${stats.finalN}</span>
          <span>+${units} units</span>
        </div>
        ${quizLine}
        ${styleLine}
        ${transferLine}
        ${modeText ? `<p class="hint">Mode: ${escapeHtml(modeText)}</p>` : ""}
      </li>
    `;
  }).join("");

  return `
    <section class="card game-screen">
      <div class="game-topbar">
        <div class="game-topbar-brand">
          <button class="topbar-icon-btn" data-action="go-home" aria-label="Home">
            <img src="../brandingUI/icons/tab-bar/home.svg" alt="" aria-hidden="true">
          </button>
          <strong>Progress</strong>
        </div>
      </div>
      <p class="hint">Your training history</p>
      <div class="session-chart-card">
        <p class="kicker">Peak level trend</p>
        ${peakSeries.length ? `<svg class="trend-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${peakPoints}"></polyline></svg>` : "<p class='hint'>No data yet.</p>"}
      </div>
      <div class="session-chart-card">
        <p class="kicker">Session accuracy trend</p>
        ${accSeries.length ? `<svg class="trend-svg trend-svg-green" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${accPoints}"></polyline></svg>` : "<p class='hint'>No data yet.</p>"}
      </div>
      ${renderFlash()}
      ${history.length ? `<ul class="history-list">${items}</ul>` : "<p>No sessions yet.</p>"}
      ${renderBottomTab("history")}
    </section>
  `;
}

function renderSettings(state) {
  const zone = getSavedZoneForNow(state);
  const zoneCopy = buildZoneStatusCopy(zone);
  const zoneStamp = Number.isFinite(zone?.timestamp)
    ? new Date(zone.timestamp).toLocaleString()
    : "Not imported";
  return `
    <section class="card game-screen has-bottom-tab">
      <div class="game-topbar">
        <div class="game-topbar-brand">
          <button class="topbar-icon-btn" data-action="go-home" aria-label="Home">
            <img src="../brandingUI/icons/tab-bar/home.svg" alt="" aria-hidden="true">
          </button>
          <strong>Settings</strong>
        </div>
      </div>
      <div class="label-row">
        <label>
          <input class="toggle" id="sound-toggle" type="checkbox" ${state.settings.soundOn ? "checked" : ""}>
          Sound enabled
        </label>
      </div>
      <div class="stage-panel">
        <p class="kicker">Zone integration</p>
        <p><strong>${escapeHtml(zoneCopy.title)}</strong></p>
        <p class="hint">${escapeHtml(zoneCopy.detail)}</p>
        <p class="hint">Last imported: ${escapeHtml(zoneStamp)}</p>
        <div class="row">
          <button class="btn" data-action="import-zone-handoff">Import latest Zone result</button>
        </div>
      </div>
      <div class="row home-footer-actions">
        <button class="btn" data-action="export-json">Export JSON</button>
        <button class="btn danger" data-action="reset-data">Reset Local Data</button>
      </div>
      <p class="hint">Export gives you a full backup of local training data.</p>
      ${renderFlash()}
      ${renderBottomTab("settings")}
    </section>
  `;
}

function renderSplashOverlay() {
  return `
    <div class="app-overlay">
      <div class="overlay-backdrop" data-action="splash-dismiss"></div>
      <div class="overlay-card splash-overlay" data-action="splash-dismiss">
        <img class="splash-logo" src="../brandingUI/Trident-G-Icon.svg" alt="Trident G">
        <h2>IQ Capacity</h2>
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
      <div class="overlay-card briefing-sheet">
        <div class="briefing-meta-row">
          <p><strong>Block ${block.plan.blockIndex} of ${HUB_TOTAL_BLOCKS}</strong></p>
          <p>T = ${block.trials.length} trials</p>
        </div>
        <h3>Remember ${escapeHtml(displayHubTargetLabel(block.plan.targetModality, block.plan.wrapper).toLowerCase())}</h3>
        <p>Press MATCH when the target repeats at ${block.plan.n}-back.</p>
        ${renderTargetModalityLegend(block.plan.targetModality, block.plan.wrapper)}
        <div class="briefing-chip-row">
          <span class="briefing-chip"><small>Level</small><strong>${block.plan.n}</strong></span>
          <span class="briefing-chip"><small>Speed</small><strong>${escapeHtml(block.plan.speed)}</strong></span>
          <span class="briefing-chip"><small>Game</small><strong>${escapeHtml(wrapperDisplayName(block.plan.wrapper))}</strong></span>
        </div>
        ${coachPreview ? `<p class="hint">${escapeHtml(coachPreview)}</p>` : ""}
        <div class="overlay-actions">
          <button class="btn primary home-primary-btn" data-action="hub-start-block">Start Block</button>
        </div>
        ${canTapDismiss ? '<p class="hint">Tip: tap outside to start quickly.</p>' : ""}
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
      <div class="overlay-card briefing-sheet">
        <div class="briefing-meta-row">
          <p><strong>Block ${block.plan.blockIndex} of ${REL_TOTAL_BLOCKS}</strong></p>
          <p>T = ${block.trials.length} trials</p>
        </div>
        <h3>${escapeHtml(wrapperDisplayName(relSession.wrapper))}</h3>
        <p>Press MATCH when the current token matches ${block.plan.n}-back.</p>
        <div class="briefing-chip-row">
          <span class="briefing-chip"><small>Level</small><strong>${block.plan.n}</strong></span>
          <span class="briefing-chip"><small>Speed</small><strong>${escapeHtml(block.plan.speed)}</strong></span>
          <span class="briefing-chip"><small>Interf</small><strong>${escapeHtml(block.plan.interference)}</strong></span>
        </div>
        ${coachPreview ? `<p class="hint">${escapeHtml(coachPreview)}</p>` : ""}
        <div class="overlay-actions">
          <button class="btn primary home-primary-btn" data-action="rel-start-block">Start Block</button>
        </div>
        ${canTapDismiss ? '<p class="hint">Tip: tap outside to start quickly.</p>' : ""}
      </div>
    </div>
  `;
}

function renderUnlockCelebrationOverlay() {
  return `
    <div class="app-overlay">
      <div class="overlay-backdrop" data-action="unlock-close"></div>
      <div class="overlay-card unlock-sheet">
        <img class="unlock-badge" src="../brandingUI/icons/status/unlock.svg" alt="Unlocked">
        <h3>New Modes Unlocked</h3>
        <p>You qualified in Hub and Emotional dual criteria. Relational training is now available.</p>
        <div class="unlock-icons unlock-icons-large">
          <span class="unlock-icon"><img src="../brandingUI/icons/game/transitive-order.svg" alt="Transitive"></span>
          <span class="unlock-icon"><img src="../brandingUI/icons/game/graph-directed.svg" alt="Graph"></span>
          <span class="unlock-icon"><img src="../brandingUI/icons/game/propositional.svg" alt="Propositional"></span>
        </div>
        <div class="overlay-actions">
          <button class="btn primary home-primary-btn" data-action="unlock-go-relational">Try Relational Mode</button>
          <button class="btn" data-action="unlock-close">Return Home</button>
        </div>
      </div>
    </div>
  `;
}

function renderHelpOverlay() {
  const topic = uiState.helpTopic && HELP_TOPICS[uiState.helpTopic]
    ? HELP_TOPICS[uiState.helpTopic]
    : null;
  if (!topic) {
    return "";
  }
  const images = Array.isArray(topic.images)
    ? topic.images.filter((item) => item && typeof item.path === "string")
    : [];
  const hasGallery = images.length > 0;
  const imagePath = !hasGallery && typeof topic.imagePath === "string" ? topic.imagePath : "";
  const imageAlt = typeof topic.imageAlt === "string" ? topic.imageAlt : topic.title;
  const hasGraphic = hasGallery || Boolean(imagePath);
  const galleryMarkup = hasGallery
    ? `
      <div class="help-graphic-grid">
        ${images.map((item) => {
          const alt = typeof item.alt === "string" ? item.alt : topic.title;
          const label = typeof item.label === "string" ? item.label : "";
          return `
            <figure class="help-graphic-tile">
              <img class="help-graphic" src="${item.path}" alt="${escapeHtml(alt)}" loading="eager" decoding="sync" fetchpriority="high">
              ${label ? `<figcaption class="help-graphic-caption">${escapeHtml(label)}</figcaption>` : ""}
            </figure>
          `;
        }).join("")}
      </div>
    `
    : (hasGraphic ? `<img class="help-graphic" src="${imagePath}" alt="${escapeHtml(imageAlt)}" loading="eager" decoding="sync" fetchpriority="high">` : "");
  const links = Array.isArray(topic.links)
    ? topic.links.filter((item) => item && typeof item.href === "string" && item.href.trim())
    : [];
  const lines = Array.isArray(topic.lines) ? topic.lines : [];
  const sections = Array.isArray(topic.sections)
    ? topic.sections.filter((item) => item && typeof item.heading === "string" && item.heading.trim())
    : [];
  const linesMarkup = lines.length
    ? `
      <div class="help-lines">
        ${lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
      </div>
    `
    : "";
  const sectionsMarkup = sections.length
    ? `
      <div class="help-sections">
        ${sections.map((section) => {
          const points = Array.isArray(section.points) ? section.points.filter((point) => typeof point === "string" && point.trim()) : [];
          const pointsMarkup = points.length
            ? `<ul>${points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>`
            : "";
          return `
            <section class="help-section">
              <h4>${escapeHtml(section.heading)}</h4>
              ${pointsMarkup}
            </section>
          `;
        }).join("")}
      </div>
    `
    : "";
  const linksMarkup = links.length
    ? `
      <div class="help-links">
        ${links.map((item) => {
          const href = String(item.href).trim();
          const label = typeof item.label === "string" && item.label.trim()
            ? item.label.trim()
            : href;
          return `<a class="help-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
        }).join("")}
      </div>
    `
    : "";
  return `
    <div class="app-overlay">
      <div class="overlay-backdrop" data-action="help-close"></div>
      <div class="overlay-card help-sheet ${hasGraphic ? "with-media" : ""}">
        <h3>${escapeHtml(topic.title)}</h3>
        ${galleryMarkup}
        ${linesMarkup}
        ${sectionsMarkup}
        ${linksMarkup}
        <div class="overlay-actions">
          <button class="btn primary" data-action="help-close">Got it</button>
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
  if (uiState.activeOverlay === "help") {
    return renderHelpOverlay();
  }
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
  if (route !== "play-emotion" && emotionSession && emotionSession.status === "running") {
    clearEmotionTimers();
    emotionSession = null;
    closeBriefingOverlay();
    setFlash("Emotional session stopped because you left Play Emotional before completion.", "warn");
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
    emotion: () => renderPlayEmotion(),
    relational: () => renderPlayRelational(state),
    history: () => renderHistory(getSessionHistory()),
    settings: () => renderSettings(state)
  });
  const overlayHtml = renderActiveOverlay(state);
  appRoot.innerHTML = `${pageHtml}${overlayHtml}`;
}

function startHubSession() {
  warmAudioAfterSessionStart();
  clearHubTimers();
  clearFlash();
  dismissUnlockCelebration();
  closeBriefingOverlay();
  const state = loadGymState();
  const firstHubRun = isFirstHubRun(state);
  const tsStart = Date.now();
  const styleDecision = getHubStyleDecision(state, tsStart);
  const styleCopy = describeSessionStyle(styleDecision.style);
  const recheckSignature = styleDecision.pendingCandidate?.signature
    ? { ...styleDecision.pendingCandidate.signature }
    : null;
  const selectedWrapper = normalizeHubWrapper(hubPreferences.wrapper);
  const sessionSeed = hash32(String(tsStart));
  const initialWrapper = styleDecision.style === "RECHECK" && recheckSignature
    ? (recheckSignature.baselineWrapper === "hub_noncat" ? "hub_noncat" : "hub_cat")
    : selectedWrapper;
  const initialN = firstHubRun
    ? FIRST_RUN_BASELINE_BLOCK.n
    : (styleDecision.style === "RESET" ? Math.min(2, Math.max(1, Number(state.settings?.lastRecommendedLevel || 2))) : 1);
  const initialSpeed = firstHubRun ? FIRST_RUN_BASELINE_BLOCK.speed : undefined;
  const initialInterference = firstHubRun ? FIRST_RUN_BASELINE_BLOCK.interference : undefined;

  hubSession = {
    status: "running",
    phase: "briefing",
    tsStart,
    sessionSeed,
    sessionStyle: styleDecision.style,
    sessionStyleReason: styleDecision.reason,
    zoneGate: styleDecision.zoneHandoff || null,
    recheckCandidateId: styleDecision.pendingCandidate?.id || null,
    recheckSignature,
    probeRunConfig: null,
    recheckRunConfig: null,
    baselineWrapper: initialWrapper,
    blockCursor: 0,
    currentN: initialN,
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
    introNotice: firstHubRun
      ? "Starting with a gentle baseline block."
      : `${styleCopy.label} session. ${styleDecision.reason}`,
    coachNotice: "",
    trialPaused: false,
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
  const patchWithDefaultOverrideRaw = isOverrideCoachState && !pendingFlags.userOverride
    ? {
      ...pendingPatch,
      flags: {
        ...pendingFlags,
        userOverride: "coach"
      }
    }
    : pendingPatch;
  const patchWithDefaultOverride = applyHubSessionStylePatch(
    hubSession,
    patchWithDefaultOverrideRaw,
    blockIndex,
    lastPlan
  );

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
  hubSession.trialPaused = false;
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
    trialElapsedMs: 0,
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
  block.trialElapsedMs = 0;
  block.trialStartedAtMs = performance.now();
  hubSession.trialPaused = false;
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

function pauseHubTrial() {
  if (!hubSession || hubSession.status !== "running" || hubSession.phase !== "trial" || !hubSession.currentBlock) {
    return;
  }
  if (hubSession.trialPaused) {
    return;
  }
  const block = hubSession.currentBlock;

  block.trialElapsedMs = Math.max(0, Math.round(performance.now() - block.trialStartedAtMs));
  hubSession.trialPaused = true;

  if (hubTimers.display) {
    clearTimeout(hubTimers.display);
    hubTimers.display = null;
  }
  if (hubTimers.trial) {
    clearTimeout(hubTimers.trial);
    hubTimers.trial = null;
  }
  playSfx("pause_on");
  render();
}

function resumeHubTrial() {
  if (!hubSession || hubSession.status !== "running" || hubSession.phase !== "trial" || !hubSession.currentBlock) {
    return;
  }
  if (!hubSession.trialPaused) {
    return;
  }
  const block = hubSession.currentBlock;

  const elapsedMs = Number.isFinite(block.trialElapsedMs)
    ? Math.max(0, Math.round(block.trialElapsedMs))
    : 0;
  const remainingSoaMs = Math.max(0, block.soaMs - elapsedMs);
  const remainingDisplayMs = Math.max(0, block.displayMs - elapsedMs);
  if (remainingSoaMs <= 0) {
    hubSession.trialPaused = false;
    finishHubTrial();
    return;
  }

  block.trialStartedAtMs = performance.now() - elapsedMs;
  hubSession.trialPaused = false;

  if (hubTimers.display) {
    clearTimeout(hubTimers.display);
    hubTimers.display = null;
  }
  if (hubTimers.trial) {
    clearTimeout(hubTimers.trial);
    hubTimers.trial = null;
  }

  if (block.stimulusVisible) {
    if (remainingDisplayMs <= 0) {
      block.stimulusVisible = false;
    } else {
      const trialIndex = block.trialIndex;
      hubTimers.display = setTimeout(() => {
        if (!hubSession || hubSession.status !== "running" || hubSession.phase !== "trial" || hubSession.trialPaused) {
          return;
        }
        const current = hubSession.currentBlock;
        if (!current || current.trialIndex !== trialIndex) {
          return;
        }
        current.stimulusVisible = false;
        render();
      }, remainingDisplayMs);
    }
  }

  hubTimers.trial = setTimeout(() => {
    finishHubTrial();
  }, remainingSoaMs);
  playSfx("resume_on");
  render();
}

function toggleHubPause() {
  if (!hubSession || hubSession.status !== "running" || hubSession.phase !== "trial" || !hubSession.currentBlock) {
    return;
  }
  if (hubSession.trialPaused) {
    resumeHubTrial();
    return;
  }
  pauseHubTrial();
}

function stopHubSession() {
  if (!hubSession || hubSession.status !== "running") {
    return;
  }
  clearHubTimers();
  hubSession = null;
  closeBriefingOverlay();
  playSfx("session_stop_discard");
  setFlash("Hub session stopped. Session discarded and not logged.", "warn", { playWarningSound: false });
  window.location.hash = "/home";
}

function pauseRelationalTrial() {
  if (!relSession || relSession.status !== "running" || relSession.phase !== "trial" || !relSession.currentBlock) {
    return;
  }
  if (relSession.trialPaused) {
    return;
  }
  const block = relSession.currentBlock;
  block.trialElapsedMs = Math.max(0, Math.round(performance.now() - block.trialStartedAtMs));
  relSession.trialPaused = true;

  if (relTimers.display) {
    clearTimeout(relTimers.display);
    relTimers.display = null;
  }
  if (relTimers.trial) {
    clearTimeout(relTimers.trial);
    relTimers.trial = null;
  }
  playSfx("pause_on");
  render();
}

function resumeRelationalTrial() {
  if (!relSession || relSession.status !== "running" || relSession.phase !== "trial" || !relSession.currentBlock) {
    return;
  }
  if (!relSession.trialPaused) {
    return;
  }
  const block = relSession.currentBlock;
  const elapsedMs = Number.isFinite(block.trialElapsedMs)
    ? Math.max(0, Math.round(block.trialElapsedMs))
    : 0;
  const remainingSoaMs = Math.max(0, block.soaMs - elapsedMs);
  const remainingDisplayMs = Math.max(0, block.displayMs - elapsedMs);
  if (remainingSoaMs <= 0) {
    relSession.trialPaused = false;
    finishRelationalTrial();
    return;
  }

  block.trialStartedAtMs = performance.now() - elapsedMs;
  relSession.trialPaused = false;

  if (relTimers.display) {
    clearTimeout(relTimers.display);
    relTimers.display = null;
  }
  if (relTimers.trial) {
    clearTimeout(relTimers.trial);
    relTimers.trial = null;
  }

  if (block.stimulusVisible) {
    if (remainingDisplayMs <= 0) {
      block.stimulusVisible = false;
    } else {
      const trialIndex = block.trialIndex;
      relTimers.display = setTimeout(() => {
        if (!relSession || relSession.status !== "running" || relSession.phase !== "trial" || relSession.trialPaused) {
          return;
        }
        const current = relSession.currentBlock;
        if (!current || current.trialIndex !== trialIndex) {
          return;
        }
        current.stimulusVisible = false;
        render();
      }, remainingDisplayMs);
    }
  }

  relTimers.trial = setTimeout(() => {
    finishRelationalTrial();
  }, remainingSoaMs);
  playSfx("resume_on");
  render();
}

function toggleRelationalPause() {
  if (!relSession || relSession.status !== "running" || relSession.phase !== "trial" || !relSession.currentBlock) {
    return;
  }
  if (relSession.trialPaused) {
    resumeRelationalTrial();
    return;
  }
  pauseRelationalTrial();
}

function stopRelationalSession() {
  if (!relSession || relSession.status !== "running") {
    return;
  }
  clearRelTimers();
  relSession = null;
  closeBriefingOverlay();
  playSfx("session_stop_discard");
  setFlash("Relational session stopped. Session discarded and not logged.", "warn", { playWarningSound: false });
  window.location.hash = "/home";
}

function captureHubResponse() {
  if (!hubSession || hubSession.status !== "running" || hubSession.phase !== "trial" || !hubSession.currentBlock) {
    return false;
  }
  if (hubSession.trialPaused) {
    return false;
  }
  const block = hubSession.currentBlock;
  if (block.responseCaptured) {
    return false;
  }
  block.responseCaptured = true;
  block.responseRtMs = Math.max(0, Math.round(performance.now() - block.trialStartedAtMs));
  playSfx("game_match_press", {
    onceKey: `${hubTrialAudioBaseKey(block)}:match-press`
  });
  const isMatch = isHubMatchAtIndex(block.trials, block.trialIndex, block.plan.n);
  playHubTrialOutcomeSfx(block, isMatch ? "hit" : "false_alarm");
  render();
  return true;
}

function finishHubTrial() {
  if (!hubSession || hubSession.status !== "running" || !hubSession.currentBlock) {
    return;
  }
  hubSession.trialPaused = false;
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
  playHubTrialOutcomeSfx(block, classification);

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
  playBlockProgressSfx(blockSummary.blockResult);
  playSfx("coach_next_block");

  const nextBlockIndex = hubSession.blockCursor + 1;
  const coachDecision = coachUpdateAfterBlock(hubSession.lastBlockSummary, {
    completedBlocks: hubSession.completedBlocks,
    coachContext: hubSession.coachContext
  });
  if (coachDecision && typeof coachDecision === "object") {
    const coachPatch = coachDecision.patch && typeof coachDecision.patch === "object"
      ? coachDecision.patch
      : {};
    hubSession.pendingPlanPatch = applyHubSessionStylePatch(
      hubSession,
      coachPatch,
      nextBlockIndex,
      block.plan
    );
    hubSession.coachContext = coachDecision.coachContext && typeof coachDecision.coachContext === "object"
      ? coachDecision.coachContext
      : hubSession.coachContext;
    const coachState = hubSession.pendingPlanPatch?.flags?.coachState || coachDecision.patch?.flags?.coachState;
    hubSession.coachNotice = makeCoachNarrative(coachState, typeof coachDecision.notice === "string" ? coachDecision.notice : "");
  } else {
    hubSession.pendingPlanPatch = applyHubSessionStylePatch(
      hubSession,
      {},
      nextBlockIndex,
      block.plan
    );
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
  summary.sessionStyle = hubSession.sessionStyle || null;
  summary.zoneGate = hubSession.zoneGate || null;
  const precomputedHubTransfer = applyHubTransferOutcome({
    progression: stateBefore.progression,
    summary,
    sessionStyle: hubSession.sessionStyle,
    nowTs: tsEnd
  });
  summary.transferEvidence = precomputedHubTransfer.transferEvidence;
  appendSessionSummary(summary);
  const progressDelta = applySessionProgressAndSave(summary, "hub", {
    hubTransferOutcome: precomputedHubTransfer
  });
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
  playSessionRewardSfx(progressDelta);
  setFlash("Hub session complete and saved to History.", "success");
  render();
}

async function buildEmotionBlockFromPlan(plan, blockIndex, sessionTsStart) {
  let assets;
  try {
    assets = await ensureEmotionAssetsLoaded();
  } catch {
    if (emotionSession && emotionSession.tsStart === sessionTsStart) {
      clearEmotionTimers();
      emotionSession = null;
      closeBriefingOverlay();
      setFlash("Could not load emotional stimuli. Check local files and retry.", "warn");
      render();
    }
    return;
  }

  if (!emotionSession || emotionSession.status !== "running" || emotionSession.tsStart !== sessionTsStart) {
    return;
  }

  const blockBuild = createEmotionBlockTrials({
    mode: plan.mode,
    n: plan.n,
    speed: plan.speed,
    interference: plan.interference,
    representationPack: plan.representationPack,
    assets,
    baseTrials: EMO_BASE_TRIALS,
    seed: Date.now() + blockIndex
  });
  const preloadSources = Array.from(new Set(
    blockBuild.trials
      .map((trial) => String(trial?.display?.faceSrc || trial?.faceSrc || ""))
      .filter(Boolean)
  ));
  const preloadResult = await preloadEmotionImages(preloadSources, "high");
  if (!emotionSession || emotionSession.status !== "running" || emotionSession.tsStart !== sessionTsStart) {
    return;
  }
  if (Array.isArray(preloadResult.failedSources) && preloadResult.failedSources.length) {
    const fallbackFace = assets.fallbackFace
      || assets.facesByPack?.A?.[0]
      || assets.facesByPack?.B?.[0]
      || null;
    blockBuild.trials = replaceFailedEmotionFaces(blockBuild.trials, preloadResult.failedSources, fallbackFace);
    if (fallbackFace?.src) {
      await preloadEmotionImages([fallbackFace.src], "high");
    }
  }
  if (!emotionSession || emotionSession.status !== "running" || emotionSession.tsStart !== sessionTsStart) {
    return;
  }

  emotionSession.trialPaused = false;
  emotionSession.currentBlock = {
    plan,
    trials: blockBuild.trials,
    soaMs: blockBuild.soaMs,
    displayMs: blockBuild.displayMs,
    renderMapping: blockBuild.renderMapping,
    trialIndex: -1,
    stimulusVisible: false,
    responseLocCaptured: false,
    responseColCaptured: false,
    responseLocRtMs: null,
    responseColRtMs: null,
    trialElapsedMs: 0,
    trialStartedAtMs: 0,
    trialOutcomes: []
  };
  emotionSession.phase = "briefing";
  render();
}

function startEmotionSession() {
  warmAudioAfterSessionStart();
  clearEmotionTimers();
  clearFlash();
  dismissUnlockCelebration();
  closeBriefingOverlay();
  const state = loadGymState();
  const unlockProgress = deriveRelationalUnlockProgress(state.history);
  let selectedMode = normalizeEmotionMode(emotionPreferences.mode);
  if (selectedMode === "emo_dual" && !unlockProgress.emotionDualUnlocked) {
    selectedMode = "emo_loc";
    emotionPreferences.mode = "emo_loc";
    updateSettings({ lastEmotionMode: "emo_loc" });
    setFlash("Emotional dual mode is locked. Starting in location mode.", "warn");
  }

  const tsStart = Date.now();
  const styleDecision = getEmotionStyleDecision(state, tsStart);
  const styleCopy = describeSessionStyle(styleDecision.style);
  const recheckSignature = styleDecision.pendingCandidate?.signature
    ? { ...styleDecision.pendingCandidate.signature }
    : null;
  const initialMode = styleDecision.style === "RECHECK" && recheckSignature
    ? normalizeEmotionModeForPlan(recheckSignature.baselineMode)
    : selectedMode;
  if (initialMode === "emo_dual" && !unlockProgress.emotionDualUnlocked) {
    setFlash("Emotional dual mode is still locked. Complete both mono modes first.", "warn");
    render();
    return;
  }
  const initialN = styleDecision.style === "RESET"
    ? Math.min(2, Math.max(1, Number(state.settings?.lastRecommendedLevel || 2)))
    : 1;
  const initialPack = styleDecision.style === "RECHECK" && recheckSignature
    ? (recheckSignature.representationFrom === "B" ? "B" : "A")
    : "A";

  emotionSession = {
    status: "running",
    phase: "loading",
    tsStart,
    sessionSeed: hash32(String(tsStart)),
    sessionStyle: styleDecision.style,
    sessionStyleReason: styleDecision.reason,
    zoneGate: styleDecision.zoneHandoff || null,
    recheckCandidateId: styleDecision.pendingCandidate?.id || null,
    recheckSignature,
    probeRunConfig: null,
    recheckRunConfig: null,
    baselineMode: initialMode,
    baselineRepresentationPack: initialPack,
    mode: initialMode,
    blockCursor: 0,
    currentN: initialN,
    blocksPlanned: [],
    blocks: [],
    completedBlocks: [],
    coachContext: {
      pendingStabilise: false,
      pendingSwapReturnWrapper: null
    },
    pendingPlanPatch: {
      mode: initialMode,
      representationPack: initialPack,
      n: initialN,
      speed: normalizeEmotionSpeed(emotionPreferences.speed),
      interference: normalizeEmotionInterference(emotionPreferences.interference),
      flags: {
        coachState: "STABILISE",
        pulseType: null,
        swapSegment: null,
        wasSwapProbe: false
      }
    },
    introNotice: `${styleCopy.label} session. ${styleDecision.reason}`,
    coachNotice: "",
    trialPaused: false,
    missionStartRecorded: false,
    currentBlock: null,
    lastBlockSummary: null,
    sessionSummary: null,
    progressDelta: null
  };

  updateSettings({
    lastEmotionMode: initialMode,
    lastSpeed: emotionPreferences.speed,
    lastInterference: emotionPreferences.interference
  });

  beginEmotionBlock();
}

function beginEmotionBlock() {
  if (!emotionSession || emotionSession.status !== "running") {
    return;
  }
  if (emotionSession.blockCursor >= EMO_TOTAL_BLOCKS) {
    completeEmotionSession();
    return;
  }

  const blockIndex = emotionSession.blockCursor + 1;
  const lastPlan = emotionSession.blocksPlanned.length
    ? emotionSession.blocksPlanned[emotionSession.blocksPlanned.length - 1]
    : null;
  const pendingPatch = normalizeEmotionCoachPatch(emotionSession.pendingPlanPatch);
  const pendingFlags = pendingPatch.flags && typeof pendingPatch.flags === "object" ? pendingPatch.flags : {};
  const isOverrideCoachState = pendingFlags.coachState === "TUNE" || pendingFlags.coachState === "SPIKE_TUNE";
  const patchWithDefaultOverrideRaw = isOverrideCoachState && !pendingFlags.userOverride
    ? {
      ...pendingPatch,
      flags: {
        ...pendingFlags,
        userOverride: "coach"
      }
    }
    : pendingPatch;
  const patchWithDefaultOverride = applyEmotionSessionStylePatch(
    emotionSession,
    patchWithDefaultOverrideRaw,
    blockIndex,
    lastPlan
  );
  const mode = patchWithDefaultOverride.mode
    ? normalizeEmotionModeForPlan(patchWithDefaultOverride.mode)
    : normalizeEmotionModeForPlan(lastPlan?.mode || emotionSession.mode);
  const nextN = Number.isFinite(patchWithDefaultOverride.n)
    ? Math.max(1, Math.min(EMO_N_MAX, Math.round(patchWithDefaultOverride.n)))
    : emotionSession.currentN;
  const speed = patchWithDefaultOverride.speed
    ? normalizeEmotionSpeed(patchWithDefaultOverride.speed)
    : normalizeEmotionSpeed(emotionPreferences.speed);
  const interference = patchWithDefaultOverride.interference
    ? normalizeEmotionInterference(patchWithDefaultOverride.interference)
    : normalizeEmotionInterference(emotionPreferences.interference);
  const representationPack = patchWithDefaultOverride.representationPack === "B" ? "B" : "A";
  const normalizedFlags = normalizeEmotionCoachPatch({ flags: patchWithDefaultOverride.flags });
  const flags = normalizedFlags.flags;

  const plan = createEmotionBlockPlan({
    mode,
    blockIndex,
    n: nextN,
    speed,
    interference,
    representationPack,
    flags
  });
  if (plan.flags && flags?.userOverride) {
    plan.flags.userOverride = flags.userOverride;
  }

  emotionSession.pendingPlanPatch = {};
  emotionSession.mode = mode;
  emotionSession.blocksPlanned.push(plan);
  emotionSession.phase = "loading";
  emotionSession.currentBlock = {
    plan,
    trials: [],
    soaMs: 0,
    displayMs: 0,
    renderMapping: { markerPositions: [] },
    trialIndex: -1,
    stimulusVisible: false,
    responseLocCaptured: false,
    responseColCaptured: false,
    responseLocRtMs: null,
    responseColRtMs: null,
    trialElapsedMs: 0,
    trialStartedAtMs: 0,
    trialOutcomes: []
  };
  clearEmotionTimers();
  render();
  void buildEmotionBlockFromPlan(plan, blockIndex, emotionSession.tsStart);
}

function startEmotionCue() {
  if (!emotionSession || emotionSession.status !== "running" || !emotionSession.currentBlock) {
    return;
  }
  if (emotionSession.phase !== "briefing") {
    return;
  }
  emotionSession.phase = "cue";
  render();
  clearEmotionTimers();
  emotionTimers.cue = setTimeout(() => {
    startEmotionTrial(0);
  }, EMO_CUE_MS);
}

function startEmotionTrial(trialIndex) {
  if (!emotionSession || emotionSession.status !== "running" || !emotionSession.currentBlock) {
    return;
  }
  const block = emotionSession.currentBlock;
  if (trialIndex === 0 && !emotionSession.missionStartRecorded) {
    registerMissionSessionStart();
    emotionSession.missionStartRecorded = true;
  }
  block.trialIndex = trialIndex;
  block.stimulusVisible = true;
  block.responseLocCaptured = false;
  block.responseColCaptured = false;
  block.responseLocRtMs = null;
  block.responseColRtMs = null;
  block.trialElapsedMs = 0;
  block.trialStartedAtMs = performance.now();
  emotionSession.trialPaused = false;
  emotionSession.phase = "trial";

  render();
  if (emotionTimers.display) {
    clearTimeout(emotionTimers.display);
  }
  if (emotionTimers.trial) {
    clearTimeout(emotionTimers.trial);
  }

  emotionTimers.display = setTimeout(() => {
    if (!emotionSession || emotionSession.status !== "running" || emotionSession.phase !== "trial" || emotionSession.trialPaused) {
      return;
    }
    const current = emotionSession.currentBlock;
    if (!current || current.trialIndex !== trialIndex) {
      return;
    }
    current.stimulusVisible = false;
    render();
  }, block.displayMs);

  emotionTimers.trial = setTimeout(() => {
    finishEmotionTrial();
  }, block.soaMs);
}

function pauseEmotionTrial() {
  if (!emotionSession || emotionSession.status !== "running" || emotionSession.phase !== "trial" || !emotionSession.currentBlock) {
    return;
  }
  if (emotionSession.trialPaused) {
    return;
  }
  const block = emotionSession.currentBlock;
  block.trialElapsedMs = Math.max(0, Math.round(performance.now() - block.trialStartedAtMs));
  emotionSession.trialPaused = true;

  if (emotionTimers.display) {
    clearTimeout(emotionTimers.display);
    emotionTimers.display = null;
  }
  if (emotionTimers.trial) {
    clearTimeout(emotionTimers.trial);
    emotionTimers.trial = null;
  }
  playSfx("pause_on");
  render();
}

function resumeEmotionTrial() {
  if (!emotionSession || emotionSession.status !== "running" || emotionSession.phase !== "trial" || !emotionSession.currentBlock) {
    return;
  }
  if (!emotionSession.trialPaused) {
    return;
  }
  const block = emotionSession.currentBlock;
  const elapsedMs = Number.isFinite(block.trialElapsedMs)
    ? Math.max(0, Math.round(block.trialElapsedMs))
    : 0;
  const remainingSoaMs = Math.max(0, block.soaMs - elapsedMs);
  const remainingDisplayMs = Math.max(0, block.displayMs - elapsedMs);
  if (remainingSoaMs <= 0) {
    emotionSession.trialPaused = false;
    finishEmotionTrial();
    return;
  }

  block.trialStartedAtMs = performance.now() - elapsedMs;
  emotionSession.trialPaused = false;

  if (emotionTimers.display) {
    clearTimeout(emotionTimers.display);
    emotionTimers.display = null;
  }
  if (emotionTimers.trial) {
    clearTimeout(emotionTimers.trial);
    emotionTimers.trial = null;
  }

  if (block.stimulusVisible) {
    if (remainingDisplayMs <= 0) {
      block.stimulusVisible = false;
    } else {
      const trialIndex = block.trialIndex;
      emotionTimers.display = setTimeout(() => {
        if (!emotionSession || emotionSession.status !== "running" || emotionSession.phase !== "trial" || emotionSession.trialPaused) {
          return;
        }
        const current = emotionSession.currentBlock;
        if (!current || current.trialIndex !== trialIndex) {
          return;
        }
        current.stimulusVisible = false;
        render();
      }, remainingDisplayMs);
    }
  }

  emotionTimers.trial = setTimeout(() => {
    finishEmotionTrial();
  }, remainingSoaMs);
  playSfx("resume_on");
  render();
}

function toggleEmotionPause() {
  if (!emotionSession || emotionSession.status !== "running" || emotionSession.phase !== "trial" || !emotionSession.currentBlock) {
    return;
  }
  if (emotionSession.trialPaused) {
    resumeEmotionTrial();
    return;
  }
  pauseEmotionTrial();
}

function stopEmotionSession() {
  if (!emotionSession || emotionSession.status !== "running") {
    return;
  }
  clearEmotionTimers();
  emotionSession = null;
  closeBriefingOverlay();
  playSfx("session_stop_discard");
  setFlash("Emotional session stopped. Session discarded and not logged.", "warn", { playWarningSound: false });
  window.location.hash = "/home";
}

function captureEmotionMatch(modality) {
  if (!emotionSession || emotionSession.status !== "running" || emotionSession.phase !== "trial" || !emotionSession.currentBlock) {
    return false;
  }
  if (emotionSession.trialPaused) {
    return false;
  }
  const block = emotionSession.currentBlock;
  const mode = normalizeEmotionModeForPlan(block?.plan?.mode || emotionSession.mode);
  const locEnabled = mode === "emo_loc" || mode === "emo_dual";
  const colEnabled = mode === "emo_col" || mode === "emo_dual";
  if (modality === "loc" && !locEnabled) {
    return false;
  }
  if (modality === "col" && !colEnabled) {
    return false;
  }

  if (modality === "loc") {
    if (block.responseLocCaptured) {
      return false;
    }
    block.responseLocCaptured = true;
    block.responseLocRtMs = Math.max(0, Math.round(performance.now() - block.trialStartedAtMs));
  } else {
    if (block.responseColCaptured) {
      return false;
    }
    block.responseColCaptured = true;
    block.responseColRtMs = Math.max(0, Math.round(performance.now() - block.trialStartedAtMs));
  }

  playSfx("game_match_press", {
    onceKey: `${emotionTrialAudioBaseKey(block)}:${modality}-press`
  });
  const isMatch = isEmotionMatchAtIndex(block.trials, block.trialIndex, block.plan.n, modality);
  playEmotionTrialOutcomeSfx(block, isMatch ? "hit" : "false_alarm");
  render();
  return true;
}

function captureEmotionLocationMatch() {
  return captureEmotionMatch("loc");
}

function captureEmotionColourMatch() {
  return captureEmotionMatch("col");
}

function finishEmotionTrial() {
  if (!emotionSession || emotionSession.status !== "running" || !emotionSession.currentBlock) {
    return;
  }
  emotionSession.trialPaused = false;
  const block = emotionSession.currentBlock;
  const trial = block.trials[block.trialIndex];
  const mode = normalizeEmotionModeForPlan(block?.plan?.mode || emotionSession.mode);
  const isRelevantLoc = mode === "emo_loc" || mode === "emo_dual";
  const isRelevantCol = mode === "emo_col" || mode === "emo_dual";
  const isMatchLoc = isEmotionMatchAtIndex(block.trials, block.trialIndex, block.plan.n, "loc");
  const isMatchCol = isEmotionMatchAtIndex(block.trials, block.trialIndex, block.plan.n, "col");
  const respondedLoc = Boolean(block.responseLocCaptured);
  const respondedCol = Boolean(block.responseColCaptured);

  const classify = (isRelevant, responded, isMatch) => {
    if (!isRelevant) {
      return null;
    }
    if (responded && isMatch) {
      return "hit";
    }
    if (responded && !isMatch) {
      return "false_alarm";
    }
    if (!responded && isMatch) {
      return "miss";
    }
    return "correct_rejection";
  };

  const classificationLoc = classify(isRelevantLoc, respondedLoc, isMatchLoc);
  const classificationCol = classify(isRelevantCol, respondedCol, isMatchCol);
  const sfxClassification = classificationLoc === "false_alarm" || classificationCol === "false_alarm"
    ? "false_alarm"
    : (classificationLoc === "miss" || classificationCol === "miss"
      ? "miss"
      : (classificationLoc === "hit" || classificationCol === "hit" ? "hit" : "correct_rejection"));
  playEmotionTrialOutcomeSfx(block, sfxClassification);
  const isLocError = classificationLoc === "miss" || classificationLoc === "false_alarm";
  const isColError = classificationCol === "miss" || classificationCol === "false_alarm";
  const isError = isLocError || isColError;

  block.trialOutcomes.push({
    trialIndex: block.trialIndex,
    canonLoc: trial?.canonLoc || null,
    canonCol: trial?.canonCol || null,
    isRelevantLoc,
    isRelevantCol,
    isMatchLoc,
    isMatchCol,
    respondedLoc,
    respondedCol,
    classificationLoc,
    classificationCol,
    classification: isError ? "error" : "ok",
    responseLocRtMs: respondedLoc ? block.responseLocRtMs : null,
    responseColRtMs: respondedCol ? block.responseColRtMs : null,
    classificationLocRtMs: respondedLoc ? block.responseLocRtMs : null,
    classificationColRtMs: respondedCol ? block.responseColRtMs : null,
    isError,
    isLapse: (isRelevantLoc && !respondedLoc && isMatchLoc) || (isRelevantCol && !respondedCol && isMatchCol)
  });

  if (emotionTimers.display) {
    clearTimeout(emotionTimers.display);
    emotionTimers.display = null;
  }
  if (emotionTimers.trial) {
    clearTimeout(emotionTimers.trial);
    emotionTimers.trial = null;
  }

  const nextTrialIndex = block.trialIndex + 1;
  if (nextTrialIndex < block.trials.length) {
    startEmotionTrial(nextTrialIndex);
    return;
  }
  finishEmotionBlock();
}

function finishEmotionBlock() {
  if (!emotionSession || emotionSession.status !== "running" || !emotionSession.currentBlock) {
    return;
  }

  const block = emotionSession.currentBlock;
  const blockSummary = summarizeEmotionBlock({
    plan: block.plan,
    trials: block.trials,
    trialOutcomes: block.trialOutcomes,
    nMax: EMO_N_MAX
  });

  emotionSession.blocks.push(blockSummary.blockResult);
  emotionSession.lastBlockSummary = {
    ...blockSummary.blockResult,
    outcomeBand: blockSummary.outcomeBand
  };
  emotionSession.completedBlocks.push({
    plan: block.plan,
    result: blockSummary.blockResult,
    outcomeBand: blockSummary.outcomeBand
  });
  emotionSession.currentN = blockSummary.nEnd;
  emotionSession.blockCursor += 1;
  emotionSession.currentBlock = null;

  if (emotionSession.blockCursor >= EMO_TOTAL_BLOCKS) {
    completeEmotionSession();
    return;
  }
  playBlockProgressSfx(blockSummary.blockResult);
  playSfx("coach_next_block");

  const nextBlockIndex = emotionSession.blockCursor + 1;
  const coachDecision = coachUpdateAfterBlock(emotionSession.lastBlockSummary, {
    completedBlocks: emotionSession.completedBlocks,
    coachContext: emotionSession.coachContext
  });
  if (coachDecision && typeof coachDecision === "object") {
    const rawPatch = coachDecision.patch && typeof coachDecision.patch === "object"
      ? coachDecision.patch
      : {};
    const coachPatch = normalizeEmotionCoachPatch(rawPatch);
    emotionSession.pendingPlanPatch = applyEmotionSessionStylePatch(
      emotionSession,
      coachPatch,
      nextBlockIndex,
      block.plan
    );
    emotionSession.coachContext = coachDecision.coachContext && typeof coachDecision.coachContext === "object"
      ? coachDecision.coachContext
      : emotionSession.coachContext;
    const coachState = emotionSession.pendingPlanPatch?.flags?.coachState || coachPatch.flags?.coachState;
    emotionSession.coachNotice = makeCoachNarrative(coachState, typeof coachDecision.notice === "string" ? coachDecision.notice : "");
  } else {
    emotionSession.pendingPlanPatch = applyEmotionSessionStylePatch(
      emotionSession,
      {},
      nextBlockIndex,
      block.plan
    );
    emotionSession.coachNotice = "";
  }

  emotionSession.phase = "block-result";
  render();
}

function completeEmotionSession() {
  if (!emotionSession || emotionSession.status !== "running") {
    return;
  }
  clearEmotionTimers();

  const stateBefore = loadGymState();
  const wasLocked = !deriveRelationalUnlockProgress(stateBefore.history).relationalUnlocked;
  const tsEnd = Date.now();
  const summary = createEmotionSessionSummary({
    tsStart: emotionSession.tsStart,
    tsEnd,
    mode: emotionSession.baselineMode || emotionSession.mode,
    blocksPlanned: emotionSession.blocksPlanned,
    blocks: emotionSession.blocks
  });
  summary.sessionStyle = emotionSession.sessionStyle || null;
  summary.zoneGate = emotionSession.zoneGate || null;
  const precomputedEmotionTransfer = applyEmotionTransferOutcome({
    progression: stateBefore.emotionProgression,
    summary,
    sessionStyle: emotionSession.sessionStyle,
    nowTs: tsEnd
  });
  summary.transferEvidence = precomputedEmotionTransfer.transferEvidence;
  appendSessionSummary(summary);
  const progressDelta = applySessionProgressAndSave(summary, "emotion", {
    emotionTransferOutcome: precomputedEmotionTransfer
  });
  const stateAfter = loadStateWithSyncedUnlocks();
  const nowUnlocked = deriveRelationalUnlockProgress(stateAfter.history).relationalUnlocked;
  if (wasLocked && nowUnlocked) {
    queueUnlockCelebration();
  }

  emotionSession.status = "completed";
  emotionSession.phase = "session-done";
  emotionSession.sessionSummary = summary;
  emotionSession.progressDelta = progressDelta;
  playSessionRewardSfx(progressDelta);
  setFlash("Emotional session complete and saved to History.", "success");
  render();
}

function startRelationalSession(mode) {
  const state = loadStateWithSyncedUnlocks();
  const unlockProgress = deriveRelationalUnlockProgress(state.history);
  if (!unlockProgress.relationalUnlocked) {
    setFlash("Relational modes are locked. Complete qualifying Hub category, Hub non-categorical, and Emotional dual games first.", "warn");
    render();
    return;
  }

  const modeDef = REL_MODE_MAP[mode];
  if (!modeDef) {
    setFlash("Unknown relational mode.", "warn");
    render();
    return;
  }
  warmAudioAfterSessionStart();

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
    trialPaused: false,
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
    trialElapsedMs: 0,
    trialStartedAtMs: 0,
    trialOutcomes: [],
    quizIndex: -1,
    quizOutcomes: [],
    quizItemStartedAtMs: 0,
    quizTimeLeftMs: REL_QUIZ_TIMEOUT_MS,
    quizTimeoutPending: false,
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
  block.trialElapsedMs = 0;
  block.trialStartedAtMs = performance.now();
  relSession.trialPaused = false;
  relSession.phase = "trial";

  render();
  if (relTimers.display) {
    clearTimeout(relTimers.display);
  }
  if (relTimers.trial) {
    clearTimeout(relTimers.trial);
  }

  relTimers.display = setTimeout(() => {
    if (!relSession || relSession.status !== "running" || relSession.phase !== "trial" || relSession.trialPaused) {
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
  if (relSession.trialPaused) {
    return false;
  }
  const block = relSession.currentBlock;
  if (block.responseCaptured) {
    return false;
  }
  block.responseCaptured = true;
  block.responseRtMs = Math.max(0, Math.round(performance.now() - block.trialStartedAtMs));
  playSfx("game_match_press", {
    onceKey: `${relationalTrialAudioBaseKey(block)}:match-press`
  });
  const isMatch = isRelationalMatchAtIndex(block.trials, block.trialIndex, block.plan.n);
  playRelationalTrialOutcomeSfx(block, isMatch ? "hit" : "false_alarm");
  render();
  return true;
}

function finishRelationalTrial() {
  if (!relSession || relSession.status !== "running" || !relSession.currentBlock) {
    return;
  }
  relSession.trialPaused = false;
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
  playRelationalTrialOutcomeSfx(block, classification);

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
  block.quizTimeoutPending = false;
  block.quizAnswerCommitted = false;
  relSession.phase = "quiz";

  if (relTimers.quizTimeout) {
    clearTimeout(relTimers.quizTimeout);
  }
  if (relTimers.quizTimeoutFrame) {
    cancelAnimationFrame(relTimers.quizTimeoutFrame);
    relTimers.quizTimeoutFrame = null;
  }
  if (relTimers.quizTick) {
    clearInterval(relTimers.quizTick);
  }
  if (relTimers.quizAdvance) {
    clearTimeout(relTimers.quizAdvance);
    relTimers.quizAdvance = null;
  }

  relTimers.quizTimeout = setTimeout(() => {
    if (!relSession || relSession.status !== "running" || relSession.phase !== "quiz" || !relSession.currentBlock) {
      return;
    }
    const current = relSession.currentBlock;
    if (current.quizIndex !== quizIndex || current.quizAnswerCommitted) {
      return;
    }
    current.quizTimeoutPending = true;
    relTimers.quizTimeoutFrame = requestAnimationFrame(() => {
      relTimers.quizTimeoutFrame = null;
      if (!relSession || relSession.status !== "running" || relSession.phase !== "quiz" || !relSession.currentBlock) {
        return;
      }
      const active = relSession.currentBlock;
      if (active.quizIndex !== quizIndex || active.quizAnswerCommitted) {
        return;
      }
      submitRelationalQuizAnswer(null);
    });
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
  block.quizTimeoutPending = false;
  if (block.quizIndex < 0 || block.quizIndex >= block.quizItems.length) {
    return;
  }
  const quizItem = block.quizItems[block.quizIndex];
  if (!quizItem) {
    return;
  }
  const quizAudioKey = `rel:block-${Number(block.plan?.blockIndex || 0)}:quiz-${Number(block.quizIndex || 0)}`;
  if (userAnswer === null) {
    playSfx("quiz_timeout", {
      onceKey: `${quizAudioKey}:timeout`
    });
  } else {
    playSfx("quiz_answer_lock", {
      onceKey: `${quizAudioKey}:lock`
    });
  }
  const nextQuizIndex = block.quizIndex + 1;
  const responseTime = performance.now();
  const rtMs = userAnswer === null
    ? null
    : Math.max(0, Math.round(responseTime - block.quizItemStartedAtMs));
  const isCorrect = userAnswer !== null && userAnswer === quizItem.answerTrue;
  if (userAnswer !== null) {
    playSfx(isCorrect ? "quiz_correct" : "quiz_incorrect", {
      onceKey: `${quizAudioKey}:graded`
    });
  }

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
  if (relTimers.quizTimeoutFrame) {
    cancelAnimationFrame(relTimers.quizTimeoutFrame);
    relTimers.quizTimeoutFrame = null;
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
  playBlockProgressSfx(blockSummary.blockResult);
  playSfx("coach_next_block");

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
  playSessionRewardSfx(progressDelta);
  setFlash("Relational session complete and saved to History.", "success");
  render();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }
  unlockAudioContextFromUserGesture();

  const action = target.getAttribute("data-action");
  if (UI_TAP_ACTIONS.has(action)) {
    playSfx("ui_tap_soft");
  }

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

  if (action === "show-help") {
    const topic = target.getAttribute("data-topic");
    openHelpOverlay(topic);
    return;
  }

  if (action === "help-close") {
    closeHelpOverlay();
    render();
    return;
  }

  if (action === "go-play-hub") {
    const requestedWrapper = target.getAttribute("data-wrapper");
    if (requestedWrapper === "hub_cat" || requestedWrapper === "hub_noncat") {
      hubPreferences.wrapper = requestedWrapper;
      updateSettings({ lastWrapper: requestedWrapper });
    }
    window.location.hash = "/play-hub";
    return;
  }

  if (action === "go-play-emotion") {
    const requestedMode = target.getAttribute("data-mode");
    const stateNow = loadGymState();
    const unlockProgress = deriveRelationalUnlockProgress(stateNow.history);
    if (requestedMode === "emo_dual" && !unlockProgress.emotionDualUnlocked) {
      emotionPreferences.mode = "emo_loc";
      updateSettings({ lastEmotionMode: "emo_loc" });
      setFlash("Emotional dual is locked. Starting in Location mode.", "warn");
    } else if (requestedMode === "emo_loc" || requestedMode === "emo_col" || requestedMode === "emo_dual") {
      emotionPreferences.mode = requestedMode;
      updateSettings({ lastEmotionMode: requestedMode });
    }
    window.location.hash = "/play-emotion";
    return;
  }

  if (action === "go-play-relational") {
    window.location.hash = "/play-relational";
    return;
  }

  if (action === "go-home") {
    window.location.hash = "/home";
    return;
  }

  if (action === "go-history") {
    window.location.hash = "/history";
    return;
  }

  if (action === "go-settings") {
    window.location.hash = "/settings";
    return;
  }

  if (action === "import-zone-handoff") {
    importLatestZoneHandoffToGymState();
    render();
    return;
  }

  if (action === "start-hub-session") {
    startHubSession();
    return;
  }

  if (action === "start-emotion-session") {
    startEmotionSession();
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

  if (action === "hub-toggle-pause") {
    toggleHubPause();
    return;
  }

  if (action === "hub-stop-session") {
    stopHubSession();
    return;
  }

  if (action === "hub-accept-coach") {
    if (hubSession && hubSession.status === "running" && hubSession.phase === "block-result") {
      if (hubSession.sessionStyle === "RESET" || hubSession.sessionStyle === "TIGHTEN") {
        setFlash("Alternative challenge is disabled during stabilise/reset sessions.", "warn");
        render();
        return;
      }
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
      if (hubSession.sessionStyle === "RESET" || hubSession.sessionStyle === "TIGHTEN") {
        setFlash("Alternative challenge is disabled during stabilise/reset sessions.", "warn");
        render();
        return;
      }
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

  if (action === "rel-toggle-pause") {
    toggleRelationalPause();
    return;
  }

  if (action === "rel-stop-session") {
    stopRelationalSession();
    return;
  }

  if (action === "hub-next-block") {
    beginHubBlock();
    return;
  }

  if (action === "emotion-start-block") {
    startEmotionCue();
    return;
  }

  if (action === "emotion-match-loc") {
    captureEmotionLocationMatch();
    return;
  }

  if (action === "emotion-match-col") {
    captureEmotionColourMatch();
    return;
  }

  if (action === "emotion-toggle-pause") {
    toggleEmotionPause();
    return;
  }

  if (action === "emotion-stop-session") {
    stopEmotionSession();
    return;
  }

  if (action === "emotion-next-block") {
    beginEmotionBlock();
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
    clearEmotionTimers();
    emotionSession = null;
    clearRelTimers();
    relSession = null;
    closeBriefingOverlay();
    dismissUnlockCelebration();
    resetGymState();
    hubPreferences.wrapper = FIRST_RUN_BASELINE_BLOCK.wrapper;
    hubPreferences.speed = FIRST_RUN_BASELINE_BLOCK.speed;
    hubPreferences.interference = FIRST_RUN_BASELINE_BLOCK.interference;
    emotionPreferences.mode = "emo_loc";
    emotionPreferences.speed = FIRST_RUN_BASELINE_BLOCK.speed;
    emotionPreferences.interference = FIRST_RUN_BASELINE_BLOCK.interference;
    updateSettings({
      lastWrapper: hubPreferences.wrapper,
      lastSpeed: hubPreferences.speed,
      lastInterference: hubPreferences.interference,
      lastEmotionMode: emotionPreferences.mode,
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
  const emotionModeLocked = Boolean(emotionSession && emotionSession.status === "running");
  const emotionDialLocked = Boolean(
    emotionSession
      && emotionSession.status === "running"
      && (emotionSession.phase === "loading" || emotionSession.phase === "cue" || emotionSession.phase === "trial")
  );

  if (target.id === "sound-toggle" && target instanceof HTMLInputElement) {
    if (target.checked) {
      unlockAudioContextFromUserGesture();
    }
    setAudioEnabled(target.checked);
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
    return;
  }

  if (target.id === "emotion-mode-select" && !emotionModeLocked) {
    const nextMode = target.value === "emo_col"
      ? "emo_col"
      : (target.value === "emo_dual" ? "emo_dual" : "emo_loc");
    const unlockProgress = deriveRelationalUnlockProgress(loadGymState().history);
    if (nextMode === "emo_dual" && !unlockProgress.emotionDualUnlocked) {
      emotionPreferences.mode = "emo_loc";
      updateSettings({ lastEmotionMode: "emo_loc" });
      setFlash("Dual mode is locked. Complete mono location and mono colour goals first.", "warn");
      render();
      return;
    }
    emotionPreferences.mode = nextMode;
    updateSettings({ lastEmotionMode: emotionPreferences.mode });
    render();
    return;
  }

  if (target.id === "emotion-speed-select" && !emotionDialLocked) {
    emotionPreferences.speed = target.value === "fast" ? "fast" : "slow";
    updateSettings({ lastSpeed: emotionPreferences.speed });
    render();
    return;
  }

  if (target.id === "emotion-interference-select" && !emotionDialLocked) {
    emotionPreferences.interference = target.value === "high" ? "high" : "low";
    updateSettings({ lastInterference: emotionPreferences.interference });
    render();
  }
});

document.addEventListener("keydown", (event) => {
  unlockAudioContextFromUserGesture();

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

  if (emotionSession && emotionSession.status === "running" && emotionSession.phase === "briefing" && (event.code === "Space" || event.code === "Enter")) {
    event.preventDefault();
    startEmotionCue();
    return;
  }

  if (event.code === "ArrowLeft" || event.code === "KeyF") {
    const handled = captureEmotionLocationMatch();
    if (handled) {
      event.preventDefault();
    }
    return;
  }

  if (event.code === "ArrowRight" || event.code === "KeyJ") {
    const handled = captureEmotionColourMatch();
    if (handled) {
      event.preventDefault();
    }
    return;
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



