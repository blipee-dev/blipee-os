/**
 * Logging Configuration
 * Phase 4, Task 4.1: Environment-based configuration
 */

import { LogLevel } from './structured-logger';

/**
 * Get log level from environment
 */
export function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toUpperCase();
  
  switch (level) {
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    default:
      // Default to INFO in production, DEBUG in development
      return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }
}

/**
 * Get logging configuration from environment
 */
export function getLoggingConfig() {
  return {
    level: getLogLevel(),
    prettyPrint: process.env.LOG_PRETTY === 'true',
    redactPaths: (process.env.LOG_REDACT_PATHS || 'password,token,apiKey,secret,authorization,cookie').split(','),
    service: process.env.LOG_SERVICE_NAME || 'blipee-os',
    
    // HTTP logging
    httpLogging: {
      enabled: process.env.LOG_HTTP_ENABLED !== 'false',
      excludePaths: (process.env.LOG_HTTP_EXCLUDE_PATHS || '/_next,/favicon.ico,/health').split(','),
      sanitizeHeaders: (process.env.LOG_HTTP_SANITIZE_HEADERS || 'authorization,cookie,x-api-key').split(',')
    },
    
    // Database logging
    databaseLogging: {
      enabled: process.env.LOG_DATABASE_ENABLED !== 'false',
      slowQueryThreshold: parseInt(process.env.LOG_DATABASE_SLOW_THRESHOLD || '3000', 10),
      logAllQueries: process.env.LOG_DATABASE_ALL === 'true'
    },
    
    // AI logging
    aiLogging: {
      enabled: process.env.LOG_AI_ENABLED !== 'false',
      logTokenUsage: process.env.LOG_AI_TOKENS !== 'false',
      logCosts: process.env.LOG_AI_COSTS !== 'false',
      logCache: process.env.LOG_AI_CACHE === 'true'
    },
    
    // Performance logging
    performanceLogging: {
      enabled: process.env.LOG_PERFORMANCE_ENABLED !== 'false',
      memoryCheckInterval: parseInt(process.env.LOG_PERFORMANCE_MEMORY_INTERVAL || '300000', 10), // 5 minutes
      statisticsInterval: parseInt(process.env.LOG_PERFORMANCE_STATS_INTERVAL || '600000', 10) // 10 minutes
    },
    
    // External services
    externalServices: {
      // For future integrations with logging services
      datadogApiKey: process.env.DATADOG_API_KEY,
      sentryDsn: process.env.SENTRY_DSN,
      elasticsearchUrl: process.env.ELASTICSEARCH_URL,
      lokiUrl: process.env.LOKI_URL
    }
  };
}

/**
 * Log levels for different environments
 */
export const ENVIRONMENT_LOG_LEVELS = {
  development: {
    default: LogLevel.DEBUG,
    http: LogLevel.DEBUG,
    database: LogLevel.DEBUG,
    ai: LogLevel.DEBUG,
    performance: LogLevel.INFO
  },
  test: {
    default: LogLevel.WARN,
    http: LogLevel.WARN,
    database: LogLevel.WARN,
    ai: LogLevel.WARN,
    performance: LogLevel.WARN
  },
  production: {
    default: LogLevel.INFO,
    http: LogLevel.INFO,
    database: LogLevel.WARN,
    ai: LogLevel.INFO,
    performance: LogLevel.WARN
  }
};

/**
 * Get environment-specific log level
 */
export function getEnvironmentLogLevel(component: keyof typeof ENVIRONMENT_LOG_LEVELS.development): LogLevel {
  const env = (process.env.NODE_ENV || 'development') as keyof typeof ENVIRONMENT_LOG_LEVELS;
  const levels = ENVIRONMENT_LOG_LEVELS[env] || ENVIRONMENT_LOG_LEVELS.development;
  return levels[component] || levels.default;
}