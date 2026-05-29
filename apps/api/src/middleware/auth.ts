import type { MiddlewareHandler } from "hono";
import { auth } from "../auth";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers
  });

  if (!session) {
    return c.json({ error: "Unauthorized", code: "NO_SESSION" }, 401);
  }

  c.set("userId", session.user.id);
  c.set("userEmail", session.user.email);
  await next();
};
