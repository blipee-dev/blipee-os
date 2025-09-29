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

async function calculateTotalEmissions() {
  console.log('📊 TOTAL EMISSIONS FOR ALL 3 SITES BY YEAR\n');
  console.log('===========================================\n');

  // Get PLMJ organization
  const { data: plmj } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'PLMJ')
    .single();

  // Get sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, total_area_sqm')
    .eq('organization_id', plmj!.id)
    .order('name');

  const totalArea = sites?.reduce((sum, s) => sum + (s.total_area_sqm || 0), 0) || 0;
  console.log('Sites:', sites?.map(s => s.name).join(', '));
  console.log('Total area:', totalArea.toLocaleString(), 'm²\n');

  const years = ['2022', '2023', '2024', '2025'];
  const yearlyTotals: any[] = [];

  for (const year of years) {
    const { data: emissions } = await supabase
      .from('metrics_data')
      .select('site_id, co2e_emissions')
      .eq('organization_id', plmj!.id)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`)
      .not('site_id', 'is', null);

    // Calculate per site
    const siteEmissions: any = {};
    let yearTotal = 0;

    for (const site of sites || []) {
      const siteData = emissions?.filter(e => e.site_id === site.id) || [];
      const siteTotalKg = siteData.reduce((sum, e) => sum + (e.co2e_emissions || 0), 0);
      siteEmissions[site.name] = siteTotalKg / 1000; // Convert to tons
      yearTotal += siteTotalKg;
    }

    const yearTotalTons = yearTotal / 1000;
    const yearIntensity = totalArea > 0 ? yearTotal / totalArea : 0;

    // Determine performance
    let performance: string;
    if (yearIntensity <= 20) {
      performance = 'excellent';
    } else if (yearIntensity <= 40) {
      performance = 'good';
    } else if (yearIntensity <= 60) {
      performance = 'warning';
    } else {
      performance = 'poor';
    }

    yearlyTotals.push({
      year,
      total: yearTotalTons,
      intensity: yearIntensity,
      performance,
      breakdown: siteEmissions
    });

    console.log(`📅 ${year}:`);
    console.log(`   Total: ${Math.round(yearTotalTons * 10) / 10} tCO2e`);
    console.log(`   Intensity: ${Math.round(yearIntensity * 10) / 10} kgCO2e/m²`);
    console.log(`   Performance: ${performance}`);
    console.log(`   Breakdown:`);
    console.log(`     - Lisboa: ${Math.round(siteEmissions['Lisboa - FPM41'] * 10) / 10} tCO2e`);
    console.log(`     - Porto: ${Math.round(siteEmissions['Porto - POP'] * 10) / 10} tCO2e`);
    console.log(`     - Faro: ${Math.round(siteEmissions['Faro'] * 10) / 10} tCO2e`);
    console.log();
  }

  // Calculate year-over-year changes
  console.log('📈 Year-over-Year Changes:\n');
  for (let i = 1; i < yearlyTotals.length; i++) {
    const current = yearlyTotals[i];
    const previous = yearlyTotals[i - 1];
    const change = ((current.total - previous.total) / previous.total) * 100;
    const intensityChange = ((current.intensity - previous.intensity) / previous.intensity) * 100;

    console.log(`${previous.year} → ${current.year}:`);
    console.log(`   Emissions: ${change > 0 ? '+' : ''}${Math.round(change * 10) / 10}%`);
    console.log(`   Intensity: ${intensityChange > 0 ? '+' : ''}${Math.round(intensityChange * 10) / 10}%`);
    console.log();
  }

  // Summary statistics
  console.log('📊 Summary Statistics:\n');
  const avgEmissions = yearlyTotals.reduce((sum, y) => sum + y.total, 0) / yearlyTotals.length;
  const avgIntensity = yearlyTotals.reduce((sum, y) => sum + y.intensity, 0) / yearlyTotals.length;
  const bestYear = yearlyTotals.reduce((best, y) => y.total < best.total ? y : best);
  const worstYear = yearlyTotals.reduce((worst, y) => y.total > worst.total ? y : worst);

  console.log(`Average annual emissions: ${Math.round(avgEmissions * 10) / 10} tCO2e`);
  console.log(`Average intensity: ${Math.round(avgIntensity * 10) / 10} kgCO2e/m²`);
  console.log(`Best year: ${bestYear.year} (${Math.round(bestYear.total * 10) / 10} tCO2e)`);
  console.log(`Worst year: ${worstYear.year} (${Math.round(worstYear.total * 10) / 10} tCO2e)`);

  process.exit(0);
}

calculateTotalEmissions().catch(console.error);