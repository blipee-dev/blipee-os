'use client'

import dynamic from 'next/dynamic'
import { UIComponent } from '@/types/conversation'

// Dynamically import components to avoid SSR issues
const ChartComponent = dynamic(() => import('@/components/dynamic/ChartComponent').then(mod => mod.ChartComponent), {
  ssr: false,
  loading: () => <div className="h-64 bg-surface rounded-lg animate-pulse" />
})

const ControlComponent = dynamic(() => import('@/components/dynamic/ControlComponent').then(mod => mod.ControlComponent), {
  ssr: false,
  loading: () => <div className="h-32 bg-surface rounded-lg animate-pulse" />
})

const TableComponent = dynamic(() => import('@/components/dynamic/TableComponent').then(mod => mod.TableComponent), {
  ssr: false,
  loading: () => <div className="h-48 bg-surface rounded-lg animate-pulse" />
})

const ReportComponent = dynamic(() => import('@/components/dynamic/ReportComponent').then(mod => mod.ReportComponent), {
  ssr: false,
  loading: () => <div className="h-96 bg-surface rounded-lg animate-pulse" />
})

const View3DComponent = dynamic(() => import('@/components/dynamic/View3DComponent').then(mod => mod.View3DComponent), {
  ssr: false,
  loading: () => <div className="h-96 bg-surface rounded-lg animate-pulse" />
})

const IntelligentDashboard = dynamic(() => import('@/components/ai/IntelligentDashboard').then(mod => mod.IntelligentDashboard), {
  ssr: false,
  loading: () => <div className="h-96 bg-surface rounded-lg animate-pulse" />
})

interface DynamicUIRendererProps {
  components: UIComponent[]
}

export function DynamicUIRenderer({ components }: DynamicUIRendererProps) {
  const renderComponent = (component: UIComponent, index: number) => {
    const key = `${component.type}-${index}`
    
    switch (component.type) {
      case 'chart':
        return <ChartComponent key={key} {...component.props} />
      
      case 'control':
        return <ControlComponent key={key} {...component.props} />
      
      case 'table':
        return <TableComponent key={key} {...component.props} />
      
      case 'report':
        return <ReportComponent key={key} {...component.props} />
      
      case '3d-view':
        return <View3DComponent key={key} {...component.props} />
      
      case 'energy-dashboard':
        return (
          <IntelligentDashboard 
            key={key} 
            {...component.props}
            onOptimize={() => console.log('🚀 AI Optimization triggered!')}
          />
        )
      
      case 'optimization-dashboard':
        return (
          <div key={key} className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.1] light-mode:from-white/80 light-mode:to-white/60">
            <h3 className="text-lg font-semibold text-white/90 light-mode:text-gray-800 mb-4">{component.props.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {component.props.opportunities?.map((opp: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.02] light-mode:bg-white/40 border border-white/[0.05] light-mode:border-gray-200/30">
                  <h4 className="font-medium text-white/90 light-mode:text-gray-800 mb-2">{opp.name}</h4>
                  <div className="text-2xl font-bold text-green-400 light-mode:text-green-600 mb-1">{opp.savings}</div>
                  <div className="text-xs text-white/60 light-mode:text-gray-600">Effort: {opp.effort} | Impact: {opp.impact}</div>
                  <div className="text-xs text-white/50 light-mode:text-gray-500 mt-1">Confidence: {Math.round(opp.confidence * 100)}%</div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="text-sm text-white/70 light-mode:text-gray-600 mb-1">Total Monthly Savings</div>
              <div className="text-3xl font-bold text-green-400 light-mode:text-green-600">{component.props.totalSavings}</div>
              <div className="text-sm text-white/60 light-mode:text-gray-500">ROI Timeline: {component.props.roiTimeline}</div>
            </div>
          </div>
        )
      
      case 'action-panel':
        return (
          <div key={key} className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-orange-500/[0.05] to-red-500/[0.05] border border-orange-500/[0.1] light-mode:from-orange-500/5 light-mode:to-red-500/5">
            <div className="flex items-center gap-3 mb-4">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                component.props.priority === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                component.props.priority === 'high' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {component.props.priority?.toUpperCase()} PRIORITY
              </div>
              <h3 className="text-lg font-semibold text-white/90 light-mode:text-gray-800">{component.props.title}</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              {component.props.steps?.map((step: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] light-mode:bg-white/40 border border-white/[0.05] light-mode:border-gray-200/30">
                  <div className={`w-2 h-2 rounded-full ${
                    step.risk === 'high' ? 'bg-red-400' :
                    step.risk === 'medium' ? 'bg-yellow-400' :
                    'bg-green-400'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white/90 light-mode:text-gray-800">{step.name}</div>
                    <div className="text-xs text-white/60 light-mode:text-gray-600">{step.duration} • {step.automatable ? 'Automated' : 'Manual'}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 text-sm font-medium hover:from-green-500/30 hover:to-emerald-500/30 transition-all">
                🚀 Execute Plan
              </button>
              <button className="flex-1 px-4 py-2 rounded-lg bg-white/[0.02] light-mode:bg-white/40 border border-white/[0.1] light-mode:border-gray-200/30 text-white/70 light-mode:text-gray-600 text-sm font-medium hover:bg-white/[0.05] transition-all">
                🔬 Simulate First
              </button>
            </div>
          </div>
        )
      
      case 'insights-panel':
        return (
          <div key={key} className="p-6 rounded-2xl backdrop-blur-xl bg-gradient-to-br from-purple-500/[0.05] to-blue-500/[0.05] border border-purple-500/[0.1] light-mode:from-purple-500/5 light-mode:to-blue-500/5">
            <h3 className="text-lg font-semibold text-white/90 light-mode:text-gray-800 mb-4">🧠 {component.props.title}</h3>
            <div className="space-y-4">
              {component.props.insights?.map((insight: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.02] light-mode:bg-white/40 border border-white/[0.05] light-mode:border-gray-200/30">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      insight.type === 'prediction' ? 'bg-blue-400' :
                      insight.type === 'opportunity' ? 'bg-green-400' :
                      'bg-purple-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-white/80 light-mode:text-gray-700 mb-2">{insight.text}</p>
                      <div className="flex items-center gap-4 text-xs text-white/50 light-mode:text-gray-500">
                        <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                        {insight.actionable && <span className="text-green-400 light-mode:text-green-600">✨ Actionable</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      
      default:
        return (
          <div key={key} className="p-4 bg-surface rounded-lg border border-surface">
            <p className="text-sm text-text-secondary">
              Unknown component type: {component.type}
            </p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {components.map((component, index) => {
        // Handle layout positioning
        const layoutClass = component.layout?.position === 'modal' 
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/50'
          : component.layout?.position === 'sidebar'
          ? 'absolute right-0 top-0 w-96'
          : ''
        
        return (
          <div 
            key={index} 
            className={layoutClass}
            style={{
              width: component.layout?.width,
              height: component.layout?.height
            }}
          >
            {renderComponent(component, index)}
          </div>
        )
      })}
    </div>
  )
}