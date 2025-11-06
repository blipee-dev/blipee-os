'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { CTASection } from '../landing/components/CTASection'
import { BlipeeAssistant } from '@/components/agents'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import { useTranslations } from 'next-intl'
import { Sparkles } from 'lucide-react'
import styles from './updates.module.css'
import landingStyles from '../landing/landing.module.css'

export default function UpdatesPage() {
  const { mode: themeMode, setTheme } = useThemeToggle()
  const t = useTranslations('marketing.updates')

  return (
    <div className={landingStyles.landing}>
      <Background />
      <div className={landingStyles.contentWrapper}>
        <Navbar />
        <main className={styles.main}>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <div className={styles.badge}>
                <Sparkles size={16} />
                <span>{t('badge')}</span>
              </div>

              <h1 className={styles.title}>
                {t('title')} <span className={landingStyles.gradientText}>{t('titleHighlight')}</span> {t('titleSuffix')}
              </h1>

              <p className={styles.subtitle}>
                {t('subtitle')}
              </p>

              <div className={styles.visualContainer}>
                <div className={styles.screen}>
                  <div className={styles.screenHeader}>
                    <div className={styles.dots}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div className={styles.screenTitle}>blipee</div>
                  </div>
                  <div className={styles.screenContent}>
                    <div className={styles.logoText}>blipee</div>
                    <div className={styles.animatedDots}>
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
                <div className={styles.assistantWrapper}>
                  <BlipeeAssistant size={140} />
                </div>
              </div>
            </div>
          </section>
          <CTASection />
        </main>
        <Footer themeMode={themeMode} onThemeChange={setTheme} />
      </div>
    </div>
  )
}
