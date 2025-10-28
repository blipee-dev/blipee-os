/**
 * Pull to Refresh Component
 *
 * iOS-style pull-to-refresh for mobile PWA
 * Works with touch gestures and shows smooth animation
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
  threshold?: number;
}

export function PullToRefresh({
  onRefresh,
  children,
  disabled = false,
  threshold = 80
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  // Check if container is scrolled to top
  const checkCanPull = useCallback(() => {
    if (!containerRef.current) return false;
    const scrollTop = containerRef.current.scrollTop;
    return scrollTop <= 0;
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;

    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    setCanPull(checkCanPull());
  }, [disabled, isRefreshing, checkCanPull]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || !canPull) return;

    const touch = e.touches[0];
    const currentY = touch.clientY;
    const distance = currentY - touchStartY.current;

    // Only pull down, and apply diminishing returns for smoother feel
    if (distance > 0) {
      e.preventDefault();
      const easedDistance = Math.pow(distance, 0.8);
      setPullDistance(Math.min(easedDistance, threshold * 1.5));
    }
  }, [disabled, isRefreshing, canPull, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;

    // If pulled past threshold, trigger refresh
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Lock at threshold during refresh

      try {
        await onRefresh();
      } catch (error) {
        console.error('[PullToRefresh] Error refreshing:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Not pulled far enough, snap back
      setPullDistance(0);
    }

    setCanPull(false);
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const rotation = isRefreshing ? 360 : (pullDistance / threshold) * 180;
  const opacity = Math.min(pullDistance / threshold, 1);
  const scale = Math.min(0.5 + (pullDistance / threshold) * 0.5, 1);

  return (
    <div ref={containerRef} className="relative h-full overflow-y-auto">
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 flex items-center justify-center"
            style={{
              height: Math.min(pullDistance, threshold),
              zIndex: 50
            }}
          >
            <motion.div
              animate={{
                rotate: isRefreshing ? 360 : rotation,
                scale: scale,
                opacity: opacity
              }}
              transition={
                isRefreshing
                  ? { rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }
                  : { duration: 0.1 }
              }
              className="flex items-center justify-center w-10 h-10 bg-white dark:bg-[#1a1a1a] rounded-full shadow-lg"
            >
              <RefreshCw
                className={`w-5 h-5 ${
                  pullDistance >= threshold
                    ? 'text-green-500'
                    : 'text-gray-400'
                }`}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        animate={{
          y: isRefreshing ? threshold : pullDistance
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
