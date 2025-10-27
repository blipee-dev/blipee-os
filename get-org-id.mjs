#!/usr/bin/env node
/**
 * Helper script to extract organization ID from a page request
 */

const BASE_URL = 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

async function getOrgId(sessionCookie) {
  if (!sessionCookie) {
    console.log(`${colors.yellow}Usage: node get-org-id.mjs "SESSION_COOKIE"${colors.reset}`);
    return;
  }

  try {
    // Try to access the chat page which should have org info
    console.log(`${colors.blue}Fetching /chat page...${colors.reset}`);

    const response = await fetch(`${BASE_URL}/chat`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });

    const html = await response.text();

    // Try to extract org ID from the page HTML
    // Look for patterns like organizationId, org-id, etc.
    const orgIdMatches = [
      html.match(/"organizationId":"([^"]+)"/),
      html.match(/'organizationId':'([^']+)'/),
      html.match(/organization_id["\s:]+["']([^"']+)/),
      html.match(/data-org-id="([^"]+)"/),
    ];

    let foundOrgId = null;
    for (const match of orgIdMatches) {
      if (match && match[1]) {
        foundOrgId = match[1];
        break;
      }
    }

    if (foundOrgId) {
      console.log(`${colors.green}✅ Found Organization ID: ${foundOrgId}${colors.reset}\n`);
      console.log(`${colors.cyan}Now test the chat API with:${colors.reset}`);
      console.log(`node test-chat-full.mjs "${sessionCookie}" "${foundOrgId}"\n`);
    } else {
      console.log(`${colors.yellow}⚠️  Could not automatically extract organization ID${colors.reset}\n`);
      console.log('Manual steps:');
      console.log('1. Open http://localhost:3000/sustainability in browser');
      console.log('2. Open DevTools (F12) → Application → Local Storage');
      console.log('3. Look for "currentOrganization" or check the page source');
      console.log('4. Or use the Network tab to see API requests with org IDs');
    }

  } catch (error) {
    console.error(`${colors.yellow}Error:${colors.reset}`, error.message);
  }
}

const sessionCookie = process.argv[2];
getOrgId(sessionCookie);
