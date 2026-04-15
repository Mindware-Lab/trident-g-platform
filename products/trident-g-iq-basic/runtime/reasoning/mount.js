import { renderTelemetryCards } from "../../../trident-g-iq-shared/runtime/telemetry.js";
import {
  REASONING_MODE_IDS,
  REASONING_NODE_IDS,
  getReasoningFamilies,
  getReasoningModeNode,
  getReasoningNode
} from "../../content/reasoning/catalog.js";
import {
  buildReasoningNodeStates,
  buildReasoningTelemetryCards,
  completeReasoningRound,
  createReasoningRound,
  getNextTargetRelationLoad,
  modeLabel,
  scoreRoundResponse
} from "./engine.js";
import {
  clearReasoningState,
  loadReasoningState,
  saveReasoningState
} from "./storage.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${Math.round(value * 100)}%` : "--";
}

function formatPab(value) {
  return Number.isFinite(value) && value > 0 ? `PAB ${Math.round(value)}` : "Not banked";
}

function getSelectedNodeId(persisted) {
  const modeId = persisted.launcher.selectedModeId || REASONING_MODE_IDS.BEST_EXPLANATION;
  return getReasoningModeNode(modeId)?.id || REASONING_NODE_IDS.probe_best_explanation;
}

export function mountReasoningScreen({ root }) {
  const telemetryRail = root.querySelector(".telemetry-rail");
  const treePanel = root.querySelector("[data-reasoning-tree-panel]");
  const taskRoot = root.querySelector("[data-reasoning-task-root]");
  const responseRoot = root.querySelector("[data-reasoning-response-root]");
  const bannerSubtitle = root.querySelector("[data-reasoning-banner-subtitle]");
  const bannerSubcopy = root.querySelector("[data-reasoning-banner-subcopy]");
  const bannerStage = root.querySelector("[data-reasoning-banner-stage]");
  const bannerMeta = root.querySelector("[data-reasoning-banner-meta]");
  const bannerTrack = root.querySelector("[data-reasoning-banner-track]");
  const coachHeadline = root.querySelector("[data-reasoning-coach-headline]");
  const coachBody = root.querySelector("[data-reasoning-coach-body]");

  const uiState = {
    persisted: loadReasoningState(),
    selectedNodeId: null,
    flash: null
  };

  uiState.selectedNodeId = getSelectedNodeId(uiState.persisted);
  if (uiState.persisted.currentRound && uiState.persisted.currentRound.stage === "question") {
    uiState.persisted.currentRound.presentedAt = Date.now();
    uiState.persisted = saveReasoningState(uiState.persisted);
  }

  function persist() {
    uiState.persisted = saveReasoningState(uiState.persisted);
  }

  function selectedNodeStates() {
    const nodeStates = buildReasoningNodeStates(uiState.persisted);
    const selectedNode = nodeStates.find((node) => node.id === uiState.selectedNodeId) || nodeStates[0];
    return { nodeStates, selectedNode };
  }

  function setSelectedNode(nodeId) {
    const node = getReasoningNode(nodeId);
    if (!node) {
      return;
    }
    uiState.selectedNodeId = nodeId;
    uiState.persisted.launcher.selectedFamilyId = node.familyId;
    uiState.persisted.launcher.selectedModeId = node.modeId;
    persist();
    render();
  }

  function setLaunchMode(mode) {
    uiState.persisted.launcher.launchMode = mode === "manual" ? "manual" : "coach";
    if (uiState.persisted.launcher.launchMode === "coach") {
      uiState.persisted.launcher.selectedModeId = REASONING_MODE_IDS.BEST_EXPLANATION;
    }
    persist();
    render();
  }

  function resetHistory() {
    uiState.persisted = clearReasoningState();
    uiState.selectedNodeId = REASONING_NODE_IDS.probe_best_explanation;
    uiState.flash = {
      headline: "Reasoning history cleared.",
      body: "Probe Gym is back at the opening low-load route."
    };
    render();
  }

  function startRound() {
    const { nodeStates, selectedNode } = selectedNodeStates();
    const launchMode = uiState.persisted.launcher.launchMode;
    const launchNode = launchMode === "coach"
      ? nodeStates.find((node) => node.id === REASONING_NODE_IDS.probe_best_explanation)
      : selectedNode;

    if (!launchNode?.available) {
      uiState.flash = {
        headline: "No playable mode selected.",
        body: "Switch to an unlocked Probe mode or return to Coach guided."
      };
      render();
      return;
    }

    uiState.persisted.currentRound = createReasoningRound(uiState.persisted, launchNode.modeId, launchMode);
    uiState.selectedNodeId = launchNode.id;
    uiState.flash = null;
    persist();
    render();
  }

  function answerItem(optionId) {
    const round = uiState.persisted.currentRound;
    if (!round || round.stage !== "question") {
      return;
    }
    const response = scoreRoundResponse(uiState.persisted, round, optionId, Date.now() - round.presentedAt);
    if (!response) {
      return;
    }
    round.responses.push(response);
    round.stage = "feedback";
    round.roundCredits = round.responses.reduce((sum, entry) => sum + entry.itemCredits, 0);
    round.correctCount = round.responses.filter((entry) => entry.is_correct).length;
    persist();
    render();
  }

  function nextStep() {
    const round = uiState.persisted.currentRound;
    if (!round) {
      return;
    }
    if (round.stage === "summary") {
      uiState.persisted.currentRound = null;
      persist();
      render();
      return;
    }
    if (round.stage !== "feedback") {
      return;
    }
    if (round.itemIndex >= round.items.length - 1) {
      uiState.persisted = completeReasoningRound(uiState.persisted, round);
      if (uiState.persisted.launcher.recommendedModeId === REASONING_MODE_IDS.BEST_NEXT_CHECK) {
        uiState.flash = {
          headline: "Best Next Check unlocked.",
          body: "Coach guided still starts on Best Explanation, but Probe VOI is now recommended next."
        };
      } else {
        uiState.flash = {
          headline: `${modeLabel(round.modeId)} round saved.`,
          body: "Credits and relation-load records were updated from this completed round."
        };
      }
      render();
      return;
    }
    round.itemIndex += 1;
    round.stage = "question";
    round.presentedAt = Date.now();
    persist();
    render();
  }

  function renderTree(nodeStates) {
    const selectedFamilyId = getReasoningNode(uiState.selectedNodeId)?.familyId;
    treePanel.innerHTML = `
      <div class="reasoning-route-shell">
        <div class="reasoning-route-title">REASONING<br>GYM</div>
        ${getReasoningFamilies().map((family) => `
          <section class="reasoning-route-family${selectedFamilyId === family.id ? " is-current" : ""}">
            <div class="reasoning-route-family-head">
              <span class="reasoning-route-family-name">${escapeHtml(family.label)}</span>
              <span class="reasoning-route-family-step" aria-hidden="true"></span>
            </div>
            <div class="reasoning-route-family-branch">
              ${family.modes.map((mode) => {
                const state = nodeStates.find((node) => node.id === mode.id);
                return `
                  <button
                    class="reasoning-route-node is-${state?.status || "locked"}${uiState.selectedNodeId === mode.id ? " is-active" : ""}"
                    type="button"
                    data-reasoning-node="${mode.id}"
                    aria-pressed="${uiState.selectedNodeId === mode.id ? "true" : "false"}"
                  >
                    <span class="reasoning-route-node-dot" aria-hidden="true"></span>
                    <span class="reasoning-route-node-label">${escapeHtml(mode.label)}</span>
                  </button>
                `;
              }).join("")}
            </div>
          </section>
        `).join("")}
        <div class="reasoning-route-key" aria-label="Reasoning state key">
          <div class="reasoning-route-key-item"><span class="reasoning-route-key-dot reasoning-route-key-dot--unlocked"></span><span>UNLOCKED</span></div>
          <div class="reasoning-route-key-item"><span class="reasoning-route-key-dot reasoning-route-key-dot--locked"></span><span>LOCKED</span></div>
          <div class="reasoning-route-key-item"><span class="reasoning-route-key-dot reasoning-route-key-dot--active"></span><span>ACTIVE</span></div>
        </div>
      </div>
    `;
  }

  function launcherMarkup(nodeStates, selectedNode) {
    const availableNodes = nodeStates.filter((node) => node.available);
    const launchMode = uiState.persisted.launcher.launchMode;
    const coachMode = launchMode === "coach";
    const coachRecommendation = uiState.persisted.launcher.recommendedModeId === REASONING_MODE_IDS.BEST_NEXT_CHECK
      ? "Best Next Check is now recommended next, but Coach guided still opens Best Explanation by default."
      : "Coach guided starts on Probe / Best Explanation and builds relation load one band at a time.";
    const manualDisabled = !selectedNode.available;

    return `
      <div class="reasoning-launch-shell">
        <section class="capacity-sandbox-panel reasoning-launch-panel">
          <div class="capacity-live-head">
            <div class="capacity-live-kicker">Reasoning sandbox</div>
            <div class="capacity-live-pill">Ready</div>
          </div>
          <div class="capacity-lab-setup-grid">
            <div class="capacity-lab-field capacity-lab-field--wide">
              <span>Mode</span>
              <div class="capacity-lab-mode-row" role="group" aria-label="Reasoning launch mode">
                <button class="capacity-lab-chip${coachMode ? " is-active" : ""}" type="button" data-reasoning-action="set-mode" data-mode="coach">Coach guided</button>
                <button class="capacity-lab-chip${!coachMode ? " is-active" : ""}" type="button" data-reasoning-action="set-mode" data-mode="manual">You choose</button>
              </div>
            </div>
            ${coachMode
              ? `
                <div class="capacity-lab-field capacity-lab-field--wide">
                  <span>Next mode</span>
                  <div class="capacity-lab-recommend">
                    <div class="capacity-lab-recommend-label">Coach guided</div>
                    <div class="capacity-lab-recommend-text">Best Explanation</div>
                    <div class="capacity-lab-recommend-note">${escapeHtml(coachRecommendation)}</div>
                  </div>
                </div>
              `
              : `
                <label class="capacity-lab-field capacity-lab-field--wide">
                  <span>Reasoning mode</span>
                  <select data-reasoning-setting="node">
                    ${availableNodes.map((node) => `<option value="${node.id}"${node.id === uiState.selectedNodeId ? " selected" : ""}>${escapeHtml(node.label)}</option>`).join("")}
                  </select>
                </label>
              `}
          </div>
          <p class="capacity-lab-helper">
            ${coachMode
              ? "Coach guided always starts on Best Explanation in v1."
              : manualDisabled
                ? "This mode is still locked. Pick an unlocked Probe mode from the dropdown."
                : "You choose lists only the Probe modes that are currently unlocked."}
          </p>
          <div class="capacity-lab-action-row">
            <button class="capacity-transition-action capacity-transition-action--lab" type="button" data-reasoning-action="take-round" ${!coachMode && manualDisabled ? "disabled" : ""}>Take round</button>
            <button class="capacity-lab-secondary-btn" type="button" data-reasoning-action="reset-history">Reset history</button>
          </div>
        </section>
      </div>
    `;
  }

  function renderOverview(selectedNode, selectedState, nodeStates) {
    const modeState = uiState.persisted.perMode[selectedNode.modeId] || uiState.persisted.perMode[REASONING_MODE_IDS.BEST_EXPLANATION];
    const summary = uiState.persisted.summaryByMode[selectedNode.modeId] || null;
    const recommended = uiState.persisted.launcher.recommendedModeId === selectedNode.modeId;

    taskRoot.innerHTML = `
      ${launcherMarkup(nodeStates, selectedState)}
      <div class="reasoning-stage-card reasoning-stage-card--overview${selectedState.available ? "" : " is-locked"}">
        <div class="reasoning-stage-topline">
          <div>
            <div class="reasoning-stage-kicker">${escapeHtml(selectedNode.familyLabel)}</div>
            <div class="reasoning-mode-headline">${escapeHtml(selectedNode.label)}</div>
          </div>
          <span class="reasoning-stage-pill${recommended ? " is-credit" : ""}">${recommended ? "Recommended next" : selectedState.available ? "Playable" : "Locked"}</span>
        </div>
        <h2 class="reasoning-question-title">${escapeHtml(selectedNode.shortLabel || selectedNode.label)}</h2>
        <p class="reasoning-question-note">${escapeHtml(selectedState.detail)}</p>
        <div class="reasoning-summary-grid">
          <div class="reasoning-summary-stat"><span>Current band</span><strong>${escapeHtml(modeState.currentBand || "--")}</strong></div>
          <div class="reasoning-summary-stat"><span>Current load</span><strong>${escapeHtml(modeState.currentPabWindow?.label || "--")}</strong></div>
          <div class="reasoning-summary-stat"><span>Highest stable</span><strong>${escapeHtml(formatPab(modeState.highestStablePab))}</strong></div>
          <div class="reasoning-summary-stat"><span>Next target</span><strong>${escapeHtml(getNextTargetRelationLoad(selectedNode.modeId, modeState.currentBand || "A"))}</strong></div>
          <div class="reasoning-summary-stat"><span>Credit score</span><strong>${escapeHtml(String(modeState.creditScore || 0))}</strong></div>
          <div class="reasoning-summary-stat"><span>Rounds done</span><strong>${escapeHtml(String(summary?.roundsCompleted || 0))}</strong></div>
        </div>
      </div>
    `;

    responseRoot.innerHTML = selectedState.available
      ? `
        <div class="reasoning-response-stack reasoning-response-stack--overview">
          <div class="reasoning-overview-chip-row">
            <span class="reasoning-chip">Band ${escapeHtml(modeState.currentBand || "A")}</span>
            <span class="reasoning-chip">${escapeHtml(modeState.currentPabWindow?.label || "PAB 1-2")}</span>
            <span class="reasoning-chip">Credits ${escapeHtml(String(modeState.creditScore || 0))}</span>
          </div>
        </div>
      `
      : `
        <div class="reasoning-response-stack reasoning-response-stack--overview">
          <div class="reasoning-lock-card">
            <div class="reasoning-lock-title">Locked for now</div>
            <p>${escapeHtml(selectedState.detail)}</p>
          </div>
        </div>
      `;
  }

  function renderQuestion(round) {
    const item = round.items[round.itemIndex];
    const progressText = `${round.itemIndex + 1} / ${round.items.length}`;
    taskRoot.innerHTML = `
      <div class="reasoning-stage-card reasoning-stage-card--live">
        <div class="reasoning-stage-topline">
          <div>
            <div class="reasoning-stage-kicker">${escapeHtml(modeLabel(round.modeId))}</div>
            <div class="reasoning-mode-headline">${escapeHtml(item.title)}</div>
          </div>
          <div class="reasoning-stage-pill-row">
            <span class="reasoning-stage-pill">Band ${escapeHtml(item.difficultyBand)}</span>
            <span class="reasoning-stage-pill is-accent">PAB ${escapeHtml(item.pab)}</span>
            <span class="reasoning-stage-pill">${escapeHtml(progressText)}</span>
          </div>
        </div>
        ${item.rules?.length ? `<div class="reasoning-rule-box"><strong>Lanor Grid rules</strong>${item.rules.map((rule) => `<span>${escapeHtml(rule)}</span>`).join("")}</div>` : ""}
        ${item.candidateExplanations?.length ? `
          <div class="reasoning-candidate-box">
            <div class="reasoning-candidate-title">Live explanations</div>
            ${item.candidateExplanations.map((candidate) => `<span>${escapeHtml(candidate)}</span>`).join("")}
          </div>
        ` : ""}
        <h2 class="reasoning-question-title">${escapeHtml(item.prompt)}</h2>
        <div class="reasoning-clue-stack">
          ${item.clues.map((clue, index) => `
            <div class="reasoning-clue-card${index + 1 === item.discriminatingCluePosition ? " is-key" : ""}">
              <span class="reasoning-clue-index">Clue ${index + 1}</span>
              <span class="reasoning-clue-text">${escapeHtml(clue)}</span>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    responseRoot.innerHTML = `
      <div class="reasoning-response-stack reasoning-response-stack--choices">
        ${item.options.map((option) => `
          <button class="reasoning-choice-card" type="button" data-reasoning-answer="${option.id}">
            <span class="reasoning-choice-eyebrow">Answer</span>
            <span class="reasoning-choice-text">${escapeHtml(option.text)}</span>
          </button>
        `).join("")}
      </div>
    `;
  }

  function renderFeedback(round) {
    const item = round.items[round.itemIndex];
    const response = round.responses[round.responses.length - 1];
    const chosen = item.options.find((option) => option.id === response.chosen_option);
    const correct = item.options.find((option) => option.id === item.correctOptionId);

    taskRoot.innerHTML = `
      <div class="reasoning-stage-card reasoning-stage-card--feedback${response.is_correct ? " is-correct" : " is-incorrect"}">
        <div class="reasoning-stage-topline">
          <div>
            <div class="reasoning-stage-kicker">${escapeHtml(modeLabel(round.modeId))}</div>
            <div class="reasoning-mode-headline">${response.is_correct ? "Correct" : "Review the clue balance"}</div>
          </div>
          <div class="reasoning-stage-pill-row">
            <span class="reasoning-stage-pill is-credit">+${response.itemCredits}</span>
            <span class="reasoning-stage-pill">PAB ${escapeHtml(item.pab)}</span>
          </div>
        </div>
        <h2 class="reasoning-question-title">${escapeHtml(item.prompt)}</h2>
        <div class="reasoning-feedback-grid">
          <div class="reasoning-feedback-stat"><span>You chose</span><strong>${escapeHtml(chosen?.text || "--")}</strong></div>
          <div class="reasoning-feedback-stat"><span>Best answer</span><strong>${escapeHtml(correct?.text || "--")}</strong></div>
        </div>
        <p class="reasoning-feedback-copy">${escapeHtml(item.feedbackText)}</p>
      </div>
    `;

    responseRoot.innerHTML = `
      <div class="reasoning-response-stack reasoning-response-stack--actions">
        <button class="capacity-transition-action capacity-transition-action--lab" type="button" data-reasoning-action="next-step">${round.itemIndex >= round.items.length - 1 ? "See round summary" : "Next"}</button>
      </div>
    `;
  }

  function renderSummary(round) {
    const summary = round.summary;
    const profile = summary.processProfile || {};
    taskRoot.innerHTML = `
      <div class="reasoning-stage-card reasoning-stage-card--summary">
        <div class="reasoning-stage-topline">
          <div>
            <div class="reasoning-stage-kicker">Round summary</div>
            <div class="reasoning-mode-headline">${escapeHtml(modeLabel(round.modeId))}</div>
          </div>
          <div class="reasoning-stage-pill-row">
            <span class="reasoning-stage-pill is-credit">+${escapeHtml(String(summary.roundCredits))}</span>
            <span class="reasoning-stage-pill">${escapeHtml(summary.currentRelationLoad)}</span>
          </div>
        </div>
        <h2 class="reasoning-question-title">Relation load banked</h2>
        <div class="reasoning-summary-grid">
          <div class="reasoning-summary-stat"><span>Accuracy</span><strong>${escapeHtml(formatPercent(summary.accuracy))}</strong></div>
          <div class="reasoning-summary-stat"><span>Average RT</span><strong>${escapeHtml(Number.isFinite(summary.meanRtMs) ? `${Math.round(summary.meanRtMs)} ms` : "--")}</strong></div>
          <div class="reasoning-summary-stat"><span>Highest band</span><strong>${escapeHtml(summary.highestBandReached)}</strong></div>
          <div class="reasoning-summary-stat"><span>Current load</span><strong>${escapeHtml(summary.currentRelationLoad)}</strong></div>
          <div class="reasoning-summary-stat"><span>Stable load</span><strong>${escapeHtml(summary.highestStableRelationLoad)}</strong></div>
          <div class="reasoning-summary-stat"><span>Total credits</span><strong>${escapeHtml(String(summary.creditScoreAfterRound))}</strong></div>
        </div>
        <div class="reasoning-process-grid">
          ${Object.entries(profile).map(([key, value]) => `
            <div class="reasoning-process-card">
              <span>${escapeHtml(key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`).replace(/^./, (letter) => letter.toUpperCase()))}</span>
              <strong>${escapeHtml(String(value))}</strong>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    responseRoot.innerHTML = `
      <div class="reasoning-response-stack reasoning-response-stack--actions">
        <button class="capacity-transition-action capacity-transition-action--lab" type="button" data-reasoning-action="next-step">Return to route</button>
      </div>
    `;
  }

  function renderBanner(selectedNode) {
    const round = uiState.persisted.currentRound;
    const selectedModeState = uiState.persisted.perMode[selectedNode.modeId] || uiState.persisted.perMode[REASONING_MODE_IDS.BEST_EXPLANATION];

    if (round) {
      bannerSubtitle.textContent = `${modeLabel(round.modeId)} live`;
      bannerSubcopy.textContent = `Relation load ${round.currentPabWindow.label}`;
      bannerStage.textContent = round.stage === "summary" ? "Summary" : `Item ${round.itemIndex + 1}/${round.items.length}`;
      bannerMeta.textContent = `Band ${round.difficultyBand} · Credits ${selectedModeState.creditScore}`;
      bannerTrack.textContent = "PAB is the live relation-load index for this screen. Harder rounds ask you to keep more relations active at once.";
      return;
    }

    bannerSubtitle.textContent = selectedNode.label;
    bannerSubcopy.textContent = uiState.persisted.launcher.launchMode === "coach" ? "Coach-guided Probe route" : "Manual Probe selection";
    bannerStage.textContent = selectedNode.available ? "Ready" : "Locked";
    bannerMeta.textContent = `${selectedModeState.currentPabWindow.label} · Highest stable ${formatPab(selectedModeState.highestStablePab)}`;
    bannerTrack.textContent = selectedNode.detail;
  }

  function renderCoach(selectedNode) {
    const round = uiState.persisted.currentRound;
    if (uiState.flash) {
      coachHeadline.textContent = uiState.flash.headline;
      coachBody.textContent = uiState.flash.body;
      return;
    }

    if (!round) {
      if (!selectedNode.available) {
        coachHeadline.textContent = "Locked route.";
        coachBody.textContent = selectedNode.detail;
        return;
      }
      if (uiState.persisted.launcher.launchMode === "coach") {
        coachHeadline.textContent = "Coach guided is active.";
        coachBody.textContent = uiState.persisted.launcher.recommendedModeId === REASONING_MODE_IDS.BEST_NEXT_CHECK
          ? "Best Explanation still opens by default, but Best Next Check is now recommended next."
          : "Best Explanation opens first and builds Probe relation load from Band A upward.";
        return;
      }
      coachHeadline.textContent = "You choose is active.";
      coachBody.textContent = "Manual play stays inside the unlocked Probe modes only. Credits and stable relation load still update per completed round.";
      return;
    }

    if (round.stage === "question") {
      coachHeadline.textContent = round.modeId === REASONING_MODE_IDS.BEST_EXPLANATION
        ? "Prefer the best global fit."
        : "Prefer the most separating next check.";
      coachBody.textContent = "Harder rounds raise PAB. That means more relations must stay active at the same time for the answer to hold.";
      return;
    }

    if (round.stage === "feedback") {
      coachHeadline.textContent = "Use the feedback, then move on.";
      coachBody.textContent = "The key clue or probe is the one that changes the full model, not the vivid local detail.";
      return;
    }

    coachHeadline.textContent = "Round recorded.";
    coachBody.textContent = "Credits, current relation load, and highest stable relation load have been updated from this completed round.";
  }

  function render() {
    if (!telemetryRail || !treePanel || !taskRoot || !responseRoot) {
      return;
    }

    const { nodeStates, selectedNode } = selectedNodeStates();
    renderTree(nodeStates);
    renderBanner(selectedNode);
    renderCoach(selectedNode);
    telemetryRail.innerHTML = renderTelemetryCards(buildReasoningTelemetryCards(uiState.persisted, selectedNode.id));

    if (!uiState.persisted.currentRound) {
      renderOverview(selectedNode, selectedNode, nodeStates);
    } else if (uiState.persisted.currentRound.stage === "question") {
      renderQuestion(uiState.persisted.currentRound);
    } else if (uiState.persisted.currentRound.stage === "feedback") {
      renderFeedback(uiState.persisted.currentRound);
    } else {
      renderSummary(uiState.persisted.currentRound);
    }

    treePanel.querySelectorAll("[data-reasoning-node]").forEach((button) => {
      button.addEventListener("click", () => setSelectedNode(button.dataset.reasoningNode));
    });

    taskRoot.querySelectorAll("[data-reasoning-action], [data-reasoning-setting]").forEach((element) => {
      if (element.dataset.reasoningAction === "set-mode") {
        element.addEventListener("click", () => setLaunchMode(element.dataset.mode));
      }
      if (element.dataset.reasoningAction === "take-round") {
        element.addEventListener("click", startRound);
      }
      if (element.dataset.reasoningAction === "reset-history") {
        element.addEventListener("click", resetHistory);
      }
      if (element.dataset.reasoningSetting === "node") {
        element.addEventListener("change", () => setSelectedNode(element.value));
      }
    });

    responseRoot.querySelectorAll("[data-reasoning-answer]").forEach((button) => {
      button.addEventListener("click", () => answerItem(button.dataset.reasoningAnswer));
    });

    responseRoot.querySelectorAll("[data-reasoning-action='next-step']").forEach((button) => {
      button.addEventListener("click", nextStep);
    });
  }

  render();
}
