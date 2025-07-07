'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Building2, Sparkles, Zap } from 'lucide-react'
import type { OnboardingStep } from '@/types/onboarding'

interface IntroStepProps {
  step: OnboardingStep
  onComplete: (data: any) => void
  previousData: Record<string, any>
}

export function IntroStep({ step, onComplete, previousData }: IntroStepProps) {
  useEffect(() => {
    // Auto-advance after animation completes
    const timer = setTimeout(() => {
      onComplete({ viewed: true })
    }, step.timeEstimate * 1000)

    return () => clearTimeout(timer)
  }, [step.timeEstimate, onComplete])

  const renderContent = () => {
    if (step.type === 'contextual_intro' && step.content) {
      // Replace template variables
      let title = step.content.template || ''
      const context = step.content.context || []
      
      context.forEach((key: string) => {
        const value = previousData[key] || key
        title = title.replace(`{{${key}}}`, value)
      })

      return (
        <>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {step.content.subtitle}
          </p>
        </>
      )
    }

    return (
      <>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {step.content?.title || 'Welcome!'}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          {step.content?.subtitle || 'Let\'s get started'}
        </p>
      </>
    )
  }

  const renderAnimation = () => {
    const animationType = step.content?.animation

    if (animationType === 'building_intelligence') {
      return (
        <motion.div
          className="relative w-48 h-48 mx-auto"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <Building2 className="w-48 h-48 text-blue-500" />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Sparkles className="w-24 h-24 text-yellow-400" />
          </motion.div>
        </motion.div>
      )
    }

    if (animationType === 'building_helper') {
      return (
        <motion.div
          className="relative w-48 h-48 mx-auto"
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        >
          <Building2 className="w-48 h-48 text-indigo-500" />
          <motion.div
            className="absolute -top-4 -right-4"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Zap className="w-12 h-12 text-yellow-400" />
          </motion.div>
        </motion.div>
      )
    }

    // Default animation
    return (
      <motion.div
        className="w-48 h-48 mx-auto bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.8, type: 'spring' }}
      >
        <Building2 className="w-24 h-24 text-white" />
      </motion.div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {renderAnimation()}
        
        <div className="mt-8">
          {renderContent()}
        </div>

        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="flex justify-center space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-600 rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}