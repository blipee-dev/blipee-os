import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';
import pdf from 'pdf-parse';
import { readFileSync, writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const deepseekApiKey = process.env.DEEPSEEK_API_KEY!;

const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

interface MEGADictionaryEntry {
  Framework: string;
  Code: string | null;
  Disclosure: string;
  Metric: string;
  Units: string | null;
  DataType: string;
  Keywords: string[];
  SDG: number[];
  TopicCluster: string;
  ESRS_Reference: string | null;
  GRI_Reference: string | null;
  FrameworkAlignment: string[];
  MetricType: string;
  Sector: string;
  Scope: string;
  AssuranceLevel: string | null;
  Source: string;
}

async function extractWithSmartMEGA(
  companyName: string,
  reportText: string,
  megaDictionary: MEGADictionaryEntry[]
): Promise<any> {

  console.log(`🤖 Extracting with SMART MEGA DICTIONARY (quantitative only)...\n`);

  // SMART FILTER: Only quantitative metrics (numeric KPIs)
  const quantitativeEntries = megaDictionary.filter(e => e.DataType === 'Quantitative');

  console.log(`   📊 Filtered to ${quantitativeEntries.length} quantitative entries (from ${megaDictionary.length} total)`);

  // Extract unique keywords from quantitative entries only
  const uniqueKeywords = new Set<string>();
  quantitativeEntries.forEach(e => {
    e.Keywords
      .filter(k =>
        k.length > 3 && // Skip very short keywords
        !k.includes('_') && // Skip snake_case variants (duplicates)
        !k.includes('—') && // Skip special chars
        !k.endsWith('s') // Skip plurals if singular exists
      )
      .forEach(k => uniqueKeywords.add(k.toLowerCase()));
  });

  console.log(`   🔑 ${uniqueKeywords.size} unique high-value keywords (from 798 total)`);

  // Group by topic cluster
  const topicClusters = new Set(quantitativeEntries.map(e => e.TopicCluster));
  console.log(`   📚 ${topicClusters.size} topic clusters\n`);

  // Use only first 250K chars
  const maxLength = 250000;
  const textToAnalyze = reportText.length > maxLength
    ? reportText.substring(0, maxLength)
    : reportText;

  console.log(`   Analyzing ${textToAnalyze.length.toLocaleString()} of ${reportText.length.toLocaleString()} characters (${Math.round(textToAnalyze.length / reportText.length * 100)}%)\n`);

  // Get GRI and ESRS references
  const griRefs = [...new Set(quantitativeEntries.filter(e => e.GRI_Reference).map(e => e.GRI_Reference))];
  const esrsRefs = [...new Set(quantitativeEntries.filter(e => e.ESRS_Reference).map(e => e.ESRS_Reference))];

  // Top keywords sample
  const keywordSample = Array.from(uniqueKeywords).slice(0, 100).join(', ');

  const prompt = `You are extracting QUANTITATIVE sustainability metrics from a corporate report using a focused dictionary of 232 numeric KPIs.

COMPANY: ${companyName}

SMART MEGA DICTIONARY (QUANTITATIVE ONLY):
- ${quantitativeEntries.length} numeric KPI entries (no qualitative narratives)
- ${uniqueKeywords.size} unique high-value keywords
- ${topicClusters.size} topic clusters

GRI CODES (${griRefs.length}): ${griRefs.slice(0, 15).join(', ')}...
ESRS CODES (${esrsRefs.length}): ${esrsRefs.slice(0, 15).join(', ')}...

TOP KEYWORDS (${uniqueKeywords.size} total):
${keywordSample}

REPORT TEXT (${Math.round(textToAnalyze.length / 1000)}K chars):
${textToAnalyze}

EXTRACTION STRATEGY:

1. **PRIORITY: Find GRI Content Index & ESRS tables**
   - Search: "GRI Content Index", "ESRS", "Sustainability Metrics", "Performance Data"
   - Extract ALL numeric values from these tables

2. **Search for GRI codes** (e.g., GRI 305-1, GRI 2-7, GRI 403-9)
   - GRI 305-1 = Scope 1 emissions (tCO2e)
   - GRI 305-2 = Scope 2 emissions (tCO2e, location/market-based)
   - GRI 305-3 = Scope 3 emissions (tCO2e, by category)
   - GRI 2-7 = Total employees (headcount)
   - GRI 403-9 = Work-related injuries (fatalities, LTIF, TRIR)
   - GRI 302-1 = Energy consumption (GJ, MWh)
   - GRI 303-5 = Water consumption (m³)

3. **Search for ESRS codes** (e.g., ESRS E1-6, ESRS S1-6, ESRS E3-4)
   - ESRS E1-6 = GHG emissions Scope 1/2/3
   - ESRS S1-6 = Employees by gender
   - ESRS E3-4 = Water consumption/withdrawal

4. **Extract NUMERIC VALUES for these metrics:**

   **Climate & Energy:**
   - Scope 1/2/3 emissions (tCO2e, MtCO2e)
   - Carbon intensity (gCO2e/MJ, tCO2e/revenue)
   - Energy consumption (GJ, MWh, TJ)
   - Renewable energy % or share
   - Net zero target year, reduction % vs baseline

   **Water & Waste:**
   - Water withdrawal/consumption/discharge (m³, ML)
   - Water recycled/reused (%)
   - Waste generated/recycled/landfilled (tonnes, kt)
   - Hazardous waste (tonnes)
   - Circular economy revenue (%)

   **Workforce:**
   - Total employees (headcount, FTE)
   - Women in workforce/leadership (%, count)
   - Employee turnover (%)
   - New hires (count)
   - Training hours per employee

   **Safety:**
   - Fatalities (count)
   - LTIF (per million hours)
   - TRIR (per million hours)
   - Recordable injuries (count)
   - Lost days (count)

   **Governance:**
   - Board independence (%)
   - Women on board (%, count)
   - Anti-corruption training (%)
   - ESG-linked compensation (% of total)

   **Financial:**
   - Revenue ($ billion, € million)
   - Taxonomy-aligned revenue/CAPEX (%)
   - Green bonds issued ($)
   - R&D investment ($, %)

5. **CRITICAL RULES:**
   - ONLY extract NUMERIC values (numbers with units)
   - Skip qualitative descriptions, policies, narratives
   - Include year suffix: metric_2024, metric_2023, metric_2022
   - Include units in field name: emissions_tonco2e, water_m3, energy_gwh
   - Return ONLY valid JSON
   - TARGET: 150-300 NUMERIC metrics

Expected: Extract 150-300 quantitative metrics using focused dictionary of 232 KPIs.
`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Extract QUANTITATIVE sustainability metrics only (numeric KPIs with units). Skip qualitative narratives. Use smart MEGA dictionary (232 quantitative entries, 798 unique keywords). Return ONLY valid JSON with numeric values.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4000,
    });

    let content = response.choices[0].message.content!;

    // JSON repair
    try {
      var extracted = JSON.parse(content);
    } catch (parseError: any) {
      console.log(`   ⚠️  JSON parse error, attempting repair...`);
      content = content.replace(/,(\s*[}\]])/g, '$1');
      content = content.replace(/: "([^"]*?)$/gm, ': "$1"');
      const lastBrace = content.lastIndexOf('}');
      if (lastBrace > 0) {
        content = content.substring(0, lastBrace + 1);
      }
      try {
        extracted = JSON.parse(content);
        console.log(`   ✓ JSON repaired`);
      } catch (repairError: any) {
        console.error(`   ❌ JSON repair failed`);
        return null;
      }
    }

    // Flatten
    function flattenObject(obj: any, prefix = ''): any {
      let flattened: any = {};
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}_${key}` : key;
        if (value === null || value === undefined) {
          flattened[newKey] = value;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          const nested = flattenObject(value, newKey);
          flattened = { ...flattened, ...nested };
        } else {
          flattened[newKey] = value;
        }
      }
      return flattened;
    }

    return flattenObject(extracted);
  } catch (error: any) {
    console.error(`   ❌ Extraction failed: ${error.message}`);
    return null;
  }
}

async function testCompany(
  companyName: string,
  pdfPath: string,
  baselineMetrics: number,
  megaDictionary: MEGADictionaryEntry[]
) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 ${companyName}`);
  console.log(`   Baseline (141-code): ${baselineMetrics} metrics`);
  console.log('─'.repeat(70));

  const buffer = readFileSync(pdfPath);
  const data = await pdf(buffer);
  console.log(`✓ ${data.text.length.toLocaleString()} chars, ${data.numpages} pages\n`);

  const startTime = Date.now();
  const metrics = await extractWithSmartMEGA(companyName, data.text, megaDictionary);
  const endTime = Date.now();

  if (!metrics) {
    return null;
  }

  const metricCount = Object.keys(metrics).filter(k => metrics[k] !== null && metrics[k] !== undefined).length;
  const improvement = metricCount - baselineMetrics;
  const improvementPct = Math.round((improvement / baselineMetrics) * 100);

  console.log(`\n✅ RESULTS:`);
  console.log(`   Baseline: ${baselineMetrics} metrics`);
  console.log(`   SMART MEGA: ${metricCount} metrics`);
  console.log(`   Improvement: ${improvement >= 0 ? '+' : ''}${improvement} (${improvement >= 0 ? '+' : ''}${improvementPct}%)`);
  console.log(`   Time: ${((endTime - startTime) / 1000).toFixed(1)}s`);

  const outputPath = resolve(process.cwd(), `data/extracted-production/smart-mega-${companyName.toLowerCase().replace(/\s+/g, '-')}.json`);
  const output = {
    company_name: companyName,
    extraction_method: 'smart_mega_dictionary_232_quantitative_only',
    baseline_141_code_metrics: baselineMetrics,
    smart_mega_metrics: metricCount,
    improvement: { absolute: improvement, percentage: improvementPct },
    extraction_time_seconds: ((endTime - startTime) / 1000).toFixed(1),
    metric_count: metricCount,
    metrics: metrics
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`💾 Saved`);

  return output;
}

async function main() {
  console.log('='.repeat(70));
  console.log('🧪 SMART MEGA DICTIONARY TEST (Quantitative Only)');
  console.log('='.repeat(70) + '\n');

  const megaDictPath = '/Users/pedro/Downloads/esrs_gri_dictionary_mega_20251023T202922Z.json';
  const megaDictionary: MEGADictionaryEntry[] = JSON.parse(readFileSync(megaDictPath, 'utf-8'));

  const quantCount = megaDictionary.filter(e => e.DataType === 'Quantitative').length;
  console.log(`✓ Loaded MEGA dictionary:`);
  console.log(`   Total: ${megaDictionary.length} entries`);
  console.log(`   Quantitative: ${quantCount} entries (FOCUS)`);
  console.log(`   Qualitative: ${megaDictionary.length - quantCount} entries (SKIP)`);
  console.log(`   Strategy: Extract ONLY numeric KPIs\n`);

  const testCases = [
    { name: 'SAP', pdf: '/tmp/sap.pdf', baseline: 207 },
    { name: 'Shell', pdf: '/tmp/shell-sustainability-report.pdf', baseline: 173 },
    { name: 'Carrefour', pdf: '/tmp/carrefour.pdf', baseline: 152 }
  ];

  const results = [];

  for (const testCase of testCases) {
    const result = await testCompany(testCase.name, testCase.pdf, testCase.baseline, megaDictionary);
    if (result) results.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 SMART MEGA TEST SUMMARY');
  console.log('='.repeat(70));

  const avgBaseline = results.reduce((sum, r) => sum + r.baseline_141_code_metrics, 0) / results.length;
  const avgSmart = results.reduce((sum, r) => sum + r.smart_mega_metrics, 0) / results.length;
  const avgImprovement = avgSmart - avgBaseline;
  const avgImprovementPct = Math.round((avgImprovement / avgBaseline) * 100);

  console.log(`\n📈 Average Results:`);
  console.log(`   Baseline (141-code): ${avgBaseline.toFixed(0)} metrics`);
  console.log(`   SMART MEGA (232 quant): ${avgSmart.toFixed(0)} metrics`);
  console.log(`   Improvement: ${avgImprovement >= 0 ? '+' : ''}${avgImprovement.toFixed(0)} (${avgImprovement >= 0 ? '+' : ''}${avgImprovementPct}%)`);

  console.log(`\n📋 Individual:`);
  results.forEach(r => {
    const symbol = r.improvement.percentage >= 20 ? '🚀' : r.improvement.percentage >= 0 ? '✅' : '❌';
    console.log(`   ${symbol} ${r.company_name}: ${r.baseline_141_code_metrics} → ${r.smart_mega_metrics} (${r.improvement.percentage >= 0 ? '+' : ''}${r.improvement.percentage}%)`);
  });

  console.log(`\n🎯 RECOMMENDATION:`);
  if (avgSmart >= 200) {
    console.log(`   🚀 SMART MEGA WINS! Use for production (${avgSmart.toFixed(0)} avg)`);
  } else if (avgSmart >= avgBaseline * 1.2) {
    console.log(`   ✅ SMART MEGA BETTER! +${avgImprovementPct}% improvement`);
  } else if (avgSmart > avgBaseline) {
    console.log(`   ⚠️  MARGINAL (+${avgImprovementPct}%). Test more companies.`);
  } else {
    console.log(`   ❌ NO IMPROVEMENT. Stick with 141-code.`);
  }

  console.log('\n' + '='.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
