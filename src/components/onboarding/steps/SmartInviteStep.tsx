'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Loader2, UserPlus, Mail } from 'lucide-react'
import { onboardingService } from '@/lib/onboarding/service'
import type { OnboardingStep } from '@/types/onboarding'

interface SmartInviteStepProps {
  step: OnboardingStep
  onComplete: (data: any) => void
  onSkip?: () => void
  previousData: Record<string, any>
}

export function SmartInviteStep({ step, onComplete, onSkip }: SmartInviteStepProps) {
  const config = step.config
  const [input, setInput] = useState('')
  const [parsedInvites, setParsedInvites] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  function handleInputChange(value: string) {
    setInput(value)
    setErrors([])

    if (value.trim()) {
      try {
        const parsed = onboardingService.parseBulkInput('smart_invite_parser', value)
        setParsedInvites(parsed)
      } catch (error: any) {
        setErrors([error.message])
        setParsedInvites([])
      }
    } else {
      setParsedInvites([])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (errors.length > 0) return

    setLoading(true)
    try {
      await onComplete({ 
        input,
        invites: parsedInvites 
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSkipInvites() {
    if (onSkip) {
      await onComplete({ skipped: true })
      onSkip()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
            <UserPlus className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {config.title}
            </h2>
            <p className="text-gray-600">
              {config.subtitle}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format: {config.format}
            </label>
            
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={config.placeholder}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>

          {/* Preview invites */}
          {parsedInvites.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Ready to invite {parsedInvites.length} {parsedInvites.length === 1 ? 'person' : 'people'}
              </h3>
              <div className="space-y-2">
                {parsedInvites.map((invite, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white rounded-md px-3 py-2 text-sm"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-xs font-medium text-gray-600">
                          {invite.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{invite.email}</p>
                        {invite.building && (
                          <p className="text-xs text-gray-500">
                            Will manage: {invite.building}
                          </p>
                        )}
                        {invite.name && (
                          <p className="text-xs text-gray-500">
                            {invite.name} {invite.role && `• ${invite.role}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-700">{error}</p>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-6">
            {config.skipOption && (
              <button
                type="button"
                onClick={handleSkipInvites}
                className="text-gray-500 hover:text-gray-700"
              >
                {config.skipOption.label}
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading || errors.length > 0 || parsedInvites.length === 0}
              className="ml-auto flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Send Invites
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>

          {config.skipOption && (
            <p className="text-sm text-gray-500 text-center">
              {config.skipOption.consequence}
            </p>
          )}
        </form>
      </motion.div>
    </div>
  )
}