const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const plmjOrgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  console.log('=== TESTING SITES API QUERY ===\n');

  // Simulate what the updated service does
  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("organization_id", plmjOrgId)
    .order("name");

  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }

  console.log('✅ Sites fetched:', data.length, '\n');

  // Map to Building interface like the service does
  const buildings = data.map(site => ({
    id: site.id,
    organization_id: site.organization_id,
    name: site.name,
    address: typeof site.address === 'object' ?
      `${site.address.street || ''}, ${site.address.city || ''}`.trim() :
      site.location || '',
    city: typeof site.address === 'object' ? site.address.city : site.location,
    country: typeof site.address === 'object' ? site.address.country : undefined,
    postal_code: typeof site.address === 'object' ? site.address.postal_code : undefined,
    size_sqft: site.total_area_sqm ? Math.round(site.total_area_sqm * 10.764) : undefined,
    created_at: site.created_at,
    updated_at: site.updated_at
  }));

  console.log('📍 Mapped Buildings (for BuildingSelector):');
  buildings.forEach(b => {
    console.log('\n  Name:', b.name);
    console.log('  ID:', b.id);
    console.log('  City:', b.city);
    console.log('  Address:', b.address);
    console.log('  Size:', b.size_sqft, 'sqft');
  });

  console.log('\n✅ BuildingSelector will now show', buildings.length, 'sites for PLMJ!');
})();
