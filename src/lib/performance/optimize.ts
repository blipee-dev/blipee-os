// Performance optimization utilities

// Debounce function for expensive operations
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for rate-limiting
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Memoize expensive computations
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    // Limit cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return result;
  }) as T;
}

// Lazy load with Intersection Observer
export function lazyLoad(
  selector: string,
  callback: (element: Element) => void,
  options?: IntersectionObserverInit
) {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return;
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        callback(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, options);
  
  const elements = document.querySelectorAll(selector);
  elements.forEach(element => observer.observe(element));
  
  return observer;
}

// Request idle callback wrapper
export function whenIdle(callback: () => void, timeout = 2000) {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 0);
  }
}

// Prefetch links on hover
export function prefetchOnHover(selector = 'a[href^="/"]') {
  if (typeof window === 'undefined') return;
  
  const links = document.querySelectorAll(selector);
  
  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http')) {
        const linkElement = document.createElement('link');
        linkElement.rel = 'prefetch';
        linkElement.href = href;
        document.head.appendChild(linkElement);
      }
    }, { once: true });
  });
}

// Virtual scrolling helper
export class VirtualScroller<T> {
  private items: T[];
  private itemHeight: number;
  private containerHeight: number;
  private scrollTop = 0;
  private overscan = 3;
  
  constructor(items: T[], itemHeight: number, containerHeight: number) {
    this.items = items;
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
  }
  
  getVisibleItems() {
    const startIndex = Math.max(
      0,
      Math.floor(this.scrollTop / this.itemHeight) - this.overscan
    );
    const endIndex = Math.min(
      this.items.length,
      Math.ceil((this.scrollTop + this.containerHeight) / this.itemHeight) + this.overscan
    );
    
    return {
      items: this.items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      totalHeight: this.items.length * this.itemHeight,
      offsetY: startIndex * this.itemHeight,
    };
  }
  
  setScrollTop(scrollTop: number) {
    this.scrollTop = scrollTop;
  }
}

// Web Worker manager
export class WorkerManager {
  private worker: Worker | null = null;
  private messageId = 0;
  private pending = new Map<number, { resolve: Function; reject: Function }>();
  
  constructor(workerPath: string) {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(workerPath);
      this.worker.onmessage = this.handleMessage.bind(this);
      this.worker.onerror = this.handleError.bind(this);
    }
  }
  
  private handleMessage(event: MessageEvent) {
    const { id, result, error } = event.data;
    const pending = this.pending.get(id);
    
    if (pending) {
      if (error) {
        pending.reject(error);
      } else {
        pending.resolve(result);
      }
      this.pending.delete(id);
    }
  }
  
  private handleError(error: ErrorEvent) {
    console.error('Worker error:', error);
  }
  
  async execute<R>(method: string, ...args: any[]): Promise<R> {
    if (!this.worker) {
      throw new Error('Web Workers not supported');
    }
    
    const id = this.messageId++;
    
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage({ id, method, args });
    });
  }
  
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}