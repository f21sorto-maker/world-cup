export const config = { runtime: "edge" };

/**
 * Vercel edge proxy for SofaScore direct API.
 * Injects browser-like headers so SofaScore's edge doesn't 403 us.
 * Allowlisted paths only — anything else returns 403.
 */

const ALLOWED_PREFIXES = ["/sport/football/", "/event/"] as const;

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.sofascore.com/",
  Origin: "https://www.sofascore.com",
  "X-Requested-With": "XMLHttpRequest",
};

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const rawPath = url.searchParams.get("path") ?? "";
  const path = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;

  const isAllowed = ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: "Path not in allowlist", path }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upstream = `https://api.sofascore.com/api/v1${path}`;

  try {
    const upstreamRes = await fetch(upstream, { headers: BROWSER_HEADERS });
    const body = await upstreamRes.text();

    if (!upstreamRes.ok) {
      return new Response(JSON.stringify({ error: `upstream ${upstreamRes.status}`, body }), {
        status: upstreamRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(body, {
      status: upstreamRes.status,
      headers: { "Content-Type": upstreamRes.headers.get("Content-Type") ?? "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "proxy fetch failed", detail: String(err) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
