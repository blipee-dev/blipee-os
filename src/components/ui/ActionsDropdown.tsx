"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
}: ActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action: () => void | undefined) => {
    if (action) {
      action();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-[#616161] dark:text-[#757575]" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#212121] rounded-lg shadow-lg border border-gray-200 dark:border-white/[0.05] z-50 overflow-hidden"
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
                  <Pin className="w-4 h-4 text-[#616161] dark:text-[#757575]" />
                  <span>{t('common.pin') || 'Pin'}</span>
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
      </AnimatePresence>
    </div>
  );
}