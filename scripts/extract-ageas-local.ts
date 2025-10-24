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
  console.log(`🤖 Extracting with DeepSeek AI...\n`);

  const maxLength = 250000;
  const textToAnalyze = reportText.length > maxLength
    ? reportText.substring(0, maxLength) + '\n\n[Document continues]'
    : reportText;

  console.log(`Using ${textToAnalyze.length.toLocaleString()} of ${reportText.length.toLocaleString()} characters (${((textToAnalyze.length/reportText.length)*100).toFixed(1)}%)\n`);

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

COMPANY: ${companyName}

REPORT TEXT:
${textToAnalyze}

Extract EVERY metric from structured tables. Return ONLY valid JSON with numeric values.

CRITICAL: For booleans, use ONLY true or false, NEVER numbers like 30 or strings.`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: 'Extract sustainability metrics from GRI/ESRS reports. Return ONLY valid JSON. Numbers must be numeric, booleans must be true/false.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 4000,
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
  console.log(`📊 ${companyName}`);
  console.log('======================================================================\n');

  const text = await extractText(pdfPath);

  const metrics = await extractDataWithAI(companyName, text);

  const metricCount = Object.keys(metrics).filter(k => metrics[k] !== null && metrics[k] !== undefined).length;

  console.log(`✓ Extracted ${metricCount} metrics\n`);

  // Save to file
  const outputDir = resolve(process.cwd(), 'data/extracted');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const filename = 'grupo-ageas-portugal.json';
  const filepath = resolve(outputDir, filename);

  const output = {
    company_name: companyName,
    report_year: 2024,
    framework: 'GRI/ESRS',
    extracted_at: new Date().toISOString(),
    metric_count: metricCount,
    metrics: metrics
  };

  writeFileSync(filepath, JSON.stringify(output, null, 2));
  console.log(`✅ SUCCESS: Saved to ${filepath}`);

  // Show sample
  console.log('\n📋 Sample metrics:');
  Object.keys(metrics).slice(0, 15).forEach(key => {
    if (metrics[key] !== null && metrics[key] !== undefined) {
      console.log(`   ${key}: ${metrics[key]}`);
    }
  });
  if (metricCount > 15) {
    console.log(`   ... and ${metricCount - 15} more`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
