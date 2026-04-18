/**
 * Best Rule So Far family generator
 * ES module for use in a Vite / plain HTML+JS webapp.
 * Version: 1.0.0
 */
export const BEST_RULE_SO_FAR_VERSION = "1.0.0";
export const PHONOTACTICS = {
  onsets: ["b","d","f","g","h","k","l","m","n","p","r","s","t","v","z","br","dr","gl","kr","pl","tr","vr"],
  vowels: ["a","e","i","o","u","ai","ea","io","oa","ui"],
  codas: ["","n","l","r","m","s","t","k"],
  patterns: ["CV","CVC","CVV","CV.CV","CVC.CV","CV.CVC"]
};
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
export function generateStateSet(count = 6, rng = Math.random) {
  const used = new Set();
  const states = [];
  while (states.length < count) {
    const w = generatePronounceableWord(rng);
    if (!used.has(w)) { used.add(w); states.push(w); }
  }
  return states;
}
export function generateOrderedLadder(count = 6, rng = Math.random) {
  return generateStateSet(count, rng);
}
function optionsFromTexts(texts) {
  return texts.map((text, index) => ({ id: String.fromCharCode(65 + index), text }));
}
export function buildAlternationMCQItem({ difficultyTier = 1, rng = Math.random } = {}) {
  const [A, B] = generateStateSet(2, rng);
  const seq = difficultyTier >= 2 ? [A, B, A, B, A] : [A, B, A, B];
  const options = [
    `The stream alternates between ${A} and ${B}.`,
    `Each state repeats twice before the stream changes.`,
    `The stream cycles through three states.`,
    `The stream stays on one state for two steps, then switches permanently.`
  ];
  return {
    id: `brsf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "best_rule_so_far",
    subtype: "best_rule_so_far_mcq",
    wrapper_type: "nonsense",
    difficulty_tier: difficultyTier,
    binding_load: 1,
    uncertainty_level: difficultyTier >= 2 ? 2 : 1,
    control_burden: difficultyTier >= 2 ? 2 : 1,
    logical_form: "alternation(A,B)",
    target_rule_family: "alternation",
    premises: [`Observed stream so far: ${seq.join(", ")}.`],
    query: "Which rule best fits the observations so far?",
    answer_type: "single_choice",
    options: optionsFromTexts(options),
    correct_answer: ["A"],
    explanation: "The states flip back and forth between the same two values.",
    skill_tags: ["induction", "alternation", "nonsense_wrapper"]
  };
}
export function buildCycleMCQItem({ difficultyTier = 2, rng = Math.random } = {}) {
  const [A, B, C] = generateStateSet(3, rng);
  const seq = difficultyTier >= 3 ? [A, B, C, A, B] : [A, B, C, A];
  const options = [
    `The stream cycles through ${A}, ${B}, and ${C} in order.`,
    `The stream alternates between ${A} and ${B}.`,
    `Each state repeats twice before the stream changes.`,
    `The stream climbs a ranked ladder one step at a time.`
  ];
  return {
    id: `brsf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "best_rule_so_far",
    subtype: "best_rule_so_far_mcq",
    wrapper_type: "nonsense",
    difficulty_tier: difficultyTier,
    binding_load: 2,
    uncertainty_level: 2,
    control_burden: 2,
    logical_form: "cycle(A,B,C)",
    target_rule_family: "cycle_3",
    premises: [`Observed stream so far: ${seq.join(", ")}.`],
    query: "Which rule best fits the observations so far?",
    answer_type: "single_choice",
    options: optionsFromTexts(options),
    correct_answer: ["A"],
    explanation: "The same three states recur in the same order.",
    skill_tags: ["induction", "cycle_detection", "nonsense_wrapper"]
  };
}
export function buildLadderMCQItem({ step = 1, difficultyTier = 2, rng = Math.random } = {}) {
  const ladder = generateOrderedLadder(6, rng);
  const startIndex = step === 1 ? 0 : 1;
  const seq = [ladder[startIndex], ladder[startIndex + step], ladder[startIndex + step * 2], ladder[startIndex + step * 3]];
  const options = [
    `The state moves ${step} step${step > 1 ? "s" : ""} up the ladder each time.`,
    `The state moves ${step === 1 ? 2 : 1} step${step === 1 ? "s" : ""} up the ladder each time.`,
    `The stream alternates between two fixed states.`,
    `Each state repeats twice before the stream changes.`
  ];
  return {
    id: `brsf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "best_rule_so_far",
    subtype: "best_rule_so_far_mcq",
    wrapper_type: "nonsense",
    difficulty_tier: difficultyTier,
    binding_load: 1,
    uncertainty_level: 2,
    control_burden: 2,
    logical_form: `increase_by(${step}) on ranked ladder`,
    target_rule_family: `increase_${step}`,
    premises: [`Ordered ladder: ${ladder.join(" < ")}.`, `Observed stream so far: ${seq.join(", ")}.`],
    query: "Which rule best fits the observations so far?",
    answer_type: "single_choice",
    options: optionsFromTexts(options),
    correct_answer: ["A"],
    explanation: "The stream advances a fixed number of positions on the ranked ladder.",
    skill_tags: ["induction", "ordered_states", "nonsense_wrapper"]
  };
}
export function buildPairRepeatMCQItem({ difficultyTier = 3, rng = Math.random } = {}) {
  const [A, B, C] = generateStateSet(3, rng);
  const seq = difficultyTier >= 4 ? [A, A, B, B, C, C] : [A, A, B, B];
  const options = [
    `Each state repeats twice before the stream advances.`,
    `The stream alternates between two states.`,
    `The stream cycles through three states one at a time.`,
    `The stream climbs a ladder one step at a time.`
  ];
  return {
    id: `brsf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "best_rule_so_far",
    subtype: "best_rule_so_far_mcq",
    wrapper_type: "nonsense",
    difficulty_tier: difficultyTier,
    binding_load: 2,
    uncertainty_level: 2,
    control_burden: 3,
    logical_form: "pair_repeat(A,A,B,B,...)",
    target_rule_family: "pair_repeat",
    premises: [`Observed stream so far: ${seq.join(", ")}.`],
    query: "Which rule best fits the observations so far?",
    answer_type: "single_choice",
    options: optionsFromTexts(options),
    correct_answer: ["A"],
    explanation: "Each state appears in two-item blocks before the stream moves on.",
    skill_tags: ["induction", "repeat_pattern", "nonsense_wrapper"]
  };
}
export function buildTwoFeatureMCQItem({ difficultyTier = 4, rng = Math.random } = {}) {
  const [F1A, F1B, F1C] = generateStateSet(3, rng);
  const [F2A, F2B] = generateStateSet(2, rng);
  const seq = difficultyTier >= 5
    ? [[F1A, F2A], [F1B, F2A], [F1C, F2A], [F1A, F2A], [F1B, F2A]]
    : [[F1A, F2A], [F1B, F2A], [F1C, F2A], [F1A, F2A]];
  const rendered = seq.map(([a, b]) => `${a} core, ${b} shell`).join(" | ");
  const options = [
    `The core cycles through three states while the shell stays fixed.`,
    `The shell alternates while the core stays fixed.`,
    `Both features change on every step.`,
    `The core repeats each state twice while the shell cycles.`
  ];
  return {
    id: `brsf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "best_rule_so_far",
    subtype: "best_rule_so_far_mcq",
    wrapper_type: "nonsense",
    difficulty_tier: difficultyTier,
    binding_load: 3,
    uncertainty_level: 3,
    control_burden: difficultyTier >= 5 ? 4 : 3,
    logical_form: "hold(F2) & cycle3(F1)",
    target_rule_family: "two_feature_hold_cycle",
    premises: [`Observed paired states so far: ${rendered}.`],
    query: "Which rule best fits the observations so far?",
    answer_type: "single_choice",
    options: optionsFromTexts(options),
    correct_answer: ["A"],
    explanation: "One feature varies systematically while the second feature remains constant.",
    skill_tags: ["induction", "two_feature_rule", "nonsense_wrapper"]
  };
}
export function buildConfidenceUpdateItem({ difficultyTier = 3, positive = true, rng = Math.random } = {}) {
  if (difficultyTier <= 3) {
    const [A, B, C] = generateStateSet(3, rng);
    const premises = difficultyTier <= 2
      ? [`Observed stream so far: ${[A, B, A].join(", ")}.`, `Current best rule: the stream alternates between ${A} and ${B}.`, `Rival rule: each state repeats twice before the stream changes.`, `New observation: ${positive ? B : A}.`]
      : [`Observed stream so far: ${[A, B, C, A].join(", ")}.`, `Current best rule: the stream cycles through ${A}, ${B}, and ${C} in order.`, `Rival rule: the stream alternates between ${A} and ${B}.`, `New observation: ${positive ? B : C}.`];
    return {
      id: `brsf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
      family: "best_rule_so_far",
      subtype: "confidence_update_tf",
      wrapper_type: "nonsense",
      difficulty_tier: difficultyTier,
      binding_load: difficultyTier <= 2 ? 1 : 2,
      uncertainty_level: positive ? 2 : 3,
      control_burden: difficultyTier <= 2 ? 2 : 3,
      logical_form: "evidence_update(rule1,rule2)",
      target_rule_family: "confidence_update",
      premises,
      query: "Should confidence in the current best rule rise relative to the rival?",
      answer_type: "true_false",
      options: optionsFromTexts(["Confidence should rise.", "Confidence should not rise."]),
      correct_answer: [positive ? "A" : "B"],
      explanation: positive ? "The new observation matches the named best rule better than the rival." : "The new observation does not support the named best rule relative to the rival.",
      skill_tags: ["updating", "confidence_calibration", "nonsense_wrapper"]
    };
  }
  const [F1A, F1B, F1C] = generateStateSet(3, rng);
  const [F2A, F2B] = generateStateSet(2, rng);
  const premises = [
    `Observed paired states so far: ${[[F1A, F2A], [F1B, F2A], [F1C, F2A], [F1A, F2A]].map(([a, b]) => `${a} core, ${b} shell`).join(" | ")}.`,
    `Current best rule: the core cycles while the shell stays fixed.`,
    `Rival rule: both the core and the shell change together.`,
    `New observation: ${positive ? `${F1B} core, ${F2A} shell` : `${F1B} core, ${F2B} shell`}.`
  ];
  return {
    id: `brsf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "best_rule_so_far",
    subtype: "confidence_update_tf",
    wrapper_type: "nonsense",
    difficulty_tier: difficultyTier,
    binding_load: 3,
    uncertainty_level: positive ? 3 : 4,
    control_burden: difficultyTier >= 5 ? 4 : 3,
    logical_form: "evidence_update(feature_rule_1, feature_rule_2)",
    target_rule_family: "confidence_update",
    premises,
    query: "Should confidence in the current best rule rise relative to the rival?",
    answer_type: "true_false",
    options: optionsFromTexts(["Confidence should rise.", "Confidence should not rise."]),
    correct_answer: [positive ? "A" : "B"],
    explanation: positive ? "The new observation preserves the fixed-shell cycling pattern." : "The new observation does not increase support for the current best feature rule.",
    skill_tags: ["updating", "confidence_calibration", "feature_rule", "nonsense_wrapper"]
  };
}
export function buildSelectAllConsistentItem({ difficultyTier = 3, rng = Math.random } = {}) {
  if (difficultyTier <= 3) {
    if (difficultyTier <= 2) {
      const ladder = generateOrderedLadder(6, rng);
      const step = difficultyTier === 1 ? 1 : 2;
      const seq = [ladder[0], ladder[step], ladder[step * 2]];
      const options = [
        `The state moves ${step} step${step > 1 ? "s" : ""} up the ladder each time.`,
        `The state is increasing along the ladder so far.`,
        `The stream alternates between two fixed states.`,
        `The state is decreasing along the ladder.`
      ];
      return {
        id: `brsf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
        family: "best_rule_so_far",
        subtype: "select_all_consistent",
        wrapper_type: "nonsense",
        difficulty_tier: difficultyTier,
        binding_load: 1,
        uncertainty_level: 2,
        control_burden: 2,
        logical_form: `increase_by(${step}) subset increasing`,
        target_rule_family: "multi_rule_consistency",
        premises: [`Ordered ladder: ${ladder.join(" < ")}.`, `Observed stream so far: ${seq.join(", ")}.`],
        query: "Select all candidate rules that are still consistent with the observations.",
        answer_type: "multi_select",
        options: optionsFromTexts(options),
        correct_answer: ["A", "B"],
        explanation: "The evidence supports both a specific step-size rule and the broader increasing rule.",
        skill_tags: ["induction", "rule_filtering", "multi_select", "nonsense_wrapper"]
      };
    }
    const [A, B] = generateStateSet(2, rng);
    const options = [
      `The stream alternates between ${A} and ${B}.`,
      `Only two states have appeared so far.`,
      `The stream cycles through three states.`,
      `Each state repeats twice before the stream changes.`
    ];
    return {
      id: `brsf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
      family: "best_rule_so_far",
      subtype: "select_all_consistent",
      wrapper_type: "nonsense",
      difficulty_tier: difficultyTier,
      binding_load: 2,
      uncertainty_level: 3,
      control_burden: 3,
      logical_form: "alternation subset two_state_only",
      target_rule_family: "multi_rule_consistency",
      premises: [`Observed stream so far: ${[A, B, A].join(", ")}.`],
      query: "Select all candidate rules that are still consistent with the observations.",
      answer_type: "multi_select",
      options: optionsFromTexts(options),
      correct_answer: ["A", "B"],
      explanation: "The observations support both the specific alternation rule and the broader two-state description.",
      skill_tags: ["induction", "rule_filtering", "multi_select", "nonsense_wrapper"]
    };
  }
  const [F1A, F1B, F1C] = generateStateSet(3, rng);
  const [F2A] = generateStateSet(1, rng);
  const options = [
    `The core cycles through three states.`,
    `The shell stays fixed so far.`,
    `Both features change on every step.`,
    `The core repeats each state twice.`
  ];
  return {
    id: `brsf_ns_${Date.now()}_${Math.floor(rng() * 1e6)}`,
    family: "best_rule_so_far",
    subtype: "select_all_consistent",
    wrapper_type: "nonsense",
    difficulty_tier: difficultyTier,
    binding_load: 3,
    uncertainty_level: difficultyTier >= 5 ? 4 : 3,
    control_burden: 4,
    logical_form: "hold(F2) & cycle3(F1) implies two supported claims",
    target_rule_family: "multi_rule_consistency",
    premises: [`Observed paired states so far: ${[[F1A, F2A], [F1B, F2A], [F1C, F2A], [F1A, F2A]].map(([a, b]) => `${a} core, ${b} shell`).join(" | ")}.`],
    query: "Select all candidate rules that are still consistent with the observations.",
    answer_type: "multi_select",
    options: optionsFromTexts(options),
    correct_answer: ["A", "B"],
    explanation: "The observations support both the specific cycling claim and the fixed-shell claim.",
    skill_tags: ["induction", "rule_filtering", "multi_select", "feature_rule", "nonsense_wrapper"]
  };
}
export function makeBlockPlan(state = {}) {
  const accuracy = state.recent_accuracy ?? 0.8;
  const lateCollapse = state.late_collapse ?? false;
  const wrapperCost = state.recent_wrapper_cost ?? 0.0;
  const alternationConfusion = state.alternation_confusion_rate ?? 0.0;
  const cycleConfusion = state.cycle_confusion_rate ?? 0.0;
  const featureError = state.feature_rule_error_rate ?? 0.0;
  const overcommitment = state.overcommitment_rate ?? 0.0;
  const multiSelectOverreach = state.multi_select_overreach ?? 0.0;
  const next = {
    decision: "HOLD",
    nextTier: state.current_tier ?? 1,
    nextWrapperMode: state.wrapper_mode ?? "real_world",
    nextSpeedMode: state.speed_mode ?? "normal",
    focusSubtype: "best_rule_so_far_mcq",
    focusRuleFamily: "alternation"
  };
  if (featureError > 0.2) {
    next.focusSubtype = "best_rule_so_far_mcq";
    next.focusRuleFamily = "two_feature_hold_cycle";
  } else if (overcommitment > 0.2 || multiSelectOverreach > 0.2) {
    next.focusSubtype = "select_all_consistent";
    next.focusRuleFamily = "multi_rule_consistency";
  } else if (cycleConfusion > alternationConfusion && cycleConfusion > 0.2) {
    next.focusSubtype = "best_rule_so_far_mcq";
    next.focusRuleFamily = "cycle_3";
  } else if (alternationConfusion > 0.2) {
    next.focusSubtype = "best_rule_so_far_mcq";
    next.focusRuleFamily = "alternation";
  } else {
    next.focusSubtype = "confidence_update_tf";
    next.focusRuleFamily = "confidence_update";
  }
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
    next.focusSubtype = "best_rule_so_far_mcq";
    next.focusRuleFamily = "alternation";
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
      if (plan.focusSubtype === "select_all_consistent") {
        items.push(buildSelectAllConsistentItem({ difficultyTier: Math.max(1, tier), rng }));
      } else if (plan.focusSubtype === "confidence_update_tf") {
        items.push(buildConfidenceUpdateItem({ difficultyTier: Math.max(2, tier), positive: rng() < 0.5, rng }));
      } else if (plan.focusRuleFamily === "two_feature_hold_cycle") {
        items.push(buildTwoFeatureMCQItem({ difficultyTier: Math.max(4, tier), rng }));
      } else if (plan.focusRuleFamily === "cycle_3") {
        items.push(buildCycleMCQItem({ difficultyTier: Math.max(2, tier), rng }));
      } else if (plan.focusRuleFamily === "pair_repeat") {
        items.push(buildPairRepeatMCQItem({ difficultyTier: Math.max(3, tier), rng }));
      } else if (plan.focusRuleFamily === "increase_1" || plan.focusRuleFamily === "increase_2") {
        items.push(buildLadderMCQItem({ step: plan.focusRuleFamily === "increase_2" ? 2 : 1, difficultyTier: Math.max(2, tier), rng }));
      } else {
        items.push(buildAlternationMCQItem({ difficultyTier: Math.max(1, tier), rng }));
      }
    } else {
      items.push({ placeholder: true, wrapper_type: "real_world", note: "Load a real-world item from best-rule-so-far.real-world.examples.json that matches tier/subtype." });
    }
  }
  return { family: "best_rule_so_far", plan, items };
}
