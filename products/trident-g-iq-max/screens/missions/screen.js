import { missionBriefs } from "../../content/mission-copy.js";
import { missionsTelemetry } from "../../content/telemetry-placeholders.js";

const missionCardsHtml = missionBriefs.map((mission) => `
  <div class="placeholder-panel">
    <div class="placeholder-panel__eyebrow">${mission.kicker}</div>
    <div class="placeholder-panel__title">${mission.title}</div>
    <div class="placeholder-panel__copy">${mission.copy}</div>
  </div>
`).join("");

export const missionsScreen = {
  id: "missions",
  module: "missions",
  banner: {
    title: "Missions",
    subtitle: "Wrapper, pressure, and route contexts",
    subcopy: "Full-game layer",
    stage: "2/6",
    stageMeta: "tiers staged"
  },
  info: [
    { kind: "text", icon: "M", text: "Mission mode" },
    { kind: "pill", text: "Two missions ready", tone: "positive" },
    { kind: "text", text: "Tier 1 ladder" },
    { kind: "credit", text: "TG Credit +40" }
  ],
  coach: {
    label: "Coach",
    headline: "Choose the wrapper carefully.",
    body: "Missions should feel like the same machine under more consequential constraints.",
    detail: "This remains a mock-up. Actual game logic and unlock rules come later."
  },
  taskHtml: `
    <div class="task-shell">
      <div class="task-kicker">Mission ladder</div>
      <div class="placeholder-grid">${missionCardsHtml}</div>
    </div>
  `,
  responseHtml: `
    <div class="response-stack">
      <div class="response-buttons">
        <button class="response-button is-primary" type="button" data-go="coach-review">
          <span class="button-title">Coach Review</span>
          <span class="button-subtitle">See the synthesized route recommendation</span>
        </button>
        <button class="response-button" type="button" data-go="reasoning">
          <span class="button-title">Back to Reasoning</span>
          <span class="button-subtitle">Return to the reasoning gym shell</span>
        </button>
      </div>
    </div>
  `,
  telemetryCards: missionsTelemetry
};
