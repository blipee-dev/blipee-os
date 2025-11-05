/**
 * Forgot Password Page - i18n enabled
 *
 * Features:
 * - Server Actions for form submission
 * - Supabase password reset
 * - Toast notifications for errors/success
 * - Multi-language support (en-US, es-ES, pt-PT)
 *
 * Pattern: Client Component → Server Action → Email sent
 */

'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { resetPassword } from '@/app/actions/v2/auth'
import { useToastMessages } from '@/hooks/useToastMessages'
import styles from '../auth.module.css'

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const t = useTranslations('auth.forgotPassword')

  // Automatically display toast messages from Server Actions
  useToastMessages()

  const handleSubmit = async (formData: FormData) => {
    console.log('[FORGOT PASSWORD CLIENT] Form submitted')
    console.log('[FORGOT PASSWORD CLIENT] Email:', formData.get('email'))

    startTransition(async () => {
      console.log('[FORGOT PASSWORD CLIENT] Starting transition')
      try {
        await resetPassword(formData)
        console.log('[FORGOT PASSWORD CLIENT] Server action completed')
      } catch (error) {
        console.error('[FORGOT PASSWORD CLIENT] Error:', error)
      }
    })
  }

  return (
    <>
      <div className={styles.bgContainer} aria-hidden="true">
        <div className={styles.bgGradientMesh}></div>
        <div className={`${styles.bgOrb} ${styles.bgOrb1}`}></div>
        <div className={`${styles.bgOrb} ${styles.bgOrb2}`}></div>
        <div className={`${styles.bgOrb} ${styles.bgOrb3}`}></div>
      </div>

      <Link href="/signin" className={styles.backLink} aria-label={t('backToSignIn')}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        <span>{t('backToSignIn')}</span>
      </Link>

      <div className={styles.authLayout}>
        <div className={styles.authLeft}>
          <div className={styles.authContainer}>
            <div className={styles.logoSection}>
              <span className={styles.logoText}>blipee</span>
            </div>

            <div className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>
                {t('title')} <span className={styles.gradientText}>{t('titleHighlight')}</span>
              </h1>
              <p className={styles.welcomeSubtitle}>
                {t('subtitle')}
              </p>
            </div>

            <form action={handleSubmit} className={styles.authForm}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>
                  {t('emailLabel')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.formInput}
                  placeholder={t('emailPlaceholder')}
                  disabled={isPending}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isPending}>
                {isPending ? t('submitButtonSending') : t('submitButton')}
              </button>
            </form>

            <div className={styles.signupSection}>
              {t('rememberPassword')}{' '}
              <Link href="/signin" className={styles.signupLink}>
                {t('signIn')}
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
              {t('rightTitle')} <span className={styles.gradientText}>{t('rightTitleHighlight')}</span>
            </h2>
            <p className={styles.visualSubtitle}>
              {t('rightSubtitle')}
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                  </svg>
                </div>
                <span className={styles.featureText}>{t('features.secure')}</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className={styles.featureText}>{t('features.expires')}</span>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <span className={styles.featureText}>{t('features.checkEmail')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
