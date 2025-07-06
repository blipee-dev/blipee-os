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