// This script runs immediately to clear corrupted Supabase cookies
// It runs before React/Next.js hydration to prevent auth errors

(function() {
  'use strict';
  
  // Function to clear a cookie across all domains and paths
  function clearCookie(name) {
    const domains = [
      window.location.hostname,
      '.' + window.location.hostname,
      'localhost',
      '.localhost',
      ''
    ];
    
    const paths = ['/', '/blipee-os', ''];
    
    domains.forEach(function(domain) {
      paths.forEach(function(path) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=' + path + '; domain=' + domain;
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=' + path;
        document.cookie = name + '=; Max-Age=-99999999; path=' + path + '; domain=' + domain;
        document.cookie = name + '=; Max-Age=-99999999; path=' + path;
      });
    });
  }
  
  // Check and clear corrupted cookies
  const cookies = document.cookie.split(';');
  let clearedCount = 0;
  const corruptedPatterns = ['base64-eyJ', '"base64-', 'base64-', '"eyJ'];
  
  cookies.forEach(function(cookie) {
    const parts = cookie.trim().split('=');
    const name = parts[0];
    const value = parts.slice(1).join('=');
    
    if (!name || !value) return;
    
    // Check for Supabase auth token patterns
    if (name.indexOf('sb-') === 0 && name.indexOf('-auth-token') !== -1) {
      // Check if value is corrupted
      let isCorrupted = false;
      
      // Check for base64 prefix corruption
      corruptedPatterns.forEach(function(pattern) {
        if (value.indexOf(pattern) === 0) {
          isCorrupted = true;
        }
      });
      
      // Check for embedded JWT in wrong position
      if (value.indexOf('eyJ') !== -1 && value.indexOf('eyJ') !== 0) {
        isCorrupted = true;
      }
      
      // Check for malformed JWT (should have 3 parts separated by dots)
      if (value.indexOf('eyJ') === 0) {
        const jwtParts = value.split('.');
        if (jwtParts.length !== 3) {
          isCorrupted = true;
        }
      }
      
      if (isCorrupted) {
        clearCookie(name);
        console.log('[Cookie Cleaner] Cleared corrupted auth token:', name);
        clearedCount++;
        return;
      }
    }
    
    // Check for any Supabase-related cookies with corrupted values
    if (name.indexOf('sb-') !== -1 || name.indexOf('supabase') !== -1) {
      let isCorrupted = false;
      
      // Check for corrupted patterns
      corruptedPatterns.forEach(function(pattern) {
        if (value.indexOf(pattern) !== -1) {
          isCorrupted = true;
        }
      });
      
      if (isCorrupted) {
        clearCookie(name);
        console.log('[Cookie Cleaner] Cleared malformed cookie:', name);
        clearedCount++;
      }
    }
  });
  
  if (clearedCount > 0) {
    console.log('[Cookie Cleaner] Total cookies cleared:', clearedCount);
  }
})();