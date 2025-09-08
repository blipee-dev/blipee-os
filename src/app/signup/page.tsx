"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Briefcase,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { signUp } = useAuth();

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(formData.password), text: "One uppercase letter" },
    { met: /[a-z]/.test(formData.password), text: "One lowercase letter" },
    { met: /[0-9]/.test(formData.password), text: "One number" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate password requirements
    if (!passwordRequirements.every((req) => req.met)) {
      setError("Password does not meet all requirements");
      return;
    }

    setLoading(true);

    try {
      await signUp(formData.email, formData.password, {
        fullName: formData.fullName,
        companyName: formData.companyName,
        role: "subscription_owner",
      });
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      setLoading(false);
    }
  }

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  }

  async function handleSocialSignUp(provider: "google" | "azure") {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, isSignUp: true }),
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

  return (
    <AuthLayout
      title=""
      subtitle="Join thousands of teams building a sustainable future"
    >

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg sm:rounded-xl"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5 sm:mb-2"
          >
            Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-4 w-4 text-gray-400 dark:text-white/40" />
            </div>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              required
              className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/30/50 focus:border-purple-500/50 focus:bg-white dark:focus:bg-white/10 transition-all backdrop-blur focus:outline-none"
              aria-label="Full name"
              aria-required="true"
              placeholder="Enter your full name"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5 sm:mb-2"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-400 dark:text-white/40" />
            </div>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/30/50 focus:border-purple-500/50 focus:bg-white dark:focus:bg-white/10 transition-all backdrop-blur focus:outline-none"
              aria-label="Email address"
              aria-required="true"
              placeholder="name@company.com"
            />
          </div>
        </div>

        {/* Company Name */}
        <div>
          <label
            htmlFor="companyName"
            className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5 sm:mb-2"
          >
            Company
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Briefcase className="h-4 w-4 text-gray-400 dark:text-white/40" />
            </div>
            <input
              id="companyName"
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange("companyName", e.target.value)}
              required
              className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/30/50 focus:border-purple-500/50 focus:bg-white dark:focus:bg-white/10 transition-all backdrop-blur focus:outline-none"
              aria-label="Company name"
              aria-required="true"
              placeholder="Your company name"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5 sm:mb-2"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 text-gray-400 dark:text-white/40" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
              className="block w-full pl-9 sm:pl-10 pr-12 py-2.5 sm:py-3 text-sm border border-gray-200 dark:border-white/10 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/30/50 focus:border-purple-500/50 focus:bg-white dark:focus:bg-white/10 transition-all backdrop-blur focus:outline-none"
              aria-label="Password"
              aria-required="true"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-600 focus:outline-none rounded"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Password Requirements */}
          {formData.password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-1"
            >
              {passwordRequirements.map((req, index) => (
                <div
                  key={index}
                  className={`flex items-center text-sm ${
                    req.met ? "text-purple-600" : "text-gray-400"
                  }`}
                >
                  {req.met ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <div className="w-4 h-4 mr-2 rounded-full border border-gray-300" />
                  )}
                  {req.text}
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            required
            className="h-4 w-4 text-purple-600 border-gray-300 dark:border-white/20 rounded accent-purple-600 mt-0.5"
          />
          <label
            htmlFor="terms"
            className="ml-2 block text-xs text-gray-700 dark:text-white/60"
          >
            I agree to the{" "}
            <Link
              href="/terms"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              Privacy Policy
            </Link>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm sm:text-base rounded-lg sm:rounded-xl hover:from-purple-600 hover:to-pink-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-[1.01] active:scale-[0.99] font-semibold shadow-xl shadow-purple-500/25"
          aria-label="Create your account"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white dark:bg-gray-900 text-gray-500 dark:text-white/40 text-xs">
              Or continue with
            </span>
          </div>
        </div>

        {/* Social Sign Up */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleSocialSignUp("google")}
            disabled={loading}
            className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 text-sm font-medium text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur"
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
            onClick={() => handleSocialSignUp("azure")}
            disabled={loading}
            className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50 dark:bg-white/5 text-sm font-medium text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur"
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

      {/* Sign In Link */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-700 dark:text-white/40">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
