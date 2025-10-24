/**
 * Parse Large Reports (>250K chars)
 * Strategy: Chunk by GRI/ESRS sections, extract separately, merge results
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';

config({ path: resolve(process.cwd(), '.env.local') });

const deepseekApiKey = process.env.DEEPSEEK_API_KEY!;

const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

interface Section {
  name: string;
  keywords: string[];
  maxChars: number;
}

const SECTIONS: Section[] = [
  {
    name: 'emissions',
    keywords: ['GHG emissions', 'Scope 1', 'Scope 2', 'Scope 3', 'ESRS E1', 'tonCO2e', 'carbon', 'greenhouse gas'],
    maxChars: 60000
  },
  {
    name: 'energy',
    keywords: ['Energy consumption', 'MWh', 'renewable', 'fossil', 'ESRS E1-5', 'electricity', 'power'],
    maxChars: 40000
  },
  {
    name: 'water',
    keywords: ['Water consumption', 'withdrawal', 'discharge', 'recycled', 'ESRS E3', 'megaliters', 'm³'],
    maxChars: 30000
  },
  {
    name: 'waste',
    keywords: ['Waste', 'recycling', 'landfill', 'hazardous', 'ESRS E5', 'circular economy'],
    maxChars: 30000
  },
  {
    name: 'social',
    keywords: ['employees', 'diversity', 'women', 'training', 'ESRS S1', 'workforce', 'safety', 'TRIR', 'LTIF'],
    maxChars: 50000
  },
  {
    name: 'governance',
    keywords: ['board', 'ESG compensation', 'ESRS G1', 'governance', 'compliance', 'audit'],
    maxChars: 30000
  },
  {
    name: 'financial',
    keywords: ['revenue', 'EBITDA', 'financial', 'millions', '€', '$', 'performance'],
    maxChars: 20000
  }
];

/**
 * Extract section from full report text based on keywords
 * FIXED: Actually limit to maxChars, don't just find min/max positions
 */
function extractSection(fullText: string, section: Section): string {
  const lowerText = fullText.toLowerCase();

  // Find all positions where keywords appear
  const positions: number[] = [];

  for (const keyword of section.keywords) {
    const lowerKeyword = keyword.toLowerCase();
    let pos = lowerText.indexOf(lowerKeyword);

    while (pos !== -1) {
      positions.push(pos);
      pos = lowerText.indexOf(lowerKeyword, pos + 1);
    }
  }

  if (positions.length === 0) {
    return '';
  }

  // Sort positions
  positions.sort((a, b) => a - b);

  // FIXED: Take only the FIRST occurrence area + maxChars
  // Don't span from first to last occurrence (could be entire document!)
  const startPos = Math.max(0, positions[0] - 2000); // Include 2K chars before first match
  const endPos = Math.min(fullText.length, startPos + section.maxChars);

  const extracted = fullText.substring(startPos, endPos);

  console.log(`   ✓ ${section.name}: Found ${positions.length} keyword matches, extracted ${extracted.length.toLocaleString()} chars from position ${startPos}`);

  return extracted;
}

/**
 * Extract metrics from a specific section
 */
async function extractSectionMetrics(companyName: string, sectionName: string, sectionText: string): Promise<any> {
  if (sectionText.length < 500) {
    console.log(`   ⚠️  ${sectionName}: Too small (${sectionText.length} chars), skipping`);
    return {};
  }

  const prompts: Record<string, string> = {
    emissions: `Extract ALL GHG emissions metrics:
- scope1_emissions, scope2_emissions_market_based, scope2_emissions_location_based
- scope3_emissions, total_emissions
- Breakdowns by source (combustion, flaring, fugitive, venting, process)
- Breakdowns by business unit
- ghg_intensity, biogenic_emissions`,

    energy: `Extract ALL energy metrics:
- total_energy_consumption (MWh)
- renewable_energy_percent, renewable_energy_mwh
- fossil_energy_mwh, nuclear_energy_mwh
- energy_intensity`,

    water: `Extract ALL water metrics:
- water_withdrawal, water_discharge, water_consumption (megaliters)
- water_recycled, water_intensity
- water_withdrawal_stress_areas`,

    waste: `Extract ALL waste metrics:
- waste_generated, waste_recycled, waste_to_landfill (tons)
- waste_recycling_rate, hazardous_waste`,

    social: `Extract ALL social metrics:
- employee_count, women_in_leadership, women_in_workforce, women_in_management
- training_hours_per_employee, employee_turnover_rate
- total_recordable_incident_rate, lost_time_injury_frequency, fatalities
- lost_time_injuries, days_lost`,

    governance: `Extract ALL governance metrics:
- board_independence, women_on_board
- esg_linked_compensation (boolean true/false ONLY)
- externally_assured (boolean true/false ONLY)
- assurance_provider`,

    financial: `Extract ALL financial metrics:
- annual_revenue (millions)
- revenue_currency (EUR, USD, etc.)
- revenue_from_fossil_fuels, ebitda`
  };

  const prompt = `You are extracting ${sectionName} metrics from a ${companyName} sustainability report.

${prompts[sectionName] || 'Extract all relevant metrics.'}

SECTION TEXT:
${sectionText}

Return ONLY valid JSON with numeric values. Booleans must be true/false. Use null for missing data.`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Extract sustainability metrics. Return valid JSON with numeric values. Booleans must be true/false.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content!;
    const extracted = JSON.parse(content);

    // Flatten
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
    console.log(`   ❌ ${sectionName}: Extraction failed - ${error.message}`);
    return {};
  }
}

/**
 * Extract from large report using chunking strategy
 */
export async function extractLargeReport(companyName: string, reportText: string): Promise<any> {
  console.log(`\n📊 LARGE REPORT EXTRACTION: ${companyName}`);
  console.log(`   Report size: ${reportText.length.toLocaleString()} chars`);
  console.log(`   Strategy: Section-by-section extraction\n`);

  const allMetrics: any = {};

  // Extract each section
  for (const section of SECTIONS) {
    console.log(`\n   🔍 Processing ${section.name}...`);

    const sectionText = extractSection(reportText, section);

    if (sectionText) {
      const metrics = await extractSectionMetrics(companyName, section.name, sectionText);
      Object.assign(allMetrics, metrics);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const metricCount = Object.keys(allMetrics).filter(k => allMetrics[k] !== null && allMetrics[k] !== undefined).length;

  console.log(`\n   ✅ Total extracted: ${metricCount} metrics from ${SECTIONS.length} sections`);

  return allMetrics;
}

// Test function
async function test() {
  const testText = `
    GHG Emissions (tonCO2e)
    Scope 1: 3,128,177
    Scope 2 (market): 8,820
    Scope 3: 42,717,945

    Energy Consumption (MWh)
    Total: 7,636,480
    Renewable: 6.3%

    Water Consumption (ML)
    Withdrawal: 7,941
    Discharge: 4,743
  `.repeat(100); // Simulate large report

  const result = await extractLargeReport('Test Company', testText);
  console.log('\n📊 Test Results:', result);
}

if (require.main === module) {
  test()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}
