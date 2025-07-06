'use client'

import { useState, useEffect } from 'react'
import { GradientButton } from '@/components/premium/GradientButton'
import { GlassCard } from '@/components/premium/GlassCard'
import { premiumTheme } from '@/lib/design/theme'
import { Building2, Zap, Brain, Sparkles, ArrowRight, CheckCircle } from 'lucide-react'

interface OnboardingExperienceProps {
  onComplete: () => void
}

export function OnboardingExperience({ onComplete }: OnboardingExperienceProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const steps = [
    {
      icon: <Building2 className="w-12 h-12" />,
      title: "Welcome to Blipee OS",
      subtitle: "The ChatGPT for Buildings",
      description: "Experience the future of building management through natural conversation",
      features: [
        "Talk to your building like a colleague",
        "Real-time insights and control",
        "AI-powered optimization"
      ]
    },
    {
      icon: <Brain className="w-12 h-12" />,
      title: "Conversational AI First",
      subtitle: "No dashboards. Just conversation.",
      description: "Ask anything about your building and get instant, actionable responses",
      features: [
        "Natural language understanding",
        "Context-aware responses",
        "Proactive suggestions"
      ]
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: "Dynamic UI Generation",
      subtitle: "See what you need, when you need it",
      description: "Blipee generates charts, controls, and reports on-demand based on your conversations",
      features: [
        "Real-time data visualization",
        "Interactive controls",
        "Custom reports"
      ]
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const currentStepData = steps[currentStep]

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl transition-opacity duration-1000 ${
      isVisible ? 'opacity-100' : 'opacity-0'
    }`}>
      <div className="max-w-4xl w-full px-6">
        {/* Progress indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-1 w-20 rounded-full transition-all duration-500 ${
                index <= currentStep
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Main content */}
        <GlassCard variant="elevated" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-green-500/20 blur-3xl" />
          
          <div className="relative z-10 text-center py-12 px-8">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-6">
              <div className="text-white">
                {currentStepData.icon}
              </div>
            </div>

            {/* Title and subtitle */}
            <h1 className="text-4xl font-bold text-white mb-2 animate-fadeInUp">
              {currentStepData.title}
            </h1>
            <p className="text-xl gradient-text font-semibold mb-4 animate-fadeInUp animation-delay-100">
              {currentStepData.subtitle}
            </p>
            <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto animate-fadeInUp animation-delay-200">
              {currentStepData.description}
            </p>

            {/* Features */}
            <div className="flex flex-col gap-3 max-w-md mx-auto mb-10">
              {currentStepData.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-left animate-fadeInUp"
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            {/* Action button */}
            <div className="animate-fadeInUp" style={{ animationDelay: '600ms' }}>
              <GradientButton
                size="large"
                variant="primary"
                onClick={handleNext}
                endIcon={<ArrowRight className="w-5 h-5" />}
              >
                {currentStep < steps.length - 1 ? 'Next' : "Let's Start"}
              </GradientButton>
            </div>

            {/* Skip button */}
            {currentStep < steps.length - 1 && (
              <button
                onClick={onComplete}
                className="mt-4 text-gray-500 hover:text-gray-400 transition-colors text-sm"
              >
                Skip introduction
              </button>
            )}
          </div>

          {/* Animated sparkles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <Sparkles
                key={i}
                className={`absolute w-6 h-6 text-purple-400/30 animate-pulse`}
                style={{
                  top: `${20 + i * 30}%`,
                  left: `${10 + i * 40}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        </GlassCard>

        {/* Blipee branding */}
        <div className="text-center mt-6 text-gray-600 text-sm">
          Powered by Blipee AI
        </div>
      </div>
    </div>
  )
}