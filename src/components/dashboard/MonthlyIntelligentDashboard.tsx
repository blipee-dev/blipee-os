'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Calendar,
  Bot,
  Sparkles,
  ChevronRight,
  Clock,
  Target,
  Activity,
  MessageSquare,
  Bell,
  Eye,
  Brain,
  Zap,
  RefreshCw,
  Play,
  Power
} from 'lucide-react';

interface DashboardProps {
  organizationId: string;
  userId: string;
}

export function MonthlyIntelligentDashboard({ organizationId, userId }: DashboardProps) {
  const [currentDate] = useState(new Date());
  const [dayOfMonth] = useState(currentDate.getDate());
  const [hasNewData, setHasNewData] = useState(dayOfMonth >= 15);
  const [showAI, setShowAI] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [metrics, setMetrics] = useState({
    emissions: { current: 245, previous: 220, trend: 11.4 },
    energy: { current: 52000, previous: 48000, trend: 8.3 },
    cost: { current: 45000, previous: 39000, trend: 15.4 },
    efficiency: { current: 4.7, previous: 4.6, trend: 2.2 }
  });
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [monthlyStatus, setMonthlyStatus] = useState<any>(null);
  const [workforceInitialized, setWorkforceInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize AI based on day of month
    initializeMonthlyAI();
    checkMonthlyIntelligence();
  }, [dayOfMonth]);

  const checkMonthlyIntelligence = async () => {
    try {
      const response = await fetch('/api/ai/monthly-intelligence');
      if (response.ok) {
        const status = await response.json();
        setMonthlyStatus(status);

        // Update insights from actual AI system
        if (status.activities?.activities?.length > 0) {
          setAiInsights(status.activities.activities);
        }

        // Check if AI workforce is initialized
        if (status.aiStatus?.initialized) {
          setWorkforceInitialized(true);
        }
      }
    } catch (error) {
      console.error('Failed to check monthly intelligence:', error);
    }
  };

  const initializeMonthlySystem = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/monthly-intelligence', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setMonthlyStatus(data.status);
        setWorkforceInitialized(true);
      }
    } catch (error) {
      console.error('Failed to initialize monthly system:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerManualProcessing = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/monthly-intelligence', {
        method: 'PUT'
      });

      if (response.ok) {
        const data = await response.json();
        await checkMonthlyIntelligence();
      }
    } catch (error) {
      console.error('Failed to trigger processing:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeMonthlyAI = () => {
    if (dayOfMonth < 15) {
      // Before data arrives
      setAiMessage("🕐 New data arrives in " + (15 - dayOfMonth) + " days. While we wait, I'm analyzing patterns from previous months...");
      setAiInsights([
        "Your emissions typically spike in summer months",
        "Last year this month: 238 tCO2e",
        "3 improvement opportunities identified from historical data"
      ]);
      setSuggestedQuestions([
        "What patterns did you find in historical data?",
        "How can we prepare for next month?",
        "What should we focus on while waiting for data?"
      ]);
    } else if (dayOfMonth === 15) {
      // Data just arrived!
      setAiMessage("🎉 NEW DATA HAS ARRIVED! I'm analyzing everything now...");
      setShowAI(true);
      setTimeout(() => {
        setAiInsights([
          "⚠️ Emissions increased 11.4% - unusual for this season",
          "💰 Found $5,000 in quick savings opportunities",
          "📊 3 metrics performing better than industry average"
        ]);
      }, 2000);
    } else {
      // After data arrives
      setAiMessage("📊 This month's analysis is ready. I found several important insights you should see.");
      setAiInsights([
        "Root cause of 11.4% increase identified",
        "Cost saving opportunity: $5,000/month",
        "Compliance risk detected in Scope 3 reporting"
      ]);
      setSuggestedQuestions([
        "Why did emissions increase this month?",
        "How can I save that $5,000?",
        "What's the compliance risk?"
      ]);
    }
  };

  const getDaysUntilData = () => {
    if (dayOfMonth >= 15) return 30 - dayOfMonth + 15;
    return 15 - dayOfMonth;
  };

  const getMonthlyPhase = () => {
    if (dayOfMonth < 15) return 'waiting';
    if (dayOfMonth === 15) return 'arrival';
    if (dayOfMonth <= 20) return 'analysis';
    return 'planning';
  };

  const handleAskQuestion = (question: string) => {
    // This would trigger the AI chat
    setShowAI(true);
  };

  return (
    <div className="space-y-6">
      {/* Monthly Data Status Bar */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-xl border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-sm font-medium text-white">
                {getMonthlyPhase() === 'waiting' ? 'Waiting for Data' :
                 getMonthlyPhase() === 'arrival' ? '🎉 DATA ARRIVED!' :
                 getMonthlyPhase() === 'analysis' ? 'Analysis Period' :
                 'Planning Next Month'}
              </div>
              <div className="text-xs text-gray-400">
                {getMonthlyPhase() === 'waiting'
                  ? `New data in ${getDaysUntilData()} days (arrives by 15th)`
                  : `Day ${dayOfMonth - 15} of analysis cycle`}
              </div>
            </div>
          </div>

          {/* AI Status Indicator */}
          <div className="flex items-center gap-3">
            {workforceInitialized ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                  <span className="text-xs text-green-300">
                    {monthlyStatus?.aiStatus?.activeCapabilities?.length || 0} AI Systems Active
                  </span>
                </div>
                <button
                  onClick={checkMonthlyIntelligence}
                  disabled={loading}
                  className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 text-gray-300 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {dayOfMonth === 15 && (
                  <button
                    onClick={triggerManualProcessing}
                    disabled={loading}
                    className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-blue-300">Process Data</span>
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={initializeMonthlySystem}
                disabled={loading}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
              >
                <Power className="w-4 h-4" />
                <span className="text-xs">{loading ? 'Initializing...' : 'Activate Monthly AI'}</span>
              </button>
            )}
            <button
              onClick={() => setShowAI(!showAI)}
              className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-blue-300">AI Insights</span>
              {aiInsights.length > 0 && (
                <span className="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                  {aiInsights.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Progress bar for data arrival */}
        {getMonthlyPhase() === 'waiting' && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Data Collection Progress</span>
              <span>{Math.round((dayOfMonth / 15) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                animate={{ width: `${(dayOfMonth / 15) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* AI Insights Panel (Expandable) */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">AI Intelligence Team</h3>
                    <p className="text-sm text-gray-400">{aiMessage}</p>
                  </div>
                  <button
                    onClick={() => setShowAI(false)}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>

                {/* AI Insights */}
                {aiInsights.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {aiInsights.map((insight, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-2 p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800/70 transition-all cursor-pointer"
                        onClick={() => handleAskQuestion(`Tell me more about: ${insight}`)}
                      >
                        <Sparkles className="w-4 h-4 text-yellow-400 mt-0.5" />
                        <span className="text-sm text-gray-300">{insight}</span>
                        <ChevronRight className="w-4 h-4 text-gray-500 ml-auto" />
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Show active AI agents if initialized */}
                {monthlyStatus?.activities?.aiAgentsActive && (
                  <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/20 rounded-lg">
                    <p className="text-xs text-purple-400 mb-2">Active AI Agents:</p>
                    <div className="flex flex-wrap gap-2">
                      {monthlyStatus.activities.aiAgentsActive.map((agent: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300"
                        >
                          {agent}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Questions */}
                {suggestedQuestions.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAskQuestion(question)}
                          className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-300 hover:bg-purple-500/30 transition-all"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(metrics).map(([key, data], idx) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => handleAskQuestion(`Tell me about ${key}`)}
          >
            {/* Hover AI Prompt */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Click to ask AI about this
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{key}</span>
              {data.trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )}
            </div>

            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {key === 'emissions' ? `${data.current} tCO2e` :
               key === 'energy' ? `${(data.current / 1000).toFixed(0)} MWh` :
               key === 'cost' ? `$${(data.current / 1000).toFixed(0)}k` :
               data.current}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className={`${data.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {data.trend > 0 ? '+' : ''}{data.trend}%
              </span>
              <span className="text-gray-500 dark:text-gray-400">vs last month</span>
            </div>

            {/* AI Analysis Available Indicator */}
            {hasNewData && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Bot className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-purple-400">AI analysis available</span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick Actions Based on Monthly Phase */}
      <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {getMonthlyPhase() === 'waiting' ? '⏳ While Waiting for Data' :
           getMonthlyPhase() === 'arrival' ? '🎉 New Data Actions' :
           getMonthlyPhase() === 'analysis' ? '📊 Analysis Actions' :
           '📅 Planning Actions'}
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {getMonthlyPhase() === 'waiting' && (
            <>
              <button className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg text-left hover:bg-purple-500/30 transition-all">
                <Clock className="w-4 h-4 text-purple-400 mb-2" />
                <div className="text-sm text-white">Review Historical</div>
                <div className="text-xs text-gray-400">Analyze past patterns</div>
              </button>
              <button className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-left hover:bg-blue-500/30 transition-all">
                <Target className="w-4 h-4 text-blue-400 mb-2" />
                <div className="text-sm text-white">Set Targets</div>
                <div className="text-xs text-gray-400">Plan for next month</div>
              </button>
              <button className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-left hover:bg-green-500/30 transition-all">
                <Brain className="w-4 h-4 text-green-400 mb-2" />
                <div className="text-sm text-white">AI Predictions</div>
                <div className="text-xs text-gray-400">See forecasts</div>
              </button>
              <button className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-left hover:bg-yellow-500/30 transition-all">
                <MessageSquare className="w-4 h-4 text-yellow-400 mb-2" />
                <div className="text-sm text-white">Ask AI</div>
                <div className="text-xs text-gray-400">Get insights now</div>
              </button>
            </>
          )}

          {(getMonthlyPhase() === 'arrival' || getMonthlyPhase() === 'analysis') && (
            <>
              <button className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-left hover:bg-red-500/30 transition-all">
                <AlertCircle className="w-4 h-4 text-red-400 mb-2" />
                <div className="text-sm text-white">View Anomalies</div>
                <div className="text-xs text-gray-400">3 detected</div>
              </button>
              <button className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-left hover:bg-green-500/30 transition-all">
                <TrendingUp className="w-4 h-4 text-green-400 mb-2" />
                <div className="text-sm text-white">Opportunities</div>
                <div className="text-xs text-gray-400">$5k identified</div>
              </button>
              <button className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-lg text-left hover:bg-purple-500/30 transition-all">
                <Eye className="w-4 h-4 text-purple-400 mb-2" />
                <div className="text-sm text-white">Deep Analysis</div>
                <div className="text-xs text-gray-400">AI insights ready</div>
              </button>
              <button className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-left hover:bg-blue-500/30 transition-all">
                <Zap className="w-4 h-4 text-blue-400 mb-2" />
                <div className="text-sm text-white">Take Action</div>
                <div className="text-xs text-gray-400">Implement fixes</div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Floating AI Coach (Always Present) */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAI(!showAI)}
          className="w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow relative"
        >
          <Bot className="w-7 h-7 text-white" />
          {aiInsights.length > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {aiInsights.length}
            </span>
          )}
        </motion.button>

        {/* Tooltip */}
        <AnimatePresence>
          {!showAI && aiInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-16 right-0 bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap"
            >
              {aiInsights.length} new AI insights available!
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}