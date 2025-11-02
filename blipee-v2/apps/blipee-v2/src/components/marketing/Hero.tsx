import { ReactNode } from 'react'
import styles from './Hero.module.css'

interface HeroProps {
  title: ReactNode
  subtitle: string
  className?: string
}

export function Hero({ title, subtitle, className = '' }: HeroProps) {
  return (
    <section className={`${styles.hero} ${className}`}>
      <h1 className={styles.heroTitle}>{title}</h1>
      <p className={styles.heroSubtitle}>{subtitle}</p>
    </section>
  )
}
