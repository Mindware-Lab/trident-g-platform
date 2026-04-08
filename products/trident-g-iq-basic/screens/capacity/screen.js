import { capacityTelemetry } from "../../content/telemetry-placeholders.js";

export const capacityScreen = {
  id: "capacity",
  module: "capacity",
  banner: {
    title: "Capacity",
    subtitle: "Relational - relational integration, fluid reasoning",
    subcopy: "Capacity Gym - numbers variant live. Next gate: hold this rule after a wrapper swap",
    stage: "N-3",
    stageMeta: "numbers variant"
  },
  info: [
    { kind: "text", icon: "C", text: "10 session - targeted" },
    { kind: "pill", text: "Today counts", tone: "positive" },
    { kind: "text", text: "0 of 1 targeted session used" },
    { kind: "credit", text: "TG Credit +30" }
  ],
  coach: {
    label: "Coach",
    headline: "Hold the numbers rule next.",
    body: "Keep relational matches clean after the wrapper swap."
  },
  taskHtml: `
    <div class="task-shell task-shell--capacity">
      <div class="capacity-stage">
        <div class="capacity-route">
          <div class="capacity-route-kicker">Family route</div>
          <div class="capacity-route-stack">
            <div class="capacity-family capacity-family--xor">
              <div class="capacity-family-order">1</div>
              <div class="capacity-family-body">
                <div class="capacity-family-head">
                  <span class="capacity-family-chip">XOR</span>
                  <span class="capacity-family-status">Open</span>
                </div>
                <div class="capacity-family-variants">
                  <span class="capacity-variant capacity-variant--a is-on">Cat</span>
                  <span class="capacity-variant capacity-variant--b is-on">Remap</span>
                  <span class="capacity-variant capacity-variant--c is-on">Concept</span>
                </div>
              </div>
            </div>
            <div class="capacity-family capacity-family--and">
              <div class="capacity-family-order">2</div>
              <div class="capacity-family-body">
                <div class="capacity-family-head">
                  <span class="capacity-family-chip">AND</span>
                  <span class="capacity-family-status">Open</span>
                </div>
                <div class="capacity-family-variants">
                  <span class="capacity-variant capacity-variant--a is-on">Cat</span>
                  <span class="capacity-variant capacity-variant--b is-on">Remap</span>
                </div>
              </div>
            </div>
            <div class="capacity-family capacity-family--interference">
              <div class="capacity-family-order">3</div>
              <div class="capacity-family-body">
                <div class="capacity-family-head">
                  <span class="capacity-family-chip">Interference</span>
                  <span class="capacity-family-status">Open</span>
                </div>
                <div class="capacity-family-variants">
                  <span class="capacity-variant capacity-variant--a is-on">Arrow</span>
                  <span class="capacity-variant capacity-variant--b is-on">Stroop</span>
                  <span class="capacity-variant capacity-variant--c">Concept</span>
                </div>
              </div>
            </div>
            <div class="capacity-family capacity-family--emotional is-locked">
              <div class="capacity-family-order">4</div>
              <div class="capacity-family-body">
                <div class="capacity-family-head">
                  <span class="capacity-family-chip">Emotional</span>
                  <span class="capacity-family-status">Locked</span>
                </div>
                <div class="capacity-family-variants">
                  <span class="capacity-variant capacity-variant--a is-locked">Visual</span>
                  <span class="capacity-variant capacity-variant--b is-locked">Verbal</span>
                </div>
              </div>
            </div>
            <div class="capacity-family capacity-family--relational is-active">
              <div class="capacity-family-order">5</div>
              <div class="capacity-family-body">
                <div class="capacity-family-head">
                  <span class="capacity-family-chip">Relational</span>
                  <span class="capacity-family-status">Live</span>
                </div>
                <div class="capacity-family-variants">
                  <span class="capacity-variant capacity-variant--a is-on">Direction</span>
                  <span class="capacity-variant capacity-variant--b is-on">Angles</span>
                  <span class="capacity-variant capacity-variant--c is-active">Numbers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="capacity-preview">
          <div class="capacity-preview-kicker">Numbers n-back</div>
          <div class="capacity-phone">
            <div class="capacity-phone-head">Game: Relational</div>
            <div class="capacity-phone-board">
              <span class="capacity-phone-node capacity-phone-node--1"></span>
              <span class="capacity-phone-node capacity-phone-node--2"></span>
              <span class="capacity-phone-node capacity-phone-node--3"></span>
              <span class="capacity-phone-node capacity-phone-node--4"></span>
              <span class="capacity-phone-node capacity-phone-node--5"></span>
              <span class="capacity-phone-node capacity-phone-node--6"></span>
              <div class="capacity-phone-token capacity-phone-token--t1">
                <span class="capacity-phone-token-tag">t1</span>
                <span class="capacity-phone-token-value">3</span>
              </div>
              <div class="capacity-phone-token capacity-phone-token--t2">
                <span class="capacity-phone-token-tag">t2</span>
                <span class="capacity-phone-token-value">3</span>
              </div>
            </div>
            <button class="capacity-phone-action" type="button">Match</button>
          </div>
        </div>
      </div>
    </div>
  `,
  responseHtml: ``,
  telemetryCards: capacityTelemetry
};
