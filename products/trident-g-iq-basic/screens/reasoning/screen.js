import { reasoningTelemetry } from "../../content/telemetry-placeholders.js";
import { mountReasoningScreen } from "../../runtime/reasoning/mount.js";

const reasoningSidePanelHtml = `
  <div class="reasoning-tree-panel" data-reasoning-tree-panel></div>
`;

const reasoningBannerHtml = `
  <div class="reasoning-banner-shell">
    <div class="banner-left">
      <h1 class="banner-title" id="banner-title">Reasoning</h1>
      <span class="banner-subtitle" data-reasoning-banner-subtitle>Probe Gym</span>
      <span class="banner-subcopy" data-reasoning-banner-subcopy>Best Explanation plus Best Next Check</span>
    </div>
    <div class="banner-right">
      <div class="banner-stage" data-reasoning-banner-stage>Ready</div>
      <span class="banner-stage-meta" data-reasoning-banner-meta>relation load visible</span>
      <span class="reasoning-banner-track" data-reasoning-banner-track>PAB is the live relation-load index for this screen.</span>
    </div>
  </div>
`;

const reasoningCoachHtml = `
  <div class="capacity-coach-shell">
    <div class="coach-label">Coach</div>
    <div class="capacity-coach-panel">
      <div class="capacity-coach-line is-active">
        <strong data-reasoning-coach-headline>Probe Gym ready.</strong>
        <span data-reasoning-coach-body>Start Best Explanation or review the locked reasoning rails from the left tree.</span>
      </div>
    </div>
  </div>
`;

export const reasoningScreen = {
  id: "reasoning",
  navActiveId: "reasoning",
  module: "reasoning",
  banner: {
    title: "Reasoning",
    subtitle: "Probe Gym",
    subcopy: "Best Explanation plus Best Next Check",
    stage: "Ready",
    stageMeta: "relation load visible"
  },
  bannerHtml: reasoningBannerHtml,
  info: [
    { kind: "text", icon: "R", label: "Family", value: "Probe Gym", tone: "accent" },
    { kind: "text", label: "Modes", value: "Explanation + Next Check", tone: "positive" },
    { kind: "pill", text: "PAB tracks relation load", tone: "muted" },
    { kind: "credit", text: "Reasoning Credits" }
  ],
  coach: {
    label: "Coach",
    headline: "Probe Gym ready.",
    body: "Start Best Explanation or review the locked reasoning rails from the left tree."
  },
  coachHtml: reasoningCoachHtml,
  sidePanelClass: "reasoning-side-panel",
  sidePanelHtml: reasoningSidePanelHtml,
  taskHtml: `
    <div class="reasoning-runtime-shell">
      <div class="reasoning-task-root" data-reasoning-task-root></div>
    </div>
  `,
  responseHtml: `
    <div class="reasoning-response-root" data-reasoning-response-root></div>
  `,
  telemetryCards: reasoningTelemetry,
  mount: mountReasoningScreen
};
