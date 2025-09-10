/**
 * Clears malformed Supabase auth cookies that may cause parsing errors
 */
export function clearMalformedSupabaseCookies() {
  if (typeof window === 'undefined') return;
  
  const cookies = document.cookie.split(';');
  let clearedCount = 0;
  
  cookies.forEach(cookie => {
    const [name, ...valueParts] = cookie.trim().split('=');
    const value = valueParts.join('=');
    
    // Check for Supabase-related cookies
    if (name && (name.includes('sb-') || name.includes('supabase'))) {
      // Check if the value looks malformed (starts with base64- but isn't proper JSON)
      if (value && value.startsWith('base64-')) {
        // Clear the cookie
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
        console.log(`Cleared malformed cookie: ${name}`);
        clearedCount++;
      }
    }
  });
  
  if (clearedCount > 0) {
    console.log(`Cleared ${clearedCount} malformed Supabase cookies`);
  }
}