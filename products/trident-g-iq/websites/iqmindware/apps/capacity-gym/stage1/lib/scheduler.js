function shuffle(values, rng) {
  const list = values.slice();
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}

function selectIndicesPreferNonAdjacent(
  candidates,
  targetCount,
  rng,
  { avoidFinalPair = false, totalTrials = 0, allowFallback = true } = {}
) {
  if (!targetCount || !candidates.length) {
    return [];
  }

  let best = [];
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const selected = [];
    const ordered = shuffle(candidates, rng);
    for (let i = 0; i < ordered.length; i += 1) {
      const index = ordered[i];
      const leftTaken = selected.includes(index - 1);
      const rightTaken = selected.includes(index + 1);
      const isFinalPairConflict = avoidFinalPair && (
        (index === totalTrials - 1 && selected.includes(totalTrials - 2))
        || (index === totalTrials - 2 && selected.includes(totalTrials - 1))
      );
      if (leftTaken || rightTaken || isFinalPairConflict) {
        continue;
      }
      selected.push(index);
      if (selected.length >= targetCount) {
        break;
      }
    }
    if (selected.length > best.length) {
      best = selected.slice();
    }
    if (best.length >= targetCount) {
      break;
    }
  }

  if (best.length >= targetCount) {
    return best.slice(0, targetCount);
  }
  if (!allowFallback) {
    return best;
  }

  // Fill remaining slots even if adjacency is required.
  const remaining = shuffle(candidates.filter((index) => !best.includes(index)), rng);
  while (best.length < targetCount && remaining.length) {
    best.push(remaining.pop());
  }
  return best;
}

export function scheduleMatchFlags({
  totalTrials,
  n,
  matchRate = 0.3,
  rng = Math.random
} = {}) {
  const flags = Array.from({ length: totalTrials }, () => false);
  if (!Number.isFinite(totalTrials) || !Number.isFinite(n) || totalTrials <= 0 || n < 1 || n >= totalTrials) {
    return flags;
  }

  const eligible = [];
  for (let i = n; i < totalTrials; i += 1) {
    eligible.push(i);
  }

  const requested = Math.round(eligible.length * matchRate);
  const maxNoAdj = Math.ceil(eligible.length / 2);
  const target = Math.max(0, Math.min(requested, maxNoAdj));
  if (target === 0) {
    return flags;
  }

  const finalSet = selectIndicesPreferNonAdjacent(eligible, target, rng, {
    avoidFinalPair: true,
    totalTrials,
    allowFallback: false
  });
  for (let i = 0; i < finalSet.length; i += 1) {
    flags[finalSet[i]] = true;
  }
  return flags;
}

export function scheduleLureFlags({
  targetMatchFlags,
  n,
  lureRate = 0.1,
  rng = Math.random
} = {}) {
  if (!Array.isArray(targetMatchFlags) || !Number.isFinite(n) || n < 1) {
    return [];
  }

  const totalTrials = targetMatchFlags.length;
  const flags = Array.from({ length: totalTrials }, () => false);
  const candidates = [];
  for (let i = n; i < totalTrials; i += 1) {
    if (!targetMatchFlags[i]) {
      candidates.push(i);
    }
  }

  const targetCount = Math.max(0, Math.min(
    Math.round(candidates.length * lureRate),
    candidates.length
  ));
  if (!targetCount) {
    return flags;
  }

  const selected = selectIndicesPreferNonAdjacent(candidates, targetCount, rng);
  for (let i = 0; i < selected.length; i += 1) {
    flags[selected[i]] = true;
  }
  return flags;
}

export function scheduleBlockTrials({ baseTrials = 20, n = 1, matchRate = 0.3, rng = Math.random } = {}) {
  const totalTrials = baseTrials + n;
  return {
    totalTrials,
    matchRate,
    matchFlags: scheduleMatchFlags({ totalTrials, n, matchRate, rng })
  };
}
