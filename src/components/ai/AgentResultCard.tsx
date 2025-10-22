'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, AlertCircle, CheckCircle, XCircle, Clock, Zap, DollarSign, Shield, Truck, Settings, Target } from 'lucide-react';
import { useAccentGradient } from '@/providers/AppearanceProvider';

interface AgentResultCardProps {
  agentId: string;
  agentName: string;
  agentIcon: string;
  title: string;
  status: 'success' | 'warning' | 'error' | 'info' | 'pending';
  result: any;
  recommendations?: any[];
  data?: any;
  opportunities?: any[];
  risks?: any[];
  predictions?: any[];
  insights?: any[];
  optimizations?: any[];
  estimatedSavings?: string;
  impact?: any;
  confidence?: number;
  timestamp?: string;
}

const AGENT_COLORS = {
  'carbon-hunter': { from: '#10b981', to: '#059669', icon: '🔍' },
  'compliance-guardian': { from: '#8b5cf6', to: '#7c3aed', icon: '🛡️' },
  'cost-finder': { from: '#f59e0b', to: '#d97706', icon: '💰' },
  'supply-chain': { from: '#3b82f6', to: '#2563eb', icon: '🚚' },
  'predictive-maintenance': { from: '#ef4444', to: '#dc2626', icon: '🔧' },
  'optimizer': { from: '#14b8a6', to: '#0d9488', icon: '⚡' },
  'esg-chief': { from: '#6366f1', to: '#4f46e5', icon: '👔' },
  'regulatory-foresight': { from: '#ec4899', to: '#db2777', icon: '📋' },
};

const STATUS_CONFIG = {
  success: { color: 'green', icon: CheckCircle, bg: 'from-green-500/10 to-emerald-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  warning: { color: 'yellow', icon: AlertCircle, bg: 'from-yellow-500/10 to-orange-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
  error: { color: 'red', icon: XCircle, bg: 'from-red-500/10 to-rose-500/10', border: 'border-red-500/30', text: 'text-red-400' },
  info: { color: 'blue', icon: AlertCircle, bg: 'from-blue-500/10 to-cyan-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  pending: { color: 'gray', icon: Clock, bg: 'from-gray-500/10 to-slate-500/10', border: 'border-gray-500/30', text: 'text-gray-400' },
};

export function AgentResultCard({
  agentId,
  agentName,
  agentIcon,
  title,
  status,
  result,
  recommendations = [],
  data,
  opportunities = [],
  risks = [],
  predictions = [],
  insights = [],
  optimizations = [],
  estimatedSavings,
  impact,
  confidence,
  timestamp,
}: AgentResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const accentGradientConfig = useAccentGradient();

  const agentColor = AGENT_COLORS[agentId as keyof typeof AGENT_COLORS] || AGENT_COLORS['esg-chief'];
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full"
    >
      {/* Agent Header */}
      <div
        className="rounded-t-2xl p-4 backdrop-blur-xl border border-b-0"
        style={{
          background: `linear-gradient(135deg, ${agentColor.from}15, ${agentColor.to}15)`,
          borderColor: `${agentColor.from}30`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl backdrop-blur-xl"
              style={{
                background: `linear-gradient(135deg, ${agentColor.from}30, ${agentColor.to}30)`,
                border: `1px solid ${agentColor.from}40`,
              }}
            >
              {agentIcon}
            </div>
            <div>
              <div className="text-sm font-semibold text-white/90 dark:text-white/90">
                {agentName}
              </div>
              <div className="text-xs text-white/60 dark:text-white/60">
                {timestamp ? new Date(timestamp).toLocaleTimeString() : 'Just now'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-white/60" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/60" />
            )}
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="rounded-b-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
        {/* Status Banner */}
        <div className={`px-4 py-3 bg-gradient-to-r ${statusConfig.bg} border-b ${statusConfig.border}`}>
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-4 h-4 ${statusConfig.text}`} />
            <span className={`text-sm font-medium ${statusConfig.text}`}>
              {title}
            </span>
            {confidence !== undefined && (
              <span className="ml-auto text-xs text-white/50">
                {Math.round(confidence * 100)}% confidence
              </span>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* Result Summary */}
                {result && typeof result === 'string' && (
                  <div className="text-sm text-white/80 dark:text-white/80">
                    {result}
                  </div>
                )}

                {/* Estimated Savings (Cost Finder) */}
                {estimatedSavings && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-xs text-white/60">Estimated Savings</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400">{estimatedSavings}</div>
                  </div>
                )}

                {/* Opportunities */}
                {opportunities.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Opportunities Found
                    </div>
                    {opportunities.map((opp, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white/90 mb-1">
                              {opp.name || opp.title}
                            </div>
                            {opp.description && (
                              <div className="text-xs text-white/60 mb-2">
                                {opp.description}
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs">
                              {opp.savings && (
                                <span className="text-green-400">{opp.savings}</span>
                              )}
                              {opp.impact && (
                                <span className="text-white/50">Impact: {opp.impact}</span>
                              )}
                            </div>
                          </div>
                          {opp.confidence && (
                            <div className="text-xs text-white/40">
                              {Math.round(opp.confidence * 100)}%
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Risks */}
                {risks.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Risks Identified
                    </div>
                    {risks.map((risk, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-red-500/5 border border-red-500/20"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white/90 mb-1">
                              {risk.name || risk.title}
                            </div>
                            {risk.description && (
                              <div className="text-xs text-white/60">
                                {risk.description}
                              </div>
                            )}
                            {risk.severity && (
                              <div className="mt-2">
                                <span className={`text-xs px-2 py-1 rounded ${
                                  risk.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                  risk.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {risk.severity.toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Predictions */}
                {predictions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Predictions
                    </div>
                    {predictions.map((pred, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20"
                      >
                        <div className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-sm text-white/80">{pred.description || pred.text}</div>
                            {pred.probability && (
                              <div className="text-xs text-white/50 mt-1">
                                Probability: {Math.round(pred.probability * 100)}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Recommendations
                    </div>
                    {recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20"
                      >
                        <div className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-purple-400 mt-0.5" />
                          <div className="text-sm text-white/80">
                            {typeof rec === 'string' ? rec : rec.text || rec.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Insights */}
                {insights.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Strategic Insights
                    </div>
                    {insights.map((insight, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                      >
                        <div className="text-sm text-white/80">
                          {typeof insight === 'string' ? insight : insight.text || insight.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Data Display */}
                {data && typeof data === 'object' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                      Data
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] font-mono text-xs">
                      <pre className="text-white/70 overflow-x-auto">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
