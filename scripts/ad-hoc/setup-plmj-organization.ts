import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPLMJOrganization() {
  console.log('🏢 Setting up PLMJ Organization\n');

  // Check if PLMJ organization exists
  const { data: existingOrg } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .or('slug.eq.plmj,name.ilike.%PLMJ%')
    .single();

  let orgId: string;

  if (existingOrg) {
    console.log('✅ Organization found:', existingOrg.name);
    orgId = existingOrg.id;
  } else {
    // Create PLMJ organization
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'PLMJ',
        slug: 'plmj',
        industry_primary: 'Legal Services',
        country: 'Portugal'
      })
      .select()
      .single();

    if (orgError) {
      console.log('❌ Error creating organization:', orgError);
      return;
    }

    console.log('✅ Created PLMJ organization');
    orgId = newOrg.id;
  }

  // Create sites for PLMJ
  const { data: existingSites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', orgId);

  if (!existingSites || existingSites.length === 0) {
    console.log('\n📍 Creating PLMJ sites...');

    const sites = [
      { name: 'PLMJ Lisboa', city: 'Lisboa', country: 'Portugal', organization_id: orgId },
      { name: 'PLMJ Porto', city: 'Porto', country: 'Portugal', organization_id: orgId },
      { name: 'PLMJ Faro', city: 'Faro', country: 'Portugal', organization_id: orgId }
    ];

    const { error: sitesError } = await supabase
      .from('sites')
      .insert(sites);

    if (sitesError) {
      console.log('❌ Error creating sites:', sitesError);
    } else {
      console.log('✅ Created 3 PLMJ sites');
    }
  } else {
    console.log('✅ Sites already exist:', existingSites.length);
  }

  // Assign José Pinto to PLMJ
  const { data: userData } = await supabase.auth.admin.listUsers();
  const user = userData?.users.find(u => u.email === 'jose.pinto@plmj.pt');

  if (user) {
    console.log('\n👤 Assigning José Pinto to PLMJ...');

    // Check if user exists in app_users
    const { data: existingAppUser } = await supabase
      .from('app_users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingAppUser) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          organization_id: orgId,
          role: 'sustainability_manager',
          name: 'José Pinto',
          email: user.email
        })
        .eq('id', user.id);

      if (updateError) {
        console.log('❌ Error updating user:', updateError);
      } else {
        console.log('✅ Updated José Pinto with PLMJ organization');
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('app_users')
        .insert({
          id: user.id,
          organization_id: orgId,
          role: 'sustainability_manager',
          name: 'José Pinto',
          email: user.email
        });

      if (insertError) {
        console.log('❌ Error creating app_user:', insertError);
      } else {
        console.log('✅ Created José Pinto in app_users');
      }
    }
  }

  // Create sample metrics data for PLMJ
  const { data: existingMetrics } = await supabase
    .from('metrics_data')
    .select('id')
    .eq('organization_id', orgId)
    .limit(1);

  if (!existingMetrics || existingMetrics.length === 0) {
    console.log('\n📊 Creating sample metrics data...');

    // Get metric catalog items
    const { data: metricsC } = await supabase
      .from('metrics_catalog')
      .select('id, category')
      .limit(10);

    if (metricsC && metricsC.length > 0) {
      const { data: sites } = await supabase
        .from('sites')
        .select('id')
        .eq('organization_id', orgId)
        .limit(1);

      if (sites && sites.length > 0) {
        const sampleMetrics = metricsC.map(mc => ({
          organization_id: orgId,
          site_id: sites[0].id,
          metric_id: mc.id,
          value: Math.random() * 100,
          unit: 'kWh',
          period_start: new Date().toISOString(),
          period_end: new Date().toISOString()
        }));

        const { error: metricsError } = await supabase
          .from('metrics_data')
          .insert(sampleMetrics);

        if (metricsError) {
          console.log('❌ Error creating metrics:', metricsError);
        } else {
          console.log('✅ Created sample metrics data');
        }
      }
    }
  }

  // Final verification
  console.log('\n📈 Final Stats for PLMJ:');

  const { data: finalSites } = await supabase
    .from('sites')
    .select('name')
    .eq('organization_id', orgId);

  const { data: finalTeam } = await supabase
    .from('app_users')
    .select('name')
    .eq('organization_id', orgId);

  const { count: metricsCount } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  console.log('  - Sites:', finalSites?.length || 0);
  if (finalSites) {
    finalSites.forEach(site => console.log('    •', site.name));
  }
  console.log('  - Team Members:', finalTeam?.length || 0);
  if (finalTeam) {
    finalTeam.forEach(member => console.log('    •', member.name));
  }
  console.log('  - Metrics Data Points:', metricsCount || 0);

  console.log('\n✅ Setup complete! Please refresh the Zero-Typing page.');
}

setupPLMJOrganization().catch(console.error);