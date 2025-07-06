import { UIComponent } from '@/types/conversation'

interface DynamicUIRendererProps {
  components: UIComponent[]
}

export function DynamicUIRenderer({ components }: DynamicUIRendererProps) {
  return (
    <div className="space-y-4">
      {components.map((component, index) => (
        <div key={index} className="p-4 bg-surface rounded-lg border border-surface">
          <p className="text-sm text-text-secondary mb-2">
            Component Type: {component.type}
          </p>
          <pre className="text-xs text-text-primary overflow-auto">
            {JSON.stringify(component.props, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  )
}