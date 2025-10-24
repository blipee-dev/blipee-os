/**
 * Automated PDF Report Finder
 * Uses web search to find actual sustainability report PDFs for all 70 companies
 * Populates company-report-urls.json with real URLs (no sample data)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const serperApiKey = process.env.SERPER_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CompanyReportUrl {
  sustainability_page: string;
  report_url: string;
  verified: boolean;
  note?: string;
}

interface ReportDatabase {
  companies: Record<string, CompanyReportUrl>;
  metadata: {
    last_updated: string;
    total_companies: number;
    verified_urls: number;
    notes: string;
  };
}

async function searchForPdfReport(companyName: string): Promise<string | null> {
  console.log(`   🔍 Searching for: ${companyName} sustainability report 2024 PDF`);

  if (!serperApiKey) {
    console.log('   ⚠️  SERPER_API_KEY not configured, using fallback pattern');
    return null;
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `${companyName} sustainability report 2024 PDF`,
        num: 10,
      }),
    });

    if (!response.ok) {
      console.log(`   ⚠️  Search API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const results = data.organic || [];

    // Look for PDF links in results
    for (const result of results) {
      const link = result.link;
      if (link && link.toLowerCase().endsWith('.pdf')) {
        console.log(`   ✓ Found PDF: ${link}`);
        return link;
      }
    }

    // Check if any result mentions PDF in title/snippet
    for (const result of results) {
      if (result.snippet?.toLowerCase().includes('pdf') ||
          result.title?.toLowerCase().includes('pdf')) {
        console.log(`   ✓ Found potential PDF page: ${result.link}`);
        return result.link;
      }
    }

    console.log(`   ⚠️  No PDF found in search results`);
    return null;

  } catch (error: any) {
    console.error(`   ❌ Search error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🔍 AUTOMATED PDF REPORT FINDER\n');
  console.log('Finding actual sustainability report PDFs for all 70 companies...\n');

  // Step 1: Load existing data
  const jsonPath = resolve(process.cwd(), 'data/company-report-urls.json');
  let reportData: ReportDatabase;

  try {
    const existingData = readFileSync(jsonPath, 'utf-8');
    reportData = JSON.parse(existingData);
    console.log(`✓ Loaded existing data: ${Object.keys(reportData.companies).length} companies\n`);
  } catch {
    reportData = {
      companies: {},
      metadata: {
        last_updated: new Date().toISOString().split('T')[0],
        total_companies: 0,
        verified_urls: 0,
        notes: 'Automated PDF discovery - all URLs found via web search'
      }
    };
    console.log(`✓ Starting fresh database\n`);
  }

  // Step 2: Get all companies from database
  const { data: companies, error } = await supabase
    .from('sector_companies')
    .select('company_name, sector, website')
    .eq('has_sustainability_report', true)
    .order('sector', { ascending: true });

  if (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }

  console.log(`📊 Found ${companies.length} companies with sustainability reports\n`);

  // Step 3: Search for PDFs
  let found = 0;
  let skipped = 0;
  let failed = 0;

  for (const company of companies) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 ${company.company_name} (${company.sector})`);
    console.log(`${'='.repeat(60)}`);

    // Skip if already in database with verified URL
    if (reportData.companies[company.company_name]?.verified) {
      console.log(`   ✓ Already verified - skipping`);
      skipped++;
      continue;
    }

    // Search for PDF
    const pdfUrl = await searchForPdfReport(company.company_name);

    if (pdfUrl) {
      reportData.companies[company.company_name] = {
        sustainability_page: company.website + '/sustainability',
        report_url: pdfUrl,
        verified: false, // Needs manual verification
        note: 'Found via automated search - needs verification'
      };
      found++;
      console.log(`   ✅ Added to database`);
    } else {
      failed++;
      console.log(`   ❌ No PDF found - needs manual research`);
    }

    // Rate limiting: 1 request per 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Step 4: Update metadata
  reportData.metadata.last_updated = new Date().toISOString().split('T')[0];
  reportData.metadata.total_companies = Object.keys(reportData.companies).length;
  reportData.metadata.verified_urls = Object.values(reportData.companies).filter(c => c.verified).length;

  // Step 5: Save to file
  writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 SEARCH RESULTS');
  console.log(`${'='.repeat(60)}\n`);

  console.log(`✅ Found: ${found} PDFs`);
  console.log(`⏭️  Skipped: ${skipped} (already verified)`);
  console.log(`❌ Failed: ${failed} (need manual research)`);
  console.log(`📁 Total in database: ${reportData.metadata.total_companies}\n`);

  console.log(`💾 Saved to: ${jsonPath}\n`);

  if (failed > 0) {
    console.log(`⚠️  ${failed} companies need manual PDF research`);
    console.log(`   Use the pattern: "[company name] sustainability report 2024 PDF"\n`);
  }

  if (found > 0) {
    console.log(`🎯 Next step: Manually verify ${found} URLs before running automation`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
