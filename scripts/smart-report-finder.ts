/**
 * Smart Report Finder
 * Uses Firecrawl to find actual sustainability report URLs from landing pages
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const firecrawlApiKey = process.env.FIRECRAWL_API_KEY!;

async function findReportUrl(landingPageUrl: string): Promise<string | null> {
  console.log(`\n🔍 Finding report URL from: ${landingPageUrl}`);

  try {
    // Step 1: Scrape landing page
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: landingPageUrl,
        formats: ['markdown', 'links'],
        onlyMainContent: false, // Get all links including navigation
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
    const links = data.data?.links || [];

    console.log(`   ✓ Found ${links.length} links`);

    // Step 2: Find sustainability report links
    const reportKeywords = [
      'sustainability-report',
      'esg-report',
      'impact-report',
      'annual-report',
      'integrated-report',
      'sustainability_report',
      'esg_report',
      'corporate-responsibility',
      'csr-report',
    ];

    const pdfKeywords = [
      '.pdf',
      'download',
      'report',
    ];

    // Filter for likely report URLs
    const reportLinks = links.filter((link: string) => {
      const lower = link.toLowerCase();

      // Check for report keywords
      const hasReportKeyword = reportKeywords.some(kw => lower.includes(kw));

      // Check for PDF or report-like patterns
      const hasPdfPattern = pdfKeywords.some(kw => lower.includes(kw));

      // Check for year (2023, 2024)
      const hasYear = /202[3-4]/.test(link);

      return (hasReportKeyword || (hasPdfPattern && hasYear));
    });

    console.log(`   ✓ Found ${reportLinks.length} potential report links`);

    if (reportLinks.length > 0) {
      // Sort by likelihood (PDFs with recent years first)
      reportLinks.sort((a: string, b: string) => {
        const aScore =
          (a.includes('.pdf') ? 10 : 0) +
          (a.includes('2024') ? 5 : a.includes('2023') ? 3 : 0) +
          (a.includes('sustainability') ? 2 : 0);

        const bScore =
          (b.includes('.pdf') ? 10 : 0) +
          (b.includes('2024') ? 5 : b.includes('2023') ? 3 : 0) +
          (b.includes('sustainability') ? 2 : 0);

        return bScore - aScore;
      });

      console.log(`   📄 Best match: ${reportLinks[0]}`);
      return reportLinks[0];
    }

    // Step 3: If no direct links found, search content for PDF mentions
    const pdfMatches = content.match(/https?:\/\/[^\s]+\.pdf/gi);
    if (pdfMatches && pdfMatches.length > 0) {
      console.log(`   📄 Found PDF in content: ${pdfMatches[0]}`);
      return pdfMatches[0];
    }

    console.log(`   ⚠️  No report links found`);
    return null;

  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🔍 Smart Report Finder - Test\n');

  const testCompanies = [
    { name: 'Equinor', url: 'https://www.equinor.com/sustainability' },
    { name: 'Unilever', url: 'https://www.unilever.com/planet-and-society/' },
    { name: 'SAP', url: 'https://www.sap.com/about/company/sustainability.html' },
    { name: 'Carrefour', url: 'https://www.carrefour.com/en/csr' },
    { name: 'Galp Energia', url: 'https://www.galp.com/corp/en/sustainability' },
  ];

  const results: Record<string, string | null> = {};

  for (const company of testCompanies) {
    const reportUrl = await findReportUrl(company.url);
    results[company.name] = reportUrl;

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS');
  console.log('='.repeat(60) + '\n');

  for (const [company, url] of Object.entries(results)) {
    if (url) {
      console.log(`✅ ${company}`);
      console.log(`   ${url}\n`);
    } else {
      console.log(`❌ ${company}: No report found\n`);
    }
  }

  const successCount = Object.values(results).filter(u => u !== null).length;
  console.log(`\nSuccess rate: ${successCount}/${testCompanies.length}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
