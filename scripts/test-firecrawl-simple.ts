/**
 * Test Firecrawl API with simple webpage
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

async function testSimplePage() {
  console.log('🧪 Testing Firecrawl with Simple Webpage\n');

  // Try a very simple, fast-loading page
  const testUrl = 'https://example.com';

  console.log(`📄 Fetching: ${testUrl}`);

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
      }),
    });

    console.log(`Response status: ${response.status}`);

    const data = await response.json();

    if (data.success) {
      console.log(`✅ SUCCESS! Upgrade is working!`);
      console.log(`Content: ${data.data?.markdown?.substring(0, 200)}`);
    } else {
      console.log(`❌ FAILED: ${data.error}`);
    }

  } catch (error: any) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

testSimplePage();
