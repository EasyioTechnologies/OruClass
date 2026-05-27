import type { Context, Next } from "hono";

const buckets = new Map<string, { count: number; resetAt: number }>();

function createLimiter(maxRequests: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const now = Date.now();
    const bucket = buckets.get(ip);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count++;
    if (bucket.count > maxRequests) {
      return c.json({ error: "Too many requests" }, 429);
    }

    return next();
  };
}

export const authRateLimiter = createLimiter(20, 60_000);
export const apiRateLimiter = createLimiter(200, 60_000);
