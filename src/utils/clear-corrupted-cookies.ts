/**
 * Aggressively clear corrupted Supabase cookies
 * This should be called as early as possible in the app initialization
 */
export function clearCorruptedCookies() {
  if (typeof window === 'undefined') return;

  const corrupted: string[] = [];
  
  // Get all cookies
  const cookies = document.cookie.split(';');
  
  cookies.forEach(cookie => {
    const [name, ...valueParts] = cookie.trim().split('=');
    const value = valueParts.join('=');
    
    if (!name || !value) return;
    
    // Check for corrupted patterns
    const isCorrupted = 
      // Base64 prefix corruption
      value.startsWith('base64-') ||
      value.includes('"base64-') ||
      value.startsWith('"eyJ') ||
      // Specific known corrupted cookie
      (name.includes('sb-') && name.includes('-auth-token') && 
       (value.includes('base64-') || !value.startsWith('eyJ'))) ||
      // Any Supabase cookie with base64 prefix
      ((name.includes('sb-') || name.includes('supabase')) && 
       (value.includes('base64-eyJ') || value === 'base64'));
    
    if (isCorrupted) {
      corrupted.push(name);
      clearCookieCompletely(name);
    }
  });
  
  if (corrupted.length > 0) {
  }
}

/**
 * Clear a cookie across all possible domain and path combinations
 */
function clearCookieCompletely(name: string) {
  const domains = [
    window.location.hostname,
    '.' + window.location.hostname,
    'localhost',
    '.localhost',
    '.vercel.app',
    ''
  ];
  
  const paths = ['/', '/blipee-os', window.location.pathname, ''];
  
  // Try all combinations
  domains.forEach(domain => {
    paths.forEach(path => {
      // Multiple clearing strategies
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
      document.cookie = `${name}=; Max-Age=-99999999; path=${path}; domain=${domain}`;
      document.cookie = `${name}=; Max-Age=0; path=${path}; domain=${domain}`;
    });
  });
  
  // Also try without domain for local cookies
  paths.forEach(path => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
    document.cookie = `${name}=; Max-Age=-99999999; path=${path}`;
    document.cookie = `${name}=; Max-Age=0; path=${path}`;
  });
}

// Auto-run on import in browser environment
if (typeof window !== 'undefined') {
  clearCorruptedCookies();
}