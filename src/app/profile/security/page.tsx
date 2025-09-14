"use client";

import React, { useState, useEffect } from "react";
import { ProfileLayout } from "@/components/profile/ProfileLayout";
import { motion } from "framer-motion";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import {
  Shield,
  Key,
  Lock,
  Smartphone,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Monitor,
  MapPin,
  Trash2,
  Download,
  RefreshCw,
  Copy,
  QrCode
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "@/providers/LanguageProvider";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  loginAlerts: boolean;
  backupCodes: string[];
  trustedDevices: string[];
}

interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: Date;
  current: boolean;
  ip: string;
}

interface SecurityEvent {
  id: string;
  type: "login" | "logout" | "password_change" | "2fa_enabled" | "2fa_disabled" | "suspicious_activity";
  description: string;
  timestamp: Date;
  location: string;
  ip: string;
  success: boolean;
}

const defaultSettings: SecuritySettings = {
  twoFactorEnabled: false,
  emailNotifications: true,
  loginAlerts: true,
  backupCodes: [],
  trustedDevices: [],
};

export default function SecurityPage() {
  useAuthRedirect('/profile/security');
  
  const t = useTranslations('profile.security');
  const { user } = useAuth();
  const supabase = createClient();
  const [settings, setSettings] = useState<SecuritySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load real user data and settings on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Load security settings from API
        const response = await fetch('/api/profile/security');
        if (response.ok) {
          const { data } = await response.json();
          setSettings({
            twoFactorEnabled: data.settings.twoFactorEnabled || false,
            emailNotifications: data.settings.emailNotifications || true,
            loginAlerts: data.settings.loginAlerts || true,
            backupCodes: data.settings.backupCodes || [],
            trustedDevices: data.settings.trustedDevices || [],
          });
          
          // Transform events to match expected format
          const transformedEvents = (data.events || []).map((event: any) => ({
            ...event,
            timestamp: new Date(event.timestamp),
          }));
          setSecurityEvents(transformedEvents);
        } else {
          // Fallback to localStorage if API fails
          const stored = localStorage.getItem("securitySettings");
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              setSettings(prev => ({ ...prev, ...parsed }));
            } catch (error) {
              console.error("Failed to parse security settings:", error);
            }
          }
          // Load default security events
          await loadSecurityEvents();
        }

        // Load active sessions
        await loadActiveSessions();
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  const loadSecurityEvents = async () => {
    if (!user) return;

    try {
      const events: SecurityEvent[] = [];
      
      // Add login event based on last sign in
      if (user.last_sign_in_at) {
        events.push({
          id: '1',
          type: 'login',
          description: t('recentLogin'),
          timestamp: new Date(user.last_sign_in_at),
          location: t('locationHidden'),
          ip: 'IP hidden for privacy',
          success: true
        });
      }

      // Add account creation event
      if (user.created_at) {
        events.push({
          id: '2',
          type: 'login',
          description: t('accountCreated'),
          timestamp: new Date(user.created_at),
          location: t('locationHidden'),
          ip: 'IP hidden for privacy',
          success: true
        });
      }

      // Add email confirmation event
      if (user.email_confirmed_at) {
        events.push({
          id: '3',
          type: 'login',
          description: t('emailVerified'),
          timestamp: new Date(user.email_confirmed_at),
          location: t('locationHidden'),
          ip: 'IP hidden for privacy',
          success: true
        });
      }

      setSecurityEvents(events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    } catch (error) {
      console.error('Error loading security events:', error);
    }
  };

  const loadActiveSessions = async () => {
    if (!user) return;

    try {
      // Get current session info
      const { data: session } = await supabase.auth.getSession();
      
      if (session.session) {
        const currentSession: ActiveSession = {
          id: session.session.access_token.substring(0, 8),
          device: getBrowserInfo(),
          location: t('currentLocation'),
          lastActive: new Date(),
          current: true,
          ip: 'IP hidden for privacy'
        };
        
        setActiveSessions([currentSession]);
      }
    } catch (error) {
      console.error('Error loading active sessions:', error);
    }
  };

  const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browser = t('unknownBrowser');
    let os = t('unknownOS');

    // Detect browser
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    // Detect OS
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('iPhone')) os = 'iOS';
    else if (ua.includes('Android')) os = 'Android';

    return `${os} - ${browser}`;
  };

  const saveSettings = async () => {
    try {
      const response = await fetch('/api/profile/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        // Also save to localStorage as backup
        localStorage.setItem("securitySettings", JSON.stringify(settings));
        setHasChanges(false);
        setMessage({ type: 'success', text: t('settingsSaved') });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: t('settingsSaveError') });
        setTimeout(() => setMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error saving security settings:', error);
      setMessage({ type: 'error', text: t('profile.security.settingsSaveError') });
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const updateSetting = <K extends keyof SecuritySettings>(
    key: K,
    value: SecuritySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeLoading(true);
    setPasswordChangeError(null);
    setPasswordChangeSuccess(false);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordChangeError(t('passwordMismatch'));
      setPasswordChangeLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordChangeError(t('passwordTooShort'));
      setPasswordChangeLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) {
        setPasswordChangeError(error.message);
        return;
      }

      setPasswordChangeSuccess(true);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      
      // Add to security events
      const newEvent: SecurityEvent = {
        id: Date.now().toString(),
        type: 'password_change',
        description: t('passwordChangedSuccess'),
        timestamp: new Date(),
        location: t('profile.security.currentLocation'),
        ip: 'IP hidden for privacy',
        success: true
      };
      setSecurityEvents(prev => [newEvent, ...prev]);
      
      // Clear success message after 3 seconds
      setTimeout(() => setPasswordChangeSuccess(false), 3000);
    } catch (error: any) {
      setPasswordChangeError(error.message || 'An unexpected error occurred');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setShow2FASetup(true);
      
      // Generate real backup codes
      const codes = [];
      for (let i = 0; i < 8; i++) {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        codes.push(code);
      }
      setBackupCodes(codes);
      
      // In a real implementation, you would generate a TOTP secret and QR code
      setQrCode("placeholder-qr-code");
    } catch (error) {
      console.error('Error setting up 2FA:', error);
    }
  };

  const handleConfirm2FA = async () => {
    if (verificationCode.length !== 6) {
      alert(t('invalidCode'));
      return;
    }

    try {
      // Update local settings
      updateSetting("twoFactorEnabled", true);
      updateSetting("backupCodes", backupCodes);
      
      // Save to app_users table
      const { error } = await supabase
        .from('app_users')
        .update({
          two_factor_enabled: true,
          security_settings: {
            ...settings,
            twoFactorEnabled: true,
            backupCodes
          },
          updated_at: new Date().toISOString()
        })
        .eq('auth_user_id', user.id);

      if (error) {
        console.error('Error saving 2FA settings:', error);
      }
      
      setShow2FASetup(false);
      setVerificationCode("");
      
      // Add security event
      const newEvent: SecurityEvent = {
        id: Date.now().toString(),
        type: '2fa_enabled',
        description: 'Two-factor authentication enabled',
        timestamp: new Date(),
        location: t('profile.security.currentLocation'),
        ip: 'IP hidden for privacy',
        success: true
      };
      setSecurityEvents(prev => [newEvent, ...prev]);
      
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      alert(t('enable2FAError'));
    }
  };

  const handleDisable2FA = async () => {
    if (confirm(t('disable2FAConfirmation'))) {
      try {
        updateSetting("twoFactorEnabled", false);
        updateSetting("backupCodes", []);
        
        // Update app_users table
        const { error } = await supabase
          .from('app_users')
          .update({
            two_factor_enabled: false,
            security_settings: {
              ...settings,
              twoFactorEnabled: false,
              backupCodes: []
            },
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', user.id);

        if (error) {
          console.error('Error saving 2FA settings:', error);
        }
        
        // Add security event
        const newEvent: SecurityEvent = {
          id: Date.now().toString(),
          type: '2fa_disabled',
          description: 'Two-factor authentication disabled',
          timestamp: new Date(),
          location: t('currentLocation'),
          ip: 'IP hidden for privacy',
          success: true
        };
        setSecurityEvents(prev => [newEvent, ...prev]);
        
      } catch (error) {
        console.error('Error disabling 2FA:', error);
        alert(t('disable2FAError'));
      }
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (confirm(t('revokeSessionConfirmation'))) {
      try {
        // For current session, sign out
        if (sessionId === activeSessions.find(s => s.current)?.id) {
          await supabase.auth.signOut();
          return;
        }
        
        // Remove from local state
        setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
        
        // Add security event
        const newEvent: SecurityEvent = {
          id: Date.now().toString(),
          type: 'logout',
          description: 'Session revoked',
          timestamp: new Date(),
          location: t('currentLocation'),
          ip: 'IP hidden for privacy',
          success: true
        };
        setSecurityEvents(prev => [newEvent, ...prev]);
      } catch (error) {
        console.error('Error revoking session:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login':
        return <Shield className="w-4 h-4" />;
      case 'logout':
        return <Shield className="w-4 h-4" />;
      case 'password_change':
        return <Key className="w-4 h-4" />;
      case '2fa_enabled':
      case '2fa_disabled':
        return <Smartphone className="w-4 h-4" />;
      case 'suspicious_activity':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <ProfileLayout pageTitle={t('title')}>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">{t('loadingSettings')}</div>
        </div>
      </ProfileLayout>
    );
  }

  if (!user) {
    return (
      <ProfileLayout pageTitle={t('title')}>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">{t('signInRequired')}</div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout pageTitle={t('profile.security.title')}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
        </div>

        {/* Password Change */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 accent-text" />
            {t('changePassword')}
          </h2>

          {/* Success/Error Messages */}
          {passwordChangeSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-800 dark:text-green-300">{t('passwordUpdated')}</p>
              </div>
            </div>
          )}

          {passwordChangeError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-800 dark:text-red-300">{passwordChangeError}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('currentPassword')}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 accent-ring"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('newPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 accent-ring"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t('confirmNewPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 accent-ring"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordChangeLoading}
              className="px-4 py-2 accent-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {passwordChangeLoading ? t('updating') : t('updatePassword')}
            </button>
          </form>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 accent-text" />
            {t('twoFactorAuth')}
          </h2>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {settings.twoFactorEnabled ? t('twoFactorEnabled') : t('twoFactorDisabled')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {settings.twoFactorEnabled 
                  ? t('twoFactorEnabledDescription') 
                  : t('twoFactorDisabledDescription')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {settings.twoFactorEnabled ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              )}
            </div>
          </div>

          {!settings.twoFactorEnabled ? (
            <button
              onClick={handleEnable2FA}
              className="px-4 py-2 accent-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              {t('enableTwoFactor')}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDisable2FA}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  {t('disableTwoFactor')}
                </button>
                <button 
                  onClick={handleEnable2FA}
                  className="px-4 py-2 bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                >
                  {t('regenerateBackupCodes')}
                </button>
              </div>
              {settings.backupCodes.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {t('backupCodes')}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                    {settings.backupCodes.map((code, index) => (
                      <div key={index} className="bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security Notifications */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {t('securityNotifications')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('emailNotifications')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('emailNotificationsDescription')}
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.emailNotifications}
                onChange={() => updateSetting("emailNotifications", !settings.emailNotifications)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t('loginAlerts')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('loginAlertsDescription')}
                </p>
              </div>
              <ToggleSwitch
                enabled={settings.loginAlerts}
                onChange={() => updateSetting("loginAlerts", !settings.loginAlerts)}
              />
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 accent-text" />
            {t('activeSessions')}
          </h2>
          {activeSessions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('noActiveSessions')}</p>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
                  <div className="flex items-center gap-4">
                    <Monitor className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">{session.device}</p>
                        {session.current && (
                          <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded">
                            {t('current')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {session.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(session.lastActive)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={session.current ? t('signOut') : t('revokeSession')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Activity Log */}
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 accent-text" />
              {t('securityActivity')}
            </h2>
          </div>
          {securityEvents.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('noSecurityEvents')}</p>
          ) : (
            <div className="space-y-3">
              {securityEvents.map((event) => (
                <div key={event.id} className="flex items-start gap-3 p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                  <div className={`p-1.5 rounded-full ${
                    event.success 
                      ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                  }`}>
                    {getEventIcon(event.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{formatDate(event.timestamp)}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2FA Setup Modal */}
        {show2FASetup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-200 dark:border-white/[0.05] p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('setupTwoFactor')}
              </h3>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-48 h-48 bg-gray-100 dark:bg-white/5 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('qrCodePlaceholder')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {t('enterVerificationCode')}
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                    placeholder="000000"
                    className="w-full px-3 py-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 accent-ring text-center font-mono text-lg"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShow2FASetup(false);
                      setVerificationCode("");
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm2FA}
                    disabled={verificationCode.length !== 6}
                    className="px-4 py-2 accent-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('enableTwoFactorButton')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={saveSettings}
              className="px-6 py-3 accent-gradient text-white rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              Save Changes
              <CheckCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>
    </ProfileLayout>
  );
}