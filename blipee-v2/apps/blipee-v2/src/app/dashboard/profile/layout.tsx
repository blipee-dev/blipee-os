'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from '@/styles/settings-layout.module.css'

interface SettingsLayoutProps {
  children: ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsHeader}>
        <h1>Profile Settings</h1>
        <p className={styles.subtitle}>Manage your personal account settings and preferences</p>
      </div>

      <div className={styles.settingsContent}>
        <nav className={styles.settingsTabs}>
          <Link 
            href="/dashboard/profile" 
            className={pathname === '/dashboard/profile' ? `${styles.tab} ${styles.active}` : styles.tab}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </Link>
          <Link
            href="/dashboard/profile/preferences"
            className={pathname === '/dashboard/profile/preferences' ? `${styles.tab} ${styles.active}` : styles.tab}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            Preferences
          </Link>
          <Link
            href="/dashboard/profile/security"
            className={pathname === '/dashboard/profile/security' ? `${styles.tab} ${styles.active}` : styles.tab}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Security
          </Link>
          <Link
            href="/dashboard/profile/assistant"
            className={pathname === '/dashboard/profile/assistant' ? `${styles.tab} ${styles.active}` : styles.tab}
          >
            <svg className={styles.blipeeIcon} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
              <rect x="28" y="36" width="64" height="64" rx="20" fill="#10b981" />
              <circle cx="44" cy="60" r="10" fill="#fff" />
              <circle cx="76" cy="60" r="10" fill="#fff" />
              <circle cx="44" cy="60" r="4" fill="#047857" />
              <circle cx="76" cy="60" r="4" fill="#047857" />
              <path d="M50 84c6 6 18 6 24 0" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
              <rect x="50" y="22" width="20" height="18" rx="9" fill="#34d399" />
              <path d="M60 18v6" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
              <circle cx="60" cy="14" r="5" fill="#6ee7b7" />
              <rect x="31" y="46" width="26" height="28" rx="13" stroke="#bbf7d0" strokeWidth="3.5" fill="none" />
              <rect x="63" y="46" width="26" height="28" rx="13" stroke="#bbf7d0" strokeWidth="3.5" fill="none" />
              <rect x="55" y="60" width="10" height="8" rx="4" fill="#bbf7d0" />
              <circle cx="32" cy="92" r="6" fill="#22c55e" opacity="0.7" />
              <circle cx="88" cy="92" r="6" fill="#22c55e" opacity="0.7" />
            </svg>
            blipee Assistant
          </Link>
        </nav>

        <div className={styles.settingsBody}>
          {children}
        </div>
      </div>
    </div>
  )
}
