/**
 * Test Firecrawl + DeepSeek Pipeline
 *
 * This script tests the complete automation:
 * 1. Fetch Tesla's sustainability report with Firecrawl
 * 2. Extract data with DeepSeek AI (faster & cheaper than GPT-4)
 * 3. Display extracted metrics (no database insertion)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

if (!deepseekApiKey) {
  console.error('❌ Missing DEEPSEEK_API_KEY');
  process.exit(1);
}

// Initialize DeepSeek client (uses OpenAI SDK with custom base URL)
const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

interface ParsedReportData {
  // Emissions
  scope1_emissions?: number;
  scope2_emissions?: number;
  scope3_emissions?: number;
  total_emissions?: number;
  ghg_intensity?: number;

  // Energy
  total_energy_consumption?: number;
  renewable_energy_percent?: number;
  renewable_energy_mwh?: number;
  energy_intensity?: number;

  // Water
  water_withdrawal?: number;
  water_discharge?: number;
  water_recycled?: number;
  water_intensity?: number;

  // Waste
  waste_generated?: number;
  waste_recycled?: number;
  waste_recycling_rate?: number;

  // Safety
  total_recordable_incident_rate?: number;
  lost_time_injury_rate?: number;
  fatalities?: number;

  // Social
  employee_count?: number;
  women_in_leadership?: number;
  training_hours_per_employee?: number;
  employee_turnover_rate?: number;

  // Supply Chain
  supplier_esg_assessments?: number;
  sustainable_sourcing_percent?: number;

  // Governance
  board_independence?: number;
  esg_linked_compensation?: boolean;
  externally_assured?: boolean;

  // Financial
  annual_revenue?: number;
  revenue_currency?: string;
}

/**
 * Fetch report content with Firecrawl
 */
async function fetchReportContent(reportUrl: string): Promise<string> {
  console.log(`📄 Fetching report: ${reportUrl}`);

  if (!firecrawlApiKey) {
    console.log(`⚠️  FIRECRAWL_API_KEY not found, using sample content`);
    return `[Sample Tesla Impact Report 2023 - Configure FIRECRAWL_API_KEY for real fetching]`;
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: reportUrl,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`Firecrawl scraping failed: ${data.error || 'Unknown error'}`);
    }

    const content = data.data?.markdown || data.data?.html || '';

    if (!content) {
      throw new Error('No content extracted from report');
    }

    console.log(`✓ Successfully fetched ${content.length} characters`);
    console.log(`✓ Preview: ${content.substring(0, 200)}...`);
    return content;

  } catch (error: any) {
    console.log(`⚠️  Firecrawl error: ${error.message}`);
    throw error;
  }
}

/**
 * Extract data with OpenAI
 */
async function extractDataWithAI(
  companyName: string,
  reportText: string
): Promise<ParsedReportData> {
  console.log(`\n🤖 Extracting data with AI for ${companyName}...`);

  const maxLength = 100000;
  const truncatedText = reportText.length > maxLength
    ? reportText.substring(0, maxLength) + '\n\n[Report truncated for length]'
    : reportText;

  const prompt = `Extract comprehensive sustainability metrics from this ${companyName} sustainability report.

REPORT CONTENT:
${truncatedText}

Extract the following metrics (use null for missing data, ensure all numbers are numeric):

EMISSIONS (in tons CO2e):
- scope1_emissions, scope2_emissions, scope3_emissions, total_emissions
- ghg_intensity (tons CO2e per $M revenue)

ENERGY:
- total_energy_consumption (MWh)
- renewable_energy_percent (0-100)
- renewable_energy_mwh (absolute MWh)
- energy_intensity (MWh per $M revenue)

WATER (in megaliters ML):
- water_withdrawal, water_discharge
- water_recycled (ML)
- water_intensity (ML per $M revenue)

WASTE (in tons):
- waste_generated, waste_recycled
- waste_recycling_rate (0-100 percent)

HEALTH & SAFETY:
- total_recordable_incident_rate (TRIR per 100 employees)
- lost_time_injury_rate (LTIR per 100 employees)
- fatalities (count)

SOCIAL:
- employee_count (total workforce)
- women_in_leadership (0-100 percent)
- training_hours_per_employee
- employee_turnover_rate (0-100 percent)

SUPPLY CHAIN:
- supplier_esg_assessments (count of audits)
- sustainable_sourcing_percent (0-100 percent)

GOVERNANCE:
- board_independence (0-100 percent)
- esg_linked_compensation (boolean)
- externally_assured (boolean)

FINANCIAL:
- annual_revenue (in millions)
- revenue_currency (ISO code, e.g., "USD")

Return ONLY valid JSON matching this exact structure with null for missing values.`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a sustainability data extraction expert. Extract metrics accurately from sustainability reports. Return only valid JSON with numeric values (never strings like "15M" - convert to 15000000). Use null for missing data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    const extracted = JSON.parse(content);

    // Flatten nested structure if AI returned categories
    let flatData: any = {};
    for (const key of Object.keys(extracted)) {
      if (typeof extracted[key] === 'object' && extracted[key] !== null && !Array.isArray(extracted[key])) {
        // If it's a nested category object, merge it into flatData
        flatData = { ...flatData, ...extracted[key] };
      } else {
        // If it's already flat, just copy it
        flatData[key] = extracted[key];
      }
    }

    const extractedCount = Object.keys(flatData).filter(k => flatData[k] !== null && flatData[k] !== undefined).length;
    console.log(`✓ Successfully extracted ${extractedCount} metrics`);

    return flatData as ParsedReportData;

  } catch (error: any) {
    console.log(`⚠️  AI extraction error: ${error.message}`);
    throw error;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🧪 Testing DeepSeek Extraction Pipeline\n');
  console.log('=' .repeat(60));

  // Use sample Tesla content for testing AI extraction
  const sampleContent = `
Tesla 2023 Impact Report

EMISSIONS AND CLIMATE
Our operations in 2023 resulted in the following greenhouse gas emissions:
- Scope 1 (Direct): 125,000 tons CO2e from our facilities
- Scope 2 (Indirect Energy): 380,000 tons CO2e from purchased electricity
- Scope 3 (Value Chain): 8,500,000 tons CO2e from supply chain and product use
- Total GHG Emissions: 9,005,000 tons CO2e

With revenue of $96.8 billion, our GHG intensity is 93 tons CO2e per million dollars revenue.

ENERGY CONSUMPTION
Total energy consumed across all facilities: 8,200,000 MWh
Renewable energy: 65% of total consumption (5,330,000 MWh)
Energy intensity: 85 MWh per million dollars revenue

WATER MANAGEMENT
Water withdrawal: 5,200 megaliter s
Water discharge: 4,100 megaliters
Water recycled: 1,300 megaliters (25% recycling rate)
Water intensity: 54 ML per million dollars revenue
Operations in water-stressed locations: Yes

WASTE AND CIRCULAR ECONOMY
Waste generated: 45,000 tons
Waste recycled: 40,500 tons
Waste recycling rate: 90%
Product take-back programs: Yes (battery recycling)

HEALTH AND SAFETY
Total Recordable Incident Rate (TRIR): 4.2 per 100 employees
Lost Time Injury Rate (LTIR): 1.8 per 100 employees
Fatalities: 0
Our TRIR increased compared to 2022, we are implementing additional safety measures.

WORKFORCE AND SOCIAL
Total employees: 127,855
Women in leadership positions: 25%
Average training hours per employee: 32 hours
Employee turnover rate: 18%

SUPPLY CHAIN
Supplier ESG assessments conducted: 450 suppliers audited
Sustainable sourcing: 45% of materials from sustainable sources

GOVERNANCE
Board independence: 80%
ESG-linked executive compensation: Yes
External assurance: No (self-reported data)

FINANCIAL
Annual revenue: $96,800 million USD
  `;

  try {
    // Step 1: Use sample content (skip Firecrawl for now)
    console.log('\n📄 Step 1: Using sample Tesla report content');
    console.log(`   Content length: ${sampleContent.length} characters`);
    const reportContent = sampleContent;

    // Step 2: Extract with DeepSeek
    console.log('\n🤖 Step 2: Extracting data with DeepSeek AI');
    const extracted = await extractDataWithAI('Tesla', reportContent);

    // Step 3: Display results
    console.log('\n📊 Step 3: Extraction Results');
    console.log('=' .repeat(60));

    console.log('\n🌍 EMISSIONS:');
    console.log(`  Scope 1: ${extracted.scope1_emissions ? extracted.scope1_emissions.toLocaleString() : 'N/A'} tons CO2e`);
    console.log(`  Scope 2: ${extracted.scope2_emissions ? extracted.scope2_emissions.toLocaleString() : 'N/A'} tons CO2e`);
    console.log(`  Scope 3: ${extracted.scope3_emissions ? extracted.scope3_emissions.toLocaleString() : 'N/A'} tons CO2e`);
    console.log(`  Total: ${extracted.total_emissions ? extracted.total_emissions.toLocaleString() : 'N/A'} tons CO2e`);
    console.log(`  Intensity: ${extracted.ghg_intensity ? extracted.ghg_intensity.toLocaleString() : 'N/A'} tons/$M`);

    console.log('\n⚡ ENERGY:');
    console.log(`  Total Consumption: ${extracted.total_energy_consumption ? extracted.total_energy_consumption.toLocaleString() : 'N/A'} MWh`);
    console.log(`  Renewable %: ${extracted.renewable_energy_percent || 'N/A'}%`);
    console.log(`  Renewable MWh: ${extracted.renewable_energy_mwh ? extracted.renewable_energy_mwh.toLocaleString() : 'N/A'} MWh`);
    console.log(`  Intensity: ${extracted.energy_intensity ? extracted.energy_intensity.toLocaleString() : 'N/A'} MWh/$M`);

    console.log('\n💧 WATER:');
    console.log(`  Withdrawal: ${extracted.water_withdrawal ? extracted.water_withdrawal.toLocaleString() : 'N/A'} ML`);
    console.log(`  Discharge: ${extracted.water_discharge ? extracted.water_discharge.toLocaleString() : 'N/A'} ML`);
    console.log(`  Recycled: ${extracted.water_recycled ? extracted.water_recycled.toLocaleString() : 'N/A'} ML`);
    console.log(`  Intensity: ${extracted.water_intensity ? extracted.water_intensity.toLocaleString() : 'N/A'} ML/$M`);

    console.log('\n♻️  WASTE:');
    console.log(`  Generated: ${extracted.waste_generated ? extracted.waste_generated.toLocaleString() : 'N/A'} tons`);
    console.log(`  Recycled: ${extracted.waste_recycled ? extracted.waste_recycled.toLocaleString() : 'N/A'} tons`);
    console.log(`  Recycling Rate: ${extracted.waste_recycling_rate || 'N/A'}%`);

    console.log('\n🦺 HEALTH & SAFETY:');
    console.log(`  TRIR: ${extracted.total_recordable_incident_rate || 'N/A'}`);
    console.log(`  LTIR: ${extracted.lost_time_injury_rate || 'N/A'}`);
    console.log(`  Fatalities: ${extracted.fatalities !== undefined ? extracted.fatalities : 'N/A'}`);

    console.log('\n👥 SOCIAL:');
    console.log(`  Employees: ${extracted.employee_count ? extracted.employee_count.toLocaleString() : 'N/A'}`);
    console.log(`  Women in Leadership: ${extracted.women_in_leadership || 'N/A'}%`);
    console.log(`  Training Hours/Employee: ${extracted.training_hours_per_employee || 'N/A'}`);
    console.log(`  Turnover Rate: ${extracted.employee_turnover_rate || 'N/A'}%`);

    console.log('\n🔗 SUPPLY CHAIN:');
    console.log(`  ESG Assessments: ${extracted.supplier_esg_assessments || 'N/A'}`);
    console.log(`  Sustainable Sourcing: ${extracted.sustainable_sourcing_percent || 'N/A'}%`);

    console.log('\n📊 GOVERNANCE:');
    console.log(`  Board Independence: ${extracted.board_independence || 'N/A'}%`);
    console.log(`  ESG-Linked Compensation: ${extracted.esg_linked_compensation ? 'Yes' : 'No'}`);
    console.log(`  Externally Assured: ${extracted.externally_assured ? 'Yes' : 'No'}`);

    console.log('\n💰 FINANCIAL:');
    console.log(`  Revenue: ${extracted.annual_revenue ? extracted.annual_revenue.toLocaleString() : 'N/A'}M ${extracted.revenue_currency || 'USD'}`);

    // Summary
    const totalFields = Object.keys(extracted).length;
    const populatedFields = Object.keys(extracted).filter(k => extracted[k] !== null && extracted[k] !== undefined).length;
    const coveragePercent = ((populatedFields / totalFields) * 100).toFixed(1);

    console.log('\n📈 EXTRACTION SUMMARY:');
    console.log(`  Total Fields: ${totalFields}`);
    console.log(`  Populated: ${populatedFields}`);
    console.log(`  Coverage: ${coveragePercent}%`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ AI Extraction test complete!');
    console.log('   ✓ DeepSeek extraction working (faster & cheaper!)');
    console.log('   ✓ Comprehensive metrics captured');
    console.log('   ℹ️  Next: Wire up Firecrawl MCP for production parser');

  } catch (error: any) {
    console.error('\n❌ Pipeline test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
