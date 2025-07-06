'use client'

import { Download, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ReportComponentProps {
  title?: string
  period?: string
  metrics?: Record<string, any>
  sections?: {
    title: string
    content: string | any[]
    type?: 'text' | 'list' | 'metrics'
  }[]
  downloadable?: boolean
}

export function ReportComponent({ title = 'Report', period, metrics, sections, downloadable = true }: ReportComponentProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'down':
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-400" />
      default:
        return <Minus className="w-4 h-4 text-text-secondary" />
    }
  }

  const formatMetricValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    return value
  }

  return (
    <div className="glass-card glass-card-elevated" style={{
      background: 'rgba(255, 255, 255, 0.02)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '1rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 0 32px rgba(139, 92, 246, 0.25)',
    }}>
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            {period && (
              <p className="text-sm text-text-secondary mt-1">{period}</p>
            )}
          </div>
          {downloadable && (
            <button className="gradient-button flex items-center gap-2 px-4 py-2 rounded-lg transition-all" style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              color: 'white',
              fontWeight: 600,
            }}>
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-800">
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="glass-card" style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '0.75rem',
              padding: '1rem',
            }}>
              <div className="text-sm text-text-secondary mb-1">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-semibold text-white">
                  {formatMetricValue(typeof value === 'object' ? value.value : value)}
                </div>
                {typeof value === 'object' && value.trend && getTrendIcon(value.trend)}
              </div>
              {typeof value === 'object' && value.change && (
                <div className={`text-sm mt-1 ${
                  value.trend === 'improving' ? 'text-green-400' : 
                  value.trend === 'declining' ? 'text-red-400' : 
                  'text-text-secondary'
                }`}>
                  {value.change}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Content Sections */}
      {sections && sections.length > 0 && (
        <div className="p-6 space-y-6">
          {sections.map((section, index) => (
            <div key={index}>
              <h4 className="text-lg font-medium text-white mb-3">{section.title}</h4>
              
              {section.type === 'text' && (
                <p className="text-text-primary leading-relaxed">
                  {section.content}
                </p>
              )}
              
              {section.type === 'list' && Array.isArray(section.content) && (
                <ul className="space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-text-primary">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              {section.type === 'metrics' && typeof section.content === 'object' && (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(section.content).map(([metric, value]) => (
                    <div key={metric} className="flex justify-between py-2 border-b border-surface">
                      <span className="text-text-secondary">
                        {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-text-primary font-medium">
                        {formatMetricValue(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-surface-light border-t border-surface">
        <p className="text-sm text-text-secondary text-center">
          Generated by Blipee OS • {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}