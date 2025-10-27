#!/usr/bin/env node
/**
 * Get user organizations from Supabase
 * This script fetches organizations that the authenticated user has access to
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

async function getUserOrganizations() {
  console.log(`${colors.cyan}🔍 Fetching user organizations...${colors.reset}\n`);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(`${colors.red}❌ Missing environment variables${colors.reset}`);
    console.log('Make sure you have .env.local with:');
    console.log('  - NEXT_PUBLIC_SUPABASE_URL');
    console.log('  - SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get all organizations
    console.log(`${colors.blue}📋 Fetching all organizations...${colors.reset}`);
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (orgsError) {
      console.error(`${colors.red}Error fetching organizations:${colors.reset}`, orgsError);
      return;
    }

    if (!orgs || orgs.length === 0) {
      console.log(`${colors.yellow}⚠️  No organizations found in database${colors.reset}`);
      console.log('\nYou may need to create an organization first.');
      return;
    }

    console.log(`${colors.green}✅ Found ${orgs.length} organization(s)${colors.reset}\n`);

    // Display organizations
    orgs.forEach((org, index) => {
      console.log(`${colors.cyan}Organization ${index + 1}:${colors.reset}`);
      console.log(`  ID: ${colors.green}${org.id}${colors.reset}`);
      console.log(`  Name: ${org.name || 'Unnamed'}`);
      console.log(`  Created: ${new Date(org.created_at).toLocaleDateString()}`);
      console.log();
    });

    // Get organization members to find which users have access
    console.log(`${colors.blue}👥 Checking organization memberships...${colors.reset}\n`);

    for (const org of orgs) {
      const { data: members, error: membersError } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', org.id);

      if (!membersError && members) {
        console.log(`${colors.cyan}${org.name}:${colors.reset}`);
        console.log(`  Members: ${members.length}`);
        console.log(`  Roles: ${members.map(m => m.role).join(', ')}`);
        console.log();
      }
    }

    // Test command
    console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.cyan}🧪 To test the chat API, use:${colors.reset}\n`);

    if (orgs.length > 0) {
      const firstOrg = orgs[0];
      console.log(`node test-chat-full.mjs "YOUR_COOKIES" "${firstOrg.id}"`);
      console.log();
      console.log('Replace YOUR_COOKIES with:');
      console.log('_csrf=...; blipee-session=...');
    }
    console.log(`${colors.green}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}❌ Error:${colors.reset}`, error.message);
  }
}

getUserOrganizations();
