/**
 * Skeleton Loader Components
 *
 * Beautiful skeleton screens for mobile loading states
 * Improves perceived performance
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Base skeleton component with shimmer effect
 */
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded ${className}`}
      {...props}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
    </div>
  );
}

/**
 * Chat message skeleton
 */
export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

/**
 * Conversation list item skeleton
 */
export function ConversationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

/**
 * Notification skeleton
 */
export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
      <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

/**
 * Mobile header skeleton
 */
export function MobileHeaderSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="w-10 h-10 rounded-lg" />
    </div>
  );
}

/**
 * Menu section skeleton
 */
export function MenuSectionSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-4 w-24 mb-3" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Full page loading skeleton
 */
export function MobilePageSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-white">
      <MobileHeaderSkeleton />
      <div className="flex-1 overflow-hidden">
        <div className="space-y-0">
          {[1, 2, 3, 4, 5].map((i) => (
            <ChatMessageSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Conversations list skeleton
 */
export function ConversationsListSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <ConversationSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Notifications list skeleton
 */
export function NotificationsListSkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4].map((i) => (
        <NotificationSkeleton key={i} />
      ))}
    </div>
  );
}
