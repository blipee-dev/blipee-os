'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GradientButton } from '@/components/premium/GradientButton';
import { X, Play, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

interface SSOTestInterfaceProps {
  configurationId: string;
  onClose: () => void;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

export function SSOTestInterface({ configurationId, onClose }: SSOTestInterfaceProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const runTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch(`/api/auth/sso/configurations/${configurationId}/test`, {
        method: 'POST',
      });

      const data = await response.json();
      
      setResult({
        success: response.ok,
        message: dataerror.message || (response.ok ? 'Configuration test passed' : 'Configuration test failed'),
        details: data.details,
      });
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to test configuration',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-lg"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Test SSO Configuration
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {!result ? (
            <>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Configuration Test
                    </p>
                    <p className="text-blue-800 dark:text-blue-200">
                      This will verify your SSO configuration settings and connectivity without performing a full authentication flow.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <GradientButton onClick={runTest} disabled={testing}>
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Running Test...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Test
                    </>
                  )}
                </GradientButton>
              </div>
            </>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    )}
                    <div className="flex-1 text-sm">
                      <p
                        className={`font-medium ${
                          result.success
                            ? 'text-green-900 dark:text-green-100'
                            : 'text-red-900 dark:text-red-100'
                        }`}
                      >
                        {result.success ? 'Test Passed' : 'Test Failed'}
                      </p>
                      <p
                        className={
                          result.success
                            ? 'text-green-800 dark:text-green-200'
                            : 'text-red-800 dark:text-red-200'
                        }
                      >
                        {result.message}
                      </p>
                    </div>
                  </div>
                </div>

                {result.details && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Test Details
                    </h4>
                    <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setResult(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Test Again
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  );
}