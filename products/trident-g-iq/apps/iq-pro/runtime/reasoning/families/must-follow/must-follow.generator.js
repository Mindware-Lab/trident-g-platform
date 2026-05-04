/**
 * Must Follow V2 semantic generator.
 * Uses closure / entailment over small generated fact sets.
 */
export const MUST_FOLLOW_VERSION = "2.0.0";

export const SEMANTIC_LABELS = ["equivalent", "forced", "consistent", "contradiction", "irrelevant"];
export const PROMPT_TYPES = ["choose_forced", "select_forced", "select_consistent_not_forced"];
export const NEGATION_POLICY = {
  tier1to3: "positive statements only",
  tier4: "simple negated conclusions from positive membership plus exclusion facts",
  tier5: "broader mixed-polarity distractors only; no nested negation in MVP"
};

export const PHONOTACTICS = {
  onsets: ["b", "d", "f", "g", "h", "k", "l", "m", "n", "p", "r", "s", "t", "v", "z", "br", "dr", "gl", "kr", "pl", "tr", "vr"],
  vowels: ["a", "e", "i", "o", "u", "ai", "ea", "io", "oa", "ui"],
  codas: ["", "n", "l", "r", "m", "s", "t", "k"],
  patterns: ["CV", "CVC", "CVV", "CV.CV", "CVC.CV", "CV.CVC"]
};

const ANSWER_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const SUBTYPE_ALIASES = {
  must_follow_tf: "choose_forced",
  best_conclusion_mcq: "choose_forced",
  select_all_must_follow: "select_forced",
  cannot_follow_mcq: "choose_forced"
};

const ORDER_RELATIONS = [
  {
    id: "before_after",
    canonicalRelation: "before",
    inverseRelation: "after",
    directText: (a, b) => `${a} happens before ${b}.`,
    inverseText: (a, b) => `${a} happens after ${b}.`,
    relationNoun: "before/after chain",
    pools: [["Check-in", "Boarding", "Takeoff", "Landing"], ["Warm-up", "Sprint", "Cooldown", "Stretch"], ["Draft review", "Final approval", "Launch", "Audit"]]
  },
  {
    id: "right_left",
    canonicalRelation: "right_of",
    inverseRelation: "left_of",
    directText: (a, b) => `${a} is to the right of ${b}.`,
    inverseText: (a, b) => `${a} is to the left of ${b}.`,
    relationNoun: "left/right chain",
    pools: [["Panel 3", "Panel 2", "Panel 1", "Panel 0"], ["Folder C", "Folder B", "Folder A", "Folder Base"], ["Marker Blue", "Marker Green", "Marker Red", "Marker White"]]
  },
  {
    id: "older_younger",
    canonicalRelation: "older_than",
    inverseRelation: "younger_than",
    directText: (a, b) => `${a} is older than ${b}.`,
    inverseText: (a, b) => `${a} is younger than ${b}.`,
    relationNoun: "older/younger chain",
    pools: [["Martha", "Lewis", "Jonah", "Priya"], ["Elena", "Marcus", "Nora", "Theo"], ["Victor", "Amina", "Iris", "Caleb"]]
  },
  {
    id: "taller_shorter",
    canonicalRelation: "taller_than",
    inverseRelation: "shorter_than",
    directText: (a, b) => `${a} is taller than ${b}.`,
    inverseText: (a, b) => `${a} is shorter than ${b}.`,
    relationNoun: "taller/shorter chain",
    pools: [["Tower A", "Tower B", "Tower C", "Tower D"], ["Mast 7", "Mast 3", "Mast 1", "Mast 0"], ["Cedar tree", "Birch tree", "Elm tree", "Ash tree"]]
  },
  {
    id: "heavier_lighter",
    canonicalRelation: "heavier_than",
    inverseRelation: "lighter_than",
    directText: (a, b) => `${a} is heavier than ${b}.`,
    inverseText: (a, b) => `${a} is lighter than ${b}.`,
    relationNoun: "heavier/lighter chain",
    pools: [["Iron block", "Stone block", "Wood block", "Foam block"], ["Loaded crate", "Half crate", "Empty crate", "Foam tray"], ["Steel tray", "Plastic tray", "Paper tray", "Cork tray"]]
  },
  {
    id: "contains_inside",
    canonicalRelation: "contains",
    inverseRelation: "inside",
    directText: (a, b) => `${a} contains ${b}.`,
    inverseText: (a, b) => `${a} is inside ${b}.`,
    relationNoun: "contains/inside chain",
    pools: [["Archive bin", "Folder A", "File 7", "Note card"], ["Cabinet 1", "Tray 1", "Tube 4", "Valve 2"], ["Panel case", "Circuit card", "Chip tray", "Pin set"]]
  }
];

const REAL_SET_CHAINS = [
  ["cedar samples", "plant samples", "organic items", "lab records"],
  ["archived invoices", "financial records", "audit files", "secure files"],
  ["sealed trays", "labelled trays", "checked trays", "release trays"],
  ["blue tokens", "priority tokens", "tracked tokens", "logged tokens"]
];

const REAL_CONDITIONALS = [
  { entity: "Tray B", from: "sealed", to: "labelled", extra: "inspected" },
  { entity: "Door 4", from: "locked", to: "alarm-ready", extra: "painted" },
  { entity: "Sample K", from: "chilled", to: "logged", extra: "weighed" },
  { entity: "Packet 9", from: "verified", to: "released", extra: "blue" }
];

const REAL_EXCLUSIONS = [
  { entity: "File K", classA: "sealed files", bridge: "restricted files", top: "secure records", classB: "public files", extra: "archived files" },
  { entity: "Record M", classA: "confidential records", bridge: "protected records", top: "secure files", classB: "public records", extra: "reviewed records" },
  { entity: "Token 7", classA: "priority tokens", bridge: "tracked tokens", top: "audit items", classB: "discard tokens", extra: "round tokens" }
];

const NOUN_STEMS = ["Naro", "Sema", "Davin", "Kiro", "Luma", "Pelin", "Tavo", "Zerin", "Mira", "Boren", "Rika", "Velu", "Sorin", "Keda", "Falin", "Jora"];
const CLASS_ROOTS = ["rav", "dax", "lom", "pel", "sor", "vok", "tav", "miv", "zun", "kir"];
const PROPERTY_ROOTS = ["plim", "doren", "satek", "vurin", "mevak", "talin", "lomed", "zarin"];

export function choice(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)];
}

function realiseSyllable(pattern, rng = Math.random) {
  let out = "";
  for (const ch of pattern) {
    if (ch === "C") out += choice(PHONOTACTICS.onsets, rng);
    if (ch === "V") out += choice(PHONOTACTICS.vowels, rng);
  }
  if (!pattern.includes(".") && rng() < 0.6) out += choice(PHONOTACTICS.codas, rng);
  return out;
}

export function generatePronounceableWord(rng = Math.random) {
  const pattern = choice(PHONOTACTICS.patterns, rng);
  const realised = pattern.split(".").map((part) => realiseSyllable(part, rng)).join("");
  return realised.charAt(0).toUpperCase() + realised.slice(1);
}

export function generateEntitySet(count = 6, rng = Math.random) {
  const used = new Set();
  const names = [...NOUN_STEMS].sort(() => rng() - 0.5);
  const out = [];
  while (out.length < count) {
    const name = names[out.length] || generatePronounceableWord(rng);
    if (!used.has(name)) {
      used.add(name);
      out.push(name);
    }
  }
  return out;
}

function generateClassWord(rng = Math.random) {
  return `${choice(CLASS_ROOTS, rng)}${choice(["s", "es"], rng)}`;
}

function generatePropertyWord(rng = Math.random) {
  return choice(PROPERTY_ROOTS, rng);
}

function uniqueWords(count, makeWord, rng = Math.random) {
  const used = new Set();
  const out = [];
  let guard = 0;
  while (out.length < count && guard < count * 20) {
    guard += 1;
    const word = makeWord(rng);
    if (!used.has(word)) {
      used.add(word);
      out.push(word);
    }
  }
  while (out.length < count) {
    const fallback = generatePronounceableWord(rng).toLowerCase();
    if (!used.has(fallback)) {
      used.add(fallback);
      out.push(fallback);
    }
  }
  return out;
}

function entityId(name, index = 0) {
  return `${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "item"}_${index}`;
}

function makeEntity(name, index = 0) {
  return { id: entityId(name, index), name };
}

function normalizeSubtype(value, tier = 1) {
  const aliased = SUBTYPE_ALIASES[value] || value;
  if (aliased === "choose_forced" || aliased === "select_forced" || aliased === "select_consistent_not_forced") return aliased;
  return tier >= 4 ? "select_forced" : "choose_forced";
}

export const normalizeMustFollowSubtype = normalizeSubtype;

function promptTypeFor(tier, subtype = "choose_forced", itemOffset = 0) {
  const normalized = normalizeSubtype(subtype, tier);
  if (normalized === "select_forced" || normalized === "select_consistent_not_forced") return normalized;
  return "choose_forced";
}

function promptCopy(promptType) {
  if (promptType === "select_forced") return "Select all statements that must be true.";
  if (promptType === "select_consistent_not_forced") return "Select all statements that are possible but not guaranteed.";
  return "Choose the statement that must be true.";
}

function correctLabelsForPrompt(promptType, tier = 1) {
  if (promptType === "select_forced") return Number(tier) >= 4 ? new Set(["forced"]) : new Set(["equivalent", "forced"]);
  if (promptType === "select_consistent_not_forced") return new Set(["consistent"]);
  return new Set(["forced"]);
}

function deriveMustFollowProgression(tier, wrapperType = "real_world") {
  const coreStage = Math.max(1, Math.min(5, Math.round(Number(tier) || 1)));
  const wrapperStage = wrapperType === "nonsense" ? "nonsense" : "real_world";
  const internalLevel = (coreStage - 1) * 2 + (wrapperStage === "real_world" ? 1 : 2);
  return { coreStage, wrapperStage, internalLevel };
}

function relationBySemanticName(name) {
  return ORDER_RELATIONS.find((relation) => relation.canonicalRelation === name || relation.inverseRelation === name) || null;
}

export function normalizeMustFollowStatement(statement) {
  const source = statement?.semantic || statement || {};
  const relation = relationBySemanticName(source.relation);
  if (relation) {
    if (source.relation === relation.inverseRelation) {
      return {
        relation: relation.canonicalRelation,
        lhs: source.rhs,
        rhs: source.lhs,
        polarity: source.polarity || "positive"
      };
    }
    return {
      relation: relation.canonicalRelation,
      lhs: source.lhs,
      rhs: source.rhs,
      polarity: source.polarity || "positive"
    };
  }
  if (source.relation === "disjoint_with") {
    const [lhs, rhs] = [source.lhs, source.rhs].sort();
    return { relation: "disjoint_with", lhs, rhs, polarity: source.polarity || "positive" };
  }
  return {
    relation: source.relation || "unknown",
    lhs: source.lhs || null,
    rhs: source.rhs || null,
    polarity: source.polarity || "positive"
  };
}

export const normaliseMustFollowStatement = normalizeMustFollowStatement;

function semanticKey(semantic) {
  const normalized = normalizeMustFollowStatement(semantic);
  return `${normalized.relation}|${normalized.lhs}|${normalized.rhs}|${normalized.polarity || "positive"}`;
}

function statement(text, semantic) {
  return {
    text,
    semantic,
    canonical: normalizeMustFollowStatement(semantic)
  };
}

function orderLexicon(wrapperType, rng = Math.random) {
  if (wrapperType !== "nonsense") return null;
  return { root: generatePropertyWord(rng) };
}

function orderStatement(relation, lhs, rhs, { form = "direct", wrapperType = "real_world", lexicon = null } = {}) {
  const inverse = form === "inverse";
  const text = wrapperType === "nonsense" && lexicon
    ? `${lhs.name} is ${inverse ? "less" : "more"} ${lexicon.root} than ${rhs.name}.`
    : inverse ? relation.inverseText(lhs.name, rhs.name) : relation.directText(lhs.name, rhs.name);
  return statement(text, {
    relation: inverse ? relation.inverseRelation : relation.canonicalRelation,
    lhs: lhs.id,
    rhs: rhs.id,
    polarity: "positive"
  });
}

function equivalentOrderStatement(relation, lhs, rhs, { inverse = false, wrapperType = "real_world", lexicon = null } = {}) {
  return inverse
    ? orderStatement(relation, rhs, lhs, { form: "inverse", wrapperType, lexicon })
    : orderStatement(relation, lhs, rhs, { form: "direct", wrapperType, lexicon });
}

function subsetStatement(lhs, rhs, variant = "all") {
  const text = variant === "every"
    ? `Every ${lhs.label} is a ${rhs.singular}.`
    : `All ${lhs.label} are ${rhs.label}.`;
  return statement(text, { relation: "subset_of", lhs: lhs.id, rhs: rhs.id, polarity: "positive" });
}

function disjointStatement(lhs, rhs) {
  return statement(`No ${lhs.label} are ${rhs.label}.`, { relation: "disjoint_with", lhs: lhs.id, rhs: rhs.id, polarity: "positive" });
}

function classPhrase(cls) {
  if (cls.kind === "property") return cls.singular;
  const article = /^[aeiou]/i.test(String(cls.singular).trim()) ? "an" : "a";
  return `${article} ${cls.singular}`;
}

function memberStatement(entity, cls, polarity = "positive") {
  const text = polarity === "negative" ? `${entity.name} is not ${classPhrase(cls)}.` : `${entity.name} is ${classPhrase(cls)}.`;
  return statement(text, { relation: "member_of", lhs: entity.id, rhs: cls.id, polarity });
}

function conditionalStatement(from, to, subject = "item") {
  return statement(`If an ${subject} is ${from.singular}, it is ${to.singular}.`, { relation: "subset_of", lhs: from.id, rhs: to.id, polarity: "positive" });
}

function unrelatedStatement(a, b) {
  return statement(`${a.name} has the same colour as ${b.name}.`, { relation: "same_colour", lhs: a.id, rhs: b.id, polarity: "positive" });
}

function makeClass(label, index = 0) {
  const clean = String(label).replace(/\.$/, "");
  const singular = clean.endsWith("s") ? clean.slice(0, -1) : clean;
  return { id: entityId(clean, index), label: clean, singular, kind: "class" };
}

function makeProperty(label, index = 0) {
  return { id: entityId(label, index), label, singular: label, kind: "property" };
}

function closureMaps(premises = []) {
  const factMap = new Map();
  const closureMap = new Map();
  premises.forEach((premise) => {
    const canonical = normalizeMustFollowStatement(premise.canonical || premise.semantic || premise);
    factMap.set(semanticKey(canonical), canonical);
    closureMap.set(semanticKey(canonical), canonical);
  });

  let changed = true;
  while (changed) {
    changed = false;
    const rows = [...closureMap.values()];
    const add = (semantic) => {
      const canonical = normalizeMustFollowStatement(semantic);
      const key = semanticKey(canonical);
      if (!closureMap.has(key)) {
        closureMap.set(key, canonical);
        changed = true;
      }
    };

    rows.forEach((left) => {
      rows.forEach((right) => {
        if (left.polarity === "positive" && right.polarity === "positive" && left.relation === right.relation && left.rhs === right.lhs) {
          if (["before", "right_of", "older_than", "taller_than", "heavier_than", "contains", "subset_of"].includes(left.relation)) {
            add({ relation: left.relation, lhs: left.lhs, rhs: right.rhs, polarity: "positive" });
          }
        }
        if (left.relation === "member_of" && left.polarity === "positive" && right.relation === "subset_of" && right.polarity === "positive" && left.rhs === right.lhs) {
          add({ relation: "member_of", lhs: left.lhs, rhs: right.rhs, polarity: "positive" });
        }
        if (left.relation === "member_of" && left.polarity === "positive" && right.relation === "disjoint_with" && right.polarity === "positive") {
          if (left.rhs === right.lhs) add({ relation: "member_of", lhs: left.lhs, rhs: right.rhs, polarity: "negative" });
          if (left.rhs === right.rhs) add({ relation: "member_of", lhs: left.lhs, rhs: right.lhs, polarity: "negative" });
        }
        if (left.relation === "subset_of" && right.relation === "disjoint_with" && left.polarity === "positive" && right.polarity === "positive") {
          if (left.rhs === right.lhs) add({ relation: "disjoint_with", lhs: left.lhs, rhs: right.rhs, polarity: "positive" });
          if (left.rhs === right.rhs) add({ relation: "disjoint_with", lhs: left.lhs, rhs: right.lhs, polarity: "positive" });
        }
      });
    });
  }
  return { factMap, closureMap };
}

export function computeMustFollowClosure(premises = []) {
  return closureMaps(premises);
}

function isAsymmetricRelation(relation) {
  return ["before", "right_of", "older_than", "taller_than", "heavier_than", "contains"].includes(relation);
}

function contradictionKeyFor(semantic) {
  const normalized = normalizeMustFollowStatement(semantic);
  if (normalized.relation === "member_of") {
    return semanticKey({ ...normalized, polarity: normalized.polarity === "negative" ? "positive" : "negative" });
  }
  if (isAsymmetricRelation(normalized.relation)) {
    return semanticKey({ ...normalized, lhs: normalized.rhs, rhs: normalized.lhs });
  }
  if (normalized.relation === "disjoint_with") {
    return semanticKey({ relation: "subset_of", lhs: normalized.lhs, rhs: normalized.rhs, polarity: "positive" });
  }
  return null;
}

export function classifyMustFollowOption(premises = [], option) {
  const semantic = normalizeMustFollowStatement(option?.canonical || option?.semantic || option);
  const { factMap, closureMap } = closureMaps(premises);
  const key = semanticKey(semantic);
  if (factMap.has(key)) return "equivalent";
  if (closureMap.has(key)) return "forced";
  if (semantic.relation === "disjoint_with" && semantic.polarity === "positive") {
    const forwardSubset = semanticKey({ relation: "subset_of", lhs: semantic.lhs, rhs: semantic.rhs, polarity: "positive" });
    const reverseSubset = semanticKey({ relation: "subset_of", lhs: semantic.rhs, rhs: semantic.lhs, polarity: "positive" });
    if (closureMap.has(forwardSubset) || closureMap.has(reverseSubset)) return "contradiction";
  }
  const contradictionKey = contradictionKeyFor(semantic);
  if (contradictionKey && closureMap.has(contradictionKey)) return "contradiction";
  if (semantic.relation === "same_colour" || semantic.relation === "irrelevant") return "irrelevant";
  return "consistent";
}

function optionExplanation(label, text, promptType) {
  const clean = text.replace(/[.?!]\s*$/, "");
  if (label === "forced") return `${clean} must be true because it follows from the facts.`;
  if (label === "equivalent") return `${clean} restates one of the facts, so it must be true.`;
  if (label === "consistent") return `${clean} could be true, but the facts do not prove it.`;
  if (label === "contradiction") return `${clean} conflicts with what the facts force.`;
  return `${clean} is about something these facts do not settle.`;
}

function makeOption(candidate, premises, promptType, explanation = null) {
  const label = classifyMustFollowOption(premises, candidate);
  return {
    id: null,
    text: candidate.text,
    semantic_label: label,
    semantic: candidate.canonical,
    explanation: explanation || optionExplanation(label, candidate.text, promptType)
  };
}

function shuffleOptions(options, rng = Math.random) {
  const copy = options.map((option) => ({ ...option }));
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function assignBalancedIds(options, promptType, itemOffset, rng, tier = 1) {
  const correctLabels = correctLabelsForPrompt(promptType, tier);
  const shuffled = shuffleOptions(options, rng);
  const correctIndexes = shuffled.map((option, index) => (correctLabels.has(option.semantic_label) ? index : -1)).filter((index) => index >= 0);
  if (correctIndexes.length === 1 && shuffled.length) {
    const desiredIndex = itemOffset % shuffled.length;
    const currentIndex = correctIndexes[0];
    [shuffled[currentIndex], shuffled[desiredIndex]] = [shuffled[desiredIndex], shuffled[currentIndex]];
  } else if (shuffled.length) {
    const shift = itemOffset % shuffled.length;
    shuffled.push(...shuffled.splice(0, shift));
  }
  return shuffled.map((option, index) => ({ ...option, id: ANSWER_LETTERS[index] }));
}

function correctAnswerIds(options, promptType, tier = 1) {
  const correctLabels = correctLabelsForPrompt(promptType, tier);
  return options.filter((option) => correctLabels.has(option.semantic_label)).map((option) => option.id);
}

function preFlightCheck(options, promptType, tier = 1) {
  const forced = options.filter((option) => option.semantic_label === "forced");
  const equivalent = options.filter((option) => option.semantic_label === "equivalent");
  const irrelevant = options.filter((option) => option.semantic_label === "irrelevant");
  const correct = options.filter((option) => correctLabelsForPrompt(promptType, tier).has(option.semantic_label));
  const numericTier = Math.max(1, Math.min(5, Math.round(Number(tier) || 1)));
  const ok = promptType === "choose_forced"
    ? forced.length === 1 && correct.length === 1 && correct.every((option) => option.semantic_label === "forced")
    : promptType === "select_forced" && numericTier >= 4
      ? forced.length === 2 && correct.length === 2 && equivalent.length === 0 && irrelevant.length === 0
      : promptType === "select_forced"
        ? correct.length >= 1 && correct.length <= 3 && forced.length >= 1
        : correct.length >= 1;
  return {
    ok,
    forced_count: forced.length,
    equivalent_count: equivalent.length,
    irrelevant_count: irrelevant.length,
    correct_count: correct.length,
    rejects_premise_restatement_for_choose_forced: promptType !== "choose_forced" || correct.every((option) => option.semantic_label === "forced"),
    rejects_premise_restatement_for_select_forced: promptType !== "select_forced" || numericTier < 4 || equivalent.length === 0
  };
}

function complexityFor(tier, promptType, premiseCount) {
  return {
    binding_load: Math.min(5, Math.max(1, premiseCount)),
    uncertainty_level: promptType === "select_forced" ? 3 : tier >= 4 ? 3 : 2,
    control_burden: promptType === "select_forced" ? 3 : Math.min(4, tier)
  };
}

function finaliseItem({ wrapperType, tier, promptType, subtype, targetRelationType, logicalForm, premises, displayPremises = null, candidates, rng, itemOffset, skillTags = [] }) {
  const labelled = candidates.map((candidate) => makeOption(candidate, premises, promptType));
  const unique = [];
  const seen = new Set();
  labelled.forEach((option) => {
    const key = `${option.text}|${option.semantic_label}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(option);
    }
  });
  const withIds = assignBalancedIds(unique.slice(0, 4), promptType, itemOffset, rng, tier);
  const check = preFlightCheck(withIds, promptType, tier);
  if (!check.ok) throw new Error(`Must Follow pre-flight failed for ${promptType}`);
  const correct = correctAnswerIds(withIds, promptType, tier);
  const explanation = withIds.find((option) => correct.includes(option.id))?.explanation || "The correct answer follows from the facts.";
  const complexity = complexityFor(tier, promptType, premises.length);
  const progression = deriveMustFollowProgression(tier, wrapperType);
  return {
    id: `mf_sem_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "must_follow",
    subtype,
    prompt_type: promptType,
    semantic_v2: true,
    wrapper_type: wrapperType,
    wrapper_stage: progression.wrapperStage,
    core_stage: progression.coreStage,
    internal_level: progression.internalLevel,
    difficulty_tier: tier,
    ...complexity,
    logical_form: logicalForm,
    target_relation_type: targetRelationType,
    premise_semantics: premises.map((premise) => premise.canonical),
    premises: displayPremises || premises.map((premise) => premise.text),
    display_premises: displayPremises || premises.map((premise) => premise.text),
    query: promptCopy(promptType),
    prompt_text: promptCopy(promptType),
    answer_type: promptType === "choose_forced" ? "single_choice" : "multi_select",
    options: withIds,
    correct_answer: correct,
    explanation,
    feedback_title: "Check what must follow",
    feedback_text: explanation,
    feedback_correct: explanation,
    feedback_incorrect: explanation,
    feedback_timeout: explanation,
    pre_flight_check: check,
    skill_tags: ["deduction", "closure_reasoning", ...skillTags, wrapperType === "nonsense" ? "nonsense_wrapper" : "real_world_wrapper"]
  };
}

function sequenceForRelation(relation, wrapperType, count, rng) {
  if (wrapperType === "nonsense") {
    return generateEntitySet(count, rng).map((name, index) => makeEntity(name, index));
  }
  const names = [...choice(relation.pools, rng)];
  let index = 1;
  while (names.length < count) {
    const base = relation.relationNoun.split("/")[0].replace(/[^A-Za-z]+/g, "") || "Item";
    names.push(`${base} ${index}`);
    index += 1;
  }
  return names.slice(0, count).map((name, itemIndex) => makeEntity(name, itemIndex));
}

function buildOrderItem({ wrapperType, tier, promptType, rng, itemOffset }) {
  const relation = choice(ORDER_RELATIONS, rng);
  const lexicon = orderLexicon(wrapperType, rng);
  const edgeCount = promptType === "select_forced" ? (tier >= 5 ? 4 : 3) : tier >= 3 ? 3 : 2;
  const length = edgeCount + 1;
  const values = sequenceForRelation(relation, wrapperType, length + 1, rng);
  const premises = Array.from({ length: edgeCount }, (_, index) => (
    index === 1 && tier >= 4
      ? equivalentOrderStatement(relation, values[index], values[index + 1], { wrapperType, lexicon, inverse: itemOffset % 2 === 1 })
      : orderStatement(relation, values[index], values[index + 1], { wrapperType, lexicon })
  ));
  const forced = equivalentOrderStatement(relation, values[0], values[edgeCount], { wrapperType, lexicon, inverse: itemOffset % 2 === 1 });
  const forcedNear = equivalentOrderStatement(relation, values[0], values[2], { wrapperType, lexicon, inverse: itemOffset % 2 === 0 });
  const forcedSecond = equivalentOrderStatement(relation, values[1], values[Math.min(edgeCount, 3)], { wrapperType, lexicon, inverse: itemOffset % 2 === 1 });
  const forcedDeep = equivalentOrderStatement(relation, values[0], values[edgeCount - 1], { wrapperType, lexicon, inverse: itemOffset % 2 === 1 });
  const contradiction = orderStatement(relation, values[edgeCount], values[0], { wrapperType, lexicon });
  const consistent = orderStatement(relation, values[0], values[length], { wrapperType, lexicon });
  const irrelevant = unrelatedStatement(values[0], values[length]);
  const candidates = promptType === "select_forced"
    ? tier >= 5
      ? [forcedDeep, forced, contradiction, consistent]
      : [forcedNear, forcedSecond, contradiction, consistent]
    : [forced, contradiction, consistent, irrelevant];
  return finaliseItem({
    wrapperType,
    tier,
    promptType,
    subtype: promptType,
    targetRelationType: relation.id,
    logicalForm: `${relation.canonicalRelation}_closure`,
    premises,
    candidates,
    rng,
    itemOffset,
    skillTags: ["transitivity", relation.id]
  });
}

function classChain(wrapperType, rng, count = 4) {
  if (wrapperType === "nonsense") {
    return uniqueWords(count, generateClassWord, rng).map((label, index) => makeClass(label, index));
  }
  const labels = [...choice(REAL_SET_CHAINS, rng)];
  while (labels.length < count) labels.push(`derived set ${labels.length + 1}`);
  return labels.slice(0, count).map((label, index) => makeClass(label, index));
}

function buildSetInclusionItem({ wrapperType, tier, promptType, rng, itemOffset }) {
  const [a, b, c, d, e] = classChain(wrapperType, rng, tier >= 5 ? 5 : 4);
  const edgeCount = promptType === "select_forced" ? (tier >= 5 ? 4 : 3) : tier >= 3 ? 3 : 2;
  const chain = [a, b, c, d, e].slice(0, edgeCount + 1);
  const premises = Array.from({ length: edgeCount }, (_, index) => subsetStatement(chain[index], chain[index + 1]));
  const forced = subsetStatement(chain[0], chain[edgeCount]);
  const forcedNear = subsetStatement(chain[0], chain[2]);
  const forcedSecond = subsetStatement(chain[1], chain[Math.min(edgeCount, 3)]);
  const forcedDeep = subsetStatement(chain[0], chain[edgeCount - 1]);
  const consistent = subsetStatement(c, a);
  const contradiction = disjointStatement(chain[0], chain[edgeCount]);
  const irrelevant = statement(`Some ${d.label} are stored in a side room.`, { relation: "irrelevant", lhs: d.id, rhs: "side_room", polarity: "positive" });
  const candidates = promptType === "select_forced"
    ? tier >= 5
      ? [forcedDeep, forced, consistent, contradiction]
      : [forcedNear, forcedSecond, consistent, contradiction]
    : [forced, consistent, contradiction, irrelevant];
  return finaliseItem({
    wrapperType,
    tier,
    promptType,
    subtype: promptType,
    targetRelationType: tier >= 4 ? "set_inclusion" : "subset_chain",
    logicalForm: "subset_closure",
    premises,
    candidates,
    rng,
    itemOffset,
    skillTags: ["set_inclusion", "quantifier_light"]
  });
}

function conditionalPack(wrapperType, rng) {
  if (wrapperType === "nonsense") {
    const [from, to, extra] = uniqueWords(3, generatePropertyWord, rng);
    return {
      entity: makeEntity(generatePronounceableWord(rng), 0),
      from: makeProperty(from, 1),
      to: makeProperty(to, 2),
      extra: makeProperty(extra, 3)
    };
  }
  const picked = choice(REAL_CONDITIONALS, rng);
  return {
    entity: makeEntity(picked.entity, 0),
    from: makeProperty(picked.from, 1),
    to: makeProperty(picked.to, 2),
    extra: makeProperty(picked.extra, 3)
  };
}

function chainedConditionalPack(wrapperType, rng) {
  if (wrapperType === "nonsense") {
    const [from, mid, to, final, extra] = uniqueWords(5, generatePropertyWord, rng);
    return {
      entity: makeEntity(generatePronounceableWord(rng), 0),
      from: makeProperty(from, 1),
      mid: makeProperty(mid, 2),
      to: makeProperty(to, 3),
      final: makeProperty(final, 4),
      extra: makeProperty(extra, 5)
    };
  }
  const picked = choice(REAL_CONDITIONALS, rng);
  return {
    entity: makeEntity(picked.entity, 0),
    from: makeProperty(picked.from, 1),
    mid: makeProperty(picked.to, 2),
    to: makeProperty(picked.extra, 3),
    final: makeProperty("priority", 4),
    extra: makeProperty("reviewed", 5)
  };
}

function buildConditionalItem({ wrapperType, tier, promptType, rng, itemOffset, formOffset = 0 }) {
  if (tier >= 2) {
    const pack = chainedConditionalPack(wrapperType, rng);
    const premises = [
      conditionalStatement(pack.from, pack.mid, "item"),
      conditionalStatement(pack.mid, pack.to, "item"),
      ...(promptType === "select_forced" && tier >= 5 ? [conditionalStatement(pack.to, pack.final, "item")] : []),
      memberStatement(pack.entity, pack.from)
    ];
    const forced = memberStatement(pack.entity, pack.to);
    const forcedNear = memberStatement(pack.entity, pack.mid);
    const forcedDeep = memberStatement(pack.entity, tier >= 5 ? pack.final : pack.to);
    const consistent = memberStatement(makeEntity(`${pack.entity.name} Prime`, 9), pack.from);
    const contradiction = memberStatement(pack.entity, tier >= 5 ? pack.final : pack.to, "negative");
    const candidates = promptType === "select_forced"
      ? tier >= 5
        ? [forced, forcedDeep, consistent, contradiction]
        : [forcedNear, forcedDeep, consistent, contradiction]
      : [forced, consistent, contradiction, memberStatement(pack.entity, pack.extra)];
    return finaliseItem({
      wrapperType,
      tier,
      promptType,
      subtype: promptType,
      targetRelationType: "chained_conditional",
      logicalForm: "conditional_chain_closure",
      premises,
      candidates,
      rng,
      itemOffset,
      skillTags: ["conditional_reasoning", "closure_depth_3", "consistent_not_forced_lure"]
    });
  }
  const pack = conditionalPack(wrapperType, rng);
  const rule = conditionalStatement(pack.from, pack.to, "item");
  const fact = memberStatement(pack.entity, pack.from);
  const premises = [rule, fact];
  const tierOneDisplays = [
    `${pack.entity.name} is ${pack.from.singular}. ${pack.from.singular} items are ${pack.to.singular}.`,
    `Every ${pack.from.singular} item is ${pack.to.singular}. ${pack.entity.name} is ${pack.from.singular}.`,
    `If an item is ${pack.from.singular}, it is ${pack.to.singular}. ${pack.entity.name} is ${pack.from.singular}.`
  ];
  const displayPremises = tier === 1 ? [tierOneDisplays[Math.floor((itemOffset + formOffset) / 3) % tierOneDisplays.length]] : null;
  const forced = memberStatement(pack.entity, pack.to);
  const equivalent = statement(`${pack.entity.name} remains ${pack.from.singular}.`, fact.semantic);
  const consistent = memberStatement(makeEntity(`${pack.entity.name} Prime`, 9), pack.from);
  const contradiction = memberStatement(pack.entity, pack.to, "negative");
  const irrelevant = memberStatement(pack.entity, pack.extra);
  const candidates = promptType === "select_forced"
    ? [forced, equivalent, consistent, contradiction]
    : [forced, consistent, contradiction, irrelevant];
  return finaliseItem({
    wrapperType,
    tier,
    promptType,
    subtype: promptType,
    targetRelationType: "simple_conditional",
    logicalForm: "conditional_modus_ponens",
    premises,
    displayPremises,
    candidates,
    rng,
    itemOffset,
    skillTags: ["conditional_reasoning", "modus_ponens"]
  });
}

function exclusionPack(wrapperType, rng) {
  if (wrapperType === "nonsense") {
    const [classA, classB, extra, bridge, top] = uniqueWords(5, generateClassWord, rng);
    return {
      entity: makeEntity(generatePronounceableWord(rng), 0),
      classA: makeClass(classA, 1),
      classB: makeClass(classB, 2),
      extra: makeClass(extra, 3),
      bridge: makeClass(bridge, 4),
      top: makeClass(top, 5)
    };
  }
  const picked = choice(REAL_EXCLUSIONS, rng);
  return {
    entity: makeEntity(picked.entity, 0),
    classA: makeClass(picked.classA, 1),
    classB: makeClass(picked.classB, 2),
    extra: makeClass(picked.extra, 3),
    bridge: makeClass(picked.bridge || "restricted files", 4),
    top: makeClass(picked.top || "secure records", 5)
  };
}

function buildSetExclusionItem({ wrapperType, tier, promptType, rng, itemOffset }) {
  const pack = exclusionPack(wrapperType, rng);
  const bridge = pack.bridge;
  const top = pack.top;
  const premises = tier >= 5
    ? [subsetStatement(pack.classA, bridge), subsetStatement(bridge, top), disjointStatement(top, pack.classB), memberStatement(pack.entity, pack.classA)]
    : [disjointStatement(pack.classA, pack.classB), memberStatement(pack.entity, pack.classA)];
  if (promptType === "select_forced") {
    const selectPremises = tier >= 5
      ? premises
      : [subsetStatement(pack.classA, bridge), disjointStatement(bridge, pack.classB), memberStatement(pack.entity, pack.classA)];
    const forcedMembership = memberStatement(pack.entity, tier >= 5 ? top : bridge);
    const forcedExclusion = memberStatement(pack.entity, pack.classB, "negative");
    const consistent = memberStatement(pack.entity, pack.extra);
    const contradiction = memberStatement(pack.entity, pack.classB);
    return finaliseItem({
      wrapperType,
      tier,
      promptType,
      subtype: promptType,
      targetRelationType: "set_exclusion",
      logicalForm: "disjoint_membership_closure",
      premises: selectPremises,
      candidates: [forcedMembership, forcedExclusion, consistent, contradiction],
      rng,
      itemOffset,
      skillTags: ["simple_negation", "set_exclusion", tier >= 5 ? "mixed_premise_closure" : "entry_multi_select_closure"]
    });
  }
  const forced = memberStatement(pack.entity, pack.classB, "negative");
  const memberPremise = premises[premises.length - 1];
  const equivalent = statement(`${pack.entity.name} remains ${pack.classA.singular}.`, memberPremise.semantic);
  const consistent = memberStatement(pack.entity, pack.extra);
  const contradiction = memberStatement(pack.entity, pack.classB);
  const irrelevant = statement(`${pack.extra.label} are kept in drawer 4.`, { relation: "irrelevant", lhs: pack.extra.id, rhs: "drawer_4", polarity: "positive" });
  const candidates = promptType === "select_forced"
    ? [forced, equivalent, consistent, contradiction]
    : [forced, consistent, contradiction, irrelevant];
  return finaliseItem({
    wrapperType,
    tier,
    promptType,
    subtype: promptType,
    targetRelationType: "set_exclusion",
    logicalForm: "disjoint_membership_closure",
    premises,
    candidates,
    rng,
    itemOffset,
    skillTags: ["simple_negation", "set_exclusion"]
  });
}

function mustFollowBuildersForTier(tier) {
  if (tier <= 1) return [buildConditionalItem];
  if (tier === 2) return [buildOrderItem, buildSetInclusionItem];
  const earlyBuilders = [buildConditionalItem, buildOrderItem, buildSetInclusionItem];
  if (tier >= 4) return [...earlyBuilders, buildSetExclusionItem];
  return earlyBuilders;
}

function buildMustFollowItem({ wrapperType = "real_world", subtype = "choose_forced", difficultyTier = 1, rng = Math.random, itemOffset = 0, formOffset = 0 } = {}) {
  const tier = Math.max(1, Math.min(5, Math.round(Number(difficultyTier) || 1)));
  const promptType = promptTypeFor(tier, subtype, itemOffset);
  const builders = mustFollowBuildersForTier(tier);
  const builder = builders[(itemOffset + formOffset) % builders.length];
  return builder({ wrapperType, tier, promptType, rng, itemOffset, formOffset });
}

export function generateItems({ wrapperType = "real_world", subtype = "choose_forced", difficultyTier = 1, count = 5, rng = Math.random, startIndex = 0, formOffset = 0 } = {}) {
  const rows = [];
  let attempts = 0;
  while (rows.length < count && attempts < count * 20) {
    attempts += 1;
    try {
      rows.push(buildMustFollowItem({
        wrapperType,
        subtype,
        difficultyTier,
        rng,
        itemOffset: startIndex + rows.length,
        formOffset
      }));
    } catch {
      // Regenerate malformed or ambiguous items before they reach the player.
    }
  }
  if (rows.length < count) throw new Error("Must Follow generator could not produce enough valid items");
  return rows;
}

export function makeBlockPlan(state = {}) {
  const accuracy = state.recent_accuracy ?? 0.8;
  const lateCollapse = state.late_collapse ?? false;
  const wrapperCost = state.recent_wrapper_cost ?? 0.0;
  const tier = Math.max(1, Math.min(5, Math.round(Number(state.current_tier ?? 1) || 1)));
  const focusSubtype = tier >= 4 ? "select_forced" : "choose_forced";
  const next = {
    decision: "HOLD",
    nextTier: tier,
    nextWrapperMode: state.wrapper_mode ?? "real_world",
    nextSpeedMode: state.speed_mode ?? "normal",
    focusSubtype
  };
  if (accuracy >= 0.85 && !lateCollapse) {
    next.decision = "UP";
    if (tier < 5) {
      next.nextTier = Math.min(5, tier + 1);
      next.nextWrapperMode = "real_world";
      next.nextSpeedMode = "normal";
    } else if ((state.wrapper_mode ?? "real_world") === "real_world") next.nextWrapperMode = "mixed";
    else if ((state.speed_mode ?? "normal") === "normal" && wrapperCost < 0.2) next.nextSpeedMode = "fast";
    next.focusSubtype = next.nextTier >= 4 ? "select_forced" : "choose_forced";
  } else if (accuracy < 0.7 || lateCollapse) {
    next.decision = "DOWN";
    next.nextSpeedMode = "normal";
    next.nextWrapperMode = "real_world";
    next.nextTier = Math.max(1, tier - 1);
    next.focusSubtype = next.nextTier >= 4 ? "select_forced" : "choose_forced";
  }
  return next;
}

export function generateAdaptiveBlock(state = {}, rng = Math.random) {
  const plan = makeBlockPlan(state);
  const wrapperMode = state.wrapper_mode || plan.nextWrapperMode || "real_world";
  const tier = plan.nextTier;
  const subtype = normalizeSubtype(state.focusSubtype || plan.focusSubtype, tier);
  const formOffset = Math.floor(rng() * 1000);
  const items = wrapperMode === "mixed"
    ? [
      ...generateItems({ wrapperType: "real_world", subtype, difficultyTier: tier, count: 5, rng, startIndex: 0, formOffset }),
      ...generateItems({ wrapperType: "nonsense", subtype, difficultyTier: tier, count: 5, rng, startIndex: 5, formOffset })
    ]
    : generateItems({ wrapperType: wrapperMode, subtype, difficultyTier: tier, count: 10, rng, formOffset });
  return { family: "must_follow", plan, items };
}
