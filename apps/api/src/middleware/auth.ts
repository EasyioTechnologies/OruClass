import type { MiddlewareHandler } from "hono";
import { extractTokenFromHeader, verifyJWT } from "../utils/jwt";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  const token = extractTokenFromHeader(authHeader)
    ?? c.req.header("x-auth-token")
    ?? getCookieToken(c.req.header("Cookie"));

  if (!token) {
    return c.json({ error: "Unauthorized", code: "NO_TOKEN" }, 401);
  }

  try {
    const payload = verifyJWT(token);
    c.set("userId", payload.sub);
    c.set("userEmail", payload.email);
    await next();
  } catch {
    return c.json({ error: "Unauthorized", code: "INVALID_TOKEN" }, 401);
  }
};

function getCookieToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match?.[1] ?? null;
}
