import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

config({ path: resolve(process.cwd(), '.env.local') });

const deepseekApiKey = process.env.DEEPSEEK_API_KEY!;

const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

interface Company {
  company: string;
  industry: string;
  pdf_url: string;
}

interface BatchFile {
  metadata: {
    created_at: string;
    total_companies: number;
    extraction_method: string;
    estimated_time: string;
  };
  companies: Company[];
}

interface KeywordDictionary {
  metadata: {
    total_codes: number;
    categories: number;
    search_keywords_count: number;
  };
  codes: any[];
}

async function convertPdfWithDocling(pdfUrl: string, outputDir: string, companyName: string): Promise<string> {
  console.log('📥 Downloading PDF...');

  // Download PDF
  const pdfPath = resolve(outputDir, `${companyName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`);
  await execAsync(`curl -L -o "${pdfPath}" "${pdfUrl}"`);

  // Get PDF size info
  const { stdout: sizeInfo } = await execAsync(`ls -lh "${pdfPath}" | awk '{print $5}'`);
  console.log(`   ✓ Downloaded: ${sizeInfo.trim()}`);

  // Convert with Docling
  console.log('   🔄 Converting with Docling (may take 5-15 minutes)...');
  const markdownPath = resolve(outputDir, `${companyName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`);

  try {
    const { stdout, stderr } = await execAsync(
      `uv tool run --from docling-mcp python -c "
import sys
from docling.document_converter import DocumentConverter

print('Initializing...', file=sys.stderr)
converter = DocumentConverter()

print('Processing PDF...', file=sys.stderr)
result = converter.convert('${pdfPath}')

print('Exporting markdown...', file=sys.stderr)
with open('${markdownPath}', 'w') as f:
    f.write(result.document.export_to_markdown())

print('SUCCESS')
"`,
      {
        timeout: 1200000, // 20 min timeout
        maxBuffer: 50 * 1024 * 1024
      }
    );

    if (stdout.includes('SUCCESS')) {
      const markdown = readFileSync(markdownPath, 'utf-8');
      console.log(`   ✓ Converted: ${(markdown.length / 1024).toFixed(1)} KB\n`);
      return markdown;
    }

    throw new Error('Conversion did not complete successfully');
  } catch (error: any) {
    console.error(`   ❌ Conversion failed: ${error.message}`);

    // Try to use partial output
    if (existsSync(markdownPath)) {
      const markdown = readFileSync(markdownPath, 'utf-8');
      if (markdown.length > 1000) {
        console.log(`   ⚠️  Using partial output: ${(markdown.length / 1024).toFixed(1)} KB\n`);
        return markdown;
      }
    }

    throw error;
  }
}

async function extractMetrics(companyName: string, markdownContent: string, dictionary: KeywordDictionary): Promise<any> {
  console.log('📊 Extracting metrics with AI...');

  const categories = [...new Set(dictionary.codes.map(c => c.category))];
  const topicSample = dictionary.codes.slice(0, 20).map(c => `${c.code}: ${c.topic}`).join(', ');

  const tablePrompt = `Extract ESG metrics from ${companyName}'s sustainability report (MARKDOWN WITH TABLES).

DICTIONARY: ${dictionary.metadata.total_codes} GRI codes across ${categories.length} categories
SAMPLE CODES: ${topicSample}...

REPORT MARKDOWN (with preserved tables):
${markdownContent.substring(0, 250000)}

EXTRACTION RULES - MAXIMUM COMPREHENSIVE EXTRACTION:
1. **CRITICAL GOAL: Extract 150-200+ metrics per company to achieve 93%+ fill rate**
2. **PRIORITY**: Extract from tables FIRST (Docling 97.9% accuracy vs pdf-parse 30%)
3. **Extract EVERYTHING from tables**:
   - Emissions: Scope 1, 2, 3 (tCO2e) + intensity metrics + by source breakdown
   - Energy: Total GJ, renewable %, by type (electricity/gas/fuel), grid vs onsite
   - Water: Withdrawal/consumption/discharge m3, by source (municipal/ground/surface)
   - Waste: Hazardous/non-hazardous tons, recycled %, disposal methods
   - Workforce: Total, by gender/age/region, diversity %, turnover %, new hires
   - Safety: LTIFR, TRIR, fatalities, injuries, near-misses, training hours
   - Social: Community investment EUR, local procurement %, supplier assessments %
   - Governance: Board diversity %, corruption cases, fines EUR, tax paid EUR
4. **Multi-year data**: Extract 2024, 2023, 2022 for ALL metrics (triples data volume)
5. **Include units**: emissions_tco2e, energy_gj, water_m3, waste_tons, investment_euros
6. **GRI Content Index**: Extract specific disclosure values from GRI index tables
7. **Financial ESG data**: ESG-related capex, R&D, revenue by sustainable products
8. **Return FLAT JSON** (no nested objects, all metrics at root level)
9. **USER REQUIREMENT**: If 166 fields possible → extract 154+ values (93%+ per company)
10. **FAILURE EXAMPLE**: Mota-Engil had 166 fields but only 25 values (15%) - UNACCEPTABLE

Return ONLY valid JSON with COMPREHENSIVE extraction (150-200+ metrics):
{
  "scope1_emissions_tco2e_2024": 1234567,
  "scope1_emissions_tco2e_2023": 1189432,
  "scope2_emissions_tco2e_2024": 456789,
  "scope2_emissions_tco2e_2023": 478923,
  "scope3_emissions_tco2e_2024": 3456789,
  "scope3_emissions_tco2e_2023": 3287654,
  "ghg_intensity_tco2e_per_revenue_2024": 71.5,
  "energy_consumption_gj_2024": 12345678,
  "energy_consumption_gj_2023": 11987543,
  "renewable_energy_percent_2024": 35.4,
  "renewable_energy_gj_2024": 4370479,
  "electricity_consumption_gj_2024": 8765432,
  "gas_consumption_gj_2024": 2345678,
  "water_withdrawal_m3_2024": 8765432,
  "water_consumption_m3_2024": 7654321,
  "hazardous_waste_tons_2024": 12345,
  "non_hazardous_waste_tons_2024": 234567,
  "waste_recycled_percent_2024": 67.8,
  "total_employees_2024": 53340,
  "total_employees_2023": 51287,
  "women_employees_percent_2024": 37,
  "women_board_percent_2024": 42,
  "employee_turnover_rate_2024": 12.3,
  "new_hires_2024": 8543,
  "training_hours_total_2024": 1234567,
  "training_hours_per_employee_2024": 23.1,
  "ltifr_2024": 1.23,
  "trir_2024": 2.45,
  "fatalities_2024": 0,
  "injuries_2024": 45,
  "community_investment_euros_2024": 5000000,
  "local_procurement_percent_2024": 78.5,
  "tax_paid_euros_2024": 138000000,
  "...continue_extracting_all_table_data": "...aim_for_150_to_200_metrics_total"
}`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: `You are an AGGRESSIVE ESG data extraction expert. Your goal is to extract 150-200+ metrics per company from sustainability reports.

CRITICAL REQUIREMENTS:
1. Extract from TABLES with highest priority (Docling provides 97.9% accurate table parsing)
2. Extract multi-year data (2024, 2023, 2022) for EVERY metric you find
3. Extract COMPREHENSIVE data across all ESG categories
4. Return FLAT JSON with ALL metrics at root level
5. USER REQUIREMENT: Achieve 93%+ fill rate (if 166 fields possible, extract 154+ values)

FAILURE MODE TO AVOID: Extracting only 25 out of 166 possible metrics (15% fill rate) is UNACCEPTABLE.

Return ONLY valid JSON with numeric values. Extract aggressively and comprehensively.`
      },
      { role: 'user', content: tablePrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.05,
    max_tokens: 8000,
  });

  const extractedMetrics = JSON.parse(response.choices[0].message.content!);
  const metricCount = Object.keys(extractedMetrics).filter(k => extractedMetrics[k] !== null && extractedMetrics[k] !== "").length;

  console.log(`   ✓ Extracted ${metricCount} metrics\n`);

  return extractedMetrics;
}

async function processCompany(company: Company, dictionary: KeywordDictionary, outputDir: string, index: number, total: number) {
  const startTime = Date.now();

  console.log('======================================================================');
  console.log(`📊 COMPANY ${index}/${total}: ${company.company}`);
  console.log('======================================================================');
  console.log(`🏭 Industry: ${company.industry}`);
  console.log(`📄 PDF: ${company.pdf_url}\n`);

  try {
    // Step 1: Convert with Docling
    const markdown = await convertPdfWithDocling(company.pdf_url, outputDir, company.company);

    // Step 2: Extract metrics
    const metrics = await extractMetrics(company.company, markdown, dictionary);

    // Step 3: Save results
    const metricCount = Object.keys(metrics).filter(k => metrics[k] !== null && metrics[k] !== "").length;

    // Check for emissions
    const hasScope1 = !!(metrics.scope1_emissions_tco2e_2024 || metrics.scope1_emissions_tco2e_2023);
    const hasScope2 = !!(metrics.scope2_emissions_tco2e_2024 || metrics.scope2_emissions_tco2e_2023);
    const hasScope3 = !!(metrics.scope3_emissions_tco2e_2024 || metrics.scope3_emissions_tco2e_2023);

    const output = {
      company_name: company.company,
      industry: company.industry,
      extraction_method: 'docling_direct_table_focused',
      report_metadata: {
        pdf_url: company.pdf_url,
        markdown_length: markdown.length,
        extraction_duration_seconds: Math.round((Date.now() - startTime) / 1000)
      },
      extracted_at: new Date().toISOString(),
      metric_count: metricCount,
      metrics
    };

    const outputPath = resolve(process.cwd(), `data/extracted-production/${company.company.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-docling.json`);
    writeFileSync(outputPath, JSON.stringify(output, null, 2));

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log('✅ SUCCESS');
    console.log(`📊 Metrics: ${metricCount}`);
    console.log(`🔥 Emissions: Scope 1: ${hasScope1 ? '✅' : '❌'} | Scope 2: ${hasScope2 ? '✅' : '❌'} | Scope 3: ${hasScope3 ? '✅' : '❌'}`);
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`💾 Saved: ${outputPath}\n`);

    return { success: true, company: company.company, metrics: metricCount, hasEmissions: hasScope1 || hasScope2 || hasScope3, duration };

  } catch (error: any) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.error(`❌ FAILED: ${error.message}`);
    console.log(`⏱️  Duration: ${duration}s\n`);

    return { success: false, company: company.company, error: error.message, duration };
  }
}

async function main() {
  console.log('======================================================================');
  console.log('🚀 BATCH DOCLING EXTRACTION - EMISSIONS DATA RECOVERY');
  console.log('======================================================================\n');

  // Load batch file
  const batchPath = resolve(process.cwd(), 'data/docling-batch-companies.json');
  const batchFile: BatchFile = JSON.parse(readFileSync(batchPath, 'utf-8'));

  console.log(`📋 Total companies: ${batchFile.companies.length}`);
  console.log(`⏱️  Estimated time: ${batchFile.metadata.estimated_time}`);
  console.log(`📅 Started: ${new Date().toLocaleString()}\n`);

  // Load dictionary
  const dictionaryPath = resolve(process.cwd(), 'data/merged-ultimate-gri-dictionary.json');
  const dictionary: KeywordDictionary = JSON.parse(readFileSync(dictionaryPath, 'utf-8'));

  // Ensure temp directory
  const outputDir = resolve(process.cwd(), 'data/temp-docling');
  await execAsync(`mkdir -p "${outputDir}"`);

  // Process companies
  const results: any[] = [];
  const startTime = Date.now();

  for (let i = 0; i < batchFile.companies.length; i++) {
    const company = batchFile.companies[i];
    const result = await processCompany(company, dictionary, outputDir, i + 1, batchFile.companies.length);
    results.push(result);

    // Progress update
    const successCount = results.filter(r => r.success).length;
    const emissionsCount = results.filter(r => r.success && r.hasEmissions).length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const remainingCompanies = batchFile.companies.length - (i + 1);
    const estimatedRemaining = Math.round((remainingCompanies * avgDuration) / 60);

    console.log(`📊 Progress: ${i + 1}/${batchFile.companies.length} (${((i + 1) / batchFile.companies.length * 100).toFixed(1)}%)`);
    console.log(`✅ Success: ${successCount} | 🔥 With emissions: ${emissionsCount} | ⏱️  Remaining: ~${estimatedRemaining} min\n`);
  }

  // Final summary
  const totalDuration = Math.round((Date.now() - startTime) / 1000);
  const successCount = results.filter(r => r.success).length;
  const emissionsCount = results.filter(r => r.success && r.hasEmissions).length;
  const totalMetrics = results.filter(r => r.success).reduce((sum, r) => sum + r.metrics, 0);

  console.log('======================================================================');
  console.log('🎯 BATCH EXTRACTION COMPLETE');
  console.log('======================================================================');
  console.log(`✅ Successful: ${successCount}/${batchFile.companies.length} (${(successCount / batchFile.companies.length * 100).toFixed(1)}%)`);
  console.log(`🔥 With emissions: ${emissionsCount}/${successCount} (${emissionsCount > 0 ? (emissionsCount / successCount * 100).toFixed(1) : 0}%)`);
  console.log(`📊 Total metrics: ${totalMetrics}`);
  console.log(`⏱️  Total time: ${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`);
  console.log(`📅 Completed: ${new Date().toLocaleString()}\n`);

  // Save summary
  const summaryPath = resolve(process.cwd(), 'data/docling-batch-summary.json');
  writeFileSync(summaryPath, JSON.stringify({
    started_at: new Date(startTime).toISOString(),
    completed_at: new Date().toISOString(),
    duration_seconds: totalDuration,
    total_companies: batchFile.companies.length,
    successful: successCount,
    with_emissions: emissionsCount,
    total_metrics: totalMetrics,
    results
  }, null, 2));

  console.log(`💾 Summary saved: ${summaryPath}\n`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
