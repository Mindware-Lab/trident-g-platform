import { capacityLabTelemetrySeed, mountCapacityLab } from "../../runtime/capacity/xor-sandbox.js";

const capacityLabSidePanelHtml = `
  <div class="capacity-games-panel">
    <div class="capacity-games-title">Capacity</div>
    <div class="capacity-games-title">Games</div>
    <div class="capacity-games-tree">
      <div class="capacity-games-family is-active">
        <div class="capacity-games-family-row">
          <span class="capacity-games-family-name">Flex</span>
          <span class="capacity-games-family-dot is-active" aria-hidden="true"></span>
        </div>
        <div class="capacity-games-variants">
          <div class="capacity-games-variant is-active"><span class="capacity-games-variant-dot is-active"></span><span>Known</span></div>
          <div class="capacity-games-variant is-active"><span class="capacity-games-variant-dot is-active"></span><span>Unknown</span></div>
          <div class="capacity-games-variant is-active"><span class="capacity-games-variant-dot is-active"></span><span>Concept</span></div>
        </div>
      </div>
      <div class="capacity-games-family is-active">
        <div class="capacity-games-family-row">
          <span class="capacity-games-family-name">Bind</span>
          <span class="capacity-games-family-dot is-active" aria-hidden="true"></span>
        </div>
        <div class="capacity-games-variants">
          <div class="capacity-games-variant is-active"><span class="capacity-games-variant-dot is-active"></span><span>Known</span></div>
          <div class="capacity-games-variant is-active"><span class="capacity-games-variant-dot is-active"></span><span>Unknown</span></div>
        </div>
      </div>
      <div class="capacity-games-family is-locked">
        <div class="capacity-games-family-row">
          <span class="capacity-games-family-name">Resist</span>
          <span class="capacity-games-family-dot" aria-hidden="true"></span>
        </div>
        <div class="capacity-games-variants">
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Vectors</span></div>
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Words</span></div>
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Concept</span></div>
        </div>
      </div>
      <div class="capacity-games-family is-locked">
        <div class="capacity-games-family-row">
          <span class="capacity-games-family-name">Emotion</span>
          <span class="capacity-games-family-dot" aria-hidden="true"></span>
        </div>
        <div class="capacity-games-variants">
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Faces</span></div>
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Words</span></div>
        </div>
      </div>
      <div class="capacity-games-family is-locked">
        <div class="capacity-games-family-row">
          <span class="capacity-games-family-name">Relate</span>
          <span class="capacity-games-family-dot" aria-hidden="true"></span>
        </div>
        <div class="capacity-games-variants">
          <div class="capacity-games-variant"><span class="capacity-games-variant-dot"></span><span>Vectors</span></div>
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
  </div>
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
        Use this route to play Flex and Bind blocks inside the new capacity shell without advancing the official progression engine.
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
    subtitle: "Flex + Bind wrappers in the new shell",
    subcopy: "Local scoring only",
    stage: "Sandbox",
    stageMeta: "public tester route"
  },
  bannerHtml: capacityLabBannerHtml,
  info: [
    { kind: "text", icon: "C", label: "Mode", value: "Sandbox", tone: "positive" },
    { kind: "text", label: "Scope", value: "Flex + Bind", tone: "accent" },
    { kind: "text", label: "Storage", value: "Local browser", tone: "credit" }
  ],
  coach: {
    label: "Sandbox",
    headline: "Flex pull-over live.",
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
