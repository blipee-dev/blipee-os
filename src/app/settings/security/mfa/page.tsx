'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import MFAEnrollment from '@/components/auth/MFAEnrollment';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MFASettingsPage() {
  const [loading, setLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [factors, setFactors] = useState<any[]>([]);
  const [error, setError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) throw error;

      if (data) {
        const verifiedFactors = data.factors.filter(f => f.status === 'verified');
        setFactors(verifiedFactors);
        setMfaEnabled(verifiedFactors.length > 0);
      }
    } catch (err: any) {
      console.error('Error checking MFA status:', err);
      setError('Failed to load MFA status');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async (factorId: string) => {
    if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.mfa.unenroll({ factorId });

      if (error) throw error;

      // Refresh status
      await checkMFAStatus();
    } catch (err: any) {
      console.error('Error disabling MFA:', err);
      setError(err.message || 'Failed to disable MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentSuccess = () => {
    setEnrolling(false);
    checkMFAStatus();
  };

  if (loading && !enrolling) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">
                Two-Factor Authentication
              </h1>
              <p className="text-gray-400">
                Add an extra layer of security to your account by requiring a verification code in addition to your password.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-2xl p-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </motion.div>
        )}

        {/* MFA Status */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Status</h2>
              <p className="text-sm text-gray-400">
                Current two-factor authentication status
              </p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              mfaEnabled
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-gray-500/20 border border-gray-500/30'
            }`}>
              {mfaEnabled ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-green-300">Enabled</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-300">Disabled</span>
                </>
              )}
            </div>
          </div>

          {/* Enrolled factors */}
          {factors.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300">Enrolled Methods</h3>
              {factors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {factor.friendly_name || 'Authenticator App'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Added {new Date(factor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDisableMFA(factor.id)}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                  >
                    Disable
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Enable MFA button */}
          {!mfaEnabled && !enrolling && (
            <Button
              onClick={() => setEnrolling(true)}
              className="w-full"
              disabled={loading}
            >
              Enable Two-Factor Authentication
            </Button>
          )}
        </div>

        {/* Enrollment flow */}
        {enrolling && (
          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
            <MFAEnrollment
              onSuccess={handleEnrollmentSuccess}
              onCancel={() => setEnrolling(false)}
            />
          </div>
        )}

        {/* Information */}
        <div className="backdrop-blur-xl bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-blue-300 mb-3">
            About Two-Factor Authentication
          </h3>
          <ul className="space-y-2 text-sm text-blue-200/80">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Protects your account even if your password is compromised</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Works with popular authenticator apps like Google Authenticator, Authy, and 1Password</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>You'll need your phone each time you sign in</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              <span>Keep your backup codes in a safe place in case you lose access to your authenticator app</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
