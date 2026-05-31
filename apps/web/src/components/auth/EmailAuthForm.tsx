"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function EmailAuthForm({
  returnTo = "/dashboard",
  initialMode = "login",
  onBack,
}: {
  returnTo?: string;
  initialMode?: "login" | "signup";
  onBack?: () => void;
}) {
  const [isLogin, setIsLogin] = useState(initialMode === "login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
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
          
          if (errMsg.toLowerCase().includes("not found") || errCode === "USER_NOT_FOUND") {
            setIsLogin(false);
            setError("Account not found. Please sign up instead.");
          } else {
            setError(errMsg || "Failed to sign in. Check your credentials.");
          }
        } else {
          router.push(returnTo);
          router.refresh();
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
            setIsLogin(true);
            setError("Account already exists. Please sign in instead.");
          } else {
            setError(errMsg || "Failed to sign up.");
          }
        } else {
          router.push(returnTo);
          router.refresh();
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-4 bg-gray-200/70 border-none rounded-2xl text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-gray-200 transition-all"
              required={!isLogin}
            />
          </div>
        )}
        <div>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-5 py-4 bg-gray-200/70 border-none rounded-2xl text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-gray-200 transition-all"
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 bg-gray-200/70 border-none rounded-2xl text-base text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-gray-200 transition-all"
            required
            minLength={8}
          />
        </div>

        {error && <p className="text-[15px] text-red-500 text-center">{error}</p>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-4 bg-emerald-600 text-white rounded-2xl text-[16px] font-semibold hover:bg-emerald-700 hover:shadow-md transition-all disabled:opacity-50"
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
            className="text-emerald-600 text-[16px] font-semibold hover:text-emerald-700 transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
