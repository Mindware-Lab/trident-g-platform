import { progressTelemetry } from "../../content/telemetry-placeholders.js";

export const progressScreen = {
  id: "progress",
  module: "progress",
  banner: {
    title: "Progress",
    subtitle: "Route carry-over and progression readout",
    subcopy: "Cross-module overview",
    stage: "Week 3",
    stageMeta: "current frame"
  },
  info: [
    { kind: "text", icon: "P", text: "Progress view" },
    { kind: "pill", text: "Weekly route stable", tone: "positive" },
    { kind: "text", text: "4 modules active" },
    { kind: "credit", text: "TG Credit +15" }
  ],
  coach: {
    label: "Coach",
    headline: "Read the route, not just the score.",
    body: "Progress should summarize state, carry-over, and unlocks without becoming another dashboard.",
    detail: "This placeholder view shows the intended role of Progress inside the larger product."
  },
  taskHtml: `
    <div class="task-shell">
      <div class="task-kicker">Progress summary</div>
      <div class="placeholder-grid">
        <div class="placeholder-panel">
          <div class="placeholder-panel__eyebrow">Zone</div>
          <div class="placeholder-panel__title">Readiness trend</div>
          <div class="placeholder-panel__copy">Show route eligibility and in-zone consistency over time.</div>
        </div>
        <div class="placeholder-panel">
          <div class="placeholder-panel__eyebrow">Capacity</div>
          <div class="placeholder-panel__title">Stable level</div>
          <div class="placeholder-panel__copy">Track hold confirmations, speed confirmations, and wrapper carry-over.</div>
        </div>
        <div class="placeholder-panel">
          <div class="placeholder-panel__eyebrow">Reasoning</div>
          <div class="placeholder-panel__title">Lane unlocks</div>
          <div class="placeholder-panel__copy">Summarize which reasoning lanes are open, stabilized, or due next.</div>
        </div>
        <div class="placeholder-panel">
          <div class="placeholder-panel__eyebrow">Missions</div>
          <div class="placeholder-panel__title">Mission arc</div>
          <div class="placeholder-panel__copy">Make the broader route legible without cluttering active play.</div>
        </div>
      </div>
    </div>
  `,
  responseHtml: `
    <div class="response-stack">
      <div class="response-buttons">
        <button class="response-button is-primary" type="button" data-go="coach-review">
          <span class="button-title">Open Coach Review</span>
          <span class="button-subtitle">Turn summary into next-step guidance</span>
        </button>
        <button class="response-button" type="button" data-go="hub">
          <span class="button-title">Return to Hub</span>
          <span class="button-subtitle">Go back to the main route surface</span>
        </button>
      </div>
    </div>
  `,
  telemetryCards: progressTelemetry
};
