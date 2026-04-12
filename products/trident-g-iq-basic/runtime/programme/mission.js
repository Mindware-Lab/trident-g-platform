const FOUNDATION_SEQUENCE = {
  1: "flex",
  2: "resist",
  3: "bind",
  4: "flex",
  5: null
};

export const FAMILY_META = {
  flex: {
    id: "flex",
    label: "Flex",
    entryWrapper: "hub_cat",
    entryTargetModality: "loc",
    ladderLabel: "Known -> Unknown -> Concept"
  },
  bind: {
    id: "bind",
    label: "Bind",
    entryWrapper: "and_cat",
    entryTargetModality: "conj",
    ladderLabel: "Known -> Unknown"
  },
  resist: {
    id: "resist",
    label: "Resist",
    entryWrapper: "resist_vectors",
    entryTargetModality: "loc",
    ladderLabel: "Vectors -> Words -> Concept"
  },
  relate: {
    id: "relate",
    label: "Relate",
    entryWrapper: "relate_vectors",
    entryTargetModality: "rel",
    ladderLabel: "Vectors mono -> Numbers mono -> Dual stretch"
  }
};

const MISSION_RAILS = {
  probe: {
    id: "probe",
    label: "Probe Lab",
    missionLabel: "Diagnose, troubleshoot, investigate",
    puzzleSeed: "Black Box",
    families: [
      { phase: "rail_family_1", familyId: "resist", start: 6, end: 10 },
      { phase: "rail_family_2", familyId: "flex", start: 11, end: 15 },
      { phase: "rail_family_3", familyId: "relate", start: 16, end: 20 }
    ],
    rationale: {
      resist: "Resist suppresses lure-driven wrong reads while diagnosis is still fragile.",
      flex: "Flex helps remap the problem when the first explanation breaks.",
      relate: "Relate supports holding competing explanations and testing them against the same structure."
    }
  },
  constraint: {
    id: "constraint",
    label: "Constraint Lab",
    missionLabel: "Reconstruct, allocate, fit constraints",
    puzzleSeed: "Pattern",
    families: [
      { phase: "rail_family_1", familyId: "flex", start: 6, end: 10 },
      { phase: "rail_family_2", familyId: "bind", start: 11, end: 15 },
      { phase: "rail_family_3", familyId: "relate", start: 16, end: 20 }
    ],
    rationale: {
      flex: "Flex abstracts the real constraint structure away from surface noise.",
      bind: "Bind keeps linked variables and conjunctions active at the same time.",
      relate: "Relate compares higher-order structures once the base constraint map is stable."
    }
  },
  systems: {
    id: "systems",
    label: "Systems Lab",
    missionLabel: "Connect the system, repair workflow, find bottlenecks",
    puzzleSeed: "Bridges",
    families: [
      { phase: "rail_family_1", familyId: "bind", start: 6, end: 10 },
      { phase: "rail_family_2", familyId: "flex", start: 11, end: 15 },
      { phase: "rail_family_3", familyId: "relate", start: 16, end: 20 }
    ],
    rationale: {
      bind: "Bind holds linked nodes and dependencies together while the workflow map is still local.",
      flex: "Flex reframes bottlenecks away from the first local interpretation.",
      relate: "Relate integrates whole-system structure once the workflow picture starts to cohere."
    }
  },
  sequence: {
    id: "sequence",
    label: "Sequence Lab",
    missionLabel: "Plan, sequence, execute, unblock",
    puzzleSeed: "Signpost",
    families: [
      { phase: "rail_family_1", familyId: "flex", start: 6, end: 10 },
      { phase: "rail_family_2", familyId: "resist", start: 11, end: 15 },
      { phase: "rail_family_3", familyId: "relate", start: 16, end: 20 }
    ],
    rationale: {
      flex: "Flex keeps the live next-step frame active while plans update under feedback.",
      resist: "Resist suppresses attractive but wrong next moves.",
      relate: "Relate preserves state-to-state dependencies when the plan has to stay coherent."
    }
  },
  reframe: {
    id: "reframe",
    label: "Reframe Lab",
    missionLabel: "Reframe, compare viewpoints, restructure",
    puzzleSeed: "Galaxies",
    families: [
      { phase: "rail_family_1", familyId: "flex", start: 6, end: 11 },
      { phase: "rail_family_2", familyId: "resist", start: 12, end: 15 },
      { phase: "rail_family_3", familyId: "relate", start: 16, end: 20 }
    ],
    rationale: {
      flex: "Flex drives the remapping and conceptual abstraction needed to break the stale frame.",
      resist: "Resist suppresses the dominant frame long enough for a better one to hold.",
      relate: "Relate preserves deeper invariants while viewpoints or representations change."
    }
  }
};

export const MISSION_RAIL_IDS = Object.freeze(Object.keys(MISSION_RAILS));

function clampCoreSessionNumber(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(20, Math.round(value)));
}

export function normalizeMissionRailId(value) {
  return typeof value === "string" && Object.hasOwn(MISSION_RAILS, value) ? value : null;
}

export function getMissionRailDefinition(missionRailId) {
  const normalized = normalizeMissionRailId(missionRailId);
  return normalized ? MISSION_RAILS[normalized] : null;
}

export function getMissionRailDefinitions() {
  return MISSION_RAIL_IDS.map((id) => MISSION_RAILS[id]);
}

export function familyMeta(familyId) {
  return typeof familyId === "string" && Object.hasOwn(FAMILY_META, familyId) ? FAMILY_META[familyId] : null;
}

export function familyEntryWrapper(familyId) {
  return familyMeta(familyId)?.entryWrapper || "hub_cat";
}

export function familyEntryTargetModality(familyId) {
  return familyMeta(familyId)?.entryTargetModality || "loc";
}

export function nextCoreSessionNumber(programmeState) {
  const countedCore = clampCoreSessionNumber(programmeState?.coreSessionNumber);
  if (countedCore >= 20) {
    return 20;
  }
  return countedCore + 1;
}

export function phaseForCoreSession(missionRailId, coreSessionNumber) {
  const sessionNumber = clampCoreSessionNumber(coreSessionNumber);
  if (sessionNumber <= 5) {
    return "foundation";
  }
  const rail = getMissionRailDefinition(missionRailId);
  if (!rail) {
    return "foundation";
  }
  const match = rail.families.find((item) => sessionNumber >= item.start && sessionNumber <= item.end);
  return match?.phase || "rail_family_3";
}

export function familyForCoreSession(missionRailId, coreSessionNumber) {
  const sessionNumber = clampCoreSessionNumber(coreSessionNumber);
  if (sessionNumber <= 5) {
    return FOUNDATION_SEQUENCE[sessionNumber] ?? null;
  }
  const rail = getMissionRailDefinition(missionRailId);
  if (!rail) {
    return null;
  }
  const match = rail.families.find((item) => sessionNumber >= item.start && sessionNumber <= item.end);
  return match?.familyId || null;
}

export function phaseWindowLabel(phase) {
  if (phase === "rail_family_1") {
    return "Rail family 1";
  }
  if (phase === "rail_family_2") {
    return "Rail family 2";
  }
  if (phase === "rail_family_3") {
    return "Rail family 3";
  }
  return "Foundation";
}

export function familyDisplayLabel(familyId) {
  return familyMeta(familyId)?.label || "Calibration";
}

export function missionFamilyReason(missionRailId, familyId, coreSessionNumber) {
  if (!familyId) {
    return "Foundation session 5 is a branch-confirmation and bottleneck readout. It does not open a second mission choice.";
  }
  if (clampCoreSessionNumber(coreSessionNumber) <= 5) {
    if (familyId === "flex") {
      return "Foundation Flex establishes the remapping grammar before the rail branches.";
    }
    if (familyId === "resist") {
      return "Foundation Resist checks lure suppression before the branch starts.";
    }
    if (familyId === "bind") {
      return "Foundation Bind checks linked-feature holding before the mission rail opens.";
    }
  }
  const rail = getMissionRailDefinition(missionRailId);
  return rail?.rationale?.[familyId] || "";
}

export function missionProgressForState(programmeState) {
  const countedCore = clampCoreSessionNumber(programmeState?.coreSessionNumber);
  const missionRailId = normalizeMissionRailId(programmeState?.missionRailId);
  const rail = getMissionRailDefinition(missionRailId);

  const progress = {
    foundation: { completed: Math.min(countedCore, 5), total: 5 },
    rail_family_1: { completed: 0, total: rail ? (rail.families[0].end - rail.families[0].start + 1) : 5 },
    rail_family_2: { completed: 0, total: rail ? (rail.families[1].end - rail.families[1].start + 1) : 5 },
    rail_family_3: { completed: 0, total: rail ? (rail.families[2].end - rail.families[2].start + 1) : 5 }
  };

  if (countedCore > 5) {
    progress.rail_family_1.completed = Math.min(countedCore, rail?.families?.[0]?.end || 10) - 5;
  }
  if (countedCore > (rail?.families?.[1]?.start || 11) - 1) {
    progress.rail_family_2.completed = Math.max(0, Math.min(countedCore, rail?.families?.[1]?.end || 15) - (rail?.families?.[1]?.start || 11) + 1);
  }
  if (countedCore > (rail?.families?.[2]?.start || 16) - 1) {
    progress.rail_family_3.completed = Math.max(0, Math.min(countedCore, rail?.families?.[2]?.end || 20) - (rail?.families?.[2]?.start || 16) + 1);
  }

  return progress;
}

export function deriveProgrammeView(programmeState) {
  const missionRailId = normalizeMissionRailId(programmeState?.missionRailId);
  const countedCore = clampCoreSessionNumber(programmeState?.coreSessionNumber);
  const complete = programmeState?.programmeComplete === true || countedCore >= 20;
  const nextCore = complete ? 20 : nextCoreSessionNumber(programmeState);
  const currentRailPhase = phaseForCoreSession(missionRailId, nextCore);
  const currentFamilyId = familyForCoreSession(missionRailId, nextCore);

  return {
    missionRailId,
    mission: getMissionRailDefinition(missionRailId),
    nextCoreSessionNumber: nextCore,
    currentRailPhase,
    currentFamilyId,
    missionProgress: missionProgressForState({ ...programmeState, missionRailId, coreSessionNumber: countedCore }),
    currentFamilyReason: missionFamilyReason(missionRailId, currentFamilyId, nextCore)
  };
}
