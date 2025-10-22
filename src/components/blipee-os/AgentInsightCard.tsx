"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, ChevronRight, TrendingUp, AlertCircle, ThumbsUp, ThumbsDown, CheckCircle, X } from "lucide-react";
import { AgentInsight, AgentAction } from "@/types/conversation";
import { useRouter } from "next/navigation";

interface AgentInsightCardProps {
  insight: AgentInsight;
  index: number;
  organizationId?: string;
  onFeedback?: (feedbackType: string) => void;
}

/**
 * Agent Insight Card Component
 *
 * Displays insights from autonomous AI agents with:
 * - Smart filtering (only shows high-priority insights)
 * - Action buttons with smart navigation
 * - Abstract agent names (no "Carbon Hunter" visible to user)
 * - Beautiful gradient design matching blipee aesthetic
 *
 * ✅ PHASE 3: Frontend display for agent intelligence
 */
export function AgentInsightCard({ insight, index, organizationId, onFeedback }: AgentInsightCardProps) {
  const router = useRouter();
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackType, setFeedbackType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Abstract agent names - users don't need to know internal names
  const agentLabels: Record<string, { title: string; icon: string; color: string }> = {
    carbonHunter: {
      title: 'Carbon Optimization',
      icon: '🌱',
      color: 'from-green-500/20 to-emerald-500/20 border-green-500/30'
    },
    compliance: {
      title: 'Compliance Analysis',
      icon: '✅',
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
    },
    costSavings: {
      title: 'Cost Intelligence',
      icon: '💰',
      color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30'
    },
    esgChief: {
      title: 'Strategic Insights',
      icon: '📊',
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30'
    },
    supplyChain: {
      title: 'Supply Chain',
      icon: '🔗',
      color: 'from-indigo-500/20 to-blue-500/20 border-indigo-500/30'
    }
  };

  const agentInfo = agentLabels[insight.agent] || {
    title: 'AI Analysis',
    icon: '🤖',
    color: 'from-gray-500/20 to-slate-500/20 border-gray-500/30'
  };

  // Smart action handlers - navigate or prompt follow-up
  const handleActionClick = (action: AgentAction) => {
    switch (action.type) {
      case 'led_retrofit':
      case 'hvac_optimization':
      case 'energy_audit':
        router.push('/sustainability/energy?tab=optimization');
        break;
      case 'schedule_audit':
        // Add to chat input (would need to pass this up via callback)
        console.log('Schedule audit clicked');
        break;
      case 'review_compliance':
      case 'compliance_check':
        router.push('/sustainability/compliance');
        break;
      case 'investigate_anomaly':
      case 'anomaly_details':
        router.push('/sustainability/emissions');
        break;
      case 'cost_analysis':
        router.push('/sustainability/targets');
        break;
      default:
        // Generic: just log for now
        console.log('Action clicked:', action.type);
    }
  };

  // Handle user feedback on insights
  const handleFeedback = async (type: 'helpful' | 'already_have' | 'not_relevant' | 'completed') => {
    if (feedbackGiven || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Map feedback type to learning metadata
      const feedbackMapping = {
        helpful: { learning_type: 'user_preference', feedback: 'helpful' },
        already_have: { learning_type: 'infrastructure_exists', feedback: 'already_installed' },
        not_relevant: { learning_type: 'recommendation_rejected', feedback: 'not_relevant' },
        completed: { learning_type: 'action_completed', feedback: 'completed' }
      };

      const mapping = feedbackMapping[type];

      // Send feedback to API
      const response = await fetch('/api/ai/agent-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          agentId: insight.agent,
          recommendationType: insight.actions[0]?.type || 'general_insight',
          learningType: mapping.learning_type,
          feedback: mapping.feedback,
          confidence: type === 'helpful' ? 1.0 : 0.9,
          context: {
            summary: insight.summary,
            actionCount: insight.actions.length
          }
        })
      });

      if (response.ok) {
        setFeedbackGiven(true);
        setFeedbackType(type);
        onFeedback?.(type);
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Smart filtering - only show if priority is high enough
  const showActions = insight.actions.length > 0 && insight.confidence > 0.6;
  const showNextSteps = insight.nextSteps.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-gradient-to-br ${agentInfo.color} border backdrop-blur-sm rounded-lg p-4 mb-3`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl flex-shrink-0">{agentInfo.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
              {agentInfo.title}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {(insight.confidence * 100).toFixed(0)}% confident
            </span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {insight.summary}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="space-y-2 mb-3">
          {insight.actions.slice(0, 2).map((action, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleActionClick(action)}
              className="w-full flex items-center justify-between gap-2 p-3 bg-white/50 dark:bg-white/5 hover:bg-white/70 dark:hover:bg-white/10 border border-gray-200/50 dark:border-white/10 rounded-lg transition-all group text-left"
            >
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {action.description}
                  </p>
                  {action.impact && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      Impact: {action.impact.toFixed(1)} tCO2e/year
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
            </motion.button>
          ))}
        </div>
      )}

      {/* Next Steps */}
      {showNextSteps && (
        <div className="pt-3 border-t border-gray-200/50 dark:border-white/10">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Recommended Next Steps:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {insight.nextSteps.slice(0, 2).map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">•</span>
                <span className="flex-1">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ✅ PHASE 4: Agent Learning - Feedback Buttons */}
      {!feedbackGiven ? (
        <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Was this helpful?</p>
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFeedback('helpful')}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 rounded-full hover:bg-green-100 dark:hover:bg-green-500/20 transition-colors disabled:opacity-50"
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Helpful</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFeedback('already_have')}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3 h-3" />
              <span>Already have this</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFeedback('not_relevant')}
              disabled={isSubmitting}
              className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-500/20 rounded-full hover:bg-gray-100 dark:hover:bg-gray-500/20 transition-colors disabled:opacity-50"
            >
              <X className="w-3 h-3" />
              <span>Not relevant</span>
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-white/10">
          <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            Thanks for your feedback! The AI will learn from this.
          </p>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Agent Insights Container
 *
 * Groups all agent insights with smart filtering:
 * - Shows critical alerts at top
 * - Collapses low-priority insights
 * - Provides "View more" expansion
 */
interface AgentInsightsContainerProps {
  insights: AgentInsight[];
}

export function AgentInsightsContainer({ insights }: AgentInsightsContainerProps) {
  // Smart filtering: prioritize high-confidence insights
  const sortedInsights = [...insights].sort((a, b) => b.confidence - a.confidence);

  const criticalInsights = sortedInsights.filter(i => i.confidence >= 0.8);
  const otherInsights = sortedInsights.filter(i => i.confidence < 0.8);

  if (insights.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        <Brain className="w-4 h-4" />
        <span>AI Analysis</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({insights.length} insight{insights.length !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Critical insights - always shown */}
      {criticalInsights.map((insight, idx) => (
        <AgentInsightCard key={idx} insight={insight} index={idx} />
      ))}

      {/* Other insights - collapsed by default */}
      {otherInsights.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-2 list-none flex items-center gap-1">
            <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
            <span>View {otherInsights.length} more insight{otherInsights.length !== 1 ? 's' : ''}</span>
          </summary>
          <div className="mt-2 space-y-2">
            {otherInsights.map((insight, idx) => (
              <AgentInsightCard
                key={criticalInsights.length + idx}
                insight={insight}
                index={criticalInsights.length + idx}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
