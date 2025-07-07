'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 flex items-center justify-center p-4">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex justify-center items-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="flex items-center"
          >
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Blipee OS
            </span>
          </motion.div>
        </Link>
        
        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl rounded-2xl px-8 py-8 border border-white/20 dark:border-gray-700/20"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
          
          {children}
        </motion.div>
      </motion.div>
    </div>
  )
}