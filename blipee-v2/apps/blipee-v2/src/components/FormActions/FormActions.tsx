'use client'

import { useState } from 'react'
import styles from '@/styles/settings-layout.module.css'
import ConfirmDialog from '@/components/ConfirmDialog'

interface FormActionsProps {
  onCancel: () => void
  onSave?: () => void
  isSaving?: boolean
  confirmMessage?: string
  cancelConfirmMessage?: string
  saveButtonText?: string
  isSubmitButton?: boolean
  confirmCancel?: boolean
}

export default function FormActions({
  onCancel,
  onSave,
  isSaving = false,
  confirmMessage = 'Are you sure you want to save these changes?',
  cancelConfirmMessage = 'Are you sure you want to cancel? Any unsaved changes will be lost.',
  saveButtonText = 'Save',
  isSubmitButton = true,
  confirmCancel = true,
}: FormActionsProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  function handleCancel() {
    if (confirmCancel) {
      setShowCancelDialog(true)
    } else {
      onCancel()
    }
  }

  function confirmCancel_() {
    setShowCancelDialog(false)
    onCancel()
  }

  function handleSave(e?: React.MouseEvent<HTMLButtonElement>) {
    // If it's not a submit button and we have onClick, handle confirmation
    if (!isSubmitButton && onSave) {
      e?.preventDefault()
      setShowSaveDialog(true)
    }
    // If it's a submit button, the form's onSubmit will handle it
  }

  function confirmSave() {
    setShowSaveDialog(false)
    if (onSave) {
      onSave()
    }
  }

  return (
    <>
      <div className={styles.buttonGroup}>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonSecondary}`}
          onClick={handleCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type={isSubmitButton ? 'submit' : 'button'}
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={isSubmitButton ? undefined : handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : saveButtonText}
        </button>
      </div>

      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel Changes"
        message={cancelConfirmMessage}
        confirmText="Yes, Cancel"
        cancelText="No, Go Back"
        onConfirm={confirmCancel_}
        onCancel={() => setShowCancelDialog(false)}
        variant="danger"
      />

      <ConfirmDialog
        isOpen={showSaveDialog}
        title="Save Changes"
        message={confirmMessage}
        confirmText="Yes, Save"
        cancelText="No, Go Back"
        onConfirm={confirmSave}
        onCancel={() => setShowSaveDialog(false)}
      />
    </>
  )
}
