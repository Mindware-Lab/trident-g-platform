import { basicHubCards } from "../../content/copy.js";
import { basicHubTelemetry } from "../../content/telemetry-placeholders.js";

const hubCardsHtml = basicHubCards.map((card) => `
  <div class="hub-card">
    <div class="hub-card__kicker">${card.kicker}</div>
    <div class="hub-card__title">${card.title}</div>
    <div class="hub-card__copy">${card.copy}</div>
  </div>
`).join("");

export const hubScreen = {
  id: "hub",
  module: "hub",
  banner: {
    title: "Hub",
    subtitle: "Daily route and launch surface",
    subcopy: "Focused active-play shell",
    stage: "4/4",
    stageMeta: "modules ready"
  },
  info: [
    { kind: "text", icon: "H", text: "Hub mode" },
    { kind: "pill", text: "Route ready", tone: "positive" },
    { kind: "text", text: "Choose today's module" },
    { kind: "credit", text: "TG Credit +0" }
  ],
  coach: {
    label: "Coach",
    headline: "Start from Zone.",
    body: "Then move into Tests or Capacity from the same frame.",
    detail: "This product keeps the route intentionally lean: Hub, Tests, Zone, and Capacity only."
  },
  taskHtml: `
    <div class="task-shell">
      <div class="task-kicker">Core active-play route</div>
      <div class="hub-grid">${hubCardsHtml}</div>
    </div>
  `,
  responseHtml: `
    <div class="response-stack">
      <div class="response-buttons">
        <button class="response-button is-primary" type="button" data-go="zone">
          <span class="button-title">Open Zone</span>
          <span class="button-subtitle">Clear today's state first</span>
        </button>
        <button class="response-button" type="button" data-go="tests">
          <span class="button-title">Open Tests</span>
          <span class="button-subtitle">Run evidence mode inside this shell</span>
        </button>
      </div>
      <div class="response-buttons">
        <button class="response-button is-confirmed" type="button" data-go="capacity">
          <span class="button-title">Open Capacity</span>
          <span class="button-subtitle">Launch the active training surface</span>
        </button>
        <button class="response-button" type="button" data-go="hub">
          <span class="button-title">Stay on Hub</span>
          <span class="button-subtitle">Review route and telemetry</span>
        </button>
      </div>
    </div>
  `,
  telemetryCards: basicHubTelemetry
};
