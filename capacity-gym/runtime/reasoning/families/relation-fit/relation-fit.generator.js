/**
 * Relation Fit semantic generator.
 * Produces concrete real-world or readable nonsense relation items with
 * canonical semantic labels for scoring and explanation.
 */
export const RELATION_FIT_VERSION = "2.0.0";

export const SEMANTIC_LABELS = ["equivalent", "contradiction", "consistent", "forced", "irrelevant"];
export const PROMPT_TYPES = ["same_relation_single", "same_relation_multi", "choose_x", "choose_y", "choose_z", "choose_assignment", "choose_not_enough_information"];
export const NEGATION_POLICY = {
  introducedAtTier: null,
  note: "Relation Fit V2 does not generate negated statements yet; polarity stays positive until a later negation-specific tier is added."
};

export const PHONOTACTICS = {
  onsets: ["b", "d", "f", "g", "h", "k", "l", "m", "n", "p", "r", "s", "t", "v", "z", "br", "dr", "gl", "kr", "pl", "tr", "vr"],
  vowels: ["a", "e", "i", "o", "u", "ai", "ea", "io", "oa", "ui"],
  codas: ["", "n", "l", "r", "m", "s", "t", "k"],
  patterns: ["CV", "CVC", "CVV", "CV.CV", "CVC.CV", "CV.CVC"]
};

const ANSWER_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const SUBTYPE_ALIASES = {
  same_relation_mcq: "same_relation",
  select_all_valid: "same_relation",
  relation_satisfaction: "resolve_slots",
  multi_relation_validation: "resolve_slots",
  consistent_with_facts: "resolve_slots"
};

const RELATIONS = [
  {
    id: "right_left",
    canonicalRelation: "right_of",
    inverseRelation: "left_of",
    directText: (a, b) => `${a} is to the right of ${b}.`,
    inverseText: (a, b) => `${a} is to the left of ${b}.`,
    directNonsenseText: (a, b, lex) => `${a} is to the ${lex.direct} of ${b}.`,
    inverseNonsenseText: (a, b, lex) => `${a} is to the ${lex.inverse} of ${b}.`,
    targetText: (a, b) => `${a} is to the right of ${b}`,
    relationNoun: "left/right pattern",
    pools: [["Panel 2", "Panel 1"], ["Folder B", "Folder A"], ["Tile 4", "Tile 3"], ["Switch Blue", "Switch Green"], ["Beacon 7", "Beacon 3"], ["Marker Blue", "Marker Green"]]
  },
  {
    id: "heavier_lighter",
    canonicalRelation: "heavier_than",
    inverseRelation: "lighter_than",
    directText: (a, b) => `${a} is heavier than ${b}.`,
    inverseText: (a, b) => `${a} is lighter than ${b}.`,
    directNonsenseText: (a, b, lex) => `${a} is ${lex.direct}er than ${b}.`,
    inverseNonsenseText: (a, b, lex) => `${a} is less ${lex.direct} than ${b}.`,
    targetText: (a, b) => `${a} is heavier than ${b}`,
    relationNoun: "heavier/lighter pattern",
    pools: [["Iron block", "Foam block"], ["Loaded crate", "Empty crate"], ["Steel tray", "Plastic tray"], ["Stone sample", "Cork sample"], ["Full tank", "Half tank"], ["Lead disk", "Wood disk"]]
  },
  {
    id: "older_younger",
    canonicalRelation: "older_than",
    inverseRelation: "younger_than",
    directText: (a, b) => `${a} is older than ${b}.`,
    inverseText: (a, b) => `${a} is younger than ${b}.`,
    directNonsenseText: (a, b, lex) => `${a} is ${lex.direct}er than ${b}.`,
    inverseNonsenseText: (a, b, lex) => `${a} is less ${lex.direct} than ${b}.`,
    targetText: (a, b) => `${a} is older than ${b}`,
    relationNoun: "older/younger pattern",
    pools: [["Martha", "Lewis"], ["Jonah", "Priya"], ["Elena", "Marcus"], ["Victor", "Amina"], ["Nora", "Theo"], ["Iris", "Caleb"]]
  },
  {
    id: "taller_shorter",
    canonicalRelation: "taller_than",
    inverseRelation: "shorter_than",
    directText: (a, b) => `${a} is taller than ${b}.`,
    inverseText: (a, b) => `${a} is shorter than ${b}.`,
    directNonsenseText: (a, b, lex) => `${a} is ${lex.direct}er than ${b}.`,
    inverseNonsenseText: (a, b, lex) => `${a} is less ${lex.direct} than ${b}.`,
    targetText: (a, b) => `${a} is taller than ${b}`,
    relationNoun: "taller/shorter pattern",
    pools: [["Tower A", "Tower B"], ["Mast 7", "Mast 3"], ["Cedar tree", "Birch tree"], ["Shelf high", "Shelf low"], ["Column East", "Column West"], ["Frame 1", "Frame 2"]]
  },
  {
    id: "before_after",
    canonicalRelation: "before",
    inverseRelation: "after",
    directText: (a, b) => `${a} happens before ${b}.`,
    inverseText: (a, b) => `${a} happens after ${b}.`,
    directNonsenseText: (a, b, lex) => `${a} happens ${lex.direct}er than ${b}.`,
    inverseNonsenseText: (a, b, lex) => `${a} happens less ${lex.direct} than ${b}.`,
    targetText: (a, b) => `${a} happens before ${b}`,
    relationNoun: "before/after pattern",
    pools: [["Check-in", "Boarding"], ["Warm-up", "Sprint"], ["Draft review", "Final approval"], ["Signal one", "Signal two"], ["Morning scan", "Evening scan"], ["Setup phase", "Launch phase"]]
  },
  {
    id: "north_south",
    canonicalRelation: "north_of",
    inverseRelation: "south_of",
    directText: (a, b) => `${a} is north of ${b}.`,
    inverseText: (a, b) => `${a} is south of ${b}.`,
    directNonsenseText: (a, b, lex) => `${a} is to the ${lex.direct} of ${b}.`,
    inverseNonsenseText: (a, b, lex) => `${a} is to the ${lex.inverse} of ${b}.`,
    targetText: (a, b) => `${a} is north of ${b}`,
    relationNoun: "north/south pattern",
    pools: [["Ridge camp", "Valley camp"], ["Harbor gate", "Market gate"], ["Tower Blue", "Tower Red"], ["Station Blue", "Station Red"], ["Lake point", "River point"], ["Trail Blue", "Trail Green"]]
  },
  {
    id: "contains_inside",
    canonicalRelation: "contains",
    inverseRelation: "inside",
    directText: (a, b) => `${a} contains ${b}.`,
    inverseText: (a, b) => `${a} is inside ${b}.`,
    directNonsenseText: (a, b, lex) => `${a} ${lex.direct}s ${b}.`,
    inverseNonsenseText: (a, b, lex) => `${a} is inside ${b}.`,
    targetText: (a, b) => `${a} contains ${b}`,
    relationNoun: "contains/inside pattern",
    pools: [["Box A", "Box B"], ["Folder A", "File 7"], ["Cabinet 1", "Tray 1"], ["Tube 4", "Valve 2"], ["Panel case", "Circuit card"], ["Archive bin", "Record set"]]
  }
];

const IRRELEVANT_RELATIONS = [
  { text: (a, b) => `${a} has the same color as ${b}.`, relation: "same_color" },
  { text: (a, b) => `${a} uses the same route as ${b}.`, relation: "same_route" },
  { text: (a, b) => `${a} belongs to the same group as ${b}.`, relation: "same_group" }
];

const NOUN_STEMS = ["Naro", "Sema", "Davin", "Kiro", "Luma", "Pelin", "Tavo", "Zerin", "Mira", "Boren", "Rika", "Velu", "Sorin", "Keda", "Falin", "Jora"];
const RELATION_ROOTS = ["blift", "dax", "miv", "lor", "sapr", "vok", "rild", "zan", "nold", "vesh"];
const DIRECTION_PAIRS = [["nef", "sov"], ["zor", "vem"], ["pel", "rud"], ["kim", "tav"]];

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
  const entities = [];
  const seedNames = [...NOUN_STEMS].sort(() => rng() - 0.5);
  while (entities.length < count) {
    const name = seedNames[entities.length] || generatePronounceableWord(rng);
    if (!used.has(name)) {
      used.add(name);
      entities.push(name);
    }
  }
  return entities;
}

export function normalizeRelationSubtype(value, tier = 1) {
  const aliased = SUBTYPE_ALIASES[value] || value;
  if (aliased === "same_relation" || aliased === "resolve_slots") return aliased;
  return tier >= 3 ? "resolve_slots" : "same_relation";
}

function promptTypeFor(tier, subtype, rng = Math.random) {
  const normalizedSubtype = normalizeRelationSubtype(subtype, tier);
  if (normalizedSubtype === "same_relation") {
    return tier <= 1 ? "same_relation_single" : "same_relation_multi";
  }
  return "choose_x";
}

function slotPromptTypeFor(tier, itemOffset = 0) {
  const cycle = tier >= 5 ? ["choose_x", "choose_y", "choose_z", "choose_assignment"] : ["choose_x", "choose_y", "choose_z"];
  return cycle[itemOffset % cycle.length];
}

function promptCopy(promptType) {
  if (promptType === "same_relation_single") return "Select all statements that match the same relation.";
  if (promptType === "same_relation_multi") return "Select all statements that match the same relation.";
  if (promptType === "choose_x") return "Who is X?";
  if (promptType === "choose_y") return "Who is Y?";
  if (promptType === "choose_z") return "Which item belongs in slot Z?";
  if (promptType === "choose_assignment") return "Which full assignment fits the facts?";
  if (promptType === "choose_not_enough_information") return "Is there enough information to solve the slot?";
  return "Choose the best answer.";
}

function correctLabelsForPrompt(promptType) {
  if (promptType === "same_relation_single" || promptType === "same_relation_multi") return new Set(["equivalent"]);
  if (promptType === "choose_x" || promptType === "choose_y" || promptType === "choose_z" || promptType === "choose_assignment" || promptType === "choose_not_enough_information") return new Set(["forced"]);
  return new Set(["forced"]);
}

function relationForId(id) {
  return RELATIONS.find((relation) => relation.id === id || relation.canonicalRelation === id || relation.inverseRelation === id) || RELATIONS[0];
}

function relationForSequenceIndex(index = 0, formOffset = 0) {
  const safeIndex = Math.abs(Math.trunc(Number(index) || 0));
  const safeOffset = Math.abs(Math.trunc(Number(formOffset) || 0));
  return RELATIONS[(safeIndex + safeOffset) % RELATIONS.length];
}

function relationBySemanticName(name) {
  return RELATIONS.find((relation) => relation.canonicalRelation === name || relation.inverseRelation === name) || null;
}

function makeEntity(id, name) {
  return { id, name };
}

function entityId(name, index = 0) {
  return `${String(name).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "item"}_${index}`;
}

function entityPairsFor(relation, wrapperType, count, rng = Math.random) {
  if (wrapperType === "nonsense") {
    const names = generateEntitySet(count * 2 + 2, rng);
    return Array.from({ length: count }, (_, index) => [
      makeEntity(entityId(names[index * 2], index * 2), names[index * 2]),
      makeEntity(entityId(names[index * 2 + 1], index * 2 + 1), names[index * 2 + 1])
    ]);
  }
  const shuffled = [...relation.pools].sort(() => rng() - 0.5);
  return Array.from({ length: count }, (_, index) => {
    const pair = shuffled[index % shuffled.length];
    return [
      makeEntity(entityId(pair[0], index * 2), pair[0]),
      makeEntity(entityId(pair[1], index * 2 + 1), pair[1])
    ];
  });
}

function entitySequenceFor(relation, wrapperType, count, rng = Math.random) {
  if (wrapperType === "nonsense") {
    return generateEntitySet(count, rng).map((name, index) => makeEntity(entityId(name, index), name));
  }
  const names = [];
  const shuffledPairs = [...relation.pools].sort(() => rng() - 0.5);
  shuffledPairs.flat().forEach((name) => {
    if (!names.includes(name)) names.push(name);
  });
  let index = 1;
  while (names.length < count) {
    names.push(`${relation.relationNoun.split("/")[0].replace(/[^A-Za-z]+/g, "") || "Item"} ${index}`);
    index += 1;
  }
  return names.slice(0, count).map((name, itemIndex) => makeEntity(entityId(name, itemIndex), name));
}

function relationLexicon(relation, wrapperType, rng = Math.random) {
  if (wrapperType !== "nonsense") return null;
  if (relation.id === "right_left" || relation.id === "north_south") {
    const [direct, inverse] = choice(DIRECTION_PAIRS, rng);
    return { direct, inverse };
  }
  return { direct: choice(RELATION_ROOTS, rng), inverse: "less" };
}

function clampCoreStage(value) {
  return Math.max(1, Math.min(5, Math.round(Number(value) || 1)));
}

function deriveRelationFitProgression(tier, wrapperType = "real_world") {
  const coreStage = clampCoreStage(tier);
  const wrapperStage = wrapperType === "nonsense" ? "nonsense" : "real_world";
  const internalLevel = (coreStage - 1) * 2 + (wrapperStage === "real_world" ? 1 : 2);
  return { coreStage, wrapperStage, internalLevel };
}

export function normalizeRelationStatement(statement) {
  const source = statement?.semantic || statement || {};
  const relation = relationBySemanticName(source.relation);
  if (!relation) {
    return {
      relation: source.relation || "unknown",
      lhs: source.lhs || null,
      rhs: source.rhs || null,
      polarity: source.polarity || "positive"
    };
  }
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

export const normaliseRelationStatement = normalizeRelationStatement;

function sameSemantic(left, right, { ignoreEntities = false } = {}) {
  const a = normalizeRelationStatement(left);
  const b = normalizeRelationStatement(right);
  if (a.relation !== b.relation || a.polarity !== b.polarity) return false;
  return ignoreEntities || (a.lhs === b.lhs && a.rhs === b.rhs);
}

function statementFor(relation, lhs, rhs, { wrapperType = "real_world", form = "direct", lexicon = null } = {}) {
  const inverse = form === "inverse";
  const text = wrapperType === "nonsense"
    ? inverse
      ? relation.inverseNonsenseText(lhs.name, rhs.name, lexicon)
      : relation.directNonsenseText(lhs.name, rhs.name, lexicon)
    : inverse
      ? relation.inverseText(lhs.name, rhs.name)
      : relation.directText(lhs.name, rhs.name);
  return {
    text,
    semantic: {
      relation: inverse ? relation.inverseRelation : relation.canonicalRelation,
      lhs: lhs.id,
      rhs: rhs.id,
      polarity: "positive"
    },
    canonical: normalizeRelationStatement({
      relation: inverse ? relation.inverseRelation : relation.canonicalRelation,
      lhs: lhs.id,
      rhs: rhs.id,
      polarity: "positive"
    })
  };
}

function restatedStatementFor(relation, lhs, rhs, context) {
  const statement = statementFor(relation, lhs, rhs, context);
  let text = statement.text;
  if (text.includes(" happens ")) {
    text = text.replace(" happens ", " still happens ");
  } else if (text.includes(" contains ")) {
    text = text.replace(" contains ", " still contains ");
  } else if (text.includes(" is inside ")) {
    text = text.replace(" is inside ", " stays inside ");
  } else if (text.includes(" is to the ")) {
    text = text.replace(" is to the ", " remains to the ");
  } else if (text.includes(" is ")) {
    text = text.replace(" is ", " remains ");
  }
  return { ...statement, text };
}

function relationWord(relation, lexicon, direct = true) {
  if (relation.id === "right_left") return direct ? "right" : "left";
  if (relation.id === "north_south") return direct ? "north" : "south";
  if (relation.id === "contains_inside") return direct ? "inside" : "contains";
  if (lexicon?.direct) return direct ? `${lexicon.direct}er` : `less ${lexicon.direct}`;
  if (relation.id === "heavier_lighter") return direct ? "heavier" : "lighter";
  if (relation.id === "older_younger") return direct ? "older" : "younger";
  if (relation.id === "taller_shorter") return direct ? "taller" : "shorter";
  if (relation.id === "before_after") return direct ? "earlier" : "later";
  return direct ? "ahead" : "behind";
}

function paraphrasedStatementFor(relation, lhs, rhs, { wrapperType = "real_world", form = "direct", lexicon = null } = {}) {
  const inverse = form === "inverse";
  const statement = inverse
    ? statementFor(relation, rhs, lhs, { wrapperType, form: "inverse", lexicon })
    : statementFor(relation, lhs, rhs, { wrapperType, form: "direct", lexicon });
  if (wrapperType === "nonsense") {
    if (relation.id === "right_left" || relation.id === "north_south") {
      const word = relationWord(relation, lexicon, !inverse);
      return { ...statement, text: `${inverse ? rhs.name : lhs.name} holds the ${word} side of ${inverse ? lhs.name : rhs.name}.` };
    }
    if (relation.id === "contains_inside") {
      return inverse
        ? { ...statement, text: `${rhs.name} is held inside ${lhs.name}.` }
        : { ...statement, text: `${rhs.name} sits inside ${lhs.name}.` };
    }
    const word = relationWord(relation, lexicon, !inverse);
    return { ...statement, text: `${inverse ? rhs.name : lhs.name} ranks ${word} than ${inverse ? lhs.name : rhs.name}.` };
  }
  if (relation.id === "right_left") {
    return inverse
      ? { ...statement, text: `${rhs.name} sits left of ${lhs.name}.` }
      : { ...statement, text: `${lhs.name} sits right of ${rhs.name}.` };
  }
  if (relation.id === "north_south") {
    return inverse
      ? { ...statement, text: `${rhs.name} lies south of ${lhs.name}.` }
      : { ...statement, text: `${lhs.name} lies north of ${rhs.name}.` };
  }
  if (relation.id === "heavier_lighter") {
    return inverse
      ? { ...statement, text: `${rhs.name} weighs less than ${lhs.name}.` }
      : { ...statement, text: `${lhs.name} outweighs ${rhs.name}.` };
  }
  if (relation.id === "older_younger") {
    return inverse
      ? { ...statement, text: `${rhs.name} is the younger of ${lhs.name} and ${rhs.name}.` }
      : { ...statement, text: `${lhs.name} was born earlier than ${rhs.name}.` };
  }
  if (relation.id === "taller_shorter") {
    return inverse
      ? { ...statement, text: `${rhs.name} is the shorter of ${lhs.name} and ${rhs.name}.` }
      : { ...statement, text: `${lhs.name} stands higher than ${rhs.name}.` };
  }
  if (relation.id === "before_after") {
    return inverse
      ? { ...statement, text: `${rhs.name} comes after ${lhs.name}.` }
      : { ...statement, text: `${lhs.name} occurs earlier than ${rhs.name}.` };
  }
  if (relation.id === "contains_inside") {
    return inverse
      ? { ...statement, text: `${rhs.name} is held inside ${lhs.name}.` }
      : { ...statement, text: `${rhs.name} is held inside ${lhs.name}.` };
  }
  return statement;
}

function equivalentStatement(relation, roleA, roleB, context) {
  return context.form === "inverse"
    ? statementFor(relation, roleB, roleA, { ...context, form: "inverse" })
    : statementFor(relation, roleA, roleB, { ...context, form: "direct" });
}

function contradictionStatement(relation, roleA, roleB, context) {
  return context.form === "inverse"
    ? statementFor(relation, roleA, roleB, { ...context, form: "inverse" })
    : statementFor(relation, roleB, roleA, { ...context, form: "direct" });
}

function irrelevantStatement(relation, roleA, roleB, wrapperType, rng = Math.random) {
  if (wrapperType === "nonsense") {
    const root = choice(RELATION_ROOTS, rng);
    return {
      text: `${roleA.name} is ${root} marked like ${roleB.name}.`,
      semantic: { relation: "irrelevant_mark", lhs: roleA.id, rhs: roleB.id, polarity: "positive" },
      canonical: { relation: "irrelevant_mark", lhs: roleA.id, rhs: roleB.id, polarity: "positive" }
    };
  }
  const picked = choice(IRRELEVANT_RELATIONS, rng);
  return {
    text: picked.text(roleA.name, roleB.name),
    semantic: { relation: picked.relation, lhs: roleA.id, rhs: roleB.id, polarity: "positive" },
    canonical: { relation: picked.relation, lhs: roleA.id, rhs: roleB.id, polarity: "positive" }
  };
}

function closeRelationLureStatement(sourceRelation, wrapperType, rng = Math.random, form = "direct") {
  const candidates = RELATIONS.filter((relation) => relation.id !== sourceRelation.id);
  const relation = choice(candidates, rng);
  const lexicon = relationLexicon(relation, wrapperType, rng);
  const [lhs, rhs] = entityPairsFor(relation, wrapperType, 1, rng)[0];
  return paraphrasedStatementFor(relation, lhs, rhs, { wrapperType, form, lexicon });
}

function contradictionParaphraseFor(relation, lhs, rhs, context) {
  return contradictionStatement(relation, lhs, rhs, context);
}

function optionExplanation(label, statement, target, relation, promptType) {
  const text = statement.text.replace(/[.?!]\s*$/, "");
  const targetText = target.text.replace(/[.?!]\s*$/, "");
  const sameRelationPrompt = promptType === "same_relation_single" || promptType === "same_relation_multi";
  if (label === "equivalent" && sameRelationPrompt) return `${text} says the same thing as ${targetText}.`;
  if (label === "equivalent") return `${text} says the same thing as one of the facts, just in the opposite wording.`;
  if (label === "forced") return `${text} must be true because the facts link together.`;
  if (label === "consistent") return `${text} could be true without breaking any fact, but the facts do not prove it.`;
  if (label === "contradiction" && sameRelationPrompt) return `${text} turns the relationship the other way around.`;
  if (label === "contradiction") return `${text} clashes with the facts.`;
  if (sameRelationPrompt) return `${text} uses a different kind of relationship from the rule.`;
  return `${text} talks about something the facts do not settle.`;
}

function makeOption(label, statement, target, relation, promptType, id = null) {
  return {
    id,
    text: statement.text,
    semantic_label: label,
    semantic: statement.canonical,
    explanation: optionExplanation(label, statement, target, relation, promptType)
  };
}

function makeRoleOption(label, entity, slotName, actualSlotName, explanation) {
  return {
    id: null,
    text: entity.name,
    semantic_label: label,
    semantic: {
      relation: "role_assignment",
      lhs: slotName.toLowerCase(),
      rhs: entity.id,
      polarity: "positive"
    },
    explanation: explanation || `${entity.name} is ${actualSlotName}, not ${slotName}.`
  };
}

function makeAssignmentOption(label, assignmentRows, explanation) {
  return {
    id: null,
    text: assignmentRows.map((row) => `${row.slot}: ${row.entity.name}`).join("; "),
    semantic_label: label,
    semantic: {
      relation: "slot_assignment",
      lhs: "assignment",
      rhs: assignmentRows.map((row) => `${row.slot.toLowerCase()}_${row.entity.id}`).join("__"),
      polarity: "positive"
    },
    explanation
  };
}

function assignIds(options) {
  return options.map((option, index) => ({ ...option, id: ANSWER_LETTERS[index] }));
}

function shuffleOptions(options, rng = Math.random) {
  const copy = options.map((option) => ({ ...option }));
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function balanceOptionOrder(options, promptType, itemOffset = 0, rng = Math.random) {
  const shuffled = shuffleOptions(options, rng);
  const correctLabels = correctLabelsForPrompt(promptType);
  const correctIndexes = shuffled
    .map((option, index) => (correctLabels.has(option.semantic_label) ? index : -1))
    .filter((index) => index >= 0);
  if (correctIndexes.length === 1 && shuffled.length) {
    const desiredIndex = itemOffset % shuffled.length;
    const currentIndex = correctIndexes[0];
    [shuffled[currentIndex], shuffled[desiredIndex]] = [shuffled[desiredIndex], shuffled[currentIndex]];
    return shuffled;
  }
  const shift = shuffled.length ? itemOffset % shuffled.length : 0;
  return shift ? [...shuffled.slice(shift), ...shuffled.slice(0, shift)] : shuffled;
}

function correctAnswerIds(options, promptType) {
  const correctLabels = correctLabelsForPrompt(promptType);
  return options.filter((option) => correctLabels.has(option.semantic_label)).map((option) => option.id);
}

function itemExplanation(options, promptType) {
  const correctLabels = correctLabelsForPrompt(promptType);
  const correct = options.find((option) => correctLabels.has(option.semantic_label));
  return correct?.explanation || "The correct answer follows the rule shown in the prompt.";
}

function complexityForTier(tier, promptType) {
  if (promptType === "same_relation_single") return { binding: 1, uncertainty: 1, control: 1 };
  if (promptType === "same_relation_multi") {
    if (tier <= 2) return { binding: 1, uncertainty: 1, control: 2 };
    if (tier === 3) return { binding: 1, uncertainty: 2, control: 2 };
    if (tier === 4) return { binding: 2, uncertainty: 2, control: 3 };
    return { binding: 2, uncertainty: 3, control: 3 };
  }
  if (promptType === "choose_x" || promptType === "choose_y" || promptType === "choose_z") return { binding: Math.min(4, Math.max(2, tier)), uncertainty: tier >= 4 ? 3 : 2, control: tier >= 5 ? 4 : 3 };
  if (promptType === "choose_assignment") return { binding: 4, uncertainty: 4, control: 4 };
  return { binding: Math.min(4, tier), uncertainty: 4, control: 4 };
}

function baseItem({ relation, wrapperType, tier, promptType, subtype, premises, options, rng, itemOffset = 0, promptText = null, titleText = null, displayPremises = null, preFlightCheck = null }) {
  const withIds = assignIds(balanceOptionOrder(options, promptType, itemOffset, rng));
  const complexity = complexityForTier(tier, promptType);
  const progression = deriveRelationFitProgression(tier, wrapperType);
  const prompt = promptText || promptCopy(promptType);
  const title = titleText || (promptType.startsWith("same_relation") ? "Relationship to match" : "Facts");
  return {
    id: `rf_sem_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "relation_fit",
    subtype,
    prompt_type: promptType,
    semantic_v2: true,
    wrapper_type: wrapperType,
    wrapper_stage: progression.wrapperStage,
    core_stage: progression.coreStage,
    internal_level: progression.internalLevel,
    difficulty_tier: progression.coreStage,
    binding_load: complexity.binding,
    uncertainty_level: complexity.uncertainty,
    control_burden: complexity.control,
    logical_form: relation.canonicalRelation,
    target_relation_type: relation.id,
    target_semantic: premises[0]?.canonical || null,
    premise_semantics: premises.map((premise) => premise.canonical).filter(Boolean),
    pre_flight_check: preFlightCheck,
    title_text: title,
    display_label: title,
    display_premises: displayPremises || premises.map((premise) => premise.text),
    premises: premises.map((premise) => premise.text),
    query: prompt,
    prompt_text: prompt,
    answer_type: promptType === "same_relation_single" || promptType === "choose_x" || promptType === "choose_y" || promptType === "choose_z" || promptType === "choose_assignment" || promptType === "choose_not_enough_information" ? "single_choice" : "multi_select",
    options: withIds,
    correct_answer: correctAnswerIds(withIds, promptType),
    explanation: itemExplanation(withIds, promptType),
    feedback_title: promptType.startsWith("same_relation") ? "Check the relation" : "Check the facts",
    feedback_text: itemExplanation(withIds, promptType),
    feedback_correct: itemExplanation(withIds, promptType),
    feedback_incorrect: itemExplanation(withIds, promptType),
    feedback_timeout: itemExplanation(withIds, promptType),
    skill_tags: ["relation_validation", "semantic_relation", subtype, wrapperType === "nonsense" ? "nonsense_wrapper" : "real_world_wrapper"]
  };
}

function buildSameRelationItem({ relation, wrapperType = "real_world", tier = 1, promptType = "same_relation_single", rng = Math.random, itemOffset = 0 } = {}) {
  const lexicon = relationLexicon(relation, wrapperType, rng);
  const pairs = entityPairsFor(relation, wrapperType, 3, rng);
  const [targetA, targetB] = pairs[0];
  const target = statementFor(relation, targetA, targetB, { wrapperType, form: "direct", lexicon });
  const inverseEquivalent = () => makeOption("equivalent", statementFor(relation, targetB, targetA, { wrapperType, form: "inverse", lexicon }), target, relation, promptType);
  const directParaphrase = () => makeOption("equivalent", paraphrasedStatementFor(relation, targetA, targetB, { wrapperType, form: "direct", lexicon }), target, relation, promptType);
  const inverseParaphrase = () => makeOption("equivalent", paraphrasedStatementFor(relation, targetA, targetB, { wrapperType, form: "inverse", lexicon }), target, relation, promptType);
  const directContradiction = () => makeOption("contradiction", contradictionStatement(relation, targetA, targetB, { wrapperType, form: "direct", lexicon }), target, relation, promptType);
  const inverseContradiction = () => makeOption("contradiction", contradictionStatement(relation, targetA, targetB, { wrapperType, form: "inverse", lexicon }), target, relation, promptType);
  const paraphraseContradiction = () => makeOption("contradiction", contradictionParaphraseFor(relation, targetA, targetB, { wrapperType, form: itemOffset % 2 === 0 ? "direct" : "inverse", lexicon }), target, relation, promptType);
  const weakDistractor = () => makeOption("irrelevant", irrelevantStatement(relation, pairs[1][0], pairs[1][1], wrapperType, rng), target, relation, promptType);
  const closeLure = (form = "direct") => makeOption("irrelevant", closeRelationLureStatement(relation, wrapperType, rng, form), target, relation, promptType);
  let options;
  if (tier <= 1) {
    promptType = "same_relation_single";
    options = [
      inverseEquivalent(),
      directContradiction(),
      inverseContradiction(),
      weakDistractor()
    ];
  } else if (tier === 2) {
    promptType = "same_relation_multi";
    options = [
      directParaphrase(),
      inverseEquivalent(),
      directContradiction(),
      weakDistractor()
    ];
  } else if (tier === 3) {
    promptType = "same_relation_multi";
    options = [
      directParaphrase(),
      inverseParaphrase(),
      paraphraseContradiction(),
      closeLure(itemOffset % 2 === 0 ? "direct" : "inverse")
    ];
  } else if (tier === 4) {
    promptType = "same_relation_multi";
    options = [
      directParaphrase(),
      inverseParaphrase(),
      closeLure("direct"),
      closeLure("inverse")
    ];
  } else {
    promptType = "same_relation_multi";
    options = [
      directParaphrase(),
      inverseParaphrase(),
      paraphraseContradiction(),
      closeLure(itemOffset % 2 === 0 ? "inverse" : "direct")
    ];
  }
  return baseItem({
    relation,
    wrapperType,
    tier,
    promptType,
    subtype: "same_relation",
    premises: [target],
    options,
    rng,
    itemOffset
  });
}

function buildFactsItem({ relation, wrapperType = "real_world", tier = 3, promptType = "choose_forced", rng = Math.random, itemOffset = 0 } = {}) {
  const lexicon = relationLexicon(relation, wrapperType, rng);
  const pairs = entityPairsFor(relation, wrapperType, 7, rng);
  const [a, b] = pairs[0];
  const c = pairs[1][0];
  const d = pairs[2][0];
  const e = pairs[3][0];
  const fact1 = statementFor(relation, a, b, { wrapperType, form: "direct", lexicon });
  const fact2 = statementFor(relation, b, c, { wrapperType, form: "direct", lexicon });
  const fact3 = tier >= 5 ? statementFor(relation, c, d, { wrapperType, form: "direct", lexicon }) : null;
  const target = fact1;
  const forced = equivalentStatement(relation, a, tier >= 5 ? d : c, { wrapperType, form: rng() < 0.5 ? "direct" : "inverse", lexicon });
  const equivalent = equivalentStatement(relation, a, b, { wrapperType, form: "inverse", lexicon });
  const consistent = equivalentStatement(relation, d, e, { wrapperType, form: rng() < 0.5 ? "direct" : "inverse", lexicon });
  const contradiction = contradictionStatement(relation, a, tier >= 5 ? d : c, { wrapperType, form: rng() < 0.5 ? "direct" : "inverse", lexicon });
  const irrelevant = irrelevantStatement(relation, pairs[4][0], pairs[4][1], wrapperType, rng);
  let options;
  if (promptType === "choose_forced") {
    options = [
      makeOption("forced", forced, target, relation, promptType),
      makeOption("contradiction", contradiction, target, relation, promptType),
      makeOption("consistent", consistent, target, relation, promptType),
      makeOption("irrelevant", irrelevant, target, relation, promptType)
    ];
  } else if (promptType === "select_forced") {
    options = [
      makeOption("forced", forced, target, relation, promptType),
      makeOption("equivalent", equivalent, target, relation, promptType),
      makeOption("consistent", consistent, target, relation, promptType),
      makeOption("contradiction", contradiction, target, relation, promptType)
    ];
  } else {
    options = [
      makeOption("forced", forced, target, relation, promptType),
      makeOption("equivalent", equivalent, target, relation, promptType),
      makeOption("consistent", consistent, target, relation, promptType),
      makeOption("contradiction", contradiction, target, relation, promptType)
    ];
  }
  return baseItem({
    relation,
    wrapperType,
    tier,
    promptType,
    subtype: "consistent_with_facts",
    premises: [fact1, fact2, fact3].filter(Boolean),
    options,
    rng,
    itemOffset
  });
}

function roleStatementFor(relation, slots, index, { wrapperType, lexicon, inverse = false } = {}) {
  return inverse
    ? statementFor(relation, slots[index + 1], slots[index], { wrapperType, form: "inverse", lexicon })
    : statementFor(relation, slots[index], slots[index + 1], { wrapperType, form: "direct", lexicon });
}

function adjacentClueFor(relation, values, index, { wrapperType, lexicon, inverse = false } = {}) {
  return {
    ...roleStatementFor(relation, values, index, { wrapperType, lexicon, inverse }),
    clue_kind: "adjacent",
    clue_edge_index: index,
    clue_form: inverse ? "inverse" : "direct"
  };
}

function endpointClueFor(relation, values, endIndex, { wrapperType, lexicon, inverse = false } = {}) {
  const statement = inverse
    ? statementFor(relation, values[endIndex], values[0], { wrapperType, form: "inverse", lexicon })
    : statementFor(relation, values[0], values[endIndex], { wrapperType, form: "direct", lexicon });
  return {
    ...statement,
    clue_kind: "span",
    clue_edge_index: `0_${endIndex}`,
    clue_form: inverse ? "inverse" : "direct"
  };
}

function shuffleClues(clues, rng = Math.random) {
  const copy = clues.map((clue) => ({ ...clue }));
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function displayedAdjacentEdgeOrder(clues) {
  return clues
    .filter((clue) => clue.clue_kind === "adjacent")
    .map((clue) => clue.clue_edge_index);
}

function isAdjacentOrderShuffled(clues) {
  const edgeOrder = displayedAdjacentEdgeOrder(clues);
  return edgeOrder.some((edgeIndex, displayIndex) => edgeIndex !== displayIndex);
}

function surfaceOrderMirrorsRolePattern(clues, slotCount) {
  const edgeOrder = displayedAdjacentEdgeOrder(clues);
  if (edgeOrder.length < slotCount - 1) return false;
  return edgeOrder.every((edgeIndex, displayIndex) => edgeIndex === displayIndex)
    && clues.filter((clue) => clue.clue_kind === "adjacent").every((clue) => clue.clue_form === "direct");
}

function nonMirroringClueOrder(clues, slotCount, rng = Math.random) {
  let shuffled = shuffleClues(clues, rng);
  if (slotCount > 2 && !isAdjacentOrderShuffled(shuffled)) {
    const adjacent = shuffled.filter((clue) => clue.clue_kind === "adjacent").reverse();
    const span = shuffled.filter((clue) => clue.clue_kind !== "adjacent");
    shuffled = [...adjacent, ...span];
  }
  if (surfaceOrderMirrorsRolePattern(shuffled, slotCount)) {
    return [...shuffled].reverse();
  }
  return shuffled;
}

function clueEntityIds(clue) {
  const semantic = clue?.semantic || {};
  return [semantic.lhs, semantic.rhs].filter(Boolean);
}

function entityOccurrenceCounts(clues, candidates) {
  const counts = new Map(candidates.map((entity) => [entity.id, 0]));
  clues.forEach((clue) => {
    clueEntityIds(clue).forEach((id) => {
      if (counts.has(id)) counts.set(id, counts.get(id) + 1);
    });
  });
  return counts;
}

function roleForIndex(index) {
  return ["X", "Y", "Z", "W"][index] || `Role ${index + 1}`;
}

function roleExplanation(slotName, slotIndex, values, entity) {
  if (slotIndex === 0) return `${entity.name} must be ${slotName} because it starts the chain of clues.`;
  if (slotIndex === values.length - 1) return `${entity.name} must be ${slotName} because it is at the end of the chain.`;
  return `${entity.name} must be ${slotName} because it sits between the items on either side.`;
}

function roleExplanationFromClues(slotName, entity, clueSummary) {
  return `${entity.name} is ${slotName} because the clues say ${clueSummary}.`;
}

function wrongRoleExplanation(slotName, actualSlotName, entity) {
  return `${entity.name} is ${actualSlotName}, not ${slotName}, because the clues put it in that position.`;
}

function semanticKey(semantic) {
  const normalized = normalizeRelationStatement(semantic);
  return `${normalized.relation}|${normalized.lhs}|${normalized.rhs}|${normalized.polarity || "positive"}`;
}

function permutations(rows) {
  if (rows.length <= 1) return [rows];
  const out = [];
  rows.forEach((row, index) => {
    const rest = [...rows.slice(0, index), ...rows.slice(index + 1)];
    permutations(rest).forEach((tail) => out.push([row, ...tail]));
  });
  return out;
}

export function solveSlotMapping({ rolePattern = [], clues = [], slots = [], candidates = [] } = {}) {
  const clueKeys = new Set(clues.map((clue) => semanticKey(clue.canonical || clue.semantic || clue)));
  const solutions = [];
  permutations(candidates).forEach((candidateOrder) => {
    const assignment = {};
    slots.forEach((slot, index) => {
      assignment[slot.id] = candidateOrder[index]?.id;
    });
    const fits = rolePattern.every((premise) => {
      const canonical = normalizeRelationStatement(premise.canonical || premise.semantic || premise);
      return clueKeys.has(semanticKey({
        relation: canonical.relation,
        lhs: assignment[canonical.lhs],
        rhs: assignment[canonical.rhs],
        polarity: canonical.polarity || "positive"
      }));
    });
    if (fits) {
      solutions.push({
        assignment: slots.reduce((rows, slot, index) => ({
          ...rows,
          [slot.name]: candidateOrder[index]
        }), {})
      });
    }
  });
  return solutions;
}

function preFlightCheckSlotPuzzle({ rolePattern, clues, slots, values, askIndex = 0, tier = 3 }) {
  const candidates = values.slice(0, slots.length);
  const solutions = solveSlotMapping({ rolePattern, clues, slots, candidates });
  const counts = entityOccurrenceCounts(clues, candidates);
  const targetEntity = candidates[askIndex];
  const targetOccurrences = counts.get(targetEntity?.id) || 0;
  const sameOccurrenceCount = Array.from(counts.values()).filter((count) => count === targetOccurrences).length;
  const hasConverseClue = clues.some((clue) => clue.clue_form === "inverse");
  const hasShuffledClueOrder = isAdjacentOrderShuffled(clues);
  const hasSpanClue = clues.some((clue) => clue.clue_kind === "span");
  const mirrorsRoleOrder = surfaceOrderMirrorsRolePattern(clues, slots.length);
  const targetIsUniqueRepeatedSurfaceItem = targetOccurrences > 1 && sameOccurrenceCount === 1;
  const plausibleDistractorCount = Math.max(0, candidates.length - 1);
  const antiTrivialityFeatureCount = [
    hasConverseClue,
    hasShuffledClueOrder,
    hasSpanClue,
    !targetIsUniqueRepeatedSurfaceItem && !mirrorsRoleOrder
  ].filter(Boolean).length;
  const requiredFeatureCount = tier <= 1 ? 1 : 2;
  return {
    unique_solution: solutions.length === 1,
    solution_count: solutions.length,
    solution: solutions[0]?.assignment || null,
    no_exact_surface_order_mirroring: !mirrorsRoleOrder,
    no_trivial_positional_solve: !mirrorsRoleOrder && !targetIsUniqueRepeatedSurfaceItem,
    not_all_clues_same_direction_as_role_pattern: hasConverseClue,
    minimum_distractor_quality: plausibleDistractorCount >= 2,
    form_variation: hasConverseClue,
    anti_triviality_feature_count: antiTrivialityFeatureCount,
    required_anti_triviality_features: requiredFeatureCount,
    valid: solutions.length === 1
      && !mirrorsRoleOrder
      && !targetIsUniqueRepeatedSurfaceItem
      && hasConverseClue
      && plausibleDistractorCount >= 2
      && antiTrivialityFeatureCount >= requiredFeatureCount
  };
}

function slotIndexForPrompt(promptType, itemOffset, slotCount) {
  if (promptType === "choose_x") return 0;
  if (promptType === "choose_y") return 1;
  if (promptType === "choose_z") return Math.min(2, slotCount - 1);
  return itemOffset % Math.min(3, slotCount);
}

function assignmentRowsFor(slots, values) {
  return slots.map((slot, index) => ({ slot: slot.name, entity: values[index] }));
}

function swappedAssignmentRows(slots, values, leftIndex, rightIndex) {
  const copy = values.slice(0, slots.length);
  [copy[leftIndex], copy[rightIndex]] = [copy[rightIndex], copy[leftIndex]];
  return assignmentRowsFor(slots, copy);
}

function buildSlotAssignmentItem({ relation, wrapperType = "real_world", tier = 3, promptType = "choose_x", rng = Math.random, itemOffset = 0 } = {}) {
  const lexicon = relationLexicon(relation, wrapperType, rng);
  const slotCount = tier >= 4 ? 4 : 3;
  const slots = Array.from({ length: slotCount }, (_, index) => makeEntity(`slot_${roleForIndex(index).toLowerCase()}`, roleForIndex(index)));
  const values = entitySequenceFor(relation, wrapperType, slotCount + 1, rng);
  const rolePattern = Array.from({ length: slotCount - 1 }, (_, index) => roleStatementFor(relation, slots, index, { wrapperType, lexicon, inverse: false }));
  const askIndex = slotIndexForPrompt(promptType, itemOffset, slotCount);
  const inverseEdgeIndex = Math.abs(itemOffset) % Math.max(1, slotCount - 1);
  const clues = nonMirroringClueOrder([
    ...Array.from({ length: slotCount - 1 }, (_, index) => {
      const useInverse = index === inverseEdgeIndex || (tier >= 4 && (itemOffset + index) % 3 === 1);
      return adjacentClueFor(relation, values, index, { wrapperType, lexicon, inverse: useInverse });
    }),
    ...(slotCount === 3 && askIndex === 1
      ? [endpointClueFor(relation, values, 2, { wrapperType, lexicon, inverse: (itemOffset + tier) % 2 === 0 })]
      : [])
  ], slotCount, rng);
  const preFlight = preFlightCheckSlotPuzzle({ rolePattern, clues, slots, values, askIndex, tier });
  if (!preFlight.valid) {
    throw new Error(`Relation Fit resolve_slots pre-flight failed: ${JSON.stringify(preFlight)}`);
  }
  const slotName = roleForIndex(askIndex);
  const correctEntity = values[askIndex];
  const wrongValues = values
    .slice(0, slotCount)
    .map((entity, index) => ({ entity, index }))
    .filter((row) => row.index !== askIndex);
  const clueSummary = clues.map((clue) => clue.text.replace(/[.?!]\s*$/, "")).join(" and ");
  const options = promptType === "choose_assignment"
    ? [
      makeAssignmentOption("forced", assignmentRowsFor(slots, values), `This assignment fits every clue: ${clueSummary}.`),
      makeAssignmentOption("contradiction", swappedAssignmentRows(slots, values, 0, 1), "This swaps two nearby slots, so at least one clue points the wrong way."),
      makeAssignmentOption("contradiction", swappedAssignmentRows(slots, values, Math.max(0, slotCount - 2), slotCount - 1), "This changes the end of the chain, so it breaks the final clue."),
      makeAssignmentOption("contradiction", swappedAssignmentRows(slots, values, 0, slotCount - 1), "This reverses the endpoints, so the chain no longer fits the clues.")
    ]
    : [
    makeRoleOption("forced", correctEntity, slotName, slotName, roleExplanationFromClues(slotName, correctEntity, clueSummary) || roleExplanation(slotName, askIndex, values.slice(0, slotCount), correctEntity)),
    ...wrongValues.map((row) => makeRoleOption(
      "contradiction",
      row.entity,
      slotName,
      roleForIndex(row.index),
      wrongRoleExplanation(slotName, roleForIndex(row.index), row.entity)
    ))
  ];
  const displayPremises = [
    "Role pattern:",
    ...rolePattern.map((premise) => premise.text),
    "Clues:",
    ...clues.map((premise) => premise.text)
  ];
  return baseItem({
    relation,
    wrapperType,
    tier,
    promptType,
    subtype: "resolve_slots",
    premises: [...rolePattern, ...clues],
    options,
    rng,
    itemOffset,
    titleText: "Role clues",
    displayPremises,
    promptText: promptCopy(promptType),
    preFlightCheck: preFlight
  });
}

export function buildRelationFitItem({ wrapperType = "real_world", subtype = "same_relation", difficultyTier = 1, promptType = null, relationId = null, rng = Math.random, itemOffset = 0, formOffset = 0 } = {}) {
  const tier = clampCoreStage(difficultyTier);
  const relation = relationId ? relationForId(relationId) : relationForSequenceIndex(itemOffset, formOffset);
  const normalizedSubtype = normalizeRelationSubtype(subtype, tier);
  const type = promptType || (normalizedSubtype === "resolve_slots" ? slotPromptTypeFor(tier, itemOffset) : promptTypeFor(tier, normalizedSubtype, rng));
  if (normalizedSubtype === "same_relation") {
    return buildSameRelationItem({ relation, wrapperType, tier, promptType: type, rng, itemOffset });
  }
  return buildSlotAssignmentItem({ relation, wrapperType, tier, promptType: type, rng, itemOffset });
}

export function generateItems({ wrapperType = "real_world", subtype = "same_relation", difficultyTier = 1, count = 5, rng = Math.random, startIndex = 0, formOffset = 0 } = {}) {
  const tier = clampCoreStage(difficultyTier);
  const normalizedSubtype = normalizeRelationSubtype(subtype, tier);
  return Array.from({ length: count }, (_, index) => buildRelationFitItem({
    wrapperType,
    subtype: normalizedSubtype,
    difficultyTier: tier,
    promptType: normalizedSubtype === "same_relation"
      ? (tier <= 1 ? "same_relation_single" : "same_relation_multi")
      : slotPromptTypeFor(tier, startIndex + index),
    rng,
    itemOffset: startIndex + index,
    formOffset
  }));
}

export function makeBlockPlan(state = {}) {
  const accuracy = state.recent_accuracy ?? 0.8;
  const lateCollapse = state.late_collapse ?? false;
  const wrapperCost = state.recent_wrapper_cost ?? 0.0;
  const tier = Math.max(1, Math.min(5, Math.round(Number(state.current_tier ?? 1) || 1)));
  const normalizedSubtype = normalizeRelationSubtype(state.focusSubtype || (tier >= 3 ? "resolve_slots" : "same_relation"), tier);
  const next = {
    decision: "HOLD",
    nextTier: tier,
    nextWrapperMode: state.wrapper_mode ?? "real_world",
    nextSpeedMode: state.speed_mode ?? "normal",
    focusSubtype: normalizedSubtype
  };
  if (accuracy >= 0.85 && !lateCollapse) {
    next.decision = "UP";
    if (normalizedSubtype === "same_relation") {
      if (tier < 2) next.nextTier = 2;
      else if ((state.wrapper_mode ?? "real_world") === "real_world") next.nextWrapperMode = "mixed";
      else {
        next.nextTier = 3;
        next.nextWrapperMode = "real_world";
        next.focusSubtype = "resolve_slots";
      }
    } else if ((state.wrapper_mode ?? "real_world") === "real_world") {
      next.nextWrapperMode = "mixed";
    } else if ((state.speed_mode ?? "normal") === "normal" && wrapperCost < 0.2 && tier >= 3) {
      next.nextSpeedMode = "fast";
    } else {
      next.nextTier = Math.min(5, tier + 1);
    }
    if (next.focusSubtype !== "resolve_slots") next.focusSubtype = next.nextTier >= 3 ? "resolve_slots" : "same_relation";
  } else if (accuracy < 0.7 || lateCollapse) {
    next.decision = "DOWN";
    next.nextSpeedMode = "normal";
    next.nextWrapperMode = "real_world";
    if (normalizedSubtype === "resolve_slots" && tier <= 3) {
      next.nextTier = 2;
      next.focusSubtype = "same_relation";
    } else {
      next.nextTier = Math.max(1, tier - 1);
      next.focusSubtype = next.nextTier >= 3 ? "resolve_slots" : "same_relation";
    }
  }
  return next;
}

export function generateAdaptiveBlock(state = {}, rng = Math.random) {
  const plan = makeBlockPlan(state);
  const wrapperMode = state.wrapper_mode || plan.nextWrapperMode || "real_world";
  const tier = plan.nextTier;
  const subtype = normalizeRelationSubtype(state.focusSubtype || plan.focusSubtype, tier);
  const formOffset = Math.floor(rng() * RELATIONS.length);
  const items = wrapperMode === "mixed"
    ? [
      ...generateItems({ wrapperType: "real_world", subtype, difficultyTier: tier, count: 5, rng, startIndex: 0, formOffset }),
      ...generateItems({ wrapperType: "nonsense", subtype, difficultyTier: tier, count: 5, rng, startIndex: 5, formOffset })
    ]
    : generateItems({
      wrapperType: wrapperMode,
      subtype,
      difficultyTier: tier,
      count: 10,
      rng,
      formOffset
    });
  return { family: "relation_fit", plan, items };
}
