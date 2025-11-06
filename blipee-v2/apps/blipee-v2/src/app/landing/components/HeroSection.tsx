'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import styles from '../landing.module.css'
import { getHeroContent } from '../content/data'

export function HeroSection() {
  const t = useTranslations('landing')

  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgePulse} />
          <span>{getHeroContent(t).badge}</span>
        </div>
        <h1 className={styles.heroTitle}>
          Stop Managing Sustainability.
          <br />
          Start <span className={styles.gradientText}>{getHeroContent(t).highlight}</span>
        </h1>
        <p className={styles.heroSubtitle}>{getHeroContent(t).description}</p>
        <div className={styles.heroActions}>
          <Link href={getHeroContent(t).primaryCta.href} className={`${styles.navButton} ${styles.primaryButton}`}>
            {getHeroContent(t).primaryCta.label}
          </Link>
          <Link href={getHeroContent(t).secondaryCta.href} className={`${styles.navButton} ${styles.ghostButton}`}>
            {getHeroContent(t).secondaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  )
}
