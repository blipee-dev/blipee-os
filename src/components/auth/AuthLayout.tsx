"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      
      {/* Animated orbs for depth - subtle and elegant */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -right-[20%] w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute -bottom-[40%] -left-[20%] w-[600px] h-[600px] rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      {/* Simple, clean header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between p-6 sm:p-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="p-2 rounded-lg bg-white/5 backdrop-blur border border-white/10 group-hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4 text-white/70" />
            </div>
            <span className="text-white/70 text-sm hidden sm:block">Back</span>
          </Link>
          
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold hidden sm:block">blipee</span>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-88px)] px-6 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Clean card with glass effect */}
          <div className="relative">
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl rounded-3xl" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 sm:p-10"
            >
              {/* Title section */}
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm sm:text-base text-white/60">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Form content */}
              {children}
            </motion.div>
          </div>

          {/* Footer text */}
          <div className="text-center mt-8">
            <p className="text-xs text-white/40">
              Protected by enterprise-grade security
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}