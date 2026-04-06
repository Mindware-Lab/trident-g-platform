function readHashId() {
  return window.location.hash.replace(/^#/, "").trim().toLowerCase();
}

export function createHashRouter({ registry, defaultRouteId, onChange }) {
  function resolveCurrentId() {
    const routeId = readHashId();
    return registry.has(routeId) ? routeId : defaultRouteId;
  }

  function renderCurrent() {
    onChange(resolveCurrentId());
  }

  window.addEventListener("hashchange", renderCurrent);

  return {
    go(id) {
      if (!registry.has(id)) {
        return;
      }

      if (readHashId() === id) {
        onChange(id);
        return;
      }

      window.location.hash = id;
    },
    start() {
      const routeId = readHashId();
      if (!registry.has(routeId)) {
        window.location.hash = defaultRouteId;
        return;
      }

      onChange(routeId);
    }
  };
}
