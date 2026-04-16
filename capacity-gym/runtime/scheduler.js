function shuffle(values, rng) {
  const list = values.slice();
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    const current = list[index];
    list[index] = list[swapIndex];
    list[swapIndex] = current;
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

    for (let index = 0; index < ordered.length; index += 1) {
      const value = ordered[index];
      const leftTaken = selected.includes(value - 1);
      const rightTaken = selected.includes(value + 1);
      const finalPairConflict = avoidFinalPair && (
        (value === totalTrials - 1 && selected.includes(totalTrials - 2))
        || (value === totalTrials - 2 && selected.includes(totalTrials - 1))
      );

      if (leftTaken || rightTaken || finalPairConflict) {
        continue;
      }

      selected.push(value);
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

  const remaining = shuffle(candidates.filter((value) => !best.includes(value)), rng);
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
  for (let index = n; index < totalTrials; index += 1) {
    eligible.push(index);
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

  for (let index = 0; index < finalSet.length; index += 1) {
    flags[finalSet[index]] = true;
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
  for (let index = n; index < totalTrials; index += 1) {
    if (!targetMatchFlags[index]) {
      candidates.push(index);
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
  for (let index = 0; index < selected.length; index += 1) {
    flags[selected[index]] = true;
  }
  return flags;
}

export function scheduleBlockTrials({
  baseTrials = 20,
  n = 1,
  matchRate = 0.3,
  rng = Math.random
} = {}) {
  const totalTrials = baseTrials + n;
  return {
    totalTrials,
    matchRate,
    matchFlags: scheduleMatchFlags({ totalTrials, n, matchRate, rng })
  };
}
