import { renderTelemetryCards } from "../../../trident-g-iq-shared/runtime/telemetry.js";
import {
  HUB_BASE_TRIALS,
  HUB_CUE_MS,
  HUB_N_MAX,
  HUB_PRELOAD_ASSETS,
  createHubBlockPlan,
  createHubBlockTrials,
  displayHubTargetLabel,
  isHubMatchAtIndex,
  summarizeHubBlock
} from "./hub-engine.js";
import { hash32 } from "./rng.js";
import {
  appendCapacityLabHistory,
  clearCapacityLabHistory,
  loadCapacityLabState,
  updateCapacityLabSettings
} from "./sandbox-storage.js";
import {
  initAudio,
  playSfx,
  setAudioEnabled,
  unlockAudioContextFromUserGesture
} from "./audio.js";

const PREVIEW_MARKERS = [
  { xPct: 50, yPct: 8 },
  { xPct: 92, yPct: 50 },
  { xPct: 50, yPct: 92 },
  { xPct: 8, yPct: 50 }
];

const WRAPPER_GROUPS = {
  flex: ["hub_cat", "hub_noncat", "hub_concept"],
  bind: ["and_cat", "and_noncat"],
  resist: ["resist_vectors", "resist_words", "resist_concept"],
  emotion: ["emotion_faces"]
};

function preloadImageUrls(urls) {
  if (typeof Image === "undefined") {
    return;
  }
  urls.forEach((url) => {
    if (!url) return;
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = url;
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapperLabel(wrapper) {
  if (wrapper === "hub_noncat") {
    return "Flex unknown";
  }
  if (wrapper === "hub_concept") {
    return "Flex concept";
  }
  if (wrapper === "and_cat") {
    return "Bind known";
  }
  if (wrapper === "and_noncat") {
    return "Bind unknown";
  }
  if (wrapper === "resist_vectors") {
    return "Resist vectors";
  }
  if (wrapper === "resist_words") {
    return "Resist words";
  }
  if (wrapper === "resist_concept") {
    return "Resist concept";
  }
  if (wrapper === "emotion_faces") {
    return "Emotion faces";
  }
  return "Flex known";
}

function speedLabel(speed) {
  return speed === "fast" ? "Fast pace" : "Slow pace";
}

function modeLabel(mode) {
  return mode === "coach" ? "Coach guided" : "You choose";
}

function modalityLabel(targetModality, wrapper) {
  const label = displayHubTargetLabel(targetModality, wrapper).toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function modalityMark(targetModality) {
  if (targetModality === "col") {
    return "\u25d0";
  }
  if (targetModality === "sym") {
    return "\u2726";
  }
  if (targetModality === "conj") {
    return "\u2227";
  }
  return "\u25ce";
}

function accuracyPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function formatRt(value) {
  return Number.isFinite(value) ? `${Math.round(value)} ms` : "--";
}

function clampN(value) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.min(HUB_N_MAX, Math.round(value)));
}

function wrapperFamily(wrapper) {
  if (wrapper.startsWith("and_")) {
    return "bind";
  }
  if (wrapper.startsWith("resist_")) {
    return "resist";
  }
  if (wrapper.startsWith("emotion_")) {
    return "emotion";
  }
  return "flex";
}

function familyWrappers(wrapper) {
  return WRAPPER_GROUPS[wrapperFamily(wrapper)] || WRAPPER_GROUPS.flex;
}

function familyDefaultTarget(wrapper) {
  if (wrapperFamily(wrapper) === "bind") {
    return "conj";
  }
  if (wrapper === "resist_words") {
    return "col";
  }
  if (wrapper === "resist_concept") {
    return "loc";
  }
  if (wrapperFamily(wrapper) === "resist") {
    return "loc";
  }
  if (wrapperFamily(wrapper) === "emotion") {
    return "loc";
  }
  return "loc";
}

function nextWrapper(current) {
  const order = familyWrappers(current);
  const index = Math.max(0, order.indexOf(current));
  return order[(index + 1) % order.length];
}

function recommendSettings(uiState) {
  const history = uiState.history;
  const last = history[0];
  const fallback = {
    wrapper: uiState.settings.wrapper,
    targetModality: uiState.settings.targetModality,
    speed: uiState.settings.speed,
    n: uiState.settings.n,
    reason: "Start with your current sandbox settings."
  };

  if (!last) {
    if (wrapperFamily(uiState.settings.wrapper) === "bind") {
      return {
        wrapper: "and_cat",
        targetModality: "conj",
        speed: "slow",
        n: 1,
        reason: "Start with the simplest Bind wrapper to establish a stable baseline."
      };
    }
    if (wrapperFamily(uiState.settings.wrapper) === "resist") {
      return {
        wrapper: "resist_vectors",
        targetModality: "loc",
        speed: "slow",
        n: 1,
        reason: "Start with the first Resist wrapper and location tracking to establish a stable baseline."
      };
    }
    if (wrapperFamily(uiState.settings.wrapper) === "emotion") {
      return {
        wrapper: "emotion_faces",
        targetModality: "loc",
        speed: "slow",
        n: 1,
        reason: "Start with emotion faces and location tracking to establish a baseline."
      };
    }
    return {
      wrapper: "hub_cat",
      targetModality: "loc",
      speed: "slow",
      n: 1,
      reason: "Start with the simplest wrapper to establish a stable baseline."
    };
  }

  const lastN = clampN(last.block?.nEnd ?? last.block?.nStart ?? uiState.settings.n);
  const lastWrapper = last.wrapper || uiState.settings.wrapper;
  const lastSpeed = last.speed || uiState.settings.speed;
  const lastTarget = last.targetModality || uiState.settings.targetModality;
  const lastThree = history.slice(0, 3);
  const avgAcc = lastThree.length
    ? lastThree.reduce((sum, entry) => sum + Number(entry?.block?.accuracy || 0), 0) / lastThree.length
    : Number(last?.block?.accuracy || 0);
  const stable = avgAcc >= 0.9;
  const drop = avgAcc < 0.75;
  const recentWrappers = new Set(lastThree.map((entry) => entry.wrapper));

  if (drop) {
    return {
      wrapper: lastWrapper,
      targetModality: wrapperFamily(lastWrapper) === "bind" ? "conj" : lastTarget,
      speed: "slow",
      n: clampN(lastN - 1),
      reason: "Stability dipped; lower the load and slow the pace."
    };
  }

  const swapCap = familyWrappers(lastWrapper).length;

  if (stable && recentWrappers.size < swapCap) {
    return {
      wrapper: nextWrapper(lastWrapper),
      targetModality: wrapperFamily(lastWrapper) === "bind" ? "conj" : lastTarget,
      speed: "slow",
      n: lastN,
      reason: "Stability held; swap wrapper before speed or n increases."
    };
  }

  if (stable && lastSpeed === "slow") {
    return {
      wrapper: lastWrapper,
      targetModality: wrapperFamily(lastWrapper) === "bind" ? "conj" : lastTarget,
      speed: "fast",
      n: lastN,
      reason: "Confirm stability under faster timing before increasing n."
    };
  }

  if (stable && lastSpeed === "fast") {
    return {
      wrapper: lastWrapper,
      targetModality: wrapperFamily(lastWrapper) === "bind" ? "conj" : lastTarget,
      speed: "fast",
      n: clampN(lastN + 1),
      reason: "Stable at fast pace; increase n."
    };
  }

  return {
    wrapper: lastWrapper,
    targetModality: wrapperFamily(lastWrapper) === "bind" ? "conj" : lastTarget,
    speed: lastSpeed,
    n: lastN,
    reason: "Hold current settings to build stability."
  };
}

function buildCoachMessage(recommendation) {
  return `The recommended option for far transfer training is ${wrapperLabel(recommendation.wrapper)} ${modalityLabel(recommendation.targetModality, recommendation.wrapper)}, N-${recommendation.n}, ${speedLabel(recommendation.speed)}. ${recommendation.reason}`;
}

function sparkPoints(history) {
  const values = history.slice(0, 8).map((entry) => Number(entry?.block?.accuracy || 0) * 100).reverse();
  if (!values.length) {
    return "2,22 168,22";
  }
  if (values.length === 1) {
    const y = 26 - ((values[0] / 100) * 20);
    return `2,${y.toFixed(1)} 168,${y.toFixed(1)}`;
  }
  return values.map((value, index) => {
    const x = 2 + ((166 / (values.length - 1)) * index);
    const y = 26 - ((value / 100) * 20);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

const REWARD_EVENTS = {
  SESSION_GOOD: { tridents: 40, max: 20 },
  SESSION_FAST_FINISH: { tridents: 20, max: 20 },
  SESSION_PERSONAL_BEST_AVG: { tridents: 40, max: 10 },
  SESSION_PERSONAL_BEST_STABLE: { tridents: 40, max: 10 },
  SAME_FAMILY_SWAP_HOLD: { tridents: 100, max: 9 },
  VARIANT_FAST_3_MASTERED: { tridents: 200, max: 9 },
  FAMILY_FAST_3_MASTERED: { tridents: 600, max: 3 },
  TRANSFER_READINESS_EMERGING: { tridents: 150, max: 1 },
  TRANSFER_READINESS_DEVELOPING: { tridents: 300, max: 1 },
  TRANSFER_READINESS_BROADENING: { tridents: 450, max: 1 },
  TRANSFER_READINESS_STRONG: { tridents: 600, max: 1 },
  CAPACITY_GYM_CHALLENGE_20_COMPLETED: { tridents: 2000, max: 1 },
  FREE_COACHING_SESSION_VOUCHER: { tridents: 0, max: 1 }
};

const ECONOMY = {
  CURRENT_VARIANT_COUNT: 9,
  CHALLENGE_SESSION_LIMIT: 20
};

function computeStableLevel(history) {
  const recent = history.slice(0, 3);
  if (!recent.length) return null;
  const avgAcc = recent.reduce((sum, entry) => sum + Number(entry?.block?.accuracy || 0), 0) / recent.length;
  if (avgAcc < 0.85) return null;
  const avgN = recent.reduce((sum, entry) => sum + clampN(entry?.block?.nEnd ?? entry?.block?.nStart ?? 1), 0) / recent.length;
  return Math.round(avgN);
}

function computeRewardTimeline(history) {
  const events = [];
  const counters = new Map();
  const best = {
    sessionAvgAcc: 0,
    stableLevel: 0
  };
  const variantFast3 = new Set();
  const wrappersFast3 = new Set();
  const transferStages = new Set();
  let challengeAwarded = false;
  const sessionAcc = [];
  let sessionIndex = 1;
  let sessionBlock = 0;

  const chronological = history.slice().reverse();
  let prev = null;
  chronological.forEach((entry, index) => {
    const block = entry.block || {};
    const accuracy = Number(block.accuracy || 0);
    const nEnd = clampN(block.nEnd ?? block.nStart ?? 1);
    const speed = entry.speed || "slow";
    sessionBlock += 1;
    sessionAcc.push(accuracy);

    const recentHistory = chronological.slice(0, index + 1).reverse();
    const consistencyOk = computeStableLevel(recentHistory) !== null;

    if (accuracy >= 0.9 && consistencyOk) {
      events.push({ name: "SESSION_GOOD", blockIndex: index, sessionIndex });
    }
    if (speed === "fast" && accuracy >= 0.85 && consistencyOk) {
      events.push({ name: "SESSION_FAST_FINISH", blockIndex: index, sessionIndex });
      if (!transferStages.has("DEVELOPING")) {
        transferStages.add("DEVELOPING");
        events.push({ name: "TRANSFER_READINESS_DEVELOPING", blockIndex: index, sessionIndex });
      }
    }

    if (prev && prev.wrapper !== entry.wrapper && consistencyOk) {
      const prevN = clampN(prev.block?.nEnd ?? prev.block?.nStart ?? 1);
      if (accuracy >= 0.85 && nEnd >= prevN - 1) {
        events.push({ name: "SAME_FAMILY_SWAP_HOLD", blockIndex: index, sessionIndex });
        if (!transferStages.has("EMERGING")) {
          transferStages.add("EMERGING");
          events.push({ name: "TRANSFER_READINESS_EMERGING", blockIndex: index, sessionIndex });
        }
      }
    }

    if (speed === "fast" && nEnd >= 3 && accuracy >= 0.9 && consistencyOk) {
      const variantKey = `${entry.wrapper}:${entry.targetModality}`;
      if (!variantFast3.has(variantKey)) {
        variantFast3.add(variantKey);
        events.push({ name: "VARIANT_FAST_3_MASTERED", blockIndex: index, sessionIndex });
        if (!transferStages.has("BROADENING")) {
          transferStages.add("BROADENING");
          events.push({ name: "TRANSFER_READINESS_BROADENING", blockIndex: index, sessionIndex });
        }
      }
      wrappersFast3.add(entry.wrapper);
    }

    if (wrappersFast3.size === 3) {
      if (!transferStages.has("FAMILY") && consistencyOk) {
        transferStages.add("FAMILY");
        events.push({ name: "FAMILY_FAST_3_MASTERED", blockIndex: index, sessionIndex });
        if (!transferStages.has("STRONG")) {
          transferStages.add("STRONG");
          events.push({ name: "TRANSFER_READINESS_STRONG", blockIndex: index, sessionIndex });
        }
      }
    }

    if (!challengeAwarded && variantFast3.size >= ECONOMY.CURRENT_VARIANT_COUNT) {
      if (sessionIndex <= ECONOMY.CHALLENGE_SESSION_LIMIT) {
        challengeAwarded = true;
        events.push({ name: "CAPACITY_GYM_CHALLENGE_20_COMPLETED", blockIndex: index, sessionIndex });
        events.push({ name: "FREE_COACHING_SESSION_VOUCHER", blockIndex: index, sessionIndex });
      }
    }

    const stableLevel = computeStableLevel(recentHistory);
    if (stableLevel && stableLevel > best.stableLevel) {
      best.stableLevel = stableLevel;
      events.push({ name: "SESSION_PERSONAL_BEST_STABLE", blockIndex: index, sessionIndex });
    }

    if (sessionBlock === 10) {
      const avgAcc = sessionAcc.reduce((sum, value) => sum + value, 0) / sessionAcc.length;
      if (avgAcc > best.sessionAvgAcc + 0.01 && consistencyOk) {
        best.sessionAvgAcc = avgAcc;
        events.push({ name: "SESSION_PERSONAL_BEST_AVG", blockIndex: index, sessionIndex });
      }
      sessionAcc.length = 0;
      sessionBlock = 0;
      sessionIndex += 1;
    }

    prev = entry;
  });

  // Apply max awards
  const awarded = new Map();
  const filtered = [];
  events.forEach((event) => {
    const rule = REWARD_EVENTS[event.name];
    if (!rule) return;
    const count = awarded.get(event.name) || 0;
    if (count >= rule.max) return;
    awarded.set(event.name, count + 1);
    filtered.push(event);
  });

  return filtered;
}

function computeRewards(history) {
  const timeline = computeRewardTimeline(history);
  const totals = timeline.reduce((sum, event) => sum + (REWARD_EVENTS[event.name]?.tridents || 0), 0);
  return { timeline, totalTridents: totals };
}

function transferReadinessLabel(events) {
  if (events.some((event) => event.name === "TRANSFER_READINESS_STRONG")) return "Strong";
  if (events.some((event) => event.name === "TRANSFER_READINESS_BROADENING")) return "Broadening";
  if (events.some((event) => event.name === "TRANSFER_READINESS_DEVELOPING")) return "Developing";
  if (events.some((event) => event.name === "TRANSFER_READINESS_EMERGING")) return "Emerging";
  return null;
}

function lastBlockSummary(entry) {
  const block = entry?.block;
  if (!block) {
    return { accuracy: null, correct: null, total: null, outcome: null };
  }
  const correct = Number(block.hits || 0) + Number(block.correctRejections || 0);
  return {
    accuracy: Number(block.accuracy || 0),
    correct,
    total: Number(block.trials || 0),
    outcome: entry?.outcomeBand || null
  };
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : "--";
}

function safeValue(value) {
  return value === null || value === undefined || value === "" ? "--" : value;
}

function sessionBlockIndex(history, activeBlock) {
  const completed = history.length;
  const progress = completed % 10;
  const current = progress + (activeBlock ? 1 : 0);
  return current || 0;
}

function sessionHistory(history) {
  const progress = history.length % 10;
  return history.slice(0, progress);
}

function nextBlockHint(recommendation, lastEntry) {
  if (!recommendation) return "Hold";
  if (!lastEntry) return "Baseline";
  if (recommendation.wrapper !== lastEntry.wrapper) return "Wrapper swap";
  if (recommendation.speed !== lastEntry.speed) return "Speed pressure";
  if (recommendation.n > (lastEntry.block?.nEnd ?? lastEntry.block?.nStart ?? 1)) return "N increase";
  return "Hold";
}

function historyRows(history) {
  return history.slice(0, 4).map((entry) => `
    <div class="capacity-lab-history-row">
      <span>${escapeHtml(wrapperLabel(entry.wrapper))} ${escapeHtml(modalityLabel(entry.targetModality, entry.wrapper))}</span>
      <span>${accuracyPercent(entry.block.accuracy)}</span>
    </div>
  `).join("");
}

export const capacityLabTelemetrySeed = [
  {
    label: "Scores",
    labelClass: "metric-label--credit",
    emphasis: true,
    html: `
      <div class="capacity-sandbox-rail">
        <div class="capacity-sandbox-card capacity-sandbox-card--today" data-sandbox-today>
          <div class="capacity-sandbox-title">Today</div>
          <div class="capacity-sandbox-reward">
            <div class="capacity-sandbox-reward-coin" aria-hidden="true"></div>
            <div>
              <div class="capacity-sandbox-reward-label">Tridents</div>
              <div class="capacity-sandbox-reward-value">--</div>
              <div class="capacity-sandbox-reward-sub">Session reward</div>
            </div>
          </div>
        </div>

        <div class="capacity-sandbox-card capacity-sandbox-card--session">
          <div class="capacity-sandbox-title">Session performance</div>
          <div class="capacity-sandbox-row">
            <span data-sandbox-session-block>--</span>
            <span data-sandbox-session-counted>--</span>
          </div>
          <div class="capacity-sandbox-progress">
            <span style="width:0%;" data-sandbox-session-progress></span>
          </div>
          <div class="capacity-sandbox-grid">
            <div>
              <div class="capacity-sandbox-label">Session average</div>
              <div class="capacity-sandbox-value" data-sandbox-session-average>--</div>
            </div>
            <div>
              <div class="capacity-sandbox-label">Transfer readiness</div>
              <div class="capacity-sandbox-pill" data-sandbox-transfer>--</div>
            </div>
            <div>
              <div class="capacity-sandbox-label">Stable level</div>
              <div class="capacity-sandbox-value" data-sandbox-stable>--</div>
            </div>
            <div>
              <div class="capacity-sandbox-label">Pressure status</div>
              <div class="capacity-sandbox-value" data-sandbox-pressure>--</div>
            </div>
          </div>
        </div>

        <div class="capacity-sandbox-card capacity-sandbox-card--game">
          <div class="capacity-sandbox-title">Game performance</div>
          <div class="capacity-sandbox-grid capacity-sandbox-grid--dual">
            <div>
              <div class="capacity-sandbox-label">Next block</div>
              <div class="capacity-sandbox-value" data-sandbox-next>--</div>
              <div class="capacity-sandbox-subline" data-sandbox-next-note>--</div>
            </div>
            <div>
              <div class="capacity-sandbox-label">Last block</div>
              <div class="capacity-sandbox-value" data-sandbox-last-accuracy>--</div>
              <div class="capacity-sandbox-pill capacity-sandbox-pill--result" data-sandbox-last-result>--</div>
            </div>
          </div>
          <div class="capacity-sandbox-row">
            <span>Last accuracy</span>
            <span data-sandbox-last-correct>--</span>
          </div>
          <div class="capacity-sandbox-trend">
            <div class="capacity-sandbox-label">Accuracy over blocks</div>
            <svg viewBox="0 0 170 30" preserveAspectRatio="none" aria-hidden="true">
              <polyline fill="none" stroke="rgba(245, 181, 68, 0.96)" stroke-width="2.6" points="2,22 168,22" data-sandbox-spark></polyline>
            </svg>
          </div>
        </div>
      </div>
    `
  }
];

function createUiState() {
  const persisted = loadCapacityLabState();
  return {
    settings: { ...persisted.settings },
    history: persisted.history.slice(),
    status: "idle",
    activeBlock: null,
    activeMessage: "Pick a wrapper and start a block inside the new capacity shell.",
    coachMessage: "Use this route to play Flex, Bind, and Resist blocks without wiring the full telemetry stack or official progression engine.",
    lastSavedEntry: persisted.history[0] || null
  };
}

function telemetryCards() {
  return capacityLabTelemetrySeed;
}

function arenaMarkup(uiState) {
  const active = uiState.activeBlock;
  const trial = active && active.trialIndex >= 0 ? active.trials[active.trialIndex] : null;
  const points = active?.renderMapping?.markerPositions?.length ? active.renderMapping.markerPositions : PREVIEW_MARKERS;
  const wrapperForMarkers = active?.plan?.wrapper || uiState.settings.wrapper;
  const hideMarkers = wrapperForMarkers === "hub_noncat"
    || wrapperForMarkers === "hub_concept"
    || wrapperForMarkers === "and_noncat"
    || wrapperForMarkers === "resist_words"
    || wrapperForMarkers === "resist_concept";
  const markers = hideMarkers
    ? ""
    : points.map((point) => `<span class="capacity-hub-marker" style="left:${point.xPct}%;top:${point.yPct}%;"></span>`).join("");
  const point = trial?.display?.pointPct || (trial && points[trial.locIdx] ? points[trial.locIdx] : { xPct: 50, yPct: 50 });
  const visible = Boolean(trial && (uiState.status === "trial" || uiState.status === "paused") && active.stimulusVisible);
  const background = visible ? String(trial?.display?.colourHex || "#ffffff") : "transparent";
  const fallbackTextColor = String(trial?.display?.colourHex || "").toLowerCase() === "#ffffff" ? "#102033" : "#ffffff";
  const textColor = trial?.display?.textHex || fallbackTextColor;
  const shapeColor = trial?.display?.colourHex || "#ffffff";
  const activeWrapper = active?.plan?.wrapper || uiState.settings.wrapper;
  const isWordWrapper = activeWrapper === "resist_words";
  let token = "";
  const isShape = Boolean(trial?.display?.symbolSvgPath);
  if (visible) {
    if (trial?.display?.symbolImageUrl) {
      token = `<img src="${escapeHtml(trial.display.symbolImageUrl)}" alt="">`;
    } else if (trial?.display?.symbolSvgPath) {
      const rounded = trial.display.symbolSvgRounded ? " is-rounded" : "";
      token = `<svg class="capacity-hub-symbol${rounded}" viewBox="-1 -1 2 2" aria-hidden="true"><path d="${trial.display.symbolSvgPath}" /></svg>`;
    } else {
      token = escapeHtml(trial?.display?.symbolLabel || "");
    }
  }
  const fontFamily = trial?.display?.symbolFontFamily ? `font-family:${trial.display.symbolFontFamily};` : "";
  const fontWeight = trial?.display?.symbolFontWeight ? `font-weight:${trial.display.symbolFontWeight};` : "";
  const fontStyle = trial?.display?.symbolFontStyle ? `font-style:${trial.display.symbolFontStyle};` : "";

  const wrapperClass = activeWrapper === "hub_noncat"
    ? "is-noncat"
    : activeWrapper === "hub_concept"
      ? "is-concept"
      : activeWrapper === "resist_vectors"
        ? "is-resist"
      : activeWrapper === "resist_words"
        ? "is-resist is-resist-words"
      : activeWrapper === "resist_concept"
        ? "is-resist is-resist-concept"
      : activeWrapper?.startsWith("and_")
        ? (activeWrapper === "and_noncat" ? "is-and is-and-remap" : "is-and")
        : "is-cat";

  return `
    <div class="capacity-hub-arena ${wrapperClass}${uiState.status === "paused" ? " is-paused" : ""}">
      <div class="capacity-hub-ring"></div>
      ${markers}
      <div class="capacity-hub-token${visible ? "" : " is-hidden"}${isShape ? " is-shape" : ""}${isWordWrapper ? " is-word" : ""}" style="left:${point.xPct}%;top:${point.yPct}%;background:${isShape || isWordWrapper ? "transparent" : background};color:${visible ? (isShape || isWordWrapper ? shapeColor : textColor) : "transparent"};${fontFamily}${fontWeight}${fontStyle}">${token}</div>
    </div>
  `;
}

function setupMarkup(uiState) {
  const last = uiState.lastSavedEntry;
  const statusLabel = uiState.status === "result" ? "Saved" : "Ready";
  const family = wrapperFamily(uiState.settings.wrapper);
  const isBind = family === "bind";
  const targetOptions = isBind
    ? `<option value="conj" selected>Colour + Symbol</option>`
    : uiState.settings.wrapper === "resist_vectors"
      || uiState.settings.wrapper === "resist_concept"
      ? `<option value="loc" ${uiState.settings.targetModality === "loc" ? "selected" : ""}>Location</option><option value="sym" ${uiState.settings.targetModality === "sym" ? "selected" : ""}>Direction</option>`
      : uiState.settings.wrapper === "resist_words"
        ? `<option value="col" ${uiState.settings.targetModality === "col" ? "selected" : ""}>Ink colour</option><option value="sym" ${uiState.settings.targetModality === "sym" ? "selected" : ""}>Word</option>`
      : uiState.settings.wrapper === "emotion_faces"
        ? `<option value="loc" ${uiState.settings.targetModality === "loc" ? "selected" : ""}>Location</option><option value="sym" ${uiState.settings.targetModality === "sym" ? "selected" : ""}>Emotion</option>`
      : `<option value="loc" ${uiState.settings.targetModality === "loc" ? "selected" : ""}>Location</option><option value="col" ${uiState.settings.targetModality === "col" ? "selected" : ""}>Colour</option><option value="sym" ${uiState.settings.targetModality === "sym" ? "selected" : ""}>Symbol</option>`;

  return `
    <div class="capacity-sandbox-shell">
      <section class="capacity-sandbox-panel">
        <div class="capacity-live-head">
          <div class="capacity-live-kicker">Capacity sandbox</div>
          <div class="capacity-live-pill">${escapeHtml(statusLabel)}</div>
        </div>
        <div class="capacity-lab-setup-grid">
          <div class="capacity-lab-field capacity-lab-field--wide">
            <span>Mode</span>
            <div class="capacity-lab-mode-row" role="group" aria-label="Training mode">
              <button class="capacity-lab-chip${uiState.settings.mode === "coach" ? " is-active" : ""}" type="button" data-lab-action="set-mode" data-mode="coach">Coach guided</button>
              <button class="capacity-lab-chip${uiState.settings.mode !== "coach" ? " is-active" : ""}" type="button" data-lab-action="set-mode" data-mode="manual">You choose</button>
            </div>
          </div>
          ${uiState.settings.mode === "manual"
            ? `
            <label class="capacity-lab-field"><span>Wrapper</span><select data-lab-setting="wrapper"><option value="hub_cat" ${uiState.settings.wrapper === "hub_cat" ? "selected" : ""}>Flex known</option><option value="hub_noncat" ${uiState.settings.wrapper === "hub_noncat" ? "selected" : ""}>Flex unknown</option><option value="hub_concept" ${uiState.settings.wrapper === "hub_concept" ? "selected" : ""}>Flex concept</option><option value="and_cat" ${uiState.settings.wrapper === "and_cat" ? "selected" : ""}>Bind known</option><option value="and_noncat" ${uiState.settings.wrapper === "and_noncat" ? "selected" : ""}>Bind unknown</option><option value="resist_vectors" ${uiState.settings.wrapper === "resist_vectors" ? "selected" : ""}>Resist vectors</option><option value="resist_words" ${uiState.settings.wrapper === "resist_words" ? "selected" : ""}>Resist words</option><option value="resist_concept" ${uiState.settings.wrapper === "resist_concept" ? "selected" : ""}>Resist concept</option><option value="emotion_faces" ${uiState.settings.wrapper === "emotion_faces" ? "selected" : ""}>Emotion faces</option></select></label>
            <label class="capacity-lab-field"><span>Target</span><select data-lab-setting="targetModality" ${isBind ? "disabled" : ""}>${targetOptions}</select></label>
            <label class="capacity-lab-field"><span>Speed</span><select data-lab-setting="speed"><option value="slow" ${uiState.settings.speed === "slow" ? "selected" : ""}>Slow pace</option><option value="fast" ${uiState.settings.speed === "fast" ? "selected" : ""}>Fast pace</option></select></label>
            <label class="capacity-lab-field capacity-lab-field--wide"><span>N-back</span><select data-lab-setting="n">${Array.from({ length: HUB_N_MAX }, (_, index) => { const value = index + 1; return `<option value="${value}" ${uiState.settings.n === value ? "selected" : ""}>N-${value}</option>`; }).join("")}</select></label>
            `
            : ""
          }
        </div>
        <div class="capacity-lab-action-row">
          <button class="capacity-transition-action capacity-transition-action--lab" type="button" data-lab-action="start">Run block</button>
          <button class="capacity-lab-secondary-btn" type="button" data-lab-action="reset-history">Reset history</button>
        </div>
      </section>
    </div>
  `;
}

function liveMarkup(uiState) {
  const active = uiState.activeBlock;
  const pauseAction = uiState.status === "paused" ? "resume" : "pause";
  const pauseLabel = uiState.status === "paused" ? "Resume" : "Pause";
  const matchDisabled = uiState.status !== "trial" || active.responseCaptured;

  return `
    <div class="capacity-sandbox-shell capacity-sandbox-shell--live">
      <section class="capacity-live-stage capacity-live-stage--sandbox${uiState.status === "paused" ? " is-paused" : ""}">
        <div class="capacity-live-stage-body">
          ${arenaMarkup(uiState)}
        </div>
        <div class="capacity-live-actions capacity-live-actions--sandbox">
          <button class="capacity-phone-action capacity-phone-action--sandbox" type="button" data-lab-action="match" ${matchDisabled ? "disabled" : ""}>Match</button>
          <div class="capacity-live-secondary-row">
            <button class="capacity-lab-secondary-btn" type="button" data-lab-action="${pauseAction}">${pauseLabel}</button>
            <button class="capacity-lab-secondary-btn" type="button" data-lab-action="discard">Stop block</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

function taskMarkup(uiState) {
  if (uiState.activeBlock) {
    return liveMarkup(uiState);
  }

  return setupMarkup(uiState);
}

export function mountCapacityLab({ root }) {
  const taskRoot = root.querySelector("[data-capacity-lab-root]");
  const telemetryRail = root.querySelector(".telemetry-rail");
  const uiState = createUiState();
  const timers = { cue: null, display: null, trial: null };

  function clearTimers() {
    Object.keys(timers).forEach((key) => {
      if (timers[key]) {
        clearTimeout(timers[key]);
        timers[key] = null;
      }
    });
  }

  function scheduleCue(delayMs) {
    const active = uiState.activeBlock;
    if (!active) {
      return;
    }

    const safeDelayMs = Math.max(0, Math.round(delayMs));
    active.cueEndsAtMs = performance.now() + safeDelayMs;
    timers.cue = setTimeout(() => {
      timers.cue = null;
      active.cueEndsAtMs = 0;
      startTrial(0);
    }, safeDelayMs);
  }

  function scheduleTrialTimers(index, { displayDelayMs, trialDelayMs } = {}) {
    const active = uiState.activeBlock;
    if (!active) {
      return;
    }

    const safeDisplayMs = Number.isFinite(displayDelayMs) ? Math.max(0, Math.round(displayDelayMs)) : active.displayMs;
    const safeTrialMs = Number.isFinite(trialDelayMs) ? Math.max(0, Math.round(trialDelayMs)) : active.soaMs;

    if (active.stimulusVisible && safeDisplayMs > 0) {
      active.displayEndsAtMs = performance.now() + safeDisplayMs;
      timers.display = setTimeout(() => {
        if (!uiState.activeBlock || uiState.activeBlock.trialIndex !== index) {
          return;
        }
        uiState.activeBlock.stimulusVisible = false;
        uiState.activeBlock.displayEndsAtMs = 0;
        timers.display = null;
        render();
      }, safeDisplayMs);
    } else {
      active.displayEndsAtMs = 0;
      if (safeDisplayMs === 0) {
        active.stimulusVisible = false;
      }
    }

    if (safeTrialMs <= 0) {
      active.trialEndsAtMs = 0;
      finishTrial();
      return;
    }

    active.trialEndsAtMs = performance.now() + safeTrialMs;
    timers.trial = setTimeout(() => {
      timers.trial = null;
      finishTrial();
    }, safeTrialMs);
  }

  function syncSettings(patch) {
    const persisted = updateCapacityLabSettings(patch);
    uiState.settings = { ...persisted.settings };
  }

  function updateBanner() {
    const track = root.querySelector("[data-capacity-lab-track]");
    const status = root.querySelector("[data-capacity-lab-status]");
    const wrapper = root.querySelector("[data-capacity-lab-wrapper]");
    const modality = root.querySelector("[data-capacity-lab-modality]");
    const speed = root.querySelector("[data-capacity-lab-speed]");
    const runs = root.querySelector("[data-capacity-lab-runs]");
    const sfxButton = root.querySelector("[data-capacity-lab-sfx]");
    const active = uiState.activeBlock;
    if (track) {
      if (uiState.status === "trial" && active) {
        track.textContent = `Trial ${active.trialIndex + 1} of ${active.trials.length}`;
      } else if (uiState.status === "briefing") {
        track.textContent = "Cueing next block";
      } else if (uiState.status === "paused" && active && active.trialIndex >= 0) {
        track.textContent = `Paused on trial ${active.trialIndex + 1} of ${active.trials.length}`;
      } else if (uiState.status === "paused") {
        track.textContent = "Block paused";
      } else {
        track.textContent = "Public sandbox";
      }
    }
    if (status) status.textContent = uiState.status === "trial" ? "Live" : uiState.status === "briefing" ? "Cueing" : uiState.status === "paused" ? "Paused" : uiState.status === "result" ? "Saved" : "Ready";
    if (wrapper) wrapper.textContent = active ? wrapperLabel(active.plan.wrapper) : "—";
    if (modality) modality.textContent = active ? modalityMark(active.plan.targetModality) : "—";
    if (speed) speed.textContent = active ? speedLabel(active.plan.speed) : "—";
    if (runs) runs.textContent = String(uiState.history.length);
    if (sfxButton) {
      const soundOn = uiState.settings.soundOn;
      sfxButton.textContent = soundOn ? "Sound on" : "Sound off";
      sfxButton.setAttribute("aria-pressed", soundOn ? "true" : "false");
    }
  }

  function updateCoach() {
    const coach = root.querySelector("[data-capacity-lab-coach]");
    if (coach) {
      if (!uiState.activeBlock && uiState.settings.mode === "coach") {
        coach.textContent = buildCoachMessage(recommendSettings(uiState));
      } else {
        coach.textContent = uiState.coachMessage;
      }
    }
  }

  function render() {
    if (!taskRoot || !telemetryRail) {
      return;
    }

    taskRoot.innerHTML = taskMarkup(uiState);
    telemetryRail.innerHTML = renderTelemetryCards(telemetryCards(uiState));
    updateSandboxRail();
    updateBanner();
    updateCoach();

    const sfxButton = root.querySelector("[data-capacity-lab-sfx]");
    if (sfxButton) {
      sfxButton.onclick = () => {
        const nextSoundOn = !uiState.settings.soundOn;
        syncSettings({ soundOn: nextSoundOn });
        setAudioEnabled(nextSoundOn);
        if (nextSoundOn) {
          initAudio({ enabled: true, preloadTier: "p0" });
          unlockAudioContextFromUserGesture();
        }
        render();
      };
    }

    taskRoot.querySelectorAll("[data-lab-setting]").forEach((element) => {
      element.addEventListener("change", (event) => {
        const key = event.currentTarget.dataset.labSetting;
        const value = key === "n" ? Number(event.currentTarget.value) : event.currentTarget.value;
        if (key === "wrapper") {
          const nextTarget = wrapperFamily(value) === "bind"
            ? "conj"
            : wrapperFamily(value) === "resist" && uiState.settings.targetModality === "col"
              ? familyDefaultTarget(value)
              : wrapperFamily(value) === "emotion" && (uiState.settings.targetModality === "col" || uiState.settings.targetModality === "conj")
              ? familyDefaultTarget(value)
              : uiState.settings.targetModality === "conj"
                ? familyDefaultTarget(value)
                : uiState.settings.targetModality;
          syncSettings({ wrapper: value, targetModality: nextTarget });
        } else if (key === "targetModality") {
          const nextTarget = wrapperFamily(uiState.settings.wrapper) === "bind" ? "conj" : value;
          syncSettings({ targetModality: nextTarget });
        } else {
          syncSettings({ [key]: value });
        }
        uiState.activeMessage = "Sandbox selection updated for the next block.";
        uiState.coachMessage = `Sandbox selection updated: ${wrapperLabel(uiState.settings.wrapper)}, ${modalityLabel(uiState.settings.targetModality, uiState.settings.wrapper)}, N-${uiState.settings.n}.`;
        render();
      });
    });

    taskRoot.querySelectorAll("[data-lab-action]").forEach((element) => {
      element.addEventListener("click", (event) => {
        const action = event.currentTarget.dataset.labAction;
        if (action === "start") {
          unlockAudioContextFromUserGesture();
          playSfx("ui_tap_soft");
          if (uiState.settings.mode === "coach") {
            const recommended = recommendSettings(uiState);
            syncSettings({
              wrapper: recommended.wrapper,
              targetModality: recommended.targetModality,
              speed: recommended.speed,
              n: recommended.n
            });
            startBlock(recommended);
          } else {
            startBlock(uiState.settings);
          }
        } else if (action === "match") {
          unlockAudioContextFromUserGesture();
          captureResponse();
        } else if (action === "pause") {
          pauseBlock();
        } else if (action === "resume") {
          resumeBlock();
        } else if (action === "set-mode") {
          playSfx("ui_tap_soft");
          const mode = event.currentTarget.dataset.mode === "coach" ? "coach" : "manual";
          syncSettings({ mode });
          uiState.activeMessage = `Mode set to ${modeLabel(mode)}.`;
          uiState.coachMessage = mode === "coach"
            ? buildCoachMessage(recommendSettings(uiState))
            : "Manual mode: choose your own settings for the next block.";
          render();
        } else if (action === "discard") {
          playSfx("session_stop_discard");
          clearTimers();
          uiState.activeBlock = null;
          uiState.status = "idle";
          uiState.activeMessage = "Block discarded. Settings are unlocked again.";
          uiState.coachMessage = uiState.activeMessage;
          render();
        } else if (action === "reset-history") {
          playSfx("ui_tap_soft");
          const persisted = clearCapacityLabHistory();
          uiState.history = persisted.history.slice();
          uiState.lastSavedEntry = null;
          uiState.activeMessage = "Local sandbox history cleared.";
          uiState.coachMessage = uiState.activeMessage;
          if (!uiState.activeBlock) {
            uiState.status = "idle";
          }
          render();
        }
      });
    });
  }

  function updateSandboxRail() {
    const rail = root.querySelector(".capacity-sandbox-rail");
    if (!rail) return;

    const history = uiState.history;
    const active = uiState.activeBlock;
    const rewards = computeRewards(history);
    const events = rewards.timeline;
    const readiness = transferReadinessLabel(events);
    const stable = computeStableLevel(history);
    const sessionBlocks = sessionHistory(history);
    const sessionTridents = events
      .filter((event) => event.sessionIndex === (Math.floor(history.length / 10) + 1))
      .reduce((sum, event) => sum + (REWARD_EVENTS[event.name]?.tridents || 0), 0);
    const sessionBlockNumber = sessionBlockIndex(history, active);
    const sessionProgress = Math.min(100, Math.round((sessionBlockNumber / 10) * 100));
    const sessionAvg = sessionBlocks.length
      ? (sessionBlocks.reduce((sum, entry) => sum + clampN(entry.block?.nEnd ?? entry.block?.nStart ?? 1), 0) / sessionBlocks.length)
      : null;
    const last = history[0] || null;
    const lastSummary = lastBlockSummary(last);
    const recommendation = recommendSettings(uiState);

    const sessionRewardValue = rail.querySelector(".capacity-sandbox-reward-value");
    if (sessionRewardValue) {
      sessionRewardValue.textContent = sessionBlocks.length ? `+${sessionTridents}` : "--";
    }
    const sessionBlockLabel = rail.querySelector("[data-sandbox-session-block]");
    if (sessionBlockLabel) {
      sessionBlockLabel.textContent = sessionBlockNumber ? `BLOCK ${sessionBlockNumber} OF 10` : "--";
    }
    const sessionCounted = rail.querySelector("[data-sandbox-session-counted]");
    if (sessionCounted) {
      sessionCounted.textContent = sessionBlockNumber ? "COUNTED" : "--";
    }
    const sessionProgressBar = rail.querySelector("[data-sandbox-session-progress]");
    if (sessionProgressBar) {
      sessionProgressBar.style.width = `${sessionProgress}%`;
    }
    const sessionAverage = rail.querySelector("[data-sandbox-session-average]");
    if (sessionAverage) {
      sessionAverage.textContent = sessionAvg ? sessionAvg.toFixed(1) : "--";
    }
    const transfer = rail.querySelector("[data-sandbox-transfer]");
    if (transfer) {
      transfer.textContent = readiness || "--";
    }
    const stableValue = rail.querySelector("[data-sandbox-stable]");
    if (stableValue) {
      stableValue.textContent = stable ? `${stable}-back` : "--";
    }
    const pressure = rail.querySelector("[data-sandbox-pressure]");
    if (pressure) {
      const fastConfirmed = history.some((entry) => entry.speed === "fast" && Number(entry.block?.accuracy || 0) >= 0.9);
      pressure.textContent = stable ? (fastConfirmed ? "Fast confirmed" : "Fast hold next") : "--";
    }

    const nextBlock = rail.querySelector("[data-sandbox-next]");
    if (nextBlock) {
      nextBlock.textContent = recommendation ? `N-${recommendation.n}` : "--";
    }
    const nextNote = rail.querySelector("[data-sandbox-next-note]");
    if (nextNote) {
      nextNote.textContent = safeValue(nextBlockHint(recommendation, last));
    }
    const lastAcc = rail.querySelector("[data-sandbox-last-accuracy]");
    if (lastAcc) {
      lastAcc.textContent = lastSummary.accuracy !== null ? formatPercent(lastSummary.accuracy) : "--";
    }
    const lastResult = rail.querySelector("[data-sandbox-last-result]");
    if (lastResult) {
      lastResult.textContent = lastSummary.outcome ? lastSummary.outcome : "--";
    }
    const lastCorrect = rail.querySelector("[data-sandbox-last-correct]");
    if (lastCorrect) {
      if (lastSummary.correct !== null && lastSummary.total) {
        lastCorrect.textContent = `${lastSummary.correct} of ${lastSummary.total} correct`;
      } else {
        lastCorrect.textContent = "--";
      }
    }
    const spark = rail.querySelector("[data-sandbox-spark]");
    if (spark) {
      spark.setAttribute("points", history.length ? sparkPoints(history) : "2,22 168,22");
    }
  }

  function captureResponse() {
    const active = uiState.activeBlock;
    if (!active || uiState.status !== "trial" || active.responseCaptured) {
      return false;
    }
    active.responseCaptured = true;
    active.responseRtMs = Math.max(0, Math.round(performance.now() - active.trialStartedAtMs));
    playSfx("game_match_press");
    uiState.coachMessage = "Response logged. Hold for the next trial.";
    render();
    return true;
  }

  function pauseBlock() {
    const active = uiState.activeBlock;
    if (!active || uiState.status === "paused" || (uiState.status !== "briefing" && uiState.status !== "trial")) {
      return;
    }

    playSfx("pause_on");
    const now = performance.now();
    active.pausedState = uiState.status === "briefing"
      ? {
          phase: "briefing",
          cueRemainingMs: Math.max(0, Math.round(active.cueEndsAtMs - now))
        }
      : {
          phase: "trial",
          displayRemainingMs: active.stimulusVisible
            ? Math.max(0, Math.round(active.displayEndsAtMs - now))
            : 0,
          trialRemainingMs: Math.max(0, Math.round(active.trialEndsAtMs - now)),
          elapsedTrialMs: Math.max(0, Math.round(now - active.trialStartedAtMs))
        };

    clearTimers();
    uiState.status = "paused";
    uiState.activeMessage = "Block paused.";
    uiState.coachMessage = "Sandbox block paused. Resume continues the same local block without resetting the run.";
    render();
  }

  function resumeBlock() {
    const active = uiState.activeBlock;
    const pausedState = active?.pausedState;
    if (!active || uiState.status !== "paused" || !pausedState) {
      return;
    }

    playSfx("resume_on");
    clearTimers();
    active.pausedState = null;
    uiState.activeMessage = "Block resumed.";

    if (pausedState.phase === "briefing") {
      uiState.status = "briefing";
      uiState.coachMessage = "Cue resumed. The same local block will continue from where it paused.";
      render();
      scheduleCue(pausedState.cueRemainingMs);
      return;
    }

    if (active.stimulusVisible && pausedState.displayRemainingMs <= 0) {
      active.stimulusVisible = false;
    }

    active.trialStartedAtMs = performance.now() - (pausedState.elapsedTrialMs || 0);
    uiState.status = "trial";
    uiState.coachMessage = `Resumed. Match the ${displayHubTargetLabel(active.plan.targetModality, active.plan.wrapper).toLowerCase()} from ${active.plan.n} turns ago. Sandbox scoring stays local.`;
    render();
    scheduleTrialTimers(active.trialIndex, {
      displayDelayMs: active.stimulusVisible ? pausedState.displayRemainingMs : 0,
      trialDelayMs: pausedState.trialRemainingMs
    });
  }

  function startTrial(index) {
    const active = uiState.activeBlock;
    if (!active) {
      return;
    }
    active.trialIndex = index;
    active.stimulusVisible = true;
    active.responseCaptured = false;
    active.responseRtMs = null;
    active.trialStartedAtMs = performance.now();
    active.pausedState = null;
    uiState.status = "trial";
    uiState.coachMessage = `Match the ${displayHubTargetLabel(active.plan.targetModality, active.plan.wrapper).toLowerCase()} from ${active.plan.n} turns ago. Sandbox scoring only; official progression stays spec-gated.`;
    render();
    scheduleTrialTimers(index);
  }

  function finishBlock() {
    const active = uiState.activeBlock;
    if (!active) {
      return;
    }

    const summary = summarizeHubBlock({
      plan: active.plan,
      trials: active.trials,
      trialOutcomes: active.trialOutcomes,
      nMax: HUB_N_MAX
    });
    if (summary.outcomeBand === "UP") {
      playSfx("n_level_up");
    } else if (summary.outcomeBand === "DOWN") {
      playSfx("n_level_down");
    } else {
      playSfx("block_complete_neutral");
    }
    const entry = {
      id: `xor_lab_${active.tsStart}`,
      tsStart: active.tsStart,
      tsEnd: Date.now(),
      wrapper: active.plan.wrapper,
      targetModality: active.plan.targetModality,
      speed: active.plan.speed,
      outcomeBand: summary.outcomeBand,
      recommendedN: summary.nEnd,
      block: summary.blockResult
    };

    const persisted = appendCapacityLabHistory(entry);
    uiState.history = persisted.history.slice();
    uiState.lastSavedEntry = uiState.history[0] || entry;
    uiState.activeBlock = null;
    uiState.status = "result";
    uiState.activeMessage = `Saved ${wrapperLabel(entry.wrapper)} ${modalityLabel(entry.targetModality, entry.wrapper)} locally with ${accuracyPercent(entry.block.accuracy)} accuracy.`;
    uiState.coachMessage = `${entry.outcomeBand} block saved. Local sandbox hint: N-${entry.recommendedN}. Official progression still follows the updated stability, speed, and wrapper rules.`;
    render();
  }

  function finishTrial() {
    const active = uiState.activeBlock;
    if (!active) {
      return;
    }

    const trial = active.trials[active.trialIndex];
    const isMatch = isHubMatchAtIndex(active.trials, active.trialIndex, active.plan.n);
    const responded = active.responseCaptured;

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

    if (classification === "hit") {
      playSfx("trial_hit");
    } else if (classification === "false_alarm") {
      playSfx("trial_false_alarm");
    } else if (classification === "miss") {
      playSfx("trial_miss");
    }

    active.trialOutcomes.push({
      trialIndex: active.trialIndex,
      canonKey: trial.canonKey,
      isMatch,
      isLure: Boolean(trial.isLure),
      responded,
      rtMs: responded ? active.responseRtMs : null,
      isError,
      isLapse: !responded && isMatch,
      classification
    });

    if (timers.display) {
      clearTimeout(timers.display);
      timers.display = null;
    }
    if (timers.trial) {
      clearTimeout(timers.trial);
      timers.trial = null;
    }

    const nextIndex = active.trialIndex + 1;
    if (nextIndex < active.trials.length) {
      startTrial(nextIndex);
      return;
    }
    finishBlock();
  }

  function startBlock(overrideSettings) {
    if (uiState.activeBlock) {
      return;
    }

    unlockAudioContextFromUserGesture();
    clearTimers();
    const baseSettings = overrideSettings || uiState.settings;
    const resolvedTarget = wrapperFamily(baseSettings.wrapper) === "bind"
      ? "conj"
      : baseSettings.targetModality;
    const tsStart = Date.now();
    const blockIndex = uiState.history.length + 1;
    const mappingSeed = baseSettings.wrapper === "hub_noncat"
      || baseSettings.wrapper === "hub_concept"
      || baseSettings.wrapper === "and_noncat"
      || baseSettings.wrapper === "and_cat"
      || baseSettings.wrapper === "resist_vectors"
      || baseSettings.wrapper === "resist_words"
      || baseSettings.wrapper === "resist_concept"
      || baseSettings.wrapper === "emotion_faces"
      ? hash32(`${tsStart}:${resolvedTarget}:${blockIndex}`)
      : undefined;
    const plan = createHubBlockPlan({
      wrapper: baseSettings.wrapper,
      blockIndex,
      n: baseSettings.n,
      speed: baseSettings.speed,
      targetModality: resolvedTarget,
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

    uiState.activeBlock = {
      tsStart,
      plan,
      trials: build.trials,
      soaMs: build.soaMs,
      displayMs: build.displayMs,
      renderMapping: build.renderMapping,
      trialIndex: -1,
      stimulusVisible: false,
      responseCaptured: false,
      responseRtMs: null,
      trialStartedAtMs: 0,
      cueEndsAtMs: 0,
      displayEndsAtMs: 0,
      trialEndsAtMs: 0,
      pausedState: null,
      trialOutcomes: []
    };
    if (build.trials) {
      const urls = new Set();
      build.trials.forEach((trial) => {
        if (trial?.display?.symbolImageUrl) {
          urls.add(trial.display.symbolImageUrl);
        }
      });
      urls.forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    }
    uiState.status = "briefing";
    uiState.activeMessage = `Starting ${wrapperLabel(plan.wrapper)} ${modalityLabel(plan.targetModality, plan.wrapper)} at N-${plan.n}.`;
    uiState.coachMessage = `Get ready. Match the ${displayHubTargetLabel(plan.targetModality, plan.wrapper).toLowerCase()} from ${plan.n} turns ago. Official progression is not advanced from this sandbox alone.`;
    render();
    scheduleCue(HUB_CUE_MS);
  }

  function handleKeydown(event) {
    const tagName = String(event.target?.tagName || "").toLowerCase();
    if (tagName === "select") {
      return;
    }
    if (event.code === "Space" || event.code === "Enter") {
      unlockAudioContextFromUserGesture();
      if (captureResponse()) {
        event.preventDefault();
      }
    }
  }

  window.addEventListener("keydown", handleKeydown);
  initAudio({ enabled: uiState.settings.soundOn, preloadTier: "p0" });
  preloadImageUrls(HUB_PRELOAD_ASSETS);
  render();

  return function unmountCapacityLab() {
    clearTimers();
    window.removeEventListener("keydown", handleKeydown);
  };
}
