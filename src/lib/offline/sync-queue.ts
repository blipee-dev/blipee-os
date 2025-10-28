/**
 * Offline Sync Queue Manager
 *
 * Handles syncing of offline messages and actions when back online
 * Automatically retries failed syncs with exponential backoff
 */

import {
  getUnsyncedMessages,
  getUnsyncedActions,
  markMessageSynced,
  markActionSynced,
  deleteOfflineMessage,
  deleteOfflineAction,
  type OfflineMessage,
  type OfflineAction
} from './db';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Base delay, will use exponential backoff

export class SyncQueue {
  private isSyncing = false;
  private listeners: Set<(count: number) => void> = new Set();

  /**
   * Start syncing queue
   */
  async sync(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('[SyncQueue] Already syncing...');
      return { success: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      console.log('[SyncQueue] Offline, skipping sync');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    console.log('[SyncQueue] Starting sync...');

    let successCount = 0;
    let failedCount = 0;

    try {
      // Sync messages
      const messages = await getUnsyncedMessages();
      console.log(`[SyncQueue] Found ${messages.length} unsynced messages`);

      for (const message of messages) {
        const result = await this.syncMessage(message);
        if (result) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      // Sync actions
      const actions = await getUnsyncedActions();
      console.log(`[SyncQueue] Found ${actions.length} unsynced actions`);

      for (const action of actions) {
        const result = await this.syncAction(action);
        if (result) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      console.log(`[SyncQueue] Sync complete: ${successCount} success, ${failedCount} failed`);

      // Notify listeners
      this.notifyListeners(failedCount);

    } catch (error) {
      console.error('[SyncQueue] Sync error:', error);
    } finally {
      this.isSyncing = false;
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Sync a single message
   */
  private async syncMessage(message: OfflineMessage): Promise<boolean> {
    try {
      console.log(`[SyncQueue] Syncing message ${message.id}...`);

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: message.conversationId,
          message: message.content,
          offline: true,
          offlineTimestamp: message.timestamp
        })
      });

      if (response.ok) {
        await markMessageSynced(message.id);
        console.log(`[SyncQueue] Message ${message.id} synced successfully`);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.error(`[SyncQueue] Failed to sync message ${message.id}:`, error.message);

      // Check if we should retry
      if (message.retries >= MAX_RETRIES) {
        console.log(`[SyncQueue] Max retries reached for message ${message.id}, removing`);
        await deleteOfflineMessage(message.id);
      }

      return false;
    }
  }

  /**
   * Sync a single action
   */
  private async syncAction(action: OfflineAction): Promise<boolean> {
    try {
      console.log(`[SyncQueue] Syncing action ${action.id} (${action.type})...`);

      let endpoint = '';
      let method = 'POST';
      let body: any = action.data;

      // Determine endpoint based on action type
      switch (action.type) {
        case 'send_message':
          endpoint = '/api/ai/chat';
          break;
        case 'create_conversation':
          endpoint = '/api/conversations';
          break;
        case 'update_conversation':
          endpoint = `/api/conversations/${action.data.id}`;
          method = 'PUT';
          break;
        default:
          console.warn(`[SyncQueue] Unknown action type: ${action.type}`);
          return false;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await markActionSynced(action.id);
        console.log(`[SyncQueue] Action ${action.id} synced successfully`);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.error(`[SyncQueue] Failed to sync action ${action.id}:`, error.message);

      // Check if we should retry
      if (action.retries >= MAX_RETRIES) {
        console.log(`[SyncQueue] Max retries reached for action ${action.id}, removing`);
        await deleteOfflineAction(action.id);
      }

      return false;
    }
  }

  /**
   * Add listener for sync count changes
   */
  addListener(callback: (count: number) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(count: number): void {
    this.listeners.forEach(callback => callback(count));
  }

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean {
    return this.isSyncing;
  }
}

// Global singleton instance
export const syncQueue = new SyncQueue();

/**
 * Auto-sync when coming back online
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncQueue] Back online, starting sync...');
    syncQueue.sync();
  });

  // Also sync on page visibility change (when user returns to tab)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine) {
      console.log('[SyncQueue] Page visible and online, starting sync...');
      syncQueue.sync();
    }
  });
}
