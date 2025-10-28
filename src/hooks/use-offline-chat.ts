/**
 * Offline Chat Hook
 *
 * Provides functionality for sending messages offline
 * Messages are queued in IndexedDB and synced when back online
 */

'use client';

import { useState, useEffect } from 'react';
import { addOfflineMessage, getPendingSyncCount, type OfflineMessage } from '@/lib/offline/db';
import { syncQueue } from '@/lib/offline/sync-queue';

export interface UseOfflineChatOptions {
  conversationId: string;
  onSyncComplete?: () => void;
}

export interface UseOfflineChatResult {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  sendOfflineMessage: (content: string) => Promise<void>;
  triggerSync: () => Promise<void>;
}

/**
 * Hook for offline chat functionality
 */
export function useOfflineChat({
  conversationId,
  onSyncComplete
}: UseOfflineChatOptions): UseOfflineChatResult {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending count
  useEffect(() => {
    const updateCount = async () => {
      const count = await getPendingSyncCount();
      setPendingCount(count);
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen for sync completion
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        console.log('[OfflineChat] Sync complete:', event.data);
        getPendingSyncCount().then(setPendingCount);
        onSyncComplete?.();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [onSyncComplete]);

  /**
   * Send a message while offline
   */
  const sendOfflineMessage = async (content: string): Promise<void> => {
    const message: OfflineMessage = {
      id: `offline-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      conversationId,
      content,
      role: 'user',
      timestamp: Date.now(),
      synced: false,
      retries: 0
    };

    await addOfflineMessage(message);
    console.log('[OfflineChat] Message queued for sync:', message.id);

    // Update pending count
    const count = await getPendingSyncCount();
    setPendingCount(count);

    // Register background sync if supported
    if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('offline-sync');
        console.log('[OfflineChat] Background sync registered');
      } catch (error) {
        console.error('[OfflineChat] Failed to register background sync:', error);
      }
    }
  };

  /**
   * Trigger manual sync
   */
  const triggerSync = async (): Promise<void> => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    console.log('[OfflineChat] Triggering manual sync...');

    try {
      const result = await syncQueue.sync();
      console.log('[OfflineChat] Sync result:', result);

      // Update pending count
      const count = await getPendingSyncCount();
      setPendingCount(count);

      onSyncComplete?.();
    } catch (error) {
      console.error('[OfflineChat] Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    pendingCount,
    isSyncing,
    sendOfflineMessage,
    triggerSync
  };
}
