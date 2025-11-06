'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import styles from './privacy.module.css'

export default function PrivacyPage() {
  const t = useTranslations('legal')

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink} aria-label="Return to home page">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          <span>{t('common.backToHome')}</span>
        </Link>
        <h1 className={styles.title}>{t('privacy.title')}</h1>
        <p className={styles.lastUpdated}>{t('common.lastUpdated')}</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>{t('privacy.section1.title')}</h2>
          <p>{t('privacy.section1.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.section2.title')}</h2>
          <h3>{t('privacy.section2.subsection1.title')}</h3>
          <p>{t('privacy.section2.subsection1.intro')}</p>
          <ul>
            {t.raw('privacy.section2.subsection1.items').map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3>{t('privacy.section2.subsection2.title')}</h3>
          <p>{t('privacy.section2.subsection2.intro')}</p>
          <ul>
            {t.raw('privacy.section2.subsection2.items').map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.section3.title')}</h2>
          <p>{t('privacy.section3.intro')}</p>
          <ul>
            {t.raw('privacy.section3.items').map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.section4.title')}</h2>
          <p>{t('privacy.section4.intro')}</p>
          <ul>
            {t.raw('privacy.section4.items').map((item: { label: string; text: string }, index: number) => (
              <li key={index}>
                <strong>{item.label}</strong> {item.text}
              </li>
            ))}
          </ul>
          <p className={styles.highlight}>{t('privacy.section4.highlight')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.section5.title')}</h2>
          <p>{t('privacy.section5.intro')}</p>
          <ul>
            {t.raw('privacy.section5.items').map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.section6.title')}</h2>
          <p>{t('privacy.section6.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.section7.title')}</h2>
          <p>{t('privacy.section7.intro')}</p>
          <ul>
            {t.raw('privacy.section7.items').map((item: { label: string; text: string }, index: number) => (
              <li key={index}>
                <strong>{item.label}</strong> {item.text}
              </li>
            ))}
          </ul>
          <p>{t('privacy.section7.footer')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.section8.title')}</h2>
          <p>{t('privacy.section8.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.section9.title')}</h2>
          <p>{t('privacy.section9.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.section10.title')}</h2>
          <p>{t('privacy.section10.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.section11.title')}</h2>
          <p>{t('privacy.section11.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('privacy.section12.title')}</h2>
          <p>{t('privacy.section12.intro')}</p>
          <ul>
            {t.raw('privacy.section12.items').map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
