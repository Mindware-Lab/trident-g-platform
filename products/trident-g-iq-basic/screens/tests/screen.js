import { testsTelemetry } from "../../content/telemetry-placeholders.js";
import { mountTestsScreen } from "../../runtime/tests/mount.js";

const testsSidePanelHtml = `
  <div class="tests-tree-panel" data-tests-tree-panel></div>
`;

const testsBannerHtml = `
  <div class="tests-banner-shell">
    <div class="banner-left">
      <h1 class="banner-title" id="banner-title">Tests</h1>
      <span class="banner-subtitle" data-tests-banner-subtitle>Evidence route</span>
      <span class="banner-subcopy" data-tests-banner-subcopy>Four-family assessment battery</span>
    </div>
    <div class="banner-right">
      <div class="banner-stage" data-tests-banner-stage>Ready</div>
      <span class="banner-stage-meta" data-tests-banner-meta>fluid + applied + decision + resilience</span>
      <span class="tests-banner-track" data-tests-banner-track>Use the left tree to choose the active test. The centre panel only shows the current test.</span>
    </div>
  </div>
`;

const testsCoachHtml = `
  <div class="capacity-coach-shell">
    <div class="coach-label">Coach</div>
    <div class="capacity-coach-panel">
      <div class="capacity-coach-line is-active">
        <strong data-tests-coach-headline>Evidence route ready.</strong>
        <span data-tests-coach-body>Start the opening baseline or continue from the next recommended test.</span>
      </div>
    </div>
  </div>
`;

export const testsScreen = {
  id: "tests",
  module: "tests",
  banner: {
    title: "Tests",
    subtitle: "Evidence route",
    subcopy: "Four-family assessment battery",
    stage: "Ready",
    stageMeta: "fluid + applied + decision + resilience"
  },
  bannerHtml: testsBannerHtml,
  info: [
    { kind: "text", icon: "T", label: "Bundle", value: "Fluid + Applied + Decision + Resilience", tone: "accent" },
    { kind: "text", label: "Mode", value: "Coach-guided", tone: "positive" },
    { kind: "pill", text: "Major transitions require explicit input", tone: "muted" },
    { kind: "credit", text: "TG Credit +20" }
  ],
  coach: {
    label: "Coach",
    headline: "Evidence route ready.",
    body: "Start the opening baseline or continue from the next recommended test."
  },
  coachHtml: testsCoachHtml,
  sidePanelClass: "tests-side-panel",
  sidePanelHtml: testsSidePanelHtml,
  taskHtml: `
    <div class="tests-runtime-shell">
      <div class="tests-task-root" data-tests-task-root></div>
    </div>
  `,
  responseHtml: `
    <div class="tests-response-root" data-tests-response-root></div>
  `,
  telemetryCards: testsTelemetry,
  mount: mountTestsScreen
};
