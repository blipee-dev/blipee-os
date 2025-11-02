'use client'

import styles from '../landing.module.css'
import { problemContent } from '../content/data'

export function ProblemSection() {
  return (
    <section className={styles.problem}>
      <div className={styles.problemContent}>
        <h2 className={styles.problemTitle}>
          {problemContent.titlePrefix}{' '}
          <span className={styles.gradientText}>{problemContent.highlight}</span>{' '}
          {problemContent.titleSuffix}
        </h2>
        <p className={styles.problemText}>{problemContent.description}</p>
      </div>
    </section>
  )
}
