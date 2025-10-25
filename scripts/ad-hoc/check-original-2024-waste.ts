import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkOriginal2024Waste() {
  console.log('🔍 Checking what the ORIGINAL 2024 waste data looked like...\n');

  // Get original 2024 waste totals (before we split them)
  // We backfilled from these 5 original metrics:
  // - scope3_waste_recycling (4.45 tons in 2024)
  // - scope3_waste_composting (2.63 tons in 2024)
  // - scope3_waste_landfill
  // - scope3_waste_incineration
  // - scope3_waste_ewaste

  const { data: landfillData } = await supabase
    .from('metrics_data')
    .select('value')
    .eq('metric_id', (await supabase.from('metrics_catalog').select('id').eq('code', 'scope3_waste_landfill').single()).data?.id)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31');

  const { data: incinerationData } = await supabase
    .from('metrics_data')
    .select('value')
    .eq('metric_id', (await supabase.from('metrics_catalog').select('id').eq('code', 'scope3_waste_incineration').single()).data?.id)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31');

  const { data: ewasteData } = await supabase
    .from('metrics_data')
    .select('value')
    .eq('metric_id', (await supabase.from('metrics_catalog').select('id').eq('code', 'scope3_waste_ewaste').single()).data?.id)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31');

  const landfillTotal = landfillData?.reduce((sum, r) => sum + parseFloat(r.value), 0) || 0;
  const incinerationTotal = incinerationData?.reduce((sum, r) => sum + parseFloat(r.value), 0) || 0;
  const ewasteTotal = ewasteData?.reduce((sum, r) => sum + parseFloat(r.value), 0) || 0;

  console.log('📊 ORIGINAL 2024 DATA (before split):');
  console.log(`  Recycling: 4.45 tons (now split into paper/plastic/metal/glass/mixed)`);
  console.log(`  Composting: 2.63 tons (now split into food/garden)`);
  console.log(`  Landfill: ${landfillTotal.toFixed(2)} tons`);
  console.log(`  Incineration: ${incinerationTotal.toFixed(2)} tons`);
  console.log(`  E-Waste: ${ewasteTotal.toFixed(2)} tons`);

  const originalTotal = 4.45 + 2.63 + landfillTotal + incinerationTotal + ewasteTotal;
  console.log(`\n  ORIGINAL TOTAL GENERATED: ${originalTotal.toFixed(2)} tons`);

  const diverted = 4.45 + 2.63; // recycling + composting
  const disposal = landfillTotal + incinerationTotal + ewasteTotal;

  console.log(`\n  Diverted (recycling + composting): ${diverted.toFixed(2)} tons`);
  console.log(`  Disposal (landfill + incineration + ewaste): ${disposal.toFixed(2)} tons`);

  console.log(`\n  Original Diversion Rate: ${((diverted / originalTotal) * 100).toFixed(1)}%`);
  console.log(`  Original Recycling Rate: ${((4.45 / originalTotal) * 100).toFixed(1)}%`);
  console.log(`  Original Disposal Rate: ${((disposal / originalTotal) * 100).toFixed(1)}%`);

  console.log('\n💡 KEY INSIGHT:');
  console.log('  Total Generated = Diverted + Disposal');
  console.log('  Incineration should be counted as DISPOSAL, not DIVERTED');
  console.log('  (unless it has energy recovery, which we need to track separately)');
}

checkOriginal2024Waste();
