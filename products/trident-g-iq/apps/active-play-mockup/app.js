const screens = {
  tests: {
    title: "Tests",
    subtitle: "SgS Fluid Reasoning - Baseline",
    subcopy: "Evidence mode",
    stage: "4/12",
    stageMeta: "item progress",
    info: [
      { icon: "T", text: "Evidence mode" },
      { pill: "Testing allowed now", tone: "positive" },
      { text: "Psi-CBS 2 of 3" },
      { credit: "TG Credit +20" }
    ],
    coachLabel: "Coach",
    coachCopy: "<strong>Baseline test.</strong> Focus on clean effort, not speed.<span class=\"coach-detail\">Choose the option that best completes the final cell. This screen stays measured and test-like, with the current item and clean response choices doing the visual work.</span>",
    task: `
      <div class="task-shell">
        <div class="task-kicker">Fluid reasoning matrix - baseline</div>
        <div class="matrix-grid">
          <div class="matrix-cell">A1</div>
          <div class="matrix-cell is-highlight">B2</div>
          <div class="matrix-cell">C3</div>
          <div class="matrix-cell">A2</div>
          <div class="matrix-cell">B3</div>
          <div class="matrix-cell">C4</div>
          <div class="matrix-cell">A3</div>
          <div class="matrix-cell">B4</div>
          <div class="matrix-cell is-target">?</div>
        </div>
      </div>
    `,
    responses: `
      <div class="response-stack">
        <div class="choice-grid">
          <button class="choice-card" type="button">
            <span class="choice-title">Option A</span>
            <span class="choice-subtitle">Mirror the outer rotation</span>
          </button>
          <button class="choice-card" type="button">
            <span class="choice-title">Option B</span>
            <span class="choice-subtitle">Preserve the row count shift</span>
          </button>
          <button class="choice-card" type="button">
            <span class="choice-title">Option C</span>
            <span class="choice-subtitle">Advance both rule tracks</span>
          </button>
          <button class="choice-card" type="button">
            <span class="choice-title">Option D</span>
            <span class="choice-subtitle">Hold one rule and invert the second</span>
          </button>
        </div>
      </div>
    `,
    telemetry: `
      <section class="telemetry-card telemetry-card--emphasis">
        <div class="metric-label">Test status</div>
        <div class="metric-split">
          <div>
            <div class="metric-value is-accent">Baseline</div>
            <div class="metric-subline">Current run contributes to first profile.</div>
          </div>
          <div class="metric-badge">Run 1</div>
        </div>
      </section>
      <section class="telemetry-card">
        <div class="metric-label">Test family</div>
        <div class="metric-value">Fluid reasoning</div>
        <div class="metric-subline">SgS item set. Matrix and rule completion.</div>
      </section>
      <section class="telemetry-card">
        <div class="metric-label">Completion</div>
        <div class="ring" style="--ring-value: 33;">
          <div class="ring-value">
            <span class="ring-number">4</span>
            <span class="ring-label">of 12</span>
          </div>
        </div>
        <div class="metric-subline">Estimated 3 min left.</div>
      </section>
      <section class="telemetry-card">
        <div class="metric-label">Comparison</div>
        <div class="state-list">
          <div class="state-row"><span>Baseline</span><span>58</span></div>
          <div class="state-row"><span>Last</span><span>65</span></div>
          <div class="state-row"><span>Best</span><span>72</span></div>
          <div class="state-row"><span>Delta</span><span style="color: var(--ready);">+7</span></div>
        </div>
      </section>
      <section class="telemetry-card">
        <div class="metric-label">Validity and due</div>
        <div class="metric-badge" data-state="ready">Zone cleared</div>
        <div class="metric-subline">Valid run. Due now.</div>
        <div class="footer-row">
          <span>Test bonus</span>
          <span style="color: var(--credit);">+20 TG</span>
        </div>
      </section>
    `
  },
  zone: {
    title: "Zone",
    subtitle: "Majority Direction Probe - 30s",
    subcopy: "Zone Coach",
    stage: "Ready",
    stageMeta: "state classification",
    info: [
      { icon: "Z", text: "Gating mode" },
      { text: "MDT-m check" },
      { pill: "Core session available", tone: "positive" },
      { credit: "TG Credit +10" }
    ],
    coachLabel: "Next step",
    coachCopy: "<strong>Full route available.</strong> Today can count as a core session.",
    task: `
      <div class="task-shell">
        <div class="task-kicker">Majority direction probe</div>
        <div class="zone-probe">
          <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
          <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
          <div class="probe-tile"><span class="probe-arrow is-soft">&gt;</span></div>
          <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
          <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
          <div class="probe-tile"><span class="probe-arrow is-soft">&gt;</span></div>
          <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
          <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
          <div class="probe-tile"><span class="probe-arrow is-soft">&gt;</span></div>
          <div class="probe-tile"><span class="probe-arrow">&lt;</span></div>
        </div>
        <div class="task-copy">
          Mark the dominant direction under time pressure. The surface stays diagnostic and decisive: fewer decorative flourishes, clearer state feedback, and direct routing language.
        </div>
        <div class="task-caption">Probe live state before load</div>
      </div>
    `,
    responses: `
      <div class="response-stack">
        <div class="response-hint">Response controls</div>
        <div class="response-buttons">
          <button class="response-button is-primary is-confirmed" type="button">
            <span class="button-title">Left majority</span>
            <span class="button-subtitle">Current probe resolves left</span>
          </button>
          <button class="response-button is-risk" type="button">
            <span class="button-title">Right majority</span>
            <span class="button-subtitle">Use when the field tips right</span>
          </button>
        </div>
      </div>
    `,
    telemetry: `
      <section class="telemetry-card telemetry-card--emphasis">
        <div class="metric-label">Zone score</div>
        <div class="ring" style="--ring-value: 82;">
          <div class="ring-value">
            <span class="ring-number">82</span>
            <span class="ring-label">zone score</span>
          </div>
        </div>
        <div class="metric-subline">High enough for a counted core session.</div>
      </section>
      <section class="telemetry-card">
        <div class="metric-label">Control capacity</div>
        <div class="metric-value is-accent">5.8 bits/s</div>
        <div class="mini-bar">
          <div class="bar-track"><div class="bar-fill" style="width: 72%;"></div></div>
        </div>
        <div class="metric-subline">Interesting throughput proxy lives here, not in the top nav.</div>
      </section>
      <section class="telemetry-card">
        <div class="metric-label">State classification</div>
        <div class="metric-badge" data-state="ready">Ready</div>
        <div class="metric-subline">Redundant on purpose. This should be unmistakable.</div>
      </section>
      <section class="telemetry-card">
        <div class="metric-label">Signal profile</div>
        <div class="signal-row">
          <div class="state-row"><span>Load</span><span>61</span></div>
          <div class="bar-track"><div class="bar-fill" style="width: 61%;"></div></div>
          <div class="state-row"><span>Drift</span><span>22</span></div>
          <div class="bar-track"><div class="bar-fill bar-fill--soft" style="width: 22%;"></div></div>
          <div class="state-row"><span>Readiness</span><span>82</span></div>
          <div class="bar-track"><div class="bar-fill" style="width: 82%;"></div></div>
        </div>
      </section>
      <section class="telemetry-card">
        <div class="metric-label">Routing</div>
        <div class="routing-card">
          <div class="routing-title">Full route</div>
          <div class="routing-subtitle">Core session available now. Re-check only if state drops after load.</div>
        </div>
        <div class="footer-row">
          <span>In-zone time</span>
          <span>63% this week</span>
        </div>
      </section>
    `
  },
  capacity: {
    title: "Capacity",
    subtitle: "XOR - Flexibility, selective attention, conceptual abstraction",
    subcopy: "Capacity Gym - next gate: hold this level after a wrapper swap",
    stage: "N-3",
    stageMeta: "block 6 of 10",
    info: [
      { icon: "C", text: "Phase 1 - Encode" },
      { pill: "Today counts", tone: "positive" },
      { text: "0 of 1 core session used" },
      { credit: "TG Credit +30" }
    ],
    coachLabel: "Coach",
    coachCopy: "<strong>Test carry-over next.</strong> Swap wrapper at this level.",
    task: `
      <div class="task-shell">
        <div class="task-kicker">Relational n-back board</div>
        <div class="nback-grid">
          <div class="nback-cell"></div>
          <div class="nback-cell is-lit"></div>
          <div class="nback-cell"></div>
          <div class="nback-cell"></div>
          <div class="nback-cell"></div>
          <div class="nback-cell"></div>
          <div class="nback-cell"></div>
          <div class="nback-cell"></div>
          <div class="nback-cell is-hit"></div>
        </div>
        <div class="stimulus-letter">K</div>
        <div class="task-caption">Hold position and wrapper rule across the board</div>
        <div class="capacity-progress">
          <span class="is-on"></span>
          <span class="is-on"></span>
          <span class="is-on"></span>
          <span class="is-on"></span>
          <span class="is-on"></span>
          <span class="is-on"></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `,
    responses: `
      <div class="response-stack">
        <div class="response-hint">Response controls</div>
        <div class="response-buttons">
          <button class="response-button is-primary" type="button">
            <span class="button-title">Match position</span>
            <span class="button-subtitle">Spatial recall at N-3</span>
          </button>
          <button class="response-button is-confirmed" type="button">
            <span class="button-title">Match letter</span>
            <span class="button-subtitle">Correct action gets the lime pulse</span>
          </button>
        </div>
      </div>
    `,
    telemetry: `
      <section class="telemetry-card telemetry-card--emphasis">
        <div class="metric-label">Session average</div>
        <div class="metric-value is-accent">2.0</div>
        <div class="mini-bar">
          <div class="bar-track"><div class="bar-fill" style="width: 58%;"></div></div>
        </div>
        <div class="metric-subline">Average session n-back stays visible, but not overloaded.</div>
      </section>
      <section class="telemetry-card">
        <div class="metric-label">Stable level</div>
        <div class="metric-value">2-back</div>
        <div class="metric-subline">Fast speed not yet confirmed.</div>
      </section>
      <section class="telemetry-card">
        <div class="metric-label">Trend</div>
        <div class="metric-value is-accent">Rising</div>
        <svg class="sparkline" viewBox="0 0 180 36" preserveAspectRatio="none" aria-hidden="true">
          <polyline fill="none" stroke="rgba(84, 162, 255, 0.95)" stroke-width="2" points="2,30 32,24 62,25 92,17 122,18 152,10 178,12"></polyline>
        </svg>
        <div class="metric-subline">Shape is placeholder only. Later this maps to actual session trend.</div>
      </section>
      <section class="telemetry-card">
        <div class="metric-label">Transfer readiness</div>
        <div class="metric-badge" data-state="transfer">Developing</div>
        <div class="ring ring--violet" style="--ring-value: 58;">
          <div class="ring-value">
            <span class="ring-number">58</span>
            <span class="ring-label">proxy score</span>
          </div>
        </div>
      </section>
      <section class="telemetry-card">
        <div class="metric-label">Track progress</div>
        <div class="metric-subline">Encode Day 8 of 20</div>
        <div class="metric-subline">XOR: 2 of 3 variants stabilized</div>
        <div class="streak-blocks">
          <span class="is-on"></span>
          <span class="is-on"></span>
          <span class="is-on"></span>
          <span class="is-on"></span>
          <span class="is-on"></span>
          <span class="is-on"></span>
          <span></span>
          <span></span>
        </div>
        <div class="footer-row">
          <span>Today</span>
          <span style="color: var(--credit);">+30 TG</span>
        </div>
      </section>
    `
  }
};

const appShell = document.getElementById("app-shell");
const infoStrip = document.getElementById("info-strip");
const banner = document.getElementById("banner");
const taskArea = document.getElementById("task-area");
const responseArea = document.getElementById("response-area");
const coachStrip = document.getElementById("coach-strip");
const telemetryRail = document.getElementById("telemetry-rail");
const navTabs = Array.from(document.querySelectorAll("[data-screen]"));

function renderInfoBlock(item) {
  if (item.credit) {
    return `
      <div class="info-block is-credit">
        <span class="credit-pill"><strong>${item.credit}</strong></span>
      </div>
    `;
  }

  if (item.pill) {
    return `
      <div class="info-block">
        <span class="state-pill" data-tone="${item.tone || "muted"}">${item.pill}</span>
      </div>
    `;
  }

  return `
    <div class="info-block">
      ${item.icon ? `<span class="info-icon">${item.icon}</span>` : ""}
      <span class="info-text">${item.text}</span>
    </div>
  `;
}

function renderBanner(screen) {
  return `
    <div class="banner-left">
      <h1 class="banner-title" id="banner-title">${screen.title}</h1>
      <span class="banner-subtitle">${screen.subtitle}</span>
      <span class="banner-subcopy">${screen.subcopy}</span>
    </div>
    <div class="banner-right">
      <div class="banner-stage">${screen.stage}</div>
      <span class="banner-stage-meta">${screen.stageMeta}</span>
    </div>
  `;
}

function renderCoach(screen) {
  return `
    <div class="coach-label">${screen.coachLabel}</div>
    <div class="coach-copy">${screen.coachCopy}</div>
  `;
}

function setScreen(screenKey) {
  const screen = screens[screenKey] || screens.tests;
  appShell.dataset.screen = screenKey;
  infoStrip.innerHTML = screen.info.map(renderInfoBlock).join("");
  banner.innerHTML = renderBanner(screen);
  taskArea.innerHTML = screen.task;
  responseArea.innerHTML = screen.responses;
  coachStrip.innerHTML = renderCoach(screen);
  telemetryRail.innerHTML = screen.telemetry;

  navTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.screen === screenKey);
    if (tab.dataset.screen === screenKey) {
      tab.setAttribute("aria-current", "page");
    } else {
      tab.removeAttribute("aria-current");
    }
  });

  document.title = `Trident G ${screen.title} Mock-up`;
}

function getInitialScreen() {
  const key = window.location.hash.replace("#", "").toLowerCase();
  return screens[key] ? key : "tests";
}

navTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.screen;
    if (!target) {
      return;
    }
    window.location.hash = target;
  });
});

window.addEventListener("hashchange", () => {
  setScreen(getInitialScreen());
});

window.addEventListener("keydown", (event) => {
  if (event.key === "1") window.location.hash = "tests";
  if (event.key === "2") window.location.hash = "zone";
  if (event.key === "3") window.location.hash = "capacity";
});

if (!window.location.hash || !screens[window.location.hash.replace("#", "").toLowerCase()]) {
  window.location.hash = "tests";
} else {
  setScreen(getInitialScreen());
}
