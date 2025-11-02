/**
 * Supabase Browser Client (V2)
 *
 * This client is for Client Components that run in the browser.
 * Uses native Supabase JWT auth (not custom session tokens).
 *
 * Based on: https://supabase.com/docs/guides/auth/server-side/creating-a-client
 *
 * @example
 * ```tsx
 * 'use client'
 * import { createClient } from '@/lib/supabase/v2/client'
 *
 * export function LoginButton() {
 *   const supabase = createClient()
 *
 *   async function handleLogin() {
 *     await supabase.auth.signInWithPassword({
 *       email: 'user@example.com',
 *       password: 'password'
 *     })
 *   }
 *
 *   return <button onClick={handleLogin}>Login</button>
 * }
 * ```
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
