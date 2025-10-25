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

async function calculateRealIntensity() {
  const { data: plmj } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'PLMJ')
    .single();

  // Get sites with their areas
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, total_area_sqm')
    .eq('organization_id', plmj!.id);

  // Get emissions data for 2025
  const { data: emissions } = await supabase
    .from('metrics_data')
    .select('site_id, co2e_emissions')
    .eq('organization_id', plmj!.id)
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31');

  console.log('Real Site Emissions Intensity for 2025:\n');

  const results = [];

  // Calculate intensity for each site
  for (const site of sites || []) {
    const siteEmissions = emissions?.filter(e => e.site_id === site.id) || [];
    const totalEmissionsKg = siteEmissions.reduce((sum, e) => sum + (e.co2e_emissions || 0), 0);
    const intensity = site.total_area_sqm ? totalEmissionsKg / site.total_area_sqm : 0;

    const data = {
      site: site.name,
      intensity: Math.round(intensity * 10) / 10, // kgCO2e/m²
      total: Math.round(totalEmissionsKg / 1000 * 10) / 10, // tons
      area: site.total_area_sqm
    };

    results.push(data);
    console.log(`${data.site}: ${data.intensity} kgCO2e/m² (Total: ${data.total} tCO2e, Area: ${data.area} m²)`);
  }

  console.log('\nFor the chart data:');
  console.log(JSON.stringify(results, null, 2));
}

calculateRealIntensity().catch(console.error);