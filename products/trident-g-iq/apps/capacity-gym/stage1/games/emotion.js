import { createSeededRng, hash32, randomInt } from "../lib/rng.js";
import { computeAccuracy, computeRtStats, countErrorBursts } from "../lib/metrics.js";
import { scheduleBlockTrials, scheduleMatchFlags } from "../lib/scheduler.js";

export const EMO_BASE_TRIALS = 20;
export const EMO_TOTAL_BLOCKS = 10;
export const EMO_N_MAX = 7;
export const EMO_CUE_MS = 1200;
export const EMO_DISPLAY_RATIO = 0.65;
export const EMO_SOA_MS = {
  slow: 3000,
  fast: 1400
};
export const EMO_MODES = ["emo_loc", "emo_col", "emo_dual"];
export const EMO_COLOURS = Object.freeze([
  Object.freeze({ label: "White", hex: "#ffffff" }),
  Object.freeze({ label: "Green", hex: "#16a34a" }),
  Object.freeze({ label: "Red", hex: "#dc2626" }),
  Object.freeze({ label: "Blue", hex: "#2563eb" })
]);
export const EMO_ARENA_RADIUS_PCT = 42;

function makeSessionId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function dateLocal(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

function normalizeEmotionMode(value) {
  return EMO_MODES.includes(value) ? value : "emo_loc";
}

function normalizeEmotionPack(value) {
  return value === "B" ? "B" : "A";
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function markerPositionsForRotation(locRotationDeg, radiusPct = EMO_ARENA_RADIUS_PCT) {
  const points = [];
  for (let k = 0; k < 4; k += 1) {
    const thetaDeg = locRotationDeg + (k * 90);
    const theta = (thetaDeg * Math.PI) / 180;
    points.push({
      xPct: 50 + (radiusPct * Math.cos(theta)),
      yPct: 50 + (radiusPct * Math.sin(theta))
    });
  }
  return points;
}

function randomStream(totalTrials, rng) {
  return Array.from({ length: totalTrials }, () => randomInt(rng, 0, 3));
}

function pickDifferent(previous, rng) {
  let next = randomInt(rng, 0, 3);
  while (next === previous) {
    next = randomInt(rng, 0, 3);
  }
  return next;
}

function buildTargetStream(totalTrials, n, matchFlags, rng) {
  const values = Array.from({ length: totalTrials }, () => 0);
  for (let i = 0; i < totalTrials; i += 1) {
    if (i < n) {
      values[i] = randomInt(rng, 0, 3);
      continue;
    }
    if (matchFlags[i]) {
      values[i] = values[i - n];
      continue;
    }
    values[i] = pickDifferent(values[i - n], rng);
  }
  return values;
}

function buildDistractorStream(totalTrials, n, targetMatchFlags, rng) {
  const values = Array.from({ length: totalTrials }, () => 0);
  for (let i = 0; i < totalTrials; i += 1) {
    if (i < n) {
      values[i] = randomInt(rng, 0, 3);
      continue;
    }
    if (targetMatchFlags[i]) {
      values[i] = pickDifferent(values[i - n], rng);
      continue;
    }
    values[i] = randomInt(rng, 0, 3);
  }
  return values;
}

function ensureDivergentMatchFlags(locFlags, colFlags, n) {
  const safeLoc = Array.isArray(locFlags) ? locFlags.slice() : [];
  const safeCol = Array.isArray(colFlags) ? colFlags.slice() : [];
  let sameCount = 0;
  const eligible = [];
  for (let i = n; i < safeLoc.length; i += 1) {
    if (safeLoc[i] === safeCol[i]) {
      sameCount += 1;
      eligible.push(i);
    }
  }
  const maxSame = Math.floor((safeLoc.length - n) * 0.45);
  if (sameCount <= maxSame || !eligible.length) {
    return safeCol;
  }
  let toFlip = sameCount - maxSame;
  for (let i = 0; i < eligible.length && toFlip > 0; i += 1) {
    const idx = eligible[i];
    safeCol[idx] = !safeCol[idx];
    toFlip -= 1;
  }
  return safeCol;
}

function buildEmotionRenderMapping() {
  const locRotationDeg = 45;
  return {
    locRotationDeg,
    radiusPct: EMO_ARENA_RADIUS_PCT,
    markerPositions: markerPositionsForRotation(locRotationDeg, EMO_ARENA_RADIUS_PCT),
    palette: EMO_COLOURS
  };
}

function pickFromPool(pool, rng, fallback) {
  if (!Array.isArray(pool) || !pool.length) {
    return fallback || null;
  }
  return pool[randomInt(rng, 0, pool.length - 1)] || fallback || pool[0];
}

function normalizeAssets(rawAssets) {
  const assets = rawAssets && typeof rawAssets === "object" ? rawAssets : {};
  const facesByPack = assets.facesByPack && typeof assets.facesByPack === "object"
    ? assets.facesByPack
    : { A: [], B: [] };
  const wordsByPack = assets.wordsByPack && typeof assets.wordsByPack === "object"
    ? assets.wordsByPack
    : { A: [], B: [] };
  return {
    facesByPack: {
      A: Array.isArray(facesByPack.A) ? facesByPack.A : [],
      B: Array.isArray(facesByPack.B) ? facesByPack.B : []
    },
    wordsByPack: {
      A: Array.isArray(wordsByPack.A) ? wordsByPack.A : [],
      B: Array.isArray(wordsByPack.B) ? wordsByPack.B : []
    },
    fallbackFace: assets.fallbackFace && typeof assets.fallbackFace === "object"
      ? assets.fallbackFace
      : null
  };
}

export function emotionModeLabel(mode) {
  if (mode === "emo_loc") {
    return "Location";
  }
  if (mode === "emo_col") {
    return "Colour";
  }
  return "Dual";
}

export function emotionModeTarget(mode) {
  if (mode === "emo_loc") {
    return "LOCATION";
  }
  if (mode === "emo_col") {
    return "COLOUR";
  }
  return "DUAL";
}

export function createEmotionBlockPlan({
  mode,
  blockIndex,
  n,
  speed,
  interference = "low",
  representationPack = "A",
  flags
}) {
  const resolvedMode = normalizeEmotionMode(mode);
  const plan = {
    blockIndex,
    wrapper: resolvedMode,
    mode: resolvedMode,
    n,
    speed,
    interference,
    representationPack: normalizeEmotionPack(representationPack)
  };
  if (resolvedMode === "emo_loc") {
    plan.targetModality = "loc";
  } else if (resolvedMode === "emo_col") {
    plan.targetModality = "col";
  } else {
    plan.targetModality = "dual";
  }
  if (flags && typeof flags === "object") {
    plan.flags = {
      coachState: flags.coachState,
      pulseType: flags.pulseType ?? null,
      swapSegment: flags.swapSegment ?? null,
      wasSwapProbe: Boolean(flags.wasSwapProbe)
    };
  }
  return plan;
}

export function createEmotionBlockTrials({
  mode,
  n,
  speed,
  interference = "low",
  representationPack = "A",
  assets,
  baseTrials = EMO_BASE_TRIALS,
  seed = Date.now()
}) {
  const resolvedMode = normalizeEmotionMode(mode);
  const resolvedPack = normalizeEmotionPack(representationPack);
  const safeAssets = normalizeAssets(assets);
  const rng = createSeededRng(seed);

  const schedule = scheduleBlockTrials({
    baseTrials,
    n,
    matchRate: 0.3,
    rng
  });
  const totalTrials = schedule.totalTrials;
  let matchLoc = schedule.matchFlags.slice();
  let matchCol = schedule.matchFlags.slice();

  if (resolvedMode === "emo_loc") {
    matchLoc = schedule.matchFlags.slice();
    matchCol = Array.from({ length: totalTrials }, () => false);
  } else if (resolvedMode === "emo_col") {
    matchCol = schedule.matchFlags.slice();
    matchLoc = Array.from({ length: totalTrials }, () => false);
  } else {
    const colFlagsRaw = scheduleMatchFlags({
      totalTrials,
      n,
      matchRate: 0.3,
      rng: createSeededRng(hash32(`${seed}:col`))
    });
    matchLoc = schedule.matchFlags.slice();
    matchCol = ensureDivergentMatchFlags(matchLoc, colFlagsRaw, n);
  }

  const locStream = resolvedMode === "emo_col"
    ? buildDistractorStream(totalTrials, n, matchCol, rng)
    : buildTargetStream(totalTrials, n, matchLoc, rng);
  const colStream = resolvedMode === "emo_loc"
    ? buildDistractorStream(totalTrials, n, matchLoc, rng)
    : buildTargetStream(totalTrials, n, matchCol, rng);

  const wordPool = safeAssets.wordsByPack[resolvedPack].length
    ? safeAssets.wordsByPack[resolvedPack]
    : (safeAssets.wordsByPack.A.length ? safeAssets.wordsByPack.A : safeAssets.wordsByPack.B);
  const facePool = safeAssets.facesByPack[resolvedPack].length
    ? safeAssets.facesByPack[resolvedPack]
    : (safeAssets.facesByPack.A.length ? safeAssets.facesByPack.A : safeAssets.facesByPack.B);
  const fallbackFace = safeAssets.fallbackFace || facePool[0] || null;
  const renderMapping = buildEmotionRenderMapping();

  const trials = [];
  for (let i = 0; i < totalTrials; i += 1) {
    const face = pickFromPool(facePool, rng, fallbackFace);
    const word = pickFromPool(wordPool, rng, "ITEM");
    const locIdx = locStream[i];
    const colIdx = colStream[i];
    const colour = EMO_COLOURS[colIdx];
    const canonLoc = `loc:${locIdx}`;
    const canonCol = `col:${colIdx}`;
    trials.push({
      trialIndex: i,
      locIdx,
      colIdx,
      canonLoc,
      canonCol,
      isMatchLoc: i >= n ? canonLoc === `loc:${locStream[i - n]}` : false,
      isMatchCol: i >= n ? canonCol === `col:${colStream[i - n]}` : false,
      faceSrc: face?.src || "",
      faceEmotion: face?.emotion || "neutral",
      wordText: String(word || "ITEM"),
      display: {
        faceSrc: face?.src || "",
        faceEmotion: face?.emotion || "neutral",
        wordText: String(word || "ITEM"),
        colourLabel: colour.label,
        colourHex: colour.hex
      }
    });
  }

  return {
    soaMs: EMO_SOA_MS[speed] || EMO_SOA_MS.slow,
    displayMs: Math.round((EMO_SOA_MS[speed] || EMO_SOA_MS.slow) * EMO_DISPLAY_RATIO),
    trials,
    renderMapping
  };
}

export function isEmotionMatchAtIndex(trials, trialIndex, n, modality) {
  if (!Array.isArray(trials) || trialIndex < n || trialIndex < 0 || trialIndex >= trials.length) {
    return false;
  }
  const current = trials[trialIndex];
  const previous = trials[trialIndex - n];
  if (!current || !previous) {
    return false;
  }
  if (modality === "col") {
    return current.canonCol === previous.canonCol;
  }
  return current.canonLoc === previous.canonLoc;
}

function classifyDimension(isMatch, responded) {
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
}

function summarizeDimension(trialOutcomes, key, isRelevant) {
  const relevantTrials = trialOutcomes.filter((entry) => Boolean(entry?.[isRelevant]));
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let correctRejections = 0;
  const rtValues = [];
  for (let i = 0; i < relevantTrials.length; i += 1) {
    const trial = relevantTrials[i];
    const classification = trial?.[key];
    if (classification === "hit") {
      hits += 1;
    } else if (classification === "miss") {
      misses += 1;
    } else if (classification === "false_alarm") {
      falseAlarms += 1;
    } else if (classification === "correct_rejection") {
      correctRejections += 1;
    }
    const rt = Number(trial?.[`${key}RtMs`]);
    if (Number.isFinite(rt)) {
      rtValues.push(rt);
    }
  }
  const total = relevantTrials.length;
  const accuracyRaw = computeAccuracy({
    hits,
    correctRejections,
    totalTrials: total
  });
  return {
    hits,
    misses,
    falseAlarms,
    correctRejections,
    trials: total,
    accuracy: Number(accuracyRaw.toFixed(4)),
    rt: computeRtStats(rtValues)
  };
}

function isErrorClassification(value) {
  return value === "miss" || value === "false_alarm";
}

export function summarizeEmotionBlock({
  plan,
  trials,
  trialOutcomes,
  nMax = EMO_N_MAX
}) {
  const safePlan = plan || {};
  const mode = normalizeEmotionMode(safePlan.mode);
  const relevantLoc = mode === "emo_loc" || mode === "emo_dual";
  const relevantCol = mode === "emo_col" || mode === "emo_dual";
  const safeOutcomes = Array.isArray(trialOutcomes) ? trialOutcomes : [];

  const locMetrics = summarizeDimension(safeOutcomes, "classificationLoc", "isRelevantLoc");
  const colMetrics = summarizeDimension(safeOutcomes, "classificationCol", "isRelevantCol");

  const accuracy = mode === "emo_dual"
    ? Number((((locMetrics.accuracy || 0) + (colMetrics.accuracy || 0)) / 2).toFixed(4))
    : (mode === "emo_loc" ? locMetrics.accuracy : colMetrics.accuracy);

  const totalLapses = (relevantLoc ? locMetrics.misses : 0) + (relevantCol ? colMetrics.misses : 0);
  const errorFlags = safeOutcomes.map((entry) => {
    const locErr = relevantLoc ? isErrorClassification(entry?.classificationLoc) : false;
    const colErr = relevantCol ? isErrorClassification(entry?.classificationCol) : false;
    return locErr || colErr;
  });
  const errorBursts = countErrorBursts(errorFlags, 8, 3);

  let outcomeBand = "HOLD";
  const down = (relevantLoc && locMetrics.accuracy < 0.75) || (relevantCol && colMetrics.accuracy < 0.75) || accuracy < 0.75;
  const up = mode === "emo_dual"
    ? (locMetrics.accuracy >= 0.8 && colMetrics.accuracy >= 0.8 && accuracy >= 0.9)
    : accuracy >= 0.9;

  if (up) {
    outcomeBand = "UP";
  } else if (down) {
    outcomeBand = "DOWN";
  }

  let nEnd = Number.isFinite(safePlan.n) ? safePlan.n : 1;
  if (outcomeBand === "UP") {
    nEnd = Math.min(nEnd + 1, nMax);
  } else if (outcomeBand === "DOWN") {
    nEnd = Math.max(nEnd - 1, 1);
  }

  const primary = mode === "emo_loc" ? locMetrics : (mode === "emo_col" ? colMetrics : null);
  const meanRtMs = mode === "emo_dual"
    ? Number((((locMetrics.rt.meanRtMs || 0) + (colMetrics.rt.meanRtMs || 0)) / 2).toFixed(2))
    : (primary?.rt.meanRtMs ?? null);
  const rtSdMs = mode === "emo_dual"
    ? Number((((locMetrics.rt.rtSdMs || 0) + (colMetrics.rt.rtSdMs || 0)) / 2).toFixed(2))
    : (primary?.rt.rtSdMs ?? null);

  return {
    nEnd,
    outcomeBand,
    blockResult: {
      blockIndex: safePlan.blockIndex,
      wrapper: safePlan.wrapper || mode,
      mode,
      representationPack: normalizeEmotionPack(safePlan.representationPack),
      nStart: Number.isFinite(safePlan.n) ? safePlan.n : 1,
      nEnd,
      speed: safePlan.speed || "slow",
      interference: safePlan.interference || "low",
      targetModality: safePlan.targetModality || (mode === "emo_loc" ? "loc" : (mode === "emo_col" ? "col" : "dual")),
      trials: Array.isArray(trials) ? trials.length : 0,
      hits: primary ? primary.hits : locMetrics.hits + colMetrics.hits,
      misses: primary ? primary.misses : locMetrics.misses + colMetrics.misses,
      falseAlarms: primary ? primary.falseAlarms : locMetrics.falseAlarms + colMetrics.falseAlarms,
      correctRejections: primary ? primary.correctRejections : locMetrics.correctRejections + colMetrics.correctRejections,
      accuracy,
      accuracyLoc: relevantLoc ? locMetrics.accuracy : null,
      accuracyCol: relevantCol ? colMetrics.accuracy : null,
      hitsLoc: relevantLoc ? locMetrics.hits : null,
      missesLoc: relevantLoc ? locMetrics.misses : null,
      falseAlarmsLoc: relevantLoc ? locMetrics.falseAlarms : null,
      correctRejectionsLoc: relevantLoc ? locMetrics.correctRejections : null,
      hitsCol: relevantCol ? colMetrics.hits : null,
      missesCol: relevantCol ? colMetrics.misses : null,
      falseAlarmsCol: relevantCol ? colMetrics.falseAlarms : null,
      correctRejectionsCol: relevantCol ? colMetrics.correctRejections : null,
      meanRtMs: Number.isFinite(meanRtMs) ? meanRtMs : null,
      rtSdMs: Number.isFinite(rtSdMs) ? rtSdMs : null,
      lapseCount: totalLapses,
      errorBursts
    }
  };
}

export function createEmotionSessionSummary({
  tsStart,
  tsEnd,
  mode,
  blocksPlanned,
  blocks
}) {
  const resolvedMode = normalizeEmotionMode(mode);
  return {
    id: makeSessionId("emotion_session"),
    tsStart,
    tsEnd,
    dateLocal: dateLocal(tsStart),
    wrapperFamily: "emotion",
    emotionalMode: resolvedMode,
    blocksPlanned,
    blocks,
    notes: {
      click: false,
      clickNote: `Stage 1 emotion session ${resolvedMode}`
    }
  };
}

export function formatEmotionBlockToken(blockIndex, totalBlocks) {
  const safeIndex = Number.isFinite(blockIndex) ? Math.max(1, Math.round(blockIndex)) : 1;
  const safeTotal = Number.isFinite(totalBlocks) ? Math.max(1, Math.round(totalBlocks)) : EMO_TOTAL_BLOCKS;
  return `${pad2(safeIndex)}/${pad2(safeTotal)}`;
}
