/**
 * Development-only debug logging utility
 * Logs are only output in development mode, completely silent in production
 */

export const debug = {
  /**
   * Log general debug information
   */
  log: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      if (data !== undefined) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  },

  /**
   * Log warnings (shown in both dev and production)
   */
  warn: (message: string, data?: any) => {
    if (data !== undefined) {
      console.warn(message, data);
    } else {
      console.warn(message);
    }
  },

  /**
   * Log errors (shown in both dev and production)
   */
  error: (message: string, error?: any) => {
    if (error !== undefined) {
      console.error(message, error);
    } else {
      console.error(message);
    }
  },
};
