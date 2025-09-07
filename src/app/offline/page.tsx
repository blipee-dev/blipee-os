/**
 * Offline Page
 * Displayed when user is offline and requests a page not in cache
 */

'use client';

import { useEffect, useState } from 'react';
import { pwaManager } from '@/lib/pwa/pwa-manager';

export default function OfflinePage() {
  const [syncQueue, setSyncQueue] = useState(0);
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null);

  useEffect(() => {
    // Get PWA status
    const status = pwaManager.getStatus();
    setSyncQueue(status.syncQueueLength);

    // Listen for online/offline events
    const handleOnline = () => {
      console.log('Back online! Attempting to sync...');
      setLastSyncAttempt(new Date());
      window.location.reload();
    };

    const handleOffline = () => {
      console.log('Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    } else {
      alert('You are still offline. Please check your internet connection.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center text-4xl backdrop-blur-sm">
            📡
          </div>
          <div className="w-16 h-1 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
        </div>

        {/* Status */}
        <h1 className="text-3xl font-bold text-white mb-4">
          You're offline
        </h1>
        
        <p className="text-blue-100 mb-8 leading-relaxed">
          No worries! Your data is safe and will sync automatically when you're back online. 
          You can still view cached content and your changes will be saved.
        </p>

        {/* Stats */}
        <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-8">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-blue-200">Queued for sync</div>
              <div className="text-xl font-semibold text-white">{syncQueue}</div>
            </div>
            <div>
              <div className="text-blue-200">Connection</div>
              <div className="text-xl font-semibold text-red-400">Offline</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 backdrop-blur-sm"
          >
            Go Back
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 text-left">
          <h3 className="text-white font-medium mb-3">💡 While you're offline:</h3>
          <ul className="text-blue-100 text-sm space-y-2">
            <li>• View cached conversations and data</li>
            <li>• Continue working - changes will sync later</li>
            <li>• Check your device's internet connection</li>
            <li>• Try moving to a different location</li>
          </ul>
        </div>

        {/* Sync Status */}
        {lastSyncAttempt && (
          <div className="mt-6 text-xs text-blue-300">
            Last sync attempt: {lastSyncAttempt.toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}