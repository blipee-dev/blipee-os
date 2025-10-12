/**
 * FAST AI-Powered Peer Benchmark Data Generator
 * Generates data for TOP 3 industries only, optimized for speed
 */

const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// Focus on TOP 3 most common industries
const INDUSTRIES = [
  { code: 'GRI_11', name: 'Services', examples: ['B2B SaaS', 'Professional Services', 'Consulting'] },
  { code: 'GRI_15', name: 'Manufacturing', examples: ['Electronics', 'Automotive', 'Machinery'] },
  { code: 'GRI_17', name: 'Retail', examples: ['E-commerce', 'Physical Retail', 'Wholesale'] }
];

const REGIONS = ['EU', 'North America'];
const SIZE_CATEGORIES = ['100-300', '300-1000'];

async function callDeepSeek(prompt) {
  const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not found');
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
          content: `You are a sustainability data expert with deep knowledge of GRI Standards, ESRS, CDP, TCFD, and SBTi frameworks. Generate realistic peer benchmark data based on real-world sustainability reporting patterns. Always return valid JSON.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
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

async function generateAllDataForIndustry(industry) {
  const prompt = `Generate comprehensive sustainability data for ${industry.name} (${industry.code}) sector.

PART 1: Industry Materiality (TOP 10 material metrics)
For each metric provide:
- metric_name: Common name (e.g., "Scope 1 Emissions", "Water Consumption")
- gri_disclosure: GRI code (e.g., "GRI 305-1", "GRI 303-3")
- materiality_level: "high", "medium", or "low"
- impact_materiality: boolean
- financial_materiality: boolean
- materiality_reason: Brief explanation (1-2 sentences)
- required_for_frameworks: Array like ["ESRS_E1", "GRI_305", "SBTi"]
- mandatory: boolean

PART 2: Peer Benchmarks
For each region (EU, North America) × size (100-300, 300-1000 employees), generate 8 benchmarks:
- At least 2 emissions metrics (Scope 1, 2, or 3)
- At least 1 water metric
- At least 1 waste metric
- At least 1 energy metric

For each benchmark:
- metric_name: Must match a materiality metric name
- metric_type: "emissions", "water", "waste", or "energy"
- region: "EU" or "North America"
- size_category: "100-300" or "300-1000"
- peer_count: 10-50 companies
- adoption_percent: 20-95% (be realistic)
- intensity_metric: "per_employee", "per_revenue", or "per_sqm"
- p25_intensity, p50_intensity, p75_intensity, p90_intensity: Realistic distribution
- avg_absolute_value: Average absolute value
- unit: Unit of measurement

IMPORTANT:
- Manufacturing has 10x higher emissions/waste/water than Services
- EU has ~30% higher renewable energy adoption than North America
- Larger companies have better intensity ratios but higher absolute values
- Make metric_name EXACTLY the same between materiality and benchmarks

Return JSON:
{
  "industry": "${industry.name}",
  "gri_sector_code": "${industry.code}",
  "materiality": [
    {
      "metric_name": "...",
      "gri_disclosure": "...",
      "materiality_level": "high",
      "impact_materiality": true,
      "financial_materiality": true,
      "materiality_reason": "...",
      "required_for_frameworks": ["..."],
      "mandatory": false
    }
  ],
  "benchmarks": [
    {
      "metric_name": "...",
      "metric_type": "emissions",
      "region": "EU",
      "size_category": "100-300",
      "peer_count": 25,
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

  console.log(`🧠 Generating ALL data for ${industry.name}...`);
  return await callDeepSeek(prompt);
}

async function generateSQL() {
  let materialitySQL = [];
  let benchmarkSQL = [];

  console.log('📊 Generating Comprehensive Data (TOP 3 Industries)\n');
  console.log('='.repeat(60));

  for (const industry of INDUSTRIES) {
    try {
      const data = await generateAllDataForIndustry(industry);

      // Process materiality
      for (const metric of data.materiality || []) {
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

      // Process benchmarks
      for (const benchmark of data.benchmarks || []) {
        const sql = `
-- ${industry.name} | ${benchmark.region} | ${benchmark.size_category} - ${benchmark.metric_name}
INSERT INTO peer_benchmark_data (
  industry, region, size_category, business_type, metric_catalog_id, metric_type,
  peer_count, adoption_percent, intensity_metric,
  p25_intensity, p50_intensity, p75_intensity, p90_intensity,
  avg_absolute_value, data_as_of, calculation_method
)
SELECT
  '${industry.name}', '${benchmark.region}', '${benchmark.size_category}', '${industry.examples[0]}',
  mc.id, '${benchmark.metric_type}',
  ${benchmark.peer_count}, ${benchmark.adoption_percent}, '${benchmark.intensity_metric}',
  ${benchmark.p25_intensity}, ${benchmark.p50_intensity}, ${benchmark.p75_intensity}, ${benchmark.p90_intensity},
  ${benchmark.avg_absolute_value}, CURRENT_DATE,
  'AI-generated from ${benchmark.peer_count} peers (${benchmark.unit})'
FROM metrics_catalog mc
WHERE mc.name ILIKE '%${benchmark.metric_name}%' OR mc.category ILIKE '%${benchmark.metric_name}%'
LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;`;

        benchmarkSQL.push(sql);
      }

      console.log(`✅ ${industry.name}: ${data.materiality?.length || 0} materiality + ${data.benchmarks?.length || 0} benchmarks`);

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ ${industry.name}: ${error.message}`);
    }
  }

  // Write file
  const outputSQL = `-- AI-Generated Comprehensive Peer Benchmark & Materiality Data
-- Generated by DeepSeek AI on ${new Date().toISOString()}
-- Covers TOP 3 industries: ${INDUSTRIES.map(i => i.name).join(', ')}

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
-- Materiality Mappings: ${materialitySQL.length} entries
-- Peer Benchmarks: ${benchmarkSQL.length} entries
-- Industries: ${INDUSTRIES.map(i => i.name).join(', ')}
-- Regions: ${REGIONS.join(', ')}
-- Size Categories: ${SIZE_CATEGORIES.join(', ')}
`;

  const outputPath = 'supabase/migrations/20251013_ai_generated_seed_data.sql';
  fs.writeFileSync(outputPath, outputSQL);

  console.log('\n' + '='.repeat(60));
  console.log('✅ SUCCESS!');
  console.log('='.repeat(60));
  console.log(`📁 File: ${outputPath}`);
  console.log(`📊 Materiality: ${materialitySQL.length} entries`);
  console.log(`📊 Benchmarks: ${benchmarkSQL.length} entries`);
  console.log('\n🚀 Next: Apply this migration in Supabase Dashboard');
}

generateSQL().catch(console.error);
