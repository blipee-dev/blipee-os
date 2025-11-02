'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import styles from './about.module.css'
import landingStyles from '../landing/landing.module.css'

const stats = [
  { number: '8', label: 'AI Agents' },
  { number: '24/7', label: 'Uptime' },
  { number: '98.5%', label: 'Accuracy' },
  { number: '18%', label: 'Avg. Cost Reduction' },
]

const timeline = [
  {
    year: '2023',
    title: 'The Vision',
    description: 'Founded by a team of AI researchers and sustainability experts who believed business could be a force for environmental good.',
  },
  {
    year: '2024',
    title: 'First Agents Deployed',
    description: 'Launched our first 3 AI agents focusing on ESG compliance, carbon tracking, and supply chain optimization.',
  },
  {
    year: '2025',
    title: 'Complete AI Workforce',
    description: 'Expanded to 8 specialized agents covering all aspects of sustainable operations, from maintenance to regulatory compliance.',
  },
]

export default function AboutPage() {
  const { mode: themeMode, setTheme } = useThemeToggle()

  return (
    <div className={landingStyles.landing}>
      <Background />
      <div className={landingStyles.contentWrapper}>
        <Navbar />
        <main className={styles.main}>
          <section className={styles.hero}>
            <h1 className={styles.heroTitle}>
              Building Tomorrow's Sustainable <span className={landingStyles.gradientText}>Businesses Today</span>
            </h1>
            <p className={styles.heroSubtitle}>
              We're on a mission to make sustainability profitable, measurable, and accessible to every business through AI innovation.
            </p>
          </section>

        <section className={styles.storySection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              Our <span className={landingStyles.gradientText}>Story</span>
            </h2>
            <div className={styles.sectionContent}>
              <p>
                blipee was born from a simple yet powerful observation: businesses want to be sustainable, 
                but they lack the time, expertise, and resources to do it effectively. Traditional 
                sustainability consulting is expensive and time-consuming. We knew there had to be a better way.
              </p>
              <p>
                Our founders – a unique blend of AI researchers, environmental scientists, and business 
                strategists – came together to build something unprecedented: an autonomous AI workforce 
                dedicated entirely to sustainability. Each of our 8 agents is trained on millions of data 
                points, working 24/7 to optimize every aspect of your operations.
              </p>
              <p>
                Today, blipee represents the convergence of cutting-edge artificial intelligence and 
                urgent environmental action. We're not just a software platform – we're your sustainability 
                team, scaled infinitely and always available.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.statsSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              By the <span className={landingStyles.gradientText}>Numbers</span>
            </h2>
            <div className={styles.statsGrid}>
              {stats.map((stat) => (
                <div key={stat.label} className={styles.statItem}>
                  <div className={styles.statNumber}>{stat.number}</div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.timelineSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              Our <span className={landingStyles.gradientText}>Journey</span>
            </h2>
            <div className={styles.timeline}>
              {timeline.map((item) => (
                <div key={item.year} className={styles.timelineItem}>
                  <div className={styles.timelineYear}>{item.year}</div>
                  <div className={styles.timelineContent}>
                    <h3 className={styles.timelineTitle}>{item.title}</h3>
                    <p className={styles.timelineDescription}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              Join Our <span className={styles.gradientText}>Mission</span>
            </h2>
            <p className={styles.ctaText}>
              Be part of the team that's redefining how businesses approach sustainability.
            </p>
            <a href="/careers" className={styles.ctaButton}>
              Explore Careers
            </a>
          </div>
        </section>
      </main>
      <Footer themeMode={themeMode} onThemeChange={setTheme} />
    </div>
  </div>
  )
}
