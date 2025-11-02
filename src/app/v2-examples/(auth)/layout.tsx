/**
 * Auth Layout (V2)
 *
 * Layout for authentication pages (signin, signup, etc.)
 * - Centered form layout
 * - Redirects if already authenticated
 *
 * @example
 * This layout wraps all pages in the (auth) route group:
 * - /signin
 * - /signup
 * - /forgot-password
 * - /reset-password
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/v2/server'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check if user is already authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to dashboard if already logged in
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Blipee
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sustainability tracking platform
          </p>
        </div>

        {/* Page content */}
        {children}
      </div>
    </div>
  )
}
