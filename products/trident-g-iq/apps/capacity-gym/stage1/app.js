import {
  appendSessionSummary,
  exportGymStateJson,
  getSessionHistory,
  loadGymState,
  resetGymState,
  updateSettings
} from "./lib/storage.js";
import {
  HUB_BASE_TRIALS,
  HUB_WRAPPERS,
  HUB_CUE_MS,
  HUB_N_MAX,
  HUB_TARGET_MODALITIES,
  HUB_TOTAL_BLOCKS,
  createHubBlockPlan,
  createHubBlockTrials,
  createHubSessionSummary,
  isHubMatchAtIndex,
  modalityLabel,
  summarizeHubBlock
} from "./games/hub.js";
import { hash32 } from "./lib/rng.js";
import { coachUpdateAfterBlock } from "./lib/coach.js";
import { createFakeTransitiveSession } from "./games/transitive.js";
import { createFakeGraphSession } from "./games/graph.js";
import { createFakePropositionalSession } from "./games/propositional.js";

const ROUTES = new Set(["home", "play-hub", "play-relational", "history", "settings"]);
const DEFAULT_ROUTE = "home";
const appRoot = document.querySelector("#app");
const initialSettings = loadGymState().settings;

const hubPreferences = {
  wrapper: initialSettings.lastWrapper === "hub_noncat" ? "hub_noncat" : "hub_cat",
  speed: initialSettings.lastSpeed === "fast" ? "fast" : "slow",
  interference: initialSettings.lastInterference === "high" ? "high" : "low"
};

let flash = "";
let flashKind = "success";
let hubSession = null;
const hubTimers = {
  cue: null,
  display: null,
  trial: null
};

function ensureRoute() {
  const raw = (window.location.hash || "").replace(/^#\//, "").trim();
  if (!ROUTES.has(raw)) {
    window.location.hash = `/${DEFAULT_ROUTE}`;
    return null;
  }
  return raw;
}

function setActiveNav(route) {
  const links = document.querySelectorAll(".nav a[data-route]");
  links.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("data-route") === route);
  });
}

function renderFlash() {
  if (!flash) {
    return "";
  }
  return `<div class="status ${flashKind}">${flash}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function clearHubTimers() {
  if (hubTimers.cue) {
    clearTimeout(hubTimers.cue);
  }
  if (hubTimers.display) {
    clearTimeout(hubTimers.display);
  }
  if (hubTimers.trial) {
    clearTimeout(hubTimers.trial);
  }
  hubTimers.cue = null;
  hubTimers.display = null;
  hubTimers.trial = null;
}

function setFlash(message, kind = "success") {
  flash = message;
  flashKind = kind;
}

function clearFlash() {
  flash = "";
  flashKind = "success";
}

function normalizeHubWrapper(value) {
  return value === "hub_noncat" ? "hub_noncat" : "hub_cat";
}

function normalizeHubSpeed(value) {
  return value === "fast" ? "fast" : "slow";
}

function normalizeHubInterference(value) {
  return value === "high" ? "high" : "low";
}

function normalizeHubTargetModality(value, blockIndex) {
  if (HUB_TARGET_MODALITIES.includes(value)) {
    return value;
  }
  return HUB_TARGET_MODALITIES[(blockIndex - 1) % HUB_TARGET_MODALITIES.length];
}

function normalizeCoachFlags(flags) {
  if (!flags || typeof flags !== "object") {
    return undefined;
  }
  return {
    coachState: flags.coachState,
    pulseType: flags.pulseType ?? null,
    swapSegment: flags.swapSegment ?? null,
    wasSwapProbe: Boolean(flags.wasSwapProbe)
  };
}

function resolveNextBlockPreview(session) {
  if (!session || session.status !== "running") {
    return {
      wrapper: normalizeHubWrapper(hubPreferences.wrapper),
      speed: normalizeHubSpeed(hubPreferences.speed),
      interference: normalizeHubInterference(hubPreferences.interference),
      coachState: null
    };
  }

  const patch = session.pendingPlanPatch && typeof session.pendingPlanPatch === "object"
    ? session.pendingPlanPatch
    : {};
  const lastWrapper = session.lastBlockSummary?.wrapper || normalizeHubWrapper(hubPreferences.wrapper);
  return {
    wrapper: patch.wrapper ? normalizeHubWrapper(patch.wrapper) : lastWrapper,
    speed: patch.speed ? normalizeHubSpeed(patch.speed) : normalizeHubSpeed(hubPreferences.speed),
    interference: patch.interference ? normalizeHubInterference(patch.interference) : normalizeHubInterference(hubPreferences.interference),
    coachState: patch.flags?.coachState || null
  };
}

function renderHome(state) {
  return `
    <section class="card">
      <h2>Home / Today</h2>
      <p class="hint">Stage 3 includes playable hub_cat and hub_noncat sessions (10 blocks).</p>
      <div class="row">
        <button class="btn primary" data-action="go-play-hub">Start Recommended Session</button>
      </div>
      ${renderFlash()}
    </section>
    <section class="card">
      <h3>Today Snapshot</h3>
      <p>Stored sessions: <strong>${state.history.length}</strong></p>
      <p>Bank units: <strong>${state.bankUnits}</strong></p>
      <p>Relational unlocks: <strong>${state.unlocks.transitive || state.unlocks.graph || state.unlocks.propositional ? "Available" : "Locked"}</strong></p>
    </section>
  `;
}

function renderHubConfigControls({ showWrapperSelect = true, wrapperLocked = false, dialsLocked = false } = {}) {
  const wrapperLock = wrapperLocked ? "disabled" : "";
  const dialLock = dialsLocked ? "disabled" : "";
  const wrapperControl = showWrapperSelect
    ? `
      <label class="hub-config-item">
        Wrapper
        <select id="hub-wrapper-select" ${wrapperLock}>
          ${HUB_WRAPPERS.map((wrapperId) => (
            `<option value="${wrapperId}" ${hubPreferences.wrapper === wrapperId ? "selected" : ""}>${wrapperId}</option>`
          )).join("")}
        </select>
      </label>
    `
    : `
      <div class="hub-config-item hub-config-readonly">
        <span>Wrapper</span>
        <strong>Coach-controlled during session</strong>
      </div>
    `;
  return `
    <div class="row hub-config-row">
      ${wrapperControl}
      <label class="hub-config-item">
        Speed
        <select id="hub-speed-select" ${dialLock}>
          <option value="slow" ${hubPreferences.speed === "slow" ? "selected" : ""}>Slow (3000ms SOA)</option>
          <option value="fast" ${hubPreferences.speed === "fast" ? "selected" : ""}>Fast (1400ms SOA)</option>
        </select>
      </label>
      <label class="hub-config-item">
        Interference
        <select id="hub-interference-select" ${dialLock}>
          <option value="low" ${hubPreferences.interference === "low" ? "selected" : ""}>Low</option>
          <option value="high" ${hubPreferences.interference === "high" ? "selected" : ""}>High</option>
        </select>
      </label>
    </div>
    <p class="hint">Interference controls cross-feature lure rate (LOW 10%, HIGH 25% of target non-match trials).</p>
  `;
}

function renderHubStimulus(trial, visible, targetLabel, renderMapping, wrapper) {
  const points = Array.isArray(renderMapping?.markerPositions) ? renderMapping.markerPositions : [];
  const markerDots = points.map((point) => (
    `<span class="hub-marker" style="left:${point.xPct}%;top:${point.yPct}%;"></span>`
  )).join("");

  const point = trial && points[trial.locIdx] ? points[trial.locIdx] : { xPct: 50, yPct: 50 };
  const tokenVisible = Boolean(trial && visible);
  const textColor = trial && trial.display.colourHex.toLowerCase() === "#ffffff" ? "#111111" : "#ffffff";
  const tokenClass = tokenVisible ? "hub-token" : "hub-token hidden";
  const tokenBg = tokenVisible && trial ? trial.display.colourHex : "transparent";
  const tokenText = tokenVisible && trial ? escapeHtml(trial.display.symbolLabel) : "";
  const stimulus = `<div class="${tokenClass}" style="left:${point.xPct}%;top:${point.yPct}%;background:${tokenBg};color:${textColor};">${tokenText}</div>`;

  const meta = trial
    ? visible
      ? `Colour: <strong>${escapeHtml(trial.display.colourLabel)}</strong> | Symbol: <strong>${escapeHtml(trial.display.symbolLabel)}</strong>`
      : "Stimulus cleared. Response window remains open until trial end."
    : "Get ready. Trials start after cue.";

  return `
    <div class="hub-stimulus">
      <p class="hub-target">Target: <strong>${escapeHtml(targetLabel)}</strong> | Wrapper: <strong>${escapeHtml(wrapper)}</strong></p>
      <div class="hub-arena">
        <div class="hub-ring"></div>
        ${markerDots}
        ${stimulus}
      </div>
      <p class="hub-stimulus-meta">${meta}</p>
    </div>
  `;
}

function renderBlockSummary(block) {
  if (!block) {
    return "";
  }
  return `
    <div class="hub-summary">
      <p><strong>Block ${block.blockIndex} Result</strong> (${block.outcomeBand})</p>
      <p>N: ${block.nStart} -> ${block.nEnd} | Trials: ${block.trials}</p>
      <p>Hits: ${block.hits} | Misses: ${block.misses} | FA: ${block.falseAlarms} | CR: ${block.correctRejections}</p>
      <p>Accuracy: ${(block.accuracy * 100).toFixed(1)}% | Mean RT: ${block.meanRtMs ?? "n/a"} ms | RT SD: ${block.rtSdMs ?? "n/a"} ms</p>
      <p>Lure trials: ${block.lureTrials ?? 0} | FA on lures: ${block.faOnLures ?? 0}</p>
      <p>Error bursts: ${block.errorBursts} | Lapses (Hub match omissions): ${block.lapseCount}</p>
    </div>
  `;
}

function renderPlayHub() {
  const running = Boolean(hubSession && hubSession.status === "running");
  const completed = Boolean(hubSession && hubSession.status === "completed");
  const blockActive = Boolean(hubSession && hubSession.status === "running" && (hubSession.phase === "cue" || hubSession.phase === "trial"));
  const requestedWrapper = normalizeHubWrapper(hubPreferences.wrapper);

  if (!running && !completed) {
    return `
      <section class="card">
        <h2>Play Hub</h2>
        <p class="hint">Stage 3: choose hub_cat or hub_noncat with cue, timed trials, lure-based interference, and deterministic block mappings.</p>
        ${renderHubConfigControls({ showWrapperSelect: true, wrapperLocked: false, dialsLocked: false })}
        <div class="row">
          <button class="btn primary" data-action="start-hub-session">Start ${requestedWrapper} Session</button>
        </div>
        <p class="hint">Session shape: 10 blocks, each block trials = ${HUB_BASE_TRIALS} + N.</p>
        ${renderFlash()}
      </section>
    `;
  }

  if (completed) {
    const summary = hubSession.sessionSummary;
    const finalBlock = hubSession.lastBlockSummary;
    return `
      <section class="card">
        <h2>Play Hub</h2>
        ${renderHubConfigControls({ showWrapperSelect: true, wrapperLocked: false, dialsLocked: false })}
        <div class="status success">Session complete and saved.</div>
        <p>Session ID: <code>${escapeHtml(summary.id)}</code></p>
        <p>Blocks saved: <strong>${summary.blocks.length}</strong> / ${HUB_TOTAL_BLOCKS}</p>
        <p>Session start: ${new Date(summary.tsStart).toLocaleString()}</p>
        <p>Session end: ${new Date(summary.tsEnd).toLocaleString()}</p>
        ${renderBlockSummary(finalBlock)}
        <div class="row">
          <button class="btn primary" data-action="start-hub-session">Start New ${requestedWrapper} Session</button>
        </div>
        ${renderFlash()}
      </section>
    `;
  }

  const block = hubSession.currentBlock;
  const trial = block && block.trialIndex >= 0 ? block.trials[block.trialIndex] : null;
  const trialNumber = block ? block.trialIndex + 1 : 0;
  const trialCount = block ? block.trials.length : 0;
  const responseCaptured = block ? block.responseCaptured : false;
  const targetLabel = block ? modalityLabel(block.plan.targetModality) : "";
  const preview = resolveNextBlockPreview(hubSession);
  const currentWrapper = block
    ? block.plan.wrapper
    : (hubSession.lastBlockSummary?.wrapper || preview.wrapper);
  const currentSpeed = block ? block.plan.speed : (hubSession.lastBlockSummary ? hubSession.lastBlockSummary.speed : "n/a");
  const currentInterference = block ? block.plan.interference : (hubSession.lastBlockSummary ? hubSession.lastBlockSummary.interference : "n/a");
  const coachNotice = hubSession.coachNotice
    ? `<div class="status coach">${escapeHtml(hubSession.coachNotice)}</div>`
    : "";

  let phasePanel = "";
  if (hubSession.phase === "cue") {
    phasePanel = `
      <div class="hub-phase cue">
        <p class="hub-phase-title">Cue</p>
        ${renderHubStimulus(null, false, targetLabel, block?.renderMapping, block?.plan?.wrapper || hubPreferences.wrapper)}
        <p class="hint">Cue duration: ${HUB_CUE_MS} ms</p>
      </div>
    `;
  } else if (hubSession.phase === "trial") {
    phasePanel = `
      <div class="hub-phase trial">
        <p class="hub-phase-title">Trial ${trialNumber} / ${trialCount}</p>
        <p>Respond MATCH when the target modality matches ${block.plan.n}-back.</p>
        ${renderHubStimulus(trial, block.stimulusVisible, targetLabel, block.renderMapping, block.plan.wrapper)}
        <div class="row">
          <button class="btn primary" data-action="hub-match" ${responseCaptured ? "disabled" : ""}>MATCH (Space)</button>
        </div>
        <p class="hint">${responseCaptured ? `Response recorded at ${block.responseRtMs} ms.` : "No response recorded yet."}</p>
      </div>
    `;
  } else {
    phasePanel = `
      <div class="hub-phase result">
        ${renderBlockSummary(hubSession.lastBlockSummary)}
        <div class="row">
          <button class="btn primary" data-action="hub-next-block">Start Next Block</button>
        </div>
      </div>
    `;
  }

  return `
    <section class="card">
      <h2>Play Hub</h2>
      ${renderHubConfigControls({ showWrapperSelect: false, wrapperLocked: true, dialsLocked: blockActive })}
      <p>Block: <strong>${hubSession.blockCursor + (hubSession.phase === "block-result" ? 0 : 1)}</strong> / ${HUB_TOTAL_BLOCKS}</p>
      <p>Current N: <strong>${hubSession.currentN}</strong> (bounds 1..${HUB_N_MAX})</p>
      <p>Active wrapper: <strong>${currentWrapper}</strong></p>
      <p>Current block settings: <strong>${currentSpeed}</strong> speed, <strong>${currentInterference}</strong> interference.</p>
      ${hubSession.phase === "block-result" ? `<p>Next block settings: <strong>${preview.wrapper}</strong> wrapper, <strong>${preview.speed}</strong> speed, <strong>${preview.interference}</strong> interference${preview.coachState ? ` | Coach: <strong>${preview.coachState}</strong>` : ""}.</p>` : ""}
      ${hubSession.phase === "block-result" ? coachNotice : ""}
      ${phasePanel}
      ${renderFlash()}
    </section>
  `;
}

function renderPlayRelational(state) {
  const relationalUnlocked = state.unlocks.transitive || state.unlocks.graph || state.unlocks.propositional;
  return `
    <section class="card">
      <h2>Play Relational</h2>
      <p class="hint">Select a relational mode stub. Each button writes one fake session.</p>
      <p>Unlock status: <strong>${relationalUnlocked ? "Unlocked (at least one mode)" : "Locked by default in Stage 1 state"}</strong></p>
      <div class="row">
        <button class="btn" data-action="fake-relational" data-mode="transitive">Fake Transitive</button>
        <button class="btn" data-action="fake-relational" data-mode="graph">Fake Graph</button>
        <button class="btn" data-action="fake-relational" data-mode="propositional">Fake Propositional</button>
      </div>
      ${renderFlash()}
    </section>
  `;
}

function renderHistory(history) {
  const items = history.map((session) => {
    const started = new Date(session.tsStart).toLocaleString();
    const ended = new Date(session.tsEnd).toLocaleString();
    const blockCount = Array.isArray(session.blocks) ? session.blocks.length : 0;
    return `
      <li class="history-item">
        <p><strong>${escapeHtml(session.id)}</strong></p>
        <p>Family: ${escapeHtml(session.wrapperFamily || "unknown")}</p>
        <p>Date: ${escapeHtml(session.dateLocal || "")}</p>
        <p>Blocks: ${blockCount}</p>
        <p>Start: ${escapeHtml(started)}</p>
        <p>End: ${escapeHtml(ended)}</p>
      </li>
    `;
  }).join("");

  return `
    <section class="card">
      <h2>History</h2>
      <p class="hint">Session summaries loaded from versioned localStorage.</p>
      ${renderFlash()}
      ${history.length ? `<ul class="history-list">${items}</ul>` : "<p>No sessions yet.</p>"}
    </section>
  `;
}

function renderSettings(state) {
  return `
    <section class="card">
      <h2>Settings</h2>
      <div class="label-row">
        <label>
          <input class="toggle" id="sound-toggle" type="checkbox" ${state.settings.soundOn ? "checked" : ""}>
          Sound enabled
        </label>
      </div>
      <div class="row">
        <button class="btn" data-action="export-json">Export JSON</button>
        <button class="btn danger" data-action="reset-data">Reset Local Data</button>
      </div>
      <p class="hint">Reset only affects key <code>tg_capacity_gym_v1</code>.</p>
      ${renderFlash()}
    </section>
  `;
}

function dropRunningHubIfLeaving(route) {
  if (route === "play-hub") {
    return;
  }
  if (hubSession && hubSession.status === "running") {
    clearHubTimers();
    hubSession = null;
    setFlash("Hub session stopped because you left Play Hub before completion.", "warn");
  }
}

function render() {
  const route = ensureRoute();
  if (!route) {
    return;
  }

  dropRunningHubIfLeaving(route);
  const state = loadGymState();
  setActiveNav(route);

  if (route === "home") {
    appRoot.innerHTML = renderHome(state);
    return;
  }
  if (route === "play-hub") {
    appRoot.innerHTML = renderPlayHub();
    return;
  }
  if (route === "play-relational") {
    appRoot.innerHTML = renderPlayRelational(state);
    return;
  }
  if (route === "history") {
    appRoot.innerHTML = renderHistory(getSessionHistory());
    return;
  }
  appRoot.innerHTML = renderSettings(state);
}

function startHubSession() {
  clearHubTimers();
  clearFlash();
  const tsStart = Date.now();
  const selectedWrapper = normalizeHubWrapper(hubPreferences.wrapper);
  const sessionSeed = hash32(String(tsStart));

  hubSession = {
    status: "running",
    phase: "cue",
    tsStart,
    sessionSeed,
    blockCursor: 0,
    currentN: 1,
    blocksPlanned: [],
    blocks: [],
    completedBlocks: [],
    coachContext: {
      pendingStabilise: false,
      pendingSwapReturnWrapper: null
    },
    pendingPlanPatch: {
      wrapper: selectedWrapper,
      flags: {
        coachState: "STABILISE",
        pulseType: null,
        swapSegment: null,
        wasSwapProbe: false
      }
    },
    coachNotice: "",
    currentBlock: null,
    lastBlockSummary: null,
    sessionSummary: null
  };

  updateSettings({
    lastWrapper: selectedWrapper,
    lastSpeed: hubPreferences.speed,
    lastInterference: hubPreferences.interference
  });

  beginHubBlock();
}

function beginHubBlock() {
  if (!hubSession || hubSession.status !== "running") {
    return;
  }
  if (hubSession.blockCursor >= HUB_TOTAL_BLOCKS) {
    completeHubSession();
    return;
  }

  const blockIndex = hubSession.blockCursor + 1;
  const blockIndexZero = hubSession.blockCursor;
  const lastPlan = hubSession.blocksPlanned.length
    ? hubSession.blocksPlanned[hubSession.blocksPlanned.length - 1]
    : null;
  const pendingPatch = hubSession.pendingPlanPatch && typeof hubSession.pendingPlanPatch === "object"
    ? hubSession.pendingPlanPatch
    : {};

  const wrapper = pendingPatch.wrapper
    ? normalizeHubWrapper(pendingPatch.wrapper)
    : normalizeHubWrapper(lastPlan?.wrapper || hubPreferences.wrapper);
  const targetModality = normalizeHubTargetModality(pendingPatch.targetModality, blockIndex);
  const mappingSeed = wrapper === "hub_noncat"
    ? hash32(`${hubSession.sessionSeed}:hub_noncat:v1:${blockIndexZero}`)
    : undefined;
  const nextN = Number.isFinite(pendingPatch.n)
    ? Math.max(1, Math.min(HUB_N_MAX, Math.round(pendingPatch.n)))
    : hubSession.currentN;
  const speed = pendingPatch.speed
    ? normalizeHubSpeed(pendingPatch.speed)
    : normalizeHubSpeed(hubPreferences.speed);
  const interference = pendingPatch.interference
    ? normalizeHubInterference(pendingPatch.interference)
    : normalizeHubInterference(hubPreferences.interference);
  const flags = normalizeCoachFlags(pendingPatch.flags);

  const plan = createHubBlockPlan({
    wrapper,
    blockIndex,
    n: nextN,
    speed,
    interference,
    targetModality,
    mappingSeed,
    flags
  });
  const blockBuild = createHubBlockTrials({
    wrapper: plan.wrapper,
    n: plan.n,
    targetModality: plan.targetModality,
    speed: plan.speed,
    interference: plan.interference,
    mappingSeed: plan.mappingSeed,
    baseTrials: HUB_BASE_TRIALS,
    seed: Date.now() + blockIndex
  });

  hubSession.pendingPlanPatch = {};
  hubSession.blocksPlanned.push(plan);
  hubSession.currentBlock = {
    plan,
    trials: blockBuild.trials,
    soaMs: blockBuild.soaMs,
    displayMs: blockBuild.displayMs,
    renderMapping: blockBuild.renderMapping,
    trialIndex: -1,
    stimulusVisible: false,
    responseCaptured: false,
    responseRtMs: null,
    trialStartedAtMs: 0,
    trialOutcomes: []
  };
  hubSession.phase = "cue";

  render();
  clearHubTimers();
  hubTimers.cue = setTimeout(() => {
    startHubTrial(0);
  }, HUB_CUE_MS);
}

function startHubTrial(trialIndex) {
  if (!hubSession || hubSession.status !== "running" || !hubSession.currentBlock) {
    return;
  }

  const block = hubSession.currentBlock;
  block.trialIndex = trialIndex;
  block.stimulusVisible = true;
  block.responseCaptured = false;
  block.responseRtMs = null;
  block.trialStartedAtMs = performance.now();
  hubSession.phase = "trial";

  render();
  if (hubTimers.display) {
    clearTimeout(hubTimers.display);
  }
  if (hubTimers.trial) {
    clearTimeout(hubTimers.trial);
  }

  hubTimers.display = setTimeout(() => {
    if (!hubSession || hubSession.status !== "running" || hubSession.phase !== "trial") {
      return;
    }
    const current = hubSession.currentBlock;
    if (!current || current.trialIndex !== trialIndex) {
      return;
    }
    current.stimulusVisible = false;
    render();
  }, block.displayMs);

  hubTimers.trial = setTimeout(() => {
    finishHubTrial();
  }, block.soaMs);
}

function captureHubResponse() {
  if (!hubSession || hubSession.status !== "running" || hubSession.phase !== "trial" || !hubSession.currentBlock) {
    return false;
  }
  const block = hubSession.currentBlock;
  if (block.responseCaptured) {
    return false;
  }
  block.responseCaptured = true;
  block.responseRtMs = Math.max(0, Math.round(performance.now() - block.trialStartedAtMs));
  render();
  return true;
}

function finishHubTrial() {
  if (!hubSession || hubSession.status !== "running" || !hubSession.currentBlock) {
    return;
  }
  const block = hubSession.currentBlock;
  const trial = block.trials[block.trialIndex];
  const isMatch = isHubMatchAtIndex(block.trials, block.trialIndex, block.plan.n);
  const responded = block.responseCaptured;

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

  block.trialOutcomes.push({
    trialIndex: block.trialIndex,
    canonKey: trial.canonKey,
    isMatch,
    isLure: Boolean(trial.isLure),
    responded,
    rtMs: responded ? block.responseRtMs : null,
    isError,
    // Hub lapse is defined as timeout on match-required trials only.
    isLapse: !responded && isMatch,
    classification
  });

  if (hubTimers.display) {
    clearTimeout(hubTimers.display);
    hubTimers.display = null;
  }
  if (hubTimers.trial) {
    clearTimeout(hubTimers.trial);
    hubTimers.trial = null;
  }

  const nextTrialIndex = block.trialIndex + 1;
  if (nextTrialIndex < block.trials.length) {
    startHubTrial(nextTrialIndex);
    return;
  }
  finishHubBlock();
}

function finishHubBlock() {
  if (!hubSession || hubSession.status !== "running" || !hubSession.currentBlock) {
    return;
  }

  const block = hubSession.currentBlock;
  const blockSummary = summarizeHubBlock({
    plan: block.plan,
    trials: block.trials,
    trialOutcomes: block.trialOutcomes,
    nMax: HUB_N_MAX
  });

  hubSession.blocks.push(blockSummary.blockResult);
  hubSession.lastBlockSummary = {
    ...blockSummary.blockResult,
    outcomeBand: blockSummary.outcomeBand
  };
  hubSession.completedBlocks.push({
    plan: block.plan,
    result: blockSummary.blockResult,
    outcomeBand: blockSummary.outcomeBand
  });
  hubSession.currentN = blockSummary.nEnd;
  hubSession.blockCursor += 1;
  hubSession.currentBlock = null;

  if (hubSession.blockCursor >= HUB_TOTAL_BLOCKS) {
    completeHubSession();
    return;
  }

  const coachDecision = coachUpdateAfterBlock(hubSession.lastBlockSummary, {
    completedBlocks: hubSession.completedBlocks,
    coachContext: hubSession.coachContext
  });
  if (coachDecision && typeof coachDecision === "object") {
    hubSession.pendingPlanPatch = coachDecision.patch && typeof coachDecision.patch === "object"
      ? coachDecision.patch
      : {};
    hubSession.coachContext = coachDecision.coachContext && typeof coachDecision.coachContext === "object"
      ? coachDecision.coachContext
      : hubSession.coachContext;
    hubSession.coachNotice = typeof coachDecision.notice === "string" ? coachDecision.notice : "";
  } else {
    hubSession.pendingPlanPatch = {};
    hubSession.coachNotice = "";
  }

  hubSession.phase = "block-result";
  render();
}

function completeHubSession() {
  if (!hubSession || hubSession.status !== "running") {
    return;
  }
  clearHubTimers();

  const tsEnd = Date.now();
  const summary = createHubSessionSummary({
    tsStart: hubSession.tsStart,
    tsEnd,
    blocksPlanned: hubSession.blocksPlanned,
    blocks: hubSession.blocks
  });
  appendSessionSummary(summary);

  hubSession.status = "completed";
  hubSession.phase = "session-done";
  hubSession.sessionSummary = summary;
  setFlash("Hub session complete and saved to History.", "success");
  render();
}

function addFakeSessionFromMode(mode) {
  if (mode === "transitive") {
    return createFakeTransitiveSession();
  }
  if (mode === "graph") {
    return createFakeGraphSession();
  }
  return createFakePropositionalSession();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  const action = target.getAttribute("data-action");

  if (action === "go-play-hub") {
    window.location.hash = "/play-hub";
    return;
  }

  if (action === "start-hub-session") {
    startHubSession();
    return;
  }

  if (action === "hub-match") {
    captureHubResponse();
    return;
  }

  if (action === "hub-next-block") {
    beginHubBlock();
    return;
  }

  clearFlash();

  if (action === "fake-relational") {
    const mode = target.getAttribute("data-mode") || "transitive";
    appendSessionSummary(addFakeSessionFromMode(mode));
    setFlash(`Fake ${mode} session saved to localStorage.`, "success");
    render();
    return;
  }

  if (action === "export-json") {
    const payload = exportGymStateJson();
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStamp = new Date().toISOString().replaceAll(":", "-");
    a.href = url;
    a.download = `capacity-gym-stage1-${dateStamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setFlash("Export completed.", "success");
    render();
    return;
  }

  if (action === "reset-data") {
    const confirmed = window.confirm("Reset all Capacity Gym Stage 1 local data?");
    if (!confirmed) {
      setFlash("Reset cancelled.", "warn");
      render();
      return;
    }
    resetGymState();
    setFlash("Local data reset complete.", "success");
    render();
  }
});

document.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
    return;
  }
  const wrapperLocked = Boolean(hubSession && hubSession.status === "running");
  const hubLocked = Boolean(hubSession && hubSession.status === "running" && (hubSession.phase === "cue" || hubSession.phase === "trial"));

  if (target.id === "sound-toggle" && target instanceof HTMLInputElement) {
    updateSettings({ soundOn: target.checked });
    setFlash("Settings saved.", "success");
    render();
    return;
  }

  if (target.id === "hub-wrapper-select" && !wrapperLocked) {
    hubPreferences.wrapper = target.value === "hub_noncat" ? "hub_noncat" : "hub_cat";
    updateSettings({ lastWrapper: hubPreferences.wrapper });
    render();
    return;
  }

  if (target.id === "hub-speed-select" && !hubLocked) {
    hubPreferences.speed = target.value === "fast" ? "fast" : "slow";
    updateSettings({ lastSpeed: hubPreferences.speed });
    render();
    return;
  }

  if (target.id === "hub-interference-select" && !hubLocked) {
    hubPreferences.interference = target.value === "high" ? "high" : "low";
    updateSettings({ lastInterference: hubPreferences.interference });
    render();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space") {
    return;
  }
  const handled = captureHubResponse();
  if (handled) {
    event.preventDefault();
  }
});

window.addEventListener("hashchange", render);
render();
