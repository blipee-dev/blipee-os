/**
 * Server-side toast notification system
 * Replaces URL-based error messages for better security and UX
 */

import { cookies } from 'next/headers'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

const TOAST_COOKIE_NAME = 'blipee_toast'
const DEFAULT_DURATION = 5000

/**
 * Set a toast message to be displayed on the next page load
 * This is server-side only and doesn't expose sensitive information in URLs
 */
export async function setToast(
  type: ToastType,
  message: string,
  duration: number = DEFAULT_DURATION
): Promise<void> {
  const cookieStore = await cookies()
  
  const toast: Toast = {
    id: crypto.randomUUID(),
    type,
    message,
    duration,
  }

  // Store as HTTP-only cookie for security
  cookieStore.set(TOAST_COOKIE_NAME, JSON.stringify(toast), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60, // 1 minute expiry
    path: '/',
  })
}

/**
 * Get and clear the toast message
 * Should be called in layout or page to display the toast
 */
export async function getToast(): Promise<Toast | null> {
  const cookieStore = await cookies()
  const toastCookie = cookieStore.get(TOAST_COOKIE_NAME)

  if (!toastCookie) {
    return null
  }

  // Delete the cookie after reading
  cookieStore.delete(TOAST_COOKIE_NAME)

  try {
    return JSON.parse(toastCookie.value) as Toast
  } catch {
    return null
  }
}

/**
 * Helper functions for common toast types
 */
export const toast = {
  success: (message: string, duration?: number) => setToast('success', message, duration),
  error: (message: string, duration?: number) => setToast('error', message, duration),
  info: (message: string, duration?: number) => setToast('info', message, duration),
  warning: (message: string, duration?: number) => setToast('warning', message, duration),
}
