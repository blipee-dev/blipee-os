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
        title=""
        subtitle="Two-factor authentication required"
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
      title=""
      subtitle="Enter your credentials to access your workspace"
    >

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg sm:rounded-xl"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
        {/* Email Input */}
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5 sm:mb-2"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              required
              disabled={checkingSSO}
              autoComplete="email"
              className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/30 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-white dark:focus:bg-white/10 transition-all disabled:opacity-50 backdrop-blur focus:outline-none"
              aria-label="Email address"
              aria-required="true"
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "email-error" : undefined}
              placeholder="name@company.com"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5 sm:mb-2"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="block w-full pl-9 sm:pl-10 pr-12 py-2.5 sm:py-3 text-sm border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/30 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-white dark:focus:bg-white/10 transition-all backdrop-blur focus:outline-none"
              aria-label="Password"
              aria-required="true"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 rounded"
              aria-label={showPassword ? "Hide password" : "Show password"}
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
              className="h-4 w-4 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 border-gray-300 rounded accent-purple-600"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-xs text-gray-700 dark:text-white/60"
            >
              Remember me
            </label>
          </div>
          <Link
            href="/forgot-password"
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-1"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm sm:text-base rounded-lg sm:rounded-xl hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-[1.01] active:scale-[0.99] font-semibold shadow-xl shadow-purple-500/25"
          aria-label="Sign in to your account"
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
      </form>
    </AuthLayout>
  );
}
