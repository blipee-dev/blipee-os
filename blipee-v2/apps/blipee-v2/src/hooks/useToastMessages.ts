'use client'

import { useEffect } from 'react'
import { toast as hotToast } from 'react-hot-toast'

/**
 * Client-side hook to display toast messages from Server Actions
 *
 * This hook automatically reads toast messages from cookies (set by Server Actions)
 * and displays them using react-hot-toast, then clears the cookies.
 *
 * Usage:
 * ```tsx
 * export default function MyPage() {
 *   useToastMessages() // Add this to any page that receives redirects from Server Actions
 *   return <div>...</div>
 * }
 * ```
 *
 * The hook runs once on component mount and checks for toast messages.
 * If found, it displays the toast and clears the cookie.
 */
export function useToastMessages() {
  useEffect(() => {
    // Read cookies on client side
    const message = getCookie('toast-message')
    const type = getCookie('toast-type') as 'success' | 'error' | 'info' | null

    if (message && type) {
      // Display the toast
      switch (type) {
        case 'success':
          hotToast.success(message)
          break
        case 'error':
          hotToast.error(message)
          break
        case 'info':
          hotToast(message)
          break
      }

      // Clear the cookies
      deleteCookie('toast-message')
      deleteCookie('toast-type')
    }
  }, [])
}

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null

  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)

  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }

  return null
}

/**
 * Delete cookie by name
 */
function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return

  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax`
}
