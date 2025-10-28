/**
 * App Badge Hook
 *
 * React hook for managing PWA app icon badges
 * Shows notification counts on installed PWA home screen icon
 */

import { useEffect, useCallback } from 'react';
import { setBadge, clearBadge, syncBadgeWithServer, isBadgeSupported } from '@/lib/pwa/badge';

interface UseAppBadgeOptions {
  /**
   * Automatically sync badge with server on mount
   */
  autoSync?: boolean;

  /**
   * Clear badge when component mounts (e.g., when user opens a specific page)
   */
  clearOnMount?: boolean;
}

export function useAppBadge(options: UseAppBadgeOptions = {}) {
  const { autoSync = false, clearOnMount = false } = options;
  const isSupported = isBadgeSupported();

  // Auto sync or clear on mount
  useEffect(() => {
    if (!isSupported) return;

    if (clearOnMount) {
      clearBadge();
    } else if (autoSync) {
      syncBadgeWithServer();
    }
  }, [isSupported, autoSync, clearOnMount]);

  // Set badge count
  const updateBadge = useCallback(async (count: number) => {
    if (!isSupported) return false;
    return await setBadge(count);
  }, [isSupported]);

  // Clear badge
  const clear = useCallback(async () => {
    if (!isSupported) return false;
    return await clearBadge();
  }, [isSupported]);

  // Sync with server
  const sync = useCallback(async () => {
    if (!isSupported) return false;
    return await syncBadgeWithServer();
  }, [isSupported]);

  return {
    isSupported,
    updateBadge,
    clearBadge: clear,
    syncBadge: sync
  };
}
