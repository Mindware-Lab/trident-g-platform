export function buildShellViewModel(state) {
  return {
    streakCurrent: Number(state?.settings?.streakCurrent || 0),
    bankUnits: Number(state?.bankUnits || 0)
  };
}

export function buildScreenContext({ route, hubSession, relSession, uiState }) {
  return {
    route,
    hasHubSession: Boolean(hubSession),
    hasRelSession: Boolean(relSession),
    overlay: uiState?.activeOverlay || "none"
  };
}

