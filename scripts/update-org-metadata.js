const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  const plmjOrgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Get total site area
  const { data: sites } = await supabaseAdmin
    .from('sites')
    .select('total_area_sqm')
    .eq('organization_id', plmjOrgId);

  const totalAreaSqm = sites.reduce((sum, s) => sum + (s.total_area_sqm || 0), 0);

  console.log('Total area from sites:', totalAreaSqm, 'sqm');

  // Get current metadata
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('metadata')
    .eq('id', plmjOrgId)
    .single();

  // Update organization metadata
  const updatedMetadata = {
    ...(org.metadata || {}),
    employee_count: 500,  // Estimate for a law firm like PLMJ
    floor_area_sqm: totalAreaSqm,
    annual_revenue: 50000000  // $50M estimate
  };

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .update({
      metadata: updatedMetadata
    })
    .eq('id', plmjOrgId)
    .select()
    .single();

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('✅ Updated organization metadata with:');
    console.log('  Employee count:', data.metadata.employee_count);
    console.log('  Floor area:', data.metadata.floor_area_sqm, 'sqm');
    console.log('  Annual revenue: $', data.metadata.annual_revenue.toLocaleString());
  }
})();
