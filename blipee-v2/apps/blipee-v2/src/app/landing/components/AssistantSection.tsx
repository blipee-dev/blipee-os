'use client'

import { useTranslations } from 'next-intl'
import styles from '../landing.module.css'
import { getAssistantContent, getAssistantFeatures } from '../content/data'

export function AssistantSection() {
  const t = useTranslations('landing')

  return (
    <section className={styles.assistantSection} id="assistant">
      <div className={styles.assistantGrid}>
        <div>
          <h2 className={styles.assistantHeading}>
            The <span className={styles.gradientText}>{getAssistantContent(t).title}</span>
          </h2>
          <p className={styles.assistantDescription}>{getAssistantContent(t).description}</p>
          <ul className={styles.assistantFeatures}>
            {getAssistantFeatures(t).map(feature => (
              <li key={feature} className={styles.assistantFeatureItem}>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.assistantVisual}>
          <div className={styles.assistantBlob}>
            <svg
              className={styles.assistantRobot}
              viewBox="0 0 120 120"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="28" y="36" width="64" height="64" rx="20" fill="#10b981" />
              <circle cx="44" cy="60" r="10" fill="#fff" />
              <circle cx="76" cy="60" r="10" fill="#fff" />
              <circle cx="44" cy="60" r="4" fill="#047857" />
              <circle cx="76" cy="60" r="4" fill="#047857" />
              <path d="M50 84c6 6 18 6 24 0" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
              <rect x="50" y="22" width="20" height="18" rx="9" fill="#34d399" />
              <path d="M60 18v6" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
              <circle cx="60" cy="14" r="5" fill="#6ee7b7" />
              <rect x="31" y="46" width="26" height="28" rx="13" stroke="#bbf7d0" strokeWidth="3.5" fill="none" />
              <rect x="63" y="46" width="26" height="28" rx="13" stroke="#bbf7d0" strokeWidth="3.5" fill="none" />
              <rect x="55" y="60" width="10" height="8" rx="4" fill="#bbf7d0" />
              <circle cx="32" cy="92" r="6" fill="#22c55e" opacity="0.7" />
              <circle cx="88" cy="92" r="6" fill="#22c55e" opacity="0.7" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
