"use client";

import { useState, useEffect } from 'react';

/**
 * Hook to detect if user is on a mobile device
 * Returns true if viewport width is less than 768px (tablet breakpoint)
 */
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
