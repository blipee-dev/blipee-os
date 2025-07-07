'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Star } from 'lucide-react'
import type { OnboardingStep } from '@/types/onboarding'

interface SingleChoiceStepProps {
  step: OnboardingStep
  onComplete: (data: any) => void
  onSkip?: () => void
  previousData: Record<string, any>
}

export function SingleChoiceStep({ step, onComplete, onSkip }: SingleChoiceStepProps) {
  const config = step.config
  const [selected, setSelected] = useState<string | null>(null)

  async function handleSelect(value: string) {
    setSelected(value)
    // Auto-advance after selection
    setTimeout(() => {
      onComplete({ 
        selected: value,
        details: config.options.find((opt: any) => opt.value === value)
      })
    }, 300)
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
            {config.title}
          </h2>
          {config.subtitle && (
            <p className="text-gray-600">
              {config.subtitle}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {config.options.map((option: any) => (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative w-full p-6 rounded-xl border-2 transition-all text-left
                ${selected === option.value
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
              `}
            >
              {option.recommended && (
                <div className="absolute -top-3 left-6 px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  Recommended
                </div>
              )}

              <div className="flex items-start">
                <div className={`
                  w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center flex-shrink-0 mt-0.5
                  ${selected === option.value
                    ? 'border-blue-600 bg-blue-600' 
                    : 'border-gray-300'
                  }
                `}>
                  {selected === option.value && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {option.label}
                    </h3>
                    {option.price && (
                      <span className="text-lg font-bold text-gray-900">
                        {option.price}
                      </span>
                    )}
                  </div>
                  
                  {option.description && (
                    <p className="text-gray-600 mb-3">
                      {option.description}
                    </p>
                  )}

                  {option.features && (
                    <ul className="space-y-1">
                      {option.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  {option.icon && (
                    <div className="mt-3 text-3xl">
                      {option.icon}
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {onSkip && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip this step
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}