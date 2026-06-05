import type { Context, Next } from "hono";

// Each limiter owns its OWN bucket store. Previously a single module-level Map was
// shared by every limiter and keyed only by IP — so a request to /api/auth/* was
// counted by BOTH the auth limiter AND the api limiter against the same bucket,
// double-incrementing and tripping 429 at roughly half the stated cap. Separate
// stores keep the counts independent.
function createLimiter(
  maxRequests: number,
  windowMs: number,
  opts: { skip?: (c: Context) => boolean } = {},
) {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return async (c: Context, next: Next) => {
    if (opts.skip?.(c)) return next();
    const ip = c.req.header("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    const now = Date.now();
    const bucket = buckets.get(ip);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count++;
    if (bucket.count > maxRequests) {
      c.header("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      return c.json({ error: "Too many requests" }, 429);
    }

    return next();
  };
}

const num = (v: string | undefined, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : d;
};

// Caps are env-tunable so a packed venue — a whole class behind one router/NAT, i.e.
// one shared public IP — can be accommodated at event time without a redeploy.
// Credential endpoints (login/signup/forgot/reset) stay capped to slow brute-force,
// but high enough that ~50 students on one shared IP can all authenticate.
export const authRateLimiter = createLimiter(
  num(process.env.AUTH_RATE_MAX, 120),
  num(process.env.AUTH_RATE_WINDOW_MS, 60_000),
  // Guest login has its own lenient limiter mounted ahead of this one; don't let
  // the strict credential limiter also count those requests.
  { skip: (c) => c.req.path === "/api/auth/guest" },
);

// Guest login is anonymous — no password to guess — so a roomful provisioning in a
// burst is normal usage, not abuse. Much higher cap, still bounded to stop a runaway
// client loop from creating unlimited accounts.
export const guestRateLimiter = createLimiter(
  num(process.env.GUEST_RATE_MAX, 400),
  num(process.env.GUEST_RATE_WINDOW_MS, 60_000),
);

// 50 participants each make several reads (join, fetch training, modules, roster) on
// the same shared IP, so the old 200 cap was far too low for one classroom.
export const apiRateLimiter = createLimiter(
  num(process.env.API_RATE_MAX, 600),
  num(process.env.API_RATE_WINDOW_MS, 60_000),
);
