/**
 * Standardized error messages to prevent information leakage
 * All error messages should be generic and not reveal system internals
 */

export const ERROR_MESSAGES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_ACCOUNT_LOCKED: 'Account temporarily unavailable. Please try again later.',
  AUTH_SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  AUTH_UNAUTHORIZED: 'You are not authorized to perform this action',
  AUTH_MFA_REQUIRED: 'Two-factor authentication is required',
  AUTH_MFA_INVALID: 'Invalid verification code',
  AUTH_TOKEN_INVALID: 'Invalid or expired token',
  
  // Validation errors
  VALIDATION_INVALID_INPUT: 'Please check your input and try again',
  VALIDATION_REQUIRED_FIELD: 'This field is required',
  VALIDATION_INVALID_EMAIL: 'Please enter a valid email address',
  VALIDATION_PASSWORD_WEAK: 'Password does not meet security requirements',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'The requested resource was not found',
  RESOURCE_ALREADY_EXISTS: 'This resource already exists',
  RESOURCE_ACCESS_DENIED: 'You do not have permission to access this resource',
  RESOURCE_QUOTA_EXCEEDED: 'Resource quota exceeded',
  
  // Operation errors
  OPERATION_FAILED: 'The operation could not be completed. Please try again.',
  OPERATION_TIMEOUT: 'The operation timed out. Please try again.',
  OPERATION_RATE_LIMITED: 'Too many requests. Please wait and try again.',
  OPERATION_NOT_ALLOWED: 'This operation is not allowed',
  
  // Network errors
  NETWORK_ERROR: 'A network error occurred. Please check your connection.',
  NETWORK_OFFLINE: 'You appear to be offline. Please check your internet connection.',
  
  // Server errors
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  SERVER_MAINTENANCE: 'The service is temporarily unavailable for maintenance.',
  SERVER_OVERLOADED: 'The service is experiencing high demand. Please try again later.',
  
  // Generic fallback
  GENERIC_ERROR: 'Something went wrong. Please try again.',
} as const;

/**
 * Error codes for internal use (not exposed to users)
 */
export enum ErrorCode {
  // Auth codes (1xxx)
  INVALID_CREDENTIALS = 1001,
  ACCOUNT_LOCKED = 1002,
  SESSION_EXPIRED = 1003,
  UNAUTHORIZED = 1004,
  MFA_REQUIRED = 1005,
  MFA_INVALID = 1006,
  TOKEN_INVALID = 1007,
  
  // Validation codes (2xxx)
  VALIDATION_ERROR = 2001,
  REQUIRED_FIELD = 2002,
  INVALID_FORMAT = 2003,
  PASSWORD_WEAK = 2004,
  
  // Resource codes (3xxx)
  NOT_FOUND = 3001,
  ALREADY_EXISTS = 3002,
  ACCESS_DENIED = 3003,
  QUOTA_EXCEEDED = 3004,
  
  // Operation codes (4xxx)
  OPERATION_FAILED = 4001,
  TIMEOUT = 4002,
  RATE_LIMITED = 4003,
  NOT_ALLOWED = 4004,
  
  // Network codes (5xxx)
  NETWORK_ERROR = 5001,
  OFFLINE = 5002,
  
  // Server codes (6xxx)
  INTERNAL_ERROR = 6001,
  MAINTENANCE = 6002,
  OVERLOADED = 6003,
}

/**
 * Map internal error codes to user-friendly messages
 */
export function getErrorMessage(code: ErrorCode): string {
  switch (code) {
    case ErrorCode.INVALID_CREDENTIALS:
      return ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;
    case ErrorCode.ACCOUNT_LOCKED:
      return ERROR_MESSAGES.AUTH_ACCOUNT_LOCKED;
    case ErrorCode.SESSION_EXPIRED:
      return ERROR_MESSAGES.AUTH_SESSION_EXPIRED;
    case ErrorCode.UNAUTHORIZED:
      return ERROR_MESSAGES.AUTH_UNAUTHORIZED;
    case ErrorCode.MFA_REQUIRED:
      return ERROR_MESSAGES.AUTH_MFA_REQUIRED;
    case ErrorCode.MFA_INVALID:
      return ERROR_MESSAGES.AUTH_MFA_INVALID;
    case ErrorCode.TOKEN_INVALID:
      return ERROR_MESSAGES.AUTH_TOKEN_INVALID;
    
    case ErrorCode.VALIDATION_ERROR:
      return ERROR_MESSAGES.VALIDATION_INVALID_INPUT;
    case ErrorCode.REQUIRED_FIELD:
      return ERROR_MESSAGES.VALIDATION_REQUIRED_FIELD;
    case ErrorCode.INVALID_FORMAT:
      return ERROR_MESSAGES.VALIDATION_INVALID_INPUT;
    case ErrorCode.PASSWORD_WEAK:
      return ERROR_MESSAGES.VALIDATION_PASSWORD_WEAK;
    
    case ErrorCode.NOT_FOUND:
      return ERROR_MESSAGES.RESOURCE_NOT_FOUND;
    case ErrorCode.ALREADY_EXISTS:
      return ERROR_MESSAGES.RESOURCE_ALREADY_EXISTS;
    case ErrorCode.ACCESS_DENIED:
      return ERROR_MESSAGES.RESOURCE_ACCESS_DENIED;
    case ErrorCode.QUOTA_EXCEEDED:
      return ERROR_MESSAGES.RESOURCE_QUOTA_EXCEEDED;
    
    case ErrorCode.OPERATION_FAILED:
      return ERROR_MESSAGES.OPERATION_FAILED;
    case ErrorCode.TIMEOUT:
      return ERROR_MESSAGES.OPERATION_TIMEOUT;
    case ErrorCode.RATE_LIMITED:
      return ERROR_MESSAGES.OPERATION_RATE_LIMITED;
    case ErrorCode.NOT_ALLOWED:
      return ERROR_MESSAGES.OPERATION_NOT_ALLOWED;
    
    case ErrorCode.NETWORK_ERROR:
      return ERROR_MESSAGES.NETWORK_ERROR;
    case ErrorCode.OFFLINE:
      return ERROR_MESSAGES.NETWORK_OFFLINE;
    
    case ErrorCode.INTERNAL_ERROR:
      return ERROR_MESSAGES.SERVER_ERROR;
    case ErrorCode.MAINTENANCE:
      return ERROR_MESSAGES.SERVER_MAINTENANCE;
    case ErrorCode.OVERLOADED:
      return ERROR_MESSAGES.SERVER_OVERLOADED;
    
    default:
      return ERROR_MESSAGES.GENERIC_ERROR;
  }
}

/**
 * Sanitize error messages to prevent information leakage
 */
export function sanitizeErrorMessage(error: unknown): string {
  // Never expose internal error details to users
  if (process.env.NODE_ENV === 'production') {
    return ERROR_MESSAGES.GENERIC_ERROR;
  }
  
  // In development, show more details
  if (error instanceof Error) {
    // Check for known error patterns and map to safe messages
    const message = error.message.toLowerCase();
    
    if (message.includes('credential') || message.includes('password')) {
      return ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;
    }
    if (message.includes('unauthorized') || message.includes('forbidden')) {
      return ERROR_MESSAGES.AUTH_UNAUTHORIZED;
    }
    if (message.includes('not found') || message.includes('404')) {
      return ERROR_MESSAGES.RESOURCE_NOT_FOUND;
    }
    if (message.includes('rate limit') || message.includes('too many')) {
      return ERROR_MESSAGES.OPERATION_RATE_LIMITED;
    }
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (message.includes('timeout')) {
      return ERROR_MESSAGES.OPERATION_TIMEOUT;
    }
    
    // In development, return the original message
    return error.message;
  }
  
  return ERROR_MESSAGES.GENERIC_ERROR;
}

/**
 * Create a standardized error response
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export function createErrorResponse(
  code: ErrorCode,
  details?: Record<string, unknown>
): ErrorResponse {
  const response: ErrorResponse = {
    error: getErrorMessage(code),
  };
  
  // Only include error code in development
  if (process.env.NODE_ENV !== 'production') {
    response.code = ErrorCode[code];
    if (details) {
      response.details = details;
    }
  }
  
  return response;
}