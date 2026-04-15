export const REASONING_FAMILY_IDS = Object.freeze([
  "probe",
  "constraint",
  "systems",
  "sequence",
  "reframe"
]);

export const REASONING_MODE_IDS = Object.freeze({
  BEST_EXPLANATION: "best_explanation",
  UPDATE_MODEL: "update_model",
  BEST_NEXT_CHECK: "best_next_check"
});

export const REASONING_NODE_IDS = Object.freeze({
  probe_best_explanation: "probe_best_explanation",
  probe_update_model: "probe_update_model",
  probe_best_next_check: "probe_best_next_check",
  constraint_must_follow: "constraint_must_follow",
  constraint_fit_constraints: "constraint_fit_constraints",
  constraint_eliminate_impossible: "constraint_eliminate_impossible",
  systems_find_bottleneck: "systems_find_bottleneck",
  systems_broken_link: "systems_broken_link",
  systems_follows_system: "systems_follows_system",
  sequence_what_next: "sequence_what_next",
  sequence_order_works: "sequence_order_works",
  sequence_best_next_step: "sequence_best_next_step",
  reframe_same_structure: "reframe_same_structure",
  reframe_true_analogy: "reframe_true_analogy",
  reframe_changed_and_same: "reframe_changed_and_same"
});

export const reasoningFamilies = Object.freeze([
  {
    id: "probe",
    label: "Probe Gym",
    missionLabel: "Diagnose, troubleshoot, investigate",
    modes: [
      {
        id: REASONING_NODE_IDS.probe_best_explanation,
        familyId: "probe",
        modeId: REASONING_MODE_IDS.BEST_EXPLANATION,
        label: "Best Explanation",
        shortLabel: "Abductive fit",
        overview:
          "Choose the explanation that best fits the whole pattern while resisting vivid but partial lures."
      },
      {
        id: REASONING_NODE_IDS.probe_update_model,
        familyId: "probe",
        modeId: REASONING_MODE_IDS.UPDATE_MODEL,
        label: "Update the Model",
        shortLabel: "Revision pressure",
        overview:
          "Revise an earlier explanation when later evidence changes the balance. Visible here, but locked in v1."
      },
      {
        id: REASONING_NODE_IDS.probe_best_next_check,
        familyId: "probe",
        modeId: REASONING_MODE_IDS.BEST_NEXT_CHECK,
        label: "Best Next Check",
        shortLabel: "VOI probe",
        overview:
          "Choose the next check that best separates the live explanations without wasting probe value."
      }
    ]
  },
  {
    id: "constraint",
    label: "Constraint Gym",
    missionLabel: "Reconstruct, allocate, fit constraints",
    modes: [
      {
        id: REASONING_NODE_IDS.constraint_must_follow,
        familyId: "constraint",
        modeId: "must_follow",
        label: "Must Follow?",
        shortLabel: "Constraint logic",
        overview: "Constraint-family mode locked in v1."
      },
      {
        id: REASONING_NODE_IDS.constraint_fit_constraints,
        familyId: "constraint",
        modeId: "fit_constraints",
        label: "Which Option Fits All Constraints?",
        shortLabel: "Fit all",
        overview: "Constraint-family mode locked in v1."
      },
      {
        id: REASONING_NODE_IDS.constraint_eliminate_impossible,
        familyId: "constraint",
        modeId: "eliminate_impossible",
        label: "Eliminate the Impossible",
        shortLabel: "Prune impossible",
        overview: "Constraint-family mode locked in v1."
      }
    ]
  },
  {
    id: "systems",
    label: "Systems Gym",
    missionLabel: "Connect the system, repair workflow, find bottlenecks",
    modes: [
      {
        id: REASONING_NODE_IDS.systems_find_bottleneck,
        familyId: "systems",
        modeId: "find_bottleneck",
        label: "Find the Bottleneck",
        shortLabel: "Flow block",
        overview: "Systems-family mode locked in v1."
      },
      {
        id: REASONING_NODE_IDS.systems_broken_link,
        familyId: "systems",
        modeId: "broken_link",
        label: "Which Link Is Broken?",
        shortLabel: "Broken link",
        overview: "Systems-family mode locked in v1."
      },
      {
        id: REASONING_NODE_IDS.systems_follows_system,
        familyId: "systems",
        modeId: "follows_system",
        label: "What Follows Through the System?",
        shortLabel: "Follow through",
        overview: "Systems-family mode locked in v1."
      }
    ]
  },
  {
    id: "sequence",
    label: "Sequence Gym",
    missionLabel: "Plan, sequence, execute, unblock",
    modes: [
      {
        id: REASONING_NODE_IDS.sequence_what_next,
        familyId: "sequence",
        modeId: "what_next",
        label: "What Comes Next?",
        shortLabel: "Next state",
        overview: "Sequence-family mode locked in v1."
      },
      {
        id: REASONING_NODE_IDS.sequence_order_works,
        familyId: "sequence",
        modeId: "order_works",
        label: "Which Order Works?",
        shortLabel: "Order fit",
        overview: "Sequence-family mode locked in v1."
      },
      {
        id: REASONING_NODE_IDS.sequence_best_next_step,
        familyId: "sequence",
        modeId: "best_next_step",
        label: "Best Next Step",
        shortLabel: "Action pick",
        overview: "Sequence-family mode locked in v1."
      }
    ]
  },
  {
    id: "reframe",
    label: "Reframe Gym",
    missionLabel: "Reframe, compare viewpoints, restructure",
    modes: [
      {
        id: REASONING_NODE_IDS.reframe_same_structure,
        familyId: "reframe",
        modeId: "same_structure",
        label: "Same Structure, New Surface",
        shortLabel: "Preserve structure",
        overview: "Reframe-family mode locked in v1."
      },
      {
        id: REASONING_NODE_IDS.reframe_true_analogy,
        familyId: "reframe",
        modeId: "true_analogy",
        label: "Which Analogy Really Fits?",
        shortLabel: "True analogy",
        overview: "Reframe-family mode locked in v1."
      },
      {
        id: REASONING_NODE_IDS.reframe_changed_and_same,
        familyId: "reframe",
        modeId: "changed_and_same",
        label: "What Changed And What Stayed The Same?",
        shortLabel: "Change map",
        overview: "Reframe-family mode locked in v1."
      }
    ]
  }
]);

const reasoningNodeMap = new Map(
  reasoningFamilies.flatMap((family) => family.modes.map((mode) => [mode.id, { ...mode, familyLabel: family.label, missionLabel: family.missionLabel }]))
);

export const reasoningInitialUnlockedNodeIds = Object.freeze([
  REASONING_NODE_IDS.probe_best_explanation
]);

export function getReasoningFamilies() {
  return reasoningFamilies;
}

export function getReasoningNode(nodeId) {
  return reasoningNodeMap.get(nodeId) || null;
}

export function getReasoningModeNode(modeId) {
  return reasoningFamilies
    .flatMap((family) => family.modes)
    .find((mode) => mode.modeId === modeId) || null;
}
