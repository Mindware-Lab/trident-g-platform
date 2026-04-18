/**
 * Relation Fit family generator
 * ES module for use in a Vite / plain HTML+JS webapp.
 * Version: 1.0.0
 */
export const RELATION_FIT_VERSION = "1.0.0";
export const PHONOTACTICS = {
  onsets: ["b","d","f","g","h","k","l","m","n","p","r","s","t","v","z","br","dr","gl","kr","pl","tr","vr"],
  vowels: ["a","e","i","o","u","ai","ea","io","oa","ui"],
  codas: ["","n","l","r","m","s","t","k"],
  patterns: ["CV","CVC","CVV","CV.CV","CVC.CV","CV.CVC"]
};
export const DIRECTION_PAIRS = [["nef","sov"],["zor","vem"],["pel","rud"],["kim","tav"]];
export function choice(arr, rng = Math.random) { return arr[Math.floor(rng() * arr.length)]; }
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
  const realised = pattern.split(".").map(p => realiseSyllable(p, rng)).join("");
  return realised.charAt(0).toUpperCase() + realised.slice(1);
}
export function generateEntitySet(count = 6, rng = Math.random) {
  const used = new Set(); const entities = [];
  while (entities.length < count) {
    const w = generatePronounceableWord(rng);
    if (!used.has(w)) { used.add(w); entities.push(w); }
  }
  return entities;
}
export function generateRelationLexicon(rng = Math.random) {
  const comparativeRoot = choice(["dax","miv","lor","sap","ten","vok","ril","zan"], rng);
  const directionPair = choice(DIRECTION_PAIRS, rng);
  const containRoot = choice(["nold","fep","garb","tul","vesh"], rng);
  return {
    comparative: {
      root: comparativeRoot,
      direct: (a, b) => `${a} is ${comparativeRoot}er than ${b}.`,
      converse: (a, b) => `${b} is less ${comparativeRoot} than ${a}.`,
      foilSwap: (a, b) => `${b} is ${comparativeRoot}er than ${a}.`,
      foilPolarity: (a, b) => `${a} is less ${comparativeRoot} than ${b}.`
    },
    directional: {
      leftRoot: directionPair[0], rightRoot: directionPair[1],
      direct: (a, b) => `${a} is to the ${directionPair[0]} of ${b}.`,
      converse: (a, b) => `${b} is to the ${directionPair[1]} of ${a}.`,
      foilSwap: (a, b) => `${b} is to the ${directionPair[0]} of ${a}.`,
      foilPolarity: (a, b) => `${a} is to the ${directionPair[1]} of ${b}.`
    },
    containment: {
      root: containRoot, verb: `${containRoot}s`,
      direct: (a, b) => `${a} ${containRoot}s ${b}.`,
      converse: (a, b) => `${b} is inside ${a}.`,
      foilSwap: (a, b) => `${b} ${containRoot}s ${a}.`,
      foilPolarity: (a, b) => `${a} is inside ${b}.`
    }
  };
}
export function buildNonsenseSameRelationItem({ relationMode = "comparative", difficultyTier = 1, rng = Math.random } = {}) {
  const entities = generateEntitySet(4, rng);
  const [A, B, C, D] = entities;
  const rel = generateRelationLexicon(rng)[relationMode];
  const options = [rel.converse(A, B), rel.foilSwap(A, B), rel.foilPolarity(A, B), rel.foilSwap(C, D)];
  return {
    id: `rf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "relation_fit",
    subtype: "same_relation_mcq",
    wrapper_type: "nonsense",
    difficulty_tier: difficultyTier,
    binding_load: difficultyTier >= 3 ? 2 : 1,
    uncertainty_level: difficultyTier >= 3 ? 2 : 1,
    control_burden: Math.min(4, difficultyTier),
    logical_form: relationMode === "comparative" ? "rel_greater(A,B)" : relationMode === "directional" ? "rel_dir_A(A,B)" : "contains(A,B)",
    target_relation_type: relationMode,
    premises: [rel.direct(A, B)],
    query: "Which option expresses the same underlying relation?",
    answer_type: "single_choice",
    options: options.map((text, index) => ({ id: String.fromCharCode(65 + index), text })),
    correct_answer: ["A"],
    explanation: "Option A preserves the same role assignment under an equivalent surface form.",
    skill_tags: ["relation_validation","converse_mapping","nonsense_wrapper"]
  };
}
export function buildNonsenseSelectAllItem({ relationMode = "comparative", difficultyTier = 3, rng = Math.random } = {}) {
  const entities = generateEntitySet(4, rng);
  const [A, B, C, D] = entities;
  const rel = generateRelationLexicon(rng)[relationMode];
  const options = [rel.converse(A, B), rel.foilPolarity(A, B), rel.converse(C, D), rel.foilSwap(C, D)];
  return {
    id: `rf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "relation_fit",
    subtype: "select_all_valid",
    wrapper_type: "nonsense",
    difficulty_tier: difficultyTier,
    binding_load: 2,
    uncertainty_level: 2,
    control_burden: difficultyTier >= 4 ? 4 : 3,
    logical_form: relationMode === "comparative" ? "rel_greater(A,B)" : relationMode === "directional" ? "rel_dir_A(A,B)" : "contains(A,B)",
    target_relation_type: relationMode,
    premises: ["Target relation is defined by the same underlying abstract relation, not by surface word identity."],
    query: "Select all options that instantiate the target relation.",
    answer_type: "multi_select",
    options: options.map((text, index) => ({ id: String.fromCharCode(65 + index), text })),
    correct_answer: ["A","C"],
    explanation: "Both correct answers preserve role assignment under the target relation.",
    skill_tags: ["relation_validation","multi_select","nonsense_wrapper"]
  };
}
export function makeBlockPlan(state = {}) {
  const accuracy = state.recent_accuracy ?? 0.8;
  const lateCollapse = state.late_collapse ?? false;
  const wrapperCost = state.recent_wrapper_cost ?? 0.0;
  const roleReversalRate = state.recent_role_reversal_error_rate ?? 0.0;
  const next = { decision: "HOLD", nextTier: state.current_tier ?? 1, nextWrapperMode: state.wrapper_mode ?? "real_world", nextSpeedMode: state.speed_mode ?? "normal", focusSubtype: "same_relation_mcq" };
  if (roleReversalRate > 0.25) next.focusSubtype = "same_relation_mcq";
  else if ((state.multi_select_overreach ?? 0) > 0.2) next.focusSubtype = "relation_satisfaction";
  else next.focusSubtype = "select_all_valid";
  if (accuracy >= 0.85 && !lateCollapse) {
    next.decision = "UP";
    if ((state.wrapper_mode ?? "real_world") === "real_world") next.nextWrapperMode = "mixed";
    else if ((state.speed_mode ?? "normal") === "normal" && wrapperCost < 0.2) next.nextSpeedMode = "fast";
    else next.nextTier = Math.min(5, (state.current_tier ?? 1) + 1);
  } else if (accuracy < 0.7 || lateCollapse) {
    next.decision = "DOWN";
    next.nextSpeedMode = "normal";
    next.nextWrapperMode = "real_world";
    next.nextTier = Math.max(1, (state.current_tier ?? 1) - 1);
    next.focusSubtype = "same_relation_mcq";
  }
  return next;
}
export function generateAdaptiveBlock(state = {}, rng = Math.random) {
  const plan = makeBlockPlan(state);
  const items = [];
  const wrapperMode = plan.nextWrapperMode;
  const tier = plan.nextTier;
  for (let i = 0; i < 10; i++) {
    const relationMode = choice(["comparative", "directional", "containment"], rng);
    const subtype = plan.focusSubtype;
    const useNonsense = wrapperMode === "nonsense" || (wrapperMode === "mixed" && i >= 5);
    if (useNonsense) {
      items.push(subtype === "select_all_valid"
        ? buildNonsenseSelectAllItem({ relationMode, difficultyTier: tier, rng })
        : buildNonsenseSameRelationItem({ relationMode, difficultyTier: tier, rng }));
    } else {
      items.push({ placeholder: true, wrapper_type: "real_world", note: "Load a real-world item from relation-fit.real-world.examples.json that matches tier/subtype." });
    }
  }
  return { family: "relation_fit", plan, items };
}
