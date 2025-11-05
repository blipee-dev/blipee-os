'use client'

import React, { ReactNode } from 'react'
import { BlipeeModal } from './BlipeeModal'
import { BlipeeStepIndicator, Step } from './BlipeeStepIndicator'
import { BlipeeModalFooter, FooterButton } from './BlipeeModalFooter'

export interface BlipeeMultiStepModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  badges?: ReactNode[]
  steps: Step[]
  currentStep: number
  onStepChange?: (step: number) => void
  children: ReactNode
  isEditing?: boolean
  canEdit?: boolean
  onEdit?: () => void
  onCancel?: () => void
  onSave?: () => void
  onDelete?: () => void
  onPrevious?: () => void
  onNext?: () => void
  isSaving?: boolean
  isDeleting?: boolean
  saveLabel?: string
  deleteLabel?: string
  maxWidth?: string
}

export function BlipeeMultiStepModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badges,
  steps,
  currentStep,
  onStepChange,
  children,
  isEditing = false,
  canEdit = true,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onPrevious,
  onNext,
  isSaving = false,
  isDeleting = false,
  saveLabel = '✓ Save Changes',
  deleteLabel = 'Delete',
  maxWidth,
}: BlipeeMultiStepModalProps) {
  const totalSteps = steps.length
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps

  const handlePrevious = () => {
    if (!isFirstStep && onPrevious) {
      onPrevious()
    } else if (!isFirstStep && onStepChange) {
      onStepChange(currentStep - 1)
    }
  }

  const handleNext = () => {
    if (!isLastStep && onNext) {
      onNext()
    } else if (!isLastStep && onStepChange) {
      onStepChange(currentStep + 1)
    }
  }

  // Build footer buttons based on mode
  const getFooterButtons = () => {
    if (isEditing) {
      // Edit mode
      const leftButtons: FooterButton[] = [
        {
          label: '← Previous',
          onClick: handlePrevious,
          variant: 'secondary',
          disabled: isFirstStep,
        },
      ]

      const rightButtons: FooterButton[] = [
        {
          label: 'Cancel',
          onClick: onCancel || (() => {}),
          variant: 'secondary',
        },
      ]

      if (isLastStep) {
        rightButtons.push({
          label: saveLabel,
          onClick: onSave || (() => {}),
          variant: 'primary',
          loading: isSaving,
          disabled: isSaving,
        })
      } else {
        rightButtons.push({
          label: 'Next →',
          onClick: handleNext,
          variant: 'primary',
        })
      }

      return { leftButtons, rightButtons }
    } else {
      // View mode
      const leftButtons: FooterButton[] = [
        {
          label: '← Previous',
          onClick: handlePrevious,
          variant: 'secondary',
          disabled: isFirstStep,
        },
        {
          label: 'Next →',
          onClick: handleNext,
          variant: 'secondary',
          disabled: isLastStep,
        },
      ]

      const rightButtons: FooterButton[] = []

      if (canEdit && onEdit && onDelete) {
        rightButtons.push({
          label: deleteLabel,
          onClick: onDelete,
          variant: 'danger',
          loading: isDeleting,
          disabled: isDeleting,
        })
        rightButtons.push({
          label: 'Edit',
          onClick: onEdit,
          variant: 'primary',
        })
      }

      return { leftButtons, rightButtons }
    }
  }

  const { leftButtons, rightButtons } = getFooterButtons()

  return (
    <BlipeeModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      badges={badges}
      maxWidth={maxWidth}
      footer={<BlipeeModalFooter leftButtons={leftButtons} rightButtons={rightButtons} />}
    >
      {/* Step Indicator */}
      <BlipeeStepIndicator
        steps={steps}
        currentStep={currentStep}
        onStepClick={isEditing ? onStepChange : undefined}
        clickable={isEditing}
      />

      {/* Content */}
      <div style={{ minHeight: '300px', padding: '1rem 0' }}>{children}</div>
    </BlipeeModal>
  )
}
