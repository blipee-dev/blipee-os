'use client'

import Link from 'next/link'
import styles from '../landing.module.css'
import { heroContent } from '../content/data'

export function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgePulse} />
          <span>{heroContent.badge}</span>
        </div>
        <h1 className={styles.heroTitle}>
          Stop Managing Sustainability.
          <br />
          Start <span className={styles.gradientText}>{heroContent.highlight}</span>
        </h1>
        <p className={styles.heroSubtitle}>{heroContent.description}</p>
        <div className={styles.heroActions}>
          <Link href={heroContent.primaryCta.href} className={`${styles.navButton} ${styles.primaryButton}`}>
            {heroContent.primaryCta.label}
          </Link>
          <Link href={heroContent.secondaryCta.href} className={`${styles.navButton} ${styles.ghostButton}`}>
            {heroContent.secondaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  )
}
