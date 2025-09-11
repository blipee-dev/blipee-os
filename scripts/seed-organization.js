#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Need service role key for admin access
);

async function seedOrganization() {
  try {
    // Get user
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', 'pedro@blipee.com')
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      return;
    }

    const userId = users.id;
    console.log('Found user:', userId);

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Blipee Demo Organization',
        slug: 'blipee-demo',
        legal_name: 'Blipee Technologies Inc.',
        industry_primary: 'Technology',
        company_size: '10-50',
        website: 'https://blipee.com',
        primary_contact_email: 'pedro@blipee.com',
        subscription_tier: 'premium',
        subscription_status: 'active',
        created_by: userId
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return;
    }

    console.log('Created organization:', org.id);

    // Add user as account owner
    const { error: linkError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: userId,
        organization_id: org.id,
        role: 'account_owner'
      });

    if (linkError) {
      console.error('Error linking user to organization:', linkError);
      return;
    }

    console.log('✅ Successfully seeded organization for pedro@blipee.com');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

seedOrganization();