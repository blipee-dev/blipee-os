'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageBubble } from './MessageBubble'
import { InputArea } from './InputArea'
import { SuggestedQueries } from './SuggestedQueries'
import { DynamicUIRenderer } from './DynamicUIRenderer'
import { OnboardingExperience } from '@/components/onboarding/OnboardingExperience'
import { Message, UIComponent } from '@/types/conversation'

export function ConversationInterface() {
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I&apos;m Blipee, your building&apos;s AI assistant. I can help you monitor energy usage, control devices, generate reports, and optimize your building&apos;s performance. What would you like to know?",
      timestamp: new Date(),
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (message: string) => {
    if (!message.trim() || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // TODO: Replace with actual API call
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          conversationId: 'demo',
          buildingId: 'demo-building'
        })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      
      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || "I&apos;m processing your request...",
        components: data.components,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I&apos;m currently in demo mode. In the full version, I&apos;ll be able to connect to your building systems and provide real-time insights!",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const suggestedQueries = [
    "Show me current energy usage",
    "What's the temperature in the main office?",
    "Generate last month's sustainability report",
    "Find energy saving opportunities",
  ]

  return (
    <>
      {showOnboarding && (
        <OnboardingExperience onComplete={() => setShowOnboarding(false)} />
      )}
      
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="glass-card glass-card-default border-b border-gray-800 p-4" style={{
          borderRadius: 0,
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(20px)',
        }}>
          <h1 className="text-xl font-semibold text-white">Blipee OS</h1>
          <p className="text-sm text-gray-400">Your building&apos;s conversational AI</p>
        </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <MessageBubble message={message} />
            {message.components && (
              <div className="mt-4">
                <DynamicUIRenderer components={message.components} />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center space-x-2 text-text-secondary">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Queries */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <SuggestedQueries 
            queries={suggestedQueries}
            onSelect={handleSend}
          />
        </div>
      )}

      {/* Input Area */}
      <InputArea
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={isLoading}
        placeholder={isLoading ? "Blipee is thinking..." : "Ask me anything about your building..."}
      />
      </div>
    </>
  )
}