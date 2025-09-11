'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function clearAuthCookies() {
  if (typeof document !== 'undefined') {
    // Clear all cookies by setting them to expire
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
  }
}

export default function ClearAuthPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Clearing authentication data...');

  useEffect(() => {
    // Clear all cookies
    clearAuthCookies();
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear sessionStorage
      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('auth') || key.includes('sb-'))) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      setStatus('Authentication data cleared! Redirecting to sign in...');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/signin');
      }, 2000);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Clearing Authentication</h1>
        <p className="text-gray-400 mb-6">{status}</p>
        <div className="animate-pulse">
          <div className="h-2 bg-gradient-to-r from-purple-500/50 to-blue-500/50 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}