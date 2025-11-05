'use client'

import React from 'react'

export interface FooterButton {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  loading?: boolean
}

export interface BlipeeModalFooterProps {
  leftButtons?: FooterButton[]
  rightButtons?: FooterButton[]
}

export function BlipeeModalFooter({ leftButtons = [], rightButtons = [] }: BlipeeModalFooterProps) {
  const getButtonStyle = (variant: 'primary' | 'secondary' | 'danger' = 'secondary', disabled = false) => {
    const baseStyle = {
      padding: '0.75rem 1.5rem',
      borderRadius: '12px',
      fontSize: '0.9rem',
      fontWeight: 600,
      transition: 'all 0.3s ease',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          background: 'var(--gradient-primary)',
          border: 'none',
          color: 'white',
        }
      case 'danger':
        return {
          ...baseStyle,
          background: 'var(--red)',
          border: 'none',
          color: 'white',
        }
      case 'secondary':
      default:
        return {
          ...baseStyle,
          background: 'transparent',
          border: '1px solid var(--glass-border)',
          color: 'var(--text-secondary)',
        }
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
    >
      {/* Left buttons */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {leftButtons.map((button, index) => (
          <button
            key={index}
            onClick={button.onClick}
            disabled={button.disabled || button.loading}
            style={getButtonStyle(button.variant, button.disabled || button.loading)}
          >
            {button.loading ? 'Loading...' : button.label}
          </button>
        ))}
      </div>

      {/* Right buttons */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        {rightButtons.map((button, index) => (
          <button
            key={index}
            onClick={button.onClick}
            disabled={button.disabled || button.loading}
            style={getButtonStyle(button.variant, button.disabled || button.loading)}
          >
            {button.loading ? 'Loading...' : button.label}
          </button>
        ))}
      </div>
    </div>
  )
}
