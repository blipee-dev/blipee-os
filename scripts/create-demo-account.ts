#!/usr/bin/env node
import 'dotenv/config';

console.log(`
==================================================
Blipee OS - Demo Account Information
==================================================

Since direct user creation requires admin access,
please use one of these methods to access the app:

1. SIGN UP (Recommended)
   - Go to: http://localhost:3000/signup
   - Email: demo@blipee.com
   - Password: demo123456
   - Name: Demo User

2. QUICK TEST ACCOUNT
   - Go to: http://localhost:3000/signup
   - Use any email (e.g., test@example.com)
   - Use any password (min 6 characters)

3. DIRECT ACCESS (Development)
   - The main chat interface at http://localhost:3000
   - Works without authentication in demo mode

==================================================
AUTHENTICATED PAGES:
==================================================

Once signed in, you can access:

✅ /dashboard - AI-powered sustainability dashboard
✅ /onboarding - Organization setup wizard
✅ / (main) - Conversational AI with file upload
✅ All API endpoints with authentication

==================================================
TESTING FILE UPLOAD:
==================================================

1. Sign in with your account
2. Go to the main page (/)
3. Click the 📎 paperclip icon
4. Upload any PDF sustainability report
5. Watch the AI extract all ESG data!

==================================================
`);

// Create a simple test by checking if the app is running
fetch('http://localhost:3000/api/health')
  .then(res => {
    if (res.ok) {
      console.log('✅ App is running at http://localhost:3000');
      console.log('🚀 Go to http://localhost:3000/signup to create your account!\n');
    } else {
      console.log('⚠️  App might not be running. Start it with: npm run dev\n');
    }
  })
  .catch(() => {
    console.log('❌ App is not running. Start it with: npm run dev\n');
  });