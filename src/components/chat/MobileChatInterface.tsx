'use client';

/**
 * Mobile Chat Interface
 *
 * Full-screen chat experience for mobile PWA
 * iOS-inspired with hamburger menu, light mode design
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Menu,
  X,
  Bot,
  PencilLine,
  Search,
  Sparkles,
  MoreVertical,
  Share,
  Edit,
  Archive,
  Trash2,
  Settings,
  LogOut,
  User,
  Bell,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatInterface } from './ChatInterface';
import type { SustainabilityAgentMessage } from '@/lib/ai/agents';
import { useAuth } from '@/lib/auth/context';
import { useCSRF } from '@/hooks/use-csrf';
import { Input } from '@/components/ui/input';
import { NotificationBadge } from '@/components/ui/notification-badge';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { syncBadgeWithServer, clearBadge } from '@/lib/pwa/badge';
import { ConversationsListSkeleton, NotificationsListSkeleton } from '@/components/mobile/SkeletonLoader';
import { hapticLight, hapticMedium, hapticSuccess } from '@/lib/mobile/haptics';
import { syncQueue } from '@/lib/offline/sync-queue';
import { getPendingSyncCount } from '@/lib/offline/db';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Lazy load heavy components for better performance
const PromptLibrary = dynamic(() => import('./PromptLibrary').then(m => ({ default: m.PromptLibrary })), {
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  ),
  ssr: false
});

const PWAInstallBannerCompact = dynamic(() => import('@/components/pwa/PWAInstallBanner').then(m => ({ default: m.PWAInstallBannerCompact })), {
  ssr: false
});

const PullToRefresh = dynamic(() => import('@/components/mobile/PullToRefresh').then(m => ({ default: m.PullToRefresh })), {
  ssr: false
});

interface MobileChatInterfaceProps {
  conversationId: string;
  organizationId: string;
  buildingId?: string;
  onNewChat: () => void;
}

interface ConversationMemory {
  id: string;
  title: string | null;
  summary: string;
  created_at: string;
  updated_at: string;
}

export function MobileChatInterface({
  conversationId: initialConversationId,
  organizationId,
  buildingId,
  onNewChat
}: MobileChatInterfaceProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [initialInput, setInitialInput] = useState('');
  const [conversations, setConversations] = useState<ConversationMemory[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversationId);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [loadedMessages, setLoadedMessages] = useState<SustainabilityAgentMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [loadedMessagesFor, setLoadedMessagesFor] = useState<string | null>(null);
  const [showingOnlyUnread, setShowingOnlyUnread] = useState(false);
  const [isHandlingNotificationClick, setIsHandlingNotificationClick] = useState(false);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPushPrompt, setShowPushPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { user, signOut } = useAuth();
  const { headers: csrfHeaders } = useCSRF();
  const { isSupported: isPushSupported, isSubscribed: isPushSubscribed, subscribe: subscribeToPush, permission: pushPermission } = usePushNotifications();
  const { showPrompt: showPWAPrompt, promptInstall, dismissPrompt: dismissPWAPrompt, isPWA } = usePWAInstall();
  const router = useRouter();

  const fetchConversations = async () => {
    if (!user) return;

    setIsLoadingConversations(true);
    try {
      const url = `/api/conversations?userId=${user.id}&organizationId=${organizationId}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('[MobileChat] Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
      setConversationsLoaded(true);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    setLoadedMessagesFor(null);
    setShowingOnlyUnread(false);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setLoadedMessages(data.messages || []);
        setLoadedMessagesFor(conversationId);
      } else if (response.status === 404) {
        setLoadedMessages([]);
        setLoadedMessagesFor(conversationId);
      }
    } catch (error) {
      console.error('[MobileChat] Error loading messages:', error);
      setLoadedMessages([]);
      setLoadedMessagesFor(null);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    try {
      const response = await fetch('/api/messages/unread');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setIsLoadingNotifications(true);
    try {
      const response = await fetch('/api/messages/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders
        },
        body: JSON.stringify({ conversationId }),
      });
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleNewChat = () => {
    onNewChat();
    const newConversationId = crypto.randomUUID();
    setSelectedConversationId(newConversationId);
    setLoadedMessages([]);
    setLoadedMessagesFor(null);
    setSearchQuery('');
    setIsSearchModalOpen(false);
    setIsMenuOpen(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    setIsLoadingMessages(true);
    setLoadedMessages([]);
    setLoadedMessagesFor(null);
    setShowingOnlyUnread(false);
    setSelectedConversationId(conversationId);
    setIsSearchModalOpen(false);
    setIsMenuOpen(false);

    const existingConv = conversations.find(c => c.id === conversationId);
    if (existingConv) {
      markMessagesAsRead(conversationId);
    }
  };

  const handleNotificationClick = async (conversationId: string) => {
    try {
      setIsHandlingNotificationClick(true);
      setIsLoadingMessages(true);
      setLoadedMessages([]);
      setLoadedMessagesFor(null);
      setShowingOnlyUnread(false);
      setSelectedConversationId(conversationId);
      setIsMenuOpen(false);

      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const allMessages = data.messages || [];
        const unreadMessages = allMessages.filter((msg: any) => !msg.read);

        if (unreadMessages.length > 0 && unreadMessages.length < allMessages.length) {
          setLoadedMessages(unreadMessages);
          setShowingOnlyUnread(true);
        } else {
          setLoadedMessages(allMessages);
          setShowingOnlyUnread(false);
        }
        setLoadedMessagesFor(conversationId);
      }

      await markMessagesAsRead(conversationId);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error handling notification click:', error);
    } finally {
      setIsLoadingMessages(false);
      setTimeout(() => setIsHandlingNotificationClick(false), 100);
    }
  };

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders
        },
        body: JSON.stringify({ title: newTitle.trim() })
      });

      if (response.ok) {
        await fetchConversations();
        setRenamingConversationId(null);
        setRenameValue('');
      }
    } catch (error) {
      console.error('[MobileChat] Error renaming conversation:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: { ...csrfHeaders }
      });

      if (response.ok) {
        if (conversationId === selectedConversationId) {
          handleNewChat();
        }
        await fetchConversations();
        setDeletingConversationId(null);
      }
    } catch (error) {
      console.error('[MobileChat] Error deleting conversation:', error);
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders
        },
        body: JSON.stringify({ archived: true })
      });

      if (response.ok) {
        if (conversationId === selectedConversationId) {
          handleNewChat();
        }
        await fetchConversations();
      }
    } catch (error) {
      console.error('[MobileChat] Error archiving conversation:', error);
    }
  };

  const handleShareConversation = async (conversationId: string) => {
    const url = `${window.location.origin}/chat/${conversationId}`;
    try {
      await navigator.clipboard.writeText(url);
      console.log('[MobileChat] Conversation URL copied to clipboard');
    } catch (error) {
      console.error('[MobileChat] Error copying to clipboard:', error);
    }
  };

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!selectedConversationId) return;
    if (isHandlingNotificationClick) return;

    if (conversationsLoaded) {
      const conversationExists = conversations.some(c => c.id === selectedConversationId);
      if (conversationExists || conversations.length === 0) {
        fetchMessages(selectedConversationId);
      } else {
        setLoadedMessages([]);
        setLoadedMessagesFor(selectedConversationId);
        setIsLoadingMessages(false);
      }
    }
  }, [selectedConversationId, conversationsLoaded, isHandlingNotificationClick]);

  // Poll for notifications
  useEffect(() => {
    if (!user) return;

    fetchUnreadCount();
    fetchNotifications();

    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Show push notification prompt on first launch
  useEffect(() => {
    if (!user || !isPushSupported) return;

    // Check if we've already asked
    const hasAskedForPush = localStorage.getItem('blipee-push-prompted');

    // Show prompt if:
    // 1. Not subscribed yet
    // 2. Haven't asked before
    // 3. Permission is default (not denied)
    if (!isPushSubscribed && !hasAskedForPush && pushPermission === 'default') {
      // Show after 3 seconds to let user get comfortable
      const timer = setTimeout(() => {
        setShowPushPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user, isPushSupported, isPushSubscribed, pushPermission]);

  // Sync badge with server when app opens
  useEffect(() => {
    if (isPWA && user) {
      console.log('[Mobile] Syncing badge with server...');
      syncBadgeWithServer();
    }
  }, [isPWA, user]);

  // Update badge when unread count changes
  useEffect(() => {
    if (isPWA) {
      // Update badge in service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'UPDATE_BADGE',
          count: unreadCount
        });
      }
    }
  }, [unreadCount, isPWA]);

  // Clear badge when user opens the menu (actively using the app)
  useEffect(() => {
    if (isMenuOpen && isPWA) {
      console.log('[Mobile] User opened menu, clearing badge...');
      clearBadge();
    }
  }, [isMenuOpen, isPWA]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('[Offline] Back online');
      setIsOnline(true);
      hapticSuccess();
    };

    const handleOffline = () => {
      console.log('[Offline] Gone offline');
      setIsOnline(false);
      hapticMedium();
    };

    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending sync count
  useEffect(() => {
    const updatePendingCount = async () => {
      const count = await getPendingSyncCount();
      setPendingSyncCount(count);
    };

    updatePendingCount();

    // Update count every 5 seconds
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (!isOnline || pendingSyncCount === 0 || isSyncing) return;

    const performSync = async () => {
      console.log(`[Offline] Syncing ${pendingSyncCount} pending items...`);
      setIsSyncing(true);

      try {
        const result = await syncQueue.sync();
        console.log(`[Offline] Sync complete: ${result.success} success, ${result.failed} failed`);

        if (result.success > 0) {
          hapticSuccess();
          // Refresh conversations after successful sync
          fetchConversations();
        }

        // Update pending count
        const count = await getPendingSyncCount();
        setPendingSyncCount(count);
      } catch (error) {
        console.error('[Offline] Sync error:', error);
      } finally {
        setIsSyncing(false);
      }
    };

    performSync();
  }, [isOnline, pendingSyncCount]);

  const handleEnablePush = async () => {
    const success = await subscribeToPush();
    if (success) {
      console.log('[Mobile] Push notifications enabled');
    }
    localStorage.setItem('blipee-push-prompted', 'true');
    setShowPushPrompt(false);
  };

  const handleSkipPush = () => {
    localStorage.setItem('blipee-push-prompted', 'true');
    setShowPushPrompt(false);
  };

  const recentConversations = conversations.slice(0, 5);
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.title?.toLowerCase().includes(query) ||
      conv.summary.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* PWA Install Banner */}
      {!isPWA && (
        <PWAInstallBannerCompact
          show={showPWAPrompt}
          onInstall={promptInstall}
          onDismiss={dismissPWAPrompt}
        />
      )}

      {/* Mobile Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <div className="p-[2px] rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
            <div className="p-1.5 rounded-md bg-white/90">
              <Bot className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              blipee
            </span>
            {!isOnline && (
              <span className="text-xs text-orange-500 font-medium">
                Offline
              </span>
            )}
            {isSyncing && (
              <span className="text-xs text-blue-500 font-medium">
                Syncing...
              </span>
            )}
            {isOnline && pendingSyncCount > 0 && !isSyncing && (
              <span className="text-xs text-gray-500">
                {pendingSyncCount} pending
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            hapticLight();
            setIsMenuOpen(true);
          }}
          className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors active:scale-95"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-700" />
          <NotificationBadge count={unreadCount} />
        </button>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        {(() => {
          const shouldShowLoading = !conversationsLoaded || isLoadingMessages || loadedMessagesFor !== selectedConversationId;

          return shouldShowLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="text-sm text-gray-500">
                  {!conversationsLoaded ? 'Loading conversations...' : 'Loading messages...'}
                </div>
              </div>
            </div>
          ) : (
            <ChatInterface
              key={selectedConversationId}
              conversationId={selectedConversationId}
              organizationId={organizationId}
              buildingId={buildingId}
              initialMessages={loadedMessages}
              initialInput={initialInput}
              className="h-full"
              onConversationUpdate={fetchConversations}
              showingOnlyUnread={showingOnlyUnread}
              onLoadAllMessages={async () => {
                if (!selectedConversationId) return;
                setIsLoadingMessages(true);
                try {
                  const response = await fetch(`/api/conversations/${selectedConversationId}/messages`);
                  if (response.ok) {
                    const data = await response.json();
                    setLoadedMessages(data.messages || []);
                    setShowingOnlyUnread(false);
                  }
                } catch (error) {
                  console.error('Error loading all messages:', error);
                } finally {
                  setIsLoadingMessages(false);
                }
              }}
            />
          );
        })()}
      </div>

      {/* Slide-in Menu - iOS Style */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                hapticLight();
                setIsMenuOpen(false);
              }}
              className="fixed inset-0 bg-black/50 z-[70]"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                // Close menu if dragged far enough or fast enough to the right
                if (offset.x > 100 || velocity.x > 500) {
                  hapticMedium();
                  setIsMenuOpen(false);
                }
              }}
              className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white z-[80] shadow-2xl overflow-y-auto"
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-lg text-gray-900">Menu</h2>
                <button
                  onClick={() => {
                    hapticLight();
                    setIsMenuOpen(false);
                  }}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors active:scale-95"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* Menu Content */}
              <div className="p-4 space-y-6">
                {/* Actions Section */}
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      hapticMedium();
                      handleNewChat();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 rounded-lg transition-all active:scale-98 text-left"
                  >
                    <PencilLine className="w-5 h-5 text-green-600" />
                    <span className="font-medium">New Chat</span>
                  </button>

                  <button
                    onClick={() => {
                      hapticLight();
                      setIsSearchModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 rounded-lg transition-all active:scale-98 text-left"
                  >
                    <Search className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Search Chats</span>
                  </button>

                  <button
                    onClick={() => {
                      hapticLight();
                      setIsPromptLibraryOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 rounded-lg transition-all active:scale-98 text-left"
                  >
                    <Sparkles className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Prompt Library</span>
                  </button>
                </div>

                {/* Notifications Section */}
                {isLoadingNotifications ? (
                  <div>
                    <div className="flex items-center justify-between mb-2 px-4">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Notifications
                      </h3>
                    </div>
                    <NotificationsListSkeleton />
                  </div>
                ) : notifications.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-2 px-4">
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <span className="text-xs text-white bg-green-500 px-2 py-0.5 rounded-full">
                          {unreadCount}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {notifications.slice(0, 5).map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => {
                            hapticLight();
                            handleNotificationClick(notification.conversationId);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                            notification.read
                              ? 'text-gray-600 hover:bg-gray-100'
                              : 'bg-green-50 text-gray-900 hover:bg-green-100 font-medium'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Bot className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
                            <div className="flex-1 min-w-0">
                              {notification.agentName && (
                                <p className="text-xs text-green-600 mb-0.5">
                                  {notification.agentName}
                                </p>
                              )}
                              <p className="text-sm truncate">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(notification.timestamp).toLocaleDateString()} {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1.5" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Recent Chats Section */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 px-4">
                    Recent Chats
                  </h3>

                  {isLoadingConversations ? (
                    <ConversationsListSkeleton />
                  ) : recentConversations.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No conversations yet
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {recentConversations.map((conv) => (
                        <div key={conv.id} className="relative group">
                          {selectedConversationId === conv.id ? (
                            <div className="p-[2px] rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                              <div className="w-full flex items-center justify-between px-4 py-3 rounded-md bg-white text-gray-900">
                                {renamingConversationId === conv.id ? (
                                  <input
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onBlur={() => handleRenameConversation(conv.id, renameValue)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleRenameConversation(conv.id, renameValue);
                                      } else if (e.key === 'Escape') {
                                        setRenamingConversationId(null);
                                        setRenameValue('');
                                      }
                                    }}
                                    autoFocus
                                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-sm"
                                  />
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleSelectConversation(conv.id)}
                                      className="flex-1 text-left truncate text-sm font-medium"
                                    >
                                      {conv.title || 'Untitled conversation'}
                                    </button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger
                                        className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => handleShareConversation(conv.id)}>
                                          <Share className="w-4 h-4 mr-2" />
                                          Share
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => {
                                          setRenamingConversationId(conv.id);
                                          setRenameValue(conv.title || '');
                                        }}>
                                          <Edit className="w-4 h-4 mr-2" />
                                          Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleArchiveConversation(conv.id)}>
                                          <Archive className="w-4 h-4 mr-2" />
                                          Archive
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-red-600 focus:text-red-600"
                                          onClick={() => setDeletingConversationId(conv.id)}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSelectConversation(conv.id)}
                              className="w-full flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 rounded-lg transition-colors text-left"
                            >
                              <span className="flex-1 truncate text-sm">
                                {conv.title || 'Untitled conversation'}
                              </span>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                        </div>
                      ))}

                      {conversations.length > 5 && (
                        <button
                          onClick={() => {
                            setIsSearchModalOpen(true);
                            setIsMenuOpen(false);
                          }}
                          className="w-full px-4 py-3 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors text-center font-medium"
                        >
                          See all conversations...
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Settings Section */}
                <div className="border-t border-gray-200 pt-4 space-y-1">
                  <button
                    onClick={() => {
                      router.push('/settings/organizations');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <Settings className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push('/profile');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Profile</span>
                  </button>

                  <button
                    onClick={async () => {
                      try {
                        await signOut();
                        router.push('/signin');
                      } catch (error) {
                        console.error('Error during logout:', error);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-[90]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 m-auto max-w-2xl max-h-[80vh] bg-white rounded-2xl shadow-2xl z-[100] overflow-hidden flex flex-col"
            >
              {/* Search Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-none focus:ring-0 p-0"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setIsSearchModalOpen(false);
                      setSearchQuery('');
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No conversations found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          handleSelectConversation(conv.id);
                          setIsSearchModalOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="font-medium text-gray-900 mb-1">
                          {conv.title || 'Untitled conversation'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {conv.summary}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(conv.updated_at).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Prompt Library Modal */}
      <PromptLibrary
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelectPrompt={(prompt) => {
          setInitialInput(prompt);
          setIsPromptLibraryOpen(false);
        }}
      />

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingConversationId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingConversationId(null)}
              className="fixed inset-0 bg-black/50 z-[90]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 m-auto w-[90vw] max-w-sm h-fit bg-white rounded-2xl shadow-2xl z-[100] p-6"
            >
              <h3 className="text-lg font-semibold mb-2">Delete conversation?</h3>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. The conversation will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingConversationId(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteConversation(deletingConversationId)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Push Notification Permission Prompt */}
      <AnimatePresence>
        {showPushPrompt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleSkipPush}
              className="fixed inset-0 bg-black/50 z-[90]"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-[90vw] max-w-sm h-fit bg-white rounded-2xl shadow-2xl z-[100] p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <Bell className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-semibold mb-2">Stay Updated</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Get notified when AI agents find important sustainability insights, compliance alerts, or optimization opportunities.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleEnablePush}
                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:shadow-lg transition-all"
                  >
                    Enable Notifications
                  </button>
                  <button
                    onClick={handleSkipPush}
                    className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>

                <p className="text-xs text-gray-400 mt-4">
                  You can change this anytime in Settings
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MobileChatInterface;
