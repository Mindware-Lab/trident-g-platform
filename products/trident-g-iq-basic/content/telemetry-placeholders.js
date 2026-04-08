export const basicHubTelemetry = [
  {
    type: "splitMetric",
    label: "Route status",
    value: "Encode",
    valueTone: "accent",
    subline: "Phase 1 is live. Only clean in-zone full sessions count toward the core 20.",
    badge: "Day 8",
    emphasis: true
  },
  {
    type: "ring",
    label: "Core window",
    ringValue: 40,
    ringNumber: "8",
    ringLabel: "of 20",
    subline: "Twenty counted core sessions drive the initial encode programme."
  },
  {
    label: "Wallet",
    html: `
      <div class="hub-telemetry-wallet">
        <div class="hub-telemetry-currency hub-telemetry-currency--g">
          <span class="hub-telemetry-value">128</span>
          <span class="hub-telemetry-unit">G</span>
          <span class="hub-telemetry-copy">progression coins</span>
        </div>
        <div class="hub-telemetry-currency hub-telemetry-currency--trident">
          <span class="hub-telemetry-value">12</span>
          <span class="hub-telemetry-unit">Tridents</span>
          <span class="hub-telemetry-copy">milestone rewards</span>
        </div>
        <div class="hub-telemetry-credit">
          Convertible wallet: <strong>34 G Credit</strong>
        </div>
      </div>
    `
  },
  {
    type: "list",
    label: "Session classes",
    rows: [
      { label: "Ready", value: "10 blocks", tone: "ready" },
      { label: "Flat", value: "4-6 support", tone: "muted" },
      { label: "Spun Out", value: "3-4 reset", tone: "warning" },
      { label: "Locked In", value: "4-5 shift", tone: "accent" }
    ]
  },
  {
    type: "streak",
    label: "Reward rhythm",
    lines: ["Fast-speed hold bonus: +20 G", "Variant swap milestone: +1 Trident"],
    streakOn: 6,
    streakTotal: 8,
    footer: { left: "Next unlock", right: "AND probe lane", rightTone: "accent" }
  }
];

export const testsTelemetry = [
  {
    type: "splitMetric",
    label: "Test status",
    value: "Baseline",
    valueTone: "accent",
    subline: "Current run contributes to first profile.",
    badge: "Run 1",
    emphasis: true
  },
  {
    type: "metric",
    label: "Test family",
    value: "Fluid reasoning",
    subline: "SgS item set. Matrix and rule completion."
  },
  {
    type: "ring",
    label: "Completion",
    ringValue: 33,
    ringNumber: "4",
    ringLabel: "of 12",
    subline: "Estimated 3 min left."
  },
  {
    type: "list",
    label: "Comparison",
    rows: [
      { label: "Baseline", value: "58" },
      { label: "Last", value: "65" },
      { label: "Best", value: "72" },
      { label: "Delta", value: "+7", tone: "ready" }
    ]
  },
  {
    type: "badge",
    label: "Validity and due",
    badge: "Zone cleared",
    badgeState: "ready",
    subline: "Valid run. Due now.",
    footer: { left: "Test bonus", right: "+20 TG", rightTone: "credit" }
  }
];

export const zoneTelemetry = [
  {
    type: "ring",
    label: "Zone score",
    ringValue: 82,
    ringNumber: "82",
    ringLabel: "zone score",
    subline: "High enough for a counted core session.",
    emphasis: true
  },
  {
    type: "barMetric",
    label: "Control capacity",
    value: "5.8 bits/s",
    valueTone: "accent",
    barValue: 72,
    subline: "Interesting throughput proxy lives here, not in the top nav."
  },
  {
    type: "badge",
    label: "State classification",
    badge: "Ready",
    badgeState: "ready",
    subline: "Redundant on purpose. This should be unmistakable."
  },
  {
    type: "signalProfile",
    label: "Signal profile",
    bars: [
      { label: "Load", value: "61", percent: 61 },
      { label: "Drift", value: "22", percent: 22, tone: "soft" },
      { label: "Readiness", value: "82", percent: 82 }
    ]
  },
  {
    type: "routing",
    label: "Routing",
    title: "Full route",
    subtitle: "Core session available now. Re-check only if state drops after load.",
    footer: { left: "In-zone time", right: "63% this week" }
  }
];

export const capacityTelemetry = [
  {
    label: "Session performance",
    labelClass: "metric-label--credit",
    emphasis: true,
    html: `
      <div class="capacity-rail-panel">
        <div class="capacity-rail-progress-head">
          <span>Block 6 of 10</span>
          <span class="capacity-rail-route">Counted session</span>
        </div>
        <div class="bar-track capacity-rail-progress-track">
          <div class="bar-fill" style="width: 60%;"></div>
        </div>
        <div class="capacity-rail-grid">
          <div class="capacity-rail-stat">
            <div class="capacity-rail-stat-label">Session average</div>
            <div class="capacity-rail-stat-value is-accent">2.0</div>
            <div class="capacity-rail-stat-subline">Current session n-back</div>
          </div>
          <div class="capacity-rail-stat">
            <div class="capacity-rail-stat-label">Transfer readiness</div>
            <div class="capacity-rail-pill capacity-rail-pill--transfer">Developing</div>
            <div class="capacity-rail-stat-subline">Switch cost absorbed</div>
          </div>
        </div>
        <div class="capacity-rail-inline">
          <span class="capacity-rail-inline-label">Stable level</span>
          <span class="capacity-rail-inline-value">2-back</span>
        </div>
        <div class="capacity-rail-inline">
          <span class="capacity-rail-inline-label">Pressure status</span>
          <span class="capacity-rail-inline-value">Numbers hold next</span>
        </div>
      </div>
    `
  },
  {
    label: "Game performance",
    labelClass: "metric-label--credit",
    emphasis: true,
    html: `
      <div class="capacity-rail-panel">
        <div class="capacity-rail-grid">
          <div class="capacity-rail-stat">
            <div class="capacity-rail-stat-label">Next block</div>
            <div class="capacity-rail-stat-value is-accent">N-3</div>
            <div class="capacity-rail-stat-subline">Wrapper swap</div>
          </div>
          <div class="capacity-rail-stat">
            <div class="capacity-rail-stat-label">Last block</div>
            <div class="capacity-rail-stat-value">86%</div>
            <div class="capacity-rail-pill capacity-rail-pill--up">UP</div>
          </div>
        </div>
        <div class="capacity-rail-inline">
          <span class="capacity-rail-inline-label">Last accuracy</span>
          <span class="capacity-rail-inline-value">18 of 21 correct</span>
        </div>
        <div class="capacity-rail-trend">
          <div class="capacity-rail-trend-label">Accuracy over blocks</div>
          <svg class="capacity-rail-spark" viewBox="0 0 170 30" preserveAspectRatio="none" aria-hidden="true">
            <polyline fill="none" stroke="rgba(245, 181, 68, 0.96)" stroke-width="2.6" points="2,22 22,20 42,18 62,20 82,16 102,14 122,17 142,12 168,9"></polyline>
          </svg>
        </div>
      </div>
    `
  },
  {
    label: "Today",
    emphasis: true,
    html: `
      <div class="capacity-credit-card">
        <img class="capacity-credit-coin" src="./mockups/Octa g icon.png" alt="G credit coin">
        <div class="capacity-credit-copy">
          <div class="capacity-credit-chip">G credit</div>
          <div class="capacity-credit-value">+30</div>
          <div class="capacity-credit-subline">Session reward</div>
        </div>
      </div>
    `
  }
];
