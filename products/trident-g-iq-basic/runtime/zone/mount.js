import { buildZoneHandoff } from "./handoff.js";
import { coachCopyForResult, renderZoneTelemetryCards, zonePhaseText, zoneStateMeta } from "./copy.js";
import { createZoneProbeController } from "./probe.js";
import { loadZoneRuntimeState, saveZoneRun } from "./storage.js";

export function mountZoneScreen({ root }) {
  const telemetryRail = root.querySelector(".telemetry-rail");
  const canvas = root.querySelector("[data-zone-canvas]");
  const preflight = root.querySelector("[data-zone-preflight]");
  const progressBlock = root.querySelector("[data-zone-progress-block]");
  const responseButtons = root.querySelector("[data-zone-response-buttons]");
  const idleActions = root.querySelector("[data-zone-idle-actions]");
  const taskTitle = root.querySelector("[data-zone-task-title]");
  const taskCopy = root.querySelector("[data-zone-task-copy]");
  const progressFill = root.querySelector("[data-zone-progress-fill]");
  const progressLabel = root.querySelector("[data-zone-progress-label]");
  const counts = root.querySelector("[data-zone-counts]");
  const coachHeadline = root.querySelector("[data-zone-coach-headline]");
  const coachBody = root.querySelector("[data-zone-coach-body]");
  const routeSummary = root.querySelector("[data-zone-route-summary]");
  const bannerTrack = root.querySelector("[data-zone-banner-track]");
  const bannerStage = root.querySelector("[data-zone-banner-stage]");
  const bannerMeta = root.querySelector("[data-zone-banner-meta]");
  const startButton = root.querySelector("[data-zone-action='start']");
  const newSessionButton = root.querySelector("[data-zone-action='new-session']");
  const overlayCapacityButton = root.querySelector("[data-zone-action='overlay-capacity']");
  const deferButton = root.querySelector("[data-zone-action='defer']");
  const leftButton = root.querySelector("[data-zone-choice='left']");
  const rightButton = root.querySelector("[data-zone-choice='right']");

  const persisted = loadZoneRuntimeState();
  const uiState = {
    phase: persisted.latestSummary ? "result" : "idle",
    history: persisted.history.slice(),
    latestSummary: persisted.latestSummary,
    latestHandoff: persisted.latestHandoff,
    live: {
      progressPct: 0,
      trialCount: 0,
      counts: { stair: 0, probe: 0, catch: 0 }
    }
  };

  const controller = createZoneProbeController({
    canvas,
    onStatus(status) {
      uiState.phase =
        status.phase === "result"
          ? "result"
          : status.phase === "running" || status.phase === "calibrating"
            ? "running"
            : "idle";
      uiState.live = {
        progressPct: Number.isFinite(status.progressPct) ? status.progressPct : 0,
        trialCount: Number.isFinite(status.trialCount) ? status.trialCount : 0,
        counts: status.counts || { stair: 0, probe: 0, catch: 0 }
      };
      render();
    },
    onComplete(summary) {
      const handoff = buildZoneHandoff(summary);
      const nextState = saveZoneRun(summary, handoff);
      uiState.history = nextState.history.slice();
      uiState.latestSummary = nextState.latestSummary;
      uiState.latestHandoff = nextState.latestHandoff;
      uiState.phase = "result";
      render();
    }
  });

  function setTridentState() {
    root.querySelectorAll("[data-zone-node]").forEach((node) => {
      node.classList.remove("is-active", "is-pulse");
    });
    if (uiState.phase === "running") {
      const hubNode = root.querySelector("[data-zone-node='hub']");
      if (hubNode) {
        hubNode.classList.add("is-pulse");
      }
      routeSummary.textContent = "Probe in progress. Stay on one screen; invalid runs do not gate training.";
      return;
    }
    const meta = zoneStateMeta(uiState.latestSummary?.state);
    if (uiState.latestSummary) {
      const activeNode = root.querySelector(`[data-zone-node='${meta.tridentNode}']`);
      if (activeNode) {
        activeNode.classList.add("is-active");
      }
      routeSummary.textContent = meta.routeSummary;
      return;
    }
    routeSummary.textContent = "Run one full 180-second MDT-m check to set the next guided session bounds.";
  }

  function renderBanner() {
    if (bannerTrack) {
      bannerTrack.textContent =
        uiState.phase === "result" && uiState.latestSummary
          ? zoneStateMeta(uiState.latestSummary.state).routeSummary
          : "One full MDT-m probe per session";
    }
    if (bannerStage) {
      bannerStage.textContent =
        uiState.phase === "result" && uiState.latestSummary
          ? zoneStateMeta(uiState.latestSummary.state).label
          : zonePhaseText(uiState.phase);
    }
    if (bannerMeta) {
      bannerMeta.textContent =
        uiState.phase === "running"
          ? "180s masked majority-direction task"
          : uiState.phase === "result"
            ? "single pre-session gate"
            : "single probe session gate";
    }
  }

  function renderCoach() {
    if (uiState.phase === "running") {
      coachHeadline.textContent = "Stay with the probe.";
      coachBody.textContent =
        "Press left if the majority points left and right if the majority points right. Wait for the arrows before you answer.";
      return;
    }
    if (uiState.latestSummary) {
      const coachCopy = coachCopyForResult(uiState.latestSummary, uiState.latestHandoff);
      coachHeadline.textContent = coachCopy.headline;
      coachBody.textContent = coachCopy.body;
      return;
    }
    coachHeadline.textContent = "One clean gate before load.";
    coachBody.textContent = "Run the full Zone check here. Capacity does not re-classify Zone mid-session.";
  }

  function renderTaskStage() {
    const running = uiState.phase === "running";
    if (preflight) {
      preflight.hidden = running;
    }
    if (progressBlock) {
      progressBlock.hidden = !running;
    }
    if (taskTitle) {
      if (!uiState.latestSummary) {
        taskTitle.textContent = "Zone Coach MDT-m";
      } else if (uiState.latestSummary.valid) {
        taskTitle.textContent = `${zoneStateMeta(uiState.latestSummary.state).label} route ready`;
      } else {
        taskTitle.textContent = "Check invalid";
      }
    }
    if (taskCopy) {
      if (!uiState.latestSummary) {
        taskCopy.textContent =
          "Run one full 180-second masked majority-direction check. This is the session's only Zone measurement.";
      } else if (uiState.latestSummary.valid) {
        taskCopy.textContent =
          "The session gate is set. Run Capacity now, or refresh it later with a new full check.";
      } else {
        taskCopy.textContent =
          uiState.latestSummary.invalidReason || "This run did not validate. Start a new full check when you are ready.";
      }
    }
    if (startButton) {
      startButton.hidden = running || Boolean(uiState.latestSummary);
    }
    if (newSessionButton) {
      newSessionButton.hidden = running || !uiState.latestSummary || Boolean(uiState.latestSummary?.valid);
    }
    if (overlayCapacityButton) {
      overlayCapacityButton.hidden = running || !Boolean(uiState.latestSummary?.valid);
    }
    if (progressFill) {
      progressFill.style.width = `${Math.round(uiState.live.progressPct)}%`;
    }
    if (progressLabel) {
      progressLabel.textContent = running
        ? `${Math.round(uiState.live.progressPct)}% complete`
        : uiState.latestSummary
          ? `Last result: ${zoneStateMeta(uiState.latestSummary.state).label}`
          : "Ready";
    }
    if (counts) {
      counts.textContent = running
        ? `Trials ${uiState.live.trialCount} · S:${uiState.live.counts.stair || 0} P:${uiState.live.counts.probe || 0} C:${uiState.live.counts.catch || 0}`
        : "Full probe only · 180 seconds · 5 arrows per masked trial";
    }
  }

  function renderResponses() {
    const running = uiState.phase === "running";
    if (responseButtons) {
      responseButtons.hidden = !running;
    }
    if (idleActions) {
      idleActions.hidden = running;
    }
    leftButton.disabled = !running;
    rightButton.disabled = !running;
    if (deferButton) {
      deferButton.textContent = "Defer for later";
    }
    if (overlayCapacityButton) {
      overlayCapacityButton.textContent =
        uiState.latestSummary && uiState.latestHandoff?.capacityPlan?.routeClass === "core"
          ? "Run core Capacity now"
          : "Run support Capacity now";
    }
  }

  function renderTelemetry() {
    if (telemetryRail) {
      telemetryRail.innerHTML = renderZoneTelemetryCards({
        history: uiState.history,
        summary: uiState.latestSummary,
        handoff: uiState.latestHandoff,
        phase: uiState.phase
      });
    }
  }

  function render() {
    renderBanner();
    renderCoach();
    renderTaskStage();
    renderResponses();
    setTridentState();
    renderTelemetry();
  }

  function startProbe() {
    uiState.latestSummary = null;
    uiState.latestHandoff = null;
    uiState.phase = "running";
    uiState.live = {
      progressPct: 0,
      trialCount: 0,
      counts: { stair: 0, probe: 0, catch: 0 }
    };
    render();
    controller.start({ historyRows: uiState.history }).catch((error) => {
      uiState.phase = "result";
      uiState.latestSummary = {
        sessionId: `zone_${Date.now()}`,
        timestamp: Date.now(),
        valid: false,
        invalidReason: error instanceof Error ? error.message : "Zone probe failed",
        state: "invalid",
        confidence: "Low",
        reasons: ["Zone probe failed"],
        bitsPerSecond: null
      };
      uiState.latestHandoff = buildZoneHandoff(uiState.latestSummary);
      render();
    });
  }

  startButton?.addEventListener("click", startProbe);
  newSessionButton?.addEventListener("click", startProbe);
  leftButton?.addEventListener("click", () => controller.submit("ArrowLeft"));
  rightButton?.addEventListener("click", () => controller.submit("ArrowRight"));

  render();

  return () => {
    controller.destroy();
  };
}
