/**
 * Offline Database
 *
 * IndexedDB wrapper for offline data storage
 * Stores chat messages, actions, and sync queue
 */

const DB_NAME = 'blipee-offline';
const DB_VERSION = 1;

export interface OfflineMessage {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  synced: boolean;
  retries: number;
  error?: string;
}

export interface OfflineAction {
  id: string;
  type: 'send_message' | 'create_conversation' | 'update_conversation';
  data: any;
  timestamp: number;
  synced: boolean;
  retries: number;
  error?: string;
}

/**
 * Initialize IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Messages store
      if (!db.objectStoreNames.contains('messages')) {
        const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
        messagesStore.createIndex('conversationId', 'conversationId', { unique: false });
        messagesStore.createIndex('synced', 'synced', { unique: false });
        messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Actions store (sync queue)
      if (!db.objectStoreNames.contains('actions')) {
        const actionsStore = db.createObjectStore('actions', { keyPath: 'id' });
        actionsStore.createIndex('synced', 'synced', { unique: false });
        actionsStore.createIndex('timestamp', 'timestamp', { unique: false });
        actionsStore.createIndex('type', 'type', { unique: false });
      }

      // Conversations cache
      if (!db.objectStoreNames.contains('conversations')) {
        const conversationsStore = db.createObjectStore('conversations', { keyPath: 'id' });
        conversationsStore.createIndex('updated_at', 'updated_at', { unique: false });
      }
    };
  });
}

/**
 * Add message to offline queue
 */
export async function addOfflineMessage(message: OfflineMessage): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(['messages'], 'readwrite');
  const store = transaction.objectStore('messages');

  await new Promise<void>((resolve, reject) => {
    const request = store.add(message);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all unsynced messages
 */
export async function getUnsyncedMessages(): Promise<OfflineMessage[]> {
  const db = await initDB();
  const transaction = db.transaction(['messages'], 'readonly');
  const store = transaction.objectStore('messages');

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const allMessages = request.result || [];
      const unsynced = allMessages.filter(msg => !msg.synced);
      resolve(unsynced);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark message as synced
 */
export async function markMessageSynced(id: string): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(['messages'], 'readwrite');
  const store = transaction.objectStore('messages');

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const message = getRequest.result;
      if (message) {
        message.synced = true;
        const putRequest = store.put(message);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Delete message from offline queue
 */
export async function deleteOfflineMessage(id: string): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(['messages'], 'readwrite');
  const store = transaction.objectStore('messages');

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add action to sync queue
 */
export async function addOfflineAction(action: OfflineAction): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(['actions'], 'readwrite');
  const store = transaction.objectStore('actions');

  return new Promise((resolve, reject) => {
    const request = store.add(action);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all unsynced actions
 */
export async function getUnsyncedActions(): Promise<OfflineAction[]> {
  const db = await initDB();
  const transaction = db.transaction(['actions'], 'readonly');
  const store = transaction.objectStore('actions');

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const allActions = request.result || [];
      const unsynced = allActions.filter(action => !action.synced);
      resolve(unsynced);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark action as synced
 */
export async function markActionSynced(id: string): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(['actions'], 'readwrite');
  const store = transaction.objectStore('actions');

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const action = getRequest.result;
      if (action) {
        action.synced = true;
        const putRequest = store.put(action);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Delete action from sync queue
 */
export async function deleteOfflineAction(id: string): Promise<void> {
  const db = await initDB();
  const transaction = db.transaction(['actions'], 'readwrite');
  const store = transaction.objectStore('actions');

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all synced messages and actions
 */
export async function clearSynced(): Promise<void> {
  const db = await initDB();

  // Clear synced messages
  const messagesTransaction = db.transaction(['messages'], 'readwrite');
  const messagesStore = messagesTransaction.objectStore('messages');
  const messagesIndex = messagesStore.index('synced');

  await new Promise<void>((resolve, reject) => {
    const request = messagesIndex.openCursor(true);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });

  // Clear synced actions
  const actionsTransaction = db.transaction(['actions'], 'readwrite');
  const actionsStore = actionsTransaction.objectStore('actions');
  const actionsIndex = actionsStore.index('synced');

  await new Promise<void>((resolve, reject) => {
    const request = actionsIndex.openCursor(true);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get pending sync count
 */
export async function getPendingSyncCount(): Promise<number> {
  const messages = await getUnsyncedMessages();
  const actions = await getUnsyncedActions();
  return messages.length + actions.length;
}
