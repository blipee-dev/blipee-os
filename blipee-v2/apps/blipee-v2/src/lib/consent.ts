/**
 * Cookie Consent Logging Service
 * 
 * Records user consent for GDPR/CCPA compliance
 * Stores consent history with timestamps and versions
 */

import { ConsentPreferences, ConsentRecord } from '@/types/consent'

const PRIVACY_POLICY_VERSION = '1.0' // Update when privacy policy changes
const CONSENT_STORAGE_KEY = 'cookie-consent-history'

/**
 * Log user consent decision
 * Stores locally and optionally sends to server for audit trail
 */
export async function logConsent(preferences: ConsentPreferences): Promise<void> {
  const record: ConsentRecord = {
    preferences,
    timestamp: new Date().toISOString(),
    version: PRIVACY_POLICY_VERSION,
    userAgent: navigator.userAgent,
  }

  // Store locally
  storeConsentLocally(record)

  // Store on server for logged-in users (optional but recommended)
  if (typeof window !== 'undefined') {
    try {
      await storeConsentOnServer(record)
    } catch (error) {
      console.error('Failed to log consent on server:', error)
      // Continue even if server logging fails
    }
  }
}

/**
 * Store consent in localStorage for audit trail
 */
function storeConsentLocally(record: ConsentRecord): void {
  try {
    const history = getConsentHistory()
    history.push(record)
    
    // Keep only last 10 consent records
    const recentHistory = history.slice(-10)
    
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(recentHistory))
    localStorage.setItem('cookie-consent', JSON.stringify(record.preferences))
    localStorage.setItem('cookie-consent-date', record.timestamp)
    localStorage.setItem('cookie-consent-version', record.version)
  } catch (error) {
    console.error('Failed to store consent locally:', error)
  }
}

/**
 * Store consent on server for permanent audit trail
 */
async function storeConsentOnServer(record: ConsentRecord): Promise<void> {
  // Only send if user is authenticated
  const response = await fetch('/api/consent/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  })

  if (!response.ok) {
    throw new Error('Failed to log consent on server')
  }
}

/**
 * Get consent history from localStorage
 */
export function getConsentHistory(): ConsentRecord[] {
  try {
    const history = localStorage.getItem(CONSENT_STORAGE_KEY)
    return history ? JSON.parse(history) : []
  } catch (error) {
    console.error('Failed to get consent history:', error)
    return []
  }
}

/**
 * Get current consent preferences
 */
export function getCurrentConsent(): ConsentPreferences | null {
  try {
    const consent = localStorage.getItem('cookie-consent')
    return consent ? JSON.parse(consent) : null
  } catch (error) {
    console.error('Failed to get current consent:', error)
    return null
  }
}

/**
 * Check if privacy policy version has changed
 * User should re-consent if version changed
 */
export function shouldRequestNewConsent(): boolean {
  try {
    const storedVersion = localStorage.getItem('cookie-consent-version')
    return storedVersion !== PRIVACY_POLICY_VERSION
  } catch (error) {
    return true
  }
}

/**
 * Clear all consent data (for testing or user request)
 */
export function clearConsent(): void {
  try {
    localStorage.removeItem('cookie-consent')
    localStorage.removeItem('cookie-consent-date')
    localStorage.removeItem('cookie-consent-version')
    localStorage.removeItem(CONSENT_STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear consent:', error)
  }
}
