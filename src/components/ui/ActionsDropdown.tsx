"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from 'react-dom';
import { MoreHorizontal, Pin, Edit2, Trash2, Eye, Star } from "lucide-react";
import { useLanguage } from "@/providers/LanguageProvider";

interface ActionsDropdownProps {
  onView?: () => void;
  onPin?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStar?: () => void;
  onRename?: () => void;
  showView?: boolean;
  showPin?: boolean;
  showStar?: boolean;
  showRename?: boolean;
  isPinned?: boolean;
}

export default function ActionsDropdown({
  onView,
  onPin,
  onEdit,
  onDelete,
  onStar,
  onRename,
  showView = false,
  showPin = true,
  showStar = false,
  showRename = false,
  isPinned = false,
}: ActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current && !buttonRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 160; // w-40 = 10rem = 160px
      const dropdownHeight = 250; // Approximate height

      // Calculate position
      let top = rect.bottom + 4; // 4px gap
      let left = rect.right - dropdownWidth; // Align to right edge

      // Check if dropdown would go off screen bottom
      if (top + dropdownHeight > window.innerHeight) {
        top = rect.top - dropdownHeight - 4; // Position above
      }

      // Check if dropdown would go off screen left
      if (left < 0) {
        left = rect.left;
      }

      // Check if dropdown would go off screen right
      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 8; // 8px margin
      }

      setDropdownPosition({ top, left });
    }
  }, [isOpen]);

  const handleAction = (action: () => void | undefined) => {
    if (action) {
      action();
    }
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-[#616161] dark:text-[#757575]" />
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={dropdownRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-40 bg-white dark:bg-[#212121] rounded-lg shadow-lg border border-gray-200 dark:border-white/[0.05] overflow-hidden"
              style={{
                position: 'fixed',
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                zIndex: 9999,
              }}
            >
            <div className="py-1">
              {showView && onView && (
                <button
                  onClick={() => handleAction(onView)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.05] flex items-center gap-3 transition-colors"
                >
                  <Eye className="w-4 h-4 text-[#616161] dark:text-[#757575]" />
                  <span>{t('common.view') || 'View'}</span>
                </button>
              )}
              
              {showStar && onStar && (
                <button
                  onClick={() => handleAction(onStar)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.05] flex items-center gap-3 transition-colors"
                >
                  <Star className="w-4 h-4 text-[#616161] dark:text-[#757575]" />
                  <span>{t('common.star') || 'Star'}</span>
                </button>
              )}
              
              {showPin && onPin && (
                <button
                  onClick={() => handleAction(onPin)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.05] flex items-center gap-3 transition-colors"
                >
                  <Pin className={`w-4 h-4 ${isPinned ? 'text-purple-500' : 'text-[#616161] dark:text-[#757575]'}`} />
                  <span>{isPinned ? (t('common.unpin') || 'Unpin') : (t('common.pin') || 'Pin')}</span>
                </button>
              )}
              
              {showRename && onRename && (
                <button
                  onClick={() => handleAction(onRename)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.05] flex items-center gap-3 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-[#616161] dark:text-[#757575]" />
                  <span>{t('common.rename') || 'Rename'}</span>
                </button>
              )}
              
              {onEdit && (
                <button
                  onClick={() => handleAction(onEdit)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.05] flex items-center gap-3 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-[#616161] dark:text-[#757575]" />
                  <span>{t('common.edit') || 'Edit'}</span>
                </button>
              )}
              
              {onDelete && (
                <>
                  <div className="h-px bg-gray-200 dark:bg-white/[0.05] my-1" />
                  <button
                    onClick={() => handleAction(onDelete)}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{t('common.delete') || 'Delete'}</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}