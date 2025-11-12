'use client'

import { useEffect, useState } from 'react'
import styles from './ToastNotification.module.css'

type Toast = {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface ToastNotificationProps {
  toast: Toast | null
}

export function ToastNotification({ toast: initialToast }: ToastNotificationProps) {
  const [toast, setToast] = useState<Toast | null>(initialToast)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (initialToast) {
      setToast(initialToast)
      setIsVisible(true)

      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => setToast(null), 300) // Wait for animation
      }, initialToast.duration || 5000)

      return () => clearTimeout(timer)
    }
  }, [initialToast])

  if (!toast) return null

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )
      case 'error':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )
      case 'warning':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )
      case 'info':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        )
    }
  }

  return (
    <div 
      className={`${styles.toast} ${styles[toast.type]} ${isVisible ? styles.visible : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.icon}>{getIcon()}</div>
      <p className={styles.message}>{toast.message}</p>
      <button
        className={styles.close}
        onClick={() => {
          setIsVisible(false)
          setTimeout(() => setToast(null), 300)
        }}
        aria-label="Fechar notificação"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
