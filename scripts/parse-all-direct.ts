/**
 * Parse All Companies - DIRECT PDF EXTRACTION (Bypass Firecrawl)
 *
 * Downloads PDFs directly, extracts with pdf-parse, sends to DeepSeek
 * Uses 200K+ chars for comprehensive extraction (50+ metrics per company)
 *
 * Based on successful Galp test: 33 metrics vs 8 with truncation
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import pdf from 'pdf-parse';
import { readFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

interface ReportDatabase {
  companies: Record<string, {
    sustainability_page: string;
    report_url: string;
    verified: boolean;
    note?: string;
  }>;
}

interface ParsedReportData {
  // Emissions
  scope1_emissions?: number | null;
  scope2_emissions?: number | null;
  scope2_emissions_market_based?: number | null;
  scope2_emissions_location_based?: number | null;
  scope3_emissions?: number | null;
  total_emissions?: number | null;
  ghg_intensity?: number | null;
  biogenic_emissions?: number | null;

  // Energy
  total_energy_consumption?: number | null;
  renewable_energy_percent?: number | null;
  renewable_energy_mwh?: number | null;
  fossil_energy_mwh?: number | null;
  nuclear_energy_mwh?: number | null;
  energy_intensity?: number | null;

  // Water
  water_withdrawal?: number | null;
  water_discharge?: number | null;
  water_consumption?: number | null;
  water_recycled?: number | null;
  water_intensity?: number | null;

  // Waste
  waste_generated?: number | null;
  waste_recycled?: number | null;
  waste_to_landfill?: number | null;
  waste_recycling_rate?: number | null;
  hazardous_waste?: number | null;

  // Pollution
  nox_emissions?: number | null;
  sox_emissions?: number | null;
  particulate_matter_pm10?: number | null;
  nmvoc_emissions?: number | null;

  // Safety
  total_recordable_incident_rate?: number | null;
  lost_time_injury_frequency?: number | null;
  lost_time_injury_rate?: number | null;
  fatalities?: number | null;
  near_miss_incidents?: number | null;
  lost_time_injuries?: number | null;
  days_lost?: number | null;

  // Social
  employee_count?: number | null;
  women_in_leadership?: number | null;
  women_in_workforce?: number | null;
  women_in_management?: number | null;
  training_hours_per_employee?: number | null;
  employee_turnover_rate?: number | null;
  living_wage_percent?: number | null;
  unionized_workforce_percent?: number | null;

  // Supply Chain
  supplier_esg_assessments?: number | null;
  sustainable_sourcing_percent?: number | null;
  local_procurement_percent?: number | null;

  // Biodiversity
  land_owned_managed?: number | null;
  protected_habitat_area?: number | null;
  sites_in_protected_areas?: number | null;
  sites_in_kba?: number | null;
  renaturalised_area?: number | null;
  deforested_area?: number | null;

  // Circular Economy
  product_recycling_rate?: number | null;
  packaging_recycled_content?: number | null;

  // Governance
  board_independence?: number | null;
  women_on_board?: number | null;
  esg_linked_compensation?: boolean | null;
  externally_assured?: boolean | null;
  assurance_provider?: string | null;

  // Financial
  annual_revenue?: number | null;
  revenue_currency?: string | null;
  revenue_from_fossil_fuels?: number | null;
  ebitda?: number | null;

  // Targets
  carbon_neutral_target?: number | null;
  net_zero_target?: number | null;
  renewable_energy_target?: number | null;
}

async function downloadPDF(url: string): Promise<Buffer | null> {
  try {
    console.log(`   📥 Downloading PDF...`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SustainabilityBot/1.0)'
      }
    });

    if (!response.ok) {
      console.log(`   ❌ Download failed: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`   ✓ Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    return buffer;

  } catch (error: any) {
    console.error(`   ❌ Download error: ${error.message}`);
    return null;
  }
}

async function extractText(pdfBuffer: Buffer): Promise<string | null> {
  try {
    console.log(`   📄 Extracting text from PDF...`);

    const data = await pdf(pdfBuffer);

    console.log(`   ✓ Extracted ${data.text.length.toLocaleString()} characters from ${data.numpages} pages`);

    return data.text;

  } catch (error: any) {
    console.error(`   ❌ PDF extraction error: ${error.message}`);
    return null;
  }
}

async function extractDataWithAI(companyName: string, reportText: string): Promise<ParsedReportData | null> {
  try {
    console.log(`   🤖 Extracting with DeepSeek AI...`);

    // FIXED: Use up to 250K chars (DeepSeek's 64K token limit ~256K chars)
    // GRI/ESRS reports have structured tables - get as much as possible!
    const maxLength = 250000;
    const textToAnalyze = reportText.length > maxLength
      ? reportText.substring(0, maxLength) + '\n\n[Document continues - extracted first 250K chars covering main data tables]'
      : reportText;

    console.log(`   Using ${textToAnalyze.length.toLocaleString()} of ${reportText.length.toLocaleString()} characters (${((textToAnalyze.length/reportText.length)*100).toFixed(1)}%)`);

    const prompt = `You are an expert sustainability data analyst extracting metrics from GRI/ESRS sustainability reports.

CRITICAL: These reports contain STRUCTURED TABLES with exact metrics. Look for:
- "GHG Emissions (tonCO2e)" tables with Scope 1/2/3 breakdowns
- "Energy consumption (MWh)" tables with fossil/renewable splits
- "Water consumption (10³ m³)" tables with withdrawal/discharge/recycled
- "Waste" tables with recycling rates
- "Social" tables with employee counts, diversity percentages
- "Governance" tables with board composition
- "Revenue by Sector" tables
- "Safety" tables with TRIR, LTIF, fatalities
- "ESRS Compliance Index" with page references

COMPANY: ${companyName}

REPORT TEXT:
${textToAnalyze}

Extract EVERY metric from these structured tables. Scan the entire document section by section!

Return JSON with ALL metrics including granular breakdowns (use null only if truly missing):

EMISSIONS (in tons CO2e) - Extract TOTALS AND ALL BREAKDOWNS:
- scope1_emissions, scope2_emissions, scope3_emissions, total_emissions
- scope2_emissions_market_based, scope2_emissions_location_based
- ghg_intensity (per revenue or production unit)
- biogenic_emissions
- SCOPE 1 BREAKDOWNS:
  - scope1_by_source_combustion, scope1_by_source_flaring, scope1_by_source_fugitive
  - scope1_by_source_venting, scope1_by_source_process
  - scope1_by_business_upstream, scope1_by_business_industrial_midstream
  - scope1_by_business_commercial, scope1_by_business_renewables
- SCOPE 3 BREAKDOWNS by category:
  - scope3_purchased_goods, scope3_fuel_energy, scope3_upstream_transport
  - scope3_business_travel, scope3_processing_sold, scope3_use_of_sold
  - scope3_downstream_transport, scope3_end_of_life, scope3_investments

ENERGY (in MWh):
- total_energy_consumption
- renewable_energy_percent (0-100)
- renewable_energy_mwh, fossil_energy_mwh, nuclear_energy_mwh
- energy_intensity

WATER (in megaliters) - Extract totals AND stress area breakdowns:
- water_withdrawal, water_discharge, water_consumption
- water_recycled, water_intensity
- water_withdrawal_stress_areas, water_discharge_stress_areas, water_consumption_stress_areas

WASTE (in tons):
- waste_generated, waste_recycled, waste_to_landfill
- waste_recycling_rate (0-100 percent)
- hazardous_waste

POLLUTION (in tons):
- nox_emissions, sox_emissions, particulate_matter_pm10, nmvoc_emissions

SAFETY:
- total_recordable_incident_rate (TRIR)
- lost_time_injury_frequency (LTIF)
- lost_time_injury_rate (LTIR)
- fatalities, near_miss_incidents
- lost_time_injuries, days_lost

SOCIAL:
- employee_count (total workforce)
- women_in_leadership (0-100 percent)
- women_in_workforce (0-100 percent)
- women_in_management (0-100 percent)
- training_hours_per_employee
- employee_turnover_rate (0-100 percent)
- living_wage_percent, unionized_workforce_percent

SUPPLY CHAIN:
- supplier_esg_assessments (count)
- sustainable_sourcing_percent (0-100)
- local_procurement_percent (0-100)

CIRCULAR ECONOMY:
- product_recycling_rate (0-100)
- packaging_recycled_content (0-100)

BIODIVERSITY:
- land_owned_managed (hectares)
- protected_habitat_area (hectares)
- sites_in_protected_areas (count)
- sites_in_kba (count)
- renaturalised_area (hectares)
- deforested_area (hectares)

GOVERNANCE:
- board_independence (0-100 percent)
- women_on_board (0-100 percent)
- esg_linked_compensation (boolean - true/false ONLY, not numbers!)
- externally_assured (boolean - true/false ONLY, not numbers!)
- assurance_provider (string e.g. "EY", "Deloitte", "KPMG")

FINANCIAL - Extract totals AND sector breakdowns:
- annual_revenue (millions)
- revenue_currency (ISO code like "EUR", "USD")
- revenue_from_fossil_fuels (millions)
- ebitda (millions)
- REVENUE BREAKDOWNS by sector:
  - revenue_oil_gas_upstream (millions)
  - revenue_oil_gas_midstream_downstream (millions)
  - revenue_power_utilities (millions)

TARGETS:
- carbon_neutral_target (year e.g. 2030)
- net_zero_target (year e.g. 2050)
- renewable_energy_target (percent)

CRITICAL INSTRUCTIONS:
- Return ONLY valid JSON (no markdown, no code blocks)
- Numbers must be numeric (15000000 not "15M" or "15 million")
- Booleans must be true/false (NEVER use 1/0 or "yes"/"no" or numbers like 30)
- Percentages as numbers 0-100 (not decimals like 0.3)
- Search the ENTIRE document carefully - these are comprehensive GRI/ESRS reports
- Extract from tables, charts, and text sections
- Look for "Sustainability Statement", "GRI Index", "ESRS Disclosures" sections`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a sustainability data extraction expert. Extract metrics from GRI/ESRS reports. Return ONLY valid JSON with numeric values. NEVER return strings for numbers. For booleans, ONLY use true or false, NEVER use numbers like 30 or strings like "yes".'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content!;
    const extracted = JSON.parse(content);

    // Recursively flatten nested structure (AI nests by category and subcategory)
    function flattenObject(obj: any, prefix = ''): any {
      let flattened: any = {};

      for (const key of Object.keys(obj)) {
        const value = obj[key];
        const newKey = prefix ? `${prefix}_${key}` : key;

        if (value === null || value === undefined) {
          flattened[newKey] = value;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          // Recursively flatten nested objects
          const nested = flattenObject(value, newKey);
          flattened = { ...flattened, ...nested };
        } else {
          flattened[newKey] = value;
        }
      }

      return flattened;
    }

    const flatData = flattenObject(extracted);

    // Validate booleans (fix AI returning numbers like 30 instead of true/false)
    if (flatData.esg_linked_compensation !== undefined && typeof flatData.esg_linked_compensation !== 'boolean') {
      console.log(`   ⚠️  Warning: esg_linked_compensation is not boolean (${flatData.esg_linked_compensation}), setting to null`);
      flatData.esg_linked_compensation = null;
    }
    if (flatData.externally_assured !== undefined && typeof flatData.externally_assured !== 'boolean') {
      console.log(`   ⚠️  Warning: externally_assured is not boolean (${flatData.externally_assured}), setting to null`);
      flatData.externally_assured = null;
    }

    const metricCount = Object.keys(flatData).filter(k => flatData[k] !== null && flatData[k] !== undefined).length;
    console.log(`   ✓ Extracted ${metricCount} metrics`);

    return flatData as ParsedReportData;

  } catch (error: any) {
    console.error(`   ❌ AI extraction error: ${error.message}`);
    return null;
  }
}

async function saveToDatabase(companyName: string, data: ParsedReportData): Promise<boolean> {
  try {
    console.log(`   💾 Saving to file (database issues - saving locally)...`);

    // Save to JSON file for now
    const fs = require('fs');
    const path = require('path');

    const outputDir = path.resolve(process.cwd(), 'data/extracted');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = companyName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filepath = path.join(outputDir, `${filename}.json`);

    const output = {
      company_name: companyName,
      report_year: 2024,
      framework: 'GRI/ESRS',
      extracted_at: new Date().toISOString(),
      metric_count: Object.keys(data).filter(k => data[k as keyof ParsedReportData] !== null).length,
      metrics: data
    };

    fs.writeFileSync(filepath, JSON.stringify(output, null, 2));

    console.log(`   ✓ Saved to ${filepath}`);
    return true;

  } catch (error: any) {
    console.error(`   ❌ Save error: ${error.message}`);
    return false;
  }
}

async function processCompany(companyName: string, reportUrl: string): Promise<{
  success: boolean;
  metrics: number;
  error?: string;
}> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 ${companyName}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`🔗 ${reportUrl}`);

  // Step 1: Download PDF
  const pdfBuffer = await downloadPDF(reportUrl);
  if (!pdfBuffer) {
    return { success: false, metrics: 0, error: 'Download failed' };
  }

  // Step 2: Extract text
  const text = await extractText(pdfBuffer);
  if (!text) {
    return { success: false, metrics: 0, error: 'Text extraction failed' };
  }

  // Step 3: Check if large report needs chunking
  let data: ParsedReportData | null;

  if (text.length > 250000) {
    console.log(`   ⚠️  LARGE REPORT (${text.length.toLocaleString()} chars) - Using intelligent chunking`);
    // Use chunking strategy for large reports
    const { extractLargeReport } = require('./parse-large-reports');
    data = await extractLargeReport(companyName, text);
  } else {
    // Standard extraction for normal-sized reports
    data = await extractDataWithAI(companyName, text);
  }

  if (!data) {
    return { success: false, metrics: 0, error: 'AI extraction failed' };
  }

  // Step 4: Save to file
  const saved = await saveToDatabase(companyName, data);
  if (!saved) {
    return { success: false, metrics: 0, error: 'Save failed' };
  }

  const metricCount = Object.keys(data).filter(k => data[k as keyof ParsedReportData] !== null && data[k as keyof ParsedReportData] !== undefined).length;

  console.log(`\n✅ SUCCESS: ${companyName} - ${metricCount} metrics extracted!`);

  return { success: true, metrics: metricCount };
}

async function main() {
  console.log('🚀 DIRECT PDF EXTRACTION - ALL COMPANIES\n');
  console.log('Strategy: Download PDF → Extract text → DeepSeek (200K chars) → Database\n');
  console.log('Expected: 50+ metrics per company (vs 8-33 with truncation)\n');
  console.log('='.repeat(70) + '\n');

  // Load company URLs
  const jsonPath = resolve(process.cwd(), 'data/company-report-urls.json');
  let reportData: ReportDatabase;

  try {
    const fileContent = readFileSync(jsonPath, 'utf-8');
    reportData = JSON.parse(fileContent);
  } catch (error: any) {
    console.error('❌ Failed to load company-report-urls.json:', error.message);
    process.exit(1);
  }

  const companies = Object.entries(reportData.companies);
  console.log(`📊 Found ${companies.length} companies in database\n`);

  // Get companies that need processing
  const { data: alreadyParsed } = await supabase
    .from('parsed_sustainability_reports')
    .select('company_name, data_source')
    .eq('data_source', 'direct_pdf_extraction');

  const parsedNames = new Set((alreadyParsed || []).map(p => p.company_name));

  const toParse = companies.filter(([name]) => !parsedNames.has(name));

  console.log(`✅ Already parsed (direct): ${parsedNames.size}`);
  console.log(`📝 To process: ${toParse.length}\n`);

  if (toParse.length === 0) {
    console.log('🎉 All companies already processed with direct extraction!');
    return;
  }

  // Process each company
  let successful = 0;
  let failed = 0;
  let totalMetrics = 0;

  for (const [companyName, info] of toParse) {
    try {
      const result = await processCompany(companyName, info.report_url);

      if (result.success) {
        successful++;
        totalMetrics += result.metrics;
      } else {
        failed++;
        console.log(`❌ FAILED: ${companyName} - ${result.error}`);
      }

    } catch (error: any) {
      failed++;
      console.error(`❌ FATAL ERROR (${companyName}):`, error.message);
    }

    // Rate limiting (DeepSeek has generous limits, but be respectful)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Final summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 EXTRACTION COMPLETE');
  console.log(`${'='.repeat(70)}\n`);

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total metrics extracted: ${totalMetrics}`);
  console.log(`📊 Average metrics per company: ${(totalMetrics / successful).toFixed(1)}\n`);

  console.log(`🎯 Next step: Generate sector benchmarks from ${successful} companies!`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
