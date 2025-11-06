'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { Target, Clock, Shield, Award } from 'lucide-react'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import { useTranslations } from 'next-intl'
import styles from './company.module.css'
import landingStyles from '../landing/landing.module.css'

export default function CompanyPage() {
  const { mode: themeMode, setTheme } = useThemeToggle()
  const t = useTranslations('marketing.company')

  const values = [
    {
      icon: Award,
      title: t('values.innovation.title'),
      description: t('values.innovation.description'),
    },
    {
      icon: Clock,
      title: t('values.commitment.title'),
      description: t('values.commitment.description'),
    },
    {
      icon: Shield,
      title: t('values.trust.title'),
      description: t('values.trust.description'),
    },
    {
      icon: Target,
      title: t('values.impact.title'),
      description: t('values.impact.description'),
    },
  ]

  return (
    <div className={landingStyles.landing}>
      <Background />
      <div className={landingStyles.contentWrapper}>
        <Navbar />
        <main className={styles.main}>
          <section className={styles.hero}>
            <h1 className={styles.heroTitle}>
              {t('hero.title')} <span className={landingStyles.gradientText}>{t('hero.titleHighlight')}</span>
            </h1>
            <p className={styles.heroSubtitle}>
              {t('hero.subtitle')}
            </p>
          </section>

          <section className={styles.missionSection}>
            <div className={styles.container}>
              <h2 className={styles.sectionTitle}>
                {t('mission.title')} <span className={landingStyles.gradientText}>{t('mission.titleHighlight')}</span>
              </h2>
              <div className={styles.sectionContent}>
                <p>
                  {t('mission.paragraph1')}
                </p>
                <p>
                  {t('mission.paragraph2')}
                </p>
              </div>
            </div>
          </section>

          <section className={styles.valuesSection}>
            <div className={styles.container}>
              <h2 className={styles.sectionTitle}>
                {t('values.title')} <span className={landingStyles.gradientText}>{t('values.titleHighlight')}</span>
              </h2>
              <div className={styles.valuesGrid}>
                {values.map((value) => (
                  <div key={value.title} className={styles.valueCard}>
                    <div className={styles.valueIcon}>
                      <value.icon size={24} color="white" />
                    </div>
                    <h3 className={styles.valueTitle}>{value.title}</h3>
                    <p className={styles.valueDescription}>{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.ctaSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              {t('cta.title')} <span className={landingStyles.gradientText}>{t('cta.titleHighlight')}</span>
            </h2>
            <p className={styles.ctaText}>
              {t('cta.text')}
            </p>
            <a href="/careers" className={styles.ctaButton}>
              {t('cta.button')}
            </a>
          </div>
        </section>
      </main>
      <Footer themeMode={themeMode} onThemeChange={setTheme} />
    </div>
  </div>
  )
}
