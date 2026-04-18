
/**
 * Must Follow family generator
 * ES module for use in a Vite / plain HTML+JS webapp.
 * Version: 1.0.0
 */
export const MUST_FOLLOW_VERSION = "1.0.0";
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
  const used = new Set();
  const entities = [];
  while (entities.length < count) {
    const w = generatePronounceableWord(rng);
    if (!used.has(w)) { used.add(w); entities.push(w); }
  }
  return entities;
}
export function generateClassWord(rng = Math.random) {
  const roots = ["lav","sor","pel","mor","ten","vak","rim","zal","dov","kir"];
  const suffixes = ["en","ik","or","um","al","et"];
  return `${choice(roots, rng)}${choice(suffixes, rng)}`;
}
export function generateLexicon(rng = Math.random) {
  const comparativeRoot = choice(["dax","miv","lor","sap","ten","vok","ril","zan"], rng);
  const directionPair = choice(DIRECTION_PAIRS, rng);
  const states = ["plim","doren","satek","vurin","mevak","talin"];
  return {
    comparative: {
      root: comparativeRoot,
      direct: (a, b) => `${a} is ${comparativeRoot}er than ${b}.`,
      reverse: (a, b) => `${b} is ${comparativeRoot}er than ${a}.`,
      converse: (a, b) => `${b} is less ${comparativeRoot} than ${a}.`
    },
    directional: {
      leftRoot: directionPair[0], rightRoot: directionPair[1],
      direct: (a, b) => `${a} is to the ${directionPair[0]} of ${b}.`,
      reverse: (a, b) => `${b} is to the ${directionPair[0]} of ${a}.`,
      converse: (a, b) => `${b} is to the ${directionPair[1]} of ${a}.`
    },
    states: {
      pickTriple: () => {
        const pool = [...states].sort(() => rng() - 0.5);
        return pool.slice(0, 3);
      }
    }
  };
}
export function buildNonsenseTransitiveTFItem({ relationMode = "comparative", difficultyTier = 1, rng = Math.random } = {}) {
  const entities = generateEntitySet(4, rng);
  const [A, B, C, D] = entities;
  const lex = generateLexicon(rng)[relationMode];
  const valid = rng() < 0.5;
  const premises = [lex.direct(A, B), lex.direct(B, C)];
  if (difficultyTier >= 2) premises.push(lex.direct(D, A));
  const query = valid
    ? `Does it have to follow that ${relationMode === "comparative" ? `${A} is ${lex.root}er than ${C}` : `${A} is to the ${lex.leftRoot} of ${C}`}?`
    : `Does it have to follow that ${relationMode === "comparative" ? `${C} is ${lex.root}er than ${A}` : `${C} is to the ${lex.leftRoot} of ${A}`}?`;
  return {
    id: `mf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "must_follow",
    subtype: "must_follow_tf",
    wrapper_type: "nonsense",
    difficulty_tier: difficultyTier,
    binding_load: difficultyTier >= 2 ? 2 : 1,
    uncertainty_level: valid ? 1 : 2,
    control_burden: Math.min(4, difficultyTier),
    logical_form: relationMode === "comparative" ? "greater(A,B) & greater(B,C) => greater(A,C)" : "dirA(A,B) & dirA(B,C) => dirA(A,C)",
    target_relation_type: relationMode,
    premises,
    query,
    answer_type: "true_false",
    options: [
      { id: "T", text: "Must follow" },
      { id: "F", text: "Does not have to follow" }
    ],
    correct_answer: [valid ? "T" : "F"],
    explanation: valid
      ? "The relation chains through the middle term."
      : "The premises support the forward chain, not the reversed conclusion.",
    skill_tags: ["deduction", "transitivity", "nonsense_wrapper"]
  };
}
export function buildNonsenseSetMCQItem({ mode = "subset", difficultyTier = 2, rng = Math.random } = {}) {
  const c1 = generateClassWord(rng);
  const c2 = generateClassWord(rng);
  const c3 = generateClassWord(rng);
  const premises = mode === "subset"
    ? [`All ${c1}s are ${c2}s.`, `All ${c2}s are ${c3}s.`]
    : [`All ${c1}s are ${c2}s.`, `No ${c2}s are ${c3}s.`];
  if (difficultyTier >= 3) premises.push(`Some ${c3}s are stored in a ${generateClassWord(rng)} hall.`);
  const correct = mode === "subset" ? `All ${c1}s are ${c3}s.` : `No ${c1}s are ${c3}s.`;
  const opts = mode === "subset"
    ? [correct, `All ${c3}s are ${c1}s.`, `No ${c1}s are ${c3}s.`, `Some ${c1}s are not ${c3}s.`]
    : [correct, `All ${c3}s are ${c1}s.`, `Some ${c1}s are ${c3}s.`, `All ${c1}s are ${c3}s.`];
  return {
    id: `mf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "must_follow",
    subtype: "best_conclusion_mcq",
    wrapper_type: "nonsense",
    difficulty_tier: difficultyTier,
    binding_load: difficultyTier >= 3 ? 3 : 2,
    uncertainty_level: difficultyTier >= 3 ? 3 : 2,
    control_burden: Math.min(4, difficultyTier),
    logical_form: mode === "subset" ? "all(X,Y) & all(Y,Z) => all(X,Z)" : "all(X,Y) & no(Y,Z) => no(X,Z)",
    target_relation_type: mode === "subset" ? "set_inclusion" : "set_exclusion",
    premises,
    query: "Which conclusion must follow?",
    answer_type: "single_choice",
    options: opts.map((text, index) => ({ id: String.fromCharCode(65 + index), text })),
    correct_answer: ["A"],
    explanation: "Only one option is deductively forced by the quantifier chain.",
    skill_tags: ["deduction", "quantifiers", "nonsense_wrapper"]
  };
}
export function buildNonsenseConditionalSelectAllItem({ difficultyTier = 4, rng = Math.random } = {}) {
  const lex = generateLexicon(rng).states;
  const [s1, s2, s3] = lex.pickTriple();
  const premises = [
    `If something is ${s1}, it is ${s2}.`,
    `If something is ${s2}, it is ${s3}.`,
    `If something is ${s3}, it is ${generateClassWord(rng)}-marked.`
  ];
  const correct1 = `If something is ${s1}, it is ${s3}.`;
  const correct2 = `If something is ${s1}, it is ${generateClassWord(rng)}-marked.`;
  const opts = [
    correct1,
    correct2,
    `If something is ${s3}, it is ${s1}.`,
    `If something is ${s2}, it is ${s1}.`
  ];
  return {
    id: `mf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "must_follow",
    subtype: "select_all_must_follow",
    wrapper_type: "nonsense",
    difficulty_tier: difficultyTier,
    binding_load: difficultyTier >= 5 ? 5 : 4,
    uncertainty_level: 4,
    control_burden: 4,
    logical_form: "if(P,Q) & if(Q,R) & if(R,S) => if(P,R) & if(P,S)",
    target_relation_type: "conditional_chain_multi",
    premises,
    query: "Select all conclusions that must follow.",
    answer_type: "multi_select",
    options: opts.map((text, index) => ({ id: String.fromCharCode(65 + index), text })),
    correct_answer: ["A", "B"],
    explanation: "The first state inherits both downstream consequences in the chain.",
    skill_tags: ["deduction", "conditional_reasoning", "multi_select", "nonsense_wrapper"]
  };
}
export function makeBlockPlan(state = {}) {
  const accuracy = state.recent_accuracy ?? 0.8;
  const lateCollapse = state.late_collapse ?? false;
  const wrapperCost = state.recent_wrapper_cost ?? 0.0;
  const transitiveError = state.transitive_reversal_error_rate ?? 0.0;
  const quantifierError = state.quantifier_scope_error_rate ?? 0.0;
  const conditionalError = state.conditional_chain_error_rate ?? 0.0;
  const overreach = state.multi_select_overreach ?? 0.0;
  const next = {
    decision: "HOLD",
    nextTier: state.current_tier ?? 1,
    nextWrapperMode: state.wrapper_mode ?? "real_world",
    nextSpeedMode: state.speed_mode ?? "normal",
    focusSubtype: "best_conclusion_mcq"
  };
  if (transitiveError > 0.25) next.focusSubtype = "must_follow_tf";
  else if (quantifierError > 0.2 || conditionalError > 0.2) next.focusSubtype = "best_conclusion_mcq";
  else if (overreach > 0.2) next.focusSubtype = "select_all_must_follow";
  else next.focusSubtype = "best_conclusion_mcq";
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
    next.focusSubtype = "must_follow_tf";
  }
  return next;
}
export function generateAdaptiveBlock(state = {}, rng = Math.random) {
  const plan = makeBlockPlan(state);
  const items = [];
  const wrapperMode = plan.nextWrapperMode;
  const tier = plan.nextTier;
  for (let i = 0; i < 10; i++) {
    const useNonsense = wrapperMode === "nonsense" || (wrapperMode === "mixed" && i >= 5);
    if (useNonsense) {
      if (plan.focusSubtype === "must_follow_tf") {
        items.push(buildNonsenseTransitiveTFItem({ relationMode: choice(["comparative", "directional"], rng), difficultyTier: tier, rng }));
      } else if (plan.focusSubtype === "select_all_must_follow") {
        items.push(buildNonsenseConditionalSelectAllItem({ difficultyTier: Math.max(4, tier), rng }));
      } else {
        items.push(buildNonsenseSetMCQItem({ mode: choice(["subset", "exclusion"], rng), difficultyTier: Math.max(2, tier), rng }));
      }
    } else {
      items.push({
        placeholder: true,
        wrapper_type: "real_world",
        note: "Load a real-world item from must-follow.real-world.examples.json that matches tier/subtype."
      });
    }
  }
  return { family: "must_follow", plan, items };
}
