/**
 * PWA Install Hook
 *
 * Manages the "Add to Home Screen" install prompt for PWAs
 * Handles the beforeinstallprompt event and tracks installation state
 */

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UsePWAInstallResult {
  isInstallable: boolean;
  isInstalled: boolean;
  showPrompt: boolean;
  promptInstall: () => Promise<boolean>;
  dismissPrompt: () => void;
  isPWA: boolean;
}

export function usePWAInstall(): UsePWAInstallResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if already installed (running in standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone ||
                         document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);
    setIsPWA(isStandalone);

    // Check if user previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedAt = dismissed ? parseInt(dismissed, 10) : 0;
    const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);

    // Don't show if already installed
    if (isStandalone) {
      return;
    }

    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;

      console.log('[PWA] Install prompt available');
      setDeferredPrompt(event);
      setIsInstallable(true);

      // Show prompt if:
      // 1. Never dismissed, OR
      // 2. Dismissed more than 7 days ago
      if (!dismissed || daysSinceDismissed > 7) {
        // Show prompt after 5 seconds to not be intrusive
        setTimeout(() => {
          setShowPrompt(true);
        }, 5000);
      }
    };

    // Handle app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      setIsInstallable(false);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger the install prompt
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;

      console.log('[PWA] User choice:', outcome);

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install');
        setShowPrompt(false);
        return true;
      } else {
        console.log('[PWA] User dismissed install');
        dismissPrompt();
        return false;
      }
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
      return false;
    } finally {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  }, [deferredPrompt]);

  // Dismiss the prompt
  const dismissPrompt = useCallback(() => {
    console.log('[PWA] Install prompt dismissed');
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  }, []);

  return {
    isInstallable,
    isInstalled,
    showPrompt,
    promptInstall,
    dismissPrompt,
    isPWA
  };
}
