export function calculateBlockMetrics() {
  return {
    hits: 0,
    misses: 0,
    falseAlarms: 0,
    correctRejections: 0,
    accuracy: 0,
    meanRtMs: null,
    rtSdMs: null,
    lapseCount: 0,
    errorBursts: 0
  };
}

export function computeAccuracy({ hits, correctRejections, totalTrials }) {
  if (!Number.isFinite(totalTrials) || totalTrials <= 0) {
    return 0;
  }
  return (hits + correctRejections) / totalTrials;
}

export function computeRtStats(rtValues) {
  const values = (Array.isArray(rtValues) ? rtValues : [])
    .filter((value) => Number.isFinite(value) && value >= 0);
  if (!values.length) {
    return {
      meanRtMs: null,
      rtSdMs: null
    };
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => {
    const delta = value - mean;
    return sum + (delta * delta);
  }, 0) / values.length;

  return {
    meanRtMs: Math.round(mean),
    rtSdMs: Math.round(Math.sqrt(variance))
  };
}

export function countErrorBursts(errorFlags, windowSize = 8, threshold = 3) {
  const flags = Array.isArray(errorFlags) ? errorFlags : [];
  if (flags.length < windowSize) {
    return 0;
  }

  let bursts = 0;
  for (let start = 0; start <= flags.length - windowSize; start += 1) {
    let errorsInWindow = 0;
    for (let i = start; i < start + windowSize; i += 1) {
      if (flags[i]) {
        errorsInWindow += 1;
      }
    }
    if (errorsInWindow >= threshold) {
      bursts += 1;
    }
  }
  return bursts;
}
