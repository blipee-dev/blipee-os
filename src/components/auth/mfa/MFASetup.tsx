'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { GlassCard } from '@/components/premium/GlassCard';
import { GradientButton } from '@/components/premium/GradientButton';
import { Shield, Smartphone, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface MFASetupProps {
  onComplete?: () => void;
}

export function MFASetup({ onComplete }: MFASetupProps) {
  const [step, setStep] = useState<'choose' | 'setup' | 'verify' | 'complete'>('choose');
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'totp' }),
      });

      if (!response.ok) throw new Error('Failed to start MFA setup');

      const data = await response.json();
      setQrCode(data.setup.qrCode);
      setBackupCodes(data.setup.backupCodes || []);
      setStep('setup');
    } catch (error) {
      console.error('Failed to start MFA setup:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (verificationCode.length !== 6) {
      console.error('Invalid code: Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/mfa/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'totp',
          code: verificationCode,
        }),
      });

      if (!response.ok) throw new Error('Invalid verification code');

      setStep('complete');
    } catch (error) {
      console.error('Verification failed: Please check your code and try again');
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'choose') {
    return (
      <GlassCard className="w-full max-w-md">
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-purple-500" />
              Enable Two-Factor Authentication
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Add an extra layer of security to your account
            </p>
          </div>
          <GradientButton
            onClick={startSetup}
            disabled={loading}
            fullWidth
            startIcon={<Smartphone className="h-4 w-4" />}
          >
            {loading ? 'Setting up...' : 'Set up with Authenticator App'}
          </GradientButton>
        </div>
      </GlassCard>
    );
  }

  if (step === 'setup') {
    return (
      <GlassCard className="w-full max-w-md">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Set up Authenticator App
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Scan this QR code with your authenticator app
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center p-4 bg-white rounded-lg"
          >
            <QRCodeSVG value={qrCode} size={200} />
          </motion.div>
          
          <div>
            <label
              htmlFor="verification-code"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Enter the 6-digit code from your authenticator app:
            </label>
            <input
              id="verification-code"
              type="text"
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="block w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-transparent transition-all"
              maxLength={6}
            />
          </div>

          <GradientButton
            onClick={verifySetup}
            disabled={loading || verificationCode.length !== 6}
            fullWidth
            loading={loading}
          >
            Verify and Enable
          </GradientButton>
        </div>
      </GlassCard>
    );
  }

  if (step === 'complete') {
    return (
      <GlassCard className="w-full max-w-md">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-2">
              <Check className="h-6 w-6" />
              <h2 className="text-2xl font-bold">
                Two-Factor Authentication Enabled
              </h2>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0" />
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
              </p>
            </div>
          </motion.div>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg space-y-2 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Backup Codes</span>
              <button
                onClick={copyBackupCodes}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="font-mono text-sm space-y-1 text-gray-900 dark:text-gray-100">
              {backupCodes.map((code, index) => (
                <div key={index}>{code}</div>
              ))}
            </div>
          </div>

          <GradientButton onClick={onComplete} fullWidth>
            Done
          </GradientButton>
        </div>
      </GlassCard>
    );
  }

  return null;
}