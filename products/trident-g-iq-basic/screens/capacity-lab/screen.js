import { capacityLabTelemetrySeed, mountCapacityLab } from "../../runtime/capacity/xor-sandbox.js";

const capacityLabSidePanelHtml = `
  <div class="capacity-route capacity-route--lab">
    <div class="capacity-route-title">XOR<span>LAB</span></div>
    <div class="capacity-lab-route-note">
      Public sandbox route for early wrapper testing. Scores stay local to this browser and do not set official progression or far-transfer evidence.
    </div>
    <div class="capacity-lab-route-stack">
      <div class="capacity-lab-route-card is-active">
        <span>XOR categorical</span>
        <span>Live</span>
      </div>
      <div class="capacity-lab-route-card is-active">
        <span>XOR non-categorical</span>
        <span>Live</span>
      </div>
      <div class="capacity-lab-route-card">
        <span>Targets</span>
        <span>◎ / ◐ / ✦</span>
      </div>
    </div>
    <div class="capacity-route-key">
      <div class="capacity-route-key-item">
        <span class="capacity-route-key-swatch capacity-route-key-swatch--active" aria-hidden="true"></span>
        <span class="capacity-route-key-label">Live in sandbox</span>
      </div>
      <div class="capacity-route-key-item">
        <span class="capacity-route-key-swatch capacity-route-key-swatch--locked" aria-hidden="true"></span>
        <span class="capacity-route-key-label">Still mocked</span>
      </div>
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
      <span class="capacity-banner-chip" data-capacity-lab-modality>◎</span>
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
    <div class="coach-label">Sandbox</div>
    <div class="capacity-coach-panel">
      <div class="capacity-coach-line is-active" data-capacity-lab-coach>
        Use this route to play XOR categorical and non-categorical blocks inside the new capacity shell without advancing the official progression engine.
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
    subtitle: "XOR hub wrappers in the new shell",
    subcopy: "Local scoring only",
    stage: "Sandbox",
    stageMeta: "public tester route"
  },
  bannerHtml: capacityLabBannerHtml,
  info: [
    { kind: "text", icon: "C", label: "Mode", value: "Sandbox", tone: "positive" },
    { kind: "text", label: "Scope", value: "XOR only", tone: "accent" },
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
