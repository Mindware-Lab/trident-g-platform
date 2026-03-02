(function (global) {
  "use strict";

  var ACTIVATION_KEY = "iqmw.activation.v1";
  var manifestCache = {};

  var MANIFEST_FALLBACK = Object.freeze([
    Object.freeze({ bundleId: "g_tracker", label: "G Tracker", includedAppIds: ["g_tracker"] }),
    Object.freeze({ bundleId: "zone_coach", label: "Zone Coach", includedAppIds: ["zone_coach"] }),
    Object.freeze({ bundleId: "performance_bundle", label: "Performance Bundle", includedAppIds: ["zone_coach", "capacity_gym", "g_tracker"] }),
    Object.freeze({ bundleId: "cohort_bundle", label: "Cohort Bundle", includedAppIds: ["zone_coach", "capacity_gym", "g_tracker"] }),
    Object.freeze({ bundleId: "premium_1to1", label: "1:1 Premium", includedAppIds: ["zone_coach", "capacity_gym", "g_tracker"] })
  ]);

  var BUNDLE_CODES = Object.freeze({
    "GTRACKER-2026": "g_tracker",
    "ZONE-2026": "zone_coach",
    "PERFORMANCE-2026": "performance_bundle",
    "COHORT-2026": "cohort_bundle",
    "PREMIUM-2026": "premium_1to1"
  });

  function normalizeCode(value) {
    return String(value || "").trim().toUpperCase();
  }

  function safeParse(json) {
    if (!json || typeof json !== "string") {
      return null;
    }
    try {
      return JSON.parse(json);
    } catch (_) {
      return null;
    }
  }

  function loadActivation() {
    try {
      var parsed = safeParse(global.localStorage.getItem(ACTIVATION_KEY));
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function deriveUnlockedAppIds(bundleId, manifests) {
    for (var i = 0; i < manifests.length; i += 1) {
      var row = manifests[i];
      if (row && row.bundleId === bundleId && Array.isArray(row.includedAppIds)) {
        return row.includedAppIds.slice();
      }
    }
    return [];
  }

  function saveActivation(bundleId, manifests, source) {
    var activation = {
      isActive: true,
      activatedAt: new Date().toISOString(),
      bundleId: bundleId,
      source: source || "manual",
      version: 1,
      unlockedAppIds: deriveUnlockedAppIds(bundleId, manifests)
    };
    global.localStorage.setItem(ACTIVATION_KEY, JSON.stringify(activation));
    return activation;
  }

  function clearActivation() {
    try {
      global.localStorage.removeItem(ACTIVATION_KEY);
    } catch (_) {}
  }

  function getBundleById(bundleId, manifests) {
    for (var i = 0; i < manifests.length; i += 1) {
      if (manifests[i] && manifests[i].bundleId === bundleId) {
        return manifests[i];
      }
    }
    return null;
  }

  function bundleIncludesApp(bundleId, appId, manifests) {
    var bundle = getBundleById(bundleId, manifests);
    if (!bundle || !Array.isArray(bundle.includedAppIds)) {
      return false;
    }
    return bundle.includedAppIds.indexOf(appId) !== -1;
  }

  function activationAllowsApp(activation, appId, manifests) {
    if (!activation || activation.isActive !== true || !activation.bundleId) {
      return false;
    }
    return bundleIncludesApp(activation.bundleId, appId, manifests);
  }

  function resolveCodeBundle(code) {
    var normalized = normalizeCode(code);
    return BUNDLE_CODES[normalized] || null;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function ensureModalStyles() {
    if (document.getElementById("iq-activation-style")) {
      return;
    }
    var style = document.createElement("style");
    style.id = "iq-activation-style";
    style.textContent = [
      ".iq-activation-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,11,16,.76);}",
      ".iq-activation-card{width:min(520px,calc(100% - 24px));border:1px solid rgba(255,255,255,.15);border-radius:16px;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.012)),rgba(15,18,26,.96);box-shadow:0 12px 28px rgba(0,0,0,.34);padding:16px;color:#edf0f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;}",
      ".iq-activation-card h3{margin:0;font-size:1.2rem;font-weight:900;letter-spacing:-.01em;}",
      ".iq-activation-card p{margin:8px 0 0 0;color:#d5dceb;line-height:1.45;}",
      ".iq-activation-note{margin-top:10px;border:1px solid rgba(110,198,255,.3);border-radius:12px;padding:9px 10px;background:rgba(110,198,255,.1);font-size:.86rem;}",
      ".iq-activation-row{margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;}",
      ".iq-activation-input{flex:1 1 220px;min-height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:#1d2230;color:#edf0f7;padding:9px 10px;font-size:14px;}",
      ".iq-activation-btn{min-height:42px;border-radius:12px;border:1px solid #ccff66;background:#ccff66;color:#0b0b0d;font-weight:900;padding:10px 12px;cursor:pointer;}",
      ".iq-activation-btn:disabled{opacity:.6;cursor:not-allowed;}",
      ".iq-activation-status{margin-top:10px;font-size:.85rem;color:#ffb3c8;min-height:18px;}",
      ".iq-activation-meta{margin-top:10px;font-size:.8rem;color:#93a0b4;}"
    ].join("");
    document.head.appendChild(style);
  }

  function renderModal(opts, manifests, onSuccess) {
    ensureModalStyles();
    var existing = document.getElementById("iq-activation-overlay");
    if (existing) {
      existing.remove();
    }

    var overlay = document.createElement("div");
    overlay.className = "iq-activation-overlay";
    overlay.id = "iq-activation-overlay";

    var bundleHint = opts.bundleIdHint ? getBundleById(opts.bundleIdHint, manifests) : null;
    var hintLabel = bundleHint && bundleHint.label ? bundleHint.label : opts.bundleIdHint;
    var appLabel = opts.appLabel || "this app";

    overlay.innerHTML = [
      '<div class="iq-activation-card">',
      "<h3>Activate Access</h3>",
      "<p>Enter your activation code to use " + escapeHtml(appLabel) + " on this device.</p>",
      (hintLabel ? "<p>Bundle context: <strong>" + escapeHtml(hintLabel) + "</strong></p>" : ""),
      '<div class="iq-activation-note">Device-based activation (temporary while account login rolls out). Clearing site data or switching device/browser requires re-entry.</div>',
      '<div class="iq-activation-row">',
      '<input id="iqActivationCodeInput" class="iq-activation-input" type="text" autocomplete="off" placeholder="Enter activation code">',
      '<button id="iqActivationCodeBtn" class="iq-activation-btn" type="button">Activate</button>',
      "</div>",
      '<div id="iqActivationStatus" class="iq-activation-status"></div>',
      '<div class="iq-activation-meta">Activation is stored under <code>' + ACTIVATION_KEY + "</code>.</div>",
      "</div>"
    ].join("");

    document.body.appendChild(overlay);

    var input = overlay.querySelector("#iqActivationCodeInput");
    var button = overlay.querySelector("#iqActivationCodeBtn");
    var status = overlay.querySelector("#iqActivationStatus");

    function setStatus(message) {
      if (status) {
        status.textContent = message || "";
      }
    }

    function attemptActivate() {
      if (!button || !input) {
        return;
      }
      button.disabled = true;
      var rawCode = normalizeCode(input.value);
      if (!rawCode) {
        setStatus("Enter a code first.");
        button.disabled = false;
        input.focus();
        return;
      }

      var bundleId = resolveCodeBundle(rawCode);
      if (!bundleId) {
        setStatus("That code is not valid.");
        button.disabled = false;
        return;
      }

      var activation = saveActivation(bundleId, manifests, "manual");
      if (opts.appId && !activationAllowsApp(activation, opts.appId, manifests)) {
        var bundle = getBundleById(bundleId, manifests);
        var label = bundle && bundle.label ? bundle.label : bundleId;
        setStatus("Code accepted for " + label + ", but it does not include this app.");
        button.disabled = false;
        return;
      }

      overlay.remove();
      if (typeof onSuccess === "function") {
        onSuccess(activation);
      }
    }

    button.addEventListener("click", attemptActivate);
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        attemptActivate();
      }
    });
    input.focus();
  }

  function loadManifests(manifestUrl) {
    var key = manifestUrl || "__default__";
    if (manifestCache[key]) {
      return Promise.resolve(manifestCache[key]);
    }

    if (!manifestUrl || typeof fetch !== "function") {
      manifestCache[key] = MANIFEST_FALLBACK.slice();
      return Promise.resolve(manifestCache[key]);
    }

    return fetch(manifestUrl, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          return MANIFEST_FALLBACK.slice();
        }
        return response.json()
          .then(function (data) {
            return Array.isArray(data) ? data : MANIFEST_FALLBACK.slice();
          })
          .catch(function () {
            return MANIFEST_FALLBACK.slice();
          });
      })
      .catch(function () {
        return MANIFEST_FALLBACK.slice();
      })
      .then(function (rows) {
        manifestCache[key] = rows;
        return rows;
      });
  }

  function requestActivation(opts) {
    var safeOpts = opts || {};
    return loadManifests(safeOpts.manifestUrl).then(function (manifests) {
      return new Promise(function (resolve) {
        renderModal(safeOpts, manifests, function (activation) {
          resolve({ ok: true, activation: activation, manifests: manifests });
        });
      });
    });
  }

  function enforceAppActivation(opts) {
    var safeOpts = opts || {};
    return loadManifests(safeOpts.manifestUrl).then(function (manifests) {
      var activation = loadActivation();
      if (activationAllowsApp(activation, safeOpts.appId, manifests)) {
        return true;
      }
      return new Promise(function (resolve) {
        renderModal(safeOpts, manifests, function () {
          resolve(true);
        });
      });
    });
  }

  function getAccessState(opts) {
    var safeOpts = opts || {};
    return loadManifests(safeOpts.manifestUrl).then(function (manifests) {
      var activation = loadActivation();
      return {
        activation: activation,
        manifests: manifests,
        allowed: activationAllowsApp(activation, safeOpts.appId, manifests)
      };
    });
  }

  global.IQActivationGate = {
    ACTIVATION_KEY: ACTIVATION_KEY,
    loadActivation: loadActivation,
    clearActivation: clearActivation,
    deriveUnlockedAppIds: deriveUnlockedAppIds,
    loadManifests: loadManifests,
    requestActivation: requestActivation,
    enforceAppActivation: enforceAppActivation,
    getAccessState: getAccessState,
    activationAllowsApp: activationAllowsApp
  };
})(window);

