'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Settings, LogOut, Brain } from 'lucide-react';
import { ConversationInterface } from './ConversationInterface';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useAccentGradient } from '@/providers/AppearanceProvider';

interface MobileConversationLayoutProps {
  showHeader?: boolean;
}

export function MobileConversationLayout({ showHeader = true }: MobileConversationLayoutProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const accentGradientConfig = useAccentGradient();
  const accentGradient = accentGradientConfig.gradient;

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Mobile Header */}
      {showHeader && (
        <div className="flex-shrink-0 border-b border-white/[0.08] bg-black/40 backdrop-blur-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${accentGradient} flex items-center justify-center`}>
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white/90">Blipee AI</div>
                <div className="text-xs text-white/50">Your Sustainability Team</div>
              </div>
            </div>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {showMenu ? (
                <X className="w-5 h-5 text-white/70" />
              ) : (
                <Menu className="w-5 h-5 text-white/70" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Full-Screen Conversation */}
      <div className="flex-1 overflow-hidden">
        <ConversationInterface fullscreen />
      </div>

      {/* Slide-in Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[280px] bg-[#0a0a0a] border-l border-white/[0.08] z-50 flex flex-col"
            >
              {/* User Info */}
              <div className="p-6 border-b border-white/[0.08]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/[0.08] flex items-center justify-center">
                    <User className="w-6 h-6 text-white/70" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/90">
                      {user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-white/50">{user?.email}</div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 p-4 space-y-2">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    router.push('/sustainability/dashboard');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-colors text-left"
                >
                  <Brain className="w-5 h-5 text-white/70" />
                  <span className="text-sm text-white/80">Desktop View</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    router.push('/settings');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.05] transition-colors text-left"
                >
                  <Settings className="w-5 h-5 text-white/70" />
                  <span className="text-sm text-white/80">Settings</span>
                </button>
              </div>

              {/* Sign Out */}
              <div className="p-4 border-t border-white/[0.08]">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-left"
                >
                  <LogOut className="w-5 h-5 text-red-400" />
                  <span className="text-sm text-red-400">Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
