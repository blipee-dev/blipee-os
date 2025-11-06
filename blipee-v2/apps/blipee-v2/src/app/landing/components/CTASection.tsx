'use client'

import { useTranslations } from 'next-intl'
import styles from '../landing.module.css'
import { getCtaContent } from '../content/data'

export function CTASection() {
  const t = useTranslations('landing')

  return (
    <section className={styles.ctaSection} id="contact">
      <div className={styles.ctaContent}>
        <h2 className={styles.ctaTitle}>
          {getCtaContent(t).title}{' '}
          <span className={styles.gradientText}>{getCtaContent(t).highlight}</span>
        </h2>
        <p className={styles.ctaDescription}>{getCtaContent(t).description}</p>
        <div className={styles.heroActions}>
          <a href={getCtaContent(t).primary.href} className={`${styles.navButton} ${styles.primaryButton}`}>
            {getCtaContent(t).primary.label}
          </a>
          <a href={getCtaContent(t).secondary.href} className={`${styles.navButton} ${styles.ghostButton}`}>
            {getCtaContent(t).secondary.label}
          </a>
        </div>
      </div>
    </section>
  )
}
