'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { Target, Clock, Shield, Award } from 'lucide-react'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import styles from './company.module.css'
import landingStyles from '../landing/landing.module.css'

const values = [
  {
    icon: Award,
    title: 'Innovation',
    description: 'We leverage cutting-edge AI to solve sustainability challenges that matter.',
  },
  {
    icon: Clock,
    title: '24/7 Commitment',
    description: 'Our AI agents work around the clock, ensuring your sustainability goals never sleep.',
  },
  {
    icon: Shield,
    title: 'Trust & Transparency',
    description: 'We build trust through transparent processes and verifiable results.',
  },
  {
    icon: Target,
    title: 'Impact',
    description: 'Every action we take is measured by its real-world environmental and business impact.',
  },
]

export default function CompanyPage() {
  const { mode: themeMode, setTheme } = useThemeToggle()

  return (
    <div className={landingStyles.landing}>
      <Background />
      <div className={landingStyles.contentWrapper}>
        <Navbar />
        <main className={styles.main}>
          <section className={styles.hero}>
            <h1 className={styles.heroTitle}>
              Pioneering the Future of <span className={landingStyles.gradientText}>Sustainable Business</span>
            </h1>
            <p className={styles.heroSubtitle}>
              We're building the world's most advanced AI workforce dedicated to sustainability and operational excellence.
            </p>
          </section>

          <section className={styles.missionSection}>
            <div className={styles.container}>
              <h2 className={styles.sectionTitle}>
                Our <span className={landingStyles.gradientText}>Mission</span>
              </h2>
              <div className={styles.sectionContent}>
                <p>
                  At blipee, we believe that every business can be a force for good. Our mission is to make 
                  sustainability accessible, measurable, and profitable for companies of all sizes through the 
                  power of autonomous AI agents.
                </p>
                <p>
                  We've assembled 8 specialized AI agents that work 24/7, each an expert in a critical aspect 
                  of sustainable operations. From ESG compliance to carbon tracking, from supply chain optimization 
                  to cost savings – we cover it all with unprecedented accuracy and intelligence.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.valuesSection}>
            <div className={styles.container}>
              <h2 className={styles.sectionTitle}>
                Our <span className={landingStyles.gradientText}>Values</span>
              </h2>
              <div className={styles.valuesGrid}>
                {values.map((value) => (
                  <div key={value.title} className={styles.valueCard}>
                    <div className={styles.valueIcon}>
                      <value.icon size={24} color="white" />
                    </div>
                    <h3 className={styles.valueTitle}>{value.title}</h3>
                    <p className={styles.valueDescription}>{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.ctaSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              Join Our <span className={landingStyles.gradientText}>Journey</span>
            </h2>
            <p className={styles.ctaText}>
              We're always looking for talented individuals who share our passion for sustainability and innovation.
            </p>
            <a href="/careers" className={styles.ctaButton}>
              View Open Positions
            </a>
          </div>
        </section>
      </main>
      <Footer themeMode={themeMode} onThemeChange={setTheme} />
    </div>
  </div>
  )
}
