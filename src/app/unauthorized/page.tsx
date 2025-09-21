'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, UserX, Building2, KeyRound, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const requiredRole = searchParams.get('required');

  const getErrorDetails = () => {
    switch (reason) {
      case 'no_organization':
        return {
          icon: Building2,
          title: 'No Organization Access',
          description: 'You are not a member of any organization. Please contact your administrator to be added to an organization.',
          color: 'from-orange-500/20 to-yellow-500/20',
          borderColor: 'border-orange-500/20',
        };
      case 'insufficient_permissions':
        return {
          icon: KeyRound,
          title: 'Insufficient Permissions',
          description: `You need ${requiredRole ? `"${requiredRole}"` : 'higher'} role to access this page. Please contact your administrator to request the appropriate permissions.`,
          color: 'from-red-500/20 to-pink-500/20',
          borderColor: 'border-red-500/20',
        };
      case 'resource_not_found':
        return {
          icon: UserX,
          title: 'Resource Not Found',
          description: 'The resource you are trying to access does not exist or has been removed.',
          color: 'from-gray-500/20 to-slate-500/20',
          borderColor: 'border-gray-500/20',
        };
      default:
        return {
          icon: Shield,
          title: 'Access Denied',
          description: 'You do not have permission to access this page. Please contact your administrator if you believe this is an error.',
          color: 'from-purple-500/20 to-indigo-500/20',
          borderColor: 'border-purple-500/20',
        };
    }
  };

  const errorDetails = getErrorDetails();
  const IconComponent = errorDetails.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-3xl" />

          {/* Main card */}
          <div className={`relative backdrop-blur-xl bg-white/[0.02] border ${errorDetails.borderColor} rounded-2xl p-8`}>
            {/* Icon and status */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`relative p-4 bg-gradient-to-br ${errorDetails.color} rounded-2xl`}>
                <IconComponent className="w-12 h-12 text-white" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                </motion.div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-white">
                  {errorDetails.title}
                </h1>
                <p className="text-gray-400 text-sm max-w-sm">
                  {errorDetails.description}
                </p>
              </div>

              {/* Error code */}
              <div className="inline-flex items-center px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-full">
                <span className="text-xs text-gray-500">Error Code:</span>
                <span className="text-xs text-white ml-2 font-mono">403</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-3">
              <Link href="/blipee-ai" className="block">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>

              <Link href="/profile" className="block">
                <Button
                  variant="outline"
                  className="w-full bg-white/[0.03] hover:bg-white/[0.05] text-white border-white/[0.1]"
                >
                  View Your Profile
                </Button>
              </Link>
            </div>

            {/* Help text */}
            <div className="mt-6 pt-6 border-t border-white/[0.05]">
              <p className="text-xs text-gray-500 text-center">
                If you believe this is an error, please contact your system administrator
                or{' '}
                <Link
                  href="/support"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  contact support
                </Link>
                .
              </p>
            </div>
          </div>
        </motion.div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-gray-600">
            Request ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
          </p>
        </motion.div>
      </div>
    </div>
  );
}