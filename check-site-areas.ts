import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSiteAreas() {
  console.log('🔍 Checking Site Areas in Database\n');
  console.log('=====================================\n');

  // Get PLMJ organization
  const { data: plmj } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', 'PLMJ')
    .single();

  console.log('Organization:', plmj?.name, `(${plmj?.id})\n`);

  // Get sites with ALL columns to see what's available
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('organization_id', plmj!.id)
    .order('name');

  console.log('📍 Sites Found:', sites?.length || 0, '\n');

  if (sites && sites.length > 0) {
    // Show all columns for first site to see structure
    console.log('📊 First Site Full Data:');
    console.log(JSON.stringify(sites[0], null, 2));
    console.log('\n');

    // Show area-related fields for all sites
    console.log('📐 Area Information for All Sites:\n');
    sites.forEach(site => {
      console.log(`${site.name}:`);
      console.log(`  - id: ${site.id}`);
      console.log(`  - total_area_sqm: ${site.total_area_sqm || 'NULL'}`);
      console.log(`  - total_employees: ${site.total_employees || 'NULL'}`);
      console.log(`  - type: ${site.type || 'NULL'}`);
      console.log(`  - status: ${site.status || 'NULL'}`);

      // Check for any other area-related fields
      const areaFields = Object.keys(site).filter(key =>
        key.toLowerCase().includes('area') ||
        key.toLowerCase().includes('size') ||
        key.toLowerCase().includes('sqm') ||
        key.toLowerCase().includes('square')
      );

      if (areaFields.length > 1) {
        console.log('  Other area fields:', areaFields);
      }
      console.log('');
    });

    // Calculate total area
    const totalArea = sites.reduce((sum, site) => sum + (site.total_area_sqm || 0), 0);
    console.log('📊 Summary:');
    console.log(`  Total area across all sites: ${totalArea.toLocaleString()} m²`);
    console.log(`  Sites with area data: ${sites.filter(s => s.total_area_sqm > 0).length}/${sites.length}`);
    console.log(`  Sites missing area: ${sites.filter(s => !s.total_area_sqm || s.total_area_sqm === 0).map(s => s.name).join(', ') || 'None'}`);
  }

  process.exit(0);
}

checkSiteAreas().catch(console.error);