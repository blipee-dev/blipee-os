import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Company {
  id: string;
  name: string;
  website: string;
}

async function findStandardsDocuments() {
  console.log('======================================================================');
  console.log('🔍 AUTOMATED GRI/ESRS/STANDARDS DOCUMENT FINDER');
  console.log('======================================================================\n');

  // Get all companies
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, website')
    .order('name');

  if (error || !companies) {
    console.log('❌ Error fetching companies:', error);
    return;
  }

  console.log(`📊 Found ${companies.length} companies\n`);

  const searchPatterns = [
    // GRI patterns (as before)
    'GRI-content-index',
    'GRI-table',
    'GRI-index',
    'standards-disclosure',
    'sustainability-standards',
    'GRI-standards',

    // ESRS patterns (NEW - as user requested!)
    'ESRS-disclosure',
    'ESRS-standards',
    'ESRS-report',
    'european-sustainability-reporting',
    'ESRS-datapoints',
    'ESRS-metrics',

    // Combined patterns
    'GRI-SASB-WEF-TCFD',
    'GRI-SASB-ESRS',
    'standards-GRI-ESRS',
    'sustainability-disclosure-standards',

    // SASB patterns
    'SASB-standards',
    'SASB-metrics',
    'SASB-disclosure',

    // TCFD patterns
    'TCFD-report',
    'climate-disclosure',

    // General standards patterns
    'esg-data-tables',
    'sustainability-performance-data',
    'esg-metrics-tables'
  ];

  const results: any[] = [];

  for (const company of companies) {
    console.log(`\n🔍 ${company.name}`);
    console.log(`   Website: ${company.website || 'No website'}`);

    if (!company.website) {
      console.log('   ⚠️  No website - skipping');
      continue;
    }

    // Build search queries
    const searches = [];

    // 1. Site-specific search for GRI/ESRS documents
    for (const pattern of searchPatterns) {
      searches.push({
        query: `site:${company.website} "${pattern}" filetype:pdf`,
        pattern: pattern,
        type: 'exact'
      });
    }

    // 2. Company name + standards keywords
    searches.push(
      {
        query: `"${company.name}" "GRI content index" OR "GRI table" filetype:pdf`,
        pattern: 'GRI-general',
        type: 'general'
      },
      {
        query: `"${company.name}" "ESRS disclosure" OR "ESRS standards" filetype:pdf`,
        pattern: 'ESRS-general',
        type: 'general'
      },
      {
        query: `"${company.name}" "sustainability standards" OR "ESG data" filetype:pdf`,
        pattern: 'standards-general',
        type: 'general'
      }
    );

    results.push({
      company_id: company.id,
      company_name: company.name,
      website: company.website,
      search_queries: searches.map(s => s.query),
      pattern_count: searches.length
    });

    console.log(`   ✓ Generated ${searches.length} search queries`);
    console.log(`   📋 Top patterns: GRI-index, ESRS-disclosure, GRI-SASB-ESRS, TCFD`);
  }

  // Save search queries to file
  const outputPath = resolve(process.cwd(), 'data/standards-document-searches.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('\n======================================================================');
  console.log('✅ SEARCH QUERIES GENERATED');
  console.log('======================================================================\n');
  console.log(`📁 Saved to: ${outputPath}`);
  console.log(`📊 Total companies: ${results.length}`);
  console.log(`🔍 Total search queries: ${results.reduce((sum, r) => sum + r.pattern_count, 0)}`);

  console.log('\n📋 SEARCH PATTERNS INCLUDED:');
  console.log('─'.repeat(70));
  console.log('✅ GRI: content-index, table, index, standards');
  console.log('✅ ESRS: disclosure, standards, datapoints, metrics (NEW!)');
  console.log('✅ Combined: GRI-SASB-ESRS, GRI-SASB-WEF-TCFD');
  console.log('✅ SASB: standards, metrics, disclosure');
  console.log('✅ TCFD: report, climate-disclosure');
  console.log('✅ General: esg-data-tables, performance-data');

  console.log('\n💡 NEXT STEPS:');
  console.log('─'.repeat(70));
  console.log('1. Use these queries with Google Search or Firecrawl');
  console.log('2. Download found PDFs (use Puppeteer for 403-protected)');
  console.log('3. Extract data (expect 70-110 metrics from standards docs)');
  console.log('4. Replace 0-10 metric extractions with high-quality data');

  // Show sample for first company
  console.log('\n📋 SAMPLE QUERIES (first company):');
  console.log('─'.repeat(70));
  if (results.length > 0) {
    const sample = results[0];
    console.log(`Company: ${sample.company_name}\n`);
    sample.search_queries.slice(0, 5).forEach((q: string, i: number) => {
      console.log(`${i + 1}. ${q}`);
    });
    console.log(`... and ${sample.pattern_count - 5} more queries`);
  }
}

findStandardsDocuments()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
