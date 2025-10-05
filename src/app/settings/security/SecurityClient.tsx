'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/premium/GlassCard';
import { GradientButton } from '@/components/premium/GradientButton';
import { Shield, Smartphone, Key, AlertCircle, Monitor, Calendar, MapPin, X, FileText, RefreshCw } from 'lucide-react';
import { MFASetup } from '@/components/auth/mfa/MFASetup';
import { useAuth } from '@/lib/auth/context';
import { motion } from 'framer-motion';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';
import { AuditDashboard } from '@/components/audit/AuditDashboard';
import { RecoverySettings } from '@/components/auth/recovery/RecoverySettings';
import { RecoveryDashboard } from '@/components/auth/recovery/RecoveryDashboard';
import WebAuthnDashboard from '@/components/auth/webauthn/WebAuthnDashboard';
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

export default function SecuritySettingsPage() {
  useAuthRedirect('/settings/security');
  
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const { user } = useAuth();

  // Check MFA status and load sessions on mount
  useEffect(() => {
    loadSessions();
    // TODO: Check MFA status
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/auth/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.data.sessions);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const terminateSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to terminate this session?')) return;
    
    try {
      const response = await fetch(`/api/auth/sessions?sessionId=${sessionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        console.log('Session terminated');
        loadSessions();
      }
    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  };

  const terminateAllSessions = async () => {
    if (!confirm('This will sign you out from all other devices. Continue?')) return;
    
    try {
      const response = await fetch('/api/auth/sessions?all=true', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        console.log('All sessions terminated');
        loadSessions();
      }
    } catch (error) {
      console.error('Failed to terminate sessions:', error);
    }
  };

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
    <div className="p-4 sm:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden md:block"
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Security Settings</h1>
        <p className="text-[#616161] dark:text-[#757575] mt-2">
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
                <Shield className="h-5 w-5 accent-text" />
                Two-Factor Authentication
              </h2>
              <p className="mt-1 text-[#616161] dark:text-[#757575]">
                Add an extra layer of security to your account
              </p>
            </div>

            {!showMFASetup ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label htmlFor="mfa-toggle" className="text-sm font-medium text-[#616161] dark:text-[#757575]">
                      Enable Two-Factor Authentication
                    </label>
                    <p className="text-sm text-[#616161] dark:text-[#757575]">
                      Use an authenticator app to generate verification codes
                    </p>
                  </div>
                  <button
                    id="mfa-toggle"
                    onClick={() => handleMFAToggle(!mfaEnabled)}
                    disabled={loading}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all ${
                      mfaEnabled
                        ? "accent-gradient-lr"
                        : "bg-gray-300 dark:bg-[#616161]"
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

      {/* Account Recovery */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-green-500" />
              Account Recovery
            </h2>
            <RecoverySettings />
          </div>
        </GlassCard>
      </motion.div>

      {/* Recovery Dashboard - Admin only */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              Recovery Statistics
            </h2>
            <RecoveryDashboard organizationId={user?.id} />
          </div>
        </GlassCard>
      </motion.div>

      {/* WebAuthn/FIDO2 Management */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <GlassCard>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-500" />
                WebAuthn / FIDO2 Security Keys
              </h2>
              <p className="mt-1 text-[#616161] dark:text-[#757575]">
                Manage hardware security keys and biometric authentication
              </p>
            </div>
            <WebAuthnDashboard />
          </div>
        </GlassCard>
      </motion.div>

      {/* Additional Security Options */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlassCard>
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Key className="h-5 w-5 accent-text" />
                Password & Authentication
              </h2>
              <p className="mt-1 text-[#616161] dark:text-[#757575]">
                Manage your password and authentication methods
              </p>
            </div>
            <div className="space-y-3">
              <button className="w-full px-6 py-3 text-left border border-gray-300 dark:border-white/[0.05] rounded-lg bg-transparent text-[#616161] dark:text-[#757575] font-medium hover:bg-gray-50 dark:hover:bg-white/[0.05] focus:outline-none transition-all">
                Change Password
              </button>
              <button className="w-full px-6 py-3 text-left border border-gray-300 dark:border-white/[0.05] rounded-lg bg-transparent text-[#616161] dark:text-[#757575] font-medium hover:bg-gray-50 dark:hover:bg-white/[0.05] focus:outline-none transition-all">
                Manage Trusted Devices
              </button>
              <button className="w-full px-6 py-3 text-left border border-gray-300 dark:border-white/[0.05] rounded-lg bg-transparent text-[#616161] dark:text-[#757575] font-medium hover:bg-gray-50 dark:hover:bg-white/[0.05] focus:outline-none transition-all">
                View Login History
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Active Sessions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Monitor className="h-5 w-5 text-blue-500" />
                Active Sessions
              </h2>
              {sessions.length > 1 && (
                <button
                  onClick={terminateAllSessions}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  Sign out all other sessions
                </button>
              )}
            </div>
            
            {loadingSessions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 accent-border mx-auto"></div>
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-[#616161] dark:text-[#757575]">No active sessions found</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="flex items-start justify-between p-4 rounded-lg bg-gray-50 dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Monitor className="h-4 w-4 text-[#757575]" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {session.device}
                          {session.current && (
                            <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                              (This device)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-[#616161] dark:text-[#757575]">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.ipAddress}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Last active: {new Date(session.lastActive).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {!session.current && (
                      <button
                        onClick={() => terminateSession(session.sessionId)}
                        className="ml-4 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                        title="Terminate session"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </motion.div>

      {/* Security Dashboard - Only show for admins */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <GlassCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              Security Overview
            </h2>
            <SecurityDashboard />
          </div>
        </GlassCard>
      </motion.div>

      {/* Audit Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <GlassCard>
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Audit Trail
            </h2>
            <AuditDashboard organizationId={user?.id} />
          </div>
        </GlassCard>
      </motion.div>

      {/* Security Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
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
                <span className="text-[#616161] dark:text-[#757575]">Use a strong, unique password for your account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className={mfaEnabled ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}>
                  {mfaEnabled ? "✓" : "!"}
                </span>
                <span className="text-[#616161] dark:text-[#757575]">Enable two-factor authentication</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span className="text-[#616161] dark:text-[#757575]">Review login activity regularly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span className="text-[#616161] dark:text-[#757575]">Keep your email address up to date</span>
              </li>
            </ul>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}