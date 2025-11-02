'use client'

import { forwardRef } from 'react'
import styles from '../landing.module.css'

export const Background = forwardRef<HTMLDivElement>((_, ref) => (
  <div className={styles.bgContainer}>
    <div ref={ref} className={styles.bgGradientMesh} />
  </div>
))

Background.displayName = 'Background'
