import {
  ZONE_PROBE_CONFIG,
  bitsPerSecondFromStairs,
  clamp,
  lastProbeFrames,
  summarizeZoneRun
} from "./classifier.js";

function shuffle(values) {
  const next = values.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

export function createZoneProbeController({
  canvas,
  onStatus,
  onComplete
}) {
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true }) || canvas.getContext("2d");
  const runtime = {
    running: false,
    stop: false,
    responseOpen: false,
    choiceHandler: null,
    resolver: null,
    falseStarts: 0
  };

  function emitStatus(status) {
    if (typeof onStatus === "function") {
      onStatus(status);
    }
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function clearScreen() {
    resizeCanvas();
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#0b0b0d";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }

  function points() {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.22;
    const output = [];
    for (let index = 0; index < ZONE_PROBE_CONFIG.nArrows; index += 1) {
      const angle = (-Math.PI / 2) + ((index * 2 * Math.PI) / ZONE_PROBE_CONFIG.nArrows);
      output.push({
        x: cx + (radius * Math.cos(angle)),
        y: cy + (radius * Math.sin(angle))
      });
    }
    return output;
  }

  function drawArrow(x, y, direction) {
    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) * 0.055;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(direction === "L" ? Math.PI : 0);
    ctx.strokeStyle = "rgba(232,232,234,0.97)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.lineTo(size, 0);
    ctx.moveTo(size, 0);
    ctx.lineTo(size - (size * 0.55), -(size * 0.45));
    ctx.moveTo(size, 0);
    ctx.lineTo(size - (size * 0.55), size * 0.45);
    ctx.stroke();
    ctx.restore();
  }

  function drawFixation() {
    clearScreen();
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    ctx.strokeStyle = "rgba(232,232,234,0.92)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy);
    ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();
  }

  function drawStimulus(pattern) {
    clearScreen();
    const markerPoints = points();
    markerPoints.forEach((point, index) => {
      drawArrow(point.x, point.y, pattern[index]);
    });
  }

  function drawMask() {
    clearScreen();
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = "rgba(232,232,234,0.75)";
    ctx.lineWidth = 2;
    points().forEach((point) => {
      for (let index = 0; index < 14; index += 1) {
        const angle = Math.random() * 2 * Math.PI;
        const length = ((Math.random() * 0.9) + 0.2) * Math.min(rect.width, rect.height) * 0.05;
        ctx.beginPath();
        ctx.moveTo(point.x + (Math.cos(angle) * length * 0.25), point.y + (Math.sin(angle) * length * 0.25));
        ctx.lineTo(point.x + (Math.cos(angle) * length), point.y + (Math.sin(angle) * length));
        ctx.stroke();
      }
    });
  }

  function drawPrompt() {
    drawFixation();
  }

  function makePattern(majorityCount) {
    const majority = Math.random() < 0.5 ? "L" : "R";
    const minority = majority === "L" ? "R" : "L";
    const pattern = [
      ...Array.from({ length: majorityCount }, () => majority),
      ...Array.from({ length: ZONE_PROBE_CONFIG.nArrows - majorityCount }, () => minority)
    ];
    return {
      pattern: shuffle(pattern),
      correct: majority
    };
  }

  function runForFrames(frameCount, drawFn, timing) {
    return new Promise((resolve) => {
      let count = 0;
      let lastTs = null;
      function step(timestamp) {
        if (!runtime.running || runtime.stop) {
          resolve();
          return;
        }
        if (lastTs !== null) {
          const delta = timestamp - lastTs;
          if (delta > (1.5 * timing.frameMs)) {
            timing.dropped += 1;
          }
          timing.total += 1;
        }
        lastTs = timestamp;
        drawFn(count, timestamp);
        count += 1;
        if (count >= frameCount) {
          resolve();
          return;
        }
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function calibrate() {
    return new Promise((resolve) => {
      const deltas = [];
      let last = null;
      let count = 0;
      function step(timestamp) {
        if (!runtime.running || runtime.stop) {
          resolve(16.6667);
          return;
        }
        if (last !== null) {
          deltas.push(timestamp - last);
        }
        last = timestamp;
        count += 1;
        if (count < 140) {
          requestAnimationFrame(step);
          return;
        }
        deltas.sort((left, right) => left - right);
        resolve(clamp(deltas[Math.floor(deltas.length / 2)] || 16.6667, 4, 33.5));
      }
      requestAnimationFrame(step);
    });
  }

  function submit(directionKey) {
    if (!runtime.running || runtime.stop) {
      return;
    }
    if (runtime.responseOpen && runtime.choiceHandler) {
      runtime.choiceHandler(directionKey);
      return;
    }
    runtime.falseStarts += 1;
  }

  function waitForResponse(startTs, timeoutMs, validityRef) {
    return new Promise((resolve) => {
      let done = false;
      const deadline = performance.now() + timeoutMs;

      const finish = (payload) => {
        if (done) {
          return;
        }
        done = true;
        runtime.responseOpen = false;
        runtime.choiceHandler = null;
        runtime.resolver = null;
        window.removeEventListener("keydown", onKey);
        resolve(payload);
      };

      const onKey = (event) => {
        if (done || event.repeat) {
          return;
        }
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
          return;
        }
        if (runtime.choiceHandler) {
          runtime.choiceHandler(event.key);
        }
      };

      runtime.responseOpen = true;
      runtime.choiceHandler = (key) => finish({
        key,
        rt: performance.now() - startTs
      });
      runtime.resolver = finish;
      window.addEventListener("keydown", onKey);

      (function tick() {
        if (done) {
          return;
        }
        if (!runtime.running || runtime.stop || !validityRef.valid) {
          finish({ key: null, rt: null });
          return;
        }
        if (performance.now() >= deadline) {
          finish({ key: null, rt: null });
          return;
        }
        window.setTimeout(tick, 16);
      }());
    });
  }

  async function start({ historyRows = [] } = {}) {
    if (runtime.running) {
      return null;
    }

    runtime.running = true;
    runtime.stop = false;
    runtime.falseStarts = 0;
    drawFixation();
    emitStatus({
      phase: "calibrating",
      progressPct: 0,
      trialCount: 0,
      refreshHz: null,
      qualityText: ""
    });

    const validityRef = { valid: true };
    let focusLost = false;
    let invalidReason = null;
    const sessionId = `zone_${Date.now()}`;
    const onVisibilityChange = () => {
      if (document.hidden) {
        validityRef.valid = false;
        focusLost = true;
        invalidReason = "Tab switched or page hidden during probe";
      }
    };
    const onBlur = () => {
      validityRef.valid = false;
      focusLost = true;
      invalidReason = "Window lost focus during probe";
    };
    const onPremature = (event) => {
      if (!runtime.running || runtime.stop || runtime.responseOpen || event.repeat) {
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        runtime.falseStarts += 1;
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onPremature);

    let summary = null;

    try {
      const frameMs = await calibrate();
      const timing = {
        dropped: 0,
        total: 0,
        frameMs
      };
      const refreshHz = Math.round(1000 / frameMs);

      emitStatus({
        phase: "running",
        progressPct: 0,
        trialCount: 0,
        refreshHz,
        qualityText: ""
      });

      const minFrames = Math.max(2, Math.round(ZONE_PROBE_CONFIG.minStimMs / frameMs));
      const maxFrames = Math.max(minFrames + 2, Math.round(ZONE_PROBE_CONFIG.maxStimMs / frameMs));
      const startFrames = Math.max(minFrames + 1, Math.min(maxFrames - 1, Math.round(ZONE_PROBE_CONFIG.startStimMs / frameMs)));
      const fixationFrames = Math.max(2, Math.round(ZONE_PROBE_CONFIG.fixationMs / frameMs));
      const isiFrames = Math.max(1, Math.round(ZONE_PROBE_CONFIG.isiMs / frameMs));
      const maskFrames = Math.max(3, Math.round(ZONE_PROBE_CONFIG.maskMs / frameMs));

      const stairs = {
        easy: { frames: startFrames, streak: 0, hist: [] },
        hard: { frames: startFrames, streak: 0, hist: [] }
      };
      const previousFrames = lastProbeFrames(historyRows);
      const probeDur = previousFrames
        ? {
          easy: previousFrames.easy,
          hard: previousFrames.hard,
          catch: Math.round((previousFrames.easy + previousFrames.hard) / 2),
          frozen: true
        }
        : {
          easy: startFrames,
          hard: startFrames,
          catch: startFrames,
          frozen: false
        };

      const planState = {
        nextStair: "easy",
        nextProbe: "easy",
        counts: { stair: 0, probe: 0, catch: 0 }
      };

      const chooseTrial = (elapsedMs) => {
        if (!probeDur.frozen && elapsedMs < (ZONE_PROBE_CONFIG.bootstrapWarmupSeconds * 1000)) {
          const condition = planState.nextStair;
          planState.nextStair = condition === "easy" ? "hard" : "easy";
          return { stream: "stair", condition };
        }

        let stream = (() => {
          const mix = ZONE_PROBE_CONFIG.streamMix;
          const total = mix.stair + mix.probe + mix.catch;
          let value = Math.random() * total;
          for (const key of ["stair", "probe", "catch"]) {
            value -= mix[key];
            if (value <= 0) {
              return key;
            }
          }
          return "stair";
        })();

        const probeLike = planState.counts.probe + planState.counts.catch;
        const catchFraction = probeLike ? (planState.counts.catch / probeLike) : 0;
        const totalCount = planState.counts.stair + planState.counts.probe + planState.counts.catch;
        if (!probeDur.frozen) {
          stream = "stair";
        }
        if (stream === "catch" && (catchFraction > ZONE_PROBE_CONFIG.catchProbeFracMax || totalCount < 8)) {
          stream = "probe";
        }
        if (stream === "stair") {
          const condition = planState.nextStair;
          planState.nextStair = condition === "easy" ? "hard" : "easy";
          return { stream, condition };
        }
        if (stream === "probe") {
          const condition = planState.nextProbe;
          planState.nextProbe = condition === "easy" ? "hard" : "easy";
          return { stream, condition };
        }
        return { stream: "catch", condition: "catch" };
      };

      const freezeProbe = () => {
        if (probeDur.frozen) {
          return;
        }
        const easyMean = stairs.easy.hist.length ? Math.round(stairs.easy.hist.slice(-20).reduce((sum, value) => sum + value, 0) / stairs.easy.hist.slice(-20).length) : startFrames;
        const hardMean = stairs.hard.hist.length ? Math.round(stairs.hard.hist.slice(-20).reduce((sum, value) => sum + value, 0) / stairs.hard.hist.slice(-20).length) : startFrames;
        probeDur.easy = Math.max(2, easyMean);
        probeDur.hard = Math.max(2, hardMean);
        probeDur.catch = Math.max(2, Math.round((probeDur.easy + probeDur.hard) / 2));
        probeDur.frozen = true;
      };

      const startedAt = performance.now();
      const trials = [];
      let trialCount = 0;

      while ((performance.now() - startedAt) < (ZONE_PROBE_CONFIG.totalSeconds * 1000)) {
        if (!runtime.running || runtime.stop || !validityRef.valid) {
          break;
        }
        const elapsedMs = performance.now() - startedAt;
        if (!probeDur.frozen && elapsedMs >= (ZONE_PROBE_CONFIG.bootstrapWarmupSeconds * 1000)) {
          freezeProbe();
        }
        const { stream, condition } = chooseTrial(elapsedMs);
        const majorityCount = condition === "easy"
          ? ZONE_PROBE_CONFIG.easyMajority
          : condition === "hard"
            ? ZONE_PROBE_CONFIG.hardMajority
            : ZONE_PROBE_CONFIG.catchMajority;
        const pattern = makePattern(majorityCount);
        let stimFrames = stream === "stair"
          ? stairs[condition].frames
          : stream === "probe"
            ? (condition === "easy" ? probeDur.easy : probeDur.hard)
            : probeDur.catch;
        stimFrames = Math.max(minFrames, Math.min(maxFrames, Math.round(stimFrames)));

        await runForFrames(fixationFrames, () => drawFixation(), timing);
        if (!runtime.running || runtime.stop || !validityRef.valid) {
          break;
        }
        await runForFrames(isiFrames, () => clearScreen(), timing);
        if (!runtime.running || runtime.stop || !validityRef.valid) {
          break;
        }
        let stimulusStart = null;
        await runForFrames(stimFrames, (frameIndex) => {
          if (frameIndex === 0) {
            stimulusStart = performance.now();
          }
          drawStimulus(pattern.pattern);
        }, timing);
        if (!runtime.running || runtime.stop || !validityRef.valid) {
          break;
        }
        await runForFrames(maskFrames, () => drawMask(), timing);
        if (!runtime.running || runtime.stop || !validityRef.valid) {
          break;
        }
        drawPrompt();

        const response = await waitForResponse(stimulusStart || performance.now(), ZONE_PROBE_CONFIG.responseTimeoutMs, validityRef);
        if (runtime.stop) {
          break;
        }

        const responded = response.key === "ArrowLeft" || response.key === "ArrowRight";
        const choice = responded ? (response.key === "ArrowLeft" ? "L" : "R") : null;
        const rtMs = Number.isFinite(response.rt) ? Math.round(response.rt) : null;
        const isCorrect = responded ? choice === pattern.correct : false;
        const timedOut = !responded;

        if (stream === "stair") {
          const stair = stairs[condition];
          stair.hist.push(stair.frames);
          if (isCorrect) {
            stair.streak += 1;
            if (stair.streak >= 2) {
              stair.frames = Math.max(minFrames, stair.frames - ZONE_PROBE_CONFIG.stepFrames);
              stair.streak = 0;
            }
          } else {
            stair.frames = Math.min(maxFrames, stair.frames + ZONE_PROBE_CONFIG.stepFrames);
            stair.streak = 0;
          }
        }

        planState.counts[stream] += 1;
        trialCount += 1;
        trials.push({
          tMs: Math.round(performance.now() - startedAt),
          stream,
          cond: condition,
          stimFrames,
          correct: pattern.correct,
          choice,
          rtMs,
          timedOut,
          isCorrect
        });

        emitStatus({
          phase: "running",
          progressPct: clamp(((performance.now() - startedAt) / (ZONE_PROBE_CONFIG.totalSeconds * 1000)) * 100, 0, 100),
          trialCount,
          counts: { ...planState.counts },
          refreshHz,
          qualityText: ""
        });
      }

      if (!probeDur.frozen) {
        freezeProbe();
      }

      const droppedFrac = timing.total ? (timing.dropped / timing.total) : 1;
      const timingPoor = droppedFrac > ZONE_PROBE_CONFIG.maxDroppedFrameFrac;
      if (timingPoor && !invalidReason) {
        invalidReason = `Browser timing unstable (${Math.round(droppedFrac * 100)}% stutter)`;
      }
      const valid = !focusLost && !timingPoor && validityRef.valid;
      const bits = bitsPerSecondFromStairs(stairs, frameMs);

      summary = summarizeZoneRun({
        sessionId,
        trials,
        timing: {
          frameMs,
          droppedFrac
        },
        falseStarts: runtime.falseStarts,
        valid,
        invalidReason,
        bits,
        probeDurFrames: {
          easy: probeDur.easy,
          hard: probeDur.hard,
          catch: probeDur.catch
        },
        historyRows
      });
    } finally {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onPremature);
      runtime.responseOpen = false;
      runtime.choiceHandler = null;
      if (runtime.resolver) {
        const resolver = runtime.resolver;
        runtime.resolver = null;
        resolver({ key: null, rt: null });
      }
      runtime.running = false;
      runtime.stop = false;
    }

    if (!summary) {
      summary = {
        sessionId,
        timestamp: Date.now(),
        valid: false,
        invalidReason: "Probe ended before a result could be computed",
        state: "invalid",
        confidence: "Low",
        reasons: ["Probe interrupted"],
        bitsPerSecond: null,
        timing: { frameMs: null, hz: null, droppedFrac: 1 },
        probeDurFrames: null,
        features: {},
        counts: {}
      };
    }

    if (typeof onComplete === "function") {
      onComplete(summary);
    }
    emitStatus({
      phase: "result",
      progressPct: 100,
      trialCount: summary.counts?.totalTrials || 0,
      refreshHz: summary.timing?.hz || null,
      qualityText: ""
    });
    return summary;
  }

  function destroy() {
    runtime.stop = true;
    runtime.running = false;
    runtime.responseOpen = false;
    runtime.choiceHandler = null;
    runtime.resolver = null;
    window.removeEventListener("resize", resizeCanvas);
  }

  window.addEventListener("resize", resizeCanvas);
  drawFixation();

  return {
    start,
    submit,
    destroy,
    drawIdle: drawFixation,
    isRunning() {
      return runtime.running;
    }
  };
}
