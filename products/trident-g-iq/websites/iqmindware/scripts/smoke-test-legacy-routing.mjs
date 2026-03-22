import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyRuleToUrl,
  createRuleIndex,
  loadLegacyMap,
  loadMismatchRows,
  resolveRule,
} from "./lib/legacy-routing-core.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SITE_ROOT = path.resolve(__dirname, "..");

const MAP_PATH = path.join(SITE_ROOT, "seo", "legacy-url-map.csv");
const MISMATCH_PATH = path.join(
  SITE_ROOT,
  "seo",
  "mismatch-batch-2026-03-22.csv"
);

function isRedirectStatus(status) {
  return status >= 300 && status < 400;
}

async function fetchWithRedirectTrace(url, maxHops = 5) {
  let current = new URL(url.toString());
  const hops = [];

  for (let index = 0; index <= maxHops; index += 1) {
    const response = await fetch(current, { redirect: "manual" });
    const status = response.status;

    if (isRedirectStatus(status)) {
      const location = response.headers.get("location");
      if (!location) {
        return { startUrl: url, hops, finalUrl: current, finalStatus: status };
      }
      const next = new URL(location, current);
      hops.push({
        from: new URL(current.toString()),
        to: next,
        status,
      });
      current = next;
      continue;
    }

    return { startUrl: url, hops, finalUrl: current, finalStatus: status };
  }

  throw new Error(`Redirect hop limit exceeded for ${url.toString()}`);
}

function joinPathAndQuery(urlObject) {
  return `${urlObject.pathname}${urlObject.search}`;
}

const previewBaseRaw = process.argv[2] ?? process.env.PREVIEW_BASE_URL;
if (!previewBaseRaw) {
  throw new Error(
    "Usage: node scripts/smoke-test-legacy-routing.mjs <preview-base-url>\nExample: node scripts/smoke-test-legacy-routing.mjs https://your-preview.pages.dev"
  );
}
const previewBase = new URL(previewBaseRaw);

const mapRows = await loadLegacyMap(MAP_PATH);
const ruleIndex = createRuleIndex(mapRows);
const mismatchRows = await loadMismatchRows(MISMATCH_PATH);

const failures = [];
const summaries = {
  total: 0,
  expected301: 0,
  expected410: 0,
  pass: 0,
};

for (const mismatch of mismatchRows) {
  summaries.total += 1;
  const rule = resolveRule(mismatch.path, ruleIndex);
  if (!rule) {
    failures.push(`Unclassified mismatch URL: ${mismatch.rawUrl}`);
    continue;
  }

  const expected = applyRuleToUrl(mismatch.url, rule);
  const requestUrl = new URL(
    `${mismatch.url.pathname}${mismatch.url.search}`,
    previewBase
  );
  const trace = await fetchWithRedirectTrace(requestUrl);

  if (expected.status === 410) {
    summaries.expected410 += 1;
    if (trace.hops.length > 0) {
      failures.push(
        `Expected 410 without redirects: ${requestUrl} (observed ${trace.hops.length} hops)`
      );
      continue;
    }
    if (trace.finalStatus !== 410) {
      failures.push(
        `Expected 410 for ${requestUrl} but got ${trace.finalStatus}`
      );
      continue;
    }
    summaries.pass += 1;
    continue;
  }

  summaries.expected301 += 1;
  if (!expected.targetUrl || !expected.changed) {
    failures.push(`Expected redirect is not valid for ${mismatch.rawUrl}`);
    continue;
  }

  if (trace.hops.length !== 1) {
    failures.push(
      `Expected single-hop redirect for ${requestUrl} but observed ${trace.hops.length} hops`
    );
    continue;
  }

  const firstHop = trace.hops[0];
  if (firstHop.status !== 301) {
    failures.push(`Expected first-hop 301 for ${requestUrl} but got ${firstHop.status}`);
    continue;
  }

  const expectedFinal = new URL(
    `${expected.targetUrl.pathname}${expected.targetUrl.search}${expected.targetUrl.hash}`,
    previewBase
  );
  const actualFinal = new URL(
    `${trace.finalUrl.pathname}${trace.finalUrl.search}${trace.finalUrl.hash}`,
    previewBase
  );
  if (joinPathAndQuery(actualFinal) !== joinPathAndQuery(expectedFinal)) {
    failures.push(
      `Unexpected redirect target for ${requestUrl}: expected ${joinPathAndQuery(
        expectedFinal
      )} got ${joinPathAndQuery(actualFinal)}`
    );
    continue;
  }

  if (trace.finalStatus === 200 && trace.hops.length === 0) {
    failures.push(`Legacy URL served 200 without redirect: ${requestUrl}`);
    continue;
  }

  summaries.pass += 1;
}

if (failures.length > 0) {
  const details = failures.map((item) => `- ${item}`).join("\n");
  throw new Error(
    `Legacy routing smoke test failed (${summaries.pass}/${summaries.total} passed):\n${details}`
  );
}

console.log(
  `Legacy routing smoke test passed (${summaries.pass}/${summaries.total}). 301: ${summaries.expected301}, 410: ${summaries.expected410}`
);
