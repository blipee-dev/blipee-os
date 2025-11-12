/* eslint-disable react/no-unescaped-entities */
/**
 * Cookie Consent Banner Component
 * 
 * GDPR/CCPA compliant cookie consent management
 * Features:
 * - Cookie categories (essential, analytics, marketing)
 * - Granular consent control
 * - Persistent storage
 * - Customizable preferences
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { logConsent, getCurrentConsent, shouldRequestNewConsent } from '@/lib/consent'
import type { ConsentPreferences } from '@/types/consent'
import styles from './CookieConsent.module.css'

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    // Check if user has already given consent and if policy version is current
    const consent = getCurrentConsent()
    const needsNewConsent = shouldRequestNewConsent()
    
    if (!consent || needsNewConsent) {
      setShowBanner(true)
    } else {
      setPreferences(consent)
      // Initialize analytics/marketing based on consent
      if (consent.analytics) {
        initializeAnalytics()
      }
      if (consent.marketing) {
        initializeMarketing()
      }
    }
  }, [])

  const saveConsent = async (prefs: ConsentPreferences) => {
    // Log consent with timestamp, version, and user agent
    await logConsent(prefs)
    
    setPreferences(prefs)
    setShowBanner(false)
    setShowPreferences(false)

    // Initialize services based on consent
    if (prefs.analytics) {
      initializeAnalytics()
    }
    if (prefs.marketing) {
      initializeMarketing()
    }
  }

  const acceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
    })
  }

  const acceptEssentialOnly = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
    })
  }

  const savePreferences = () => {
    saveConsent(preferences)
  }

  const initializeAnalytics = () => {
    // Initialize Google Analytics or similar
    // Example: gtag('consent', 'update', { analytics_storage: 'granted' })
    console.log('Analytics initialized')
  }

  const initializeMarketing = () => {
    // Initialize marketing cookies
    // Example: gtag('consent', 'update', { ad_storage: 'granted' })
    console.log('Marketing initialized')
  }

  if (!showBanner) return null

  return (
    <>
      <div className={styles.overlay} aria-hidden="true" />
      <div className={styles.banner} role="dialog" aria-labelledby="cookie-consent-title" aria-describedby="cookie-consent-description">
        {!showPreferences ? (
          <div className={styles.content}>
            <div className={styles.icon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="6" r="1" />
                <circle cx="12" cy="18" r="1" />
                <circle cx="6" cy="12" r="1" />
                <circle cx="18" cy="12" r="1" />
              </svg>
            </div>

            <div className={styles.text}>
              <h2 id="cookie-consent-title" className={styles.title}>We Value Your Privacy</h2>
              <p id="cookie-consent-description" className={styles.description}>
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. 
                By clicking "Accept All", you consent to our use of cookies. Read our{' '}
                <Link href="/privacy" className={styles.link}>Privacy Policy</Link> and{' '}
                <Link href="/terms" className={styles.link}>Terms of Service</Link>.
              </p>
            </div>

            <div className={styles.actions}>
              <button
                onClick={() => setShowPreferences(true)}
                className={styles.btnSecondary}
                aria-label="Customize cookie preferences"
              >
                Customize
              </button>
              <button
                onClick={acceptEssentialOnly}
                className={styles.btnSecondary}
                aria-label="Accept essential cookies only"
              >
                Essential Only
              </button>
              <button
                onClick={acceptAll}
                className={styles.btnPrimary}
                aria-label="Accept all cookies"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.preferences}>
            <div className={styles.preferencesHeader}>
              <h2 className={styles.title}>Cookie Preferences</h2>
              <button
                onClick={() => setShowPreferences(false)}
                className={styles.closeBtn}
                aria-label="Close preferences and return to banner"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className={styles.preferencesContent}>
              <div className={styles.category}>
                <div className={styles.categoryHeader}>
                  <label className={styles.categoryLabel}>
                    <input
                      type="checkbox"
                      checked={preferences.essential}
                      disabled
                      className={styles.checkbox}
                      aria-label="Essential cookies - always active"
                    />
                    <div className={styles.categoryInfo}>
                      <h3>Essential Cookies</h3>
                      <p>Required for the website to function properly. Cannot be disabled.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className={styles.category}>
                <div className={styles.categoryHeader}>
                  <label className={styles.categoryLabel}>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className={styles.checkbox}
                      aria-label="Analytics cookies"
                    />
                    <div className={styles.categoryInfo}>
                      <h3>Analytics Cookies</h3>
                      <p>Help us understand how visitors interact with our website by collecting and reporting information anonymously.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className={styles.category}>
                <div className={styles.categoryHeader}>
                  <label className={styles.categoryLabel}>
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                      className={styles.checkbox}
                      aria-label="Marketing cookies"
                    />
                    <div className={styles.categoryInfo}>
                      <h3>Marketing Cookies</h3>
                      <p>Used to track visitors across websites to display relevant and personalized advertisements.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.preferencesActions}>
              <button
                onClick={() => setShowPreferences(false)}
                className={styles.btnSecondary}
                aria-label="Cancel and return to banner"
              >
                Cancel
              </button>
              <button
                onClick={savePreferences}
                className={styles.btnPrimary}
                aria-label="Save cookie preferences"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
