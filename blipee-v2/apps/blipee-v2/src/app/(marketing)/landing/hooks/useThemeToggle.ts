'use client'

import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'blipee-theme'

const getSystemPreference = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

const applyTheme = (theme: 'dark' | 'light') => {
  document.body.setAttribute('data-theme', theme)
}

export function useThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('system')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const stored = (window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system'

    if (stored === 'system') {
      applyTheme(getSystemPreference())
    } else {
      applyTheme(stored)
    }
    setMode(stored)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => {
      const currentStored = (window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? 'system'
      if (currentStored === 'system') {
        applyTheme(event.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const setTheme = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode)
    if (nextMode === 'system') {
      window.localStorage.setItem(STORAGE_KEY, 'system')
      applyTheme(getSystemPreference())
    } else {
      window.localStorage.setItem(STORAGE_KEY, nextMode)
      applyTheme(nextMode)
    }
  }, [])

  return { mode, setTheme }
}