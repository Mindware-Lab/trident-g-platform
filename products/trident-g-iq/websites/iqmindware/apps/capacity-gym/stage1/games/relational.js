import { createSeededRng, hash32, randomInt } from "../lib/rng.js";
import { computeAccuracy, computeRtStats, countErrorBursts } from "../lib/metrics.js";
import { scheduleBlockTrials } from "../lib/scheduler.js";

export const REL_TOTAL_BLOCKS = 10;
export const REL_BASE_TRIALS = 20;
export const REL_N_MAX = 3;
export const REL_QUIZ_ITEMS = 2;
export const REL_QUIZ_TIMEOUT_MS = 7000;
export const REL_CUE_MS = 1200;
export const REL_DISPLAY_RATIO = 0.65;
export const REL_SOA_MS = {
  slow: 3000,
  fast: 1400
};

function normalizeQuizItems(rawItems) {
  const safe = Array.isArray(rawItems) ? rawItems : [];
  const valid = [];
  const seen = new Set();

  for (let i = 0; i < safe.length; i += 1) {
    const item = safe[i];
    if (!item || typeof item.prompt !== "string" || typeof item.answerTrue !== "boolean") {
      continue;
    }
    const key = `${item.prompt}::${item.answerTrue}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    valid.push({
      prompt: item.prompt,
      answerTrue: item.answerTrue
    });
  }

  // Enforce fixed per-block quiz cardinality for Stage 4 contract.
  while (valid.length < REL_QUIZ_ITEMS) {
    if (valid.length === 0) {
      valid.push({
        prompt: "Is this relation true in exactly 2 steps?",
        answerTrue: false
      });
      continue;
    }
    const source = valid[0];
    valid.push({
      prompt: `${source.prompt} (check ${valid.length + 1})`,
      answerTrue: source.answerTrue
    });
  }

  return valid.slice(0, REL_QUIZ_ITEMS);
}

function makeSessionId(prefix) {
  return `${prefix}_session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function dateLocal(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

function pickNonMatchIndex(previousIndex, poolSize, rng) {
  if (poolSize <= 1) {
    return previousIndex;
  }
  let candidate = randomInt(rng, 0, poolSize - 1);
  let guard = 0;
  while (candidate === previousIndex && guard < 16) {
    candidate = randomInt(rng, 0, poolSize - 1);
    guard += 1;
  }
  if (candidate === previousIndex) {
    return (previousIndex + 1) % poolSize;
  }
  return candidate;
}

function normalizeRelationalFlags(flags) {
  const safeFlags = flags && typeof flags === "object" ? flags : {};
  return {
    coachState: safeFlags.coachState ?? null,
    pulseType: null,
    swapSegment: null,
    wasSwapProbe: false
  };
}

function buildTokenIndexStream(totalTrials, n, matchFlags, poolSize, rng) {
  const tokenIndices = Array.from({ length: totalTrials }, () => 0);
  for (let i = 0; i < totalTrials; i += 1) {
    if (i < n) {
      tokenIndices[i] = randomInt(rng, 0, poolSize - 1);
      continue;
    }
    if (matchFlags[i]) {
      tokenIndices[i] = tokenIndices[i - n];
      continue;
    }
    tokenIndices[i] = pickNonMatchIndex(tokenIndices[i - n], poolSize, rng);
  }
  return tokenIndices;
}

function isSurfaceDiversityMode(wrapper) {
  return wrapper === "transitive" || wrapper === "propositional";
}

function getDisplayText(display) {
  if (!display || typeof display !== "object") {
    return "";
  }
  return typeof display.text === "string" ? display.text.trim() : "";
}

function makeRenderRng(blockSeed, trialIndex, canonKey, variantIndex = 0) {
  return createSeededRng(hash32(`${blockSeed}:${trialIndex}:${canonKey}:variant:${variantIndex}`));
}

function renderTrialDisplay({
  modeDef,
  token,
  trialIndex,
  blockIndex,
  sessionContext,
  blockVisualState,
  blockSeed,
  variantIndex = 0
}) {
  return modeDef.renderToken({
    token,
    trialIndex,
    blockIndex,
    sessionContext,
    blockVisualState,
    rng: makeRenderRng(blockSeed, trialIndex, token.canonKey, variantIndex)
  });
}

function violatesSurfaceUniqueness({
  trialIndex,
  n,
  trials,
  candidateTrial
}) {
  const candidateText = getDisplayText(candidateTrial.display);
  if (!candidateText) {
    return false;
  }

  if (trialIndex > 0) {
    const previousText = getDisplayText(trials[trialIndex - 1].display);
    if (previousText && previousText === candidateText) {
      return true;
    }
  }

  if (trialIndex >= n) {
    const nBackTrial = trials[trialIndex - n];
    if (nBackTrial && candidateTrial.canonKey === nBackTrial.canonKey) {
      const nBackText = getDisplayText(nBackTrial.display);
      if (nBackText && nBackText === candidateText) {
        return true;
      }
    }
  }

  return false;
}

export function createRelationalBlockPlan({
  wrapper,
  blockIndex,
  n,
  speed = "slow",
  interference = "low",
  flags
}) {
  return {
    blockIndex,
    wrapper,
    n,
    speed,
    interference,
    flags: normalizeRelationalFlags(flags)
  };
}

export function createRelationalBlockTrials({
  modeDef,
  sessionContext,
  sessionSeed,
  blockIndex,
  n,
  speed = "slow",
  baseTrials = REL_BASE_TRIALS,
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
  const blockSeed = hash32(`${sessionSeed}:${modeDef.wrapper}:block:${blockIndex}`);
  const tokenPoolResult = modeDef.buildTokenPool(sessionContext, { blockIndex, blockSeed });
  const tokenPool = Array.isArray(tokenPoolResult)
    ? tokenPoolResult
    : (Array.isArray(tokenPoolResult?.tokens) ? tokenPoolResult.tokens : []);
  const blockMeta = Array.isArray(tokenPoolResult)
    ? null
    : (tokenPoolResult?.meta ?? null);
  if (!Array.isArray(tokenPool) || !tokenPool.length) {
    throw new Error(`Relational mode ${modeDef.wrapper} returned empty token pool.`);
  }

  const blockVisualState = typeof modeDef.buildBlockVisualState === "function"
    ? modeDef.buildBlockVisualState(sessionContext, blockSeed)
    : null;

  const tokenIndices = buildTokenIndexStream(
    totalTrials,
    n,
    schedule.matchFlags,
    tokenPool.length,
    rng
  );

  const trials = [];
  for (let trialIndex = 0; trialIndex < tokenIndices.length; trialIndex += 1) {
    const tokenIndex = tokenIndices[trialIndex];
    const token = tokenPool[tokenIndex];
    const trial = {
      trialIndex,
      canonKey: token.canonKey,
      token,
      display: renderTrialDisplay({
        modeDef,
        token,
        trialIndex,
        blockIndex,
        sessionContext,
        blockVisualState,
        blockSeed,
        variantIndex: 0
      })
    };

    if (!isSurfaceDiversityMode(modeDef.wrapper)) {
      trials.push(trial);
      continue;
    }

    // Keep canonical stream fixed; only vary rendered surface to avoid identical repeats.
    const MAX_VARIANT_ATTEMPTS = 12;
    for (let variantIndex = 1; variantIndex <= MAX_VARIANT_ATTEMPTS; variantIndex += 1) {
      if (!violatesSurfaceUniqueness({ trialIndex, n, trials, candidateTrial: trial })) {
        break;
      }
      trial.display = renderTrialDisplay({
        modeDef,
        token,
        trialIndex,
        blockIndex,
        sessionContext,
        blockVisualState,
        blockSeed,
        variantIndex
      });
    }

    trials.push(trial);
  }

  const quizRng = createSeededRng(hash32(`quiz:${blockSeed}`));
  const rawQuizItems = modeDef.buildQuizItems({
    sessionContext,
    blockIndex,
    rng: quizRng
  });
  const quizItems = normalizeQuizItems(rawQuizItems);

  return {
    soaMs: REL_SOA_MS[speed] || REL_SOA_MS.slow,
    displayMs: Math.round((REL_SOA_MS[speed] || REL_SOA_MS.slow) * REL_DISPLAY_RATIO),
    trials,
    quizItems,
    blockVisualState,
    blockSeed,
    blockMeta
  };
}

export function isRelationalMatchAtIndex(trials, trialIndex, n) {
  if (trialIndex < n) {
    return false;
  }
  return trials[trialIndex].canonKey === trials[trialIndex - n].canonKey;
}

export function summarizeRelationalBlock({
  plan,
  trials,
  trialOutcomes,
  quizOutcomes,
  nMax = REL_N_MAX
}) {
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let correctRejections = 0;
  let lapseCount = 0;
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

    if (outcome.isLapse) {
      lapseCount += 1;
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

  const safeQuiz = Array.isArray(quizOutcomes) ? quizOutcomes : [];
  const quizCorrect = safeQuiz.filter((item) => item && item.isCorrect).length;
  const quizTotal = REL_QUIZ_ITEMS;

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
      quizCorrect,
      quizTotal
    }
  };
}

export function createRelationalSessionSummary({
  wrapper,
  tsStart,
  tsEnd,
  blocksPlanned,
  blocks
}) {
  return {
    id: makeSessionId(wrapper),
    tsStart,
    tsEnd,
    dateLocal: dateLocal(tsStart),
    wrapperFamily: "relational",
    blocksPlanned,
    blocks,
    notes: {
      click: false,
      clickNote: `Stage 4 relational ${wrapper} session`
    }
  };
}
