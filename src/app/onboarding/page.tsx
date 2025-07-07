'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'
import { useAuth } from '@/lib/auth/context'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const { session, loading: authLoading } = useAuth()
  const [starting, setStarting] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/signin')
    } else if (session?.user.onboarding_completed) {
      router.push('/dashboard')
    } else if (session) {
      setStarting(false)
    }
  }, [session, authLoading, router])

  async function handleComplete() {
    // Refresh session to get updated onboarding status
    window.location.href = '/dashboard'
  }

  if (authLoading || starting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Preparing your setup...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Get user's role from the session
  const userRole = session.permissions.find(p => p.resource === '*')?.action === '*' 
    ? 'subscription_owner' 
    : 'site_manager' // Default role if not determined

  return (
    <OnboardingFlow
      userId={session.user.id}
      role={userRole as any}
      onComplete={handleComplete}
    />
  )
}