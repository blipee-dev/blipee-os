'use client'

import { Toaster } from 'react-hot-toast'

/**
 * Toast Provider Component
 *
 * Wraps the app with react-hot-toast notifications
 * Provides consistent styling across all toast messages
 */
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: 'var(--toast-bg, #363636)',
          color: 'var(--toast-color, #fff)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          maxWidth: '500px',
        },
        // Success toast styles
        success: {
          duration: 3000,
          iconTheme: {
            primary: 'var(--color-success, #10b981)',
            secondary: '#fff',
          },
        },
        // Error toast styles
        error: {
          duration: 5000,
          iconTheme: {
            primary: 'var(--color-error, #ef4444)',
            secondary: '#fff',
          },
        },
        // Loading toast styles
        loading: {
          iconTheme: {
            primary: 'var(--color-primary, #3b82f6)',
            secondary: '#fff',
          },
        },
      }}
    />
  )
}
