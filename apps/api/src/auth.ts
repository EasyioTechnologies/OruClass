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
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    }
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
      enabled: false,
      maxAge: 60 * 5, // 5 min client-side cache to reduce session lookups
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    }
  },
  rateLimit: {
    window: 60,
    max: 1000,
  },
  advanced: {
    generateId: () => randomUUID(),
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production"
    }
  }
});
