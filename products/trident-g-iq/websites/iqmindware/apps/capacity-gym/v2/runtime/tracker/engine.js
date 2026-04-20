import { sgs12aManifest } from "./sgs12a.js";
import { sgs12bManifest } from "./sgs12b.js";
import { psiCbsManifest, psiResponseOptions } from "./psi-cbs.js";

export const TRACKER_STORAGE_KEY = "tg_iq_tracker_v1";
export const TRACKER_LEGACY_STORAGE_KEY = "ctHub_v3_state";

export const TRACKER_TESTS = Object.freeze([
  {
    id: "sgs12_pre",
    label: "SgS-12 Pre",
    shortLabel: "SgS Pre",
    type: "sgs",
    manifestId: "sgs12a",
    timepoint: "PRE",
    estimateMinutes: 6,
    note: "Baseline fluid reasoning snapshot. Take this before training."
  },
  {
    id: "sgs12_post",
    label: "SgS-12 Post",
    shortLabel: "SgS Post",
    type: "sgs",
    manifestId: "sgs12b",
    timepoint: "POST",
    estimateMinutes: 6,
    note: "Follow-up fluid reasoning snapshot. Take this after training."
  },
  {
    id: "psi_cbs",
    label: "Psi-CBS",
    shortLabel: "Psi-CBS",
    type: "psi",
    manifestId: "psi-cbs",
    timepoint: "TRACK",
    estimateMinutes: 8,
    note: "Repeatable applied intelligence, cognitive resilience and AI IQ tracker."
  }
]);

export const TRACKER_TEST_BY_ID = Object.freeze(Object.fromEntries(TRACKER_TESTS.map((test) => [test.id, test])));
export const TRACKER_PSI_OPTIONS = psiResponseOptions;
export const TRACKER_PSI_SECTIONS = Object.freeze([
  {
    id: "core",
    label: "Psi-CBS Core - Applied General Intelligence (G)",
    duration: "~3 minutes",
    description: "Applied focus and processing in everyday work, study, and project flow."
  },
  {
    id: "ad",
    label: "Psi-CBS-AD - Cognitive Health & Resilience",
    duration: "~4 minutes",
    description: "Load and state-instability patterns such as stickiness, overdrive, and drop-out."
  },
  {
    id: "ai",
    label: "Psi-CBS AI - AI-Use Intelligence",
    duration: "~3 minutes",
    description: "Whether AI tools are helping or dragging your cognitive performance."
  }
]);

export function createDefaultTrackerState() {
  return {
    version: 1,
    settings: { selectedTest: "sgs12_pre" },
    importedLegacyAt: null,
    entries: []
  };
}

export function parseTrackerJson(raw) {
  if (typeof raw !== "string" || !raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const testId = TRACKER_TEST_BY_ID[entry.testId] ? entry.testId : null;
  if (!testId) return null;
  const ts = Number.isFinite(Number(entry.ts)) ? Math.round(Number(entry.ts)) : Date.now();
  const result = entry.result && typeof entry.result === "object" ? entry.result : {};
  return {
    id: String(entry.id || `tracker_${testId}_${ts}`),
    testId,
    label: String(entry.label || TRACKER_TEST_BY_ID[testId].label),
    type: TRACKER_TEST_BY_ID[testId].type,
    timepoint: entry.timepoint || TRACKER_TEST_BY_ID[testId].timepoint,
    ts,
    result,
    imported: entry.imported === true
  };
}

export function normalizeTrackerState(raw) {
  const defaults = createDefaultTrackerState();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  const selectedTest = TRACKER_TEST_BY_ID[raw.settings?.selectedTest] ? raw.settings.selectedTest : defaults.settings.selectedTest;
  const entries = Array.isArray(raw.entries)
    ? raw.entries.map(normalizeEntry).filter(Boolean).sort((a, b) => a.ts - b.ts).slice(-160)
    : [];
  return {
    version: 1,
    settings: { selectedTest },
    importedLegacyAt: Number.isFinite(Number(raw.importedLegacyAt)) ? Math.round(Number(raw.importedLegacyAt)) : null,
    entries
  };
}

export function trackerManifestFor(testId) {
  if (testId === "sgs12_pre") return sgs12aManifest;
  if (testId === "sgs12_post") return sgs12bManifest;
  if (testId === "psi_cbs") return psiCbsManifest;
  return sgs12aManifest;
}

export function createTrackerSession(testId) {
  const test = TRACKER_TEST_BY_ID[testId] || TRACKER_TEST_BY_ID.sgs12_pre;
  const manifest = trackerManifestFor(test.id);
  const psiSession = test.type === "psi";
  return {
    id: `tracker_session_${Date.now()}`,
    testId: test.id,
    type: test.type,
    label: test.label,
    startedAt: Date.now(),
    index: 0,
    answers: {},
    status: psiSession ? "section_select" : "question",
    selectedPsiSections: psiSession ? { core: true, ad: false, ai: false } : null,
    result: null,
    totalItems: test.type === "sgs" ? manifest.items.length : 0
  };
}

export function sgsRawToRsIq(raw) {
  const safeRaw = Math.max(0, Math.min(12, Math.round(Number(raw) || 0)));
  const iq = Math.round(100 + 15 * ((safeRaw - 5.4) / 1.6));
  return Math.max(40, Math.min(160, iq));
}

export function scoreSgs(testId, answers) {
  const manifest = trackerManifestFor(testId);
  const raw = manifest.items.reduce((sum, item, index) => {
    return sum + (Number(answers[index]) === Number(item.correctOptionIndex) ? 1 : 0);
  }, 0);
  return {
    raw,
    maxRaw: manifest.items.length,
    rsIq: sgsRawToRsIq(raw)
  };
}

export function psiQuestionList({ includeAi = true, sections = null } = {}) {
  const sectionSet = sections
    ? new Set(Array.isArray(sections) ? sections : Object.entries(sections).filter(([, active]) => active).map(([id]) => id))
    : null;
  const core = psiCbsManifest.core.questions.map((question) => ({
    id: question.id,
    section: "core",
    label: psiCbsManifest.core.label,
    text: question.text,
    factor: question.factor,
    reverse: question.reverse === true
  }));
  const ad = psiCbsManifest.ad.sections.flatMap((section, sectionIndex) => {
    return section.items.map((text, itemIndex) => ({
      id: `AD${sectionIndex}_${itemIndex}`,
      section: "ad",
      label: section.name,
      text,
      adSection: section.id
    }));
  });
  const ai = psiCbsManifest.ai.sections.flatMap((section) => {
    return section.pairs.flatMap((pair) => ([
      {
        id: `${pair.id}_pos`,
        section: "ai",
        label: pair.name,
        text: pair.positive,
        direction: "positive"
      },
      {
        id: `${pair.id}_neg`,
        section: "ai",
        label: pair.name,
        text: pair.negative,
        direction: "negative",
        reverse: true
      }
    ]));
  });
  const out = [];
  if (!sectionSet || sectionSet.has("core")) out.push(...core);
  if (!sectionSet || sectionSet.has("ad")) out.push(...ad);
  if (includeAi && (!sectionSet || sectionSet.has("ai"))) out.push(...ai);
  return out;
}

export function psiCoreAdCount() {
  return psiQuestionList({ includeAi: false }).length;
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function round2(value) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : null;
}

export function scorePsi(answers, { selectedSections = null } = {}) {
  const activeSections = selectedSections || { core: true, ad: true, ai: true };
  const questions = psiQuestionList({ includeAi: true, sections: activeSections });
  const coreScores = [];
  const focusScores = [];
  const processingScores = [];
  const adScores = [];
  const aiScores = [];
  questions.forEach((question) => {
    const raw = Number(answers[question.id]);
    if (!Number.isFinite(raw)) return;
    const score = question.reverse ? 6 - raw : raw;
    if (question.section === "core") {
      coreScores.push(score);
      if (question.factor === "focus") focusScores.push(score);
      if (question.factor === "processing") processingScores.push(score);
    } else if (question.section === "ad") {
      adScores.push(score);
    } else if (question.section === "ai" && activeSections.ai) {
      aiScores.push(score);
    }
  });
  return {
    core: activeSections.core ? round2(average(coreScores)) : null,
    focus: activeSections.core ? round2(average(focusScores)) : null,
    processing: activeSections.core ? round2(average(processingScores)) : null,
    ad: activeSections.ad ? round2(average(adScores)) : null,
    ai: activeSections.ai ? round2(average(aiScores)) : null,
    selectedSections: {
      core: activeSections.core === true,
      ad: activeSections.ad === true,
      ai: activeSections.ai === true
    },
    aiApplicable: activeSections.ai === true
  };
}

export function scoreTrackerSession(session) {
  if (!session) return null;
  if (session.type === "sgs") return scoreSgs(session.testId, session.answers || {});
  return scorePsi(session.answers || {}, { selectedSections: session.selectedPsiSections || { core: true, ad: true, ai: true } });
}

export function createTrackerEntry(session) {
  const test = TRACKER_TEST_BY_ID[session.testId] || TRACKER_TEST_BY_ID.sgs12_pre;
  const ts = Date.now();
  return {
    id: `tracker_${test.id}_${ts}`,
    testId: test.id,
    label: test.label,
    type: test.type,
    timepoint: test.timepoint,
    ts,
    result: scoreTrackerSession(session),
    imported: false
  };
}

function parseNumericScore(value) {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const match = text.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function legacyEntriesFor(rawLegacyState) {
  if (!rawLegacyState || typeof rawLegacyState !== "object" || !rawLegacyState.tests) return [];
  const out = [];
  const push = (sourceTestId, targetTestId) => {
    const entries = rawLegacyState.tests?.[sourceTestId]?.entries;
    if (!Array.isArray(entries)) return;
    entries.forEach((entry, index) => {
      const score = parseNumericScore(entry?.score_payload?.score);
      if (!Number.isFinite(score)) return;
      const test = TRACKER_TEST_BY_ID[targetTestId];
      const ts = Date.parse(entry.date_ts || "") || (Date.now() - (entries.length - index) * 1000);
      let result;
      if (test.type === "sgs") {
        const raw = score <= 12 ? Math.round(score) : null;
        result = raw === null
          ? { raw: null, maxRaw: 12, rsIq: Math.round(score), scoreText: String(entry?.score_payload?.score || "") }
          : { raw, maxRaw: 12, rsIq: sgsRawToRsIq(raw), scoreText: String(entry?.score_payload?.score || "") };
      } else {
        result = { core: score, focus: null, processing: null, ad: null, ai: null, aiApplicable: false, scoreText: String(entry?.score_payload?.score || "") };
      }
      out.push({
        id: `legacy_${targetTestId}_${ts}_${index}`,
        testId: targetTestId,
        label: test.label,
        type: test.type,
        timepoint: test.timepoint,
        ts,
        result,
        imported: true
      });
    });
  };
  push("sgs12a", "sgs12_pre");
  push("sgs12b", "sgs12_post");
  push("psi_cbs", "psi_cbs");
  return out;
}

export function mergeLegacyTrackerState(state, rawLegacyState) {
  const normalized = normalizeTrackerState(state);
  if (normalized.importedLegacyAt) return normalized;
  const existing = new Set(normalized.entries.map((entry) => `${entry.testId}:${entry.ts}:${entry.result?.scoreText || entry.result?.rsIq || entry.result?.core || ""}`));
  const legacy = legacyEntriesFor(rawLegacyState).filter((entry) => {
    const key = `${entry.testId}:${entry.ts}:${entry.result?.scoreText || entry.result?.rsIq || entry.result?.core || ""}`;
    if (existing.has(key)) return false;
    existing.add(key);
    return true;
  });
  return normalizeTrackerState({
    ...normalized,
    importedLegacyAt: Date.now(),
    entries: [...normalized.entries, ...legacy]
  });
}

export function latestTrackerEntry(state, testId) {
  const entries = normalizeTrackerState(state).entries.filter((entry) => entry.testId === testId);
  return entries[entries.length - 1] || null;
}

export function trackerSeries(state, testId, field, count = 10) {
  return normalizeTrackerState(state).entries
    .filter((entry) => entry.testId === testId && Number.isFinite(Number(entry.result?.[field])))
    .slice(-count)
    .map((entry, index) => ({
      slot: index + 1,
      label: `${index + 1}`,
      value: Number(entry.result[field]),
      ts: entry.ts
    }));
}

export function latestTrackerFieldEntry(state, testId, field) {
  const entries = normalizeTrackerState(state).entries.filter((entry) => entry.testId === testId && Number.isFinite(Number(entry.result?.[field])));
  return entries[entries.length - 1] || null;
}
