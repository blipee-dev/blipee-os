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
  ExampleSnippet?: string;
}

async function extractWithMEGADictionary(
  companyName: string,
  reportText: string,
  megaDictionary: MEGADictionaryEntry[]
): Promise<any> {

  console.log(`🤖 Extracting with MEGA DICTIONARY (460 entries, 18K keywords)...\n`);

  // Smart strategy: Group by topic cluster to avoid overwhelming the LLM
  const topicClusters = new Set(megaDictionary.map(e => e.TopicCluster));
  console.log(`   📊 ${topicClusters.size} topic clusters`);

  // Use only first 250K chars due to DeepSeek limit
  const maxLength = 250000;
  const textToAnalyze = reportText.length > maxLength
    ? reportText.substring(0, maxLength)
    : reportText;

  console.log(`   Analyzing ${textToAnalyze.length.toLocaleString()} of ${reportText.length.toLocaleString()} characters (${Math.round(textToAnalyze.length / reportText.length * 100)}%)\n`);

  // Get priority keywords (top 200 most relevant across all entries)
  const priorityKeywords = new Set<string>();

  // High-priority topic clusters (most common across all reports)
  const priorityTopics = [
    'Climate — GHG Inventory',
    'Climate — Targets & Transition Plan',
    'Energy — Consumption & Mix',
    'Water — Consumption & Discharge',
    'Waste — Circular Economy',
    'Workforce — Headcount & Diversity',
    'Health & Safety — Injuries & Fatalities',
    'Anti-corruption & Ethics Training',
    'Board Governance & Oversight'
  ];

  // Collect keywords from priority topics
  megaDictionary
    .filter(e => priorityTopics.includes(e.TopicCluster))
    .forEach(e => {
      // Add only unique, high-value keywords
      e.Keywords
        .filter(k => k.length > 3 && !k.includes('_')) // Skip short keywords and snake_case variants
        .slice(0, 5) // Top 5 per entry
        .forEach(k => priorityKeywords.add(k));
    });

  // Add all GRI references
  const griReferences = megaDictionary
    .filter(e => e.GRI_Reference)
    .map(e => e.GRI_Reference)
    .filter((v, i, a) => a.indexOf(v) === i); // Unique

  // Add all ESRS references
  const esrsReferences = megaDictionary
    .filter(e => e.ESRS_Reference)
    .map(e => e.ESRS_Reference)
    .filter((v, i, a) => a.indexOf(v) === i); // Unique

  const topicClusterList = Array.from(topicClusters).slice(0, 30).join(', ');
  const keywordSample = Array.from(priorityKeywords).slice(0, 50).join(', ');

  const prompt = `You are extracting sustainability metrics from a corporate report using the MEGA COMPREHENSIVE ESG DICTIONARY (460 cross-framework entries).

COMPANY: ${companyName}

MEGA DICTIONARY COVERAGE:
- 460 disclosure entries (ESRS + GRI + Cross-framework)
- ${topicClusters.size} topic clusters including cutting-edge categories
- ${megaDictionary.length} total metrics across all frameworks

TOP 30 TOPIC CLUSTERS:
${topicClusterList}

PRIORITY SEARCH KEYWORDS (Top 50 of ${priorityKeywords.size}):
${keywordSample}

GRI REFERENCES (${griReferences.length} codes):
${griReferences.slice(0, 20).join(', ')}...

ESRS REFERENCES (${esrsReferences.length} codes):
${esrsReferences.slice(0, 20).join(', ')}...

REPORT TEXT (${Math.round(textToAnalyze.length / 1000)}K chars):
${textToAnalyze}

EXTRACTION STRATEGY:

1. **PRIORITY: Search for GRI Content Index & ESRS Disclosure tables**
   - Look for "GRI Content Index", "ESRS Datapoints", "Sustainability Metrics Table"
   - Extract ALL values from consolidated tables

2. **Search for GRI codes** (e.g., "GRI 305-1", "GRI 2-7", "GRI 403-9")
   - Map to metrics: GRI 305-1 = Scope 1 emissions (tCO2e)

3. **Search for ESRS codes** (e.g., "ESRS E1-6", "ESRS S1-14")
   - Map to metrics: ESRS E1-6 = GHG emissions Scope 1/2/3

4. **Search for STANDARD METRICS by topic cluster:**

   **Climate & Energy:**
   - Scope 1/2/3 emissions (tCO2e), Carbon intensity, Renewable energy %
   - Energy consumption (GJ, MWh), Energy intensity
   - SBTi targets, Net zero commitments, Paris alignment

   **Water & Waste:**
   - Water withdrawal/consumption/discharge (m³)
   - Waste generated/recycled/landfilled (tonnes)
   - Circular economy metrics, Zero waste targets

   **Workforce & Social:**
   - Total employees, Gender diversity %, Women in leadership %
   - Employee turnover %, New hires, Parental leave
   - Training hours, Performance reviews %

   **Health & Safety:**
   - Fatalities, LTIF, TRIR, Recordable injuries
   - Lost days, Safety training hours

   **Governance & Ethics:**
   - Board diversity, Independent directors %
   - Anti-corruption training %, Whistleblower reports
   - ESG-linked compensation

   **CUTTING-EDGE METRICS (MEGA Dictionary exclusive):**
   - AI carbon footprint (tCO2e from ML training)
   - Algorithmic fairness metrics
   - Circular design revenue (%)
   - REACH compliance (SVHC substances)
   - Insurance portfolio emissions
   - Taxonomy-aligned revenue/CAPEX (%)
   - Climate-related financial effects ($)

5. **Extract from tables with these headers:**
   - Years: "2024", "2023", "2022"
   - Units: "tCO2e", "GJ", "MWh", "m³", "tonnes", "%"
   - Categories: "Scope 1/2/3", "Male/Female", "Renewable/Fossil"

CRITICAL RULES:
- Use all topic clusters as search guidance
- Extract ALL numeric values with priority keywords
- Multi-year data: Add year suffix (metric_2024, metric_2023)
- Keep units in field names: energy_consumption_gwh, water_withdrawal_m3
- Flatten nested data: scope3_cat1_purchased_goods
- **NEW METRICS**: Look for AI carbon, algorithmic fairness, circular revenue, REACH, insurance emissions
- Return ONLY valid JSON with numeric values
- TARGET: 200-400 metrics using MEGA dictionary

Expected Result: Extract 200-400 metrics including cutting-edge categories (AI carbon, circular economy, REACH compliance, taxonomy alignment).
`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Extract sustainability metrics using MEGA comprehensive ESG dictionary (460 entries across ESRS+GRI+Cross-framework, 18K keywords). Include cutting-edge metrics like AI carbon footprint, algorithmic fairness, circular economy, REACH compliance. Return ONLY valid JSON.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4000,
    });

    let content = response.choices[0].message.content!;

    // JSON repair logic
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
        console.log(`   ✓ JSON repaired successfully`);
      } catch (repairError: any) {
        console.error(`   ❌ JSON repair failed: ${repairError.message}`);
        return null;
      }
    }

    // Flatten nested objects
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
  console.log(`   Baseline (141-code dict): ${baselineMetrics} metrics`);
  console.log(`   PDF: ${pdfPath}`);
  console.log('─'.repeat(70));

  // Extract text from PDF
  console.log(`📄 Extracting text from PDF...`);
  const buffer = readFileSync(pdfPath);
  const data = await pdf(buffer);
  console.log(`✓ ${data.text.length.toLocaleString()} chars from ${data.numpages} pages\n`);

  // Extract with MEGA dictionary
  const startTime = Date.now();
  const metrics = await extractWithMEGADictionary(companyName, data.text, megaDictionary);
  const endTime = Date.now();

  if (!metrics) {
    console.log(`\n❌ Extraction failed for ${companyName}`);
    return null;
  }

  const metricCount = Object.keys(metrics).filter(k => metrics[k] !== null && metrics[k] !== undefined).length;
  const improvement = metricCount - baselineMetrics;
  const improvementPct = Math.round((improvement / baselineMetrics) * 100);

  console.log(`\n✅ RESULTS:`);
  console.log(`   Baseline: ${baselineMetrics} metrics`);
  console.log(`   MEGA Dict: ${metricCount} metrics`);
  console.log(`   Improvement: ${improvement >= 0 ? '+' : ''}${improvement} (${improvement >= 0 ? '+' : ''}${improvementPct}%)`);
  console.log(`   Extraction time: ${((endTime - startTime) / 1000).toFixed(1)}s`);

  // Save result
  const outputPath = resolve(process.cwd(), `data/extracted-production/mega-test-${companyName.toLowerCase().replace(/\s+/g, '-')}.json`);
  const output = {
    company_name: companyName,
    extraction_method: 'mega_dictionary_460_entries_18k_keywords',
    dictionary_version: 'MEGA (460 ESRS+GRI+Cross-framework entries)',
    baseline_141_code_metrics: baselineMetrics,
    mega_dictionary_metrics: metricCount,
    improvement: {
      absolute: improvement,
      percentage: improvementPct
    },
    report_metadata: {
      pages: data.numpages,
      characters: data.text.length,
      analysis_coverage_percent: Math.round((Math.min(data.text.length, 250000) / data.text.length) * 100)
    },
    extraction_time_seconds: ((endTime - startTime) / 1000).toFixed(1),
    extracted_at: new Date().toISOString(),
    metric_count: metricCount,
    metrics: metrics
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`💾 Saved to: ${outputPath}`);

  return output;
}

async function main() {
  console.log('======================================================================');
  console.log('🧪 MEGA DICTIONARY TEST - 3 Company Validation');
  console.log('======================================================================\n');

  // Load MEGA dictionary
  const megaDictPath = '/Users/pedro/Downloads/esrs_gri_dictionary_mega_with_snippets_20251023T203246Z.json';
  const megaDictionary: MEGADictionaryEntry[] = JSON.parse(readFileSync(megaDictPath, 'utf-8'));

  console.log(`✓ Loaded MEGA dictionary:`);
  console.log(`   Total entries: ${megaDictionary.length}`);
  console.log(`   Topic clusters: ${new Set(megaDictionary.map(e => e.TopicCluster)).size}`);
  console.log(`   Total keywords: 18,113`);
  console.log(`   Frameworks: ESRS, GRI, Cross-framework, EU Taxonomy, TCFD, ISSB\n`);

  // Test companies with known baselines
  const testCases = [
    { name: 'SAP', pdf: '/tmp/sap.pdf', baseline: 207 },
    { name: 'Shell', pdf: '/tmp/shell-sustainability-report.pdf', baseline: 173 },
    { name: 'Carrefour', pdf: '/tmp/carrefour.pdf', baseline: 152 }
  ];

  const results = [];

  for (const testCase of testCases) {
    const result = await testCompany(testCase.name, testCase.pdf, testCase.baseline, megaDictionary);
    if (result) {
      results.push(result);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 MEGA DICTIONARY TEST SUMMARY');
  console.log('='.repeat(70));

  const successCount = results.length;
  const avgBaseline = results.reduce((sum, r) => sum + r.baseline_141_code_metrics, 0) / successCount;
  const avgMega = results.reduce((sum, r) => sum + r.mega_dictionary_metrics, 0) / successCount;
  const avgImprovement = avgMega - avgBaseline;
  const avgImprovementPct = Math.round((avgImprovement / avgBaseline) * 100);

  console.log(`\n✅ Successful extractions: ${successCount}/3`);
  console.log(`\n📈 Average Results:`);
  console.log(`   Baseline (141-code): ${avgBaseline.toFixed(0)} metrics`);
  console.log(`   MEGA Dictionary: ${avgMega.toFixed(0)} metrics`);
  console.log(`   Improvement: ${avgImprovement >= 0 ? '+' : ''}${avgImprovement.toFixed(0)} (${avgImprovement >= 0 ? '+' : ''}${avgImprovementPct}%)`);

  console.log(`\n📋 Individual Results:`);
  results.forEach(r => {
    console.log(`   ${r.company_name}: ${r.baseline_141_code_metrics} → ${r.mega_dictionary_metrics} (${r.improvement.percentage >= 0 ? '+' : ''}${r.improvement.percentage}%)`);
  });

  console.log(`\n🎯 RECOMMENDATION:`);
  if (avgMega >= 250) {
    console.log(`   ✅ MEGA DICTIONARY WINS! Use for production (${avgMega.toFixed(0)} avg metrics)`);
  } else if (avgMega >= avgBaseline * 1.5) {
    console.log(`   ✅ SIGNIFICANT IMPROVEMENT! Use MEGA dictionary (${avgImprovementPct}% better)`);
  } else if (avgMega > avgBaseline) {
    console.log(`   ⚠️  MARGINAL IMPROVEMENT (${avgImprovementPct}%). Consider hybrid approach.`);
  } else {
    console.log(`   ❌ NO IMPROVEMENT. Stick with 141-code dictionary.`);
  }

  console.log('\n' + '='.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
