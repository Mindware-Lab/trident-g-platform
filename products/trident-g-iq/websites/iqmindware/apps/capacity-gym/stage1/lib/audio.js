const MAX_CONCURRENT_VOICES = 3;
const UI_TAP_DEBOUNCE_MS = 50;
const WARNING_MIN_INTERVAL_MS = 200;

const SFX_EVENT_IDS = Object.freeze([
  "ui_tap_soft",
  "game_match_press",
  "trial_hit",
  "trial_false_alarm",
  "trial_miss",
  "pause_on",
  "resume_on",
  "session_stop_discard",
  "quiz_answer_lock",
  "quiz_correct",
  "quiz_incorrect",
  "quiz_timeout",
  "block_complete_neutral",
  "n_level_up",
  "n_level_down",
  "coach_next_block",
  "session_complete",
  "bank_units_awarded",
  "mission_bonus_awarded",
  "unlock_relational",
  "warning_flash"
]);

const PRELOAD_P0 = Object.freeze([
  "game_match_press",
  "trial_hit",
  "trial_false_alarm",
  "pause_on",
  "resume_on"
]);

const EVENT_VARIANTS = Object.freeze({
  ui_tap_soft: 2,
  game_match_press: 3,
  trial_hit: 3,
  trial_false_alarm: 3,
  trial_miss: 2
});

const EVENT_RATE_LIMITS = Object.freeze({
  ui_tap_soft: UI_TAP_DEBOUNCE_MS,
  warning_flash: WARNING_MIN_INTERVAL_MS
});

const FALLBACK_PATTERNS = Object.freeze({
  ui_tap_soft: Object.freeze([{ type: "triangle", freq: 780, start: 0, dur: 0.03, gain: 0.055 }]),
  game_match_press: Object.freeze([{ type: "sine", freq: 920, start: 0, dur: 0.045, gain: 0.07 }]),
  trial_hit: Object.freeze([
    { type: "triangle", freq: 620, start: 0, dur: 0.055, gain: 0.07 },
    { type: "triangle", freq: 920, start: 0.05, dur: 0.065, gain: 0.065 }
  ]),
  trial_false_alarm: Object.freeze([
    { type: "triangle", freq: 450, start: 0, dur: 0.06, gain: 0.065 },
    { type: "sine", freq: 320, start: 0.04, dur: 0.07, gain: 0.06 }
  ]),
  trial_miss: Object.freeze([{ type: "sine", freq: 260, start: 0, dur: 0.12, gain: 0.055 }]),
  pause_on: Object.freeze([
    { type: "triangle", freq: 620, start: 0, dur: 0.045, gain: 0.06 },
    { type: "triangle", freq: 520, start: 0.045, dur: 0.055, gain: 0.055 }
  ]),
  resume_on: Object.freeze([
    { type: "triangle", freq: 540, start: 0, dur: 0.045, gain: 0.06 },
    { type: "triangle", freq: 700, start: 0.045, dur: 0.055, gain: 0.06 }
  ]),
  session_stop_discard: Object.freeze([
    { type: "triangle", freq: 420, start: 0, dur: 0.09, gain: 0.06 },
    { type: "sine", freq: 250, start: 0.07, dur: 0.1, gain: 0.055 }
  ]),
  quiz_answer_lock: Object.freeze([{ type: "sine", freq: 860, start: 0, dur: 0.03, gain: 0.055 }]),
  quiz_correct: Object.freeze([
    { type: "triangle", freq: 700, start: 0, dur: 0.055, gain: 0.07 },
    { type: "triangle", freq: 980, start: 0.05, dur: 0.08, gain: 0.065 }
  ]),
  quiz_incorrect: Object.freeze([
    { type: "triangle", freq: 420, start: 0, dur: 0.06, gain: 0.065 },
    { type: "triangle", freq: 300, start: 0.05, dur: 0.08, gain: 0.06 }
  ]),
  quiz_timeout: Object.freeze([
    { type: "triangle", freq: 360, start: 0, dur: 0.08, gain: 0.055 },
    { type: "triangle", freq: 360, start: 0.11, dur: 0.08, gain: 0.05 }
  ]),
  block_complete_neutral: Object.freeze([
    { type: "triangle", freq: 520, start: 0, dur: 0.08, gain: 0.06 },
    { type: "sine", freq: 620, start: 0.07, dur: 0.1, gain: 0.055 }
  ]),
  n_level_up: Object.freeze([
    { type: "triangle", freq: 520, start: 0, dur: 0.08, gain: 0.07 },
    { type: "triangle", freq: 700, start: 0.07, dur: 0.09, gain: 0.067 },
    { type: "triangle", freq: 920, start: 0.14, dur: 0.12, gain: 0.064 }
  ]),
  n_level_down: Object.freeze([
    { type: "triangle", freq: 720, start: 0, dur: 0.09, gain: 0.065 },
    { type: "triangle", freq: 520, start: 0.08, dur: 0.1, gain: 0.06 },
    { type: "sine", freq: 340, start: 0.16, dur: 0.11, gain: 0.055 }
  ]),
  coach_next_block: Object.freeze([
    { type: "triangle", freq: 620, start: 0, dur: 0.07, gain: 0.055 },
    { type: "triangle", freq: 760, start: 0.06, dur: 0.08, gain: 0.05 }
  ]),
  session_complete: Object.freeze([
    { type: "triangle", freq: 520, start: 0, dur: 0.12, gain: 0.08 },
    { type: "triangle", freq: 780, start: 0.1, dur: 0.15, gain: 0.07 },
    { type: "triangle", freq: 1040, start: 0.22, dur: 0.22, gain: 0.062 }
  ]),
  bank_units_awarded: Object.freeze([
    { type: "triangle", freq: 980, start: 0, dur: 0.05, gain: 0.068 },
    { type: "triangle", freq: 1280, start: 0.06, dur: 0.06, gain: 0.06 }
  ]),
  mission_bonus_awarded: Object.freeze([
    { type: "triangle", freq: 760, start: 0, dur: 0.08, gain: 0.07 },
    { type: "triangle", freq: 1020, start: 0.08, dur: 0.1, gain: 0.068 },
    { type: "triangle", freq: 1360, start: 0.18, dur: 0.12, gain: 0.064 }
  ]),
  unlock_relational: Object.freeze([
    { type: "triangle", freq: 640, start: 0, dur: 0.12, gain: 0.08 },
    { type: "triangle", freq: 900, start: 0.1, dur: 0.13, gain: 0.072 },
    { type: "triangle", freq: 1200, start: 0.22, dur: 0.16, gain: 0.064 },
    { type: "sine", freq: 1560, start: 0.38, dur: 0.18, gain: 0.055 }
  ]),
  warning_flash: Object.freeze([
    { type: "triangle", freq: 460, start: 0, dur: 0.08, gain: 0.06 },
    { type: "triangle", freq: 380, start: 0.09, dur: 0.1, gain: 0.055 }
  ])
});

let audioEnabled = true;
let audioContext = null;
let preloadedP0 = false;
let preloadedAll = false;
const eventBuffers = new Map();
const eventLoadPromises = new Map();
const lastPlayAtByEvent = new Map();
const onceKeySeenAt = new Map();
const activeVoices = new Set();

function nowMs() {
  return (typeof performance !== "undefined" && typeof performance.now === "function")
    ? performance.now()
    : Date.now();
}

function getAudioContext() {
  if (audioContext) {
    return audioContext;
  }
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) {
    return null;
  }
  audioContext = new Ctor();
  return audioContext;
}

function resolveEventUrls(eventId) {
  const variantCount = EVENT_VARIANTS[eventId] || 1;
  const urls = [];
  for (let i = 1; i <= variantCount; i += 1) {
    urls.push(new URL(`../sfx/cg_sfx_${eventId}_${i}.wav`, import.meta.url).href);
  }
  return urls;
}

function chooseRandom(list) {
  if (!Array.isArray(list) || !list.length) {
    return null;
  }
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function hasVoiceCapacity() {
  return activeVoices.size < MAX_CONCURRENT_VOICES;
}

function registerVoice(voice, durationMs = 200) {
  activeVoices.add(voice);
  const timeoutMs = Math.max(40, Math.round(durationMs + 40));
  window.setTimeout(() => {
    activeVoices.delete(voice);
  }, timeoutMs);
}

function eventRateLimited(eventId, timestampMs) {
  const minMs = EVENT_RATE_LIMITS[eventId] || 0;
  if (minMs <= 0) {
    return false;
  }
  const previous = lastPlayAtByEvent.get(eventId);
  if (Number.isFinite(previous) && (timestampMs - previous) < minMs) {
    return true;
  }
  lastPlayAtByEvent.set(eventId, timestampMs);
  return false;
}

function consumeOnceKey(onceKey, timestampMs) {
  if (!onceKey) {
    return true;
  }
  if (onceKeySeenAt.has(onceKey)) {
    return false;
  }
  onceKeySeenAt.set(onceKey, timestampMs);
  if (onceKeySeenAt.size > 6000) {
    onceKeySeenAt.clear();
  }
  return true;
}

async function loadEventBuffers(eventId) {
  if (!SFX_EVENT_IDS.includes(eventId)) {
    return [];
  }
  if (eventBuffers.has(eventId)) {
    return eventBuffers.get(eventId);
  }
  const pending = eventLoadPromises.get(eventId);
  if (pending) {
    return pending;
  }
  const loadPromise = (async () => {
    const ctx = getAudioContext();
    if (!ctx) {
      eventBuffers.set(eventId, []);
      return [];
    }
    const urls = resolveEventUrls(eventId);
    const decoded = [];
    for (let i = 0; i < urls.length; i += 1) {
      const url = urls[i];
      try {
        const response = await fetch(url);
        if (!response.ok) {
          continue;
        }
        const arrayBuffer = await response.arrayBuffer();
        const copy = arrayBuffer.slice(0);
        const audioBuffer = await ctx.decodeAudioData(copy);
        decoded.push(audioBuffer);
      } catch {
        // Missing or invalid asset is allowed; synth fallback will be used.
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
  if (!safeIds.length) {
    return;
  }
  safeIds.forEach((eventId) => {
    loadEventBuffers(eventId).catch(() => {
      // No-op by design.
    });
  });
}

function playFallbackPattern(ctx, eventId) {
  const pattern = FALLBACK_PATTERNS[eventId];
  if (!Array.isArray(pattern) || !pattern.length || !hasVoiceCapacity()) {
    return false;
  }
  const startAt = ctx.currentTime + 0.001;
  const voice = { id: `fallback:${eventId}:${Math.random().toString(36).slice(2, 8)}` };
  let maxEnd = startAt;

  for (let i = 0; i < pattern.length; i += 1) {
    const tone = pattern[i];
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const start = startAt + (tone.start || 0);
    const duration = Math.max(0.015, tone.dur || 0.05);
    const end = start + duration;
    const attack = Math.min(0.012, duration * 0.35);
    const release = Math.min(0.04, duration * 0.45);
    const peak = Math.max(0.001, tone.gain || 0.05);
    const detune = (Math.random() - 0.5) * 8;

    osc.type = tone.type || "triangle";
    osc.frequency.setValueAtTime(Math.max(80, tone.freq || 440), start);
    osc.detune.setValueAtTime(detune, start);

    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.linearRampToValueAtTime(peak, start + attack);
    gainNode.gain.linearRampToValueAtTime(0.0001, Math.max(start + attack + 0.005, end - release));

    osc.connect(gainNode);
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
  if (!Array.isArray(buffers) || !buffers.length || !hasVoiceCapacity()) {
    return false;
  }
  const buffer = chooseRandom(buffers);
  if (!buffer) {
    return false;
  }
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
  if (!audioEnabled || !SFX_EVENT_IDS.includes(eventId)) {
    return false;
  }
  const ctx = getAudioContext();
  if (!ctx) {
    return false;
  }
  if (ctx.state !== "running") {
    try {
      const maybePromise = ctx.resume();
      if (maybePromise && typeof maybePromise.catch === "function") {
        maybePromise.catch(() => {});
      }
    } catch {
      return false;
    }
    if (ctx.state !== "running") {
      return false;
    }
  }
  if (playBufferEvent(ctx, eventId)) {
    return true;
  }
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

  if (preloadTier === "all") {
    if (!preloadedP0) {
      preloadEvents(PRELOAD_P0);
      preloadedP0 = true;
    }
    if (!preloadedAll) {
      preloadEvents(SFX_EVENT_IDS);
      preloadedAll = true;
    }
    return;
  }
  if (!preloadedP0) {
    preloadEvents(PRELOAD_P0);
    preloadedP0 = true;
  }
}

export function unlockAudioContextFromUserGesture() {
  const ctx = getAudioContext();
  if (!ctx) {
    return false;
  }
  try {
    const maybePromise = ctx.resume();
    if (maybePromise && typeof maybePromise.catch === "function") {
      maybePromise.catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

export function setAudioEnabled(enabled) {
  audioEnabled = Boolean(enabled);
}

export function playSfx(eventId, opts = {}) {
  if (!audioEnabled || !SFX_EVENT_IDS.includes(eventId)) {
    return false;
  }
  const options = opts && typeof opts === "object" ? opts : {};
  const onceKey = typeof options.onceKey === "string" ? options.onceKey : "";
  const delayMs = Number.isFinite(options.delayMs) ? Math.max(0, Math.round(options.delayMs)) : 0;
  const bypassGuards = Boolean(options._bypassGuards);
  const timestampMs = nowMs();

  if (!bypassGuards) {
    if (!consumeOnceKey(onceKey, timestampMs)) {
      return false;
    }
    if (eventRateLimited(eventId, timestampMs)) {
      return false;
    }
  }

  if (delayMs > 0) {
    window.setTimeout(() => {
      playSfx(eventId, {
        ...options,
        delayMs: 0,
        _bypassGuards: true
      });
    }, delayMs);
    return true;
  }

  loadEventBuffers(eventId).catch(() => {});
  return playNow(eventId);
}

