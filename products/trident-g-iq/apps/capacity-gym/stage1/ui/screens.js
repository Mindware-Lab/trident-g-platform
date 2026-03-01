import { PRIMARY_SCREENS } from "./screen-coordinator.js";

export function renderPrimaryScreen(screen, renderers) {
  if (screen === PRIMARY_SCREENS.HOME) {
    return renderers.home();
  }
  if (screen === PRIMARY_SCREENS.HUB) {
    return renderers.hub();
  }
  if (screen === PRIMARY_SCREENS.RELATIONAL) {
    return renderers.relational();
  }
  if (screen === PRIMARY_SCREENS.HISTORY) {
    return renderers.history();
  }
  return renderers.settings();
}

