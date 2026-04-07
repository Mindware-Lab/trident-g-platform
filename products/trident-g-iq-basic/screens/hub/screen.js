const coreSegments = [
  1, 0, 1, 1, 0,
  1, 0, 0, 1, 1,
  0, 1, 0, 1, 1,
  0, 0, 1, 0, 1
].map((isTrained) => {
  const activeClass = isTrained ? " is-trained" : "";
  return `<span class="hub-progress-segment${activeClass}"></span>`;
}).join("");

const renderProgrammeMeter = (card) => {
  if (card.meterType === "segments") {
    const segmentCount = card.segmentCount ?? 10;
    const densityClass = segmentCount > 10 ? " hub-programme-segments--dense" : "";
    const segments = Array.from({ length: segmentCount }, (_, index) => {
      const activeClass = index < card.segmentsOn ? " is-on" : "";
      return `<span class="hub-programme-segment${activeClass}"></span>`;
    }).join("");

    return `<div class="hub-programme-segments${densityClass}">${segments}</div>`;
  }

  return `
    <div class="hub-programme-meter">
      <span class="hub-programme-meter-fill hub-programme-meter-fill--${card.statusTone}" style="width: ${card.meter}%;"></span>
    </div>
  `;
};

const programmeCards = [
  {
    cardTone: "active",
    statusTone: "complete",
    stage: "20",
    title: "Baseline Rewire",
    status: "Complete",
    meterType: "segments",
    segmentCount: 20,
    segmentsOn: 20
  },
  {
    cardTone: "active",
    statusTone: "active",
    stage: "10",
    title: "Targeted Rewire",
    status: "Active",
    meterType: "segments",
    segmentsOn: 3
  },
  {
    cardTone: "locked",
    statusTone: "select",
    stage: "3",
    title: "Sprint",
    status: "Select",
    meterType: "segments",
    segmentsOn: 1
  }
].map((card) => `
  <article class="hub-programme-card hub-programme-card--${card.cardTone}">
    <div class="hub-programme-head">
      <div class="hub-programme-stage">${card.stage}</div>
      <span class="hub-programme-status hub-programme-status--${card.statusTone}">${card.status}</span>
    </div>
    <div class="hub-programme-title">${card.title}</div>
    ${renderProgrammeMeter(card)}
  </article>
`).join("");

const skillBars = [
  { label: "Flexibility", value: 72, tone: "capacity" },
  { label: "Binding", value: 48, tone: "tests" },
  { label: "Conflict control", value: 61, tone: "zone" },
  { label: "Affective control", value: 28, tone: "muted" },
  { label: "Relational reasoning", value: 34, tone: "muted" }
].map((bar) => `
  <div class="hub-skill-row">
    <span class="hub-skill-label">${bar.label}</span>
    <div class="hub-skill-track">
      <span class="hub-skill-fill hub-skill-fill--${bar.tone}" style="width: ${bar.value}%;"></span>
    </div>
  </div>
`).join("");

const zoneDots = ["ready", "ready", "flat", "ready", "ready", "spun", "ready"].map((tone) => `
  <span class="hub-state-dot hub-state-dot--${tone}"></span>
`).join("");

const zoneLegend = [
  { tone: "ready", label: "In the zone" },
  { tone: "flat", label: "Flat" },
  { tone: "spun", label: "Spun out" },
  { tone: "locked", label: "Locked in" }
].map((item) => `
  <span class="hub-state-key">
    <span class="hub-state-key-dot hub-state-dot--${item.tone}"></span>
    <span>${item.label}</span>
  </span>
`).join("");

const appliedIntelligenceRows = [
  { label: "Applied G", before: 58, after: 66, points: "4,26 24,25 44,23 64,22 84,19 104,17 124,16 144,14" },
  { label: "Resilience", before: 61, after: 70, points: "4,27 24,26 44,24 64,22 84,21 104,18 124,16 144,13" },
  { label: "AI-IQ", before: 56, after: 68, points: "4,28 24,27 44,25 64,24 84,20 104,18 124,15 144,12" }
].map((row) => `
  <div class="hub-ai-row">
    <div class="hub-ai-head">
      <span class="hub-ai-label">${row.label}</span>
      <span class="hub-ai-values">${row.before} -> ${row.after}</span>
    </div>
    <svg class="hub-ai-spark" viewBox="0 0 148 32" preserveAspectRatio="none" aria-hidden="true">
      <polyline fill="none" stroke="currentColor" stroke-width="2.5" points="${row.points}"></polyline>
    </svg>
  </div>
`).join("");

const psychometricBars = `
  <span class="hub-iq-bar hub-iq-bar--before" style="height: 50%;"></span>
  <span class="hub-iq-bar hub-iq-bar--after" style="height: 87.5%;"></span>
`;

export const hubScreen = {
  id: "hub",
  module: "hub",
  layout: "dashboard",
  banner: {
    title: "Hub",
    subtitle: "",
    subcopy: "",
    stage: "",
    stageMeta: ""
  },
  dashboardHtml: `
    <div class="hub-dashboard">
      <div class="hub-top-grid">
        <section class="hub-panel hub-panel--mission frame-corners">
          <div class="hub-panel-head">
            <span class="hub-panel-kicker">What to do today</span>
          </div>
          <div class="hub-mission-layout">
            <div class="hub-mission-main">
              <div class="hub-mission-title">Recommended mission.</div>
              <div class="hub-mission-flow" aria-label="Recommended mission flow">
                <span class="hub-mission-step hub-mission-step--tests">Take Psi-CBS Test</span>
                <span class="hub-mission-arrow" aria-hidden="true">></span>
                <span class="hub-mission-step hub-mission-step--zone">Assess Zone</span>
                <span class="hub-mission-arrow" aria-hidden="true">></span>
                <span class="hub-mission-step hub-mission-step--capacity">Train Emotional N-Back</span>
              </div>
              <div class="hub-mission-instruction">Click on the mission elements to access the tasks</div>
            </div>
            <div class="hub-core-visual">
              <div class="hub-core-kicker">Training rate</div>
              <div class="hub-ring" style="--hub-ring-value: 40;">
                <div class="hub-ring-inner">
                  <span class="hub-ring-number">40%</span>
                  <span class="hub-ring-label">Efficiency</span>
                </div>
              </div>
              <div class="hub-progress-track" aria-hidden="true">${coreSegments}</div>
            </div>
          </div>
          <div class="hub-programme-grid">
            ${programmeCards}
          </div>
        </section>

        <aside class="hub-panel hub-panel--wallet">
          <div class="hub-panel-head">
            <span class="hub-panel-kicker">Wallet</span>
            <span class="hub-panel-badge">Rewards</span>
          </div>
          <div class="hub-wallet-body">
            <img class="hub-wallet-coins" src="./assets/hub/currency-coins.png" alt="Trident and G coin artwork">
            <div class="hub-wallet-stats">
              <div class="hub-wallet-stat hub-wallet-stat--g">
                <span class="hub-wallet-value">3.8 G</span>
                <span class="hub-wallet-label">Wallet balance</span>
              </div>
              <div class="hub-wallet-stat hub-wallet-stat--trident">
                <span class="hub-wallet-value">3,800</span>
                <span class="hub-wallet-label">Tridents</span>
              </div>
              <div class="hub-wallet-stat hub-wallet-stat--flash">
                <span class="hub-wallet-value">GBP 38</span>
                <span class="hub-wallet-label">Trident Credit</span>
              </div>
            </div>
          </div>
          <div class="hub-store-banner">
            <div class="hub-store-head">
              <div class="hub-store-brand" aria-hidden="true">
                <span class="hub-store-logo">
                  <span class="hub-store-logo-eye">
                    <span class="hub-store-logo-q"></span>
                  </span>
                </span>
                <span class="hub-store-wordmark">IQMindware</span>
              </div>
              <span class="hub-store-cart" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M3 5h2l2 10h9l3-7H7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                  <circle cx="10" cy="19" r="1.7" fill="currentColor"></circle>
                  <circle cx="17" cy="19" r="1.7" fill="currentColor"></circle>
                </svg>
              </span>
            </div>
            <div class="hub-store-copy">
              Find the IQ Mindware store at
              <span class="hub-store-link">www.iqmindware.com</span>
            </div>
          </div>
        </aside>
      </div>

      <div class="hub-summary-grid">
        <section class="hub-panel hub-panel--summary">
          <div class="hub-panel-head">
            <span class="hub-panel-kicker">Zone summary</span>
            <span class="hub-panel-badge hub-panel-badge--zone">In-zone trend</span>
          </div>
          <div class="hub-summary-title">Bits/second cognitive capacity</div>
          <div class="hub-summary-topline">
            <div class="hub-summary-value">3 bits/sec</div>
          </div>
          <svg class="hub-sparkline hub-sparkline--zone" viewBox="0 0 180 38" preserveAspectRatio="none" aria-hidden="true">
            <polyline fill="none" stroke="currentColor" stroke-width="3" points="4,28 28,24 52,27 76,20 100,17 124,22 148,14 176,10"></polyline>
          </svg>
          <div class="hub-summary-title hub-summary-title--secondary">In-the-zone consistency per session</div>
          <div class="hub-state-row">${zoneDots}</div>
          <div class="hub-state-legend">${zoneLegend}</div>
        </section>

        <section class="hub-panel hub-panel--summary">
          <div class="hub-panel-head">
            <span class="hub-panel-kicker">Capacity summary</span>
            <span class="hub-panel-badge">Far transfer</span>
          </div>
          <div class="hub-summary-title">WM capacity gain estimate</div>
          <div class="hub-summary-topline">
            <div class="hub-summary-value">2.0 -> 3.0</div>
            <div class="hub-transfer-badge">Learn more</div>
          </div>
          <div class="hub-compare-bars">
            <div class="hub-compare-bar">
              <span class="hub-compare-label">Baseline</span>
              <div class="hub-compare-track"><span class="hub-compare-fill hub-compare-fill--muted" style="width: 44%;"></span></div>
            </div>
            <div class="hub-compare-bar">
              <span class="hub-compare-label">Current</span>
              <div class="hub-compare-track"><span class="hub-compare-fill hub-compare-fill--capacity" style="width: 72%;"></span></div>
            </div>
          </div>
          <div class="hub-summary-subhead">Cognitive skill gains from baseline</div>
          <div class="hub-skills-block">
            ${skillBars}
          </div>
        </section>

        <section class="hub-panel hub-panel--summary">
          <div class="hub-panel-head">
            <span class="hub-panel-kicker">Tests summary</span>
            <span class="hub-panel-badge">Evidence</span>
          </div>
            <div class="hub-summary-title">Psychometric IQ score</div>
            <div class="hub-summary-topline">
              <div class="hub-summary-value">100 -> 115</div>
              <div class="hub-iq-chart" aria-hidden="true">
                <div class="hub-iq-bars">
                  ${psychometricBars}
                </div>
              </div>
            </div>
          <div class="hub-summary-subhead">Applied intelligence scores</div>
          <div class="hub-ai-block">
            ${appliedIntelligenceRows}
          </div>
        </section>
      </div>
    </div>
  `
};
