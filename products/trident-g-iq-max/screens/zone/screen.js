import { zoneTelemetry } from "../../content/telemetry-placeholders.js";

export const zoneScreen = {
  id: "zone",
  module: "zone",
  banner: {
    title: "Zone",
    subtitle: "Majority Direction Probe - 30s",
    subcopy: "Zone Coach",
    stage: "Ready",
    stageMeta: "state classification"
  },
  info: [
    { kind: "text", icon: "Z", text: "Gating mode" },
    { kind: "text", text: "MDT-m check" },
    { kind: "pill", text: "Core session available", tone: "positive" },
    { kind: "credit", text: "TG Credit +10" }
  ],
  coach: {
    label: "Next step",
    headline: "Full route available.",
    body: "Today can count as a core session."
  },
  taskHtml: `
    <div class="task-shell">
      <div class="task-kicker">Majority direction probe</div>
      <div class="zone-probe">
        <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
        <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
        <div class="probe-tile"><span class="probe-arrow is-soft">&gt;</span></div>
        <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
        <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
        <div class="probe-tile"><span class="probe-arrow is-soft">&gt;</span></div>
        <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
        <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
        <div class="probe-tile"><span class="probe-arrow is-soft">&gt;</span></div>
        <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
      </div>
      <div class="task-copy">
        Mark the dominant direction under time pressure. The surface stays diagnostic and decisive, with state and routing doing the main work.
      </div>
      <div class="task-caption">Probe live state before load</div>
    </div>
  `,
  responseHtml: `
    <div class="response-stack">
      <div class="response-hint">Response controls</div>
      <div class="response-buttons">
        <button class="response-button is-primary is-confirmed" type="button">
          <span class="button-title">Left majority</span>
          <span class="button-subtitle">Current probe resolves left</span>
        </button>
        <button class="response-button is-risk" type="button">
          <span class="button-title">Right majority</span>
          <span class="button-subtitle">Use when the field tips right</span>
        </button>
      </div>
    </div>
  `,
  telemetryCards: zoneTelemetry
};
