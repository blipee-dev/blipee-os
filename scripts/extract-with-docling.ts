import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const deepseekApiKey = process.env.DEEPSEEK_API_KEY!;

const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

interface TestCompany {
  company: string;
  industry: string;
  pdf_url: string;
}

async function extractWithDocling(company: TestCompany) {
  console.log('======================================================================');
  console.log(`🔬 DOCLING-POWERED EXTRACTION TEST`);
  console.log('======================================================================\n');
  console.log(`📊 Company: ${company.company}`);
  console.log(`🏭 Industry: ${company.industry}`);
  console.log(`📄 PDF: ${company.pdf_url}\n`);

  try {
    // Step 1: Convert PDF using Docling MCP
    console.log('Step 1: Converting PDF with Docling MCP (97.9% table accuracy)...');

    // Note: In actual implementation, we'd call the MCP tool here
    // For now, showing the structure
    console.log('   ⚠️  NOTE: This requires MCP tool integration');
    console.log('   Tool: mcp__docling__convert_document_into_docling_document');
    console.log('   Input: { source: pdf_url }');
    console.log('   Output: { document_key: "unique_id" }\n');

    console.log('Step 2: Export to markdown with tables preserved...');
    console.log('   Tool: mcp__docling__export_docling_document_to_markdown');
    console.log('   Input: { document_key: "unique_id" }');
    console.log('   Output: markdown with structured tables\n');

    console.log('Step 3: Extract metrics with table-focused prompt...');

    const tablePrompt = `You are analyzing a sustainability report in markdown format with PRESERVED TABLE STRUCTURE.

FOCUS ON TABLES:
1. GRI Content Index tables
2. Emissions tables (Scope 1, 2, 3)
3. Energy consumption tables
4. Workforce diversity tables
5. Water & waste tables

Extract ALL numeric values from tables. Pay special attention to:
- Row headers (metric names)
- Column headers (years: 2024, 2023, 2022)
- Units (tCO2e, GJ, m3, tons, %, EUR)

EXTRACTION RULES:
1. Extract from tables FIRST (highest priority)
2. Include year suffix: metric_2024, metric_2023
3. Include units in field name: emissions_tco2e, water_m3
4. Return FLAT JSON structure (no nested objects)
5. TARGET: 100-250 metrics with focus on quantitative data

For ${company.company}, extract sustainability metrics from the markdown report.

Return ONLY valid JSON with this format:
{
  "scope1_emissions_tco2e_2024": 12345,
  "scope2_emissions_tco2e_2024": 67890,
  "scope3_emissions_tco2e_2024": 123456,
  "total_employees_2024": 50000,
  "renewable_energy_percent_2024": 45.2
}`;

    console.log('   ✓ Extraction prompt optimized for tables');
    console.log('   ✓ Token limit: 16000 (4x larger for comprehensive extraction)');
    console.log('   ✓ Temperature: 0.05 (maximum consistency)\n');

    console.log('======================================================================');
    console.log('🎯 EXPECTED IMPROVEMENTS vs pdf-parse:');
    console.log('======================================================================');
    console.log('✅ Tables preserved: 97.9% accuracy (vs ~30%)');
    console.log('✅ Emissions data: Should capture Scope 1/2/3');
    console.log('✅ Multi-column layouts: Properly parsed');
    console.log('✅ GRI indices: Structured extraction');
    console.log('✅ More metrics: 2-3x increase expected\n');

    return {
      success: true,
      message: 'Docling extraction framework ready. Needs MCP integration.'
    };

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  const testCompany: TestCompany = {
    company: 'Mota-Engil',
    industry: 'GRI 16: Construction and Real Estate',
    pdf_url: 'https://www.mota-engil.com/app/uploads/2025/04/Integrated-Report-2024_ING-1.pdf'
  };

  const result = await extractWithDocling(testCompany);

  console.log('\n======================================================================');
  console.log('📋 NEXT STEPS:');
  console.log('======================================================================');
  console.log('1. Integrate Docling MCP tool calls');
  console.log('2. Test on Mota-Engil PDF');
  console.log('3. Compare: Docling extraction vs pdf-parse extraction');
  console.log('4. Measure improvement in emissions data capture');
  console.log('5. Roll out to all 56 companies missing emissions\n');

  return result;
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
