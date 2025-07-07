'use client'

import React, { useState } from 'react'
import { motion, Reorder } from 'framer-motion'
import { ChevronRight, Loader2, GripVertical } from 'lucide-react'
import type { OnboardingStep, PriorityOption } from '@/types/onboarding'

interface PriorityMatrixStepProps {
  step: OnboardingStep
  onComplete: (data: any) => void
  onSkip?: () => void
  previousData: Record<string, any>
}

export function PriorityMatrixStep({ step, onComplete, onSkip }: PriorityMatrixStepProps) {
  const config = step.config
  const [priorities, setPriorities] = useState<string[]>([])
  const [availableOptions, setAvailableOptions] = useState(config.options)
  const [loading, setLoading] = useState(false)

  function handleDragEnd(newOrder: PriorityOption[]) {
    setAvailableOptions(newOrder)
  }

  function togglePriority(optionId: string) {
    if (priorities.includes(optionId)) {
      setPriorities(priorities.filter(id => id !== optionId))
    } else if (priorities.length < config.maxPriorities) {
      setPriorities([...priorities, optionId])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (priorities.length === 0) return

    setLoading(true)
    try {
      await onComplete({ 
        priorities,
        priorityDetails: priorities.map(id => 
          config.options.find((opt: PriorityOption) => opt.id === id)
        )
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
          {config.question}
        </h2>
        <p className="text-gray-600 mb-6">
          {config.instruction}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selected priorities */}
          {priorities.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Your top priorities ({priorities.length}/{config.maxPriorities})
              </h3>
              <div className="space-y-2">
                {priorities.map((priorityId, index) => {
                  const option = config.options.find((opt: PriorityOption) => opt.id === priorityId)
                  if (!option) return null
                  
                  return (
                    <motion.div
                      key={priorityId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center p-4 bg-blue-50 border-2 border-blue-200 rounded-lg"
                    >
                      <span className="text-2xl font-bold text-blue-600 mr-4">
                        {index + 1}
                      </span>
                      <span className="text-2xl mr-3">{option.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{option.label}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePriority(priorityId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Available options */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {priorities.length === 0 ? 'Select your priorities' : 'Other options'}
            </h3>
            <Reorder.Group
              axis="y"
              values={availableOptions}
              onReorder={handleDragEnd}
              className="space-y-2"
            >
              {availableOptions.map((option: PriorityOption) => {
                const isSelected = priorities.includes(option.id)
                const isDisabled = !isSelected && priorities.length >= config.maxPriorities
                
                return (
                  <Reorder.Item
                    key={option.id}
                    value={option}
                    className={`
                      relative flex items-center p-4 rounded-lg border-2 transition-all cursor-pointer
                      ${isSelected 
                        ? 'border-blue-200 bg-blue-50 opacity-50' 
                        : isDisabled
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                    onClick={() => !isDisabled && togglePriority(option.id)}
                  >
                    <GripVertical className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-2xl mr-3">{option.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{option.label}</p>
                    </div>
                    {!isSelected && priorities.length < config.maxPriorities && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePriority(option.id)
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Select
                      </button>
                    )}
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>
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
              disabled={loading || priorities.length === 0}
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