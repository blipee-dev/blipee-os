/**
 * Sign In Page (V2)
 *
 * Features:
 * - Server Actions for form submission
 * - Works without JavaScript
 * - Automatic validation
 * - OAuth providers
 *
 * Pattern: Server Component → Server Action → Redirect
 */

'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  signIn,
  signInWithGoogle,
  signInWithGitHub,
} from '@/app/actions/v2/auth'
import { useToastMessages } from '@/hooks/useToastMessages'
import styles from '../auth.module.css'

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)

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

      <Link href="/" className={styles.backLink} aria-label="Return to home page">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        <span>Back to Home</span>
      </Link>

      <div className={styles.authLayout}>
        <div className={styles.authLeft}>
          <div className={styles.authContainer}>
            <div className={styles.logoSection}>
              <span className={styles.logoText}>blipee</span>
            </div>

            <div className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>
                Welcome <span className={styles.gradientText}>Back</span>
              </h1>
              <p className={styles.welcomeSubtitle}>
                Sign in to access your dashboard
              </p>
            </div>

            <form action={signIn} className={styles.authForm}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  className={styles.formInput}
                  placeholder="you@company.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.formLabel}>
                  Password
                </label>
                <div className={styles.passwordGroup}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    className={styles.formInput}
                    placeholder="Enter your password"
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

              <div className={styles.formOptions}>
                <label className={styles.rememberMe}>
                  <input type="checkbox" className={styles.checkbox} />
                  <span className={styles.rememberLabel}>Remember me</span>
                </label>
                <Link href="/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Sign In
              </button>
            </form>

            <div className={styles.divider}>
              <div className={styles.dividerLine}>
                <div className={styles.dividerBorder} />
              </div>
              <div className={styles.dividerText}>
                <span className={styles.dividerLabel}>Or continue with</span>
              </div>
            </div>

            <div className={styles.oauthButtons} role="group" aria-label="Sign in with social providers">
              <form action={signInWithGoogle}>
                <button type="submit" className={styles.oauthBtn} aria-label="Sign in with Google">
                  Google
                </button>
              </form>

              <form action={signInWithGitHub}>
                <button type="submit" className={styles.oauthBtn} aria-label="Sign in with GitHub">
                  GitHub
                </button>
              </form>
            </div>

            <div className={styles.signupSection}>
              Don&apos;t have an account?{' '}
              <Link href="/contact" className={styles.signupLink}>
                Get yours here
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
              Your AI <span className={styles.gradientText}>Workforce</span> Awaits
            </h2>
            <p className={styles.visualSubtitle}>
              Access your autonomous sustainability platform with 8 specialized agents working around the clock.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span className={styles.featureText}>Chat with BlipeeAssistant</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14L12 14L11 22L21 10L12 10L13 2Z" />
                  </svg>
                </div>
                <span className={styles.featureText}>Work with our Autonomous Agents</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="m19 9-5 5-4-4-3 3" />
                  </svg>
                </div>
                <span className={styles.featureText}>Track your Targets with ML-Powered Predictions</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                </div>
                <span className={styles.featureText}>Sustainability Reports in One Click</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
