'use client'

import styles from '../landing.module.css'
import { aiFeatures } from '../content/data'

export function FeaturesSection() {
  return (
    <section className={styles.aiFeatures} id="features">
      <div className={styles.aiGrid}>
        {aiFeatures.map(feature => (
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
