/**
 * Clears malformed Supabase auth cookies that may cause parsing errors
 */
export function clearMalformedSupabaseCookies() {
  if (typeof window === 'undefined') return;
  
  const cookies = document.cookie.split(';');
  let clearedCount = 0;
  
  // Specifically target the known corrupted cookie
  const targetCookie = 'sb-quovvwrwyfkzhgqdeham-auth-token';
  
  cookies.forEach(cookie => {
    const [name, ...valueParts] = cookie.trim().split('=');
    const value = valueParts.join('=');
    
    // Always clear the specific corrupted cookie
    if (name === targetCookie) {
      clearCookieAggressively(name);
      clearedCount++;
      return;
    }
    
    // Check for Supabase-related cookies
    if (name && (name.includes('sb-') || name.includes('supabase'))) {
      // Check if the value looks malformed
      if (value && (value.startsWith('base64-') || value.includes('"base64-'))) {
        clearCookieAggressively(name);
        clearedCount++;
      }
    }
  });
  
  if (clearedCount > 0) {
  }
}

/**
 * Aggressively clear a cookie across all possible domains and paths
 */
function clearCookieAggressively(name: string) {
  const domains = [
    window.location.hostname,
    '.' + window.location.hostname,
    'localhost',
    '.localhost',
    '.supabase.co',
    ''
  ];
  
  const paths = ['/', '/blipee-os', ''];
  
  domains.forEach(domain => {
    paths.forEach(path => {
      // Try multiple clearing methods
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
      document.cookie = `${name}=; Max-Age=-99999999; path=${path}; domain=${domain}`;
      document.cookie = `${name}=; Max-Age=-99999999; path=${path}`;
    });
  });
}