import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';
import pdf from 'pdf-parse';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const deepseekApiKey = process.env.DEEPSEEK_API_KEY!;

const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

interface GRICode {
  code: string;
  category: string;
  topic: string;
  esrs_reference?: string;
}

interface KeywordDictionary {
  metadata: {
    total_codes: number;
    categories: number;
    search_keywords_count: number;
  };
  codes: GRICode[];
}

interface CompanyData {
  company: string;
  industry: string;
  website: string;
  pdf_url: string;
  notes?: string;
}

// IMPROVED JSON REPAIR (from successful retry script)
function repairJSON(jsonStr: string): any {
  console.log(`   🔧 Attempting advanced JSON repair...`);

  let repaired = jsonStr;

  // Step 1: Remove any text before first {
  const firstBrace = repaired.indexOf('{');
  if (firstBrace > 0) {
    repaired = repaired.substring(firstBrace);
  }

  // Step 2: Remove trailing commas
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Step 3: Fix unterminated strings
  repaired = repaired.replace(/:\s*"([^"]*?)$/gm, ': "$1"');

  // Step 4: Find last valid closing brace
  let braceCount = 0;
  let lastValidPos = -1;

  for (let i = 0; i < repaired.length; i++) {
    if (repaired[i] === '{') braceCount++;
    if (repaired[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        lastValidPos = i;
      }
    }
  }

  if (lastValidPos > 0) {
    repaired = repaired.substring(0, lastValidPos + 1);
  }

  // Step 5: Attempt parse
  try {
    return JSON.parse(repaired);
  } catch (e: any) {
    console.log(`   ⚠️  Basic repair failed: ${e.message}`);

    // Step 6: AGGRESSIVE REPAIR - Salvage what we can
    const keyValuePattern = /"([^"]+)":\s*("([^"]*)"|[\d.]+|true|false|null)/g;
    const matches = [...repaired.matchAll(keyValuePattern)];

    if (matches.length > 0) {
      const salvaged: any = {};
      for (const match of matches) {
        const key = match[1];
        let value = match[2];

        if (value.startsWith('"')) {
          value = value.slice(1, -1);
        } else if (value === 'true') {
          value = true;
        } else if (value === 'false') {
          value = false;
        } else if (value === 'null') {
          value = null;
        } else {
          value = parseFloat(value);
        }

        salvaged[key] = value;
      }

      if (Object.keys(salvaged).length > 20) {
        console.log(`   ✓ Salvaged ${Object.keys(salvaged).length} metrics via aggressive repair`);
        return salvaged;
      }
    }

    throw new Error('JSON repair failed - unable to salvage data');
  }
}

async function extractWithImprovedParsing(
  companyName: string,
  reportText: string,
  dictionary: KeywordDictionary
): Promise<any> {

  console.log(`🤖 Extracting metrics with improved JSON parsing...`);

  const maxLength = 250000;
  const textToAnalyze = reportText.length > maxLength
    ? reportText.substring(0, maxLength)
    : reportText;

  const categories = [...new Set(dictionary.codes.map(c => c.category))];
  const topicSample = dictionary.codes.slice(0, 20).map(c => `${c.code}: ${c.topic}`).join(', ');

  const prompt = `Extract ESG metrics from ${companyName}'s sustainability report using the 141-code GRI+ESRS dictionary.

DICTIONARY: ${dictionary.metadata.total_codes} GRI codes across ${categories.length} categories
SAMPLE CODES: ${topicSample}...

REPORT TEXT (${Math.round(textToAnalyze.length / 1000)}K chars):
${textToAnalyze}

EXTRACTION RULES:
1. Search for GRI Content Index or ESRS tables first
2. Extract ALL numeric values with GRI codes (GRI 305-1, GRI 2-7, etc.)
3. Look for: Scope 1/2/3 emissions, employees, water, waste, energy, safety metrics
4. Include year suffix: metric_2024, metric_2023
5. Include units in field name: emissions_tco2e, water_m3
6. Return FLAT JSON structure (no nested objects)
7. CRITICAL: Ensure ALL strings are properly closed with quotes
8. TARGET: 80-200 metrics

Return ONLY valid JSON with this exact format:
{
  "scope1_emissions_tco2e_2024": 12345,
  "scope2_emissions_tco2e_2024": 67890,
  "total_employees_2024": 50000,
  "women_workforce_percent_2024": 45.2
}`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a precise ESG data extraction expert. Return ONLY valid JSON. Ensure ALL strings are properly terminated with closing quotes. Use flat structure only.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.05, // Lower temperature for consistency
      max_tokens: 4000,
    });

    let content = response.choices[0].message.content!;

    // Try direct parse first
    try {
      const extracted = JSON.parse(content);
      console.log(`   ✓ JSON parsed successfully on first try`);
      return flattenObject(extracted);
    } catch (parseError: any) {
      console.log(`   ⚠️  Initial parse failed: ${parseError.message}`);
      const repaired = repairJSON(content);
      return flattenObject(repaired);
    }

  } catch (error: any) {
    console.error(`   ❌ Extraction failed: ${error.message}`);
    return null;
  }
}

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

async function downloadPDF(url: string, outputPath: string): Promise<boolean> {
  try {
    console.log(`   📥 Downloading PDF...`);
    const response = await fetch(url);

    if (!response.ok) {
      console.log(`   ❌ Download failed: ${response.status}`);
      return false;
    }

    const buffer = await response.arrayBuffer();
    writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`   ✓ Downloaded`);
    return true;
  } catch (error: any) {
    console.log(`   ❌ Download error: ${error.message}`);
    return false;
  }
}

async function processCompany(
  companyData: CompanyData,
  dictionary: KeywordDictionary,
  outputDir: string
): Promise<{ success: boolean; metricCount: number }> {

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 ${companyData.company}`);
  console.log(`   Industry: ${companyData.industry}`);
  console.log(`   PDF: ${companyData.pdf_url}`);
  console.log('─'.repeat(70));

  // Download or use cached PDF
  const cacheDir = '/tmp';
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  const sanitizedName = companyData.company.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const pdfPath = resolve(cacheDir, `${sanitizedName}.pdf`);

  let downloaded = false;
  if (existsSync(pdfPath)) {
    console.log(`   ✓ PDF already cached`);
  } else {
    downloaded = await downloadPDF(companyData.pdf_url, pdfPath);
    if (!downloaded) {
      return { success: false, metricCount: 0 };
    }
  }

  // Extract text
  console.log(`   📄 Extracting text from PDF...`);
  try {
    const buffer = readFileSync(pdfPath);
    const data = await pdf(buffer);
    console.log(`   ✓ ${data.text.length.toLocaleString()} chars from ${data.numpages} pages`);

    // Extract metrics
    const startTime = Date.now();
    const metrics = await extractWithImprovedParsing(companyData.company, data.text, dictionary);
    const endTime = Date.now();

    if (!metrics) {
      return { success: false, metricCount: 0 };
    }

    const metricCount = Object.keys(metrics).filter(k => metrics[k] !== null && metrics[k] !== undefined).length;

    console.log(`\n   ✅ Extracted ${metricCount} metrics in ${((endTime - startTime) / 1000).toFixed(1)}s`);

    // Save result
    const filename = `${sanitizedName}.json`;
    const outputPath = resolve(outputDir, filename);

    const output = {
      company_name: companyData.company,
      industry: companyData.industry,
      website: companyData.website,
      extraction_method: 'merged_ultimate_dictionary_141_codes_REPLACEMENT',
      replacement: true,
      report_metadata: {
        pages: data.numpages,
        characters: data.text.length,
        pdf_url: companyData.pdf_url
      },
      extraction_time_seconds: ((endTime - startTime) / 1000).toFixed(1),
      extracted_at: new Date().toISOString(),
      metric_count: metricCount,
      metrics: metrics
    };

    writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`   💾 Saved to: ${outputPath}`);

    return { success: true, metricCount };

  } catch (error: any) {
    console.log(`   ❌ Processing error: ${error.message}`);
    return { success: false, metricCount: 0 };
  }
}

async function main() {
  console.log('======================================================================');
  console.log('🔄 EXTRACTING V3 FINAL - 12 NEW COMPANIES (EXA-VERIFIED URLS)');
  console.log('======================================================================\n');

  // Load dictionary
  const dictionaryPath = resolve(process.cwd(), 'data/merged-ultimate-gri-dictionary.json');
  const dictionary: KeywordDictionary = JSON.parse(readFileSync(dictionaryPath, 'utf-8'));

  console.log(`✓ Loaded dictionary: ${dictionary.metadata.total_codes} codes\n`);

  // Load replacement companies (v3-new-only with Exa-verified URLs)
  const companiesPath = resolve(process.cwd(), 'data/replacement-companies-v3-new-only.json');
  const { companies } = JSON.parse(readFileSync(companiesPath, 'utf-8'));

  console.log(`📋 Processing ${companies.length} replacement companies\n`);

  const outputDir = resolve(process.cwd(), 'data/extracted-production');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const results: { name: string; metrics: number; status: string; }[] = [];

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    console.log(`[${i + 1}/${companies.length}]\n`);

    const result = await processCompany(company, dictionary, outputDir);

    results.push({
      name: company.company,
      metrics: result.metricCount,
      status: result.success ? 'success' : 'failed'
    });

    // Rate limiting
    if (i < companies.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 REPLACEMENT EXTRACTION SUMMARY');
  console.log('='.repeat(70));

  const successful = results.filter(r => r.status === 'success');
  const totalMetrics = successful.reduce((sum, r) => sum + r.metrics, 0);

  console.log(`\n✅ Successful: ${successful.length}/${companies.length}`);
  console.log(`📈 Total metrics: ${totalMetrics}`);
  console.log(`📊 Average per company: ${(totalMetrics / successful.length).toFixed(1)}`);

  console.log(`\n📋 Results:`);
  results.forEach(r => {
    const symbol = r.status === 'success' ? '✅' : '❌';
    console.log(`   ${symbol} ${r.name}: ${r.metrics} metrics`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('🎯 FINAL TOTALS:');
  console.log(`   Previous: 45 companies, 6,343 metrics`);
  console.log(`   New: +${successful.length} companies, +${totalMetrics} metrics`);
  console.log(`   GRAND TOTAL: ${45 + successful.length} companies, ${6343 + totalMetrics} metrics`);
  console.log('='.repeat(70) + '\n');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
