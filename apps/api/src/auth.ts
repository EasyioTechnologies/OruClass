import { betterAuth } from "better-auth";
import { randomUUID } from "crypto";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/client";
import { anonymous } from "better-auth/plugins";
import * as schema from "./db/schema";



export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.session,
      account: schema.account,
      verification: schema.verification
    }
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    anonymous(), // for guest/participant logins
  ],
  trustedOrigins: [
    process.env.WEB_URL ?? "http://localhost:3000",
    "http://localhost:3000",
    "https://www.dezignbuild.site",
    "https://dezignbuild.site"
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh session every 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 min client-side cache to reduce session lookups
    },
  },
  rateLimit: {
    window: 60,
    max: 1000,
  },
  advanced: {
    generateId: () => randomUUID(),
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain: process.env.NODE_ENV === "production" ? ".dezignbuild.site" : undefined,
    }
  }
});
