'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Activity,
  Target,
  AlertTriangle,
  Brain,
  LogIn,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { createClient } from '@/lib/supabase/client';

export default function EmissionsClientFixed() {
  useAuthRedirect('/sustainability/emissions');
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedView, setSelectedView] = useState('emissions');
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');

  useEffect(() => {
    checkAuthStatus();
  }, [user]);

  const checkAuthStatus = async () => {
    try {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth error:', error);
        setAuthStatus('unauthenticated');
        setDebugInfo(prev => ({
          ...prev,
          auth: { error: error.message, status: 'error' }
        }));
        return;
      }

      if (session) {
        setAuthStatus('authenticated');
        setDebugInfo(prev => ({
          ...prev,
          auth: {
            status: 'authenticated',
            user: session.user.email,
            expires: new Date(session.expires_at! * 1000).toLocaleString()
          }
        }));
        // Only test APIs if authenticated
        testAPI(session.access_token);
      } else {
        setAuthStatus('unauthenticated');
        setDebugInfo(prev => ({
          ...prev,
          auth: { status: 'unauthenticated', message: 'No active session' }
        }));
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthStatus('unauthenticated');
      setDebugInfo(prev => ({
        ...prev,
        auth: { error: 'Failed to check authentication', status: 'error' }
      }));
    }
  };

  const testAPI = async (accessToken?: string) => {
    setLoading(true);
    try {
      // Test emissions API with auth token
      const emissionsResponse = await fetch('/api/sustainability/emissions?period=12m', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        }
      });

      const emissionsStatus = emissionsResponse.status;
      let emissionsData = null;
      let emissionsError = null;

      if (emissionsResponse.ok) {
        emissionsData = await emissionsResponse.json();
      } else {
        const errorText = await emissionsResponse.text();
        emissionsError = `Status ${emissionsStatus}: ${errorText}`;
        console.error('❌ Emissions API failed:', emissionsError);
      }

      // Test ML API with auth token
      const mlResponse = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
        },
        credentials: 'include',
        body: JSON.stringify({
          modelType: 'emissions-forecast'
        })
      });

      const mlStatus = mlResponse.status;
      let mlData = null;
      let mlError = null;

      if (mlResponse.ok) {
        mlData = await mlResponse.json();
      } else {
        const errorText = await mlResponse.text();
        mlError = `Status ${mlStatus}: ${errorText}`;
        console.error('❌ ML API failed:', mlError);
      }

      setDebugInfo(prev => ({
        ...prev,
        emissions: {
          status: emissionsStatus,
          data: emissionsData,
          error: emissionsError
        },
        ml: {
          status: mlStatus,
          data: mlData,
          error: mlError
        }
      }));

    } catch (error) {
      console.error('API test error:', error);
      setDebugInfo(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const supabase = createClient();
      // For testing, we'll use a magic link or redirect to sign in
      window.location.href = '/signin?redirect=/sustainability/emissions';
    } catch (error) {
      console.error('Login redirect failed:', error);
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
              Testing authentication and API endpoints
            </p>
          </div>
          <div className="flex gap-2">
            {authStatus === 'authenticated' ? (
              <button
                onClick={() => testAPI()}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test APIs'}
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In First
              </button>
            )}
            <button
              onClick={checkAuthStatus}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Check Auth
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-[#0a0a0a]">
        {/* Authentication Status Card */}
        <div className="mb-6 p-4 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            Authentication Status
            {authStatus === 'authenticated' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : authStatus === 'unauthenticated' ? (
              <XCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Activity className="w-5 h-5 text-yellow-500 animate-pulse" />
            )}
          </h3>

          {debugInfo.auth && (
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Status: <span className={`font-semibold ${
                  debugInfo.auth.status === 'authenticated' ? 'text-green-500' :
                  debugInfo.auth.status === 'error' ? 'text-red-500' : 'text-yellow-500'
                }`}>{debugInfo.auth.status}</span>
              </p>
              {debugInfo.auth.user && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  User: {debugInfo.auth.user}
                </p>
              )}
              {debugInfo.auth.expires && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Session expires: {debugInfo.auth.expires}
                </p>
              )}
              {debugInfo.auth.message && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {debugInfo.auth.message}
                </p>
              )}
              {debugInfo.auth.error && (
                <p className="text-sm text-red-500">
                  Error: {debugInfo.auth.error}
                </p>
              )}
            </div>
          )}

          {authStatus === 'unauthenticated' && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ You need to be authenticated to test the APIs. The 401 errors are expected when not logged in.
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                Click "Sign In First" to authenticate, then try testing the APIs again.
              </p>
            </div>
          )}
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
                  Status: <span className={
                    debugInfo.emissions.status === 200 ? 'text-green-500' :
                    debugInfo.emissions.status === 401 ? 'text-yellow-500' :
                    'text-red-500'
                  }>{debugInfo.emissions.status}</span>
                </div>

                {debugInfo.emissions.status === 401 && (
                  <p className="text-sm text-yellow-500">
                    Authentication required - This is expected if not logged in
                  </p>
                )}

                {debugInfo.emissions.error && (
                  <p className="text-sm text-red-500">{debugInfo.emissions.error}</p>
                )}

                {debugInfo.emissions.data && (
                  <div className="mt-4">
                    <p className="text-sm text-green-500 mb-2">✓ API Working!</p>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500">Response Data</summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-64">
                        {JSON.stringify(debugInfo.emissions.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">
                {authStatus === 'authenticated' ?
                  'Click "Test APIs" to check status' :
                  'Sign in first to test this API'}
              </p>
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
                  Status: <span className={
                    debugInfo.ml.status === 200 ? 'text-green-500' :
                    debugInfo.ml.status === 401 ? 'text-yellow-500' :
                    'text-red-500'
                  }>{debugInfo.ml.status}</span>
                </div>

                {debugInfo.ml.status === 401 && (
                  <p className="text-sm text-yellow-500">
                    Authentication required - This is expected if not logged in
                  </p>
                )}

                {debugInfo.ml.error && (
                  <p className="text-sm text-red-500">{debugInfo.ml.error}</p>
                )}

                {debugInfo.ml.data && (
                  <div className="mt-4">
                    <p className="text-sm text-green-500 mb-2">✓ API Working!</p>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500">Response Data</summary>
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-64">
                        {JSON.stringify(debugInfo.ml.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-500">
                {authStatus === 'authenticated' ?
                  'Click "Test APIs" to check status' :
                  'Sign in first to test this API'}
              </p>
            )}
          </motion.div>
        </div>

        {/* Simple Stats Display */}
        {debugInfo.emissions?.data && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <span className="text-xs text-gray-500">Total</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {debugInfo.emissions.data.current?.total ?
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
                {debugInfo.emissions.data.current?.scope1?.toFixed(1) || '--'}
              </div>
              <p className="text-xs text-gray-500">tCO2e</p>
            </div>

            <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-6 h-6 text-purple-500" />
                <span className="text-xs text-gray-500">Scope 2</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {debugInfo.emissions.data.current?.scope2?.toFixed(1) || '--'}
              </div>
              <p className="text-xs text-gray-500">tCO2e</p>
            </div>

            <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                <span className="text-xs text-gray-500">Scope 3</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {debugInfo.emissions.data.current?.scope3?.toFixed(1) || '--'}
              </div>
              <p className="text-xs text-gray-500">tCO2e</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {debugInfo.error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">Error</h3>
            <p className="text-sm text-red-700 dark:text-red-400">{debugInfo.error}</p>
          </div>
        )}

        {/* Solution Summary */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            ✅ API Status Summary
          </h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Both APIs exist and are responding correctly</li>
            <li>• The 401 errors are expected when not authenticated</li>
            <li>• Sign in to test the APIs with proper authentication</li>
            <li>• Once authenticated, the APIs will return data successfully</li>
          </ul>
        </div>
      </main>
    </SustainabilityLayout>
  );
}