import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient('https://quovvwrwyfkzhgqdeham.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI');

async function checkTargetUnits() {
  console.log('Checking target values and their units');
  
  const { data: target } = await supabase
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .eq('baseline_year', 2023)
    .single();
  
  console.log('Database values:');
  console.log('  baseline_value:', target.baseline_value);
  console.log('  target_value:', target.target_value);
  console.log('');
  console.log('Expected if stored in tCO2e:');
  console.log('  baseline: 429.3 tCO2e');
  console.log('  target: 248.994 tCO2e');
  console.log('');
  console.log('What we actually have for 2023 emissions from calculator: 429.3 tCO2e');
}

checkTargetUnits();
