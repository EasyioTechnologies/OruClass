import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

const client = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  fetchOptions: {
    credentials: "include" as RequestCredentials,
  },
  plugins: [
    anonymousClient()
  ]
});

export const authClient = client as any;
