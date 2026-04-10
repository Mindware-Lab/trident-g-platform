import { capacityTelemetry } from "../../content/telemetry-placeholders.js";

const capacityGamesStripHtml = `
  <div class="capacity-route">
    <div class="capacity-route-title">G<span>AMES</span></div>
    <div class="capacity-route-figure">
      <svg
        class="capacity-route-map"
        viewBox="0 0 268 548"
        role="img"
        aria-label="Capacity games route showing open Flex and Bind families, locked Resist and Emotion families, and active Relate Numbers."
      >
        <line class="capacity-route-spine" x1="45" y1="82" x2="45" y2="508"></line>

        <g class="capacity-route-family capacity-route-family--xor">
          <text class="capacity-route-family-name" x="45" y="65" text-anchor="middle" font-family="Orbitron, monospace" font-size="7.5" font-weight="700" letter-spacing="1.5">FLEX</text>
          <circle class="capacity-route-step" cx="45" cy="82" r="10"></circle>
          <line class="capacity-route-branch" x1="55" y1="82" x2="100" y2="82"></line>
          <circle class="capacity-route-junction" cx="100" cy="82" r="3"></circle>
          <line class="capacity-route-trunk" x1="100" y1="52" x2="100" y2="112"></line>

          <g class="capacity-route-variant">
            <line class="capacity-route-link" x1="100" y1="52" x2="148" y2="52"></line>
            <circle class="capacity-route-node" cx="155" cy="52" r="6"></circle>
            <text class="capacity-route-variant-label" x="167" y="56" font-family="Chakra Petch, sans-serif" font-size="10" font-weight="600" letter-spacing="2">FIXED</text>
          </g>
          <g class="capacity-route-variant">
            <line class="capacity-route-link" x1="100" y1="82" x2="148" y2="82"></line>
            <circle class="capacity-route-node" cx="155" cy="82" r="6"></circle>
            <text class="capacity-route-variant-label" x="167" y="86" font-family="Chakra Petch, sans-serif" font-size="10" font-weight="600" letter-spacing="2">RANDOM</text>
          </g>
          <g class="capacity-route-variant">
            <line class="capacity-route-link" x1="100" y1="112" x2="148" y2="112"></line>
            <circle class="capacity-route-node" cx="155" cy="112" r="6"></circle>
            <text class="capacity-route-variant-label" x="167" y="116" font-family="Chakra Petch, sans-serif" font-size="10" font-weight="600" letter-spacing="2">CONCEPT</text>
          </g>
        </g>

        <g class="capacity-route-family capacity-route-family--and">
          <text class="capacity-route-family-name" x="45" y="166" text-anchor="middle" font-family="Orbitron, monospace" font-size="7.5" font-weight="700" letter-spacing="1.5">BIND</text>
          <circle class="capacity-route-step" cx="45" cy="182" r="10"></circle>
          <line class="capacity-route-branch" x1="55" y1="182" x2="100" y2="182"></line>
          <circle class="capacity-route-junction" cx="100" cy="182" r="3"></circle>
          <line class="capacity-route-trunk" x1="100" y1="168" x2="100" y2="196"></line>

          <g class="capacity-route-variant">
            <line class="capacity-route-link" x1="100" y1="168" x2="148" y2="168"></line>
            <circle class="capacity-route-node" cx="155" cy="168" r="6"></circle>
            <text class="capacity-route-variant-label" x="167" y="172" font-family="Chakra Petch, sans-serif" font-size="10" font-weight="600" letter-spacing="2">FIXED</text>
          </g>
          <g class="capacity-route-variant">
            <line class="capacity-route-link" x1="100" y1="196" x2="148" y2="196"></line>
            <circle class="capacity-route-node" cx="155" cy="196" r="6"></circle>
            <text class="capacity-route-variant-label" x="167" y="200" font-family="Chakra Petch, sans-serif" font-size="10" font-weight="600" letter-spacing="2">RANDOM</text>
          </g>
        </g>

        <g class="capacity-route-family capacity-route-family--interference">
          <text class="capacity-route-family-name" x="45" y="280" text-anchor="middle" font-family="Orbitron, monospace" font-size="7.5" font-weight="700" letter-spacing="1.2">RESIST</text>
          <circle class="capacity-route-step" cx="45" cy="296" r="10"></circle>
          <line class="capacity-route-branch" x1="55" y1="296" x2="100" y2="296"></line>
          <circle class="capacity-route-junction" cx="100" cy="296" r="3"></circle>
          <line class="capacity-route-trunk" x1="100" y1="268" x2="100" y2="324"></line>

          <g class="capacity-route-variant">
            <line class="capacity-route-link" x1="100" y1="268" x2="148" y2="268"></line>
            <circle class="capacity-route-node" cx="155" cy="268" r="6"></circle>
            <text class="capacity-route-variant-label" x="167" y="272" font-family="Chakra Petch, sans-serif" font-size="10" font-weight="600" letter-spacing="2">ARROWS</text>
          </g>
          <g class="capacity-route-variant">
            <line class="capacity-route-link" x1="100" y1="296" x2="148" y2="296"></line>
            <circle class="capacity-route-node" cx="155" cy="296" r="6"></circle>
            <text class="capacity-route-variant-label" x="167" y="300" font-family="Chakra Petch, sans-serif" font-size="10" font-weight="600" letter-spacing="2">WORDS</text>
          </g>
          <g class="capacity-route-variant">
            <line class="capacity-route-link" x1="100" y1="324" x2="148" y2="324"></line>
            <circle class="capacity-route-node" cx="155" cy="324" r="6"></circle>
            <text class="capacity-route-variant-label" x="167" y="328" font-family="Chakra Petch, sans-serif" font-size="10" font-weight="600" letter-spacing="2">CONCEPT</text>
          </g>
        </g>

        <g class="capacity-route-family capacity-route-family--emotional is-locked">
          <text class="capacity-route-family-name" x="45" y="390" text-anchor="middle" font-family="Orbitron, monospace" font-size="7.2" font-weight="700" letter-spacing="1.2">EMOTION</text>
          <circle class="capacity-route-step" cx="45" cy="406" r="10"></circle>
          <line class="capacity-route-branch" x1="55" y1="406" x2="100" y2="406"></line>
          <circle class="capacity-route-junction" cx="100" cy="406" r="3"></circle>
          <line class="capacity-route-trunk" x1="100" y1="392" x2="100" y2="420"></line>

          <g class="capacity-route-variant">
            <line class="capacity-route-link" x1="100" y1="392" x2="148" y2="392"></line>
            <circle class="capacity-route-node" cx="155" cy="392" r="6"></circle>
            <text class="capacity-route-variant-label" x="167" y="396" font-family="Chakra Petch, sans-serif" font-size="10" font-weight="600" letter-spacing="2">FACES</text>
          </g>
          <g class="capacity-route-variant">
            <line class="capacity-route-link" x1="100" y1="420" x2="148" y2="420"></line>
            <circle class="capacity-route-node" cx="155" cy="420" r="6"></circle>
            <text class="capacity-route-variant-label" x="167" y="424" font-family="Chakra Petch, sans-serif" font-size="10" font-weight="600" letter-spacing="2">WORDS</text>
          </g>
        </g>

        <g class="capacity-route-family capacity-route-family--relational is-current">
          <text class="capacity-route-family-name" x="45" y="492" text-anchor="middle" font-family="Orbitron, monospace" font-size="7.2" font-weight="700" letter-spacing="1.2">RELATE</text>
          <circle class="capacity-route-step" cx="45" cy="508" r="10"></circle>
          <line class="capacity-route-branch" x1="55" y1="508" x2="100" y2="508"></line>
          <circle class="capacity-route-junction" cx="100" cy="508" r="3"></circle>
          <line class="capacity-route-trunk" x1="100" y1="480" x2="100" y2="536"></line>

          <g class="capacity-route-variant">
            <line class="capacity-route-link" x1="100" y1="480" x2="148" y2="480"></line>
            <circle class="capacity-route-node" cx="155" cy="480" r="6"></circle>
            <text class="capacity-route-variant-label" x="167" y="484" font-family="Chakra Petch, sans-serif" font-size="10" font-weight="600" letter-spacing="2">ARROWS</text>
          </g>
          <g class="capacity-route-variant">
            <line class="capacity-route-link" x1="100" y1="508" x2="148" y2="508"></line>
            <circle class="capacity-route-node" cx="155" cy="508" r="6"></circle>
            <text class="capacity-route-variant-label" x="167" y="512" font-family="Chakra Petch, sans-serif" font-size="10" font-weight="600" letter-spacing="2">ANGLES</text>
          </g>
          <g class="capacity-route-variant is-active">
            <line class="capacity-route-link" x1="100" y1="536" x2="148" y2="536"></line>
            <circle class="capacity-route-node" cx="155" cy="536" r="6"></circle>
            <text class="capacity-route-variant-label" x="167" y="540" font-family="Chakra Petch, sans-serif" font-size="10" font-weight="700" letter-spacing="2">NUMBERS</text>
          </g>
        </g>
      </svg>
    </div>
    <div class="capacity-route-key" aria-label="Game family state key">
      <div class="capacity-route-key-item">
        <span class="capacity-route-key-swatch capacity-route-key-swatch--unlocked" aria-hidden="true"></span>
        <span class="capacity-route-key-label">Unlocked</span>
      </div>
      <div class="capacity-route-key-item">
        <span class="capacity-route-key-swatch capacity-route-key-swatch--locked" aria-hidden="true"></span>
        <span class="capacity-route-key-label">Locked</span>
      </div>
      <div class="capacity-route-key-item">
        <span class="capacity-route-key-swatch capacity-route-key-swatch--active" aria-hidden="true"></span>
        <span class="capacity-route-key-label">Active</span>
      </div>
    </div>
  </div>
`;

const capacityBannerHtml = `
  <div class="capacity-banner-shell">
    <h1 class="capacity-banner-a11y-title" id="banner-title">Capacity</h1>
    <span class="capacity-banner-track">Day 3 of 10</span>
    <span class="capacity-banner-divider" aria-hidden="true"></span>
    <div class="capacity-banner-chip-row" aria-label="Current play context">
      <span class="capacity-banner-chip capacity-banner-chip--level"><span class="capacity-banner-chip-dot" aria-hidden="true"></span>Lvl 3</span>
      <span class="capacity-banner-chip"><span class="capacity-banner-chip-dot" aria-hidden="true"></span>Numbers</span>
      <span class="capacity-banner-chip"><span class="capacity-banner-chip-dot" aria-hidden="true"></span>Blk 5/10</span>
      <span class="capacity-banner-chip capacity-banner-chip--speed"><span class="capacity-banner-chip-dot" aria-hidden="true"></span>Fast pace</span>
    </div>
    <div class="capacity-banner-credit" aria-label="Tridents earned this session">
      <span class="capacity-banner-credit-label">Tridents</span>
      <span class="capacity-banner-credit-badge">30</span>
    </div>
  </div>
`;

const capacityCoachHtml = `
  <div class="capacity-coach-shell">
    <div class="coach-label">Coach</div>
    <div class="capacity-coach-panel">
      <div class="capacity-coach-line is-active" data-view-group="capacity-play" data-view-panel="between">
        You kept level 3 steady. Next, do the same thing at the faster pace.
      </div>
      <div class="capacity-coach-line" data-view-group="capacity-play" data-view-panel="live" hidden>
        Watch the two numbers and tap Match when the pattern is the same as three turns ago.
      </div>
    </div>
  </div>
`;

const capacityTaskHtml = `
  <div class="task-shell task-shell--capacity">
    <div class="capacity-stage">
      <div class="capacity-mockup-tabs" role="tablist" aria-label="Capacity play views">
        <button class="capacity-mockup-tab is-active" type="button" data-view-group="capacity-play" data-view-value="between">1</button>
        <button class="capacity-mockup-tab" type="button" data-view-group="capacity-play" data-view-value="live">2</button>
      </div>
      <div class="capacity-play-panel is-active" data-view-group="capacity-play" data-view-panel="between">
        <div class="capacity-transition-card">
          <div class="capacity-transition-kicker">Between blocks</div>
          <div class="capacity-transition-title">Next: same level, faster pace</div>
          <div class="capacity-transition-copy">You held level 3 steady. The next block keeps the same rule, but it moves faster.</div>
          <div class="capacity-transition-steps">
            <div class="capacity-transition-step capacity-transition-step--done">1 Different version: done</div>
            <div class="capacity-transition-step capacity-transition-step--active">2 Faster pace: next</div>
            <div class="capacity-transition-step">3 Move up a level: after that</div>
          </div>
          <div class="capacity-transition-stats">
            <div class="capacity-transition-stat">
              <span class="capacity-transition-stat-label">Current level</span>
              <span class="capacity-transition-stat-value">3</span>
            </div>
            <div class="capacity-transition-stat">
              <span class="capacity-transition-stat-label">Current pace</span>
              <span class="capacity-transition-stat-value">Normal</span>
            </div>
            <div class="capacity-transition-stat">
              <span class="capacity-transition-stat-label">Next block</span>
              <span class="capacity-transition-stat-value">5 at fast pace</span>
            </div>
          </div>
          <button class="capacity-transition-action" type="button">Start block 5</button>
          <button class="capacity-transition-secondary" type="button" data-go="capacity-lab">Open Capacity sandbox</button>
          <div class="capacity-transition-hint">Public tester route. Flex and Bind blocks with local scoring only.</div>
        </div>
      </div>
      <div class="capacity-play-panel" data-view-group="capacity-play" data-view-panel="live" hidden>
        <div class="capacity-live-card">
          <div class="capacity-live-head">
            <div class="capacity-live-kicker">Block 5 live</div>
            <div class="capacity-live-pill">Fast pace</div>
          </div>
          <div class="capacity-phone">
            <div class="capacity-phone-head">Numbers game</div>
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
          <div class="capacity-live-note">Match when the pattern is the same as three turns ago.</div>
        </div>
      </div>
    </div>
  </div>
`;

export const capacityScreen = {
  id: "capacity",
  module: "capacity",
  banner: {
    title: "Capacity",
    subtitle: "Relate - relational integration, fluid reasoning",
    subcopy: "Capacity Gym - numbers variant live. Next gate: hold this rule after a wrapper swap",
    stage: "N-3",
    stageMeta: "numbers variant"
  },
  bannerHtml: capacityBannerHtml,
  info: [
    { kind: "text", icon: "C", label: "Zone", value: "In zone", tone: "positive" },
    { kind: "text", label: "Program", value: "Targeted rewire", tone: "accent" },
    { kind: "text", label: "Sessions remaining", value: "10", tone: "credit" }
  ],
  coach: {
    label: "Coach",
    headline: "Hold the numbers rule next.",
    body: "Keep relational matches clean after the wrapper swap."
  },
  coachHtml: capacityCoachHtml,
  sidePanelClass: "capacity-side-panel",
  sidePanelHtml: capacityGamesStripHtml,
  taskHtml: capacityTaskHtml,
  responseHtml: ``,
  telemetryCards: capacityTelemetry
};
