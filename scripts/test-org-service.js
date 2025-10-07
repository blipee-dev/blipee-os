// Simulate what the organization service does
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  const plmjOrgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  console.log('=== SIMULATING organizationService.getOrganizationBuildings() ===\n');

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("organization_id", plmjOrgId)
    .order("name");

  if (error) {
    console.log('❌ Error:', error);
    return;
  }

  console.log('✅ Raw data from sites table:', data.length, 'records\n');

  // Map sites to Building interface
  const buildings = (data || []).map(site => ({
    id: site.id,
    organization_id: site.organization_id,
    name: site.name,
    address: typeof site.address === 'object' ?
      `${site.address.street || ''}, ${site.address.city || ''}`.trim() :
      site.location || '',
    city: typeof site.address === 'object' ? site.address.city : site.location,
    country: typeof site.address === 'object' ? site.address.country : undefined,
    postal_code: typeof site.address === 'object' ? site.address.postal_code : undefined,
    size_sqm: site.total_area_sqm,
    created_at: site.created_at,
    updated_at: site.updated_at
  }));

  console.log('Mapped buildings:', buildings.length);
  console.log(JSON.stringify({ success: true, data: buildings }, null, 2));
})();
