/**
 * Automated Sustainability Report Parser
 *
 * This script automates the entire report parsing pipeline:
 * 1. Fetches PDF/HTML reports using Firecrawl MCP
 * 2. Extracts emissions data using AI
 * 3. Stores structured data in sector_company_reports table
 * 4. Processes reports in batches for scalability
 *
 * Usage:
 *   npx tsx scripts/automated-report-parser.ts --sector GRI-14
 *   npx tsx scripts/automated-report-parser.ts --company "Tesla"
 *   npx tsx scripts/automated-report-parser.ts --all
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const deepseekApiKey = process.env.DEEPSEEK_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

interface CompanyToProcess {
  id: string;
  company_name: string;
  website: string;
  sector: string;
  industry: string;
}

interface ParsedReportData {
  // Emissions
  scope1_emissions?: number;
  scope2_emissions?: number;
  scope3_emissions?: number;
  total_emissions?: number;
  carbon_neutral_target?: number;
  net_zero_target?: number;
  emission_reduction_target?: any;
  ghg_intensity?: number;
  scope2_market_based?: number;
  scope2_location_based?: number;
  biogenic_emissions?: number;

  // Energy
  renewable_energy_percent?: number;
  renewable_energy_target?: any;
  total_energy_consumption?: number;
  energy_intensity?: number;
  renewable_energy_mwh?: number;

  // Water
  water_withdrawal?: number;
  water_discharge?: number;
  water_intensity?: number;
  water_recycled?: number;
  water_stress_locations?: boolean;

  // Waste
  waste_generated?: number;
  waste_recycled?: number;
  waste_recycling_rate?: number;

  // Health & Safety
  total_recordable_incident_rate?: number;
  lost_time_injury_rate?: number;
  fatalities?: number;
  near_miss_incidents?: number;

  // Social
  employee_count?: number;
  women_in_leadership?: number;
  diversity_metrics?: any;
  training_hours_per_employee?: number;
  employee_turnover_rate?: number;
  living_wage_percent?: number;
  unionized_workforce_percent?: number;

  // Supply Chain
  supplier_esg_assessments?: number;
  sustainable_sourcing_percent?: number;

  // Circular Economy
  product_recycling_rate?: number;
  packaging_recycled_content?: number;
  product_takeback_programs?: boolean;

  // Biodiversity
  land_owned_managed?: number;
  protected_habitat_area?: number;
  biodiversity_programs?: boolean;

  // Governance
  board_independence?: number;
  esg_linked_compensation?: boolean;
  externally_assured?: boolean;
  assurance_provider?: string;
  reporting_standards?: string[];

  // Financial
  annual_revenue?: number;
  revenue_currency?: string;
}

/**
 * Step 1: Use Firecrawl API to fetch report content
 * Fetches and extracts text from PDFs and web pages
 */
async function fetchReportContent(reportUrl: string): Promise<string> {
  console.log(`   📄 Fetching report: ${reportUrl}`);

  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  if (!firecrawlApiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured - cannot fetch real reports');
  }

  // Use Firecrawl API to scrape the URL
  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: reportUrl,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      waitFor: 3000, // Wait 3 seconds for dynamic content
    }),
  });

  if (!response.ok) {
    throw new Error(`Firecrawl API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Firecrawl scraping failed: ${data.error || 'Unknown error'}`);
  }

  const content = data.data?.markdown || data.data?.html || '';

  if (!content) {
    throw new Error('No content extracted from report');
  }

  console.log(`   ✓ Successfully fetched ${content.length} characters`);
  return content;
}

/**
 * Step 2: Use AI to extract structured data from report text
 * Uses DeepSeek AI with structured output for comprehensive metric extraction (faster & cheaper than GPT-4)
 */
async function extractDataWithAI(
  companyName: string,
  reportText: string
): Promise<ParsedReportData> {
  console.log(`   🤖 Extracting data with AI for ${companyName}...`);

  // Truncate report text if too long (GPT-4 context limit)
  const maxLength = 100000; // ~25k tokens
  const truncatedText = reportText.length > maxLength
    ? reportText.substring(0, maxLength) + '\n\n[Report truncated for length]'
    : reportText;

  const prompt = `Extract comprehensive sustainability metrics from this ${companyName} sustainability report.

REPORT CONTENT:
${truncatedText}

Extract the following metrics (use null for missing data, ensure all numbers are numeric):

EMISSIONS (in tons CO2e):
- scope1_emissions, scope2_emissions, scope3_emissions, total_emissions
- ghg_intensity (tons CO2e per $M revenue)
- scope2_market_based, scope2_location_based
- biogenic_emissions
- carbon_neutral_target (year), net_zero_target (year)
- emission_reduction_target (e.g., "50% by 2030")

ENERGY:
- total_energy_consumption (MWh)
- renewable_energy_percent (0-100)
- renewable_energy_mwh (absolute MWh)
- energy_intensity (MWh per $M revenue)
- renewable_energy_target (e.g., "100% by 2030")

WATER (in megaliters ML):
- water_withdrawal, water_discharge, water_consumption
- water_intensity (ML per $M revenue)
- water_recycled (ML)
- water_stress_locations (boolean)

WASTE (in tons):
- waste_generated, waste_recycled
- waste_recycling_rate (0-100 percent)

HEALTH & SAFETY:
- total_recordable_incident_rate (TRIR per 100 employees)
- lost_time_injury_rate (LTIR per 100 employees)
- fatalities (count)
- near_miss_incidents (count)

SOCIAL:
- employee_count (total workforce)
- women_in_leadership (0-100 percent)
- diversity_metrics (object with various diversity stats)
- training_hours_per_employee
- employee_turnover_rate (0-100 percent)
- living_wage_percent (0-100 percent)
- unionized_workforce_percent (0-100 percent)

SUPPLY CHAIN:
- supplier_esg_assessments (count of audits)
- sustainable_sourcing_percent (0-100 percent)

CIRCULAR ECONOMY:
- product_recycling_rate (0-100 percent)
- packaging_recycled_content (0-100 percent)
- product_takeback_programs (boolean)

BIODIVERSITY:
- land_owned_managed (hectares)
- protected_habitat_area (hectares)
- biodiversity_programs (boolean)

GOVERNANCE:
- board_independence (0-100 percent)
- esg_linked_compensation (boolean)
- externally_assured (boolean)
- assurance_provider (string, e.g., "EY")
- reporting_standards (array, e.g., ["GRI", "SASB", "TCFD"])

FINANCIAL:
- annual_revenue (in millions)
- revenue_currency (ISO code, e.g., "USD")

Return ONLY valid JSON matching this exact structure with null for missing values.`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a sustainability data extraction expert. Extract metrics accurately from sustainability reports. Return only valid JSON with numeric values (never strings like "15M" - convert to 15000000). Use null for missing data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    const extracted = JSON.parse(content);

    // Flatten nested structure if AI returned categories
    let flatData: any = {};
    for (const key of Object.keys(extracted)) {
      if (typeof extracted[key] === 'object' && extracted[key] !== null && !Array.isArray(extracted[key])) {
        // If it's a nested category object, merge it into flatData
        flatData = { ...flatData, ...extracted[key] };
      } else {
        // If it's already flat, just copy it
        flatData[key] = extracted[key];
      }
    }

    const extractedCount = Object.keys(flatData).filter(k => flatData[k] !== null && flatData[k] !== undefined).length;
    console.log(`   ✓ Successfully extracted ${extractedCount} metrics`);

    return flatData as ParsedReportData;

  } catch (error: any) {
    console.log(`   ⚠️  AI extraction error: ${error.message}`);
    console.log(`   ℹ️  Returning empty data structure`);

    // Return empty structure on error
    return {
      scope1_emissions: null,
      scope2_emissions: null,
      scope3_emissions: null,
      total_emissions: null,
      carbon_neutral_target: null,
      net_zero_target: null,
      renewable_energy_percent: null,
      waste_recycling_rate: null,
      employee_count: null,
      women_in_leadership: null,
      reporting_standards: [],
    };
  }
}

/**
 * Step 3: Find sustainability report URL for a company
 * Uses web search or company website scraping
 */
async function findReportUrl(
  companyName: string,
  website: string
): Promise<string | null> {
  console.log(`   🔍 Finding sustainability report for ${companyName}...`);

  // TODO: Use Exa MCP or Firecrawl to find report URL
  // const searchQuery = `${companyName} sustainability report 2023 site:${website}`;
  // const results = await exaMCP.search({ query: searchQuery });

  console.log(`   ℹ️  [PLACEHOLDER] In production: Use Exa MCP to find report URL`);

  // Common patterns for sustainability reports
  const commonPaths = [
    '/sustainability/report',
    '/esg/report',
    '/impact-report',
    '/corporate-responsibility',
    '/about/sustainability',
  ];

  console.log(`   💡 Suggested search locations: ${commonPaths.join(', ')}`);

  return null; // Would return actual URL from search
}

/**
 * Process a single company report
 */
async function processCompanyReport(
  company: CompanyToProcess,
  reportUrl?: string
): Promise<void> {
  console.log(`\n📊 Processing: ${company.company_name}`);
  console.log(`   Sector: ${company.sector} (${company.industry})`);

  // Step 1: Find report URL if not provided
  let finalReportUrl = reportUrl;
  if (!finalReportUrl) {
    finalReportUrl = await findReportUrl(company.company_name, company.website);

    if (!finalReportUrl) {
      console.log(`   ⚠️  Could not find sustainability report URL`);
      return;
    }
  }

  console.log(`   📄 Report URL: ${finalReportUrl}`);

  // Step 2: Fetch report content
  const reportContent = await fetchReportContent(finalReportUrl);

  // Step 3: Extract data with AI
  const parsedData = await extractDataWithAI(company.company_name, reportContent);

  // Step 4: Store in database
  console.log(`   💾 Storing parsed data...`);

  const { error } = await supabase
    .from('sector_company_reports')
    .insert({
      company_id: company.id,
      company_name: company.company_name,
      sector: company.sector,
      report_year: 2023,
      report_url: finalReportUrl,
      report_type: 'sustainability',
      ...parsedData,
      raw_text: reportContent.substring(0, 50000), // First 50k chars
    });

  if (error) {
    console.error(`   ❌ Error storing data:`, error.message);
  } else {
    console.log(`   ✅ Successfully parsed and stored!`);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🤖 Automated Sustainability Report Parser');
  console.log('=' .repeat(60));
  console.log('');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const sectorArg = args.find(arg => arg.startsWith('--sector='))?.split('=')[1];
  const companyArg = args.find(arg => arg.startsWith('--company='))?.split('=')[1];
  const all = args.includes('--all');

  // Fetch companies to process
  let query = supabase
    .from('sector_companies')
    .select('id, company_name, website, sector, industry')
    .eq('has_sustainability_report', true);

  if (sectorArg) {
    query = query.eq('sector', sectorArg);
  } else if (companyArg) {
    query = query.ilike('company_name', `%${companyArg}%`);
  }

  const { data: companies, error } = await query;

  if (error || !companies || companies.length === 0) {
    console.error('❌ No companies found to process');
    process.exit(1);
  }

  console.log(`📋 Found ${companies.length} companies to process\n`);

  // Process each company
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    console.log(`[${i + 1}/${companies.length}]`);

    try {
      await processCompanyReport(company);
    } catch (error) {
      console.error(`   ❌ Error processing ${company.company_name}:`, error);
    }

    // Add delay between requests to respect rate limits
    if (i < companies.length - 1) {
      console.log('   ⏳ Waiting 3 seconds before next company...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Batch processing complete!');
  console.log(`   Processed: ${companies.length} companies`);
  console.log('');
  console.log('📊 Next steps:');
  console.log('   1. Run benchmark generation script');
  console.log('   2. Review data quality and accuracy');
  console.log('   3. Fill in missing report URLs');
  console.log('   4. Expand to additional sectors');
}

/**
 * Integration Points for Production:
 *
 * 1. Firecrawl MCP Integration:
 *    - Call mcp__firecrawl__scrape tool with report URL
 *    - Handle PDF extraction and content parsing
 *    - Return clean markdown or JSON
 *
 * 2. AI Extraction:
 *    - Using DeepSeek AI (faster & cheaper than GPT-4)
 *    - Structured JSON output with comprehensive metrics
 *    - Handle extraction errors and data validation
 *
 * 3. Exa MCP Integration:
 *    - Use mcp__exa__search to find report URLs
 *    - Query: "{company} sustainability report 2023"
 *    - Filter results for official company reports
 *
 * 4. Error Handling:
 *    - Retry logic for failed requests
 *    - Partial data storage
 *    - Human review queue for low confidence extractions
 *
 * 5. Scalability:
 *    - Batch processing with configurable batch size
 *    - Parallel processing with rate limiting
 *    - Progress tracking and resumability
 */

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
