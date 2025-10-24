import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';
import pdf from 'pdf-parse';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

config({ path: resolve(process.cwd(), '.env.local') });

const deepseekApiKey = process.env.DEEPSEEK_API_KEY!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

const supabase = createClient(supabaseUrl, supabaseKey);

interface KeywordDictionary {
  metadata?: any;
  codes?: any[];
  search_keywords?: string[];
}

interface CompanyData {
  company: string;
  industry: string;
  website: string;
  pdf_url: string;
}

async function extractWithUltimateDictionary(
  companyName: string,
  reportText: string,
  dictionary: KeywordDictionary
): Promise<any> {

  const keywords: string[] = dictionary.search_keywords || [];
  const codes = dictionary.codes || [];

  // Use only first 250K chars due to DeepSeek limit
  const maxLength = 250000;
  const textToAnalyze = reportText.length > maxLength
    ? reportText.substring(0, maxLength)
    : reportText;

  const keywordExamples = codes.slice(0, 20).map((c: any) => c.code).join(', ');

  const prompt = `You are extracting sustainability metrics from a corporate report using the ULTIMATE COMPREHENSIVE GRI+ESRS KEYWORD DICTIONARY.

COMPANY: ${companyName}

ULTIMATE DICTIONARY (141 GRI codes + 232 keywords + 17 categories):
${keywordExamples}
... and ${codes.length - 20} more GRI disclosure codes with ESRS cross-references

REPORT TEXT (${Math.round(textToAnalyze.length / 1000)}K chars):
${textToAnalyze}

EXTRACTION STRATEGY:

1. **PRIORITY: Search for GRI Content Index or ESRS tables**
   - Sections: "GRI Content Index", "ESRS Disclosure", "Sustainability Data Table"
   - Extract ALL values from these consolidated tables

2. **Search for GRI codes** (e.g., "GRI 305-1", "GRI 2-7", "GRI 403-9")
   - When found, extract numeric value and unit
   - Example: "GRI 305-1: 58 million tonCO2e" → gri_305_1_scope1_emissions_tonco2e: 58000000

3. **Search for ESRS codes** (e.g., "ESRS E1-6", "ESRS S1-14")
   - Map to GRI equivalents using cross-references

4. **Search for standard metric names**:
   - Emissions: "Scope 1", "Scope 2", "Scope 3", "Carbon intensity", "GHG emissions"
   - Employees: "Total employees", "Employee count", "Workforce", "Headcount"
   - Water: "Water consumption", "Water withdrawal", "Water discharge", "Water recycled"
   - Waste: "Waste generated", "Waste disposed", "Waste recycled", "Hazardous waste"
   - Safety: "LTIF", "TRIR", "Fatalities", "Recordable injuries", "Lost time injuries"
   - Energy: "Energy consumption", "Renewable energy", "Electricity use"
   - Diversity: "Women in management", "Gender pay gap", "Board diversity"
   - Training: "Training hours", "Training days", "Employee development"

5. **Extract from tables with column headers**:
   - Years: "2024", "2023", "2022"
   - Units: "tonCO2e", "tCO2e", "GJ", "MWh", "m3", "tonnes", "kg", "%"
   - Categories: "Scope 1/2/3", "Male/Female/Total"

CRITICAL RULES:
- Use ALL 141 GRI codes as search terms
- Extract ALL numeric values with standard keywords
- Multi-year data: Add year suffix (metric_2024, metric_2023)
- Keep units in field names: water_withdrawal_m3, energy_consumption_gwh
- Flatten nested data: scope3_category1_purchased_goods
- Return ONLY valid JSON
- TARGET: 80-180 metrics per report

Expected: Extract 80-180 metrics using comprehensive 141-code dictionary with ESRS cross-references.
`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Extract sustainability metrics using ultimate comprehensive GRI+ESRS dictionary (141 codes, 232 keywords, 17 categories). Return ONLY valid JSON with numeric values. CRITICAL: Ensure all strings are properly closed with quotes.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4000,
    });

    let content = response.choices[0].message.content!;

    // Try to repair common JSON issues
    try {
      // First attempt: parse as-is
      var extracted = JSON.parse(content);
    } catch (parseError: any) {
      console.log(`   ⚠️  JSON parse error, attempting repair...`);

      // Remove trailing commas before closing braces/brackets
      content = content.replace(/,(\s*[}\]])/g, '$1');

      // Try to fix unterminated strings by adding closing quote before newline
      content = content.replace(/: "([^"]*?)$/gm, ': "$1"');

      // Truncate at last valid closing brace if malformed
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

async function uploadToSupabase(companyData: CompanyData, metrics: any, reportMetadata: any) {
  try {
    const { data, error } = await supabase
      .from('competitor_esg_data')
      .upsert({
        company_name: companyData.company,
        industry: companyData.industry,
        website: companyData.website,
        metrics: metrics,
        reports_published: {
          latest_report: {
            url: companyData.pdf_url,
            pages: reportMetadata.pages,
            characters: reportMetadata.characters,
            extracted_at: new Date().toISOString(),
            extraction_method: 'merged_ultimate_dictionary_141_codes',
            metric_count: Object.keys(metrics).filter(k => metrics[k] !== null).length
          }
        },
        last_updated: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_name',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`   ❌ Supabase upload failed: ${error.message}`);
      return false;
    }

    console.log(`   ✓ Uploaded to Supabase`);
    return true;
  } catch (error: any) {
    console.error(`   ❌ Supabase upload error: ${error.message}`);
    return false;
  }
}

async function processCompany(
  companyData: CompanyData,
  dictionary: KeywordDictionary,
  outputDir: string,
  uploadToDb: boolean = false
): Promise<{ success: boolean; metricCount: number }> {

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 ${companyData.company}`);
  console.log(`   Industry: ${companyData.industry}`);
  console.log(`   PDF: ${companyData.pdf_url}`);
  console.log('─'.repeat(70));

  // Download PDF to temp location
  const pdfPath = `/tmp/${companyData.company.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;

  if (!existsSync(pdfPath)) {
    console.log(`   📥 Downloading PDF...`);
    try {
      const response = await fetch(companyData.pdf_url);
      if (!response.ok) {
        console.error(`   ❌ Download failed: ${response.status}`);
        return { success: false, metricCount: 0 };
      }
      const buffer = await response.arrayBuffer();
      writeFileSync(pdfPath, Buffer.from(buffer));
      console.log(`   ✓ Downloaded`);
    } catch (error: any) {
      console.error(`   ❌ Download error: ${error.message}`);
      return { success: false, metricCount: 0 };
    }
  } else {
    console.log(`   ✓ PDF already cached`);
  }

  // Extract text from PDF
  console.log(`   📄 Extracting text from PDF...`);
  try {
    const buffer = readFileSync(pdfPath);
    const data = await pdf(buffer);
    console.log(`   ✓ ${data.text.length.toLocaleString()} chars from ${data.numpages} pages`);

    // Extract metrics with ultimate dictionary
    console.log(`   🤖 Extracting metrics with ultimate dictionary...`);
    const startTime = Date.now();
    const metrics = await extractWithUltimateDictionary(companyData.company, data.text, dictionary);
    const endTime = Date.now();

    if (!metrics) {
      return { success: false, metricCount: 0 };
    }

    const metricCount = Object.keys(metrics).filter(k => metrics[k] !== null && metrics[k] !== undefined).length;
    console.log(`   ✓ Extracted ${metricCount} metrics in ${((endTime - startTime) / 1000).toFixed(1)}s`);

    // Save to file
    const outputPath = resolve(outputDir, `${companyData.company.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`);
    const output = {
      company_name: companyData.company,
      industry: companyData.industry,
      website: companyData.website,
      extraction_method: 'merged_ultimate_dictionary_141_codes',
      dictionary_version: 'merged ultimate (141 GRI codes + ESRS)',
      report_metadata: {
        pdf_url: companyData.pdf_url,
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
    console.log(`   💾 Saved to: ${outputPath}`);

    // Upload to Supabase if requested
    if (uploadToDb) {
      console.log(`   ☁️  Uploading to Supabase...`);
      await uploadToSupabase(companyData, metrics, {
        pages: data.numpages,
        characters: data.text.length
      });
    }

    return { success: true, metricCount };

  } catch (error: any) {
    console.error(`   ❌ Processing error: ${error.message}`);
    return { success: false, metricCount: 0 };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const uploadToDb = args.includes('--upload');
  const testMode = args.includes('--test');

  console.log('======================================================================');
  console.log('🚀 PRODUCTION EXTRACTION WITH MERGED ULTIMATE DICTIONARY');
  console.log('======================================================================\n');

  // Load merged ultimate dictionary
  const dictPath = resolve(process.cwd(), 'data/merged-ultimate-gri-dictionary.json');
  const dictionary: KeywordDictionary = JSON.parse(readFileSync(dictPath, 'utf-8'));
  console.log(`✓ Loaded MERGED ULTIMATE dictionary:`);
  console.log(`   Total codes: ${(dictionary.codes || []).length}`);
  console.log(`   Search keywords: ${(dictionary.search_keywords || []).length}`);
  console.log(`   Categories: ${dictionary.metadata?.categories || 'N/A'}\n`);

  // Load company list
  const companiesPath = resolve(process.cwd(), 'data/company-report-urls.json');
  const companiesJson = JSON.parse(readFileSync(companiesPath, 'utf-8'));

  // Convert object structure to array
  const allCompanies: CompanyData[] = Object.entries(companiesJson.companies || companiesJson).map(([name, data]: [string, any]) => ({
    company: name,
    industry: data.industry || 'Unknown',
    website: data.website || data.sustainability_page || '',
    pdf_url: data.report_url
  })).filter(c => c.pdf_url); // Only include companies with PDF URLs

  const outputDir = resolve(process.cwd(), 'data/extracted-production');
  if (!existsSync(outputDir)) {
    const { mkdirSync } = await import('fs');
    mkdirSync(outputDir, { recursive: true });
  }

  // RESUME MODE: Skip companies that already have output files
  const skipExisting = !args.includes('--force');
  let companiesToProcess = testMode ? allCompanies.slice(0, 3) : allCompanies;

  if (skipExisting && !testMode) {
    companiesToProcess = companiesToProcess.filter(c => {
      const filename = `${c.company.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.json`;
      const filePath = resolve(outputDir, filename);
      return !existsSync(filePath);
    });
  }

  const alreadyDone = allCompanies.length - companiesToProcess.length;

  console.log(`📋 Processing ${companiesToProcess.length} companies${testMode ? ' (TEST MODE)' : ''}`);
  if (alreadyDone > 0) {
    console.log(`   ✓ Already completed: ${alreadyDone} companies`);
  }
  console.log(`   Upload to Supabase: ${uploadToDb ? 'YES ☁️' : 'NO (local only)'}\n`);

  const results = {
    total: companiesToProcess.length,
    successful: 0,
    failed: 0,
    totalMetrics: 0,
    companies: [] as any[]
  };

  for (let i = 0; i < companiesToProcess.length; i++) {
    const company = companiesToProcess[i];
    console.log(`\n[${i + 1}/${companiesToProcess.length}]`);

    const result = await processCompany(company, dictionary, outputDir, uploadToDb);

    if (result.success) {
      results.successful++;
      results.totalMetrics += result.metricCount;
      results.companies.push({
        name: company.company,
        metrics: result.metricCount,
        status: 'success'
      });
    } else {
      results.failed++;
      results.companies.push({
        name: company.company,
        metrics: 0,
        status: 'failed'
      });
    }

    // Rate limiting: wait 2 seconds between companies
    if (i < companiesToProcess.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 PRODUCTION EXTRACTION COMPLETE');
  console.log('='.repeat(70));
  console.log(`✅ Successful: ${results.successful}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`📈 Total metrics extracted: ${results.totalMetrics.toLocaleString()}`);
  console.log(`📊 Average per company: ${(results.totalMetrics / results.successful).toFixed(1)}`);

  const sorted = results.companies
    .filter(c => c.status === 'success')
    .sort((a, b) => b.metrics - a.metrics);

  console.log(`\n🏆 Top performers:`);
  sorted.slice(0, 5).forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.name}: ${c.metrics} metrics`);
  });

  console.log(`\n⚠️  Lowest metrics:`);
  sorted.slice(-5).reverse().forEach((c, i) => {
    console.log(`   ${sorted.length - i}. ${c.name}: ${c.metrics} metrics`);
  });

  // Save summary
  const summaryPath = resolve(process.cwd(), 'data/extracted-production/EXTRACTION_SUMMARY.json');
  writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Summary saved to: ${summaryPath}`);

  console.log('\n' + '='.repeat(70));
  console.log(uploadToDb ? '✅ DATA UPLOADED TO SUPABASE' : 'ℹ️  Run with --upload flag to upload to Supabase');
  console.log('='.repeat(70));
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
