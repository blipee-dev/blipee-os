/**
 * Find Sustainability Reports V2
 * Searches specifically for "sustainability report" OR "sustainability statement" PDFs
 * More targeted than generic search
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
  search_term_used?: string;
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

async function searchForReport(companyName: string): Promise<{ url: string; term: string } | null> {
  console.log(`   🔍 Searching: ${companyName}`);

  if (!serperApiKey) {
    console.log('   ⚠️  SERPER_API_KEY not configured');
    return null;
  }

  // Try multiple search terms in order
  const searchTerms = [
    `"${companyName}" "sustainability report" 2023 OR 2024 filetype:pdf`,
    `"${companyName}" "sustainability statement" 2023 OR 2024 filetype:pdf`,
    `"${companyName}" "ESG report" 2023 OR 2024 filetype:pdf`,
  ];

  for (const searchTerm of searchTerms) {
    try {
      console.log(`   🔍 Try: ${searchTerm}`);

      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': serperApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: searchTerm,
          num: 5,
        }),
      });

      if (!response.ok) {
        console.log(`   ⚠️  Search API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const results = data.organic || [];

      // Look for PDF links
      for (const result of results) {
        const link = result.link;
        if (link && link.toLowerCase().endsWith('.pdf')) {
          // Validate URL contains company or domain
          const lowerLink = link.toLowerCase();
          const lowerCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
          const companyWords = companyName.toLowerCase().split(/\s+/);

          // Check if URL contains company name or major keywords
          const hasCompanyMatch = companyWords.some(word =>
            word.length > 3 && lowerLink.includes(word)
          );

          if (hasCompanyMatch) {
            console.log(`   ✓ Found: ${link}`);
            console.log(`   ✓ Term: ${searchTerm}`);
            return { url: link, term: searchTerm };
          }
        }
      }

      // Small delay between searches
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error: any) {
      console.error(`   ❌ Search error: ${error.message}`);
    }
  }

  console.log(`   ⚠️  No PDF found`);
  return null;
}

async function main() {
  console.log('🔍 FIND SUSTAINABILITY REPORTS V2\n');
  console.log('Searching for: "sustainability report" OR "sustainability statement"\n');

  // Load existing data
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
        notes: 'V2: Targeted search for sustainability reports/statements'
      }
    };
  }

  // Get companies with poor results (0 metrics or very small files)
  const { data: companies, error } = await supabase
    .from('sector_companies')
    .select('company_name, sector, website')
    .eq('has_sustainability_report', true)
    .order('sector', { ascending: true });

  if (error) {
    console.error('❌ Database error:', error.message);
    process.exit(1);
  }

  console.log(`📊 Found ${companies.length} companies\n`);

  let found = 0;
  let skipped = 0;
  let failed = 0;

  for (const company of companies) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 ${company.company_name} (${company.sector})`);
    console.log(`${'='.repeat(60)}`);

    // Skip manually verified URLs
    const existing = reportData.companies[company.company_name];
    if (existing?.verified) {
      console.log(`   ✓ Already verified - skipping`);
      skipped++;
      continue;
    }

    // Search for report
    const result = await searchForReport(company.company_name);

    if (result) {
      reportData.companies[company.company_name] = {
        sustainability_page: company.website + '/sustainability',
        report_url: result.url,
        verified: false,
        note: 'V2 search - needs verification',
        search_term_used: result.term
      };
      found++;
      console.log(`   ✅ Added to database`);
    } else {
      failed++;
      console.log(`   ❌ No PDF found - needs manual research`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Update metadata
  reportData.metadata.last_updated = new Date().toISOString().split('T')[0];
  reportData.metadata.total_companies = Object.keys(reportData.companies).length;
  reportData.metadata.verified_urls = Object.values(reportData.companies).filter(c => c.verified).length;

  // Save
  writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 SEARCH RESULTS');
  console.log(`${'='.repeat(60)}\n`);

  console.log(`✅ Found: ${found} PDFs`);
  console.log(`⏭️  Skipped: ${skipped} (already verified)`);
  console.log(`❌ Failed: ${failed} (need manual research)`);
  console.log(`📁 Total in database: ${reportData.metadata.total_companies}\n`);

  console.log(`💾 Saved to: ${jsonPath}\n`);

  console.log(`🎯 Next: Review and verify URLs before running automation`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
