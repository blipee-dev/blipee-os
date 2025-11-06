'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import styles from './terms.module.css'

export default function TermsPage() {
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
        <h1 className={styles.title}>{t('terms.title')}</h1>
        <p className={styles.lastUpdated}>{t('common.lastUpdated')}</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>{t('terms.section1.title')}</h2>
          <p>{t('terms.section1.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section2.title')}</h2>
          <p>{t('terms.section2.intro')}</p>
          <ul>
            {t.raw('terms.section2.items').map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section3.title')}</h2>
          <h3>{t('terms.section3.subsection1.title')}</h3>
          <p>{t('terms.section3.subsection1.intro')}</p>
          <ul>
            {t.raw('terms.section3.subsection1.items').map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <h3>{t('terms.section3.subsection2.title')}</h3>
          <p>{t('terms.section3.subsection2.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section4.title')}</h2>
          <p>{t('terms.section4.intro')}</p>
          <ul>
            {t.raw('terms.section4.items').map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section5.title')}</h2>
          <h3>{t('terms.section5.subsection1.title')}</h3>
          <p>{t('terms.section5.subsection1.content')}</p>

          <h3>{t('terms.section5.subsection2.title')}</h3>
          <p>{t('terms.section5.subsection2.intro')}</p>
          <ul>
            {t.raw('terms.section5.subsection2.items').map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section6.title')}</h2>
          <h3>{t('terms.section6.subsection1.title')}</h3>
          <p>{t('terms.section6.subsection1.content')}</p>

          <h3>{t('terms.section6.subsection2.title')}</h3>
          <p>{t('terms.section6.subsection2.content')}</p>

          <h3>{t('terms.section6.subsection3.title')}</h3>
          <p>{t('terms.section6.subsection3.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section7.title')}</h2>
          <p className={styles.highlight}>{t('terms.section7.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section8.title')}</h2>
          <p>
            {t('terms.section8.content').split(t('terms.section8.privacyLinkText'))[0]}
            <Link href="/privacy" className={styles.inlineLink}>{t('terms.section8.privacyLinkText')}</Link>
            {t('terms.section8.content').split(t('terms.section8.privacyLinkText'))[1]}
          </p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section9.title')}</h2>
          <p>{t('terms.section9.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section10.title')}</h2>
          <p>{t('terms.section10.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section11.title')}</h2>
          <p>{t('terms.section11.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section12.title')}</h2>
          <h3>{t('terms.section12.subsection1.title')}</h3>
          <p>{t('terms.section12.subsection1.content')}</p>

          <h3>{t('terms.section12.subsection2.title')}</h3>
          <p>{t('terms.section12.subsection2.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section13.title')}</h2>
          <p>{t('terms.section13.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section14.title')}</h2>
          <p>{t('terms.section14.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section15.title')}</h2>
          <p>{t('terms.section15.content')}</p>
        </section>

        <section className={styles.section}>
          <h2>{t('terms.section16.title')}</h2>
          <p>{t('terms.section16.intro')}</p>
          <ul>
            {t.raw('terms.section16.items').map((item: string, index: number) => {
              if (item.includes('{contactForm}')) {
                const parts = item.split('{contactForm}')
                return (
                  <li key={index}>
                    {parts[0]}
                    <Link href="/contact" className={styles.inlineLink}>
                      {t('terms.section16.contactFormText')}
                    </Link>
                    {parts[1]}
                  </li>
                )
              }
              return <li key={index}>{item}</li>
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
