/**
 * Consent Logging API Route
 *
 * Stores user consent decisions in database for GDPR compliance
 * Only logs for authenticated users
 *
 * Rate limiting: 10 requests per minute per IP
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/v2/server'
import { ConsentRecord } from '@/types/consent'
import { apiRateLimit, getClientIP, checkRateLimit, formatResetTime } from '@/lib/rate-limit'

export async function POST(request: Request) {
  // Apply rate limiting
  const ip = getClientIP(request.headers)
  const { success, reset } = await checkRateLimit(apiRateLimit, `consent:${ip}`)

  if (!success) {
    const resetIn = formatResetTime(reset)
    return NextResponse.json(
      {
        error: `Too many requests. Please try again in ${resetIn}.`,
        retryAfter: reset
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        }
      }
    )
  }
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // Don't log consent for unauthenticated users (only local storage)
      return NextResponse.json({ success: true, message: 'Consent stored locally' })
    }

    const body: ConsentRecord = await request.json()

    // Store consent in database
    const { error } = await supabase
      .from('consent_log')
      .insert({
        user_id: user.id,
        preferences: body.preferences,
        timestamp: body.timestamp,
        privacy_policy_version: body.version,
        user_agent: body.userAgent,
      } as any)

    if (error) {
      console.error('Failed to log consent:', error)
      return NextResponse.json(
        { error: 'Failed to log consent' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Consent logging error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get consent history for current user
 */
export async function GET(request: Request) {
  // Apply rate limiting
  const ip = getClientIP(request.headers)
  const { success, reset } = await checkRateLimit(apiRateLimit, `consent:${ip}`)

  if (!success) {
    const resetIn = formatResetTime(reset)
    return NextResponse.json(
      {
        error: `Too many requests. Please try again in ${resetIn}.`,
        retryAfter: reset
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        }
      }
    )
  }
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data, error } = await supabase
      .from('consent_log')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Failed to get consent history:', error)
      return NextResponse.json(
        { error: 'Failed to get consent history' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Consent history error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
