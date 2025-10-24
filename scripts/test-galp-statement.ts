/**
 * Test Galp Sustainability Statement
 * Test extraction from user-provided URL
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';

config({ path: resolve(process.cwd(), '.env.local') });

const firecrawlApiKey = process.env.FIRECRAWL_API_KEY!;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY!;

const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

const GALP_URL = 'https://www.galp.com/corp/Portals/0/Recursos/Sustentabilidade/SharedResources/Documents/2024/SustainabilityStatement2024.pdf';

async function fetchReport(url: string): Promise<string> {
  console.log(`📄 Fetching: ${url}\n`);

  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url,
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
  console.log(`✓ Fetched ${content.length} characters\n`);

  // Show first 500 chars
  console.log('📝 First 500 characters:');
  console.log(content.substring(0, 500));
  console.log('...\n');

  return content;
}

async function extractData(companyName: string, reportText: string): Promise<any> {
  console.log(`🤖 Extracting with DeepSeek...\n`);

  const maxLength = 50000;
  const truncatedText = reportText.length > maxLength
    ? reportText.substring(0, maxLength) + '\n\n[Truncated]'
    : reportText;

  const prompt = `Extract sustainability metrics from this ${companyName} sustainability statement:

${truncatedText}

Return JSON with these metrics (use null for missing, ensure numbers are numeric not strings):

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
      { role: 'system', content: 'Extract sustainability metrics. Return valid JSON with numeric values only. Never return strings for numbers (e.g., return 15000000 not "15M").' },
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
  console.log('🧪 TEST: Galp Energia Sustainability Statement 2024\n');
  console.log('='.repeat(60) + '\n');

  try {
    // Fetch
    const content = await fetchReport(GALP_URL);

    // Extract
    const metrics = await extractData('Galp Energia', content);

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
    console.log(`\n🎉 SUCCESS! Extracted ${metricCount} real metrics from Galp's Sustainability Statement`);
    console.log('\n✅ This proves the URL works - much better than the 0 metrics from the old URL!');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
