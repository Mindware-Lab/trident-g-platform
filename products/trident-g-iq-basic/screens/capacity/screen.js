import { capacityTelemetry } from "../../content/telemetry-placeholders.js";

export const capacityScreen = {
  id: "capacity",
  module: "capacity",
  banner: {
    title: "Capacity",
    subtitle: "XOR - Flexibility, selective attention, conceptual abstraction",
    subcopy: "Capacity Gym - next gate: hold this level after a wrapper swap",
    stage: "N-3",
    stageMeta: "block 6 of 10"
  },
  info: [
    { kind: "text", icon: "C", text: "Phase 1 - Encode" },
    { kind: "pill", text: "Today counts", tone: "positive" },
    { kind: "text", text: "0 of 1 core session used" },
    { kind: "credit", text: "TG Credit +30" }
  ],
  coach: {
    label: "Coach",
    headline: "Test carry-over next.",
    body: "Swap wrapper at this level."
  },
  taskHtml: `
    <div class="task-shell">
      <div class="task-kicker">Relational n-back board</div>
      <div class="nback-grid">
        <div class="nback-cell"></div>
        <div class="nback-cell is-lit"></div>
        <div class="nback-cell"></div>
        <div class="nback-cell"></div>
        <div class="nback-cell"></div>
        <div class="nback-cell"></div>
        <div class="nback-cell"></div>
        <div class="nback-cell"></div>
        <div class="nback-cell is-hit"></div>
      </div>
      <div class="stimulus-letter">K</div>
      <div class="task-caption">Hold position and wrapper rule across the board</div>
      <div class="capacity-progress">
        <span class="is-on"></span>
        <span class="is-on"></span>
        <span class="is-on"></span>
        <span class="is-on"></span>
        <span class="is-on"></span>
        <span class="is-on"></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `,
  responseHtml: `
    <div class="response-stack">
      <div class="response-hint">Response controls</div>
      <div class="response-buttons">
        <button class="response-button is-primary" type="button">
          <span class="button-title">Match position</span>
          <span class="button-subtitle">Spatial recall at N-3</span>
        </button>
        <button class="response-button is-confirmed" type="button">
          <span class="button-title">Match letter</span>
          <span class="button-subtitle">Correct action gets the lime pulse</span>
        </button>
      </div>
    </div>
  `,
  telemetryCards: capacityTelemetry
};
