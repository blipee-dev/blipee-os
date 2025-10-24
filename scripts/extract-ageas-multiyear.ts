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

async function extractText(pdfPath: string): Promise<string> {
  console.log(`📄 Extracting text from ${pdfPath}...`);
  const buffer = readFileSync(pdfPath);
  const data = await pdf(buffer);
  console.log(`✓ Extracted ${data.text.length.toLocaleString()} chars from ${data.numpages} pages\n`);
  return data.text;
}

async function extractDataWithAI(companyName: string, reportText: string): Promise<any> {
  console.log(`🤖 Extracting with DeepSeek AI (MULTI-YEAR MODE)...\n`);

  // Sweet spot: 250K chars balances context vs model capacity
  const maxLength = 250000;
  const textToAnalyze = reportText.length > maxLength
    ? reportText.substring(0, maxLength) + '\n\n[Document continues]'
    : reportText;

  console.log(`Using ${textToAnalyze.length.toLocaleString()} of ${reportText.length.toLocaleString()} characters (${((textToAnalyze.length/reportText.length)*100).toFixed(1)}%)\n`);

  const prompt = `You are an expert sustainability data analyst extracting metrics from GRI/ESRS sustainability reports.

CRITICAL: Sustainability reports contain MULTIPLE YEARS OF DATA (typically 2024 and 2023 in separate columns).

YOUR TASK: Extract metrics for BOTH years whenever available. Use _2024 and _2023 suffixes.

EXAMPLE FORMAT:
{
  "ghg_emissions_total_2024": 439504,
  "ghg_emissions_total_2023": 425000,
  "scope1_emissions_2024": 1480,
  "scope1_emissions_2023": 1520,
  "employee_count_2024": 1399,
  "employee_count_2023": 1350
}

COMPANY: ${companyName}

REPORT TEXT:
${textToAnalyze}

Extract EVERY metric from structured tables FOR BOTH 2024 AND 2023.

METRIC CATEGORIES TO EXTRACT (for both years):

1. GHG EMISSIONS (tonCO2e):
   - total_ghg_emissions, scope1, scope2, scope3
   - scope1_by_source (combustion, flaring, fugitive, venting, process)
   - scope1_by_business_unit
   - scope3_by_category (purchased_goods, fuel_energy, transport, etc)
   - carbon_intensity, biogenic_emissions

2. ENERGY (MWh):
   - total_energy_consumption
   - fossil_fuels, renewable_sources, nuclear
   - energy_intensity

3. WATER (m³ or ML):
   - withdrawal, discharge, consumption, recycled
   - water_intensity
   - withdrawal_in_stress_areas

4. WASTE (tons):
   - total_waste_generated, recycled, to_landfill
   - recycling_rate, hazardous_waste

5. SOCIAL:
   - employee_count, male_employees, female_employees
   - women_in_management, women_in_leadership, women_on_board
   - training_hours_per_employee, turnover_rate
   - work_accident_rate, fatalities, lost_time_injuries
   - gender_pay_gap, diversity_metrics

6. GOVERNANCE:
   - board_independence, board_female_representation
   - esg_linked_compensation (boolean)
   - externally_assured (boolean)
   - assurance_provider

7. FINANCIAL:
   - annual_revenue, revenue_currency
   - revenue_by_sector, sustainable_investments
   - ebitda

8. SAFETY:
   - trir, ltif, fatalities

Return ONLY valid JSON. Use null if data not available for a specific year.`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: 'Extract sustainability metrics for MULTIPLE YEARS (2024 and 2023). Return ONLY valid JSON with _2024 and _2023 suffixes. Numbers must be numeric, booleans must be true/false.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 8000, // Increased for multi-year data
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
  const pdfPath = '/tmp/ageas/report.pdf';
  const companyName = 'Grupo Ageas Portugal';

  console.log('======================================================================');
  console.log(`📊 ${companyName} - MULTI-YEAR EXTRACTION`);
  console.log('======================================================================\n');

  const text = await extractText(pdfPath);

  const metrics = await extractDataWithAI(companyName, text);

  const metricCount = Object.keys(metrics).filter(k => metrics[k] !== null && metrics[k] !== undefined).length;

  // Count by year
  const metrics2024 = Object.keys(metrics).filter(k => k.includes('_2024') && metrics[k] !== null).length;
  const metrics2023 = Object.keys(metrics).filter(k => k.includes('_2023') && metrics[k] !== null).length;

  console.log(`✓ Extracted ${metricCount} total metrics`);
  console.log(`   - 2024: ${metrics2024} metrics`);
  console.log(`   - 2023: ${metrics2023} metrics\n`);

  // Save to file
  const outputDir = resolve(process.cwd(), 'data/extracted');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const filename = 'grupo-ageas-portugal-multiyear.json';
  const filepath = resolve(outputDir, filename);

  const output = {
    company_name: companyName,
    report_years: [2024, 2023],
    framework: 'GRI/ESRS',
    extracted_at: new Date().toISOString(),
    metric_count: metricCount,
    metrics_2024: metrics2024,
    metrics_2023: metrics2023,
    metrics: metrics
  };

  writeFileSync(filepath, JSON.stringify(output, null, 2));
  console.log(`✅ SUCCESS: Saved to ${filepath}`);

  // Show sample for both years
  console.log('\n📋 Sample metrics (2024):');
  Object.keys(metrics).filter(k => k.includes('_2024')).slice(0, 10).forEach(key => {
    if (metrics[key] !== null && metrics[key] !== undefined) {
      console.log(`   ${key}: ${metrics[key]}`);
    }
  });

  console.log('\n📋 Sample metrics (2023):');
  Object.keys(metrics).filter(k => k.includes('_2023')).slice(0, 10).forEach(key => {
    if (metrics[key] !== null && metrics[key] !== undefined) {
      console.log(`   ${key}: ${metrics[key]}`);
    }
  });

  const improvement = ((metricCount / 54) * 100 - 100).toFixed(0);
  console.log(`\n📊 Improvement: ${improvement}% more metrics vs single-year extraction (54 metrics)`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
