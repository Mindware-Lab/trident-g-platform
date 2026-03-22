import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  applyRuleToUrl,
  canonicalTargetPathExists,
  createRuleIndex,
  detectRedirectProblems,
  loadCanonicalInventory,
  loadJson,
  loadLegacyMap,
  loadMismatchRows,
  normalizePath,
  pathHandledByFunctions,
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
const ROUTES_PATH = path.join(SITE_ROOT, "functions", "_routes.json");
const REDIRECTS_PATH = path.join(SITE_ROOT, "_redirects");
const SITEMAP_PATH = path.join(SITE_ROOT, "sitemap.xml");

async function walkFiles(rootDir, out) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }
    const absolute = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      await walkFiles(absolute, out);
      continue;
    }
    out.push(absolute);
  }
}

function extractSiteUrlsFromHtml(html) {
  const urls = [];
  const hrefRegex = /href\s*=\s*"([^"]+)"/gi;
  let match = hrefRegex.exec(html);
  while (match) {
    const href = match[1];
    if (href.startsWith("https://www.iqmindware.com/")) {
      urls.push(new URL(href));
    } else if (href.startsWith("/")) {
      urls.push(new URL(href, "https://www.iqmindware.com"));
    }
    match = hrefRegex.exec(html);
  }
  return urls;
}

function parseRedirectsFile(rawRedirects) {
  const rows = [];
  const lines = rawRedirects
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  for (const line of lines) {
    const tokens = line.split(/\s+/);
    if (tokens.length < 3) {
      continue;
    }
    rows.push({
      source: tokens[0],
      destination: tokens[1],
      status: tokens[2],
    });
  }
  return rows;
}

function normalizeRedirectSource(source) {
  if (source.endsWith("*")) {
    return normalizePath(source.slice(0, -1), { matchType: "prefix" });
  }
  return normalizePath(source, { matchType: "exact" });
}

const mapRows = await loadLegacyMap(MAP_PATH);
const routesConfig = await loadJson(ROUTES_PATH);
const mismatchRows = await loadMismatchRows(MISMATCH_PATH);
const canonicalInventory = await loadCanonicalInventory(SITE_ROOT);
const ruleIndex = createRuleIndex(mapRows);

const errors = [];

for (const row of mapRows) {
  if (row.action === "301" && !canonicalTargetPathExists(row.targetPath, canonicalInventory)) {
    errors.push(`Missing canonical 301 target: ${row.oldPath} -> ${row.targetPath}`);
  }
}

errors.push(...detectRedirectProblems(mapRows, ruleIndex));

for (const mismatch of mismatchRows) {
  const rule = resolveRule(mismatch.path, ruleIndex);
  if (!rule) {
    errors.push(`Unclassified mismatch URL: ${mismatch.rawUrl}`);
    continue;
  }
  const outcome = applyRuleToUrl(mismatch.url, rule);
  if (outcome.status !== 301 && outcome.status !== 410) {
    errors.push(`Unsupported outcome for mismatch URL: ${mismatch.rawUrl}`);
    continue;
  }
  if ((rule.action === "301" || rule.action === "normalize_query") && !outcome.changed) {
    errors.push(`Redirect rule does not change URL for mismatch row: ${mismatch.rawUrl}`);
  }
}

const redirectsRaw = await fs.readFile(REDIRECTS_PATH, "utf8");
const redirectRows = parseRedirectsFile(redirectsRaw);

for (const row of redirectRows) {
  if (row.status !== "301") {
    errors.push(`_redirects contains non-301 status: ${row.source} ${row.destination} ${row.status}`);
  }
  const sourcePath = normalizeRedirectSource(row.source);
  if (pathHandledByFunctions(sourcePath, routesConfig)) {
    errors.push(`_redirects/Functions overlap: ${row.source}`);
  }
}

const sitemapXml = await fs.readFile(SITEMAP_PATH, "utf8");
const sitemapLocRegex = /<loc>([^<]+)<\/loc>/gi;
let locMatch = sitemapLocRegex.exec(sitemapXml);
while (locMatch) {
  const loc = locMatch[1].trim();
  if (loc.startsWith("https://www.iqmindware.com/")) {
    const url = new URL(loc);
    const route = resolveRule(url.pathname, ruleIndex);
    if (route?.action === "410") {
      errors.push(`Sitemap contains retired URL routed to 410: ${loc}`);
    }
  }
  locMatch = sitemapLocRegex.exec(sitemapXml);
}

const files = [];
await walkFiles(SITE_ROOT, files);
const htmlFiles = files.filter((filePath) => filePath.endsWith(".html"));
for (const htmlFile of htmlFiles) {
  const raw = await fs.readFile(htmlFile, "utf8");
  const links = extractSiteUrlsFromHtml(raw);
  for (const url of links) {
    const route = resolveRule(url.pathname, ruleIndex);
    if (route?.action === "410") {
      const relativePath = path.relative(SITE_ROOT, htmlFile).replace(/\\/g, "/");
      errors.push(
        `Internal link points to retired legacy route (${url.pathname}) in ${relativePath}`
      );
    }
  }
}

if (errors.length > 0) {
  const details = errors.map((message) => `- ${message}`).join("\n");
  throw new Error(`Legacy routing validation failed:\n${details}`);
}

console.log("Legacy routing validation passed.");
