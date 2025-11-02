/**
 * Reset Password Page
 *
 * Features:
 * - Server Actions for form submission
 * - Supabase password update
 * - Password confirmation validation
 * - Password visibility toggle
 *
 * Pattern: Server Component → Server Action → Password updated
 */

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { updatePassword } from '@/app/actions/v2/auth'
import { useToastMessages } from '@/hooks/useToastMessages'
import styles from '../auth.module.css'

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
                Create New <span className={styles.gradientText}>Password</span>
              </h1>
              <p className={styles.welcomeSubtitle}>
                Choose a strong password to secure your account
              </p>
            </div>

            <form action={updatePassword} className={styles.authForm}>
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.formLabel}>
                  New Password
                </label>
                <div className={styles.passwordGroup}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className={styles.formInput}
                    placeholder="Enter new password (min. 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.passwordToggle}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.formLabel}>
                  Confirm Password
                </label>
                <div className={styles.passwordGroup}>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className={styles.formInput}
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.passwordToggle}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Update Password
              </button>
            </form>

            <div className={styles.signupSection}>
              Return to{' '}
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
              Secure Your <span className={styles.gradientText}>Account</span>
            </h2>
            <p className={styles.visualSubtitle}>
              Create a strong password to protect your sustainability data and AI agents.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <span className={styles.featureText}>Minimum 8 characters required</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                  </svg>
                </div>
                <span className={styles.featureText}>Encrypted and secure storage</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className={styles.featureText}>Instant account access after update</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
