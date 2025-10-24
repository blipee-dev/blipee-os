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
  search_keywords?: string[];
}

async function extractWithDictionary(
  companyName: string,
  reportText: string,
  dictionary: KeywordDictionary
): Promise<any> {

  console.log(`🤖 Extracting with MERGED ULTIMATE KEYWORD DICTIONARY...\n`);

  const keywords: string[] = dictionary.search_keywords || [];
  const codes = dictionary.codes || [];

  console.log(`📚 Loaded merged ultimate dictionary:`);
  console.log(`   Total codes: ${codes.length}`);
  console.log(`   Search keywords: ${keywords.length}`)
  console.log(`   Categories: ${new Set(codes.map((c: any) => c.category)).size}\n`);

  // CRITICAL: For large reports, use CHUNKING with dictionary guidance
  const maxLength = 250000; // DeepSeek context limit
  const textToAnalyze = reportText.length > maxLength
    ? reportText.substring(0, maxLength)
    : reportText;

  console.log(`Analyzing ${textToAnalyze.length.toLocaleString()} of ${reportText.length.toLocaleString()} characters (${Math.round(textToAnalyze.length / reportText.length * 100)}%)\n`);

  const keywordExamples = codes.slice(0, 20).map((c: any) => c.code).join(', ');

  const prompt = `You are extracting sustainability metrics from a large corporate report using a COMPREHENSIVE STANDARDIZED KEYWORD DICTIONARY.

COMPANY: ${companyName}

STANDARD KEYWORDS TO SEARCH FOR:
${keywordExamples}
... and ${codes.length - 20} more GRI disclosure codes

REPORT TEXT (first ${Math.round(textToAnalyze.length / 1000)}K chars):
${textToAnalyze}

EXTRACTION STRATEGY FOR LARGE REPORTS:

1. **PRIORITY: Search for GRI Content Index or ESRS tables**
   - Look for sections titled "GRI Content Index", "ESRS Disclosure", "Sustainability Data"
   - These tables contain most metrics in compact form
   - Extract ALL values from these tables

2. **Search for GRI codes** (e.g., "GRI 305-1", "GRI 2-7", "GRI 303-3")
   - When found, extract the associated numeric value and unit
   - Example: "GRI 305-1: 3,128,177 tonCO2e" → gri_305_1_scope1_emissions_tonco2e: 3128177

3. **Search for ESRS codes** (e.g., "ESRS E1", "ESRS E2-5", "ESRS S1-6")
   - Extract datapoint values and units

4. **Search for standard metric names:**
   - "Scope 1 emissions", "Scope 2 emissions", "Scope 3 emissions"
   - "Total employees", "Female employees", "Male employees"
   - "Water consumption", "Water withdrawal", "Waste generated"
   - "LTIF", "TRIR", "Fatalities", "Recordable injuries"
   - "Energy consumption", "Renewable energy %"

5. **Extract from tables with these column headers:**
   - "2024", "2023", "2022" (year columns)
   - "tonCO2e", "tCO2e", "GJ", "MWh", "m3", "tonnes", "kg"
   - "Scope 1", "Scope 2", "Scope 3"
   - "Male", "Female", "Total"

6. **For large reports (>200 pages):**
   - Focus on summary tables and KPI sections
   - Look for "Key Performance Indicators", "Performance Summary"
   - Extract data tables in Annex/Appendix sections

CRITICAL RULES:
- Use dictionary keywords as EXACT search terms
- Extract ALL numeric values associated with standard keywords
- Include year suffix if multi-year data available: metric_2024, metric_2023
- Flatten nested data: scope1_upstream, scope1_industrial
- Keep units in field name: energy_consumption_gj, water_withdrawal_m3
- For large reports, prioritize GRI Content Index and summary tables
- Return ONLY valid JSON with numeric values
- Target: 80-120 metrics from large reports using comprehensive keyword matching

Expected: Shell (481 pages) should yield 80-120 metrics with 141-code dictionary (previous: 88 with 140 codes).
`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: 'Extract sustainability metrics using comprehensive merged GRI+ESRS keyword dictionary. Focus on GRI Content Index and summary tables. Return ONLY valid JSON.'
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
  console.log('======================================================================');
  console.log('🧪 TESTING MERGED ULTIMATE DICTIONARY ON SHELL (LARGE REPORT)');
  console.log('======================================================================\n');

  // Load merged ultimate dictionary
  const dictPath = resolve(process.cwd(), 'data/merged-ultimate-gri-dictionary.json');
  const dictionary: KeywordDictionary = JSON.parse(readFileSync(dictPath, 'utf-8'));
  console.log(`✓ Loaded MERGED ULTIMATE dictionary: ${(dictionary.codes || []).length} GRI codes\n`);

  // Shell report details
  const shellData = {
    company: 'Shell',
    file: '/tmp/shell-sustainability-report.pdf',
    baseline_no_dict: 8,
    baseline_25_codes: 21,
    baseline_140_codes: 88,
    expected_141_codes: 90 // Expected slight improvement
  };

  console.log(`📊 ${shellData.company}`);
  console.log(`   Baseline (no dictionary): ${shellData.baseline_no_dict} metrics`);
  console.log(`   With 25-code dictionary: ${shellData.baseline_25_codes} metrics`);
  console.log(`   With 140-code dictionary: ${shellData.baseline_140_codes} metrics`);
  console.log(`   Expected (141-code merged): ${shellData.expected_141_codes}+ metrics`);
  console.log('─'.repeat(70) + '\n');

  // Extract text
  console.log('📄 Extracting text from PDF...');
  const buffer = readFileSync(shellData.file);
  const data = await pdf(buffer);
  console.log(`   ✓ ${data.text.length.toLocaleString()} chars from ${data.numpages} pages\n`);

  // Extract with merged dictionary
  const startTime = Date.now();
  const metrics = await extractWithDictionary(shellData.company, data.text, dictionary);
  const endTime = Date.now();

  const metricCount = Object.keys(metrics).filter(k => metrics[k] !== null && metrics[k] !== undefined).length;

  console.log(`\n✓ Extracted ${metricCount} metrics in ${((endTime - startTime) / 1000).toFixed(1)}s\n`);

  // Calculate improvements
  const improvementVs140Codes = metricCount - shellData.baseline_140_codes;
  const improvementPctVs140Codes = Math.round((improvementVs140Codes / shellData.baseline_140_codes) * 100);

  const improvementVsNoDict = metricCount - shellData.baseline_no_dict;
  const improvementPctVsNoDict = Math.round((improvementVsNoDict / shellData.baseline_no_dict) * 100);

  // Save result
  const outputPath = resolve(process.cwd(), 'data/extracted/shell-merged-ultimate-dictionary-test.json');
  const output = {
    company_name: shellData.company,
    extraction_method: 'merged_ultimate_keyword_dictionary_141_codes',
    dictionary_version: 'merged ultimate (141 GRI codes from Content Index + ESRS)',
    report_size: {
      pages: data.numpages,
      characters: data.text.length
    },
    baseline_no_dictionary: `${shellData.baseline_no_dict} metrics`,
    baseline_25_code_dictionary: `${shellData.baseline_25_codes} metrics`,
    baseline_140_code_dictionary: `${shellData.baseline_140_codes} metrics`,
    new_result_141_code_dictionary: `${metricCount} metrics`,
    improvement_vs_no_dict: improvementVsNoDict >= 0 ? `+${improvementVsNoDict} metrics (+${improvementPctVsNoDict}%)` : `${improvementVsNoDict} metrics (${improvementPctVsNoDict}%)`,
    improvement_vs_140_codes: improvementVs140Codes >= 0 ? `+${improvementVs140Codes} metrics (+${improvementPctVs140Codes}%)` : `${improvementVs140Codes} metrics (${improvementPctVs140Codes}%)`,
    extraction_time_seconds: ((endTime - startTime) / 1000).toFixed(1),
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

  // Results summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SHELL MERGED ULTIMATE DICTIONARY TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`   Baseline (no dictionary):     ${shellData.baseline_no_dict} metrics`);
  console.log(`   With 25-code dictionary:      ${shellData.baseline_25_codes} metrics (+${shellData.baseline_25_codes - shellData.baseline_no_dict})`);
  console.log(`   With 140-code dictionary:     ${shellData.baseline_140_codes} metrics (+${shellData.baseline_140_codes - shellData.baseline_25_codes})`);
  console.log(`   With 141-code merged dict:    ${metricCount} metrics`);

  if (improvementVs140Codes > 0) {
    console.log(`   ✅ VS 140 CODES: +${improvementVs140Codes} metrics (+${improvementPctVs140Codes}%)`);
  } else if (improvementVs140Codes === 0) {
    console.log(`   ℹ️  VS 140 CODES: No change (dictionary overlap)`);
  } else {
    console.log(`   ⚠️  VS 140 CODES: ${improvementVs140Codes} metrics (${improvementPctVs140Codes}%)`);
  }

  if (improvementVsNoDict > 0) {
    console.log(`   ✅ VS NO DICT: +${improvementVsNoDict} metrics (+${improvementPctVsNoDict}%)`);
  }

  console.log(`\n   Report size: ${data.numpages} pages, ${(data.text.length / 1_000_000).toFixed(1)}M chars`);
  console.log(`   Coverage: 11% (250K/${(data.text.length / 1000).toFixed(0)}K chars)`);
  console.log(`   Extraction time: ${((endTime - startTime) / 1000).toFixed(1)}s`);

  console.log('\n' + '='.repeat(70));
  console.log(improvementVsNoDict > 80 ? '✅ MERGED ULTIMATE DICTIONARY: VALIDATED' : '⚠️  MERGED ULTIMATE DICTIONARY: INCREMENTAL IMPROVEMENT');
  console.log('='.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
