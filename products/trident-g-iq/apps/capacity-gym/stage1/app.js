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
import {
  REL_BASE_TRIALS,
  REL_CUE_MS,
  REL_N_MAX,
  REL_QUIZ_TIMEOUT_MS,
  REL_TOTAL_BLOCKS,
  createRelationalBlockPlan,
  createRelationalBlockTrials,
  createRelationalSessionSummary,
  isRelationalMatchAtIndex,
  summarizeRelationalBlock
} from "./games/relational.js";
import { hash32 } from "./lib/rng.js";
import { coachUpdateAfterBlock } from "./lib/coach.js";
import { transitiveMode } from "./games/transitive.js";
import { graphMode } from "./games/graph.js";
import { propositionalMode } from "./games/propositional.js";

const ROUTES = new Set(["home", "play-hub", "play-relational", "history", "settings"]);
const DEFAULT_ROUTE = "home";
const appRoot = document.querySelector("#app");
const initialState = loadGymState();
const initialSettings = initialState.settings;

const hubPreferences = {
  wrapper: initialSettings.lastWrapper === "hub_noncat" ? "hub_noncat" : "hub_cat",
  speed: initialSettings.lastSpeed === "fast" ? "fast" : "slow",
  interference: initialSettings.lastInterference === "high" ? "high" : "low"
};
const FIRST_RUN_BASELINE_BLOCK = {
  wrapper: "hub_cat",
  n: 1,
  speed: "slow",
  interference: "low"
};

if (isFirstHubRun(initialState)) {
  hubPreferences.wrapper = FIRST_RUN_BASELINE_BLOCK.wrapper;
  hubPreferences.speed = FIRST_RUN_BASELINE_BLOCK.speed;
  hubPreferences.interference = FIRST_RUN_BASELINE_BLOCK.interference;
}

let flash = "";
let flashKind = "success";
let hubSession = null;
let relSession = null;
const REL_MODE_MAP = {
  transitive: transitiveMode,
  graph: graphMode,
  propositional: propositionalMode
};
const hubTimers = {
  cue: null,
  display: null,
  trial: null
};
const relTimers = {
  cue: null,
  display: null,
  trial: null,
  quizTimeout: null,
  quizTick: null,
  quizAdvance: null
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

function clearRelTimers() {
  if (relTimers.cue) {
    clearTimeout(relTimers.cue);
  }
  if (relTimers.display) {
    clearTimeout(relTimers.display);
  }
  if (relTimers.trial) {
    clearTimeout(relTimers.trial);
  }
  if (relTimers.quizTimeout) {
    clearTimeout(relTimers.quizTimeout);
  }
  if (relTimers.quizTick) {
    clearInterval(relTimers.quizTick);
  }
  if (relTimers.quizAdvance) {
    clearTimeout(relTimers.quizAdvance);
  }
  relTimers.cue = null;
  relTimers.display = null;
  relTimers.trial = null;
  relTimers.quizTimeout = null;
  relTimers.quizTick = null;
  relTimers.quizAdvance = null;
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

function isFirstHubRun(state) {
  const safeState = state && typeof state === "object" ? state : loadGymState();
  const hasHubHistory = Array.isArray(safeState.history)
    ? safeState.history.some((entry) => entry && entry.wrapperFamily === "hub")
    : false;
  const hasRunHubBefore = Boolean(safeState.settings?.hasRunHubBefore);
  return !hasHubHistory || !hasRunHubBefore;
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

function renderHubConfigControls({
  showWrapperSelect = true,
  wrapperLocked = false,
  dialsLocked = false,
  speedValue = hubPreferences.speed,
  interferenceValue = hubPreferences.interference
} = {}) {
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
          <option value="slow" ${speedValue === "slow" ? "selected" : ""}>Slow (3000ms SOA)</option>
          <option value="fast" ${speedValue === "fast" ? "selected" : ""}>Fast (1400ms SOA)</option>
        </select>
      </label>
      <label class="hub-config-item">
        Interference
        <select id="hub-interference-select" ${dialLock}>
          <option value="low" ${interferenceValue === "low" ? "selected" : ""}>Low</option>
          <option value="high" ${interferenceValue === "high" ? "selected" : ""}>High</option>
        </select>
      </label>
    </div>
    <p class="hint">Interference controls cross-feature lure rate (LOW 10%, HIGH 25% of target non-match trials).</p>
  `;
}

function renderHubStimulus(trial, visible, targetLabel, renderMapping, wrapper, runtimeInfo = "") {
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
      ${runtimeInfo ? `<p class="hub-runtime">${escapeHtml(runtimeInfo)}</p>` : ""}
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

function renderRelationalStimulus(trial, visible, runtimeInfo = "") {
  if (!trial) {
    return `
      <div class="rel-stimulus">
        ${runtimeInfo ? `<p class="hub-runtime">${escapeHtml(runtimeInfo)}</p>` : ""}
        <p class="hint">Get ready. Trials start after cue.</p>
      </div>
    `;
  }

  const display = trial.display || {};
  const textVisible = Boolean(visible);

  if (display.type === "graph") {
    const nodes = Array.isArray(display.nodes) ? display.nodes : [];
    const nodeMarkup = nodes.map((node) => (
      `<span class="rel-graph-node ${textVisible ? "" : "hidden"}" style="left:${node.xPct}%;top:${node.yPct}%;background:${node.colorHex};"></span>`
    )).join("");
    const arrow = display.arrow;
    const arrowMarkup = textVisible && arrow
      ? `
        <svg class="rel-graph-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <marker id="rel-arrow-head" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0,0 6,3 0,6" fill="#1f2937"></polygon>
            </marker>
          </defs>
          <line x1="${arrow.x1}" y1="${arrow.y1}" x2="${arrow.x2}" y2="${arrow.y2}" marker-end="url(#rel-arrow-head)"></line>
        </svg>
      `
      : "";
    const caption = textVisible
      ? (display.caption || "")
      : "Stimulus cleared. Response window remains open until trial end.";
    return `
      <div class="rel-stimulus">
        ${runtimeInfo ? `<p class="hub-runtime">${escapeHtml(runtimeInfo)}</p>` : ""}
        <div class="rel-graph-arena">
          <div class="hub-ring"></div>
          ${nodeMarkup}
          ${arrowMarkup}
        </div>
        <p class="rel-caption">${escapeHtml(caption)}</p>
      </div>
    `;
  }

  const tokenText = textVisible ? escapeHtml(display.text || "") : "";
  const tokenClass = textVisible ? "rel-token" : "rel-token hidden";
  const caption = textVisible
    ? (display.caption || "")
    : "Stimulus cleared. Response window remains open until trial end.";
  return `
    <div class="rel-stimulus">
      ${runtimeInfo ? `<p class="hub-runtime">${escapeHtml(runtimeInfo)}</p>` : ""}
      <div class="${tokenClass}">${tokenText}</div>
      <p class="rel-caption">${escapeHtml(caption)}</p>
    </div>
  `;
}

function renderRelationalBlockSummary(block) {
  if (!block) {
    return "";
  }
  return `
    <div class="hub-summary">
      <p><strong>Block ${block.blockIndex} Result</strong> (${block.outcomeBand})</p>
      <p>N: ${block.nStart} -> ${block.nEnd} | Trials: ${block.trials}</p>
      <p>Hits: ${block.hits} | Misses: ${block.misses} | FA: ${block.falseAlarms} | CR: ${block.correctRejections}</p>
      <p>Accuracy: ${(block.accuracy * 100).toFixed(1)}% | Mean RT: ${block.meanRtMs ?? "n/a"} ms | RT SD: ${block.rtSdMs ?? "n/a"} ms</p>
      <p>Quiz: ${block.quizCorrect ?? 0}/${block.quizTotal ?? 2} | Error bursts: ${block.errorBursts}</p>
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
  const baselineNotice = hubSession.introNotice && hubSession.blockCursor === 0
    ? `<div class="status coach">${escapeHtml(hubSession.introNotice)}</div>`
    : "";
  const pendingPatch = hubSession.pendingPlanPatch && typeof hubSession.pendingPlanPatch === "object"
    ? hubSession.pendingPlanPatch
    : {};
  const hasCoachDialOverride = Boolean(pendingPatch.speed || pendingPatch.interference);
  const coachOverrideNote = hubSession.phase === "block-result" && hasCoachDialOverride
    ? `<p class="hint">Coach override active for next block (${escapeHtml(preview.coachState || "STABILISE")}). Your settings will apply after this coach block.</p>`
    : "";
  const runtimeInfo = block
    ? `SOA: ${block.soaMs}ms | Interference: ${block.plan.interference} | Coach: ${block.plan.flags?.coachState || "STABILISE"}`
    : "";

  let phasePanel = "";
  if (hubSession.phase === "cue") {
    phasePanel = `
      <div class="hub-phase cue">
        <p class="hub-phase-title">Cue</p>
        ${renderHubStimulus(null, false, targetLabel, block?.renderMapping, block?.plan?.wrapper || hubPreferences.wrapper, runtimeInfo)}
        <p class="hint">Cue duration: ${HUB_CUE_MS} ms</p>
      </div>
    `;
  } else if (hubSession.phase === "trial") {
    phasePanel = `
      <div class="hub-phase trial">
        <p class="hub-phase-title">Trial ${trialNumber} / ${trialCount}</p>
        <p>Respond MATCH when the target modality matches ${block.plan.n}-back.</p>
        ${renderHubStimulus(trial, block.stimulusVisible, targetLabel, block.renderMapping, block.plan.wrapper, runtimeInfo)}
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
      ${renderHubConfigControls({
        showWrapperSelect: false,
        wrapperLocked: true,
        dialsLocked: blockActive,
        speedValue: blockActive && block ? block.plan.speed : hubPreferences.speed,
        interferenceValue: blockActive && block ? block.plan.interference : hubPreferences.interference
      })}
      <p>Block: <strong>${hubSession.blockCursor + (hubSession.phase === "block-result" ? 0 : 1)}</strong> / ${HUB_TOTAL_BLOCKS}</p>
      <p>Current N: <strong>${hubSession.currentN}</strong> (bounds 1..${HUB_N_MAX})</p>
      <p>Active wrapper: <strong>${currentWrapper}</strong></p>
      <p>Current block settings: <strong>${currentSpeed}</strong> speed, <strong>${currentInterference}</strong> interference.</p>
      ${baselineNotice}
      ${hubSession.phase === "block-result" ? `<p>Next block settings: <strong>${preview.wrapper}</strong> wrapper, <strong>${preview.speed}</strong> speed, <strong>${preview.interference}</strong> interference${preview.coachState ? ` | Coach: <strong>${preview.coachState}</strong>` : ""}.</p>` : ""}
      ${coachOverrideNote}
      ${hubSession.phase === "block-result" ? coachNotice : ""}
      ${phasePanel}
      ${renderFlash()}
    </section>
  `;
}

function renderPlayRelational(state) {
  const relationalUnlocked = state.unlocks.transitive || state.unlocks.graph || state.unlocks.propositional;
  const running = Boolean(relSession && relSession.status === "running");
  const completed = Boolean(relSession && relSession.status === "completed");
  const modeButtons = `
    <div class="row">
      <button class="btn primary" data-action="start-relational-session" data-mode="transitive">Start Transitive</button>
      <button class="btn primary" data-action="start-relational-session" data-mode="graph">Start Graph</button>
      <button class="btn primary" data-action="start-relational-session" data-mode="propositional">Start Propositional</button>
    </div>
  `;

  if (!running && !completed) {
    return `
      <section class="card">
        <h2>Play Relational</h2>
        <p class="hint">Stage 4 foundation: full 10-block relational runtime with canonical scoring and timed quizzes.</p>
        <p>Unlock status: <strong>${relationalUnlocked ? "Unlocked (at least one mode)" : "Locked by default in Stage 1 state"}</strong></p>
        ${modeButtons}
        <p class="hint">Response model: press MATCH (Space) only on match trials. Each block ends with 2 timed TRUE/FALSE quiz items.</p>
        ${renderFlash()}
      </section>
    `;
  }

  if (completed) {
    const summary = relSession.sessionSummary;
    const finalBlock = relSession.lastBlockSummary;
    const quizCorrect = summary.blocks.reduce((sum, block) => sum + Number(block.quizCorrect || 0), 0);
    const quizTotal = REL_TOTAL_BLOCKS * 2;
    return `
      <section class="card">
        <h2>Play Relational</h2>
        <div class="status success">Session complete and saved.</div>
        <p>Mode: <strong>${escapeHtml(summary.blocksPlanned?.[0]?.wrapper || "unknown")}</strong></p>
        <p>Session ID: <code>${escapeHtml(summary.id)}</code></p>
        <p>Blocks saved: <strong>${summary.blocks.length}</strong> / ${REL_TOTAL_BLOCKS}</p>
        <p>Quiz total: <strong>${quizCorrect}/${quizTotal}</strong></p>
        <p>Session start: ${new Date(summary.tsStart).toLocaleString()}</p>
        <p>Session end: ${new Date(summary.tsEnd).toLocaleString()}</p>
        ${renderRelationalBlockSummary(finalBlock)}
        ${modeButtons}
        ${renderFlash()}
      </section>
    `;
  }

  const block = relSession.currentBlock;
  const trial = block && block.trialIndex >= 0 ? block.trials[block.trialIndex] : null;
  const trialNumber = block ? block.trialIndex + 1 : 0;
  const trialCount = block ? block.trials.length : 0;
  const responseCaptured = block ? block.responseCaptured : false;
  const runtimeInfo = block
    ? `SOA: ${block.soaMs}ms | Mode: ${relSession.wrapper.toUpperCase()}`
    : "";
  const premiseBankMarkup = block && Array.isArray(block.blockMeta?.premiseBankLines) && block.blockMeta.premiseBankLines.length
    ? `
      <div class="premise-bank">
        <p class="hint">Premise bank (${block.blockMeta.premiseBankLines.length}):</p>
        <ul class="premise-bank-list">
          ${block.blockMeta.premiseBankLines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}
        </ul>
      </div>
    `
    : "";

  let phasePanel = "";
  if (relSession.phase === "cue") {
    phasePanel = `
      <div class="hub-phase cue">
        <p class="hub-phase-title">Cue</p>
        <p class="hint">Mode: <strong>${escapeHtml(relSession.wrapper)}</strong> | Current N: <strong>${relSession.currentN}</strong></p>
        ${premiseBankMarkup}
        ${renderRelationalStimulus(null, false, runtimeInfo)}
        <p class="hint">Cue duration: ${REL_CUE_MS} ms</p>
      </div>
    `;
  } else if (relSession.phase === "trial") {
    phasePanel = `
      <div class="hub-phase trial">
        <p class="hub-phase-title">Trial ${trialNumber} / ${trialCount}</p>
        <p>Press MATCH when the current token matches ${block.plan.n}-back.</p>
        ${renderRelationalStimulus(trial, block.stimulusVisible, runtimeInfo)}
        <div class="row">
          <button class="btn primary" data-action="rel-match" ${responseCaptured ? "disabled" : ""}>MATCH (Space)</button>
        </div>
        <p class="hint">${responseCaptured ? `Response recorded at ${block.responseRtMs} ms.` : "No response recorded yet."}</p>
      </div>
    `;
  } else if (relSession.phase === "quiz") {
    const quizItem = block.quizItems[block.quizIndex];
    const secsLeft = Math.max(0, Math.ceil((block.quizTimeLeftMs || 0) / 1000));
    const quizLocked = Boolean(block.quizAnswerCommitted);
    phasePanel = `
      <div class="hub-phase quiz">
        <p class="hub-phase-title">Quiz ${block.quizIndex + 1} / 2</p>
        <p class="rel-quiz-prompt">${escapeHtml(quizItem.prompt)}</p>
        <p class="hint">Time left: <strong>${secsLeft}s</strong> (timeout = incorrect)</p>
        <div class="row">
          <button class="btn" data-action="rel-quiz-answer" data-answer="true" ${quizLocked ? "disabled" : ""}>TRUE</button>
          <button class="btn" data-action="rel-quiz-answer" data-answer="false" ${quizLocked ? "disabled" : ""}>FALSE</button>
        </div>
      </div>
    `;
  } else {
    phasePanel = `
      <div class="hub-phase result">
        ${renderRelationalBlockSummary(relSession.lastBlockSummary)}
        <div class="row">
          <button class="btn primary" data-action="rel-next-block">Start Next Block</button>
        </div>
      </div>
    `;
  }

  return `
    <section class="card">
      <h2>Play Relational</h2>
      <p>Mode: <strong>${escapeHtml(relSession.wrapper)}</strong></p>
      <p>Block: <strong>${relSession.blockCursor + (relSession.phase === "block-result" ? 0 : 1)}</strong> / ${REL_TOTAL_BLOCKS}</p>
      <p>Current N: <strong>${relSession.currentN}</strong> (bounds 1..${REL_N_MAX})</p>
      ${phasePanel}
      ${renderFlash()}
    </section>
  `;
}

function renderHistory(history) {
  const items = history.map((session) => {
    const started = new Date(session.tsStart).toLocaleString();
    const ended = new Date(session.tsEnd).toLocaleString();
    const blockCount = Array.isArray(session.blocks) ? session.blocks.length : 0;
    const mode = Array.isArray(session.blocksPlanned) && session.blocksPlanned.length
      ? session.blocksPlanned[0].wrapper
      : "";
    const quizCorrectTotal = Array.isArray(session.blocks)
      ? session.blocks.reduce((sum, block) => sum + Number(block.quizCorrect || 0), 0)
      : 0;
    const quizLine = session.wrapperFamily === "relational"
      ? `<p>Quiz: ${quizCorrectTotal}/${REL_TOTAL_BLOCKS * 2}</p>`
      : "";
    const modeLine = mode ? `<p>Mode: ${escapeHtml(mode)}</p>` : "";
    return `
      <li class="history-item">
        <p><strong>${escapeHtml(session.id)}</strong></p>
        <p>Family: ${escapeHtml(session.wrapperFamily || "unknown")}</p>
        ${modeLine}
        <p>Date: ${escapeHtml(session.dateLocal || "")}</p>
        <p>Blocks: ${blockCount}</p>
        ${quizLine}
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

function dropRunningSessionsIfLeaving(route) {
  if (route !== "play-hub" && hubSession && hubSession.status === "running") {
    clearHubTimers();
    hubSession = null;
    setFlash("Hub session stopped because you left Play Hub before completion.", "warn");
  }
  if (route !== "play-relational" && relSession && relSession.status === "running") {
    clearRelTimers();
    relSession = null;
    setFlash("Relational session stopped because you left Play Relational before completion.", "warn");
  }
}

function render() {
  const route = ensureRoute();
  if (!route) {
    return;
  }

  dropRunningSessionsIfLeaving(route);
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
  const state = loadGymState();
  const firstHubRun = isFirstHubRun(state);
  const tsStart = Date.now();
  const selectedWrapper = normalizeHubWrapper(hubPreferences.wrapper);
  const sessionSeed = hash32(String(tsStart));
  const initialWrapper = firstHubRun ? FIRST_RUN_BASELINE_BLOCK.wrapper : selectedWrapper;
  const initialN = firstHubRun ? FIRST_RUN_BASELINE_BLOCK.n : 1;
  const initialSpeed = firstHubRun ? FIRST_RUN_BASELINE_BLOCK.speed : undefined;
  const initialInterference = firstHubRun ? FIRST_RUN_BASELINE_BLOCK.interference : undefined;

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
      wrapper: initialWrapper,
      ...(initialN ? { n: initialN } : {}),
      ...(initialSpeed ? { speed: initialSpeed } : {}),
      ...(initialInterference ? { interference: initialInterference } : {}),
      flags: {
        coachState: "STABILISE",
        pulseType: null,
        swapSegment: null,
        wasSwapProbe: false
      }
    },
    introNotice: firstHubRun ? "Starting with a gentle baseline block." : "",
    coachNotice: "",
    currentBlock: null,
    lastBlockSummary: null,
    sessionSummary: null
  };

  updateSettings({
    lastWrapper: initialWrapper,
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
  console.log("[BLOCK START]", {
    blockIndex,
    planSpeed: plan.speed,
    planInterference: plan.interference,
    effectiveSoaMs: blockBuild.soaMs
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
  updateSettings({ hasRunHubBefore: true });

  hubSession.status = "completed";
  hubSession.phase = "session-done";
  hubSession.sessionSummary = summary;
  setFlash("Hub session complete and saved to History.", "success");
  render();
}

function startRelationalSession(mode) {
  const modeDef = REL_MODE_MAP[mode];
  if (!modeDef) {
    setFlash("Unknown relational mode.", "warn");
    render();
    return;
  }

  clearRelTimers();
  clearFlash();
  const tsStart = Date.now();
  const sessionSeed = hash32(`${tsStart}:${mode}`);
  relSession = {
    status: "running",
    phase: "cue",
    wrapper: mode,
    modeDef,
    sessionContext: modeDef.buildSessionContext(sessionSeed),
    tsStart,
    sessionSeed,
    blockCursor: 0,
    currentN: 1,
    blocksPlanned: [],
    blocks: [],
    currentBlock: null,
    lastBlockSummary: null,
    sessionSummary: null
  };
  beginRelationalBlock();
}

function beginRelationalBlock() {
  if (!relSession || relSession.status !== "running") {
    return;
  }
  if (relSession.blockCursor >= REL_TOTAL_BLOCKS) {
    completeRelationalSession();
    return;
  }

  const blockIndex = relSession.blockCursor + 1;
  const plan = createRelationalBlockPlan({
    wrapper: relSession.wrapper,
    blockIndex,
    n: relSession.currentN,
    speed: "slow",
    interference: "low"
  });
  const blockBuild = createRelationalBlockTrials({
    modeDef: relSession.modeDef,
    sessionContext: relSession.sessionContext,
    sessionSeed: relSession.sessionSeed,
    blockIndex,
    n: plan.n,
    speed: plan.speed,
    baseTrials: REL_BASE_TRIALS,
    seed: Date.now() + blockIndex
  });

  relSession.blocksPlanned.push(plan);
  relSession.currentBlock = {
    plan,
    trials: blockBuild.trials,
    quizItems: blockBuild.quizItems,
    soaMs: blockBuild.soaMs,
    displayMs: blockBuild.displayMs,
    blockVisualState: blockBuild.blockVisualState,
    blockSeed: blockBuild.blockSeed,
    blockMeta: blockBuild.blockMeta,
    trialIndex: -1,
    stimulusVisible: false,
    responseCaptured: false,
    responseRtMs: null,
    trialStartedAtMs: 0,
    trialOutcomes: [],
    quizIndex: -1,
    quizOutcomes: [],
    quizItemStartedAtMs: 0,
    quizTimeLeftMs: REL_QUIZ_TIMEOUT_MS,
    quizAnswerCommitted: false
  };
  relSession.phase = "cue";

  render();
  clearRelTimers();
  relTimers.cue = setTimeout(() => {
    startRelationalTrial(0);
  }, REL_CUE_MS);
}

function startRelationalTrial(trialIndex) {
  if (!relSession || relSession.status !== "running" || !relSession.currentBlock) {
    return;
  }
  const block = relSession.currentBlock;
  block.trialIndex = trialIndex;
  block.stimulusVisible = true;
  block.responseCaptured = false;
  block.responseRtMs = null;
  block.trialStartedAtMs = performance.now();
  relSession.phase = "trial";

  render();
  if (relTimers.display) {
    clearTimeout(relTimers.display);
  }
  if (relTimers.trial) {
    clearTimeout(relTimers.trial);
  }

  relTimers.display = setTimeout(() => {
    if (!relSession || relSession.status !== "running" || relSession.phase !== "trial") {
      return;
    }
    const current = relSession.currentBlock;
    if (!current || current.trialIndex !== trialIndex) {
      return;
    }
    current.stimulusVisible = false;
    render();
  }, block.displayMs);

  relTimers.trial = setTimeout(() => {
    finishRelationalTrial();
  }, block.soaMs);
}

function captureRelationalMatch() {
  if (!relSession || relSession.status !== "running" || relSession.phase !== "trial" || !relSession.currentBlock) {
    return false;
  }
  const block = relSession.currentBlock;
  if (block.responseCaptured) {
    return false;
  }
  block.responseCaptured = true;
  block.responseRtMs = Math.max(0, Math.round(performance.now() - block.trialStartedAtMs));
  render();
  return true;
}

function finishRelationalTrial() {
  if (!relSession || relSession.status !== "running" || !relSession.currentBlock) {
    return;
  }
  const block = relSession.currentBlock;
  const trial = block.trials[block.trialIndex];
  const isMatch = isRelationalMatchAtIndex(block.trials, block.trialIndex, block.plan.n);
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
    responded,
    rtMs: responded ? block.responseRtMs : null,
    isError,
    isLapse: !responded && isMatch,
    classification
  });

  if (relTimers.display) {
    clearTimeout(relTimers.display);
    relTimers.display = null;
  }
  if (relTimers.trial) {
    clearTimeout(relTimers.trial);
    relTimers.trial = null;
  }

  const nextTrialIndex = block.trialIndex + 1;
  if (nextTrialIndex < block.trials.length) {
    startRelationalTrial(nextTrialIndex);
    return;
  }
  startRelationalQuizItem(0);
}

function startRelationalQuizItem(quizIndex) {
  if (!relSession || relSession.status !== "running" || !relSession.currentBlock) {
    return;
  }
  const block = relSession.currentBlock;
  if (quizIndex >= block.quizItems.length) {
    finishRelationalBlock();
    return;
  }

  block.quizIndex = quizIndex;
  block.quizItemStartedAtMs = performance.now();
  block.quizTimeLeftMs = REL_QUIZ_TIMEOUT_MS;
  block.quizAnswerCommitted = false;
  relSession.phase = "quiz";

  if (relTimers.quizTimeout) {
    clearTimeout(relTimers.quizTimeout);
  }
  if (relTimers.quizTick) {
    clearInterval(relTimers.quizTick);
  }
  if (relTimers.quizAdvance) {
    clearTimeout(relTimers.quizAdvance);
    relTimers.quizAdvance = null;
  }

  relTimers.quizTimeout = setTimeout(() => {
    submitRelationalQuizAnswer(null);
  }, REL_QUIZ_TIMEOUT_MS);
  relTimers.quizTick = setInterval(() => {
    if (!relSession || relSession.status !== "running" || relSession.phase !== "quiz" || !relSession.currentBlock) {
      return;
    }
    const current = relSession.currentBlock;
    if (current.quizIndex !== quizIndex) {
      return;
    }
    const elapsed = performance.now() - current.quizItemStartedAtMs;
    current.quizTimeLeftMs = Math.max(0, REL_QUIZ_TIMEOUT_MS - Math.round(elapsed));
    render();
  }, 200);

  render();
}

function submitRelationalQuizAnswer(userAnswer) {
  if (!relSession || relSession.status !== "running" || relSession.phase !== "quiz" || !relSession.currentBlock) {
    return;
  }
  const block = relSession.currentBlock;
  if (block.quizAnswerCommitted) {
    return;
  }
  block.quizAnswerCommitted = true;
  if (block.quizIndex < 0 || block.quizIndex >= block.quizItems.length) {
    return;
  }
  const quizItem = block.quizItems[block.quizIndex];
  if (!quizItem) {
    return;
  }
  const nextQuizIndex = block.quizIndex + 1;
  const responseTime = performance.now();
  const rtMs = userAnswer === null
    ? null
    : Math.max(0, Math.round(responseTime - block.quizItemStartedAtMs));
  const isCorrect = userAnswer !== null && userAnswer === quizItem.answerTrue;

  block.quizOutcomes.push({
    prompt: quizItem.prompt,
    answerTrue: quizItem.answerTrue,
    userAnswer,
    isCorrect,
    rtMs
  });

  if (relTimers.quizTimeout) {
    clearTimeout(relTimers.quizTimeout);
    relTimers.quizTimeout = null;
  }
  if (relTimers.quizTick) {
    clearInterval(relTimers.quizTick);
    relTimers.quizTick = null;
  }
  if (relTimers.quizAdvance) {
    clearTimeout(relTimers.quizAdvance);
  }
  relTimers.quizAdvance = setTimeout(() => {
    startRelationalQuizItem(nextQuizIndex);
  }, 80);

  render();
}

function finishRelationalBlock() {
  if (!relSession || relSession.status !== "running" || !relSession.currentBlock) {
    return;
  }
  const block = relSession.currentBlock;
  const blockSummary = summarizeRelationalBlock({
    plan: block.plan,
    trials: block.trials,
    trialOutcomes: block.trialOutcomes,
    quizOutcomes: block.quizOutcomes,
    nMax: REL_N_MAX
  });

  relSession.blocks.push(blockSummary.blockResult);
  relSession.lastBlockSummary = {
    ...blockSummary.blockResult,
    outcomeBand: blockSummary.outcomeBand
  };
  relSession.currentN = blockSummary.nEnd;
  relSession.blockCursor += 1;
  relSession.currentBlock = null;

  if (relSession.blockCursor >= REL_TOTAL_BLOCKS) {
    completeRelationalSession();
    return;
  }

  relSession.phase = "block-result";
  render();
}

function completeRelationalSession() {
  if (!relSession || relSession.status !== "running") {
    return;
  }
  clearRelTimers();

  const tsEnd = Date.now();
  const summary = createRelationalSessionSummary({
    wrapper: relSession.wrapper,
    tsStart: relSession.tsStart,
    tsEnd,
    blocksPlanned: relSession.blocksPlanned,
    blocks: relSession.blocks
  });
  appendSessionSummary(summary);

  relSession.status = "completed";
  relSession.phase = "session-done";
  relSession.sessionSummary = summary;
  setFlash("Relational session complete and saved to History.", "success");
  render();
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

  if (action === "start-relational-session") {
    const mode = target.getAttribute("data-mode") || "transitive";
    startRelationalSession(mode);
    return;
  }

  if (action === "hub-match") {
    captureHubResponse();
    return;
  }

  if (action === "rel-match") {
    captureRelationalMatch();
    return;
  }

  if (action === "hub-next-block") {
    beginHubBlock();
    return;
  }

  if (action === "rel-next-block") {
    beginRelationalBlock();
    return;
  }

  if (action === "rel-quiz-answer") {
    const answer = target.getAttribute("data-answer");
    if (answer === "true") {
      submitRelationalQuizAnswer(true);
      return;
    }
    if (answer === "false") {
      submitRelationalQuizAnswer(false);
      return;
    }
  }

  clearFlash();

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
    clearHubTimers();
    hubSession = null;
    clearRelTimers();
    relSession = null;
    resetGymState();
    hubPreferences.wrapper = FIRST_RUN_BASELINE_BLOCK.wrapper;
    hubPreferences.speed = FIRST_RUN_BASELINE_BLOCK.speed;
    hubPreferences.interference = FIRST_RUN_BASELINE_BLOCK.interference;
    updateSettings({
      lastWrapper: hubPreferences.wrapper,
      lastSpeed: hubPreferences.speed,
      lastInterference: hubPreferences.interference,
      hasRunHubBefore: false
    });
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
  const handled = captureHubResponse() || captureRelationalMatch();
  if (handled) {
    event.preventDefault();
  }
});

window.addEventListener("hashchange", render);
render();
