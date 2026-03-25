const MARKET_COOKIE_NAME = "iqmw_market";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function normalizeMarket(value) {
  const lower = String(value || "").trim().toLowerCase();
  if (lower === "global" || lower === "za") {
    return lower;
  }
  return null;
}

function parseCookies(cookieHeader) {
  const out = {};
  for (const part of String(cookieHeader || "").split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    out[key] = value;
  }
  return out;
}

function getCookieMarket(request) {
  const cookieHeader = request.headers.get("Cookie");
  const cookies = parseCookies(cookieHeader);
  return normalizeMarket(cookies[MARKET_COOKIE_NAME]);
}

function getCountryCode(request) {
  const fromCfObject = request.cf?.country;
  const fromHeader = request.headers.get("CF-IPCountry");
  return String(fromCfObject || fromHeader || "").trim().toUpperCase();
}

function buildSetCookieHeader(market) {
  return [
    `${MARKET_COOKIE_NAME}=${market}`,
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax",
    "Secure",
  ].join("; ");
}

function buildRedirectLocation(requestUrl, targetPath) {
  const target = new URL(requestUrl.toString());
  target.pathname = targetPath;
  return target.toString();
}

function createRedirectResponse(requestUrl, targetPath, cookieMarket = null) {
  const headers = new Headers({
    Location: buildRedirectLocation(requestUrl, targetPath),
    "Cache-Control": "no-store",
  });
  if (cookieMarket) {
    headers.append("Set-Cookie", buildSetCookieHeader(cookieMarket));
  }
  return new Response(null, { status: 307, headers });
}

async function createPassThroughResponse(context, cookieMarket = null) {
  const upstream = await context.next();
  if (!cookieMarket) {
    return upstream;
  }
  const headers = new Headers(upstream.headers);
  headers.append("Set-Cookie", buildSetCookieHeader(cookieMarket));
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export async function handlePricingRequest(context) {
  const requestUrl = new URL(context.request.url);
  const queryMarket = normalizeMarket(requestUrl.searchParams.get("market"));
  const cookieMarket = getCookieMarket(context.request);
  const countryCode = getCountryCode(context.request);

  if (queryMarket === "global") {
    return createPassThroughResponse(context, "global");
  }
  if (queryMarket === "za") {
    return createRedirectResponse(requestUrl, "/za/pricing/", "za");
  }

  if (cookieMarket === "global") {
    return context.next();
  }
  if (cookieMarket === "za") {
    return createRedirectResponse(requestUrl, "/za/pricing/");
  }
  if (countryCode === "ZA") {
    return createRedirectResponse(requestUrl, "/za/pricing/");
  }

  return context.next();
}

export async function handleZaPricingRequest(context) {
  const requestUrl = new URL(context.request.url);
  const queryMarket = normalizeMarket(requestUrl.searchParams.get("market"));
  const cookieMarket = getCookieMarket(context.request);

  if (queryMarket === "global") {
    return createRedirectResponse(requestUrl, "/pricing/", "global");
  }
  if (queryMarket === "za") {
    return createPassThroughResponse(context, "za");
  }
  if (cookieMarket === "global") {
    return createRedirectResponse(requestUrl, "/pricing/");
  }

  return context.next();
}
