'use client'

import { useRouter } from 'next/navigation'
import { ConversationalOnboarding } from '@/components/onboarding/ConversationalOnboarding'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OnboardingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      setUserId(user.id)
    }
    checkUser()
  }, [router])

  const handleComplete = async (config: any) => {
    // Save onboarding configuration
    console.log('Onboarding complete:', config)
    
    // Navigate to dashboard
    router.push('/dashboard')
  }

  if (!userId) return null

  return <ConversationalOnboarding onComplete={handleComplete} userId={userId} />
}