export function renderStatChip(label, value) {
  return `<span class="ui-chip"><span class="ui-chip-label">${label}</span><strong>${value}</strong></span>`;
}

export function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

