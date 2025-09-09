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
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

/**
 * Handle background sync
 */
async function handleBackgroundSync() {
  console.log('Processing background sync...');
  
  try {
    // Get sync queue from IndexedDB or cache
    const syncQueue = await getSyncQueue();
    
    if (syncQueue.length === 0) {
      console.log('No items in sync queue');
      return;
    }
    
    // Process each sync item
    for (const item of syncQueue) {
      try {
        await processSyncItem(item);
        await removeSyncItem(item.id);
        console.log('✅ Synced item:', item.action);
      } catch (error) {
        console.error('❌ Failed to sync item:', item.action, error);
        
        // Increment retry count
        item.retries = (item.retries || 0) + 1;
        if (item.retries >= 3) {
          await removeSyncItem(item.id);
          console.log('Removed failed item after 3 retries:', item.action);
        } else {
          await updateSyncItem(item);
        }
      }
    }
    
    // Notify main thread
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: { processed: syncQueue.length },
        timestamp: new Date()
      });
    });
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

/**
 * Process individual sync item
 */
async function processSyncItem(item) {
  const { action, data } = item;
  
  switch (action) {
    case 'chat_message':
      await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': data.authorization
        },
        body: JSON.stringify(data.payload)
      });
      break;
      
    case 'analytics':
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      break;
      
    default:
      console.warn('Unknown sync action:', action);
  }
}

/**
 * Push notification event
 */
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: 'You have new insights available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ]
  };
  
  if (event.data) {
    const payload = event.data.json();
    Object.assign(options, payload);
  }
  
  event.waitUntil(
    self.registration.showNotification('Blipee', options)
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if app is already open
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

/**
 * Skip waiting message
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
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