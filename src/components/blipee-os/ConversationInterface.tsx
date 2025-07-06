'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageBubble } from './MessageBubble'
import { InputArea } from './InputArea'
import { SuggestedQueries } from './SuggestedQueries'
import { MessageSuggestions } from './MessageSuggestions'
import { DynamicUIRenderer } from './DynamicUIRenderer'
import { OnboardingExperience } from '@/components/onboarding/OnboardingExperience'
import { AmbientBackground } from '@/components/effects/AmbientBackground'
import { NavRail } from '@/components/navigation/NavRail'
import { Message, UIComponent } from '@/types/conversation'

export function ConversationInterface() {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm Blipee, your building's AI assistant. I can help you monitor energy usage, control devices, generate reports, and optimize your building's performance. What would you like to know?`,
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
        suggestions: data.suggestions,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'm currently in demo mode. In the full version, I'll be able to connect to your building systems and provide real-time insights!`,
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
      <AmbientBackground />
      <NavRail />
      {showOnboarding && (
        <OnboardingExperience onComplete={() => setShowOnboarding(false)} />
      )}
      
      <div className="flex flex-col h-screen relative ml-20 overflow-hidden">
        {/* Premium Header with Glass Effect */}
        <div className="relative border-b border-white/[0.05] backdrop-blur-xl bg-white/[0.02]">
          {/* Gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Blipee OS
                </h1>
                <p className="text-sm text-white/50 font-light">
                  Your building&apos;s conversational AI
                </p>
              </div>
              
              {/* Status indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-white/60">Connected</span>
              </div>
            </div>
          </div>
        </div>

      {/* Messages Container with subtle glass effect */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.1) 0%, transparent 50%)`,
          }}
        />
        {messages.map((message) => (
          <div key={message.id}>
            <MessageBubble message={message} />
            {message.components && (
              <div className="mt-4">
                <DynamicUIRenderer components={message.components} />
              </div>
            )}
            {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
              <div className="mt-2 ml-14">
                <MessageSuggestions 
                  suggestions={message.suggestions} 
                  onSelect={handleSend}
                />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-3 px-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-purple-400 opacity-75 animate-[pulse_1.4s_ease-in-out_infinite]" />
              <div className="w-2 h-2 rounded-full bg-purple-400 opacity-75 animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
              <div className="w-2 h-2 rounded-full bg-purple-400 opacity-75 animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
            </div>
            <span className="text-xs text-white/40 font-light">Blipee is thinking...</span>
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