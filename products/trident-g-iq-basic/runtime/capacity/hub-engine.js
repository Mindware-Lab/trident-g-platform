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
export const HUB_WRAPPERS = ["hub_cat", "hub_noncat", "hub_concept", "and_cat", "and_noncat", "resist_vectors", "resist_words", "resist_concept", "emotion_faces", "emotion_words", "relate_vectors"];
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

const RESIST_CARDINAL_ANGLES = [-90, 0, 90, 180];
const RESIST_VECTOR_SYMBOLS = [
  { label: "Up", url: "./assets/capacity/resist/vectors/vector - up.svg" },
  { label: "Right", url: "./assets/capacity/resist/vectors/vector - right.svg" },
  { label: "Down", url: "./assets/capacity/resist/vectors/vector - down.svg" },
  { label: "Left", url: "./assets/capacity/resist/vectors/vector - left.svg" }
];

const RELATE_VECTOR_MARKER_ANGLES = [-90, -45, 0, 45, 90, 135, 180, 225];
const RELATE_VECTOR_ALIGNMENTS = [
  { label: "Vertical", markerIndices: [0, 4], axisDeg: 90 },
  { label: "Diagonal descending", markerIndices: [1, 5], axisDeg: 135 },
  { label: "Horizontal", markerIndices: [2, 6], axisDeg: 180 },
  { label: "Diagonal ascending", markerIndices: [3, 7], axisDeg: 225 }
];
const RELATE_VECTOR_RELATIONS = [
  { key: "toward", label: "Toward" },
  { key: "away", label: "Away" },
  { key: "same", label: "Same direction" },
  { key: "diagonal", label: "Diagonal" }
];

const RESIST_WORD_COLOURS = [
  { label: "Blue", hex: "#3b82f6", textHex: "#ffffff" },
  { label: "Green", hex: "#22c55e", textHex: "#ffffff" },
  { label: "Grey", hex: "#a3a3a3", textHex: "#102033" },
  { label: "Red", hex: "#f97316", textHex: "#ffffff" }
];

const RESIST_WORD_SYMBOLS = ["BLUE", "GREEN", "GREY", "RED"];
const RESIST_CONCEPT_ASSET_VERSION = "v5";

const RESIST_CONCEPT_SYMBOLS = [
  {
    label: "Up",
    variants: [
      `./assets/capacity/resist/concept/eyes - up.png?${RESIST_CONCEPT_ASSET_VERSION}`,
      `./assets/capacity/resist/concept/point - up.png?${RESIST_CONCEPT_ASSET_VERSION}`,
      `./assets/capacity/resist/concept/vector - up.png?${RESIST_CONCEPT_ASSET_VERSION}`
    ]
  },
  {
    label: "Right",
    variants: [
      `./assets/capacity/resist/concept/eyes - right.png?${RESIST_CONCEPT_ASSET_VERSION}`,
      `./assets/capacity/resist/concept/point - right.png?${RESIST_CONCEPT_ASSET_VERSION}`,
      `./assets/capacity/resist/concept/vector - right.png?${RESIST_CONCEPT_ASSET_VERSION}`
    ]
  },
  {
    label: "Down",
    variants: [
      `./assets/capacity/resist/concept/eyes - down.png?${RESIST_CONCEPT_ASSET_VERSION}`,
      `./assets/capacity/resist/concept/point - down.png?${RESIST_CONCEPT_ASSET_VERSION}`,
      `./assets/capacity/resist/concept/vector - down.png?${RESIST_CONCEPT_ASSET_VERSION}`
    ]
  },
  {
    label: "Left",
    variants: [
      `./assets/capacity/resist/concept/eyes - left.png?${RESIST_CONCEPT_ASSET_VERSION}`,
      `./assets/capacity/resist/concept/point - left.png?${RESIST_CONCEPT_ASSET_VERSION}`,
      `./assets/capacity/resist/concept/vector - left.png?${RESIST_CONCEPT_ASSET_VERSION}`
    ]
  }
];

export const HUB_PRELOAD_ASSETS = [
  ...AND_CAT_SYMBOLS.flatMap((entry) => entry.variants),
  ...RESIST_VECTOR_SYMBOLS.map((entry) => entry.url),
  ...RESIST_CONCEPT_SYMBOLS.flatMap((entry) => entry.variants)
];

const EMOTION_FACE_CATEGORIES = [
  { key: "sad", label: "Sad" },
  { key: "angry", label: "Angry" },
  { key: "afraid", label: "Afraid" },
  { key: "happy", label: "Happy" }
];

function emotionFaceVariants(key) {
  return Array.from({ length: 8 }, (_, index) => `./assets/capacity/emotion/faces/${key}/${key}_${index + 1}.png`);
}

const EMOTION_FACE_SYMBOLS = EMOTION_FACE_CATEGORIES.map((category) => ({
  label: category.label,
  variants: emotionFaceVariants(category.key)
}));

HUB_PRELOAD_ASSETS.push(...EMOTION_FACE_SYMBOLS.flatMap((entry) => entry.variants));

const EMOTION_WORD_CATEGORIES = [
  {
    label: "Threat",
    variants: ["THREAT", "ANGER", "RAGE", "FURY", "HOSTILE", "ENRAGED", "IRATE", "FUMING"]
  },
  {
    label: "Sadness",
    variants: ["SADNESS", "SAD", "GRIEF", "SORROW", "MISERY", "GLOOMY", "BROKEN", "UNHAPPY"]
  },
  {
    label: "Happy",
    variants: ["HAPPY", "JOY", "DELIGHT", "CHEERY", "GLAD", "ELATED", "PLEASED", "EXCITED"]
  },
  {
    label: "Neutral",
    variants: ["NEUTRAL", "CALM", "STEADY", "EVEN", "PLAIN", "LEVEL", "STILL", "MILD"]
  }
];

const SYMBOL_POOL = [
  "▲", "△", "▼", "▽", "◆", "◇", "■", "□", "●", "○", "★", "☆",
  "✚", "✖", "✦", "✧", "✳", "✴", "✽", "✶", "✷", "✸",
  "⬟", "⬠", "⬢", "⬣", "⬤", "⬥"
];

const AND_SHAPE_POOL = ["▲", "■", "●", "◆", "✚", "✖", "✶", "✷", "✹", "✳"];

const LURE_RATE = 0.1;

function hslColor(hue, saturation, lightness) {
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function normalizeAngleDeg(value) {
  const normalized = value % 360;
  return normalized < 0 ? normalized + 360 : normalized;
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

function targetModalitiesForWrapper(wrapper) {
  if (wrapper === "and_cat" || wrapper === "and_noncat") {
    return ["conj"];
  }
  if (wrapper === "relate_vectors") {
    return ["rel"];
  }
  if (wrapper === "resist_vectors") {
    return ["loc", "sym"];
  }
  if (wrapper === "resist_words") {
    return ["col", "sym"];
  }
  if (wrapper === "resist_concept") {
    return ["loc", "sym"];
  }
  if (wrapper === "emotion_faces") {
    return ["loc", "sym"];
  }
  if (wrapper === "emotion_words") {
    return ["col", "sym"];
  }
  return HUB_TARGET_MODALITIES;
}

function resolveTargetModalityForWrapper(wrapper, targetModality) {
  const allowed = targetModalitiesForWrapper(wrapper);
  if (allowed.includes(targetModality)) {
    return targetModality;
  }
  return allowed[0];
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

  if (wrapper === "resist_vectors") {
    return {
      locRotationDeg: RESIST_CARDINAL_ANGLES[0],
      radiusPct: HUB_ARENA_RADIUS_PCT,
      markerPositions: RESIST_CARDINAL_ANGLES.map((angleDeg) => markerPositionForAngle(angleDeg, HUB_ARENA_RADIUS_PCT)),
      locationAngles: RESIST_CARDINAL_ANGLES.slice(),
      palette: Array.from({ length: 4 }, () => ({
        label: "Neutral",
        hex: "transparent",
        textHex: "#ffffff"
      })),
      symbolSet: RESIST_VECTOR_SYMBOLS.slice()
    };
  }

  if (wrapper === "resist_words") {
    return {
      locRotationDeg: 0,
      radiusPct: HUB_ARENA_RADIUS_PCT,
      markerPositions: [{ xPct: 50, yPct: 50 }],
      palette: RESIST_WORD_COLOURS.slice(),
      symbolSet: RESIST_WORD_SYMBOLS.slice()
    };
  }

  if (wrapper === "resist_concept") {
    return {
      locRotationDeg: RESIST_CARDINAL_ANGLES[0],
      radiusPct: HUB_ARENA_RADIUS_PCT,
      markerPositions: RESIST_CARDINAL_ANGLES.map((angleDeg) => markerPositionForAngle(angleDeg, HUB_ARENA_RADIUS_PCT)),
      locationAngles: RESIST_CARDINAL_ANGLES.slice(),
      palette: Array.from({ length: 4 }, () => ({
        label: "Neutral",
        hex: "transparent",
        textHex: "#ffffff"
      })),
      symbolSet: RESIST_CONCEPT_SYMBOLS.map((entry) => ({
        label: entry.label,
        variants: entry.variants.slice()
      }))
    };
  }

  if (wrapper === "emotion_faces") {
    return {
      locRotationDeg: RESIST_CARDINAL_ANGLES[0],
      radiusPct: HUB_ARENA_RADIUS_PCT,
      markerPositions: RESIST_CARDINAL_ANGLES.map((angleDeg) => markerPositionForAngle(angleDeg, HUB_ARENA_RADIUS_PCT)),
      palette: Array.from({ length: 4 }, () => ({
        label: "Neutral",
        hex: "transparent",
        textHex: "#ffffff"
      })),
      symbolSet: EMOTION_FACE_SYMBOLS.map((entry) => ({
        label: entry.label,
        variants: entry.variants.slice()
      }))
    };
  }

  if (wrapper === "emotion_words") {
    return {
      locRotationDeg: 0,
      radiusPct: HUB_ARENA_RADIUS_PCT,
      markerPositions: [{ xPct: 50, yPct: 50 }],
      palette: RESIST_WORD_COLOURS.slice(),
      symbolSet: EMOTION_WORD_CATEGORIES.map((entry) => ({
        label: entry.label,
        variants: entry.variants.slice()
      }))
    };
  }

  if (wrapper === "relate_vectors") {
    return {
      locRotationDeg: RELATE_VECTOR_MARKER_ANGLES[0],
      radiusPct: HUB_ARENA_RADIUS_PCT,
      markerPositions: RELATE_VECTOR_MARKER_ANGLES.map((angleDeg) => markerPositionForAngle(angleDeg, HUB_ARENA_RADIUS_PCT)),
      alignments: RELATE_VECTOR_ALIGNMENTS.map((alignment) => ({ ...alignment })),
      relationLabels: RELATE_VECTOR_RELATIONS.map((relation) => relation.label)
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
  if (targetModality === "rel") {
    return "RELATION";
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
  if (targetModality === "rel" || wrapper === "relate_vectors") {
    return "RELATION";
  }
  if (targetModality === "conj") {
    return "COLOUR + SYMBOL";
  }
  if (wrapper === "resist_vectors" && targetModality === "sym") {
    return "DIRECTION";
  }
  if (wrapper === "resist_concept" && targetModality === "sym") {
    return "DIRECTION";
  }
  if (wrapper === "resist_words" && targetModality === "sym") {
    return "WORD";
  }
  if (wrapper === "resist_words" && targetModality === "col") {
    return "INK COLOUR";
  }
  if (wrapper === "emotion_faces" && targetModality === "sym") {
    return "EMOTION";
  }
  if (wrapper === "emotion_words" && targetModality === "sym") {
    return "EMOTION WORD";
  }
  if (wrapper === "emotion_words" && targetModality === "col") {
    return "INK COLOUR";
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
          : wrapper === "resist_vectors"
            ? "resist_vectors"
              : wrapper === "resist_words"
                ? "resist_words"
                : wrapper === "resist_concept"
                  ? "resist_concept"
                  : wrapper === "emotion_faces"
                    ? "emotion_faces"
                    : wrapper === "emotion_words"
                      ? "emotion_words"
                      : wrapper === "relate_vectors"
                        ? "relate_vectors"
          : "hub_cat";
  const plan = {
    blockIndex,
    wrapper: resolvedWrapper,
    n,
    speed,
    targetModality: resolveTargetModalityForWrapper(resolvedWrapper, targetModality)
  };

  if (resolvedWrapper === "hub_noncat" || resolvedWrapper === "hub_concept" || resolvedWrapper === "and_noncat" || resolvedWrapper === "and_cat" || resolvedWrapper === "resist_vectors" || resolvedWrapper === "resist_words" || resolvedWrapper === "resist_concept" || resolvedWrapper === "emotion_faces" || resolvedWrapper === "emotion_words") {
    const seedPrefix = resolvedWrapper === "hub_noncat"
      ? "noncat"
      : resolvedWrapper === "and_noncat"
        ? "and"
        : resolvedWrapper === "and_cat"
          ? "and-cat"
        : resolvedWrapper === "resist_vectors"
          ? "resist-vectors"
        : resolvedWrapper === "resist_words"
          ? "resist-words"
        : resolvedWrapper === "resist_concept"
          ? "resist-concept"
        : resolvedWrapper === "emotion_faces"
          ? "emotion-faces"
        : resolvedWrapper === "emotion_words"
          ? "emotion-words"
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

  if (wrapper === "resist_vectors") {
    return {
      pointPct: renderMapping.markerPositions[locIdx],
      locationLabel: ["Up", "Right", "Down", "Left"][locIdx]
    };
  }

  if (wrapper === "resist_words") {
    return {
      pointPct: { xPct: 50, yPct: 50 },
      locationLabel: null
    };
  }

  if (wrapper === "emotion_words") {
    return {
      pointPct: { xPct: 50, yPct: 50 },
      locationLabel: null
    };
  }

  if (wrapper === "resist_concept") {
    const baseAngleDeg = renderMapping.locationAngles[locIdx];
    const jitterDeg = randomInt(rng, -30, 30);
    return {
      pointPct: markerPositionForAngle(baseAngleDeg + jitterDeg, renderMapping.radiusPct),
      locationLabel: ["Up", "Right", "Down", "Left"][locIdx]
    };
  }

  if (wrapper === "emotion_faces") {
    return {
      pointPct: renderMapping.markerPositions[locIdx],
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

  if (wrapper === "resist_vectors") {
    return {
      colourLabel: "Neutral",
      colourHex: "transparent",
      textHex: "#ffffff"
    };
  }

  if (wrapper === "emotion_faces") {
    return {
      colourLabel: "Neutral",
      colourHex: "transparent",
      textHex: "#ffffff"
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

  if (wrapper === "resist_vectors") {
    const symbol = renderMapping.symbolSet[symIdx];
    return {
      symbolLabel: symbol.label,
      symbolImageUrl: symbol.url,
      symbolSvgPath: null,
      symbolSvgRounded: false,
      symbolFontFamily: null,
      symbolFontWeight: null,
      symbolFontStyle: null
    };
  }

  if (wrapper === "resist_words") {
    return {
      symbolLabel: renderMapping.symbolSet[symIdx],
      symbolImageUrl: null,
      symbolSvgPath: null,
      symbolSvgRounded: false,
      symbolFontFamily: "\"Orbitron\", monospace",
      symbolFontWeight: 900,
      symbolFontStyle: "normal"
    };
  }

  if (wrapper === "resist_concept") {
    const symbol = renderMapping.symbolSet[symIdx];
    const variant = symbol.variants[randomInt(rng, 0, symbol.variants.length - 1)];
    return {
      symbolLabel: symbol.label,
      symbolImageUrl: variant,
      symbolSvgPath: null,
      symbolSvgRounded: false,
      symbolFontFamily: null,
      symbolFontWeight: null,
      symbolFontStyle: null
    };
  }

  if (wrapper === "emotion_faces") {
    const symbol = renderMapping.symbolSet[symIdx];
    const variant = symbol.variants[randomInt(rng, 0, symbol.variants.length - 1)];
    return {
      symbolLabel: symbol.label,
      symbolImageUrl: variant,
      symbolSvgPath: null,
      symbolSvgRounded: false,
      symbolFontFamily: null,
      symbolFontWeight: null,
      symbolFontStyle: null
    };
  }

  if (wrapper === "emotion_words") {
    const symbol = renderMapping.symbolSet[symIdx];
    const variant = symbol.variants[randomInt(rng, 0, symbol.variants.length - 1)];
    return {
      symbolLabel: variant,
      symbolImageUrl: null,
      symbolSvgPath: null,
      symbolSvgRounded: false,
      symbolFontFamily: "\"Orbitron\", monospace",
      symbolFontWeight: 900,
      symbolFontStyle: "normal"
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

function buildRelateVectorDisplay({ relationIdx, alignmentIdx, renderMapping, rng }) {
  const alignment = renderMapping.alignments[alignmentIdx];
  const relation = RELATE_VECTOR_RELATIONS[relationIdx];
  const points = alignment.markerIndices.map((markerIndex) => renderMapping.markerPositions[markerIndex]);
  let arrowAngles = [];

  if (relation.key === "toward") {
    arrowAngles = [
      normalizeAngleDeg(alignment.axisDeg),
      normalizeAngleDeg(alignment.axisDeg + 180)
    ];
  } else if (relation.key === "away") {
    arrowAngles = [
      normalizeAngleDeg(alignment.axisDeg + 180),
      normalizeAngleDeg(alignment.axisDeg)
    ];
  } else if (relation.key === "same") {
    const baseAngle = RELATE_VECTOR_MARKER_ANGLES[randomInt(rng, 0, RELATE_VECTOR_MARKER_ANGLES.length - 1)];
    arrowAngles = [baseAngle, baseAngle];
  } else {
    const diagonalOffset = rng() < 0.5 ? -45 : 45;
    arrowAngles = [
      normalizeAngleDeg(alignment.axisDeg + diagonalOffset),
      normalizeAngleDeg(alignment.axisDeg - diagonalOffset)
    ];
  }

  return {
    pairTokens: points.map((pointPct, index) => ({
      pointPct,
      angleDeg: arrowAngles[index]
    })),
    relationLabel: relation.label,
    alignmentLabel: alignment.label
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
  const wrapperModalities = targetModalitiesForWrapper(wrapper);
  const resolvedTargetModality = resolveTargetModalityForWrapper(wrapper, targetModality);
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

  if (wrapper === "relate_vectors") {
    const relationStream = buildTargetStream(totalTrials, n, matchFlags, rng);
    const alignmentConstraints = Array.from({ length: totalTrials }, () => "free");

    for (let index = n; index < totalTrials; index += 1) {
      if (lureFlags[index]) {
        alignmentConstraints[index] = "match";
      } else if (!matchFlags[index]) {
        alignmentConstraints[index] = "nonmatch";
      }
    }

    const alignmentStream = buildConstrainedStream(totalTrials, n, alignmentConstraints, rng);
    const renderMapping = buildRenderMapping({ wrapper, mappingSeed });
    const trials = [];

    for (let index = 0; index < totalTrials; index += 1) {
      const relationIdx = relationStream[index];
      const alignmentIdx = alignmentStream[index];

      trials.push({
        trialIndex: index,
        relationIdx,
        alignmentIdx,
        isLure: Boolean(lureFlags[index]),
        lureMatchedModality: lureFlags[index] ? "align" : null,
        canonKey: `rel:${relationIdx}`,
        display: buildRelateVectorDisplay({
          relationIdx,
          alignmentIdx,
          renderMapping,
          rng
        })
      });
    }

    return {
      soaMs: HUB_SOA_MS[speed] || HUB_SOA_MS.slow,
      displayMs: Math.round((HUB_SOA_MS[speed] || HUB_SOA_MS.slow) * HUB_DISPLAY_RATIO),
      trials,
      renderMapping
    };
  }

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
  const distractorModalities = wrapperModalities.filter((modality) => modality !== resolvedTargetModality);
  for (let index = n; index < totalTrials; index += 1) {
    if (!lureFlags[index]) {
      continue;
    }
    const matched = distractorModalities.length === 1
      ? distractorModalities[0]
      : (rng() < 0.5 ? distractorModalities[0] : distractorModalities[1]);
    const nonMatched = distractorModalities.length > 1
      ? (matched === distractorModalities[0] ? distractorModalities[1] : distractorModalities[0])
      : null;
    constraints[matched][index] = "match";
    if (nonMatched) {
      constraints[nonMatched][index] = "nonmatch";
    }
    lureMatchedModality[index] = matched;
  }

  const streams = {
    loc: Array.from({ length: totalTrials }, () => 0),
    col: Array.from({ length: totalTrials }, () => 0),
    sym: Array.from({ length: totalTrials }, () => 0)
  };
  wrapperModalities.forEach((modality) => {
    streams[modality] = randomStream(totalTrials, rng);
  });
  streams[resolvedTargetModality] = buildTargetStream(totalTrials, n, matchFlags, rng);
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
    const canonValue = resolvedTargetModality === "loc"
      ? locIdx
      : resolvedTargetModality === "col"
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
      canonKey: `${resolvedTargetModality}:${canonValue}`,
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
