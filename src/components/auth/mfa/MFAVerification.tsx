'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/premium/GlassCard';
import { GradientButton } from '@/components/premium/GradientButton';
import { Shield, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface MFAVerificationProps {
  challengeId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MFAVerification({ challengeId, onSuccess, onCancel }: MFAVerificationProps) {
  const [code, setCode] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      console.error('Invalid code: Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          method: 'totp',
          code,
          rememberDevice,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }


      onSuccess?.();
    } catch (error) {
      console.error('Verification failed: Please check your code and try again');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
    
    // Auto-submit when 6 digits are entered
    if (numericValue.length === 6) {
      handleVerify();
    }
  };

  return (
    <GlassCard className="w-full max-w-md">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-6 w-6 text-purple-500" />
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <input
            type="text"
            placeholder="000000"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="block w-full px-4 py-4 text-center text-3xl font-mono tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-transparent transition-all"
            maxLength={6}
            autoFocus
            disabled={loading}
          />
        </motion.div>

        <div className="flex items-center space-x-2">
          <input
            id="remember"
            type="checkbox"
            checked={rememberDevice}
            onChange={(e) => setRememberDevice(e.target.checked)}
            disabled={loading}
            className="h-4 w-4 text-purple-600 border-gray-300 rounded accent-purple-600"
          />
          <label
            htmlFor="remember"
            className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none"
          >
            Trust this device for 30 days
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <GradientButton
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            loading={loading}
            className="flex-1"
          >
            Verify
          </GradientButton>
        </div>

        <div className="text-center">
          <button
            type="button"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            onClick={() => {
              // TODO: Implement backup code entry
            }}
          >
            Use a backup code instead
          </button>
        </div>
      </div>
    </GlassCard>
  );
}