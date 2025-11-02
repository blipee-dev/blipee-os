'use client'

import styles from '../landing.module.css'
import { ctaContent } from '../content/data'

export function CTASection() {
  return (
    <section className={styles.ctaSection} id="contact">
      <div className={styles.ctaContent}>
        <h2 className={styles.ctaTitle}>
          {ctaContent.title}{' '}
          <span className={styles.gradientText}>{ctaContent.highlight}</span>
        </h2>
        <p className={styles.ctaDescription}>{ctaContent.description}</p>
        <div className={styles.heroActions}>
          <a href={ctaContent.primary.href} className={`${styles.navButton} ${styles.primaryButton}`}>
            {ctaContent.primary.label}
          </a>
          <a href={ctaContent.secondary.href} className={`${styles.navButton} ${styles.ghostButton}`}>
            {ctaContent.secondary.label}
          </a>
        </div>
      </div>
    </section>
  )
}
