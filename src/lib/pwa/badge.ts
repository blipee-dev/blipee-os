/**
 * PWA Badge API Utilities
 *
 * Manages app icon badges to show notification counts
 * Works on Android, Windows, and macOS (when installed as PWA)
 */

/**
 * Check if Badge API is supported
 */
export function isBadgeSupported(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Check for Badge API support (Chrome, Edge, Safari 16.4+)
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
}

/**
 * Check if running on iOS
 */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;

  return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Check if running as standalone PWA on iOS
 */
function isIOSPWA(): boolean {
  return isIOS() && (window.navigator as any).standalone === true;
}

/**
 * Set badge count on app icon
 * @param count - Number to display on badge (0-99, typically)
 */
export async function setBadge(count: number): Promise<boolean> {
  if (!isBadgeSupported()) {
    console.log('[Badge] Badge API not supported on this browser');
    if (isIOS() && !isIOSPWA()) {
      console.log('[Badge] iOS detected but not running as PWA. Install app to home screen for badge support.');
    }
    return false;
  }

  try {
    // Chrome/Edge limits badge to 99, showing "99+" for higher values
    // Safari on iOS also respects this limit
    const badgeCount = Math.min(count, 99);

    if (badgeCount > 0) {
      await (navigator as any).setAppBadge(badgeCount);
      const platform = isIOSPWA() ? 'iOS PWA' : isIOS() ? 'iOS' : 'Desktop';
      console.log(`[Badge] Set app badge to ${badgeCount} (${platform})`);
      return true;
    } else {
      // Clear badge if count is 0
      return await clearBadge();
    }
  } catch (error) {
    console.error('[Badge] Error setting app badge:', error);
    if (isIOS()) {
      console.log('[Badge] iOS detected. Ensure you are running iOS 16.4+ and app is installed to home screen.');
    }
    return false;
  }
}

/**
 * Clear badge from app icon
 */
export async function clearBadge(): Promise<boolean> {
  if (!isBadgeSupported()) {
    return false;
  }

  try {
    await (navigator as any).clearAppBadge();
    console.log('[Badge] Cleared app badge');
    return true;
  } catch (error) {
    console.error('[Badge] Error clearing app badge:', error);
    return false;
  }
}

/**
 * Increment badge count by a value
 * Note: This requires storing current count in localStorage since Badge API
 * doesn't provide a way to read the current badge value
 */
export async function incrementBadge(amount: number = 1): Promise<boolean> {
  if (!isBadgeSupported()) {
    return false;
  }

  try {
    const currentCount = parseInt(localStorage.getItem('badge-count') || '0', 10);
    const newCount = Math.max(0, currentCount + amount);

    localStorage.setItem('badge-count', newCount.toString());
    return await setBadge(newCount);
  } catch (error) {
    console.error('[Badge] Error incrementing badge:', error);
    return false;
  }
}

/**
 * Decrement badge count by a value
 */
export async function decrementBadge(amount: number = 1): Promise<boolean> {
  return await incrementBadge(-amount);
}

/**
 * Sync badge with server unread count
 * Call this when app opens or when notifications are read
 */
export async function syncBadgeWithServer(): Promise<boolean> {
  if (!isBadgeSupported()) {
    return false;
  }

  try {
    const response = await fetch('/api/messages/unread');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const unreadCount = data.count || 0;

    // Store in localStorage for future increments
    localStorage.setItem('badge-count', unreadCount.toString());

    return await setBadge(unreadCount);
  } catch (error) {
    console.error('[Badge] Error syncing badge with server:', error);
    return false;
  }
}

/**
 * Get current badge count from localStorage
 */
export function getBadgeCount(): number {
  try {
    return parseInt(localStorage.getItem('badge-count') || '0', 10);
  } catch {
    return 0;
  }
}
