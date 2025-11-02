import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'
import styles from './FeatureGrid.module.css'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

interface FeatureGridProps {
  features: Feature[]
  columns?: 2 | 3 | 4
}

export function FeatureGrid({ features, columns = 3 }: FeatureGridProps) {
  const gridClass = styles[`grid${columns}Col`] || styles.grid3Col

  return (
    <div className={`${styles.grid} ${gridClass}`}>
      {features.map((feature) => (
        <div key={feature.title} className={styles.card}>
          <div className={styles.icon}>
            <feature.icon size={24} color="white" />
          </div>
          <h3 className={styles.title}>{feature.title}</h3>
          <p className={styles.description}>{feature.description}</p>
        </div>
      ))}
    </div>
  )
}
