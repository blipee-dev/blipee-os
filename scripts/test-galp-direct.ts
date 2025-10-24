/**
 * Test Galp - Direct PDF Extraction (Bypass Firecrawl)
 * Downloads PDF, extracts text with pdf-parse, sends to DeepSeek
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';
import pdf from 'pdf-parse';
import { writeFileSync, unlinkSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const deepseekApiKey = process.env.DEEPSEEK_API_KEY!;

const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

const GALP_URL = 'https://www.galp.com/corp/Portals/0/Recursos/Sustentabilidade/SharedResources/Documents/2024/SustainabilityStatement2024.pdf';

async function downloadPDF(url: string): Promise<Buffer> {
  console.log(`📥 Downloading PDF: ${url}\n`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`✓ Downloaded ${buffer.length} bytes\n`);

  return buffer;
}

async function extractText(pdfBuffer: Buffer): Promise<string> {
  console.log(`📄 Extracting text from PDF...\n`);

  const data = await pdf(pdfBuffer);

  console.log(`✓ Extracted ${data.text.length} characters`);
  console.log(`✓ PDF has ${data.numpages} pages\n`);

  return data.text;
}

async function extractData(companyName: string, reportText: string): Promise<any> {
  console.log(`🤖 Extracting with DeepSeek...\n`);

  // DeepSeek has 64K token limit (~256K chars)
  // Use full document or smart chunking
  const maxLength = 200000; // Use much more of the document
  const truncatedText = reportText.length > maxLength
    ? reportText.substring(0, maxLength) + '\n\n[Truncated for length]'
    : reportText;

  console.log(`   Using ${truncatedText.length} of ${reportText.length} characters for extraction\n`);

  const prompt = `You are an expert sustainability data analyst. Extract ALL available sustainability metrics from this ${companyName} report.

REPORT:
${truncatedText}

Extract EVERY metric you can find. Return JSON with these fields (use null only if truly missing):

EMISSIONS (in tons CO2e):
- scope1_emissions, scope2_emissions, scope3_emissions, total_emissions
- scope2_market_based, scope2_location_based
- ghg_intensity (per revenue or production unit)
- biogenic_emissions

ENERGY (in MWh):
- total_energy_consumption
- renewable_energy_percent (0-100)
- renewable_energy_mwh
- energy_intensity

WATER (in megaliters):
- water_withdrawal, water_discharge, water_consumption
- water_recycled, water_intensity

WASTE (in tons):
- waste_generated, waste_recycled, waste_to_landfill
- waste_recycling_rate (0-100 percent)
- hazardous_waste

SAFETY:
- total_recordable_incident_rate (TRIR)
- lost_time_injury_rate (LTIR)
- fatalities, near_miss_incidents

SOCIAL:
- employee_count (total workforce)
- women_in_leadership (0-100 percent)
- women_in_workforce (0-100 percent)
- training_hours_per_employee
- employee_turnover_rate (0-100 percent)
- living_wage_percent
- unionized_workforce_percent

SUPPLY CHAIN:
- supplier_esg_assessments (count)
- sustainable_sourcing_percent (0-100)

CIRCULAR ECONOMY:
- product_recycling_rate
- packaging_recycled_content
- product_takeback_programs (boolean)

BIODIVERSITY:
- land_owned_managed (hectares)
- protected_habitat_area
- biodiversity_programs (boolean)

GOVERNANCE:
- board_independence (0-100 percent)
- women_on_board (0-100 percent)
- esg_linked_compensation (boolean - true/false ONLY)
- externally_assured (boolean - true/false ONLY)
- assurance_provider (string e.g. "EY", "Deloitte")

FINANCIAL:
- annual_revenue (millions)
- revenue_currency (ISO code like "EUR", "USD")
- ebitda (millions)

TARGETS:
- carbon_neutral_target (year e.g. 2030)
- net_zero_target (year)
- renewable_energy_target (percent and year)

IMPORTANT:
- Return ONLY valid JSON
- Numbers must be numeric (15000000 not "15M")
- Booleans must be true/false (not 1/0 or "yes"/"no")
- Percentages as numbers 0-100 (not decimals)
- Search the ENTIRE document carefully`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: 'Extract sustainability metrics. Return valid JSON with numeric values only. Never return strings for numbers.' },
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

  return flatData;
}

async function main() {
  console.log('🧪 TEST: Galp Energia - DIRECT PDF EXTRACTION\n');
  console.log('Bypassing Firecrawl - downloading PDF directly\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Download PDF
    const pdfBuffer = await downloadPDF(GALP_URL);

    // Step 2: Extract text
    const text = await extractText(pdfBuffer);

    // Show first 500 chars
    console.log('📝 First 500 characters:');
    console.log(text.substring(0, 500));
    console.log('...\n');

    // Step 3: Extract with DeepSeek
    const metrics = await extractData('Galp Energia', text);

    console.log('✅ EXTRACTION SUCCESSFUL!\n');
    console.log('='.repeat(60));
    console.log('📊 EXTRACTED METRICS');
    console.log('='.repeat(60) + '\n');

    const metricCount = Object.keys(metrics).filter(k => metrics[k] !== null && metrics[k] !== undefined).length;
    console.log(`Total metrics extracted: ${metricCount}\n`);

    // Display by category
    console.log('🌍 EMISSIONS:');
    if (metrics.scope1_emissions) console.log(`   Scope 1: ${metrics.scope1_emissions.toLocaleString()} tons CO2e`);
    if (metrics.scope2_emissions) console.log(`   Scope 2: ${metrics.scope2_emissions.toLocaleString()} tons CO2e`);
    if (metrics.scope3_emissions) console.log(`   Scope 3: ${metrics.scope3_emissions.toLocaleString()} tons CO2e`);
    if (metrics.total_emissions) console.log(`   Total: ${metrics.total_emissions.toLocaleString()} tons CO2e`);
    if (metrics.ghg_intensity) console.log(`   Intensity: ${metrics.ghg_intensity} tons CO2e/$M`);

    console.log('\n⚡ ENERGY:');
    if (metrics.total_energy_consumption) console.log(`   Total: ${metrics.total_energy_consumption.toLocaleString()} MWh`);
    if (metrics.renewable_energy_percent) console.log(`   Renewable: ${metrics.renewable_energy_percent}%`);
    if (metrics.renewable_energy_mwh) console.log(`   Renewable MWh: ${metrics.renewable_energy_mwh.toLocaleString()}`);
    if (metrics.energy_intensity) console.log(`   Intensity: ${metrics.energy_intensity}`);

    console.log('\n💧 WATER:');
    if (metrics.water_withdrawal) console.log(`   Withdrawal: ${metrics.water_withdrawal.toLocaleString()} ML`);
    if (metrics.water_discharge) console.log(`   Discharge: ${metrics.water_discharge.toLocaleString()} ML`);
    if (metrics.water_recycled) console.log(`   Recycled: ${metrics.water_recycled.toLocaleString()} ML`);

    console.log('\n♻️  WASTE:');
    if (metrics.waste_generated) console.log(`   Generated: ${metrics.waste_generated.toLocaleString()} tons`);
    if (metrics.waste_recycled) console.log(`   Recycled: ${metrics.waste_recycled.toLocaleString()} tons`);
    if (metrics.waste_recycling_rate) console.log(`   Recycling Rate: ${metrics.waste_recycling_rate}%`);

    console.log('\n👥 SOCIAL:');
    if (metrics.employee_count) console.log(`   Employees: ${metrics.employee_count.toLocaleString()}`);
    if (metrics.women_in_leadership) console.log(`   Women in Leadership: ${metrics.women_in_leadership}%`);
    if (metrics.training_hours_per_employee) console.log(`   Training Hours: ${metrics.training_hours_per_employee}`);

    console.log('\n🏢 GOVERNANCE:');
    if (metrics.board_independence) console.log(`   Board Independence: ${metrics.board_independence}%`);
    if (metrics.esg_linked_compensation !== undefined) console.log(`   ESG-Linked Compensation: ${metrics.esg_linked_compensation}`);
    if (metrics.externally_assured !== undefined) console.log(`   Externally Assured: ${metrics.externally_assured}`);

    console.log('\n💰 FINANCIAL:');
    if (metrics.annual_revenue) console.log(`   Revenue: ${metrics.annual_revenue}M ${metrics.revenue_currency || 'EUR'}`);

    console.log('\n' + '='.repeat(60));
    console.log(`\n🎉 SUCCESS! Extracted ${metricCount} metrics by bypassing Firecrawl!`);
    console.log('\n✅ Direct PDF extraction works perfectly!');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
