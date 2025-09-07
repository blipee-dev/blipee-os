"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, Mail, Lock, EyeOff, Eye, Loader2, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { MFAVerification } from "@/components/auth/mfa/MFAVerification";
import { useSSOAuth } from "@/hooks/useSSOAuth";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [challengeId, setChallengeId] = useState("");
  const [checkingSSO, setCheckingSSO] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();
  const { initiateSSO, checkSSO } = useSSOAuth();

  // Load remembered email on mount
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe");
    const lastEmail = localStorage.getItem("lastEmail");
    if (remembered === "true" && lastEmail) {
      setEmail(lastEmail);
      setRememberMe(true);
    }
  }, []);

  // Check for SSO when email changes
  const handleEmailChange = async (value: string) => {
    setEmail(value);
    
    // Check if SSO is required for this email domain
    if (value.includes('@') && value.split('@')[1]) {
      setCheckingSSO(true);
      const ssoRequired = await checkSSO(value);
      setCheckingSSO(false);
      
      if (ssoRequired) {
        // Automatically redirect to SSO
        const domain = value.split('@')[1];
        if (domain) {
          initiateSSO({ domain });
        }
      }
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn(email, password);

      // Check if MFA is required
      if (result && result.requiresMFA) {
        setMfaRequired(true);
        setChallengeId(result.challengeId);
        setLoading(false);
        return;
      }

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("lastEmail", email);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("lastEmail");
      }
      
      // Skip onboarding for demo users, go straight to dashboard
      if (email.includes("demo") || email.includes("@blipee.com")) {
        router.push("/dashboard");
      } else {
        // Use Next.js router for navigation
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: "google" | "azure") {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate OAuth");
      }

      // Redirect to OAuth URL
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleDemoSignIn() {
    setError("");
    setLoading(true);

    try {
      // Create a demo account on the fly
      const demoEmail = `demo-${Date.now()}@blipee.com`;
      const demoPassword = "DemoPass123!";

      // First try to sign up
      try {
        await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: demoEmail,
            password: demoPassword,
            fullName: "Demo User",
            companyName: "Demo Company",
          }),
        });
      } catch (e) {
        // Ignore signup errors
      }

      // Then sign in
      await signIn(demoEmail, demoPassword);
      
      // Demo accounts go straight to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError("Demo sign in failed. Please try manual signup.");
      setLoading(false);
    }
  }

  async function handleMFASuccess() {
    // Redirect to the appropriate page after successful MFA
    router.push("/dashboard");
  }

  // Show MFA verification if required
  if (mfaRequired && challengeId) {
    return (
      <AuthLayout
        title="Two-Factor Authentication"
        subtitle="Enter your verification code to continue"
      >
        <MFAVerification
          challengeId={challengeId}
          onSuccess={handleMFASuccess}
          onCancel={() => {
            setMfaRequired(false);
            setChallengeId("");
            setPassword("");
          }}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Continue your sustainability journey with AI"
    >
      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
        >
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-xs font-medium text-white/70 mb-2"
          >
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-white/40" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
              disabled={checkingSSO}
              className="block w-full pl-10 pr-3 py-3 text-sm border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/30 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-white/10 transition-all disabled:opacity-50 backdrop-blur"
              placeholder="you@company.com"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-xs font-medium text-white/70 mb-2"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-white/40" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="block w-full pl-10 pr-12 py-3 text-sm border border-white/10 rounded-xl bg-white/5 text-white placeholder-white/30 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-white/10 transition-all backdrop-blur"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* SSO Indicator */}
        {checkingSSO && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <div className="flex items-center">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Checking for SSO configuration...
              </p>
            </div>
          </motion.div>
        )}

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded accent-purple-600"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-xs text-white/60"
            >
              Remember me
            </label>
          </div>
          <Link
            href="/forgot-password"
            className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-xl hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-[1.01] active:scale-[0.99] font-semibold shadow-xl shadow-purple-500/25"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>

        {/* Demo Account Button */}
        <button
          type="button"
          onClick={handleDemoSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-3 border border-white/10 text-white/70 text-sm rounded-xl hover:bg-white/5 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium backdrop-blur"
        >
          Try Demo Account
        </button>
      </form>

      {/* Divider */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white/40 text-xs">
              Or continue with
            </span>
          </div>
        </div>

        {/* SSO Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              if (email && email.includes('@')) {
                const domain = email.split('@')[1];
                if (domain) {
                  initiateSSO({ domain });
                } else {
                  setError('Invalid email domain');
                }
              } else {
                setError('Please enter your email address first');
              }
            }}
            disabled={loading || checkingSSO}
            className="w-full flex items-center justify-center px-4 py-2.5 border border-white/10 text-white/60 text-sm rounded-xl hover:bg-white/5 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium backdrop-blur"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Sign in with Enterprise SSO
          </button>
        </div>

        {/* Social Sign In */}
        <div className="mt-6 flex flex-col sm:grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            disabled={loading}
            className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-white/10 rounded-xl bg-white/5 text-sm font-medium text-white/70 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="ml-2">Google</span>
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin("azure")}
            disabled={loading}
            className="w-full inline-flex items-center justify-center py-2.5 px-4 border border-white/10 rounded-xl bg-white/5 text-sm font-medium text-white/70 hover:bg-white/10 hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur"
          >
            <svg className="w-5 h-5" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            <span className="ml-2">Microsoft</span>
          </button>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <p className="text-xs text-white/40">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-purple-400 hover:text-purple-300 transition-colors"
          >
            Start your sustainability journey
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
