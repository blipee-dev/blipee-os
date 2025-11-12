require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyMigration() {
  console.log('🔄 Checking if derived metrics migration is needed...\n')

  // Try to query the new columns to see if they exist
  const { error: testError } = await supabase
    .from('metrics_catalog')
    .select('parent_metric_id, is_calculated, calculation_type')
    .limit(1)

  if (testError) {
    if (testError.message.includes('column') && testError.message.includes('does not exist')) {
      console.log('❌ Columns do not exist yet. Migration needs to be applied.')
      console.log('\n📝 Please run the following SQL in Supabase SQL Editor:')
      console.log('\n' + '='.repeat(80))
      console.log(`
-- Add support for derived/calculated metrics
ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS parent_metric_id UUID REFERENCES metrics_catalog(id),
ADD COLUMN IF NOT EXISTS is_calculated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS calculation_type TEXT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_metrics_catalog_parent_metric_id
ON metrics_catalog(parent_metric_id)
WHERE parent_metric_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN metrics_catalog.parent_metric_id IS 'Reference to the parent metric if this metric is calculated/derived';
COMMENT ON COLUMN metrics_catalog.is_calculated IS 'True if this metric is automatically calculated from other metrics';
COMMENT ON COLUMN metrics_catalog.calculation_type IS 'Type of calculation: emission_factor, aggregation, formula, etc.';
      `.trim())
      console.log('\n' + '='.repeat(80))
      console.log('\n💡 After running the SQL, run this script again to populate the data.')
      process.exit(1)
    } else {
      console.error('❌ Unexpected error:', testError)
      process.exit(1)
    }
  } else {
    console.log('✅ Columns already exist!')
    console.log('\n📊 Proceeding to populate derived metrics data...\n')

    // Import and run the populate script
    require('./populate-derived-metrics.js')
  }
}

applyMigration().catch(console.error)
