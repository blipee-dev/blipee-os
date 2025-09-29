'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Activity,
  Target,
  AlertTriangle,
  Brain
} from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

export default function EmissionsClientSimple() {
  useAuthRedirect('/sustainability/emissions');
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState('emissions');
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    if (user) {
      // Test API directly without causing 404 errors
      testAPI();
    }
  }, [user]);

  const testAPI = async () => {
    setLoading(true);
    try {
      // Test emissions API with proper error handling
      const emissionsResponse = await fetch('/api/sustainability/emissions?period=12m', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      });

      const emissionsStatus = emissionsResponse.status;
      let emissionsData = null;

      if (emissionsResponse.ok) {
        emissionsData = await emissionsResponse.json();
      }

      // Test ML API with proper error handling
      const mlResponse = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          modelType: 'emissions-forecast'
        })
      });

      const mlStatus = mlResponse.status;
      let mlData = null;

      if (mlResponse.ok) {
        mlData = await mlResponse.json();
      }

      setDebugInfo({
        emissions: {
          status: emissionsStatus,
          data: emissionsData,
          error: emissionsStatus !== 200 ? `Status: ${emissionsStatus}` : null
        },
        ml: {
          status: mlStatus,
          data: mlData,
          error: mlStatus !== 200 ? `Status: ${mlStatus}` : null
        }
      });

    } catch (error) {
      console.error('API test error:', error);
      setDebugInfo({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SustainabilityLayout selectedView={selectedView} onSelectView={setSelectedView}>
      {/* Header */}
      <header className="bg-white dark:bg-[#212121] border-b border-gray-200 dark:border-white/[0.05] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Emissions Analysis (Debug Mode)
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Testing API endpoints
            </p>
          </div>
          <button
            onClick={testAPI}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test APIs'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-[#0a0a0a]">
        {/* User Info */}
        <div className="mb-6 p-4 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Authentication Status</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            User ID: {user?.id || 'Not authenticated'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Email: {user?.email || 'N/A'}
          </p>
        </div>

        {/* API Test Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Emissions API Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-blue-500" />
              <span className="text-sm text-gray-500">Emissions API</span>
            </div>

            {debugInfo.emissions ? (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Status: {debugInfo.emissions.status}
                </div>
                {debugInfo.emissions.error && (
                  <p className="text-sm text-red-500">{debugInfo.emissions.error}</p>
                )}
                {debugInfo.emissions.data && (
                  <div className="mt-4">
                    <p className="text-sm text-green-500 mb-2">✓ API Working!</p>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500">Response Data</summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
                        {JSON.stringify(debugInfo.emissions.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Click "Test APIs" to check status</p>
            )}
          </motion.div>

          {/* ML API Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <Brain className="w-8 h-8 text-purple-500" />
              <span className="text-sm text-gray-500">ML Predict API</span>
            </div>

            {debugInfo.ml ? (
              <>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Status: {debugInfo.ml.status}
                </div>
                {debugInfo.ml.error && (
                  <p className="text-sm text-red-500">{debugInfo.ml.error}</p>
                )}
                {debugInfo.ml.data && (
                  <div className="mt-4">
                    <p className="text-sm text-green-500 mb-2">✓ API Working!</p>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500">Response Data</summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
                        {JSON.stringify(debugInfo.ml.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">Click "Test APIs" to check status</p>
            )}
          </motion.div>
        </div>

        {/* Simple Stats Display */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 text-green-500" />
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {debugInfo.emissions?.data?.current?.total ?
                `${(debugInfo.emissions.data.current.total / 1000).toFixed(1)}k` :
                '--'}
            </div>
            <p className="text-xs text-gray-500">tCO2e</p>
          </div>

          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-6 h-6 text-blue-500" />
              <span className="text-xs text-gray-500">Scope 1</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {debugInfo.emissions?.data?.current?.scope1?.toFixed(1) || '--'}
            </div>
            <p className="text-xs text-gray-500">tCO2e</p>
          </div>

          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-6 h-6 text-purple-500" />
              <span className="text-xs text-gray-500">Scope 2</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {debugInfo.emissions?.data?.current?.scope2?.toFixed(1) || '--'}
            </div>
            <p className="text-xs text-gray-500">tCO2e</p>
          </div>

          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <span className="text-xs text-gray-500">Scope 3</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {debugInfo.emissions?.data?.current?.scope3?.toFixed(1) || '--'}
            </div>
            <p className="text-xs text-gray-500">tCO2e</p>
          </div>
        </div>

        {/* Error Display */}
        {debugInfo.error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Error</h3>
            <p className="text-sm text-red-700 dark:text-red-400">{debugInfo.error}</p>
          </div>
        )}
      </main>
    </SustainabilityLayout>
  );
}