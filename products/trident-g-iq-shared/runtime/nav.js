export function renderNav({ navItems, activeId }) {
  return navItems.map((item) => {
    const activeClass = item.id === activeId ? " is-active" : "";
    const disabled = item.disabled ? " disabled" : "";
    const current = item.id === activeId ? ' aria-current="page"' : "";

    return `<button class="nav-tab${activeClass}" type="button" data-nav="${item.id}"${disabled}${current}>${item.label}</button>`;
  }).join("");
}
