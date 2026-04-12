function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value, places = 2) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function average(values) {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (!filtered.length) {
    return null;
  }
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

export function computeSgsRawScore(answers, items) {
  if (!Array.isArray(items) || !items.length || !Array.isArray(answers)) {
    return 0;
  }
  let score = 0;
  for (let index = 0; index < items.length; index += 1) {
    if (answers[index] === items[index]?.correctOptionIndex) {
      score += 1;
    }
  }
  return clamp(score, 0, items.length);
}

export function getSgsBand(rawScore, itemCount = 12) {
  const safeRaw = clamp(Math.round(Number(rawScore) || 0), 0, itemCount);
  if (safeRaw <= 3) return "low";
  if (safeRaw <= 7) return "typical";
  if (safeRaw <= 9) return "high";
  return "veryHigh";
}

export function getSgsBandLabel(band) {
  switch (band) {
    case "low":
      return "Lower than typical range";
    case "high":
      return "Higher than typical range";
    case "veryHigh":
      return "Very high range";
    default:
      return "Typical range";
  }
}

export function getSgsBandDescription(band) {
  switch (band) {
    case "low":
      return "This run landed below the typical adult range. Fatigue, stress, and unfamiliarity can matter here, so treat a single low run cautiously.";
    case "high":
      return "This run landed above the broad typical range. Pattern detection and novel-rule tracking looked relatively natural here.";
    case "veryHigh":
      return "This run landed in the very high range. Small raw-score differences are less meaningful at this end of the scale.";
    default:
      return "This run landed in the broad typical range for short abstract reasoning snapshots.";
  }
}

export function computeSgsResult(manifest, answers) {
  const itemCount = manifest?.items?.length || 0;
  const rawScore = computeSgsRawScore(answers, manifest?.items || []);
  const rsIq = clamp(Math.round(100 + 15 * ((rawScore - 5.4) / 1.6)), 40, 160);
  const band = getSgsBand(rawScore, itemCount);
  return {
    mode: "sgs",
    testId: manifest?.id || "sgs",
    label: manifest?.label || "SgS",
    itemCount,
    answers: Array.isArray(answers) ? answers.length : 0,
    rawScore,
    rsIq,
    band,
    bandLabel: getSgsBandLabel(band),
    bandDescription: getSgsBandDescription(band)
  };
}

export function computePsiCoreResult(manifest, answers) {
  const questions = manifest?.questions || [];
  const scored = questions.map((question) => {
    const raw = answers?.[question.id];
    if (!Number.isFinite(raw)) {
      return null;
    }
    return {
      id: question.id,
      factor: question.factor,
      score: question.reverse ? 6 - raw : raw,
      raw
    };
  }).filter(Boolean);

  const focusScore = average(scored.filter((item) => item.factor === "focus").map((item) => item.score));
  const processingScore = average(scored.filter((item) => item.factor === "processing").map((item) => item.score));
  const totalScore = average(scored.map((item) => item.score));
  const appliedGIndex = totalScore === null ? null : Math.round(((totalScore - 1) / 4) * 100);

  return {
    mode: "psi-core",
    testId: manifest?.id || "psi-core",
    label: manifest?.label || "Psi-CBS Core",
    questionCount: questions.length,
    answeredCount: scored.length,
    focusScore: focusScore === null ? null : roundTo(focusScore),
    processingScore: processingScore === null ? null : roundTo(processingScore),
    totalScore: totalScore === null ? null : roundTo(totalScore),
    appliedGIndex
  };
}

export function computePsiAdResult(manifest, answers) {
  const sectionScores = (manifest?.sections || []).map((section) => {
    const itemScores = (section.items || []).map((_, index) => answers?.[`${section.id}_${index}`]).filter(Number.isFinite);
    return {
      id: section.id,
      name: section.name,
      score: itemScores.length ? roundTo(itemScores.reduce((sum, value) => sum + value, 0) / itemScores.length) : null
    };
  });

  const validScores = sectionScores.map((section) => section.score).filter(Number.isFinite);
  const adTotal = validScores.length ? roundTo(validScores.reduce((sum, value) => sum + value, 0) / validScores.length) : null;
  const resilienceIndex = adTotal === null ? null : Math.round(100 - (((adTotal - 1) / 4) * 100));

  return {
    mode: "psi-ad",
    testId: manifest?.id || "psi-ad",
    label: manifest?.label || "Psi-CBS-AD",
    sectionScores,
    adTotal,
    resilienceIndex
  };
}

export function computePsiAiResult(manifest, answers) {
  const pairScores = [];
  for (const section of manifest?.sections || []) {
    for (const pair of section.pairs || []) {
      pairScores.push({
        id: pair.id,
        name: pair.name,
        positive: Number.isFinite(answers?.[`${pair.id}_pos`]) ? answers[`${pair.id}_pos`] : null,
        negative: Number.isFinite(answers?.[`${pair.id}_neg`]) ? answers[`${pair.id}_neg`] : null
      });
    }
  }

  const positiveMean = average(pairScores.map((pair) => pair.positive));
  const negativeMean = average(pairScores.map((pair) => pair.negative));
  const aiIqIndex =
    positiveMean === null || negativeMean === null
      ? null
      : Math.round(clamp(50 + 12.5 * (positiveMean - negativeMean), 0, 100));

  return {
    mode: "psi-ai",
    testId: manifest?.id || "psi-ai",
    label: manifest?.label || "Psi-CBS-AI",
    pairScores,
    positiveMean: positiveMean === null ? null : roundTo(positiveMean),
    negativeMean: negativeMean === null ? null : roundTo(negativeMean),
    aiIqIndex
  };
}

export function computeEdhsResult(manifest, answers) {
  const factorScores = {};
  let totalScore = 0;
  let answeredCount = 0;

  for (const [factorName, questionIds] of Object.entries(manifest?.factors || {})) {
    const factorValues = questionIds
      .map((questionId) => answers?.[questionId]?.score)
      .filter(Number.isFinite);
    factorScores[factorName] = factorValues.length
      ? roundTo(factorValues.reduce((sum, value) => sum + value, 0) / factorValues.length)
      : null;
  }

  for (const answer of Object.values(answers || {})) {
    if (Number.isFinite(answer?.score)) {
      totalScore += answer.score;
      answeredCount += 1;
    }
  }

  const overallScore = answeredCount ? roundTo(totalScore / answeredCount) : null;
  const band =
    overallScore === null
      ? null
      : overallScore <= 2.0
        ? "developing"
        : overallScore <= 3.0
          ? "mixed"
          : "strong";
  const decisionIndex =
    overallScore === null ? null : Math.round(((overallScore - 1) / 3) * 100);

  return {
    mode: "edhs",
    testId: manifest?.id || "edhs",
    label: manifest?.label || "EDHS",
    answeredCount,
    overallScore,
    band,
    decisionIndex,
    factorScores
  };
}

export function computeCrs10Result(manifest, answers) {
  const scored = (manifest?.questions || []).map((question) => {
    const raw = answers?.[question.id];
    if (!Number.isFinite(raw)) {
      return null;
    }
    return question.reverse ? 6 - raw : raw;
  }).filter(Number.isFinite);

  const averageScore = scored.length
    ? roundTo(scored.reduce((sum, value) => sum + value, 0) / scored.length)
    : null;
  const band =
    averageScore === null
      ? null
      : averageScore < 3.0
        ? "lower"
        : averageScore <= 4.3
          ? "typical"
          : "higher";
  const resilienceIndex =
    averageScore === null ? null : Math.round(((averageScore - 1) / 4) * 100);

  return {
    mode: "crs",
    testId: manifest?.id || "crs10",
    label: manifest?.label || "CRS-10",
    answeredCount: scored.length,
    averageScore,
    band,
    resilienceIndex
  };
}
