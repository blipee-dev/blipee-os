/**
 * Test Fixed Parser on Galp
 * Should extract 70+ metrics from structured GRI/ESRS tables
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';
import pdf from 'pdf-parse';

config({ path: resolve(process.cwd(), '.env.local') });

const deepseekApiKey = process.env.DEEPSEEK_API_KEY!;

const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

const GALP_URL = 'https://www.galp.com/corp/Portals/0/Recursos/Sustentabilidade/SharedResources/Documents/2024/SustainabilityStatement2024.pdf';

async function downloadPDF(url: string): Promise<Buffer> {
  console.log(`📥 Downloading PDF...`);
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log(`✓ Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB\n`);
  return buffer;
}

async function extractText(pdfBuffer: Buffer): Promise<string> {
  console.log(`📄 Extracting text...`);
  const data = await pdf(pdfBuffer);
  console.log(`✓ Extracted ${data.text.length.toLocaleString()} chars from ${data.numpages} pages\n`);
  return data.text;
}

async function extractDataWithAI(companyName: string, reportText: string): Promise<any> {
  console.log(`🤖 Extracting with FIXED parser...\n`);

  // Use 250K chars (DeepSeek 64K token limit)
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

  // Recursively flatten nested structure
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
  return flatData;
}

async function main() {
  console.log('🧪 TEST: FIXED PARSER ON GALP\n');
  console.log('Target: Extract 70+ metrics from structured tables\n');
  console.log('Previous: 33 metrics with 200K char truncation\n');
  console.log('='.repeat(70) + '\n');

  // Download & extract
  const pdfBuffer = await downloadPDF(GALP_URL);
  const text = await extractText(pdfBuffer);

  // Extract with FIXED parser
  const metrics = await extractDataWithAI('Galp Energia', text);

  const metricCount = Object.keys(metrics).filter(k => metrics[k] !== null && metrics[k] !== undefined).length;

  console.log('='.repeat(70));
  console.log('📊 RESULTS');
  console.log('='.repeat(70) + '\n');

  console.log(`✅ Extracted ${metricCount} metrics\n`);

  if (metricCount >= 70) {
    console.log('🎉 SUCCESS! Reached 70+ metric target!');
  } else if (metricCount >= 50) {
    console.log('✅ GOOD! 50+ metrics extracted (improvement from 33)');
  } else {
    console.log('⚠️  Still under 50 metrics - needs more work');
  }

  // Show sample
  console.log('\n📋 Sample extracted metrics:');
  Object.keys(metrics).slice(0, 15).forEach(key => {
    if (metrics[key] !== null && metrics[key] !== undefined) {
      console.log(`   ${key}: ${metrics[key]}`);
    }
  });
  console.log(`   ... and ${metricCount - 15} more`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
