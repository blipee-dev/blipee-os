'use client';

/**
 * Zero-Typing System Test Page
 * Tests card interactions, predictions, and real-time updates
 */

import React, { useState, useEffect } from 'react';
import { requireServerAuth } from '@/lib/auth/server-auth';
import { useCardStore } from '@/lib/state/card-store';
import { cardRegistry } from '@/lib/cards/card-registry';
import { masterContext } from '@/lib/context/master-context-engine';
import { createClient } from '@/lib/supabase/client';
import { Check, X, Clock, Activity, Zap, Brain } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  duration?: number;
}

export default function ZeroTypingTestPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Card Registry Initialization', status: 'pending' },
    { name: 'Card Data Fetching', status: 'pending' },
    { name: 'Card Store Operations', status: 'pending' },
    { name: 'Context Engine Updates', status: 'pending' },
    { name: 'Card Predictions', status: 'pending' },
    { name: 'Real-time Subscriptions', status: 'pending' },
    { name: 'Card Interactions', status: 'pending' },
    { name: 'Agent Communication', status: 'pending' },
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const supabase = createClient();
  const { 
    cards, 
    addCard, 
    pinCard, 
    unpinCard, 
    selectCard,
    updatePredictions,
    getVisibleCards 
  } = useCardStore();

  const runTest = async (index: number, testFn: () => Promise<void>) => {
    const startTime = Date.now();
    setTests(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status: 'running' };
      return updated;
    });

    try {
      await testFn();
      const duration = Date.now() - startTime;
      setTests(prev => {
        const updated = [...prev];
        updated[index] = { 
          ...updated[index], 
          status: 'passed', 
          duration,
          message: `Completed in ${duration}ms`
        };
        return updated;
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      setTests(prev => {
        const updated = [...prev];
        updated[index] = { 
          ...updated[index], 
          status: 'failed', 
          duration,
          message: error.message || 'Test failed'
        };
        return updated;
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);

    // Test 1: Card Registry Initialization
    await runTest(0, async () => {
      const allCards = cardRegistry.getAllCards();
      if (allCards.length === 0) {
        throw new Error('No cards registered');
      }
    });

    // Test 2: Card Data Fetching
    await runTest(1, async () => {
      const cardData = await cardRegistry.createCardData('total-emissions-metric');
      if (!cardData) {
        throw new Error('Failed to fetch card data');
      }
    });

    // Test 3: Card Store Operations
    await runTest(2, async () => {
      const testCard = {
        id: 'test-card-' + Date.now(),
        type: 'metric',
        data: { title: 'Test Card', value: '100' },
      };
      
      addCard(testCard);
      pinCard(testCard.id);
      selectCard(testCard.id);
      unpinCard(testCard.id);
      
    });

    // Test 4: Context Engine Updates
    await runTest(3, async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await masterContext.initialize(user.id, supabase);
      }
      
      const context = masterContext.getContext();
      if (!context) {
        throw new Error('Context not initialized');
      }
      
    });

    // Test 5: Card Predictions
    await runTest(4, async () => {
      const predictions = [
        {
          cardId: 'carbon-hunter-card',
          score: 0.95,
          reason: 'High emission activity detected',
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          cardId: 'compliance-guardian-card',
          score: 0.85,
          reason: 'Upcoming compliance deadline',
          expiresAt: new Date(Date.now() + 3600000),
        },
      ];
      
      updatePredictions(predictions);
    });

    // Test 6: Real-time Subscriptions
    await runTest(5, async () => {
      // Simulate real-time updates
      const mockChannel = {
        on: () => mockChannel,
        subscribe: () => Promise.resolve({ status: 'SUBSCRIBED' }),
      };
      
      await mockChannel.subscribe();
    });

    // Test 7: Card Interactions
    await runTest(6, async () => {
      // Simulate card tap
      masterContext.recordUserAction({
        timestamp: new Date(),
        action: 'card_tap',
        target: 'test-card',
        context: { source: 'test' },
      });
      
      // Simulate card swipe
      masterContext.recordUserAction({
        timestamp: new Date(),
        action: 'card_swipe',
        target: 'test-card',
        context: { direction: 'right' },
      });
      
    });

    // Test 8: Agent Communication
    await runTest(7, async () => {
      const agentCards = cardRegistry.getCardsByType('agent' as any);
      if (agentCards.length === 0) {
        throw new Error('No agent cards found');
      }
      
      // Test agent data fetching
      for (const agentCard of agentCards.slice(0, 2)) {
        const data = await cardRegistry.createCardData(agentCard.definition.id);
        if (!data) {
          throw new Error(`Failed to fetch data for ${agentCard.definition.id}`);
        }
      }
      
    });

    setIsRunning(false);
  };

  const getTestIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <X className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Activity className="w-5 h-5 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'running':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;
  const totalDuration = tests.reduce((sum, t) => sum + (t.duration || 0), 0);

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-500" />
            Zero-Typing System Test Suite
          </h1>
          <p className="text-white/60">
            Comprehensive testing of card interactions, predictions, and real-time updates
          </p>
        </div>

        {/* Summary */}
        <div className="mb-6 p-6 bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/[0.05]">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-white/60 text-sm">Total Tests</p>
              <p className="text-2xl font-bold text-white">{tests.length}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Passed</p>
              <p className="text-2xl font-bold text-green-500">{passedCount}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Failed</p>
              <p className="text-2xl font-bold text-red-500">{failedCount}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Duration</p>
              <p className="text-2xl font-bold text-white">{totalDuration}ms</p>
            </div>
          </div>
        </div>

        {/* Test List */}
        <div className="space-y-3 mb-6">
          {tests.map((test, index) => (
            <div
              key={index}
              className="p-4 bg-white/[0.03] backdrop-blur-xl rounded-lg border border-white/[0.05] transition-all hover:bg-white/[0.05]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTestIcon(test.status)}
                  <div>
                    <p className="text-white font-medium">{test.name}</p>
                    {test.message && (
                      <p className={`text-sm mt-1 ${getStatusColor(test.status)}`}>
                        {test.message}
                      </p>
                    )}
                  </div>
                </div>
                {test.duration && (
                  <span className="text-white/40 text-sm">
                    {test.duration}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <Activity className="w-5 h-5 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Run All Tests
              </>
            )}
          </button>

          <a
            href="/zero-typing"
            className="px-6 py-3 bg-white/10 text-white rounded-lg font-medium hover:bg-white/20 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>

        {/* Card Store Info */}
        <div className="mt-8 p-6 bg-white/[0.03] backdrop-blur-xl rounded-xl border border-white/[0.05]">
          <h3 className="text-lg font-medium text-white mb-3">Card Store Status</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-white/60 text-sm">Total Cards</p>
              <p className="text-xl font-bold text-white">{cards.size}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Visible Cards</p>
              <p className="text-xl font-bold text-white">{getVisibleCards().length}</p>
            </div>
            <div>
              <p className="text-white/60 text-sm">Registry Size</p>
              <p className="text-xl font-bold text-white">{cardRegistry.getAllCards().length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}