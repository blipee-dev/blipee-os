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
        <h1>Platform Settings</h1>
        <p className={styles.subtitle}>Manage organizations, sites and users</p>
      </div>

      <div className={styles.settingsContent}>
        <nav className={styles.settingsTabs}>
          <Link
            href="/dashboard/settings/organizations"
            className={pathname === '/dashboard/settings/organizations' ? `${styles.tab} ${styles.active}` : styles.tab}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
              <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
            </svg>
            Organizations
          </Link>

          <Link
            href="/dashboard/settings/sites"
            className={pathname === '/dashboard/settings/sites' ? `${styles.tab} ${styles.active}` : styles.tab}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Sites
          </Link>

          <Link
            href="/dashboard/settings/users"
            className={pathname === '/dashboard/settings/users' ? `${styles.tab} ${styles.active}` : styles.tab}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Users
          </Link>
        </nav>

        <div className={styles.settingsBody}>
          {children}
        </div>
      </div>
    </div>
  )
}
