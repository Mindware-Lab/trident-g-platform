export const basicHubTelemetry = [
  {
    type: "splitMetric",
    label: "Route status",
    value: "Ready",
    valueTone: "accent",
    subline: "Basic shell is live and routable.",
    badge: "Day 8",
    emphasis: true
  },
  {
    type: "list",
    label: "Today's route",
    rows: [
      { label: "Zone", value: "Check first" },
      { label: "Tests", value: "Optional" },
      { label: "Capacity", value: "Core block" },
      { label: "Hub", value: "Launch surface" }
    ]
  },
  {
    type: "badge",
    label: "Zone state",
    badge: "Ready",
    badgeState: "ready",
    subline: "Use the hub to move into today's run."
  },
  {
    type: "metric",
    label: "Credits",
    value: "40 TG",
    valueTone: "credit",
    subline: "Reward language stays shared across modules."
  },
  {
    type: "streak",
    label: "Weekly streak",
    lines: ["4 launches this week", "1 counted core route today"],
    streakOn: 5,
    streakTotal: 8,
    footer: { left: "Mode", right: "Basic", rightTone: "accent" }
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
