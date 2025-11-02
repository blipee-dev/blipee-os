/**
 * Cookie Consent Types
 */

export type ConsentPreferences = {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

export type ConsentRecord = {
  preferences: ConsentPreferences
  timestamp: string
  version: string // Privacy policy version
  userAgent: string
  ipHash?: string // Optional: hashed IP for audit
}

export type ConsentHistory = ConsentRecord[]
