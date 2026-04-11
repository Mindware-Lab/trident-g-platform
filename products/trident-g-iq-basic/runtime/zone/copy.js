import { renderTelemetryCards } from "../../../trident-g-iq-shared/runtime/telemetry.js";
import { normalizeZoneState } from "./classifier.js";
import { uiStateLabel } from "./handoff.js";

export const ZONE_STATE_META = Object.freeze({
  in_zone: {
    label: "In Zone",
    tridentNode: "hub",
    routeSummary: "Core route: full 10-block session can qualify for the 20.",
    coachHeadline: "Full route available.",
    coachBody: "Run the guided Capacity session now and let the post-session telemetry decide whether it becomes a counted core repetition.",
    badgeState: "ready"
  },
  flat: {
    label: "Flat",
    tridentNode: "shaft",
    routeSummary: "Support route: 4-6 blocks, lighter core families only.",
    coachHeadline: "Activation route only.",
    coachBody: "Use a lighter support session now or defer and come back later for a new full Zone check.",
    badgeState: "muted"
  },
  overloaded_explore: {
    label: "Spun Out",
    tridentNode: "left",
    routeSummary: "Support route: 3-4 blocks, simplest stable wrappers only.",
    coachHeadline: "Stabilise before load.",
    coachBody: "Keep the next session short, narrow, and low-switch, or defer and run a new full Zone check later.",
    badgeState: "warning"
  },
  overloaded_exploit: {
    label: "Locked In",
    tridentNode: "right",
    routeSummary: "Reset route: 4-5 blocks, same-level wrapper shifts only.",
    coachHeadline: "Break rigidity before pressure.",
    coachBody: "Run a short reset session built around wrapper shifts, or defer and come back later for a new full Zone check.",
    badgeState: "accent"
  },
  invalid: {
    label: "Invalid",
    tridentNode: "none",
    routeSummary: "No training route: repeat a full Zone check next session.",
    coachHeadline: "This check did not validate.",
    coachBody: "Do not treat this as a usable gate. Either defer or start a new session and run another full 180-second probe.",
    badgeState: "warning"
  }
});

export function zoneStateMeta(state) {
  return ZONE_STATE_META[normalizeZoneState(state)] || ZONE_STATE_META.invalid;
}

export function zonePhaseText(phase) {
  if (phase === "running") {
    return "Probe live";
  }
  if (phase === "result") {
    return "Route resolved";
  }
  return "Ready to probe";
}

export function coachCopyForResult(summary, handoff) {
  const meta = zoneStateMeta(summary?.state);
  const plan = handoff?.capacityPlan;
  if (!summary?.valid) {
    return {
      headline: meta.coachHeadline,
      body: summary?.invalidReason || meta.coachBody
    };
  }
  return {
    headline: meta.coachHeadline,
    body: `${meta.coachBody} ${plan ? `Dose: ${plan.blocksMin}-${plan.blocksMax === plan.blocksMin ? plan.blocksMin : plan.blocksMax} blocks. Reward lane: ${plan.rewardMode.replaceAll("_", " ")}.` : ""}`.trim()
  };
}

export function buildZoneTelemetryCards({ history, summary, handoff, phase }) {
  const latestState = summary?.state || "invalid";
  const meta = zoneStateMeta(latestState);
  const validChecks = history.filter((entry) => entry.valid).length;
  const inZoneChecks = history.filter((entry) => entry.valid && normalizeZoneState(entry.state) === "in_zone").length;
  const bits = Number.isFinite(summary?.bitsPerSecond) ? summary.bitsPerSecond.toFixed(2) : "--";
  const confidence = summary?.confidence || "--";
  const plan = handoff?.capacityPlan;
  const reasonText = !summary
    ? "One full 180s MDT-m check gates the next guided Capacity session."
    : summary.valid
      ? meta.routeSummary
      : summary.invalidReason || summary.reasons?.[0] || "Invalid runs never create a training plan.";

  return [
    {
      type: "splitMetric",
      label: "Zone state",
      value: summary ? meta.label : "Awaiting check",
      valueTone: summary && normalizeZoneState(latestState) === "in_zone" ? "accent" : undefined,
      subline: reasonText,
      badge: zonePhaseText(phase),
      emphasis: true
    },
    {
      type: "barMetric",
      label: "Control capacity",
      value: bits === "--" ? "--" : `${bits} bits/s`,
      valueTone: "accent",
      barValue: Number.isFinite(summary?.bitsPerSecond) ? Math.min(100, Math.max(0, Math.round(summary.bitsPerSecond * 28))) : 0,
      subline: summary ? `Confidence ${confidence}. Measured once before the session.` : "The probe estimates CCC throughput from adaptive masked exposures."
    },
    {
      type: "badge",
      label: "Training gate",
      badge: summary ? uiStateLabel(latestState) : "Pending",
      badgeState: meta.badgeState,
      subline: summary?.valid
        ? `Reward lane: ${plan?.rewardMode?.replaceAll("_", " ") || "--"}.`
        : reasonText
    },
    {
      type: "list",
      label: "Session bounds",
      rows: [
        { label: "Route", value: plan ? plan.routeClass : "--" },
        { label: "Dose", value: plan ? `${plan.blocksMin}-${plan.blocksMax}` : "--" },
        { label: "Progression", value: plan ? plan.progressionMode.replaceAll("_", " ") : "--" },
        { label: "Swaps", value: plan ? plan.swapPolicy.replaceAll("_", " ") : "--" }
      ]
    },
    {
      type: "routing",
      label: "History",
      title: `${inZoneChecks} in-zone checks passed`,
      subtitle: `${validChecks} valid Zone sessions stored locally.`,
      footer: {
        left: "Latest confidence",
        right: confidence,
        rightTone: "accent"
      }
    }
  ];
}

export function renderZoneTelemetryCards(context) {
  return renderTelemetryCards(buildZoneTelemetryCards(context));
}
