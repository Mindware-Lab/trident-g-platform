import { renderTelemetryCards } from "../../../trident-g-iq-shared/runtime/telemetry.js";
import {
  HUB_BASE_TRIALS,
  HUB_CUE_MS,
  HUB_N_MAX,
  HUB_PRELOAD_ASSETS,
  createHubBlockPlan,
  createHubBlockTrials,
  displayHubTargetLabel,
  isHubMatchAtIndex,
  summarizeHubBlock
} from "./hub-engine.js";
import { hash32 } from "./rng.js";
import {
  appendCapacityLabHistory,
  appendCapacityLabSessionResolution,
  clearCapacityLabCurrentSession,
  clearCapacityLabHistory,
  loadCapacityLabState,
  updateCapacityLabCurrentSession,
  updateCapacityLabSettings
} from "./sandbox-storage.js";
import {
  familyDisplayLabel,
  familyEntryTargetModality,
  familyEntryWrapper,
  missionFamilyReason,
  phaseWindowLabel
} from "../programme/mission.js";
import {
  loadProgrammeState,
  recordProgrammeResolution
} from "../programme/storage.js";
import { loadLatestZoneHandoff } from "../zone/storage.js";
import {
  initAudio,
  playSfx,
  setAudioEnabled,
  unlockAudioContextFromUserGesture
} from "./audio.js";

const PREVIEW_MARKERS = [
  { xPct: 50, yPct: 8 },
  { xPct: 92, yPct: 50 },
  { xPct: 50, yPct: 92 },
  { xPct: 8, yPct: 50 }
];

const WRAPPER_GROUPS = {
  flex: ["hub_cat", "hub_noncat", "hub_concept"],
  bind: ["and_cat", "and_noncat"],
  resist: ["resist_vectors", "resist_words", "resist_concept"],
  emotion: ["emotion_faces", "emotion_words"],
  relate: ["relate_vectors", "relate_numbers", "relate_vectors_dual", "relate_numbers_dual"]
};

const CAPACITY_TREE_FAMILIES = [
  {
    id: "flex",
    label: "Flex",
    variants: [
      { wrapper: "hub_cat", label: "Known" },
      { wrapper: "hub_noncat", label: "Unknown" },
      { wrapper: "hub_concept", label: "Concept" }
    ]
  },
  {
    id: "bind",
    label: "Bind",
    variants: [
      { wrapper: "and_cat", label: "Known" },
      { wrapper: "and_noncat", label: "Unknown" }
    ]
  },
  {
    id: "resist",
    label: "Resist",
    variants: [
      { wrapper: "resist_vectors", label: "Vectors" },
      { wrapper: "resist_words", label: "Words" },
      { wrapper: "resist_concept", label: "Concept" }
    ]
  },
  {
    id: "emotion",
    label: "Emotion",
    variants: [
      { wrapper: "emotion_faces", label: "Faces" },
      { wrapper: "emotion_words", label: "Words" }
    ]
  },
  {
    id: "relate",
    label: "Relate",
    variants: [
      { wrapper: "relate_vectors", label: "Vectors mono" },
      { wrapper: "relate_numbers", label: "Numbers mono" },
      { wrapper: "relate_vectors_dual", label: "Vectors dual" },
      { wrapper: "relate_numbers_dual", label: "Numbers dual" }
    ]
  }
];

const LIVE_WRAPPERS = new Set([
  "hub_cat",
  "hub_noncat",
  "hub_concept",
  "and_cat",
  "and_noncat",
  "resist_vectors",
  "resist_words",
  "resist_concept",
  "emotion_faces",
  "emotion_words",
  "relate_vectors",
  "relate_numbers",
  "relate_vectors_dual",
  "relate_numbers_dual"
]);

function preloadImageUrls(urls) {
  if (typeof Image === "undefined") {
    return;
  }
  urls.forEach((url) => {
    if (!url) return;
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = url;
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapperLabel(wrapper) {
  if (wrapper === "hub_noncat") {
    return "Flex unknown";
  }
  if (wrapper === "hub_concept") {
    return "Flex concept";
  }
  if (wrapper === "and_cat") {
    return "Bind known";
  }
  if (wrapper === "and_noncat") {
    return "Bind unknown";
  }
  if (wrapper === "resist_vectors") {
    return "Resist vectors";
  }
  if (wrapper === "resist_words") {
    return "Resist words";
  }
  if (wrapper === "resist_concept") {
    return "Resist concept";
  }
  if (wrapper === "emotion_faces") {
    return "Emotion faces";
  }
  if (wrapper === "emotion_words") {
    return "Emotion words";
  }
  if (wrapper === "relate_vectors") {
    return "Relate vectors mono";
  }
  if (wrapper === "relate_numbers") {
    return "Relate numbers mono";
  }
  if (wrapper === "relate_vectors_dual") {
    return "Relate vectors dual";
  }
  if (wrapper === "relate_numbers_dual") {
    return "Relate numbers dual";
  }
  return "Flex known";
}

function speedLabel(speed) {
  return speed === "fast" ? "Fast pace" : "Slow pace";
}

function modeLabel(mode) {
  return mode === "coach" ? "Coach guided" : "You choose";
}

function modalityLabel(targetModality, wrapper) {
  const label = displayHubTargetLabel(targetModality, wrapper).toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function modalityMark(targetModality, wrapper) {
  if (targetModality === "dual") {
    return "\u2295";
  }
  if (typeof wrapper === "string" && wrapperFamily(wrapper) === "relate") {
    return targetModality === "sym" ? "\u2197" : "\u21c4";
  }
  if (targetModality === "rel") {
    return "\u21c4";
  }
  if (targetModality === "col") {
    return "\u25d0";
  }
  if (targetModality === "sym") {
    return "\u2726";
  }
  if (targetModality === "conj") {
    return "\u2227";
  }
  return "\u25ce";
}

function accuracyPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function formatRt(value) {
  return Number.isFinite(value) ? `${Math.round(value)} ms` : "--";
}

function clampN(value) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.min(HUB_N_MAX, Math.round(value)));
}

function wrapperFamily(wrapper) {
  if (wrapper.startsWith("and_")) {
    return "bind";
  }
  if (wrapper.startsWith("resist_")) {
    return "resist";
  }
  if (wrapper.startsWith("emotion_")) {
    return "emotion";
  }
  if (wrapper.startsWith("relate_")) {
    return "relate";
  }
  return "flex";
}

function familyWrappers(wrapper) {
  return WRAPPER_GROUPS[wrapperFamily(wrapper)] || WRAPPER_GROUPS.flex;
}

function familyDefaultTarget(wrapper) {
  if (wrapperFamily(wrapper) === "bind") {
    return "conj";
  }
  if (wrapper === "relate_vectors_dual" || wrapper === "relate_numbers_dual") {
    return "dual";
  }
  if (wrapperFamily(wrapper) === "relate") {
    return "rel";
  }
  if (wrapper === "resist_words") {
    return "col";
  }
  if (wrapper === "resist_concept") {
    return "loc";
  }
  if (wrapper === "emotion_faces") {
    return "loc";
  }
  if (wrapper === "emotion_words") {
    return "col";
  }
  if (wrapperFamily(wrapper) === "resist") {
    return "loc";
  }
  return "loc";
}

function isRelateDualWrapper(wrapper) {
  return wrapper === "relate_vectors_dual" || wrapper === "relate_numbers_dual";
}

function isFixedTargetWrapper(wrapper) {
  return wrapperFamily(wrapper) === "bind" || isRelateDualWrapper(wrapper);
}

function isTargetAllowedForWrapper(wrapper, targetModality) {
  if (wrapper.startsWith("and_")) {
    return targetModality === "conj";
  }
  if (wrapper === "relate_vectors" || wrapper === "relate_numbers") {
    return targetModality === "rel" || targetModality === "sym";
  }
  if (isRelateDualWrapper(wrapper)) {
    return targetModality === "dual";
  }
  if (wrapper === "resist_vectors" || wrapper === "resist_concept") {
    return targetModality === "loc" || targetModality === "sym";
  }
  if (wrapper === "resist_words" || wrapper === "emotion_words") {
    return targetModality === "col" || targetModality === "sym";
  }
  if (wrapper === "emotion_faces") {
    return targetModality === "loc" || targetModality === "sym";
  }
  return targetModality === "loc" || targetModality === "col" || targetModality === "sym";
}

function relateSecondaryLabel(wrapper) {
  if (wrapper === "relate_vectors" || wrapper === "relate_vectors_dual") {
    return "Orientation";
  }
  if (wrapper === "relate_numbers" || wrapper === "relate_numbers_dual") {
    return "Direction";
  }
  return "Symbol";
}

function nextWrapper(current) {
  const order = familyWrappers(current);
  const index = Math.max(0, order.indexOf(current));
  return order[(index + 1) % order.length];
}

function blockEndN(entry) {
  return clampN(entry?.block?.nEnd ?? entry?.block?.nStart ?? 1);
}

function entryRewardMode(entry) {
  return typeof entry?.rewardMode === "string" ? entry.rewardMode : "core";
}

function progressionHistory(history) {
  return history.filter((entry) => entryRewardMode(entry) === "core");
}

function familyProgressionHistory(history, familyId) {
  return progressionHistory(history).filter((entry) => wrapperFamily(entry.wrapper) === familyId);
}

function stableRun(entries, { minCount = 3, minAccuracy = 0.85, minN = 1 } = {}) {
  const recent = entries.slice(0, minCount);
  return recent.length >= minCount && recent.every((entry) => Number(entry?.block?.accuracy || 0) >= minAccuracy && blockEndN(entry) >= minN);
}

function wrapperCompetence(entries) {
  return stableRun(entries, { minCount: 3, minAccuracy: 0.85, minN: 2 });
}

function familyWrapperOrder(familyId) {
  return WRAPPER_GROUPS[familyId] || WRAPPER_GROUPS.flex;
}

function foundationCalibrationFamily(uiState) {
  const candidates = ["flex", "resist", "bind"];
  const scores = candidates.map((familyId) => {
    const entries = familyProgressionHistory(uiState.history, familyId);
    const stable = computeStableLevel(entries) || 0;
    return {
      familyId,
      stable,
      count: entries.length
    };
  });

  scores.sort((left, right) => {
    if (left.stable !== right.stable) {
      return left.stable - right.stable;
    }
    if (left.count !== right.count) {
      return left.count - right.count;
    }
    return candidates.indexOf(left.familyId) - candidates.indexOf(right.familyId);
  });

  return scores[0]?.familyId || "flex";
}

function currentProgrammeFamilyId(uiState) {
  if (!uiState.programme) {
    return null;
  }
  return uiState.programme.currentFamilyId || (uiState.programme.nextCoreSessionNumber === 5 ? foundationCalibrationFamily(uiState) : null);
}

function missionRailLabel(uiState) {
  return uiState.programme?.mission?.label || "Probe Lab";
}

function missionPhaseLabel(uiState) {
  return phaseWindowLabel(uiState.programme?.currentRailPhase);
}

function missionFamilyLabel(uiState) {
  if (uiState.programme?.currentFamilyId) {
    return familyDisplayLabel(uiState.programme.currentFamilyId);
  }
  if (uiState.programme?.nextCoreSessionNumber === 5) {
    return "Calibration";
  }
  return "--";
}

function missionBranchFamilyLabel(uiState, index = 0) {
  const familyId = uiState.programme?.mission?.families?.[index]?.familyId;
  return familyId ? familyDisplayLabel(familyId) : "--";
}

function coachRouteTitle(uiState, guidedPlan) {
  if (uiState.settings.mode !== "coach") {
    return guidedPlan ? `${routeClassLabel(guidedPlan.routeClass)} route` : "Games";
  }
  if (uiState.programme?.currentRailPhase === "foundation") {
    return `${missionRailLabel(uiState)} / shared foundation / next ${missionBranchFamilyLabel(uiState, 0)}`;
  }
  return `${missionRailLabel(uiState)} / ${missionPhaseLabel(uiState)} / ${missionFamilyLabel(uiState)}`;
}

function currentSessionEntries(history, sessionId) {
  return history.filter((entry) => entry.sessionId === sessionId).slice().reverse();
}

function hasResolvedSession(sessionResolutions, sessionId) {
  return sessionResolutions.some((entry) => entry.sessionId === sessionId);
}

function freshZoneHandoff(uiState) {
  const handoff = uiState.zoneHandoff;
  if (!handoff || handoff.freshForSession === false) {
    return null;
  }
  if (uiState.currentSession?.sessionId === handoff.sessionId) {
    return handoff;
  }
  if (hasResolvedSession(uiState.sessionResolutions, handoff.sessionId)) {
    return null;
  }
  return handoff;
}

function createGuidedSession(handoff, missionRailId = null) {
  if (!handoff?.capacityPlan) {
    return null;
  }
  return {
    sessionId: handoff.sessionId,
    missionRailId,
    zoneState: handoff.state,
    uiState: handoff.uiState,
    recommendation: handoff.recommendation,
    routeClass: handoff.capacityPlan.routeClass,
    defaultBlocks: handoff.capacityPlan.defaultBlocks,
    blocksMin: handoff.capacityPlan.blocksMin,
    blocksMax: handoff.capacityPlan.blocksMax,
    plannedBlocks: handoff.capacityPlan.defaultBlocks,
    blocksCompleted: 0,
    progressionMode: handoff.capacityPlan.progressionMode,
    swapPolicy: handoff.capacityPlan.swapPolicy,
    focusBias: handoff.capacityPlan.focusBias,
    preferredFamilies: handoff.capacityPlan.preferredFamilies.slice(),
    blockedFamilies: handoff.capacityPlan.blockedFamilies.slice(),
    blockedModes: handoff.capacityPlan.blockedModes.slice(),
    rewardMode: handoff.capacityPlan.rewardMode,
    eligibleForEncoding20: handoff.capacityPlan.eligibleForEncoding20 === true,
    startedAt: Date.now()
  };
}

function currentSessionMatchesMission(uiState) {
  const missionRailId = uiState.programme?.missionRailId || null;
  const sessionMissionRailId = uiState.currentSession?.missionRailId || null;
  return Boolean(missionRailId) && sessionMissionRailId === missionRailId;
}

function activeGuidedPlan(uiState) {
  if (uiState.currentSession && currentSessionMatchesMission(uiState)) {
    return uiState.currentSession;
  }
  if (uiState.settings.mode !== "coach") {
    return null;
  }
  const handoff = freshZoneHandoff(uiState);
  return handoff ? createGuidedSession(handoff, uiState.programme?.missionRailId || null) : null;
}

function routeClassLabel(routeClass) {
  if (routeClass === "core") {
    return "Core";
  }
  if (routeClass === "support") {
    return "Support";
  }
  return "Recovery";
}

function rewardModeLabel(rewardMode) {
  if (rewardMode === "reset_only") {
    return "Reset only";
  }
  if (rewardMode === "support") {
    return "Support";
  }
  if (rewardMode === "core") {
    return "Core";
  }
  return "None";
}

function familyAllowedByPlan(familyId, plan) {
  return !plan?.blockedFamilies?.includes(familyId);
}

function wrapperAllowedByPlan(wrapper, plan) {
  return familyAllowedByPlan(wrapperFamily(wrapper), plan);
}

function computeCoachFamilyProgress(history) {
  const eligibleHistory = progressionHistory(history);
  const progress = new Map(CAPACITY_TREE_FAMILIES.map((family) => [family.id, {
    stableWrappers: new Set(),
    stableRelateTargets: new Set(),
    hasFastConfirm: false,
    hasSwapHold: false
  }]));
  const chronological = eligibleHistory.slice().reverse();
  let prev = null;

  chronological.forEach((entry, index) => {
    const familyId = wrapperFamily(entry.wrapper);
    const familyProgress = progress.get(familyId);
    if (!familyProgress) {
      prev = entry;
      return;
    }

    const recentHistory = chronological.slice(0, index + 1).reverse();
    const stableLevel = computeStableLevel(recentHistory);
    const consistencyOk = stableLevel !== null;
    const accuracy = Number(entry?.block?.accuracy || 0);
    const nEnd = blockEndN(entry);
    const stable3Ok = consistencyOk && stableLevel >= 3 && accuracy >= 0.85 && nEnd >= 3;

    if (stable3Ok) {
      if (familyId === "relate" && (entry.wrapper === "relate_vectors" || entry.wrapper === "relate_numbers")) {
        const recentTargetHistory = recentHistory.filter((candidate) => candidate.wrapper === entry.wrapper && candidate.targetModality === entry.targetModality);
        const targetStableLevel = computeStableLevel(recentTargetHistory);
        const targetStable3Ok = targetStableLevel !== null && targetStableLevel >= 3 && accuracy >= 0.85 && nEnd >= 3;
        if (targetStable3Ok) {
          familyProgress.stableRelateTargets.add(`${entry.wrapper}:${entry.targetModality}`);
        }
        if (
          familyProgress.stableRelateTargets.has(`${entry.wrapper}:rel`)
          && familyProgress.stableRelateTargets.has(`${entry.wrapper}:sym`)
        ) {
          familyProgress.stableWrappers.add(entry.wrapper);
        }
      } else {
        familyProgress.stableWrappers.add(entry.wrapper);
      }
    }
    if (entry.speed === "fast" && stable3Ok) {
      familyProgress.hasFastConfirm = true;
    }
    if (
      prev
      && wrapperFamily(prev.wrapper) === familyId
      && prev.wrapper !== entry.wrapper
      && consistencyOk
      && accuracy >= 0.85
      && nEnd >= Math.max(1, blockEndN(prev) - 1)
    ) {
      familyProgress.hasSwapHold = true;
    }

    prev = entry;
  });

  return progress;
}

function isCoachFamilyMastered(familyId, progress) {
  const family = CAPACITY_TREE_FAMILIES.find((entry) => entry.id === familyId);
  const familyProgress = progress.get(familyId);
  if (!family || !familyProgress) {
    return false;
  }

  const requiredWrappers = family.variants.map((variant) => variant.wrapper);
  if (!requiredWrappers.length) {
    return false;
  }

  return requiredWrappers.every((wrapper) => familyProgress.stableWrappers.has(wrapper))
    && familyProgress.hasFastConfirm
    && familyProgress.hasSwapHold;
}

function computeCoachUnlockState(history) {
  const progress = computeCoachFamilyProgress(history);
  const mastered = new Set(
    CAPACITY_TREE_FAMILIES
      .map((family) => family.id)
      .filter((familyId) => isCoachFamilyMastered(familyId, progress))
  );
  const unlocked = new Set(["flex"]);

  if (mastered.has("flex")) {
    unlocked.add("bind");
  }
  if (mastered.has("flex") && mastered.has("bind")) {
    unlocked.add("resist");
  }
  if (mastered.has("flex") && mastered.has("bind") && mastered.has("resist")) {
    unlocked.add("emotion");
    unlocked.add("relate");
  }

  return { unlocked, mastered };
}

function latestHistoryEntries(history, predicate, count = 3) {
  return history.filter(predicate).slice(0, count);
}

function hasRelateMonoCompetence(history, wrapper) {
  const eligible = progressionHistory(history);
  const relationEntries = latestHistoryEntries(eligible, (entry) => entry.wrapper === wrapper && entry.targetModality === "rel");
  const surfaceEntries = latestHistoryEntries(eligible, (entry) => entry.wrapper === wrapper && entry.targetModality === "sym");
  if (relationEntries.length < 3 || surfaceEntries.length < 3) {
    return false;
  }
  const trackOk = (entries) => entries.every((entry) => Number(entry?.block?.accuracy || 0) >= 0.75 && blockEndN(entry) >= 2);
  return trackOk(relationEntries) && trackOk(surfaceEntries);
}

function hasRelateDualCompetence(history, wrapper) {
  const eligible = progressionHistory(history);
  const dualEntries = latestHistoryEntries(eligible, (entry) => entry.wrapper === wrapper && entry.targetModality === "dual");
  if (dualEntries.length < 3) {
    return false;
  }
  return dualEntries.every((entry) => blockEndN(entry) >= 2 && Number(entry?.block?.accuracyRel || 0) >= 0.75 && Number(entry?.block?.accuracySym || 0) >= 0.75);
}

function computeUnlockedVariantWrappers(uiState, unlockedFamilies) {
  const unlocked = new Set();
  CAPACITY_TREE_FAMILIES.forEach((family) => {
    if (!unlockedFamilies.has(family.id)) {
      return;
    }
    if (family.id !== "relate") {
      family.variants.forEach((variant) => {
        if (LIVE_WRAPPERS.has(variant.wrapper)) {
          unlocked.add(variant.wrapper);
        }
      });
      return;
    }

    unlocked.add("relate_vectors");
    if (hasRelateMonoCompetence(uiState.history, "relate_vectors")) {
      unlocked.add("relate_numbers");
    }
    if (hasRelateMonoCompetence(uiState.history, "relate_numbers")) {
      unlocked.add("relate_vectors_dual");
    }
    if (hasRelateDualCompetence(uiState.history, "relate_vectors_dual")) {
      unlocked.add("relate_numbers_dual");
    }
  });
  return unlocked;
}

function firstWrapperForFamily(familyId) {
  const family = CAPACITY_TREE_FAMILIES.find((entry) => entry.id === familyId);
  return family?.variants?.[0]?.wrapper || "hub_cat";
}

function resolveCapacityTreeWrapper(uiState, unlockedFamilies, unlockedWrappers) {
  if (uiState.activeBlock?.plan?.wrapper && unlockedWrappers.has(uiState.activeBlock.plan.wrapper)) {
    return uiState.activeBlock.plan.wrapper;
  }
  if (uiState.settings.mode !== "coach") {
    return uiState.settings.wrapper;
  }

  const recommended = recommendSettings(uiState);
  if (recommended?.wrapper && unlockedWrappers.has(recommended.wrapper)) {
    return recommended.wrapper;
  }
  if (unlockedWrappers.has(uiState.settings.wrapper)) {
    return uiState.settings.wrapper;
  }
  if (uiState.lastSavedEntry?.wrapper && unlockedWrappers.has(uiState.lastSavedEntry.wrapper)) {
    return uiState.lastSavedEntry.wrapper;
  }

  const firstUnlockedFamily = CAPACITY_TREE_FAMILIES.find((family) => unlockedFamilies.has(family.id));
  return firstWrapperForFamily(firstUnlockedFamily?.id || "flex");
}

function renderCapacityGamesPanel(uiState) {
  const guidedPlan = activeGuidedPlan(uiState);
  const routeTitle = coachRouteTitle(uiState, guidedPlan);
  const unlockedFamilies = uiState.settings.mode === "coach"
    ? computeCoachUnlockState(uiState.history).unlocked
    : new Set(CAPACITY_TREE_FAMILIES.map((family) => family.id));
  const unlockedWrappers = uiState.settings.mode === "coach"
    ? computeUnlockedVariantWrappers(uiState, unlockedFamilies)
    : new Set(LIVE_WRAPPERS);
  const visibleFamilies = new Set(
    Array.from(unlockedFamilies).filter((familyId) => familyAllowedByPlan(familyId, guidedPlan))
  );
  const visibleWrappers = new Set(
    Array.from(unlockedWrappers).filter((wrapper) => wrapperAllowedByPlan(wrapper, guidedPlan))
  );
  const activeWrapper = resolveCapacityTreeWrapper(
    uiState,
    visibleFamilies.size ? visibleFamilies : unlockedFamilies,
    visibleWrappers.size ? visibleWrappers : unlockedWrappers
  );
  const activeFamily = wrapperFamily(activeWrapper);

  return `
    <div class="capacity-games-title">Capacity</div>
    <div class="capacity-games-title">${escapeHtml(routeTitle)}</div>
    <div class="capacity-games-tree">
      ${CAPACITY_TREE_FAMILIES.map((family) => {
        const unlocked = visibleFamilies.has(family.id);
        const currentFamily = family.id === activeFamily && unlocked;
        const familyClass = `capacity-games-family ${unlocked ? "is-unlocked" : "is-locked"}${currentFamily ? " is-current" : ""}`;
        const familyDotClass = `capacity-games-family-dot${currentFamily ? " is-current" : unlocked ? " is-unlocked" : ""}`;

        return `
          <div class="${familyClass}">
            <div class="capacity-games-family-row">
              <span class="capacity-games-family-name">${escapeHtml(family.label)}</span>
              <span class="${familyDotClass}" aria-hidden="true"></span>
            </div>
            <div class="capacity-games-variants">
              ${family.variants.map((variant) => {
                const currentVariant = variant.wrapper === activeWrapper;
                const variantUnlocked = unlocked && visibleWrappers.has(variant.wrapper);
                const variantClass = `capacity-games-variant ${variantUnlocked ? "is-unlocked" : "is-locked"}${currentVariant ? " is-current" : ""}`;
                const variantDotClass = `capacity-games-variant-dot${currentVariant ? " is-current" : variantUnlocked ? " is-unlocked" : ""}`;
                return `
                  <button
                    class="${variantClass}"
                    type="button"
                    data-capacity-tree-wrapper="${variant.wrapper}"
                    aria-pressed="${currentVariant ? "true" : "false"}"
                    aria-label="Select ${escapeHtml(wrapperLabel(variant.wrapper))}"
                    ${variantUnlocked ? "" : "disabled"}
                  >
                    <span class="${variantDotClass}" aria-hidden="true"></span>
                    <span>${escapeHtml(variant.label)}</span>
                  </button>
                `;
              }).join("")}
            </div>
          </div>
        `;
      }).join("")}
    </div>
    <div class="capacity-games-legend">
      <div><span class="capacity-games-legend-dot is-unlocked"></span>Unlocked</div>
      <div><span class="capacity-games-legend-dot"></span>Locked</div>
      <div><span class="capacity-games-legend-dot is-current"></span>Active</div>
    </div>
  `;
}

function baselineRecommendationForWrapper(wrapper) {
  if (wrapperFamily(wrapper) === "bind") {
    return {
      wrapper: "and_cat",
      targetModality: "conj",
      speed: "slow",
      n: 1,
      reason: "Start with the simplest Bind wrapper to establish a stable baseline."
    };
  }
  if (wrapperFamily(wrapper) === "resist") {
    return {
      wrapper: "resist_vectors",
      targetModality: "loc",
      speed: "slow",
      n: 1,
      reason: "Start with the first Resist wrapper and location tracking to establish a stable baseline."
    };
  }
  if (wrapperFamily(wrapper) === "emotion") {
    const useWords = wrapper === "emotion_words";
    return {
      wrapper: useWords ? "emotion_words" : "emotion_faces",
      targetModality: useWords ? "col" : "loc",
      speed: "slow",
      n: 1,
      reason: useWords
        ? "Start with emotion words and ink colour tracking to establish a baseline."
        : "Start with emotion faces and location tracking to establish a baseline."
    };
  }
  if (wrapperFamily(wrapper) === "relate") {
    const resolvedWrapper = wrapper === "relate_numbers" || wrapper === "relate_vectors_dual" || wrapper === "relate_numbers_dual"
      ? wrapper
      : "relate_vectors";
    return {
      wrapper: resolvedWrapper,
      targetModality: familyDefaultTarget(resolvedWrapper),
      speed: "slow",
      n: 1,
      reason: resolvedWrapper === "relate_numbers"
        ? "Start with the numbers mono block to establish a stable relational baseline."
        : resolvedWrapper === "relate_vectors_dual"
          ? "Start with the vectors dual block to establish a stable relational baseline."
          : resolvedWrapper === "relate_numbers_dual"
            ? "Start with the numbers dual block to establish a stable relational baseline."
            : "Start with the vectors mono block to establish a stable relational baseline."
    };
  }
  return {
    wrapper: "hub_cat",
    targetModality: "loc",
    speed: "slow",
    n: 1,
    reason: "Start with the simplest wrapper to establish a stable baseline."
  };
}

function baselineRecommendationForFamily(familyId) {
  const entryWrapper = familyEntryWrapper(familyId);
  return {
    wrapper: entryWrapper,
    targetModality: familyEntryTargetModality(familyId),
    speed: "slow",
    n: 1,
    reason: `Start ${familyDisplayLabel(familyId).toLowerCase()} on its entry wrapper before portability or speed pressure opens.`
  };
}

function recommendCoreProgressionSettings(uiState, familyId) {
  const resolvedFamilyId = familyId || currentProgrammeFamilyId(uiState) || wrapperFamily(uiState.settings.wrapper);
  const familyHistory = familyProgressionHistory(uiState.history, resolvedFamilyId);
  const last = familyHistory[0];

  if (!last) {
    return baselineRecommendationForFamily(resolvedFamilyId);
  }

  const lastWrapper = last.wrapper || familyEntryWrapper(resolvedFamilyId);
  const lastTarget = last.targetModality || familyEntryTargetModality(resolvedFamilyId);
  const lastSpeed = last.speed || "slow";
  const lastN = clampN(last.block?.nEnd ?? last.block?.nStart ?? 1);
  const currentWrapperHistory = familyHistory.filter((entry) => entry.wrapper === lastWrapper);
  const lastThreeFamily = familyHistory.slice(0, 3);
  const averageAccuracy = lastThreeFamily.length
    ? lastThreeFamily.reduce((sum, entry) => sum + Number(entry?.block?.accuracy || 0), 0) / lastThreeFamily.length
    : Number(last?.block?.accuracy || 0);
  const drop = averageAccuracy < 0.75;

  if (drop) {
    return {
      wrapper: lastWrapper,
      targetModality: isFixedTargetWrapper(lastWrapper) ? familyDefaultTarget(lastWrapper) : lastTarget,
      speed: "slow",
      n: clampN(lastN - 1),
      reason: "Stability dipped. Lower the load and slow the pace before reopening the family ladder."
    };
  }

  if (lastN < 2) {
    if (stableRun(currentWrapperHistory, { minCount: 3, minAccuracy: 0.85, minN: 1 })) {
      return {
        wrapper: lastWrapper,
        targetModality: isFixedTargetWrapper(lastWrapper) ? familyDefaultTarget(lastWrapper) : lastTarget,
        speed: "slow",
        n: 2,
        reason: "Reach 2-back on the entry wrapper first. Swap, speed, and higher-n choices stay closed at n-1."
      };
    }
    return {
      wrapper: lastWrapper,
      targetModality: isFixedTargetWrapper(lastWrapper) ? familyDefaultTarget(lastWrapper) : lastTarget,
      speed: "slow",
      n: 1,
      reason: "Hold the entry wrapper at slow pace until the family is clean enough to establish 2-back."
    };
  }

  if (!stableRun(currentWrapperHistory, { minCount: 3, minAccuracy: 0.85, minN: 2 })) {
    return {
      wrapper: lastWrapper,
      targetModality: isFixedTargetWrapper(lastWrapper) ? familyDefaultTarget(lastWrapper) : lastTarget,
      speed: "slow",
      n: lastN,
      reason: "Hold the current wrapper at 2-back or above until three stable blocks unlock portability choices."
    };
  }

  const wrapperOrder = familyWrapperOrder(resolvedFamilyId);
  const competentWrappers = new Set(wrapperOrder.filter((wrapper) => wrapperCompetence(familyHistory.filter((entry) => entry.wrapper === wrapper))));
  const dualUnlocked = resolvedFamilyId !== "relate"
    || (competentWrappers.has("relate_vectors") && competentWrappers.has("relate_numbers"));
  const eligibleOrder = resolvedFamilyId === "relate" && !dualUnlocked
    ? ["relate_vectors", "relate_numbers"]
    : wrapperOrder;
  const nextUnmasteredWrapper = eligibleOrder.find((wrapper) => !competentWrappers.has(wrapper));

  if (nextUnmasteredWrapper && nextUnmasteredWrapper !== lastWrapper) {
    return {
      wrapper: nextUnmasteredWrapper,
      targetModality: familyDefaultTarget(nextUnmasteredWrapper),
      speed: "slow",
      n: Math.max(2, lastN),
      reason: resolvedFamilyId === "relate" && !dualUnlocked
        ? "Relate mono competence opens first. Carry the level into the next mono wrapper before any dual push."
        : "Portability opens first. Carry the current level into the next wrapper before speed or higher-n pressure."
    };
  }

  if (lastSpeed === "slow") {
    return {
      wrapper: lastWrapper,
      targetModality: isFixedTargetWrapper(lastWrapper) ? familyDefaultTarget(lastWrapper) : lastTarget,
      speed: "fast",
      n: lastN,
      reason: "Wrapper portability held. Confirm robustness under faster timing next."
    };
  }

  if (lastSpeed === "fast") {
    return {
      wrapper: lastWrapper,
      targetModality: isFixedTargetWrapper(lastWrapper) ? familyDefaultTarget(lastWrapper) : lastTarget,
      speed: "fast",
      n: clampN(lastN + 1),
      reason: "Wrapper and fast pace held. Increase n now."
    };
  }

  return {
    wrapper: lastWrapper,
    targetModality: isFixedTargetWrapper(lastWrapper) ? familyDefaultTarget(lastWrapper) : lastTarget,
    speed: lastSpeed,
    n: lastN,
    reason: "Hold the current family settings to keep the rail stable."
  };
}

function preferredWrapperForGuidedPlan(plan, history, indexInSession = 0) {
  const last = history[0];
  if (plan.focusBias === "stabilise") {
    return "hub_cat";
  }
  if (plan.focusBias === "activate_then_stabilise") {
    if (last && (wrapperFamily(last.wrapper) === "flex" || wrapperFamily(last.wrapper) === "bind")) {
      return wrapperAllowedByPlan(last.wrapper, plan) ? last.wrapper : "hub_cat";
    }
    return "hub_cat";
  }
  if (plan.focusBias === "flexibility_reset") {
    const rotation = ["hub_noncat", "hub_concept", "resist_vectors"];
    const next = rotation[indexInSession % rotation.length];
    return wrapperAllowedByPlan(next, plan) ? next : "hub_noncat";
  }
  if (last && wrapperAllowedByPlan(last.wrapper, plan)) {
    return last.wrapper;
  }
  return "hub_cat";
}

function guidedTargetForWrapper(wrapper) {
  if (isFixedTargetWrapper(wrapper)) {
    return familyDefaultTarget(wrapper);
  }
  if (wrapper === "hub_cat" || wrapper === "hub_noncat" || wrapper === "hub_concept") {
    return "loc";
  }
  return familyDefaultTarget(wrapper);
}

function recommendGuidedSettings(uiState, plan) {
  if (!plan) {
    return null;
  }
  const history = uiState.history;
  const progression = progressionHistory(history);
  const lastAny = history[0];
  const lastCore = progression[0];
  const stable = computeStableLevel(progression) || 1;
  const sessionIndex = plan.blocksCompleted || 0;

  if (plan.routeClass === "core") {
    const familyId = currentProgrammeFamilyId(uiState);
    if (!familyId) {
      return null;
    }
    return {
      ...recommendCoreProgressionSettings(uiState, familyId),
      familyId
    };
  }

  if (plan.routeClass === "recovery") {
    return {
      wrapper: "hub_cat",
      targetModality: "loc",
      speed: "slow",
      n: 1,
      reason: "No guided Capacity route is available from an invalid Zone check."
    };
  }

  if (plan.focusBias === "stabilise") {
    return {
      wrapper: "hub_cat",
      targetModality: "loc",
      speed: "slow",
      n: Math.max(1, stable - 1),
      reason: "Spun Out route: keep the simplest stable wrapper, slow pace, and lower load."
    };
  }

  if (plan.focusBias === "activate_then_stabilise") {
    const wrapper = preferredWrapperForGuidedPlan(plan, history, sessionIndex);
    return {
      wrapper,
      targetModality: guidedTargetForWrapper(wrapper),
      speed: "slow",
      n: clampN(lastCore ? blockEndN(lastCore) : 1),
      reason: "Flat route: stay with lighter established core families, no speed push, no n increase."
    };
  }

  const wrapper = preferredWrapperForGuidedPlan(plan, history, sessionIndex);
  const lastN = clampN(lastAny ? blockEndN(lastAny) : stable);
  return {
    wrapper,
    targetModality: guidedTargetForWrapper(wrapper),
    speed: "slow",
    n: lastN,
    reason: "Locked In route: hold level, force a wrapper shift, and reward flexibility instead of pressure."
  };
}

function recommendSettings(uiState) {
  if (uiState.settings.mode === "coach") {
    const plan = activeGuidedPlan(uiState);
    if (!plan) {
      return null;
    }
    return recommendGuidedSettings(uiState, plan);
  }

  return {
    wrapper: uiState.settings.wrapper,
    targetModality: uiState.settings.targetModality,
    speed: uiState.settings.speed,
    n: uiState.settings.n,
    reason: "Manual open play uses your current sandbox settings and never counts toward the core route."
  };
}

function buildCoachMessage(uiState, recommendation) {
  if (!recommendation) {
    return "Run Zone Coach first to open a guided session, or switch to manual open play. Manual blocks never count toward the 20-session encode route.";
  }
  const mission = uiState.programme?.mission;
  const missionPrefix = uiState.settings.mode === "coach" && mission
    ? `${mission.label} · ${missionPhaseLabel(uiState)} · ${missionFamilyLabel(uiState)}. ${uiState.programme?.currentFamilyReason || ""} `
    : "";
  return `${missionPrefix}The recommended option for guided training is ${wrapperLabel(recommendation.wrapper)} ${modalityLabel(recommendation.targetModality, recommendation.wrapper)}, N-${recommendation.n}, ${speedLabel(recommendation.speed)}. ${recommendation.reason}`.trim();
}

function sparkPoints(history) {
  const values = history.slice(0, 8).map((entry) => Number(entry?.block?.accuracy || 0) * 100).reverse();
  if (!values.length) {
    return "2,22 168,22";
  }
  if (values.length === 1) {
    const y = 26 - ((values[0] / 100) * 20);
    return `2,${y.toFixed(1)} 168,${y.toFixed(1)}`;
  }
  return values.map((value, index) => {
    const x = 2 + ((166 / (values.length - 1)) * index);
    const y = 26 - ((value / 100) * 20);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

const REWARD_EVENTS = {
  SESSION_GOOD: { tridents: 40, max: 20 },
  SESSION_FAST_FINISH: { tridents: 20, max: 20 },
  SESSION_PERSONAL_BEST_AVG: { tridents: 40, max: 10 },
  SESSION_PERSONAL_BEST_STABLE: { tridents: 40, max: 10 },
  SAME_FAMILY_SWAP_HOLD: { tridents: 100, max: 9 },
  VARIANT_FAST_3_MASTERED: { tridents: 200, max: 9 },
  FAMILY_FAST_3_MASTERED: { tridents: 600, max: 3 },
  TRANSFER_READINESS_EMERGING: { tridents: 150, max: 1 },
  TRANSFER_READINESS_DEVELOPING: { tridents: 300, max: 1 },
  TRANSFER_READINESS_BROADENING: { tridents: 450, max: 1 },
  TRANSFER_READINESS_STRONG: { tridents: 600, max: 1 },
  CAPACITY_GYM_CHALLENGE_20_COMPLETED: { tridents: 2000, max: 1 },
  FREE_COACHING_SESSION_VOUCHER: { tridents: 0, max: 1 }
};

const ECONOMY = {
  CURRENT_VARIANT_COUNT: 9,
  CHALLENGE_SESSION_LIMIT: 20
};

function computeStableLevel(history) {
  const recent = history.slice(0, 3);
  if (!recent.length) return null;
  const avgAcc = recent.reduce((sum, entry) => sum + Number(entry?.block?.accuracy || 0), 0) / recent.length;
  if (avgAcc < 0.85) return null;
  const avgN = recent.reduce((sum, entry) => sum + clampN(entry?.block?.nEnd ?? entry?.block?.nStart ?? 1), 0) / recent.length;
  return Math.round(avgN);
}

function computeRewardTimeline(history) {
  const eligibleHistory = progressionHistory(history);
  const events = [];
  const counters = new Map();
  const best = {
    sessionAvgAcc: 0,
    stableLevel: 0
  };
  const variantFast3 = new Set();
  const wrappersFast3 = new Set();
  const transferStages = new Set();
  let challengeAwarded = false;
  const sessionAcc = [];
  let sessionIndex = 1;
  let sessionBlock = 0;

  const chronological = eligibleHistory.slice().reverse();
  let prev = null;
  chronological.forEach((entry, index) => {
    const block = entry.block || {};
    const accuracy = Number(block.accuracy || 0);
    const nEnd = clampN(block.nEnd ?? block.nStart ?? 1);
    const speed = entry.speed || "slow";
    sessionBlock += 1;
    sessionAcc.push(accuracy);

    const recentHistory = chronological.slice(0, index + 1).reverse();
    const consistencyOk = computeStableLevel(recentHistory) !== null;

    if (accuracy >= 0.9 && consistencyOk) {
      events.push({ name: "SESSION_GOOD", blockIndex: index, sessionIndex });
    }
    if (speed === "fast" && accuracy >= 0.85 && consistencyOk) {
      events.push({ name: "SESSION_FAST_FINISH", blockIndex: index, sessionIndex });
      if (!transferStages.has("DEVELOPING")) {
        transferStages.add("DEVELOPING");
        events.push({ name: "TRANSFER_READINESS_DEVELOPING", blockIndex: index, sessionIndex });
      }
    }

    if (prev && prev.wrapper !== entry.wrapper && consistencyOk) {
      const prevN = clampN(prev.block?.nEnd ?? prev.block?.nStart ?? 1);
      if (accuracy >= 0.85 && nEnd >= prevN - 1) {
        events.push({ name: "SAME_FAMILY_SWAP_HOLD", blockIndex: index, sessionIndex });
        if (!transferStages.has("EMERGING")) {
          transferStages.add("EMERGING");
          events.push({ name: "TRANSFER_READINESS_EMERGING", blockIndex: index, sessionIndex });
        }
      }
    }

    if (speed === "fast" && nEnd >= 3 && accuracy >= 0.9 && consistencyOk) {
      const variantKey = `${entry.wrapper}:${entry.targetModality}`;
      if (!variantFast3.has(variantKey)) {
        variantFast3.add(variantKey);
        events.push({ name: "VARIANT_FAST_3_MASTERED", blockIndex: index, sessionIndex });
        if (!transferStages.has("BROADENING")) {
          transferStages.add("BROADENING");
          events.push({ name: "TRANSFER_READINESS_BROADENING", blockIndex: index, sessionIndex });
        }
      }
      wrappersFast3.add(entry.wrapper);
    }

    if (wrappersFast3.size === 3) {
      if (!transferStages.has("FAMILY") && consistencyOk) {
        transferStages.add("FAMILY");
        events.push({ name: "FAMILY_FAST_3_MASTERED", blockIndex: index, sessionIndex });
        if (!transferStages.has("STRONG")) {
          transferStages.add("STRONG");
          events.push({ name: "TRANSFER_READINESS_STRONG", blockIndex: index, sessionIndex });
        }
      }
    }

    if (!challengeAwarded && variantFast3.size >= ECONOMY.CURRENT_VARIANT_COUNT) {
      if (sessionIndex <= ECONOMY.CHALLENGE_SESSION_LIMIT) {
        challengeAwarded = true;
        events.push({ name: "CAPACITY_GYM_CHALLENGE_20_COMPLETED", blockIndex: index, sessionIndex });
        events.push({ name: "FREE_COACHING_SESSION_VOUCHER", blockIndex: index, sessionIndex });
      }
    }

    const stableLevel = computeStableLevel(recentHistory);
    if (stableLevel && stableLevel > best.stableLevel) {
      best.stableLevel = stableLevel;
      events.push({ name: "SESSION_PERSONAL_BEST_STABLE", blockIndex: index, sessionIndex });
    }

    if (sessionBlock === 10) {
      const avgAcc = sessionAcc.reduce((sum, value) => sum + value, 0) / sessionAcc.length;
      if (avgAcc > best.sessionAvgAcc + 0.01 && consistencyOk) {
        best.sessionAvgAcc = avgAcc;
        events.push({ name: "SESSION_PERSONAL_BEST_AVG", blockIndex: index, sessionIndex });
      }
      sessionAcc.length = 0;
      sessionBlock = 0;
      sessionIndex += 1;
    }

    prev = entry;
  });

  // Apply max awards
  const awarded = new Map();
  const filtered = [];
  events.forEach((event) => {
    const rule = REWARD_EVENTS[event.name];
    if (!rule) return;
    const count = awarded.get(event.name) || 0;
    if (count >= rule.max) return;
    awarded.set(event.name, count + 1);
    filtered.push(event);
  });

  return filtered;
}

function computeRewards(history) {
  const timeline = computeRewardTimeline(history);
  const totals = timeline.reduce((sum, event) => sum + (REWARD_EVENTS[event.name]?.tridents || 0), 0);
  return { timeline, totalTridents: totals };
}

function transferReadinessLabel(events) {
  if (events.some((event) => event.name === "TRANSFER_READINESS_STRONG")) return "Strong";
  if (events.some((event) => event.name === "TRANSFER_READINESS_BROADENING")) return "Broadening";
  if (events.some((event) => event.name === "TRANSFER_READINESS_DEVELOPING")) return "Developing";
  if (events.some((event) => event.name === "TRANSFER_READINESS_EMERGING")) return "Emerging";
  return null;
}

function lastBlockSummary(entry) {
  const block = entry?.block;
  if (!block) {
    return { accuracy: null, correct: null, total: null, outcome: null };
  }
  const correct = Number(block.hits || 0) + Number(block.correctRejections || 0);
  return {
    accuracy: Number(block.accuracy || 0),
    correct,
    total: Number(block.trials || 0),
    outcome: entry?.outcomeBand || null
  };
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : "--";
}

function safeValue(value) {
  return value === null || value === undefined || value === "" ? "--" : value;
}

function sessionBlockIndex(history, activeBlock) {
  const completed = history.length;
  const progress = completed % 10;
  const current = progress + (activeBlock ? 1 : 0);
  return current || 0;
}

function sessionHistory(history) {
  const progress = history.length % 10;
  return history.slice(0, progress);
}

function nextBlockHint(recommendation, lastEntry) {
  if (!recommendation) return "Hold";
  if (!lastEntry) return "Baseline";
  if (recommendation.wrapper !== lastEntry.wrapper) return "Wrapper swap";
  if (recommendation.speed !== lastEntry.speed) return "Speed pressure";
  if (recommendation.n > (lastEntry.block?.nEnd ?? lastEntry.block?.nStart ?? 1)) return "N increase";
  return "Hold";
}

function createCurrentSessionRecord(handoff) {
  const session = createGuidedSession(handoff, loadProgrammeState().missionRailId || null);
  if (!session) {
    return null;
  }
  const persisted = updateCapacityLabCurrentSession(session);
  return persisted.currentSession;
}

function sessionIntegrityFailure(entries) {
  if (!entries.length) {
    return "No completed blocks were recorded for this session.";
  }
  const lastThree = entries.slice(-3);
  const lastThreeAvg = lastThree.reduce((sum, entry) => sum + Number(entry?.block?.accuracy || 0), 0) / lastThree.length;
  const unstableLastThree = lastThree.some((entry) => Number(entry?.block?.accuracy || 0) < 0.75);
  const severeLateCollapse = lastThreeAvg < 0.75;
  const heavyLapses = entries.some((entry) => Number(entry?.block?.lapseCount || 0) >= 4);
  const heavyBursts = entries.some((entry) => Number(entry?.block?.errorBursts || 0) >= 2);

  if (unstableLastThree) {
    return "Last-3-block consistency collapsed below the encode threshold.";
  }
  if (severeLateCollapse) {
    return "Late-session collapse made the run a poor encoding repetition.";
  }
  if (heavyLapses) {
    return "Major lapse burden broke session integrity.";
  }
  if (heavyBursts) {
    return "Error bursts made the session unstable.";
  }
  return null;
}

function resolveSessionOutcome(session, history) {
  const entries = currentSessionEntries(history, session.sessionId);
  const completed = entries.length;
  const integrityFailure = session.routeClass === "core" && session.eligibleForEncoding20 && completed >= session.plannedBlocks
    ? sessionIntegrityFailure(entries)
    : null;
  const counted = session.routeClass === "core"
    && session.eligibleForEncoding20
    && completed >= session.plannedBlocks
    && !integrityFailure;
  return {
    sessionId: session.sessionId,
    countedAsEncoding20: counted,
    sessionClassResolved: session.routeClass,
    coreCreditsEarned: counted ? 1 : 0,
    supportCreditsEarned: session.routeClass === "support" ? 1 : 0,
    resetCreditsEarned: session.rewardMode === "reset_only" ? 1 : 0,
    reasonIfNotCounted: counted
      ? null
      : integrityFailure || (session.routeClass === "core"
        ? "Core eligibility was present, but the session did not finish cleanly enough to count."
        : "Support and reset routes never count toward the 20-session encode phase."),
    zoneState: session.zoneState,
    rewardMode: session.rewardMode,
    blocksPlanned: session.plannedBlocks,
    blocksCompleted: completed,
    createdAt: Date.now()
  };
}

function historyRows(history) {
  return history.slice(0, 4).map((entry) => `
    <div class="capacity-lab-history-row">
      <span>${escapeHtml(wrapperLabel(entry.wrapper))} ${escapeHtml(modalityLabel(entry.targetModality, entry.wrapper))}</span>
      <span>${accuracyPercent(entry.block.accuracy)}</span>
    </div>
  `).join("");
}

export const capacityLabTelemetrySeed = [
  {
    label: "Scores",
    labelClass: "metric-label--credit",
    emphasis: true,
    html: `
      <div class="capacity-sandbox-rail">
        <div class="capacity-sandbox-card capacity-sandbox-card--today" data-sandbox-today>
          <div class="capacity-sandbox-title">Today</div>
          <div class="capacity-sandbox-reward">
            <div class="capacity-sandbox-reward-coin" aria-hidden="true"></div>
            <div>
              <div class="capacity-sandbox-reward-label">Tridents</div>
              <div class="capacity-sandbox-reward-value">--</div>
              <div class="capacity-sandbox-reward-sub">Session reward</div>
            </div>
          </div>
        </div>

        <div class="capacity-sandbox-card capacity-sandbox-card--session">
          <div class="capacity-sandbox-title">Session performance</div>
          <div class="capacity-sandbox-row">
            <span data-sandbox-session-block>--</span>
            <span data-sandbox-session-counted>--</span>
          </div>
          <div class="capacity-sandbox-progress">
            <span style="width:0%;" data-sandbox-session-progress></span>
          </div>
          <div class="capacity-sandbox-grid">
            <div>
              <div class="capacity-sandbox-label">Session average</div>
              <div class="capacity-sandbox-value" data-sandbox-session-average>--</div>
            </div>
            <div>
              <div class="capacity-sandbox-label">Transfer readiness</div>
              <div class="capacity-sandbox-pill" data-sandbox-transfer>--</div>
            </div>
            <div>
              <div class="capacity-sandbox-label">Stable level</div>
              <div class="capacity-sandbox-value" data-sandbox-stable>--</div>
            </div>
            <div>
              <div class="capacity-sandbox-label">Pressure status</div>
              <div class="capacity-sandbox-value" data-sandbox-pressure>--</div>
            </div>
          </div>
        </div>

        <div class="capacity-sandbox-card capacity-sandbox-card--game">
          <div class="capacity-sandbox-title">Game performance</div>
          <div class="capacity-sandbox-grid capacity-sandbox-grid--dual">
            <div>
              <div class="capacity-sandbox-label">Next block</div>
              <div class="capacity-sandbox-value" data-sandbox-next>--</div>
              <div class="capacity-sandbox-subline" data-sandbox-next-note>--</div>
            </div>
            <div>
              <div class="capacity-sandbox-label">Last block</div>
              <div class="capacity-sandbox-value" data-sandbox-last-accuracy>--</div>
              <div class="capacity-sandbox-pill capacity-sandbox-pill--result" data-sandbox-last-result>--</div>
            </div>
          </div>
          <div class="capacity-sandbox-row">
            <span>Last accuracy</span>
            <span data-sandbox-last-correct>--</span>
          </div>
          <div class="capacity-sandbox-trend">
            <div class="capacity-sandbox-label">Accuracy over blocks</div>
            <svg viewBox="0 0 170 30" preserveAspectRatio="none" aria-hidden="true">
              <polyline fill="none" stroke="rgba(245, 181, 68, 0.96)" stroke-width="2.6" points="2,22 168,22" data-sandbox-spark></polyline>
            </svg>
          </div>
        </div>
      </div>
    `
  }
];

function createUiState() {
  const persisted = loadCapacityLabState();
  const programme = loadProgrammeState();
  return {
    settings: { ...persisted.settings },
    history: persisted.history.slice(),
    currentSession: persisted.currentSession ? { ...persisted.currentSession } : null,
    sessionResolutions: Array.isArray(persisted.sessionResolutions) ? persisted.sessionResolutions.slice() : [],
    programme,
    zoneHandoff: loadLatestZoneHandoff(),
    status: "idle",
    activeBlock: null,
    activeMessage: "Run Zone Coach first for a guided session, or switch to manual open play.",
    coachMessage: "Guided mode now follows the selected mission rail and counted core-session rules. Manual mode remains open play and never counts toward the 20-session core route.",
    lastSavedEntry: persisted.history[0] || null
  };
}

function telemetryCards() {
  return capacityLabTelemetrySeed;
}

function renderRelateVectorTokenMarkup(token, visible) {
  const point = token?.pointPct || { xPct: 50, yPct: 50 };
  const rotationDeg = Number(token?.angleDeg || 0) + 90;

  return `
    <div class="capacity-hub-token capacity-hub-token--relate${visible ? "" : " is-hidden"}" style="left:${point.xPct}%;top:${point.yPct}%;">
      <svg class="capacity-relate-arrow" viewBox="0 0 48 48" aria-hidden="true" style="transform:rotate(${rotationDeg}deg);">
        <path d="M24 6 39 23H30V42H18V23H9L24 6Z"></path>
      </svg>
    </div>
  `;
}

function renderRelateNumberTokenMarkup(token, visible, isVisibleNow) {
  const point = token?.pointPct || { xPct: 50, yPct: 50 };
  return `
    <div class="capacity-hub-token capacity-hub-token--relate-number${visible && isVisibleNow ? "" : " is-hidden"}" style="left:${point.xPct}%;top:${point.yPct}%;">
      <span class="capacity-relate-number-value">${escapeHtml(token?.value ?? "")}</span>
    </div>
  `;
}

function trialSequenceGapMs(trial) {
  return Number.isFinite(trial?.display?.sequenceGapMs)
    ? Math.max(0, Math.round(trial.display.sequenceGapMs))
    : 0;
}

function isMatchWindowOpen(uiState) {
  const active = uiState.activeBlock;
  if (!active || uiState.status !== "trial") {
    return false;
  }
  if (active.plan?.targetModality === "dual") {
    if (active.responseRelCaptured && active.responseSymCaptured) {
      return false;
    }
  } else if (active.responseCaptured) {
    return false;
  }

  const trial = active.trials[active.trialIndex];
  const sequenceGapMs = trialSequenceGapMs(trial);
  return !sequenceGapMs || active.trialVisualStage >= 2;
}

function arenaMarkup(uiState) {
  const active = uiState.activeBlock;
  const trial = active && active.trialIndex >= 0 ? active.trials[active.trialIndex] : null;
  const points = active?.renderMapping?.markerPositions?.length ? active.renderMapping.markerPositions : PREVIEW_MARKERS;
  const wrapperForMarkers = active?.plan?.wrapper || uiState.settings.wrapper;
  const hideMarkers = wrapperForMarkers === "hub_noncat"
    || wrapperForMarkers === "hub_concept"
    || wrapperForMarkers === "and_noncat"
    || wrapperForMarkers === "resist_words"
    || wrapperForMarkers === "emotion_words"
    || wrapperForMarkers === "resist_concept";
  const markers = hideMarkers
    ? ""
    : points.map((point) => `<span class="capacity-hub-marker" style="left:${point.xPct}%;top:${point.yPct}%;"></span>`).join("");
  const point = trial?.display?.pointPct || (trial && points[trial.locIdx] ? points[trial.locIdx] : { xPct: 50, yPct: 50 });
  const visible = Boolean(trial && (uiState.status === "trial" || uiState.status === "paused") && active.stimulusVisible);
  const background = visible ? String(trial?.display?.colourHex || "#ffffff") : "transparent";
  const fallbackTextColor = String(trial?.display?.colourHex || "").toLowerCase() === "#ffffff" ? "#102033" : "#ffffff";
  const textColor = trial?.display?.textHex || fallbackTextColor;
  const shapeColor = trial?.display?.colourHex || "#ffffff";
  const activeWrapper = active?.plan?.wrapper || uiState.settings.wrapper;
  const isRelateVectorWrapper = activeWrapper === "relate_vectors" || activeWrapper === "relate_vectors_dual";
  const isRelateNumbersWrapper = activeWrapper === "relate_numbers" || activeWrapper === "relate_numbers_dual";
  const isWordWrapper = activeWrapper === "resist_words" || activeWrapper === "emotion_words";
  let token = "";
  const isShape = Boolean(trial?.display?.symbolSvgPath);
  if (visible) {
    if (trial?.display?.symbolImageUrl) {
      token = `<img src="${escapeHtml(trial.display.symbolImageUrl)}" alt="">`;
    } else if (trial?.display?.symbolSvgPath) {
      const rounded = trial.display.symbolSvgRounded ? " is-rounded" : "";
      token = `<svg class="capacity-hub-symbol${rounded}" viewBox="-1 -1 2 2" aria-hidden="true"><path d="${trial.display.symbolSvgPath}" /></svg>`;
    } else {
      token = escapeHtml(trial?.display?.symbolLabel || "");
    }
  }
  const fontFamily = trial?.display?.symbolFontFamily ? `font-family:${trial.display.symbolFontFamily};` : "";
  const fontWeight = trial?.display?.symbolFontWeight ? `font-weight:${trial.display.symbolFontWeight};` : "";
  const fontStyle = trial?.display?.symbolFontStyle ? `font-style:${trial.display.symbolFontStyle};` : "";
  const tokenChrome = isWordWrapper ? "background:transparent;border:0;border-radius:0;box-shadow:none;" : "";

  const wrapperClass = activeWrapper === "hub_noncat"
    ? "is-noncat"
    : activeWrapper === "hub_concept"
      ? "is-concept"
      : activeWrapper === "resist_vectors"
        ? "is-resist"
      : activeWrapper === "resist_words"
        ? "is-resist is-resist-words"
      : activeWrapper === "emotion_words"
        ? "is-resist is-resist-words"
      : activeWrapper === "resist_concept"
        ? "is-resist is-resist-concept"
      : isRelateVectorWrapper || isRelateNumbersWrapper
        ? "is-relate"
      : activeWrapper?.startsWith("and_")
        ? (activeWrapper === "and_noncat" ? "is-and is-and-remap" : "is-and")
        : "is-cat";

  if (isRelateVectorWrapper) {
    const relationTokens = Array.isArray(trial?.display?.pairTokens)
      ? trial.display.pairTokens.map((token) => renderRelateVectorTokenMarkup(token, visible)).join("")
      : "";

    return `
      <div class="capacity-hub-arena ${wrapperClass}${uiState.status === "paused" ? " is-paused" : ""}">
        <div class="capacity-hub-ring"></div>
        ${markers}
        ${relationTokens}
      </div>
    `;
  }

  if (isRelateNumbersWrapper) {
    const showFirst = Boolean(visible && active?.trialVisualStage >= 1);
    const showSecond = Boolean(visible && active?.trialVisualStage >= 2);
    return `
      <div class="capacity-hub-arena ${wrapperClass}${uiState.status === "paused" ? " is-paused" : ""}">
        <div class="capacity-hub-ring"></div>
        ${markers}
        ${trial ? renderRelateNumberTokenMarkup(trial.display.firstToken, visible, showFirst) : ""}
        ${trial ? renderRelateNumberTokenMarkup(trial.display.secondToken, visible, showSecond) : ""}
      </div>
    `;
  }

  return `
    <div class="capacity-hub-arena ${wrapperClass}${uiState.status === "paused" ? " is-paused" : ""}">
      <div class="capacity-hub-ring"></div>
      ${markers}
      <div class="capacity-hub-token${visible ? "" : " is-hidden"}${isShape ? " is-shape" : ""}${isWordWrapper ? " is-word" : ""}" style="left:${point.xPct}%;top:${point.yPct}%;background:${isShape || isWordWrapper ? "transparent" : background};color:${visible ? (isShape || isWordWrapper ? shapeColor : textColor) : "transparent"};${tokenChrome}${fontFamily}${fontWeight}${fontStyle}">${token}</div>
    </div>
  `;
}

function setupMarkup(uiState) {
  const last = uiState.lastSavedEntry;
  const statusLabel = uiState.status === "result" ? "Saved" : "Ready";
  const family = wrapperFamily(uiState.settings.wrapper);
  const programme = uiState.programme;
  const guidedPlan = activeGuidedPlan(uiState);
  const guidedStartDisabled = uiState.settings.mode === "coach" && (!guidedPlan || guidedPlan.routeClass === "recovery");
  const guidedStatusTitle = guidedPlan
    ? `${routeClassLabel(guidedPlan.routeClass)} route · ${guidedPlan.blocksMin}-${guidedPlan.blocksMax} blocks`
    : "Zone gate required";
  const guidedStatusBody = guidedPlan
    ? `Zone state ${guidedPlan.uiState}. Reward lane ${rewardModeLabel(guidedPlan.rewardMode)}.`
    : "Run Zone Coach first for a fresh session-scoped handoff, or switch to manual open play.";
  const resolvedGuidedStatusTitle = guidedStatusTitle;
  const resolvedGuidedStatusBody = guidedStatusBody;
  const foundationShared = programme.currentRailPhase === "foundation";
  const missionPreviewCopy = foundationShared
    ? `Core sessions 1-5 are shared across every mission. ${missionBranchFamilyLabel(uiState, 0)} opens at core ${programme.mission?.families?.[0]?.start || 6}.`
    : `Selected rail: ${missionBranchFamilyLabel(uiState, 0)} -> ${missionBranchFamilyLabel(uiState, 1)} -> ${missionBranchFamilyLabel(uiState, 2)}.`;
  const missionSummaryMarkup = uiState.settings.mode === "coach"
    ? `
      <div class="capacity-lab-mission-shell">
        <div class="capacity-lab-mission-head">
          <div>
            <div class="capacity-lab-mission-kicker">${escapeHtml(missionRailLabel(uiState))}</div>
            <div class="capacity-lab-mission-title">${escapeHtml(`${missionPhaseLabel(uiState)} · ${missionFamilyLabel(uiState)}`)}</div>
          </div>
          <span class="capacity-lab-mission-pill">Core ${programme.coreSessionNumber}/20</span>
        </div>
        <div class="capacity-lab-mission-stats">
          <div class="capacity-lab-mission-stat">
            <span>Core</span>
            <strong>${safeValue(`${programme.coreSessionNumber}/20`)}</strong>
          </div>
          <div class="capacity-lab-mission-stat">
            <span>Phase</span>
            <strong>${escapeHtml(missionPhaseLabel(uiState))}</strong>
          </div>
          <div class="capacity-lab-mission-stat">
            <span>Family</span>
            <strong>${escapeHtml(missionFamilyLabel(uiState))}</strong>
          </div>
          <div class="capacity-lab-mission-stat">
            <span>Support</span>
            <strong>${programme.supportSessionCount}</strong>
          </div>
          <div class="capacity-lab-mission-stat">
            <span>Reset</span>
            <strong>${programme.resetSessionCount}</strong>
          </div>
          <div class="capacity-lab-mission-stat">
            <span>Lane</span>
            <strong>${escapeHtml(guidedPlan ? routeClassLabel(guidedPlan.routeClass) : "--")}</strong>
          </div>
        </div>
        <div class="capacity-lab-mission-rail">
          <div class="capacity-lab-mission-rail-card${programme.currentRailPhase === "foundation" ? " is-active" : ""}">
            <strong>Foundation</strong>
            <span>Shared 1-5</span>
          </div>
          <div class="capacity-lab-mission-rail-card${programme.currentRailPhase === "rail_family_1" ? " is-active" : ""}">
            <strong>${escapeHtml(missionBranchFamilyLabel(uiState, 0))}</strong>
            <span>${escapeHtml(`${programme.mission?.families?.[0]?.start || 6}-${programme.mission?.families?.[0]?.end || 10}`)}</span>
          </div>
          <div class="capacity-lab-mission-rail-card${programme.currentRailPhase === "rail_family_2" ? " is-active" : ""}">
            <strong>${escapeHtml(missionBranchFamilyLabel(uiState, 1))}</strong>
            <span>${escapeHtml(`${programme.mission?.families?.[1]?.start || 11}-${programme.mission?.families?.[1]?.end || 15}`)}</span>
          </div>
          <div class="capacity-lab-mission-rail-card${programme.currentRailPhase === "rail_family_3" ? " is-active" : ""}">
            <strong>${escapeHtml(missionBranchFamilyLabel(uiState, 2))}</strong>
            <span>${escapeHtml(`${programme.mission?.families?.[2]?.start || 16}-${programme.mission?.families?.[2]?.end || 20}`)}</span>
          </div>
        </div>
      </div>
    `
    : "";
  const isFixedTarget = isFixedTargetWrapper(uiState.settings.wrapper);
  const relateTargetLabel = uiState.settings.wrapper === "relate_numbers"
    ? "Number relation"
    : "Relation";
  const targetOptions = family === "bind"
    ? `<option value="conj" selected>Colour + Symbol</option>`
    : uiState.settings.wrapper === "relate_vectors"
      ? `<option value="rel" ${uiState.settings.targetModality === "rel" ? "selected" : ""}>Relation</option><option value="sym" ${uiState.settings.targetModality === "sym" ? "selected" : ""}>Orientation</option>`
      : uiState.settings.wrapper === "relate_numbers"
        ? `<option value="rel" ${uiState.settings.targetModality === "rel" ? "selected" : ""}>${relateTargetLabel}</option><option value="sym" ${uiState.settings.targetModality === "sym" ? "selected" : ""}>Direction</option>`
        : isRelateDualWrapper(uiState.settings.wrapper)
          ? `<option value="dual" selected>Dual</option>`
      : uiState.settings.wrapper === "resist_vectors"
      || uiState.settings.wrapper === "resist_concept"
      ? `<option value="loc" ${uiState.settings.targetModality === "loc" ? "selected" : ""}>Location</option><option value="sym" ${uiState.settings.targetModality === "sym" ? "selected" : ""}>Direction</option>`
      : uiState.settings.wrapper === "resist_words"
        ? `<option value="col" ${uiState.settings.targetModality === "col" ? "selected" : ""}>Ink colour</option><option value="sym" ${uiState.settings.targetModality === "sym" ? "selected" : ""}>Word</option>`
      : uiState.settings.wrapper === "emotion_faces"
        ? `<option value="loc" ${uiState.settings.targetModality === "loc" ? "selected" : ""}>Location</option><option value="sym" ${uiState.settings.targetModality === "sym" ? "selected" : ""}>Emotion</option>`
      : uiState.settings.wrapper === "emotion_words"
        ? `<option value="col" ${uiState.settings.targetModality === "col" ? "selected" : ""}>Ink colour</option><option value="sym" ${uiState.settings.targetModality === "sym" ? "selected" : ""}>Emotion word</option>`
      : `<option value="loc" ${uiState.settings.targetModality === "loc" ? "selected" : ""}>Location</option><option value="col" ${uiState.settings.targetModality === "col" ? "selected" : ""}>Colour</option><option value="sym" ${uiState.settings.targetModality === "sym" ? "selected" : ""}>Symbol</option>`;

  return `
    <div class="capacity-sandbox-shell">
      <section class="capacity-sandbox-panel">
        <div class="capacity-live-head">
          <div class="capacity-live-kicker">Capacity sandbox</div>
          <div class="capacity-live-pill">${escapeHtml(statusLabel)}</div>
        </div>
        ${missionSummaryMarkup}
        <div class="capacity-lab-setup-grid">
          <div class="capacity-lab-field capacity-lab-field--wide">
            <span>Mode</span>
            <div class="capacity-lab-mode-row" role="group" aria-label="Training mode">
              <button class="capacity-lab-chip${uiState.settings.mode === "coach" ? " is-active" : ""}" type="button" data-lab-action="set-mode" data-mode="coach">Coach guided</button>
              <button class="capacity-lab-chip${uiState.settings.mode !== "coach" ? " is-active" : ""}" type="button" data-lab-action="set-mode" data-mode="manual">You choose</button>
            </div>
          </div>
          ${uiState.settings.mode === "manual"
            ? `
            <label class="capacity-lab-field"><span>Wrapper</span><select data-lab-setting="wrapper"><option value="hub_cat" ${uiState.settings.wrapper === "hub_cat" ? "selected" : ""}>Flex known</option><option value="hub_noncat" ${uiState.settings.wrapper === "hub_noncat" ? "selected" : ""}>Flex unknown</option><option value="hub_concept" ${uiState.settings.wrapper === "hub_concept" ? "selected" : ""}>Flex concept</option><option value="and_cat" ${uiState.settings.wrapper === "and_cat" ? "selected" : ""}>Bind known</option><option value="and_noncat" ${uiState.settings.wrapper === "and_noncat" ? "selected" : ""}>Bind unknown</option><option value="resist_vectors" ${uiState.settings.wrapper === "resist_vectors" ? "selected" : ""}>Resist vectors</option><option value="resist_words" ${uiState.settings.wrapper === "resist_words" ? "selected" : ""}>Resist words</option><option value="resist_concept" ${uiState.settings.wrapper === "resist_concept" ? "selected" : ""}>Resist concept</option><option value="emotion_faces" ${uiState.settings.wrapper === "emotion_faces" ? "selected" : ""}>Emotion faces</option><option value="emotion_words" ${uiState.settings.wrapper === "emotion_words" ? "selected" : ""}>Emotion words</option><option value="relate_vectors" ${uiState.settings.wrapper === "relate_vectors" ? "selected" : ""}>Relate vectors mono</option><option value="relate_numbers" ${uiState.settings.wrapper === "relate_numbers" ? "selected" : ""}>Relate numbers mono</option><option value="relate_vectors_dual" ${uiState.settings.wrapper === "relate_vectors_dual" ? "selected" : ""}>Relate vectors dual</option><option value="relate_numbers_dual" ${uiState.settings.wrapper === "relate_numbers_dual" ? "selected" : ""}>Relate numbers dual</option></select></label>
            <label class="capacity-lab-field"><span>Target</span><select data-lab-setting="targetModality" ${isFixedTarget ? "disabled" : ""}>${targetOptions}</select></label>
            <label class="capacity-lab-field"><span>Speed</span><select data-lab-setting="speed"><option value="slow" ${uiState.settings.speed === "slow" ? "selected" : ""}>Slow pace</option><option value="fast" ${uiState.settings.speed === "fast" ? "selected" : ""}>Fast pace</option></select></label>
            <label class="capacity-lab-field capacity-lab-field--wide"><span>N-back</span><select data-lab-setting="n">${Array.from({ length: HUB_N_MAX }, (_, index) => { const value = index + 1; return `<option value="${value}" ${uiState.settings.n === value ? "selected" : ""}>N-${value}</option>`; }).join("")}</select></label>
            `
            : ""
          }
        </div>
        <div class="capacity-lab-action-row">
          <button class="capacity-transition-action capacity-transition-action--lab" type="button" data-lab-action="start" ${guidedStartDisabled ? "disabled" : ""}>${uiState.settings.mode === "coach" ? "Run guided block" : "Run open-play block"}</button>
          <button class="capacity-lab-secondary-btn" type="button" data-lab-action="reset-history">Reset history</button>
        </div>
      </section>
    </div>
  `;
}

function liveMarkup(uiState) {
  const active = uiState.activeBlock;
  const pauseAction = uiState.status === "paused" ? "resume" : "pause";
  const pauseLabel = uiState.status === "paused" ? "Resume" : "Pause";
  const matchWindowOpen = isMatchWindowOpen(uiState);
  const isDual = active?.plan?.targetModality === "dual";
  const secondaryLabel = relateSecondaryLabel(active?.plan?.wrapper);
  const secondaryDisabled = !matchWindowOpen || Boolean(active?.responseSymCaptured);
  const relationDisabled = !matchWindowOpen || Boolean(active?.responseRelCaptured);
  const singleMatchDisabled = !matchWindowOpen;
  const actionRow = isDual
    ? `
      <div class="capacity-live-dual-row">
        <button class="capacity-phone-action capacity-phone-action--sandbox" type="button" data-lab-action="match-sym" ${secondaryDisabled ? "disabled" : ""}>${escapeHtml(secondaryLabel)}</button>
        <button class="capacity-phone-action capacity-phone-action--sandbox" type="button" data-lab-action="match-rel" ${relationDisabled ? "disabled" : ""}>Relation</button>
      </div>
    `
    : `<button class="capacity-phone-action capacity-phone-action--sandbox" type="button" data-lab-action="match" ${singleMatchDisabled ? "disabled" : ""}>Match</button>`;
  const hintMarkup = isDual
    ? `<p class="capacity-live-hint">Keys: Left Arrow = ${escapeHtml(secondaryLabel.toLowerCase())}, Right Arrow = relation.</p>`
    : "";

  return `
    <div class="capacity-sandbox-shell capacity-sandbox-shell--live">
      <section class="capacity-live-stage capacity-live-stage--sandbox${uiState.status === "paused" ? " is-paused" : ""}">
        <div class="capacity-live-stage-body">
          ${arenaMarkup(uiState)}
        </div>
        <div class="capacity-live-actions capacity-live-actions--sandbox">
          ${actionRow}
          ${hintMarkup}
          <div class="capacity-live-secondary-row">
            <button class="capacity-lab-secondary-btn" type="button" data-lab-action="${pauseAction}">${pauseLabel}</button>
            <button class="capacity-lab-secondary-btn" type="button" data-lab-action="discard">Stop block</button>
          </div>
        </div>
      </section>
    </div>
  `;
}

function taskMarkup(uiState) {
  if (uiState.activeBlock) {
    return liveMarkup(uiState);
  }

  return setupMarkup(uiState);
}

export function mountCapacityLab({ root }) {
  const taskRoot = root.querySelector("[data-capacity-lab-root]");
  const telemetryRail = root.querySelector(".telemetry-rail");
  const uiState = createUiState();
  const timers = { cue: null, display: null, trial: null, sequence: null };

  function clearTimers() {
    Object.keys(timers).forEach((key) => {
      if (timers[key]) {
        clearTimeout(timers[key]);
        timers[key] = null;
      }
    });
  }

  function scheduleCue(delayMs) {
    const active = uiState.activeBlock;
    if (!active) {
      return;
    }

    const safeDelayMs = Math.max(0, Math.round(delayMs));
    active.cueEndsAtMs = performance.now() + safeDelayMs;
    timers.cue = setTimeout(() => {
      timers.cue = null;
      active.cueEndsAtMs = 0;
      startTrial(0);
    }, safeDelayMs);
  }

  function scheduleTrialTimers(index, { displayDelayMs, trialDelayMs, sequenceDelayMs } = {}) {
    const active = uiState.activeBlock;
    if (!active) {
      return;
    }

    const trial = active.trials[index];
    const safeDisplayMs = Number.isFinite(displayDelayMs) ? Math.max(0, Math.round(displayDelayMs)) : active.displayMs;
    const safeTrialMs = Number.isFinite(trialDelayMs) ? Math.max(0, Math.round(trialDelayMs)) : active.soaMs;
    const safeSequenceMs = Number.isFinite(sequenceDelayMs)
      ? Math.max(0, Math.round(sequenceDelayMs))
      : trialSequenceGapMs(trial);

    if (active.stimulusVisible && safeSequenceMs > 0 && active.trialVisualStage < 2) {
      active.sequenceEndsAtMs = performance.now() + safeSequenceMs;
      timers.sequence = setTimeout(() => {
        if (!uiState.activeBlock || uiState.activeBlock.trialIndex !== index) {
          return;
        }
        uiState.activeBlock.trialVisualStage = 2;
        uiState.activeBlock.sequenceEndsAtMs = 0;
        timers.sequence = null;
        render();
      }, safeSequenceMs);
    } else {
      active.sequenceEndsAtMs = 0;
    }

    if (active.stimulusVisible && safeDisplayMs > 0) {
      active.displayEndsAtMs = performance.now() + safeDisplayMs;
      timers.display = setTimeout(() => {
        if (!uiState.activeBlock || uiState.activeBlock.trialIndex !== index) {
          return;
        }
        uiState.activeBlock.stimulusVisible = false;
        uiState.activeBlock.displayEndsAtMs = 0;
        uiState.activeBlock.trialVisualStage = 0;
        uiState.activeBlock.sequenceEndsAtMs = 0;
        timers.display = null;
        render();
      }, safeDisplayMs);
    } else {
      active.displayEndsAtMs = 0;
      if (safeDisplayMs === 0) {
        active.stimulusVisible = false;
        active.trialVisualStage = 0;
      }
    }

    if (safeTrialMs <= 0) {
      active.trialEndsAtMs = 0;
      finishTrial();
      return;
    }

    active.trialEndsAtMs = performance.now() + safeTrialMs;
    timers.trial = setTimeout(() => {
      timers.trial = null;
      finishTrial();
    }, safeTrialMs);
  }

  function syncSettings(patch) {
    const persisted = updateCapacityLabSettings(patch);
    uiState.settings = { ...persisted.settings };
  }

  function applyWrapperSelection(wrapper) {
    const nextTarget = isTargetAllowedForWrapper(wrapper, uiState.settings.targetModality)
      ? uiState.settings.targetModality
      : familyDefaultTarget(wrapper);
    syncSettings({ wrapper, targetModality: nextTarget });
    uiState.activeMessage = "Sandbox selection updated for the next block.";
    uiState.coachMessage = `Sandbox selection updated: ${wrapperLabel(uiState.settings.wrapper)}, ${modalityLabel(uiState.settings.targetModality, uiState.settings.wrapper)}, N-${uiState.settings.n}.`;
  }

  function syncProgrammeRuntimeState() {
    const latestProgramme = loadProgrammeState();
    const missionChanged = latestProgramme.missionRailId !== uiState.programme?.missionRailId;
    uiState.programme = latestProgramme;
    uiState.zoneHandoff = loadLatestZoneHandoff();

    if (
      !uiState.activeBlock
      && uiState.currentSession
      && uiState.settings.mode === "coach"
      && !currentSessionMatchesMission(uiState)
    ) {
      const persisted = clearCapacityLabCurrentSession();
      uiState.currentSession = persisted.currentSession;
    }

    if (missionChanged && !uiState.activeBlock && uiState.settings.mode === "coach") {
      uiState.activeMessage = `Guided route updated for ${missionRailLabel(uiState)}.`;
      uiState.coachMessage = buildCoachMessage(uiState, recommendSettings(uiState));
    }
  }

  function updateBanner() {
    const track = root.querySelector("[data-capacity-lab-track]");
    const status = root.querySelector("[data-capacity-lab-status]");
    const wrapper = root.querySelector("[data-capacity-lab-wrapper]");
    const modality = root.querySelector("[data-capacity-lab-modality]");
    const speed = root.querySelector("[data-capacity-lab-speed]");
    const runs = root.querySelector("[data-capacity-lab-runs]");
    const sfxButton = root.querySelector("[data-capacity-lab-sfx]");
    const active = uiState.activeBlock;
    const guidedPlan = activeGuidedPlan(uiState);
    if (track) {
      if (uiState.status === "trial" && active) {
        track.textContent = `Trial ${active.trialIndex + 1} of ${active.trials.length}`;
      } else if (uiState.status === "briefing") {
        track.textContent = "Cueing next block";
      } else if (uiState.status === "paused" && active && active.trialIndex >= 0) {
        track.textContent = `Paused on trial ${active.trialIndex + 1} of ${active.trials.length}`;
      } else if (uiState.status === "paused") {
        track.textContent = "Block paused";
      } else if (guidedPlan) {
        track.textContent = `${routeClassLabel(guidedPlan.routeClass)} route · block ${Math.min(guidedPlan.blocksCompleted + 1, guidedPlan.plannedBlocks)} of ${guidedPlan.plannedBlocks}`;
      } else {
        track.textContent = uiState.settings.mode === "coach" ? "Zone handoff required" : "Manual open play";
      }
    }
    if (
      track
      && !active
      && uiState.status !== "briefing"
      && uiState.status !== "paused"
      && guidedPlan
    ) {
      track.textContent = `${missionRailLabel(uiState)} · core ${uiState.programme.coreSessionNumber}/20 · ${routeClassLabel(guidedPlan.routeClass)} route`;
    }
    if (status) status.textContent = uiState.status === "trial" ? "Live" : uiState.status === "briefing" ? "Cueing" : uiState.status === "paused" ? "Paused" : uiState.status === "result" ? "Saved" : "Ready";
    if (wrapper) wrapper.textContent = active ? wrapperLabel(active.plan.wrapper) : "—";
    if (modality) modality.textContent = active ? modalityMark(active.plan.targetModality, active.plan.wrapper) : "—";
    if (speed) speed.textContent = active ? speedLabel(active.plan.speed) : "—";
    if (runs) runs.textContent = String(uiState.history.length);
    if (sfxButton) {
      const soundOn = uiState.settings.soundOn;
      sfxButton.textContent = soundOn ? "Sound on" : "Sound off";
      sfxButton.setAttribute("aria-pressed", soundOn ? "true" : "false");
    }
  }

  function updateCoach() {
    const coach = root.querySelector("[data-capacity-lab-coach]");
    if (coach) {
      if (!uiState.activeBlock && uiState.settings.mode === "coach") {
        const guidedPlan = activeGuidedPlan(uiState);
        const recommendation = recommendSettings(uiState);
        if (!guidedPlan) {
          coach.textContent = "Run Zone Coach first to open a guided session. Manual open play stays available, but it never counts toward the 20-session encode route.";
        } else {
          coach.textContent = `${buildCoachMessage(uiState, recommendation)} Session bounds: ${guidedPlan.blocksMin}-${guidedPlan.blocksMax} blocks, ${rewardModeLabel(guidedPlan.rewardMode)} lane.`;
        }
      } else if (!uiState.activeBlock) {
        coach.textContent = "Manual mode: choose your own settings for the next block. Open play stays local and never counts toward the 20-session core route.";
      } else {
        coach.textContent = uiState.coachMessage;
      }
    }
  }

  function updateGamesPanel() {
    const panel = root.querySelector("[data-capacity-games-panel]");
    if (panel) {
      panel.innerHTML = renderCapacityGamesPanel(uiState);
      panel.querySelectorAll("[data-capacity-tree-wrapper]").forEach((element) => {
        element.addEventListener("click", (event) => {
          const wrapper = event.currentTarget.dataset.capacityTreeWrapper;
          if (!wrapper) {
            return;
          }

          unlockAudioContextFromUserGesture();
          playSfx("ui_tap_soft");

          if (uiState.activeBlock) {
            uiState.activeMessage = "Finish the current block first.";
            uiState.coachMessage = "Game selection unlocks between blocks. Finish, pause, or discard the current block first.";
            render();
            return;
          }

          if (uiState.settings.mode !== "manual") {
            uiState.activeMessage = "Coach guided is active.";
            uiState.coachMessage = "Switch to You choose if you want to select a specific game from the left tree.";
            render();
            return;
          }

          applyWrapperSelection(wrapper);
          render();
        });
      });
    }
  }

  function render() {
    if (!taskRoot || !telemetryRail) {
      return;
    }

    syncProgrammeRuntimeState();

    taskRoot.innerHTML = taskMarkup(uiState);
    telemetryRail.innerHTML = renderTelemetryCards(telemetryCards(uiState));
    updateSandboxRail();
    updateGamesPanel();
    updateBanner();
    updateCoach();

    const sfxButton = root.querySelector("[data-capacity-lab-sfx]");
    if (sfxButton) {
      sfxButton.onclick = () => {
        const nextSoundOn = !uiState.settings.soundOn;
        syncSettings({ soundOn: nextSoundOn });
        setAudioEnabled(nextSoundOn);
        if (nextSoundOn) {
          initAudio({ enabled: true, preloadTier: "p0" });
          unlockAudioContextFromUserGesture();
        }
        render();
      };
    }

    taskRoot.querySelectorAll("[data-lab-setting]").forEach((element) => {
      element.addEventListener("change", (event) => {
        const key = event.currentTarget.dataset.labSetting;
        const value = key === "n" ? Number(event.currentTarget.value) : event.currentTarget.value;
        if (key === "wrapper") {
          applyWrapperSelection(value);
        } else if (key === "targetModality") {
          const nextTarget = isFixedTargetWrapper(uiState.settings.wrapper)
            ? familyDefaultTarget(uiState.settings.wrapper)
            : value;
          syncSettings({ targetModality: nextTarget });
          uiState.activeMessage = "Sandbox selection updated for the next block.";
          uiState.coachMessage = `Sandbox selection updated: ${wrapperLabel(uiState.settings.wrapper)}, ${modalityLabel(uiState.settings.targetModality, uiState.settings.wrapper)}, N-${uiState.settings.n}.`;
        } else {
          syncSettings({ [key]: value });
          uiState.activeMessage = "Sandbox selection updated for the next block.";
          uiState.coachMessage = `Sandbox selection updated: ${wrapperLabel(uiState.settings.wrapper)}, ${modalityLabel(uiState.settings.targetModality, uiState.settings.wrapper)}, N-${uiState.settings.n}.`;
        }
        render();
      });
    });

    taskRoot.querySelectorAll("[data-lab-action]").forEach((element) => {
      element.addEventListener("click", (event) => {
        const action = event.currentTarget.dataset.labAction;
        if (action === "start") {
          unlockAudioContextFromUserGesture();
          playSfx("ui_tap_soft");
          if (uiState.settings.mode === "coach") {
            const recommended = recommendSettings(uiState);
            if (!recommended) {
              uiState.activeMessage = "No guided session is available. Run Zone Coach first or switch to manual open play.";
              uiState.coachMessage = uiState.activeMessage;
              render();
              return;
            }
            syncSettings({
              wrapper: recommended.wrapper,
              targetModality: recommended.targetModality,
              speed: recommended.speed,
              n: recommended.n
            });
            startBlock(recommended);
          } else {
            startBlock(uiState.settings);
          }
        } else if (action === "match") {
          unlockAudioContextFromUserGesture();
          captureResponse();
        } else if (action === "match-rel") {
          unlockAudioContextFromUserGesture();
          captureResponse("rel");
        } else if (action === "match-sym") {
          unlockAudioContextFromUserGesture();
          captureResponse("sym");
        } else if (action === "pause") {
          pauseBlock();
        } else if (action === "resume") {
          resumeBlock();
        } else if (action === "set-mode") {
          playSfx("ui_tap_soft");
          const mode = event.currentTarget.dataset.mode === "coach" ? "coach" : "manual";
          syncSettings({ mode });
          if (mode !== "coach" && uiState.currentSession) {
            const persisted = clearCapacityLabCurrentSession();
            uiState.currentSession = persisted.currentSession;
          }
          uiState.activeMessage = `Mode set to ${modeLabel(mode)}.`;
          uiState.coachMessage = mode === "coach"
            ? buildCoachMessage(uiState, recommendSettings(uiState))
            : "Manual mode: choose your own settings for the next block.";
          render();
        } else if (action === "discard") {
          playSfx("session_stop_discard");
          clearTimers();
          uiState.activeBlock = null;
          uiState.status = "idle";
          if (uiState.settings.mode === "coach" && uiState.currentSession) {
            const persisted = clearCapacityLabCurrentSession();
            uiState.currentSession = persisted.currentSession;
          }
          uiState.activeMessage = "Block discarded. Settings are unlocked again.";
          uiState.coachMessage = uiState.activeMessage;
          render();
        } else if (action === "reset-history") {
          playSfx("ui_tap_soft");
          const persisted = clearCapacityLabHistory();
          uiState.history = persisted.history.slice();
          uiState.lastSavedEntry = null;
          uiState.currentSession = persisted.currentSession;
          uiState.sessionResolutions = persisted.sessionResolutions.slice();
          uiState.activeMessage = "Local sandbox history cleared. Programme progress is unchanged.";
          uiState.coachMessage = uiState.activeMessage;
          if (!uiState.activeBlock) {
            uiState.status = "idle";
          }
          render();
        }
      });
    });
  }

  function updateSandboxRail() {
    const rail = root.querySelector(".capacity-sandbox-rail");
    if (!rail) return;

    const history = uiState.history;
    const active = uiState.activeBlock;
    const rewards = computeRewards(history);
    const events = rewards.timeline;
    const readiness = transferReadinessLabel(events);
    const stable = computeStableLevel(history);
    const sessionBlocks = sessionHistory(history);
    const sessionTridents = events
      .filter((event) => event.sessionIndex === (Math.floor(history.length / 10) + 1))
      .reduce((sum, event) => sum + (REWARD_EVENTS[event.name]?.tridents || 0), 0);
    const sessionBlockNumber = sessionBlockIndex(history, active);
    const sessionProgress = Math.min(100, Math.round((sessionBlockNumber / 10) * 100));
    const sessionAvg = sessionBlocks.length
      ? (sessionBlocks.reduce((sum, entry) => sum + clampN(entry.block?.nEnd ?? entry.block?.nStart ?? 1), 0) / sessionBlocks.length)
      : null;
    const last = history[0] || null;
    const lastSummary = lastBlockSummary(last);
    const recommendation = recommendSettings(uiState);

    const sessionRewardValue = rail.querySelector(".capacity-sandbox-reward-value");
    if (sessionRewardValue) {
      sessionRewardValue.textContent = sessionBlocks.length ? `+${sessionTridents}` : "--";
    }
    const sessionBlockLabel = rail.querySelector("[data-sandbox-session-block]");
    if (sessionBlockLabel) {
      sessionBlockLabel.textContent = sessionBlockNumber ? `BLOCK ${sessionBlockNumber} OF 10` : "--";
    }
    const sessionCounted = rail.querySelector("[data-sandbox-session-counted]");
    if (sessionCounted) {
      sessionCounted.textContent = sessionBlockNumber ? "COUNTED" : "--";
    }
    const sessionProgressBar = rail.querySelector("[data-sandbox-session-progress]");
    if (sessionProgressBar) {
      sessionProgressBar.style.width = `${sessionProgress}%`;
    }
    const sessionAverage = rail.querySelector("[data-sandbox-session-average]");
    if (sessionAverage) {
      sessionAverage.textContent = sessionAvg ? sessionAvg.toFixed(1) : "--";
    }
    const transfer = rail.querySelector("[data-sandbox-transfer]");
    if (transfer) {
      transfer.textContent = readiness || "--";
    }
    const stableValue = rail.querySelector("[data-sandbox-stable]");
    if (stableValue) {
      stableValue.textContent = stable ? `${stable}-back` : "--";
    }
    const pressure = rail.querySelector("[data-sandbox-pressure]");
    if (pressure) {
      const fastConfirmed = history.some((entry) => entry.speed === "fast" && Number(entry.block?.accuracy || 0) >= 0.9);
      pressure.textContent = stable ? (fastConfirmed ? "Fast confirmed" : "Fast hold next") : "--";
    }

    const nextBlock = rail.querySelector("[data-sandbox-next]");
    if (nextBlock) {
      nextBlock.textContent = recommendation ? `N-${recommendation.n}` : "--";
    }
    const nextNote = rail.querySelector("[data-sandbox-next-note]");
    if (nextNote) {
      nextNote.textContent = safeValue(nextBlockHint(recommendation, last));
    }
    const lastAcc = rail.querySelector("[data-sandbox-last-accuracy]");
    if (lastAcc) {
      lastAcc.textContent = lastSummary.accuracy !== null ? formatPercent(lastSummary.accuracy) : "--";
    }
    const lastResult = rail.querySelector("[data-sandbox-last-result]");
    if (lastResult) {
      lastResult.textContent = lastSummary.outcome ? lastSummary.outcome : "--";
    }
    const lastCorrect = rail.querySelector("[data-sandbox-last-correct]");
    if (lastCorrect) {
      if (lastSummary.correct !== null && lastSummary.total) {
        lastCorrect.textContent = `${lastSummary.correct} of ${lastSummary.total} correct`;
      } else {
        lastCorrect.textContent = "--";
      }
    }
    const spark = rail.querySelector("[data-sandbox-spark]");
    if (spark) {
      spark.setAttribute("points", history.length ? sparkPoints(history) : "2,22 168,22");
    }
  }

  function classifyResponse(responded, isMatch) {
    if (responded && isMatch) {
      return "hit";
    }
    if (responded && !isMatch) {
      return "false_alarm";
    }
    if (!responded && isMatch) {
      return "miss";
    }
    return "correct_rejection";
  }

  function captureResponse(targetModality = "primary") {
    const active = uiState.activeBlock;
    if (!isMatchWindowOpen(uiState)) {
      return false;
    }
    if (active.plan?.targetModality === "dual") {
      const responseKey = targetModality === "rel" ? "rel" : "sym";
      const capturedKey = responseKey === "rel" ? "responseRelCaptured" : "responseSymCaptured";
      const rtKey = responseKey === "rel" ? "responseRelRtMs" : "responseSymRtMs";
      if (active[capturedKey]) {
        return false;
      }
      active[capturedKey] = true;
      active[rtKey] = Math.max(0, Math.round(performance.now() - active.trialStartedAtMs));
      uiState.coachMessage = `${responseKey === "rel" ? "Relation" : relateSecondaryLabel(active.plan.wrapper)} response logged. Hold for the next trial.`;
      playSfx("game_match_press");
      render();
      return true;
    }

    active.responseCaptured = true;
    active.responseRtMs = Math.max(0, Math.round(performance.now() - active.trialStartedAtMs));
    playSfx("game_match_press");
    uiState.coachMessage = "Response logged. Hold for the next trial.";
    render();
    return true;
  }

  function pauseBlock() {
    const active = uiState.activeBlock;
    if (!active || uiState.status === "paused" || (uiState.status !== "briefing" && uiState.status !== "trial")) {
      return;
    }

    playSfx("pause_on");
    const now = performance.now();
    active.pausedState = uiState.status === "briefing"
      ? {
          phase: "briefing",
          cueRemainingMs: Math.max(0, Math.round(active.cueEndsAtMs - now))
        }
      : {
          phase: "trial",
          displayRemainingMs: active.stimulusVisible
            ? Math.max(0, Math.round(active.displayEndsAtMs - now))
            : 0,
          sequenceRemainingMs: active.trialVisualStage > 0 && active.trialVisualStage < 2
            ? Math.max(0, Math.round(active.sequenceEndsAtMs - now))
            : 0,
          trialRemainingMs: Math.max(0, Math.round(active.trialEndsAtMs - now)),
          elapsedTrialMs: Math.max(0, Math.round(now - active.trialStartedAtMs)),
          trialVisualStage: active.trialVisualStage
        };

    clearTimers();
    uiState.status = "paused";
    uiState.activeMessage = "Block paused.";
    uiState.coachMessage = "Sandbox block paused. Resume continues the same local block without resetting the run.";
    render();
  }

  function resumeBlock() {
    const active = uiState.activeBlock;
    const pausedState = active?.pausedState;
    if (!active || uiState.status !== "paused" || !pausedState) {
      return;
    }

    playSfx("resume_on");
    clearTimers();
    active.pausedState = null;
    uiState.activeMessage = "Block resumed.";

    if (pausedState.phase === "briefing") {
      uiState.status = "briefing";
      uiState.coachMessage = "Cue resumed. The same local block will continue from where it paused.";
      render();
      scheduleCue(pausedState.cueRemainingMs);
      return;
    }

    if (active.stimulusVisible && pausedState.displayRemainingMs <= 0) {
      active.stimulusVisible = false;
      active.trialVisualStage = 0;
    }

    active.trialVisualStage = Number.isFinite(pausedState.trialVisualStage)
      ? pausedState.trialVisualStage
      : active.trialVisualStage;
    if (!active.stimulusVisible) {
      active.trialVisualStage = 0;
    }
    active.trialStartedAtMs = performance.now() - (pausedState.elapsedTrialMs || 0);
    uiState.status = "trial";
    uiState.coachMessage = `Resumed. Match the ${displayHubTargetLabel(active.plan.targetModality, active.plan.wrapper).toLowerCase()} from ${active.plan.n} turns ago. Sandbox scoring stays local.`;
    render();
    scheduleTrialTimers(active.trialIndex, {
      displayDelayMs: active.stimulusVisible ? pausedState.displayRemainingMs : 0,
      trialDelayMs: pausedState.trialRemainingMs,
      sequenceDelayMs: active.stimulusVisible && active.trialVisualStage < 2
        ? pausedState.sequenceRemainingMs
        : 0
    });
  }

  function startTrial(index) {
    const active = uiState.activeBlock;
    if (!active) {
      return;
    }
    active.trialIndex = index;
    active.stimulusVisible = true;
    active.responseCaptured = false;
    active.responseRtMs = null;
    active.responseRelCaptured = false;
    active.responseSymCaptured = false;
    active.responseRelRtMs = null;
    active.responseSymRtMs = null;
    active.trialStartedAtMs = performance.now();
    active.pausedState = null;
    active.trialVisualStage = trialSequenceGapMs(active.trials[index]) > 0 ? 1 : 2;
    active.sequenceEndsAtMs = 0;
    uiState.status = "trial";
    uiState.coachMessage = `Match the ${displayHubTargetLabel(active.plan.targetModality, active.plan.wrapper).toLowerCase()} from ${active.plan.n} turns ago. Sandbox scoring only; official progression stays spec-gated.`;
    render();
    scheduleTrialTimers(index);
  }

  function finishBlock() {
    const active = uiState.activeBlock;
    if (!active) {
      return;
    }

    const summary = summarizeHubBlock({
      plan: active.plan,
      trials: active.trials,
      trialOutcomes: active.trialOutcomes,
      nMax: HUB_N_MAX
    });
    if (summary.outcomeBand === "UP") {
      playSfx("n_level_up");
    } else if (summary.outcomeBand === "DOWN") {
      playSfx("n_level_down");
    } else {
      playSfx("block_complete_neutral");
    }
    const entry = {
      id: `xor_lab_${active.tsStart}`,
      tsStart: active.tsStart,
      tsEnd: Date.now(),
      sessionId: active.sessionContext?.sessionId || null,
      zoneState: active.sessionContext?.zoneState || null,
      routeClass: active.sessionContext?.routeClass || "manual",
      rewardMode: active.sessionContext?.rewardMode || "none",
      eligibleForEncoding20: active.sessionContext?.eligibleForEncoding20 === true,
      wrapper: active.plan.wrapper,
      targetModality: active.plan.targetModality,
      speed: active.plan.speed,
      outcomeBand: summary.outcomeBand,
      recommendedN: summary.nEnd,
      block: summary.blockResult
    };

    const persisted = appendCapacityLabHistory(entry);
    uiState.history = persisted.history.slice();
    uiState.lastSavedEntry = uiState.history[0] || entry;
    uiState.activeBlock = null;
    uiState.status = "result";
    if (active.sessionContext) {
      const nextBlocksCompleted = active.sessionContext.blocksCompleted + 1;
      const sessionPersist = updateCapacityLabCurrentSession({
        ...active.sessionContext,
        blocksCompleted: nextBlocksCompleted
      });
      uiState.currentSession = sessionPersist.currentSession;

      if (uiState.currentSession && nextBlocksCompleted >= uiState.currentSession.plannedBlocks) {
        const resolution = resolveSessionOutcome(uiState.currentSession, uiState.history);
        const resolvedState = appendCapacityLabSessionResolution(resolution);
        uiState.currentSession = resolvedState.currentSession;
        uiState.sessionResolutions = resolvedState.sessionResolutions.slice();
        uiState.programme = recordProgrammeResolution(resolution);
        uiState.zoneHandoff = loadLatestZoneHandoff();
        uiState.activeMessage = resolution.countedAsEncoding20
          ? (uiState.programme.programmeComplete
            ? "Session complete. The 20-session guided programme is now complete."
            : `Session complete. Core session ${uiState.programme.coreSessionNumber} of 20 is now banked.`)
          : `Session complete. ${resolution.reasonIfNotCounted || "This route does not count toward the 20-session encode phase."}`;
        uiState.coachMessage = resolution.countedAsEncoding20
          ? `Core route held cleanly. ${missionRailLabel(uiState)} now sits at ${uiState.programme.coreSessionNumber}/20 counted core sessions.`
          : resolution.reasonIfNotCounted || "Support and reset routes stay logged separately from counted core repetitions.";
      } else {
        uiState.activeMessage = `Saved block ${nextBlocksCompleted} of ${active.sessionContext.plannedBlocks} for the current ${routeClassLabel(active.sessionContext.routeClass).toLowerCase()} route.`;
        uiState.coachMessage = `${entry.outcomeBand} block saved inside the ${routeClassLabel(active.sessionContext.routeClass).toLowerCase()} lane. Keep the next block inside the same Zone bounds.`;
      }
    } else {
      uiState.activeMessage = `Saved ${wrapperLabel(entry.wrapper)} ${modalityLabel(entry.targetModality, entry.wrapper)} locally with ${accuracyPercent(entry.block.accuracy)} accuracy.`;
      uiState.coachMessage = `${entry.outcomeBand} block saved. Manual open play never counts toward the core encode route.`;
    }
    render();
  }

  function finishTrial() {
    const active = uiState.activeBlock;
    if (!active) {
      return;
    }

    const trial = active.trials[active.trialIndex];
    if (active.plan.targetModality === "dual") {
      const isMatchRel = isHubMatchAtIndex(active.trials, active.trialIndex, active.plan.n, "rel");
      const isMatchSym = isHubMatchAtIndex(active.trials, active.trialIndex, active.plan.n, "sym");
      const respondedRel = Boolean(active.responseRelCaptured);
      const respondedSym = Boolean(active.responseSymCaptured);
      const classificationRel = classifyResponse(respondedRel, isMatchRel);
      const classificationSym = classifyResponse(respondedSym, isMatchSym);
      const relError = classificationRel === "miss" || classificationRel === "false_alarm";
      const symError = classificationSym === "miss" || classificationSym === "false_alarm";
      const isError = relError || symError;
      const sfxClassification = classificationRel === "false_alarm" || classificationSym === "false_alarm"
        ? "false_alarm"
        : (classificationRel === "miss" || classificationSym === "miss"
          ? "miss"
          : (classificationRel === "hit" || classificationSym === "hit" ? "hit" : "correct_rejection"));

      if (sfxClassification === "hit") {
        playSfx("trial_hit");
      } else if (sfxClassification === "false_alarm") {
        playSfx("trial_false_alarm");
      } else if (sfxClassification === "miss") {
        playSfx("trial_miss");
      }

      active.trialOutcomes.push({
        trialIndex: active.trialIndex,
        canonKey: trial.canonKey,
        canonRelKey: trial.canonRelKey,
        canonSymKey: trial.canonSymKey,
        isMatchRel,
        isMatchSym,
        respondedRel,
        respondedSym,
        responseRelRtMs: respondedRel ? active.responseRelRtMs : null,
        responseSymRtMs: respondedSym ? active.responseSymRtMs : null,
        classificationRel,
        classificationSym,
        classification: isError ? "error" : "ok",
        isError,
        isLapse: (!respondedRel && isMatchRel) || (!respondedSym && isMatchSym),
        isLure: false
      });
    } else {
      const isMatch = isHubMatchAtIndex(active.trials, active.trialIndex, active.plan.n, active.plan.targetModality);
      const responded = active.responseCaptured;
      const classification = classifyResponse(responded, isMatch);
      const isError = classification === "miss" || classification === "false_alarm";

      if (classification === "hit") {
        playSfx("trial_hit");
      } else if (classification === "false_alarm") {
        playSfx("trial_false_alarm");
      } else if (classification === "miss") {
        playSfx("trial_miss");
      }

      active.trialOutcomes.push({
        trialIndex: active.trialIndex,
        canonKey: trial.canonKey,
        isMatch,
        isLure: Boolean(trial.isLure),
        responded,
        rtMs: responded ? active.responseRtMs : null,
        isError,
        isLapse: !responded && isMatch,
        classification
      });
    }

    if (timers.display) {
      clearTimeout(timers.display);
      timers.display = null;
    }
    if (timers.sequence) {
      clearTimeout(timers.sequence);
      timers.sequence = null;
    }
    if (timers.trial) {
      clearTimeout(timers.trial);
      timers.trial = null;
    }

    const nextIndex = active.trialIndex + 1;
    if (nextIndex < active.trials.length) {
      startTrial(nextIndex);
      return;
    }
    finishBlock();
  }

  function startBlock(overrideSettings) {
    if (uiState.activeBlock) {
      return;
    }

    unlockAudioContextFromUserGesture();
    clearTimers();
    const baseSettings = overrideSettings || uiState.settings;
    let sessionContext = null;
    if (uiState.settings.mode === "coach") {
      sessionContext = uiState.currentSession;
      if (!sessionContext) {
        const handoff = freshZoneHandoff(uiState);
        if (!handoff || handoff.capacityPlan.routeClass === "recovery") {
          uiState.activeMessage = "Run Zone Coach first for a usable guided session. Invalid Zone checks never open Capacity.";
          uiState.coachMessage = uiState.activeMessage;
          render();
          return;
        }
        const created = createCurrentSessionRecord(handoff);
        uiState.currentSession = created;
        sessionContext = created;
      }
    }
    const resolvedTarget = isFixedTargetWrapper(baseSettings.wrapper)
      ? familyDefaultTarget(baseSettings.wrapper)
      : baseSettings.targetModality;
    const tsStart = Date.now();
    const blockIndex = uiState.history.length + 1;
    const mappingSeed = baseSettings.wrapper === "hub_noncat"
      || baseSettings.wrapper === "hub_concept"
      || baseSettings.wrapper === "and_noncat"
      || baseSettings.wrapper === "and_cat"
      || baseSettings.wrapper === "resist_vectors"
      || baseSettings.wrapper === "resist_words"
      || baseSettings.wrapper === "resist_concept"
      || baseSettings.wrapper === "emotion_faces"
      || baseSettings.wrapper === "emotion_words"
      ? hash32(`${tsStart}:${resolvedTarget}:${blockIndex}`)
      : undefined;
    const plan = createHubBlockPlan({
      wrapper: baseSettings.wrapper,
      blockIndex,
      n: baseSettings.n,
      speed: baseSettings.speed,
      targetModality: resolvedTarget,
      mappingSeed
    });
    const build = createHubBlockTrials({
      wrapper: plan.wrapper,
      n: plan.n,
      targetModality: plan.targetModality,
      speed: plan.speed,
      mappingSeed: plan.mappingSeed,
      baseTrials: HUB_BASE_TRIALS,
      seed: tsStart
    });

    uiState.activeBlock = {
      tsStart,
      plan,
      trials: build.trials,
      soaMs: build.soaMs,
      displayMs: build.displayMs,
      renderMapping: build.renderMapping,
      trialIndex: -1,
      stimulusVisible: false,
      responseCaptured: false,
      responseRtMs: null,
      responseRelCaptured: false,
      responseSymCaptured: false,
      responseRelRtMs: null,
      responseSymRtMs: null,
      trialStartedAtMs: 0,
      trialVisualStage: 0,
      cueEndsAtMs: 0,
      displayEndsAtMs: 0,
      sequenceEndsAtMs: 0,
      trialEndsAtMs: 0,
      pausedState: null,
      trialOutcomes: [],
      sessionContext
    };
    if (build.trials) {
      const urls = new Set();
      build.trials.forEach((trial) => {
        if (trial?.display?.symbolImageUrl) {
          urls.add(trial.display.symbolImageUrl);
        }
      });
      urls.forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    }
    uiState.status = "briefing";
    uiState.activeMessage = sessionContext
      ? `Starting block ${sessionContext.blocksCompleted + 1} of ${sessionContext.plannedBlocks}: ${wrapperLabel(plan.wrapper)} ${modalityLabel(plan.targetModality, plan.wrapper)} at N-${plan.n}.`
      : `Starting ${wrapperLabel(plan.wrapper)} ${modalityLabel(plan.targetModality, plan.wrapper)} at N-${plan.n}.`;
    uiState.coachMessage = sessionContext
      ? `Get ready. Match the ${displayHubTargetLabel(plan.targetModality, plan.wrapper).toLowerCase()} from ${plan.n} turns ago. Route: ${routeClassLabel(sessionContext.routeClass)} · reward lane ${rewardModeLabel(sessionContext.rewardMode)}.`
      : `Get ready. Match the ${displayHubTargetLabel(plan.targetModality, plan.wrapper).toLowerCase()} from ${plan.n} turns ago. Manual open play does not advance the core route.`;
    render();
    scheduleCue(HUB_CUE_MS);
  }

  function handleKeydown(event) {
    const tagName = String(event.target?.tagName || "").toLowerCase();
    if (tagName === "select") {
      return;
    }
    const active = uiState.activeBlock;
    if (active?.plan?.targetModality === "dual") {
      if (event.code === "ArrowLeft") {
        unlockAudioContextFromUserGesture();
        if (captureResponse("sym")) {
          event.preventDefault();
        }
        return;
      }
      if (event.code === "ArrowRight") {
        unlockAudioContextFromUserGesture();
        if (captureResponse("rel")) {
          event.preventDefault();
        }
        return;
      }
      if (event.code === "Space" || event.code === "Enter") {
        event.preventDefault();
        return;
      }
    }
    if (event.code === "Space" || event.code === "Enter") {
      unlockAudioContextFromUserGesture();
      if (captureResponse()) {
        event.preventDefault();
      }
    }
  }

  window.addEventListener("keydown", handleKeydown);
  initAudio({ enabled: uiState.settings.soundOn, preloadTier: "p0" });
  preloadImageUrls(HUB_PRELOAD_ASSETS);
  render();

  return function unmountCapacityLab() {
    clearTimers();
    window.removeEventListener("keydown", handleKeydown);
  };
}
