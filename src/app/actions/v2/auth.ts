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

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/v2/server'
import { z } from 'zod'

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

// Return types
type ActionResult = {
  error?: string
  success?: boolean
  message?: string
}

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
export async function signIn(formData: FormData): Promise<ActionResult> {
  // Validate input
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validation = SignInSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      error: validation.error.errors[0].message,
    }
  }

  const { email, password } = validation.data

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        error: error.message,
      }
    }

    // Revalidate and redirect
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    // Redirect will throw, which is expected
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
      throw error
    }

    return {
      error: 'An unexpected error occurred',
    }
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
export async function signUp(formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
    name: formData.get('name') as string | undefined,
  }

  const validation = SignUpSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      error: validation.error.errors[0].message,
    }
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
      return {
        error: error.message,
      }
    }

    return {
      success: true,
      message: 'Check your email to confirm your account',
    }
  } catch (error) {
    return {
      error: 'An unexpected error occurred',
    }
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

  revalidatePath('/', 'layout')
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
export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get('email') as string,
  }

  const validation = ResetPasswordSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      error: validation.error.errors[0].message,
    }
  }

  const { email } = validation.data

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })

    if (error) {
      return {
        error: error.message,
      }
    }

    return {
      success: true,
      message: 'Check your email for a password reset link',
    }
  } catch (error) {
    return {
      error: 'An unexpected error occurred',
    }
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
export async function updatePassword(formData: FormData): Promise<ActionResult> {
  const rawData = {
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const validation = UpdatePasswordSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      error: validation.error.errors[0].message,
    }
  }

  const { password } = validation.data

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return {
        error: error.message,
      }
    }

    revalidatePath('/', 'layout')
    return {
      success: true,
      message: 'Password updated successfully',
    }
  } catch (error) {
    return {
      error: 'An unexpected error occurred',
    }
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
    redirect('/signin?error=' + encodeURIComponent(error.message))
  }

  if (data.url) {
    redirect(data.url)
  }
}
