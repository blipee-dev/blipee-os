/**
 * Notification Badge Component
 *
 * Red circle badge showing unread count (like missed calls/messages)
 * Appears on chat button when there are unread agent messages
 */

import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  max?: number; // Maximum number to display before showing "99+"
}

export function NotificationBadge({ count, className, max = 99 }: NotificationBadgeProps) {
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <div
      className={cn(
        "absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center",
        "bg-red-500 text-white text-xs font-semibold rounded-full",
        "border-2 border-white dark:border-zinc-900",
        "animate-pulse",
        className
      )}
    >
      {displayCount}
    </div>
  );
}
