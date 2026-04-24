type Cue =
  | "place"
  | "clear"
  | "ok"
  | "bad"
  | "probe"
  | "hit"
  | "reflect"
  | "paired"
  | "collapse"
  | "submit";

const STORAGE_KEY = "iqmw.puzzle.audio";
let ctx: AudioContext | null = null;
let enabled = localStorage.getItem(STORAGE_KEY) !== "off";

function getContext(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    ctx = new AudioCtor();
  }
  void ctx.resume();
  return ctx;
}

function tone(freq: number, duration = 0.12, gain = 0.07, type: OscillatorType = "sawtooth", delay = 0): void {
  const audio = getContext();
  if (!audio) return;
  const at = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.72), at + duration);
  amp.gain.setValueAtTime(0.001, at);
  amp.gain.linearRampToValueAtTime(gain, at + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.001, at + duration);
  osc.connect(amp);
  amp.connect(audio.destination);
  osc.start(at);
  osc.stop(at + duration + 0.02);
}

export const audio = {
  isEnabled: () => enabled,
  setEnabled(next: boolean) {
    enabled = next;
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    if (next) void getContext();
  },
  cue(cue: Cue) {
    if (cue === "place") tone(180, 0.1, 0.06);
    if (cue === "clear") tone(120, 0.1, 0.05);
    if (cue === "ok") {
      tone(240, 0.11, 0.05, "triangle");
      tone(360, 0.13, 0.04, "triangle", 0.09);
    }
    if (cue === "bad") tone(86, 0.22, 0.08);
    if (cue === "probe") tone(115, 0.09, 0.05);
    if (cue === "hit") {
      tone(68, 0.08, 0.12);
      tone(54, 0.07, 0.09, "square", 0.11);
    }
    if (cue === "reflect") tone(132, 0.32, 0.08);
    if (cue === "paired") {
      tone(250, 0.18, 0.06);
      tone(410, 0.13, 0.04, "triangle", 0.1);
    }
    if (cue === "collapse") tone(52, 0.42, 0.1, "square");
    if (cue === "submit") {
      tone(220, 0.09, 0.05, "triangle");
      tone(330, 0.09, 0.05, "triangle", 0.08);
      tone(495, 0.16, 0.05, "triangle", 0.16);
    }
  },
};
