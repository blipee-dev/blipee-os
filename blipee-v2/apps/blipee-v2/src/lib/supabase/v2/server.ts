/**
 * Supabase Server Client (V2)
 *
 * This client is for Server Components and Server Actions.
 * Uses native Supabase JWT auth with proper cookie handling.
 *
 * IMPORTANT:
 * - Use `auth.getUser()` (NEVER `getSession()` in server code)
 * - Cookies are read-only in Server Components
 * - Use Server Actions for mutations
 *
 * Based on: https://supabase.com/docs/guides/auth/server-side/creating-a-client
 *
 * @example Server Component
 * ```tsx
 * import { createClient } from '@/lib/supabase/v2/server'
 *
 * export default async function DashboardPage() {
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *
 *   if (!user) redirect('/signin')
 *
 *   // Fetch data with RLS
 *   const { data } = await supabase
 *     .from('metrics')
 *     .select('*')
 *
 *   return <Dashboard data={data} />
 * }
 * ```
 *
 * @example Server Action
 * ```tsx
 * 'use server'
 * import { createClient } from '@/lib/supabase/v2/server'
 *
 * export async function createMetric(formData: FormData) {
 *   const supabase = await createClient()
 *   const { data: { user } } = await supabase.auth.getUser()
 *
 *   if (!user) return { error: 'Not authenticated' }
 *
 *   const { error } = await supabase
 *     .from('metrics')
 *     .insert({ user_id: user.id, value: formData.get('value') })
 *
 *   if (error) return { error: error.message }
 *
 *   revalidatePath('/dashboard')
 *   return { success: true }
 * }
 * ```
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Create admin client for server-side operations that bypass RLS
 *
 * WARNING: This client bypasses Row Level Security. Use with caution!
 * Only use for:
 * - Admin operations
 * - Background jobs
 * - System-level tasks
 *
 * @example
 * ```tsx
 * import { createAdminClient } from '@/lib/supabase/v2/server'
 *
 * // In a background job
 * export async function processMetrics() {
 *   const supabase = createAdminClient()
 *
 *   // This bypasses RLS - be careful!
 *   const { data } = await supabase
 *     .from('metrics')
 *     .select('*')
 *
 *   // Process all metrics...
 * }
 * ```
 */
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // No-op for admin client
        },
      },
    }
  )
}
