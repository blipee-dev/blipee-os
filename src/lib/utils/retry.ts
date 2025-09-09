/**
 * Retry utility for critical API calls
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  shouldRetry: (error) => {
    // Retry on network errors and 5xx status codes
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return true;
    }
    const statusMatch = error.message.match(/status:\s*(\d+)/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1]);
      return status >= 500 && status < 600;
    }
    return false;
  },
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if we should retry
      if (attempt === opts.maxAttempts || !opts.shouldRetry(lastError)) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      );
      
      // Call retry callback
      opts.onRetry(attempt, lastError);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Retry decorator for class methods
 */
export function Retryable(options: RetryOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      return retry(() => originalMethod.apply(this, args), options);
    };
    
    return descriptor;
  };
}

/**
 * Create a retryable fetch function
 */
export function retryableFetch(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return retry(
    async () => {
      const response = await fetch(url, init);
      if (!response.ok && response.status >= 500) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    },
    {
      ...options,
      shouldRetry: (error) => {
        // Custom retry logic for fetch
        if (error.name === 'AbortError') {
          return false; // Don't retry aborted requests
        }
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          return true; // Network error
        }
        const statusMatch = error.message.match(/status:\s*(\d+)/);
        if (statusMatch) {
          const status = parseInt(statusMatch[1]);
          // Retry on 502, 503, 504
          return [502, 503, 504].includes(status);
        }
        return options?.shouldRetry?.(error) ?? DEFAULT_OPTIONS.shouldRetry(error);
      },
    }
  );
}