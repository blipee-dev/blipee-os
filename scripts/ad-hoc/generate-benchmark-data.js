/**
 * AI-Powered Peer Benchmark Data Generator
 * Uses DeepSeek to generate realistic, industry-specific peer benchmark data
 * based on GRI Standards, ESRS, and real-world sustainability reporting patterns
 */

const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Industries to generate (based on GRI Sector Standards)
const INDUSTRIES = [
  { code: 'GRI_11', name: 'Services', examples: ['B2B SaaS', 'Professional Services', 'Consulting'] },
  { code: 'GRI_12', name: 'Oil & Gas', examples: ['Upstream', 'Downstream', 'Midstream'] },
  { code: 'GRI_13', name: 'Agriculture', examples: ['Crop Production', 'Livestock', 'Aquaculture'] },
  { code: 'GRI_14', name: 'Mining', examples: ['Metal Mining', 'Coal Mining', 'Quarrying'] },
  { code: 'GRI_15', name: 'Manufacturing', examples: ['Electronics', 'Automotive', 'Machinery'] },
  { code: 'GRI_16', name: 'Food & Beverage', examples: ['Food Processing', 'Beverage Production', 'Restaurants'] },
  { code: 'GRI_17', name: 'Retail', examples: ['E-commerce', 'Physical Retail', 'Wholesale'] }
];

const REGIONS = ['EU', 'North America', 'Asia-Pacific', 'Latin America', 'Middle East'];
const SIZE_CATEGORIES = ['1-50', '50-100', '100-300', '300-1000', '1000-5000', '5000+'];

async function callDeepSeek(prompt) {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

  if (!DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY not found in environment');
    process.exit(1);
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a sustainability data expert with deep knowledge of GRI Standards, ESRS, CDP, TCFD, and SBTi frameworks. You understand typical emissions, water, waste, and energy patterns across different industries, regions, and company sizes. Generate realistic peer benchmark data based on real-world sustainability reporting patterns.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent, factual data
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${error}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function generateIndustryMateriality(industry) {
  const prompt = `Generate industry materiality data for ${industry.name} (${industry.code}) sector.

For this industry, identify the TOP 10 most material sustainability metrics based on:
- GRI Sector Standard ${industry.code}
- ESRS double materiality (impact + financial)
- Common material topics for ${industry.examples.join(', ')}

For each metric, provide:
1. metric_name: Name of the metric (must match common sustainability metrics like "Water Consumption", "Scope 1 Emissions", "Waste Generated", etc.)
2. gri_disclosure: The GRI disclosure code (e.g., "GRI 303-3", "GRI 305-1")
3. materiality_level: "high", "medium", or "low"
4. impact_materiality: true/false (does it impact environment/society?)
5. financial_materiality: true/false (does it impact financial performance?)
6. materiality_reason: Brief explanation (1-2 sentences) of WHY this is material for this industry
7. required_for_frameworks: Array of frameworks requiring this (e.g., ["ESRS_E1", "GRI_305", "SBTi", "TCFD"])
8. mandatory: true/false (is it legally required in EU/major jurisdictions?)

Return JSON format:
{
  "industry": "${industry.name}",
  "gri_sector_code": "${industry.code}",
  "metrics": [
    {
      "metric_name": "...",
      "gri_disclosure": "...",
      "materiality_level": "...",
      "impact_materiality": true,
      "financial_materiality": true,
      "materiality_reason": "...",
      "required_for_frameworks": [...],
      "mandatory": false
    }
  ]
}`;

  console.log(`🧠 Generating materiality data for ${industry.name}...`);
  return await callDeepSeek(prompt);
}

async function generatePeerBenchmarks(industry, region, sizeCategory) {
  const prompt = `Generate realistic peer benchmark data for sustainability metrics.

Industry: ${industry.name} (${industry.code})
Region: ${region}
Company Size: ${sizeCategory} employees
Business Types: ${industry.examples.join(', ')}

Generate benchmarks for the TOP 8 metrics most commonly tracked in this peer group:
- At least 2 emissions metrics (Scope 1, 2, or 3 categories)
- At least 1 water metric
- At least 1 waste metric
- At least 1 energy metric

For each metric, provide realistic statistical data:
1. metric_name: Name (e.g., "Water Consumption", "Scope 1 Emissions")
2. metric_type: "emissions", "water", "waste", or "energy"
3. peer_count: Number of companies in benchmark (minimum 10, realistic for peer group)
4. adoption_percent: Percentage tracking this metric (0-100, be realistic - not all metrics are 90%+)
5. intensity_metric: "per_employee", "per_revenue", or "per_sqm"
6. p25_intensity: 25th percentile intensity value
7. p50_intensity: 50th percentile (median) intensity value
8. p75_intensity: 75th percentile intensity value
9. p90_intensity: 90th percentile intensity value
10. avg_absolute_value: Average absolute value for a company in this peer group
11. unit: The unit of measurement (e.g., "tCO2e", "m3", "tonnes", "MWh", "%")

IMPORTANT GUIDELINES:
- Values should be realistic for the industry (e.g., Oil & Gas has MUCH higher Scope 1 than Services)
- Larger companies typically have higher absolute values but may have better intensity ratios
- EU companies typically have higher renewable energy % than other regions
- Manufacturing/Industrial has higher waste and water usage than Services
- Adoption rates vary: common metrics like Scope 1/2 (80-95%), emerging metrics like biodiversity (20-40%)
- Intensity values should follow realistic distribution (p75 should be ~1.3-2x p50, p90 should be ~2-3x p50)

Return JSON format:
{
  "industry": "${industry.name}",
  "region": "${region}",
  "size_category": "${sizeCategory}",
  "benchmarks": [
    {
      "metric_name": "...",
      "metric_type": "...",
      "peer_count": 15,
      "adoption_percent": 85.0,
      "intensity_metric": "per_employee",
      "p25_intensity": 1.2,
      "p50_intensity": 2.3,
      "p75_intensity": 3.5,
      "p90_intensity": 5.2,
      "avg_absolute_value": 450.0,
      "unit": "tCO2e"
    }
  ]
}`;

  console.log(`🧠 Generating peer benchmarks for ${industry.name} | ${region} | ${sizeCategory}...`);
  return await callDeepSeek(prompt);
}

async function generateSQLInserts() {
  let materialitySQL = [];
  let benchmarkSQL = [];

  // Generate materiality data for each industry
  console.log('📊 PHASE 1: Generating Industry Materiality Data\n');
  console.log('='.repeat(60));

  for (const industry of INDUSTRIES) {
    try {
      const materialityData = await generateIndustryMateriality(industry);

      for (const metric of materialityData.metrics) {
        const sql = `
-- ${industry.name}: ${metric.metric_name}
INSERT INTO industry_materiality (
  industry, gri_sector_code, metric_catalog_id, gri_disclosure,
  materiality_level, impact_materiality, financial_materiality,
  materiality_reason, required_for_frameworks, mandatory, source
)
SELECT
  '${industry.name}', '${industry.code}', mc.id, '${metric.gri_disclosure}',
  '${metric.materiality_level}', ${metric.impact_materiality}, ${metric.financial_materiality},
  '${metric.materiality_reason.replace(/'/g, "''")}',
  '${JSON.stringify(metric.required_for_frameworks)}'::jsonb,
  ${metric.mandatory}, 'GRI Sector Standard ${industry.code}'
FROM metrics_catalog mc
WHERE mc.name ILIKE '%${metric.metric_name}%' OR mc.category ILIKE '%${metric.metric_name}%'
LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;`;

        materialitySQL.push(sql);
      }

      console.log(`✅ ${industry.name}: Generated ${materialityData.metrics.length} materiality mappings`);

      // Rate limiting: wait 2 seconds between API calls
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Error generating materiality for ${industry.name}:`, error.message);
    }
  }

  // Generate peer benchmarks for key combinations (not all - too many!)
  console.log('\n📊 PHASE 2: Generating Peer Benchmark Data\n');
  console.log('='.repeat(60));

  // Generate for: Each industry × 2 regions (EU, North America) × 2 sizes (100-300, 300-1000)
  const priorityRegions = ['EU', 'North America'];
  const prioritySizes = ['100-300', '300-1000'];

  for (const industry of INDUSTRIES) {
    for (const region of priorityRegions) {
      for (const size of prioritySizes) {
        try {
          const benchmarkData = await generatePeerBenchmarks(industry, region, size);

          for (const benchmark of benchmarkData.benchmarks) {
            const sql = `
-- ${industry.name} | ${region} | ${size} - ${benchmark.metric_name}
INSERT INTO peer_benchmark_data (
  industry, region, size_category, business_type, metric_catalog_id, metric_type,
  peer_count, adoption_percent, intensity_metric,
  p25_intensity, p50_intensity, p75_intensity, p90_intensity,
  avg_absolute_value, data_as_of, calculation_method
)
SELECT
  '${industry.name}', '${region}', '${size}', '${industry.examples[0]}',
  mc.id, '${benchmark.metric_type}',
  ${benchmark.peer_count}, ${benchmark.adoption_percent}, '${benchmark.intensity_metric}',
  ${benchmark.p25_intensity}, ${benchmark.p50_intensity}, ${benchmark.p75_intensity}, ${benchmark.p90_intensity},
  ${benchmark.avg_absolute_value}, CURRENT_DATE,
  'AI-generated benchmark from ${benchmark.peer_count} peer organizations (${benchmark.unit})'
FROM metrics_catalog mc
WHERE mc.name ILIKE '%${benchmark.metric_name}%' OR mc.category ILIKE '%${benchmark.metric_name}%'
LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;`;

            benchmarkSQL.push(sql);
          }

          console.log(`✅ ${industry.name} | ${region} | ${size}: Generated ${benchmarkData.benchmarks.length} benchmarks`);

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`❌ Error generating benchmarks for ${industry.name} | ${region} | ${size}:`, error.message);
        }
      }
    }
  }

  // Write to file
  const outputSQL = `-- AI-Generated Comprehensive Peer Benchmark & Materiality Data
-- Generated by DeepSeek AI on ${new Date().toISOString()}
-- Covers ${INDUSTRIES.length} industries × ${priorityRegions.length} regions × ${prioritySizes.length} size categories

-- ============================================================
-- PART 1: INDUSTRY MATERIALITY DATA
-- ============================================================

${materialitySQL.join('\n')}

-- ============================================================
-- PART 2: PEER BENCHMARK DATA
-- ============================================================

${benchmarkSQL.join('\n')}

-- ============================================================
-- SUMMARY
-- ============================================================
-- Materiality Mappings: ~${materialitySQL.length} entries
-- Peer Benchmarks: ~${benchmarkSQL.length} entries
-- Total Industries: ${INDUSTRIES.length}
-- Coverage: ${INDUSTRIES.map(i => i.name).join(', ')}
`;

  const outputPath = 'supabase/migrations/20251013_ai_generated_seed_data.sql';
  fs.writeFileSync(outputPath, outputSQL);

  console.log('\n' + '='.repeat(60));
  console.log('✅ SUCCESS! Generated comprehensive seed data');
  console.log('='.repeat(60));
  console.log(`📁 Output: ${outputPath}`);
  console.log(`📊 Materiality Mappings: ${materialitySQL.length}`);
  console.log(`📊 Peer Benchmarks: ${benchmarkSQL.length}`);
  console.log(`🏭 Industries: ${INDUSTRIES.length}`);
  console.log('\n🚀 Next step: Apply this migration in Supabase Dashboard');
}

// Run the generator
generateSQLInserts().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
