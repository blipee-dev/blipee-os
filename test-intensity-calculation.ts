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

async function testIntensityCalculation() {
  console.log('🧪 Testing Intensity Calculation...\n');

  // 1. Get PLMJ organization
  const { data: plmj } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'PLMJ')
    .single();

  console.log('Organization:', plmj?.id);

  // 2. Get ALL sites (not filtering by organization to see all)
  const { data: allSites } = await supabase
    .from('sites')
    .select('id, name, total_area_sqm, organization_id')
    .order('name');

  console.log('\n📍 All Sites in Database:');
  allSites?.forEach(s => console.log(`  - ${s.name}: ${s.total_area_sqm} m² (Org: ${s.organization_id === plmj?.id ? 'PLMJ' : 'Other'})`));

  // Filter PLMJ sites for calculations
  const sites = allSites?.filter(s => s.organization_id === plmj!.id);

  // 3. Get emissions data for all years (for ALL sites, not just PLMJ)
  const { data: emissions2025 } = await supabase
    .from('metrics_data')
    .select('site_id, co2e_emissions, period_start, period_end, organization_id')
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31')
    .not('site_id', 'is', null);

  const { data: emissions2024 } = await supabase
    .from('metrics_data')
    .select('site_id, co2e_emissions, period_start, period_end, organization_id')
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31')
    .not('site_id', 'is', null);

  const { data: emissions2023 } = await supabase
    .from('metrics_data')
    .select('site_id, co2e_emissions, period_start, period_end, organization_id')
    .gte('period_start', '2023-01-01')
    .lte('period_end', '2023-12-31')
    .not('site_id', 'is', null);

  const { data: emissions2022 } = await supabase
    .from('metrics_data')
    .select('site_id, co2e_emissions, period_start, period_end, organization_id')
    .gte('period_start', '2022-01-01')
    .lte('period_end', '2022-12-31')
    .not('site_id', 'is', null);

  console.log('\n📊 Emissions data points:');
  console.log('  2025:', emissions2025?.length || 0);
  console.log('  2024:', emissions2024?.length || 0);
  console.log('  2023:', emissions2023?.length || 0);
  console.log('  2022:', emissions2022?.length || 0);

  // 4. Calculate intensity for each site
  console.log('\n🔢 Calculated Intensities for 2025:');

  for (const site of sites || []) {
    const siteEmissions = emissions2025?.filter(e => e.site_id === site.id) || [];
    const totalEmissionsKg = siteEmissions.reduce((sum, e) => sum + (e.co2e_emissions || 0), 0);
    const intensity = site.total_area_sqm ? totalEmissionsKg / site.total_area_sqm : 0;

    // Determine performance
    let performance: string;
    if (intensity <= 20) {
      performance = 'excellent';
    } else if (intensity <= 40) {
      performance = 'good';
    } else if (intensity <= 60) {
      performance = 'warning';
    } else {
      performance = 'poor';
    }

    console.log(`\n  ${site.name}:`);
    console.log(`    - Total emissions: ${Math.round(totalEmissionsKg / 1000 * 10) / 10} tCO2e`);
    console.log(`    - Area: ${site.total_area_sqm} m²`);
    console.log(`    - Intensity: ${Math.round(intensity * 10) / 10} kgCO2e/m²`);
    console.log(`    - Performance: ${performance}`);
    console.log(`    - Data points: ${siteEmissions.length}`);
  }

  console.log('\n🔢 Calculated Intensities for 2024:');

  for (const site of sites || []) {
    const siteEmissions = emissions2024?.filter(e => e.site_id === site.id) || [];
    const totalEmissionsKg = siteEmissions.reduce((sum, e) => sum + (e.co2e_emissions || 0), 0);
    const intensity = site.total_area_sqm ? totalEmissionsKg / site.total_area_sqm : 0;

    // Determine performance
    let performance: string;
    if (intensity <= 20) {
      performance = 'excellent';
    } else if (intensity <= 40) {
      performance = 'good';
    } else if (intensity <= 60) {
      performance = 'warning';
    } else {
      performance = 'poor';
    }

    console.log(`\n  ${site.name}:`);
    console.log(`    - Total emissions: ${Math.round(totalEmissionsKg / 1000 * 10) / 10} tCO2e`);
    console.log(`    - Area: ${site.total_area_sqm} m²`);
    console.log(`    - Intensity: ${Math.round(intensity * 10) / 10} kgCO2e/m²`);
    console.log(`    - Performance: ${performance}`);
    console.log(`    - Data points: ${siteEmissions.length}`);
  }

  console.log('\n🔢 Calculated Intensities for 2023:');

  for (const site of sites || []) {
    const siteEmissions = emissions2023?.filter(e => e.site_id === site.id) || [];
    const totalEmissionsKg = siteEmissions.reduce((sum, e) => sum + (e.co2e_emissions || 0), 0);
    const intensity = site.total_area_sqm ? totalEmissionsKg / site.total_area_sqm : 0;

    // Determine performance
    let performance: string;
    if (intensity <= 20) {
      performance = 'excellent';
    } else if (intensity <= 40) {
      performance = 'good';
    } else if (intensity <= 60) {
      performance = 'warning';
    } else {
      performance = 'poor';
    }

    console.log(`\n  ${site.name}:`);
    console.log(`    - Total emissions: ${Math.round(totalEmissionsKg / 1000 * 10) / 10} tCO2e`);
    console.log(`    - Area: ${site.total_area_sqm} m²`);
    console.log(`    - Intensity: ${Math.round(intensity * 10) / 10} kgCO2e/m²`);
    console.log(`    - Performance: ${performance}`);
    console.log(`    - Data points: ${siteEmissions.length}`);
  }

  console.log('\n🔢 Calculated Intensities for 2022:');

  for (const site of sites || []) {
    const siteEmissions = emissions2022?.filter(e => e.site_id === site.id) || [];
    const totalEmissionsKg = siteEmissions.reduce((sum, e) => sum + (e.co2e_emissions || 0), 0);
    const intensity = site.total_area_sqm ? totalEmissionsKg / site.total_area_sqm : 0;

    // Determine performance
    let performance: string;
    if (intensity <= 20) {
      performance = 'excellent';
    } else if (intensity <= 40) {
      performance = 'good';
    } else if (intensity <= 60) {
      performance = 'warning';
    } else {
      performance = 'poor';
    }

    console.log(`\n  ${site.name}:`);
    console.log(`    - Total emissions: ${Math.round(totalEmissionsKg / 1000 * 10) / 10} tCO2e`);
    console.log(`    - Area: ${site.total_area_sqm} m²`);
    console.log(`    - Intensity: ${Math.round(intensity * 10) / 10} kgCO2e/m²`);
    console.log(`    - Performance: ${performance}`);
    console.log(`    - Data points: ${siteEmissions.length}`);
  }

  // 5. Calculate intensity for ALL sites (not just PLMJ)
  console.log('\n\n===============================================');
  console.log('📊 INTENSITY FOR ALL SITES IN DATABASE');
  console.log('===============================================\n');

  // Check which sites have emissions data
  const sitesWithData = new Set([
    ...(emissions2025?.map(e => e.site_id) || []),
    ...(emissions2024?.map(e => e.site_id) || []),
    ...(emissions2023?.map(e => e.site_id) || []),
    ...(emissions2022?.map(e => e.site_id) || [])
  ]);

  console.log(`Found ${sitesWithData.size} sites with emissions data\n`);

  for (const site of allSites || []) {
    if (!sitesWithData.has(site.id)) continue;

    console.log(`\n📍 ${site.name} (${site.organization_id === plmj?.id ? 'PLMJ' : 'Other Org'})`);
    console.log(`   Area: ${site.total_area_sqm || 'Unknown'} m²`);

    const years = [
      { year: '2025', data: emissions2025 },
      { year: '2024', data: emissions2024 },
      { year: '2023', data: emissions2023 },
      { year: '2022', data: emissions2022 }
    ];

    for (const { year, data } of years) {
      const siteEmissions = data?.filter(e => e.site_id === site.id) || [];
      if (siteEmissions.length === 0) continue;

      const totalEmissionsKg = siteEmissions.reduce((sum, e) => sum + (e.co2e_emissions || 0), 0);
      const intensity = site.total_area_sqm ? totalEmissionsKg / site.total_area_sqm : 0;

      let performance: string;
      if (intensity <= 20) {
        performance = 'excellent ✅';
      } else if (intensity <= 40) {
        performance = 'good ✓';
      } else if (intensity <= 60) {
        performance = 'warning ⚠️';
      } else {
        performance = 'poor ❌';
      }

      console.log(`   ${year}: ${Math.round(intensity * 10) / 10} kgCO2e/m² (${Math.round(totalEmissionsKg / 1000 * 10) / 10} tCO2e) - ${performance}`);
    }
  }

  // 6. Test API call
  console.log('\n\n🌐 Testing API endpoint...');
  const apiUrl = `http://localhost:3000/api/sustainability/dashboard?range=2025&site=all`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ API Response - Site Comparison:');
      data.siteComparison?.forEach((site: any) => {
        console.log(`  ${site.site}: ${site.intensity} kgCO2e/m² (${site.performance})`);
      });
    } else {
      console.log('❌ API call failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Could not test API (server may not be running)');
  }

  process.exit(0);
}

testIntensityCalculation().catch(console.error);