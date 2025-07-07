'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Loader2 } from 'lucide-react'
import type { OnboardingStep } from '@/types/onboarding'

interface VisualSelectStepProps {
  step: OnboardingStep
  onComplete: (data: any) => void
  onSkip?: () => void
  previousData: Record<string, any>
}

export function VisualSelectStep({ step, onComplete, onSkip }: VisualSelectStepProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const config = step.config || {}
  const options = step.fields?.[0]?.options || config.options || []
  const title = config.title || step.fields?.[0]?.question || ''
  const subtitle = config.subtitle || ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selected) return

    setLoading(true)
    try {
      const fieldName = step.fields?.[0]?.name || 'preference'
      await onComplete({ 
        [fieldName]: selected,
        details: options.find((opt: any) => opt.value === selected)
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600">
              {subtitle}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {options.map((option: any) => (
              <motion.button
                key={option.value}
                type="button"
                onClick={() => setSelected(option.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative p-6 rounded-xl border-2 transition-all
                  ${selected === option.value
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">
                    {option.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {option.label}
                  </h3>
                  {option.description && (
                    <p className="text-sm text-gray-600">
                      {option.description}
                    </p>
                  )}
                </div>

                {selected === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-6">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700"
              >
                Skip for now
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading || !selected}
              className="ml-auto flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}