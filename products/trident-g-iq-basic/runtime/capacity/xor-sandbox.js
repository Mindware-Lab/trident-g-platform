import { renderTelemetryCards } from "../../../trident-g-iq-shared/runtime/telemetry.js";
import {
  HUB_BASE_TRIALS,
  HUB_CUE_MS,
  HUB_N_MAX,
  createHubBlockPlan,
  createHubBlockTrials,
  displayHubTargetLabel,
  isHubMatchAtIndex,
  summarizeHubBlock
} from "./hub-engine.js";
import { hash32 } from "./rng.js";
import {
  appendCapacityLabHistory,
  clearCapacityLabHistory,
  loadCapacityLabState,
  updateCapacityLabSettings
} from "./sandbox-storage.js";

const PREVIEW_MARKERS = [
  { xPct: 50, yPct: 8 },
  { xPct: 92, yPct: 50 },
  { xPct: 50, yPct: 92 },
  { xPct: 8, yPct: 50 }
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapperLabel(wrapper) {
  return wrapper === "hub_noncat" ? "Non-categorical" : "Categorical";
}

function speedLabel(speed) {
  return speed === "fast" ? "Fast pace" : "Slow pace";
}

function modalityLabel(targetModality, wrapper) {
  const label = displayHubTargetLabel(targetModality, wrapper).toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function modalityMark(targetModality) {
  if (targetModality === "col") {
    return "◐";
  }
  if (targetModality === "sym") {
    return "✦";
  }
  return "◎";
}

function accuracyPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function formatRt(value) {
  return Number.isFinite(value) ? `${Math.round(value)} ms` : "--";
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
    label: "Sandbox setup",
    labelClass: "metric-label--credit",
    emphasis: true,
    html: `
      <div class="capacity-rail-panel">
        <div class="capacity-rail-inline">
          <span class="capacity-rail-inline-label">Route</span>
          <span class="capacity-rail-inline-value">XOR sandbox</span>
        </div>
        <div class="capacity-rail-inline">
          <span class="capacity-rail-inline-label">Scope</span>
          <span class="capacity-rail-inline-value">Basic local scoring</span>
        </div>
      </div>
    `
  },
  {
    label: "Current block",
    labelClass: "metric-label--credit",
    emphasis: true,
    html: `
      <div class="capacity-rail-panel">
        <div class="capacity-rail-inline">
          <span class="capacity-rail-inline-label">Status</span>
          <span class="capacity-rail-inline-value">Ready</span>
        </div>
        <div class="capacity-rail-inline">
          <span class="capacity-rail-inline-label">Telemetry</span>
          <span class="capacity-rail-inline-value">Waiting for first run</span>
        </div>
      </div>
    `
  },
  {
    label: "Recent runs",
    labelClass: "metric-label--credit",
    emphasis: true,
    html: `
      <div class="capacity-rail-panel">
        <div class="capacity-lab-empty">Run a block to populate the local history rail.</div>
      </div>
    `
  }
];

function createUiState() {
  const persisted = loadCapacityLabState();
  return {
    settings: { ...persisted.settings },
    history: persisted.history.slice(),
    status: "idle",
    activeBlock: null,
    activeMessage: "Pick a wrapper and start a block inside the new capacity shell.",
    coachMessage: "Use this route to play XOR categorical and non-categorical blocks without wiring the full telemetry stack or official progression engine.",
    lastSavedEntry: persisted.history[0] || null
  };
}

function telemetryCards(uiState) {
  const active = uiState.activeBlock;
  const last = uiState.lastSavedEntry;
  const lastBlock = last?.block || null;
  const history = uiState.history;
  const bestAccuracy = history.length ? Math.max(...history.map((entry) => Number(entry?.block?.accuracy || 0))) : 0;
  const progress = active?.trials?.length ? Math.max(4, Math.round(((active.trialIndex + 1) / active.trials.length) * 100)) : 0;

  return [
    {
      label: "Sandbox setup",
      labelClass: "metric-label--credit",
      emphasis: true,
      html: `
        <div class="capacity-rail-panel">
          <div class="capacity-rail-progress-head">
            <span>${escapeHtml(wrapperLabel(uiState.settings.wrapper))} XOR</span>
            <span class="capacity-rail-route">${escapeHtml(uiState.status === "trial" ? "Live" : uiState.status === "briefing" ? "Cueing" : uiState.status === "paused" ? "Paused" : uiState.status === "result" ? "Saved" : "Ready")}</span>
          </div>
          <div class="capacity-rail-grid">
            <div class="capacity-rail-stat">
              <div class="capacity-rail-stat-label">Target</div>
              <div class="capacity-rail-stat-value is-accent">${escapeHtml(modalityMark(uiState.settings.targetModality))}</div>
              <div class="capacity-rail-stat-subline">Next block setting</div>
            </div>
            <div class="capacity-rail-stat">
              <div class="capacity-rail-stat-label">Pace</div>
              <div class="capacity-rail-pill capacity-rail-pill--transfer">${escapeHtml(speedLabel(uiState.settings.speed))}</div>
              <div class="capacity-rail-stat-subline">${escapeHtml(uiState.settings.interference === "high" ? "High interference" : "Low interference")}</div>
            </div>
          </div>
          <div class="capacity-rail-inline">
            <span class="capacity-rail-inline-label">Selected n-back</span>
            <span class="capacity-rail-inline-value">N-${uiState.settings.n}</span>
          </div>
          <div class="capacity-rail-inline">
            <span class="capacity-rail-inline-label">Logged runs</span>
            <span class="capacity-rail-inline-value">${history.length}</span>
          </div>
        </div>
      `
    },
    {
      label: "Current block",
      labelClass: "metric-label--credit",
      emphasis: true,
      html: `
        <div class="capacity-rail-panel">
          <div class="capacity-rail-progress-head">
            <span>${active ? `Trial ${Math.max(active.trialIndex + 1, 0)} of ${active.trials.length}` : "No active block"}</span>
            <span class="capacity-rail-route">${active ? "Live scoring" : "Waiting"}</span>
          </div>
          <div class="bar-track capacity-rail-progress-track">
            <div class="bar-fill" style="width: ${progress}%;"></div>
          </div>
          <div class="capacity-rail-grid">
            <div class="capacity-rail-stat">
              <div class="capacity-rail-stat-label">Last accuracy</div>
              <div class="capacity-rail-stat-value is-accent">${lastBlock ? accuracyPercent(lastBlock.accuracy) : "--"}</div>
              <div class="capacity-rail-stat-subline">${lastBlock ? `${lastBlock.hits} hits / ${lastBlock.falseAlarms} FA` : "No saved block yet"}</div>
            </div>
            <div class="capacity-rail-stat">
              <div class="capacity-rail-stat-label">Sandbox hint</div>
              <div class="capacity-rail-pill ${last?.outcomeBand === "UP" ? "capacity-rail-pill--up" : "capacity-rail-pill--transfer"}">${lastBlock ? `N-${last.recommendedN}` : "N-1"}</div>
              <div class="capacity-rail-stat-subline">${last ? `${last.outcomeBand} block-only heuristic` : "Start a block to score"}</div>
            </div>
          </div>
          <div class="capacity-rail-inline">
            <span class="capacity-rail-inline-label">Mean RT</span>
            <span class="capacity-rail-inline-value">${lastBlock ? formatRt(lastBlock.meanRtMs) : "--"}</span>
          </div>
          <div class="capacity-rail-inline">
            <span class="capacity-rail-inline-label">Lapse count</span>
            <span class="capacity-rail-inline-value">${lastBlock ? lastBlock.lapseCount : 0}</span>
          </div>
        </div>
      `
    },
    {
      label: "Recent runs",
      labelClass: "metric-label--credit",
      emphasis: true,
      html: `
        <div class="capacity-rail-panel">
          <div class="capacity-rail-grid">
            <div class="capacity-rail-stat">
              <div class="capacity-rail-stat-label">Best accuracy</div>
              <div class="capacity-rail-stat-value">${history.length ? accuracyPercent(bestAccuracy) : "--"}</div>
              <div class="capacity-rail-stat-subline">Last ${history.length} local runs</div>
            </div>
            <div class="capacity-rail-stat">
              <div class="capacity-rail-stat-label">Base trials</div>
              <div class="capacity-rail-stat-value">${HUB_BASE_TRIALS}</div>
              <div class="capacity-rail-stat-subline">Plus current n-back offset</div>
            </div>
          </div>
          <div class="capacity-rail-trend">
            <div class="capacity-rail-trend-label">Accuracy over recent runs</div>
            <svg class="capacity-rail-spark" viewBox="0 0 170 30" preserveAspectRatio="none" aria-hidden="true">
              <polyline fill="none" stroke="rgba(245, 181, 68, 0.96)" stroke-width="2.6" points="${sparkPoints(history)}"></polyline>
            </svg>
          </div>
          ${history.length ? `<div class="capacity-lab-history-list">${historyRows(history)}</div>` : '<div class="capacity-lab-empty">No local runs saved yet.</div>'}
        </div>
      `
    }
  ];
}

function arenaMarkup(uiState) {
  const active = uiState.activeBlock;
  const trial = active && active.trialIndex >= 0 ? active.trials[active.trialIndex] : null;
  const points = active?.renderMapping?.markerPositions?.length ? active.renderMapping.markerPositions : PREVIEW_MARKERS;
  const markers = points.map((point) => `<span class="capacity-hub-marker" style="left:${point.xPct}%;top:${point.yPct}%;"></span>`).join("");
  const point = trial && points[trial.locIdx] ? points[trial.locIdx] : { xPct: 50, yPct: 50 };
  const visible = Boolean(trial && (uiState.status === "trial" || uiState.status === "paused") && active.stimulusVisible);
  const background = visible ? String(trial.display.colourHex || "#ffffff") : "transparent";
  const textColor = String(trial?.display?.colourHex || "").toLowerCase() === "#ffffff" ? "#102033" : "#ffffff";
  const token = visible ? escapeHtml(trial.display.symbolLabel) : "";

  return `
    <div class="capacity-hub-arena ${active?.plan?.wrapper === "hub_noncat" ? "is-noncat" : "is-cat"}${uiState.status === "paused" ? " is-paused" : ""}">
      <div class="capacity-hub-ring"></div>
      ${markers}
      <div class="capacity-hub-token${visible ? "" : " is-hidden"}" style="left:${point.xPct}%;top:${point.yPct}%;background:${background};color:${visible ? textColor : "transparent"};">${token}</div>
    </div>
  `;
}

function setupMarkup(uiState) {
  const last = uiState.lastSavedEntry;
  const statusLabel = uiState.status === "result" ? "Saved" : "Ready";
  const helper = `${wrapperLabel(uiState.settings.wrapper)} | ${modalityLabel(uiState.settings.targetModality, uiState.settings.wrapper)} | N-${uiState.settings.n}`;
  const savedSummary = last
    ? `
      <div class="capacity-lab-saved-note">
        Last block saved to the rail: ${escapeHtml(accuracyPercent(last.block.accuracy))} accuracy, ${escapeHtml(formatRt(last.block.meanRtMs))} mean RT.
      </div>
    `
    : "";

  return `
    <div class="capacity-sandbox-shell">
      <section class="capacity-sandbox-panel">
        <div class="capacity-live-head">
          <div class="capacity-live-kicker">XOR hub sandbox</div>
          <div class="capacity-live-pill">${escapeHtml(statusLabel)}</div>
        </div>
        <div class="capacity-lab-setup-grid">
          <label class="capacity-lab-field"><span>Wrapper</span><select data-lab-setting="wrapper"><option value="hub_cat" ${uiState.settings.wrapper === "hub_cat" ? "selected" : ""}>Categorical</option><option value="hub_noncat" ${uiState.settings.wrapper === "hub_noncat" ? "selected" : ""}>Non-categorical</option></select></label>
          <label class="capacity-lab-field"><span>Target</span><select data-lab-setting="targetModality"><option value="loc" ${uiState.settings.targetModality === "loc" ? "selected" : ""}>Location</option><option value="col" ${uiState.settings.targetModality === "col" ? "selected" : ""}>Colour</option><option value="sym" ${uiState.settings.targetModality === "sym" ? "selected" : ""}>Symbol</option></select></label>
          <label class="capacity-lab-field"><span>Speed</span><select data-lab-setting="speed"><option value="slow" ${uiState.settings.speed === "slow" ? "selected" : ""}>Slow pace</option><option value="fast" ${uiState.settings.speed === "fast" ? "selected" : ""}>Fast pace</option></select></label>
          <label class="capacity-lab-field"><span>Interference</span><select data-lab-setting="interference"><option value="low" ${uiState.settings.interference === "low" ? "selected" : ""}>Low</option><option value="high" ${uiState.settings.interference === "high" ? "selected" : ""}>High</option></select></label>
          <label class="capacity-lab-field capacity-lab-field--wide"><span>N-back</span><select data-lab-setting="n">${Array.from({ length: HUB_N_MAX }, (_, index) => { const value = index + 1; return `<option value="${value}" ${uiState.settings.n === value ? "selected" : ""}>N-${value}</option>`; }).join("")}</select></label>
        </div>
        <div class="capacity-lab-action-row">
          <button class="capacity-transition-action capacity-transition-action--lab" type="button" data-lab-action="start">${uiState.status === "result" ? "Start another block" : "Start block"}</button>
          <button class="capacity-lab-secondary-btn" type="button" data-lab-action="reset-history">Reset history</button>
        </div>
        <p class="capacity-lab-helper">${escapeHtml(helper)} | ${escapeHtml(speedLabel(uiState.settings.speed))} | ${escapeHtml(uiState.settings.interference === "high" ? "High interference" : "Low interference")}</p>
        ${savedSummary}
      </section>
    </div>
  `;
}

function liveMarkup(uiState) {
  const active = uiState.activeBlock;
  const pauseAction = uiState.status === "paused" ? "resume" : "pause";
  const pauseLabel = uiState.status === "paused" ? "Resume" : "Pause";
  const matchDisabled = uiState.status !== "trial" || active.responseCaptured;

  return `
    <div class="capacity-sandbox-shell capacity-sandbox-shell--live">
      <section class="capacity-live-stage capacity-live-stage--sandbox${uiState.status === "paused" ? " is-paused" : ""}">
        <div class="capacity-live-stage-body">
          ${arenaMarkup(uiState)}
        </div>
        <div class="capacity-live-actions capacity-live-actions--sandbox">
          <button class="capacity-phone-action capacity-phone-action--sandbox" type="button" data-lab-action="match" ${matchDisabled ? "disabled" : ""}>Match</button>
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
  const timers = { cue: null, display: null, trial: null };

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

  function scheduleTrialTimers(index, { displayDelayMs, trialDelayMs } = {}) {
    const active = uiState.activeBlock;
    if (!active) {
      return;
    }

    const safeDisplayMs = Number.isFinite(displayDelayMs) ? Math.max(0, Math.round(displayDelayMs)) : active.displayMs;
    const safeTrialMs = Number.isFinite(trialDelayMs) ? Math.max(0, Math.round(trialDelayMs)) : active.soaMs;

    if (active.stimulusVisible && safeDisplayMs > 0) {
      active.displayEndsAtMs = performance.now() + safeDisplayMs;
      timers.display = setTimeout(() => {
        if (!uiState.activeBlock || uiState.activeBlock.trialIndex !== index) {
          return;
        }
        uiState.activeBlock.stimulusVisible = false;
        uiState.activeBlock.displayEndsAtMs = 0;
        timers.display = null;
        render();
      }, safeDisplayMs);
    } else {
      active.displayEndsAtMs = 0;
      if (safeDisplayMs === 0) {
        active.stimulusVisible = false;
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

  function updateBanner() {
    const track = root.querySelector("[data-capacity-lab-track]");
    const status = root.querySelector("[data-capacity-lab-status]");
    const wrapper = root.querySelector("[data-capacity-lab-wrapper]");
    const modality = root.querySelector("[data-capacity-lab-modality]");
    const speed = root.querySelector("[data-capacity-lab-speed]");
    const runs = root.querySelector("[data-capacity-lab-runs]");
    const active = uiState.activeBlock;
    if (track) {
      if (uiState.status === "trial" && active) {
        track.textContent = `Trial ${active.trialIndex + 1} of ${active.trials.length}`;
      } else if (uiState.status === "briefing") {
        track.textContent = "Cueing next block";
      } else if (uiState.status === "paused" && active && active.trialIndex >= 0) {
        track.textContent = `Paused on trial ${active.trialIndex + 1} of ${active.trials.length}`;
      } else if (uiState.status === "paused") {
        track.textContent = "Block paused";
      } else {
        track.textContent = "Public sandbox";
      }
    }
    if (status) status.textContent = uiState.status === "trial" ? "Live" : uiState.status === "briefing" ? "Cueing" : uiState.status === "paused" ? "Paused" : uiState.status === "result" ? "Saved" : "Ready";
    if (wrapper) wrapper.textContent = wrapperLabel(active?.plan?.wrapper || uiState.settings.wrapper);
    if (modality) modality.textContent = modalityMark(active?.plan?.targetModality || uiState.settings.targetModality);
    if (speed) speed.textContent = speedLabel(active?.plan?.speed || uiState.settings.speed);
    if (runs) runs.textContent = String(uiState.history.length);
  }

  function updateCoach() {
    const coach = root.querySelector("[data-capacity-lab-coach]");
    if (coach) {
      coach.textContent = uiState.coachMessage;
    }
  }

  function render() {
    if (!taskRoot || !telemetryRail) {
      return;
    }

    taskRoot.innerHTML = taskMarkup(uiState);
    telemetryRail.innerHTML = renderTelemetryCards(telemetryCards(uiState));
    updateBanner();
    updateCoach();

    taskRoot.querySelectorAll("[data-lab-setting]").forEach((element) => {
      element.addEventListener("change", (event) => {
        const key = event.currentTarget.dataset.labSetting;
        const value = key === "n" ? Number(event.currentTarget.value) : event.currentTarget.value;
        syncSettings({ [key]: value });
        uiState.activeMessage = "Sandbox selection updated for the next block.";
        uiState.coachMessage = `Sandbox selection updated: ${wrapperLabel(uiState.settings.wrapper)}, ${modalityLabel(uiState.settings.targetModality, uiState.settings.wrapper)}, N-${uiState.settings.n}.`;
        render();
      });
    });

    taskRoot.querySelectorAll("[data-lab-action]").forEach((element) => {
      element.addEventListener("click", (event) => {
        const action = event.currentTarget.dataset.labAction;
        if (action === "start") {
          startBlock();
        } else if (action === "match") {
          captureResponse();
        } else if (action === "pause") {
          pauseBlock();
        } else if (action === "resume") {
          resumeBlock();
        } else if (action === "discard") {
          clearTimers();
          uiState.activeBlock = null;
          uiState.status = "idle";
          uiState.activeMessage = "Block discarded. Settings are unlocked again.";
          uiState.coachMessage = uiState.activeMessage;
          render();
        } else if (action === "reset-history") {
          const persisted = clearCapacityLabHistory();
          uiState.history = persisted.history.slice();
          uiState.lastSavedEntry = null;
          uiState.activeMessage = "Local sandbox history cleared.";
          uiState.coachMessage = uiState.activeMessage;
          if (!uiState.activeBlock) {
            uiState.status = "idle";
          }
          render();
        }
      });
    });
  }

  function captureResponse() {
    const active = uiState.activeBlock;
    if (!active || uiState.status !== "trial" || active.responseCaptured) {
      return false;
    }
    active.responseCaptured = true;
    active.responseRtMs = Math.max(0, Math.round(performance.now() - active.trialStartedAtMs));
    uiState.coachMessage = "Response logged. Hold for the next trial.";
    render();
    return true;
  }

  function pauseBlock() {
    const active = uiState.activeBlock;
    if (!active || uiState.status === "paused" || (uiState.status !== "briefing" && uiState.status !== "trial")) {
      return;
    }

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
          trialRemainingMs: Math.max(0, Math.round(active.trialEndsAtMs - now)),
          elapsedTrialMs: Math.max(0, Math.round(now - active.trialStartedAtMs))
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
    }

    active.trialStartedAtMs = performance.now() - (pausedState.elapsedTrialMs || 0);
    uiState.status = "trial";
    uiState.coachMessage = `Resumed. Match the ${displayHubTargetLabel(active.plan.targetModality, active.plan.wrapper).toLowerCase()} from ${active.plan.n} turns ago. Sandbox scoring stays local.`;
    render();
    scheduleTrialTimers(active.trialIndex, {
      displayDelayMs: active.stimulusVisible ? pausedState.displayRemainingMs : 0,
      trialDelayMs: pausedState.trialRemainingMs
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
    active.trialStartedAtMs = performance.now();
    active.pausedState = null;
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
    const entry = {
      id: `xor_lab_${active.tsStart}`,
      tsStart: active.tsStart,
      tsEnd: Date.now(),
      wrapper: active.plan.wrapper,
      targetModality: active.plan.targetModality,
      speed: active.plan.speed,
      interference: active.plan.interference,
      outcomeBand: summary.outcomeBand,
      recommendedN: summary.nEnd,
      block: summary.blockResult
    };

    const persisted = appendCapacityLabHistory(entry);
    uiState.history = persisted.history.slice();
    uiState.lastSavedEntry = uiState.history[0] || entry;
    uiState.activeBlock = null;
    uiState.status = "result";
    uiState.activeMessage = `Saved ${wrapperLabel(entry.wrapper)} ${modalityLabel(entry.targetModality, entry.wrapper)} locally with ${accuracyPercent(entry.block.accuracy)} accuracy.`;
    uiState.coachMessage = `${entry.outcomeBand} block saved. Local sandbox hint: N-${entry.recommendedN}. Official progression still follows the updated stability, speed, and wrapper rules.`;
    render();
  }

  function finishTrial() {
    const active = uiState.activeBlock;
    if (!active) {
      return;
    }

    const trial = active.trials[active.trialIndex];
    const isMatch = isHubMatchAtIndex(active.trials, active.trialIndex, active.plan.n);
    const responded = active.responseCaptured;

    let classification = "correct_rejection";
    let isError = false;
    if (responded && isMatch) {
      classification = "hit";
    } else if (responded && !isMatch) {
      classification = "false_alarm";
      isError = true;
    } else if (!responded && isMatch) {
      classification = "miss";
      isError = true;
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

    if (timers.display) {
      clearTimeout(timers.display);
      timers.display = null;
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

  function startBlock() {
    if (uiState.activeBlock) {
      return;
    }

    clearTimers();
    const tsStart = Date.now();
    const blockIndex = uiState.history.length + 1;
    const mappingSeed = uiState.settings.wrapper === "hub_noncat"
      ? hash32(`${tsStart}:${uiState.settings.targetModality}:${blockIndex}`)
      : undefined;
    const plan = createHubBlockPlan({
      wrapper: uiState.settings.wrapper,
      blockIndex,
      n: uiState.settings.n,
      speed: uiState.settings.speed,
      interference: uiState.settings.interference,
      targetModality: uiState.settings.targetModality,
      mappingSeed
    });
    const build = createHubBlockTrials({
      wrapper: plan.wrapper,
      n: plan.n,
      targetModality: plan.targetModality,
      speed: plan.speed,
      interference: plan.interference,
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
      trialStartedAtMs: 0,
      cueEndsAtMs: 0,
      displayEndsAtMs: 0,
      trialEndsAtMs: 0,
      pausedState: null,
      trialOutcomes: []
    };
    uiState.status = "briefing";
    uiState.activeMessage = `Starting ${wrapperLabel(plan.wrapper)} ${modalityLabel(plan.targetModality, plan.wrapper)} at N-${plan.n}.`;
    uiState.coachMessage = `Get ready. Match the ${displayHubTargetLabel(plan.targetModality, plan.wrapper).toLowerCase()} from ${plan.n} turns ago. Official progression is not advanced from this sandbox alone.`;
    render();
    scheduleCue(HUB_CUE_MS);
  }

  function handleKeydown(event) {
    const tagName = String(event.target?.tagName || "").toLowerCase();
    if (tagName === "select") {
      return;
    }
    if ((event.code === "Space" || event.code === "Enter") && captureResponse()) {
      event.preventDefault();
    }
  }

  window.addEventListener("keydown", handleKeydown);
  render();

  return function unmountCapacityLab() {
    clearTimers();
    window.removeEventListener("keydown", handleKeydown);
  };
}
