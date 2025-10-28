'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Monitor, BellOff, User, Trash2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useAuth } from '@/lib/auth/context';
import { clearSynced } from '@/lib/offline/db';
import { useState } from 'react';

interface MobileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSettings({ isOpen, onClose }: MobileSettingsProps) {
  const { user } = useAuth();
  const [isClearing, setIsClearing] = useState(false);
  const {
    isSupported: isPushSupported,
    isSubscribed: isPushSubscribed,
    subscribe: subscribeToPush,
    unsubscribe: unsubscribePush,
    permission: pushPermission
  } = usePushNotifications();

  const handleTogglePushNotifications = async () => {
    if (isPushSubscribed) {
      await unsubscribePush();
    } else {
      await subscribeToPush();
    }
  };

  const handleClearCache = async () => {
    if (confirm('Clear all cached data? This will not affect your online data.')) {
      setIsClearing(true);
      try {
        await clearSynced();
        // Also clear browser cache if possible
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        alert('Cache cleared successfully');
      } catch (error) {
        console.error('Error clearing cache:', error);
        alert('Failed to clear cache');
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleSwitchToDesktop = () => {
    // Redirect to desktop sustainability page
    window.location.href = '/sustainability';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[90]"
          />

          {/* Settings Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 m-auto max-w-md h-fit bg-white rounded-2xl shadow-2xl z-[100] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close settings"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Profile Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Profile</h3>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0">
                    {user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{user?.email}</p>
                    <button
                      onClick={() => window.location.href = '/profile'}
                      className="text-xs text-green-600 hover:text-green-700 mt-0.5"
                    >
                      Edit profile →
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Notifications</h3>

                {!isPushSupported ? (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Push notifications are not supported in this browser
                    </p>
                  </div>
                ) : pushPermission === 'denied' ? (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <BellOff className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-900 mb-1">
                          Notifications blocked
                        </p>
                        <p className="text-xs text-orange-700">
                          Please enable notifications in your browser settings
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Push Notifications
                          </p>
                          <p className="text-xs text-gray-600">
                            Get notified about AI insights
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleTogglePushNotifications}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isPushSubscribed ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                        aria-label={isPushSubscribed ? 'Disable push notifications' : 'Enable push notifications'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isPushSubscribed ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {isPushSubscribed && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-700">
                          ✓ You'll receive notifications about sustainability insights and alerts
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Clear Cache */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Storage</h3>
                <button
                  onClick={handleClearCache}
                  disabled={isClearing}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        Clear Cache
                      </p>
                      <p className="text-xs text-gray-600">
                        Free up storage space
                      </p>
                    </div>
                  </div>
                  {isClearing && (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  )}
                </button>
              </div>

              {/* Desktop Switch Section */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={handleSwitchToDesktop}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        Switch to Desktop
                      </p>
                      <p className="text-xs text-gray-600">
                        Access full platform features
                      </p>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
