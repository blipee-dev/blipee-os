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
    <main className="min-h-screen bg-white dark:bg-[#111111] transition-colors duration-300">
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm sm:max-w-md"
        >
          {/* Clean card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white dark:bg-[#212121] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 sm:p-8 lg:p-10"
          >
            {/* Logo section */}
            <header className="text-center mb-6 sm:mb-8">
              <Link href="/" className="inline-flex items-center justify-center mb-6 group focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-lg" aria-label="Go to homepage">
                <div className="w-12 h-12 p-0.5 rounded-xl transition-transform group-hover:scale-105" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                  <div className="w-full h-full bg-white/95 dark:bg-black/95 rounded-[10px] flex items-center justify-center">
                    <Home className="w-7 h-7" stroke="url(#authCardGradient)" fill="none" strokeWidth="2" />
                    <svg width="0" height="0">
                      <defs>
                        <linearGradient id="authCardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgb(236, 72, 153)" />
                          <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
                <span className="ml-2 sm:ml-3 text-xl sm:text-2xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent" aria-label="blipee logo">
                  blipee
                </span>
              </Link>
              {subtitle && (
                <h1 className="text-sm sm:text-base text-gray-700 dark:text-gray-300" role="heading" aria-level="1">
                  {subtitle}
                </h1>
              )}
            </header>

            {/* Form content */}
            {children}
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}