'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/premium/GlassCard';
import { GradientButton } from '@/components/premium/GradientButton';
import { Shield, Smartphone, Key, AlertCircle } from 'lucide-react';
import { MFASetup } from '@/components/auth/mfa/MFASetup';
import { useAuth } from '@/lib/auth/context';
import { motion } from 'framer-motion';

export default function SecuritySettingsPage() {
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Check MFA status on load
  // TODO: Implement API call to check MFA status

  const handleMFAToggle = async (enabled: boolean) => {
    if (enabled) {
      setShowMFASetup(true);
    } else {
      // Disable MFA
      setLoading(true);
      try {
        const response = await fetch('/api/auth/mfa/disable', {
          method: 'POST',
        });

        if (!response.ok) throw new Error('Failed to disable MFA');

        setMfaEnabled(false);
        console.log('Two-factor authentication has been disabled');
      } catch (error) {
        console.error('Failed to disable MFA:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMFASetupComplete = () => {
    setMfaEnabled(true);
    setShowMFASetup(false);
    console.log('Two-factor authentication is now active');
  };

  return (
    <div className="container max-w-4xl py-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Security Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account security and authentication settings
        </p>
      </motion.div>

      {/* MFA Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassCard>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                Two-Factor Authentication
              </h2>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Add an extra layer of security to your account
              </p>
            </div>

            {!showMFASetup ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label htmlFor="mfa-toggle" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Enable Two-Factor Authentication
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Use an authenticator app to generate verification codes
                    </p>
                  </div>
                  <button
                    id="mfa-toggle"
                    onClick={() => handleMFAToggle(!mfaEnabled)}
                    disabled={loading}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                      mfaEnabled
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : "bg-gray-300 dark:bg-gray-700"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        mfaEnabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {mfaEnabled && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Two-factor authentication is active
                      </p>
                      <p className="text-blue-800 dark:text-blue-200">
                        You&apos;ll need your authenticator app to sign in
                      </p>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <MFASetup onComplete={handleMFASetupComplete} />
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Additional Security Options */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-purple-500" />
                Password & Authentication
              </h2>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Manage your password and authentication methods
              </p>
            </div>
            <div className="space-y-3">
              <button className="w-full px-4 py-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all">
                Change Password
              </button>
              <button className="w-full px-4 py-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all">
                Manage Trusted Devices
              </button>
              <button className="w-full px-4 py-3 text-left border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all">
                View Login History
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Security Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Security Recommendations
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Use a strong, unique password for your account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={mfaEnabled ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}>
                  {mfaEnabled ? "✓" : "!"}
                </span>
                <span className="text-gray-700 dark:text-gray-300">Enable two-factor authentication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Review login activity regularly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span className="text-gray-700 dark:text-gray-300">Keep your email address up to date</span>
              </li>
            </ul>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}