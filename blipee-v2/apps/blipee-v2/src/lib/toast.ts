/**
 * Server-side Toast Utility
 *
 * This utility allows Server Actions to set toast messages that will be
 * displayed on the client side after a redirect.
 *
 * How it works:
 * 1. Server Action calls toast.success() or toast.error()
 * 2. Message is stored in a cookie
 * 3. After redirect, client component reads the cookie
 * 4. Toast notification is displayed
 * 5. Cookie is cleared
 *
 * Usage in Server Actions:
 * ```ts
 * await toast.success('Operation completed!')
 * redirect('/dashboard')
 * ```
 *
 * Usage in Client Components:
 * ```tsx
 * import { useToastMessages } from '@/lib/toast'
 *
 * export function MyComponent() {
 *   useToastMessages() // Automatically displays and clears toast messages
 *   return <div>...</div>
 * }
 * ```
 */

'use server'

import { cookies } from 'next/headers'

const TOAST_COOKIE_NAME = 'toast-message'
const TOAST_TYPE_COOKIE_NAME = 'toast-type'
const COOKIE_MAX_AGE = 5 // seconds

export type ToastType = 'success' | 'error' | 'info' | 'loading'

interface ToastMessage {
  type: ToastType
  message: string
}

/**
 * Set a success toast message
 */
export async function success(message: string): Promise<void> {
  console.log('[TOAST] Setting success message:', message)
  const cookieStore = await cookies()
  cookieStore.set(TOAST_COOKIE_NAME, message, {
    httpOnly: false, // Allow client-side access
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  })
  cookieStore.set(TOAST_TYPE_COOKIE_NAME, 'success', {
    httpOnly: false,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  })
  console.log('[TOAST] Success message set in cookies')
}

/**
 * Set an error toast message
 */
export async function error(message: string): Promise<void> {
  console.log('[TOAST] Setting error message:', message)
  const cookieStore = await cookies()
  cookieStore.set(TOAST_COOKIE_NAME, message, {
    httpOnly: false,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  })
  cookieStore.set(TOAST_TYPE_COOKIE_NAME, 'error', {
    httpOnly: false,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  })
  console.log('[TOAST] Error message set in cookies')
}

/**
 * Set an info toast message
 */
export async function info(message: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(TOAST_COOKIE_NAME, message, {
    httpOnly: false,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  })
  cookieStore.set(TOAST_TYPE_COOKIE_NAME, 'info', {
    httpOnly: false,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    sameSite: 'lax',
  })
}
