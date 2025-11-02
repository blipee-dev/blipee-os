'use client'

import styles from '../landing.module.css'
import { impactStats } from '../content/data'

export function ImpactSection() {
  return (
    <section className={styles.impactSection} id="impact">
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          Results That Change <span className={styles.gradientText}>Everything</span>
        </h2>
        <p className={styles.sectionDescription}>
          Our AI workforce doesn&apos;t just analyse — it transforms how you operate.
        </p>
      </div>
      <div className={styles.impactGrid}>
        {impactStats.map(stat => (
          <article key={stat.value} className={styles.impactItem}>
            <strong className={styles.impactValue}>{stat.value}</strong>
            <p className={styles.impactLabel}>{stat.label}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
