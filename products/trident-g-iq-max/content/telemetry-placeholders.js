export const maxHubTelemetry = [
  {
    type: "splitMetric",
    label: "Route status",
    value: "Ready",
    valueTone: "accent",
    subline: "Full shell is live and routable.",
    badge: "Day 8",
    emphasis: true
  },
  {
    type: "list",
    label: "Today's route",
    rows: [
      { label: "Zone", value: "Check first" },
      { label: "Tests", value: "Evidence run" },
      { label: "Capacity", value: "Core block" },
      { label: "Reasoning", value: "Optional unlock" },
      { label: "Missions", value: "Layered route" }
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
    lines: ["4 launches this week", "2 modules advanced today"],
    streakOn: 5,
    streakTotal: 8,
    footer: { left: "Mode", right: "Max", rightTone: "accent" }
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

export const reasoningTelemetry = [
  {
    type: "splitMetric",
    label: "Reasoning lane",
    value: "Live",
    valueTone: "accent",
    subline: "Shared shell, new lane. Placeholder data only.",
    badge: "Lane 2",
    emphasis: true
  },
  {
    type: "metric",
    label: "Active focus",
    value: "Relational transforms",
    subline: "Reasoning work should inherit the same compact telemetry grammar."
  },
  {
    type: "sparkline",
    label: "Pattern synthesis",
    value: "Building",
    valueTone: "accent",
    points: "2,32 28,28 54,24 80,20 106,18 132,14 158,11 184,9",
    subline: "Placeholder trend showing reasoning stabilization."
  },
  {
    type: "ring",
    label: "Transfer readiness",
    ringValue: 64,
    ringNumber: "64",
    ringLabel: "proxy score",
    subline: "Reasoning extends the same proxy framing rather than making stronger claims.",
    variant: "violet"
  },
  {
    type: "streak",
    label: "Track progress",
    lines: ["Reasoning Day 3 of 12", "2 lanes available, 1 stabilized"],
    streakOn: 4,
    streakTotal: 8,
    footer: { left: "Today", right: "+25 TG", rightTone: "credit" }
  }
];

export const missionsTelemetry = [
  {
    type: "splitMetric",
    label: "Mission status",
    value: "Armed",
    valueTone: "accent",
    subline: "Mission shell is staged but still placeholder-driven.",
    badge: "Tier 1",
    emphasis: true
  },
  {
    type: "list",
    label: "Mission ladder",
    rows: [
      { label: "Current", value: "Signal Weave" },
      { label: "Next", value: "Rule Shift" },
      { label: "Locked", value: "Wrapper Clash" },
      { label: "Bonus", value: "Night Run" }
    ]
  },
  {
    type: "badge",
    label: "Unlock state",
    badge: "2 ready",
    badgeState: "ready",
    subline: "Keep reward language visible without making missions noisy."
  },
  {
    type: "barMetric",
    label: "Session pressure",
    value: "Moderate",
    valueTone: "accent",
    barValue: 54,
    subline: "Pressure and pacing later map to live rules."
  },
  {
    type: "routing",
    label: "Next route",
    title: "Mission available",
    subtitle: "Run after Zone and Capacity if today's state remains stable.",
    footer: { left: "Mission bonus", right: "+40 TG" }
  }
];

export const progressTelemetry = [
  {
    type: "ring",
    label: "Weekly completion",
    ringValue: 71,
    ringNumber: "71",
    ringLabel: "percent",
    subline: "Simple progress readout for the broader route.",
    emphasis: true
  },
  {
    type: "list",
    label: "Current lanes",
    rows: [
      { label: "Zone", value: "Ready" },
      { label: "Capacity", value: "Rising", tone: "ready" },
      { label: "Reasoning", value: "Building" },
      { label: "Missions", value: "Unlocked" }
    ]
  },
  {
    type: "sparkline",
    label: "Trajectory",
    value: "Positive",
    valueTone: "accent",
    points: "2,36 30,34 58,31 86,27 114,24 142,20 170,16 198,12",
    subline: "Placeholder only. Later this will pull from actual progression logs."
  },
  {
    type: "badge",
    label: "Route health",
    badge: "Stable",
    badgeState: "ready",
    subline: "Progress remains readable even when the larger game layer expands."
  },
  {
    type: "streak",
    label: "Rewards",
    lines: ["6 day streak", "120 TG banked this week"],
    streakOn: 6,
    streakTotal: 8,
    footer: { left: "Next unlock", right: "Mission tier 2", rightTone: "accent" }
  }
];

export const coachReviewTelemetry = [
  {
    type: "splitMetric",
    label: "Recommendation",
    value: "Capacity first",
    valueTone: "accent",
    subline: "This panel synthesizes route advice, not raw mechanics.",
    badge: "Today",
    emphasis: true
  },
  {
    type: "list",
    label: "Review lines",
    rows: [
      { label: "Zone", value: "Cleared" },
      { label: "Tests", value: "Optional" },
      { label: "Capacity", value: "Primary" },
      { label: "Reasoning", value: "Secondary" }
    ]
  },
  {
    type: "badge",
    label: "Coach state",
    badge: "Ready",
    badgeState: "ready",
    subline: "Advice should remain short, directive, and route-aware."
  },
  {
    type: "metric",
    label: "Confidence",
    value: "82%",
    valueTone: "accent",
    subline: "Placeholder confidence until actual signals are wired."
  },
  {
    type: "routing",
    label: "Next step",
    title: "Open Capacity",
    subtitle: "Use the current shell and move directly into the counted training run.",
    footer: { left: "Review bonus", right: "+10 TG", rightTone: "credit" }
  }
];
