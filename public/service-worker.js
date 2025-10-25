/**
 * Service Worker for Blipee AI Mobile PWA
 * Handles offline functionality, caching, and background sync
 */

const CACHE_NAME = 'blipee-ai-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache on install
const urlsToCache = [
  '/mobile',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/_next/static/css/app/globals.css',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Handle API calls differently
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before caching
          const responseClone = response.clone();

          // Cache successful API responses
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return response;
        })
        .catch(() => {
          // Try to return cached API response when offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle other requests (assets, pages)
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match(OFFLINE_URL);
        }
      })
  );
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'send-messages') {
    event.waitUntil(sendQueuedMessages());
  }
});

// Push notifications for agent insights
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'New insights available',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/mobile',
    },
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Blipee AI', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Helper function to send queued messages
async function sendQueuedMessages() {
  // Get queued messages from IndexedDB
  const messages = await getQueuedMessages();

  for (const message of messages) {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        await removeFromQueue(message.id);
      }
    } catch (error) {
      console.error('Failed to send queued message:', error);
    }
  }
}

// Placeholder functions for IndexedDB operations
async function getQueuedMessages() {
  // Implementation would use IndexedDB
  return [];
}

async function removeFromQueue(id) {
  // Implementation would use IndexedDB
  return true;
}