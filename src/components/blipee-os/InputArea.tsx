'use client'

import { useState, KeyboardEvent } from 'react'
import { Send, Mic } from 'lucide-react'

interface InputAreaProps {
  value: string
  onChange: (value: string) => void
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

export function InputArea({ 
  value, 
  onChange, 
  onSend, 
  disabled,
  placeholder = "Type your message..."
}: InputAreaProps) {
  const [isListening, setIsListening] = useState(false)

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value)
    }
  }

  const handleVoiceInput = () => {
    // TODO: Implement voice input
    setIsListening(!isListening)
    console.log('Voice input not yet implemented')
  }

  return (
    <div className="border-t border-surface p-4">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <button
          onClick={handleVoiceInput}
          className={`p-2 rounded-lg transition-colors ${
            isListening 
              ? 'bg-red-500 text-white' 
              : 'bg-surface text-text-secondary hover:text-text-primary'
          }`}
          title="Voice input"
        >
          <Mic className="w-5 h-5" />
        </button>
        
        <div className="flex-1 relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className="w-full px-4 py-2 bg-surface rounded-lg text-text-primary placeholder-text-secondary 
                     resize-none focus:outline-none focus:ring-2 focus:ring-primary
                     disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}