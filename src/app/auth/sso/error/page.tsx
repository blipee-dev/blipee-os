'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

function SSOErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const error = searchParams.get('error') || 'unknown_error';
  const description = searchParams.get('description') || 'An error occurred during SSO authentication';

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'invalid_request':
        return 'The SSO request was invalid. Please try again.';
      case 'access_denied':
        return 'Access was denied by the identity provider.';
      case 'unsupported_response_type':
        return 'The identity provider returned an unsupported response type.';
      case 'invalid_scope':
        return 'The requested scope is invalid or not supported.';
      case 'server_error':
        return 'The identity provider encountered an error.';
      case 'temporarily_unavailable':
        return 'The identity provider is temporarily unavailable.';
      case 'configuration_error':
        return 'There is an issue with the SSO configuration.';
      case 'user_not_found':
        return 'Your account was not found or is not authorized.';
      default:
        return description;
    }
  };

  return (
    <AuthLayout
      title="SSO Authentication Failed"
      subtitle="We couldn't complete the sign-in process"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                Authentication Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                {getErrorMessage(error)}
              </p>
              {error !== 'unknown_error' && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Error code: {error}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/signin')}
            className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none transform transition-all hover:scale-[1.02] active:scale-[0.98] font-medium shadow-lg"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Sign In
          </button>

          <button
            onClick={() => router.push('/signin')}
            className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            Try a different sign-in method
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            If you continue to experience issues, please contact your administrator or{' '}
            <a
              href="mailto:support@blipee.com"
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              our support team
            </a>
            .
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
}

export default function SSOErrorPage() {
  return (
    <Suspense fallback={
      <AuthLayout
        title="Loading..."
        subtitle="Please wait"
      >
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </AuthLayout>
    }>
      <SSOErrorContent />
    </Suspense>
  );
}