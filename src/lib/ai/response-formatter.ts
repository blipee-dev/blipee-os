import { UIComponent } from '@/types/conversation'

export interface FormattedAIResponse {
  message: string
  components?: UIComponent[]
  suggestions?: string[]
  actions?: any[]
}

/**
 * Formats AI responses to be more natural and conversational
 */
export class AIResponseFormatter {
  /**
   * Format a response about energy usage
   */
  static formatEnergyResponse(data: any): FormattedAIResponse {
    const totalUsage = data.totalUsage || 4520
    const comparison = data.comparison || 'slightly above average'
    const peakSystem = data.peakSystem || 'HVAC'
    
    return {
      message: `I'm seeing ${totalUsage}W of power consumption right now. That's ${comparison} for this time of day. ${peakSystem} is your biggest energy user at the moment.`,
      components: [
        {
          type: 'chart',
          props: {
            title: 'Live Energy Distribution',
            chartType: 'pie',
            data: data.distribution || [
              { name: 'HVAC', value: 1850, color: '#0EA5E9' },
              { name: 'Lighting', value: 1200, color: '#8B5CF6' },
              { name: 'Elevators', value: 450, color: '#10B981' },
              { name: 'Equipment', value: 820, color: '#F59E0B' },
              { name: 'Other', value: 200, color: '#EC4899' }
            ]
          }
        },
        {
          type: 'chart',
          props: {
            title: 'Today\'s Trend',
            chartType: 'area',
            data: data.trend || [
              { name: '6AM', value: 2100 },
              { name: '8AM', value: 3800 },
              { name: '10AM', value: 4520 },
              { name: '12PM', value: 4800 },
              { name: '2PM', value: 4200 }
            ]
          }
        }
      ],
      suggestions: [
        "Want me to break this down by floor?",
        "Should I optimize any systems?",
        "How about comparing with yesterday?"
      ]
    }
  }

  /**
   * Format a response about temperature
   */
  static formatTemperatureResponse(data: any): FormattedAIResponse {
    const mainTemp = data.mainTemp || 22.5
    const avgTemp = data.avgTemp || 22.1
    
    return {
      message: `The temperature in your main office is ${mainTemp}°C - nice and comfortable! Building average is ${avgTemp}°C. All zones are maintaining their setpoints well.`,
      components: [
        {
          type: 'control',
          props: {
            title: 'Zone Temperature Control',
            type: 'slider',
            value: mainTemp,
            options: {
              min: 18,
              max: 26,
              step: 0.5,
              unit: '°C',
              icon: 'temperature'
            }
          }
        },
        {
          type: 'table',
          props: {
            title: 'Current Zone Temperatures',
            data: data.zones || [
              { zone: 'Main Office', temperature: '22.5°C', status: 'Optimal', occupancy: '85%' },
              { zone: 'Meeting Room A', temperature: '21.8°C', status: 'Optimal', occupancy: '60%' },
              { zone: 'Lobby', temperature: '23.1°C', status: 'Warm', occupancy: '30%' },
              { zone: 'Server Room', temperature: '18.5°C', status: 'Optimal', occupancy: 'N/A' }
            ]
          }
        }
      ],
      suggestions: [
        "Want to adjust any zone temperatures?",
        "Should I show the weekly temperature trends?",
        "How about checking HVAC efficiency?"
      ]
    }
  }

  /**
   * Format a response about reports
   */
  static formatReportResponse(data: any): FormattedAIResponse {
    const period = data.period || 'last month'
    const savings = data.savings || '12%'
    const emissions = data.emissions || '45.2 tonnes'
    
    return {
      message: `I've generated your sustainability report for ${period}. Great news - you've reduced energy consumption by ${savings}! Total emissions were ${emissions} CO₂. You're definitely on track to hit your targets.`,
      components: [
        {
          type: 'report',
          props: {
            title: 'Monthly Sustainability Report',
            period: 'November 2024',
            metrics: {
              'Energy Saved': { value: savings, trend: 'improving', change: '+2% vs last month' },
              'Total Emissions': { value: emissions, trend: 'improving', change: '-15% YoY' },
              'Cost Savings': { value: '$12,450', trend: 'improving', change: '+18% vs target' },
              'Efficiency Score': { value: '94/100', trend: 'stable', change: 'Top 5% in region' }
            },
            sections: [
              {
                title: 'Key Achievements',
                type: 'list',
                content: [
                  'Reduced HVAC runtime by 18% through AI optimization',
                  'Achieved 95% LED adoption across all floors',
                  'Solar panels generated 25% of total consumption',
                  'Zero critical equipment failures this month'
                ]
              },
              {
                title: 'Recommendations',
                type: 'list',
                content: [
                  'Schedule HVAC maintenance for Units 3 & 4',
                  'Consider battery storage for excess solar',
                  'Implement occupancy sensors in Zone C',
                  'Review weekend scheduling for further savings'
                ]
              }
            ]
          }
        }
      ],
      suggestions: [
        "Want to see department-specific breakdowns?",
        "Should I email this report to stakeholders?",
        "How about scheduling next month's targets?"
      ]
    }
  }

  /**
   * Format a response about optimization opportunities
   */
  static formatOptimizationResponse(data: any): FormattedAIResponse {
    return {
      message: `I've identified several energy-saving opportunities. The biggest win would be optimizing your HVAC scheduling - you could save around $1,200/month. I can implement these changes right now if you'd like.`,
      components: [
        {
          type: 'table',
          props: {
            title: 'Optimization Opportunities',
            data: [
              { 
                opportunity: 'HVAC Scheduling', 
                savings: '$1,200/mo', 
                effort: 'Low',
                impact: 'High',
                status: 'Ready'
              },
              { 
                opportunity: 'LED Upgrades (Parking)', 
                savings: '$400/mo', 
                effort: 'Medium',
                impact: 'Medium',
                status: 'Quoted'
              },
              { 
                opportunity: 'Occupancy Sensors', 
                savings: '$600/mo', 
                effort: 'Low',
                impact: 'Medium',
                status: 'Planning'
              },
              { 
                opportunity: 'Solar Expansion', 
                savings: '$2,500/mo', 
                effort: 'High',
                impact: 'High',
                status: 'Feasibility'
              }
            ]
          }
        },
        {
          type: 'chart',
          props: {
            title: 'Projected Monthly Savings',
            chartType: 'bar',
            data: [
              { name: 'Current', value: 0 },
              { name: 'Month 1', value: 1200 },
              { name: 'Month 3', value: 2200 },
              { name: 'Month 6', value: 4700 }
            ]
          }
        }
      ],
      suggestions: [
        "Should I start with the HVAC optimization?",
        "Want to see the full ROI analysis?",
        "How about reviewing implementation timelines?"
      ]
    }
  }

  /**
   * Format a control response
   */
  static formatControlResponse(action: string, target: string): FormattedAIResponse {
    return {
      message: `I'll ${action} the ${target} for you right away. You should see the changes take effect within the next few seconds.`,
      components: [
        {
          type: 'control',
          props: {
            title: `${target} Control`,
            type: 'switch',
            value: action === 'turn on',
            options: {
              status: 'online',
              icon: 'power'
            }
          }
        }
      ],
      suggestions: [
        "Want to set a schedule for this?",
        "Should I adjust other zones too?",
        "How about checking energy impact?"
      ]
    }
  }

  /**
   * Format a general conversational response
   */
  static formatGeneralResponse(topic: string): FormattedAIResponse {
    const responses: Record<string, FormattedAIResponse> = {
      greeting: {
        message: "Hey there! I'm Blipee, your building's AI assistant. I'm here to help you manage energy, comfort, and sustainability. What would you like to know about your building today?",
        suggestions: [
          "Show me current energy usage",
          "What's the temperature in my office?",
          "Generate this month's sustainability report",
          "Find ways to save energy"
        ]
      },
      help: {
        message: "I can help you with all aspects of building management! I monitor energy usage, control HVAC and lighting, generate reports, and find optimization opportunities. Just ask me anything - I'll understand natural language and provide visual insights when helpful.",
        suggestions: [
          "What can you monitor?",
          "Show me some examples",
          "How do I control devices?",
          "What reports can you generate?"
        ]
      },
      capabilities: {
        message: "I'm constantly monitoring your building systems and can help with:\n\n• Real-time energy monitoring and analytics\n• Temperature and comfort control\n• Sustainability reporting and compliance\n• Predictive maintenance alerts\n• Cost optimization recommendations\n• Emergency response coordination\n\nI learn from your patterns and preferences to provide proactive suggestions!",
        suggestions: [
          "Show me energy monitoring",
          "How does predictive maintenance work?",
          "What compliance standards do you track?",
          "Can you integrate with my calendar?"
        ]
      }
    }

    return responses[topic] || responses.greeting
  }

  /**
   * Parse natural language and format appropriate response
   */
  static formatNaturalResponse(message: string): FormattedAIResponse {
    const lowerMessage = message.toLowerCase()

    // Energy related
    if (lowerMessage.includes('energy') || lowerMessage.includes('power') || lowerMessage.includes('usage')) {
      return this.formatEnergyResponse({})
    }

    // Temperature related
    if (lowerMessage.includes('temperature') || lowerMessage.includes('temp') || lowerMessage.includes('hot') || lowerMessage.includes('cold')) {
      return this.formatTemperatureResponse({})
    }

    // Reports
    if (lowerMessage.includes('report') || lowerMessage.includes('summary') || lowerMessage.includes('sustainability')) {
      return this.formatReportResponse({})
    }

    // Optimization
    if (lowerMessage.includes('save') || lowerMessage.includes('optimize') || lowerMessage.includes('reduce') || lowerMessage.includes('efficiency')) {
      return this.formatOptimizationResponse({})
    }

    // Control actions
    if (lowerMessage.includes('turn on') || lowerMessage.includes('turn off') || lowerMessage.includes('adjust') || lowerMessage.includes('set')) {
      const action = lowerMessage.includes('turn on') ? 'turn on' : lowerMessage.includes('turn off') ? 'turn off' : 'adjust'
      const target = lowerMessage.includes('light') ? 'lights' : lowerMessage.includes('hvac') ? 'HVAC' : 'system'
      return this.formatControlResponse(action, target)
    }

    // Help
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you')) {
      return this.formatGeneralResponse('help')
    }

    // Capabilities
    if (lowerMessage.includes('capabilities') || lowerMessage.includes('features')) {
      return this.formatGeneralResponse('capabilities')
    }

    // Default
    return this.formatGeneralResponse('greeting')
  }
}