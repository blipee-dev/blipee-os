'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { Check, ArrowRight, Mail, Phone, MessageSquare, Lightbulb, TrendingUp, Target, Bot, Activity, Shield, Plug, Headphones, Sparkles } from 'lucide-react'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import Link from 'next/link'
import styles from './pricing.module.css'
import landingStyles from '../landing/landing.module.css'

export default function PricingPage() {
  const { mode: themeMode, setTheme } = useThemeToggle()

  return (
    <div className={landingStyles.landing}>
      <Background />
      <div className={landingStyles.contentWrapper}>
        <Navbar />
        <main className={styles.main}>
          {/* Hero Section */}
          <section className={styles.hero} id="pricing">
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Pricing Built Around Your <span className={landingStyles.gradientText}>Needs</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Every business is unique. We create custom solutions and pricing tailored to your
                specific sustainability goals, team size, and industry requirements.
              </p>
            </div>
          </section>

          {/* Value Proposition */}
          <section className={styles.valueSection} id="value" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
            <div className={landingStyles.aiGrid}>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Lightbulb size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>Tailored Solutions</h3>
                <p className={landingStyles.aiDescription}>
                  Custom AI agent configurations based on your industry, compliance requirements, and
                  sustainability targets.
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <TrendingUp size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>Flexible Scaling</h3>
                <p className={landingStyles.aiDescription}>
                  Pay only for what you need. Scale up or down as your business grows and your
                  requirements evolve.
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Target size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>Enterprise Support</h3>
                <p className={landingStyles.aiDescription}>
                  Dedicated account management, priority support, and custom integrations with your
                  existing systems.
                </p>
              </article>
            </div>
          </section>

          {/* What's Included */}
          <section className={styles.includedSection} id="features">
            <h2 className={styles.sectionTitle}>What You Get</h2>
            <div className={landingStyles.aiGrid}>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Bot size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>8 Autonomous AI Agents</h3>
                <p className={landingStyles.aiDescription}>
                  Full workforce working 24/7 on your sustainability operations
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Sparkles size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>blipee Assistant</h3>
                <p className={landingStyles.aiDescription}>
                  AI-powered companion providing instant answers and guidance throughout the platform
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Activity size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>Real-Time Monitoring</h3>
                <p className={landingStyles.aiDescription}>
                  Live dashboards for carbon, energy, water, and waste metrics
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Shield size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>Compliance Automation</h3>
                <p className={landingStyles.aiDescription}>
                  Automated reporting for CSRD, SFDR, EU Taxonomy, GHG Protocol, and GRI Standards
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Plug size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>API Access</h3>
                <p className={landingStyles.aiDescription}>
                  Full API access for custom integrations and data workflows
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Plug size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>Custom Integrations</h3>
                <p className={landingStyles.aiDescription}>
                  Connect with your ERP, CRM, and existing sustainability tools
                </p>
              </article>
              <article className={landingStyles.aiCard}>
                <div className={landingStyles.aiIcon}>
                  <Headphones size={24} />
                </div>
                <h3 className={landingStyles.aiTitle}>Dedicated Support</h3>
                <p className={landingStyles.aiDescription}>
                  Priority support with dedicated account manager
                </p>
              </article>
            </div>
          </section>

          {/* Contact CTA */}
          <section className={landingStyles.ctaSection} id="contact" style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
            <div className={landingStyles.ctaContent}>
              <h2 className={landingStyles.ctaTitle}>
                Ready to Get <span className={landingStyles.gradientText}>Started?</span>
              </h2>
              <p className={landingStyles.ctaDescription}>
                Contact our team to discuss your requirements and receive a personalized quote within 24 hours.
              </p>
              <div className={landingStyles.heroActions}>
                <Link href="/contact" className={`${landingStyles.navButton} ${landingStyles.primaryButton}`}>
                  Contact Sales
                </Link>
              </div>
            </div>
          </section>
        </main>
        <Footer themeMode={themeMode} onThemeChange={setTheme} />
      </div>
    </div>
  )
}
