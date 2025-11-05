/**
 * Auth Server Actions (V2)
 *
 * These are Server Actions that handle authentication using safe-link proof tokens.
 * Custom tokens resist email security systems (Microsoft Safe Links, Gmail, etc.)
 * that pre-fetch links and consume one-time tokens.
 *
 * Key Features:
 * - Safe-link proof tokens (stored in user_metadata, not consumed on first use)
 * - Form-friendly (works without JavaScript)
 * - Automatic revalidation
 * - Type-safe with Zod validation
 *
 * Based on: retail-platform's auth-middleware approach
 */

'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient, createAdminClient } from '@/lib/supabase/v2/server'
import { success as toastSuccess, error as toastError } from '@/lib/toast'
import { z } from 'zod'
import {
  authRateLimit,
  passwordResetRateLimit,
  getClientIP,
  checkRateLimit,
  formatResetTime
} from '@/lib/rate-limit'
import { storeToken, generateTokenUrl } from '@/lib/auth/tokens'
import { detectBrowserLocale, getUserLocale } from '@/lib/email/utils'
import { getEmailTemplate, getEmailSubject } from '@/lib/email/templates'
import type { Locale } from '@/lib/email/templates'

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
 * SAFE-LINK PROOF: Uses custom tokens stored in user_metadata
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
    // Detect user's preferred locale from browser
    const locale = await detectBrowserLocale()
    console.log('[SIGNUP] Detected locale:', locale)

    // Create user with admin client (email confirmation disabled initially)
    const adminClient = createAdminClient()

    const { data: authUser, error: signUpError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // We'll confirm via our custom token
      user_metadata: {
        name,
        preferred_locale: locale, // Store detected locale
      },
    })

    if (signUpError) {
      console.error('[SIGNUP] Error creating user:', signUpError)
      await toastError('Could not create account. Please try again.')
      redirect('/signup')
    }

    if (!authUser?.user) {
      await toastError('Could not create account. Please try again.')
      redirect('/signup')
    }

    console.log('[SIGNUP] User created:', authUser.user.id)

    // Generate confirmation token
    const { token, error: tokenError } = await storeToken(email, 'email_confirmation')

    if (tokenError || !token) {
      console.error('[SIGNUP] Error generating token:', tokenError)
      await toastError('Could not send confirmation email. Please contact support.')
      redirect('/signup')
    }

    // Generate confirmation URL
    const confirmationUrl = generateTokenUrl(
      process.env.NEXT_PUBLIC_APP_URL!,
      'email_confirmation',
      email,
      token
    )

    console.log('[SIGNUP] Confirmation URL:', confirmationUrl)

    // Send confirmation email with localized template
    const { sendEmail } = await import('@/lib/email/mailer')

    const emailHtml = getEmailTemplate('email_confirmation', locale, {
      name: name || '',
      confirmationUrl,
    })

    const emailSubject = getEmailSubject('email_confirmation', locale)

    const emailResult = await sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
    })

    if (!emailResult.success) {
      console.error('[SIGNUP] Failed to send confirmation email:', emailResult.error)
      // Don't fail signup if email fails - user can request new link
    } else {
      console.log('[SIGNUP] Confirmation email sent successfully')
    }

    await toastSuccess('Check your email to confirm your account')
    redirect('/signup')
  } catch (error) {
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    console.error('[SIGNUP] Exception:', error)
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
 * SAFE-LINK PROOF: Uses custom tokens stored in user_metadata
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
    // Generate password reset token
    const { token, error: tokenError, userId } = await storeToken(email, 'password_reset')

    // Don't expose whether email exists - always show success
    if (tokenError || !token) {
      console.log('[RESET PASSWORD] Token generation failed (email may not exist):', tokenError)
      await toastSuccess('If that email is registered, you will receive a password reset link.')
      redirect('/forgot-password')
      return
    }

    // Get user's preferred locale (or default to en-US)
    let locale: Locale = 'en-US'
    if (userId) {
      locale = await getUserLocale(userId, { email })
      console.log('[RESET PASSWORD] User locale:', locale)
    }

    // Generate reset URL
    const resetUrl = generateTokenUrl(
      process.env.NEXT_PUBLIC_APP_URL!,
      'password_reset',
      email,
      token
    )

    console.log('[RESET PASSWORD] Reset URL:', resetUrl)

    // Send password reset email with localized template
    const { sendEmail } = await import('@/lib/email/mailer')

    const emailHtml = getEmailTemplate('password_reset', locale, {
      email,
      resetUrl,
    })

    const emailSubject = getEmailSubject('password_reset', locale)

    const emailResult = await sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
    })

    if (!emailResult.success) {
      console.error('[RESET PASSWORD] Failed to send reset email:', emailResult.error)
      // Don't expose email sending failure - show generic success message
    } else {
      console.log('[RESET PASSWORD] Password reset email sent successfully')
    }

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

    if (!user) {
      await toastError('Session expired. Please request a new password reset link.')
      redirect('/forgot-password')
    }

    const { error } = await supabase.auth.updateUser({
      password,
    })

    console.log('[UPDATE PASSWORD] Update user response:', { error })

    if (error) {
      console.log('[UPDATE PASSWORD] Supabase error:', error.message)
      await toastError('Could not update password. Please try again.')
      redirect('/reset-password')
    }

    // Clear the password reset token
    const { clearToken } = await import('@/lib/auth/tokens')
    await clearToken(user.id, 'password_reset')
    console.log('[UPDATE PASSWORD] Cleared password reset token')

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
