/**
 * Test Batch: Parse 5 Companies (1 per sector)
 * Validates Firecrawl + DeepSeek pipeline before scaling to all 70
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const firecrawlApiKey = process.env.FIRECRAWL_API_KEY!;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

// Test batch: 5 companies with good sustainability reporting
const testUrls: Record<string, string> = {
  'Equinor': 'https://www.equinor.com/sustainability',
  'Unilever': 'https://www.unilever.com/planet-and-society/',
  'Patagonia': 'https://www.patagonia.com/our-footprint/',
  'SAP': 'https://www.sap.com/about/company/sustainability.html',
  'Carrefour': 'https://www.carrefour.com/en/csr',
};

interface ParsedReportData {
  scope1_emissions?: number;
  scope2_emissions?: number;
  scope3_emissions?: number;
  total_emissions?: number;
  ghg_intensity?: number;
  renewable_energy_percent?: number;
  total_energy_consumption?: number;
  energy_intensity?: number;
  water_withdrawal?: number;
  water_recycled?: number;
  waste_recycling_rate?: number;
  employee_count?: number;
  women_in_leadership?: number;
  training_hours_per_employee?: number;
  supplier_esg_assessments?: number;
  board_independence?: number;
  esg_linked_compensation?: boolean;
  annual_revenue?: number;
  revenue_currency?: string;
  [key: string]: any;
}

async function fetchReportContent(reportUrl: string): Promise<string> {
  console.log(`   📄 Fetching: ${reportUrl}`);

  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: reportUrl,
      formats: ['markdown'],
      onlyMainContent: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Firecrawl error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Scrape failed: ${data.error}`);
  }

  const content = data.data?.markdown || '';
  console.log(`   ✓ Fetched ${content.length} characters`);
  return content;
}

async function extractDataWithAI(
  companyName: string,
  reportText: string
): Promise<ParsedReportData> {
  console.log(`   🤖 Extracting with DeepSeek...`);

  const maxLength = 50000;
  const truncatedText = reportText.length > maxLength
    ? reportText.substring(0, maxLength) + '\n\n[Truncated]'
    : reportText;

  const prompt = `Extract sustainability metrics from this ${companyName} report:

${truncatedText}

Return JSON with these metrics (use null for missing):

EMISSIONS: scope1_emissions, scope2_emissions, scope3_emissions, total_emissions, ghg_intensity
ENERGY: total_energy_consumption, renewable_energy_percent, renewable_energy_mwh, energy_intensity
WATER: water_withdrawal, water_discharge, water_recycled, water_intensity
WASTE: waste_generated, waste_recycled, waste_recycling_rate
SAFETY: total_recordable_incident_rate, lost_time_injury_rate, fatalities
SOCIAL: employee_count, women_in_leadership, training_hours_per_employee, employee_turnover_rate
SUPPLY_CHAIN: supplier_esg_assessments, sustainable_sourcing_percent
GOVERNANCE: board_independence, esg_linked_compensation, externally_assured
FINANCIAL: annual_revenue (millions), revenue_currency

Return ONLY valid JSON.`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: 'Extract sustainability metrics. Return valid JSON with numeric values only.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const content = response.choices[0].message.content!;
  const extracted = JSON.parse(content);

  // Flatten nested structure
  let flatData: any = {};
  for (const key of Object.keys(extracted)) {
    if (typeof extracted[key] === 'object' && extracted[key] !== null && !Array.isArray(extracted[key])) {
      flatData = { ...flatData, ...extracted[key] };
    } else {
      flatData[key] = extracted[key];
    }
  }

  const metricCount = Object.keys(flatData).filter(k => flatData[k] !== null && flatData[k] !== undefined).length;
  console.log(`   ✓ Extracted ${metricCount} metrics`);

  return flatData;
}

async function processCompany(companyName: string, reportUrl: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${companyName}`);
  console.log(`${'='.repeat(60)}`);

  try {
    // Step 1: Fetch with Firecrawl
    const reportContent = await fetchReportContent(reportUrl);

    // Step 2: Extract with DeepSeek
    const parsedData = await extractDataWithAI(companyName, reportContent);

    // Step 3: Get company ID
    const { data: company } = await supabase
      .from('sector_companies')
      .select('id, sector')
      .eq('company_name', companyName)
      .single();

    if (!company) {
      throw new Error(`Company ${companyName} not found in database`);
    }

    // Step 4: Store in database (UPSERT to handle duplicates)
    console.log(`   💾 Storing to database...`);

    const { error } = await supabase
      .from('sector_company_reports')
      .upsert({
        company_id: company.id,
        company_name: companyName,
        sector: company.sector,
        report_year: 2023,
        report_url: reportUrl,
        report_type: 'sustainability',
        ...parsedData,
        raw_text: reportContent.substring(0, 50000),
      }, {
        onConflict: 'company_name,sector,report_year'
      });

    if (error) {
      console.error(`   ❌ Database error: ${error.message}`);
      throw error;
    }

    console.log(`   ✅ SUCCESS!`);

    // Show key metrics
    console.log(`\n   📈 Key Metrics:`);
    if (parsedData.total_emissions) console.log(`      Emissions: ${parsedData.total_emissions.toLocaleString()} tons CO2e`);
    if (parsedData.renewable_energy_percent) console.log(`      Renewable: ${parsedData.renewable_energy_percent}%`);
    if (parsedData.employee_count) console.log(`      Employees: ${parsedData.employee_count.toLocaleString()}`);
    if (parsedData.waste_recycling_rate) console.log(`      Waste Recycling: ${parsedData.waste_recycling_rate}%`);

    return { success: true, company: companyName, metrics: Object.keys(parsedData).length };

  } catch (error: any) {
    console.error(`   ❌ FAILED: ${error.message}`);
    return { success: false, company: companyName, error: error.message };
  }
}

async function main() {
  console.log('🧪 TEST BATCH: 5 Companies (1 per sector)\n');
  console.log('Testing Firecrawl + DeepSeek pipeline...\n');

  const results = [];
  const startTime = Date.now();

  for (const [companyName, reportUrl] of Object.entries(testUrls)) {
    const result = await processCompany(companyName, reportUrl);
    results.push(result);

    // Small delay between companies
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const duration = Math.round((Date.now() - startTime) / 1000);

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST BATCH RESULTS');
  console.log(`${'='.repeat(60)}\n`);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  console.log(`⏱️  Duration: ${duration} seconds\n`);

  if (successful.length > 0) {
    console.log('✅ Successful Companies:');
    successful.forEach(r => {
      console.log(`   - ${r.company} (${r.metrics} metrics)`);
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failed Companies:');
    failed.forEach(r => {
      console.log(`   - ${r.company}: ${r.error}`);
    });
  }

  console.log(`\n${'='.repeat(60)}`);

  if (successful.length === results.length) {
    console.log('🎉 ALL TESTS PASSED! Ready to scale to all 70 companies.');
  } else if (successful.length > 0) {
    console.log('⚠️  PARTIAL SUCCESS. Review failures before scaling.');
  } else {
    console.log('❌ ALL TESTS FAILED. Fix issues before proceeding.');
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
