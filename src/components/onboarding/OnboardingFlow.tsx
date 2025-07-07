'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { onboardingService } from '@/lib/onboarding/service'
import type { OnboardingFlow, OnboardingStep } from '@/types/onboarding'
import type { UserRole } from '@/types/auth'

// Step components
import { IntroStep } from './steps/IntroStep'
import { QuickFormStep } from './steps/QuickFormStep'
import { BulkTextInputStep } from './steps/BulkTextInputStep'
import { SmartInviteStep } from './steps/SmartInviteStep'
import { PriorityMatrixStep } from './steps/PriorityMatrixStep'
import { VisualChecklistStep } from './steps/VisualChecklistStep'
import { AIInsightsStep } from './steps/AIInsightsStep'
import { SingleChoiceStep } from './steps/SingleChoiceStep'
import { VisualSelectStep } from './steps/VisualSelectStep'
import { RoleAssignmentStep } from './steps/RoleAssignmentStep'

interface OnboardingFlowProps {
  userId: string
  role: UserRole
  onComplete: () => void
}

export function OnboardingFlow({ userId, role, onComplete }: OnboardingFlowProps) {
  const [flow, setFlow] = useState<OnboardingFlow | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [stepData, setStepData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(0)

  const loadFlow = useCallback(async () => {
    try {
      const flowData = await onboardingService.startOnboarding(userId, role)
      setFlow(flowData)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load onboarding flow:', error)
      setLoading(false)
    }
  }, [userId, role])

  useEffect(() => {
    loadFlow()
  }, [loadFlow])

  useEffect(() => {
    if (flow) {
      const remaining = flow.steps
        .slice(currentStepIndex)
        .reduce((acc, step) => acc + step.timeEstimate, 0)
      setTimeRemaining(remaining)
    }
  }, [flow, currentStepIndex])

  async function handleStepComplete(data: any) {
    if (!flow) return

    const currentStep = flow.steps[currentStepIndex]
    setStepData(prev => ({ ...prev, [currentStep.id]: data }))

    try {
      const { nextStep, isComplete } = await onboardingService.completeStep(
        userId,
        currentStep.id,
        data
      )

      if (isComplete) {
        onComplete()
      } else if (nextStep) {
        setCurrentStepIndex(currentStepIndex + 1)
      }
    } catch (error) {
      console.error('Failed to complete step:', error)
    }
  }

  async function handleSkip() {
    if (!flow) return

    const currentStep = flow.steps[currentStepIndex]
    if (!currentStep.required) {
      try {
        const { nextStep, isComplete } = await onboardingService.skipStep(
          userId,
          currentStep.id
        )

        if (isComplete) {
          onComplete()
        } else if (nextStep) {
          setCurrentStepIndex(currentStepIndex + 1)
        }
      } catch (error) {
        console.error('Failed to skip step:', error)
      }
    }
  }

  function renderStep(step: OnboardingStep) {
    const commonProps = {
      step,
      onComplete: handleStepComplete,
      onSkip: step.required ? undefined : handleSkip,
      previousData: stepData
    }

    switch (step.type) {
      case 'intro':
      case 'intro_animation':
      case 'contextual_intro':
        return <IntroStep {...commonProps} />
      
      case 'quick_form':
      case 'quick_profile':
      case 'smart_building_form':
        return <QuickFormStep {...commonProps} />
      
      case 'bulk_text_input':
        return <BulkTextInputStep {...commonProps} />
      
      case 'smart_invite':
        return <SmartInviteStep {...commonProps} />
      
      case 'priority_matrix':
        return <PriorityMatrixStep {...commonProps} />
      
      case 'visual_checklist':
        return <VisualChecklistStep {...commonProps} />
      
      case 'ai_insights':
        return <AIInsightsStep {...commonProps} />
      
      case 'single_choice':
        return <SingleChoiceStep {...commonProps} />
      
      case 'visual_select':
        return <VisualSelectStep {...commonProps} />
      
      case 'role_assignment':
        return <RoleAssignmentStep {...commonProps} />
      
      default:
        return <div>Unknown step type: {step.type}</div>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your setup...</p>
        </div>
      </div>
    )
  }

  if (!flow) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Failed to load onboarding flow</p>
        </div>
      </div>
    )
  }

  const currentStep = flow.steps[currentStepIndex]
  const progress = ((currentStepIndex + 1) / flow.steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                Setting up Blipee OS
              </h1>
              <span className="text-sm text-gray-500">
                Step {currentStepIndex + 1} of {flow.steps.length}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">{Math.ceil(timeRemaining / 60)}</span> min remaining
            </div>
          </div>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep(currentStep)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}