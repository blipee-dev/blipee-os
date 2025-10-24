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

async function extractPass1(companyName: string, reportText: string): Promise<any> {
  console.log(`🔍 PASS 1: Extracting from first 250K chars (2024 focus)...\n`);

  const textToAnalyze = reportText.substring(0, 250000);

  const prompt = `You are an expert sustainability data analyst extracting metrics from GRI/ESRS sustainability reports.

CRITICAL: Extract metrics for BOTH 2024 AND 2023 when present. Use _2024 and _2023 suffixes.

COMPANY: ${companyName}

REPORT TEXT:
${textToAnalyze}

Extract ALL metrics for BOTH years. Return ONLY valid JSON.

Example format:
{
  "ghg_emissions_total_2024": 439504,
  "ghg_emissions_total_2023": 425000,
  "scope1_emissions_2024": 1480,
  "scope1_emissions_2023": 1520
}`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: 'Extract sustainability metrics for multiple years. Return ONLY valid JSON with _2024 and _2023 suffixes.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 8000,
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

  return flattenObject(extracted);
}

async function extractPass2(companyName: string, reportText: string): Promise<any> {
  console.log(`🔍 PASS 2: Searching for 2023 data in remaining text...\n`);

  // Extract sections with "2023" from the last 200K chars
  const remainingText = reportText.substring(250000);

  if (remainingText.length < 1000) {
    console.log(`   ⚠️  Insufficient remaining text, skipping Pass 2\n`);
    return {};
  }

  // Find all occurrences of "2023" and extract surrounding context
  const contextSize = 5000;
  const positions: number[] = [];
  let pos = remainingText.indexOf('2023');

  while (pos !== -1 && positions.length < 10) {
    positions.push(pos);
    pos = remainingText.indexOf('2023', pos + 1);
  }

  if (positions.length === 0) {
    console.log(`   ⚠️  No "2023" found in remaining text\n`);
    return {};
  }

  console.log(`   Found ${positions.length} mentions of "2023" in remaining text`);

  // Extract chunks around each "2023" mention
  const chunks: string[] = [];
  for (const position of positions.slice(0, 5)) { // Limit to 5 chunks
    const start = Math.max(0, position - contextSize / 2);
    const end = Math.min(remainingText.length, position + contextSize / 2);
    chunks.push(remainingText.substring(start, end));
  }

  const combinedChunks = chunks.join('\n\n---\n\n');
  const textToAnalyze = combinedChunks.substring(0, 100000); // 100K chars max

  const prompt = `You are an expert sustainability data analyst extracting 2023 metrics from GRI/ESRS sustainability reports.

FOCUS: Extract ONLY 2023 data (last year's comparative data). Use _2023 suffix.

COMPANY: ${companyName}

TEXT SNIPPETS CONTAINING 2023 DATA:
${textToAnalyze}

Extract ALL 2023 metrics. Return ONLY valid JSON with _2023 suffix.

Example:
{
  "ghg_emissions_total_2023": 425000,
  "scope1_emissions_2023": 1520,
  "employee_count_2023": 1350,
  "energy_consumption_2023": 22000
}`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: 'Extract 2023 sustainability metrics. Return ONLY valid JSON with _2023 suffixes.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 6000,
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

  return flattenObject(extracted);
}

async function mergeResults(pass1: any, pass2: any): Promise<any> {
  // Merge Pass 2 into Pass 1, preferring Pass 1 for conflicts
  const merged = { ...pass1 };

  for (const key of Object.keys(pass2)) {
    if (!(key in merged) || merged[key] === null) {
      merged[key] = pass2[key];
    }
  }

  return merged;
}

async function main() {
  const pdfPath = '/tmp/ageas/report.pdf';
  const companyName = 'Grupo Ageas Portugal';

  console.log('======================================================================');
  console.log(`📊 ${companyName} - TWO-PASS MULTI-YEAR EXTRACTION`);
  console.log('======================================================================\n');

  const text = await extractText(pdfPath);

  // Pass 1: First 250K chars (2024 + some 2023)
  const pass1Results = await extractPass1(companyName, text);
  const pass1Count = Object.keys(pass1Results).filter(k => pass1Results[k] !== null).length;
  const pass1_2024 = Object.keys(pass1Results).filter(k => k.includes('_2024') && pass1Results[k] !== null).length;
  const pass1_2023 = Object.keys(pass1Results).filter(k => k.includes('_2023') && pass1Results[k] !== null).length;

  console.log(`✅ Pass 1: ${pass1Count} metrics (2024: ${pass1_2024}, 2023: ${pass1_2023})\n`);

  // Rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Pass 2: Search for 2023 in remaining text
  const pass2Results = await extractPass2(companyName, text);
  const pass2Count = Object.keys(pass2Results).filter(k => pass2Results[k] !== null).length;
  const pass2_2023 = Object.keys(pass2Results).filter(k => k.includes('_2023') && pass2Results[k] !== null).length;

  console.log(`✅ Pass 2: ${pass2Count} metrics (2023: ${pass2_2023})\n`);

  // Merge results
  const mergedResults = await mergeResults(pass1Results, pass2Results);
  const totalCount = Object.keys(mergedResults).filter(k => mergedResults[k] !== null).length;
  const total2024 = Object.keys(mergedResults).filter(k => k.includes('_2024') && mergedResults[k] !== null).length;
  const total2023 = Object.keys(mergedResults).filter(k => k.includes('_2023') && mergedResults[k] !== null).length;

  console.log(`📊 MERGED RESULTS: ${totalCount} total metrics`);
  console.log(`   - 2024: ${total2024} metrics`);
  console.log(`   - 2023: ${total2023} metrics\n`);

  // Save to file
  const outputDir = resolve(process.cwd(), 'data/extracted');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const filename = 'grupo-ageas-portugal-twopass.json';
  const filepath = resolve(outputDir, filename);

  const output = {
    company_name: companyName,
    report_years: [2024, 2023],
    framework: 'GRI/ESRS',
    extraction_strategy: 'two-pass',
    extracted_at: new Date().toISOString(),
    metric_count: totalCount,
    metrics_2024: total2024,
    metrics_2023: total2023,
    metrics: mergedResults
  };

  writeFileSync(filepath, JSON.stringify(output, null, 2));
  console.log(`✅ SUCCESS: Saved to ${filepath}`);

  // Show comparison
  console.log('\n📈 COMPARISON:');
  console.log(`   Single-year: 54 metrics (2024 only)`);
  console.log(`   Multi-year (1-pass): 62 metrics (2024: 40, 2023: 22)`);
  console.log(`   Multi-year (2-pass): ${totalCount} metrics (2024: ${total2024}, 2023: ${total2023})`);

  const improvement = ((totalCount / 54) * 100 - 100).toFixed(0);
  console.log(`\n   📊 Improvement: +${improvement}% vs single-year extraction`);

  // Sample
  console.log('\n📋 Sample 2024 metrics:');
  Object.keys(mergedResults).filter(k => k.includes('_2024')).slice(0, 8).forEach(key => {
    if (mergedResults[key] !== null) {
      console.log(`   ${key}: ${mergedResults[key]}`);
    }
  });

  console.log('\n📋 Sample 2023 metrics:');
  Object.keys(mergedResults).filter(k => k.includes('_2023')).slice(0, 8).forEach(key => {
    if (mergedResults[key] !== null) {
      console.log(`   ${key}: ${mergedResults[key]}`);
    }
  });
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
