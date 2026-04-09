import { capacityLabTelemetrySeed, mountCapacityLab } from "../../runtime/capacity/xor-sandbox.js";

const capacityLabSidePanelHtml = `
  <div class="capacity-games-panel">
    <div class="capacity-games-title">Games</div>
    <div class="capacity-games-tree">
      <div class="capacity-games-family is-active">
        <div class="capacity-games-family-row">
          <span class="capacity-games-family-name">XOR</span>
          <span class="capacity-games-family-dot is-active" aria-hidden="true"></span>
        </div>
        <div class="capacity-games-variants">
          <div class="capacity-games-variant is-active"><span class="capacity-games-variant-dot is-active"></span><span>Cat</span></div>
          <div class="capacity-games-variant is-active"><span class="capacity-games-variant-dot is-active"></span><span>Remap</span></div>
          <div class="capacity-games-variant is-active"><span class="capacity-games-variant-dot is-active"></span><span>Concept</span></div>
        </div>
      </div>
      <div class="capacity-games-family is-active">
        <div class="capacity-games-family-row">
          <span class="capacity-games-family-name">AND</span>
          <span class="capacity-games-family-dot is-active" aria-hidden="true"></span>
        </div>
        <div class="capacity-games-variants">
          <div class="capacity-games-variant is-active"><span class="capacity-games-variant-dot is-active"></span><span>Cat</span></div>
          <div class="capacity-games-variant is-active"><span class="capacity-games-variant-dot is-active"></span><span>Remap</span></div>
        </div>
      </div>
      <div class="capacity-games-family is-locked">
        <div class="capacity-games-family-row">
          <span class="capacity-games-family-name">Interference</span>
          <span class="capacity-games-family-dot" aria-hidden="true"></span>
        </div>
        <div class="capacity-games-variants">
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Arrow</span></div>
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Stroop</span></div>
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Concept</span></div>
        </div>
      </div>
      <div class="capacity-games-family is-locked">
        <div class="capacity-games-family-row">
          <span class="capacity-games-family-name">Emotional</span>
          <span class="capacity-games-family-dot" aria-hidden="true"></span>
        </div>
        <div class="capacity-games-variants">
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Visual</span></div>
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Verbal</span></div>
        </div>
      </div>
      <div class="capacity-games-family is-locked">
        <div class="capacity-games-family-row">
          <span class="capacity-games-family-name">Relational</span>
          <span class="capacity-games-family-dot" aria-hidden="true"></span>
        </div>
        <div class="capacity-games-variants">
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Direction</span></div>
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Angles</span></div>
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Numbers</span></div>
        </div>
      </div>
    </div>
    <div class="capacity-games-legend">
      <div><span class="capacity-games-legend-dot is-active"></span>Unlocked</div>
      <div><span class="capacity-games-legend-dot"></span>Locked</div>
      <div><span class="capacity-games-legend-dot is-current"></span>Active</div>
    </div>
    <button class="capacity-lab-side-action" type="button" data-go="capacity">Back to preview</button>
  </div>
`;

const capacityLabBannerHtml = `
  <div class="capacity-banner-shell">
    <h1 class="capacity-banner-a11y-title" id="banner-title">Capacity Sandbox</h1>
    <span class="capacity-banner-track" data-capacity-lab-track>Public sandbox</span>
    <span class="capacity-banner-divider" aria-hidden="true"></span>
    <div class="capacity-banner-chip-row" aria-label="Current sandbox context">
      <span class="capacity-banner-chip capacity-banner-chip--level" data-capacity-lab-status>Ready</span>
      <span class="capacity-banner-chip" data-capacity-lab-wrapper>Categorical</span>
      <span class="capacity-banner-chip" data-capacity-lab-modality>◯</span>
      <span class="capacity-banner-chip capacity-banner-chip--speed" data-capacity-lab-speed>Slow pace</span>
    </div>
    <div class="capacity-banner-credit" aria-label="Logged local runs">
      <span class="capacity-banner-credit-label">Runs logged</span>
      <span class="capacity-banner-credit-badge" data-capacity-lab-runs>0</span>
    </div>
  </div>
`;

const capacityLabCoachHtml = `
  <div class="capacity-coach-shell">
    <div class="coach-label">Coach tip</div>
    <div class="capacity-coach-panel">
      <div class="capacity-coach-line is-active" data-capacity-lab-coach>
        Use this route to play XOR and AND blocks inside the new capacity shell without advancing the official progression engine.
      </div>
    </div>
  </div>
`;

export const capacityLabScreen = {
  id: "capacity-lab",
  navActiveId: "capacity",
  module: "capacity",
  banner: {
    title: "Capacity Sandbox",
    subtitle: "XOR + AND hub wrappers in the new shell",
    subcopy: "Local scoring only",
    stage: "Sandbox",
    stageMeta: "public tester route"
  },
  bannerHtml: capacityLabBannerHtml,
  info: [
    { kind: "text", icon: "C", label: "Mode", value: "Sandbox", tone: "positive" },
    { kind: "text", label: "Scope", value: "XOR + AND", tone: "accent" },
    { kind: "text", label: "Storage", value: "Local browser", tone: "credit" }
  ],
  coach: {
    label: "Sandbox",
    headline: "XOR pull-over live.",
    body: "Basic scoring only."
  },
  coachHtml: capacityLabCoachHtml,
  sidePanelClass: "capacity-side-panel",
  sidePanelHtml: capacityLabSidePanelHtml,
  taskHtml: `<div class="capacity-lab-root" data-capacity-lab-root></div>`,
  responseHtml: ``,
  telemetryCards: capacityLabTelemetrySeed,
  mount: mountCapacityLab
};
