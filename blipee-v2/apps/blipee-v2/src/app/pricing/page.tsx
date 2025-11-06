'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { Check, ArrowRight, Mail, Phone, MessageSquare, Lightbulb, TrendingUp, Target, Bot, Activity, Shield, Plug, Headphones, Sparkles } from 'lucide-react'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import styles from './pricing.module.css'
import landingStyles from '../landing/landing.module.css'

export default function PricingPage() {
  const { mode: themeMode, setTheme } = useThemeToggle()
  const t = useTranslations('marketing.pricing')

  return (
    <div className={landingStyles.landing}>
      <Background />
      <div className={landingStyles.contentWrapper}>
        <Navbar />
        <main className={styles.main}>
          {/* Hero Section */}
          <section className={styles.hero} id="pricing">
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                {t('hero.title')} <span className={landingStyles.gradientText}>{t('hero.titleHighlight')}</span>
              </h1>
              <p className={styles.heroSubtitle}>
                {t('hero.subtitle')}
              </p>
            </div>
          </section>

          {/* Value Proposition */}
          <section className={styles.valueSection} id="value" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
            <div className={landingStyles.aiGrid}>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Lightbulb size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>{t('value.tailored.title')}</h3>
                <p className={landingStyles.aiDescription}>
                  {t('value.tailored.description')}
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <TrendingUp size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>{t('value.flexible.title')}</h3>
                <p className={landingStyles.aiDescription}>
                  {t('value.flexible.description')}
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Target size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>{t('value.enterprise.title')}</h3>
                <p className={landingStyles.aiDescription}>
                  {t('value.enterprise.description')}
                </p>
              </article>
            </div>
          </section>

          {/* What's Included */}
          <section className={styles.includedSection} id="features">
            <h2 className={styles.sectionTitle}>{t('included.title')}</h2>
            <div className={landingStyles.aiGrid}>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Bot size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>{t('included.aiAgents.title')}</h3>
                <p className={landingStyles.aiDescription}>
                  {t('included.aiAgents.description')}
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Sparkles size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>{t('included.assistant.title')}</h3>
                <p className={landingStyles.aiDescription}>
                  {t('included.assistant.description')}
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Activity size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>{t('included.monitoring.title')}</h3>
                <p className={landingStyles.aiDescription}>
                  {t('included.monitoring.description')}
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Shield size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>{t('included.compliance.title')}</h3>
                <p className={landingStyles.aiDescription}>
                  {t('included.compliance.description')}
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Plug size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>{t('included.api.title')}</h3>
                <p className={landingStyles.aiDescription}>
                  {t('included.api.description')}
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Plug size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>{t('included.integrations.title')}</h3>
                <p className={landingStyles.aiDescription}>
                  {t('included.integrations.description')}
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Headphones size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>{t('included.support.title')}</h3>
                <p className={landingStyles.aiDescription}>
                  {t('included.support.description')}
                </p>
              </article>
            </div>
          </section>

          {/* Contact CTA */}
          <section className={landingStyles.ctaSection} id="contact" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
            <div className={landingStyles.ctaContent}>
              <h2 className={landingStyles.ctaTitle}>
                {t('cta.title')} <span className={landingStyles.gradientText}>{t('cta.titleHighlight')}</span>
              </h2>
              <p className={landingStyles.ctaDescription}>
                {t('cta.description')}
              </p>
              <div className={landingStyles.heroActions}>
                <Link href="/contact" className={`${landingStyles.navButton} ${landingStyles.primaryButton}`}>
                  {t('cta.button')}
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer themeMode={themeMode} onThemeChange={setTheme} />
      </div>
    </div>
  )
}
