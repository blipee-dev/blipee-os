'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './CustomSelect.module.css'

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  className?: string
}

export default function CustomSelect({ value, onChange, options, className = '' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function updatePosition() {
      if (buttonRef.current && isOpen) {
        const rect = buttonRef.current.getBoundingClientRect()
        const dropdownHeight = 400 // max-height from CSS
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top

        // Open upwards if not enough space below but enough space above
        const openUpwards = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight

        setDropdownPosition({
          top: openUpwards
            ? rect.top + window.scrollY - dropdownHeight - 8
            : rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width,
        })
      }
    }

    if (isOpen) {
      updatePosition()
      window.addEventListener('scroll', updatePosition, { capture: true, passive: true })
      window.addEventListener('resize', updatePosition, { passive: true })
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node

      // Check if click is outside both the select button and the dropdown
      if (
        selectRef.current &&
        !selectRef.current.contains(target) &&
        // Also check if the click is not on the dropdown itself
        !(target as Element).closest('[class*="dropdown"]')
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, { passive: true })
      document.addEventListener('touchstart', handleClickOutside, { passive: true })
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  const dropdownContent = isOpen && mounted ? (
    <div
      className={styles.dropdown}
      style={{
        position: 'absolute',
        top: `${dropdownPosition.top}px`,
        left: `${dropdownPosition.left}px`,
        width: `${dropdownPosition.width}px`,
        zIndex: 999999,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onChange(option.value)
            setIsOpen(false)
          }}
        >
          {option.label}
          {option.value === value && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      ))}
    </div>
  ) : null

  return (
    <div className={`${styles.customSelect} ${className}`} ref={selectRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.selectButton} ${isOpen ? styles.open : ''}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
      >
        <span>{selectedOption?.label || 'Select...'}</span>
        <svg
          className={styles.arrow}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {mounted && typeof document !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  )
}
