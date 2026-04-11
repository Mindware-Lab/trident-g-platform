import { capacityLabTelemetrySeed, mountCapacityLab } from "../../runtime/capacity/xor-sandbox.js";

const capacityLabSidePanelHtml = `
  <div class="capacity-games-panel" data-capacity-games-panel></div>
`;

const capacityLabBannerHtml = `
  <div class="capacity-banner-shell">
    <h1 class="capacity-banner-a11y-title" id="banner-title">Capacity Sandbox</h1>
    <span class="capacity-banner-track" data-capacity-lab-track>Public sandbox</span>
    <span class="capacity-banner-divider" aria-hidden="true"></span>
    <div class="capacity-banner-chip-row" aria-label="Current sandbox context">
      <span class="capacity-banner-chip capacity-banner-chip--level" data-capacity-lab-status>Ready</span>
      <span class="capacity-banner-chip" data-capacity-lab-wrapper>Flex known</span>
      <span class="capacity-banner-chip" data-capacity-lab-modality>◯</span>
      <span class="capacity-banner-chip capacity-banner-chip--speed" data-capacity-lab-speed>Slow pace</span>
    </div>
    <div class="capacity-banner-credit" aria-label="Sound toggle">
      <button class="capacity-banner-sfx" type="button" data-capacity-lab-sfx>Sound on</button>
    </div>
  </div>
`;

const capacityLabCoachHtml = `
  <div class="capacity-coach-shell">
    <div class="coach-label">Coach tip</div>
    <div class="capacity-coach-panel">
      <div class="capacity-coach-line is-active" data-capacity-lab-coach>
        Use this route to play Flex, Bind, Resist, Emotion, and the live Relate mono and dual blocks inside the new capacity shell without advancing the official progression engine.
      </div>
    </div>
  </div>
`;

export const capacityLabScreen = {
  id: "capacity",
  navActiveId: "capacity",
  module: "capacity",
  banner: {
    title: "Capacity Sandbox",
    subtitle: "Flex, Bind, Resist, and live Relate wrappers in the new shell",
    subcopy: "Local scoring only; Relate vectors and numbers mono plus dual blocks now live",
    stage: "Sandbox",
    stageMeta: "public tester route"
  },
  bannerHtml: capacityLabBannerHtml,
  info: [
    { kind: "text", icon: "C", label: "Mode", value: "Sandbox", tone: "positive" },
    { kind: "text", label: "Scope", value: "Flex + Bind + Resist + Relate", tone: "accent" },
    { kind: "text", label: "Storage", value: "Local browser", tone: "credit" }
  ],
  coach: {
    label: "Sandbox",
    headline: "Flex, Bind, Resist, full Relate set live.",
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
