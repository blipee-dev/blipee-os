/**
 * Auth Server Actions (V2)
 *
 * These are Server Actions that handle authentication using native Supabase auth.
 * They replace the need for API routes for auth operations.
 *
 * Key Features:
 * - Native Supabase JWT auth (no custom session tokens)
 * - Form-friendly (works without JavaScript)
 * - Automatic revalidation
 * - Type-safe with Zod validation
 *
 * Based on: https://supabase.com/docs/guides/auth/server-side/nextjs
 */

'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/v2/server'
import { success as toastSuccess, error as toastError } from '@/lib/toast'
import { z } from 'zod'
import { 
  authRateLimit, 
  passwordResetRateLimit, 
  getClientIP, 
  checkRateLimit,
  formatResetTime 
} from '@/lib/rate-limit'

// Validation schemas
const SignInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'), // No min length for login - accept existing passwords
})

const SignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const UpdatePasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

/**
 * Sign in with email and password
 *
 * @example
 * ```tsx
 * // In a form
 * <form action={signIn}>
 *   <input name="email" type="email" required />
 *   <input name="password" type="password" required />
 *   <button type="submit">Sign In</button>
 * </form>
 * ```
 */
export async function signIn(formData: FormData): Promise<void> {
  // Rate limiting
  const headersList = await headers()
  const ip = getClientIP(headersList)
  const rateLimit = await checkRateLimit(authRateLimit, ip)
  
  if (!rateLimit.success) {
    const resetTime = formatResetTime(rateLimit.reset)
    await toastError(`Too many login attempts. Please try again in ${resetTime}.`)
    redirect('/signin')
  }

  // Validate input
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validation = SignInSchema.safeParse(rawData)
  if (!validation.success) {
    await toastError(validation.error.errors[0].message)
    redirect('/signin')
  }

  const { email, password } = validation.data

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Don't expose detailed auth errors to prevent enumeration attacks
      await toastError('Invalid email or password')
      redirect('/signin')
    }

    await toastSuccess('Welcome back!')
    redirect('/dashboard')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    await toastError('An unexpected error occurred. Please try again.')
    redirect('/signin')
  }
}

/**
 * Sign up with email and password
 *
 * @example
 * ```tsx
 * <form action={signUp}>
 *   <input name="email" type="email" required />
 *   <input name="password" type="password" required />
 *   <input name="confirmPassword" type="password" required />
 *   <input name="name" type="text" />
 *   <button type="submit">Sign Up</button>
 * </form>
 * ```
 */
export async function signUp(formData: FormData): Promise<void> {
  // Rate limiting
  const headersList = await headers()
  const ip = getClientIP(headersList)
  const rateLimit = await checkRateLimit(authRateLimit, ip)
  
  if (!rateLimit.success) {
    const resetTime = formatResetTime(rateLimit.reset)
    await toastError(`Too many signup attempts. Please try again in ${resetTime}.`)
    redirect('/signup')
  }

  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    name: formData.get('name') as string | undefined,
  }

  const validation = SignUpSchema.safeParse(rawData)
  if (!validation.success) {
    await toastError(validation.error.errors[0].message)
    redirect('/signup')
  }

  const { email, password, name } = validation.data

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (error) {
      await toastError('Could not create account. Please try again.')
      redirect('/signup')
    }

    await toastSuccess('Check your email to confirm your account')
    redirect('/signup')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    await toastError('An unexpected error occurred. Please try again.')
    redirect('/signup')
  }
}

/**
 * Sign out
 *
 * @example
 * ```tsx
 * <form action={signOut}>
 *   <button type="submit">Sign Out</button>
 * </form>
 * ```
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()

  redirect('/signin')
}

/**
 * Request password reset email
 *
 * @example
 * ```tsx
 * <form action={resetPassword}>
 *   <input name="email" type="email" required />
 *   <button type="submit">Reset Password</button>
 * </form>
 * ```
 */
export async function resetPassword(formData: FormData): Promise<void> {
  console.log('[RESET PASSWORD] Starting password reset flow')

  // Rate limiting (more restrictive for password resets)
  const headersList = await headers()
  const ip = getClientIP(headersList)
  console.log('[RESET PASSWORD] Client IP:', ip)

  const rateLimit = await checkRateLimit(passwordResetRateLimit, ip)
  console.log('[RESET PASSWORD] Rate limit check:', rateLimit)

  if (!rateLimit.success) {
    const resetTime = formatResetTime(rateLimit.reset)
    console.log('[RESET PASSWORD] Rate limit exceeded, reset time:', resetTime)
    await toastError(`Too many password reset attempts. Please try again in ${resetTime}.`)
    redirect('/forgot-password')
  }

  const rawData = {
    email: formData.get('email') as string,
  }
  console.log('[RESET PASSWORD] Email submitted:', rawData.email)

  const validation = ResetPasswordSchema.safeParse(rawData)
  if (!validation.success) {
    console.log('[RESET PASSWORD] Validation failed:', validation.error.errors)
    await toastError(validation.error.errors[0].message)
    redirect('/forgot-password')
  }

  const { email } = validation.data
  console.log('[RESET PASSWORD] Email validated:', email)

  try {
    const supabase = await createClient()
    console.log('[RESET PASSWORD] Supabase client created')

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`
    console.log('[RESET PASSWORD] Redirect URL:', redirectUrl)

    const { error, data } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    console.log('[RESET PASSWORD] Supabase response:', { error, data })

    if (error) {
      console.log('[RESET PASSWORD] Supabase error:', error)
      // Don't expose whether email exists
      await toastSuccess('If that email is registered, you will receive a password reset link.')
      redirect('/forgot-password')
    }

    console.log('[RESET PASSWORD] Success - email should be sent')
    await toastSuccess('Check your email for a password reset link')
    redirect('/forgot-password')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      console.log('[RESET PASSWORD] Redirect thrown (expected)')
      throw error
    }

    console.error('[RESET PASSWORD] Unexpected error:', error)
    await toastError('An unexpected error occurred. Please try again.')
    redirect('/forgot-password')
  }
}

/**
 * Update password (after clicking reset link)
 *
 * @example
 * ```tsx
 * <form action={updatePassword}>
 *   <input name="password" type="password" required />
 *   <input name="confirmPassword" type="password" required />
 *   <button type="submit">Update Password</button>
 * </form>
 * ```
 */
export async function updatePassword(formData: FormData): Promise<void> {
  console.log('[UPDATE PASSWORD] Starting password update flow')

  const rawData = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }
  console.log('[UPDATE PASSWORD] Password length:', rawData.password?.length)

  const validation = UpdatePasswordSchema.safeParse(rawData)
  if (!validation.success) {
    console.log('[UPDATE PASSWORD] Validation failed:', validation.error.errors)
    await toastError(validation.error.errors[0].message)
    redirect('/reset-password')
  }

  const { password } = validation.data
  console.log('[UPDATE PASSWORD] Password validated')

  try {
    const supabase = await createClient()
    console.log('[UPDATE PASSWORD] Supabase client created')

    // Check if user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('[UPDATE PASSWORD] User check:', { user: user?.id, error: userError })

    const { error } = await supabase.auth.updateUser({
      password,
    })

    console.log('[UPDATE PASSWORD] Update user response:', { error })

    if (error) {
      console.log('[UPDATE PASSWORD] Supabase error:', error.message)
      await toastError('Could not update password. Please try again.')
      redirect('/reset-password')
    }

    console.log('[UPDATE PASSWORD] Password updated successfully')
    await toastSuccess('Password updated successfully! You can now sign in.')
    redirect('/signin')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      console.log('[UPDATE PASSWORD] Redirect thrown (expected)')
      throw error
    }

    console.error('[UPDATE PASSWORD] Unexpected error:', error)
    await toastError('An unexpected error occurred. Please try again.')
    redirect('/reset-password')
  }
}

/**
 * Sign in with OAuth provider
 *
 * @example
 * ```tsx
 * <form action={() => signInWithOAuth('google')}>
 *   <button type="submit">Sign in with Google</button>
 * </form>
 * ```
 */
export async function signInWithOAuth(
  provider: 'google' | 'github'
): Promise<void> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    await toastError('Could not sign in with OAuth. Please try again.')
    redirect('/signin')
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithOAuth('google')
}

export async function signInWithGitHub(): Promise<void> {
  await signInWithOAuth('github')
}
