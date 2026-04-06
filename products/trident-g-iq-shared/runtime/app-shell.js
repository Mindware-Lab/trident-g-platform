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
  const detail = screen.coach.detail ? `<span class="coach-detail">${screen.coach.detail}</span>` : "";

  return `
    <div class="coach-label">${screen.coach.label}</div>
    <div class="coach-copy"><strong>${screen.coach.headline}</strong>${screen.coach.body ? ` ${screen.coach.body}` : ""}${detail}</div>
  `;
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
  function renderScreen(screenId) {
    const screen = registry.get(screenId) || registry.get(defaultScreenId) || registry.first();
    const activeModule = screen.module || screen.id;

    root.innerHTML = `
      <div class="page-frame">
        <div class="app-shell" data-app-kind="${appKind}" data-screen="${activeModule}">
          <header class="top-nav" aria-label="Primary navigation">
            <div class="wordmark">${wordmark}</div>
            <nav class="nav-tabs">${renderNav({ navItems, activeId: screen.id })}</nav>
          </header>
          <main class="play-stage">
            <div class="play-layout">
              <section class="play-column">
                <div class="info-strip" aria-live="polite">${screen.info.map(renderInfoBlock).join("")}</div>
                <article class="game-window frame-corners" aria-labelledby="banner-title">
                  <header class="game-window__banner">${renderBanner(screen)}</header>
                  <div class="game-window__body">
                    <div class="task-area">${screen.taskHtml}</div>
                    <div class="response-area">${screen.responseHtml}</div>
                  </div>
                </article>
                <aside class="coach-strip">${renderCoach(screen)}</aside>
              </section>
              <aside class="telemetry-rail" aria-label="Telemetry">${renderTelemetryCards(screen.telemetryCards)}</aside>
            </div>
          </main>
        </div>
      </div>
    `;

    root.querySelectorAll("[data-nav]").forEach((button) => {
      button.addEventListener("click", () => router.go(button.dataset.nav));
    });

    root.querySelectorAll("[data-go]").forEach((button) => {
      button.addEventListener("click", () => router.go(button.dataset.go));
    });

    document.title = `${titlePrefix} - ${screen.banner.title}`;
  }

  const router = createHashRouter({
    registry,
    defaultRouteId: defaultScreenId,
    onChange: renderScreen
  });

  router.start();
  return router;
}
