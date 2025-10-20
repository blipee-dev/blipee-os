import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function analyzeAggregation() {
  console.log('🔍 Analyzing Forecast Aggregation Issue\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Get September actual data
  const { data: sepData } = await supabase
    .from('metrics_data')
    .select('metric_id, site_id, co2e_emissions')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-09-01')
    .lt('period_start', '2025-10-01');

  // Get October forecast data
  const { data: octData } = await supabase
    .from('metrics_data')
    .select('metric_id, site_id, co2e_emissions')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-10-01')
    .lt('period_start', '2025-11-01');

  if (!sepData || !octData) return;

  // Deduplicate September
  const sepSeen = new Set<string>();
  const sepUnique = sepData.filter(r => {
    const key = `${r.metric_id}|${r.site_id || 'null'}`;
    if (sepSeen.has(key)) return false;
    sepSeen.add(key);
    return true;
  });

  // Count by site for September
  const sepBySite = new Map<string, number>();
  sepUnique.forEach(r => {
    const siteId = r.site_id || 'null';
    sepBySite.set(siteId, (sepBySite.get(siteId) || 0) + 1);
  });

  // Count by site for October
  const octBySite = new Map<string, number>();
  octData.forEach(r => {
    const siteId = r.site_id || 'null';
    octBySite.set(siteId, (octBySite.get(siteId) || 0) + 1);
  });

  console.log('📊 Records per Site:\n');
  console.log('Site ID             Sep Actual  Oct Forecast  Ratio');
  console.log('-'.repeat(60));

  const allSites = new Set([...sepBySite.keys(), ...octBySite.keys()]);
  allSites.forEach(siteId => {
    const sepCount = sepBySite.get(siteId) || 0;
    const octCount = octBySite.get(siteId) || 0;
    const ratio = sepCount > 0 ? (octCount / sepCount).toFixed(1) : 'N/A';
    console.log(`${siteId.substring(0, 19).padEnd(19)} ${String(sepCount).padStart(11)} ${String(octCount).padStart(13)} ${String(ratio).padStart(7)}`);
  });

  // Calculate emissions per site
  console.log('\n📊 Emissions per Site (tCO2e):\n');
  console.log('Site ID             Sep Actual  Oct Forecast  Ratio');
  console.log('-'.repeat(60));

  const sepEmissionsBySite = new Map<string, number>();
  sepUnique.forEach(r => {
    const siteId = r.site_id || 'null';
    sepEmissionsBySite.set(siteId, (sepEmissionsBySite.get(siteId) || 0) + (r.co2e_emissions || 0));
  });

  const octEmissionsBySite = new Map<string, number>();
  octData.forEach(r => {
    const siteId = r.site_id || 'null';
    octEmissionsBySite.set(siteId, (octEmissionsBySite.get(siteId) || 0) + (r.co2e_emissions || 0));
  });

  allSites.forEach(siteId => {
    const sepEmissions = (sepEmissionsBySite.get(siteId) || 0) / 1000;
    const octEmissions = (octEmissionsBySite.get(siteId) || 0) / 1000;
    const ratio = sepEmissions > 0 ? (octEmissions / sepEmissions).toFixed(1) : 'N/A';
    console.log(`${siteId.substring(0, 19).padEnd(19)} ${sepEmissions.toFixed(1).padStart(11)} ${octEmissions.toFixed(1).padStart(13)} ${String(ratio).padStart(7)}`);
  });

  console.log('\n📈 Totals:');
  const sepTotal = sepUnique.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
  const octTotal = octData.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
  console.log(`  September: ${(sepTotal / 1000).toFixed(1)} tCO2e (${sepUnique.length} records)`);
  console.log(`  October: ${(octTotal / 1000).toFixed(1)} tCO2e (${octData.length} records)`);
  console.log(`  Ratio: ${(octTotal / sepTotal).toFixed(1)}x`);
}

analyzeAggregation().catch(console.error);
