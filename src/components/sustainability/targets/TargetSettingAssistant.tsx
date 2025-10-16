'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Target,
  ChevronRight,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Factory,
  Car,
  Zap,
  Plane,
  Trash2,
  Users,
  Package,
  TrendingDown
} from 'lucide-react';
import { targetAssistant, type DiscoveredMetric, type SuggestedMetric } from '@/lib/ai/target-setting-assistant';
import { targetDatabase } from '@/lib/ai/target-assistant-database';
import { InlineDataEntry } from './InlineDataEntry';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  metrics?: DiscoveredMetric[];
  suggestions?: SuggestedMetric[];
  nextQuestions?: string[];
  showDataEntry?: boolean;
  metricForEntry?: {
    id: string;
    name: string;
    unit: string;
    scope: number;
  };
}

interface MetricProgress {
  scope1: { discovered: number; total: number };
  scope2: { discovered: number; total: number };
  scope3: { discovered: number; total: number };
}

export function TargetSettingAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [discoveredMetrics, setDiscoveredMetrics] = useState<DiscoveredMetric[]>([]);
  const [currentScope, setCurrentScope] = useState<1 | 2 | 3>(1);
  const [progress, setProgress] = useState<MetricProgress>({
    scope1: { discovered: 0, total: 4 },
    scope2: { discovered: 0, total: 2 },
    scope3: { discovered: 0, total: 15 }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start the conversation
    initializeConversation();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeConversation = async () => {
    const welcomeMessage = await targetAssistant.startDiscovery();
    setMessages([{
      id: '1',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Process with AI
    const response = await targetAssistant.processResponse(input);

    // Update discovered metrics
    if (response.metrics) {
      setDiscoveredMetrics(prev => [...prev, ...response.metrics]);
      updateProgress(response.metrics);
    }

    // Check if we should prompt for data entry
    let shouldShowDataEntry = false;
    let metricForEntry = null;

    if (response.metrics && response.metrics.length > 0) {
      // Map discovered metric to database
      const firstMetric = response.metrics[0];
      const dbMetric = await targetDatabase.mapDiscoveredToDatabase(firstMetric.name, firstMetric.scope);

      if (dbMetric) {
        shouldShowDataEntry = true;
        metricForEntry = {
          id: dbMetric.id,
          name: dbMetric.name,
          unit: dbMetric.unit,
          scope: firstMetric.scope
        };

        // Add metric to organization
        await targetDatabase.addMetricToOrganization(
          'current-org-id', // This would come from auth context
          dbMetric.id
        );
      }
    }

    // Add assistant response
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      metrics: response.metrics,
      suggestions: response.suggestions,
      nextQuestions: response.nextQuestions,
      showDataEntry: shouldShowDataEntry,
      metricForEntry: metricForEntry
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const updateProgress = (newMetrics: DiscoveredMetric[]) => {
    setProgress(prev => {
      const updated = { ...prev };
      newMetrics.forEach(metric => {
        if (metric.scope === 1) {
          updated.scope1.discovered = Math.min(updated.scope1.discovered + 1, updated.scope1.total);
        } else if (metric.scope === 2) {
          updated.scope2.discovered = Math.min(updated.scope2.discovered + 1, updated.scope2.total);
        } else if (metric.scope === 3) {
          updated.scope3.discovered = Math.min(updated.scope3.discovered + 1, updated.scope3.total);
        }
      });
      return updated;
    });
  };

  const handleQuickResponse = (response: string) => {
    setInput(response);
    handleSend();
  };

  const getScopeIcon = (scope: number) => {
    switch (scope) {
      case 1: return <Factory className="w-4 h-4" />;
      case 2: return <Zap className="w-4 h-4" />;
      case 3: return <Package className="w-4 h-4" />;
      default: return null;
    }
  };

  const getScopeColor = (scope: number) => {
    switch (scope) {
      case 1: return 'from-orange-500 to-red-500';
      case 2: return 'from-blue-500 to-cyan-500';
      case 3: return 'from-purple-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="flex h-[800px] gap-6">
      {/* Left Panel - Conversation */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">AI Target Assistant</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Discovering all emission sources</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Powered by AI</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className={`flex items-start gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}>
                      {message.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                    </div>
                    <div>
                      <div className={`p-4 rounded-xl ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-purple-500/20'
                          : 'bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                      }`}>
                        <p className="text-gray-900 dark:text-white whitespace-pre-line">{message.content}</p>
                      </div>

                      {/* Show discovered metrics */}
                      {message.metrics && message.metrics.length > 0 && (
                        <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              Discovered {message.metrics.length} emission source{message.metrics.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {message.metrics.map((metric, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                {getScopeIcon(metric.scope)}
                                <span>Scope {metric.scope}: {metric.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Show suggestions */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Suggestions</span>
                          </div>
                          <div className="space-y-2">
                            {message.suggestions.map((suggestion, idx) => (
                              <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                                <div className="font-medium">{suggestion.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{suggestion.rationale}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inline Data Entry */}
                      {message.showDataEntry && message.metricForEntry && (
                        <div className="mt-3">
                          <InlineDataEntry
                            metricId={message.metricForEntry.id}
                            metricName={message.metricForEntry.name}
                            unit={message.metricForEntry.unit}
                            scope={message.metricForEntry.scope}
                            onDataSubmit={(value) => {
                            }}
                            onSkip={() => {
                            }}
                          />
                        </div>
                      )}

                      {/* Quick response buttons */}
                      {message.nextQuestions && message.nextQuestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.nextQuestions.slice(0, 3).map((question, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleQuickResponse(question)}
                              className="w-full text-left p-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all flex items-center gap-2"
                            >
                              <ChevronRight className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-700 dark:text-gray-300">{question}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-gray-500 dark:text-gray-400"
            >
              <Bot className="w-5 h-5" />
              <span className="text-sm">AI is thinking...</span>
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Tell me about your organization..."
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-white placeholder-gray-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Discovery Progress */}
      <div className="w-96 space-y-4">
        {/* Progress Overview */}
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Discovery Progress</h3>

          {/* Scope Progress */}
          <div className="space-y-4">
            {[
              { scope: 1, label: 'Direct Emissions', icon: Factory, progress: progress.scope1 },
              { scope: 2, label: 'Energy', icon: Zap, progress: progress.scope2 },
              { scope: 3, label: 'Value Chain', icon: Package, progress: progress.scope3 }
            ].map((item) => {
              const Icon = item.icon;
              const percentage = (item.progress.discovered / item.progress.total) * 100;

              return (
                <div key={item.scope} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getScopeColor(item.scope)} p-1.5`}>
                        <Icon className="w-full h-full text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Scope {item.scope}: {item.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {item.progress.discovered} of {item.progress.total} categories
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full bg-gradient-to-r ${getScopeColor(item.scope)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overall Progress */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">Overall Discovery</span>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                {discoveredMetrics.length} metrics found
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Continue the conversation to discover more emission sources
            </div>
          </div>
        </div>

        {/* Discovered Metrics Summary */}
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Discovered Metrics</h3>

          {discoveredMetrics.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Start the conversation to discover your emission sources
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {discoveredMetrics.map((metric, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${getScopeColor(metric.scope)} p-1 flex-shrink-0`}>
                      {getScopeIcon(metric.scope)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {metric.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Scope {metric.scope} • {metric.category}
                      </div>
                      {metric.dataAvailable && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          <span className="text-xs text-green-600 dark:text-green-400">Data available</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Next Steps</h3>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-purple-500 mt-0.5" />
              <span>Complete discovery to identify all emission sources</span>
            </div>
            <div className="flex items-start gap-2">
              <TrendingDown className="w-4 h-4 text-purple-500 mt-0.5" />
              <span>Set science-based targets for each scope</span>
            </div>
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-500 mt-0.5" />
              <span>Get AI-powered reduction recommendations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}