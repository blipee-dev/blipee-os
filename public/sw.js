/**
 * Blipee PWA Service Worker
 * Handles caching, offline functionality, and background sync
 */

const CACHE_NAME = 'blipee-v2024.09.01';
const OFFLINE_URL = '/offline';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/chat',
  '/dashboard',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  // API routes - network first with fallback
  api: {
    pattern: /^\/api\//,
    strategy: 'networkFirst',
    cacheName: 'api-cache',
    maxAge: 60 * 60 * 1000, // 1 hour
    maxEntries: 100
  },
  
  // Static assets - cache first
  static: {
    pattern: /\.(js|css|png|jpg|jpeg|svg|woff2|ico)$/,
    strategy: 'cacheFirst',
    cacheName: 'static-assets',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    maxEntries: 200
  },
  
  // Pages - stale while revalidate
  pages: {
    pattern: /^\/(?!api)/,
    strategy: 'staleWhileRevalidate',
    cacheName: 'pages',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 50
  }
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                !Object.values(CACHE_STRATEGIES).some(s => s.cacheName === cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Cache cleanup completed');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  const url = new URL(event.request.url);
  
  // Determine cache strategy
  let strategy = null;
  for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.pattern.test(url.pathname)) {
      strategy = config;
      break;
    }
  }

  if (strategy) {
    event.respondWith(handleRequest(event.request, strategy));
  }
});

/**
 * Handle request with appropriate caching strategy
 */
async function handleRequest(request, strategy) {
  const cacheName = strategy.cacheName;
  const cache = await caches.open(cacheName);
  
  try {
    switch (strategy.strategy) {
      case 'cacheFirst':
        return await cacheFirst(request, cache);
      case 'networkFirst':
        return await networkFirst(request, cache);
      case 'staleWhileRevalidate':
        return await staleWhileRevalidate(request, cache);
      default:
        return await fetch(request);
    }
  } catch (error) {
    console.error('Request handling failed:', error);
    return await getOfflineFallback(request);
  }
}

/**
 * Cache first strategy
 */
async function cacheFirst(request, cache) {
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  if (networkResponse.status === 200) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

/**
 * Network first strategy
 */
async function networkFirst(request, cache) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Stale while revalidate strategy
 */
async function staleWhileRevalidate(request, cache) {
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, return cached version if available
    return cachedResponse;
  });
  
  return cachedResponse || fetchPromise;
}

/**
 * Get offline fallback response
 */
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For API requests, return cached data or offline response
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'OFFLINE',
        message: 'Request failed - you are offline',
        offline: true,
        cachedAt: new Date().toISOString()
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
  
  // For page requests, return offline page
  const offlineCache = await caches.open(CACHE_NAME);
  const offlineResponse = await offlineCache.match(OFFLINE_URL);
  
  if (offlineResponse) {
    return offlineResponse;
  }
  
  // Fallback offline response
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Offline - Blipee</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0A0E27 0%, #1E2749 100%);
            color: white;
            margin: 0;
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
          }
          .offline-container {
            max-width: 400px;
          }
          .offline-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 { margin-bottom: 10px; }
          p { opacity: 0.8; line-height: 1.5; }
          .retry-btn {
            background: #0066FF;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin-top: 20px;
          }
          .retry-btn:hover {
            background: #0052CC;
          }
        </style>
      </head>
      <body>
        <div class="offline-container">
          <div class="offline-icon">📡</div>
          <h1>You're offline</h1>
          <p>Check your internet connection and try again. Your data is safe and will sync when you're back online.</p>
          <button class="retry-btn" onclick="window.location.reload()">Try Again</button>
        </div>
      </body>
    </html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    }
  );
}

/**
 * Background sync event
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'offline-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

/**
 * Initialize IndexedDB for offline sync
 */
async function initOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('blipee-offline', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('messages')) {
        const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
        messagesStore.createIndex('synced', 'synced', { unique: false });
      }

      if (!db.objectStoreNames.contains('actions')) {
        const actionsStore = db.createObjectStore('actions', { keyPath: 'id' });
        actionsStore.createIndex('synced', 'synced', { unique: false });
      }
    };
  });
}

/**
 * Get unsynced messages from IndexedDB
 */
async function getUnsyncedMessages() {
  const db = await initOfflineDB();
  const transaction = db.transaction(['messages'], 'readonly');
  const store = transaction.objectStore('messages');
  const index = store.index('synced');

  return new Promise((resolve, reject) => {
    const request = index.getAll(false);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get unsynced actions from IndexedDB
 */
async function getUnsyncedActions() {
  const db = await initOfflineDB();
  const transaction = db.transaction(['actions'], 'readonly');
  const store = transaction.objectStore('actions');
  const index = store.index('synced');

  return new Promise((resolve, reject) => {
    const request = index.getAll(false);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark message as synced in IndexedDB
 */
async function markMessageSynced(id) {
  const db = await initOfflineDB();
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
 * Mark action as synced in IndexedDB
 */
async function markActionSynced(id) {
  const db = await initOfflineDB();
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
 * Delete message from IndexedDB
 */
async function deleteOfflineMessage(id) {
  const db = await initOfflineDB();
  const transaction = db.transaction(['messages'], 'readwrite');
  const store = transaction.objectStore('messages');

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete action from IndexedDB
 */
async function deleteOfflineAction(id) {
  const db = await initOfflineDB();
  const transaction = db.transaction(['actions'], 'readwrite');
  const store = transaction.objectStore('actions');

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Handle background sync
 */
async function handleBackgroundSync() {
  console.log('[SW] Processing background sync...');

  let successCount = 0;
  let failedCount = 0;

  try {
    // Sync messages
    const messages = await getUnsyncedMessages();
    console.log(`[SW] Found ${messages.length} unsynced messages`);

    for (const message of messages) {
      try {
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
          console.log(`[SW] ✅ Synced message ${message.id}`);
          successCount++;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`[SW] ❌ Failed to sync message ${message.id}:`, error);
        message.retries = (message.retries || 0) + 1;

        if (message.retries >= 3) {
          await deleteOfflineMessage(message.id);
          console.log(`[SW] Removed message ${message.id} after max retries`);
        }

        failedCount++;
      }
    }

    // Sync actions
    const actions = await getUnsyncedActions();
    console.log(`[SW] Found ${actions.length} unsynced actions`);

    for (const action of actions) {
      try {
        let endpoint = '';
        let method = 'POST';

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
            console.warn(`[SW] Unknown action type: ${action.type}`);
            continue;
        }

        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(action.data)
        });

        if (response.ok) {
          await markActionSynced(action.id);
          console.log(`[SW] ✅ Synced action ${action.id}`);
          successCount++;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`[SW] ❌ Failed to sync action ${action.id}:`, error);
        action.retries = (action.retries || 0) + 1;

        if (action.retries >= 3) {
          await deleteOfflineAction(action.id);
          console.log(`[SW] Removed action ${action.id} after max retries`);
        }

        failedCount++;
      }
    }

    // Notify main thread
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        success: successCount,
        failed: failedCount,
        timestamp: new Date().toISOString()
      });
    });

    console.log(`[SW] Sync complete: ${successCount} success, ${failedCount} failed`);
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  // Default options
  let options = {
    title: 'Blipee',
    body: 'You have new insights available',
    icon: '/icon-192.png',
    badge: '/favicon.svg',
    vibrate: [200, 100, 200],
    data: {
      url: '/mobile'
    },
    tag: 'blipee-notification',
    requireInteraction: false
  };

  // Parse payload if available
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[SW] Push payload:', payload);

      // Merge payload with defaults
      options = {
        ...options,
        ...payload,
        title: payload.title || options.title,
        body: payload.body || options.body
      };
    } catch (error) {
      console.error('[SW] Error parsing push payload:', error);
    }
  }

  event.waitUntil(
    Promise.all([
      // Show notification
      self.registration.showNotification(options.title, options),
      // Update app badge
      updateBadge()
    ])
  );
});

/**
 * Update app badge with unread count
 */
async function updateBadge() {
  try {
    // Check if Badge API is supported
    if (!navigator.setAppBadge) {
      console.log('[SW] Badge API not supported');
      return;
    }

    // Fetch unread count from server
    const response = await fetch('/api/messages/unread');
    if (!response.ok) {
      console.error('[SW] Failed to fetch unread count');
      return;
    }

    const data = await response.json();
    const unreadCount = data.count || 0;

    console.log(`[SW] Updating badge to ${unreadCount}`);

    if (unreadCount > 0) {
      await navigator.setAppBadge(unreadCount);
    } else {
      await navigator.clearAppBadge();
    }
  } catch (error) {
    console.error('[SW] Error updating badge:', error);
  }
}

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  // Handle action buttons
  if (event.action === 'dismiss') {
    // Clear badge when dismissed
    clearBadgeCount();
    return;
  }

  // Get URL from notification data, default to /mobile
  const url = event.notification.data?.url || '/mobile';

  // If conversationId is in data, open that conversation
  const conversationId = event.notification.data?.conversationId;
  const targetUrl = conversationId ? `/mobile?conversation=${conversationId}` : url;

  console.log('[SW] Opening URL:', targetUrl);

  event.waitUntil(
    Promise.all([
      // Clear badge when user opens the notification
      clearBadgeCount(),
      // Open or focus the app
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes('/mobile') && 'focus' in client) {
            client.focus();
            // Navigate to the target URL
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              conversationId: conversationId,
              url: targetUrl
            });
            return client;
          }
        }

        // Open new window if app not open
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
    ])
  );
});

/**
 * Clear app badge
 */
async function clearBadgeCount() {
  try {
    if (navigator.clearAppBadge) {
      await navigator.clearAppBadge();
      console.log('[SW] Badge cleared');
    }
  } catch (error) {
    console.error('[SW] Error clearing badge:', error);
  }
}

/**
 * Skip waiting message
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Handle badge update requests from main app
  if (event.data && event.data.type === 'UPDATE_BADGE') {
    const count = event.data.count || 0;
    console.log(`[SW] Updating badge to ${count} (from client message)`);

    if (navigator.setAppBadge) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(err => {
          console.error('[SW] Error setting badge:', err);
        });
      } else {
        navigator.clearAppBadge().catch(err => {
          console.error('[SW] Error clearing badge:', err);
        });
      }
    }
  }
});

/**
 * Helper functions for sync queue management
 * In a real implementation, these would use IndexedDB
 */
async function getSyncQueue() {
  // Mock implementation - in real app, use IndexedDB
  return [];
}

async function removeSyncItem(id) {
  // Mock implementation
  console.log('Remove sync item:', id);
}

async function updateSyncItem(item) {
  // Mock implementation
  console.log('Update sync item:', item);
}

console.log('✅ Blipee Service Worker loaded successfully');