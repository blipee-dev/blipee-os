'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Loader2, Info, Plus, X } from 'lucide-react'
import { onboardingService } from '@/lib/onboarding/service'
import { validateParsedData } from '@/lib/onboarding/parsers'
import type { OnboardingStep } from '@/types/onboarding'

interface BulkTextInputStepProps {
  step: OnboardingStep
  onComplete: (data: any) => void
  onSkip?: () => void
  previousData: Record<string, any>
}

export function BulkTextInputStep({ step, onComplete, onSkip }: BulkTextInputStepProps) {
  const [input, setInput] = useState('')
  const [parsedItems, setParsedItems] = useState<any[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const config = step.config

  function handleInputChange(value: string) {
    setInput(value)
    setErrors([])

    // Try to parse in real-time for preview
    if (value.trim()) {
      try {
        const parsed = onboardingService.parseBulkInput(config.parser, value)
        setParsedItems(parsed)
        
        // Validate parsed data
        const validation = validateParsedData(
          config.parser === 'csv_building_parser' ? 'buildings' : 'invites',
          parsed
        )
        
        if (!validation.valid) {
          setErrors(validation.errors)
        }
      } catch (error: any) {
        setErrors([error.message])
        setParsedItems([])
      }
    } else {
      setParsedItems([])
    }
  }

  function handleAddManually() {
    const newLine = config.parser === 'csv_building_parser' 
      ? '\nNew Building, City' 
      : '\nemail@company.com = Building Name'
    
    setInput(input + (input ? newLine : newLine.trim()))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (errors.length > 0) return
    
    if (parsedItems.length < config.minEntries) {
      setErrors([`Please add at least ${config.minEntries} ${config.parser === 'csv_building_parser' ? 'building' : 'user'}`])
      return
    }

    setLoading(true)
    try {
      await onComplete({ 
        input,
        parsed: parsedItems 
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
          {config.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                {config.format}
              </label>
              <button
                type="button"
                onClick={handleAddManually}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add manually
              </button>
            </div>
            
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={config.placeholder}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            
            {config.example && (
              <div className="mt-2 flex items-start">
                <Info className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                <p className="text-sm text-gray-500">{config.example}</p>
              </div>
            )}
          </div>

          {/* Preview parsed items */}
          {parsedItems.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Preview ({parsedItems.length} {parsedItems.length === 1 ? 'item' : 'items'})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {parsedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white rounded-md px-3 py-2 text-sm"
                  >
                    <div>
                      {config.parser === 'csv_building_parser' ? (
                        <>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-gray-500 ml-2">{item.city}</span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">{item.email}</span>
                          {item.building && (
                            <span className="text-gray-500 ml-2">→ {item.building}</span>
                          )}
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Remove item from input
                        const lines = input.split('\n')
                        lines.splice(index, 1)
                        setInput(lines.join('\n'))
                      }}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Please fix the following issues:
              </h3>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center pt-6">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700"
              >
                {config.skipOption?.label || 'Skip for now'}
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading || errors.length > 0 || parsedItems.length === 0}
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