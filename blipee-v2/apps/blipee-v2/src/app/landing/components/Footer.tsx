'use client'

import { useTranslations } from 'next-intl'
import styles from '../landing.module.css'
import { getFooterSections, getFooterSummary, getFooterSocial } from '../content/data'
import { ThemeToggleButton } from './ThemeToggleButton'
import { BlipeeAssistant } from '@/components/agents'
import type { ThemeMode } from '../hooks/useThemeToggle'
import { FormEvent, useState } from 'react'
import { subscribeToNewsletter } from '@/app/actions/v2/newsletter'

type FooterProps = {
  themeMode: ThemeMode
  onThemeChange: (mode: ThemeMode) => void
}

export function Footer({ themeMode, onThemeChange }: FooterProps) {
  const t = useTranslations('landing')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleNewsletterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const result = await subscribeToNewsletter(formData)

      if (result.success) {
        alert(`✓ ${result.message}`)
        form.reset()
      } else {
        alert(result.error || 'Failed to subscribe. Please try again.')
      }
    } catch (error) {
      console.error('Newsletter error:', error)
      alert('Failed to subscribe. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerGrid}>
          <div className={`${styles.footerBrand} ${styles.footerSection}`}>
            <div className={styles.footerLogoContainer}>
              <div className={styles.assistantContainer}>
                <div className={styles.assistantBlob}>
                  <svg
                    className={styles.assistantRobot}
                    viewBox="0 0 120 120"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
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
              </div>
              <div className={styles.footerLogo}>{getFooterSummary(t).brand}</div>
            </div>
            <p className={styles.footerDescription}>{getFooterSummary(t).description}</p>
            <div className={styles.socialLinks}>
              {getFooterSocial(t).map(link => (
                <a key={link.label} href={link.href} className={styles.socialLink} aria-label={link.label}>
                  {link.icon}
                </a>
              ))}
            </div>
            <div className={styles.footerToggle}>
              <ThemeToggleButton mode={themeMode} onChange={onThemeChange} variant="footer" />
            </div>
          </div>

          {getFooterSections(t).map(section => (
            <div key={section.title} className={styles.footerSection}>
              <h4 className={styles.footerSectionTitle}>{section.title}</h4>
              <ul className={styles.footerLinks}>
                {section.links.map(link => (
                  <li key={link.href}>
                    <a href={link.href} className={styles.footerLink}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className={styles.footerSection}>
            <h4 className={styles.footerSectionTitle}>Stay Updated</h4>
            <p className={styles.footerDescription}>
              Get the latest sustainability insights and product updates.
            </p>
            <form className={styles.newsletterForm} onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                name="email"
                required
                disabled={isSubmitting}
                className={styles.newsletterInput}
                placeholder={getFooterSummary(t).newsletterPlaceholder}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${styles.navButton} ${styles.primaryButton}`}
              >
                {isSubmitting ? 'Subscribing...' : getFooterSummary(t).newsletterCta}
              </button>
            </form>
          </div>
        </div>

        <div className={`${styles.footerDivider} ${styles.footerDividerBottom}`} />

        <div className={styles.footerBottom}>
          <p>{getFooterSummary(t).copyright}</p>
          <div className={styles.footerBottomLinks}>
            <a href="/privacy" className={styles.footerBottomLink}>
              Privacy Policy
            </a>
            <a href="/terms" className={styles.footerBottomLink}>
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
