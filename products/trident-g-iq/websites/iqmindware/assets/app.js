async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) return null;
  return response.json();
}

async function renderPricing() {
  const grid = document.getElementById("pricingGrid");
  if (!grid) return;

  const matrix = await loadJson("/pricing-matrix.json");
  if (!matrix || !Array.isArray(matrix.plans)) {
    grid.innerHTML = '<p class="card">Pricing matrix unavailable.</p>';
    return;
  }

  let currency = "USD";
  const buttons = Array.from(document.querySelectorAll("[data-currency]"));

  function render() {
    buttons.forEach((btn) =>
      btn.classList.toggle("active", btn.dataset.currency === currency)
    );
    grid.innerHTML = matrix.plans
      .map((plan) => {
        const value = currency === "GBP" ? plan.price_gbp : plan.price_usd;
        const symbol = currency === "GBP" ? "GBP " : "USD ";
        const discounts = plan.discounts || {};
        const discountRows = Object.keys(discounts).length
          ? `<ul>${Object.entries(discounts)
              .map(
                ([k, v]) =>
                  `<li>${k}: ${symbol}${
                    currency === "GBP" ? v.gbp : v.usd
                  }</li>`
              )
              .join("")}</ul>`
          : "<p>No launch discount rows.</p>";
        const includes = (plan.includes || [])
          .map((x) => `<li>${x}</li>`)
          .join("");
        return `
        <article class="card pricing-card">
          <h3>${plan.label}</h3>
          <p class="price">${symbol}${value}</p>
          <p>${plan.billing}</p>
          <p><strong>Choose this if:</strong> ${plan.choose_if}</p>
          <details><summary>Includes</summary><ul>${includes}</ul></details>
          <details><summary>Launch discounts</summary>${discountRows}</details>
        </article>
      `;
      })
      .join("");
  }

  buttons.forEach((btn) =>
    btn.addEventListener("click", () => {
      currency = btn.dataset.currency;
      render();
    })
  );

  render();
}

async function renderCadence() {
  const container = document.getElementById("cadenceList");
  if (!container) return;

  const cadence = await loadJson("/proof-cadence.json");
  if (!cadence || !Array.isArray(cadence.items)) {
    container.innerHTML = "<p>Cadence data unavailable.</p>";
    return;
  }

  container.innerHTML = `<h3>Publication cadence</h3><ul>${cadence.items
    .map(
      (item) =>
        `<li><strong>${item.summary_name}:</strong> ${item.cadence} (owner: ${item.owner})</li>`
    )
    .join("")}</ul>`;
}

function normalizePath(path) {
  if (!path) return "/";
  const clean = path.split("?")[0].split("#")[0].toLowerCase();
  if (clean === "/") return "/";
  return clean.endsWith("/") ? clean : clean + "/";
}

function primaryNavPath(pathname) {
  const path = normalizePath(pathname);

  if (path.startsWith("/tools/")) return "/tools/";
  if (path.startsWith("/proof/")) return "/proof/";
  if (path.startsWith("/pricing/")) return "/pricing/";
  if (path.startsWith("/coaching/")) return "/coaching/";
  if (path.startsWith("/learn/")) return "/learn/";
  if (path.startsWith("/about/")) return "/about/";
  if (path.startsWith("/faq/")) return "/faq/";
  if (path.startsWith("/support/")) return "/support/";
  if (path.startsWith("/contact/")) return "/support/";
  if (path.startsWith("/privacy/")) return "/support/";
  if (path.startsWith("/terms/")) return "/support/";
  if (path.startsWith("/refunds/")) return "/support/";
  if (path.startsWith("/cases/")) return "/proof/";
  if (path.startsWith("/how-it-works/")) return "/start/";
  if (path.startsWith("/start/")) return "/start/";

  return null;
}

function highlightCurrentNav() {
  const navLinks = Array.from(
    document.querySelectorAll(".site-header .site-nav .nav-link")
  );
  if (!navLinks.length) return;

  navLinks.forEach((link) => {
    link.classList.remove("is-current");
    link.removeAttribute("aria-current");
  });

  const activePath = primaryNavPath(window.location.pathname);
  if (!activePath) return;

  const activeLink = navLinks.find(
    (link) => normalizePath(link.getAttribute("href")) === activePath
  );
  if (!activeLink) return;

  activeLink.classList.add("is-current");
  activeLink.setAttribute("aria-current", "page");
}

highlightCurrentNav();
renderPricing();
renderCadence();
