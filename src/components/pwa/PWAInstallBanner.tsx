/**
 * PWA Install Banner
 *
 * Beautiful "Add to Home Screen" banner for mobile PWA
 * Shows at the top of the mobile interface when app is installable
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import Image from 'next/image';

interface PWAInstallBannerProps {
  show: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export function PWAInstallBanner({ show, onInstall, onDismiss }: PWAInstallBannerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-0 left-0 right-0 z-50 mx-auto max-w-md"
        >
          <div className="m-4 bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/[0.1] overflow-hidden">
            {/* Gradient header */}
            <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />

            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* App icon */}
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Image
                      src="/favicon-black-white.svg"
                      alt="Blipee"
                      width={40}
                      height={40}
                      className="drop-shadow-md"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        Install Blipee
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Get quick access to your AI sustainability assistant
                      </p>
                    </div>

                    {/* Close button */}
                    <button
                      onClick={onDismiss}
                      className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
                      aria-label="Dismiss"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Features */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span>Works offline</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>Fast & responsive</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span>Push notifications</span>
                    </div>
                  </div>

                  {/* Install button */}
                  <button
                    onClick={onInstall}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Add to Home Screen
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Compact PWA Install Banner
 * Smaller version for less intrusive placement
 */
export function PWAInstallBannerCompact({ show, onInstall, onDismiss }: PWAInstallBannerProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-md"
        >
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-0.5">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-3">
              <div className="flex items-center gap-3">
                {/* App icon */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Install Blipee App
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Quick access on your home screen
                  </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  <button
                    onClick={onInstall}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Install
                  </button>
                  <button
                    onClick={onDismiss}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
