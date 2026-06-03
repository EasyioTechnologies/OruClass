"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { apiClient } from "@/lib/api-client";
import { setTokens } from "@/lib/token-storage";
import { UserCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export function EmailAuthForm(props: {
  returnTo?: string;
  initialMode?: "login" | "signup";
  onBack?: () => void;
}) {
  return (
    <Suspense fallback={<div className="h-64" />}>
      <EmailAuthFormInner {...props} />
    </Suspense>
  );
}

function EmailAuthFormInner({
  returnTo = "/dashboard",
  initialMode = "login",
  onBack,
}: {
  returnTo?: string;
  initialMode?: "login" | "signup";
  onBack?: () => void;
}) {
  const { user, isSessionExpired, clearUser, setUser } = useAuthStore();
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isContinueAs = isSessionExpired && user && isLogin;

  const [email, setEmail] = useState(isContinueAs ? user.email : "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const effectiveReturnTo = returnTo !== "/dashboard" ? returnTo : (searchParams.get("returnTo") ?? returnTo);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { data } = await apiClient.post("/api/auth/login", { email, password });
        setTokens(data.accessToken, data.refreshToken);
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatarUrl: data.user.avatarUrl ?? data.user.image,
          authProvider: data.user.isAnonymous ? "guest" : "email",
        } as any);
        router.push(effectiveReturnTo);
      } else {
        if (!name.trim()) {
          setError("Name is required.");
          setLoading(false);
          return;
        }

        const { data } = await apiClient.post("/api/auth/signup", { email, password, name });
        setTokens(data.accessToken, data.refreshToken);
        setUser({
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          avatarUrl: data.user.avatarUrl ?? data.user.image,
          authProvider: "email",
        } as any);
        router.push(effectiveReturnTo);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "";
      const errCode = err.response?.data?.code || "";

      if (errCode === "INVALID_CREDENTIALS" || errMsg.toLowerCase().includes("invalid")) {
        setError("No account found with this email, or incorrect password. Please check your details or sign up.");
      } else if (errCode === "USER_ALREADY_EXISTS") {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (errCode === "WEAK_PASSWORD") {
        setError("Password is too weak. Use at least 8 characters with uppercase, lowercase, and a number.");
      } else if (err.response?.status === 429) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError(errMsg || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {isContinueAs && (
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl mb-4 text-center">
          <p className="text-[14px] text-orange-800 font-medium mb-1">Your session has expired</p>
          <p className="text-[13px] text-orange-600/80">Please log in again to continue.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 bg-gray-200/70 border-none rounded-2xl text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-gray-200 transition-all"
              required={!isLogin}
            />
          </div>
        )}

        {isContinueAs ? (
          <div className="flex items-center justify-between px-5 py-4 bg-gray-100 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full" />
              ) : (
                <UserCircle2 className="w-10 h-10 text-gray-400" />
              )}
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                clearUser();
                setEmail("");
              }}
              className="text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Not you?
            </button>
          </div>
        ) : (
          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-gray-200/70 border-none rounded-2xl text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-gray-200 transition-all"
              required
            />
          </div>
        )}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 pr-12 bg-gray-200/70 border-none rounded-2xl text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-gray-200 transition-all"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {isLogin && (
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-brand-600 font-medium hover:text-brand-700 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        )}

        {error && <p className="text-[15px] text-red-500 text-center">{error}</p>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-4 bg-brand-600 text-white rounded-2xl text-[16px] font-semibold hover:bg-brand-700 hover:shadow-md transition-all disabled:opacity-50"
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </form>

      <div className={`flex items-center ${onBack ? "justify-between" : "justify-center"} pt-2`}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 text-[16px]"
          >
            ← Back
          </button>
        )}
        <div className="text-center w-full">
          <span className="text-[#8E8E93] text-[15px] mr-2">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-brand-600 text-[16px] font-semibold hover:text-brand-700 transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
