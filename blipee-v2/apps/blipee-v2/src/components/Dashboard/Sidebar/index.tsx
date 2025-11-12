'use client'

import { useState, useLayoutEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import styles from './Sidebar.module.css'

interface SidebarProps {
  currentPath?: string
}

export function Sidebar({ currentPath }: SidebarProps) {
  const t = useTranslations('common.sidebar')
  const pathname = usePathname()
  const activePath = currentPath || pathname
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('blipee-sidebar', newState ? 'collapsed' : 'expanded')

    // Update main content class
    const mainContent = document.getElementById('mainContent')
    if (mainContent) {
      if (newState) {
        mainContent.classList.add(styles.sidebarCollapsed)
      } else {
        mainContent.classList.remove(styles.sidebarCollapsed)
      }
    }
  }

  useLayoutEffect(() => {
    // Check localStorage on mount
    const saved = localStorage.getItem('blipee-sidebar')
    if (saved === 'collapsed') {
      setIsCollapsed(true)
      const mainContent = document.getElementById('mainContent')
      if (mainContent) {
        mainContent.classList.add(styles.sidebarCollapsed)
      }
    }

    // Listen for mobile sidebar toggle event from navbar
    const handleMobileSidebarToggle = () => {
      setIsMobileOpen(prev => !prev)
    }

    window.addEventListener('toggleMobileSidebar', handleMobileSidebarToggle)

    return () => {
      window.removeEventListener('toggleMobileSidebar', handleMobileSidebarToggle)
    }
  }, [])

  return (
    <>
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarSection}>
          <div className={styles.sidebarSectionTitle}>{t('overview')}</div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('dashboard')}>
            <Link
              href="/dashboard"
              className={`${styles.sidebarItem} ${activePath === '/dashboard' ? styles.active : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span className={styles.sidebarItemText}>{t('dashboard')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('analytics')}>
            <Link href="/dashboard/analytics" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
              <span className={styles.sidebarItemText}>{t('analytics')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('reports')}>
            <Link href="/dashboard/reports" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V10" />
                <path d="M18 20V4" />
                <path d="M6 20v-4" />
              </svg>
              <span className={styles.sidebarItemText}>{t('reports')}</span>
            </Link>
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <div className={styles.sidebarSectionTitle}>{t('energy')}</div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('consumption')}>
            <Link href="/dashboard/energy/consumption" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span className={styles.sidebarItemText}>{t('consumption')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('costAnalysis')}>
            <Link href="/dashboard/energy/cost" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span className={styles.sidebarItemText}>{t('costAnalysis')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('efficiency')}>
            <Link href="/dashboard/energy/efficiency" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              <span className={styles.sidebarItemText}>{t('efficiency')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('goals')}>
            <Link href="/dashboard/energy/goals" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className={styles.sidebarItemText}>{t('goals')}</span>
            </Link>
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <div className={styles.sidebarSectionTitle}>{t('griStandards')}</div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('griOverview')}>
            <Link
              href="/dashboard/gri"
              className={`${styles.sidebarItem} ${activePath.startsWith('/dashboard/gri') ? styles.active : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span className={styles.sidebarItemText}>{t('griOverview')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('gri305Emissions')}>
            <Link href="/dashboard/gri/emissions" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
              <span className={styles.sidebarItemText}>{t('gri305Emissions')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('gri302Energy')}>
            <Link href="/dashboard/gri/energy" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span className={styles.sidebarItemText}>{t('gri302Energy')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('gri303Water')}>
            <Link href="/dashboard/gri/water" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
              <span className={styles.sidebarItemText}>{t('gri303Water')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('gri306Waste')}>
            <Link href="/dashboard/gri/waste" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span className={styles.sidebarItemText}>{t('gri306Waste')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('griMateriality')}>
            <Link href="/dashboard/gri/materiality" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className={styles.sidebarItemText}>{t('griMateriality')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('initiatives')}>
            <Link
              href="/dashboard/initiatives"
              className={`${styles.sidebarItem} ${activePath.startsWith('/dashboard/initiatives') ? styles.active : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span className={styles.sidebarItemText}>{t('initiatives')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('sbtiTargets')}>
            <Link
              href="/dashboard/sbti"
              className={`${styles.sidebarItem} ${activePath.startsWith('/dashboard/sbti') ? styles.active : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
                <path d="M16 2v4" />
                <path d="M8 2v4" />
              </svg>
              <span className={styles.sidebarItemText}>{t('sbtiTargets')}</span>
            </Link>
          </div>
        </div>

        <div className={styles.sidebarSection}>
          <div className={styles.sidebarSectionTitle}>{t('settings')}</div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('billing')}>
            <Link href="/dashboard/billing" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span className={styles.sidebarItemText}>{t('billing')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('integrations')}>
            <Link href="/dashboard/integrations" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7h-9" />
                <path d="M14 17H5" />
                <circle cx="17" cy="17" r="3" />
                <circle cx="7" cy="7" r="3" />
              </svg>
              <span className={styles.sidebarItemText}>{t('integrations')}</span>
            </Link>
          </div>
          <div className={styles.sidebarItemWrapper} data-tooltip={t('settings')}>
            <Link href="/dashboard/settings" className={styles.sidebarItem}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span className={styles.sidebarItemText}>{t('settings')}</span>
            </Link>
          </div>
        </div>

        {/* Toggle Button at Bottom */}
        <button
          className={styles.sidebarToggle}
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Footer - Only visible when collapsed */}
        <div className={styles.sidebarFooter}>
          <div className={styles.footerVersion}>{t('version')} 2.0</div>
          <div className={styles.footerBrand}>{t('poweredBy')} blipee</div>
          <div className={styles.footerCopyright}>© 2025 blipee. {t('allRightsReserved')}.</div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className={styles.mobileBackdrop}
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  )
}
