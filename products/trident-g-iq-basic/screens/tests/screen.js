import { testsTelemetry } from "../../content/telemetry-placeholders.js";

export const testsScreen = {
  id: "tests",
  module: "tests",
  banner: {
    title: "Tests",
    subtitle: "SgS Fluid Reasoning - Baseline",
    subcopy: "Evidence mode",
    stage: "4/12",
    stageMeta: "item progress"
  },
  info: [
    { kind: "text", icon: "T", text: "Evidence mode" },
    { kind: "pill", text: "Testing allowed now", tone: "positive" },
    { kind: "text", text: "Psi-CBS 2 of 3" },
    { kind: "credit", text: "TG Credit +20" }
  ],
  coach: {
    label: "Coach",
    headline: "Baseline test.",
    body: "Focus on clean effort, not speed.",
    detail: "Choose the option that best completes the final cell. This screen stays measured and test-like, with the current item and clean response choices doing the visual work."
  },
  taskHtml: `
    <div class="task-shell">
      <div class="task-kicker">Fluid reasoning matrix - baseline</div>
      <div class="matrix-grid">
        <div class="matrix-cell">A1</div>
        <div class="matrix-cell is-highlight">B2</div>
        <div class="matrix-cell">C3</div>
        <div class="matrix-cell">A2</div>
        <div class="matrix-cell">B3</div>
        <div class="matrix-cell">C4</div>
        <div class="matrix-cell">A3</div>
        <div class="matrix-cell">B4</div>
        <div class="matrix-cell is-target">?</div>
      </div>
    </div>
  `,
  responseHtml: `
    <div class="response-stack">
      <div class="choice-grid">
        <button class="choice-card" type="button">
          <span class="choice-title">Option A</span>
          <span class="choice-subtitle">Mirror the outer rotation</span>
        </button>
        <button class="choice-card" type="button">
          <span class="choice-title">Option B</span>
          <span class="choice-subtitle">Preserve the row count shift</span>
        </button>
        <button class="choice-card" type="button">
          <span class="choice-title">Option C</span>
          <span class="choice-subtitle">Advance both rule tracks</span>
        </button>
        <button class="choice-card" type="button">
          <span class="choice-title">Option D</span>
          <span class="choice-subtitle">Hold one rule and invert the second</span>
        </button>
      </div>
    </div>
  `,
  telemetryCards: testsTelemetry
};
