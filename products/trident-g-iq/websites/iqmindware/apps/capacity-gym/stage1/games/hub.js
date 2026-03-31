import { createSeededRng, hash32, randomInt } from "../lib/rng.js";
import { computeAccuracy, computeRtStats, countErrorBursts } from "../lib/metrics.js";
import { scheduleBlockTrials, scheduleLureFlags } from "../lib/scheduler.js";

export const HUB_BASE_TRIALS = 20;
export const HUB_TOTAL_BLOCKS = 10;
export const HUB_N_MAX = 7;
export const HUB_CUE_MS = 1200;
export const HUB_DISPLAY_RATIO = 0.65;
export const HUB_SOA_MS = {
  slow: 3000,
  fast: 1400
};
export const HUB_TARGET_MODALITIES = ["loc", "col", "sym"];
export const HUB_WRAPPERS = ["hub_cat", "hub_noncat"];
// Match the rendered ring centerline (ring inset 8% -> radius 42%) so stimuli sit on the circle line.
export const HUB_ARENA_RADIUS_PCT = 42;

const CAT_COLORS = [
  { label: "Red", hex: "#dc2626" },
  { label: "Blue", hex: "#2563eb" },
  { label: "Black", hex: "#111827" },
  { label: "White", hex: "#ffffff" }
];
const CAT_SYMBOLS = ["A", "B", "C", "D"];
const SYMBOL_POOL = [
  "▲", "△", "▼", "▽", "◆", "◇", "■", "□", "●", "○", "★", "☆",
  "✚", "✖", "✦", "✧", "✳", "✴", "✽", "✶", "✷", "✸",
  "⬟", "⬠", "⬢", "⬣", "⬤", "⬥"
];
const LURE_RATE_BY_INTERFERENCE = {
  low: 0.1,
  high: 0.25
};

function makeSessionId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function dateLocal(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

function hslColor(hue, sat, light) {
  return `hsl(${hue} ${sat}% ${light}%)`;
}

function markerPositionsForRotation(locRotationDeg, radiusPct = HUB_ARENA_RADIUS_PCT) {
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

function sampleWithoutReplacement(pool, count, rng) {
  const copy = pool.slice();
  const sampled = [];
  for (let i = 0; i < count && copy.length; i += 1) {
    const index = randomInt(rng, 0, copy.length - 1);
    sampled.push(copy[index]);
    copy.splice(index, 1);
  }
  return sampled;
}

function buildNoncatPalette(mappingSeed) {
  const rng = createSeededRng(mappingSeed ^ 0x9e3779b9);
  const baseHue = Math.floor(rng() * 360);
  const saturation = 64 + Math.floor(rng() * 18);
  const lightness = 46 + Math.floor(rng() * 12);
  const hueOffsets = [0, 40, 180, 220];

  return hueOffsets.map((offset, idx) => {
    const hue = (baseHue + offset) % 360;
    const light = Math.max(28, Math.min(76, lightness + (idx % 2 === 0 ? -4 : 6)));
    return {
      label: `Hue ${hue}`,
      hex: hslColor(hue, saturation, light)
    };
  });
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

function randomStream(totalTrials, rng) {
  return Array.from({ length: totalTrials }, () => randomInt(rng, 0, 3));
}

function buildConstrainedStream(totalTrials, n, constraints, rng) {
  const values = Array.from({ length: totalTrials }, () => 0);
  for (let i = 0; i < totalTrials; i += 1) {
    if (i < n) {
      values[i] = randomInt(rng, 0, 3);
      continue;
    }

    const rule = constraints[i];
    if (rule === "match") {
      values[i] = values[i - n];
      continue;
    }
    if (rule === "nonmatch") {
      values[i] = pickDifferent(values[i - n], rng);
      continue;
    }
    values[i] = randomInt(rng, 0, 3);
  }
  return values;
}

function buildRenderMapping({ wrapper, mappingSeed }) {
  if (wrapper === "hub_noncat") {
    const resolvedSeed = Number.isFinite(mappingSeed) ? (mappingSeed >>> 0) : hash32("hub_noncat_default");
    const rng = createSeededRng(resolvedSeed);
    const locRotationDeg = rng() * 360;
    const palette = buildNoncatPalette(resolvedSeed);
    const symbolSet = sampleWithoutReplacement(SYMBOL_POOL, 4, createSeededRng(hash32(`symbols:${resolvedSeed}`)));
    return {
      locRotationDeg,
      radiusPct: HUB_ARENA_RADIUS_PCT,
      markerPositions: markerPositionsForRotation(locRotationDeg, HUB_ARENA_RADIUS_PCT),
      palette,
      symbolSet
    };
  }

  const locRotationDeg = 45;
  return {
    locRotationDeg,
    radiusPct: HUB_ARENA_RADIUS_PCT,
    markerPositions: markerPositionsForRotation(locRotationDeg, HUB_ARENA_RADIUS_PCT),
    palette: CAT_COLORS,
    symbolSet: CAT_SYMBOLS
  };
}

export function modalityLabel(targetModality) {
  if (targetModality === "loc") {
    return "LOCATION";
  }
  if (targetModality === "col") {
    return "COLOUR";
  }
  return "SYMBOL";
}

export function createHubBlockPlan({
  wrapper,
  blockIndex,
  n,
  speed,
  interference = "low",
  targetModality,
  mappingSeed,
  flags
}) {
  const resolvedWrapper = wrapper === "hub_noncat" ? "hub_noncat" : "hub_cat";
  const plan = {
    blockIndex,
    wrapper: resolvedWrapper,
    n,
    speed,
    interference,
    targetModality
  };
  if (resolvedWrapper === "hub_noncat") {
    const resolvedSeed = Number.isFinite(mappingSeed) ? (mappingSeed >>> 0) : hash32(`noncat:${blockIndex}:${n}`);
    plan.mappingSeed = resolvedSeed;
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

export function createHubBlockTrials({
  wrapper,
  n,
  targetModality,
  speed,
  interference = "low",
  mappingSeed,
  baseTrials = HUB_BASE_TRIALS,
  seed = Date.now()
}) {
  const rng = createSeededRng(seed);
  const schedule = scheduleBlockTrials({
    baseTrials,
    n,
    matchRate: 0.3,
    rng
  });
  const totalTrials = schedule.totalTrials;
  const matchFlags = schedule.matchFlags;
  const lureRate = LURE_RATE_BY_INTERFERENCE[interference] ?? LURE_RATE_BY_INTERFERENCE.low;
  const lureFlags = scheduleLureFlags({
    targetMatchFlags: matchFlags,
    n,
    lureRate,
    rng
  });

  const constraints = {
    loc: Array.from({ length: totalTrials }, () => "free"),
    col: Array.from({ length: totalTrials }, () => "free"),
    sym: Array.from({ length: totalTrials }, () => "free")
  };
  const lureMatchedModality = Array.from({ length: totalTrials }, () => null);
  const distractorModalities = HUB_TARGET_MODALITIES.filter((id) => id !== targetModality);
  for (let i = n; i < totalTrials; i += 1) {
    if (!lureFlags[i]) {
      continue;
    }
    const matched = rng() < 0.5 ? distractorModalities[0] : distractorModalities[1];
    const nonMatched = matched === distractorModalities[0] ? distractorModalities[1] : distractorModalities[0];
    constraints[matched][i] = "match";
    constraints[nonMatched][i] = "nonmatch";
    lureMatchedModality[i] = matched;
  }

  const streams = {
    loc: randomStream(totalTrials, rng),
    col: randomStream(totalTrials, rng),
    sym: randomStream(totalTrials, rng)
  };
  streams[targetModality] = buildTargetStream(totalTrials, n, matchFlags, rng);
  for (let i = 0; i < distractorModalities.length; i += 1) {
    const modality = distractorModalities[i];
    streams[modality] = buildConstrainedStream(totalTrials, n, constraints[modality], rng);
  }

  const renderMapping = buildRenderMapping({ wrapper, mappingSeed });
  const trials = [];
  for (let i = 0; i < totalTrials; i += 1) {
    const locIdx = streams.loc[i];
    const colIdx = streams.col[i];
    const symIdx = streams.sym[i];
    const canonValue = targetModality === "loc"
      ? locIdx
      : targetModality === "col"
        ? colIdx
        : symIdx;
    trials.push({
      trialIndex: i,
      locIdx,
      colIdx,
      symIdx,
      isLure: Boolean(lureFlags[i]),
      lureMatchedModality: lureMatchedModality[i],
      canonKey: `${targetModality}:${canonValue}`,
      display: {
        colourLabel: renderMapping.palette[colIdx].label,
        colourHex: renderMapping.palette[colIdx].hex,
        symbolLabel: renderMapping.symbolSet[symIdx]
      }
    });
  }

  return {
    soaMs: HUB_SOA_MS[speed] || HUB_SOA_MS.slow,
    displayMs: Math.round((HUB_SOA_MS[speed] || HUB_SOA_MS.slow) * HUB_DISPLAY_RATIO),
    trials,
    renderMapping
  };
}

export function isHubMatchAtIndex(trials, trialIndex, n) {
  if (trialIndex < n) {
    return false;
  }
  return trials[trialIndex].canonKey === trials[trialIndex - n].canonKey;
}

export function summarizeHubBlock({
  plan,
  trials,
  trialOutcomes,
  nMax = HUB_N_MAX
}) {
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let correctRejections = 0;
  let lapseCount = 0;
  let lureTrials = 0;
  let faOnLures = 0;
  const rtValues = [];
  const errorFlags = [];

  for (let i = 0; i < trialOutcomes.length; i += 1) {
    const outcome = trialOutcomes[i];
    if (outcome.classification === "hit") {
      hits += 1;
    } else if (outcome.classification === "miss") {
      misses += 1;
    } else if (outcome.classification === "false_alarm") {
      falseAlarms += 1;
    } else {
      correctRejections += 1;
    }

    // Hub-specific go/no-go operationalisation: lapse means response-required timeout.
    // Relational modes should treat any SOA timeout as a lapse.
    if (outcome.isLapse) {
      lapseCount += 1;
    }
    if (outcome.isLure) {
      lureTrials += 1;
      if (outcome.classification === "false_alarm") {
        faOnLures += 1;
      }
    }
    if (Number.isFinite(outcome.rtMs)) {
      rtValues.push(outcome.rtMs);
    }
    errorFlags.push(Boolean(outcome.isError));
  }

  const totalTrials = trials.length;
  const accuracyRaw = computeAccuracy({
    hits,
    correctRejections,
    totalTrials
  });
  const accuracy = Number(accuracyRaw.toFixed(4));
  const rtStats = computeRtStats(rtValues);
  const errorBursts = countErrorBursts(errorFlags, 8, 3);

  let outcomeBand = "HOLD";
  if (accuracy >= 0.9) {
    outcomeBand = "UP";
  } else if (accuracy < 0.75) {
    outcomeBand = "DOWN";
  }

  let nEnd = plan.n;
  if (outcomeBand === "UP") {
    nEnd = Math.min(plan.n + 1, nMax);
  } else if (outcomeBand === "DOWN") {
    nEnd = Math.max(plan.n - 1, 1);
  }

  return {
    nEnd,
    outcomeBand,
    blockResult: {
      blockIndex: plan.blockIndex,
      wrapper: plan.wrapper,
      nStart: plan.n,
      nEnd,
      speed: plan.speed,
      interference: plan.interference,
      targetModality: plan.targetModality,
      trials: totalTrials,
      hits,
      misses,
      falseAlarms,
      correctRejections,
      accuracy,
      meanRtMs: rtStats.meanRtMs,
      rtSdMs: rtStats.rtSdMs,
      lapseCount,
      errorBursts,
      faOnLures,
      lureTrials
    }
  };
}

export function createHubSessionSummary({
  tsStart,
  tsEnd,
  blocksPlanned,
  blocks
}) {
  return {
    id: makeSessionId("hub_session"),
    tsStart,
    tsEnd,
    dateLocal: dateLocal(tsStart),
    wrapperFamily: "hub",
    blocksPlanned,
    blocks,
    notes: {
      click: false,
      clickNote: "Stage 3 hub session"
    }
  };
}
