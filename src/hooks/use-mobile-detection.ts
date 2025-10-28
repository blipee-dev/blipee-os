"use client";

import { useState, useEffect } from 'react';

/**
 * Hook to detect if user is on a mobile device
 * Returns true if viewport width is less than 768px (tablet breakpoint)
 * Optimized to detect mobile immediately on mount to prevent desktop flash
 */
export function useMobileDetection() {
  // Initialize with immediate check if window is available (client-side)
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    // Double-check on mount in case initial state was wrong
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Immediate check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
