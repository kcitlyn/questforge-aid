// Best-effort in-memory rate limiter for the AI endpoints.
//
// Scope honestly stated: in a serverless deploy each isolate keeps its own
// counter, so this is abuse *dampening*, not a hard guarantee. For production
// you'd back this with KV/Durable Objects. It still stops the cheap attack —
// a loop hammering one warm instance — and demonstrates the control.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20; // per IP per minute across AI endpoints

const hits = new Map<string, { count: number; windowStart: number }>();

export function rateLimit(request: Request): Response | null {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return null;
  }

  entry.count += 1;
  if (entry.count > MAX_REQUESTS) {
    return new Response(
      "Taking a short breather — try again in a minute.",
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  return null;
}
