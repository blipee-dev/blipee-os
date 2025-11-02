'use client'

import { useRef } from 'react'
import styles from './landing.module.css'
import { Background } from './components/Background'
import { Navbar } from './components/Navbar'
import { HeroSection } from './components/HeroSection'
import { ProblemSection } from './components/ProblemSection'
import { FeaturesSection } from './components/FeaturesSection'
import { AgentsSection } from './components/AgentsSection'
import { AssistantSection } from './components/AssistantSection'
import { ImpactSection } from './components/ImpactSection'
import { CTASection } from './components/CTASection'
import { Footer } from './components/Footer'
import { useThemeToggle } from './hooks/useThemeToggle'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { useParallax } from './hooks/useParallax'

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)

  const { mode: themeMode, setTheme } = useThemeToggle()
  useSmoothScroll(containerRef)
  useParallax(parallaxRef, 0.5)

  return (
    <div ref={containerRef} className={styles.landing}>
      <Background ref={parallaxRef} />
      <div className={styles.contentWrapper}>
        <Navbar />
        <main>
          <HeroSection />
          <ProblemSection />
          <FeaturesSection />
          <AgentsSection />
          <AssistantSection />
          <ImpactSection />
          <CTASection />
        </main>
        <Footer themeMode={themeMode} onThemeChange={setTheme} />
      </div>
    </div>
  )
}
