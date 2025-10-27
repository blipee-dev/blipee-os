#!/usr/bin/env node
/**
 * Debug session to see which user is authenticated
 */

const BASE_URL = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

async function debugSession(sessionCookie) {
  console.log(`${colors.cyan}🔍 Debugging Session Authentication${colors.reset}\n`);

  if (!sessionCookie) {
    console.log(`${colors.yellow}Usage: node debug-session.mjs "SESSION_COOKIE"${colors.reset}`);
    return;
  }

  try {
    // Try to access a protected page to see user info
    console.log(`${colors.blue}Fetching /sustainability page...${colors.reset}`);

    const response = await fetch(`${BASE_URL}/sustainability`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      },
      redirect: 'manual'
    });

    console.log(`${colors.cyan}Status: ${response.status} ${response.statusText}${colors.reset}`);

    if (response.status === 302 || response.status === 307) {
      const location = response.headers.get('location');
      console.log(`${colors.yellow}Redirected to: ${location}${colors.reset}`);

      if (location?.includes('/signin')) {
        console.log(`${colors.red}❌ Session is not authenticated or expired${colors.reset}`);
        console.log('\nPlease:');
        console.log('1. Open http://localhost:3000/signin in browser');
        console.log('2. Sign in to your account');
        console.log('3. Copy fresh cookies from DevTools');
        return;
      }
    }

    if (response.status === 200) {
      console.log(`${colors.green}✅ Session is valid!${colors.reset}\n`);

      const html = await response.text();

      // Try to extract user info from the page
      const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const userIdMatch = html.match(/"userId":"([^"]+)"/);
      const orgIdMatch = html.match(/"organizationId":"([^"]+)"/);

      if (emailMatch) {
        console.log(`${colors.green}Email: ${emailMatch[0]}${colors.reset}`);
      }
      if (userIdMatch) {
        console.log(`${colors.green}User ID: ${userIdMatch[1]}${colors.reset}`);
      }
      if (orgIdMatch) {
        console.log(`${colors.green}Organization ID: ${orgIdMatch[1]}${colors.reset}`);
      }

      // If we found user ID, let's check their organizations
      if (userIdMatch) {
        console.log(`\n${colors.cyan}Checking user organizations...${colors.reset}`);
        await checkUserOrgs(userIdMatch[1]);
      }
    }

  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error.message);
  }
}

async function checkUserOrgs(userId) {
  const { createClient } = await import('@supabase/supabase-js');
  const { config } = await import('dotenv');

  config({ path: '.env.local' });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log(`${colors.yellow}Cannot check DB without env vars${colors.reset}`);
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: memberships, error } = await supabase
      .from('organization_members')
      .select('organization_id, role, organizations(id, name)')
      .eq('user_id', userId);

    if (error) {
      console.error(`${colors.red}Error fetching memberships:${colors.reset}`, error);
      return;
    }

    if (!memberships || memberships.length === 0) {
      console.log(`${colors.yellow}⚠️  User has no organization memberships${colors.reset}`);
      console.log('\nThis user needs to be added to an organization.');
      return;
    }

    console.log(`${colors.green}✅ User has ${memberships.length} organization(s):${colors.reset}\n`);

    memberships.forEach((m, i) => {
      console.log(`${colors.cyan}${i + 1}. ${m.organizations.name}${colors.reset}`);
      console.log(`   ID: ${m.organization_id}`);
      console.log(`   Role: ${m.role}`);
      console.log();
    });

    console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.cyan}🧪 Test chat API with:${colors.reset}\n`);
    const firstOrg = memberships[0];
    console.log(`node test-chat-full.mjs "YOUR_COOKIES" "${firstOrg.organization_id}"`);
    console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error);
  }
}

const sessionCookie = process.argv[2];
debugSession(sessionCookie);
