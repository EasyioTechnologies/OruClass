import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/client";
import { anonymous } from "better-auth/plugins";
import * as schema from "./db/schema";

// Custom plugin to restrict email domains
const emailDomainWhitelist = {
  id: "email-domain-whitelist",
  hooks: {
    before: [{
      matcher(context: any) { return context.path === "/sign-up/email"; },
      handler: async (c: any) => {
        try {
          const body = await c.request.clone().json();
          if (body?.email) {
            const domain = body.email.split('@')[1]?.toLowerCase();
            const allowedDomains = ["gmail.com", "outlook.com", "hotmail.com", "yahoo.com", "icloud.com"];
            if (!domain || !allowedDomains.includes(domain)) {
              return new Response(JSON.stringify({ message: "Email domain not allowed. Please use a valid provider like Gmail or Outlook." }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              });
            }
          }
        } catch (e) {}
        return { context: c };
      }
    }]
  }
};

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
    emailDomainWhitelist,
  ],
  trustedOrigins: ["http://localhost:3000"],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  advanced: {
    generateId: () => crypto.randomUUID(),
  }
});
