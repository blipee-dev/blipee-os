import { aiContextEngine } from './context-engine'

interface ProactiveInsight {
  type: 'welcome' | 'alert' | 'opportunity' | 'achievement' | 'prediction'
  priority: 'low' | 'medium' | 'high' | 'critical'
  message: string
  data?: any
  actionable: boolean
  suggestedActions?: string[]
}

export class ProactiveInsightEngine {
  
  /**
   * Generate intelligent welcome message with real-time building insights
   */
  async generateWelcomeInsights(): Promise<{
    message: string
    components: any[]
    suggestions: string[]
  }> {
    // Get real-time building context
    const context = await aiContextEngine.buildEnrichedContext('building status', 'demo-user')
    
    // Analyze current building state
    const insights = await this.analyzeBuildingState(context)
    
    // Generate intelligent welcome message
    const welcomeMessage = await this.craftIntelligentWelcome(insights, context)
    
    // Create relevant components
    const components = await this.generateWelcomeComponents(insights, context)
    
    // Generate intelligent suggestions
    const suggestions = await this.generateWelcomeSuggestions(insights)
    
    return {
      message: welcomeMessage,
      components,
      suggestions
    }
  }

  /**
   * Analyze current building state for proactive insights
   */
  private async analyzeBuildingState(context: any): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = []
    const metrics = context.realTimeMetrics
    
    // Energy Analysis
    const energyEfficiency = metrics.energy.efficiency
    if (energyEfficiency < 80) {
      insights.push({
        type: 'alert',
        priority: 'high',
        message: `Energy efficiency is at ${energyEfficiency}% - below optimal range`,
        actionable: true,
        suggestedActions: ['Run energy optimization', 'Check HVAC settings']
      })
    } else if (energyEfficiency > 90) {
      insights.push({
        type: 'achievement',
        priority: 'medium',
        message: `Excellent energy efficiency at ${energyEfficiency}%!`,
        actionable: false
      })
    }
    
    // Trend Analysis
    if (metrics.energy.trend === 'increasing') {
      const currentUsage = metrics.energy.currentUsage
      const baseline = metrics.energy.baseline
      const increase = Math.round(((currentUsage - baseline) / baseline) * 100)
      
      insights.push({
        type: 'alert',
        priority: increase > 20 ? 'high' : 'medium',
        message: `Energy usage is ${increase}% above baseline - investigating cause`,
        actionable: true,
        suggestedActions: ['Show detailed breakdown', 'Check equipment status']
      })
    }
    
    // Predictive Insights
    const predictions = context.predictiveInsights
    const criticalPredictions = predictions.filter((p: any) => p.urgency === 'high' || p.urgency === 'critical')
    
    if (criticalPredictions.length > 0) {
      insights.push({
        type: 'prediction',
        priority: 'critical',
        message: `${criticalPredictions.length} critical issue(s) predicted in the next 7 days`,
        data: criticalPredictions,
        actionable: true,
        suggestedActions: ['View predictions', 'Schedule preventive maintenance']
      })
    }
    
    // Occupancy Insights
    const occupancy = metrics.occupancy
    const occupancyRate = (occupancy.current / occupancy.capacity) * 100
    
    if (occupancyRate < 30) {
      insights.push({
        type: 'opportunity',
        priority: 'medium',
        message: `Building is only ${Math.round(occupancyRate)}% occupied - opportunity to reduce energy usage`,
        actionable: true,
        suggestedActions: ['Optimize unoccupied zones', 'Implement smart scheduling']
      })
    }
    
    // Environmental Factors
    const weather = context.environmentalFactors.weather
    if (weather.current.temp > 85) {
      insights.push({
        type: 'prediction',
        priority: 'medium',
        message: `High outdoor temperature (${Math.round(weather.current.temp)}°F) - increased cooling demand expected`,
        actionable: true,
        suggestedActions: ['Pre-cool building', 'Check HVAC capacity']
      })
    }
    
    // Equipment Status
    const equipment = metrics.equipment
    const totalDevices = Object.values(equipment).flat().length
    const onlineDevices = Object.values(equipment).flat().filter((device: any) => device.status === 'online').length
    const deviceHealth = (onlineDevices / totalDevices) * 100
    
    if (deviceHealth < 95) {
      insights.push({
        type: 'alert',
        priority: 'medium',
        message: `${totalDevices - onlineDevices} device(s) need attention`,
        actionable: true,
        suggestedActions: ['View device status', 'Schedule maintenance']
      })
    }
    
    // Cost Optimization Opportunities
    const energyPrices = context.environmentalFactors.economicFactors.energyPrices
    const timeContext = context.environmentalFactors.timeContext
    
    if (energyPrices.current > energyPrices.offPeak && timeContext.timeOfDay === 'morning') {
      insights.push({
        type: 'opportunity',
        priority: 'medium',
        message: `Currently in peak pricing (${energyPrices.current}/kWh) - shifting loads could save money`,
        actionable: true,
        suggestedActions: ['Show load shifting opportunities', 'Implement demand response']
      })
    }
    
    return insights.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Craft intelligent welcome message based on insights
   */
  private async craftIntelligentWelcome(insights: ProactiveInsight[], context: any): Promise<string> {
    const metrics = context.realTimeMetrics
    const buildingName = context.building.name
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
    
    // Priority-based message crafting
    const criticalInsights = insights.filter(i => i.priority === 'critical')
    const highInsights = insights.filter(i => i.priority === 'high')
    const opportunityInsights = insights.filter(i => i.type === 'opportunity')
    const achievementInsights = insights.filter(i => i.type === 'achievement')
    
    let welcomeMessage = `Good ${this.getTimeOfDayGreeting()}! I've just analyzed ${buildingName} and here's what I found:\n\n`
    
    // Always include current status
    welcomeMessage += `📊 **Current Status (${currentTime})**\n`
    welcomeMessage += `• Energy: ${metrics.energy.currentUsage.toLocaleString()}W (${metrics.energy.trend})\n`
    welcomeMessage += `• Efficiency: ${metrics.energy.efficiency}%\n`
    welcomeMessage += `• Occupancy: ${metrics.occupancy.current}/${metrics.occupancy.capacity} people\n\n`
    
    // Critical alerts first
    if (criticalInsights.length > 0) {
      welcomeMessage += `🚨 **Critical Attention Needed:**\n`
      criticalInsights.forEach(insight => {
        welcomeMessage += `• ${insight.message}\n`
      })
      welcomeMessage += `\n`
    }
    
    // High priority items
    if (highInsights.length > 0) {
      welcomeMessage += `⚠️ **Important Findings:**\n`
      highInsights.forEach(insight => {
        welcomeMessage += `• ${insight.message}\n`
      })
      welcomeMessage += `\n`
    }
    
    // Opportunities
    if (opportunityInsights.length > 0) {
      welcomeMessage += `💡 **Optimization Opportunities:**\n`
      opportunityInsights.slice(0, 2).forEach(insight => {
        welcomeMessage += `• ${insight.message}\n`
      })
      welcomeMessage += `\n`
    }
    
    // Achievements
    if (achievementInsights.length > 0) {
      welcomeMessage += `🎉 **Great News:**\n`
      achievementInsights.forEach(insight => {
        welcomeMessage += `• ${insight.message}\n`
      })
      welcomeMessage += `\n`
    }
    
    // Closing with proactive offer
    if (insights.filter(i => i.actionable).length > 0) {
      welcomeMessage += `I'm ready to help optimize your building's performance. What would you like to focus on first?`
    } else {
      welcomeMessage += `Your building is performing well! I'm here to help with any questions or optimizations.`
    }
    
    return welcomeMessage
  }

  /**
   * Generate relevant components for welcome screen
   */
  private async generateWelcomeComponents(insights: ProactiveInsight[], context: any): Promise<any[]> {
    const components = []
    
    // Always show energy dashboard
    components.push({
      type: 'energy-dashboard',
      props: {
        title: 'Live Building Performance',
        currentUsage: context.realTimeMetrics.energy.currentUsage,
        trend: context.realTimeMetrics.energy.trend,
        efficiency: context.realTimeMetrics.energy.efficiency,
        breakdown: [
          { 
            name: 'HVAC', 
            value: Math.round(context.realTimeMetrics.energy.currentUsage * 0.47), 
            color: '#0EA5E9' 
          },
          { 
            name: 'Lighting', 
            value: Math.round(context.realTimeMetrics.energy.currentUsage * 0.28), 
            color: '#8B5CF6' 
          },
          { 
            name: 'Equipment', 
            value: Math.round(context.realTimeMetrics.energy.currentUsage * 0.25), 
            color: '#10B981' 
          }
        ],
        predictions: {
          nextHour: Math.round(context.realTimeMetrics.energy.currentUsage * 1.05),
          peakToday: Math.round(context.realTimeMetrics.energy.currentUsage * 1.15),
          endOfMonth: Math.round(context.realTimeMetrics.energy.currentUsage * 720 * 0.95)
        }
      }
    })
    
    // Add insights panel if there are actionable insights
    const actionableInsights = insights.filter(i => i.actionable)
    if (actionableInsights.length > 0) {
      components.push({
        type: 'insights-panel',
        props: {
          title: 'AI Insights & Recommendations',
          insights: actionableInsights.map(insight => ({
            type: insight.type,
            text: insight.message,
            confidence: 0.85 + Math.random() * 0.1, // Simulated confidence
            actionable: insight.actionable
          }))
        }
      })
    }
    
    // Add optimization dashboard if there are opportunities
    const opportunities = insights.filter(i => i.type === 'opportunity')
    if (opportunities.length > 0) {
      components.push({
        type: 'optimization-dashboard',
        props: {
          title: 'Smart Optimization Opportunities',
          opportunities: [
            {
              name: 'HVAC Optimization',
              savings: '$1,200/month',
              effort: 'Low',
              impact: 'High',
              timeframe: 'Immediate',
              confidence: 0.89
            },
            {
              name: 'Smart Scheduling',
              savings: '$840/month',
              effort: 'Medium',
              impact: 'Medium',
              timeframe: '1 week',
              confidence: 0.76
            }
          ],
          totalSavings: '$2,040/month',
          roiTimeline: '2.1 months',
          automationLevel: 85
        }
      })
    }
    
    return components
  }

  /**
   * Generate intelligent welcome suggestions
   */
  private async generateWelcomeSuggestions(insights: ProactiveInsight[]): Promise<string[]> {
    const suggestions: string[] = []
    
    // Add suggestions based on insights
    insights.forEach(insight => {
      if (insight.suggestedActions) {
        suggestions.push(...insight.suggestedActions.slice(0, 1)) // Take first action
      }
    })
    
    // Add general intelligent suggestions
    suggestions.push(
      'What predictions do you have for today?',
      'How can I reduce energy costs this week?',
      'Show me any equipment that needs attention',
      'What optimization opportunities are available?'
    )
    
    // Return unique suggestions, limited to 4
    return [...new Set(suggestions)].slice(0, 4)
  }

  /**
   * Get appropriate greeting based on time of day
   */
  private getTimeOfDayGreeting(): string {
    const hour = new Date().getHours()
    
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
  }
}

// Export singleton
export const proactiveInsightEngine = new ProactiveInsightEngine()