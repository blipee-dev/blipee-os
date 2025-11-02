import { ReactNode } from 'react'
import styles from './Section.module.css'

interface SectionProps {
  title?: ReactNode
  children: ReactNode
  variant?: 'default' | 'dark'
  className?: string
}

export function Section({ title, children, variant = 'default', className = '' }: SectionProps) {
  const variantClass = variant === 'dark' ? styles.sectionDark : styles.section
  
  return (
    <section className={`${variantClass} ${className}`}>
      <div className={styles.container}>
        {title && (
          <h2 className={styles.sectionTitle}>{title}</h2>
        )}
        {children}
      </div>
    </section>
  )
}
