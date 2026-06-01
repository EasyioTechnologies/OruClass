"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { UserCircle2 } from "lucide-react";

export function EmailAuthForm({
  returnTo = "/dashboard",
  initialMode = "login",
  onBack,
}: {
  returnTo?: string;
  initialMode?: "login" | "signup";
  onBack?: () => void;
}) {
  const { user, isSessionExpired, clearUser } = useAuthStore();
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isContinueAs = isSessionExpired && user && isLogin;

  const [email, setEmail] = useState(isContinueAs ? user.email : "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const router = useRouter();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) {
          const errMsg = error.message || "";
          const errCode = (error as any).code || "";
          
          if (errMsg.toLowerCase().includes("not found") || errCode === "USER_NOT_FOUND" || errMsg.toLowerCase().includes("invalid")) {
            setError("Invalid email or password.");
          } else {
            setError(errMsg || "Failed to sign in. Check your credentials.");
          }
        } else {
          window.location.href = returnTo;
        }
      } else {
        if (!name.trim()) {
          setError("Name is required.");
          setLoading(false);
          return;
        }
        
        const { error } = await authClient.signUp.email({
          email,
          password,
          name,
        });
        
        if (error) {
          const errMsg = error.message || "";
          const errCode = (error as any).code || "";
          if (errMsg.toLowerCase().includes("exist") || errCode === "USER_ALREADY_EXISTS") {
            setError("Account already exists. Please sign in instead.");
          } else {
            setError(errMsg || "Failed to sign up.");
          }
        } else {
          window.location.href = returnTo;
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
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
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 bg-gray-200/70 border-none rounded-2xl text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-gray-200 transition-all"
            required
            minLength={8}
          />
        </div>

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

      <div className={`flex items-center ${onBack ? 'justify-between' : 'justify-center'} pt-2`}>
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
