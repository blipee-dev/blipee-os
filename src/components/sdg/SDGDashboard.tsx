'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  Globe,
  BarChart3,
  Calendar,
  Users,
  Zap,
  Leaf,
  Factory,
  Heart,
  GraduationCap,
  Scale,
  Recycle,
  ArrowRight,
  Info
} from 'lucide-react';

interface SDGGoalProgress {
  goalId: number;
  title: string;
  icon: string;
  color: string;
  progress: number;
  status: 'on_track' | 'needs_attention' | 'off_track';
  targets: Array<{
    targetId: string;
    title: string;
    progress: number;
    trend: 'improving' | 'stable' | 'declining';
    lastUpdated: Date;
  }>;
}

interface SDGDashboardData {
  overview: {
    totalGoals: number;
    activeGoals: number;
    onTrackTargets: number;
    atRiskTargets: number;
    overallProgress: number;
  };
  goalProgress: SDGGoalProgress[];
  keyInsights: Array<{
    type: 'achievement' | 'concern' | 'opportunity';
    goalId: number;
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionRequired?: string;
  }>;
  impactMap: Array<{
    goalId: number;
    connectedGoals: number[];
    synergies: number;
    tradeOffs: number;
    netImpact: 'positive' | 'negative' | 'neutral';
  }>;
}

const SDGIcon: React.FC<{ goalId: number; className?: string }> = ({ goalId, className = "" }) => {
  const iconMap: Record<number, React.ReactNode> = {
    1: <Target className={className} />,
    3: <Heart className={className} />,
    4: <GraduationCap className={className} />,
    5: <Scale className={className} />,
    7: <Zap className={className} />,
    8: <Users className={className} />,
    9: <Factory className={className} />,
    12: <Recycle className={className} />,
    13: <Leaf className={className} />
  };
  
  return iconMap[goalId] || <Target className={className} />;
};

const SDGGoalCard: React.FC<{ 
  goal: SDGGoalProgress; 
  onClick: () => void;
  isSelected: boolean;
}> = ({ goal, onClick, isSelected }) => {
  const statusColors = {
    on_track: 'from-green-500 to-green-600',
    needs_attention: 'from-yellow-500 to-orange-500',
    off_track: 'from-red-500 to-red-600'
  };

  const statusIcons = {
    on_track: <CheckCircle className="w-5 h-5 text-green-400" />,
    needs_attention: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    off_track: <AlertTriangle className="w-5 h-5 text-red-400" />
  };

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative p-6 rounded-xl cursor-pointer transition-all duration-300
        backdrop-blur-xl border border-white/10
        ${isSelected 
          ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-400/30' 
          : 'bg-white/[0.03] hover:bg-white/[0.08]'
        }
      `}
    >
      {/* Goal Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className={`p-3 rounded-lg bg-gradient-to-br ${statusColors[goal.status]}`}
          >
            <SDGIcon goalId={goal.goalId} className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">SDG {goal.goalId}</h3>
            <p className="text-sm text-gray-300 line-clamp-2">{goal.title}</p>
          </div>
        </div>
        {statusIcons[goal.status]}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Overall Progress</span>
          <span className="text-sm font-medium text-white">{goal.progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full bg-gradient-to-r ${statusColors[goal.status]}`}
            initial={{ width: 0 }}
            animate={{ width: `${goal.progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Targets Summary */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{goal.targets.length} targets tracked</span>
        <div className="flex items-center space-x-1">
          {goal.targets.some(t => t.trend === 'improving') && (
            <TrendingUp className="w-4 h-4 text-green-400" />
          )}
          {goal.targets.some(t => t.trend === 'declining') && (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-blue-400/50 pointer-events-none"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
};

const GoalDetailPanel: React.FC<{ goal: SDGGoalProgress; onClose: () => void }> = ({ goal, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed inset-y-0 right-0 w-96 bg-gray-900/95 backdrop-blur-xl border-l border-white/10 p-6 overflow-y-auto z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <SDGIcon goalId={goal.goalId} className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">SDG {goal.goalId}</h2>
            <p className="text-sm text-gray-300">{goal.title}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Overall Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Overall Progress</span>
          <span className="text-lg font-semibold text-white">{goal.progress.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-700/50 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      {/* Targets */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Targets</h3>
        {goal.targets.map((target, index) => (
          <motion.div
            key={target.targetId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg bg-white/[0.03] border border-white/5"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-white">{target.targetId}</h4>
                <p className="text-xs text-gray-300 mt-1">{target.title}</p>
              </div>
              <div className="flex items-center space-x-1 ml-3">
                {target.trend === 'improving' && <TrendingUp className="w-4 h-4 text-green-400" />}
                {target.trend === 'declining' && <TrendingDown className="w-4 h-4 text-red-400" />}
                {target.trend === 'stable' && <Activity className="w-4 h-4 text-yellow-400" />}
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Progress</span>
              <span className="text-xs font-medium text-white">{target.progress.toFixed(0)}%</span>
            </div>
            
            <div className="w-full bg-gray-700/50 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  target.trend === 'improving' ? 'bg-green-500' :
                  target.trend === 'declining' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}
                style={{ width: `${target.progress}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-400 mt-2">
              Last updated: {target.lastUpdated.toLocaleDateString()}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 space-y-3">
        <button className="w-full p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all">
          View Action Plan
        </button>
        <button className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
          Export Progress Report
        </button>
      </div>
    </motion.div>
  );
};

const InsightCard: React.FC<{ insight: any }> = ({ insight }) => {
  const typeStyles = {
    achievement: {
      bg: 'from-green-500/20 to-emerald-500/20',
      border: 'border-green-400/30',
      icon: <CheckCircle className="w-5 h-5 text-green-400" />
    },
    concern: {
      bg: 'from-red-500/20 to-orange-500/20',
      border: 'border-red-400/30',
      icon: <AlertTriangle className="w-5 h-5 text-red-400" />
    },
    opportunity: {
      bg: 'from-blue-500/20 to-purple-500/20',
      border: 'border-blue-400/30',
      icon: <TrendingUp className="w-5 h-5 text-blue-400" />
    }
  };

  const style = typeStyles[insight.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg bg-gradient-to-br ${style.bg} border ${style.border}`}
    >
      <div className="flex items-start space-x-3">
        {style.icon}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-white mb-1">{insight.title}</h4>
          <p className="text-xs text-gray-300 mb-2">{insight.description}</p>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 rounded bg-white/10 text-white">
              SDG {insight.goalId}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${
              insight.impact === 'high' ? 'bg-red-500/20 text-red-300' :
              insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-green-500/20 text-green-300'
            }`}>
              {insight.impact} impact
            </span>
          </div>
          {insight.actionRequired && (
            <p className="text-xs text-blue-300 mt-2 font-medium">
              Action: {insight.actionRequired}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const SDGDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<SDGDashboardData | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SDGGoalProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'insights' | 'impact'>('overview');

  useEffect(() => {
    // Simulate API call
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Mock data that matches the SDGTracker interface
      const mockData: SDGDashboardData = {
        overview: {
          totalGoals: 17,
          activeGoals: 8,
          onTrackTargets: 12,
          atRiskTargets: 3,
          overallProgress: 68
        },
        goalProgress: [
          {
            goalId: 3,
            title: "Good Health and Well-being",
            icon: "🏥",
            color: "#4c9f38",
            progress: 75,
            status: 'on_track',
            targets: [
              { targetId: "3.3", title: "End epidemics", progress: 80, trend: 'improving', lastUpdated: new Date() },
              { targetId: "3.8", title: "Universal health coverage", progress: 70, trend: 'stable', lastUpdated: new Date() }
            ]
          },
          {
            goalId: 4,
            title: "Quality Education",
            icon: "📚",
            color: "#c5192d",
            progress: 85,
            status: 'on_track',
            targets: [
              { targetId: "4.1", title: "Free primary and secondary education", progress: 90, trend: 'improving', lastUpdated: new Date() },
              { targetId: "4.3", title: "Equal access to technical education", progress: 80, trend: 'improving', lastUpdated: new Date() }
            ]
          },
          {
            goalId: 5,
            title: "Gender Equality",
            icon: "⚖️",
            color: "#ff3a21",
            progress: 45,
            status: 'needs_attention',
            targets: [
              { targetId: "5.1", title: "End discrimination against women", progress: 40, trend: 'stable', lastUpdated: new Date() },
              { targetId: "5.5", title: "Women's participation in leadership", progress: 50, trend: 'improving', lastUpdated: new Date() }
            ]
          },
          {
            goalId: 7,
            title: "Affordable and Clean Energy",
            icon: "⚡",
            color: "#fcc30b",
            progress: 92,
            status: 'on_track',
            targets: [
              { targetId: "7.1", title: "Universal access to energy", progress: 95, trend: 'improving', lastUpdated: new Date() },
              { targetId: "7.2", title: "Increase renewable energy", progress: 88, trend: 'improving', lastUpdated: new Date() },
              { targetId: "7.3", title: "Double energy efficiency", progress: 93, trend: 'stable', lastUpdated: new Date() }
            ]
          },
          {
            goalId: 8,
            title: "Decent Work and Economic Growth",
            icon: "💼",
            color: "#a21942",
            progress: 65,
            status: 'needs_attention',
            targets: [
              { targetId: "8.1", title: "Sustain economic growth", progress: 70, trend: 'stable', lastUpdated: new Date() },
              { targetId: "8.5", title: "Full employment and decent work", progress: 60, trend: 'improving', lastUpdated: new Date() },
              { targetId: "8.8", title: "Protect labor rights", progress: 65, trend: 'stable', lastUpdated: new Date() }
            ]
          },
          {
            goalId: 9,
            title: "Industry, Innovation and Infrastructure",
            icon: "🏭",
            color: "#fd6925",
            progress: 78,
            status: 'on_track',
            targets: [
              { targetId: "9.1", title: "Develop resilient infrastructure", progress: 75, trend: 'improving', lastUpdated: new Date() },
              { targetId: "9.4", title: "Upgrade infrastructure for sustainability", progress: 80, trend: 'improving', lastUpdated: new Date() },
              { targetId: "9.5", title: "Enhance research and innovation", progress: 80, trend: 'stable', lastUpdated: new Date() }
            ]
          },
          {
            goalId: 12,
            title: "Responsible Consumption and Production",
            icon: "♻️",
            color: "#bf8b2e",
            progress: 55,
            status: 'needs_attention',
            targets: [
              { targetId: "12.2", title: "Sustainable management of natural resources", progress: 60, trend: 'improving', lastUpdated: new Date() },
              { targetId: "12.3", title: "Halve food waste", progress: 45, trend: 'stable', lastUpdated: new Date() },
              { targetId: "12.5", title: "Reduce waste generation", progress: 60, trend: 'improving', lastUpdated: new Date() }
            ]
          },
          {
            goalId: 13,
            title: "Climate Action",
            icon: "🌍",
            color: "#3f7e44",
            progress: 88,
            status: 'on_track',
            targets: [
              { targetId: "13.1", title: "Strengthen resilience to climate hazards", progress: 85, trend: 'improving', lastUpdated: new Date() },
              { targetId: "13.2", title: "Integrate climate measures", progress: 90, trend: 'improving', lastUpdated: new Date() },
              { targetId: "13.3", title: "Improve education on climate change", progress: 90, trend: 'stable', lastUpdated: new Date() }
            ]
          }
        ],
        keyInsights: [
          {
            type: 'achievement',
            goalId: 7,
            title: 'Excellent Clean Energy Progress',
            description: 'Renewable energy targets exceeded with 92% completion',
            impact: 'high'
          },
          {
            type: 'concern',
            goalId: 5,
            title: 'Gender Equality Needs Attention',
            description: 'Progress stalling at 45% with limited improvement in leadership representation',
            impact: 'high',
            actionRequired: 'Implement targeted diversity and inclusion programs'
          },
          {
            type: 'opportunity',
            goalId: 12,
            title: 'Waste Reduction Acceleration',
            description: 'Strong foundation for circular economy initiatives',
            impact: 'medium'
          }
        ],
        impactMap: [
          { goalId: 7, connectedGoals: [9, 13, 12], synergies: 3, tradeOffs: 0, netImpact: 'positive' },
          { goalId: 8, connectedGoals: [1, 5, 9], synergies: 2, tradeOffs: 1, netImpact: 'positive' },
          { goalId: 9, connectedGoals: [7, 8, 11], synergies: 3, tradeOffs: 0, netImpact: 'positive' },
          { goalId: 12, connectedGoals: [13, 14, 15], synergies: 2, tradeOffs: 1, netImpact: 'positive' },
          { goalId: 13, connectedGoals: [7, 12, 14], synergies: 3, tradeOffs: 0, netImpact: 'positive' }
        ]
      };

      setTimeout(() => {
        setDashboardData(mockData);
        setLoading(false);
      }, 1000);
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-gray-400 py-12">
        <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Unable to load SDG dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">UN SDG Dashboard</h1>
          <p className="text-gray-300 mt-1">Track progress toward Sustainable Development Goals</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium hover:from-blue-600 hover:to-purple-700 transition-all">
            Generate Report
          </button>
          <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-2xl font-bold text-white">{dashboardData.overview.activeGoals}</div>
          <div className="text-sm text-gray-400">Active Goals</div>
          <div className="text-xs text-gray-500">of {dashboardData.overview.totalGoals} total</div>
        </div>
        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-2xl font-bold text-green-400">{dashboardData.overview.onTrackTargets}</div>
          <div className="text-sm text-gray-400">On Track</div>
          <div className="text-xs text-gray-500">targets</div>
        </div>
        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-2xl font-bold text-red-400">{dashboardData.overview.atRiskTargets}</div>
          <div className="text-sm text-gray-400">At Risk</div>
          <div className="text-xs text-gray-500">targets</div>
        </div>
        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-2xl font-bold text-blue-400">{dashboardData.overview.overallProgress}%</div>
          <div className="text-sm text-gray-400">Overall Progress</div>
          <div className="text-xs text-gray-500">weighted average</div>
        </div>
        <div className="p-4 rounded-lg bg-white/[0.03] border border-white/5">
          <div className="text-2xl font-bold text-purple-400">2030</div>
          <div className="text-sm text-gray-400">Target Year</div>
          <div className="text-xs text-gray-500">6 years remaining</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 p-1 bg-white/[0.03] rounded-lg border border-white/5">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'goals', label: 'Goals', icon: Target },
          { id: 'insights', label: 'Insights', icon: TrendingUp },
          { id: 'impact', label: 'Impact Map', icon: Globe }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all
              ${activeTab === tab.id 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Goals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dashboardData.goalProgress.map((goal) => (
                <SDGGoalCard
                  key={goal.goalId}
                  goal={goal}
                  onClick={() => setSelectedGoal(goal)}
                  isSelected={selectedGoal?.goalId === goal.goalId}
                />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'insights' && (
          <motion.div
            key="insights"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {dashboardData.keyInsights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal Detail Panel */}
      <AnimatePresence>
        {selectedGoal && (
          <GoalDetailPanel
            goal={selectedGoal}
            onClose={() => setSelectedGoal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};