/**
 * Test FULL Pipeline: Firecrawl + DeepSeek
 * Use a sustainability report webpage (not PDF)
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

async function testFullPipeline() {
  console.log('🧪 Testing FULL Pipeline: Firecrawl → DeepSeek\n');
  console.log('='.repeat(60));

  // Try Patagonia's sustainability page (HTML, not PDF)
  const testUrl = 'https://www.patagonia.com/our-footprint/';

  try {
    // Step 1: Fetch with Firecrawl
    console.log('\n📥 STEP 1: Fetching with Firecrawl');
    console.log(`URL: ${testUrl}`);

    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: testUrl,
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
    console.log(`✓ Fetched ${content.length} characters`);
    console.log(`Preview: ${content.substring(0, 300)}...`);

    // Step 2: Extract with DeepSeek
    console.log('\n🤖 STEP 2: Extracting with DeepSeek');

    const prompt = `Extract sustainability metrics from this Patagonia content:

${content.substring(0, 50000)}

Return JSON with any available metrics:
- scope1_emissions, scope2_emissions, scope3_emissions, total_emissions
- renewable_energy_percent
- water_withdrawal, water_recycled
- waste_recycling_rate
- employee_count
- women_in_leadership
- any other sustainability metrics you find

Use null for missing data.`;

    const aiResponse = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Extract sustainability metrics. Return valid JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const extracted = JSON.parse(aiResponse.choices[0].message.content!);
    const metricCount = Object.keys(extracted).filter(k => extracted[k] !== null).length;

    console.log(`✓ Extracted ${metricCount} metrics`);
    console.log('\n📊 Results:');
    console.log(JSON.stringify(extracted, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('✅ FULL PIPELINE WORKING!');
    console.log('   ✓ Firecrawl: Fetching content');
    console.log('   ✓ DeepSeek: Extracting metrics');
    console.log('   ✓ Ready for production!');

  } catch (error: any) {
    console.log(`\n❌ Pipeline failed: ${error.message}`);
  }
}

testFullPipeline();
