'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, Zap, ArrowRight } from 'lucide-react'
import type { OnboardingStep, InsightTemplate } from '@/types/onboarding'

interface AIInsightsStepProps {
  step: OnboardingStep
  onComplete: (data: any) => void
  previousData: Record<string, any>
}

export function AIInsightsStep({ step, onComplete, previousData }: AIInsightsStepProps) {
  const config = step.config
  const [insights, setInsights] = useState<string[]>([])

  useEffect(() => {
    // Generate insights based on previous data
    const generatedInsights = config.insights.map((template: InsightTemplate) => {
      let insight = template.template
      
      // Replace template variables with actual data
      // This would normally call an AI service to generate personalized insights
      const replacements: Record<string, any> = {
        size: previousData.building_basics?.exact_size || '50,000',
        building_type: previousData.building_basics?.occupancy_type?.[0] || 'office',
        estimated_monthly: Math.round((previousData.building_basics?.exact_size || 50000) * 0.15),
        savings_percent: '15-25',
        top_recommendation: getTopRecommendation(previousData),
        priority_system: getPrioritySystem(previousData),
        open_work_orders: Math.floor(Math.random() * 10) + 5,
        equipment_count: Math.floor(Math.random() * 20) + 10,
        building_name: previousData.building_name || 'your building',
        top_issue: 'HVAC temperature complaints',
        unit_number: previousData.basic_info?.unit_number || 'your space',
        comfort_preference: previousData.comfort_preferences?.preference || 'moderate',
        response_time: '50',
        group_location: previousData.group_info?.group_location || 'your area',
        top_priority: previousData.pain_points?.priorities?.[0] || 'comfort',
        team_size: previousData.group_info?.team_size || 25,
        estimated_savings: '20',
        cost_per_person: '45'
      }

      Object.entries(replacements).forEach(([key, value]) => {
        insight = insight.replace(`{{${key}}}`, value)
      })

      return insight
    })

    setInsights(generatedInsights)
  }, [config.insights, previousData])

  function getTopRecommendation(data: Record<string, any>): string {
    const priorities = data.pain_points?.priorities || []
    const recommendations: Record<string, string> = {
      energy_costs: 'smart scheduling and occupancy-based controls',
      comfort: 'zone-based temperature optimization',
      maintenance: 'predictive maintenance alerts',
      compliance: 'automated compliance tracking',
      sustainability: 'carbon footprint monitoring',
      data_visibility: 'real-time analytics dashboard'
    }
    
    return recommendations[priorities[0]] || 'comprehensive building optimization'
  }

  function getPrioritySystem(data: Record<string, any>): string {
    const priorities = data.pain_points?.priorities || []
    const systems: Record<string, string> = {
      energy_costs: 'energy consumption',
      comfort: 'HVAC performance',
      maintenance: 'equipment health',
      compliance: 'compliance metrics',
      sustainability: 'environmental impact',
      data_visibility: 'all building systems'
    }
    
    return systems[priorities[0]] || 'key building metrics'
  }

  function getInsightIcon(type: string) {
    switch (type) {
      case 'cost_estimate':
        return <TrendingUp className="w-6 h-6" />
      case 'quick_win':
        return <Zap className="w-6 h-6" />
      case 'immediate_action':
        return <Sparkles className="w-6 h-6" />
      default:
        return <Sparkles className="w-6 h-6" />
    }
  }

  async function handleAction(action: 'primary' | 'secondary') {
    await onComplete({ 
      action,
      insights,
      timestamp: new Date().toISOString()
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3
            }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {config.title}
          </h2>
        </div>

        <div className="space-y-4 mb-8">
          {config.insights.map((template: InsightTemplate, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className="flex items-start p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg"
            >
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4
                ${template.type === 'cost_estimate' ? 'bg-green-100 text-green-600' : ''}
                ${template.type === 'quick_win' ? 'bg-yellow-100 text-yellow-600' : ''}
                ${template.type === 'immediate_action' ? 'bg-blue-100 text-blue-600' : ''}
              `}>
                {getInsightIcon(template.type)}
              </div>
              <p className="text-gray-800 flex-1">
                {insights[index]}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => handleAction('primary')}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {config.cta.primary}
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          
          <button
            onClick={() => handleAction('secondary')}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors"
          >
            {config.cta.secondary}
          </button>
        </div>
      </motion.div>
    </div>
  )
}