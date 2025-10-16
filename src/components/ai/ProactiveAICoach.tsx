'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  ChevronRight,
  X,
  HelpCircle,
  Lightbulb,
  Target,
  TrendingUp,
  BookOpen,
  Award,
  Play,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Send,
  ThumbsUp,
  ThumbsDown,
  Calendar
} from 'lucide-react';

interface ProactiveAICoachProps {
  userId: string;
  organizationId: string;
  userExperience?: 'new' | 'intermediate' | 'expert';
  onInteraction?: (action: string) => void;
}

interface CoachMessage {
  id: string;
  type: 'tip' | 'question' | 'achievement' | 'alert' | 'tutorial';
  title: string;
  content: string;
  actions?: {
    label: string;
    action: string;
    primary?: boolean;
  }[];
  icon?: React.ReactNode;
  priority?: 'low' | 'medium' | 'high';
}

export function ProactiveAICoach({
  userId,
  organizationId,
  userExperience = 'new',
  onInteraction
}: ProactiveAICoachProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<CoachMessage | null>(null);
  const [messageQueue, setMessageQueue] = useState<CoachMessage[]>([]);
  const [userLevel, setUserLevel] = useState(1);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [quickReply, setQuickReply] = useState('');

  useEffect(() => {
    // Initialize coach based on user experience
    initializeCoach();
  }, [userExperience]);

  useEffect(() => {
    // Process message queue
    if (!currentMessage && messageQueue.length > 0 && isOpen) {
      const nextMessage = messageQueue[0];
      setCurrentMessage(nextMessage);
      setMessageQueue(prev => prev.slice(1));
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1000);
    }
  }, [currentMessage, messageQueue, isOpen]);

  const initializeCoach = () => {
    const messages: CoachMessage[] = [];

    if (userExperience === 'new') {
      // First time user - progressive disclosure
      messages.push({
        id: 'welcome',
        type: 'tutorial',
        title: "👋 Welcome! I'm your AI Sustainability Coach",
        content: "I've noticed this is your first time here. I have 8 AI employees ready to help you achieve sustainability excellence. Want me to show you around?",
        actions: [
          { label: "Yes, show me!", action: "start_tour", primary: true },
          { label: "I'll explore myself", action: "skip_tour" }
        ],
        icon: <Bot className="w-5 h-5" />,
        priority: 'high'
      });

      messages.push({
        id: 'first_capability',
        type: 'tip',
        title: "💡 Did you know?",
        content: "You can just type naturally and I'll understand. Try: 'What were my emissions last month?' or 'How can I reduce energy costs?'",
        icon: <Lightbulb className="w-5 h-5" />,
        priority: 'medium'
      });

    } else if (userExperience === 'intermediate') {
      // Returning user - show what's new
      messages.push({
        id: 'whats_new',
        type: 'tip',
        title: "🚀 New Capabilities Unlocked",
        content: "Your AI team has learned new skills! We can now predict equipment failures 2 weeks in advance and identify supply chain risks automatically.",
        actions: [
          { label: "Show me", action: "show_new_features", primary: true }
        ],
        icon: <Sparkles className="w-5 h-5" />,
        priority: 'medium'
      });
    }

    // Add context-aware messages based on day of month
    const dayOfMonth = new Date().getDate();

    if (dayOfMonth === 15) {
      messages.push({
        id: 'data_day',
        type: 'alert',
        title: "📊 New Data Has Arrived!",
        content: "Your monthly data is here! I'm analyzing it now. Initial findings: 3 anomalies detected and $5,000 in savings opportunities identified.",
        actions: [
          { label: "View Analysis", action: "view_monthly_analysis", primary: true },
          { label: "Quick Summary", action: "get_summary" }
        ],
        icon: <AlertCircle className="w-5 h-5" />,
        priority: 'high'
      });
    } else if (dayOfMonth < 15) {
      messages.push({
        id: 'pre_data',
        type: 'tip',
        title: `📅 ${15 - dayOfMonth} Days Until New Data`,
        content: "While we wait, I'm analyzing historical patterns. I found 3 recurring issues we can address proactively.",
        actions: [
          { label: "Show Issues", action: "show_patterns" }
        ],
        icon: <TrendingUp className="w-5 h-5" />,
        priority: 'low'
      });
    }

    setMessageQueue(messages);

    // Auto-open for new users
    if (userExperience === 'new') {
      setTimeout(() => setIsOpen(true), 2000);
    }
  };

  const handleAction = (action: string) => {
    onInteraction?.(action);

    // Handle specific actions
    switch (action) {
      case 'start_tour':
        startGuidedTour();
        break;
      case 'show_new_features':
        showNewFeatures();
        break;
      case 'view_monthly_analysis':
        viewMonthlyAnalysis();
        break;
      default:
        break;
    }
  };

  const startGuidedTour = () => {
    const tourMessages: CoachMessage[] = [
      {
        id: 'tour_1',
        type: 'tutorial',
        title: "Step 1: Ask Me Anything",
        content: "I understand natural language. No need for specific commands. Just ask what you want to know!",
        icon: <MessageCircle className="w-5 h-5" />
      },
      {
        id: 'tour_2',
        type: 'tutorial',
        title: "Step 2: Your AI Team",
        content: "You have 8 AI employees working 24/7:\n• Carbon Hunter - finds emissions\n• Cost Saver - reduces expenses\n• Compliance Guardian - ensures regulations\nAnd 5 more specialists!",
        icon: <Bot className="w-5 h-5" />
      },
      {
        id: 'tour_3',
        type: 'tutorial',
        title: "Step 3: Monthly Rituals",
        content: "Every 15th, new data arrives and triggers comprehensive analysis. I'll notify you of important findings automatically.",
        icon: <Calendar className="w-5 h-5" />
      },
      {
        id: 'tour_4',
        type: 'achievement',
        title: "🎉 Tutorial Complete!",
        content: "You're ready to start! Try asking: 'What should I focus on today?'",
        icon: <Award className="w-5 h-5" />
      }
    ];

    setMessageQueue(tourMessages);
    setAchievements(prev => [...prev, 'tutorial_complete']);
    setUserLevel(2);
  };

  const showNewFeatures = () => {
    setMessageQueue([
      {
        id: 'feature_1',
        type: 'tip',
        title: "🔮 Predictive Maintenance",
        content: "I now monitor equipment patterns and predict failures before they happen. Currently tracking 12 assets.",
        icon: <Target className="w-5 h-5" />
      },
      {
        id: 'feature_2',
        type: 'tip',
        title: "🔗 Supply Chain Intelligence",
        content: "Automatic risk assessment of all suppliers. 3 suppliers flagged for high emissions.",
        icon: <AlertCircle className="w-5 h-5" />
      }
    ]);
  };

  const viewMonthlyAnalysis = () => {
    // This would navigate to the analysis page
  };

  const handleQuickReply = () => {
    if (!quickReply.trim()) return;

    onInteraction?.(`chat: ${quickReply}`);

    setQuickReply('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      setMessageQueue(prev => [...prev, {
        id: `response_${Date.now()}`,
        type: 'tip',
        title: "AI Response",
        content: "Based on your question, I've analyzed the data and found...",
        icon: <Bot className="w-5 h-5" />
      }]);
      setIsTyping(false);
    }, 2000);
  };

  const dismissMessage = () => {
    if (currentMessage) {
      setDismissedMessages(prev => [...prev, currentMessage.id]);
      setCurrentMessage(null);
    }
  };

  return (
    <>
      {/* Floating Coach Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
      >
        <Bot className="w-7 h-7 text-white" />
        {messageQueue.length > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {messageQueue.length}
          </span>
        )}
      </motion.button>

      {/* Coach Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100, y: 100 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -100, y: 100 }}
            className="fixed bottom-24 left-6 z-50 w-96 bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-xl shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">AI Coach</div>
                    <div className="text-xs text-gray-400">Level {userLevel} • {achievements.length} achievements</div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              {currentMessage ? (
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    {currentMessage.icon && (
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        {currentMessage.icon}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-white mb-1">
                        {currentMessage.title}
                      </h3>
                      {isTyping ? (
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      ) : (
                        <p className="text-sm text-gray-300 whitespace-pre-line">
                          {currentMessage.content}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {currentMessage.actions && !isTyping && (
                    <div className="flex gap-2 mb-3">
                      {currentMessage.actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAction(action.action)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                            action.primary
                              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:shadow-lg'
                              : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Feedback */}
                  {!isTyping && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                      <span className="text-xs text-gray-500">Was this helpful?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setAchievements(prev => [...prev, 'helpful_feedback']);
                            dismissMessage();
                          }}
                          className="p-1.5 hover:bg-gray-800 rounded transition-all"
                        >
                          <ThumbsUp className="w-4 h-4 text-gray-400 hover:text-green-400" />
                        </button>
                        <button
                          onClick={dismissMessage}
                          className="p-1.5 hover:bg-gray-800 rounded transition-all"
                        >
                          <ThumbsDown className="w-4 h-4 text-gray-400 hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No new messages</p>
                  <p className="text-xs mt-1">Ask me anything!</p>
                </div>
              )}
            </div>

            {/* Quick Reply */}
            <div className="p-3 border-t border-gray-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickReply}
                  onChange={(e) => setQuickReply(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuickReply()}
                  placeholder="Ask me anything..."
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleQuickReply}
                  disabled={!quickReply.trim()}
                  className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Indicator */}
            {messageQueue.length > 0 && (
              <div className="px-4 py-2 bg-purple-900/20 border-t border-purple-500/20">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-400">
                    {messageQueue.length} more {messageQueue.length === 1 ? 'tip' : 'tips'} waiting
                  </span>
                  <button
                    onClick={() => setCurrentMessage(null)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}