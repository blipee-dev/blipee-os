'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Loader2, Check } from 'lucide-react'
import type { OnboardingStep, ChecklistCategory, ChecklistOption } from '@/types/onboarding'

interface VisualChecklistStepProps {
  step: OnboardingStep
  onComplete: (data: any) => void
  onSkip?: () => void
  previousData: Record<string, any>
}

export function VisualChecklistStep({ step, onComplete, onSkip }: VisualChecklistStepProps) {
  const config = step.config
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [followUpData, setFollowUpData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  function toggleOption(categoryName: string, optionValue: string) {
    setSelections(prev => {
      const categorySelections = prev[categoryName] || []
      
      if (categorySelections.includes(optionValue)) {
        return {
          ...prev,
          [categoryName]: categorySelections.filter(v => v !== optionValue)
        }
      } else {
        return {
          ...prev,
          [categoryName]: [...categorySelections, optionValue]
        }
      }
    })
  }

  function handleFollowUpChange(optionValue: string, value: any) {
    setFollowUpData(prev => ({
      ...prev,
      [optionValue]: value
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    try {
      await onComplete({ 
        selections,
        followUpData,
        summary: Object.entries(selections).reduce((acc, [category, values]) => {
          values.forEach(value => {
            const option = config.categories
              .find((cat: ChecklistCategory) => cat.name === category)
              ?.options.find((opt: ChecklistOption) => opt.value === value)
            
            if (option) {
              acc.push({
                category,
                value: option.value,
                label: option.label,
                impact: option.impact,
                followUp: followUpData[option.value]
              })
            }
          })
          return acc
        }, [] as any[])
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {config.title}
        </h2>
        <p className="text-gray-600 mb-6">
          {config.instruction}
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {config.categories.map((category: ChecklistCategory) => (
            <div key={category.name}>
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">{category.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900">
                  {category.name}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category.options.map((option: ChecklistOption) => {
                  const isSelected = selections[category.name]?.includes(option.value)
                  
                  return (
                    <motion.div
                      key={option.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleOption(category.name, option.value)}
                        className={`
                          relative w-full p-4 rounded-lg border-2 transition-all text-left
                          ${isSelected 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                          }
                        `}
                      >
                        <div className="flex items-start">
                          <div className={`
                            w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center
                            ${isSelected 
                              ? 'border-green-500 bg-green-500' 
                              : 'border-gray-300'
                            }
                          `}>
                            {isSelected && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {option.label}
                            </p>
                          </div>
                        </div>

                        {/* Follow-up input */}
                        {isSelected && option.followUp && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 ml-9"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type={option.followUp.type}
                              placeholder={option.followUp.question}
                              value={followUpData[option.value] || ''}
                              onChange={(e) => handleFollowUpChange(option.value, e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </motion.div>
                        )}
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}

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
              disabled={loading}
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