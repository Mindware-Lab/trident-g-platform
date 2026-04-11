import { zoneTelemetry } from "../../content/telemetry-placeholders.js";
import { mountZoneScreen } from "../../runtime/zone/mount.js";

const zoneSidePanelHtml = `
  <div class="zone-trident-panel">
    <div class="zone-trident-kicker">Trident state</div>
    <div class="zone-trident-graphic" aria-label="Zone position on the Trident">
      <span class="zone-trident-line zone-trident-line--shaft" aria-hidden="true"></span>
      <span class="zone-trident-line zone-trident-line--stem" aria-hidden="true"></span>
      <span class="zone-trident-line zone-trident-line--left" aria-hidden="true"></span>
      <span class="zone-trident-line zone-trident-line--right" aria-hidden="true"></span>
      <span class="zone-trident-node zone-trident-node--shaft" data-zone-node="shaft" aria-hidden="true"></span>
      <span class="zone-trident-node zone-trident-node--hub" data-zone-node="hub" aria-hidden="true"></span>
      <span class="zone-trident-node zone-trident-node--left" data-zone-node="left" aria-hidden="true"></span>
      <span class="zone-trident-node zone-trident-node--right" data-zone-node="right" aria-hidden="true"></span>
    </div>
    <div class="zone-trident-copy" data-zone-route-summary>Run one full 180-second MDT-m check to set the next guided session bounds.</div>
  </div>
`;

const zoneBannerHtml = `
  <div class="zone-banner-shell">
    <div class="banner-left">
      <h1 class="banner-title" id="banner-title">Zone Coach</h1>
      <span class="banner-subtitle">Masked majority-direction probe</span>
      <span class="banner-subcopy">One full check gates the next guided session</span>
    </div>
    <div class="banner-right">
      <div class="banner-stage" data-zone-banner-stage>Ready to probe</div>
      <span class="banner-stage-meta" data-zone-banner-meta>single probe session gate</span>
      <span class="zone-banner-track" data-zone-banner-track>One full MDT-m probe per session</span>
    </div>
  </div>
`;

const zoneCoachHtml = `
  <div class="capacity-coach-shell">
    <div class="coach-label">Zone coach</div>
    <div class="capacity-coach-panel">
      <div class="capacity-coach-line is-active">
        <strong data-zone-coach-headline>One clean gate before load.</strong>
        <span data-zone-coach-body>This screen runs the session's only Zone check. Capacity does not re-classify Zone mid-session.</span>
      </div>
    </div>
  </div>
`;

export const zoneScreen = {
  id: "zone",
  module: "zone",
  banner: {
    title: "Zone Coach",
    subtitle: "Masked majority-direction probe",
    subcopy: "single-session gate",
    stage: "Ready",
    stageMeta: "single probe session gate"
  },
  bannerHtml: zoneBannerHtml,
  info: [
    { kind: "text", icon: "Z", label: "Probe", value: "MDT-m", tone: "accent" },
    { kind: "text", label: "Policy", value: "One check per session", tone: "positive" },
    { kind: "pill", text: "Zone measured once pre-session", tone: "muted" }
  ],
  coach: {
    label: "Zone coach",
    headline: "One clean gate before load.",
    body: "This screen runs the session's only Zone check."
  },
  coachHtml: zoneCoachHtml,
  sidePanelClass: "zone-side-panel",
  sidePanelHtml: zoneSidePanelHtml,
  taskHtml: `
    <div class="zone-runtime-shell">
      <div class="zone-task-stage">
        <div class="zone-task-canvas-wrap">
          <canvas class="zone-task-canvas" data-zone-canvas></canvas>
          <div class="zone-task-preflight" data-zone-preflight>
            <div class="zone-task-kicker" data-zone-task-title>Zone Coach MDT-m</div>
            <div class="zone-task-copy" data-zone-task-copy>Run one full 180-second masked majority-direction check. This is the session's only Zone measurement.</div>
            <button class="capacity-transition-action capacity-transition-action--lab zone-task-start" type="button" data-zone-action="start">Begin full test</button>
            <button class="capacity-transition-action capacity-transition-action--lab zone-task-start" type="button" data-zone-action="new-session" hidden>Run new full check</button>
            <button class="capacity-transition-action capacity-transition-action--lab zone-task-start" type="button" data-zone-action="overlay-capacity" data-go="capacity" hidden>Run Capacity now</button>
          </div>
        </div>
      </div>
      <div class="zone-task-progress" data-zone-progress-block>
        <div class="zone-task-progress-bar">
          <span data-zone-progress-fill style="width:0%;"></span>
        </div>
        <div class="zone-task-progress-copy">
          <span data-zone-progress-label>Ready</span>
          <span data-zone-counts>Full probe only · 180 seconds · 5 arrows per masked trial</span>
        </div>
      </div>
    </div>
  `,
  responseHtml: `
    <div class="zone-response-shell">
      <div class="response-buttons" data-zone-response-buttons>
        <button class="response-button" type="button" data-zone-choice="left" disabled>
          <span class="button-title">Left majority</span>
          <span class="button-subtitle">Arrow key or tap after the mask</span>
        </button>
        <button class="response-button" type="button" data-zone-choice="right" disabled>
          <span class="button-title">Right majority</span>
          <span class="button-subtitle">Arrow key or tap after the mask</span>
        </button>
      </div>
      <div class="zone-response-actions" data-zone-idle-actions>
        <button class="capacity-lab-secondary-btn" type="button" data-zone-action="defer" data-go="hub">Back to Hub</button>
      </div>
    </div>
  `,
  telemetryCards: zoneTelemetry,
  mount: mountZoneScreen
};
