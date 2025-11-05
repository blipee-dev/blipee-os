'use client'

import React from 'react'

export interface Step {
  number: number
  title: string
  icon: string
}

export interface BlipeeStepIndicatorProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (stepNumber: number) => void
  clickable?: boolean
}

export function BlipeeStepIndicator({
  steps,
  currentStep,
  onStepClick,
  clickable = false,
}: BlipeeStepIndicatorProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        marginTop: '2rem',
        marginBottom: '2rem',
      }}
    >
      {steps.map((step) => (
        <div
          key={step.number}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            maxWidth: '150px',
          }}
        >
          <div
            onClick={() => clickable && onStepClick?.(step.number)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              fontWeight: 600,
              background:
                currentStep === step.number
                  ? 'var(--gradient-primary)'
                  : currentStep > step.number
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(255, 255, 255, 0.05)',
              color: currentStep >= step.number ? '#ffffff' : 'var(--text-tertiary)',
              border:
                currentStep === step.number
                  ? '2px solid var(--green)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.3s ease',
              cursor: clickable ? 'pointer' : 'default',
            }}
          >
            {step.icon}
          </div>
          <div
            style={{
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: currentStep === step.number ? 600 : 400,
              color: currentStep === step.number ? 'var(--green)' : 'var(--text-tertiary)',
              textAlign: 'center',
            }}
          >
            {step.title}
          </div>
        </div>
      ))}
    </div>
  )
}
