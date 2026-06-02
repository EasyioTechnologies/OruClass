import { betterAuth } from "better-auth";
import { randomUUID } from "crypto";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/client";
import { anonymous } from "better-auth/plugins";
import * as schema from "./db/schema";
import {
  sendWelcomeEmail,
  sendVerificationEmail as sendVerificationEmailFn,
  sendResetPasswordEmail,
  sendPasswordChangedEmail,
} from "./services/email.service";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendResetPasswordEmail({
          to: user.email,
          name: user.name,
          url,
        });
      } catch (err) {
        console.error("[email] reset password email failed:", err);
      }
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
    autoSignIn: true, // auto-sign-in after signup since verification is skipped
    onPasswordReset: async ({ user }: { user: any }) => {
      if (user.email) {
        sendPasswordChangedEmail({ to: user.email, name: user.name }).catch(() => {});
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      try {
        await sendVerificationEmailFn({
          to: user.email,
          name: user.name,
          url,
        });
      } catch (err) {
        console.error("[email] verification email failed:", err);
      }
    },
    expiresIn: 86400, // 24 hours
  },
  plugins: [
    anonymous(), // for guest/participant logins
  ],
  trustedOrigins: [
    process.env.WEB_URL ?? "http://localhost:3000",
    "http://localhost:3000",
    "https://www.orulabs.in",
    "https://orulabs.in",
  ],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh session every 24h
    cookieCache: {
      enabled: false,
      maxAge: 60 * 5,
    },
  },
  rateLimit: {
    window: 60,
    max: 1000,
    customRules: [
      {
        path: "/get-session",
        max: 5000,
      },
    ],
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user: any) => {
          if (user.email && user.name) {
            const loginUrl = (process.env.WEB_URL ?? "http://localhost:3000") + "/dashboard";
            sendWelcomeEmail({ to: user.email, name: user.name, loginUrl }).catch(() => {});
          }
        },
      },
    },
  },
  advanced: {
    generateId: () => randomUUID(),
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === "production",
      domain: process.env.NODE_ENV === "production" ? ".orulabs.in" : undefined,
    },
  },
});
