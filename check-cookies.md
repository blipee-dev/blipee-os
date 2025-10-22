# How to Check for Supabase Auth Cookies

## In Chrome DevTools:

1. Press `F12` to open DevTools
2. Go to **Application** tab (top menu)
3. In the left sidebar, expand **Cookies**
4. Click on `http://localhost:3001`
5. Look for cookies that start with **`sb-`**

You should see cookies like:
- `sb-quovvwrwyfkzhgqdeham-auth-token` (your access token with JWT)
- `sb-quovvwrwyfkzhgqdeham-auth-token-code-verifier`
- Other `sb-*` cookies

## If You Only See `blipee-session`:

That's the old cookie. Try this:

### Option 1: Clear All Cookies
1. In DevTools > Application > Cookies
2. Right-click on `http://localhost:3001`
3. Click "Clear"
4. Refresh the page
5. Sign in again

### Option 2: Check Network Tab
1. Go to **Network** tab in DevTools
2. Filter by "signin"
3. Look at the `/api/auth/signin` request
4. Check the **Response Headers**
5. Look for `Set-Cookie` headers with `sb-*` cookies

### Option 3: Check the Actual Response
Run this in browser console while on /sustainability page:
```javascript
// Check all cookies
console.log('All cookies:', document.cookie);

// Check Supabase session
const getSupabaseCookies = () => {
  const cookies = document.cookie.split('; ');
  return cookies.filter(c => c.startsWith('sb-'));
};
console.log('Supabase cookies:', getSupabaseCookies());
```

## What Should You See?

If auth is working correctly, you should have:
- ✅ Multiple `sb-*` cookies from Supabase
- ⚠️ Maybe `blipee-session` (old, can be ignored)

If you ONLY see `blipee-session` and NO `sb-*` cookies, then there's an issue with cookie setting.
