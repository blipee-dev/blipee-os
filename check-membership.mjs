#!/usr/bin/env node
/**
 * Check user organization membership
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const userId = 'e1c83a34-424d-4114-94c5-1a11942dcdea';
const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Checking membership for:');
console.log('  User ID:', userId);
console.log('  Org ID:', orgId);
console.log();

// Check organization_members table
console.log('📋 Checking organization_members table...');
const { data: members, error: membersError } = await supabase
  .from('organization_members')
  .select('*')
  .eq('user_id', userId)
  .eq('organization_id', orgId);

console.log('Result:', { members, membersError });
console.log();

// Check all memberships for this user
console.log('📋 All memberships for this user...');
const { data: allMemberships, error: allError } = await supabase
  .from('organization_members')
  .select('*')
  .eq('user_id', userId);

console.log('Result:', { allMemberships, allError });
console.log();

// Check if the table has any data at all
console.log('📋 Sample organization_members data...');
const { data: sample } = await supabase
  .from('organization_members')
  .select('*')
  .limit(5);

console.log('Sample rows:', sample);
