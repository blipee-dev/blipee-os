'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { BrainCircuit, Globe, Home, TrendingUp, DollarSign, Heart } from 'lucide-react'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import { useTranslations } from 'next-intl'
import styles from './careers.module.css'
import landingStyles from '../landing/landing.module.css'

export default function CareersPage() {
  const { mode: themeMode, setTheme } = useThemeToggle()
  const t = useTranslations('marketing.careers')

  const benefits = [
    {
      icon: BrainCircuit,
      title: t('benefits.cuttingEdge.title'),
      description: t('benefits.cuttingEdge.description'),
    },
    {
      icon: Globe,
      title: t('benefits.realImpact.title'),
      description: t('benefits.realImpact.description'),
    },
    {
      icon: Home,
      title: t('benefits.remoteFirst.title'),
      description: t('benefits.remoteFirst.description'),
    },
    {
      icon: TrendingUp,
      title: t('benefits.growth.title'),
      description: t('benefits.growth.description'),
    },
    {
      icon: DollarSign,
      title: t('benefits.compensation.title'),
      description: t('benefits.compensation.description'),
    },
    {
      icon: Heart,
      title: t('benefits.wellness.title'),
      description: t('benefits.wellness.description'),
    },
  ]

  const jobs = [
    {
      title: t('jobs.seniorAI.title'),
      location: t('jobs.seniorAI.location'),
      type: t('jobs.seniorAI.type'),
      department: t('jobs.seniorAI.department'),
      description: t('jobs.seniorAI.description'),
      tags: ['Python', 'TensorFlow', 'LLMs', 'MLOps'],
    },
    {
      title: t('jobs.fullStack.title'),
      location: t('jobs.fullStack.location'),
      type: t('jobs.fullStack.type'),
      department: t('jobs.fullStack.department'),
      description: t('jobs.fullStack.description'),
      tags: ['React', 'Next.js', 'TypeScript', 'Node.js'],
    },
    {
      title: t('jobs.productDesigner.title'),
      location: t('jobs.productDesigner.location'),
      type: t('jobs.productDesigner.type'),
      department: t('jobs.productDesigner.department'),
      description: t('jobs.productDesigner.description'),
      tags: ['Figma', 'UI/UX', 'Design Systems', 'User Research'],
    },
    {
      title: t('jobs.sustainability.title'),
      location: t('jobs.sustainability.location'),
      type: t('jobs.sustainability.type'),
      department: t('jobs.sustainability.department'),
      description: t('jobs.sustainability.description'),
      tags: ['ESG', 'Carbon Accounting', 'Supply Chain', 'Compliance'],
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

        <section className={styles.benefitsSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              {t('benefits.title')} <span className={landingStyles.gradientText}>{t('benefits.titleHighlight')}</span>
            </h2>
            <div className={styles.benefitsGrid}>
              {benefits.map((benefit) => (
                <div key={benefit.title} className={styles.benefitCard}>
                  <div className={styles.benefitIcon}>
                    <benefit.icon size={24} color="white" />
                  </div>
                  <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                  <p className={styles.benefitDescription}>{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.jobsSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              {t('jobs.title')} <span className={landingStyles.gradientText}>{t('jobs.titleHighlight')}</span>
            </h2>
            <div className={styles.jobsList}>
              {jobs.map((job) => (
                <div key={job.title} className={styles.jobCard}>
                  <div className={styles.jobHeader}>
                    <div>
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      <div className={styles.jobMeta}>
                        <span className={styles.jobMetaItem}>{job.location}</span>
                        <span className={styles.jobMetaItem}>{job.type}</span>
                        <span className={styles.jobMetaItem}>{job.department}</span>
                      </div>
                    </div>
                    <button className={styles.applyBtn} onClick={() => alert(t('jobs.applyAlert'))}>
                      {t('jobs.applyButton')}
                    </button>
                  </div>
                  <p className={styles.jobDescription}>{job.description}</p>
                  <div className={styles.jobTags}>
                    {job.tags.map((tag) => (
                      <span key={tag} className={styles.jobTag}>{tag}</span>
                    ))}
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
            <a href="/contact" className={styles.ctaButton}>
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
