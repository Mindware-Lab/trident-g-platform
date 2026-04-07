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
    type: "barMetric",
    label: "Session average",
    value: "2.0",
    valueTone: "accent",
    barValue: 58,
    subline: "Average session n-back stays visible, but not overloaded.",
    emphasis: true
  },
  {
    type: "metric",
    label: "Stable level",
    value: "2-back",
    subline: "Fast speed not yet confirmed."
  },
  {
    type: "sparkline",
    label: "Trend",
    value: "Rising",
    valueTone: "accent",
    points: "2,30 32,24 62,25 92,17 122,18 152,10 178,12",
    subline: "Shape is placeholder only. Later this maps to actual session trend."
  },
  {
    type: "ring",
    label: "Transfer readiness",
    ringValue: 58,
    ringNumber: "58",
    ringLabel: "proxy score",
    subline: "Visible proxy rather than a full far-transfer claim.",
    variant: "violet"
  },
  {
    type: "streak",
    label: "Track progress",
    lines: ["Encode Day 8 of 20", "XOR: 2 of 3 variants stabilized"],
    streakOn: 6,
    streakTotal: 8,
    footer: { left: "Today", right: "+30 TG", rightTone: "credit" }
  }
];
