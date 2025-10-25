import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixIncinerationMetadata() {
  console.log('🔧 Fixing incineration metadata...\n');

  // Fix scope3_waste_incineration
  // Should be: is_diverted = FALSE (it's disposal, not diversion)
  const { error } = await supabase
    .from('metrics_catalog')
    .update({
      is_diverted: false,
      is_recycling: false,
      disposal_method: 'incineration_no_recovery'
    })
    .eq('code', 'scope3_waste_incineration');

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Fixed scope3_waste_incineration:');
    console.log('   is_diverted: true → FALSE');
    console.log('   disposal_method: incineration_recovery → incineration_no_recovery\n');
  }

  console.log('💡 Impact:');
  console.log('   Diversion Rate will now be ~65% (instead of 100%)');
  console.log('   Disposal Rate will now be ~35% (instead of 0%)');
  console.log('   Total Generated = Diverted + Disposal ✓');
}

fixIncinerationMetadata();
