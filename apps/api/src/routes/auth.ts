import { Hono } from "hono";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { createJWT } from "../utils/jwt";
import { logger } from "../utils/logger";

const MOCK_USERS = [
  {
    email: "dev.trainer@oruclass.test",
    name: "Dev Trainer",
    avatarUrl: "https://ui-avatars.com/api/?name=Dev+Trainer&background=6366f1&color=fff&size=128",
  },
  {
    email: "dev.participant@oruclass.test",
    name: "Dev Participant",
    avatarUrl: "https://ui-avatars.com/api/?name=Dev+Participant&background=10b981&color=fff&size=128",
  },
];

let _auth: ReturnType<typeof betterAuth> | null = null;

function getAuth() {
  if (!_auth) {
    _auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: { user: schema.users },
      }),
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID ?? "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
          redirectURI: `${process.env.BETTER_AUTH_URL ?? "http://localhost:3001"}/api/auth/callback/google`,
        },
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
      },
    });
  }
  return _auth;
}

export const authRouter = new Hono();

// ── Mock sign-in (dev only) — must be before the better-auth wildcard ────────
authRouter.post("/mock-signin", async (c) => {
  const body = await c.req.json<{ index?: number }>().catch(() => ({}));
  const mock = MOCK_USERS[body.index ?? 0] ?? MOCK_USERS[0];

  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, mock.email));

  if (!user) {
    [user] = await db
      .insert(schema.users)
      .values({ email: mock.email, name: mock.name, avatarUrl: mock.avatarUrl })
      .returning();
  }

  const token = createJWT({ sub: user.id, email: user.email, name: user.name });

  c.header("Set-Cookie", `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`);

  logger.info({ userId: user.id }, "Mock sign-in");
  return c.json({ user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl } });
});

// Exchange better-auth session for our own JWT (used after real Google callback)
authRouter.post("/token", async (c) => {
  const session = await getAuth().api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) return c.json({ error: "No active session" }, 401);

  const token = createJWT({
    sub: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });

  c.header("Set-Cookie", `token=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`);
  logger.info({ userId: session.user.id }, "JWT issued");
  return c.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      avatarUrl: (session.user as Record<string, unknown>).image as string | null ?? null,
    },
  });
});

authRouter.post("/logout", async (c) => {
  c.header("Set-Cookie", "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
  return c.json({ success: true });
});

// Delegate everything else to better-auth (Google OAuth flow)
authRouter.all("/*", async (c) => {
  return getAuth().handler(c.req.raw);
});

export { getAuth as auth };
