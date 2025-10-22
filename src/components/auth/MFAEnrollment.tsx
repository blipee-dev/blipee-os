'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Shield, AlertCircle } from 'lucide-react';

interface MFAEnrollmentProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MFAEnrollment({ onSuccess, onCancel }: MFAEnrollmentProps) {
  const [step, setStep] = useState<'init' | 'verify'>('init');
  const [factorId, setFactorId] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  const startEnrollment = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      if (data) {
        setFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setStep('verify');
      }
    } catch (err: any) {
      console.error('MFA enrollment error:', err);
      setError(err.message || 'Failed to start MFA enrollment');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      });

      if (error) throw error;

      if (data) {
        // MFA enabled successfully
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('MFA verification error:', err);
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'init') {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-blue-100 mb-1">
              Enable Two-Factor Authentication
            </h3>
            <p className="text-sm text-blue-200/80">
              Add an extra layer of security to your account. You'll need an authenticator app
              like Google Authenticator, Authy, or 1Password.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">Before you start:</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">1.</span>
              <span>Install an authenticator app on your phone</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">2.</span>
              <span>Keep this window open while setting up</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">3.</span>
              <span>Save your backup codes in a secure location</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={startEnrollment}
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Starting...' : 'Start Setup'}
          </Button>
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <Shield className="w-5 h-5 text-purple-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-purple-100 mb-1">
            Scan QR Code
          </h3>
          <p className="text-sm text-purple-200/80">
            Scan this QR code with your authenticator app
          </p>
        </div>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-white/5 border border-white/10">
        <QRCodeSVG
          value={qrCode}
          size={200}
          level="M"
          className="p-4 bg-white rounded-lg"
        />

        {/* Manual entry option */}
        <div className="w-full space-y-2">
          <p className="text-xs text-gray-400 text-center">
            Can't scan? Enter this code manually:
          </p>
          <div className="flex items-center gap-2 p-3 rounded bg-white/5 border border-white/10">
            <code className="flex-1 text-sm font-mono text-gray-300 break-all">
              {secret}
            </code>
            <button
              onClick={copySecret}
              className="p-2 hover:bg-white/10 rounded transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Verify code */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Enter verification code
        </label>
        <Input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="text-center text-2xl tracking-widest font-mono"
          disabled={loading}
        />
        <p className="text-xs text-gray-400">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          onClick={verifyAndEnable}
          disabled={loading || verifyCode.length !== 6}
          className="flex-1"
        >
          {loading ? 'Verifying...' : 'Verify & Enable'}
        </Button>
        {onCancel && (
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
