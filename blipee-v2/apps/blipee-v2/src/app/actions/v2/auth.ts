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
import { toast } from '@/lib/toast'
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
  password: z.string().min(8, 'Password must be at least 8 characters'),
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
    await toast.error(`Too many login attempts. Please try again in ${resetTime}.`)
    redirect('/signin')
  }

  // Validate input
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validation = SignInSchema.safeParse(rawData)
  if (!validation.success) {
    await toast.error(validation.error.errors[0].message)
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
      await toast.error('Invalid email or password')
      redirect('/signin')
    }

    await toast.success('Welcome back!')
    redirect('/dashboard')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    await toast.error('An unexpected error occurred. Please try again.')
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
    await toast.error(`Too many signup attempts. Please try again in ${resetTime}.`)
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
    await toast.error(validation.error.errors[0].message)
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
      await toast.error('Could not create account. Please try again.')
      redirect('/signup')
    }

    await toast.success('Check your email to confirm your account')
    redirect('/signup')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    await toast.error('An unexpected error occurred. Please try again.')
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
  // Rate limiting (more restrictive for password resets)
  const headersList = await headers()
  const ip = getClientIP(headersList)
  const rateLimit = await checkRateLimit(passwordResetRateLimit, ip)
  
  if (!rateLimit.success) {
    const resetTime = formatResetTime(rateLimit.reset)
    await toast.error(`Too many password reset attempts. Please try again in ${resetTime}.`)
    redirect('/forgot-password')
  }

  const rawData = {
    email: formData.get('email') as string,
  }

  const validation = ResetPasswordSchema.safeParse(rawData)
  if (!validation.success) {
    await toast.error(validation.error.errors[0].message)
    redirect('/forgot-password')
  }

  const { email } = validation.data

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      // Don't expose whether email exists
      await toast.success('If that email is registered, you will receive a password reset link.')
      redirect('/forgot-password')
    }

    await toast.success('Check your email for a password reset link')
    redirect('/forgot-password')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    await toast.error('An unexpected error occurred. Please try again.')
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
  const rawData = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const validation = UpdatePasswordSchema.safeParse(rawData)
  if (!validation.success) {
    await toast.error(validation.error.errors[0].message)
    redirect('/reset-password')
  }

  const { password } = validation.data

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      await toast.error('Could not update password. Please try again.')
      redirect('/reset-password')
    }

    await toast.success('Password updated successfully! You can now sign in.')
    redirect('/signin')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    await toast.error('An unexpected error occurred. Please try again.')
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
    await toast.error('Could not sign in with OAuth. Please try again.')
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
