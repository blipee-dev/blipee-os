'use client'

import { useState, FormEvent, ReactNode } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'

interface FormWithConfirmProps {
  children: ReactNode
  onSubmit: (e: FormEvent) => void | Promise<void>
  confirmMessage?: string
  confirmTitle?: string
  className?: string
  id?: string
}

export default function FormWithConfirm({
  children,
  onSubmit,
  confirmMessage = 'Are you sure you want to save these changes?',
  confirmTitle = 'Save Changes',
  className,
  id,
}: FormWithConfirmProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [pendingEvent, setPendingEvent] = useState<FormEvent | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setPendingEvent(e)
    setShowDialog(true)
  }

  function handleConfirm() {
    setShowDialog(false)
    if (pendingEvent) {
      onSubmit(pendingEvent)
      setPendingEvent(null)
    }
  }

  function handleCancel() {
    setShowDialog(false)
    setPendingEvent(null)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={className} id={id}>
        {children}
      </form>

      <ConfirmDialog
        isOpen={showDialog}
        title={confirmTitle}
        message={confirmMessage}
        confirmText="Yes, Save"
        cancelText="No, Go Back"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  )
}
