'use client'

import { useTranslations } from 'next-intl'
import styles from '../landing.module.css'
import { getProblemContent } from '../content/data'

export function ProblemSection() {
  const t = useTranslations('landing')

  return (
    <section className={styles.problem}>
      <div className={styles.problemContent}>
        <h2 className={styles.problemTitle}>
          {getProblemContent(t).titlePrefix}{' '}
          <span className={styles.gradientText}>{getProblemContent(t).highlight}</span>{' '}
          {getProblemContent(t).titleSuffix}
        </h2>
        <p className={styles.problemText}>{getProblemContent(t).description}</p>
      </div>
    </section>
  )
}
