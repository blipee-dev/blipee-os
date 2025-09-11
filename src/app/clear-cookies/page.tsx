'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClearCookiesPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Clearing cookies...');
  const [cleared, setCleared] = useState<string[]>([]);

  useEffect(() => {
    const clearAllCorruptedCookies = () => {
      const clearedCookies: string[] = [];
      
      // Get all cookies
      const cookies = document.cookie.split(';');
      
      cookies.forEach(cookie => {
        const [name, ...valueParts] = cookie.trim().split('=');
        const value = valueParts.join('=');
        
        if (!name) return;
        
        // Clear ALL Supabase-related cookies to ensure clean state
        if (name.includes('sb-') || name.includes('supabase') || name.includes('auth')) {
          clearedCookies.push(name);
          
          // Aggressively clear the cookie
          const domains = [
            window.location.hostname,
            '.' + window.location.hostname,
            'localhost',
            '.localhost',
            '.vercel.app',
            ''
          ];
          
          const paths = ['/', '/blipee-os', window.location.pathname, ''];
          
          domains.forEach(domain => {
            paths.forEach(path => {
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; SameSite=Lax`;
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Lax`;
              document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
              document.cookie = `${name}=; Max-Age=-99999999; path=${path}; domain=${domain}`;
              document.cookie = `${name}=; Max-Age=0; path=${path}; domain=${domain}`;
            });
          });
          
          // Try without domain
          paths.forEach(path => {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
            document.cookie = `${name}=; Max-Age=-99999999; path=${path}`;
            document.cookie = `${name}=; Max-Age=0; path=${path}`;
          });
        }
      });
      
      return clearedCookies;
    };

    // Clear cookies
    const clearedList = clearAllCorruptedCookies();
    setCleared(clearedList);
    
    if (clearedList.length > 0) {
      setStatus(`Cleared ${clearedList.length} cookies. Redirecting to sign in...`);
      
      // Clear local storage and session storage too
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/signin');
      }, 2000);
    } else {
      setStatus('No cookies to clear. Redirecting to sign in...');
      setTimeout(() => {
        router.push('/signin');
      }, 1500);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-xl p-8">
        <h1 className="text-2xl font-semibold text-white mb-4">Clearing Authentication</h1>
        <p className="text-gray-400 mb-6">{status}</p>
        
        {cleared.length > 0 && (
          <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.05]">
            <p className="text-sm text-gray-500 mb-2">Cleared cookies:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              {cleared.map((cookie, i) => (
                <li key={i} className="font-mono truncate">{cookie}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50"></div>
        </div>
      </div>
    </div>
  );
}