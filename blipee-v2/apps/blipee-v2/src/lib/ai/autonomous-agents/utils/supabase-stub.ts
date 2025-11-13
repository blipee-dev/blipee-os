/**
 * Supabase Client for Autonomous Agents
 *
 * Real Supabase admin client for autonomous agents to query production data.
 * Uses admin client to bypass RLS since agents need organization-wide access.
 */

import { createAdminClient } from '@/lib/supabase/server';

export function createClient() {
  // Return the REAL Supabase admin client
  // Agents need admin access to query across organizations
  return createAdminClient();
}