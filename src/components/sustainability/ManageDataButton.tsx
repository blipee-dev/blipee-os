'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Database, AlertCircle } from 'lucide-react';

interface ManageDataButtonProps {
  variant?: 'default' | 'compact' | 'floating';
  className?: string;
}

export function ManageDataButton({ variant = 'default', className = '' }: ManageDataButtonProps) {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPendingMetricsCount();
    // Refresh count every 5 minutes
    const interval = setInterval(fetchPendingMetricsCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingMetricsCount = async () => {
    try {
      // Fetch real count from API
      const response = await fetch('/api/sustainability/metrics/pending', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setPendingCount(data.count);
      } else {
        setPendingCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch pending metrics count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    router.push('/sustainability/data-management');
  };

  // Floating action button variant
  if (variant === 'floating') {
    return (
      <motion.button
        onClick={handleClick}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center ${className}`}
      >
        <Database className="w-6 h-6" />
        {pendingCount > 0 && !isLoading && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{pendingCount > 9 ? '9+' : pendingCount}</span>
          </div>
        )}
      </motion.button>
    );
  }

  // Compact variant for headers
  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`relative px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2 text-sm ${className}`}
      >
        <Database className="w-4 h-4" />
        <span>Manage Data</span>
        {pendingCount > 0 && !isLoading && (
          <div className="ml-1 px-1.5 py-0.5 bg-red-500 rounded-full">
            <span className="text-xs font-bold text-white">{pendingCount}</span>
          </div>
        )}
      </button>
    );
  }

  // Default button variant
  return (
    <motion.button
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`relative px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2 ${className}`}
    >
      <Database className="w-5 h-5" />
      <span className="font-medium">Manage Data</span>

      {pendingCount > 0 && !isLoading && (
        <>
          {/* Badge */}
          <div className="ml-2 px-2 py-0.5 bg-red-500 rounded-full animate-pulse">
            <span className="text-sm font-bold text-white">{pendingCount}</span>
          </div>

          {/* Alert indicator */}
          <AlertCircle className="w-4 h-4 text-yellow-300" />
        </>
      )}

      {isLoading && (
        <div className="ml-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
    </motion.button>
  );
}

// Hook to get pending count for use in other components
export function usePendingMetricsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        // Fetch real count from API
        const response = await fetch('/api/sustainability/metrics/pending', {
          method: 'POST'
        });

        if (response.ok) {
          const data = await response.json();
          setCount(data.count);
        } else {
          setCount(0);
        }
      } catch (error) {
        console.error('Failed to fetch pending metrics count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { count, loading };
}