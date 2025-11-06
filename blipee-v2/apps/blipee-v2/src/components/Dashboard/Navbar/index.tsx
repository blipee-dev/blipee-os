'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { signOut } from '@/app/actions/v2/auth'
import { createClient } from '@/lib/supabase/v2/client'
import styles from './Navbar.module.css'
import {
  User, Briefcase, Rocket, Zap, Target, Heart, Star,
  TrendingUp, Award, Shield, Leaf, Sparkles, Languages
} from 'lucide-react'

interface NavbarProps {
  user: {
    email?: string
    name?: string
    id?: string
  }
}

type AvatarType = 'icon' | 'initials'
type GradientColor = 'blipee' | 'blue' | 'purple' | 'pink' | 'orange' | 'teal' | 'cyan' | 'red' | 'indigo' | 'lime'
type AvatarIcon = 'user' | 'briefcase' | 'rocket' | 'zap' | 'target' | 'heart' | 'star' | 'trending-up' | 'award' | 'shield' | 'leaf' | 'sparkles'

const gradients: Record<GradientColor, string> = {
  blipee: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  blue: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  purple: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  pink: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  orange: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  teal: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  cyan: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
  red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  indigo: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  lime: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
}

const iconComponents: Record<AvatarIcon, React.ComponentType<any>> = {
  user: User,
  briefcase: Briefcase,
  rocket: Rocket,
  zap: Zap,
  target: Target,
  heart: Heart,
  star: Star,
  'trending-up': TrendingUp,
  award: Award,
  shield: Shield,
  leaf: Leaf,
  sparkles: Sparkles,
}

export function Navbar({ user }: NavbarProps) {
  const t = useTranslations('common.navbar')
  const router = useRouter()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<string>('pt-PT')
  const [avatarSettings, setAvatarSettings] = useState<{
    type: AvatarType
    gradient: GradientColor
    icon: AvatarIcon
  }>({
    type: 'initials',
    gradient: 'blipee',
    icon: 'user',
  })
  const [fullName, setFullName] = useState('')

  useEffect(() => {
    loadAvatarSettings()
    
    // Listen for avatar settings updates
    const handleAvatarUpdate = () => {
      loadAvatarSettings()
    }
    
    window.addEventListener('avatarSettingsUpdated', handleAvatarUpdate)
    
    return () => {
      window.removeEventListener('avatarSettingsUpdated', handleAvatarUpdate)
    }
  }, [user.id])

  async function loadAvatarSettings() {
    if (!user.id) return

    try {
      const supabase = createClient()
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('preferences, full_name, preferred_language')
        .eq('id', user.id)
        .single() as { data: any }

      if (profileData) {
        setFullName(profileData.full_name || '')

        // Load language preference
        let language = profileData.preferred_language || 'pt-PT'
        if (language === 'pt') language = 'pt-PT'
        if (language === 'en') language = 'en-US'
        if (language === 'es') language = 'es-ES'
        setCurrentLanguage(language)

        if (profileData.preferences && typeof profileData.preferences === 'object') {
          const prefs = profileData.preferences as any
          if (prefs.avatarSettings) {
            setAvatarSettings({
              type: prefs.avatarSettings.type || 'initials',
              gradient: prefs.avatarSettings.gradient || 'blipee',
              icon: prefs.avatarSettings.icon || 'user',
            })
          }
        }
      }
    } catch (error) {
      console.error('Error loading avatar settings:', error)
    }
  }

  function getInitials() {
    const name = fullName || user.name || user.email || 'U'
    const names = name.trim().split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.body.setAttribute('data-theme', newTheme)
    localStorage.setItem('blipee-theme', newTheme)
  }

  const handleLanguageChange = async (newLanguage: string) => {
    try {
      const supabase = createClient()
      await supabase
        .from('user_profiles')
        .update({ preferred_language: newLanguage })
        .eq('id', user.id)

      setCurrentLanguage(newLanguage)

      // Reload the page to apply new locale
      setTimeout(() => {
        router.refresh()
      }, 300)
    } catch (error) {
      console.error('Error updating language:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <>
      {/* Backdrop */}
      {isUserMenuOpen && (
        <div 
          className={styles.backdrop} 
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}

      <nav className={styles.nav}>
        <div className={styles.navContainer}>
        {/* Logo with Assistant */}
        <Link href="/" className={styles.navLogoContainer}>
          <div className={styles.navAssistantContainer}>
            <div className={styles.navAssistantBlob}>
              <svg
                className={styles.navAssistantRobot}
                viewBox="0 0 120 120"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
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
            </div>
          </div>
          <span className={styles.navLogoText}>blipee</span>
        </Link>

        {/* Right Side Actions */}
        <div className={styles.navActions}>
          {/* Notifications */}
          <button className={styles.iconBtn} aria-label={t('notifications')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className={styles.notificationBadge}>3</span>
          </button>

          {/* User Profile */}
          <div className={styles.userMenu}>
            <button
              className={styles.userAvatar}
              aria-label={t('userMenu')}
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              style={{ background: gradients[avatarSettings.gradient] }}
            >
              {avatarSettings.type === 'initials' ? (
                <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                  {getInitials()}
                </span>
              ) : (
                (() => {
                  const IconComponent = iconComponents[avatarSettings.icon]
                  return <IconComponent size={24} strokeWidth={2} color="white" />
                })()
              )}
            </button>
            <div className={`${styles.userDropdown} ${isUserMenuOpen ? styles.open : ''}`}>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{fullName || user.name || t('user')}</div>
                <div className={styles.userEmail}>{user.email}</div>
              </div>

              {/* Theme Toggle in Dropdown */}
              <button className={`${styles.dropdownItem} ${styles.themeToggleItem}`} onClick={toggleTheme}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path className={styles.moonIcon} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  <g className={styles.sunIcon}>
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </g>
                </svg>
                <span className={styles.themeLabel}>{theme === 'dark' ? t('darkMode') : t('lightMode')}</span>
                <div className={styles.themeSwitch}>
                  <div className={styles.themeSwitchSlider} style={{ transform: theme === 'light' ? 'translateX(20px)' : 'translateX(0)' }} />
                </div>
              </button>

              {/* Language Selector in Dropdown */}
              <div className={styles.dropdownItem} style={{ flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Languages size={18} strokeWidth={2} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{t('language')}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleLanguageChange('pt-PT')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: currentLanguage === 'pt-PT' ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      background: currentLanguage === 'pt-PT' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                    }}
                    title="Português"
                  >
                    🇵🇹
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en-US')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: currentLanguage === 'en-US' ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      background: currentLanguage === 'en-US' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                    }}
                    title="English"
                  >
                    🇺🇸
                  </button>
                  <button
                    onClick={() => handleLanguageChange('es-ES')}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: currentLanguage === 'es-ES' ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '0.5rem',
                      background: currentLanguage === 'es-ES' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      transition: 'all 0.2s',
                    }}
                    title="Español"
                  >
                    🇪🇸
                  </button>
                </div>
              </div>

              <div className={styles.dropdownDivider} />
              <Link href="/dashboard/profile" className={styles.dropdownItem}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {t('myProfile')}
              </Link>
              <Link href="/dashboard/settings" className={styles.dropdownItem}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                {t('settings')}
              </Link>
              <div className={styles.dropdownDivider} />
              <button onClick={handleSignOut} className={`${styles.dropdownItem} ${styles.logout}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
      </nav>
    </>
  )
}
