import crypto from 'crypto';
import { NextRequest } from 'next/server';

/**
 * Enhanced session security utilities
 */

/**
 * Generate a device fingerprint from request headers
 */
export function generateDeviceFingerprint(request: NextRequest): string {
  const components = [
    _request.headers.get('user-agent') || 'unknown',
    _request.headers.get('accept-language') || 'unknown',
    _request.headers.get('accept-encoding') || 'unknown',
    _request.headers.get('sec-ch-ua') || 'unknown',
    _request.headers.get('sec-ch-ua-platform') || 'unknown',
  ];

  const fingerprintData = components.join('|');
  return crypto
    .createHash('sha256')
    .update(fingerprintData)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  return _request.headers.get('x-forwarded-for')?.split(',')[0] || 
         _request.headers.get('x-real-ip') || 
         _request.headers.get('cf-connecting-ip') || // Cloudflare
         _request.headers.get('x-vercel-forwarded-for') || // Vercel
         '127.0.0.1';
}

/**
 * Session security configuration
 */
export const SESSION_SECURITY = {
  // Session rotation interval (30 minutes)
  ROTATION_INTERVAL: 30 * 60 * 1000,
  
  // Maximum session lifetime (24 hours)
  MAX_LIFETIME: 24 * 60 * 60 * 1000,
  
  // Idle timeout (2 hours)
  IDLE_TIMEOUT: 2 * 60 * 60 * 1000,
  
  // Maximum concurrent sessions per user
  MAX_CONCURRENT_SESSIONS: 5,
  
  // IP binding enforcement
  ENFORCE_IP_BINDING: process.env.ENFORCE_IP_BINDING === 'true',
  
  // Device fingerprint enforcement
  ENFORCE_FINGERPRINT: process.env.ENFORCE_FINGERPRINT === 'true',
};

/**
 * Enhanced session data with security features
 */
export interface SecureSession {
  id: string;
  userId: string;
  createdAt: number;
  lastActivity: number;
  rotatedAt: number;
  expiresAt: number;
  ipAddress: string;
  deviceFingerprint: string;
  userAgent: string;
  
  // Security flags
  isSecure: boolean;
  isMfaVerified: boolean;
  isHighRisk: boolean;
  
  // Session metadata
  loginMethod: 'password' | 'oauth' | 'sso' | 'mfa';
  permissions: string[];
  organizationId?: string;
  
  // Rotation tracking
  rotationCount: number;
  previousSessionId?: string;
}

/**
 * Check if session needs rotation
 */
export function shouldRotateSession(session: SecureSession): boolean {
  const now = Date.now();
  const timeSinceRotation = now - session.rotatedAt;
  
  return timeSinceRotation > SESSION_SECURITY.ROTATION_INTERVAL;
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: SecureSession): boolean {
  const now = Date.now();
  
  // Check maximum lifetime
  if (now - session.createdAt > SESSION_SECURITY.MAX_LIFETIME) {
    return true;
  }
  
  // Check idle timeout
  if (now - session.lastActivity > SESSION_SECURITY.IDLE_TIMEOUT) {
    return true;
  }
  
  // Check explicit expiration
  if (now > session.expiresAt) {
    return true;
  }
  
  return false;
}

/**
 * Validate session security constraints
 */
export function validateSessionSecurity(
  session: SecureSession,
  request: NextRequest
): { valid: boolean; reason?: string } {
  // Check if session is expired
  if (isSessionExpired(session)) {
    return { valid: false, reason: 'Session expired' };
  }
  
  // Validate IP address if enforcement is enabled
  if (SESSION_SECURITY.ENFORCE_IP_BINDING) {
    const currentIP = getClientIP(_request);
    if (session.ipAddress !== currentIP) {
      return { valid: false, reason: 'IP address mismatch' };
    }
  }
  
  // Validate device fingerprint if enforcement is enabled
  if (SESSION_SECURITY.ENFORCE_FINGERPRINT) {
    const currentFingerprint = generateDeviceFingerprint(_request);
    if (session.deviceFingerprint !== currentFingerprint) {
      return { valid: false, reason: 'Device fingerprint mismatch' };
    }
  }
  
  return { valid: true };
}

/**
 * Create a new secure session
 */
export function createSecureSession(
  userId: string,
  request: NextRequest,
  options: {
    loginMethod: SecureSession['loginMethod'];
    permissions?: string[];
    organizationId?: string;
    isMfaVerified?: boolean;
  }
): SecureSession {
  const now = Date.now();
  const sessionId = crypto.randomBytes(32).toString('hex');
  
  return {
    id: sessionId,
    userId,
    createdAt: now,
    lastActivity: now,
    rotatedAt: now,
    expiresAt: now + SESSION_SECURITY.MAX_LIFETIME,
    ipAddress: getClientIP(_request),
    deviceFingerprint: generateDeviceFingerprint(_request),
    userAgent: _request.headers.get('user-agent') || 'unknown',
    
    isSecure: _request.nextUrl.protocol === 'https:',
    isMfaVerified: options.isMfaVerified || false,
    isHighRisk: false,
    
    loginMethod: options.loginMethod,
    permissions: options.permissions || [],
    organizationId: options.organizationId,
    
    rotationCount: 0,
    previousSessionId: undefined,
  };
}

/**
 * Rotate an existing session
 */
export function rotateSession(
  session: SecureSession,
  request: NextRequest
): SecureSession {
  const now = Date.now();
  const newSessionId = crypto.randomBytes(32).toString('hex');
  
  return {
    ...session,
    id: newSessionId,
    rotatedAt: now,
    lastActivity: now,
    ipAddress: getClientIP(_request),
    deviceFingerprint: generateDeviceFingerprint(_request),
    userAgent: _request.headers.get('user-agent') || session.userAgent,
    rotationCount: session.rotationCount + 1,
    previousSessionId: session.id,
  };
}

/**
 * Detect high-risk session behavior
 */
export function detectHighRiskBehavior(
  session: SecureSession,
  request: NextRequest
): boolean {
  // Check for suspicious patterns
  const checks = [
    // Rapid IP address changes
    session.ipAddress !== getClientIP(_request) && 
    SESSION_SECURITY.ENFORCE_IP_BINDING === false,
    
    // Frequent rotation
    session.rotationCount > 10,
    
    // User agent mismatch
    session.userAgent !== _request.headers.get('user-agent'),
    
    // Accessing from Tor exit nodes or VPNs (simplified check)
    getClientIP(_request).includes('tor') || 
    _request.headers.get('x-forwarded-for')?.split(',').length > 3,
  ];
  
  return checks.filter(Boolean).length >= 2;
}