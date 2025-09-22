'use client';

import { useState } from 'react';
import { ProfessionalDashboard } from '@/components/dashboard/professional/ProfessionalDashboard';
import { InnovativeDashboard } from '@/components/dashboard/innovative/InnovativeDashboard';
import { DashboardBuilder } from '@/lib/visualization/dashboards/DashboardBuilder';

export default function DashboardTestPage() {
  const [mode, setMode] = useState<'professional' | 'innovative' | 'builder'>('professional');

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Mode Selector */}
      <div className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-white/[0.02] p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Visualization Engine Test</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('professional')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  mode === 'professional'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                Professional
              </button>
              <button
                onClick={() => setMode('innovative')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  mode === 'innovative'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                Innovative 3D
              </button>
              <button
                onClick={() => setMode('builder')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  mode === 'builder'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                    : 'bg-white/5 text-white/60 hover:text-white border border-white/10'
                }`}
              >
                Dashboard Builder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div>
        {mode === 'professional' && <ProfessionalDashboard />}
        {mode === 'innovative' && <InnovativeDashboard />}
        {mode === 'builder' && (
          <DashboardBuilder
            editable={true}
            onSave={(config) => console.log('Dashboard saved:', config)}
            onExport={(config) => console.log('Dashboard exported:', config)}
          />
        )}
      </div>
    </div>
  );
}