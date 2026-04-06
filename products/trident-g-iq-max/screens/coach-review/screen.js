import { coachReviewTelemetry } from "../../content/telemetry-placeholders.js";

export const coachReviewScreen = {
  id: "coach-review",
  module: "coach-review",
  banner: {
    title: "Coach Review",
    subtitle: "Route synthesis and next-step guidance",
    subcopy: "Short, directive, and state-aware",
    stage: "Today",
    stageMeta: "review pass"
  },
  info: [
    { kind: "text", icon: "C", text: "Coach review" },
    { kind: "pill", text: "Recommendation ready", tone: "positive" },
    { kind: "text", text: "Capacity first, reasoning second" },
    { kind: "credit", text: "TG Credit +10" }
  ],
  coach: {
    label: "Coach",
    headline: "Keep the recommendation concise.",
    body: "This layer should route the player, not bury them in explanations.",
    detail: "Use it to synthesize Zone, Tests, Capacity, Reasoning, and Missions into one next action."
  },
  taskHtml: `
    <div class="task-shell">
      <div class="task-kicker">Review synthesis</div>
      <div class="placeholder-grid">
        <div class="placeholder-panel">
          <div class="placeholder-panel__eyebrow">State</div>
          <div class="placeholder-panel__title">Zone cleared</div>
          <div class="placeholder-panel__copy">Full route remains open if load does not push the user out of band.</div>
        </div>
        <div class="placeholder-panel">
          <div class="placeholder-panel__eyebrow">Evidence</div>
          <div class="placeholder-panel__title">Tests optional</div>
          <div class="placeholder-panel__copy">Formal evidence stays available but does not need to dominate the day.</div>
        </div>
        <div class="placeholder-panel">
          <div class="placeholder-panel__eyebrow">Training</div>
          <div class="placeholder-panel__title">Capacity primary</div>
          <div class="placeholder-panel__copy">Use the counted training run while the route is open.</div>
        </div>
        <div class="placeholder-panel">
          <div class="placeholder-panel__eyebrow">Extension</div>
          <div class="placeholder-panel__title">Reasoning second</div>
          <div class="placeholder-panel__copy">Add reasoning or mission work only if stability holds after capacity load.</div>
        </div>
      </div>
    </div>
  `,
  responseHtml: `
    <div class="response-stack">
      <div class="response-buttons">
        <button class="response-button is-confirmed" type="button" data-go="capacity">
          <span class="button-title">Open Capacity</span>
          <span class="button-subtitle">Follow the current recommendation</span>
        </button>
        <button class="response-button" type="button" data-go="hub">
          <span class="button-title">Return to Hub</span>
          <span class="button-subtitle">Go back to the launch surface</span>
        </button>
      </div>
    </div>
  `,
  telemetryCards: coachReviewTelemetry
};
