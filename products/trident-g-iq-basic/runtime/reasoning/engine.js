import {
  REASONING_MODE_IDS,
  REASONING_NODE_IDS,
  getReasoningFamilies,
  getReasoningModeNode,
  getReasoningNode
} from "../../content/reasoning/catalog.js";
import {
  probeBestExplanationTemplateIds,
  probeBestNextCheckTemplateIds,
  probeScenarioBundles
} from "../../content/reasoning/probe-content.js";

const BAND_WINDOWS = Object.freeze({
  [REASONING_MODE_IDS.BEST_EXPLANATION]: {
    A: { min: 1, max: 2, label: "PAB 1-2" },
    B: { min: 2, max: 2, label: "PAB 2" },
    C: { min: 3, max: 3, label: "PAB 3" },
    D: { min: 3, max: 4, label: "PAB 3-4" }
  },
  [REASONING_MODE_IDS.BEST_NEXT_CHECK]: {
    A: { min: 2, max: 2, label: "PAB 2" },
    B: { min: 2, max: 3, label: "PAB 2-3" },
    C: { min: 3, max: 4, label: "PAB 3-4" }
  }
});

const BAND_ORDER = Object.freeze({
  [REASONING_MODE_IDS.BEST_EXPLANATION]: ["A", "B", "C", "D"],
  [REASONING_MODE_IDS.BEST_NEXT_CHECK]: ["A", "B", "C"]
});

const PROCESS_LABELS = Object.freeze({
  [REASONING_MODE_IDS.BEST_EXPLANATION]: {
    lureResistance: "Lure resistance",
    modelRevision: "Model revision",
    patternHolding: "Pattern holding",
    upstreamReasoning: "Upstream reasoning"
  },
  [REASONING_MODE_IDS.BEST_NEXT_CHECK]: {
    probeChoice: "Probe choice",
    diagnosticSharpness: "Diagnostic sharpness",
    upstreamChecking: "Upstream checking",
    modelSeparatingJudgement: "Model-separating judgement"
  }
});

function hashString(input) {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function mulberry32(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleList(list, rand) {
  const next = [...list];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rand() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : "--";
}

function formatPabValue(value) {
  return Number.isFinite(value) && value > 0 ? `PAB ${Math.round(value)}` : "Not banked";
}

function mean(values) {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (!filtered.length) {
    return null;
  }
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function bandWindow(modeId, band) {
  return BAND_WINDOWS[modeId]?.[band] || BAND_WINDOWS[modeId]?.A || { min: 1, max: 1, label: "PAB 1" };
}

function bandOrder(modeId) {
  return BAND_ORDER[modeId] || BAND_ORDER[REASONING_MODE_IDS.BEST_EXPLANATION];
}

function bandIndex(modeId, band) {
  return bandOrder(modeId).indexOf(band);
}

function nextBandByPerformance(modeId, band, accuracy) {
  const order = bandOrder(modeId);
  const currentIndex = Math.max(0, order.indexOf(band));
  if (accuracy >= 0.75) {
    return order[Math.min(order.length - 1, currentIndex + 1)];
  }
  if (accuracy < 0.6) {
    return order[Math.max(0, currentIndex - 1)];
  }
  return order[currentIndex];
}

function maxBand(modeId, bandA, bandB) {
  return bandIndex(modeId, bandA) >= bandIndex(modeId, bandB) ? bandA : bandB;
}

function nextTargetWindow(modeId, band) {
  const order = bandOrder(modeId);
  const currentIndex = Math.max(0, order.indexOf(band));
  const nextBand = order[Math.min(order.length - 1, currentIndex + 1)];
  const window = bandWindow(modeId, nextBand);
  if (nextBand === band) {
    return `Hold ${window.label}`;
  }
  return window.label;
}

function templatePool(modeId, band) {
  if (modeId === REASONING_MODE_IDS.BEST_EXPLANATION) {
    if (band === "A") {
      return [
        "visible_symptom_vs_underlying_cause",
        "shared_source_vs_local_fault"
      ];
    }
    if (band === "B") {
      return [
        "visible_symptom_vs_underlying_cause",
        "shared_source_vs_local_fault",
        "broken_dependency_missing_prerequisite"
      ];
    }
    return probeBestExplanationTemplateIds;
  }

  if (band === "A") {
    return [
      "two_live_explanations_one_separator",
      "broad_check_vs_narrow_decisive_probe"
    ];
  }
  if (band === "B") {
    return [
      "two_live_explanations_one_separator",
      "shared_downstream_symptom_vs_upstream_check",
      "broad_check_vs_narrow_decisive_probe"
    ];
  }
  return probeBestNextCheckTemplateIds;
}

function wrapperSlots(modeState, band) {
  if (!modeState.wrapperMixUnlocked) {
    return Array.from({ length: 6 }, () => "real_world");
  }
  if (band === "C" || band === "D") {
    return ["real_world", "real_world", "real_world", "micro_world", "micro_world", "micro_world"];
  }
  return ["real_world", "real_world", "real_world", "real_world", "micro_world", "micro_world"];
}

function pabForItem(modeId, band, itemIndex, rand) {
  const window = bandWindow(modeId, band);
  if (window.min === window.max) {
    return window.min;
  }
  const values = [];
  for (let pab = window.min; pab <= window.max; pab += 1) {
    values.push(pab);
  }
  return values[(itemIndex + Math.floor(rand() * values.length)) % values.length];
}

function createOptionId(itemIndex, optionIndex) {
  return `o${itemIndex + 1}${String.fromCharCode(97 + optionIndex)}`;
}

function makeExplanationMetrics(templateId, band) {
  const base = {
    A: { h: 1, d: 1, r: 0 },
    B: { h: 2, d: 1, r: 0 },
    C: { h: 2, d: 2, r: 0 },
    D: { h: 3, d: 2, r: 1 }
  }[band] || { h: 1, d: 1, r: 0 };

  if (templateId === "late_discriminating_clue") {
    return { ...base, r: 1 };
  }
  if (templateId === "broken_dependency_missing_prerequisite") {
    return { ...base, d: Math.max(base.d, 2) };
  }
  return base;
}

function makeNextCheckMetrics(templateId, band) {
  const base = {
    A: { h: 2, d: 1, r: 0, q: 1 },
    B: { h: 2, d: 2, r: 0, q: 2 },
    C: { h: 3, d: 2, r: 1, q: 3 }
  }[band] || { h: 2, d: 1, r: 0, q: 1 };

  if (templateId === "shared_downstream_symptom_vs_upstream_check") {
    return { ...base, d: Math.max(base.d, 2), q: Math.max(base.q, 2) };
  }
  if (templateId === "tempting_low_value_vs_high_value_probe") {
    return { ...base, h: Math.max(base.h, 3) };
  }
  return base;
}

function clueSetForExplanation(templateId, clueBits, band) {
  if (templateId === "visible_symptom_vs_underlying_cause") {
    if (band === "A") {
      return [clueBits.symptom, clueBits.upstreamIndicator];
    }
    if (band === "B") {
      return [clueBits.symptom, clueBits.spread, clueBits.upstreamIndicator];
    }
    return [clueBits.symptom, clueBits.spread, clueBits.dependencyGap, clueBits.negativeEvidence];
  }

  if (templateId === "shared_source_vs_local_fault") {
    if (band === "A") {
      return [clueBits.symptom, clueBits.spread];
    }
    if (band === "B") {
      return [clueBits.symptom, clueBits.spread, clueBits.negativeEvidence];
    }
    return [clueBits.symptom, clueBits.spread, clueBits.negativeEvidence, clueBits.upstreamIndicator];
  }

  if (templateId === "broken_dependency_missing_prerequisite") {
    return [clueBits.symptom, clueBits.dependencyGap, clueBits.upstreamIndicator, clueBits.negativeEvidence].filter(Boolean);
  }

  return [clueBits.symptom, clueBits.localCheck, clueBits.lateDiscriminator, clueBits.upstreamIndicator].filter(Boolean);
}

function candidateSetForNextCheck(templateId, explanations, band) {
  if (band === "A") {
    return [explanations.correct, explanations.localLure];
  }
  if (templateId === "tempting_low_value_vs_high_value_probe" || band === "C") {
    return [explanations.correct, explanations.localLure, explanations.partialLure];
  }
  return [explanations.correct, explanations.partialLure, explanations.localLure];
}

function clueSetForNextCheck(templateId, clueBits, band) {
  if (band === "A") {
    return [clueBits.symptom, clueBits.spread];
  }
  if (templateId === "shared_downstream_symptom_vs_upstream_check") {
    return [clueBits.symptom, clueBits.spread, clueBits.dependencyGap];
  }
  return [clueBits.symptom, clueBits.spread, clueBits.negativeEvidence || clueBits.timingCue].filter(Boolean);
}

function optionTextsForExplanation(explanations, band) {
  const values = [explanations.correct, explanations.localLure];
  if (band !== "A") {
    values.push(explanations.partialLure);
  }
  if (band === "D") {
    values.push(explanations.broadLure);
  }
  return values;
}

function optionPackForNextCheck(checks, band) {
  const values = [checks.correct, checks.local, checks.broad];
  if (band === "C") {
    values.push(checks.redundant);
  }
  return values;
}

function shuffleOptions(optionTexts, correctText, itemIndex, seed) {
  const rand = mulberry32(seed);
  const values = shuffleList(optionTexts, rand);
  return values.map((text, optionIndex) => ({
    id: createOptionId(itemIndex, optionIndex),
    text,
    isCorrect: text === correctText
  }));
}

function buildExplanationItem(templateId, scenario, surface, band, pab, itemIndex, seed, wrapperType) {
  const metrics = makeExplanationMetrics(templateId, band);
  const clues = clueSetForExplanation(templateId, surface.clueBits, band);
  const optionTexts = optionTextsForExplanation(surface.explanations, band);
  const options = shuffleOptions(optionTexts, surface.explanations.correct, itemIndex, seed);
  const correctOption = options.find((option) => option.isCorrect);
  const lateIndex = clues.findIndex((clue) => clue === surface.clueBits.lateDiscriminator || clue === surface.clueBits.upstreamIndicator);
  const errorTagByOption = {};

  options.forEach((option) => {
    if (option.text === surface.explanations.correct) {
      errorTagByOption[option.id] = "none";
    } else if (option.text === surface.explanations.localLure) {
      errorTagByOption[option.id] = templateId === "late_discriminating_clue" ? "frame_shift_failure" : "surface_symptom_capture";
    } else if (option.text === surface.explanations.partialLure) {
      errorTagByOption[option.id] = "integration_failure";
    } else {
      errorTagByOption[option.id] = "upstream_dependency_miss";
    }
  });

  return {
    id: `${REASONING_MODE_IDS.BEST_EXPLANATION}_${templateId}_${scenario.id}_${itemIndex + 1}`,
    familyId: "probe",
    modeId: REASONING_MODE_IDS.BEST_EXPLANATION,
    wrapperType,
    difficultyBand: band,
    pab,
    h: metrics.h,
    d: metrics.d,
    r: metrics.r,
    q: 0,
    templateId,
    ontologyId: surface.ontologyId || null,
    optionCount: options.length,
    discriminatingCluePosition: lateIndex >= 0 ? lateIndex + 1 : clues.length,
    title: surface.title,
    prompt: "Which explanation best fits the pattern?",
    rules: surface.rules || [],
    clues,
    options: options.map(({ id, text }) => ({ id, text })),
    correctOptionId: correctOption?.id || options[0]?.id,
    feedbackText:
      templateId === "late_discriminating_clue"
        ? `The later clue shifts the balance toward ${surface.explanations.correct}`
        : `${surface.explanations.correct} is the best global fit across the full clue set.`,
    errorTagByOption,
    modeAccent: "Best explanation"
  };
}

function buildNextCheckItem(templateId, scenario, surface, band, pab, itemIndex, seed, wrapperType) {
  const metrics = makeNextCheckMetrics(templateId, band);
  const clues = clueSetForNextCheck(templateId, surface.clueBits, band);
  const candidates = candidateSetForNextCheck(templateId, surface.explanations, band);
  const optionTexts = optionPackForNextCheck(surface.checks, band);
  const options = shuffleOptions(optionTexts, surface.checks.correct, itemIndex, seed);
  const correctOption = options.find((option) => option.isCorrect);
  const errorTagByOption = {};

  options.forEach((option) => {
    if (option.text === surface.checks.correct) {
      errorTagByOption[option.id] = "none";
    } else if (option.text === surface.checks.local) {
      errorTagByOption[option.id] = "local_probe_capture";
    } else if (option.text === surface.checks.broad) {
      errorTagByOption[option.id] = "broad_probe_choice";
    } else {
      errorTagByOption[option.id] = "redundant_probe_choice";
    }
  });

  return {
    id: `${REASONING_MODE_IDS.BEST_NEXT_CHECK}_${templateId}_${scenario.id}_${itemIndex + 1}`,
    familyId: "probe",
    modeId: REASONING_MODE_IDS.BEST_NEXT_CHECK,
    wrapperType,
    difficultyBand: band,
    pab,
    h: metrics.h,
    d: metrics.d,
    r: metrics.r,
    q: metrics.q,
    templateId,
    ontologyId: surface.ontologyId || null,
    optionCount: options.length,
    discriminatingCluePosition: clues.length,
    title: surface.title,
    prompt: "Which next check would best separate the explanations?",
    rules: surface.rules || [],
    clues,
    candidateExplanations: candidates,
    options: options.map(({ id, text }) => ({ id, text })),
    correctOptionId: correctOption?.id || options[0]?.id,
    feedbackText: `${surface.checks.correct} is the strongest next check because it cleanly separates the live explanations.`,
    errorTagByOption,
    modeAccent: "Best next check"
  };
}

function buildItem(modeId, templateId, scenario, band, pab, wrapperType, itemIndex, roundId) {
  const surface = wrapperType === "micro_world" ? scenario.microWorld : scenario.realWorld;
  const seed = hashString(`${roundId}:${modeId}:${templateId}:${scenario.id}:${wrapperType}:${band}:${itemIndex}`);
  if (modeId === REASONING_MODE_IDS.BEST_EXPLANATION) {
    return {
      ...buildExplanationItem(templateId, scenario, surface, band, pab, itemIndex, seed, wrapperType),
      itemSeed: seed
    };
  }
  return {
    ...buildNextCheckItem(templateId, scenario, surface, band, pab, itemIndex, seed, wrapperType),
    itemSeed: seed
  };
}

function summaryProcessProfile(modeId, responses) {
  if (!responses.length) {
    return null;
  }

  if (modeId === REASONING_MODE_IDS.BEST_EXPLANATION) {
    const lureFailures = responses.filter((entry) => entry.error_type === "surface_symptom_capture").length;
    const revisionFailures = responses.filter((entry) => entry.error_type === "frame_shift_failure").length;
    const integrationFailures = responses.filter((entry) => entry.error_type === "integration_failure").length;
    const upstreamMisses = responses.filter((entry) => entry.error_type === "upstream_dependency_miss").length;
    const total = responses.length;
    return {
      lureResistance: Math.max(0, Math.round(((total - lureFailures) / total) * 100)),
      modelRevision: Math.max(0, Math.round(((total - revisionFailures) / total) * 100)),
      patternHolding: Math.max(0, Math.round(((total - integrationFailures) / total) * 100)),
      upstreamReasoning: Math.max(0, Math.round(((total - upstreamMisses) / total) * 100))
    };
  }

  const total = responses.length;
  const correct = responses.filter((entry) => entry.is_correct).length;
  const broadFailures = responses.filter((entry) => entry.error_type === "broad_probe_choice").length;
  const localFailures = responses.filter((entry) => entry.error_type === "local_probe_capture").length;
  const redundantFailures = responses.filter((entry) => entry.error_type === "redundant_probe_choice").length;
  const sharpCorrect = responses.filter((entry) => entry.is_correct && entry.q >= 2).length;
  const sharpPool = responses.filter((entry) => entry.q >= 2).length || 1;
  return {
    probeChoice: Math.round((correct / total) * 100),
    diagnosticSharpness: Math.round((sharpCorrect / sharpPool) * 100),
    upstreamChecking: Math.max(0, Math.round(((total - localFailures) / total) * 100)),
    modelSeparatingJudgement: Math.max(0, Math.round(((total - broadFailures - redundantFailures) / total) * 100))
  };
}

function deriveRecommendation(state) {
  const unlocked = state.unlockedNodeIds.includes(REASONING_NODE_IDS.probe_best_next_check);
  const nextCheckRounds = state.summaryByMode?.[REASONING_MODE_IDS.BEST_NEXT_CHECK]?.roundsCompleted || 0;
  if (unlocked && nextCheckRounds === 0) {
    return {
      recommendedFamilyId: "probe",
      recommendedModeId: REASONING_MODE_IDS.BEST_NEXT_CHECK
    };
  }
  return {
    recommendedFamilyId: null,
    recommendedModeId: null
  };
}

export function getModePabWindow(modeId, band) {
  return bandWindow(modeId, band);
}

export function getNextTargetRelationLoad(modeId, band) {
  return nextTargetWindow(modeId, band);
}

export function getModeBandOrder(modeId) {
  return bandOrder(modeId);
}

export function modeLabel(modeId) {
  return getReasoningModeNode(modeId)?.label || "Reasoning";
}

export function buildReasoningNodeStates(state) {
  const recommended = deriveRecommendation(state);
  return getReasoningFamilies().flatMap((family) => family.modes.map((mode) => {
    const unlocked = state.unlockedNodeIds.includes(mode.id);
    const selectedModeState = state.perMode[mode.modeId] || null;
    const status = unlocked ? "ready" : "locked";
    let detail = mode.overview;

    if (mode.id === REASONING_NODE_IDS.probe_best_next_check && !unlocked) {
      detail = "Unlock after 2 consecutive completed Best Explanation Band B rounds at 75% or better.";
    } else if (mode.id === REASONING_NODE_IDS.probe_update_model) {
      detail = "Visible in the Probe rail, but intentionally locked in v1.";
    } else if (!unlocked) {
      detail = "Visible in the mission tree, but not playable in this first Reasoning release.";
    } else if (selectedModeState) {
      detail = `${mode.overview} Current relation load: ${selectedModeState.currentPabWindow.label}.`;
    }

    return {
      ...mode,
      available: unlocked,
      status,
      detail,
      recommended: recommended.recommendedModeId === mode.modeId,
      highestStablePab: selectedModeState?.highestStablePab || 0,
      creditScore: selectedModeState?.creditScore || 0
    };
  }));
}

export function createReasoningRound(state, modeId, launcherMode) {
  const modeState = state.perMode[modeId];
  const band = modeState.currentBand;
  const roundId = `${modeId}_${Date.now()}_${Math.round(Math.random() * 10000)}`;
  const sessionId = `${roundId}_session`;
  const seed = hashString(`${roundId}:${modeId}:${band}:${state.roundHistory.length}`);
  const rand = mulberry32(seed);
  const wrappers = shuffleList(wrapperSlots(modeState, band), rand);
  const scenarios = shuffleList(
    probeScenarioBundles.filter((scenario) => templatePool(modeId, band).some((templateId) => scenario.templateBias.includes(templateId) || templatePool(modeId, band).includes(templateId))),
    rand
  );
  const templates = shuffleList(templatePool(modeId, band), rand);
  const items = wrappers.map((wrapperType, itemIndex) => {
    const scenario = scenarios[itemIndex % scenarios.length];
    const templateId = templates[itemIndex % templates.length];
    const pab = pabForItem(modeId, band, itemIndex, rand);
    return buildItem(modeId, templateId, scenario, band, pab, wrapperType, itemIndex, roundId);
  });
  const roundWrapperMix = wrappers.includes("micro_world") ? "mixed_real_world_and_micro_world" : "real_world_only";

  return {
    roundId,
    sessionId,
    familyId: "probe",
    modeId,
    launcherMode,
    stage: "question",
    itemIndex: 0,
    difficultyBand: band,
    currentPabWindow: bandWindow(modeId, band),
    roundWrapperMix,
    startedAt: Date.now(),
    presentedAt: Date.now(),
    items,
    responses: [],
    roundCredits: 0,
    correctCount: 0,
    summary: null
  };
}

export function scoreRoundResponse(state, round, optionId, responseTimeMs) {
  const item = round.items[round.itemIndex];
  const option = item.options.find((entry) => entry.id === optionId);
  if (!item || !option) {
    return null;
  }

  const isCorrect = option.id === item.correctOptionId;
  const wrapperBonus = item.wrapperType === "micro_world" && state.perMode[item.modeId].wrapperMixUnlocked ? 5 : 0;
  const itemCredits = isCorrect ? (item.pab * 10) + wrapperBonus : 0;
  const priorCredits = state.perMode[item.modeId].creditScore + round.responses.reduce((sum, entry) => sum + entry.itemCredits, 0);
  return {
    game_family: item.familyId,
    game_mode: item.modeId,
    item_id: item.id,
    difficulty_band: item.difficultyBand,
    wrapper_type: item.wrapperType,
    pab: item.pab,
    h: item.h,
    d: item.d,
    r: item.r,
    q: item.q || 0,
    is_correct: isCorrect,
    chosen_option: option.id,
    correct_option: item.correctOptionId,
    response_time_ms: Math.max(250, Math.round(responseTimeMs || 0)),
    error_type: isCorrect ? "none" : item.errorTagByOption[option.id] || "fast_guess_or_timeout",
    timestamp: Date.now(),
    session_id: round.sessionId,
    round_id: round.roundId,
    launcher_mode: round.launcherMode,
    round_wrapper_mix: round.roundWrapperMix,
    template_repeat_count: state.telemetry.filter((entry) => entry.templateId === item.templateId).length,
    templateId: item.templateId,
    ontologyId: item.ontologyId,
    optionCount: item.optionCount,
    discriminatingCluePosition: item.discriminatingCluePosition,
    itemSeed: item.itemSeed,
    itemCredits,
    creditScoreAfterItem: priorCredits + itemCredits
  };
}

export function completeReasoningRound(state, round) {
  const responses = round.responses;
  const modeId = round.modeId;
  const modeState = state.perMode[modeId];
  const correctCount = responses.filter((entry) => entry.is_correct).length;
  const accuracy = responses.length ? correctCount / responses.length : 0;
  const meanRtMs = mean(responses.map((entry) => entry.response_time_ms));
  const itemCredits = responses.reduce((sum, entry) => sum + entry.itemCredits, 0);
  const completionBonus = 10;
  const accuracyBonus = accuracy >= 0.75 ? 20 : accuracy >= 0.6 ? 10 : 0;
  const roundCredits = itemCredits + completionBonus + accuracyBonus;
  const roundMaxPab = responses.reduce((max, entry) => Math.max(max, entry.pab), 0);
  const nextBand = nextBandByPerformance(modeId, modeState.currentBand, accuracy);
  const unlockedNodeIds = [...state.unlockedNodeIds];
  const nextCheckUnlocked = unlockedNodeIds.includes(REASONING_NODE_IDS.probe_best_next_check);

  let bandBUnlockStreak = modeState.streaks.bandBUnlockStreak;
  let wrapperMixBandBStreak = modeState.streaks.wrapperMixBandBStreak;

  if (modeState.currentBand === "B") {
    if (accuracy >= 0.75) {
      bandBUnlockStreak += 1;
      wrapperMixBandBStreak += 1;
    } else {
      bandBUnlockStreak = 0;
      wrapperMixBandBStreak = 0;
    }
  } else {
    bandBUnlockStreak = 0;
    wrapperMixBandBStreak = 0;
  }

  if (
    modeId === REASONING_MODE_IDS.BEST_EXPLANATION
    && bandBUnlockStreak >= 2
    && !nextCheckUnlocked
  ) {
    unlockedNodeIds.push(REASONING_NODE_IDS.probe_best_next_check);
  }

  const wrapperMixUnlocked = modeState.wrapperMixUnlocked || wrapperMixBandBStreak >= 2;
  const highestStablePab = accuracy >= 0.75 ? Math.max(modeState.highestStablePab, roundMaxPab) : modeState.highestStablePab;
  const nextModeState = {
    ...modeState,
    currentBand: nextBand,
    streaks: {
      bandBUnlockStreak,
      wrapperMixBandBStreak
    },
    wrapperMixUnlocked,
    currentPabWindow: bandWindow(modeId, nextBand),
    highestStablePab,
    creditScore: modeState.creditScore + roundCredits,
    highestBandReached: maxBand(modeId, modeState.highestBandReached || modeState.currentBand, round.difficultyBand)
  };

  const processProfile = summaryProcessProfile(modeId, responses);
  const highestStableRelationLoad = formatPabValue(highestStablePab);
  const summary = {
    roundId: round.roundId,
    sessionId: round.sessionId,
    familyId: round.familyId,
    modeId,
    launcherMode: round.launcherMode,
    completedAt: Date.now(),
    difficultyBand: round.difficultyBand,
    highestBandReached: nextModeState.highestBandReached,
    accuracy,
    meanRtMs,
    currentRelationLoad: round.currentPabWindow.label,
    highestStableRelationLoad,
    roundCredits,
    creditScoreAfterRound: nextModeState.creditScore,
    wrapperMix: round.roundWrapperMix,
    processProfile,
    currentPabWindow: round.currentPabWindow,
    highestStablePab,
    nextTargetRelationLoad: nextTargetWindow(modeId, nextBand),
    itemCount: round.items.length
  };

  const telemetry = responses.map((entry) => ({
    ...entry,
    creditScoreAfterRound: nextModeState.creditScore,
    currentPabWindow: round.currentPabWindow.label,
    highestStablePab
  }));

  const recommendation = deriveRecommendation({
    ...state,
    unlockedNodeIds,
    summaryByMode: {
      ...state.summaryByMode,
      [modeId]: {
        ...state.summaryByMode[modeId],
        accuracy,
        meanRtMs,
        lastRoundCredits: roundCredits,
        lastRoundAt: summary.completedAt,
        highestBandReached: nextModeState.highestBandReached,
        currentRelationLoad: round.currentPabWindow.label,
        highestStableRelationLoad,
        processProfile,
        wrapperMix: round.roundWrapperMix,
        roundsCompleted: (state.summaryByMode[modeId]?.roundsCompleted || 0) + 1
      }
    }
  });

  return {
    ...state,
    launcher: {
      ...state.launcher,
      recommendedFamilyId: recommendation.recommendedFamilyId,
      recommendedModeId: recommendation.recommendedModeId
    },
    unlockedNodeIds,
    perMode: {
      ...state.perMode,
      [modeId]: nextModeState
    },
    currentRound: {
      ...round,
      stage: "summary",
      summary
    },
    roundHistory: [...state.roundHistory, summary],
    telemetry: [...state.telemetry, ...telemetry],
    summaryByMode: {
      ...state.summaryByMode,
      [modeId]: {
        accuracy,
        meanRtMs,
        lastRoundCredits: roundCredits,
        lastRoundAt: summary.completedAt,
        highestBandReached: nextModeState.highestBandReached,
        currentRelationLoad: round.currentPabWindow.label,
        highestStableRelationLoad,
        processProfile,
        wrapperMix: round.roundWrapperMix,
        roundsCompleted: (state.summaryByMode[modeId]?.roundsCompleted || 0) + 1
      }
    }
  };
}

function metricRowsForMode(state, modeId) {
  const summary = state.summaryByMode[modeId];
  const profile = summary?.processProfile || {};
  if (modeId === REASONING_MODE_IDS.BEST_EXPLANATION) {
    return [
      { label: PROCESS_LABELS[modeId].lureResistance, value: Number.isFinite(profile.lureResistance) ? `${profile.lureResistance}` : "--" },
      { label: PROCESS_LABELS[modeId].modelRevision, value: Number.isFinite(profile.modelRevision) ? `${profile.modelRevision}` : "--" },
      { label: PROCESS_LABELS[modeId].patternHolding, value: Number.isFinite(profile.patternHolding) ? `${profile.patternHolding}` : "--" },
      { label: PROCESS_LABELS[modeId].upstreamReasoning, value: Number.isFinite(profile.upstreamReasoning) ? `${profile.upstreamReasoning}` : "--" }
    ];
  }
  return [
    { label: PROCESS_LABELS[modeId].probeChoice, value: Number.isFinite(profile.probeChoice) ? `${profile.probeChoice}` : "--" },
    { label: PROCESS_LABELS[modeId].diagnosticSharpness, value: Number.isFinite(profile.diagnosticSharpness) ? `${profile.diagnosticSharpness}` : "--" },
    { label: PROCESS_LABELS[modeId].upstreamChecking, value: Number.isFinite(profile.upstreamChecking) ? `${profile.upstreamChecking}` : "--" },
    { label: PROCESS_LABELS[modeId].modelSeparatingJudgement, value: Number.isFinite(profile.modelSeparatingJudgement) ? `${profile.modelSeparatingJudgement}` : "--" }
  ];
}

export function buildReasoningTelemetryCards(state, selectedNodeId) {
  const nodeStates = buildReasoningNodeStates(state);
  const selectedNode = nodeStates.find((node) => node.id === selectedNodeId)
    || nodeStates.find((node) => node.id === REASONING_NODE_IDS.probe_best_explanation)
    || getReasoningNode(REASONING_NODE_IDS.probe_best_explanation);
  const preferredModeId = state.currentRound?.modeId || selectedNode?.modeId;
  const activeModeId = state.perMode[preferredModeId] ? preferredModeId : REASONING_MODE_IDS.BEST_EXPLANATION;
  const modeState = state.perMode[activeModeId];
  const summary = state.summaryByMode[activeModeId];
  const progressCurrent = state.currentRound ? state.currentRound.itemIndex + (state.currentRound.stage === "summary" ? 6 : 1) : 0;
  const progressTotal = state.currentRound ? state.currentRound.items.length : 6;
  const accuracy = state.currentRound?.responses?.length
    ? state.currentRound.responses.filter((entry) => entry.is_correct).length / state.currentRound.responses.length
    : summary?.accuracy;
  const currentWindow = modeState.currentPabWindow?.label || bandWindow(activeModeId, modeState.currentBand).label;

  return [
    {
      type: "splitMetric",
      label: "Mode status",
      value: state.currentRound ? "Running" : selectedNode.available ? "Ready" : "Locked",
      valueTone: state.currentRound || selectedNode.available ? "accent" : undefined,
      subline: state.currentRound
        ? `${modeLabel(activeModeId)} is live in the centre panel.`
        : selectedNode.detail,
      badge: state.currentRound ? modeLabel(activeModeId) : selectedNode.familyLabel,
      emphasis: true
    },
    {
      type: "ring",
      label: "Round progress",
      ringValue: progressCurrent ? Math.round((progressCurrent / progressTotal) * 100) : 0,
      ringNumber: progressCurrent ? String(progressCurrent) : "--",
      ringLabel: `of ${progressTotal}`,
      subline: state.currentRound
        ? `${modeLabel(activeModeId)} round`
        : `${modeLabel(activeModeId)} launcher`
    },
    {
      type: "list",
      label: "Relation load",
      rows: [
        { label: "Current band", value: modeState.currentBand },
        { label: "Current load", value: currentWindow },
        { label: "Highest stable", value: formatPabValue(modeState.highestStablePab) },
        { label: "Next target", value: nextTargetWindow(activeModeId, modeState.currentBand) }
      ]
    },
    {
      type: "metric",
      label: "Credit score",
      value: `${modeState.creditScore}`,
      valueTone: "credit",
      subline: summary?.lastRoundCredits ? `Last round +${summary.lastRoundCredits}` : "Credits rise with correct higher-load reasoning."
    },
    {
      type: "list",
      label: modeLabel(activeModeId),
      rows: [
        { label: "Accuracy", value: formatPercent(accuracy) },
        { label: "Mean RT", value: Number.isFinite(summary?.meanRtMs) ? `${Math.round(summary.meanRtMs)} ms` : "--" },
        ...metricRowsForMode(state, activeModeId)
      ]
    },
    {
      type: "badge",
      label: "Unlocks and wrappers",
      badge: state.unlockedNodeIds.includes(REASONING_NODE_IDS.probe_best_next_check) ? "Best Next Check unlocked" : "Best Next Check locked",
      badgeState: state.unlockedNodeIds.includes(REASONING_NODE_IDS.probe_best_next_check) ? "ready" : "warning",
      subline: modeState.wrapperMixUnlocked
        ? "Mixed real-world and Lanor Grid rounds are live for this mode."
        : "Mixed wrapper rounds unlock after stable Band B performance in this mode."
    }
  ];
}

