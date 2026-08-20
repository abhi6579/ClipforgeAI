/**
 * In-memory sliding-window rate limiter.
 * Good for a single instance. Swap the Map for Redis/Upstash when you scale
 * horizontally — the call signature stays identical.
 */

type Hit = { count: number; resetAt: number };

const buckets = new Map<string, Hit>();

// Opportunistic cleanup so the map cannot grow unbounded.
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, hit] of buckets) {
    if (hit.resetAt < now) buckets.delete(key);
  }
}

export type RateResult = { ok: boolean; retryAfter: number; remaining: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  sweep(now);
  const hit = buckets.get(key);

  if (!hit || hit.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0, remaining: limit - 1 };
  }

  hit.count += 1;
  if (hit.count > limit) {
    return { ok: false, retryAfter: Math.ceil((hit.resetAt - now) / 1000), remaining: 0 };
  }
  return { ok: true, retryAfter: 0, remaining: limit - hit.count };
}

/** Best-effort client IP behind a proxy/CDN. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function tooMany(retryAfter: number) {
  return Response.json(
    { error: `Too many attempts. Try again in ${retryAfter}s.` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}
