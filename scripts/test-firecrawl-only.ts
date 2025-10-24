/**
 * Test Firecrawl API directly
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

async function testFirecrawl() {
  console.log('🧪 Testing Firecrawl API\n');
  console.log('API Key:', firecrawlApiKey ? `${firecrawlApiKey.substring(0, 10)}...` : 'MISSING');

  // Try a simple web page first (not PDF)
  const testUrl = 'https://www.tesla.com/impact';

  console.log(`\n📄 Fetching: ${testUrl}`);

  try {
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

    console.log(`\nResponse status: ${response.status} ${response.statusText}`);

    const data = await response.json();
    console.log('\nResponse data:', JSON.stringify(data, null, 2).substring(0, 500));

    if (data.success) {
      const content = data.data?.markdown || data.data?.html || '';
      console.log(`\n✅ SUCCESS!`);
      console.log(`Content length: ${content.length} characters`);
      console.log(`\nFirst 500 chars:\n${content.substring(0, 500)}`);
    } else {
      console.log(`\n❌ FAILED: ${data.error || 'Unknown error'}`);
    }

  } catch (error: any) {
    console.log(`\n❌ ERROR: ${error.message}`);
  }
}

testFirecrawl();
