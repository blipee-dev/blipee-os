import { config } from 'dotenv'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

const envPath = join(__dirname, '..', '.env.local')
config({ path: envPath })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkCache() {
  const { data, error, count } = await supabase
    .from('emission_factors_cache')
    .select('*', { count: 'exact' })
    .order('region_code')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`\n✅ Found ${count} cached emission factors:\n`)
  console.log('Region | Activity Name                     | Factor      | Unit     | Source')
  console.log('-'.repeat(90))

  data?.forEach((factor: any) => {
    const region = factor.region_code.padEnd(6)
    const name = factor.activity_name.substring(0, 32).padEnd(33)
    const value = factor.factor_value.toFixed(4).padStart(10)
    const unit = factor.factor_unit.padEnd(8)
    const source = `${factor.source_dataset} ${factor.source_year}`
    console.log(`${region} | ${name} | ${value} | ${unit} | ${source}`)
  })
}

checkCache().then(() => process.exit(0))
