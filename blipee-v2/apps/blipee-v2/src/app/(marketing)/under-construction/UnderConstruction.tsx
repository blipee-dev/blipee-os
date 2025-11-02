'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { BlipeeAssistant } from '@/components/agents'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import landingStyles from '../landing/landing.module.css'
import styles from './under-construction.module.css'

interface UnderConstructionProps {
  title: string
  description: string
}

export default function UnderConstruction({ title, description }: UnderConstructionProps) {
  const { mode: themeMode, setTheme } = useThemeToggle()

  return (
    <div className={landingStyles.landing}>
      <Background />
      <div className={landingStyles.contentWrapper}>
        <Navbar />
        <main className={styles.main}>
          <section className={styles.hero}>
            <div className={styles.constructionCone1}>
              <svg viewBox="0 0 100 100" className={styles.cone}>
                <polygon points="50,20 30,80 70,80" fill="#f97316" />
                <rect x="25" y="75" width="50" height="10" rx="2" fill="#1f2937" />
                <rect x="35" y="35" width="30" height="8" fill="#fff" />
                <rect x="38" y="50" width="24" height="8" fill="#fff" />
              </svg>
            </div>
            <div className={styles.constructionCone2}>
              <svg viewBox="0 0 100 100" className={styles.cone}>
                <polygon points="50,20 30,80 70,80" fill="#f97316" />
                <rect x="25" y="75" width="50" height="10" rx="2" fill="#1f2937" />
                <rect x="35" y="35" width="30" height="8" fill="#fff" />
                <rect x="38" y="50" width="24" height="8" fill="#fff" />
              </svg>
            </div>
            <div className={styles.constructionCone3}>
              <svg viewBox="0 0 100 100" className={styles.cone}>
                <polygon points="50,20 30,80 70,80" fill="#f97316" />
                <rect x="25" y="75" width="50" height="10" rx="2" fill="#1f2937" />
                <rect x="35" y="35" width="30" height="8" fill="#fff" />
                <rect x="38" y="50" width="24" height="8" fill="#fff" />
              </svg>
            </div>
            <div className={styles.cautionTape}></div>
            <BlipeeAssistant size={300} />
            <h1 className={styles.title}>
              {title}
            </h1>
            <p className={styles.description}>
              {description}
            </p>
            <div className={styles.status}>
              <div className={styles.statusIndicator}></div>
              <span>Under Construction</span>
            </div>
          </section>
        </main>
        <Footer themeMode={themeMode} onThemeChange={setTheme} />
      </div>
    </div>
  )
}
