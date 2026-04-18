import { createSeededRng, reasoningSeed, shuffleWithRng } from "./random.js";
import * as relationFitGenerator from "./families/relation-fit/relation-fit.generator.js";
import * as mustFollowGenerator from "./families/must-follow/must-follow.generator.js";
import * as bestRuleGenerator from "./families/best-rule-so-far/best-rule-so-far.generator.js";

export const REASONING_VERSION = 1;
export const REASONING_STORAGE_KEY = "tg_iq_live_reasoning_v1";
export const REASONING_SESSION_TARGET = 20;
export const REASONING_HISTORY_LIMIT = 180;
export const REASONING_PARTIAL_FRESH_MS = 39 * 60 * 1000;
export const REASONING_CORE_BLOCKS = 2;
export const REASONING_CORE_ITEMS = 5;
export const REASONING_SUPPORT_ITEMS = 4;
export const REASONING_MANUAL_ITEM_OPTIONS = [4, 5, 6];
export const REASONING_FAMILY_CYCLE = ["relation_fit", "must_follow", "best_rule_so_far"];

export const REASONING_FAMILIES = {
  relation_fit: {
    id: "relation_fit",
    label: "Relation Fit",
    shortLabel: "Fit",
    defaultSubtype: "same_relation_mcq",
    defaultSupport: true,
    bankUrl: new URL("./families/relation-fit/relation-fit.real-world.examples.json", import.meta.url),
    generator: relationFitGenerator,
    subtypes: {
      auto: "Auto",
      same_relation_mcq: "Same Relation",
      select_all_valid: "Select Valid",
      relation_satisfaction: "Satisfy Relation",
      multi_relation_validation: "Multi Relation"
    }
  },
  must_follow: {
    id: "must_follow",
    label: "Must Follow",
    shortLabel: "Follow",
    defaultSubtype: "must_follow_tf",
    bankUrl: new URL("./families/must-follow/must-follow.real-world.examples.json", import.meta.url),
    generator: mustFollowGenerator,
    subtypes: {
      auto: "Auto",
      must_follow_tf: "True / False",
      best_conclusion_mcq: "Best Conclusion",
      select_all_must_follow: "Select Must Follow"
    }
  },
  best_rule_so_far: {
    id: "best_rule_so_far",
    label: "Best Rule",
    shortLabel: "Rule",
    defaultSubtype: "best_rule_so_far_mcq",
    bankUrl: new URL("./families/best-rule-so-far/best-rule-so-far.real-world.examples.json", import.meta.url),
    generator: bestRuleGenerator,
    subtypes: {
      auto: "Auto",
      best_rule_so_far_mcq: "Best Rule",
      confidence_update_tf: "Confidence Update",
      select_all_consistent: "Live Rules"
    }
  }
};

const ANSWER_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const bankCache = new Map();

const RELATION_UI_TEXT = {
  older_younger: {
    ruleLabel: "the first person is older than the second",
    helper: "Focus on who is older, and who is named first.",
    feedbackTitle: "Check who is older",
    feedback: "The first named person must still be the older one."
  },
  taller_shorter: {
    ruleLabel: "the first person is taller than the second",
    helper: "Focus on who is taller, and who is named first.",
    feedbackTitle: "Check who is taller",
    feedback: "The first named person must still be the taller one."
  },
  earlier_later: {
    ruleLabel: "the first event happens before the second",
    helper: "Focus on which event comes earlier, and which one is named first.",
    feedbackTitle: "Check what comes first",
    feedback: "The first named event must still come earlier."
  },
  north_south: {
    ruleLabel: "the first place is north of the second",
    helper: "Focus on which place is north, and which one is named first.",
    feedbackTitle: "Check the map direction",
    feedback: "The first named place must still be north of the second."
  },
  left_right: {
    ruleLabel: "the first item is left of the second",
    helper: "Focus on which item is on the left, and which one is named first.",
    feedbackTitle: "Check left and right",
    feedback: "The first named item must still be left of the second."
  },
  heavier_lighter: {
    ruleLabel: "the first item is heavier than the second",
    helper: "Focus on which item is heavier, and which one is named first.",
    feedbackTitle: "Check the heavier item",
    feedback: "The first named item must still be the heavier one."
  },
  inside_contains: {
    ruleLabel: "the first object contains the second",
    helper: "Focus on what contains what, and which object is named first.",
    feedbackTitle: "Check what contains what",
    feedback: "The first named object must still contain the second."
  },
  same_route: {
    ruleLabel: "both places use the same route",
    helper: "Focus on whether the route is the same, not the order of the names.",
    feedbackTitle: "Check the route match",
    feedback: "The correct statements keep the route the same."
  },
  all_different: {
    ruleLabel: "all three items must be different",
    helper: "Check all three items. No repeats are allowed.",
    feedbackTitle: "Check for repeats",
    feedback: "Every item in the correct answer must be different."
  },
  comparative: {
    ruleLabel: "the first item has more of the made-up quality than the second",
    helper: "Focus on which made-up item has more, and which one is named first.",
    feedbackTitle: "Check the made-up comparison",
    feedback: "The first named item must still have more of the made-up quality."
  },
  directional: {
    ruleLabel: "the first item is in the target direction from the second",
    helper: "Focus on the direction word, and which item is named first.",
    feedbackTitle: "Check the direction",
    feedback: "The first named item must still point the same way from the second."
  },
  containment: {
    ruleLabel: "the first object holds the second",
    helper: "Focus on what holds what, and which object is named first.",
    feedbackTitle: "Check what holds what",
    feedback: "The first named object must still hold the second."
  }
};

const LOGICAL_RELATION_ALIASES = {
  older_than: "older_younger",
  taller_than: "taller_shorter",
  earlier_than: "earlier_later",
  before: "earlier_later",
  north_of: "north_south",
  left_of: "left_right",
  heavier_than: "heavier_lighter",
  contains: "inside_contains",
  same_route: "same_route",
  all_different: "all_different",
  rel_greater: "comparative",
  rel_dir_A: "directional"
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function numeric(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampTier(value) {
  return clamp(Math.round(numeric(value, 1)), 1, 5);
}

function normalizeFamilyId(value) {
  return REASONING_FAMILIES[value] ? value : "relation_fit";
}

function normalizeWrapper(value) {
  return value === "mixed" || value === "nonsense" ? value : "real_world";
}

function normalizeSpeed(value) {
  return value === "fast" ? "fast" : "normal";
}

function normalizeItemsPerBlock(value) {
  const parsed = Math.round(numeric(value, 5));
  return REASONING_MANUAL_ITEM_OPTIONS.includes(parsed) ? parsed : 5;
}

function relationUiKey(item) {
  const direct = item?.target_relation_type;
  if (direct && RELATION_UI_TEXT[direct]) return direct;
  const logical = String(item?.logical_form || "");
  const match = logical.match(/^([a-zA-Z_]+)/);
  return LOGICAL_RELATION_ALIASES[match?.[1]] || direct || "relation";
}

function relationOptionMatchesExactRule(item, option) {
  const key = relationUiKey(item);
  const text = String(option?.text || "").toLowerCase();
  if (key === "same_route") return text.includes("same route");
  if (key === "older_younger") return text.includes(" is older than ");
  if (key === "taller_shorter") return text.includes(" is taller than ");
  if (key === "earlier_later") return text.includes(" happens earlier than ") || text.includes(" happens before ");
  if (key === "north_south") return text.includes(" is north of ");
  if (key === "left_right") return text.includes(" is to the left of ");
  if (key === "heavier_lighter") return text.includes(" is heavier than ");
  if (key === "inside_contains") return text.includes(" contains ");
  if (key === "comparative") return text.includes("er than ") && !text.includes("less ");
  if (key === "containment") return !text.includes(" inside ") && !text.includes(" is inside ");
  return false;
}

function normalizeRelationFitCorrectAnswers(item) {
  if (item?.family !== "relation_fit" || item?.subtype !== "select_all_valid") return item;
  if (!Array.isArray(item.options)) return item;
  const key = relationUiKey(item);
  const exactIds = item.options
    .filter((option) => relationOptionMatchesExactRule(item, option))
    .map((option) => option.id);
  if (!exactIds.length && key === "directional") return { ...item, correct_answer: ["D"] };
  if (!exactIds.length) return item;
  return { ...item, correct_answer: exactIds };
}

function publicReasoningFields(item) {
  if (item?.family === "relation_fit") {
    const key = relationUiKey(item);
    const relation = RELATION_UI_TEXT[key] || {
      ruleLabel: "the same relationship pattern",
      helper: "Focus on the relationship, not just matching words.",
      feedbackTitle: "Check the relationship",
      feedback: "The correct answer keeps the same relationship pattern."
    };
    if (item.subtype === "select_all_valid") {
      return {
        title_text: "Rule to match",
        rule_text: relation.ruleLabel,
        display_label: "Rule to match",
        display_rule: relation.ruleLabel,
        display_premises: [],
        prompt_text: "Select all statements that match this exact rule.",
        hint_text: relation.helper,
        helper_text: relation.helper,
        feedback_title: relation.feedbackTitle,
        feedback_text: relation.feedback,
        feedback_correct: "That matches the same rule.",
        feedback_incorrect: "The relation sounds similar, but the pattern has changed.",
        feedback_timeout: relation.feedback
      };
    }
    if (item.subtype === "same_relation_mcq") {
      return {
        title_text: "Statement to match",
        display_label: "Statement to match",
        display_premises: item.premises || [],
        prompt_text: "Which option matches this exact rule?",
        hint_text: "Look for the same relation, not just similar words.",
        helper_text: "Look for the same relation, not just similar words.",
        feedback_title: "Check the same meaning",
        feedback_text: "The correct answer keeps the same relationship after the wording changes.",
        feedback_correct: "That matches the same rule.",
        feedback_incorrect: "This changes who does what in the rule.",
        feedback_timeout: "Check who does what. The same words are not enough."
      };
    }
    if (item.subtype === "multi_relation_validation") {
      return {
        title_text: "Facts",
        display_label: "Facts",
        display_premises: item.premises || [],
        prompt_text: "Which statement must be true?",
        hint_text: "Follow the facts from first to last.",
        helper_text: "Follow the chain from the first fact to the last.",
        feedback_title: "Check the chain",
        feedback_text: "The correct answer follows from the full chain of facts.",
        feedback_correct: "That definitely follows from the facts.",
        feedback_incorrect: "The facts do not force this answer.",
        feedback_timeout: "Focus on what must be true, not what seems likely."
      };
    }
    if (item.subtype === "relation_satisfaction") {
      return {
        title_text: "Rule to match",
        rule_text: relation.ruleLabel,
        display_label: "Rule to match",
        display_rule: relation.ruleLabel,
        display_premises: [],
        prompt_text: "Choose the option that fits this rule.",
        hint_text: relation.helper,
        helper_text: relation.helper,
        feedback_title: relation.feedbackTitle,
        feedback_text: relation.feedback,
        feedback_correct: "That matches the same rule.",
        feedback_incorrect: "This option breaks the rule.",
        feedback_timeout: relation.feedback
      };
    }
    return {
      title_text: "Rule to match",
      rule_text: relation.ruleLabel,
      display_label: "Rule to match",
      display_rule: relation.ruleLabel,
      display_premises: item.premises || [],
      prompt_text: "Choose the answer that fits the rule.",
      hint_text: relation.helper,
      helper_text: relation.helper,
      feedback_title: relation.feedbackTitle,
      feedback_text: relation.feedback,
      feedback_correct: "That matches the same rule.",
      feedback_incorrect: "This option breaks the rule.",
      feedback_timeout: relation.feedback
    };
  }
  if (item?.family === "must_follow") {
    return {
      title_text: "Facts",
      display_label: "Facts",
      display_premises: item.premises || [],
      prompt_text: item.answer_type === "true_false"
        ? "Must this be true?"
        : item.answer_type === "multi_select"
          ? "Select all statements that must be true."
          : "Which statement must be true?",
      hint_text: "Use only the facts shown. Do not choose what is merely possible.",
      helper_text: "Use only the facts shown. Do not choose what is merely possible.",
      feedback_title: "Check what must be true",
      feedback_text: "This follows only if the facts force it to be true.",
      feedback_correct: "That definitely follows from the facts.",
      feedback_incorrect: "This may be true, but it does not have to be true.",
      feedback_timeout: "Focus on what must be true, not what seems likely."
    };
  }
  if (item?.family === "best_rule_so_far") {
    return {
      title_text: "Pattern so far",
      display_label: "Pattern so far",
      display_premises: item.premises || [],
      prompt_text: item.answer_type === "multi_select"
        ? "Select all rules that still fit the pattern so far."
        : item.answer_type === "true_false"
          ? "Should confidence in this rule go up?"
          : "Which rule best fits the examples so far?",
      hint_text: "Look for the rule that fits all the examples, not just one.",
      helper_text: "Look for the rule that fits all the examples, not just one.",
      feedback_title: "Check the pattern",
      feedback_text: "The best rule fits the examples better than the other choices.",
      feedback_correct: "This is the best fit so far.",
      feedback_incorrect: "This rule fits some examples, but not all of them.",
      feedback_timeout: "Choose the rule that fits the whole pattern so far."
    };
  }
  return {
    title_text: "Reasoning signal",
    display_premises: item?.premises || [],
    prompt_text: item?.query || "Choose the best answer.",
    hint_text: "Use the rule shown here.",
    feedback_title: "Check the rule",
    feedback_text: "Review the rule and try the next one cleanly.",
    feedback_correct: "Correct.",
    feedback_incorrect: "Not quite.",
    feedback_timeout: "Time ran out. Review the rule before the next signal."
  };
}

export function reasoningFamilyLabel(familyId) {
  return REASONING_FAMILIES[familyId]?.label || REASONING_FAMILIES.relation_fit.label;
}

export function reasoningSubtypeLabel(familyId, subtype) {
  return REASONING_FAMILIES[familyId]?.subtypes?.[subtype] || REASONING_FAMILIES[familyId]?.subtypes?.auto || "Auto";
}

function defaultFamilyState(familyId) {
  const meta = REASONING_FAMILIES[familyId] || REASONING_FAMILIES.relation_fit;
  return {
    current_tier: 1,
    wrapper_mode: "real_world",
    speed_mode: "normal",
    focusSubtype: meta.defaultSubtype,
    recent_accuracy: null,
    late_collapse: false,
    recent_wrapper_cost: 0,
    wrapperExposure: { real_world: 0, mixed: 0, nonsense: 0 },
    metrics: {}
  };
}

function normalizeFamilyState(familyId, raw) {
  const base = defaultFamilyState(familyId);
  const source = raw && typeof raw === "object" ? raw : {};
  const exposure = source.wrapperExposure && typeof source.wrapperExposure === "object" ? source.wrapperExposure : {};
  return {
    current_tier: clampTier(source.current_tier ?? source.currentTier ?? base.current_tier),
    wrapper_mode: normalizeWrapper(source.wrapper_mode ?? source.wrapperMode ?? base.wrapper_mode),
    speed_mode: normalizeSpeed(source.speed_mode ?? source.speedMode ?? base.speed_mode),
    focusSubtype: typeof source.focusSubtype === "string" ? source.focusSubtype : base.focusSubtype,
    recent_accuracy: Number.isFinite(source.recent_accuracy) ? Number(source.recent_accuracy) : null,
    late_collapse: source.late_collapse === true,
    recent_wrapper_cost: clamp(numeric(source.recent_wrapper_cost, 0), 0, 1),
    wrapperExposure: {
      real_world: Math.max(0, Math.round(numeric(exposure.real_world, 0))),
      mixed: Math.max(0, Math.round(numeric(exposure.mixed, 0))),
      nonsense: Math.max(0, Math.round(numeric(exposure.nonsense, 0)))
    },
    metrics: source.metrics && typeof source.metrics === "object" ? { ...source.metrics } : {}
  };
}

export function createDefaultReasoningState() {
  return normalizeReasoningState({
    version: REASONING_VERSION,
    settings: {
      mode: "coach",
      family: "relation_fit",
      subtype: "auto",
      wrapper: "real_world",
      speed: "normal",
      tier: "auto",
      itemsPerBlock: 5
    },
    currentSession: null,
    programme: { coreSessionNumber: 0, manualSessionNumber: 0, programmeBonusAwarded: false },
    history: [],
    familyState: {},
    tacticCaptures: []
  });
}

export function normalizeReasoningState(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const settings = source.settings && typeof source.settings === "object" ? source.settings : {};
  const familyState = {};
  Object.keys(REASONING_FAMILIES).forEach((familyId) => {
    familyState[familyId] = normalizeFamilyState(familyId, source.familyState?.[familyId]);
  });
  const programme = source.programme && typeof source.programme === "object" ? source.programme : {};
  return {
    version: REASONING_VERSION,
    settings: {
      mode: settings.mode === "manual" ? "manual" : "coach",
      family: normalizeFamilyId(settings.family),
      subtype: typeof settings.subtype === "string" ? settings.subtype : "auto",
      wrapper: normalizeWrapper(settings.wrapper),
      speed: normalizeSpeed(settings.speed),
      tier: settings.tier === "auto" ? "auto" : clampTier(settings.tier),
      itemsPerBlock: normalizeItemsPerBlock(settings.itemsPerBlock)
    },
    currentSession: source.currentSession && typeof source.currentSession === "object" ? source.currentSession : null,
    programme: {
      coreSessionNumber: clamp(Math.round(numeric(programme.coreSessionNumber, 0)), 0, 999),
      manualSessionNumber: clamp(Math.round(numeric(programme.manualSessionNumber, 0)), 0, 999),
      programmeBonusAwarded: programme.programmeBonusAwarded === true
    },
    history: Array.isArray(source.history) ? source.history.filter(Boolean).slice(0, REASONING_HISTORY_LIMIT) : [],
    familyState,
    tacticCaptures: Array.isArray(source.tacticCaptures) ? source.tacticCaptures.filter(Boolean).slice(0, 80) : []
  };
}

export function parseReasoningJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function completedReasoningSessions(state) {
  return clamp(Math.round(numeric(state?.programme?.coreSessionNumber, 0)), 0, 999);
}

export function nextReasoningSessionNumber(state) {
  return clamp(completedReasoningSessions(state) + 1, 1, 999);
}

export function reasoningSessionsToGo(state) {
  return Math.max(0, REASONING_SESSION_TARGET - Math.min(REASONING_SESSION_TARGET, completedReasoningSessions(state)));
}

export function reasoningFamilyForCoreSession(sessionNumber) {
  return REASONING_FAMILY_CYCLE[(Math.max(1, sessionNumber) - 1) % REASONING_FAMILY_CYCLE.length];
}

export function isFreshReasoningSession(session) {
  if (!session || session.status !== "partial") return false;
  const ageMs = Date.now() - numeric(session.updatedAt || session.startedAt, 0);
  if (ageMs < 0 || ageMs > REASONING_PARTIAL_FRESH_MS) return false;
  const date = new Date(numeric(session.startedAt, 0));
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export function routeClassForZone(routeState, fresh = false) {
  if (!fresh) return "core";
  if (routeState === "in_zone") return "core";
  if (routeState === "flat" || routeState === "overloaded_exploit") return "support";
  if (routeState === "overloaded_explore") return "recovery_light";
  return "recovery";
}

export function defaultSupportFamily(routeState) {
  if (routeState === "overloaded_exploit") return "must_follow";
  return "relation_fit";
}

export function planReasoningSession(state, zoneSnapshot = {}) {
  const routeState = zoneSnapshot.routeState || "invalid";
  const routeClass = routeClassForZone(routeState, zoneSnapshot.fresh === true);
  if (routeClass === "recovery") {
    return {
      blocked: true,
      routeClass,
      routeState,
      message: "Zone Check did not validate. Run a clean pulse before Coach-led reasoning."
    };
  }
  const coreSessionNumber = nextReasoningSessionNumber(state);
  const family = routeClass === "core"
    ? reasoningFamilyForCoreSession(coreSessionNumber)
    : defaultSupportFamily(routeState);
  const plannedBlocks = routeClass === "core" ? REASONING_CORE_BLOCKS : routeClass === "support" ? (routeState === "flat" ? 2 : 1) : 1;
  const itemsPerBlock = routeClass === "core" ? REASONING_CORE_ITEMS : REASONING_SUPPORT_ITEMS;
  return {
    blocked: false,
    id: `reason_${Date.now()}`,
    mode: "coach",
    status: "active",
    routeClass,
    routeState: zoneSnapshot.fresh ? routeState : "not_checked",
    family,
    coreSessionNumber: routeClass === "core" ? coreSessionNumber : null,
    plannedBlocks,
    itemsPerBlock,
    blocksCompleted: 0,
    startedAt: Date.now(),
    updatedAt: Date.now()
  };
}

function selectReasoningPlanForFamily(familyId, familyState, overrides = {}) {
  const meta = REASONING_FAMILIES[familyId];
  const genPlan = typeof meta.generator?.makeBlockPlan === "function"
    ? meta.generator.makeBlockPlan({
      current_tier: familyState.current_tier,
      wrapper_mode: familyState.wrapper_mode,
      speed_mode: familyState.speed_mode,
      recent_accuracy: familyState.recent_accuracy ?? 0.8,
      late_collapse: familyState.late_collapse,
      recent_wrapper_cost: familyState.recent_wrapper_cost,
      ...familyState.metrics
    })
    : {};
  return {
    family: familyId,
    tier: clampTier(overrides.tier === "auto" || overrides.tier === undefined ? (genPlan.nextTier || familyState.current_tier) : overrides.tier),
    wrapper: normalizeWrapper(overrides.wrapper || genPlan.nextWrapperMode || familyState.wrapper_mode),
    speed: normalizeSpeed(overrides.speed || genPlan.nextSpeedMode || familyState.speed_mode),
    subtype: overrides.subtype && overrides.subtype !== "auto" ? overrides.subtype : (genPlan.focusSubtype || familyState.focusSubtype || meta.defaultSubtype),
    priorDecision: genPlan.decision || "HOLD"
  };
}

async function loadBank(familyId) {
  if (bankCache.has(familyId)) return bankCache.get(familyId);
  const meta = REASONING_FAMILIES[familyId];
  const response = await fetch(meta.bankUrl);
  if (!response.ok) throw new Error(`Could not load ${meta.label} item bank`);
  const rows = await response.json();
  bankCache.set(familyId, Array.isArray(rows) ? rows : []);
  return bankCache.get(familyId);
}

function normalizeAnswerIds(item, rng) {
  if (!Array.isArray(item.options)) return item;
  if (item.answer_type === "true_false") return item;
  const originalOptions = item.options.map((option) => ({ ...option }));
  const shuffled = shuffleWithRng(originalOptions, rng);
  const correctOriginal = new Set(item.correct_answer || []);
  const mappedCorrect = [];
  const options = shuffled.map((option, index) => {
    const id = ANSWER_LETTERS[index];
    if (correctOriginal.has(option.id)) mappedCorrect.push(id);
    return { id, text: option.text, originalId: option.id };
  });
  return { ...item, options, correct_answer: mappedCorrect };
}

function prepareItem(item, rng, index, blockId) {
  const publicFields = publicReasoningFields(item);
  const corrected = normalizeRelationFitCorrectAnswers(item);
  const normalized = normalizeAnswerIds({ ...corrected, ...publicFields }, rng);
  return {
    ...normalized,
    runtime_id: `${blockId}_item_${index + 1}`,
    item_index: index
  };
}

function pickRealWorldItems(bank, plan, count, rng, blockId) {
  const familyRows = bank.filter((item) => item.family === plan.family);
  const subtypeRows = familyRows.filter((item) => item.subtype === plan.subtype);
  const pool = subtypeRows.length ? subtypeRows : familyRows;
  const exact = pool.filter((item) => Number(item.difficulty_tier) === plan.tier);
  const near = pool.filter((item) => Math.abs(Number(item.difficulty_tier || 1) - plan.tier) <= 1);
  const candidates = exact.length >= count ? exact : near.length >= count ? near : pool;
  return shuffleWithRng(candidates, rng).slice(0, count).map((item, index) => prepareItem(item, rng, index, blockId));
}

function generateNonsenseItems(plan, count, rng, blockId) {
  const meta = REASONING_FAMILIES[plan.family];
  const generated = meta.generator.generateAdaptiveBlock({
    current_tier: plan.tier,
    wrapper_mode: "nonsense",
    speed_mode: plan.speed,
    focusSubtype: plan.subtype,
    recent_accuracy: 0.9,
    late_collapse: false,
    recent_wrapper_cost: 0
  }, rng);
  const rows = generated.items.filter((item) => !item.placeholder);
  return rows.slice(0, count).map((item, index) => prepareItem(item, rng, index, blockId));
}

export async function buildReasoningBlock({ state, session = null, mode = "coach", manualSettings = null, blockIndex = 0 } = {}) {
  const family = normalizeFamilyId(session?.family || manualSettings?.family || state.settings.family);
  const familyState = normalizeFamilyState(family, state.familyState?.[family]);
  const routeClass = session?.routeClass || (mode === "manual" ? "manual" : "core");
  const support = routeClass === "support" || routeClass === "recovery_light";
  const plan = support
    ? {
      family,
      tier: 1,
      wrapper: "real_world",
      speed: "normal",
      subtype: family === "must_follow" ? "must_follow_tf" : "same_relation_mcq",
      priorDecision: "HOLD"
    }
    : selectReasoningPlanForFamily(family, familyState, mode === "manual" ? manualSettings : {});
  const itemsPerBlock = mode === "manual"
    ? normalizeItemsPerBlock(manualSettings?.itemsPerBlock)
    : Math.max(1, Math.round(numeric(session?.itemsPerBlock, REASONING_CORE_ITEMS)));
  const seed = reasoningSeed([
    session?.id || "manual",
    blockIndex,
    family,
    plan.tier,
    plan.wrapper,
    plan.speed,
    Date.now()
  ]);
  const rng = createSeededRng(seed);
  const blockId = `reason_block_${Date.now()}_${blockIndex + 1}`;
  const bank = await loadBank(family);
  let items;
  if (plan.wrapper === "real_world") {
    items = pickRealWorldItems(bank, plan, itemsPerBlock, rng, blockId);
  } else if (plan.wrapper === "nonsense") {
    items = generateNonsenseItems(plan, itemsPerBlock, rng, blockId);
  } else {
    const realCount = Math.ceil(itemsPerBlock / 2);
    const nonsenseCount = itemsPerBlock - realCount;
    items = [
      ...pickRealWorldItems(bank, plan, realCount, rng, blockId),
      ...generateNonsenseItems(plan, nonsenseCount, rng, blockId)
    ].map((item, index) => ({ ...item, item_index: index, runtime_id: `${blockId}_item_${index + 1}` }));
  }
  return {
    id: blockId,
    sessionId: session?.id || null,
    mode,
    routeClass,
    blockIndex,
    plan,
    seed,
    seedParts: { sessionId: session?.id || null, blockIndex, family, tier: plan.tier, wrapper: plan.wrapper, speed: plan.speed },
    items,
    startedAt: Date.now()
  };
}

export function itemTimeLimitMs(item, speed = "normal") {
  const fast = speed === "fast";
  if (item?.answer_type === "true_false") return (fast ? 7 : 10) * 1000;
  if (item?.answer_type === "multi_select") return (fast ? 13 : 18) * 1000;
  return (fast ? 10 : 14) * 1000;
}

function setsEqual(left, right) {
  if (left.size !== right.size) return false;
  for (const value of left) {
    if (!right.has(value)) return false;
  }
  return true;
}

export function scoreReasoningResponse(item, selectedIds = [], elapsedMs = null, timedOut = false) {
  const correctSet = new Set(item.correct_answer || []);
  const selectedSet = new Set(selectedIds || []);
  const isCorrect = !timedOut && setsEqual(correctSet, selectedSet);
  const truePositives = [...selectedSet].filter((id) => correctSet.has(id)).length;
  const falsePositives = [...selectedSet].filter((id) => !correctSet.has(id)).length;
  const falseNegatives = [...correctSet].filter((id) => !selectedSet.has(id)).length;
  const precision = selectedSet.size ? truePositives / selectedSet.size : (correctSet.size ? 0 : 1);
  const recall = correctSet.size ? truePositives / correctSet.size : 1;
  return {
    itemId: item.id,
    runtimeId: item.runtime_id,
    family: item.family,
    subtype: item.subtype,
    wrapper_type: item.wrapper_type,
    answer_type: item.answer_type,
    selected: [...selectedSet],
    correct: [...correctSet],
    isCorrect,
    timedOut,
    elapsedMs: Number.isFinite(elapsedMs) ? Math.round(elapsedMs) : null,
    precision,
    recall,
    falsePositives,
    falseNegatives,
    isError: !isCorrect
  };
}

function lateCollapse(outcomes) {
  if (!Array.isArray(outcomes) || outcomes.length < 4) return false;
  const midpoint = Math.floor(outcomes.length / 2);
  const first = outcomes.slice(0, midpoint);
  const last = outcomes.slice(midpoint);
  const errorRate = (rows) => rows.filter((row) => row.isError).length / Math.max(1, rows.length);
  return errorRate(last) - errorRate(first) > 0.18;
}

function computeErrorMetrics(block, outcomes) {
  const metrics = {};
  const errors = outcomes.filter((outcome) => outcome.isError);
  const count = Math.max(1, outcomes.length);
  const overreach = outcomes.filter((outcome) => outcome.falsePositives > 0).length / count;
  if (block.plan.family === "relation_fit") {
    metrics.role_reversal_error_rate = errors.filter((outcome) => /role|converse|relation/i.test(String(block.items[outcome.index]?.skill_tags?.join(" ") || ""))).length / count;
    metrics.multi_select_overreach = overreach;
  } else if (block.plan.family === "must_follow") {
    metrics.transitive_reversal_error_rate = errors.filter((outcome) => /transitive|comparative|directional/i.test(String(block.items[outcome.index]?.skill_tags?.join(" ") || ""))).length / count;
    metrics.quantifier_scope_error_rate = errors.filter((outcome) => /quantifier|set/i.test(String(block.items[outcome.index]?.skill_tags?.join(" ") || ""))).length / count;
    metrics.conditional_chain_error_rate = errors.filter((outcome) => /conditional/i.test(String(block.items[outcome.index]?.skill_tags?.join(" ") || ""))).length / count;
    metrics.multi_select_overreach = overreach;
  } else {
    metrics.alternation_confusion_rate = errors.filter((outcome) => /alternation/i.test(String(block.items[outcome.index]?.skill_tags?.join(" ") || ""))).length / count;
    metrics.cycle_confusion_rate = errors.filter((outcome) => /cycle/i.test(String(block.items[outcome.index]?.skill_tags?.join(" ") || ""))).length / count;
    metrics.feature_rule_error_rate = errors.filter((outcome) => /feature/i.test(String(block.items[outcome.index]?.skill_tags?.join(" ") || ""))).length / count;
    metrics.overcommitment_rate = errors.filter((outcome) => /confidence|calibration/i.test(String(block.items[outcome.index]?.skill_tags?.join(" ") || ""))).length / count;
    metrics.multi_select_overreach = overreach;
  }
  return metrics;
}

function transferLabel(total) {
  if (total >= 90) return "Strong";
  if (total >= 75) return "Broadening";
  if (total >= 50) return "Developing";
  if (total >= 25) return "Emerging";
  return "Early";
}

function scoreTransfer(block, outcomes, accuracy, precision, recall, collapse) {
  const avgComplexity = block.items.reduce((sum, item) => (
    sum + numeric(item.binding_load, 1) + numeric(item.uncertainty_level, 1) + numeric(item.control_burden, 1)
  ), 0) / Math.max(1, block.items.length);
  const coreCorrectness = Math.round(clamp(accuracy, 0, 1) * 40);
  const complexityClean = accuracy >= 0.7 && !collapse ? 1 : accuracy >= 0.6 ? 0.55 : 0;
  const complexityHold = Math.round(clamp((avgComplexity / 12) * 20 * complexityClean, 0, 20));
  const timeoutRate = outcomes.filter((outcome) => outcome.timedOut).length / Math.max(1, outcomes.length);
  const timingScore = clamp(1 - (timeoutRate * 2.4) - (collapse ? 0.3 : 0), 0, 1);
  const stabilityEfficiency = Math.round(timingScore * 20);
  const wrapperFactor = block.plan.wrapper === "nonsense" ? 1 : block.plan.wrapper === "mixed" ? 0.75 : 0.35;
  const portabilityBase = Math.min(precision, recall, accuracy);
  const portability = Math.round(clamp(portabilityBase * wrapperFactor * 20, 0, 20));
  const total = Math.round(clamp(coreCorrectness + complexityHold + stabilityEfficiency + portability, 0, 100));
  return { total, coreCorrectness, complexityHold, stabilityEfficiency, portability, label: transferLabel(total) };
}

export function summarizeReasoningBlock(block, outcomesInput = []) {
  const outcomes = outcomesInput.map((outcome, index) => ({ ...outcome, index }));
  const total = Math.max(1, block.items.length);
  const correct = outcomes.filter((outcome) => outcome.isCorrect).length;
  const accuracy = correct / total;
  const collapse = lateCollapse(outcomes);
  const timeouts = outcomes.filter((outcome) => outcome.timedOut).length;
  const multiRows = outcomes.filter((outcome) => block.items[outcome.index]?.answer_type === "multi_select");
  const multiPrecision = multiRows.length ? multiRows.reduce((sum, row) => sum + row.precision, 0) / multiRows.length : 1;
  const multiRecall = multiRows.length ? multiRows.reduce((sum, row) => sum + row.recall, 0) / multiRows.length : 1;
  let decision = "HOLD";
  if (accuracy >= 0.85 && !collapse && multiPrecision >= 0.75 && multiRecall >= 0.75 && timeouts <= 1) {
    decision = "UP";
  } else if (accuracy < 0.7 || collapse || multiPrecision < 0.6 || multiRecall < 0.6 || timeouts > 2) {
    decision = "DOWN";
  }
  const meanRtMs = outcomes
    .filter((outcome) => Number.isFinite(outcome.elapsedMs) && !outcome.timedOut);
  const meanRt = meanRtMs.length
    ? meanRtMs.reduce((sum, outcome) => sum + outcome.elapsedMs, 0) / meanRtMs.length
    : null;
  const transferScore = scoreTransfer(block, outcomes, accuracy, multiPrecision, multiRecall, collapse);
  const metrics = computeErrorMetrics(block, outcomes);
  return {
    id: block.id,
    sessionId: block.sessionId,
    tsStart: block.startedAt,
    tsEnd: Date.now(),
    mode: block.mode,
    routeClass: block.routeClass,
    family: block.plan.family,
    familyLabel: reasoningFamilyLabel(block.plan.family),
    subtype: block.plan.subtype,
    wrapper: block.plan.wrapper,
    speed: block.plan.speed,
    tier: block.plan.tier,
    blockIndex: block.blockIndex,
    items: block.items.length,
    accuracy,
    correct,
    timeouts,
    lateCollapse: collapse,
    multiPrecision,
    multiRecall,
    meanRtMs: Number.isFinite(meanRt) ? Math.round(meanRt) : null,
    decision,
    transferScore,
    errorMetrics: metrics,
    seed: block.seed,
    seedParts: block.seedParts
  };
}

export function updateReasoningFamilyState(state, summary) {
  const next = normalizeReasoningState(state);
  const familyId = normalizeFamilyId(summary.family);
  const current = normalizeFamilyState(familyId, next.familyState[familyId]);
  const exposure = { ...current.wrapperExposure };
  exposure[summary.wrapper] = Math.max(0, Math.round(numeric(exposure[summary.wrapper], 0))) + 1;
  let wrapper = current.wrapper_mode;
  let speed = current.speed_mode;
  let tier = current.current_tier;
  const meta = REASONING_FAMILIES[familyId];
  if (summary.decision === "UP") {
    if (current.wrapper_mode === "real_world") {
      wrapper = "mixed";
    } else if (current.wrapper_mode === "mixed" && exposure.nonsense < Math.max(1, Math.floor(exposure.real_world / 3))) {
      wrapper = "nonsense";
    } else if (current.speed_mode === "normal" && summary.transferScore.stabilityEfficiency >= 16) {
      speed = "fast";
    } else {
      tier = Math.min(5, current.current_tier + 1);
    }
  } else if (summary.decision === "DOWN") {
    wrapper = "real_world";
    speed = "normal";
    tier = Math.max(1, current.current_tier - 1);
  }
  next.familyState[familyId] = {
    ...current,
    current_tier: tier,
    wrapper_mode: wrapper,
    speed_mode: speed,
    focusSubtype: summary.decision === "DOWN" ? meta.defaultSubtype : summary.subtype,
    recent_accuracy: summary.accuracy,
    late_collapse: summary.lateCollapse,
    recent_wrapper_cost: summary.wrapper === "real_world" ? current.recent_wrapper_cost : Math.max(0, 0.85 - summary.accuracy),
    wrapperExposure: exposure,
    metrics: { ...current.metrics, ...summary.errorMetrics }
  };
  return next;
}

export function reasoningGAward(transferScore, summary) {
  const improvement = summary.decision === "UP" ? 1 : 0;
  const portability = summary.wrapper !== "real_world" && summary.accuracy >= 0.8 ? 2 : 0;
  const clean = !summary.lateCollapse && summary.timeouts === 0 ? 1 : 0;
  return Math.round(3 + (0.08 * numeric(transferScore?.total, 0)) + improvement + portability + clean);
}

export function reasoningSessionStats(history = []) {
  const rows = Array.isArray(history) ? history : [];
  const latest = rows[0] || null;
  const avg = (pick) => rows.length ? rows.reduce((sum, row) => sum + numeric(pick(row), 0), 0) / rows.length : 0;
  return {
    latest,
    avgAccuracy: avg((row) => row.accuracy),
    avgTransfer: avg((row) => row.transferScore?.total),
    avgTier: avg((row) => row.tier)
  };
}

export function createTacticCapture(session, fields = {}) {
  return {
    id: `tactic_${Date.now()}`,
    sessionId: session?.id || null,
    family: session?.family || null,
    ts: Date.now(),
    tacticUsed: String(fields.tacticUsed || "").trim(),
    trapToAvoid: String(fields.trapToAvoid || "").trim(),
    takeaway: String(fields.takeaway || "").trim(),
    reusable: fields.reusable === true
  };
}
