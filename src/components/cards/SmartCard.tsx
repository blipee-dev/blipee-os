'use client';

/**
 * SmartCard Component - Base card for Zero-Typing System
 * Interactive, intelligent cards that respond to taps and adapt to context
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeable } from 'react-swipeable';
import { cn } from '@/lib/utils';
import { masterContext } from '@/lib/context/master-context-engine';
import { useCardStore } from '@/lib/state/card-store';
import {
  MoreVertical,
  Pin,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export type CardType = 'metric' | 'chart' | 'alert' | 'agent' | 'action' | 'workflow' | 'insight' | 'status';
export type CardSize = 'small' | 'medium' | 'large' | 'full';
export type CardPriority = 1 | 2 | 3 | 4 | 5;

export interface CardData {
  id: string;
  type: CardType;
  title: string;
  subtitle?: string;
  value?: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  alert?: {
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  };
  chart?: any; // Chart data
  actions?: CardAction[];
  lastUpdated?: Date;
  agentId?: string;
  metadata?: Record<string, any>;
}

export interface CardAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger';
}

export interface CardLayout {
  size: CardSize;
  columns?: 1 | 2 | 3 | 4;
  aspectRatio?: 'square' | 'wide' | 'tall';
  color?: string;
}

export interface SmartCardProps {
  data: CardData;
  layout?: CardLayout;
  priority?: CardPriority;
  onTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export function SmartCard({
  data,
  layout = { size: 'medium' },
  priority = 3,
  onTap,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  className
}: SmartCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const cardRef = useRef<HTMLDivElement>(null);

  const { selectCard, pinCard, unpinCard, removeCard } = useCardStore();

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (onSwipeLeft) {
        onSwipeLeft();
      } else {
        handleDismiss();
      }
    },
    onSwipedRight: () => {
      if (onSwipeRight) {
        onSwipeRight();
      } else {
        handlePin();
      }
    },
    delta: 50,
    trackMouse: false
  });

  // Touch handlers for long press
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress();
      } else {
        setShowOptions(true);
      }
      // Haptic feedback (if available)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  }, [onLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  // Click handler
  const handleClick = useCallback(() => {
    // Record interaction
    masterContext.recordUserAction({
      timestamp: new Date(),
      action: 'tap',
      target: data.id,
      context: { cardType: data.type, cardTitle: data.title }
    });

    if (onTap) {
      onTap();
    } else {
      selectCard(data.id);
      setIsExpanded(!isExpanded);
    }
  }, [data, onTap, selectCard, isExpanded]);

  // Pin/unpin handler
  const handlePin = useCallback(() => {
    setIsPinned(!isPinned);
    if (!isPinned) {
      pinCard(data.id);
    } else {
      unpinCard(data.id);
    }
  }, [isPinned, data.id, pinCard, unpinCard]);

  // Dismiss handler
  const handleDismiss = useCallback(() => {
    removeCard(data.id);
  }, [data.id, removeCard]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    // Simulate refresh - in production, this would fetch new data
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  }, []);

  // Execute card action
  const handleAction = useCallback(async (action: CardAction) => {
    try {
      setIsLoading(true);
      await action.action();

      // Record action
      masterContext.recordUserAction({
        timestamp: new Date(),
        action: 'card_action',
        target: action.id,
        context: { cardId: data.id, actionLabel: action.label }
      });
    } catch (error) {
      console.error('Card action failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [data.id]);

  // Render card content based on type
  const renderContent = () => {
    switch (data.type) {
      case 'metric':
        return <MetricContent data={data} />;
      case 'chart':
        return <ChartContent data={data} />;
      case 'alert':
        return <AlertContent data={data} />;
      case 'agent':
        return <AgentContent data={data} />;
      case 'action':
        return <ActionContent data={data} onAction={handleAction} />;
      default:
        return <DefaultContent data={data} />;
    }
  };

  // Get size classes
  const getSizeClasses = () => {
    switch (layout.size) {
      case 'small':
        return 'col-span-1 row-span-1';
      case 'medium':
        return 'col-span-2 row-span-1';
      case 'large':
        return 'col-span-2 row-span-2';
      case 'full':
        return 'col-span-4 row-span-2';
      default:
        return 'col-span-2 row-span-1';
    }
  };

  // Get priority indicator color
  const getPriorityColor = () => {
    if (priority === 1) return 'border-red-500/50';
    if (priority === 2) return 'border-orange-500/50';
    return 'border-white/10';
  };

  return (
    <motion.div
      {...handlers}
      ref={cardRef}
      className={cn(
        'relative group',
        getSizeClasses(),
        className
      )}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
    >
      <div
        className={cn(
          'h-full p-4 rounded-xl border-2 transition-all duration-200',
          'bg-white/[0.03] backdrop-blur-xl',
          getPriorityColor(),
          isExpanded && 'ring-2 ring-blue-500/50',
          isPinned && 'ring-2 ring-yellow-500/50',
          isLoading && 'opacity-50 pointer-events-none'
        )}
        style={{
          backgroundColor: layout.color ? `${layout.color}20` : undefined
        }}
      >
        {/* Card Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white/90 line-clamp-1">
              {data.title}
            </h3>
            {data.subtitle && (
              <p className="text-xs text-white/60 mt-1 line-clamp-1">
                {data.subtitle}
              </p>
            )}
          </div>

          {/* Card Controls */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isPinned && (
              <Pin className="w-3 h-3 text-yellow-500" />
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <RefreshCw className={cn(
                "w-3 h-3 text-white/60",
                isLoading && "animate-spin"
              )} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions(!showOptions);
              }}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <MoreVertical className="w-3 h-3 text-white/60" />
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="relative">
          {renderContent()}
        </div>

        {/* Quick Actions */}
        {data.actions && data.actions.length > 0 && (
          <div className="mt-3 flex gap-2">
            {data.actions.slice(0, isExpanded ? undefined : 2).map(action => (
              <button
                key={action.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction(action);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-lg transition-all",
                  "hover:scale-105 active:scale-95",
                  action.variant === 'primary' && "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
                  action.variant === 'secondary' && "bg-white/10 text-white/70 hover:bg-white/20",
                  action.variant === 'danger' && "bg-red-500/20 text-red-400 hover:bg-red-500/30",
                  !action.variant && "bg-white/10 text-white/70 hover:bg-white/20"
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && data.metadata && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <ExpandedContent data={data} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Options Menu */}
        <AnimatePresence>
          {showOptions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-12 right-2 bg-black/90 backdrop-blur-xl rounded-lg border border-white/20 p-2 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handlePin}
                className="w-full px-3 py-2 text-xs text-left hover:bg-white/10 rounded transition-colors flex items-center gap-2"
              >
                <Pin className="w-3 h-3" />
                {isPinned ? 'Unpin' : 'Pin'} Card
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-3 py-2 text-xs text-left hover:bg-white/10 rounded transition-colors flex items-center gap-2"
              >
                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                {isExpanded ? 'Collapse' : 'Expand'}
              </button>
              <button
                onClick={handleDismiss}
                className="w-full px-3 py-2 text-xs text-left hover:bg-white/10 rounded transition-colors flex items-center gap-2 text-red-400"
              >
                <X className="w-3 h-3" />
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Priority Indicator */}
        {priority <= 2 && (
          <div className={cn(
            "absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse",
            priority === 1 && "bg-red-500",
            priority === 2 && "bg-orange-500"
          )} />
        )}

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center"
            >
              <RefreshCw className="w-6 h-6 text-white animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Content Components for different card types

function MetricContent({ data }: { data: CardData }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">
          {data.value}
        </span>
        {data.unit && (
          <span className="text-sm text-white/60">{data.unit}</span>
        )}
      </div>

      {data.trend && (
        <div className="flex items-center gap-1">
          {data.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
          {data.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
          {data.trendValue !== undefined && (
            <span className={cn(
              "text-xs font-medium",
              data.trend === 'up' && "text-green-400",
              data.trend === 'down' && "text-red-400",
              data.trend === 'stable' && "text-white/60"
            )}>
              {data.trendValue > 0 && '+'}{data.trendValue}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function ChartContent({ data }: { data: CardData }) {
  // Placeholder for chart
  return (
    <div className="h-32 bg-white/5 rounded-lg flex items-center justify-center">
      <span className="text-xs text-white/40">Chart: {data.title}</span>
    </div>
  );
}

function AlertContent({ data }: { data: CardData }) {
  const getAlertIcon = () => {
    switch (data.alert?.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="flex items-start gap-3">
      {getAlertIcon()}
      <div className="flex-1">
        <p className="text-sm text-white/80">{data.alert?.message}</p>
      </div>
    </div>
  );
}

function AgentContent({ data }: { data: CardData }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-white">{data.value || 'Active'}</span>
        <span className="text-xs text-white/60">Agent: {data.agentId}</span>
      </div>
      {data.metadata?.status && (
        <div className="text-xs text-white/60">
          Status: {data.metadata.status}
        </div>
      )}
    </div>
  );
}

function ActionContent({ data, onAction }: { data: CardData; onAction: (action: CardAction) => void }) {
  return (
    <div className="space-y-2">
      {data.actions?.map(action => (
        <button
          key={action.id}
          onClick={(e) => {
            e.stopPropagation();
            onAction(action);
          }}
          className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white/80 transition-colors"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function DefaultContent({ data }: { data: CardData }) {
  return (
    <div className="text-sm text-white/70">
      {data.value || 'No data available'}
    </div>
  );
}

function ExpandedContent({ data }: { data: CardData }) {
  return (
    <div className="space-y-2">
      {Object.entries(data.metadata || {}).map(([key, value]) => (
        <div key={key} className="flex justify-between text-xs">
          <span className="text-white/60 capitalize">{key.replace(/_/g, ' ')}:</span>
          <span className="text-white/80">{String(value)}</span>
        </div>
      ))}
      {data.lastUpdated && (
        <div className="text-xs text-white/40 pt-2 border-t border-white/10">
          Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}