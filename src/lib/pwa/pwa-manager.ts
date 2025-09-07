/**
 * PWA (Progressive Web App) Manager
 * Handles offline functionality, service workers, and mobile app features
 */

import type { BeforeInstallPromptEvent } from './types';

export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  theme: {
    primaryColor: string;
    backgroundColor: string;
    statusBarStyle: 'default' | 'black' | 'black-translucent';
  };
  icons: PWAIcon[];
  features: {
    offline: boolean;
    pushNotifications: boolean;
    backgroundSync: boolean;
    cameraAccess: boolean;
    geolocation: boolean;
    fileSystem: boolean;
  };
  caching: {
    strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate';
    maxAge: number; // seconds
    maxEntries: number;
    routes: CacheRoute[];
  };
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export interface CacheRoute {
  pattern: RegExp;
  strategy: 'cache-first' | 'network-first' | 'network-only' | 'cache-only' | 'stale-while-revalidate';
  expiration?: {
    maxEntries?: number;
    maxAgeSeconds?: number;
    purgeOnQuotaError?: boolean;
  };
}

export interface ServiceWorkerMessage {
  type: string;
  data: any;
  timestamp: Date;
}

export interface InstallPrompt {
  platform: string;
  supported: boolean;
  installed: boolean;
  installable: boolean;
  lastPrompted?: Date;
  userChoice?: 'accepted' | 'dismissed' | 'default';
}

export interface OfflineData {
  chats: any[];
  organizations: any[];
  buildings: any[];
  syncQueue: any[];
  lastSync: Date;
}

/**
 * PWA Manager
 * Central management for Progressive Web App features
 */
export class PWAManager {
  private config: PWAConfig;
  private serviceWorker: ServiceWorker | null = null;
  private installPrompt: BeforeInstallPromptEvent | null = null;
  private syncQueue: any[] = [];
  private offlineStorage: Map<string, any> = new Map();

  constructor() {
    this.config = this.getDefaultConfig();
    this.initializePWA();
  }

  /**
   * Get default PWA configuration
   */
  private getDefaultConfig(): PWAConfig {
    return {
      name: 'Blipee - Autonomous Sustainability Intelligence',
      shortName: 'Blipee',
      description: 'AI-powered sustainability insights and building optimization',
      theme: {
        primaryColor: '#0066FF',
        backgroundColor: '#0A0E27',
        statusBarStyle: 'black'
      },
      icons: [
        {
          src: '/icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png'
        },
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png'
        },
        {
          src: '/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png'
        },
        {
          src: '/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png'
        },
        {
          src: '/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png'
        },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      features: {
        offline: true,
        pushNotifications: true,
        backgroundSync: true,
        cameraAccess: true,
        geolocation: true,
        fileSystem: true
      },
      caching: {
        strategy: 'stale-while-revalidate',
        maxAge: 86400, // 24 hours
        maxEntries: 100,
        routes: [
          {
            pattern: /^\/api\/ai\/chat/,
            strategy: 'network-first',
            expiration: {
              maxAgeSeconds: 3600, // 1 hour
              maxEntries: 50
            }
          },
          {
            pattern: /^\/api\/organizations/,
            strategy: 'stale-while-revalidate',
            expiration: {
              maxAgeSeconds: 86400, // 24 hours
              maxEntries: 20
            }
          },
          {
            pattern: /\.(js|css|png|jpg|jpeg|svg|woff2)$/,
            strategy: 'cache-first',
            expiration: {
              maxAgeSeconds: 604800, // 1 week
              maxEntries: 200
            }
          }
        ]
      }
    };
  }

  /**
   * Initialize PWA features
   */
  private async initializePWA(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // Register service worker
      await this.registerServiceWorker();
      
      // Set up install prompt handling
      this.setupInstallPrompt();
      
      // Initialize offline storage
      this.initializeOfflineStorage();
      
      // Set up background sync
      this.setupBackgroundSync();
      
      // Request permissions
      await this.requestPermissions();
      
      console.log('✅ PWA initialized successfully');
    } catch (error) {
      console.error('❌ PWA initialization failed:', error);
    }
  }

  /**
   * Register service worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('Service Worker registered:', registration);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.handleServiceWorkerUpdate(registration);
            }
          });
        }
      });

      // Set up message handling
      navigator.serviceWorker.addEventListener('message', (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

      this.serviceWorker = registration.active;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Set up install prompt handling
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as BeforeInstallPromptEvent;
      
      // Show custom install UI
      this.showInstallPrompt();
    });

    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      this.installPrompt = null;
      
      // Track installation
      this.trackEvent('pwa_installed', {
        timestamp: new Date(),
        userAgent: navigator.userAgent
      });
    });
  }

  /**
   * Show custom install prompt
   */
  private showInstallPrompt(): void {
    // Create custom install banner
    const banner = document.createElement('div');
    banner.className = 'pwa-install-banner';
    banner.innerHTML = `
      <div class="pwa-banner-content">
        <div class="pwa-banner-icon">📱</div>
        <div class="pwa-banner-text">
          <h3>Install Blipee App</h3>
          <p>Get the full app experience with offline access and notifications</p>
        </div>
        <div class="pwa-banner-actions">
          <button class="pwa-install-btn">Install</button>
          <button class="pwa-dismiss-btn">×</button>
        </div>
      </div>
    `;

    // Add event listeners
    const installBtn = banner.querySelector('.pwa-install-btn');
    const dismissBtn = banner.querySelector('.pwa-dismiss-btn');
    
    installBtn?.addEventListener('click', () => {
      this.promptInstall();
      banner.remove();
    });

    dismissBtn?.addEventListener('click', () => {
      banner.remove();
      // Store dismissal to avoid showing too frequently
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    });

    // Check if recently dismissed
    const lastDismissed = localStorage.getItem('pwa-install-dismissed');
    const daysSinceDismissal = lastDismissed ? 
      (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24) : 7;

    if (daysSinceDismissal >= 7) {
      document.body.appendChild(banner);
    }
  }

  /**
   * Prompt user to install PWA
   */
  async promptInstall(): Promise<boolean> {
    if (!this.installPrompt) return false;

    try {
      const result = await this.installPrompt.prompt();
      const userChoice = await result.userChoice;
      
      this.trackEvent('pwa_install_prompt', {
        outcome: userChoice,
        timestamp: new Date()
      });

      this.installPrompt = null;
      return userChoice === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    }
  }

  /**
   * Check if PWA is installed
   */
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           document.referrer.includes('android-app://');
  }

  /**
   * Initialize offline storage
   */
  private async initializeOfflineStorage(): Promise<void> {
    try {
      // Check for existing offline data
      const offlineData = localStorage.getItem('blipee-offline-data');
      if (offlineData) {
        const data = JSON.parse(offlineData);
        Object.entries(data).forEach(([key, value]) => {
          this.offlineStorage.set(key, value);
        });
      }

      console.log('Offline storage initialized');
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  }

  /**
   * Store data for offline access
   */
  async storeOfflineData(key: string, data: any): Promise<void> {
    try {
      this.offlineStorage.set(key, {
        data,
        timestamp: new Date(),
        synced: false
      });

      // Persist to localStorage
      const offlineData = Object.fromEntries(this.offlineStorage);
      localStorage.setItem('blipee-offline-data', JSON.stringify(offlineData));
      
      console.log(`Stored offline data: ${key}`);
    } catch (error) {
      console.error('Failed to store offline data:', error);
    }
  }

  /**
   * Retrieve offline data
   */
  getOfflineData(key: string): any | null {
    const stored = this.offlineStorage.get(key);
    return stored ? stored.data : null;
  }

  /**
   * Set up background sync
   */
  private setupBackgroundSync(): void {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      console.warn('Background sync not supported');
      return;
    }

    // Register sync events
    navigator.serviceWorker.ready.then((registration) => {
      return (registration as any).sync?.register('background-sync');
    }).catch((error) => {
      console.error('Background sync registration failed:', error);
    });
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(action: string, data: any): Promise<void> {
    const syncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: new Date(),
      retries: 0
    };

    this.syncQueue.push(syncItem);
    
    // Store in offline storage
    await this.storeOfflineData('syncQueue', this.syncQueue);

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.processSyncQueue();
    }
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) return;

    console.log(`Processing ${this.syncQueue.length} sync items...`);

    const itemsToRemove: string[] = [];

    for (const item of this.syncQueue) {
      try {
        await this.syncItem(item);
        itemsToRemove.push(item.id);
        console.log(`✅ Synced: ${item.action}`);
      } catch (error) {
        item.retries++;
        if (item.retries >= 3) {
          console.error(`❌ Failed to sync after 3 attempts: ${item.action}`, error);
          itemsToRemove.push(item.id);
        } else {
          console.warn(`⚠️ Sync failed, will retry: ${item.action}`, error);
        }
      }
    }

    // Remove completed/failed items
    this.syncQueue = this.syncQueue.filter(item => !itemsToRemove.includes(item.id));
    await this.storeOfflineData('syncQueue', this.syncQueue);
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: any): Promise<void> {
    switch (item.action) {
      case 'chat_message':
        await this.syncChatMessage(item.data);
        break;
      case 'organization_update':
        await this.syncOrganizationUpdate(item.data);
        break;
      case 'building_update':
        await this.syncBuildingUpdate(item.data);
        break;
      default:
        throw new Error(`Unknown sync action: ${item.action}`);
    }
  }

  /**
   * Sync chat message
   */
  private async syncChatMessage(data: any): Promise<void> {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('api-key')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  /**
   * Sync organization update
   */
  private async syncOrganizationUpdate(data: any): Promise<void> {
    // Implementation for syncing organization updates
    console.log('Syncing organization update:', data);
  }

  /**
   * Sync building update
   */
  private async syncBuildingUpdate(data: any): Promise<void> {
    // Implementation for syncing building updates
    console.log('Syncing building update:', data);
  }

  /**
   * Request permissions for PWA features
   */
  private async requestPermissions(): Promise<void> {
    const permissions = [];

    // Request notification permission
    if ('Notification' in window && this.config.features.pushNotifications) {
      if (Notification.permission === 'default') {
        permissions.push(Notification.requestPermission());
      }
    }

    // Request geolocation permission
    if ('geolocation' in navigator && this.config.features.geolocation) {
      permissions.push(
        new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve('granted'),
            () => resolve('denied')
          );
        })
      );
    }

    // Request camera permission (will be requested when needed)
    if ('mediaDevices' in navigator && this.config.features.cameraAccess) {
      // Camera permission requested on demand
    }

    try {
      const results = await Promise.all(permissions);
      console.log('Permissions requested:', results);
    } catch (error) {
      console.error('Permission request failed:', error);
    }
  }

  /**
   * Handle service worker messages
   */
  private handleServiceWorkerMessage(message: ServiceWorkerMessage): void {
    switch (message.type) {
      case 'SYNC_COMPLETE':
        console.log('Background sync completed');
        this.processSyncQueue();
        break;
      case 'CACHE_UPDATED':
        console.log('Cache updated:', message.data);
        break;
      case 'OFFLINE_FALLBACK':
        console.log('Using offline fallback');
        this.handleOfflineMode();
        break;
    }
  }

  /**
   * Handle service worker update
   */
  private handleServiceWorkerUpdate(registration: ServiceWorkerRegistration): void {
    // Show update notification
    const updateBanner = document.createElement('div');
    updateBanner.className = 'pwa-update-banner';
    updateBanner.innerHTML = `
      <div class="pwa-update-content">
        <span>🔄 App update available</span>
        <button class="pwa-update-btn">Reload</button>
      </div>
    `;

    const updateBtn = updateBanner.querySelector('.pwa-update-btn');
    updateBtn?.addEventListener('click', () => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    });

    document.body.appendChild(updateBanner);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      updateBanner.remove();
    }, 10000);
  }

  /**
   * Handle offline mode
   */
  private handleOfflineMode(): void {
    // Show offline indicator
    const offlineIndicator = document.createElement('div');
    offlineIndicator.className = 'pwa-offline-indicator';
    offlineIndicator.textContent = '📡 Working offline';
    
    document.body.appendChild(offlineIndicator);

    // Remove when back online
    const handleOnline = () => {
      offlineIndicator.remove();
      this.processSyncQueue();
      window.removeEventListener('online', handleOnline);
    };

    window.addEventListener('online', handleOnline);
  }

  /**
   * Get PWA manifest
   */
  getManifest(): any {
    return {
      name: this.config.name,
      short_name: this.config.shortName,
      description: this.config.description,
      start_url: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      theme_color: this.config.theme.primaryColor,
      background_color: this.config.theme.backgroundColor,
      icons: this.config.icons,
      categories: ['productivity', 'business', 'utilities'],
      lang: 'en',
      dir: 'ltr',
      scope: '/',
      prefer_related_applications: false,
      shortcuts: [
        {
          name: 'New Chat',
          short_name: 'Chat',
          description: 'Start a new AI conversation',
          url: '/chat?source=shortcut',
          icons: [{ src: '/icons/shortcut-chat.png', sizes: '96x96' }]
        },
        {
          name: 'Dashboard',
          short_name: 'Dashboard',
          description: 'View your sustainability dashboard',
          url: '/dashboard?source=shortcut',
          icons: [{ src: '/icons/shortcut-dashboard.png', sizes: '96x96' }]
        }
      ]
    };
  }

  /**
   * Track PWA events
   */
  private trackEvent(event: string, data: any): void {
    // Send to analytics
    console.log(`PWA Event: ${event}`, data);
    
    // Store locally for sync
    this.addToSyncQueue('analytics', {
      event,
      data,
      timestamp: new Date()
    });
  }

  /**
   * Get PWA status
   */
  getStatus(): {
    installed: boolean;
    serviceWorkerActive: boolean;
    offlineReady: boolean;
    syncQueueLength: number;
    permissions: Record<string, string>;
  } {
    return {
      installed: this.isInstalled(),
      serviceWorkerActive: !!this.serviceWorker,
      offlineReady: this.offlineStorage.size > 0,
      syncQueueLength: this.syncQueue.length,
      permissions: {
        notifications: 'Notification' in window ? Notification.permission : 'unsupported',
        geolocation: 'geolocation' in navigator ? 'supported' : 'unsupported'
      }
    };
  }
}

/**
 * Global PWA manager instance
 */
export const pwaManager = new PWAManager();