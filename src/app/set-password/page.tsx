"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/providers/LanguageProvider";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import {
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const t = useTranslations('auth.setPassword');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Get user info from the current session using auth state listener
    const checkSession = async () => {
      const supabase = createClient();

      // Set up auth state listener for real-time session updates
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {

          setUserEmail(session.user.email || "");
          setUserName(session.user.user_metadata?.full_name ||
                      session.user.user_metadata?.name ||
                      session.user.email?.split('@')[0] || "");

          // Check if password has already been set
          if (session.user.user_metadata?.password_set) {
            router.push("/blipee-ai");
          } else {
            setSessionChecked(true);
          }
        }
      });

      // Also check immediately for existing session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUserEmail(session.user.email || "");
        setUserName(session.user.user_metadata?.full_name ||
                    session.user.user_metadata?.name ||
                    session.user.email?.split('@')[0] || "");

        // Check if password has already been set
        if (session.user.user_metadata?.password_set) {
          router.push("/blipee-ai");
        } else {
          setSessionChecked(true);
        }
      } else {
        // If no session after timeout, redirect to signin
        const timeoutId = setTimeout(() => {
          router.push("/signin");
        }, 5000);

        // Cleanup timeout if session is found
        return () => {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
        };
      }

      // Cleanup subscription
      return () => {
        subscription.unsubscribe();
      };
    };

    checkSession();
  }, [router]);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) {
      return t('passwordTooShort') || "Password must be at least 8 characters";
    }
    if (!/[A-Z]/.test(pass)) {
      return t('passwordNeedsUppercase') || "Password must contain at least one uppercase letter";
    }
    if (!/[a-z]/.test(pass)) {
      return t('passwordNeedsLowercase') || "Password must contain at least one lowercase letter";
    }
    if (!/[0-9]/.test(pass)) {
      return t('passwordNeedsNumber') || "Password must contain at least one number";
    }
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError(t('passwordsDontMatch') || "Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      // Update user metadata to mark as onboarded and password set
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          onboarded: true,
          password_set: true
        }
      });

      if (metadataError) {
        throw metadataError;
      }

      setSuccess(true);

      // Wait for auth state to update, then redirect
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user?.user_metadata?.password_set) {
          subscription.unsubscribe();
          router.push("/blipee-ai");
        }
      });

      // Fallback redirect after 3 seconds if auth state doesn't update
      setTimeout(() => {
        subscription.unsubscribe();
        router.push("/blipee-ai");
      }, 3000);

    } catch (err: any) {
      setError(err.message || t('failedToSetPassword') || "Failed to set password");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthLayout
        title=""
        subtitle={t('passwordSetSuccess') || "Password set successfully!"}
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
            {t('redirectingToDashboard') || "Redirecting to dashboard..."}
          </p>

          <Loader2 className="animate-spin h-5 w-5 mx-auto text-purple-600 dark:text-purple-400" />
        </div>
      </AuthLayout>
    );
  }

  // Show loading state while checking session
  if (!sessionChecked && !success) {
    return (
      <AuthLayout
        title={t('title') || "Set Your Password"}
        subtitle={t('subtitle') || "Create a secure password to access your account"}
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('title') || "Set Your Password"}
      subtitle={t('subtitle') || "Create a secure password to access your account"}
    >
      {/* Welcome message */}
      {userName && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 px-4 py-3 rounded-xl mb-6">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {t('welcome') || "Welcome"} <strong>{userName}</strong>!
            <br />
            <span className="text-xs text-purple-600 dark:text-purple-400">
              {t('accountCreatedFor') || "Your account has been created for"} {userEmail}
            </span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-3 sm:px-4 py-3 rounded-lg sm:rounded-xl text-sm flex items-start" role="alert" aria-live="polite">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Password requirements */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-3 sm:px-4 py-3 rounded-lg sm:rounded-xl text-xs">
          <div className="flex items-start">
            <Info className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div className="text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">{t('passwordRequirements') || "Password Requirements:"}</p>
              <ul className="space-y-0.5 text-blue-600 dark:text-blue-400">
                <li>• {t('req1') || "At least 8 characters"}</li>
                <li>• {t('req2') || "One uppercase letter"}</li>
                <li>• {t('req3') || "One lowercase letter"}</li>
                <li>• {t('req4') || "One number"}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5 sm:mb-2"
          >
            {t('newPassword') || "New Password"}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-white/60 pointer-events-none z-10" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-9 sm:pl-10 pr-10 py-2.5 sm:py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-[#616161] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400/50 focus:border-purple-500/50 focus:bg-white dark:focus:bg-[#757575] transition-all focus:outline-none"
              aria-label="New password"
              aria-required="true"
              placeholder={t('enterPassword') || "Enter your new password"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/60 hover:text-gray-600 dark:hover:text-white/80 z-10"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Password strength meter */}
          {password && (
            <div className="mt-2">
              <PasswordStrengthMeter
                password={password}
                userInputs={[userEmail, userName]}
                showFeedback={true}
              />
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5 sm:mb-2"
          >
            {t('confirmPassword') || "Confirm Password"}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-white/60 pointer-events-none z-10" />
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full pl-9 sm:pl-10 pr-10 py-2.5 sm:py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl bg-gray-50 dark:bg-[#616161] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400/50 focus:border-purple-500/50 focus:bg-white dark:focus:bg-[#757575] transition-all focus:outline-none"
              aria-label="Confirm password"
              aria-required="true"
              placeholder={t('confirmPasswordPlaceholder') || "Re-enter your password"}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/60 hover:text-gray-600 dark:hover:text-white/80 z-10"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !password || !confirmPassword}
          className="w-full flex items-center justify-center px-4 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm sm:text-base rounded-lg sm:rounded-xl hover:from-purple-600 hover:to-pink-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transform transition-all hover:scale-[1.01] active:scale-[0.99] font-semibold shadow-xl shadow-purple-500/25"
          aria-label="Set password"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              {t('settingPassword') || "Setting Password..."}
            </>
          ) : (
            t('setPasswordButton') || "Set Password & Continue"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}