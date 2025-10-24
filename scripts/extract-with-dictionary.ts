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

interface KeywordDictionary {
  codes?: any[];
  gri_standards?: any[];
  esrs_standards?: any[];
  common_metrics?: any[];
  search_keywords?: string[];
}

async function extractWithDictionary(
  companyName: string,
  reportText: string,
  dictionary: KeywordDictionary
): Promise<any> {

  console.log(`🤖 Extracting with KEYWORD DICTIONARY strategy...\n`);

  // Build comprehensive keyword list
  const keywords: string[] = dictionary.search_keywords || [];
  const codes = dictionary.codes || [];

  console.log(`📚 Loaded dictionary:`);
  console.log(`   Total codes: ${codes.length}`);
  console.log(`   Search keywords: ${keywords.length}\n`);

  // Strategy: Use dictionary to guide extraction
  const maxLength = 250000;
  const textToAnalyze = reportText.length > maxLength
    ? reportText.substring(0, maxLength)
    : reportText;

  console.log(`Analyzing ${textToAnalyze.length.toLocaleString()} of ${reportText.length.toLocaleString()} characters\n`);

  // Build prompt with keyword guidance
  const keywordExamples = codes.slice(0, 15).map(c => c.code).join(', ');

  const prompt = `You are extracting sustainability metrics from a report using a STANDARDIZED KEYWORD DICTIONARY.

COMPANY: ${companyName}

STANDARD KEYWORDS TO SEARCH FOR:
${keywordExamples}
... and ${keywords.length - 20} more standard keywords

REPORT TEXT:
${textToAnalyze}

EXTRACTION STRATEGY:

1. **Search for GRI codes** (e.g., "GRI 305-1", "GRI 2-7", "GRI 303-3")
   - When found, extract the associated numeric value and unit
   - Example: "GRI 305-1: 3,128,177 tonCO2e" → scope1_emissions_tonco2e: 3128177

2. **Search for ESRS codes** (e.g., "ESRS E1", "ESRS E2-5")
   - Extract datapoint values and units
   - Example: "ESRS E1-1: Scope 1 emissions 50,000 tCO2e" → scope1_emissions_tonco2e: 50000

3. **Search for standard metric names:**
   - "Scope 1 emissions", "Scope 2 emissions", "Scope 3 emissions"
   - "Total employees", "Female employees", "Male employees"
   - "Water consumption", "Water withdrawal", "Waste generated"
   - "LTIF", "TRIR", "Fatalities", "Recordable injuries"
   - "Energy consumption", "Renewable energy %"

4. **Extract from tables with these column headers:**
   - "2024", "2023", "2022" (year columns)
   - "tonCO2e", "tCO2e", "GJ", "MWh", "m3", "tonnes", "kg"
   - "Scope 1", "Scope 2", "Scope 3"
   - "Male", "Female", "Total"

5. **Look for Annex/Appendix sections:**
   - Tables labeled "Key performance indicators"
   - "Performance data", "Sustainability data", "ESG metrics"
   - "GRI Content Index" references with page numbers

CRITICAL RULES:
- Use dictionary keywords as search terms
- Extract ALL numeric values associated with standard keywords
- Include year suffix if multi-year: metric_2024, metric_2023
- Flatten nested data: scope1_upstream, scope1_industrial
- Keep units in field name: energy_consumption_gj, water_withdrawal_m3
- Return ONLY valid JSON with numeric values

Expected: 40-80 metrics from any document (small or large) using keyword matching.
`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: 'Extract sustainability metrics using standardized keyword dictionary. Return ONLY valid JSON.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 4000,
  });

  const content = response.choices[0].message.content!;
  const extracted = JSON.parse(content);

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

  const flatData = flattenObject(extracted);
  return flatData;
}

async function main() {
  // Load dictionary
  const dictPath = resolve(process.cwd(), 'data/standard-keyword-dictionary.json');
  console.log('======================================================================');
  console.log('📚 KEYWORD DICTIONARY-BASED EXTRACTION TEST');
  console.log('======================================================================\n');

  if (!readFileSync(dictPath)) {
    console.log('❌ Dictionary not found. Run build-keyword-dictionary.ts first.');
    process.exit(1);
  }

  const dictionary: KeywordDictionary = JSON.parse(readFileSync(dictPath, 'utf-8'));
  console.log(`✓ Loaded dictionary: ${(dictionary.codes || []).length} total codes\n`);

  // Test on Galp narrative (was 61 metrics without dictionary, expect similar or better with dictionary guidance)
  const testFile = '/tmp/galp-analysis.pdf';
  const companyName = 'Galp Narrative (TEST - was 61 metrics, testing dictionary method)';

  console.log(`📊 ${companyName}`);
  console.log('─'.repeat(70) + '\n');

  // Extract text
  console.log('📄 Extracting text from PDF...');
  const buffer = readFileSync(testFile);
  const data = await pdf(buffer);
  console.log(`   ✓ ${data.text.length.toLocaleString()} chars from ${data.numpages} pages\n`);

  // Extract with dictionary
  const metrics = await extractWithDictionary(companyName, data.text, dictionary);

  const metricCount = Object.keys(metrics).filter(k => metrics[k] !== null && metrics[k] !== undefined).length;

  console.log(`\n✓ Extracted ${metricCount} metrics\n`);

  // Save result
  const outputPath = resolve(process.cwd(), 'data/extracted/shell-dictionary-test.json');
  const baseline = 61; // Galp narrative baseline
  const output = {
    company_name: companyName,
    extraction_method: 'keyword_dictionary',
    previous_result: `${baseline} metrics without dictionary`,
    new_result: `${metricCount} metrics with dictionary strategy`,
    improvement: metricCount >= baseline ? `+${metricCount - baseline} metrics` : `${metricCount - baseline} metrics`,
    extracted_at: new Date().toISOString(),
    metric_count: metricCount,
    metrics: metrics
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`💾 Saved to: ${outputPath}`);

  // Show sample
  console.log('\n📋 Sample metrics:');
  Object.keys(metrics).slice(0, 15).forEach(key => {
    if (metrics[key] !== null && metrics[key] !== undefined) {
      console.log(`   ${key}: ${metrics[key]}`);
    }
  });
  if (metricCount > 15) {
    console.log(`   ... and ${metricCount - 15} more`);
  }

  // Results
  console.log('\n📊 RESULTS:');
  console.log('─'.repeat(70));
  console.log(`   Previous (no dictionary):  ${baseline} metrics`);
  console.log(`   New (with dictionary):     ${metricCount} metrics`);
  if (metricCount > baseline) {
    console.log(`   ✅ IMPROVEMENT: +${metricCount - baseline} metrics (+${(((metricCount / baseline) - 1) * 100).toFixed(0)}%)`);
  } else if (metricCount === baseline) {
    console.log(`   ✅ CONSISTENT: Dictionary method matches baseline`);
  } else {
    console.log(`   ⚠️  Lower than baseline: ${metricCount - baseline} metrics`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
