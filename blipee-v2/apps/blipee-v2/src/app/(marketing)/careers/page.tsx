'use client'

import { Navbar } from '../landing/components/Navbar'
import { Footer } from '../landing/components/Footer'
import { Background } from '../landing/components/Background'
import { BrainCircuit, Globe, Home, TrendingUp, DollarSign, Heart } from 'lucide-react'
import { useThemeToggle } from '../landing/hooks/useThemeToggle'
import styles from './careers.module.css'
import landingStyles from '../landing/landing.module.css'

const benefits = [
  {
    icon: BrainCircuit,
    title: 'Cutting-Edge AI',
    description: 'Work with state-of-the-art AI models and contribute to groundbreaking sustainability solutions.',
  },
  {
    icon: Globe,
    title: 'Real Impact',
    description: 'Every line of code you write helps businesses reduce their environmental footprint.',
  },
  {
    icon: Home,
    title: 'Remote-First',
    description: 'Work from anywhere in the world. We value results over location.',
  },
  {
    icon: TrendingUp,
    title: 'Growth & Learning',
    description: 'Continuous learning budget, conferences, and mentorship programs.',
  },
  {
    icon: DollarSign,
    title: 'Competitive Package',
    description: 'Top-tier salary, equity options, and comprehensive benefits.',
  },
  {
    icon: Heart,
    title: 'Wellness Support',
    description: 'Health insurance, mental wellness programs, and unlimited PTO.',
  },
]

const jobs = [
  {
    title: 'Senior AI Engineer',
    location: 'Remote',
    type: 'Full-time',
    department: 'Engineering',
    description: 'Lead the development of our autonomous AI agents. Design and implement machine learning models that drive sustainability insights.',
    tags: ['Python', 'TensorFlow', 'LLMs', 'MLOps'],
  },
  {
    title: 'Full-Stack Engineer',
    location: 'Remote',
    type: 'Full-time',
    department: 'Engineering',
    description: 'Build beautiful, performant interfaces that make sustainability data actionable. Work across our Next.js frontend and Node.js backend.',
    tags: ['React', 'Next.js', 'TypeScript', 'Node.js'],
  },
  {
    title: 'Product Designer',
    location: 'Remote',
    type: 'Full-time',
    department: 'Design',
    description: 'Craft intuitive experiences that make complex sustainability metrics understandable. Own the entire design system.',
    tags: ['Figma', 'UI/UX', 'Design Systems', 'User Research'],
  },
  {
    title: 'Sustainability Specialist',
    location: 'Remote',
    type: 'Full-time',
    department: 'Product',
    description: 'Bridge the gap between AI capabilities and real-world sustainability practices. Help shape our agent expertise.',
    tags: ['ESG', 'Carbon Accounting', 'Supply Chain', 'Compliance'],
  },
]

export default function CareersPage() {
  const { mode: themeMode, setTheme } = useThemeToggle()

  return (
    <div className={landingStyles.landing}>
      <Background />
      <div className={landingStyles.contentWrapper}>
        <Navbar />
        <main className={styles.main}>
          <section className={styles.hero}>
            <h1 className={styles.heroTitle}>
              Build the Future of <span className={landingStyles.gradientText}>Sustainable Business</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Join a team of innovators working to make sustainability accessible, measurable, and profitable for every business.
            </p>
          </section>

        <section className={styles.benefitsSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              Why <span className={landingStyles.gradientText}>blipee</span>
            </h2>
            <div className={styles.benefitsGrid}>
              {benefits.map((benefit) => (
                <div key={benefit.title} className={styles.benefitCard}>
                  <div className={styles.benefitIcon}>
                    <benefit.icon size={24} color="white" />
                  </div>
                  <h3 className={styles.benefitTitle}>{benefit.title}</h3>
                  <p className={styles.benefitDescription}>{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.jobsSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              Open <span className={landingStyles.gradientText}>Positions</span>
            </h2>
            <div className={styles.jobsList}>
              {jobs.map((job) => (
                <div key={job.title} className={styles.jobCard}>
                  <div className={styles.jobHeader}>
                    <div>
                      <h3 className={styles.jobTitle}>{job.title}</h3>
                      <div className={styles.jobMeta}>
                        <span className={styles.jobMetaItem}>{job.location}</span>
                        <span className={styles.jobMetaItem}>{job.type}</span>
                        <span className={styles.jobMetaItem}>{job.department}</span>
                      </div>
                    </div>
                    <button className={styles.applyBtn} onClick={() => alert('Demo: Application form')}>
                      Apply Now
                    </button>
                  </div>
                  <p className={styles.jobDescription}>{job.description}</p>
                  <div className={styles.jobTags}>
                    {job.tags.map((tag) => (
                      <span key={tag} className={styles.jobTag}>{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <h2 className={styles.sectionTitle}>
              Don't See Your <span className={styles.gradientText}>Role?</span>
            </h2>
            <p className={styles.ctaText}>
              We're always looking for exceptional talent. Send us your resume and tell us how you can help build the future of sustainable business.
            </p>
            <a href="/contact" className={styles.ctaButton}>
              Get in Touch
            </a>
          </div>
        </section>
      </main>
      <Footer themeMode={themeMode} onThemeChange={setTheme} />
    </div>
  </div>
  )
}
