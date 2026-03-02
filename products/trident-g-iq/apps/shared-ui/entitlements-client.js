(function (global) {
  "use strict";

  var CONFIG_KEY = "iqmw.auth.config.v1";

  function safeParse(raw) {
    if (!raw || typeof raw !== "string") {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function loadConfig() {
    var stored = safeParse(global.localStorage.getItem(CONFIG_KEY));
    if (stored && typeof stored === "object") {
      return stored;
    }
    return {
      entitlementsEndpoint: "",
      authToken: ""
    };
  }

  function saveConfig(config) {
    var next = {
      entitlementsEndpoint: String(config && config.entitlementsEndpoint || ""),
      authToken: String(config && config.authToken || "")
    };
    global.localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
    return next;
  }

  function clearConfig() {
    try {
      global.localStorage.removeItem(CONFIG_KEY);
    } catch (_) {}
  }

  function isConfigured() {
    var config = loadConfig();
    return Boolean(config.entitlementsEndpoint && config.authToken);
  }

  function fetchEntitlements() {
    var config = loadConfig();
    if (!config.entitlementsEndpoint || !config.authToken) {
      return Promise.resolve({
        ok: false,
        reason: "not_configured",
        entitlements: []
      });
    }
    return fetch(config.entitlementsEndpoint, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + config.authToken,
        "Accept": "application/json"
      }
    })
      .then(function (response) {
        if (!response.ok) {
          return { ok: false, reason: "http_" + response.status, entitlements: [] };
        }
        return response.json()
          .then(function (data) {
            return {
              ok: true,
              entitlements: Array.isArray(data && data.entitlements) ? data.entitlements : [],
              payload: data || {}
            };
          })
          .catch(function () {
            return { ok: false, reason: "invalid_json", entitlements: [] };
          });
      })
      .catch(function () {
        return { ok: false, reason: "network_error", entitlements: [] };
      });
  }

  global.IQEntitlementsClient = {
    CONFIG_KEY: CONFIG_KEY,
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    clearConfig: clearConfig,
    isConfigured: isConfigured,
    fetchEntitlements: fetchEntitlements
  };
})(window);

