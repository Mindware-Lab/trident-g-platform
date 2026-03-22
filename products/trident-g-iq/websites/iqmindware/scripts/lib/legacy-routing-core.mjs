import { promises as fs } from "node:fs";
import path from "node:path";

export const ALLOWED_MATCH_TYPES = new Set(["exact", "prefix"]);
export const ALLOWED_ACTIONS = new Set(["301", "410", "normalize_query"]);

export const KNOWN_JUNK_QUERY_PARAMS = new Set([
  "amp",
  "noamp",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "hop",
  "cat",
  "admitad_uid",
  "advcake_params",
  "erid",
  "goback",
  "source",
]);

const CANONICAL_HOST = "https://www.iqmindware.com";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function normalizePath(inputPath, { matchType = "exact" } = {}) {
  assert(typeof inputPath === "string", "Path must be a string.");
  let normalized = inputPath.trim();
  assert(normalized.length > 0, "Path cannot be empty.");
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  normalized = normalized.replace(/\/{2,}/g, "/");
  if (normalized.length > 1 && normalized.endsWith("/index.html")) {
    normalized = normalized.slice(0, -"/index.html".length) + "/";
  }

  if (matchType === "prefix") {
    if (!normalized.endsWith("/")) {
      normalized += "/";
    }
    return normalized;
  }

  if (normalized !== "/" && !normalized.endsWith("/")) {
    normalized += "/";
  }
  return normalized;
}

export function normalizeTargetPath(inputTarget) {
  assert(typeof inputTarget === "string", "Target path must be a string.");
  const target = inputTarget.trim();
  assert(target.length > 0, "Target path cannot be empty.");

  let url;
  if (target.startsWith("http://") || target.startsWith("https://")) {
    url = new URL(target);
    assert(
      `${url.protocol}//${url.host}`.toLowerCase() ===
        CANONICAL_HOST.toLowerCase(),
      `Absolute target URL must use canonical host: ${inputTarget}`
    );
  } else {
    url = new URL(target, CANONICAL_HOST);
  }

  const pathname = normalizePath(url.pathname, { matchType: "exact" });
  const hash = url.hash || "";
  return `${pathname}${hash}`;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  values.push(current);
  return values;
}

export function parseCsv(text) {
  const sanitized = text.startsWith("\uFEFF") ? text.slice(1) : text;
  const lines = sanitized.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const nonEmpty = lines.filter((line) => line.trim().length > 0);
  if (nonEmpty.length === 0) {
    return [];
  }
  const headers = parseCsvLine(nonEmpty[0]).map((header) => header.trim());
  const rows = [];
  for (let index = 1; index < nonEmpty.length; index += 1) {
    const values = parseCsvLine(nonEmpty[index]);
    const row = {};
    for (let h = 0; h < headers.length; h += 1) {
      row[headers[h]] = (values[h] ?? "").trim();
    }
    row.__line = String(index + 1);
    rows.push(row);
  }
  return rows;
}

export async function readCsvFile(csvPath) {
  const content = await fs.readFile(csvPath, "utf8");
  return parseCsv(content);
}

export function splitStripParams(rawValue) {
  if (!rawValue) {
    return [];
  }
  const values = rawValue
    .split("|")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => item.toLowerCase());
  return [...new Set(values)];
}

export async function loadLegacyMap(mapFilePath) {
  const rows = await readCsvFile(mapFilePath);
  const requiredHeaders = [
    "match_type",
    "old_path",
    "action",
    "target_path",
    "strip_params",
    "notes",
  ];
  assert(rows.length > 0, `Legacy map is empty: ${mapFilePath}`);

  for (const header of requiredHeaders) {
    assert(
      Object.prototype.hasOwnProperty.call(rows[0], header),
      `Missing required column '${header}' in ${mapFilePath}`
    );
  }

  const normalized = [];
  for (const row of rows) {
    const matchType = row.match_type.trim();
    const action = row.action.trim();
    assert(
      ALLOWED_MATCH_TYPES.has(matchType),
      `Invalid match_type '${matchType}' at line ${row.__line}`
    );
    assert(
      ALLOWED_ACTIONS.has(action),
      `Invalid action '${action}' at line ${row.__line}`
    );

    const oldPath = normalizePath(row.old_path, { matchType });
    const stripParams = splitStripParams(row.strip_params);
    for (const param of stripParams) {
      assert(
        /^[a-z0-9_.*-]+$/.test(param),
        `Invalid strip param '${param}' at line ${row.__line}`
      );
    }

    let targetPath = "";
    if (action === "301") {
      targetPath = normalizeTargetPath(row.target_path);
    } else if (action === "normalize_query") {
      targetPath = row.target_path
        ? normalizeTargetPath(row.target_path)
        : oldPath;
    } else {
      if (row.target_path && row.target_path.trim().length > 0) {
        throw new Error(
          `410 rows must not set target_path (line ${row.__line}).`
        );
      }
    }

    normalized.push({
      sourceLine: Number(row.__line),
      matchType,
      oldPath,
      action,
      targetPath,
      stripParams,
      notes: row.notes ?? "",
    });
  }

  return normalized;
}

export function createRuleIndex(rows) {
  const exact = new Map();
  const prefix = new Map();

  for (const row of rows) {
    const key = row.oldPath;
    if (row.matchType === "exact") {
      if (exact.has(key)) {
        const existing = exact.get(key);
        const same =
          existing.action === row.action &&
          existing.targetPath === row.targetPath &&
          JSON.stringify(existing.stripParams) ===
            JSON.stringify(row.stripParams);
        assert(
          same,
          `Conflicting exact rule for ${key} at lines ${existing.sourceLine} and ${row.sourceLine}`
        );
        continue;
      }
      exact.set(key, row);
      continue;
    }

    if (prefix.has(key)) {
      const existing = prefix.get(key);
      const same =
        existing.action === row.action &&
        existing.targetPath === row.targetPath &&
        JSON.stringify(existing.stripParams) ===
          JSON.stringify(row.stripParams);
      assert(
        same,
        `Conflicting prefix rule for ${key} at lines ${existing.sourceLine} and ${row.sourceLine}`
      );
      continue;
    }
    prefix.set(key, row);
  }

  const sortedPrefix = [...prefix.values()].sort(
    (left, right) => right.oldPath.length - left.oldPath.length
  );
  return { exact, prefix: sortedPrefix };
}

export function resolveRule(inputPath, index) {
  const normalizedPath = normalizePath(inputPath, { matchType: "exact" });
  const exactMatch = index.exact.get(normalizedPath);
  if (exactMatch) {
    return exactMatch;
  }
  for (const rule of index.prefix) {
    if (normalizedPath.startsWith(rule.oldPath)) {
      return rule;
    }
  }
  return null;
}

function parseTarget(targetPath) {
  const url = new URL(targetPath, CANONICAL_HOST);
  return {
    pathname: normalizePath(url.pathname, { matchType: "exact" }),
    hash: url.hash || "",
  };
}

function shouldStripQueryParam(key, stripParams) {
  const candidate = key.toLowerCase();
  for (const rawStrip of stripParams) {
    const strip = rawStrip.toLowerCase();
    if (strip.endsWith("*")) {
      const prefix = strip.slice(0, -1);
      if (candidate.startsWith(prefix)) {
        return true;
      }
      continue;
    }
    if (candidate === strip) {
      return true;
    }
  }
  return false;
}

export function getCleanedSearchParams(searchParams, stripParams) {
  const cleaned = new URLSearchParams(searchParams.toString());
  const keys = [...new Set([...cleaned.keys()])];
  for (const key of keys) {
    if (shouldStripQueryParam(key, stripParams)) {
      cleaned.delete(key);
    }
  }
  return cleaned;
}

export function applyRuleToUrl(urlObject, rule) {
  if (rule.action === "410") {
    return {
      status: 410,
      action: "410",
      changed: true,
      targetUrl: null,
    };
  }

  const target =
    rule.action === "normalize_query"
      ? rule.targetPath || normalizePath(urlObject.pathname)
      : rule.targetPath;
  const normalizedTarget = parseTarget(target);
  const cleanedQuery = getCleanedSearchParams(
    urlObject.searchParams,
    rule.stripParams
  );

  const final = new URL(urlObject.toString());
  final.pathname = normalizedTarget.pathname;
  final.hash = normalizedTarget.hash;
  final.search = cleanedQuery.toString();

  const original = new URL(urlObject.toString());
  original.pathname = normalizePath(original.pathname);

  const changed = final.toString() !== original.toString();
  return {
    status: 301,
    action: rule.action,
    changed,
    targetUrl: final,
  };
}

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

export async function loadCanonicalInventory(siteRoot) {
  const files = [];
  await walkFiles(siteRoot, files);
  const canonical = new Set();
  for (const filePath of files) {
    const normalizedFilePath = filePath.replace(/\\/g, "/");
    if (!normalizedFilePath.endsWith("/index.html")) {
      continue;
    }
    let relative = path.relative(siteRoot, filePath).replace(/\\/g, "/");
    if (relative === "index.html") {
      canonical.add("/");
      continue;
    }
    relative = relative.replace(/\/index\.html$/, "/");
    canonical.add(normalizePath(`/${relative}`, { matchType: "exact" }));
  }
  return canonical;
}

export function canonicalTargetPathExists(targetPath, canonicalInventory) {
  const parsed = parseTarget(targetPath);
  return canonicalInventory.has(parsed.pathname);
}

export function compileRoutesPatterns(routesConfig) {
  const include = (routesConfig.include ?? []).map((pattern) =>
    pattern.trim()
  );
  const exclude = (routesConfig.exclude ?? []).map((pattern) =>
    pattern.trim()
  );
  return {
    include,
    exclude,
  };
}

function normalizePattern(pattern) {
  if (pattern === "/*") {
    return { type: "prefix", value: "/" };
  }
  if (pattern.endsWith("/*")) {
    return { type: "prefix", value: normalizePath(pattern.slice(0, -1), { matchType: "prefix" }) };
  }
  return { type: "exact", value: normalizePath(pattern, { matchType: "exact" }) };
}

function patternMatchesPath(pathname, rawPattern) {
  const compiled = normalizePattern(rawPattern);
  const normalizedPath = normalizePath(pathname, { matchType: "exact" });
  if (compiled.type === "exact") {
    return normalizedPath === compiled.value;
  }
  return normalizedPath.startsWith(compiled.value);
}

export function pathHandledByFunctions(pathname, routesConfig) {
  const include = routesConfig.include ?? [];
  const exclude = routesConfig.exclude ?? [];
  const included = include.some((pattern) => patternMatchesPath(pathname, pattern));
  if (!included) {
    return false;
  }
  const excluded = exclude.some((pattern) => patternMatchesPath(pathname, pattern));
  return !excluded;
}

export function expandExactSources(oldPath) {
  if (oldPath === "/") {
    return ["/"];
  }
  const withSlash = normalizePath(oldPath, { matchType: "exact" });
  const withoutSlash = withSlash.endsWith("/")
    ? withSlash.slice(0, -1)
    : withSlash;
  return [...new Set([withSlash, withoutSlash])];
}

export async function loadJson(jsonPath) {
  const raw = await fs.readFile(jsonPath, "utf8");
  const sanitized = raw.startsWith("\uFEFF") ? raw.slice(1) : raw;
  return JSON.parse(sanitized);
}

export async function writeJson(jsonPath, value) {
  const payload = `${JSON.stringify(value, null, 2)}\n`;
  await fs.mkdir(path.dirname(jsonPath), { recursive: true });
  await fs.writeFile(jsonPath, payload, "utf8");
}

export async function writeText(textPath, value) {
  await fs.mkdir(path.dirname(textPath), { recursive: true });
  await fs.writeFile(textPath, value, "utf8");
}

export async function loadMismatchRows(mismatchCsvPath) {
  const rows = await readCsvFile(mismatchCsvPath);
  const urlColumn = Object.keys(rows[0] ?? {}).find(
    (key) => key.toLowerCase() === "url"
  );
  assert(urlColumn, `Mismatch CSV missing URL column: ${mismatchCsvPath}`);
  return rows.map((row) => {
    const url = new URL(row[urlColumn]);
    return {
      rawUrl: row[urlColumn],
      path: normalizePath(url.pathname, { matchType: "exact" }),
      query: url.searchParams,
      url,
    };
  });
}

export function detectRedirectProblems(rows, index) {
  const issues = [];
  for (const row of rows) {
    if (row.action !== "301") {
      continue;
    }
    const startPath = normalizePath(row.oldPath, { matchType: "exact" });
    const seen = new Set([startPath]);
    let currentPath = startPath;
    let hops = 0;

    for (let step = 0; step < 10; step += 1) {
      const matched = resolveRule(currentPath, index);
      if (!matched || matched.action !== "301") {
        break;
      }
      hops += 1;
      const nextPath = parseTarget(matched.targetPath).pathname;
      if (seen.has(nextPath)) {
        issues.push(`Redirect loop detected from ${startPath} via ${nextPath}`);
        break;
      }
      seen.add(nextPath);
      currentPath = nextPath;
    }

    if (hops > 1) {
      issues.push(`Redirect chain detected from ${startPath} (${hops} hops)`);
    }
  }
  return issues;
}

export function classifyUrl(urlObject, index) {
  const rule = resolveRule(urlObject.pathname, index);
  if (!rule) {
    return null;
  }
  return {
    rule,
    outcome: applyRuleToUrl(urlObject, rule),
  };
}
