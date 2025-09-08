"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/AuthLayout";
import {
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthLayout
        title=""
        subtitle="Password reset link sent"
      >

        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4"
          >
            <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </motion.div>

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
            We sent a password reset link to <strong>{email}</strong>
          </p>

          <p className="text-xs text-gray-700 dark:text-gray-400 mb-6">
            Didn&apos;t receive the email? Check your spam folder or{" "}
            <button
              onClick={() => {
                setSuccess(false);
                setError("");
              }}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
            >
              try again
            </button>
          </p>

          <Link
            href="/signin"
            className="inline-flex items-center text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title=""
      subtitle="We'll help you get back into your account"
    >

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 sm:px-4 py-3 rounded-lg sm:rounded-xl text-sm flex items-start" role="alert" aria-live="polite">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5 sm:mb-2"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/60 dark:text-white/60 pointer-events-none z-10" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-[#616161] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 focus:bg-white dark:focus:bg-[#757575] transition-all focus:outline-none"
            aria-label="Email address"
            aria-required="true"
              placeholder="name@company.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full flex items-center justify-center px-4 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm sm:text-base rounded-lg sm:rounded-xl hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-[1.01] active:scale-[0.99] font-semibold shadow-xl shadow-purple-500/25"
          aria-label="Send password reset link"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Sending...
            </>
          ) : (
            "Send reset link"
          )}
        </button>

        <div className="text-center">
          <Link
            href="/signin"
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium inline-flex items-center transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded px-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
