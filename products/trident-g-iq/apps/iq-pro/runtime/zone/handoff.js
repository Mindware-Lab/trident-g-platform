import { normalizeZoneState } from "./classifier.js";

function planForState(state) {
  switch (normalizeZoneState(state)) {
    case "in_zone":
      return {
        routeClass: "core",
        defaultBlocks: 10,
        blocksMin: 10,
        blocksMax: 10,
        progressionMode: "full",
        swapPolicy: "normal",
        focusBias: "balanced",
        preferredFamilies: ["flex", "bind", "resist", "emotion", "relate"],
        blockedFamilies: [],
        blockedModes: [],
        rewardMode: "core",
        eligibleForEncoding20: true
      };
    case "flat":
      return {
        routeClass: "support",
        defaultBlocks: 5,
        blocksMin: 4,
        blocksMax: 6,
        progressionMode: "hold_only",
        swapPolicy: "reduced",
        focusBias: "activate_then_stabilise",
        preferredFamilies: ["flex", "bind"],
        blockedFamilies: ["emotion", "relate"],
        blockedModes: ["fast_speed", "n_increase", "family_probe", "formal_testing"],
        rewardMode: "support",
        eligibleForEncoding20: false
      };
    case "overloaded_explore":
      return {
        routeClass: "support",
        defaultBlocks: 3,
        blocksMin: 3,
        blocksMax: 4,
        progressionMode: "none",
        swapPolicy: "none",
        focusBias: "stabilise",
        preferredFamilies: ["flex", "bind"],
        blockedFamilies: ["emotion", "relate"],
        blockedModes: ["variant_swap", "fast_speed", "n_increase", "family_probe", "formal_testing"],
        rewardMode: "support",
        eligibleForEncoding20: false
      };
    case "overloaded_exploit":
      return {
        routeClass: "support",
        defaultBlocks: 4,
        blocksMin: 4,
        blocksMax: 5,
        progressionMode: "wrapper_shift_only",
        swapPolicy: "mandatory_reset",
        focusBias: "flexibility_reset",
        preferredFamilies: ["flex", "resist"],
        blockedFamilies: ["emotion"],
        blockedModes: ["n_increase", "fast_speed", "formal_testing", "family_probe"],
        rewardMode: "reset_only",
        eligibleForEncoding20: false
      };
    default:
      return {
        routeClass: "recovery",
        defaultBlocks: 0,
        blocksMin: 0,
        blocksMax: 0,
        progressionMode: "none",
        swapPolicy: "none",
        focusBias: "stabilise",
        preferredFamilies: [],
        blockedFamilies: ["flex", "bind", "resist", "emotion", "relate"],
        blockedModes: ["all_training_modes"],
        rewardMode: "none",
        eligibleForEncoding20: false
      };
  }
}

export function uiStateLabel(state) {
  switch (normalizeZoneState(state)) {
    case "in_zone":
      return "In Zone";
    case "flat":
      return "Flat";
    case "overloaded_explore":
      return "Spun Out";
    case "overloaded_exploit":
      return "Locked In";
    default:
      return "Invalid";
  }
}

export function defaultRecommendationForState(state) {
  switch (normalizeZoneState(state)) {
    case "in_zone":
      return "full";
    case "flat":
      return "light";
    case "overloaded_explore":
    case "overloaded_exploit":
      return "reset";
    default:
      return "repeat_check_next_session";
  }
}

export function buildZoneHandoff(summary) {
  const normalizedState = normalizeZoneState(summary?.state);
  const capacityPlan = planForState(normalizedState);
  return {
    sessionId: String(summary?.sessionId || `zone_${Date.now()}`),
    state: normalizedState,
    uiState: uiStateLabel(normalizedState),
    confidence: summary?.confidence || "Low",
    bitsPerSecond: Number.isFinite(summary?.bitsPerSecond) ? Number(summary.bitsPerSecond) : null,
    timestamp: Number.isFinite(summary?.timestamp) ? Math.round(summary.timestamp) : Date.now(),
    freshForSession: true,
    recommendation: defaultRecommendationForState(normalizedState),
    capacityPlan
  };
}
