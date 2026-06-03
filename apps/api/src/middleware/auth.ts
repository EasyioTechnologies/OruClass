import type { MiddlewareHandler } from "hono";
import { eq } from "drizzle-orm";
import { verifyAccessToken } from "../auth/jwt";
import { db } from "../db/client";
import * as schema from "../db/schema";

export const authMiddleware: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized", code: "NO_TOKEN" }, 401);
  }

  try {
    const { userId, email } = await verifyAccessToken(authHeader.slice(7));
    c.set("userId", userId);
    c.set("userEmail", email);

    // Check email verification (skip for anonymous/guest users)
    const [user] = await db.select({ emailVerified: schema.users.emailVerified, isAnonymous: schema.users.isAnonymous })
      .from(schema.users).where(eq(schema.users.id, userId)).limit(1);

    if (user && !user.isAnonymous && !user.emailVerified) {
      return c.json({ error: "Email not verified", code: "EMAIL_NOT_VERIFIED" }, 403);
    }

    await next();
  } catch {
    return c.json({ error: "Unauthorized", code: "INVALID_TOKEN" }, 401);
  }
};
