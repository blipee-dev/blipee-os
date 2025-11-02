'use client'

import { type ReactNode } from 'react'
import styles from '../landing.module.css'
import type { ThemeMode } from '../hooks/useThemeToggle'

type ThemeToggleButtonProps = {
  mode: ThemeMode
  onChange: (mode: ThemeMode) => void
  variant?: 'nav' | 'footer'
}

const options: { mode: ThemeMode; label: string; icon: ReactNode }[] = [
  {
    mode: 'light',
    label: 'Light mode',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M6.34 17.66l-2.12 2.12M19.78 4.22l-2.12 2.12" />
      </svg>
    ),
  },
  {
    mode: 'system',
    label: 'Use system theme',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M8 20h8" />
      </svg>
    ),
  },
  {
    mode: 'dark',
    label: 'Dark mode',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
      </svg>
    ),
  },
]

export function ThemeToggleButton({ mode, onChange, variant = 'nav' }: ThemeToggleButtonProps) {
  return (
    <div className={`${styles.themeToggleGroup} ${styles[`themeToggleGroup${variant === 'footer' ? 'Footer' : 'Nav'}`]}`}>
      {options.map(option => (
        <button
          key={option.mode}
          type="button"
          onClick={() => onChange(option.mode)}
          className={`${styles.themeToggleOption} ${mode === option.mode ? styles.themeToggleOptionActive : ''}`}
          aria-label={option.label}
          aria-pressed={mode === option.mode}
        >
          {option.icon}
        </button>
      ))}
    </div>
  )
}
