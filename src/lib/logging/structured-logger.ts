/**
 * Structured Logging System
 * Phase 4, Task 4.1: Enterprise-grade structured logging implementation
 * 
 * Features:
 * - JSON structured output
 * - Correlation ID tracking
 * - Context propagation
 * - Multiple log levels
 * - Performance tracking
 * - Error serialization
 */

import { v4 as uuidv4 } from 'uuid';

// Edge-compatible imports
const AsyncLocalStorage = typeof globalThis !== 'undefined' && 'AsyncLocalStorage' in globalThis 
  ? (globalThis as any).AsyncLocalStorage 
  : null;

// Edge-compatible hostname
const getHostname = () => {
  if (typeof process !== 'undefined' && process.env.HOSTNAME) {
    return process.env.HOSTNAME;
  }
  return 'unknown';
};

// Log levels with numeric values for filtering
export enum LogLevel {
  TRACE = 10,
  DEBUG = 20,
  INFO = 30,
  WARN = 40,
  ERROR = 50,
  FATAL = 60
}

// Map string levels to enum
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  trace: LogLevel.TRACE,
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  fatal: LogLevel.FATAL
};

// Context that flows through async operations
export interface LogContext {
  correlationId: string;
  userId?: string;
  organizationId?: string;
  buildingId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  operation?: string;
  service?: string;
  environment?: string;
  version?: string;
  [key: string]: any;
}

// Structured log entry
export interface LogEntry {
  timestamp: string;
  level: string;
  levelValue: number;
  message: string;
  correlationId: string;
  hostname: string;
  pid: number;
  service: string;
  environment: string;
  version: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
    cause?: any;
  };
  performance?: {
    duration?: number;
    startTime?: number;
    endTime?: number;
  };
  metadata?: Record<string, any>;
}

// Logger configuration
export interface LoggerConfig {
  service: string;
  environment?: string;
  version?: string;
  minLevel?: LogLevel;
  prettyPrint?: boolean;
  destination?: 'console' | 'file' | 'remote';
  remoteEndpoint?: string;
  includeStackTrace?: boolean;
  redactFields?: string[];
  sampleRate?: number; // For high-volume environments
}

// Async context storage for correlation IDs
const asyncLocalStorage = AsyncLocalStorage ? new AsyncLocalStorage<LogContext>() : null;

/**
 * Structured Logger Class
 * Provides context-aware, structured logging with correlation tracking
 */
export class StructuredLogger {
  private config: Required<LoggerConfig>;
  private hostname: string;
  private redactPatterns: RegExp[];

  constructor(config: LoggerConfig) {
    this.config = {
      service: config.service,
      environment: config.environment || process.env.NODE_ENV || 'development',
      version: config.version || process.env.APP_VERSION || '1.0.0',
      minLevel: config.minLevel || LogLevel.INFO,
      prettyPrint: config.prettyPrint ?? (process.env.NODE_ENV === 'development'),
      destination: config.destination || 'console',
      remoteEndpoint: config.remoteEndpoint || '',
      includeStackTrace: config.includeStackTrace ?? true,
      redactFields: config.redactFields || ['password', 'token', 'apiKey', 'secret', 'authorization'],
      sampleRate: config.sampleRate || 1.0
    };

    this.hostname = getHostname();
    this.redactPatterns = this.config.redactFields.map(
      field => new RegExp(`"${field}":\\s*"[^"]*"`, 'gi')
    );
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Partial<LogContext>): StructuredLogger {
    const childLogger = new StructuredLogger(this.config);
    const currentContext = this.getContext();
    
    // Store merged context for this child logger
    if (asyncLocalStorage) {
      asyncLocalStorage.enterWith({
        ...currentContext,
        ...additionalContext
      });
    }
    
    return childLogger;
  }

  /**
   * Run a function with a specific logging context
   */
  runWithContext<T>(context: Partial<LogContext>, fn: () => T): T {
    const currentContext = this.getContext();
    if (asyncLocalStorage) {
      return asyncLocalStorage.run(
        {
          ...currentContext,
          ...context,
          correlationId: context.correlationId || currentContext.correlationId || uuidv4()
        },
        fn
      );
    }
    // If no async storage, just run the function
    return fn();
  }

  /**
   * Get current logging context
   */
  getContext(): LogContext {
    const stored = asyncLocalStorage ? asyncLocalStorage.getStore() : null;
    return stored || {
      correlationId: uuidv4(),
      service: this.config.service,
      environment: this.config.environment,
      version: this.config.version
    };
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): void {
    // Check minimum log level
    if (level < this.config.minLevel) return;

    // Sample rate for high-volume environments
    if (this.config.sampleRate < 1.0 && Math.random() > this.config.sampleRate) return;

    const context = this.getContext();
    const timestamp = new Date().toISOString();

    const logEntry: LogEntry = {
      timestamp,
      level: LogLevel[level],
      levelValue: level,
      message: this.redactSensitiveData(message),
      correlationId: context.correlationId,
      hostname: this.hostname,
      pid: process.pid,
      service: this.config.service,
      environment: this.config.environment,
      version: this.config.version,
      context: this.redactContext(context),
      metadata: metadata ? this.redactMetadata(metadata) : undefined
    };

    // Add error details if present
    if (error) {
      logEntry.error = {
        name: error.name,
        message: this.redactSensitiveData(error.message),
        stack: this.config.includeStackTrace ? error.stack : undefined,
        code: (error as any).code,
        cause: (error as any).cause
      };
    }

    // Add performance metrics if present
    if (metadata?.duration || metadata?.startTime) {
      logEntry.performance = {
        duration: metadata.duration,
        startTime: metadata.startTime,
        endTime: metadata.endTime || Date.now()
      };
    }

    this.output(logEntry);
  }

  /**
   * Output log entry based on configuration
   */
  private output(logEntry: LogEntry): void {
    const output = this.config.prettyPrint
      ? this.prettyFormat(logEntry)
      : JSON.stringify(logEntry);

    switch (this.config.destination) {
      case 'console':
        this.consoleOutput(logEntry, output);
        break;
      case 'file':
        // File output would be implemented here
        break;
      case 'remote':
        this.remoteOutput(logEntry);
        break;
    }
  }

  /**
   * Console output with color coding
   */
  private consoleOutput(logEntry: LogEntry, output: string): void {
    const colorMap: Record<string, string> = {
      TRACE: '\x1b[90m', // Gray
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      FATAL: '\x1b[35m'  // Magenta
    };

    const color = colorMap[logEntry.level] || '';
    const reset = '\x1b[0m';

    if (this.config.prettyPrint) {
    } else {
    }
  }

  /**
   * Remote output for centralized logging
   */
  private async remoteOutput(logEntry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      // In production, this would send to a logging service
      // For now, we'll just console log
    } catch (error) {
      // Fallback to console if remote logging fails
      console.error('Failed to send log to remote endpoint:', error);
      this.consoleOutput(logEntry, JSON.stringify(logEntry));
    }
  }

  /**
   * Pretty format for development
   */
  private prettyFormat(logEntry: LogEntry): string {
    const { timestamp, level, message, correlationId, error, metadata, performance } = logEntry;
    let output = `[${timestamp}] ${level} [${correlationId.substring(0, 8)}] ${message}`;

    if (performance?.duration) {
      output += ` (${performance.duration}ms)`;
    }

    if (metadata && Object.keys(metadata).length > 0) {
      output += '\n  Metadata: ' + JSON.stringify(metadata, null, 2).replace(/\n/g, '\n  ');
    }

    if (error) {
      output += '\n  Error: ' + error.name + ': ' + error.message;
      if (error.stack) {
        output += '\n  Stack: ' + error.stack.replace(/\n/g, '\n  ');
      }
    }

    return output;
  }

  /**
   * Redact sensitive data from strings
   */
  private redactSensitiveData(str: string): string {
    let redacted = str;
    this.redactPatterns.forEach(pattern => {
      redacted = redacted.replace(pattern, (match) => {
        const [key] = match.split(':');
        return `${key}: "[REDACTED]"`;
      });
    });
    return redacted;
  }

  /**
   * Redact sensitive fields from context
   */
  private redactContext(context: LogContext): LogContext {
    const redacted = { ...context };
    this.config.redactFields.forEach(field => {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    });
    return redacted;
  }

  /**
   * Redact sensitive fields from metadata
   */
  private redactMetadata(metadata: Record<string, any>): Record<string, any> {
    const redacted = { ...metadata };
    this.config.redactFields.forEach(field => {
      if (field in redacted) {
        redacted[field] = '[REDACTED]';
      }
    });
    return redacted;
  }

  // Public logging methods

  trace(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, error?: Error | Record<string, any>, metadata?: Record<string, any>): void {
    if (error instanceof Error) {
      this.log(LogLevel.ERROR, message, metadata, error);
    } else {
      this.log(LogLevel.ERROR, message, { ...error, ...metadata });
    }
  }

  fatal(message: string, error?: Error | Record<string, any>, metadata?: Record<string, any>): void {
    if (error instanceof Error) {
      this.log(LogLevel.FATAL, message, metadata, error);
    } else {
      this.log(LogLevel.FATAL, message, { ...error, ...metadata });
    }
  }

  /**
   * Time a function execution
   */
  async time<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now();
    const childLogger = this.child({ operation });

    try {
      childLogger.debug(`Starting ${operation}`);
      const result = await fn();
      const duration = Date.now() - startTime;
      
      childLogger.info(`Completed ${operation}`, {
        ...metadata,
        duration,
        startTime,
        endTime: Date.now(),
        success: true
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      childLogger.error(`Failed ${operation}`, error as Error, {
        ...metadata,
        duration,
        startTime,
        endTime: Date.now(),
        success: false
      });
      
      throw error;
    }
  }

  /**
   * Create a performance timer
   */
  startTimer(): () => void {
    const startTime = Date.now();
    return () => Date.now() - startTime;
  }
}

/**
 * Global logger instance factory
 */
export function createLogger(config: LoggerConfig): StructuredLogger {
  return new StructuredLogger(config);
}

/**
 * Default logger for the application
 */
export const logger = createLogger({
  service: 'blipee-os',
  environment: process.env.NODE_ENV || 'development',
  version: process.env.APP_VERSION || '1.0.0',
  minLevel: process.env.LOG_LEVEL 
    ? LOG_LEVEL_MAP[process.env.LOG_LEVEL.toLowerCase()] || LogLevel.INFO
    : LogLevel.INFO,
  prettyPrint: process.env.NODE_ENV === 'development',
  includeStackTrace: process.env.NODE_ENV !== 'production',
  sampleRate: process.env.LOG_SAMPLE_RATE ? parseFloat(process.env.LOG_SAMPLE_RATE) : 1.0
});