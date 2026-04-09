import { renderNav } from "./nav.js";
import { createHashRouter } from "./router.js";
import { renderTelemetryCards } from "./telemetry.js";

function renderInfoBlock(item) {
  if (item.kind === "credit") {
    return `
      <div class="info-block is-credit">
        <span class="credit-pill"><strong>${item.text}</strong></span>
      </div>
    `;
  }

  if (item.kind === "pill") {
    return `
      <div class="info-block">
        <span class="state-pill" data-tone="${item.tone || "muted"}">${item.text}</span>
      </div>
    `;
  }

  if (item.label && item.value) {
    return `
      <div class="info-block">
        ${item.icon ? `<span class="info-icon">${item.icon}</span>` : ""}
        <span class="info-label">${item.label}</span>
        <span class="info-value" data-tone="${item.tone || "default"}">${item.value}</span>
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
  if (screen.bannerHtml) {
    return screen.bannerHtml;
  }

  return `
    <div class="banner-left">
      <h1 class="banner-title" id="banner-title">${screen.banner.title}</h1>
      <span class="banner-subtitle">${screen.banner.subtitle}</span>
      <span class="banner-subcopy">${screen.banner.subcopy}</span>
    </div>
    <div class="banner-right">
      <div class="banner-stage">${screen.banner.stage}</div>
      <span class="banner-stage-meta">${screen.banner.stageMeta}</span>
    </div>
  `;
}

function renderCoach(screen) {
  if (screen.coachHtml) {
    return screen.coachHtml;
  }

  const detail = screen.coach.detail ? `<span class="coach-detail">${screen.coach.detail}</span>` : "";

  return `
    <div class="coach-label">${screen.coach.label}</div>
    <div class="coach-copy"><strong>${screen.coach.headline}</strong>${screen.coach.body ? ` ${screen.coach.body}` : ""}${detail}</div>
  `;
}

function renderStandardLayout(screen) {
  const sidePanel = screen.sidePanelHtml
    ? `<aside class="play-side-panel${screen.sidePanelClass ? ` ${screen.sidePanelClass}` : ""}">${screen.sidePanelHtml}</aside>`
    : "";

  return `
    <div class="play-layout">
      <section class="play-column">
        <div class="info-strip" aria-live="polite">${screen.info.map(renderInfoBlock).join("")}</div>
        <div class="play-main${screen.sidePanelHtml ? " play-main--split" : ""}">
          ${sidePanel}
          <article class="game-window frame-corners" aria-labelledby="banner-title">
            <header class="game-window__banner">${renderBanner(screen)}</header>
            <div class="game-window__body">
              <div class="task-area">${screen.taskHtml}</div>
              <div class="response-area">${screen.responseHtml}</div>
            </div>
          </article>
        </div>
        <aside class="coach-strip">${renderCoach(screen)}</aside>
      </section>
      <aside class="telemetry-rail" aria-label="Telemetry">${renderTelemetryCards(screen.telemetryCards)}</aside>
    </div>
  `;
}

function renderScreenStage(screen) {
  if (screen.layout === "dashboard" && screen.dashboardHtml) {
    return {
      className: "play-stage play-stage--dashboard",
      html: screen.dashboardHtml
    };
  }

  return {
    className: "play-stage",
    html: renderStandardLayout(screen)
  };
}

function wireViewGroups(container) {
  const groups = new Map();
  container.querySelectorAll("[data-view-group][data-view-value]").forEach((trigger) => {
    const group = trigger.dataset.viewGroup;
    if (!group) return;
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group).push(trigger);
  });

  groups.forEach((triggers, group) => {
    const panels = Array.from(container.querySelectorAll(`[data-view-group="${group}"][data-view-panel]`));
    if (!panels.length) {
      return;
    }

    const selectValue = (value) => {
      triggers.forEach((trigger) => {
        const active = trigger.dataset.viewValue === value;
        trigger.classList.toggle("is-active", active);
        trigger.setAttribute("aria-pressed", active ? "true" : "false");
        trigger.setAttribute("aria-selected", active ? "true" : "false");
        trigger.tabIndex = active ? 0 : -1;
      });

      panels.forEach((panel) => {
        const active = panel.dataset.viewPanel === value;
        panel.hidden = !active;
        panel.classList.toggle("is-active", active);
      });
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => selectValue(trigger.dataset.viewValue));
    });

    const initial = triggers.find((trigger) => trigger.classList.contains("is-active")) || triggers[0];
    if (initial?.dataset?.viewValue) {
      selectValue(initial.dataset.viewValue);
    }
  });
}

export function mountAppShell({
  root,
  appKind,
  titlePrefix,
  navItems,
  registry,
  defaultScreenId,
  wordmark = "TRIDENT<span>G</span>"
}) {
  let activeUnmount = null;

  function teardownMountedScreen() {
    if (typeof activeUnmount === "function") {
      activeUnmount();
    }
    activeUnmount = null;
  }

  function renderScreen(screenId) {
    teardownMountedScreen();
    const screen = registry.get(screenId) || registry.get(defaultScreenId) || registry.first();
    const activeModule = screen.module || screen.id;
    const stage = renderScreenStage(screen);

    root.innerHTML = `
      <div class="page-frame">
        <div class="app-shell" data-app-kind="${appKind}" data-screen="${activeModule}">
          <header class="top-nav" aria-label="Primary navigation">
            <div class="wordmark">${wordmark}</div>
            <nav class="nav-tabs">${renderNav({ navItems, activeId: screen.navActiveId || screen.id })}</nav>
          </header>
          <main class="${stage.className}">${stage.html}</main>
        </div>
      </div>
    `;

    root.querySelectorAll("[data-nav]").forEach((button) => {
      button.addEventListener("click", () => router.go(button.dataset.nav));
    });

    root.querySelectorAll("[data-go]").forEach((button) => {
      button.addEventListener("click", () => router.go(button.dataset.go));
    });

    wireViewGroups(root);

    document.title = `${titlePrefix} - ${screen.banner.title}`;

    if (typeof screen.mount === "function") {
      activeUnmount = screen.mount({
        root,
        screen,
        router
      }) || null;
    }
  }

  const router = createHashRouter({
    registry,
    defaultRouteId: defaultScreenId,
    onChange: renderScreen
  });

  router.start();
  return router;
}
