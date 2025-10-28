/**
 * Haptic Feedback Utilities
 *
 * Provides tactile feedback for mobile interactions
 * Works on iOS and Android devices that support vibration
 */

/**
 * Check if device supports haptic feedback
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Light haptic feedback
 * Use for: button taps, toggles, selections
 */
export function hapticLight(): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(10);
  } catch (error) {
    console.error('[Haptics] Error triggering light haptic:', error);
  }
}

/**
 * Medium haptic feedback
 * Use for: confirmations, menu opens, state changes
 */
export function hapticMedium(): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(20);
  } catch (error) {
    console.error('[Haptics] Error triggering medium haptic:', error);
  }
}

/**
 * Heavy haptic feedback
 * Use for: errors, important actions, alerts
 */
export function hapticHeavy(): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(30);
  } catch (error) {
    console.error('[Haptics] Error triggering heavy haptic:', error);
  }
}

/**
 * Success haptic pattern
 * Use for: successful actions, completions
 */
export function hapticSuccess(): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate([10, 50, 10]);
  } catch (error) {
    console.error('[Haptics] Error triggering success haptic:', error);
  }
}

/**
 * Error haptic pattern
 * Use for: failed actions, validation errors
 */
export function hapticError(): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate([20, 50, 20, 50, 20]);
  } catch (error) {
    console.error('[Haptics] Error triggering error haptic:', error);
  }
}

/**
 * Warning haptic pattern
 * Use for: warnings, important notices
 */
export function hapticWarning(): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate([15, 30, 15]);
  } catch (error) {
    console.error('[Haptics] Error triggering warning haptic:', error);
  }
}

/**
 * Selection changed haptic
 * Use for: scrolling through items, picker changes
 */
export function hapticSelection(): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(5);
  } catch (error) {
    console.error('[Haptics] Error triggering selection haptic:', error);
  }
}

/**
 * Impact haptic (like iOS impact generator)
 * Use for: drag/drop, swipe actions
 */
export function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): void {
  if (!isHapticSupported()) return;

  const durations = {
    light: 10,
    medium: 20,
    heavy: 30
  };

  try {
    navigator.vibrate(durations[style]);
  } catch (error) {
    console.error('[Haptics] Error triggering impact haptic:', error);
  }
}

/**
 * Cancel any ongoing haptic feedback
 */
export function hapticCancel(): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(0);
  } catch (error) {
    console.error('[Haptics] Error canceling haptic:', error);
  }
}

/**
 * Custom haptic pattern
 * @param pattern - Array of vibration durations in ms [vibrate, pause, vibrate, pause, ...]
 */
export function hapticCustom(pattern: number[]): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(pattern);
  } catch (error) {
    console.error('[Haptics] Error triggering custom haptic:', error);
  }
}
