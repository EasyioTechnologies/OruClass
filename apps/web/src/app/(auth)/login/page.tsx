import type { Metadata } from "next";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
        <p className="text-sm text-gray-500">Sign in to oruClassrooms</p>
      </div>

      <GoogleSignInButton />

      <p className="text-xs text-center text-gray-400">
        By signing in, you agree to our terms of service and privacy policy.
      </p>
    </div>
  );
}
