import { Hono } from "hono";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import * as schema from "../db/schema";
import { createJWT } from "../utils/jwt";
import { logger } from "../utils/logger";

// Session lifetime — shared by JWT exp and cookie Max-Age so they cannot drift.
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sessionCookie(token: string): string {
  return `token=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax`;
}

const MOCK_USERS = [
  {
    email: "dev.trainer@oruclass.test",
    name: "Dev Trainer",
    avatarUrl: "https://ui-avatars.com/api/?name=Dev+Trainer&background=6366f1&color=fff&size=128",
    isTrainer: true,
  },
  {
    email: "dev.participant@oruclass.test",
    name: "Dev Participant",
    avatarUrl: "https://ui-avatars.com/api/?name=Dev+Participant&background=10b981&color=fff&size=128",
    isTrainer: false,
  },
];

async function ensureDevWorkspace(userId: string): Promise<string> {
  const existing = await db.query.workspaceMembers.findFirst({
    where: eq(schema.workspaceMembers.userId, userId),
    with: { workspace: true },
  });
  if (existing) return existing.workspaceId;

  const [workspace] = await db
    .insert(schema.workspaces)
    .values({ name: "Dev Workspace", ownerId: userId, settings: {} })
    .returning();

  await db.insert(schema.workspaceMembers).values({
    workspaceId: workspace.id,
    userId,
    role: "owner",
  });

  logger.info({ workspaceId: workspace.id }, "Dev workspace auto-created");
  return workspace.id;
}

let _auth: ReturnType<typeof betterAuth> | null = null;

function getAuth() {
  if (!_auth) {
    try {
      _auth = betterAuth({
        secret: process.env.BETTER_AUTH_SECRET,
        database: drizzleAdapter(db, {
          provider: "pg",
          schema: {
            user: schema.users,
            session: schema.session,
            account: schema.account,
            verification: schema.verification,
          },
        }),
        trustedOrigins: [process.env.WEB_URL ?? "http://localhost:3000"],
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID ?? "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
          redirectURI: `${process.env.BETTER_AUTH_URL ?? "http://localhost:3001"}/api/auth/callback/google`,
        },
      },
      session: {
        expiresIn: SESSION_MAX_AGE_SECONDS,
        updateAge: 60 * 60 * 24,
      },
    });
    } catch (e) {
      console.error("Failed to initialize betterAuth:", e);
      throw e;
    }
  }
  return _auth;
}

export const authRouter = new Hono();

// ── Mock sign-in (dev only) — must be before the better-auth wildcard ────────
authRouter.post("/mock-signin", async (c) => {
  if (process.env.NODE_ENV === "production") {
    return c.json({ error: "Not available in production" }, 404);
  }
  const body = await c.req.json<{ index?: number }>().catch(() => ({}));
  const mock = MOCK_USERS[body.index ?? 0] ?? MOCK_USERS[0];

  let [user] = await db.select().from(schema.users).where(eq(schema.users.email, mock.email));

  if (!user) {
    [user] = await db
      .insert(schema.users)
      .values({ email: mock.email, name: mock.name, avatarUrl: mock.avatarUrl })
      .returning();
  }

  // Auto-provision a default workspace for trainer so workspace-protected routes work immediately
  let defaultWorkspaceId: string | null = null;
  if (mock.isTrainer) {
    defaultWorkspaceId = await ensureDevWorkspace(user.id);
  }

  const token = createJWT({ sub: user.id, email: user.email, name: user.name });

  c.header("Set-Cookie", sessionCookie(token));

  logger.info({ userId: user.id }, "Mock sign-in");
  return c.json({
    user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl },
    defaultWorkspaceId,
  });
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

  c.header("Set-Cookie", sessionCookie(token));
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
