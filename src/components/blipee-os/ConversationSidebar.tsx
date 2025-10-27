"use client";

import React from "react";

interface ConversationSidebarProps {
  conversations?: any[];
  onNewConversation?: () => void;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * ConversationSidebar Component
 *
 * Minimal implementation to prevent build errors.
 * This component should be properly implemented based on app requirements.
 */
export function ConversationSidebar({
  conversations = [],
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  isCollapsed = false,
  onToggleCollapse,
}: ConversationSidebarProps) {
  return (
    <div
      className={`h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Minimal sidebar implementation */}
      <div className="p-4">
        {!isCollapsed && (
          <button
            onClick={onNewConversation}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            New Chat
          </button>
        )}
      </div>
    </div>
  );
}
