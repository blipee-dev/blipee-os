/**
 * Clear all authentication cookies and storage
 */
export function clearAllAuth() {
  if (typeof window === 'undefined') return;
  
  // Clear all cookies
  document.cookie.split(";").forEach((c) => {
    const cookie = c.trim();
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    
    // Clear cookie for all paths and domains
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
  });
  
  // Clear localStorage
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error('Error clearing localStorage:', e);
  }
  
  // Clear sessionStorage
  try {
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.error('Error clearing sessionStorage:', e);
  }
  
  console.log('✅ All authentication data cleared');
}

// Auto-run if called directly
if (typeof window !== 'undefined') {
  (window as any).clearAllAuth = clearAllAuth;
}