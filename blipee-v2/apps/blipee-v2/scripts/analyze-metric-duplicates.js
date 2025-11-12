require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeMetricDuplicates() {
  console.log('🔍 Analyzing metric catalog for duplicates...\n')

  // Get all active metrics
  const { data: allMetrics, error } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, category, subcategory, unit, scope, is_calculated, parent:parent_metric_id(code, name, unit)')
    .eq('is_active', true)
    .order('code')

  if (error) {
    console.error('❌ Error:', error)
    return
  }

  console.log(`📊 TOTAL METRICS IN CATALOG: ${allMetrics.length}`)
  console.log()

  // Count by type
  const calculated = allMetrics.filter(m => m.is_calculated)
  const base = allMetrics.filter(m => !m.is_calculated)

  console.log('📈 BREAKDOWN:')
  console.log(`   Base/Original metrics: ${base.length}`)
  console.log(`   Calculated/Derived metrics: ${calculated.length}`)
  console.log(`   Total: ${allMetrics.length}`)
  console.log()

  // Show calculated metrics and their parents
  console.log('🔄 CALCULATED METRICS (these are derived from other metrics):')
  calculated.forEach(m => {
    console.log(`   ${m.code} (${m.unit})`)
    console.log(`      ↳ Parent: ${m.parent?.code || 'none'} (${m.parent?.unit || 'N/A'})`)
    console.log(`      Name: ${m.name}`)
  })
  console.log()

  // Group metrics by similar names to find potential duplicates
  console.log('🔍 POTENTIAL DUPLICATE GROUPS (same concept, different codes/units):\n')

  const groups = new Map()

  allMetrics.forEach(m => {
    const nameLower = m.name.toLowerCase()

    // Look for electricity metrics
    if (nameLower.includes('electricity') && !nameLower.includes('renewable')) {
      const key = 'electricity_consumption'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(m)
    }

    // Look for heating metrics
    if (nameLower.includes('heating') || nameLower.includes('heat')) {
      const key = 'heating'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(m)
    }

    // Look for cooling metrics
    if (nameLower.includes('cooling') || nameLower.includes('cool')) {
      const key = 'cooling'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(m)
    }

    // Look for water withdrawal metrics
    if (nameLower.includes('water') && nameLower.includes('withdrawal')) {
      const key = 'water_withdrawal'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(m)
    }

    // Look for water discharge metrics
    if (nameLower.includes('water') && nameLower.includes('discharge')) {
      const key = 'water_discharge'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(m)
    }
  })

  groups.forEach((metrics, key) => {
    if (metrics.length > 1) {
      console.log(`📦 ${key.toUpperCase()} (${metrics.length} metrics):`)
      metrics.forEach(m => {
        console.log(`   ${m.is_calculated ? '🔄' : '📊'} ${m.code}`)
        console.log(`      Name: ${m.name}`)
        console.log(`      Unit: ${m.unit}`)
        console.log(`      Category: ${m.category}${m.subcategory ? ' › ' + m.subcategory : ''}`)
        console.log(`      Type: ${m.is_calculated ? 'CALCULATED/DERIVED' : 'BASE/TRACKED'}`)
        if (m.parent) {
          console.log(`      Parent: ${m.parent.code}`)
        }
      })
      console.log()
    }
  })

  // Answer the key question
  console.log('\n💡 ANSWER TO YOUR QUESTION:\n')
  console.log(`   Q: "Se são a mesma métrica estão a contar na soma das 257?"`)
  console.log(`   A: SIM! Os ${allMetrics.length} incluem TODAS as métricas:`)
  console.log(`      - ${base.length} métricas base/originais (as que realmente trackamos)`)
  console.log(`      - ${calculated.length} métricas calculadas/derivadas (conversões de unidades, emissões calculadas, etc.)`)
  console.log()
  console.log('   🎯 IMPLICAÇÃO:')
  console.log('      O número real de métricas ÚNICAS que podem ser tracked é menor!')
  console.log(`      Aproximadamente ${base.length} métricas são verdadeiramente únicas.`)
  console.log()
  console.log('   ✅ BOA NOTÍCIA:')
  console.log('      Com a nossa implementação de derived metrics, o Gap Analysis agora:')
  console.log('      1. Mostra apenas as métricas base como oportunidades')
  console.log('      2. Esconde as métricas calculadas quando a métrica pai está tracked')
  console.log('      3. Não duplica a contagem de "métricas tracked"')
  console.log()
  console.log('   📊 EXEMPLO:')
  console.log('      - Se tracks "Electricity (kWh)", a app automaticamente:')
  console.log('        • Esconde "Electricity Consumption (GJ)" (conversão de unidade)')
  console.log('        • Esconde "Purchased Electricity Emissions (tCO2e)" (emissões calculadas)')
  console.log('        • Conta apenas 1 métrica tracked, não 3!')
}

analyzeMetricDuplicates().catch(console.error)
