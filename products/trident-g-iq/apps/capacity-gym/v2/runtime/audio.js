const MAX_CONCURRENT_VOICES = 3;
const UI_TAP_DEBOUNCE_MS = 50;

const SFX_EVENT_IDS = Object.freeze([
  "ui_tap_soft",
  "session_start",
  "block_start",
  "match_primary_press",
  "match_spatial_press",
  "match_object_press",
  "trial_hit",
  "trial_false_alarm",
  "trial_miss",
  "pause_on",
  "resume_on",
  "session_stop_discard",
  "block_complete_neutral",
  "n_level_up",
  "n_level_down",
  "credit_award_small",
  "credit_award_large",
  "programme_bonus",
  "invalid_action"
]);

// Keep missing optional assets silent by default. When WAV variants are added,
// set the event's count here to enable pattern-based loading.
const ASSET_VARIANTS = Object.freeze({});

const EVENT_RATE_LIMITS = Object.freeze({
  ui_tap_soft: UI_TAP_DEBOUNCE_MS,
  match_primary_press: 35,
  match_spatial_press: 35,
  match_object_press: 35
});

const FALLBACK_PATTERNS = Object.freeze({
  ui_tap_soft: Object.freeze([{ type: "triangle", freq: 880, start: 0, dur: 0.026, gain: 0.036 }]),
  session_start: Object.freeze([
    { type: "triangle", freq: 480, start: 0, dur: 0.055, gain: 0.045 },
    { type: "triangle", freq: 720, start: 0.048, dur: 0.075, gain: 0.044 }
  ]),
  block_start: Object.freeze([
    { type: "sine", freq: 330, start: 0, dur: 0.05, gain: 0.035 },
    { type: "triangle", freq: 660, start: 0.036, dur: 0.07, gain: 0.048 }
  ]),
  match_primary_press: Object.freeze([{ type: "sine", freq: 940, start: 0, dur: 0.042, gain: 0.055 }]),
  match_spatial_press: Object.freeze([
    { type: "triangle", freq: 1120, start: 0, dur: 0.034, gain: 0.05, pan: -0.16 }
  ]),
  match_object_press: Object.freeze([
    { type: "sine", freq: 680, start: 0, dur: 0.046, gain: 0.054, pan: 0.16 },
    { type: "triangle", freq: 920, start: 0.032, dur: 0.038, gain: 0.032, pan: 0.12 }
  ]),
  trial_hit: Object.freeze([
    { type: "triangle", freq: 620, start: 0, dur: 0.052, gain: 0.068 },
    { type: "triangle", freq: 930, start: 0.048, dur: 0.066, gain: 0.064 }
  ]),
  trial_false_alarm: Object.freeze([
    { type: "triangle", freq: 410, start: 0, dur: 0.055, gain: 0.046 },
    { type: "sine", freq: 290, start: 0.038, dur: 0.075, gain: 0.038 }
  ]),
  trial_miss: Object.freeze([{ type: "sine", freq: 240, start: 0, dur: 0.105, gain: 0.038 }]),
  pause_on: Object.freeze([
    { type: "triangle", freq: 620, start: 0, dur: 0.042, gain: 0.038 },
    { type: "triangle", freq: 500, start: 0.042, dur: 0.05, gain: 0.034 }
  ]),
  resume_on: Object.freeze([
    { type: "triangle", freq: 520, start: 0, dur: 0.042, gain: 0.038 },
    { type: "triangle", freq: 700, start: 0.04, dur: 0.056, gain: 0.04 }
  ]),
  session_stop_discard: Object.freeze([
    { type: "triangle", freq: 390, start: 0, dur: 0.08, gain: 0.04 },
    { type: "sine", freq: 230, start: 0.064, dur: 0.095, gain: 0.034 }
  ]),
  block_complete_neutral: Object.freeze([
    { type: "triangle", freq: 520, start: 0, dur: 0.07, gain: 0.052 },
    { type: "sine", freq: 640, start: 0.06, dur: 0.085, gain: 0.048 }
  ]),
  n_level_up: Object.freeze([
    { type: "triangle", freq: 520, start: 0, dur: 0.07, gain: 0.07 },
    { type: "triangle", freq: 700, start: 0.064, dur: 0.08, gain: 0.066 },
    { type: "triangle", freq: 960, start: 0.13, dur: 0.11, gain: 0.06 }
  ]),
  n_level_down: Object.freeze([
    { type: "triangle", freq: 740, start: 0, dur: 0.075, gain: 0.041 },
    { type: "triangle", freq: 520, start: 0.068, dur: 0.085, gain: 0.038 },
    { type: "sine", freq: 320, start: 0.14, dur: 0.105, gain: 0.033 }
  ]),
  credit_award_small: Object.freeze([
    { type: "triangle", freq: 1180, start: 0, dur: 0.04, gain: 0.066 },
    { type: "sine", freq: 1560, start: 0.052, dur: 0.08, gain: 0.056 }
  ]),
  credit_award_large: Object.freeze([
    { type: "triangle", freq: 980, start: 0, dur: 0.055, gain: 0.078 },
    { type: "triangle", freq: 1280, start: 0.06, dur: 0.085, gain: 0.072 },
    { type: "sine", freq: 1760, start: 0.14, dur: 0.12, gain: 0.058 }
  ]),
  programme_bonus: Object.freeze([
    { type: "triangle", freq: 440, start: 0, dur: 0.08, gain: 0.064 },
    { type: "triangle", freq: 660, start: 0.07, dur: 0.1, gain: 0.066 },
    { type: "triangle", freq: 880, start: 0.16, dur: 0.12, gain: 0.06 },
    { type: "sine", freq: 1320, start: 0.28, dur: 0.16, gain: 0.046 }
  ]),
  invalid_action: Object.freeze([{ type: "sine", freq: 210, start: 0, dur: 0.05, gain: 0.028 }])
});

let audioEnabled = true;
let audioContext = null;
let preloadedP0 = false;
const eventBuffers = new Map();
const eventLoadPromises = new Map();
const lastPlayAtByEvent = new Map();
const activeVoices = new Set();

function nowMs() {
  return (typeof performance !== "undefined" && typeof performance.now === "function")
    ? performance.now()
    : Date.now();
}

function getWindowLike() {
  return typeof window !== "undefined" ? window : globalThis;
}

function getAudioContext() {
  if (audioContext) return audioContext;
  const win = getWindowLike();
  const Ctor = win.AudioContext || win.webkitAudioContext;
  if (!Ctor) return null;
  audioContext = new Ctor();
  return audioContext;
}

function resolveEventUrls(eventId) {
  const variantCount = ASSET_VARIANTS[eventId] || 0;
  const urls = [];
  for (let i = 1; i <= variantCount; i += 1) {
    urls.push(new URL(`./sfx/cg_sfx_${eventId}_${i}.wav`, import.meta.url).href);
  }
  return urls;
}

function chooseRandom(list) {
  if (!Array.isArray(list) || !list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function hasVoiceCapacity() {
  return activeVoices.size < MAX_CONCURRENT_VOICES;
}

function registerVoice(voice, durationMs = 200) {
  activeVoices.add(voice);
  const timeoutMs = Math.max(40, Math.round(durationMs + 40));
  getWindowLike().setTimeout(() => {
    activeVoices.delete(voice);
  }, timeoutMs);
}

function eventRateLimited(eventId, timestampMs) {
  const minMs = EVENT_RATE_LIMITS[eventId] || 0;
  if (minMs <= 0) return false;
  const previous = lastPlayAtByEvent.get(eventId);
  if (Number.isFinite(previous) && (timestampMs - previous) < minMs) return true;
  lastPlayAtByEvent.set(eventId, timestampMs);
  return false;
}

async function loadEventBuffers(eventId) {
  if (!SFX_EVENT_IDS.includes(eventId)) return [];
  if (eventBuffers.has(eventId)) return eventBuffers.get(eventId);
  const urls = resolveEventUrls(eventId);
  if (!urls.length || typeof fetch !== "function") {
    eventBuffers.set(eventId, []);
    return [];
  }
  const pending = eventLoadPromises.get(eventId);
  if (pending) return pending;
  const loadPromise = (async () => {
    const ctx = getAudioContext();
    if (!ctx) {
      eventBuffers.set(eventId, []);
      return [];
    }
    const decoded = [];
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
        decoded.push(audioBuffer);
      } catch {
        // Missing or invalid optional assets are allowed; synth fallback is used.
      }
    }
    eventBuffers.set(eventId, decoded);
    return decoded;
  })();
  eventLoadPromises.set(eventId, loadPromise);
  try {
    return await loadPromise;
  } finally {
    eventLoadPromises.delete(eventId);
  }
}

function preloadEvents(eventIds) {
  const safeIds = Array.isArray(eventIds) ? eventIds.filter((id) => SFX_EVENT_IDS.includes(id)) : [];
  safeIds.forEach((eventId) => {
    loadEventBuffers(eventId).catch(() => {});
  });
}

function connectWithOptionalPan(ctx, sourceNode, gainNode, panValue = 0) {
  if (typeof ctx.createStereoPanner !== "function" || !Number.isFinite(panValue) || Math.abs(panValue) < 0.01) {
    sourceNode.connect(gainNode);
    return;
  }
  const panNode = ctx.createStereoPanner();
  panNode.pan.setValueAtTime(Math.max(-0.35, Math.min(0.35, panValue)), ctx.currentTime);
  sourceNode.connect(panNode);
  panNode.connect(gainNode);
}

function playFallbackPattern(ctx, eventId) {
  const pattern = FALLBACK_PATTERNS[eventId];
  if (!Array.isArray(pattern) || !pattern.length || !hasVoiceCapacity()) return false;
  const startAt = ctx.currentTime + 0.001;
  const voice = { id: `fallback:${eventId}:${Math.random().toString(36).slice(2, 8)}` };
  let maxEnd = startAt;

  for (const tone of pattern) {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const start = startAt + (tone.start || 0);
    const duration = Math.max(0.015, tone.dur || 0.05);
    const end = start + duration;
    const attack = Math.min(0.012, duration * 0.35);
    const release = Math.min(0.04, duration * 0.45);
    const peak = Math.max(0.001, tone.gain || 0.035);
    const detune = (Math.random() - 0.5) * 9;

    osc.type = tone.type || "triangle";
    osc.frequency.setValueAtTime(Math.max(80, tone.freq || 440), start);
    osc.detune.setValueAtTime(detune, start);

    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.linearRampToValueAtTime(peak, start + attack);
    gainNode.gain.linearRampToValueAtTime(0.0001, Math.max(start + attack + 0.005, end - release));

    connectWithOptionalPan(ctx, osc, gainNode, tone.pan || 0);
    gainNode.connect(ctx.destination);
    osc.start(start);
    osc.stop(end + 0.01);
    maxEnd = Math.max(maxEnd, end);
  }

  registerVoice(voice, (maxEnd - startAt) * 1000);
  return true;
}

function playBufferEvent(ctx, eventId) {
  const buffers = eventBuffers.get(eventId);
  if (!Array.isArray(buffers) || !buffers.length || !hasVoiceCapacity()) return false;
  const buffer = chooseRandom(buffers);
  if (!buffer) return false;
  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  source.buffer = buffer;
  source.playbackRate.value = 1 + ((Math.random() - 0.5) * 0.03);
  gainNode.gain.value = 0.72;
  source.connect(gainNode);
  gainNode.connect(ctx.destination);

  const voice = { id: `buffer:${eventId}:${Math.random().toString(36).slice(2, 8)}` };
  activeVoices.add(voice);
  source.onended = () => {
    activeVoices.delete(voice);
  };
  source.start();
  return true;
}

function playNow(eventId) {
  if (!audioEnabled || !SFX_EVENT_IDS.includes(eventId)) return false;
  const ctx = getAudioContext();
  if (!ctx) return false;
  if (ctx.state !== "running") {
    try {
      const maybePromise = ctx.resume();
      if (maybePromise && typeof maybePromise.catch === "function") maybePromise.catch(() => {});
    } catch {
      return false;
    }
    if (ctx.state !== "running") return false;
  }
  if (playBufferEvent(ctx, eventId)) return true;
  return playFallbackPattern(ctx, eventId);
}

export function initAudio(options = {}) {
  const enabled = options && typeof options === "object" && typeof options.enabled === "boolean"
    ? options.enabled
    : audioEnabled;
  const preloadTier = options && typeof options === "object" && typeof options.preloadTier === "string"
    ? options.preloadTier
    : "p0";

  setAudioEnabled(enabled);
  getAudioContext();

  if (preloadTier === "p0" && !preloadedP0) {
    preloadEvents(["match_primary_press", "match_spatial_press", "match_object_press", "trial_hit", "trial_false_alarm", "pause_on", "resume_on"]);
    preloadedP0 = true;
  }
}

export function unlockAudioContextFromUserGesture() {
  const ctx = getAudioContext();
  if (!ctx) return false;
  try {
    const maybePromise = ctx.resume();
    if (maybePromise && typeof maybePromise.catch === "function") maybePromise.catch(() => {});
    return true;
  } catch {
    return false;
  }
}

export function setAudioEnabled(enabled) {
  audioEnabled = Boolean(enabled);
}

export function playSfx(eventId) {
  if (!audioEnabled || !SFX_EVENT_IDS.includes(eventId)) return false;
  const timestampMs = nowMs();
  if (eventRateLimited(eventId, timestampMs)) return false;
  loadEventBuffers(eventId).catch(() => {});
  return playNow(eventId);
}
