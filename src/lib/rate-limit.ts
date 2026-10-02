/**
 * Tiny in-memory rate limiter (per process — enough for this small app).
 * Keyed buckets of timestamps; true = request allowed.
 */

const buckets = new Map<string, number[]>();

const MAX_KEYS = 5000;

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > MAX_KEYS) {
    // drop the oldest half to keep memory bounded
    let n = 0;
    for (const k of buckets.keys()) {
      buckets.delete(k);
      if (++n > MAX_KEYS / 2) break;
    }
  }
  return true;
}

/** best-effort client IP behind the bare systemd deployment */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "local";
}
