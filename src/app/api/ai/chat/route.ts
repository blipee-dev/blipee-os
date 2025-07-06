import { NextRequest, NextResponse } from 'next/server'
import { ChatRequest, ChatResponse } from '@/types/conversation'
import { aiService } from '@/lib/ai/service'
import { BLIPEE_SYSTEM_PROMPT, buildPrompt, buildDemoContext } from '@/lib/ai/prompt-builder'
import { parseAIResponse } from '@/lib/ai/response-parser'

// Demo responses for fallback when AI is not available
const demoResponses: Record<string, Partial<ChatResponse>> = {
  'energy': {
    message: "Your building is currently using 4,520 kW of energy. This is 15% below your average for this time of day. HVAC systems are consuming 47% of total energy, lighting 28%, and equipment 25%.",
    components: [{
      type: 'chart',
      props: {
        title: 'Current Energy Usage by System',
        chartType: 'pie',
        data: [
          { name: 'HVAC', value: 47, color: '#0EA5E9' },
          { name: 'Lighting', value: 28, color: '#8B5CF6' },
          { name: 'Equipment', value: 25, color: '#10B981' }
        ]
      }
    }],
    suggestions: [
      "Show me energy trends for the past week",
      "What's causing the HVAC usage?",
      "How can I reduce energy consumption?"
    ]
  },
  'temperature': {
    message: "The main office temperature is currently 22.5°C (72.5°F), which is within the comfort zone. The building average is 22.1°C. All zones are maintaining their setpoints effectively.",
    components: [{
      type: 'table',
      props: {
        title: 'Zone Temperatures',
        data: [
          { zone: 'Main Office', temp: '22.5°C', status: 'Normal' },
          { zone: 'Conference Room A', temp: '21.8°C', status: 'Normal' },
          { zone: 'Lobby', temp: '23.1°C', status: 'Slightly Warm' },
          { zone: 'Server Room', temp: '18.5°C', status: 'Normal' }
        ]
      }
    }]
  },
  'report': {
    message: `I'll generate your sustainability report for last month. The report shows a 12% reduction in energy consumption compared to the previous month, with total emissions of 45.2 tonnes CO₂. You're on track to meet your quarterly sustainability targets.`,
    components: [{
      type: 'report',
      props: {
        title: 'Monthly Sustainability Report',
        period: 'November 2024',
        metrics: {
          energySaved: '12%',
          emissions: '45.2 tonnes CO₂',
          cost: '$24,500',
          trend: 'improving'
        }
      }
    }]
  },
  'savings': {
    message: `I've identified several energy saving opportunities. The biggest impact would come from optimizing your HVAC scheduling - you could save approximately $1,200/month by implementing occupancy-based controls. Additionally, upgrading to LED lighting in the parking garage could save another $400/month.`,
    suggestions: [
      "Show me the HVAC optimization plan",
      "Calculate ROI for LED upgrade",
      "What other savings are possible?"
    ]
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message } = body
    
    const startTime = Date.now()
    
    // Try to use real AI first
    try {
      const context = buildDemoContext()
      const prompt = buildPrompt(message, context)
      
      const aiResponse = await aiService.complete(prompt, {
        systemPrompt: BLIPEE_SYSTEM_PROMPT,
        temperature: 0.7,
        maxTokens: 1000,
        jsonMode: false  // We want natural language, not JSON
      })
      
      // The AI should return natural language text
      const responseText = aiResponse.content || "I understand your request."
      
      // Use the response formatter to create appropriate components
      const { AIResponseFormatter } = await import('@/lib/ai/response-formatter')
      const formatted = AIResponseFormatter.formatNaturalResponse(message)
      
      const response: ChatResponse = {
        message: responseText,  // Use the natural language response from AI
        components: formatted.components,  // Add relevant components based on the query
        actions: formatted.actions,
        suggestions: formatted.suggestions,
        metadata: {
          tokensUsed: aiResponse.usage?.totalTokens || 0,
          responseTime: Date.now() - startTime,
          model: aiResponse.model
        }
      }
      
      return NextResponse.json(response)
    } catch (aiError) {
      console.log('AI service failed, falling back to demo responses:', aiError)
    }
    
    // Fallback to demo responses if AI fails
    const lowerMessage = message.toLowerCase()
    let response: Partial<ChatResponse> = {
      message: `I understand you're asking about your building. Let me help you with that.`,
      metadata: {
        tokensUsed: 150,
        responseTime: Date.now() - startTime,
        model: 'demo'
      }
    }
    
    // Match keywords to provide relevant demo responses
    if (lowerMessage.includes('energy') || lowerMessage.includes('usage') || lowerMessage.includes('consumption')) {
      response = { ...response, ...demoResponses.energy }
    } else if (lowerMessage.includes('temperature') || lowerMessage.includes('temp') || lowerMessage.includes('climate')) {
      response = { ...response, ...demoResponses.temperature }
    } else if (lowerMessage.includes('report') || lowerMessage.includes('sustainability')) {
      response = { ...response, ...demoResponses.report }
    } else if (lowerMessage.includes('save') || lowerMessage.includes('saving') || lowerMessage.includes('optimize')) {
      response = { ...response, ...demoResponses.savings }
    } else {
      response.message = `I understand you're asking about "${message}". In the full version, I'll be able to help with:\n\n• Real-time energy monitoring\n• Device control\n• Predictive maintenance\n• Sustainability reporting\n• Cost optimization\n\nFor now, try asking about energy usage, temperature, reports, or savings opportunities!`
      response.suggestions = [
        "Show me current energy usage",
        "What's the temperature?",
        "Generate sustainability report",
        "Find energy savings"
      ]
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}