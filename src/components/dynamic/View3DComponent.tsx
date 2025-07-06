'use client'

import { Maximize2, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'

interface View3DComponentProps {
  title?: string
  buildingId?: string
  floor?: number
  highlightZones?: string[]
  showHeatmap?: boolean
  data?: any
}

export function View3DComponent({ title, floor = 1, highlightZones = [], showHeatmap = false }: View3DComponentProps) {
  return (
    <div className="bg-surface rounded-lg border border-surface overflow-hidden">
      {title && (
        <div className="p-4 border-b border-surface flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-surface-light rounded transition-colors">
              <ZoomIn className="w-4 h-4 text-text-secondary" />
            </button>
            <button className="p-2 hover:bg-surface-light rounded transition-colors">
              <ZoomOut className="w-4 h-4 text-text-secondary" />
            </button>
            <button className="p-2 hover:bg-surface-light rounded transition-colors">
              <RotateCw className="w-4 h-4 text-text-secondary" />
            </button>
            <button className="p-2 hover:bg-surface-light rounded transition-colors">
              <Maximize2 className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        </div>
      )}
      
      {/* 3D View Placeholder */}
      <div className="relative h-96 bg-gradient-to-br from-surface to-surface-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-4 bg-primary/20 rounded-lg flex items-center justify-center">
            <div className="w-24 h-24 bg-primary/30 rounded transform rotate-45 flex items-center justify-center">
              <div className="w-16 h-16 bg-primary/40 rounded transform -rotate-45"></div>
            </div>
          </div>
          <p className="text-text-secondary mb-2">3D Building View</p>
          <p className="text-sm text-text-secondary">Floor {floor}</p>
          {highlightZones.length > 0 && (
            <p className="text-sm text-primary mt-2">
              Highlighting: {highlightZones.join(', ')}
            </p>
          )}
          {showHeatmap && (
            <p className="text-sm text-yellow-400 mt-1">Heatmap Active</p>
          )}
        </div>
        
        {/* Mock overlay info */}
        <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur rounded p-3 text-sm">
          <div className="text-text-secondary mb-1">Energy Usage</div>
          <div className="text-xl font-semibold text-white">4,520 kW</div>
        </div>
        
        <div className="absolute bottom-4 right-4 bg-surface/90 backdrop-blur rounded p-3 text-sm">
          <div className="text-text-secondary mb-1">Active Zones</div>
          <div className="text-xl font-semibold text-white">12 / 16</div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="p-4 bg-surface-light border-t border-surface">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showHeatmap} className="rounded" readOnly />
              <span className="text-text-primary">Show Heatmap</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-text-primary">Show Devices</span>
            </label>
          </div>
          <select className="bg-surface border border-surface rounded px-3 py-1 text-text-primary">
            <option>Floor {floor}</option>
            <option>All Floors</option>
            <option>Basement</option>
          </select>
        </div>
      </div>
    </div>
  )
}