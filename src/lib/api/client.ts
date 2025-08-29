'use client';

import { useCSRF } from '@/hooks/use-csrf';

export interface APIClientOptions extends RequestInit {
  skipCSRF?: boolean;
  timeout?: number;
}

export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Enhanced API client with CSRF protection
 */
export class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    url: string,
    options: APIClientOptions = {}
  ): Promise<APIResponse<T>> {
    const { skipCSRF = false, timeout = 30000, ...fetchOptions } = options;

    // Get CSRF token from cookie
    let csrfHeaders: Record<string, string> = {};
    if (!skipCSRF && typeof window !== 'undefined') {
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('_csrf='))
        ?.split('=')[1];
      
      if (csrfToken) {
        csrfHeaders = { 'X-CSRF-Token': csrfToken };
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(this.baseURL + url, {
        ...fetchOptions,
        headers: {
          ...this.defaultHeaders,
          ...csrfHeaders,
          ...fetchOptions.headers,
        },
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }

      if (!response.ok) {
        return {
          error: data?.error || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          data: undefined,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            error: 'Request timeout',
            status: 408,
          };
        }
        return {
          error: error.message,
          status: 0,
        };
      }

      return {
        error: 'Unknown error occurred',
        status: 0,
      };
    }
  }

  async get<T>(url: string, options?: APIClientOptions): Promise<APIResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'GET',
    });
  }

  async post<T>(
    url: string,
    data?: any,
    options?: APIClientOptions
  ): Promise<APIResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    url: string,
    data?: any,
    options?: APIClientOptions
  ): Promise<APIResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    url: string,
    data?: any,
    options?: APIClientOptions
  ): Promise<APIResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(
    url: string,
    options?: APIClientOptions
  ): Promise<APIResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }
}

// Default API client instance
export const apiClient = new APIClient('/api');

/**
 * React hook for using the API client with automatic CSRF
 */
export function useAPIClient() {
  const { secureFetch } = useCSRF();
  
  return {
    get: async <T>(url: string, options?: RequestInit) => {
      const response = await secureFetch(url, { ...options, method: 'GET' });
      return response.json() as Promise<T>;
    },
    post: async <T>(url: string, data?: any, options?: RequestInit) => {
      const response = await secureFetch(url, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      return response.json() as Promise<T>;
    },
    put: async <T>(url: string, data?: any, options?: RequestInit) => {
      const response = await secureFetch(url, {
        ...options,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      return response.json() as Promise<T>;
    },
    delete: async <T>(url: string, options?: RequestInit) => {
      const response = await secureFetch(url, { ...options, method: 'DELETE' });
      return response.json() as Promise<T>;
    },
  };
}