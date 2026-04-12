import { crs10Manifest } from "../../content/tests/crs10.js";
import { edhsAVersionManifest } from "../../content/tests/edhs-a.js";
import { edhsBVersionManifest } from "../../content/tests/edhs-b.js";
import { psiCbsManifest } from "../../content/tests/psi-cbs.js";
import { sgs12aManifest } from "../../content/tests/sgs12a.js";
import { sgs12bManifest } from "../../content/tests/sgs12b.js";

const TEST_GROUPS = Object.freeze([
  {
    id: "fluid",
    label: "Fluid IQ",
    nodes: [
      { id: "sgs12a", label: "SgS-12A", shortLabel: "Baseline", manifest: sgs12aManifest, kind: "benchmark", optional: false },
      { id: "sgs12b", label: "SgS-12B", shortLabel: "Repeat form", manifest: sgs12bManifest, kind: "benchmark", optional: false, requires: ["sgs12a"] }
    ]
  },
  {
    id: "applied",
    label: "Applied IQ",
    nodes: [
      { id: "psi-core", label: "Psi-CBS Core", shortLabel: "Core check", manifest: psiCbsManifest.core, kind: "pulse", optional: false },
      { id: "psi-ai", label: "Psi-CBS-AI", shortLabel: "AI effects supplement", manifest: psiCbsManifest.ai, kind: "supplement", optional: true, requires: ["psi-core"] }
    ]
  },
  {
    id: "decision",
    label: "Decision Making",
    nodes: [
      { id: "edhs-a", label: "EDHS-A", shortLabel: "Baseline", manifest: edhsAVersionManifest, kind: "benchmark", optional: false },
      { id: "edhs-b", label: "EDHS-B", shortLabel: "Repeat form", manifest: edhsBVersionManifest, kind: "benchmark", optional: false, requires: ["edhs-a"] }
    ]
  },
  {
    id: "resilience",
    label: "Cognitive Resilience",
    nodes: [
      { id: "crs10", label: "CRS-10", shortLabel: "Resilience scale", manifest: crs10Manifest, kind: "pulse", optional: false },
      { id: "psi-ad", label: "Psi-CBS-AD", shortLabel: "AD supplement", manifest: psiCbsManifest.ad, kind: "supplement", optional: true, requires: ["psi-core"] }
    ]
  }
]);

const TEST_NODES = TEST_GROUPS.flatMap((group) => group.nodes.map((node) => ({ ...node, familyId: group.id, familyLabel: group.label })));

export function getTestGroups() {
  return TEST_GROUPS.map((group) => ({
    ...group,
    nodes: group.nodes.map((node) => ({ ...node }))
  }));
}

export function getTestNode(nodeId) {
  return TEST_NODES.find((node) => node.id === nodeId) || null;
}

export function getCompletedRuns(runs, testId) {
  return (runs || []).filter((run) => run.testId === testId && run.status === "complete");
}

export function getLatestCompletedRun(runs, testId) {
  const matches = getCompletedRuns(runs, testId);
  return matches[matches.length - 1] || null;
}

export function buildProfileSnapshot(runs) {
  const baselineReasoning = getLatestCompletedRun(runs, "sgs12a");
  const latestReasoning = getLatestCompletedRun(runs, "sgs12b") || baselineReasoning;
  const latestPsiCore = getLatestCompletedRun(runs, "psi-core");
  const latestPsiAd = getLatestCompletedRun(runs, "psi-ad");
  const latestPsiAi = getLatestCompletedRun(runs, "psi-ai");
  const baselineDecision = getLatestCompletedRun(runs, "edhs-a");
  const latestDecision = getLatestCompletedRun(runs, "edhs-b") || baselineDecision;
  const latestResilience = getLatestCompletedRun(runs, "crs10");
  return {
    baselineReasoning,
    latestReasoning,
    latestPsiCore,
    latestPsiAd,
    latestPsiAi,
    baselineDecision,
    latestDecision,
    latestResilience
  };
}

function testAvailability(node) {
  return {
    allowed: true,
    badge: node.optional ? "Optional" : "Available",
    detail: "This test can run directly from the Tests battery. Only paired-form order and supplement prerequisites apply."
  };
}

export function buildNodeStates(runs, zoneHandoff, profile) {
  const recommendedId = recommendNextNode(runs, zoneHandoff, profile);
  return TEST_NODES.map((node) => {
    const latestRun = getLatestCompletedRun(runs, node.id);
    const requires = node.requires || [];
    const unmetRequirement = requires.find((requiredId) => !getLatestCompletedRun(runs, requiredId));

    if (node.id === "psi-ai" && profile?.usesAi === false) {
      return {
        id: node.id,
        familyId: node.familyId,
        label: node.label,
        shortLabel: node.shortLabel,
        status: "optional",
        latestRun,
        available: true,
        gateBadge: "Not needed",
        detail: "AI supplement stays optional because the last profile said AI tools were not in active use."
      };
    }

    if (unmetRequirement) {
      return {
        id: node.id,
        familyId: node.familyId,
        label: node.label,
        shortLabel: node.shortLabel,
        status: "locked",
        latestRun,
        available: false,
        gateBadge: "Complete prior step",
        detail: `${getTestNode(unmetRequirement)?.label || unmetRequirement} must be completed first.`
      };
    }

    const gate = testAvailability(node);
    const status = latestRun
      ? node.id === recommendedId && gate.allowed
        ? "due"
        : "done"
      : gate.allowed
        ? node.optional
          ? "optional"
          : node.id === recommendedId
            ? "due"
            : "ready"
        : "locked";

    return {
      id: node.id,
      familyId: node.familyId,
      label: node.label,
      shortLabel: node.shortLabel,
      status,
      latestRun,
      available: gate.allowed,
      gateBadge: gate.badge,
      detail: gate.detail
    };
  });
}

export function recommendNextNode(runs, zoneHandoff, profile) {
  const candidateIds = [];

  if (!getLatestCompletedRun(runs, "sgs12a")) {
    candidateIds.push("sgs12a");
  }
  if (!getLatestCompletedRun(runs, "psi-core")) {
    candidateIds.push("psi-core");
  }
  if (!getLatestCompletedRun(runs, "edhs-a")) {
    candidateIds.push("edhs-a");
  }
  if (!getLatestCompletedRun(runs, "crs10")) {
    candidateIds.push("crs10");
  }
  if (!getLatestCompletedRun(runs, "sgs12b")) {
    candidateIds.push("sgs12b");
  }
  if (!getLatestCompletedRun(runs, "edhs-b")) {
    candidateIds.push("edhs-b");
  }
  if (profile?.usesAi === true && !getLatestCompletedRun(runs, "psi-ai")) {
    candidateIds.push("psi-ai");
  }
  if (!getLatestCompletedRun(runs, "psi-ad")) {
    candidateIds.push("psi-ad");
  }
  candidateIds.push("psi-core", "crs10", "edhs-b", "sgs12b", "edhs-a", "sgs12a");

  for (const candidateId of candidateIds) {
    const node = getTestNode(candidateId);
    if (!node) {
      continue;
    }
    const unmetRequirement = (node.requires || []).find((requiredId) => !getLatestCompletedRun(runs, requiredId));
    if (unmetRequirement) {
      continue;
    }
    if (candidateId === "psi-ai" && profile?.usesAi === false) {
      continue;
    }
    if (testAvailability(node).allowed) {
      return candidateId;
    }
  }

  for (const candidateId of candidateIds) {
    const node = getTestNode(candidateId);
    if (!node) {
      continue;
    }
    const unmetRequirement = (node.requires || []).find((requiredId) => !getLatestCompletedRun(runs, requiredId));
    if (!unmetRequirement) {
      return candidateId;
    }
  }

  return "sgs12a";
}

export function createSessionBlueprint(nodeId) {
  const node = getTestNode(nodeId);
  if (!node) {
    return null;
  }

  if (node.manifest?.items) {
    return {
      nodeId,
      mode: "sgs",
      label: node.label,
      introTitle: node.manifest.introTitle,
      introCopy: node.manifest.introCopy,
      estimateMinutes: node.manifest.estimateMinutes,
      items: node.manifest.items.map((item) => ({ ...item }))
    };
  }

  if (nodeId === "psi-core") {
    return {
      nodeId,
      mode: "psi-core",
      label: node.label,
      introTitle: node.manifest.introTitle,
      introCopy: node.manifest.introCopy,
      estimateMinutes: node.manifest.estimateMinutes,
      items: node.manifest.questions.map((question) => ({
        id: question.id,
        kind: "likert",
        prompt: question.text,
        factor: question.factor,
        reverse: question.reverse === true
      }))
    };
  }

  if (nodeId === "psi-ad") {
    return {
      nodeId,
      mode: "psi-ad",
      label: node.label,
      introTitle: node.manifest.introTitle,
      introCopy: node.manifest.introCopy,
      estimateMinutes: node.manifest.estimateMinutes,
      items: node.manifest.sections.flatMap((section) =>
        section.items.map((prompt, index) => ({
          id: `${section.id}_${index}`,
          sectionName: section.name,
          kind: "likert",
          prompt
        }))
      )
    };
  }

  if (nodeId === "psi-ai") {
    return {
      nodeId,
      mode: "psi-ai",
      label: node.label,
      introTitle: node.manifest.introTitle,
      introCopy: node.manifest.introCopy,
      estimateMinutes: node.manifest.estimateMinutes,
      items: node.manifest.sections.flatMap((section) =>
        section.pairs.flatMap((pair) => ([
          {
            id: `${pair.id}_pos`,
            pairId: pair.id,
            pairName: pair.name,
            sectionName: section.name,
            polarity: "positive",
            kind: "likert",
            prompt: pair.positive
          },
          {
            id: `${pair.id}_neg`,
            pairId: pair.id,
            pairName: pair.name,
            sectionName: section.name,
            polarity: "negative",
            kind: "likert",
            prompt: pair.negative
          }
        ]))
      )
    };
  }

  if (nodeId === "edhs-a" || nodeId === "edhs-b") {
    return {
      nodeId,
      mode: "edhs",
      label: node.label,
      introTitle: node.manifest.introTitle,
      introCopy: node.manifest.introCopy,
      estimateMinutes: node.manifest.estimateMinutes,
      items: node.manifest.questions.map((question) => ({
        id: question.id,
        title: question.title,
        prompt: question.text,
        options: question.options.map((option) => ({ ...option })),
        kind: "choice-score"
      }))
    };
  }

  if (nodeId === "crs10") {
    return {
      nodeId,
      mode: "crs",
      label: node.label,
      introTitle: node.manifest.introTitle,
      introCopy: node.manifest.introCopy,
      estimateMinutes: node.manifest.estimateMinutes,
      responseOptions: node.manifest.responseOptions,
      items: node.manifest.questions.map((question) => ({
        id: question.id,
        kind: "likert",
        prompt: question.text,
        reverse: question.reverse === true
      }))
    };
  }

  return null;
}
