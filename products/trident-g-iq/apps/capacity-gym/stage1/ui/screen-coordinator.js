export const PRIMARY_SCREENS = Object.freeze({
  HOME: "home",
  HUB: "play-hub",
  EMOTION: "play-emotion",
  RELATIONAL: "play-relational",
  HISTORY: "history",
  SETTINGS: "settings"
});

export function resolvePrimaryScreen({ route }) {
  if (route === "home") {
    return PRIMARY_SCREENS.HOME;
  }
  if (route === "play-hub") {
    return PRIMARY_SCREENS.HUB;
  }
  if (route === "play-emotion") {
    return PRIMARY_SCREENS.EMOTION;
  }
  if (route === "play-relational") {
    return PRIMARY_SCREENS.RELATIONAL;
  }
  if (route === "history") {
    return PRIMARY_SCREENS.HISTORY;
  }
  return PRIMARY_SCREENS.SETTINGS;
}

export function resolveOverlayScreen({ showSplash, activeOverlay }) {
  if (showSplash) {
    return "splash";
  }
  if (activeOverlay === "briefing") {
    return "briefing";
  }
  if (activeOverlay === "unlock-celebration") {
    return "unlock-celebration";
  }
  return "none";
}
