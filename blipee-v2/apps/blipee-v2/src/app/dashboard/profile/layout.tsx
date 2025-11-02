'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './profile.module.css'

interface SettingsLayoutProps {
  children: ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname()

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsHeader}>
        <h1>Configurações do Perfil</h1>
        <p className={styles.subtitle}>Gerencie as configurações e preferências da sua conta pessoal</p>
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
            Perfil
          </Link>
          <Link 
            href="/dashboard/profile/preferences" 
            className={pathname === '/dashboard/profile/preferences' ? `${styles.tab} ${styles.active}` : styles.tab}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v6M12 16v6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M2 12h6M16 12h6M4.93 19.07l4.24-4.24M14.83 9.17l4.24-4.24" />
            </svg>
            Preferências
          </Link>
          <Link 
            href="/dashboard/profile/security" 
            className={pathname === '/dashboard/profile/security' ? `${styles.tab} ${styles.active}` : styles.tab}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Segurança
          </Link>
        </nav>

        <div className={styles.settingsBody}>
          {children}
        </div>
      </div>
    </div>
  )
}
