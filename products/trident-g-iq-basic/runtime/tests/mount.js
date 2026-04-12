import { renderTelemetryCards } from "../../../trident-g-iq-shared/runtime/telemetry.js";
import { psiResponseOptions } from "../../content/tests/psi-cbs.js";
import {
  computeCrs10Result,
  computeEdhsResult,
  computePsiAdResult,
  computePsiAiResult,
  computePsiCoreResult,
  computeSgsResult
} from "./scoring.js";
import { clearTestsRuntimeState, loadTestsRuntimeState, saveCompletedTestRun, saveTestsProfile } from "./storage.js";
import {
  buildNodeStates,
  buildProfileSnapshot,
  createSessionBlueprint,
  getTestGroups,
  getTestNode,
  recommendNextNode
} from "./test-session.js";
import { loadLatestZoneHandoff } from "../zone/storage.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(timestamp) {
  if (!Number.isFinite(timestamp)) {
    return "No date";
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(timestamp));
}

function formatSignedNumber(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}

function metricTone(value) {
  if (!Number.isFinite(value)) {
    return undefined;
  }
  return value > 0 ? "ready" : value < 0 ? "warning" : undefined;
}

function statusLabel(status) {
  switch (status) {
    case "done":
      return "Done";
    case "due":
      return "Due";
    case "ready":
      return "Ready";
    case "optional":
      return "Optional";
    default:
      return "Locked";
  }
}

function responseScaleMarkup(currentValue, responseOptions) {
  const scale = Array.isArray(responseOptions) && responseOptions.length ? responseOptions : psiResponseOptions;
  return `
    <div class="tests-likert-grid">
      ${scale.map((option) => `
        <button class="tests-response-chip${currentValue === option.value ? " is-selected" : ""}" type="button" data-tests-answer="${option.value}">
          <span class="tests-response-chip-value">${option.value}</span>
          <span class="tests-response-chip-label">${escapeHtml(option.label)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function buildSummaryMetrics(nodeId, result) {
  if (!result) {
    return [];
  }
  if (nodeId === "sgs12a" || nodeId === "sgs12b") {
    return [
      { label: "Raw score", value: `${result.rawScore}/${result.itemCount}` },
      { label: "RS-IQ", value: result.rsIq },
      { label: "Band", value: result.bandLabel }
    ];
  }
  if (nodeId === "psi-core") {
    return [
      { label: "Applied G", value: result.appliedGIndex ?? "--" },
      { label: "Focus", value: result.focusScore ?? "--" },
      { label: "Processing", value: result.processingScore ?? "--" }
    ];
  }
  if (nodeId === "psi-ad") {
    return [
      { label: "Resilience", value: result.resilienceIndex ?? "--" },
      { label: "AD total", value: result.adTotal ?? "--" },
      { label: "Sections", value: result.sectionScores?.length ?? 0 }
    ];
  }
  if (nodeId === "psi-ai") {
    return [
      { label: "AI-IQ", value: result.aiIqIndex ?? "--" },
      { label: "Positive", value: result.positiveMean ?? "--" },
      { label: "Negative", value: result.negativeMean ?? "--" }
    ];
  }
  if (nodeId === "edhs-a" || nodeId === "edhs-b") {
    return [
      { label: "Decision index", value: result.decisionIndex ?? "--" },
      { label: "Overall", value: result.overallScore ?? "--" },
      { label: "Band", value: result.band ?? "--" }
    ];
  }
  if (nodeId === "crs10") {
    return [
      { label: "Resilience", value: result.resilienceIndex ?? "--" },
      { label: "Average", value: result.averageScore ?? "--" },
      { label: "Band", value: result.band ?? "--" }
    ];
  }
  return [];
}

function buildFamilyRows(node, profile, runs, zoneHandoff) {
  const zoneState = zoneHandoff?.uiState || "None";
  if (node?.familyId === "fluid") {
    const baselineIq = profile.baselineReasoning?.result?.rsIq ?? null;
    const latestIq = profile.latestReasoning?.result?.rsIq ?? null;
    const bestIq = runs
      .filter((run) => run.mode === "sgs")
      .reduce((best, run) => {
        const value = Number(run.result?.rsIq);
        if (!Number.isFinite(value)) {
          return best;
        }
        return best === null ? value : Math.max(best, value);
      }, null);
    const delta =
      Number.isFinite(baselineIq) && Number.isFinite(latestIq)
        ? latestIq - baselineIq
        : null;
    return {
      label: "Fluid IQ",
      rows: [
        { label: "Baseline", value: baselineIq ?? "--" },
        { label: "Latest", value: latestIq ?? "--" },
        { label: "Best", value: bestIq ?? "--" },
        { label: "Delta", value: Number.isFinite(delta) ? formatSignedNumber(delta) : "--", tone: metricTone(delta) }
      ]
    };
  }

  if (node?.familyId === "applied") {
    return {
      label: "Applied IQ",
      rows: [
        { label: "Applied G", value: profile.latestPsiCore?.result?.appliedGIndex ?? "--" },
        { label: "Focus", value: profile.latestPsiCore?.result?.focusScore ?? "--" },
        { label: "AI-IQ", value: profile.latestPsiAi?.result?.aiIqIndex ?? "--" },
        { label: "Last Zone", value: zoneState }
      ]
    };
  }

  if (node?.familyId === "decision") {
    const baselineDecision = profile.baselineDecision?.result?.decisionIndex ?? null;
    const latestDecision = profile.latestDecision?.result?.decisionIndex ?? null;
    const bestDecision = runs
      .filter((run) => run.mode === "edhs")
      .reduce((best, run) => {
        const value = Number(run.result?.decisionIndex);
        if (!Number.isFinite(value)) {
          return best;
        }
        return best === null ? value : Math.max(best, value);
      }, null);
    const delta =
      Number.isFinite(baselineDecision) && Number.isFinite(latestDecision)
        ? latestDecision - baselineDecision
        : null;
    return {
      label: "Decision Making",
      rows: [
        { label: "Baseline", value: baselineDecision ?? "--" },
        { label: "Latest", value: latestDecision ?? "--" },
        { label: "Best", value: bestDecision ?? "--" },
        { label: "Delta", value: Number.isFinite(delta) ? formatSignedNumber(delta) : "--", tone: metricTone(delta) }
      ]
    };
  }

  return {
    label: "Cognitive Resilience",
    rows: [
      { label: "CRS-10", value: profile.latestResilience?.result?.resilienceIndex ?? "--" },
      { label: "CRS band", value: profile.latestResilience?.result?.band ?? "--" },
      { label: "Psi-AD", value: profile.latestPsiAd?.result?.resilienceIndex ?? "--" },
      { label: "Last Zone", value: zoneState }
    ]
  };
}

function buildTestsTelemetryCards({ nodeState, node, session, runs, zoneHandoff }) {
  const profile = buildProfileSnapshot(runs);
  const nodeBlueprint = !session && node?.id ? createSessionBlueprint(node.id) : null;
  const completionCurrent = session ? session.index + 1 : nodeBlueprint?.items?.length || 0;
  const completionTotal = session ? session.items.length : nodeBlueprint?.items?.length || 0;
  const familyCard = buildFamilyRows(node, profile, runs, zoneHandoff);

  return [
    {
      type: "splitMetric",
      label: "Test status",
      value: session ? "Running" : statusLabel(nodeState?.status),
      valueTone: session || nodeState?.status === "due" ? "accent" : undefined,
      subline: session
        ? `${node?.label || "Test"} is live in the centre panel.`
        : nodeState?.detail || "Battery-driven evidence route.",
      badge: session ? "Live" : nodeState?.gateBadge || "Tests",
      emphasis: true
    },
    {
      type: "ring",
      label: "Completion",
      ringValue: completionTotal ? Math.round((completionCurrent / completionTotal) * 100) : 0,
      ringNumber: completionTotal ? String(completionCurrent) : "--",
      ringLabel: completionTotal ? `of ${completionTotal}` : "steps",
      subline: session
        ? `${node?.label || "Test"} progress`
        : `Selected route: ${node?.familyLabel || "Tests"}`
    },
    {
      type: "list",
      label: `${familyCard.label} snapshot`,
      rows: familyCard.rows
    },
    {
      type: "list",
      label: "Battery coverage",
      rows: [
        { label: "Fluid IQ", value: profile.latestReasoning?.result?.rsIq ?? "--" },
        { label: "Applied IQ", value: profile.latestPsiCore?.result?.appliedGIndex ?? "--" },
        { label: "Decision", value: profile.latestDecision?.result?.decisionIndex ?? "--" },
        { label: "Resilience", value: profile.latestResilience?.result?.resilienceIndex ?? "--" }
      ]
    },
    {
      type: "badge",
      label: "Availability",
      badge: nodeState?.gateBadge || "Awaiting route",
      badgeState: nodeState?.available ? "ready" : "warning",
      subline: nodeState?.detail || "Run tests directly from the battery tree.",
      footer: {
        left: "Latest update",
        right: runs.length ? formatDate(runs[runs.length - 1].finishedAt) : "None yet"
      }
    }
  ];
}

function controlModeLabel(mode) {
  return mode === "manual" ? "You choose" : "Coach guided";
}

export function mountTestsScreen({ root }) {
  const telemetryRail = root.querySelector(".telemetry-rail");
  const treePanel = root.querySelector("[data-tests-tree-panel]");
  const taskRoot = root.querySelector("[data-tests-task-root]");
  const responseRoot = root.querySelector("[data-tests-response-root]");
  const bannerSubtitle = root.querySelector("[data-tests-banner-subtitle]");
  const bannerSubcopy = root.querySelector("[data-tests-banner-subcopy]");
  const bannerStage = root.querySelector("[data-tests-banner-stage]");
  const bannerMeta = root.querySelector("[data-tests-banner-meta]");
  const bannerTrack = root.querySelector("[data-tests-banner-track]");
  const coachHeadline = root.querySelector("[data-tests-coach-headline]");
  const coachBody = root.querySelector("[data-tests-coach-body]");

  const persisted = loadTestsRuntimeState();
  const initialZone = loadLatestZoneHandoff();
  const uiState = {
    persisted,
    zoneHandoff: initialZone,
    selectedNodeId: recommendNextNode(persisted.runs, initialZone, persisted.profile),
    controlMode: "coach",
    session: null,
    flash: null
  };

  function selectNode(nodeId) {
    if (getTestNode(nodeId)) {
      uiState.selectedNodeId = nodeId;
      uiState.flash = null;
      render();
    }
  }

  function resolveNodeContext() {
    const nodeStates = buildNodeStates(uiState.persisted.runs, uiState.zoneHandoff, uiState.persisted.profile);
    const recommendedId = recommendNextNode(uiState.persisted.runs, uiState.zoneHandoff, uiState.persisted.profile);
    const availableStates = nodeStates.filter((entry) => entry.available);

    if (!uiState.session) {
      if (uiState.controlMode === "coach" && recommendedId) {
        uiState.selectedNodeId = recommendedId;
      } else if (!availableStates.some((entry) => entry.id === uiState.selectedNodeId)) {
        uiState.selectedNodeId = availableStates[0]?.id || recommendedId || nodeStates[0]?.id || "sgs12a";
      }
    }

    const state =
      nodeStates.find((entry) => entry.id === uiState.selectedNodeId)
      || nodeStates.find((entry) => entry.id === recommendedId)
      || nodeStates[0];

    return { nodeStates, state, recommendedId, availableStates };
  }

  function setControlMode(mode) {
    if (mode !== "coach" && mode !== "manual") {
      return;
    }
    uiState.controlMode = mode;
    uiState.flash = null;
    if (!uiState.session && mode === "coach") {
      uiState.selectedNodeId = recommendNextNode(uiState.persisted.runs, uiState.zoneHandoff, uiState.persisted.profile);
    }
    render();
  }

  function resetHistory() {
    uiState.persisted = clearTestsRuntimeState();
    uiState.zoneHandoff = loadLatestZoneHandoff();
    uiState.session = null;
    uiState.controlMode = "coach";
    uiState.selectedNodeId = recommendNextNode(uiState.persisted.runs, uiState.zoneHandoff, uiState.persisted.profile);
    uiState.flash = {
      headline: "Local test history cleared.",
      body: "The four-family battery is back at the opening guided route."
    };
    render();
  }

  function saveRun(nodeId, result) {
    const node = getTestNode(nodeId);
    const run = {
      runId: `${nodeId}_${Date.now()}`,
      testId: nodeId,
      label: node?.label || nodeId,
      mode: result.mode,
      startedAt: uiState.session?.startedAt || Date.now(),
      finishedAt: Date.now(),
      status: "complete",
      zoneSnapshot: uiState.zoneHandoff,
      result
    };
    uiState.persisted = saveCompletedTestRun(run);
    uiState.zoneHandoff = loadLatestZoneHandoff();
    uiState.session = null;
    uiState.selectedNodeId = nodeId;
    uiState.flash = {
      headline: `${node?.label || "Test"} saved.`,
      body: "Coach input decides the next screen from here. Major transitions are explicit rather than automatic."
    };
  }

  function finishSession() {
    const nodeId = uiState.session?.nodeId;
    if (!nodeId) {
      return;
    }
    const node = getTestNode(nodeId);
    let result = null;
    if (uiState.session.mode === "sgs") {
      result = computeSgsResult(node.manifest, uiState.session.answers);
    } else if (uiState.session.mode === "edhs") {
      result = computeEdhsResult(node.manifest, uiState.session.answers);
    } else if (uiState.session.mode === "crs") {
      result = computeCrs10Result(node.manifest, uiState.session.answers);
    } else if (uiState.session.mode === "psi-core") {
      result = computePsiCoreResult(node.manifest, uiState.session.answers);
    } else if (uiState.session.mode === "psi-ad") {
      result = computePsiAdResult(node.manifest, uiState.session.answers);
    } else if (uiState.session.mode === "psi-ai") {
      result = computePsiAiResult(node.manifest, uiState.session.answers);
    }
    if (result) {
      saveRun(nodeId, result);
      render();
    }
  }

  function startSession(nodeId) {
    const node = getTestNode(nodeId);
    const nodeState = buildNodeStates(uiState.persisted.runs, uiState.zoneHandoff, uiState.persisted.profile)
      .find((entry) => entry.id === nodeId);
    if (!node || nodeState?.available === false) {
      return;
    }
    const blueprint = createSessionBlueprint(nodeId);
    if (!blueprint) {
      return;
    }
    uiState.session = {
      nodeId,
      mode: blueprint.mode,
      label: blueprint.label,
      items: blueprint.items,
      responseOptions: blueprint.responseOptions || null,
      startedAt: Date.now(),
      index: 0,
      answers: blueprint.mode === "sgs" ? [] : {}
    };
    uiState.selectedNodeId = nodeId;
    uiState.flash = null;
    render();
  }

  function beginSelectedTest(nodeStates, recommendedId) {
    const targetNodeId = uiState.controlMode === "coach" ? recommendedId : uiState.selectedNodeId;
    const targetState = nodeStates.find((entry) => entry.id === targetNodeId);
    if (!targetNodeId || !targetState?.available) {
      uiState.flash = {
        headline: "No launchable test selected.",
        body: "Choose an available test first, or switch back to Coach guided."
      };
      render();
      return;
    }

    if (
      targetNodeId === "psi-ai"
      && uiState.persisted.profile.usesAi !== true
      && !targetState.latestRun
    ) {
      uiState.flash = {
        headline: "Confirm AI use first.",
        body: "Use the AI prompt below before opening the Psi-CBS-AI supplement."
      };
      render();
      return;
    }

    startSession(targetNodeId);
  }

  function handleAnswer(rawValue) {
    if (!uiState.session) {
      return;
    }
    const currentItem = uiState.session.items[uiState.session.index];
    if (!currentItem) {
      return;
    }

    if (uiState.session.mode === "sgs") {
      const optionIndex = Number(rawValue);
      if (!Number.isFinite(optionIndex)) {
        return;
      }
      uiState.session.answers[uiState.session.index] = optionIndex;
    } else if (uiState.session.mode === "edhs") {
      const choice = currentItem.options?.find((option) => option.id === rawValue);
      if (!choice) {
        return;
      }
      uiState.session.answers[currentItem.id] = {
        optionId: choice.id,
        score: choice.score
      };
    } else {
      const numericValue = Number(rawValue);
      if (!Number.isFinite(numericValue)) {
        return;
      }
      uiState.session.answers[currentItem.id] = numericValue;
    }

    if (uiState.session.index >= uiState.session.items.length - 1) {
      finishSession();
      return;
    }

    uiState.session.index += 1;
    render();
  }

  function renderTree(nodeStates) {
    const selectedNodeId = uiState.selectedNodeId;
    const selectedFamilyId = getTestNode(selectedNodeId)?.familyId;
    treePanel.innerHTML = `
      <div class="tests-route-shell">
        <div class="tests-route-title">TEST<br>BATTERY</div>
        ${getTestGroups().map((group) => `
          <section class="tests-route-family${selectedFamilyId === group.id ? " is-current" : ""}">
            <div class="tests-route-family-head">
              <span class="tests-route-family-name">${escapeHtml(group.label)}</span>
              <span class="tests-route-family-step" aria-hidden="true"></span>
            </div>
            <div class="tests-route-family-branch">
              ${group.nodes.map((node) => {
                const state = nodeStates.find((entry) => entry.id === node.id);
                return `
                  <button
                    class="tests-route-node is-${state?.status || "locked"}${selectedNodeId === node.id ? " is-active" : ""}"
                    type="button"
                    data-tests-node="${node.id}"
                    aria-pressed="${selectedNodeId === node.id ? "true" : "false"}"
                  >
                    <span class="tests-route-node-dot" aria-hidden="true"></span>
                    <span class="tests-route-node-label">${escapeHtml(node.label)}</span>
                  </button>
                `;
              }).join("")}
            </div>
          </section>
        `).join("")}
        <div class="tests-route-key" aria-label="Test battery state key">
          <div class="tests-route-key-item">
            <span class="tests-route-key-dot tests-route-key-dot--unlocked" aria-hidden="true"></span>
            <span>UNLOCKED</span>
          </div>
          <div class="tests-route-key-item">
            <span class="tests-route-key-dot tests-route-key-dot--locked" aria-hidden="true"></span>
            <span>LOCKED</span>
          </div>
          <div class="tests-route-key-item">
            <span class="tests-route-key-dot tests-route-key-dot--active" aria-hidden="true"></span>
            <span>ACTIVE</span>
          </div>
        </div>
      </div>
    `;
  }

  function buildLauncherMarkup(nodeStates, recommendedId) {
    const launchNodeId = uiState.controlMode === "coach" ? recommendedId : uiState.selectedNodeId;
    const launchNode = getTestNode(launchNodeId);
    const launchState = nodeStates.find((entry) => entry.id === launchNodeId);
    const selectableStates = nodeStates.filter((entry) => entry.available);
    const takeDisabled =
      !launchNode
      || !launchState?.available
      || (
        launchNode.id === "psi-ai"
        && uiState.persisted.profile.usesAi !== true
        && !launchState.latestRun
      );

    return `
      <div class="tests-launch-shell">
        <section class="capacity-sandbox-panel tests-launch-panel">
          <div class="capacity-live-head">
            <div class="capacity-live-kicker">Tests battery</div>
            <div class="capacity-live-pill">Ready</div>
          </div>
          <div class="capacity-lab-setup-grid">
            <div class="capacity-lab-field capacity-lab-field--wide">
              <span>Mode</span>
              <div class="capacity-lab-mode-row" role="group" aria-label="Test launch mode">
                <button class="capacity-lab-chip${uiState.controlMode === "coach" ? " is-active" : ""}" type="button" data-tests-action="set-mode" data-mode="coach">Coach guided</button>
                <button class="capacity-lab-chip${uiState.controlMode === "manual" ? " is-active" : ""}" type="button" data-tests-action="set-mode" data-mode="manual">You choose</button>
              </div>
            </div>
            ${uiState.controlMode === "coach"
              ? `
                <div class="capacity-lab-field capacity-lab-field--wide">
                  <span>Next test</span>
                  <div class="capacity-lab-recommend">
                    <div class="capacity-lab-recommend-label">${escapeHtml(controlModeLabel(uiState.controlMode))}</div>
                    <div class="capacity-lab-recommend-text">${escapeHtml(launchNode?.label || "No test ready")}</div>
                    <div class="capacity-lab-recommend-note">${escapeHtml(launchState?.detail || "The coach route will step through the battery one test at a time.")}</div>
                  </div>
                </div>
              `
              : `
                <label class="capacity-lab-field capacity-lab-field--wide">
                  <span>Test</span>
                  <select data-tests-setting="node">
                    ${selectableStates.map((state) => {
                      const node = getTestNode(state.id);
                      return `<option value="${state.id}"${state.id === uiState.selectedNodeId ? " selected" : ""}>${escapeHtml(node?.label || state.label)}</option>`;
                    }).join("")}
                  </select>
                </label>
              `
            }
          </div>
          <p class="capacity-lab-helper">
            ${uiState.controlMode === "coach"
              ? "Coach guided will launch the next recommended test in the battery."
              : launchNode?.id === "psi-ai" && uiState.persisted.profile.usesAi !== true && !launchState?.latestRun
                ? "Confirm AI use below before opening the Psi-CBS-AI supplement."
                : "You choose lets you launch any currently available test from the battery."}
          </p>
          <div class="capacity-lab-action-row">
            <button class="capacity-transition-action capacity-transition-action--lab" type="button" data-tests-action="take-test" ${takeDisabled ? "disabled" : ""}>Take test</button>
            <button class="capacity-lab-secondary-btn" type="button" data-tests-action="reset-history">Reset history</button>
          </div>
        </section>
      </div>
    `;
  }

  function renderBanner(node, nodeState) {
    const modeLabel = controlModeLabel(uiState.controlMode);
    if (uiState.session) {
      bannerSubtitle.textContent = `${node.label} live`;
      bannerSubcopy.textContent = "Battery item flow inside the Basic shell";
      bannerStage.textContent = `Item ${uiState.session.index + 1}/${uiState.session.items.length}`;
      bannerMeta.textContent = uiState.session.mode === "sgs" || uiState.session.mode === "edhs" ? "choice run" : "questionnaire run";
      bannerTrack.textContent = "Answer cleanly. Major route changes happen after the run, not mid-run.";
      return;
    }

    if (nodeState?.latestRun) {
      bannerSubtitle.textContent = `${node.label} summary`;
      bannerSubcopy.textContent = uiState.controlMode === "coach" ? "Coach-guided battery review" : "Manual battery review";
      bannerStage.textContent = "Review";
      bannerMeta.textContent = `${modeLabel} · Last saved ${formatDate(nodeState.latestRun.finishedAt)}`;
      bannerTrack.textContent = nodeState.detail;
      return;
    }

    bannerSubtitle.textContent = node.label;
    bannerSubcopy.textContent = uiState.controlMode === "coach" ? "Coach-guided battery route" : "Manual battery selection";
    bannerStage.textContent = nodeState?.available ? "Ready" : "Held";
    bannerMeta.textContent = `${modeLabel} · ${node.shortLabel}`;
    bannerTrack.textContent = nodeState?.detail || node.manifest?.introCopy || "Select a test to begin.";
  }

  function renderCoach(node, nodeState, recommendedId) {
    if (uiState.flash) {
      coachHeadline.textContent = uiState.flash.headline;
      coachBody.textContent = uiState.flash.body;
      return;
    }

    if (uiState.session) {
      const currentItem = uiState.session.items[uiState.session.index];
      coachHeadline.textContent = `${node.label} in progress.`;
      coachBody.textContent =
        currentItem?.kind === "likert"
          ? "Choose the response that best fits the last two weeks. The next item will load immediately."
          : currentItem?.kind === "choice-score"
            ? "Choose the option that best matches your usual behaviour. The next item will load immediately."
            : "Choose the option that best completes the current item. The next item will load immediately.";
      return;
    }

    if (!nodeState?.available) {
      coachHeadline.textContent = "This test is waiting on a prior step.";
      coachBody.textContent = `${nodeState.detail} Use the family tree to open the required earlier form or core screen.`;
      return;
    }

    if (uiState.controlMode === "manual") {
      coachHeadline.textContent = "You choose is active.";
      coachBody.textContent =
        node.id === "psi-ai" && uiState.persisted.profile.usesAi !== true && !nodeState.latestRun
          ? "Psi-CBS-AI is selected. Confirm AI use below before opening the supplement."
          : `${node.label} is selected. Use the dropdown or left tree to switch tests, then take it directly.`;
      return;
    }

    if (recommendedId === node.id) {
      coachHeadline.textContent = "This is the next recommended test.";
      coachBody.textContent = node.manifest?.introCopy || "Start the current evidence screen when ready.";
      return;
    }

    coachHeadline.textContent = "Review or repeat from the tree.";
    coachBody.textContent = `${node.label} is available, but ${getTestNode(recommendedId)?.label || "another node"} is the coach-preferred next step.`;
  }

  function renderSessionTask(node) {
    const item = uiState.session.items[uiState.session.index];
    const promptMeta =
      item.sectionName
        ? `${item.sectionName}${item.pairName ? ` - ${item.pairName}` : ""}`
        : item.kind === "rotation" || item.kind === "matrix"
          ? item.kind
          : node.familyLabel;
    const imageMarkup = item.stemImageUrl
      ? `
        <div class="tests-stem-media">
          <img class="tests-stem-image" src="${escapeHtml(item.stemImageUrl)}" alt="${escapeHtml(item.prompt)}">
        </div>
      `
      : "";

    taskRoot.innerHTML = `
      <div class="tests-stage-card tests-stage-card--active">
        <div class="tests-stage-kicker">${escapeHtml(promptMeta)}</div>
        <div class="tests-stage-progress">
          <span>${escapeHtml(node.label)}</span>
          <span>${uiState.session.index + 1} / ${uiState.session.items.length}</span>
        </div>
        ${imageMarkup}
        ${item.title ? `<div class="tests-question-kicker">${escapeHtml(item.title)}</div>` : ""}
        <h2 class="tests-question-title">${escapeHtml(item.prompt)}</h2>
        ${item.kind === "likert"
          ? ""
          : item.kind === "choice-score"
            ? `<p class="tests-question-note">Pick the option that is closest to your usual approach.</p>`
            : `<p class="tests-question-note">Choose the strongest answer and keep the run moving.</p>`}
      </div>
    `;

    if (uiState.session.mode === "sgs") {
      responseRoot.innerHTML = `
        <div class="tests-response-stack tests-response-stack--choices">
          <div class="tests-choice-grid">
            ${item.responseOptions.map((option, index) => `
              <button class="choice-card tests-choice-card" type="button" data-tests-answer="${index}">
                <span class="choice-title">${escapeHtml(option)}</span>
                <span class="choice-subtitle">${escapeHtml(item.id)}</span>
              </button>
            `).join("")}
          </div>
        </div>
      `;
      return;
    }

    if (uiState.session.mode === "edhs") {
      responseRoot.innerHTML = `
        <div class="tests-response-stack tests-response-stack--choices">
          <div class="tests-choice-grid tests-choice-grid--decision">
            ${item.options.map((option) => `
              <button class="choice-card tests-choice-card tests-choice-card--decision" type="button" data-tests-answer="${option.id}">
                <span class="choice-title">${escapeHtml(option.id)}</span>
                <span class="choice-subtitle">${escapeHtml(option.text)}</span>
              </button>
            `).join("")}
          </div>
        </div>
      `;
      return;
    }

    const currentValue = uiState.session.answers[item.id];
    responseRoot.innerHTML = `
      <div class="tests-response-stack">
        <div class="tests-likert-shell">
          <div class="tests-likert-copy">Choose one response:</div>
          ${responseScaleMarkup(currentValue, uiState.session.responseOptions)}
        </div>
      </div>
    `;
  }

  function renderAiIntro(nodeState, nodeStates, recommendedId) {
    const usesAi = uiState.persisted.profile.usesAi;
    taskRoot.innerHTML = `
      ${buildLauncherMarkup(nodeStates, recommendedId)}
      <div class="tests-stage-card">
        <div class="tests-stage-kicker">Coach check</div>
        <h2 class="tests-question-title">Did you use AI tools in the past two weeks for work, study, or projects?</h2>
        <p class="tests-question-note">
          ${usesAi === false
            ? "This profile is currently marked as not using AI. You can keep it optional or reopen the supplement."
            : nodeState.detail}
        </p>
      </div>
    `;
    responseRoot.innerHTML = `
      <div class="tests-response-stack tests-response-stack--actions">
        <button class="capacity-transition-action" type="button" data-tests-action="set-ai-yes">Yes, open the AI supplement</button>
        <button class="capacity-transition-secondary" type="button" data-tests-action="set-ai-no">No, keep it optional</button>
      </div>
    `;
  }

  function renderNodeOverview(node, nodeState, nodeStates, recommendedId) {
    if (node.id === "psi-ai" && !nodeState.latestRun && uiState.persisted.profile.usesAi !== true) {
      renderAiIntro(nodeState, nodeStates, recommendedId);
      return;
    }

    const latestRun = nodeState.latestRun;
    const nextNode = recommendedId && recommendedId !== node.id ? getTestNode(recommendedId) : null;
    const summaryMetrics = buildSummaryMetrics(node.id, latestRun?.result);
    const launcherMarkup = buildLauncherMarkup(nodeStates, recommendedId);

    taskRoot.innerHTML = `
      ${launcherMarkup}
      <div class="tests-stage-card">
        <div class="tests-stage-kicker">${escapeHtml(node.familyLabel)}</div>
        <div class="tests-stage-progress">
          <span>${escapeHtml(node.label)}</span>
          <span>${escapeHtml(node.shortLabel)}</span>
        </div>
        <h2 class="tests-question-title">${escapeHtml(node.manifest?.introTitle || node.label)}</h2>
        <p class="tests-question-note">${escapeHtml(nodeState.detail || node.manifest?.introCopy || "Select this screen to begin.")}</p>
        ${latestRun ? `
          <div class="tests-summary-grid">
            ${summaryMetrics.map((metric) => `
              <div class="tests-summary-stat">
                <span>${escapeHtml(metric.label)}</span>
                <strong>${escapeHtml(metric.value)}</strong>
              </div>
            `).join("")}
          </div>
          <div class="tests-summary-note">Last saved ${formatDate(latestRun.finishedAt)}. Stored locally for the Basic evidence route.</div>
        ` : ""}
      </div>
    `;

    responseRoot.innerHTML = nextNode && uiState.controlMode === "coach"
      ? `
        <div class="tests-response-stack tests-response-stack--actions">
          <button class="capacity-transition-secondary" type="button" data-tests-action="goto-next">
            Coach next: ${escapeHtml(nextNode.label)}
          </button>
        </div>
      `
      : "";
  }

  function renderTelemetry(nodeState, node) {
    if (telemetryRail) {
      telemetryRail.innerHTML = renderTelemetryCards(
        buildTestsTelemetryCards({
          nodeState,
          node,
          session: uiState.session,
          runs: uiState.persisted.runs,
          zoneHandoff: uiState.zoneHandoff
        })
      );
    }
  }

  function render() {
    uiState.zoneHandoff = loadLatestZoneHandoff();
    const { nodeStates, state: nodeState, recommendedId } = resolveNodeContext();
    const node = getTestNode(nodeState?.id || uiState.selectedNodeId) || getTestNode("sgs12a");
    uiState.selectedNodeId = node.id;

    renderTree(nodeStates);
    renderBanner(node, nodeState);
    renderCoach(node, nodeState, recommendedId);
    if (uiState.session) {
      renderSessionTask(node);
    } else {
      renderNodeOverview(node, nodeState, nodeStates, recommendedId);
    }
    renderTelemetry(nodeState, node);
  }

  function onClick(event) {
    const nodeButton = event.target.closest("[data-tests-node]");
    if (nodeButton) {
      const nodeStates = buildNodeStates(uiState.persisted.runs, uiState.zoneHandoff, uiState.persisted.profile);
      const targetState = nodeStates.find((entry) => entry.id === nodeButton.dataset.testsNode);
      if (uiState.session) {
        uiState.flash = {
          headline: "Finish the current test first.",
          body: "Node switching is held until the active run is saved."
        };
        render();
        return;
      }
      if (uiState.controlMode === "coach") {
        uiState.flash = {
          headline: "Coach guided is active.",
          body: "Switch to You choose if you want to override the coach route manually."
        };
        render();
        return;
      }
      if (!targetState?.available) {
        uiState.flash = {
          headline: "That test is not ready yet.",
          body: targetState?.detail || "Complete the required earlier step first."
        };
        render();
        return;
      }
      selectNode(nodeButton.dataset.testsNode);
      return;
    }

    const answerButton = event.target.closest("[data-tests-answer]");
    if (answerButton) {
      handleAnswer(answerButton.dataset.testsAnswer);
      return;
    }

    const actionButton = event.target.closest("[data-tests-action]");
    if (!actionButton) {
      return;
    }
    const action = actionButton.dataset.testsAction;
    const { nodeStates, recommendedId } = resolveNodeContext();
    switch (action) {
      case "set-mode":
        setControlMode(actionButton.dataset.mode);
        break;
      case "take-test":
        beginSelectedTest(nodeStates, recommendedId);
        break;
      case "reset-history":
        resetHistory();
        break;
      case "start":
      case "retest":
        startSession(uiState.selectedNodeId);
        break;
      case "goto-next":
        selectNode(recommendNextNode(uiState.persisted.runs, uiState.zoneHandoff, uiState.persisted.profile));
        break;
      case "set-ai-yes":
        uiState.persisted = saveTestsProfile({ usesAi: true });
        startSession("psi-ai");
        break;
      case "set-ai-no":
        uiState.persisted = saveTestsProfile({ usesAi: false });
        uiState.flash = {
          headline: "AI supplement left optional.",
          body: "The profile now treats Psi-CBS-AI as not needed unless you reopen it later."
        };
        render();
        break;
      default:
        break;
    }
  }

  function onChange(event) {
    const selector = event.target.closest("[data-tests-setting='node']");
    if (!selector || uiState.session || uiState.controlMode !== "manual") {
      return;
    }
    selectNode(selector.value);
  }

  root.addEventListener("click", onClick);
  root.addEventListener("change", onChange);
  render();

  return () => {
    root.removeEventListener("click", onClick);
    root.removeEventListener("change", onChange);
  };
}
