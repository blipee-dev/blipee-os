'use client';

import React, { useState, useEffect } from 'react';
import { Database, Wifi, WifiOff, Trash2, RefreshCw, HardDrive } from 'lucide-react';
import { getPendingSyncCount, clearSynced } from '@/lib/offline/db';
import { syncQueue } from '@/lib/offline/sync-queue';

export default function AppSettingsPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ used: number; quota: number } | null>(null);
  const [autoSync, setAutoSync] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('blipee-auto-sync') !== 'false';
    }
    return true;
  });

  // Check online status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending sync count
  useEffect(() => {
    const updateCount = async () => {
      const count = await getPendingSyncCount();
      setPendingSyncCount(count);
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Get storage usage
  useEffect(() => {
    const getStorageInfo = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        setStorageUsage({
          used: estimate.usage || 0,
          quota: estimate.quota || 0
        });
      }
    };

    getStorageInfo();
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      const result = await syncQueue.sync();
      console.log(`Sync complete: ${result.success} success, ${result.failed} failed`);

      // Update pending count
      const count = await getPendingSyncCount();
      setPendingSyncCount(count);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearSynced = async () => {
    if (confirm('Clear all synced data from local storage? This will not affect your online data.')) {
      try {
        await clearSynced();
        console.log('Synced data cleared');

        // Update storage info
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          setStorageUsage({
            used: estimate.usage || 0,
            quota: estimate.quota || 0
          });
        }
      } catch (error) {
        console.error('Error clearing synced data:', error);
      }
    }
  };

  const handleToggleAutoSync = () => {
    const newValue = !autoSync;
    setAutoSync(newValue);
    localStorage.setItem('blipee-auto-sync', newValue.toString());
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">App Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage offline mode, sync, and local storage
        </p>
      </div>

      {/* Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-orange-600" />
          )}
          <h2 className="text-xl font-semibold">Connection Status</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className={`text-lg font-medium ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isOnline
                ? 'Connected to server'
                : 'Working offline - changes will sync when connection returns'}
            </p>
          </div>

          {pendingSyncCount > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{pendingSyncCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending items</p>
            </div>
          )}
        </div>
      </div>

      {/* Offline Mode Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Offline Mode</h2>
        </div>

        <div className="space-y-4">
          {/* Auto Sync Toggle */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <p className="font-medium">Auto-sync when online</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically sync pending changes when connection is available
              </p>
            </div>
            <button
              onClick={handleToggleAutoSync}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoSync ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoSync ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Manual Sync */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Manual sync</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sync pending changes now
              </p>
            </div>
            <button
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing || pendingSyncCount === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Storage Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <HardDrive className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-semibold">Local Storage</h2>
        </div>

        <div className="space-y-4">
          {/* Storage Usage */}
          {storageUsage && (
            <div className="py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium">Storage used</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.quota)}
                </p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min((storageUsage.used / storageUsage.quota) * 100, 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Clear Synced Data */}
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Clear synced data</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remove synced messages and actions from local storage
              </p>
            </div>
            <button
              onClick={handleClearSynced}
              className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
