'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertCircle, Shield } from 'lucide-react';

interface MFAChallengeProps {
  factorId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function MFAChallenge({ factorId, onSuccess, onCancel }: MFAChallengeProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [challengeId, setChallengeId] = useState<string>('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const supabase = createClient();

  useEffect(() => {
    // Create the challenge when component mounts
    createChallenge();
    // Focus first input
    inputRefs.current[0]?.focus();
  }, []);

  const createChallenge = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (error) throw error;

      if (data) {
        setChallengeId(data.id);
      }
    } catch (err: any) {
      console.error('MFA challenge creation error:', err);
      setError('Failed to create MFA challenge. Please try again.');
    }
  };

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    const numValue = value.replace(/\D/g, '');
    if (numValue.length > 1) return;

    const newCode = [...code];
    newCode[index] = numValue;
    setCode(newCode);

    // Auto-focus next input
    if (numValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (index === 5 && numValue) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

    if (pastedData.length === 6) {
      const newCode = pastedData.split('').slice(0, 6);
      setCode(newCode);
      inputRefs.current[5]?.focus();
      verifyCode(pastedData);
    }
  };

  const verifyCode = async (fullCode: string) => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: fullCode,
      });

      if (error) throw error;

      if (data) {
        // MFA verified successfully
        onSuccess();
      }
    } catch (err: any) {
      console.error('MFA verification error:', err);
      setError(err.message || 'Invalid verification code. Please try again.');
      // Clear the code on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      verifyCode(fullCode);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
        <Shield className="w-5 h-5 text-purple-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-purple-100 mb-1">
            Two-Factor Authentication
          </h3>
          <p className="text-sm text-purple-200/80">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 6-digit code input */}
        <div className="flex justify-center gap-2">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              disabled={loading}
              className="w-12 h-14 text-center text-2xl font-mono rounded-lg bg-white/5 border-2 border-white/10
                       focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
              autoComplete="off"
            />
          ))}
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            type="submit"
            disabled={loading || code.join('').length !== 6}
            className="w-full"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </Button>

          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              disabled={loading}
              className="w-full"
            >
              Back to Sign In
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-gray-400">
          Lost access to your authenticator app?{' '}
          <button
            type="button"
            className="text-purple-400 hover:text-purple-300 underline"
            onClick={() => {
              // TODO: Implement recovery flow
              alert('Contact support for account recovery');
            }}
          >
            Contact Support
          </button>
        </p>
      </form>
    </div>
  );
}
