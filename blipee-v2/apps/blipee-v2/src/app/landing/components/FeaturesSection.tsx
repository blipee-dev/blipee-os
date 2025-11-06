'use client'

import { useTranslations } from 'next-intl'
import styles from '../landing.module.css'
import { getAiFeatures } from '../content/data'

export function FeaturesSection() {
  const t = useTranslations('landing')

  return (
    <section className={styles.aiFeatures} id="features">
      <div className={styles.aiGrid}>
        {getAiFeatures(t).map(feature => (
          <article key={feature.title} className={styles.aiCard}>
            <div className={styles.aiIcon}>{feature.icon}</div>
            <h3 className={styles.aiTitle}>{feature.title}</h3>
            <p className={styles.aiDescription}>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
