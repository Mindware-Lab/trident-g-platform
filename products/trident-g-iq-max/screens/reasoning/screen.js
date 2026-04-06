import { reasoningTelemetry } from "../../content/telemetry-placeholders.js";

export const reasoningScreen = {
  id: "reasoning",
  module: "reasoning",
  banner: {
    title: "Reasoning Gym",
    subtitle: "Relational and symbolic workbench",
    subcopy: "Extended route layer",
    stage: "L2",
    stageMeta: "lane active"
  },
  info: [
    { kind: "text", icon: "R", text: "Reasoning mode" },
    { kind: "pill", text: "Lane unlocked", tone: "positive" },
    { kind: "text", text: "Relational transforms" },
    { kind: "credit", text: "TG Credit +25" }
  ],
  coach: {
    label: "Coach",
    headline: "Work the reasoning layer.",
    body: "Keep the frame identical while the content shifts to structured relational challenge.",
    detail: "This screen is a placeholder shell for the later reasoning gym, not the final mechanic specification."
  },
  taskHtml: `
    <div class="task-shell">
      <div class="task-kicker">Reasoning lanes</div>
      <div class="placeholder-grid">
        <div class="placeholder-panel">
          <div class="placeholder-panel__eyebrow">Lane A</div>
          <div class="placeholder-panel__title">Analogy Chain</div>
          <div class="placeholder-panel__copy">Map structured relationships and maintain rule continuity.</div>
        </div>
        <div class="placeholder-panel">
          <div class="placeholder-panel__eyebrow">Lane B</div>
          <div class="placeholder-panel__title">Transform Stack</div>
          <div class="placeholder-panel__copy">Hold successive transforms while wrapper pressure increases.</div>
        </div>
        <div class="placeholder-panel">
          <div class="placeholder-panel__eyebrow">Lane C</div>
          <div class="placeholder-panel__title">Symbol Compression</div>
          <div class="placeholder-panel__copy">Reduce complexity without losing the governing relation.</div>
        </div>
        <div class="placeholder-panel">
          <div class="placeholder-panel__eyebrow">Lane D</div>
          <div class="placeholder-panel__title">Chain Repair</div>
          <div class="placeholder-panel__copy">Repair broken inference paths and keep the structure coherent.</div>
        </div>
      </div>
    </div>
  `,
  responseHtml: `
    <div class="response-stack">
      <div class="response-buttons">
        <button class="response-button is-primary" type="button" data-go="missions">
          <span class="button-title">Open Missions</span>
          <span class="button-subtitle">Wrap reasoning into a mission context</span>
        </button>
        <button class="response-button" type="button" data-go="progress">
          <span class="button-title">Open Progress</span>
          <span class="button-subtitle">Review route carry-over and trend</span>
        </button>
      </div>
    </div>
  `,
  telemetryCards: reasoningTelemetry
};
