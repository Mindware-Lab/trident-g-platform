import { createSeededRng, hash32, randomInt } from "./rng.js";
import { computeAccuracy, computeRtStats, countErrorBursts } from "./metrics.js";
import { scheduleBlockTrials, scheduleLureFlags } from "./scheduler.js";

export const HUB_BASE_TRIALS = 20;
export const HUB_N_MAX = 7;
export const HUB_CUE_MS = 1200;
export const HUB_DISPLAY_RATIO = 0.65;
export const HUB_SOA_MS = {
  slow: 3000,
  fast: 1400
};
export const HUB_TARGET_MODALITIES = ["loc", "col", "sym"];
export const HUB_WRAPPERS = ["hub_cat", "hub_noncat", "hub_concept", "and_cat", "and_noncat"];
export const HUB_ARENA_RADIUS_PCT = 42;

const CAT_COLORS = [
  { label: "Red", hex: "#dc2626", textHex: "#ffffff" },
  { label: "Blue", hex: "#2563eb", textHex: "#ffffff" },
  { label: "Grey", hex: "#6b7280", textHex: "#ffffff" },
  { label: "White", hex: "#ffffff", textHex: "#102033" }
];

const CAT_SYMBOLS = ["A", "B", "C", "D"];

const AND_CAT_COLORS = [
  { label: "Red", hex: "#dc2626", textHex: "#ffffff" },
  { label: "Blue", hex: "#2563eb", textHex: "#ffffff" },
  { label: "Green", hex: "#16a34a", textHex: "#ffffff" },
  { label: "Yellow", hex: "#f59e0b", textHex: "#102033" }
];

const AND_CAT_SYMBOLS = [
  {
    label: "Pig",
    variants: Array.from({ length: 10 }, (_, index) => `./assets/capacity/and/pig${index + 1}.png`)
  },
  {
    label: "Dog",
    variants: Array.from({ length: 10 }, (_, index) => `./assets/capacity/and/dog${index + 1}.png`)
  },
  {
    label: "Cat",
    variants: Array.from({ length: 10 }, (_, index) => `./assets/capacity/and/cat${index + 1}.png`)
  },
  {
    label: "Bird",
    variants: Array.from({ length: 10 }, (_, index) => `./assets/capacity/and/bird${index + 1}.png`)
  }
];

const CONCEPT_COLOR_CATEGORIES = [
  {
    label: "Grey",
    variants: [
      { hex: "#4b5563", textHex: "#ffffff" },
      { hex: "#6b7280", textHex: "#ffffff" },
      { hex: "#9ca3af", textHex: "#102033" },
      { hex: "#d1d5db", textHex: "#102033" }
    ]
  },
  {
    label: "Blue",
    variants: [
      { hex: "#1d4ed8", textHex: "#ffffff" },
      { hex: "#2563eb", textHex: "#ffffff" },
      { hex: "#60a5fa", textHex: "#102033" },
      { hex: "#93c5fd", textHex: "#102033" }
    ]
  },
  {
    label: "Green",
    variants: [
      { hex: "#15803d", textHex: "#ffffff" },
      { hex: "#16a34a", textHex: "#ffffff" },
      { hex: "#4ade80", textHex: "#102033" },
      { hex: "#86efac", textHex: "#102033" }
    ]
  },
  {
    label: "Red-orange",
    variants: [
      { hex: "#c2410c", textHex: "#ffffff" },
      { hex: "#ea580c", textHex: "#ffffff" },
      { hex: "#fb923c", textHex: "#102033" },
      { hex: "#fdba74", textHex: "#102033" }
    ]
  }
];

const CONCEPT_LETTER_CATEGORIES = ["A", "E", "M", "R"];

const CONCEPT_FONT_VARIANTS = [
  { fontFamily: "\"Orbitron\", monospace", fontWeight: 900, fontStyle: "normal", letterCase: "upper" },
  { fontFamily: "\"Chakra Petch\", sans-serif", fontWeight: 700, fontStyle: "normal", letterCase: "lower" },
  { fontFamily: "Georgia, serif", fontWeight: 700, fontStyle: "normal", letterCase: "upper" },
  { fontFamily: "\"Trebuchet MS\", sans-serif", fontWeight: 800, fontStyle: "normal", letterCase: "lower" },
  { fontFamily: "\"Courier New\", monospace", fontWeight: 700, fontStyle: "normal", letterCase: "upper" },
  { fontFamily: "\"Times New Roman\", serif", fontWeight: 700, fontStyle: "italic", letterCase: "lower" }
];

const CONCEPT_CARDINAL_ANGLES = [-90, 0, 90, 180];

const SYMBOL_POOL = [
  "@", "#", "$", "%", "&", "*", "+", "=", "?", "!", "X", "O",
  "K", "Q", "R", "Z", "M", "N", "P", "T"
];

const AND_SHAPE_POOL = ["▲", "■", "●", "◆", "✚", "✖", "✶", "✷", "✹", "✳"];

const LURE_RATE = 0.1;

function hslColor(hue, saturation, lightness) {
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function markerPositionForAngle(thetaDeg, radiusPct = HUB_ARENA_RADIUS_PCT) {
  const theta = (thetaDeg * Math.PI) / 180;
  return {
    xPct: 50 + (radiusPct * Math.cos(theta)),
    yPct: 50 + (radiusPct * Math.sin(theta))
  };
}

function markerPositionsForRotation(rotationDeg, radiusPct = HUB_ARENA_RADIUS_PCT) {
  const points = [];
  for (let index = 0; index < 4; index += 1) {
    points.push(markerPositionForAngle(rotationDeg + (index * 90), radiusPct));
  }
  return points;
}

function sampleWithoutReplacement(pool, count, rng) {
  const copy = pool.slice();
  const sampled = [];
  for (let index = 0; index < count && copy.length; index += 1) {
    const randomIndex = randomInt(rng, 0, copy.length - 1);
    sampled.push(copy[randomIndex]);
    copy.splice(randomIndex, 1);
  }
  return sampled;
}

function buildNoncatPalette(mappingSeed) {
  const rng = createSeededRng(mappingSeed ^ 0x9e3779b9);
  const baseHue = Math.floor(rng() * 360);
  const saturation = 64 + Math.floor(rng() * 18);
  const lightness = 46 + Math.floor(rng() * 12);
  const hueOffsets = [0, 40, 180, 220];

  return hueOffsets.map((offset, index) => {
    const hue = (baseHue + offset) % 360;
    const resolvedLightness = Math.max(28, Math.min(76, lightness + (index % 2 === 0 ? -4 : 6)));
    return {
      label: `Hue ${hue}`,
      hex: hslColor(hue, saturation, resolvedLightness),
      textHex: resolvedLightness >= 62 ? "#102033" : "#ffffff"
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
  for (let index = 0; index < totalTrials; index += 1) {
    if (index < n) {
      values[index] = randomInt(rng, 0, 3);
      continue;
    }
    if (matchFlags[index]) {
      values[index] = values[index - n];
      continue;
    }
    values[index] = pickDifferent(values[index - n], rng);
  }
  return values;
}

function randomStream(totalTrials, rng) {
  return Array.from({ length: totalTrials }, () => randomInt(rng, 0, 3));
}

function buildConstrainedStream(totalTrials, n, constraints, rng) {
  const values = Array.from({ length: totalTrials }, () => 0);
  for (let index = 0; index < totalTrials; index += 1) {
    if (index < n) {
      values[index] = randomInt(rng, 0, 3);
      continue;
    }

    const rule = constraints[index];
    if (rule === "match") {
      values[index] = values[index - n];
      continue;
    }
    if (rule === "nonmatch") {
      values[index] = pickDifferent(values[index - n], rng);
      continue;
    }
    values[index] = randomInt(rng, 0, 3);
  }
  return values;
}

function normaliseShapePoints(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  points.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  const scale = 2 / Math.max(width, height);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return points.map((point) => ({
    x: (point.x - centerX) * scale,
    y: (point.y - centerY) * scale
  }));
}

function makeShape(seed, opts = {}) {
  const {
    minPoints = 5,
    maxPoints = 9,
    radialJitter = 0.28,
    angleJitter = 0.18,
    concaveChance = 0.45,
    concaveDepth = [0.22, 0.48],
    mode = "mixed"
  } = opts;

  const rng = createSeededRng(seed);
  const type = mode === "mixed"
    ? (rng() < 0.3 ? "star" : "polygon")
    : mode === "spiky"
      ? (rng() < 0.7 ? "star" : "polygon")
      : mode;
  const count = minPoints + Math.floor(rng() * (maxPoints - minPoints + 1));
  const step = (Math.PI * 2) / count;
  const start = rng() * Math.PI * 2;
  const points = [];

  for (let index = 0; index < count; index += 1) {
    const angle = start + (index * step) + ((rng() - 0.5) * step * angleJitter);
    let radius = 0.85 + (rng() * radialJitter);
    if (type === "star" && index % 2 === 1) {
      radius *= 0.55 + (rng() * 0.18);
    }
    if (type === "polygon" && rng() < concaveChance) {
      const [minDepth, maxDepth] = concaveDepth;
      radius *= minDepth + (rng() * (maxDepth - minDepth));
    }
    points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
  }

  return {
    type,
    points: normaliseShapePoints(points)
  };
}

function shapeToPath(points) {
  if (!points.length) return "";
  const [first, ...rest] = points;
  const path = [`M ${first.x.toFixed(3)} ${first.y.toFixed(3)}`];
  rest.forEach((point) => {
    path.push(`L ${point.x.toFixed(3)} ${point.y.toFixed(3)}`);
  });
  path.push("Z");
  return path.join(" ");
}

function makeShapeBank(count, seedStart, opts) {
  const bank = [];
  for (let index = 0; index < count; index += 1) {
    const shape = makeShape(seedStart + index, opts);
    bank.push({
      path: shapeToPath(shape.points),
      rounded: shape.type !== "star"
    });
  }
  return bank;
}

function buildConjunctiveStreams(totalTrials, n, matchFlags, lureFlags, rng) {
  const sym = Array.from({ length: totalTrials }, () => 0);
  const col = Array.from({ length: totalTrials }, () => 0);
  const lureMatchedModality = Array.from({ length: totalTrials }, () => null);

  for (let index = 0; index < totalTrials; index += 1) {
    if (index < n) {
      sym[index] = randomInt(rng, 0, 3);
      col[index] = randomInt(rng, 0, 3);
      continue;
    }

    if (matchFlags[index]) {
      sym[index] = sym[index - n];
      col[index] = col[index - n];
      continue;
    }

    if (lureFlags[index]) {
      const matchSym = rng() < 0.5;
      sym[index] = matchSym ? sym[index - n] : pickDifferent(sym[index - n], rng);
      col[index] = matchSym ? pickDifferent(col[index - n], rng) : col[index - n];
      lureMatchedModality[index] = matchSym ? "sym" : "col";
      continue;
    }

    sym[index] = pickDifferent(sym[index - n], rng);
    col[index] = pickDifferent(col[index - n], rng);
  }

  return { sym, col, lureMatchedModality };
}

function buildRenderMapping({ wrapper, mappingSeed }) {
  if (wrapper === "and_cat") {
    const resolvedSeed = Number.isFinite(mappingSeed) ? (mappingSeed >>> 0) : hash32("and_cat_default");
    const rng = createSeededRng(resolvedSeed);
    return {
      locRotationDeg: 0,
      radiusPct: HUB_ARENA_RADIUS_PCT,
      markerPositions: markerPositionsForRotation(0, HUB_ARENA_RADIUS_PCT),
      palette: AND_CAT_COLORS,
      symbolSet: AND_CAT_SYMBOLS.map((category) => ({
        label: category.label,
        variants: sampleWithoutReplacement(category.variants, 4, rng)
      }))
    };
  }

  if (wrapper === "and_noncat") {
    const resolvedSeed = Number.isFinite(mappingSeed) ? (mappingSeed >>> 0) : hash32("and_noncat_default");
    const rng = createSeededRng(resolvedSeed);
    const locRotationDeg = rng() * 360;
    const palette = buildNoncatPalette(resolvedSeed);
    const shapeSeed = hash32(`and-shapes:${resolvedSeed}`);
    const symbolSet = Array.from({ length: 4 }, (_, index) => ({
      label: AND_SHAPE_POOL[index % AND_SHAPE_POOL.length],
      variants: makeShapeBank(8, shapeSeed + (index * 100), {
        minPoints: 5,
        maxPoints: 8,
        mode: "spiky",
        radialJitter: 0.38,
        angleJitter: 0.24,
        concaveChance: 0.7,
        concaveDepth: [0.16, 0.42]
      })
    }));
    return {
      locRotationDeg,
      radiusPct: HUB_ARENA_RADIUS_PCT,
      markerPositions: markerPositionsForRotation(locRotationDeg, HUB_ARENA_RADIUS_PCT),
      palette,
      symbolSet
    };
  }

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

  if (wrapper === "hub_concept") {
    return {
      locRotationDeg: CONCEPT_CARDINAL_ANGLES[0],
      radiusPct: HUB_ARENA_RADIUS_PCT,
      markerPositions: CONCEPT_CARDINAL_ANGLES.map((angleDeg) => markerPositionForAngle(angleDeg, HUB_ARENA_RADIUS_PCT)),
      locationAngles: CONCEPT_CARDINAL_ANGLES.slice(),
      palette: CONCEPT_COLOR_CATEGORIES,
      symbolSet: CONCEPT_LETTER_CATEGORIES.slice(),
      fontVariants: CONCEPT_FONT_VARIANTS.slice()
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
  if (targetModality === "conj") {
    return "COLOUR + SYMBOL";
  }
  if (targetModality === "loc") {
    return "LOCATION";
  }
  if (targetModality === "col") {
    return "COLOUR";
  }
  return "SYMBOL";
}

export function displayHubTargetLabel(targetModality, wrapper) {
  if (targetModality === "conj") {
    return "COLOUR + SYMBOL";
  }
  const base = modalityLabel(targetModality);
  if (wrapper !== "hub_noncat" && targetModality === "sym") {
    return "LETTER";
  }
  return base;
}

export function createHubBlockPlan({
  wrapper,
  blockIndex,
  n,
  speed,
  targetModality,
  mappingSeed
}) {
  const resolvedWrapper = wrapper === "hub_noncat"
    ? "hub_noncat"
    : wrapper === "hub_concept"
      ? "hub_concept"
      : wrapper === "and_cat"
        ? "and_cat"
        : wrapper === "and_noncat"
          ? "and_noncat"
          : "hub_cat";
  const plan = {
    blockIndex,
    wrapper: resolvedWrapper,
    n,
    speed,
    targetModality
  };

  if (resolvedWrapper === "hub_noncat" || resolvedWrapper === "hub_concept" || resolvedWrapper === "and_noncat" || resolvedWrapper === "and_cat") {
    const seedPrefix = resolvedWrapper === "hub_noncat"
      ? "noncat"
      : resolvedWrapper === "and_noncat"
        ? "and"
        : resolvedWrapper === "and_cat"
          ? "and-cat"
        : "concept";
    const resolvedSeed = Number.isFinite(mappingSeed) ? (mappingSeed >>> 0) : hash32(`${seedPrefix}:${blockIndex}:${n}`);
    plan.mappingSeed = resolvedSeed;
  }

  return plan;
}

function resolveDisplayLocation({ wrapper, locIdx, renderMapping, rng }) {
  if (wrapper === "hub_concept") {
    const baseAngleDeg = renderMapping.locationAngles[locIdx];
    const jitterDeg = randomInt(rng, -20, 20);
    return {
      pointPct: markerPositionForAngle(baseAngleDeg + jitterDeg, renderMapping.radiusPct),
      locationLabel: ["Up", "Right", "Down", "Left"][locIdx]
    };
  }

  return {
    pointPct: renderMapping.markerPositions[locIdx],
    locationLabel: null
  };
}

function resolveDisplayColour({ wrapper, colIdx, renderMapping, rng }) {
  if (wrapper === "hub_concept") {
    const category = renderMapping.palette[colIdx];
    const variant = category.variants[randomInt(rng, 0, category.variants.length - 1)];
    return {
      colourLabel: category.label,
      colourHex: variant.hex,
      textHex: variant.textHex
    };
  }

  const colour = renderMapping.palette[colIdx];
  return {
    colourLabel: colour.label,
    colourHex: colour.hex,
    textHex: colour.textHex || "#ffffff"
  };
}

function resolveDisplaySymbol({ wrapper, symIdx, renderMapping, rng }) {
  if (wrapper === "hub_concept") {
    const letter = renderMapping.symbolSet[symIdx];
    const variant = renderMapping.fontVariants[randomInt(rng, 0, renderMapping.fontVariants.length - 1)];
    return {
      symbolLabel: variant.letterCase === "lower" ? letter.toLowerCase() : letter.toUpperCase(),
      symbolFontFamily: variant.fontFamily,
      symbolFontWeight: variant.fontWeight,
      symbolFontStyle: variant.fontStyle
    };
  }

  if (wrapper === "and_cat") {
    const category = renderMapping.symbolSet[symIdx];
    const variant = category.variants[randomInt(rng, 0, category.variants.length - 1)];
    return {
      symbolLabel: category.label,
      symbolImageUrl: variant,
      symbolSvgPath: null,
      symbolSvgRounded: false,
      symbolFontFamily: null,
      symbolFontWeight: null,
      symbolFontStyle: null
    };
  }

  if (wrapper === "and_noncat") {
    const category = renderMapping.symbolSet[symIdx];
    const variant = category.variants[randomInt(rng, 0, category.variants.length - 1)];
    return {
      symbolLabel: category.label,
      symbolImageUrl: null,
      symbolSvgPath: variant.path,
      symbolSvgRounded: variant.rounded,
      symbolFontFamily: null,
      symbolFontWeight: null,
      symbolFontStyle: null
    };
  }

  return {
    symbolLabel: renderMapping.symbolSet[symIdx],
    symbolImageUrl: null,
    symbolSvgPath: null,
    symbolSvgRounded: false,
    symbolFontFamily: null,
    symbolFontWeight: null,
    symbolFontStyle: null
  };
}

export function createHubBlockTrials({
  wrapper,
  n,
  targetModality,
  speed,
  mappingSeed,
  baseTrials = HUB_BASE_TRIALS,
  seed = Date.now()
}) {
  const isAnd = wrapper === "and_cat" || wrapper === "and_noncat";
  const rng = createSeededRng(seed);
  const schedule = scheduleBlockTrials({
    baseTrials,
    n,
    matchRate: 0.3,
    rng
  });
  const totalTrials = schedule.totalTrials;
  const matchFlags = schedule.matchFlags;
  const lureFlags = scheduleLureFlags({
    targetMatchFlags: matchFlags,
    n,
    lureRate: LURE_RATE,
    rng
  });

  if (isAnd) {
    const streams = buildConjunctiveStreams(totalTrials, n, matchFlags, lureFlags, rng);
    const renderMapping = buildRenderMapping({ wrapper, mappingSeed });
    const trials = [];

    for (let index = 0; index < totalTrials; index += 1) {
      const locIdx = randomInt(rng, 0, 3);
      const colIdx = streams.col[index];
      const symIdx = streams.sym[index];
      const locationDisplay = resolveDisplayLocation({ wrapper, locIdx, renderMapping, rng });
      const colourDisplay = resolveDisplayColour({ wrapper, colIdx, renderMapping, rng });
      const symbolDisplay = resolveDisplaySymbol({ wrapper, symIdx, renderMapping, rng });

      trials.push({
        trialIndex: index,
        locIdx,
        colIdx,
        symIdx,
        isLure: Boolean(lureFlags[index]),
        lureMatchedModality: streams.lureMatchedModality[index],
        canonKey: `conj:${symIdx}-${colIdx}`,
        display: {
          pointPct: locationDisplay.pointPct,
          locationLabel: locationDisplay.locationLabel,
          colourLabel: colourDisplay.colourLabel,
          colourHex: colourDisplay.colourHex,
          textHex: colourDisplay.textHex,
          symbolLabel: symbolDisplay.symbolLabel,
          symbolImageUrl: symbolDisplay.symbolImageUrl,
          symbolSvgPath: symbolDisplay.symbolSvgPath,
          symbolSvgRounded: symbolDisplay.symbolSvgRounded,
          symbolFontFamily: symbolDisplay.symbolFontFamily,
          symbolFontWeight: symbolDisplay.symbolFontWeight,
          symbolFontStyle: symbolDisplay.symbolFontStyle
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

  const constraints = {
    loc: Array.from({ length: totalTrials }, () => "free"),
    col: Array.from({ length: totalTrials }, () => "free"),
    sym: Array.from({ length: totalTrials }, () => "free")
  };
  const lureMatchedModality = Array.from({ length: totalTrials }, () => null);
  const distractorModalities = HUB_TARGET_MODALITIES.filter((modality) => modality !== targetModality);
  for (let index = n; index < totalTrials; index += 1) {
    if (!lureFlags[index]) {
      continue;
    }
    const matched = rng() < 0.5 ? distractorModalities[0] : distractorModalities[1];
    const nonMatched = matched === distractorModalities[0] ? distractorModalities[1] : distractorModalities[0];
    constraints[matched][index] = "match";
    constraints[nonMatched][index] = "nonmatch";
    lureMatchedModality[index] = matched;
  }

  const streams = {
    loc: randomStream(totalTrials, rng),
    col: randomStream(totalTrials, rng),
    sym: randomStream(totalTrials, rng)
  };
  streams[targetModality] = buildTargetStream(totalTrials, n, matchFlags, rng);
  for (let index = 0; index < distractorModalities.length; index += 1) {
    const modality = distractorModalities[index];
    streams[modality] = buildConstrainedStream(totalTrials, n, constraints[modality], rng);
  }

  const renderMapping = buildRenderMapping({ wrapper, mappingSeed });
  const trials = [];
  for (let index = 0; index < totalTrials; index += 1) {
    const locIdx = streams.loc[index];
    const colIdx = streams.col[index];
    const symIdx = streams.sym[index];
    const canonValue = targetModality === "loc"
      ? locIdx
      : targetModality === "col"
        ? colIdx
        : symIdx;
    const locationDisplay = resolveDisplayLocation({ wrapper, locIdx, renderMapping, rng });
    const colourDisplay = resolveDisplayColour({ wrapper, colIdx, renderMapping, rng });
    const symbolDisplay = resolveDisplaySymbol({ wrapper, symIdx, renderMapping, rng });

    trials.push({
      trialIndex: index,
      locIdx,
      colIdx,
      symIdx,
      isLure: Boolean(lureFlags[index]),
      lureMatchedModality: lureMatchedModality[index],
      canonKey: `${targetModality}:${canonValue}`,
      display: {
        pointPct: locationDisplay.pointPct,
        locationLabel: locationDisplay.locationLabel,
        colourLabel: colourDisplay.colourLabel,
        colourHex: colourDisplay.colourHex,
        textHex: colourDisplay.textHex,
        symbolLabel: symbolDisplay.symbolLabel,
        symbolImageUrl: symbolDisplay.symbolImageUrl,
        symbolSvgPath: symbolDisplay.symbolSvgPath,
        symbolSvgRounded: symbolDisplay.symbolSvgRounded,
        symbolFontFamily: symbolDisplay.symbolFontFamily,
        symbolFontWeight: symbolDisplay.symbolFontWeight,
        symbolFontStyle: symbolDisplay.symbolFontStyle
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

  for (let index = 0; index < trialOutcomes.length; index += 1) {
    const outcome = trialOutcomes[index];
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

  const accuracy = Number(computeAccuracy({
    hits,
    correctRejections,
    totalTrials: trials.length
  }).toFixed(4));
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
      targetModality: plan.targetModality,
      trials: trials.length,
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
