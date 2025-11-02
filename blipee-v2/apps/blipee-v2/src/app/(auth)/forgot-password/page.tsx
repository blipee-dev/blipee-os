/**
 * Forgot Password Page
 *
 * Features:
 * - Server Actions for form submission
 * - Supabase password reset
 * - Toast notifications for errors/success
 *
 * Pattern: Client Component → Server Action → Email sent
 */

'use client'

import Link from 'next/link'
import { resetPassword } from '@/app/actions/v2/auth'
import { useToastMessages } from '@/hooks/useToastMessages'
import styles from '../auth.module.css'

export default function ForgotPasswordPage() {
  // Automatically display toast messages from Server Actions
  useToastMessages()

  return (
    <>
      <div className={styles.bgContainer} aria-hidden="true">
        <div className={styles.bgGradientMesh}></div>
        <div className={`${styles.bgOrb} ${styles.bgOrb1}`}></div>
        <div className={`${styles.bgOrb} ${styles.bgOrb2}`}></div>
        <div className={`${styles.bgOrb} ${styles.bgOrb3}`}></div>
      </div>

      <Link href="/signin" className={styles.backLink} aria-label="Return to sign in page">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        <span>Back to Sign In</span>
      </Link>

      <div className={styles.authLayout}>
        <div className={styles.authLeft}>
          <div className={styles.authContainer}>
            <div className={styles.logoSection}>
              <span className={styles.logoText}>blipee</span>
            </div>

            <div className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>
                Reset Your <span className={styles.gradientText}>Password</span>
              </h1>
              <p className={styles.welcomeSubtitle}>
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            <form action={resetPassword} className={styles.authForm}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  required
                  className={styles.formInput}
                  placeholder="you@company.com"
                />
              </div>

              <button type="submit" className={styles.submitBtn}>
                Send Reset Link
              </button>
            </form>

            <div className={styles.signupSection}>
              Remember your password?{' '}
              <Link href="/signin" className={styles.signupLink}>
                Sign in
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.authRight} aria-hidden="true">
          <div className={styles.visualContent}>
            <div className={styles.visualIcon}>
              <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <rect x="28" y="36" width="64" height="64" rx="20" fill="#10b981" />
                <circle cx="44" cy="60" r="10" fill="#fff" />
                <circle cx="76" cy="60" r="10" fill="#fff" />
                <circle cx="44" cy="60" r="4" fill="#047857" />
                <circle cx="76" cy="60" r="4" fill="#047857" />
                <path d="M50 84c6 6 18 6 24 0" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
                <rect x="50" y="22" width="20" height="18" rx="9" fill="#34d399" />
                <path d="M60 18v6" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
                <circle cx="60" cy="14" r="5" fill="#6ee7b7" />
                <rect x="31" y="46" width="26" height="28" rx="13" stroke="#bbf7d0" strokeWidth="3.5" fill="none" />
                <rect x="63" y="46" width="26" height="28" rx="13" stroke="#bbf7d0" strokeWidth="3.5" fill="none" />
                <rect x="55" y="60" width="10" height="8" rx="4" fill="#bbf7d0" />
                <circle cx="32" cy="92" r="6" fill="#22c55e" opacity="0.7" />
                <circle cx="88" cy="92" r="6" fill="#22c55e" opacity="0.7" />
              </svg>
            </div>
            <h2 className={styles.visualTitle}>
              Secure <span className={styles.gradientText}>Password Reset</span>
            </h2>
            <p className={styles.visualSubtitle}>
              We&apos;ll send you a secure link to reset your password and get you back to managing your sustainability goals.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                  </svg>
                </div>
                <span className={styles.featureText}>Secure encrypted link</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className={styles.featureText}>Link expires in 1 hour</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <span className={styles.featureText}>Check your email inbox</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
