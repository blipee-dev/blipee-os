'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'
import { premiumTheme } from '@/lib/design/theme'

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'blue' | 'success' | 'coral'
  size?: 'small' | 'medium' | 'large'
  loading?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
  fullWidth?: boolean
}

export function GradientButton({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  startIcon,
  endIcon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: GradientButtonProps) {
  const gradients = {
    primary: premiumTheme.colors.gradients.primary,
    blue: premiumTheme.colors.gradients.blue,
    success: premiumTheme.colors.gradients.success,
    coral: premiumTheme.colors.gradients.coral,
  }

  const sizes = {
    small: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
      height: '36px',
    },
    medium: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
      height: '44px',
    },
    large: {
      padding: '1rem 2rem',
      fontSize: '1.125rem',
      height: '52px',
    },
  }

  const buttonStyles = {
    background: disabled ? premiumTheme.colors.background.glass : gradients[variant],
    color: disabled ? premiumTheme.colors.text.tertiary : 'white',
    border: 'none',
    borderRadius: premiumTheme.borderRadius.md,
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.5 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    width: fullWidth ? '100%' : 'auto',
    ...sizes[size],
  }

  return (
    <button
      className={`gradient-button ${className}`}
      style={buttonStyles}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        <>
          {startIcon && <span className="flex items-center">{startIcon}</span>}
          {children}
          {endIcon && <span className="flex items-center">{endIcon}</span>}
        </>
      )}
    </button>
  )
}