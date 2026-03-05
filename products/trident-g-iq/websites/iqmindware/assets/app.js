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

  let currency = "GBP";
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

renderPricing();
renderCadence();
