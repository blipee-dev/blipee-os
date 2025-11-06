'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import { useTranslations } from 'next-intl'
import styles from './about.module.css'
import landingStyles from '../landing/landing.module.css'

export default function AboutPage() {
  const { mode: themeMode, setTheme } = useThemeToggle()
  const t = useTranslations('marketing.about')

  const stats = [
    { number: t('stats.aiAgents.number'), label: t('stats.aiAgents.label') },
    { number: t('stats.uptime.number'), label: t('stats.uptime.label') },
    { number: t('stats.accuracy.number'), label: t('stats.accuracy.label') },
    { number: t('stats.costReduction.number'), label: t('stats.costReduction.label') },
  ]

  const timeline = [
    {
      year: t('timeline.vision.year'),
      title: t('timeline.vision.title'),
      description: t('timeline.vision.description'),
    },
    {
      year: t('timeline.firstAgents.year'),
      title: t('timeline.firstAgents.title'),
      description: t('timeline.firstAgents.description'),
    },
    {
      year: t('timeline.completeWorkforce.year'),
      title: t('timeline.completeWorkforce.title'),
      description: t('timeline.completeWorkforce.description'),
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

        <section className={styles.storySection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              {t('story.title')} <span className={landingStyles.gradientText}>{t('story.titleHighlight')}</span>
            </h2>
            <div className={styles.sectionContent}>
              <p>
                {t('story.paragraph1')}
              </p>
              <p>
                {t('story.paragraph2')}
              </p>
              <p>
                {t('story.paragraph3')}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.statsSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              {t('stats.title')} <span className={landingStyles.gradientText}>{t('stats.titleHighlight')}</span>
            </h2>
            <div className={styles.statsGrid}>
              {stats.map((stat) => (
                <div key={stat.label} className={styles.statItem}>
                  <div className={styles.statNumber}>{stat.number}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.timelineSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              {t('timeline.title')} <span className={landingStyles.gradientText}>{t('timeline.titleHighlight')}</span>
            </h2>
            <div className={styles.timeline}>
              {timeline.map((item) => (
                <div key={item.year} className={styles.timelineItem}>
                  <div className={styles.timelineYear}>{item.year}</div>
                  <div className={styles.timelineContent}>
                    <h3 className={styles.timelineTitle}>{item.title}</h3>
                    <p className={styles.timelineDescription}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              {t('cta.title')} <span className={styles.gradientText}>{t('cta.titleHighlight')}</span>
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
