/**
 * Zero-Typing Navigation System for BLIPEE OS
 * Navigate the entire app without writing a single message
 * Uses: Clicks, Voice, Gestures, Visual Cards, and Smart Predictions
 */

import React from 'react';

// ===================================================================
// 1. VISUAL QUERY CARDS INTERFACE
// ===================================================================

export interface VisualQueryCard {
  id: string;
  icon: string;
  emoji: string;
  title: string;
  subtitle: string;
  query: string;
  color: string;
  animation?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  badge?: {
    text: string;
    color: string;
  };
}

/**
 * Home Screen - Visual Dashboard Cards
 * Users click cards to navigate without typing
 */
export const HOME_SCREEN_CARDS: VisualQueryCard[] = [
  {
    id: 'overview',
    icon: 'dashboard',
    emoji: '📊',
    title: 'Overview',
    subtitle: 'Complete sustainability status',
    query: 'Give me a complete overview of our sustainability status',
    color: 'gradient-purple',
    animation: 'pulse'
  },
  {
    id: 'emissions-now',
    icon: 'co2',
    emoji: '🌍',
    title: 'Emissions',
    subtitle: 'Current carbon footprint',
    query: 'What are our current total emissions?',
    color: 'gradient-green',
    badge: {
      text: '↓ 12%',
      color: 'green'
    }
  },
  {
    id: 'energy-live',
    icon: 'bolt',
    emoji: '⚡',
    title: 'Energy',
    subtitle: 'Real-time consumption',
    query: 'Show me current energy consumption',
    color: 'gradient-yellow',
    animation: 'live-pulse'
  },
  {
    id: 'alerts',
    icon: 'alert',
    emoji: '🚨',
    title: 'Alerts',
    subtitle: '3 items need attention',
    query: 'Show me all critical alerts and issues',
    color: 'gradient-red',
    urgency: 'high',
    badge: {
      text: '3',
      color: 'red'
    }
  },
  {
    id: 'ai-agents',
    icon: 'robot',
    emoji: '🤖',
    title: 'AI Agents',
    subtitle: 'Your digital workforce',
    query: 'What are my AI agents doing?',
    color: 'gradient-blue',
    animation: 'thinking'
  },
  {
    id: 'quick-actions',
    icon: 'zap',
    emoji: '⚡',
    title: 'Quick Actions',
    subtitle: 'One-click improvements',
    query: 'Show me quick wins I can implement now',
    color: 'gradient-orange'
  }
];

// ===================================================================
// 2. INTERACTIVE NAVIGATION FLOWS
// ===================================================================

export interface NavigationFlow {
  id: string;
  name: string;
  description: string;
  steps: NavigationStep[];
}

export interface NavigationStep {
  type: 'choice' | 'action' | 'display' | 'confirm';
  content: any;
  options?: NavigationOption[];
  nextStep?: string;
}

export interface NavigationOption {
  id: string;
  label: string;
  icon: string;
  color: string;
  query: string;
  nextFlow?: string;
}

/**
 * Guided Flows - Step-by-step navigation without typing
 */
export const GUIDED_FLOWS: NavigationFlow[] = [
  {
    id: 'emissions-explorer',
    name: 'Emissions Explorer',
    description: 'Explore emissions without typing',
    steps: [
      {
        type: 'choice',
        content: {
          title: 'What would you like to see?',
          description: 'Choose an emissions view'
        },
        options: [
          {
            id: 'total',
            label: 'Total Emissions',
            icon: '🌍',
            color: 'green',
            query: 'Show total emissions'
          },
          {
            id: 'by-scope',
            label: 'By Scope (1,2,3)',
            icon: '📊',
            color: 'blue',
            query: 'Break down emissions by scope'
          },
          {
            id: 'by-site',
            label: 'By Location',
            icon: '📍',
            color: 'purple',
            query: 'Show emissions by site'
          },
          {
            id: 'trends',
            label: 'Trends Over Time',
            icon: '📈',
            color: 'orange',
            query: 'Show emission trends'
          }
        ]
      }
    ]
  },
  {
    id: 'problem-solver',
    name: 'Problem Solver',
    description: 'Fix issues through guided clicks',
    steps: [
      {
        type: 'choice',
        content: {
          title: 'What needs attention?',
          description: 'Select the type of issue'
        },
        options: [
          {
            id: 'high-emissions',
            label: 'High Emissions',
            icon: '⚠️',
            color: 'red',
            query: 'Why are emissions high?',
            nextFlow: 'emissions-reduction'
          },
          {
            id: 'device-offline',
            label: 'Device Offline',
            icon: '🔌',
            color: 'yellow',
            query: 'Show offline devices'
          },
          {
            id: 'compliance',
            label: 'Compliance Issue',
            icon: '📋',
            color: 'orange',
            query: 'Show compliance gaps'
          },
          {
            id: 'cost-overrun',
            label: 'High Costs',
            icon: '💰',
            color: 'red',
            query: 'Where can we save money?'
          }
        ]
      }
    ]
  }
];

// ===================================================================
// 3. VOICE COMMAND SHORTCUTS
// ===================================================================

export interface VoiceCommand {
  phrases: string[];
  action: string;
  query: string;
  gesture?: string;
}

export const VOICE_COMMANDS: VoiceCommand[] = [
  {
    phrases: ['overview', 'status', 'summary'],
    action: 'show-overview',
    query: 'Give me complete overview',
    gesture: 'swipe-up'
  },
  {
    phrases: ['emissions', 'carbon', 'CO2'],
    action: 'show-emissions',
    query: 'Show current emissions',
    gesture: 'tap-earth'
  },
  {
    phrases: ['help', 'assist', 'guide'],
    action: 'activate-assistant',
    query: 'How can I improve sustainability?',
    gesture: 'long-press'
  },
  {
    phrases: ['urgent', 'critical', 'alert'],
    action: 'show-alerts',
    query: 'Show critical issues',
    gesture: 'shake'
  }
];

// ===================================================================
// 4. GESTURE-BASED NAVIGATION
// ===================================================================

export interface GestureAction {
  gesture: string;
  action: string;
  query: string;
  hapticFeedback: boolean;
}

export const GESTURE_CONTROLS: GestureAction[] = [
  {
    gesture: 'swipe-right',
    action: 'next-metric',
    query: 'Show next metric',
    hapticFeedback: true
  },
  {
    gesture: 'swipe-left',
    action: 'previous-metric',
    query: 'Show previous metric',
    hapticFeedback: true
  },
  {
    gesture: 'pinch-zoom',
    action: 'time-range',
    query: 'Change time range',
    hapticFeedback: false
  },
  {
    gesture: 'double-tap',
    action: 'drill-down',
    query: 'Show more details',
    hapticFeedback: true
  },
  {
    gesture: '3d-touch',
    action: 'quick-actions',
    query: 'Show quick actions menu',
    hapticFeedback: true
  }
];

// ===================================================================
// 5. SMART BUTTON INTERFACE
// ===================================================================

export interface SmartButton {
  id: string;
  type: 'primary' | 'secondary' | 'floating' | 'contextual';
  label: string;
  icon: string;
  query: string;
  position?: string;
  conditions?: any;
}

/**
 * Context-Aware Buttons that appear based on current screen
 */
export const SMART_BUTTONS: SmartButton[] = [
  {
    id: 'compare',
    type: 'contextual',
    label: 'Compare',
    icon: '⚖️',
    query: 'Compare to last period',
    conditions: {
      screenType: 'metric-display'
    }
  },
  {
    id: 'predict',
    type: 'contextual',
    label: 'Predict',
    icon: '🔮',
    query: 'Predict future values',
    conditions: {
      screenType: 'trend-chart'
    }
  },
  {
    id: 'optimize',
    type: 'floating',
    label: 'Optimize',
    icon: '✨',
    query: 'Optimize this metric',
    position: 'bottom-right'
  },
  {
    id: 'explain',
    type: 'secondary',
    label: 'Explain',
    icon: '💡',
    query: 'Explain what this means'
  }
];

// ===================================================================
// 6. VISUAL MENU TREES
// ===================================================================

export interface MenuNode {
  id: string;
  label: string;
  icon: string;
  query: string;
  children?: MenuNode[];
}

/**
 * Hierarchical Visual Menu - Click to Navigate
 */
export const VISUAL_MENU_TREE: MenuNode = {
  id: 'root',
  label: 'BLIPEE OS',
  icon: '🏢',
  query: 'Show main menu',
  children: [
    {
      id: 'monitor',
      label: 'Monitor',
      icon: '👁️',
      query: 'Show monitoring options',
      children: [
        {
          id: 'live-data',
          label: 'Live Data',
          icon: '📡',
          query: 'Show real-time data'
        },
        {
          id: 'historical',
          label: 'Historical',
          icon: '📅',
          query: 'Show historical data'
        },
        {
          id: 'predictions',
          label: 'Predictions',
          icon: '🔮',
          query: 'Show predictions'
        }
      ]
    },
    {
      id: 'analyze',
      label: 'Analyze',
      icon: '🔍',
      query: 'Show analysis options',
      children: [
        {
          id: 'benchmarks',
          label: 'Benchmarks',
          icon: '📊',
          query: 'Compare to benchmarks'
        },
        {
          id: 'anomalies',
          label: 'Anomalies',
          icon: '⚠️',
          query: 'Find anomalies'
        },
        {
          id: 'patterns',
          label: 'Patterns',
          icon: '🔄',
          query: 'Identify patterns'
        }
      ]
    },
    {
      id: 'act',
      label: 'Act',
      icon: '🎯',
      query: 'Show actions',
      children: [
        {
          id: 'quick-wins',
          label: 'Quick Wins',
          icon: '⚡',
          query: 'Show quick wins'
        },
        {
          id: 'initiatives',
          label: 'Initiatives',
          icon: '🚀',
          query: 'Manage initiatives'
        },
        {
          id: 'automate',
          label: 'Automate',
          icon: '🤖',
          query: 'Setup automation'
        }
      ]
    }
  ]
};

// ===================================================================
// 7. INTERACTIVE WIDGETS
// ===================================================================

export interface InteractiveWidget {
  type: 'slider' | 'toggle' | 'picker' | 'wheel' | 'dial';
  id: string;
  label: string;
  queryTemplate: string;
  options?: any;
}

/**
 * Interactive Controls - Adjust without typing
 */
export const INTERACTIVE_WIDGETS: InteractiveWidget[] = [
  {
    type: 'slider',
    id: 'time-range',
    label: 'Time Period',
    queryTemplate: 'Show data for {value}',
    options: {
      values: ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'],
      default: 'This Month'
    }
  },
  {
    type: 'toggle',
    id: 'comparison',
    label: 'Compare Mode',
    queryTemplate: 'Toggle comparison {value}',
    options: {
      on: 'Compare to previous period',
      off: 'Show absolute values'
    }
  },
  {
    type: 'picker',
    id: 'metric-selector',
    label: 'Select Metric',
    queryTemplate: 'Show {value} metric',
    options: {
      choices: ['Emissions', 'Energy', 'Water', 'Waste', 'Costs']
    }
  },
  {
    type: 'wheel',
    id: 'scope-selector',
    label: 'Emission Scope',
    queryTemplate: 'Show scope {value} emissions',
    options: {
      segments: ['Scope 1', 'Scope 2', 'Scope 3', 'All Scopes']
    }
  }
];

// ===================================================================
// 8. SMART RECOMMENDATIONS ENGINE
// ===================================================================

export interface SmartRecommendation {
  id: string;
  trigger: string;
  cards: VisualQueryCard[];
}

/**
 * Contextual Recommendations based on user behavior
 */
export const SMART_RECOMMENDATIONS: SmartRecommendation[] = [
  {
    id: 'morning-routine',
    trigger: 'time:morning',
    cards: [
      {
        id: 'morning-1',
        icon: '☀️',
        emoji: '☀️',
        title: 'Morning Check',
        subtitle: 'Start your day right',
        query: 'Show overnight anomalies and alerts',
        color: 'gradient-sunrise'
      },
      {
        id: 'morning-2',
        icon: '📊',
        emoji: '📊',
        title: "Today's Goals",
        subtitle: 'What to focus on',
        query: 'Show today sustainability targets',
        color: 'gradient-blue'
      }
    ]
  },
  {
    id: 'high-emissions-detected',
    trigger: 'alert:high-emissions',
    cards: [
      {
        id: 'diagnose',
        icon: '🔍',
        emoji: '🔍',
        title: 'Diagnose Issue',
        subtitle: 'Find root cause',
        query: 'Why are emissions high?',
        color: 'gradient-red',
        urgency: 'high'
      },
      {
        id: 'fix-now',
        icon: '🔧',
        emoji: '🔧',
        title: 'Fix Now',
        subtitle: 'Immediate actions',
        query: 'How to reduce emissions immediately?',
        color: 'gradient-orange',
        urgency: 'high'
      }
    ]
  },
  {
    id: 'end-of-month',
    trigger: 'date:month-end',
    cards: [
      {
        id: 'month-report',
        icon: '📈',
        emoji: '📈',
        title: 'Monthly Report',
        subtitle: 'Generate summary',
        query: 'Generate monthly sustainability report',
        color: 'gradient-purple'
      },
      {
        id: 'compliance-check',
        icon: '✅',
        emoji: '✅',
        title: 'Compliance',
        subtitle: 'Check status',
        query: 'Are we compliant this month?',
        color: 'gradient-green'
      }
    ]
  }
];

// ===================================================================
// 9. ONE-CLICK ACTIONS
// ===================================================================

export interface OneClickAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  query: string;
  confirmation?: boolean;
  impact?: string;
}

/**
 * Pre-configured Actions - Execute complex tasks with one click
 */
export const ONE_CLICK_ACTIONS: OneClickAction[] = [
  {
    id: 'optimize-all',
    label: 'Auto-Optimize',
    icon: '✨',
    description: 'Let AI optimize everything',
    query: 'Optimize all systems for efficiency',
    confirmation: true,
    impact: 'Save 15-20% on costs'
  },
  {
    id: 'emergency-shutdown',
    label: 'Eco Mode',
    icon: '🍃',
    description: 'Switch to minimum emissions',
    query: 'Activate eco mode for all buildings',
    confirmation: true,
    impact: 'Reduce emissions by 30%'
  },
  {
    id: 'generate-reports',
    label: 'Generate All Reports',
    icon: '📊',
    description: 'Create all pending reports',
    query: 'Generate all required reports',
    confirmation: false,
    impact: '5 reports in 30 seconds'
  },
  {
    id: 'fix-all-issues',
    label: 'Fix All Issues',
    icon: '🔧',
    description: 'AI handles all alerts',
    query: 'Fix all non-critical issues automatically',
    confirmation: true,
    impact: 'Resolve 12 pending issues'
  }
];

// ===================================================================
// 10. VISUAL CHAT BUBBLES
// ===================================================================

export interface ChatBubbleOption {
  id: string;
  text: string;
  emoji: string;
  query: string;
  style: 'question' | 'action' | 'info' | 'warning';
}

/**
 * Pre-written Chat Bubbles - Click instead of type
 */
export const CHAT_BUBBLE_OPTIONS: ChatBubbleOption[] = [
  {
    id: 'greeting',
    text: "What's happening?",
    emoji: '👋',
    query: 'Give me current status',
    style: 'question'
  },
  {
    id: 'help',
    text: 'I need help',
    emoji: '🆘',
    query: 'Help me improve sustainability',
    style: 'question'
  },
  {
    id: 'more-info',
    text: 'Tell me more',
    emoji: '💭',
    query: 'Explain in detail',
    style: 'info'
  },
  {
    id: 'yes',
    text: 'Yes, do it',
    emoji: '✅',
    query: 'Confirm action',
    style: 'action'
  },
  {
    id: 'no',
    text: 'No, cancel',
    emoji: '❌',
    query: 'Cancel action',
    style: 'action'
  },
  {
    id: 'why',
    text: 'Why?',
    emoji: '🤔',
    query: 'Explain the reasoning',
    style: 'question'
  },
  {
    id: 'what-if',
    text: 'What if...',
    emoji: '💡',
    query: 'Run scenario analysis',
    style: 'question'
  },
  {
    id: 'show-more',
    text: 'Show more',
    emoji: '➕',
    query: 'Show additional options',
    style: 'info'
  }
];

// ===================================================================
// React Component Example
// ===================================================================

export const ZeroTypingInterface: React.FC = () => {
  return (
    <div className="zero-typing-interface">
      {/* Visual Cards Grid */}
      <div className="cards-grid">
        {HOME_SCREEN_CARDS.map(card => (
          <div
            key={card.id}
            className={`card ${card.color} ${card.animation}`}
            onClick={() => executeQuery(card.query)}
          >
            <span className="emoji">{card.emoji}</span>
            <h3>{card.title}</h3>
            <p>{card.subtitle}</p>
            {card.badge && (
              <span className={`badge ${card.badge.color}`}>
                {card.badge.text}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Smart Buttons Bar */}
      <div className="smart-buttons-bar">
        {SMART_BUTTONS.map(button => (
          <button
            key={button.id}
            className={`smart-btn ${button.type}`}
            onClick={() => executeQuery(button.query)}
          >
            <span>{button.icon}</span>
            <span>{button.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Bubbles */}
      <div className="chat-bubbles">
        {CHAT_BUBBLE_OPTIONS.slice(0, 4).map(bubble => (
          <div
            key={bubble.id}
            className={`bubble ${bubble.style}`}
            onClick={() => executeQuery(bubble.query)}
          >
            <span>{bubble.emoji}</span>
            <span>{bubble.text}</span>
          </div>
        ))}
      </div>

      {/* Interactive Widgets */}
      <div className="widgets">
        {INTERACTIVE_WIDGETS.map(widget => (
          <div key={widget.id} className="widget">
            {renderWidget(widget)}
          </div>
        ))}
      </div>

      {/* One-Click Actions */}
      <div className="one-click-actions">
        {ONE_CLICK_ACTIONS.map(action => (
          <div
            key={action.id}
            className="action-card"
            onClick={() => executeAction(action)}
          >
            <span className="icon">{action.icon}</span>
            <div className="content">
              <h4>{action.label}</h4>
              <p>{action.description}</p>
              <span className="impact">{action.impact}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper functions
function executeQuery(query: string) {
  // Send query to AI without user typing
  console.log('Executing:', query);
}

function executeAction(action: OneClickAction) {
  if (action.confirmation) {
    // Show confirmation dialog
    console.log('Confirm:', action.label);
  }
  executeQuery(action.query);
}

function renderWidget(widget: InteractiveWidget) {
  // Render appropriate widget based on type
  return <div>{widget.label}</div>;
}

export default ZeroTypingInterface;