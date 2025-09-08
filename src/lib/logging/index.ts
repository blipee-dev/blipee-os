/**
 * Centralized Logging Module
 * Phase 4, Task 4.1: Export all logging functionality
 */

// Core logger
export * from './structured-logger';
export { logger } from './structured-logger';

// HTTP logging
export * from './http-logger';

// Database logging
export * from './database-logger';

// AI operations logging
export * from './ai-logger';
export { aiLogger } from './ai-logger';

// Performance logging
export * from './performance-logger';
export { performanceLogger } from './performance-logger';

// Convenience re-exports
import { logger as defaultLogger } from './structured-logger';
import { aiLogger as defaultAILogger } from './ai-logger';
import { performanceLogger as defaultPerfLogger } from './performance-logger';

const loggingUtilities = {
  logger: defaultLogger,
  aiLogger: defaultAILogger,
  performanceLogger: defaultPerfLogger
};

export default loggingUtilities;