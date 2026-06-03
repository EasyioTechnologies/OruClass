import type { MiddlewareHandler } from "hono";
import { verifyAccessToken } from "../auth/jwt";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized", code: "NO_TOKEN" }, 401);
  }

  try {
    const { userId, email } = await verifyAccessToken(authHeader.slice(7));
    c.set("userId", userId);
    c.set("userEmail", email);
    await next();
  } catch {
    return c.json({ error: "Unauthorized", code: "INVALID_TOKEN" }, 401);
  }
};
