"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import {
  Building2,
  Users,
  MapPin,
  Cpu,
  X,
  ChevronRight,
} from "lucide-react";

interface MobileSettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const settingsItems = [
  {
    id: "organizations",
    label: "Organizations",
    description: "Organization management",
    icon: Building2,
    href: "/settings/organizations",
  },
  {
    id: "sites",
    label: "Sites",
    description: "Site management",
    icon: MapPin,
    href: "/settings/sites",
  },
  {
    id: "devices",
    label: "Devices",
    description: "Device management",
    icon: Cpu,
    href: "/settings/devices",
  },
  {
    id: "users",
    label: "Users",
    description: "User management",
    icon: Users,
    href: "/settings/users",
  },
];

export function MobileSettingsSidebar({ isOpen, onClose }: MobileSettingsSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleItemClick = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[500] md:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-[#111111] z-[501] md:hidden border-r border-gray-200 dark:border-white/[0.05]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/[0.05]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Settings
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
              </button>
            </div>

            {/* Settings Items */}
            <div className="p-4 space-y-2">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleItemClick(item.href)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                      isActive
                        ? "bg-gradient-to-r from-pink-500/10 to-purple-600/10 border border-pink-500/20"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      isActive
                        ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                        : "bg-gray-100 dark:bg-[#212121] text-[#616161] dark:text-[#757575]"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        isActive
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-900 dark:text-white"
                      }`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-[#616161] dark:text-[#757575]">
                        {item.description}
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${
                      isActive
                        ? "text-pink-500"
                        : "text-[#616161] dark:text-[#757575]"
                    }`} />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}