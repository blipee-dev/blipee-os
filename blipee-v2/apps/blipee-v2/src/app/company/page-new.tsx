'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { Hero, Section, FeatureGrid } from '@/components/marketing'
import { Target, Clock, Shield, Award } from 'lucide-react'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import landingStyles from '../landing/landing.module.css'
import styles from './company.module.css'

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
          
          <Hero
            title={
              <>
                Pioneering the Future of <span className={landingStyles.gradientText}>Sustainable Business</span>
              </>
            }
            subtitle="We're building the world's most advanced AI workforce dedicated to sustainability and operational excellence."
          />

          <Section
            variant="dark"
            title={
              <>
                Our <span className={landingStyles.gradientText}>Mission</span>
              </>
            }
          >
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
          </Section>

          <Section
            title={
              <>
                Our <span className={landingStyles.gradientText}>Values</span>
              </>
            }
          >
            <FeatureGrid features={values} columns={2} />
          </Section>

          <Section variant="dark">
            <div className={styles.ctaContent}>
              <h2 className={styles.sectionTitle}>
                Ready to Transform Your Business?
              </h2>
              <p className={styles.ctaText}>
                Join forward-thinking companies using AI to achieve their sustainability goals.
              </p>
              <a href="/contact" className={styles.ctaButton}>
                Get Started
              </a>
            </div>
          </Section>

        </main>
        <Footer themeMode={themeMode} onThemeChange={setTheme} />
      </div>
    </div>
  )
}
