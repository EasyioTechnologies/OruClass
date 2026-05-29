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
  trustedOrigins: [process.env.WEB_URL ?? "http://localhost:3000", "http://localhost:3000"],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    }
  },
  rateLimit: {
    window: 60, // 1 minute
    max: 1000,  // 1000 requests per minute to prevent 429s during frequent rerenders
  },
  advanced: {
    generateId: () => randomUUID(),
    crossSubDomainCookies: {
      enabled: true
    }
  }
});
