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

  return <>{children}</>
}
