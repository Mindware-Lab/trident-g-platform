export const ZONE_PROBE_CONFIG = Object.freeze({
  appVersion: "mftm_router_basic_v1",
  schemaVersion: 1,
  totalSeconds: 180,
  nArrows: 5,
  easyMajority: 4,
  hardMajority: 3,
  catchMajority: 5,
  fixationMs: 350,
  isiMs: 150,
  responseTimeoutMs: 1500,
  maskMs: 100,
  startStimMs: 80,
  minStimMs: 25,
  maxStimMs: 220,
  stepFrames: 1,
  bpsScaleK: 0.28,
  rtMinMs: 150,
  rtMaxMs: 1500,
  fastMs: 250,
  slowFloorMs: 1000,
  maxDroppedFrameFrac: 0.06,
  bootstrapWarmupSeconds: 40,
  streamMix: Object.freeze({ stair: 0.75, probe: 0.2, catch: 0.05 }),
  catchProbeFracMax: 0.16,
  baselineWindow: 14
});

const LEGACY_STATE_ALIASES = Object.freeze({
  ready: "in_zone",
  flat: "flat",
  spun_out: "overloaded_explore",
  locked_in: "overloaded_exploit"
});

export function normalizeZoneState(value) {
  return LEGACY_STATE_ALIASES[value] || value || "invalid";
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function sd(values) {
  if (values.length < 2) {
    return 0;
  }
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / (values.length - 1);
  return Math.sqrt(Math.max(0, variance));
}

export function median(values) {
  if (!values.length) {
    return null;
  }
  const sorted = values.slice().sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function percentile(values, percentileValue) {
  if (!values.length) {
    return null;
  }
  const sorted = values.slice().sort((left, right) => left - right);
  const index = clamp(Math.round((sorted.length - 1) * percentileValue), 0, sorted.length - 1);
  return sorted[index];
}

export function ewma(values, alpha = 0.25) {
  if (!values.length) {
    return null;
  }
  let smoothed = values[0];
  for (let index = 1; index < values.length; index += 1) {
    smoothed = (alpha * values[index]) + ((1 - alpha) * smoothed);
  }
  return smoothed;
}

function tailMean(history, count = 20) {
  return history.length ? mean(history.slice(Math.max(0, history.length - count))) : null;
}

function rtLag1(values) {
  if (values.length < 6) {
    return null;
  }
  const avg = mean(values);
  const spread = sd(values);
  if (!Number.isFinite(avg) || !Number.isFinite(spread) || spread <= 0) {
    return null;
  }
  let numerator = 0;
  let denominator = 0;
  for (let index = 1; index < values.length; index += 1) {
    numerator += (values[index] - avg) * (values[index - 1] - avg);
    denominator += (values[index - 1] - avg) * (values[index - 1] - avg);
  }
  return denominator <= 0 ? null : numerator / denominator;
}

function thirdsSlope(probeTrials) {
  if (!probeTrials.length) {
    return { rtSlope: null, errSlope: null };
  }
  const size = Math.ceil(probeTrials.length / 3);
  const chunks = [0, 1, 2]
    .map((index) => probeTrials.slice(index * size, (index + 1) * size))
    .filter((chunk) => chunk.length);
  if (chunks.length < 2) {
    return { rtSlope: null, errSlope: null };
  }
  const rtValues = chunks.map((chunk) => mean(chunk.filter((trial) => Number.isFinite(trial.rtMs)).map((trial) => trial.rtMs)));
  const errorValues = chunks.map((chunk) => chunk.filter((trial) => !trial.isCorrect).length / chunk.length);
  return {
    rtSlope: Number.isFinite(rtValues[0]) && Number.isFinite(rtValues[rtValues.length - 1])
      ? (rtValues[rtValues.length - 1] - rtValues[0]) / Math.max(1, chunks.length - 1)
      : null,
    errSlope: Number.isFinite(errorValues[0]) && Number.isFinite(errorValues[errorValues.length - 1])
      ? (errorValues[errorValues.length - 1] - errorValues[0]) / Math.max(1, chunks.length - 1)
      : null
  };
}

function normalizeScore(value, low, high) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return clamp((value - low) / Math.max(0.0001, high - low), 0, 2);
}

function topReasons(state, scorePack) {
  const labels = {
    timeouts: "Many timeouts",
    slow: "Slow lapses",
    tail: "Long RT tail",
    rtDrift: "RT drift",
    errDrift: "Error drift",
    catchFail: "Catch failures",
    rtCV: "High variability",
    rtVol: "RT volatility",
    fastErr: "Fast errors",
    burst: "Bursty errors",
    fast: "Very fast responses",
    pes: "Strong post-error slowing",
    slowSteady: "Slow rigid pattern",
    lowFastErr: "Low fast-error profile",
    lowVol: "Low RT volatility"
  };
  const bucket = scorePack?.contrib?.[state];
  if (!bucket) {
    return [];
  }
  return Object.entries(bucket)
    .filter(([, value]) => Number.isFinite(value) && value > 0.4)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key]) => labels[key] || key);
}

function computeProbeFeatures(trials) {
  const probeTrials = trials.filter((trial) => trial.stream === "probe");
  const catchTrials = trials.filter((trial) => trial.stream === "catch");
  const probeCount = probeTrials.length;
  const catchCount = catchTrials.length;
  const allRt = probeTrials.filter((trial) => Number.isFinite(trial.rtMs)).map((trial) => trial.rtMs);
  const boundedRt = allRt.filter((value) => value >= ZONE_PROBE_CONFIG.rtMinMs && value <= ZONE_PROBE_CONFIG.rtMaxMs);
  const accuracy = probeCount ? probeTrials.filter((trial) => trial.isCorrect).length / probeCount : null;
  const rtMed = median(boundedRt);
  const rtMean = mean(boundedRt);
  const rtCV = Number.isFinite(rtMean) && rtMean > 0 ? sd(boundedRt) / rtMean : null;
  const timeoutRate = probeCount ? probeTrials.filter((trial) => trial.timedOut).length / probeCount : null;
  const p90 = percentile(boundedRt, 0.9);
  const rtTailIndex = Number.isFinite(p90) && Number.isFinite(rtMed) ? (p90 - rtMed) : null;
  const slowThreshold = Number.isFinite(rtMed)
    ? Math.max(ZONE_PROBE_CONFIG.slowFloorMs, 3 * rtMed)
    : ZONE_PROBE_CONFIG.slowFloorMs;
  const slowLapseRate = probeCount ? probeTrials.filter((trial) => Number.isFinite(trial.rtMs) && trial.rtMs > slowThreshold).length / probeCount : null;
  const fastRate = probeCount ? probeTrials.filter((trial) => Number.isFinite(trial.rtMs) && trial.rtMs < ZONE_PROBE_CONFIG.fastMs).length / probeCount : null;
  const fastErrorRate = probeCount ? probeTrials.filter((trial) => !trial.isCorrect && Number.isFinite(trial.rtMs) && trial.rtMs < ZONE_PROBE_CONFIG.fastMs).length / probeCount : null;

  let rtVolatility = null;
  if (boundedRt.length >= 3) {
    const diffs = [];
    for (let index = 1; index < boundedRt.length; index += 1) {
      diffs.push(Math.abs(boundedRt[index] - boundedRt[index - 1]));
    }
    rtVolatility = median(diffs);
  }

  let errorRun = 0;
  let maxErrorRun = 0;
  probeTrials.forEach((trial) => {
    if (!trial.isCorrect) {
      errorRun += 1;
      maxErrorRun = Math.max(maxErrorRun, errorRun);
    } else {
      errorRun = 0;
    }
  });

  const binCount = Math.min(5, Math.max(2, Math.floor(probeCount / 4) || 0));
  const errorBins = [];
  if (binCount >= 2) {
    const binSize = Math.ceil(probeCount / binCount);
    for (let index = 0; index < binCount; index += 1) {
      const chunk = probeTrials.slice(index * binSize, (index + 1) * binSize);
      if (chunk.length) {
        errorBins.push(chunk.filter((trial) => !trial.isCorrect).length / chunk.length);
      }
    }
  }
  const errorBurstiness = probeCount ? (maxErrorRun + ((sd(errorBins) ** 2) * 10)) : null;
  const { rtSlope, errSlope } = thirdsSlope(probeTrials);

  const afterError = [];
  const afterCorrect = [];
  for (let index = 1; index < probeTrials.length; index += 1) {
    const previous = probeTrials[index - 1];
    const current = probeTrials[index];
    if (!Number.isFinite(current.rtMs)) {
      continue;
    }
    if (previous.isCorrect) {
      afterCorrect.push(current.rtMs);
    } else {
      afterError.push(current.rtMs);
    }
  }

  const pes = afterError.length && afterCorrect.length ? (mean(afterError) - mean(afterCorrect)) : null;
  const catchFailRate = catchCount ? catchTrials.filter((trial) => !trial.isCorrect).length / catchCount : null;

  return {
    probe: {
      n: probeCount,
      acc: accuracy,
      rtMed,
      rtCV,
      timeoutRate,
      slowLapseRate,
      rtTailIndex,
      fastRate,
      fastErrorRate,
      rtVolatility,
      errorBurstiness,
      rtSlope,
      errSlope,
      PES: pes,
      rtLag1: rtLag1(allRt),
      throughputProxy: Number.isFinite(accuracy) && Number.isFinite(rtMed) && rtMed > 0 ? accuracy / (rtMed / 1000) : null
    },
    catchFailRate,
    counts: {
      catchN: catchCount,
      catchFails: catchTrials.filter((trial) => !trial.isCorrect).length,
      pesSupport: afterError.length
    }
  };
}

function computeRouterScores(features, bitsPerSecond, baselines) {
  const probe = features.probe || {};
  const cold = {
    timeouts: 2.4 * normalizeScore(probe.timeoutRate, 0.02, 0.12),
    slow: 2.0 * normalizeScore(probe.slowLapseRate, 0.02, 0.1),
    tail: 1.4 * normalizeScore(probe.rtTailIndex, 100, 320),
    rtDrift: 1.2 * normalizeScore(probe.rtSlope, 20, 120),
    errDrift: 1.2 * normalizeScore(probe.errSlope, 0.02, 0.1),
    catchFail: 2.4 * normalizeScore(features.catchFailRate, 0.01, 0.12)
  };
  const explore = {
    rtCV: 1.8 * normalizeScore(probe.rtCV, 0.18, 0.34),
    rtVol: 1.6 * normalizeScore(probe.rtVolatility, 45, 140),
    fastErr: 2.2 * normalizeScore(probe.fastErrorRate, 0.01, 0.1),
    burst: 1.8 * normalizeScore(probe.errorBurstiness, 1.2, 4),
    fast: 0.8 * normalizeScore(probe.fastRate, 0.06, 0.22)
  };
  const slowSteady = (1.0 * normalizeScore(probe.rtMed, 480, 800))
    + (0.8 * normalizeScore(-(probe.rtVolatility ?? 0), -130, -35))
    + (0.6 * normalizeScore(-(probe.fastErrorRate ?? 0), -0.1, -0.01));
  const exploit = {
    pes: 2.2 * normalizeScore(probe.PES, 20, 130),
    slowSteady,
    lowFastErr: 0.6 * normalizeScore(-(probe.fastErrorRate ?? 0), -0.1, -0.005),
    lowVol: 0.6 * normalizeScore(-(probe.rtVolatility ?? 0), -140, -40)
  };

  const total = (bucket) => Object.values(bucket).reduce((sum, value) => sum + value, 0);
  let coldScore = total(cold);
  let exploreScore = total(explore);
  let exploitScore = total(exploit);
  let inZoneBpsPenalty = 0;

  if ((baselines.count || 0) >= 3) {
    const timeoutBaseline = ewma(baselines.timeout);
    const rtCvBaseline = ewma(baselines.rtCV);
    const pesBaseline = ewma(baselines.pes);
    const bpsBaseline = ewma(baselines.bps);
    const bpsSpread = sd(baselines.bps);
    if (Number.isFinite(probe.timeoutRate) && Number.isFinite(timeoutBaseline)) {
      coldScore += 0.8 * Math.max(0, probe.timeoutRate - timeoutBaseline) * 10;
    }
    if (Number.isFinite(probe.rtCV) && Number.isFinite(rtCvBaseline)) {
      exploreScore += 0.8 * Math.max(0, probe.rtCV - rtCvBaseline) * 8;
    }
    if (Number.isFinite(probe.PES) && Number.isFinite(pesBaseline)) {
      exploitScore += 0.6 * Math.max(0, probe.PES - pesBaseline) / 50;
    }
    if (Number.isFinite(bitsPerSecond) && Number.isFinite(bpsBaseline)) {
      inZoneBpsPenalty = Math.max(0, (bpsBaseline - bitsPerSecond) / Math.max(0.25, bpsSpread || 0.4));
    }
  }

  return {
    coldScore,
    exploreScore,
    exploitScore,
    contrib: {
      flat: cold,
      overloaded_explore: explore,
      overloaded_exploit: exploit
    },
    inZoneBpsPenalty
  };
}

export function validZoneRows(rows) {
  return rows.filter((row) => row?.valid && Number.isFinite(row?.bitsPerSecond) && normalizeZoneState(row?.state) !== "invalid");
}

export function computeZoneBaselines(rows) {
  const validRows = validZoneRows(rows);
  const windowRows = validRows.slice(-ZONE_PROBE_CONFIG.baselineWindow);
  const pick = (selector) => windowRows.map(selector).filter(Number.isFinite);
  return {
    count: validRows.length,
    bps: pick((row) => row.bitsPerSecond),
    rtCV: pick((row) => row.features?.probe?.rtCV),
    timeout: pick((row) => row.features?.probe?.timeoutRate),
    fastErr: pick((row) => row.features?.probe?.fastErrorRate),
    pes: pick((row) => row.features?.probe?.PES),
    catchFail: pick((row) => row.features?.catchFailRate)
  };
}

export function lastProbeFrames(rows) {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const frames = rows[index]?.probeDurFrames;
    if (rows[index]?.valid && frames && Number.isFinite(frames.easy) && Number.isFinite(frames.hard)) {
      return {
        easy: Math.round(frames.easy),
        hard: Math.round(frames.hard)
      };
    }
  }
  return null;
}

export function classifyZoneSummary({ valid, invalidReason, features, bitsPerSecond, baselines }) {
  if (!valid) {
    return {
      state: "invalid",
      confidence: "Low",
      reasons: [invalidReason || "Timing or focus quality failed"],
      scores: null
    };
  }
  const probe = features.probe || {};
  const scores = computeRouterScores(features, bitsPerSecond, baselines);
  const bpsBaseline = ewma(baselines.bps);
  const bpsSpread = sd(baselines.bps);
  const bpsOk = (baselines.count < 3)
    || !Number.isFinite(bpsBaseline)
    || !Number.isFinite(bitsPerSecond)
    || (bitsPerSecond >= bpsBaseline - Math.max(0.25, 0.5 * (bpsSpread || 0.5)));

  const inZone = (baselines.count < 2)
    ? ((probe.n || 0) >= 18
      && scores.coldScore < 1.5
      && scores.exploreScore < 1.7
      && scores.exploitScore < 1.6
      && (!Number.isFinite(features.catchFailRate) || features.catchFailRate <= 0.02))
    : ((probe.n || 0) >= 18
      && scores.coldScore < 2.0
      && scores.exploreScore < 2.2
      && scores.exploitScore < 2.1
      && (!Number.isFinite(features.catchFailRate) || features.catchFailRate <= 0.02)
      && bpsOk);

  let state;
  if (inZone) {
    state = "in_zone";
  } else {
    state = [
      ["flat", scores.coldScore],
      ["overloaded_explore", scores.exploreScore],
      ["overloaded_exploit", scores.exploitScore]
    ].sort((left, right) => right[1] - left[1])[0][0];
  }

  let confidence = "Low";
  if (state !== "in_zone") {
    const ranked = [
      ["flat", scores.coldScore],
      ["overloaded_explore", scores.exploreScore],
      ["overloaded_exploit", scores.exploitScore]
    ].sort((left, right) => right[1] - left[1]);
    const margin = (ranked[0]?.[1] ?? 0) - (ranked[1]?.[1] ?? 0);
    confidence = margin >= 1.2 ? "High" : margin >= 0.5 ? "Medium" : "Low";
  } else {
    confidence = baselines.count >= 5 ? "Medium" : "Low";
  }

  if ((probe.n || 0) < 16) {
    confidence = "Low";
  }
  if (state === "overloaded_exploit" && (features.counts?.pesSupport || 0) < 8) {
    confidence = "Low";
  }
  if (state === "in_zone" && baselines.count >= 5 && confidence === "Medium" && (probe.n || 0) >= 24) {
    confidence = "High";
  }

  return {
    state,
    confidence,
    reasons: state === "in_zone"
      ? ["Low lapse/catch failure", "Low variability and burstiness", "No dominant off-zone signature"]
      : topReasons(state, scores),
    scores: {
      flat: Number.isFinite(scores.coldScore) ? Number(scores.coldScore.toFixed(3)) : null,
      overloaded_explore: Number.isFinite(scores.exploreScore) ? Number(scores.exploreScore.toFixed(3)) : null,
      overloaded_exploit: Number.isFinite(scores.exploitScore) ? Number(scores.exploitScore.toFixed(3)) : null
    }
  };
}

export function bitsPerSecondFromStairs(stairs, frameMs) {
  const easyFrames = tailMean(stairs.easy.hist);
  const hardFrames = tailMean(stairs.hard.hist);
  const easySeconds = Number.isFinite(easyFrames) ? (easyFrames * frameMs / 1000) : null;
  const hardSeconds = Number.isFinite(hardFrames) ? (hardFrames * frameMs / 1000) : null;
  const easy = Number.isFinite(easySeconds) && easySeconds > 0 ? ZONE_PROBE_CONFIG.bpsScaleK * (1 / easySeconds) : null;
  const hard = Number.isFinite(hardSeconds) && hardSeconds > 0 ? ZONE_PROBE_CONFIG.bpsScaleK * (1 / hardSeconds) : null;
  return {
    easy,
    hard,
    combined: Number.isFinite(easy) && Number.isFinite(hard) ? (easy + hard) / 2 : (easy ?? hard),
    easyFrames,
    hardFrames
  };
}

export function summarizeZoneRun({
  sessionId,
  trials,
  timing,
  falseStarts,
  valid,
  invalidReason,
  bits,
  probeDurFrames,
  historyRows
}) {
  const baselines = computeZoneBaselines(historyRows);
  const bitsResult = bits || {
    easy: null,
    hard: null,
    combined: null
  };
  const features = computeProbeFeatures(trials);
  const router = classifyZoneSummary({
    valid,
    invalidReason,
    features,
    bitsPerSecond: bitsResult.combined,
    baselines
  });

  return {
    sessionId,
    timestamp: Date.now(),
    valid,
    invalidReason: valid ? null : (invalidReason || "Timing or focus quality failed"),
    state: router.state,
    confidence: router.confidence,
    reasons: router.reasons,
    bitsPerSecond: Number.isFinite(bitsResult.combined) ? Number(bitsResult.combined.toFixed(3)) : null,
    timing: {
      frameMs: Number.isFinite(timing.frameMs) ? Number(timing.frameMs.toFixed(3)) : null,
      hz: Number.isFinite(timing.frameMs) && timing.frameMs > 0 ? Number((1000 / timing.frameMs).toFixed(1)) : null,
      droppedFrac: Number.isFinite(timing.droppedFrac) ? Number(timing.droppedFrac.toFixed(4)) : null
    },
    probeDurFrames: {
      easy: probeDurFrames.easy,
      hard: probeDurFrames.hard,
      catch: probeDurFrames.catch
    },
    features: {
      probe: {
        n: features.probe.n,
        acc: Number.isFinite(features.probe.acc) ? Number(features.probe.acc.toFixed(4)) : null,
        rtMed: Number.isFinite(features.probe.rtMed) ? Math.round(features.probe.rtMed) : null,
        rtCV: Number.isFinite(features.probe.rtCV) ? Number(features.probe.rtCV.toFixed(4)) : null,
        timeoutRate: Number.isFinite(features.probe.timeoutRate) ? Number(features.probe.timeoutRate.toFixed(4)) : null,
        slowLapseRate: Number.isFinite(features.probe.slowLapseRate) ? Number(features.probe.slowLapseRate.toFixed(4)) : null,
        rtTailIndex: Number.isFinite(features.probe.rtTailIndex) ? Math.round(features.probe.rtTailIndex) : null,
        fastRate: Number.isFinite(features.probe.fastRate) ? Number(features.probe.fastRate.toFixed(4)) : null,
        fastErrorRate: Number.isFinite(features.probe.fastErrorRate) ? Number(features.probe.fastErrorRate.toFixed(4)) : null,
        rtVolatility: Number.isFinite(features.probe.rtVolatility) ? Math.round(features.probe.rtVolatility) : null,
        errorBurstiness: Number.isFinite(features.probe.errorBurstiness) ? Number(features.probe.errorBurstiness.toFixed(3)) : null,
        rtSlope: Number.isFinite(features.probe.rtSlope) ? Number(features.probe.rtSlope.toFixed(2)) : null,
        errSlope: Number.isFinite(features.probe.errSlope) ? Number(features.probe.errSlope.toFixed(4)) : null,
        PES: Number.isFinite(features.probe.PES) ? Math.round(features.probe.PES) : null,
        rtLag1: Number.isFinite(features.probe.rtLag1) ? Number(features.probe.rtLag1.toFixed(4)) : null,
        throughputProxy: Number.isFinite(features.probe.throughputProxy) ? Number(features.probe.throughputProxy.toFixed(4)) : null
      },
      catchFailRate: Number.isFinite(features.catchFailRate) ? Number(features.catchFailRate.toFixed(4)) : null
    },
    counts: {
      totalTrials: trials.length,
      stairTrials: trials.filter((trial) => trial.stream === "stair").length,
      probeTrials: trials.filter((trial) => trial.stream === "probe").length,
      catchTrials: trials.filter((trial) => trial.stream === "catch").length,
      falseStarts: falseStarts || 0,
      catchFails: features.counts.catchFails,
      pesSupport: features.counts.pesSupport
    },
    baselines: {
      priorValidCount: baselines.count,
      bpsEwma: Number.isFinite(ewma(baselines.bps)) ? Number(ewma(baselines.bps).toFixed(3)) : null
    },
    scores: router.scores
  };
}
