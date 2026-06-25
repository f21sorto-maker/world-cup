export const config = {
  runtime: "edge"
};

const ALLOWED_PREFIXES = ["/sport/football/", "/event/"] as const;

const UPSTREAM_HEADERS: HeadersInit = {
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.sofascore.com/",
  Origin: "https://www.sofascore.com",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  "X-Requested-With": "XMLHttpRequest"
};

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/sofascore/, "") || "/";

  const isAllowed = ALLOWED_PREFIXES.some((prefix) => path.startsWith(prefix));
  if (!isAllowed) {
    return Response.json({ error: "Path not allowed" }, { status: 403 });
  }

  const upstream = `https://api.sofascore.com/api/v1${path}${url.search}`;
  const upstreamRes = await fetch(upstream, { headers: UPSTREAM_HEADERS });
  const body = await upstreamRes.text();

  return new Response(body, {
    status: upstreamRes.status,
    headers: {
      "Content-Type": upstreamRes.headers.get("content-type") ?? "application/json"
    }
  });
}
