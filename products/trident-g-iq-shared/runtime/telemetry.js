function toneClass(tone) {
  return tone ? ` metric-row-value--${tone}` : "";
}

function renderFooter(footer) {
  if (!footer) {
    return "";
  }

  return `
    <div class="footer-row">
      <span>${footer.left}</span>
      <span class="${toneClass(footer.rightTone).trim()}">${footer.right}</span>
    </div>
  `;
}

function renderMetricValue(value, tone) {
  const classes = ["metric-value"];
  if (tone === "accent") classes.push("is-accent");
  if (tone === "credit") classes.push("is-credit");
  if (tone === "transfer") classes.push("is-transfer");
  return `<div class="${classes.join(" ")}">${value}</div>`;
}

function renderLabel(card) {
  const classes = ["metric-label"];
  if (card.labelClass) {
    classes.push(card.labelClass);
  }

  return `<div class="${classes.join(" ")}">${card.label || "Telemetry"}</div>`;
}

function renderCard(card) {
  const emphasis = card.emphasis ? " telemetry-card--emphasis" : "";

  switch (card.type) {
    case "splitMetric":
      return `
        <section class="telemetry-card${emphasis}">
          ${renderLabel(card)}
          <div class="metric-split">
            <div>
              ${renderMetricValue(card.value, card.valueTone)}
              ${card.subline ? `<div class="metric-subline">${card.subline}</div>` : ""}
            </div>
            ${card.badge ? `<div class="metric-badge">${card.badge}</div>` : ""}
          </div>
        </section>
      `;
    case "metric":
      return `
        <section class="telemetry-card${emphasis}">
          ${renderLabel(card)}
          ${renderMetricValue(card.value, card.valueTone)}
          ${card.subline ? `<div class="metric-subline">${card.subline}</div>` : ""}
          ${renderFooter(card.footer)}
        </section>
      `;
    case "barMetric":
      return `
        <section class="telemetry-card${emphasis}">
          ${renderLabel(card)}
          ${renderMetricValue(card.value, card.valueTone)}
          <div class="mini-bar">
            <div class="bar-track"><div class="bar-fill${card.barTone ? ` bar-fill--${card.barTone}` : ""}" style="width: ${card.barValue}%;"></div></div>
          </div>
          ${card.subline ? `<div class="metric-subline">${card.subline}</div>` : ""}
        </section>
      `;
    case "ring":
      return `
        <section class="telemetry-card${emphasis}">
          ${renderLabel(card)}
          <div class="ring${card.variant === "violet" ? " ring--violet" : ""}" style="--ring-value: ${card.ringValue};">
            <div class="ring-value">
              <span class="ring-number">${card.ringNumber}</span>
              <span class="ring-label">${card.ringLabel}</span>
            </div>
          </div>
          ${card.subline ? `<div class="metric-subline">${card.subline}</div>` : ""}
        </section>
      `;
    case "list":
      return `
        <section class="telemetry-card${emphasis}">
          ${renderLabel(card)}
          <div class="state-list">
            ${card.rows.map((row) => `<div class="state-row"><span>${row.label}</span><span class="${toneClass(row.tone).trim()}">${row.value}</span></div>`).join("")}
          </div>
          ${renderFooter(card.footer)}
        </section>
      `;
    case "badge":
      return `
        <section class="telemetry-card${emphasis}">
          ${renderLabel(card)}
          <div class="metric-badge"${card.badgeState ? ` data-state="${card.badgeState}"` : ""}>${card.badge}</div>
          ${card.subline ? `<div class="metric-subline">${card.subline}</div>` : ""}
          ${renderFooter(card.footer)}
        </section>
      `;
    case "signalProfile":
      return `
        <section class="telemetry-card${emphasis}">
          ${renderLabel(card)}
          <div class="signal-row">
            ${card.bars.map((bar) => `
              <div class="state-row"><span>${bar.label}</span><span>${bar.value}</span></div>
              <div class="bar-track"><div class="bar-fill${bar.tone ? ` bar-fill--${bar.tone}` : ""}" style="width: ${bar.percent}%;"></div></div>
            `).join("")}
          </div>
        </section>
      `;
    case "routing":
      return `
        <section class="telemetry-card${emphasis}">
          ${renderLabel(card)}
          <div class="routing-card">
            <div class="routing-title">${card.title}</div>
            <div class="routing-subtitle">${card.subtitle}</div>
          </div>
          ${renderFooter(card.footer)}
        </section>
      `;
    case "sparkline":
      return `
        <section class="telemetry-card${emphasis}">
          ${renderLabel(card)}
          ${renderMetricValue(card.value, card.valueTone)}
          <svg class="sparkline" viewBox="0 0 180 36" preserveAspectRatio="none" aria-hidden="true">
            <polyline fill="none" stroke="${card.stroke || "rgba(84, 162, 255, 0.95)"}" stroke-width="2" points="${card.points}"></polyline>
          </svg>
          ${card.subline ? `<div class="metric-subline">${card.subline}</div>` : ""}
        </section>
      `;
    case "streak":
      return `
        <section class="telemetry-card${emphasis}">
          ${renderLabel(card)}
          ${card.lines.map((line) => `<div class="metric-subline">${line}</div>`).join("")}
          <div class="streak-blocks">
            ${Array.from({ length: card.streakTotal }, (_, index) => `<span${index < card.streakOn ? ' class="is-on"' : ""}></span>`).join("")}
          </div>
          ${renderFooter(card.footer)}
        </section>
      `;
    default:
      return `
        <section class="telemetry-card${emphasis}">
          ${renderLabel(card)}
          ${card.html || ""}
        </section>
      `;
  }
}

export function renderTelemetryCards(cards) {
  return cards.map(renderCard).join("");
}
