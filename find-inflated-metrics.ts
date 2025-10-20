import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const problemSiteId = 'dccb2397-6731-4f4d-bd43-992c598bd0ce';

async function findInflatedMetrics() {
  console.log('🔍 Finding Which Metrics Are Causing 9x Inflation on Site dccb2397\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Get September actuals
  const { data: sepData } = await supabase
    .from('metrics_data')
    .select('metric_id, co2e_emissions, metrics_catalog(name)')
    .eq('organization_id', organizationId)
    .eq('site_id', problemSiteId)
    .gte('period_start', '2025-09-01')
    .lt('period_start', '2025-10-01');

  // Get October forecasts
  const { data: octData } = await supabase
    .from('metrics_data')
    .select('metric_id, co2e_emissions, metrics_catalog(name)')
    .eq('organization_id', organizationId)
    .eq('site_id', problemSiteId)
    .gte('period_start', '2025-10-01')
    .lt('period_start', '2025-11-01');

  if (!sepData || !octData) return;

  // Deduplicate September
  const sepSeen = new Set<string>();
  const sepUnique = sepData.filter(r => {
    const key = `${r.metric_id}`;
    if (sepSeen.has(key)) return false;
    sepSeen.add(key);
    return true;
  });

  // Group by metric
  const sepByMetric = new Map<string, {name: string, emissions: number}>();
  sepUnique.forEach(r => {
    sepByMetric.set(r.metric_id, {
      name: r.metrics_catalog?.name || 'Unknown',
      emissions: r.co2e_emissions || 0
    });
  });

  const octByMetric = new Map<string, {name: string, emissions: number}>();
  octData.forEach(r => {
    octByMetric.set(r.metric_id, {
      name: r.metrics_catalog?.name || 'Unknown',
      emissions: r.co2e_emissions || 0
    });
  });

  // Compare
  const comparisons: any[] = [];
  const allMetrics = new Set([...sepByMetric.keys(), ...octByMetric.keys()]);

  allMetrics.forEach(metricId => {
    const sep = sepByMetric.get(metricId);
    const oct = octByMetric.get(metricId);
    const sepEmissions = sep?.emissions || 0;
    const octEmissions = oct?.emissions || 0;
    const ratio = sepEmissions > 0 ? octEmissions / sepEmissions : 0;

    comparisons.push({
      name: (sep?.name || oct?.name)?.substring(0, 40),
      sepEmissions,
      octEmissions,
      ratio,
      diff: octEmissions - sepEmissions
    });
  });

  // Sort by absolute difference (biggest inflation first)
  comparisons.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  console.log('Metric Name                              Sep (kg)   Oct (kg)   Ratio   Diff (kg)');
  console.log('-'.repeat(95));

  comparisons.forEach(c => {
    const indicator = c.ratio > 2 ? '⚠️' : c.ratio < 0.5 ? '📉' : '';
    console.log(
      `${c.name.padEnd(40)} ${c.sepEmissions.toFixed(2).padStart(9)} ${c.octEmissions.toFixed(2).padStart(10)} ${c.ratio.toFixed(1).padStart(7)} ${c.diff.toFixed(2).padStart(11)} ${indicator}`
    );
  });

  const sepTotal = Array.from(sepByMetric.values()).reduce((sum, v) => sum + v.emissions, 0);
  const octTotal = Array.from(octByMetric.values()).reduce((sum, v) => sum + v.emissions, 0);

  console.log('-'.repeat(95));
  console.log(
    `${'TOTAL'.padEnd(40)} ${sepTotal.toFixed(2).padStart(9)} ${octTotal.toFixed(2).padStart(10)} ${(octTotal / sepTotal).toFixed(1).padStart(7)} ${(octTotal - sepTotal).toFixed(2).padStart(11)}`
  );
}

findInflatedMetrics().catch(console.error);
