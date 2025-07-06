'use client'

import { motion } from 'framer-motion'
import { 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Brain,
  Activity,
  Gauge,
  Lightbulb,
  Shield,
  Clock
} from 'lucide-react'

interface IntelligentDashboardProps {
  title?: string
  currentUsage?: number
  trend?: string
  efficiency?: number
  breakdown?: Array<{ name: string; value: number; color: string }>
  predictions?: {
    nextHour: number
    peakToday: number
    endOfMonth: number
  }
  onOptimize: () => void
}

export function IntelligentDashboard({
  title = 'Real-Time Energy Performance',
  currentUsage = 4520,
  trend = 'stable',
  efficiency = 87,
  breakdown = [
    { name: 'HVAC', value: 2124, color: '#0EA5E9' },
    { name: 'Lighting', value: 1266, color: '#8B5CF6' },
    { name: 'Equipment', value: 1130, color: '#10B981' }
  ],
  predictions = {
    nextHour: 4730,
    peakToday: 5200,
    endOfMonth: 3250000
  },
  onOptimize
}: IntelligentDashboardProps) {
  const totalUsage = breakdown.reduce((sum, item) => sum + item.value, 0)
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl backdrop-blur-xl 
                 bg-gradient-to-br from-white/[0.05] to-white/[0.02]
                 border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                 light-mode:from-white/80 light-mode:to-white/60
                 light-mode:border-gray-200/50"
    >
      {/* Header with AI Brain Icon */}
      <div className="p-6 border-b border-white/[0.05] light-mode:border-gray-200/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20
                          border border-blue-500/30 light-mode:border-blue-400/30">
              <Brain className="w-5 h-5 text-blue-400 light-mode:text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white/90 light-mode:text-gray-800">
                {title}
              </h3>
              <p className="text-sm text-white/60 light-mode:text-gray-600">
                AI-Powered Intelligence
              </p>
            </div>
          </div>
          
          {/* Real-time indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
                         bg-green-500/20 border border-green-500/30">
            <Activity className="w-3 h-3 text-green-400 animate-pulse" />
            <span className="text-xs font-medium text-green-400">Live</span>
          </div>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Current Usage with Trend */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10
                     border border-blue-500/20 light-mode:from-blue-500/5 light-mode:to-cyan-500/5"
        >
          <div className="flex items-center justify-between mb-3">
            <Zap className="w-8 h-8 text-blue-400 light-mode:text-blue-600" />
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
              ${trend === 'increasing' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : trend === 'decreasing'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
              }`}>
              <TrendingUp className={`w-3 h-3 ${trend === 'decreasing' ? 'rotate-180' : ''}`} />
              {trend}
            </div>
          </div>
          
          <div className="text-2xl font-bold text-white/90 light-mode:text-gray-800 mb-1">
            {currentUsage.toLocaleString()}W
          </div>
          <div className="text-sm text-white/60 light-mode:text-gray-600">
            Current Usage
          </div>
          
          {/* Spark line visualization */}
          <div className="mt-3 h-8 flex items-end space-x-1">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="flex-1 bg-blue-400/30 rounded-sm"
                style={{
                  height: `${20 + Math.random() * 20}px`
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Efficiency Score */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10
                     border border-green-500/20 light-mode:from-green-500/5 light-mode:to-emerald-500/5"
        >
          <div className="flex items-center justify-between mb-3">
            <Gauge className="w-8 h-8 text-green-400 light-mode:text-green-600" />
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                           bg-green-500/20 text-green-400 border border-green-500/30">
              <Target className="w-3 h-3" />
              Optimal
            </div>
          </div>
          
          <div className="text-2xl font-bold text-white/90 light-mode:text-gray-800 mb-1">
            {efficiency}%
          </div>
          <div className="text-sm text-white/60 light-mode:text-gray-600">
            Efficiency Score
          </div>
          
          {/* Circular progress */}
          <div className="mt-3 relative w-12 h-12">
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                className="text-green-500/20"
              />
              <circle
                cx="24"
                cy="24"
                r="18"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 18}`}
                strokeDashoffset={`${2 * Math.PI * 18 * (1 - efficiency / 100)}`}
                className="text-green-400 transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-medium text-green-400">{efficiency}%</span>
            </div>
          </div>
        </motion.div>

        {/* AI Predictions */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10
                     border border-purple-500/20 light-mode:from-purple-500/5 light-mode:to-pink-500/5"
        >
          <div className="flex items-center justify-between mb-3">
            <Brain className="w-8 h-8 text-purple-400 light-mode:text-purple-600" />
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                           bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Clock className="w-3 h-3" />
              Next Hour
            </div>
          </div>
          
          <div className="text-2xl font-bold text-white/90 light-mode:text-gray-800 mb-1">
            {predictions.nextHour.toLocaleString()}W
          </div>
          <div className="text-sm text-white/60 light-mode:text-gray-600">
            AI Prediction
          </div>
          
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-white/50 light-mode:text-gray-500">Peak Today</span>
              <span className="text-white/80 light-mode:text-gray-700">{predictions.peakToday.toLocaleString()}W</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50 light-mode:text-gray-500">Month End</span>
              <span className="text-white/80 light-mode:text-gray-700">{(predictions.endOfMonth / 1000).toFixed(1)}kWh</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Energy Breakdown Visualization */}
      <div className="px-6 pb-4">
        <h4 className="text-sm font-medium text-white/80 light-mode:text-gray-700 mb-3">
          Intelligent Breakdown
        </h4>
        
        <div className="space-y-3">
          {breakdown.map((item, index) => {
            const percentage = (item.value / totalUsage) * 100
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/70 light-mode:text-gray-600">
                    {item.name}
                  </span>
                  <span className="text-sm font-medium text-white/90 light-mode:text-gray-800">
                    {item.value.toLocaleString()}W ({percentage.toFixed(1)}%)
                  </span>
                </div>
                
                <div className="relative h-2 bg-white/[0.05] light-mode:bg-gray-200/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Action Button */}
      <div className="px-6 pb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOptimize}
          className="w-full px-4 py-3 rounded-xl
                   bg-gradient-to-r from-blue-500/20 to-purple-500/20
                   border border-blue-500/30 backdrop-blur-xl
                   hover:from-blue-500/30 hover:to-purple-500/30
                   transition-all duration-300
                   flex items-center justify-center gap-2
                   group"
        >
          <Lightbulb className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
          <span className="text-sm font-medium text-white/90 light-mode:text-gray-800">
            AI Optimize Now
          </span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full
                         bg-green-500/20 text-green-400 text-xs">
            <Shield className="w-3 h-3" />
            Safe
          </div>
        </motion.button>
      </div>

      {/* Floating AI indicator */}
      <div className="absolute top-4 right-4">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg"
        />
      </div>
    </motion.div>
  )
}