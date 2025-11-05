'use client'

import React, { useEffect, ReactNode } from 'react'
import styles from '@/styles/settings-layout.module.css'

export interface BlipeeModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  badges?: ReactNode[]
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
  className?: string
}

export function BlipeeModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badges,
  children,
  footer,
  maxWidth = '800px',
  className,
}: BlipeeModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className={`${styles.section} ${className || ''}`}
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
          width: '100%',
          maxWidth,
          padding: '2rem',
          margin: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || badges) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div>
              {title && <h2 className={styles.sectionTitle}>{title}</h2>}
              {subtitle && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {subtitle}
                </p>
              )}
              {badges && badges.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {badges}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                padding: '0.5rem',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Content */}
        <div>{children}</div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--glass-border)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
