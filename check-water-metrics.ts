import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkWaterMetrics() {
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('name.ilike.%water%,name.ilike.%wastewater%')
    .eq('category', 'Purchased Goods & Services');

  console.log('Water Metrics Classification:\n');

  const withdrawal: string[] = [];
  const discharge: string[] = [];
  const recycled: string[] = [];

  waterMetrics?.forEach(m => {
    const name = m.name.toLowerCase();

    if (name.includes('wastewater')) {
      discharge.push(m.name);
    } else if (name.includes('recycled')) {
      recycled.push(m.name);
    } else if (name.includes('water')) {
      withdrawal.push(m.name);
    }
  });

  console.log('🚰 WITHDRAWAL (Water):');
  withdrawal.forEach(n => console.log(`  - ${n}`));

  console.log('\n♻️  RECYCLED:');
  recycled.forEach(n => console.log(`  - ${n}`));

  console.log('\n🚽 DISCHARGE (Wastewater):');
  discharge.forEach(n => console.log(`  - ${n}`));

  console.log(`\nTotal: ${waterMetrics?.length || 0} metrics`);
  console.log(`  Withdrawal: ${withdrawal.length}`);
  console.log(`  Recycled: ${recycled.length}`);
  console.log(`  Discharge: ${discharge.length}`);
}

checkWaterMetrics().catch(console.error);
