const DAY_MS = 24 * 60 * 60 * 1000;
const RECHECK_GAP_MS = 24 * 60 * 60 * 1000;
const PROBE_SLOT_INTERVAL = 4;

const ZONE_HANDOFF_PRIMARY_KEY = "iqmw.capacity.handoffFromZone";
const ZONE_HANDOFF_FALLBACK_KEY = "lastCapacitySession";

const HUB_SESSION_STYLE_MAP = Object.freeze({
  TUNE: Object.freeze({
    label: "Build",
    shortLabel: "Build",
    description: "Build control quality with normal progression."
  }),
  EXPLORE: Object.freeze({
    label: "Explore",
    shortLabel: "Explore",
    description: "Plateau detected, so run a controlled challenge."
  }),
  TIGHTEN: Object.freeze({
    label: "Stabilise",
    shortLabel: "Stabilise",
    description: "Use safer settings to rebuild consistency first."
  }),
  PROBE: Object.freeze({
    label: "Swap Check",
    shortLabel: "Probe",
    description: "Run a wrapper swap check to test portability."
  }),
  RECHECK: Object.freeze({
    label: "Later Check",
    shortLabel: "Recheck",
    description: "Retest yesterday's probe candidate after delay."
  }),
  RESET: Object.freeze({
    label: "Reset",
    shortLabel: "Reset",
    description: "Out-of-band state detected, keep load light."
  })
});

const CANDIDATE_STATUS = new Set(["pending", "passed", "failed"]);

function asObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value;
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toDateKeyLocal(ts) {
  const date = new Date(ts);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseTimestamp(value) {
  if (Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeZoneValue(zoneValue, recommendationValue) {
  const zoneRaw = typeof zoneValue === "string" ? zoneValue.trim().toLowerCase() : "";
  const recommendationRaw = typeof recommendationValue === "string"
    ? recommendationValue.trim().toLowerCase()
    : "";
  if (zoneRaw === "too_hot" || zoneRaw === "overloaded_explore" || zoneRaw === "overloaded_exploit") {
    return "too_hot";
  }
  if (zoneRaw === "too_cold" || zoneRaw === "flat") {
    return "too_cold";
  }
  if (zoneRaw === "in_band" || zoneRaw === "in_zone" || zoneRaw === "psi") {
    return "in_band";
  }
  if (recommendationRaw === "light") {
    return "too_cold";
  }
  if (recommendationRaw === "proceed" || recommendationRaw === "full") {
    return "in_band";
  }
  return "unknown";
}

function normalizeRecommendationValue(value, zoneValue) {
  const recommendationRaw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (recommendationRaw === "light" || recommendationRaw === "proceed") {
    return recommendationRaw;
  }
  if (recommendationRaw === "full") {
    return "proceed";
  }
  if (zoneValue === "too_hot" || zoneValue === "too_cold") {
    return "light";
  }
  if (zoneValue === "in_band") {
    return "proceed";
  }
  return "unknown";
}

function normalizeZoneHandoffCandidate(candidate, sourceKey, nowTs = Date.now()) {
  const raw = asObject(candidate);
  if (!Object.keys(raw).length) {
    return null;
  }
  const gate = asObject(raw.gate);
  const zoneValue = gate.zone || raw.zone || null;
  const recommendationValue = gate.recommendation || raw.recommendation || null;
  if (!zoneValue && !recommendationValue) {
    return null;
  }
  const zone = normalizeZoneValue(zoneValue, recommendationValue);
  const recommendation = normalizeRecommendationValue(recommendationValue, zone);
  const timestamp = parseTimestamp(raw.timestamp);
  const freshSameDay = Number.isFinite(timestamp)
    ? toDateKeyLocal(timestamp) === toDateKeyLocal(nowTs)
    : false;
  return {
    zone,
    recommendation,
    timestamp: Number.isFinite(timestamp) ? timestamp : null,
    freshSameDay,
    sourceKey: sourceKey || "unknown"
  };
}

function parseJson(raw) {
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pickMostRecentZone(primary, fallback) {
  if (!primary) {
    return fallback;
  }
  if (!fallback) {
    return primary;
  }
  if (!Number.isFinite(primary.timestamp) && !Number.isFinite(fallback.timestamp)) {
    return primary;
  }
  if (!Number.isFinite(primary.timestamp)) {
    return fallback;
  }
  if (!Number.isFinite(fallback.timestamp)) {
    return primary;
  }
  return primary.timestamp >= fallback.timestamp ? primary : fallback;
}

export function readZoneHandoffFromStorage(nowTs = Date.now()) {
  if (typeof localStorage === "undefined") {
    return null;
  }
  const primaryRaw = parseJson(localStorage.getItem(ZONE_HANDOFF_PRIMARY_KEY));
  const fallbackRaw = parseJson(localStorage.getItem(ZONE_HANDOFF_FALLBACK_KEY));
  const primary = normalizeZoneHandoffCandidate(primaryRaw, ZONE_HANDOFF_PRIMARY_KEY, nowTs);
  const fallback = normalizeZoneHandoffCandidate(fallbackRaw, ZONE_HANDOFF_FALLBACK_KEY, nowTs);
  return pickMostRecentZone(primary, fallback);
}

function normalizeSignature(signatureRaw) {
  const signature = asObject(signatureRaw);
  const baselineWrapper = signature.baselineWrapper === "hub_noncat" ? "hub_noncat" : "hub_cat";
  const swapWrapper = signature.swapWrapper === "hub_noncat" ? "hub_noncat" : "hub_cat";
  const n = Number.isFinite(signature.n) ? Math.max(1, Math.round(signature.n)) : 1;
  const speed = signature.speed === "fast" ? "fast" : "slow";
  const interference = signature.interference === "high" ? "high" : "low";
  const probeAcc = Number.isFinite(signature.probeAcc) ? Math.max(0, Math.min(1, signature.probeAcc)) : 0;
  const probeN = Number.isFinite(signature.probeN) ? Math.max(1, Math.round(signature.probeN)) : 1;
  return {
    baselineWrapper,
    swapWrapper,
    n,
    speed,
    interference,
    targetModality: signature.targetModality === "loc" || signature.targetModality === "col" || signature.targetModality === "sym"
      ? signature.targetModality
      : null,
    probeAcc,
    probeN
  };
}

function normalizeCandidate(candidateRaw) {
  const candidate = asObject(candidateRaw);
  const status = CANDIDATE_STATUS.has(candidate.status) ? candidate.status : "pending";
  const probeTs = Number.isFinite(candidate.probeTs) ? Math.round(candidate.probeTs) : null;
  const eligibleAfterTs = Number.isFinite(candidate.eligibleAfterTs)
    ? Math.round(candidate.eligibleAfterTs)
    : (Number.isFinite(probeTs) ? probeTs + RECHECK_GAP_MS : null);
  return {
    id: typeof candidate.id === "string" && candidate.id.trim() ? candidate.id.trim() : null,
    probeTs,
    eligibleAfterTs,
    signature: normalizeSignature(candidate.signature),
    status,
    recheckTs: Number.isFinite(candidate.recheckTs) ? Math.round(candidate.recheckTs) : null,
    rewardGranted: candidate.rewardGranted === true
  };
}

export function normalizeProgression(progressionRaw) {
  const progression = asObject(progressionRaw);
  const rawCandidates = Array.isArray(progression.candidates) ? progression.candidates : [];
  const candidates = rawCandidates
    .map((entry) => normalizeCandidate(entry))
    .filter((entry) => entry.id && Number.isFinite(entry.probeTs));
  const pendingCandidateIds = new Set(candidates.filter((entry) => entry.status === "pending").map((entry) => entry.id));
  const pendingCandidateId = typeof progression.pendingCandidateId === "string" && pendingCandidateIds.has(progression.pendingCandidateId)
    ? progression.pendingCandidateId
    : null;
  const lastZone = normalizeZoneHandoffCandidate(progression.lastZone, "saved", Date.now());
  return {
    hubSessionIndex: Number.isFinite(progression.hubSessionIndex) ? Math.max(0, Math.floor(progression.hubSessionIndex)) : 0,
    lastZone,
    pendingCandidateId,
    candidates
  };
}

export function applyZoneToProgression(progressionRaw, zoneHandoff) {
  const progression = normalizeProgression(progressionRaw);
  return {
    ...progression,
    lastZone: zoneHandoff || null
  };
}

export function describeSessionStyle(sessionStyle) {
  return HUB_SESSION_STYLE_MAP[sessionStyle] || HUB_SESSION_STYLE_MAP.TUNE;
}

function extractHubSessions(historyRaw, count = 3) {
  const history = Array.isArray(historyRaw) ? historyRaw : [];
  const sessions = history.filter((session) => session?.wrapperFamily === "hub");
  return sessions.slice(0, count);
}

function averageAccuracy(blocksRaw) {
  const blocks = Array.isArray(blocksRaw) ? blocksRaw : [];
  if (!blocks.length) {
    return 0;
  }
  const sum = blocks.reduce((acc, block) => acc + Number(block?.accuracy || 0), 0);
  return sum / blocks.length;
}

function getSessionFinalN(session) {
  const blocks = Array.isArray(session?.blocks) ? session.blocks : [];
  if (!blocks.length) {
    return 1;
  }
  const final = blocks[blocks.length - 1];
  return Number.isFinite(final?.nEnd) ? final.nEnd : 1;
}

function detectHubPlateauTrend(history) {
  const recent = extractHubSessions(history, 3);
  if (recent.length < 3) {
    return false;
  }
  const finalNs = recent.map((session) => getSessionFinalN(session));
  const sameFinalN = finalNs.every((value) => value === finalNs[0]);
  if (!sameFinalN) {
    return false;
  }
  const means = recent.map((session) => averageAccuracy(session?.blocks));
  return means.every((value) => value >= 0.75 && value < 0.9);
}

function findPendingCandidate(progression, nowTs = Date.now()) {
  const safeProgression = normalizeProgression(progression);
  if (!safeProgression.pendingCandidateId) {
    return null;
  }
  const candidate = safeProgression.candidates.find((entry) => entry.id === safeProgression.pendingCandidateId);
  if (!candidate || candidate.status !== "pending") {
    return null;
  }
  return {
    ...candidate,
    eligibleNow: Number.isFinite(candidate.eligibleAfterTs) && nowTs >= candidate.eligibleAfterTs
  };
}

export function computeHubSessionStyle({
  history,
  progression,
  zoneHandoff,
  nowTs = Date.now()
} = {}) {
  const safeProgression = normalizeProgression(progression);
  const pendingCandidate = findPendingCandidate(safeProgression, nowTs);
  const zone = normalizeZoneHandoffCandidate(zoneHandoff, zoneHandoff?.sourceKey || "saved", nowTs);
  const zoneIsFresh = Boolean(zone?.freshSameDay);

  if (!zoneIsFresh) {
    return {
      style: "TIGHTEN",
      reason: "No fresh Zone check found today. Start with stabilise settings.",
      zoneHandoff: zone,
      pendingCandidate,
      probeDue: false
    };
  }
  if (zone.zone === "too_hot") {
    return {
      style: "RESET",
      reason: "Zone check shows overload. Use reset settings today.",
      zoneHandoff: zone,
      pendingCandidate,
      probeDue: false
    };
  }
  if (zone.zone === "too_cold") {
    return {
      style: "TIGHTEN",
      reason: "Zone check is below band. Build control before heavier challenge.",
      zoneHandoff: zone,
      pendingCandidate,
      probeDue: false
    };
  }
  if (zone.zone !== "in_band") {
    return {
      style: "TIGHTEN",
      reason: "Zone status is unclear. Start with stabilise settings.",
      zoneHandoff: zone,
      pendingCandidate,
      probeDue: false
    };
  }

  if (pendingCandidate?.eligibleNow) {
    return {
      style: "RECHECK",
      reason: "A probe candidate is ready for delayed durability check.",
      zoneHandoff: zone,
      pendingCandidate,
      probeDue: false
    };
  }

  const nextHubIndex = safeProgression.hubSessionIndex + 1;
  const probeDue = !pendingCandidate && nextHubIndex % PROBE_SLOT_INTERVAL === 0;
  if (probeDue) {
    return {
      style: "PROBE",
      reason: "Scheduled wrapper swap check for transfer evidence.",
      zoneHandoff: zone,
      pendingCandidate,
      probeDue: true
    };
  }

  if (detectHubPlateauTrend(history)) {
    return {
      style: "EXPLORE",
      reason: "Recent sessions are stable but flat, so controlled exploration is scheduled.",
      zoneHandoff: zone,
      pendingCandidate,
      probeDue: false
    };
  }

  return {
    style: "TUNE",
    reason: "Continue normal build progression.",
    zoneHandoff: zone,
    pendingCandidate,
    probeDue: false
  };
}

export function otherHubWrapper(wrapper) {
  return wrapper === "hub_noncat" ? "hub_cat" : "hub_noncat";
}

function isStableBlock(blockResult) {
  if (!blockResult || typeof blockResult !== "object") {
    return false;
  }
  const accuracy = Number(blockResult.accuracy || 0);
  const lapseCount = Number(blockResult.lapseCount || 0);
  const errorBursts = Number(blockResult.errorBursts || 0);
  return accuracy >= 0.75 && lapseCount === 0 && errorBursts <= 1;
}

function findBlockByIndex(blocksRaw, blockIndex) {
  const blocks = Array.isArray(blocksRaw) ? blocksRaw : [];
  return blocks.find((entry) => Number(entry?.blockIndex) === Number(blockIndex)) || null;
}

function evaluateProbeCandidate(summary, nowTs = Date.now()) {
  const block4 = findBlockByIndex(summary?.blocks, 4);
  const block5 = findBlockByIndex(summary?.blocks, 5);
  if (!block4) {
    return {
      pass: false,
      reason: "Probe block was missing from this session."
    };
  }
  const baselineWrapper = block5?.wrapper === "hub_noncat"
    ? "hub_noncat"
    : (block5?.wrapper === "hub_cat" ? "hub_cat" : (summary?.blocksPlanned?.[0]?.wrapper === "hub_noncat" ? "hub_noncat" : "hub_cat"));
  if (block4.wrapper === baselineWrapper) {
    return {
      pass: false,
      reason: "Probe wrapper swap was not detected."
    };
  }
  if (!isStableBlock(block4)) {
    return {
      pass: false,
      reason: "Probe block did not stay stable."
    };
  }
  return {
    pass: true,
    reason: "Probe swap block stayed stable and is ready for delayed check.",
    signature: {
      baselineWrapper,
      swapWrapper: block4.wrapper === "hub_noncat" ? "hub_noncat" : "hub_cat",
      n: Number.isFinite(block4.nStart) ? block4.nStart : 1,
      speed: block4.speed === "fast" ? "fast" : "slow",
      interference: block4.interference === "high" ? "high" : "low",
      targetModality: block4.targetModality === "loc" || block4.targetModality === "col" || block4.targetModality === "sym"
        ? block4.targetModality
        : null,
      probeAcc: Number.isFinite(block4.accuracy) ? block4.accuracy : 0,
      probeN: Number.isFinite(block4.nEnd) ? block4.nEnd : 1
    },
    probeTs: Number.isFinite(summary?.tsEnd) ? summary.tsEnd : nowTs
  };
}

function evaluateRecheckCandidate(summary, candidate, nowTs = Date.now()) {
  if (!candidate) {
    return {
      status: "no_pending",
      pass: false,
      reason: "No pending probe candidate was found."
    };
  }
  if (Number.isFinite(candidate.eligibleAfterTs) && nowTs < candidate.eligibleAfterTs) {
    return {
      status: "too_early",
      pass: false,
      reason: "Later check attempted before the 24-hour delay gate.",
      remainingMs: candidate.eligibleAfterTs - nowTs
    };
  }
  const block4 = findBlockByIndex(summary?.blocks, 4);
  const block5 = findBlockByIndex(summary?.blocks, 5);
  if (!block4) {
    return {
      status: "failed",
      pass: false,
      reason: "Later check block was missing."
    };
  }
  if (!isStableBlock(block4)) {
    return {
      status: "failed",
      pass: false,
      reason: "Later check block was unstable."
    };
  }
  const expectedSwapWrapper = candidate.signature.swapWrapper === "hub_noncat" ? "hub_noncat" : "hub_cat";
  const expectedBaselineWrapper = candidate.signature.baselineWrapper === "hub_noncat" ? "hub_noncat" : "hub_cat";
  if (block4.wrapper !== expectedSwapWrapper) {
    return {
      status: "failed",
      pass: false,
      reason: "Later check did not replay the probe swap wrapper."
    };
  }
  if (!block5 || block5.wrapper !== expectedBaselineWrapper) {
    return {
      status: "failed",
      pass: false,
      reason: "Later check did not return to the baseline wrapper."
    };
  }
  const minAccuracy = Math.max(0, Number(candidate.signature.probeAcc || 0) - 0.08);
  const minNEnd = Math.max(1, Number(candidate.signature.probeN || 1) - 1);
  if (Number(block4.accuracy || 0) < minAccuracy || Number(block4.nEnd || 0) < minNEnd) {
    return {
      status: "failed",
      pass: false,
      reason: "Later check did not preserve probe-level control."
    };
  }
  return {
    status: "pass",
    pass: true,
    reason: "Later check passed. Transfer evidence is now banked."
  };
}

function buildTransferEvidence(status, title, detail, extra = {}) {
  return {
    status,
    title,
    detail,
    ...extra
  };
}

function makeCandidateId(nowTs, indexSeed = 0) {
  const random = Math.floor(Math.random() * 1e6).toString(36);
  return `cand_${nowTs}_${indexSeed}_${random}`;
}

export function applyHubTransferOutcome({
  progression,
  summary,
  sessionStyle,
  nowTs = Date.now()
} = {}) {
  const safeProgression = normalizeProgression(progression);
  let nextProgression = {
    ...safeProgression,
    candidates: safeProgression.candidates.slice()
  };
  let transferDelta = 0;
  let transferEvidence = buildTransferEvidence(
    "not_counted",
    "Transfer check not counted",
    "This session focused on standard training."
  );

  if (sessionStyle === "PROBE") {
    const probeEval = evaluateProbeCandidate(summary, nowTs);
    if (probeEval.pass && probeEval.signature) {
      const candidateId = makeCandidateId(nowTs, nextProgression.candidates.length);
      const candidate = {
        id: candidateId,
        probeTs: probeEval.probeTs,
        eligibleAfterTs: probeEval.probeTs + RECHECK_GAP_MS,
        signature: normalizeSignature(probeEval.signature),
        status: "pending",
        recheckTs: null,
        rewardGranted: false
      };
      nextProgression.candidates.push(candidate);
      nextProgression.pendingCandidateId = candidateId;
      transferEvidence = buildTransferEvidence(
        "pending_recheck",
        "Probe passed",
        "Wrapper swap held. Run a later check after 24 hours to bank transfer.",
        { candidateId }
      );
    } else {
      transferEvidence = buildTransferEvidence(
        "not_counted",
        "Probe did not qualify",
        probeEval.reason || "Probe evidence was not stable enough."
      );
    }
  } else if (sessionStyle === "RECHECK") {
    const pending = nextProgression.pendingCandidateId
      ? nextProgression.candidates.find((entry) => entry.id === nextProgression.pendingCandidateId && entry.status === "pending")
      : null;
    const recheckEval = evaluateRecheckCandidate(summary, pending, nowTs);
    if (recheckEval.status === "too_early") {
      transferEvidence = buildTransferEvidence(
        "not_counted_early",
        "Later check too early",
        "This run was before the 24-hour delay gate.",
        {
          remainingMs: recheckEval.remainingMs || 0,
          candidateId: pending?.id || null
        }
      );
    } else if (recheckEval.pass && pending) {
      const updated = {
        ...pending,
        status: "passed",
        recheckTs: nowTs,
        rewardGranted: true
      };
      nextProgression.candidates = nextProgression.candidates.map((entry) => (entry.id === updated.id ? updated : entry));
      nextProgression.pendingCandidateId = null;
      if (!pending.rewardGranted) {
        transferDelta = 1;
      }
      transferEvidence = buildTransferEvidence(
        "banked",
        "Later check passed",
        "Transfer evidence has been banked.",
        { candidateId: updated.id }
      );
    } else if (pending) {
      const failed = {
        ...pending,
        status: "failed",
        recheckTs: nowTs
      };
      nextProgression.candidates = nextProgression.candidates.map((entry) => (entry.id === failed.id ? failed : entry));
      nextProgression.pendingCandidateId = null;
      transferEvidence = buildTransferEvidence(
        "failed",
        "Later check failed",
        recheckEval.reason || "Transfer evidence did not hold after delay.",
        { candidateId: failed.id }
      );
    } else {
      transferEvidence = buildTransferEvidence(
        "no_pending",
        "No pending later check",
        "There was no pending probe candidate to evaluate."
      );
    }
  }

  if (nextProgression.candidates.length > 64) {
    nextProgression.candidates = nextProgression.candidates.slice(nextProgression.candidates.length - 64);
  }

  return {
    progression: normalizeProgression(nextProgression),
    transferDelta,
    transferEvidence
  };
}

export function formatRemainingDuration(remainingMs) {
  const safeMs = Number.isFinite(remainingMs) ? Math.max(0, Math.round(remainingMs)) : 0;
  const totalMinutes = Math.ceil(safeMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${minutes}m`;
  }
  if (minutes <= 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}
