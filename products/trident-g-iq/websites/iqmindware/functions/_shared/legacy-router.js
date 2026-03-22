import routing from "../_generated/legacy-routing.json";

function normalizePath(inputPath) {
  let value = String(inputPath || "/").trim();
  if (!value.startsWith("/")) {
    value = `/${value}`;
  }
  value = value.replace(/\/{2,}/g, "/");
  if (value !== "/" && !value.endsWith("/")) {
    value += "/";
  }
  return value;
}

function resolveRule(pathname) {
  const path = normalizePath(pathname);
  const exactMatch = routing.exact?.[path];
  if (exactMatch) {
    return exactMatch;
  }
  for (const rule of routing.prefix ?? []) {
    if (path.startsWith(rule.old_path)) {
      return rule;
    }
  }
  return null;
}

function shouldStrip(key, stripList) {
  const lower = key.toLowerCase();
  for (const raw of stripList ?? []) {
    const candidate = String(raw).toLowerCase();
    if (candidate.endsWith("*")) {
      const prefix = candidate.slice(0, -1);
      if (lower.startsWith(prefix)) {
        return true;
      }
      continue;
    }
    if (lower === candidate) {
      return true;
    }
  }
  return false;
}

function cleanSearchParams(searchParams, stripList) {
  const cleaned = new URLSearchParams(searchParams.toString());
  const keys = [...new Set([...cleaned.keys()])];
  for (const key of keys) {
    if (shouldStrip(key, stripList)) {
      cleaned.delete(key);
    }
  }
  return cleaned;
}

function buildTargetUrl(requestUrl, rule) {
  const targetPath =
    rule.action === "normalize_query"
      ? rule.target_path || normalizePath(requestUrl.pathname)
      : rule.target_path;
  const target = new URL(targetPath, requestUrl.origin);
  const cleanedQuery = cleanSearchParams(requestUrl.searchParams, rule.strip_params);
  target.search = cleanedQuery.toString();
  return target;
}

export async function handleLegacyRequest(context) {
  const requestUrl = new URL(context.request.url);
  const rule = resolveRule(requestUrl.pathname);
  if (!rule) {
    return context.next();
  }

  if (rule.action === "410") {
    return new Response("Gone", {
      status: 410,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=3600",
      },
    });
  }

  const targetUrl = buildTargetUrl(requestUrl, rule);
  const originalNormalized = new URL(requestUrl.toString());
  originalNormalized.pathname = normalizePath(originalNormalized.pathname);
  if (targetUrl.toString() === originalNormalized.toString()) {
    return context.next();
  }

  return Response.redirect(targetUrl.toString(), 301);
}
