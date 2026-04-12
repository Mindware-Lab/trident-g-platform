import {
  familyDisplayLabel,
  familyEntryWrapper,
  getMissionRailDefinition,
  getMissionRailDefinitions,
  phaseWindowLabel
} from "../programme/mission.js";
import {
  loadProgrammeState,
  selectMissionRail
} from "../programme/storage.js";
import { loadLatestZoneHandoff } from "../zone/storage.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapperLabel(wrapper) {
  if (wrapper === "hub_noncat") return "Flex unknown";
  if (wrapper === "hub_concept") return "Flex concept";
  if (wrapper === "and_cat") return "Bind known";
  if (wrapper === "and_noncat") return "Bind unknown";
  if (wrapper === "resist_vectors") return "Resist vectors";
  if (wrapper === "resist_words") return "Resist words";
  if (wrapper === "resist_concept") return "Resist concept";
  if (wrapper === "relate_vectors") return "Relate vectors mono";
  if (wrapper === "relate_numbers") return "Relate numbers mono";
  if (wrapper === "relate_vectors_dual") return "Relate vectors dual";
  if (wrapper === "relate_numbers_dual") return "Relate numbers dual";
  return "Flex known";
}

function routeClassLabel(routeClass) {
  if (routeClass === "core") {
    return "Core";
  }
  if (routeClass === "support") {
    return "Support";
  }
  if (routeClass === "recovery") {
    return "Recovery";
  }
  return "Pending";
}

function buildCoreSegments(coreSessionNumber) {
  return Array.from({ length: 20 }, (_, index) => {
    const activeClass = index < coreSessionNumber ? " is-trained" : "";
    return `<span class="hub-progress-segment${activeClass}"></span>`;
  }).join("");
}

function currentMissionRail(programme) {
  return getMissionRailDefinition(programme.missionRailId);
}

function renderMissionTree(programme) {
  const selectedMissionRailId = programme.missionRailId;
  const items = getMissionRailDefinitions().map((rail) => {
    const current = rail.id === selectedMissionRailId;
    const complete = current && programme.programmeComplete === true;
    const stateClass = complete
      ? " is-complete"
      : current
        ? " is-current"
        : " is-available";
    const dotClass = complete
      ? " is-complete"
      : current
        ? " is-current"
        : " is-available";
    const descriptor = current
      ? (programme.programmeComplete ? "Programme complete" : "Active rail")
      : "Available";

    return `
      <button
        class="hub-rail-node${stateClass}"
        type="button"
        data-hub-tree-rail="${rail.id}"
        aria-pressed="${current ? "true" : "false"}"
      >
        <span class="hub-rail-node-dot${dotClass}"></span>
        <span class="hub-rail-node-copy">
          <span class="hub-rail-node-label">${escapeHtml(rail.label)}</span>
          <span class="hub-rail-node-sub">${escapeHtml(rail.missionLabel)}</span>
          <span class="hub-rail-node-meta">${escapeHtml(descriptor)}</span>
        </span>
      </button>
    `;
  }).join("");

  return `
    <div class="hub-rail-shell">
      <div class="hub-rail-title">Mission rails</div>
      <div class="hub-rail-subcopy">Pick the real-world thinking route you want the guided 20-session Capacity rail to foreground.</div>
      <div class="hub-rail-list">
        ${items}
      </div>
      <div class="hub-rail-legend">
        <span class="hub-rail-legend-item"><span class="hub-rail-node-dot is-available"></span><span>Available</span></span>
        <span class="hub-rail-legend-item"><span class="hub-rail-node-dot is-current"></span><span>Selected</span></span>
        <span class="hub-rail-legend-item"><span class="hub-rail-node-dot is-complete"></span><span>Complete</span></span>
      </div>
    </div>
  `;
}

function renderRailSequence(programme) {
  const mission = currentMissionRail(programme);
  if (!mission) {
    return "";
  }

  const segments = [
    {
      id: "foundation",
      title: "Foundation",
      body: "Shared 1-5"
    },
    {
      id: "rail_family_1",
      title: familyDisplayLabel(mission.families[0].familyId),
      body: `${mission.families[0].start}-${mission.families[0].end}`
    },
    {
      id: "rail_family_2",
      title: familyDisplayLabel(mission.families[1].familyId),
      body: `${mission.families[1].start}-${mission.families[1].end}`
    },
    {
      id: "rail_family_3",
      title: familyDisplayLabel(mission.families[2].familyId),
      body: `${mission.families[2].start}-${mission.families[2].end}`
    }
  ];

  return segments.map((segment) => {
    const active = programme.currentRailPhase === segment.id;
    const complete = segment.id === "foundation"
      ? programme.coreSessionNumber >= 5
      : mission.families.some((family) => family.phase === segment.id && programme.coreSessionNumber >= family.end);
    return `
      <div class="hub-rail-phase-card${active ? " is-active" : ""}${complete ? " is-complete" : ""}">
        <div class="hub-rail-phase-title">${escapeHtml(segment.title)}</div>
        <div class="hub-rail-phase-copy">${escapeHtml(segment.body)}</div>
      </div>
    `;
  }).join("");
}

function renderCoachActions(programme, latestHandoff) {
  const zoneReady = latestHandoff?.capacityPlan?.routeClass && latestHandoff.capacityPlan.routeClass !== "recovery";
  const primaryAction = `<button class="hub-mission-action hub-mission-action--primary" type="button" data-hub-action="${zoneReady ? "open-capacity" : "open-zone"}">${zoneReady ? "Run guided Capacity" : "Open Zone"}</button>`;

  return `
    <div class="hub-mission-actions">
      ${primaryAction}
      <button class="hub-mission-action" type="button" data-hub-action="open-tests">Open tests</button>
      <button class="hub-mission-action" type="button" data-hub-action="${zoneReady ? "open-zone" : "open-capacity"}">${zoneReady ? "Open Zone" : "Open Capacity"}</button>
    </div>
  `;
}

function renderProgrammePanel(programme, latestHandoff) {
  const mission = currentMissionRail(programme);
  if (!mission) {
    return `
      <div class="hub-panel-head">
        <span class="hub-panel-kicker">Programme</span>
        <span class="hub-panel-badge">Mission rail</span>
      </div>
      <div class="hub-programme-shell">
        <div class="hub-programme-title">Choose a mission rail.</div>
        <div class="hub-programme-note">Select a rail on the left to set the guided Capacity route.</div>
      </div>
    `;
  }

  const progressPct = Math.max(0, Math.min(100, Math.round((programme.coreSessionNumber / 20) * 100)));
  const familyLabel = programme.currentFamilyId ? familyDisplayLabel(programme.currentFamilyId) : "Calibration";
  const nextCapacityLabel = programme.currentFamilyId
    ? `${wrapperLabel(familyEntryWrapper(programme.currentFamilyId))} / slow / N-1`
    : "Foundation calibration";
  const routeTone = latestHandoff?.capacityPlan?.routeClass || programme.lastZoneClass || "pending";
  const routeLabel = routeClassLabel(routeTone);

  return `
    <div class="hub-panel-head">
      <span class="hub-panel-kicker">Programme</span>
      <span class="hub-panel-badge">Active mission</span>
    </div>
    <div class="hub-programme-shell">
      <div class="hub-programme-top">
        <div class="hub-programme-main">
          <div class="hub-programme-title">${escapeHtml(mission.label)}</div>
          <div class="hub-programme-sub">${escapeHtml(mission.missionLabel)}</div>
          <div class="hub-programme-note">Next guided Capacity: ${escapeHtml(nextCapacityLabel)}. Current lane: ${escapeHtml(routeLabel)}.</div>
          <div class="hub-mission-stats">
            <div class="hub-mission-stat">
              <span class="hub-mission-stat-label">Core</span>
              <strong class="hub-mission-stat-value">${programme.coreSessionNumber}/20</strong>
            </div>
            <div class="hub-mission-stat">
              <span class="hub-mission-stat-label">Phase</span>
              <strong class="hub-mission-stat-value">${escapeHtml(phaseWindowLabel(programme.currentRailPhase))}</strong>
            </div>
            <div class="hub-mission-stat">
              <span class="hub-mission-stat-label">Family</span>
              <strong class="hub-mission-stat-value">${escapeHtml(familyLabel)}</strong>
            </div>
            <div class="hub-mission-stat">
              <span class="hub-mission-stat-label">Zone lane</span>
              <strong class="hub-mission-stat-value">${escapeHtml(routeLabel)}</strong>
            </div>
            <div class="hub-mission-stat">
              <span class="hub-mission-stat-label">Support</span>
              <strong class="hub-mission-stat-value">${programme.supportSessionCount}</strong>
            </div>
            <div class="hub-mission-stat">
              <span class="hub-mission-stat-label">Reset</span>
              <strong class="hub-mission-stat-value">${programme.resetSessionCount}</strong>
            </div>
          </div>
        </div>
        <div class="hub-core-visual hub-core-visual--coach">
          <div class="hub-core-kicker">Programme progress</div>
          <div class="hub-ring" style="--hub-ring-value: ${progressPct};">
            <div class="hub-ring-inner">
              <span class="hub-ring-number">${programme.coreSessionNumber}/20</span>
              <span class="hub-ring-label">Core sessions</span>
            </div>
          </div>
          <div class="hub-progress-track" aria-hidden="true">${buildCoreSegments(programme.coreSessionNumber)}</div>
        </div>
      </div>
      <div class="hub-rail-phase-grid">
        ${renderRailSequence(programme)}
      </div>
      ${renderCoachActions(programme, latestHandoff)}
    </div>
  `;
}

export function mountHubScreen({ root, router }) {
  const treePanel = root.querySelector("[data-hub-mission-tree]");
  const programmePanel = root.querySelector("[data-hub-programme-panel]");
  if (!treePanel || !programmePanel) {
    return null;
  }

  function render() {
    const storedProgramme = loadProgrammeState();
    const latestHandoff = loadLatestZoneHandoff();

    treePanel.innerHTML = renderMissionTree(storedProgramme);
    programmePanel.innerHTML = renderProgrammePanel(storedProgramme, latestHandoff);

    treePanel.querySelectorAll("[data-hub-tree-rail]").forEach((button) => {
      button.addEventListener("click", (event) => {
        const missionRailId = event.currentTarget.dataset.hubTreeRail;
        if (!missionRailId) {
          return;
        }
        selectMissionRail(missionRailId);
        render();
      });
    });

    programmePanel.querySelectorAll("[data-hub-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.hubAction;
        if (action === "open-zone") {
          router.go("zone");
          return;
        }
        if (action === "open-capacity") {
          router.go("capacity");
          return;
        }
        if (action === "open-tests") {
          router.go("tests");
        }
      });
    });
  }

  render();
  return null;
}
