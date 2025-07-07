'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Loader2 } from 'lucide-react'
import type { OnboardingStep, FormField } from '@/types/onboarding'

interface QuickFormStepProps {
  step: OnboardingStep
  onComplete: (data: any) => void
  onSkip?: () => void
  previousData: Record<string, any>
}

export function QuickFormStep({ step, onComplete, onSkip }: QuickFormStepProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const fields = step.fields || []

  function handleFieldChange(fieldName: string, value: any) {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    // Clear error when field is modified
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }))
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = field.validation?.message || `${field.label || field.name} is required`
      }

      if (field.validation) {
        const value = formData[field.name]
        
        if (field.validation.minLength && value?.length < field.validation.minLength) {
          newErrors[field.name] = `Minimum ${field.validation.minLength} characters required`
        }
        
        if (field.validation.maxLength && value?.length > field.validation.maxLength) {
          newErrors[field.name] = `Maximum ${field.validation.maxLength} characters allowed`
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      await onComplete(formData)
    } finally {
      setLoading(false)
    }
  }

  function renderField(field: FormField) {
    switch (field.type) {
      case 'text':
      case 'text_input':
        return (
          <div key={field.name}>
            {field.question && (
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.question}
              </label>
            )}
            <input
              type="text"
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )

      case 'number_slider':
        const value = formData[field.name] || field.range?.min || 0
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.question}
              <span className="ml-2 text-blue-600 font-semibold">
                {value.toLocaleString()} {field.unit}
              </span>
            </label>
            {field.quickOptions && (
              <div className="flex gap-2 mb-3">
                {field.quickOptions.map((option: number) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleFieldChange(field.name, option)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      value === option
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.toLocaleString()}
                  </button>
                ))}
              </div>
            )}
            <input
              type="range"
              min={field.range?.min || 0}
              max={field.range?.max || 100}
              value={value}
              onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        )

      case 'button_group':
        return (
          <div key={field.name}>
            {field.question && (
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {field.question}
              </label>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {field.options?.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFieldChange(field.name, option.value)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData[field.name] === option.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option.icon && <div className="text-2xl mb-1">{option.icon}</div>}
                  <div className="font-medium">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        )

      case 'smart_select':
        return (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.question}
            </label>
            <select
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select {field.question?.toLowerCase()}</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )

      case 'multiple_choice':
        const selectedValues = formData[field.name] || []
        return (
          <div key={field.name}>
            {field.question && (
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {field.question}
              </label>
            )}
            <div className="space-y-2">
              {field.options?.map(option => (
                <label
                  key={option.value}
                  className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(option.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFieldChange(field.name, [...selectedValues, option.value])
                      } else {
                        handleFieldChange(field.name, selectedValues.filter((v: string) => v !== option.value))
                      }
                    }}
                    className="mr-3"
                  />
                  {option.icon && <span className="mr-2">{option.icon}</span>}
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map(field => (
          <motion.div
            key={field.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderField(field)}
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name]}</p>
            )}
          </motion.div>
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
    </div>
  )
}