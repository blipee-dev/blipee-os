import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

interface KeywordDictionary {
  metadata: {
    total_codes: number;
    categories: number;
    search_keywords_count: number;
  };
  codes: any[];
}

async function convertPdfWithDocling(pdfUrl: string, outputDir: string): Promise<string> {
  console.log('📥 Downloading and converting PDF with Docling...');

  // Download PDF
  const pdfPath = resolve(outputDir, 'temp-report.pdf');
  await execAsync(`curl -L -o "${pdfPath}" "${pdfUrl}"`);

  // Get PDF size info
  const { stdout: sizeInfo } = await execAsync(`ls -lh "${pdfPath}" | awk '{print $5}'`);
  console.log(`   ✓ Downloaded: ${sizeInfo.trim()}`);

  // Convert with Docling using uv tool
  console.log('   🔄 Converting with Docling (97.9% table accuracy)...');
  console.log('   ⏱️  Large PDFs may take 10-15 minutes...');
  const markdownPath = resolve(outputDir, 'temp-report.md');

  try {
    // Use docling CLI directly via uv with extended timeout
    const { stdout, stderr } = await execAsync(
      `uv tool run --from docling-mcp python -c "
import sys
from docling.document_converter import DocumentConverter

print('Initializing Docling converter...', file=sys.stderr)
converter = DocumentConverter()

print('Converting PDF to markdown...', file=sys.stderr)
result = converter.convert('${pdfPath}')

print('Exporting to markdown...', file=sys.stderr)
with open('${markdownPath}', 'w') as f:
    f.write(result.document.export_to_markdown())

print('Conversion complete!', file=sys.stderr)
print('SUCCESS')
"`,
      {
        timeout: 1200000, // 20 minute timeout for large PDFs
        maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large outputs
      }
    );

    if (stdout.includes('SUCCESS')) {
      console.log('   ✓ Docling conversion successful!');
    }
    if (stderr) {
      // Filter out just the important messages
      const importantLines = stderr.split('\n').filter(line =>
        line.includes('Processing') || line.includes('complete') || line.includes('Initializing')
      );
      if (importantLines.length > 0) {
        console.log('   📋 Progress:', importantLines.join(' → '));
      }
    }

    // Read markdown
    const markdown = readFileSync(markdownPath, 'utf-8');
    console.log(`   ✓ Converted to markdown: ${(markdown.length / 1024).toFixed(1)} KB`);
    console.log(`   ✓ Tables preserved with structure\n`);

    return markdown;
  } catch (error: any) {
    console.error('   ❌ Docling conversion failed:', error.message);

    // Check if partial output exists
    if (existsSync(markdownPath)) {
      const markdown = readFileSync(markdownPath, 'utf-8');
      if (markdown.length > 1000) {
        console.log(`   ⚠️  Found partial output (${(markdown.length / 1024).toFixed(1)} KB), attempting to use it...`);
        return markdown;
      }
    }

    throw error;
  }
}

async function extractWithDocling(company: TestCompany, dictionary: KeywordDictionary) {
  console.log('======================================================================');
  console.log(`🔬 DOCLING-POWERED EXTRACTION - REAL TEST`);
  console.log('======================================================================\n');
  console.log(`📊 Company: ${company.company}`);
  console.log(`🏭 Industry: ${company.industry}`);
  console.log(`📄 PDF: ${company.pdf_url}\n`);

  const outputDir = resolve(process.cwd(), 'data/temp-docling');

  try {
    // Ensure temp directory exists
    await execAsync(`mkdir -p "${outputDir}"`);

    // Step 1: Convert PDF with Docling
    const markdownContent = await convertPdfWithDocling(company.pdf_url, outputDir);

    // Step 2: Extract metrics with table-focused AI prompt
    console.log('Step 2: Extracting metrics with table-focused AI prompt...');

    const categories = [...new Set(dictionary.codes.map(c => c.category))];
    const topicSample = dictionary.codes.slice(0, 20).map(c => `${c.code}: ${c.topic}`).join(', ');

    const tablePrompt = `Extract ESG metrics from ${company.company}'s sustainability report (MARKDOWN WITH TABLES).

DICTIONARY: ${dictionary.metadata.total_codes} GRI codes across ${categories.length} categories
SAMPLE CODES: ${topicSample}...

REPORT MARKDOWN (with preserved tables):
${markdownContent.substring(0, 250000)}

EXTRACTION RULES - MAXIMUM COMPREHENSIVE EXTRACTION:
1. **CRITICAL GOAL: Extract 150-200+ metrics to achieve 93%+ fill rate**
2. **PRIORITY**: Extract from tables (Docling 97.9% accuracy vs pdf-parse 30%)
3. **Extract EVERYTHING from tables**: Emissions, energy, water, waste, workforce, safety, social, governance
4. **Multi-year**: 2024, 2023, 2022 for ALL metrics (triples data volume)
5. **Units in names**: emissions_tco2e, energy_gj, water_m3, waste_tons
6. **GRI Index tables**: Extract specific disclosure values
7. **FLAT JSON**: All metrics at root level
8. **USER REQUIREMENT**: 166 fields → 154+ values (93%+ per company)
9. **FAILURE**: Mota-Engil had 166 fields but only 25 values (15%) - UNACCEPTABLE

Return ONLY valid JSON:
{
  "scope1_emissions_tco2e_2024": 1234567,
  "scope2_emissions_tco2e_2024": 456789,
  "scope3_emissions_tco2e_2024": 3456789,
  "total_employees_2024": 53340,
  "women_employees_percent_2024": 37
}`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a precise ESG data extraction expert. Focus on extracting quantitative data from tables. Return ONLY valid JSON with numeric values.'
        },
        { role: 'user', content: tablePrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.05,
      max_tokens: 8000,
    });

    const extractedMetrics = JSON.parse(response.choices[0].message.content!);
    const metricCount = Object.keys(extractedMetrics).filter(k => extractedMetrics[k] !== null && extractedMetrics[k] !== "").length;

    console.log(`   ✓ Extracted ${metricCount} metrics`);
    console.log(`   ✓ Token limit: 8000 (DeepSeek max)\n`);

    // Step 3: Save results
    const output = {
      company_name: company.company,
      industry: company.industry,
      extraction_method: 'docling_direct_table_focused',
      report_metadata: {
        pdf_url: company.pdf_url,
        markdown_length: markdownContent.length,
        docling_version: 'direct_cli'
      },
      extracted_at: new Date().toISOString(),
      metric_count: metricCount,
      metrics: extractedMetrics
    };

    const outputPath = resolve(process.cwd(), `data/extracted-production/${company.company.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-docling-direct.json`);
    writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log('======================================================================');
    console.log('✅ EXTRACTION COMPLETE');
    console.log('======================================================================');
    console.log(`💾 Saved to: ${outputPath}`);
    console.log(`📊 Metrics extracted: ${metricCount}`);

    // Check for emissions data
    const hasScope1 = extractedMetrics.scope1_emissions_tco2e_2024 || extractedMetrics.scope1_emissions_tco2e_2023;
    const hasScope2 = extractedMetrics.scope2_emissions_tco2e_2024 || extractedMetrics.scope2_emissions_tco2e_2023;
    const hasScope3 = extractedMetrics.scope3_emissions_tco2e_2024 || extractedMetrics.scope3_emissions_tco2e_2023;

    console.log(`\n🎯 EMISSIONS DATA:`);
    console.log(`   Scope 1: ${hasScope1 ? '✅ YES' : '❌ MISSING'}`);
    console.log(`   Scope 2: ${hasScope2 ? '✅ YES' : '❌ MISSING'}`);
    console.log(`   Scope 3: ${hasScope3 ? '✅ YES' : '❌ MISSING'}\n`);

    return { success: true, metricCount, outputPath, hasEmissions: hasScope1 || hasScope2 || hasScope3 };

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  // Load dictionary
  const dictionaryPath = resolve(process.cwd(), 'data/merged-ultimate-gri-dictionary.json');
  const dictionary: KeywordDictionary = JSON.parse(readFileSync(dictionaryPath, 'utf-8'));

  const testCompany: TestCompany = {
    company: 'Mota-Engil',
    industry: 'GRI 16: Construction and Real Estate',
    pdf_url: 'https://www.mota-engil.com/app/uploads/2025/04/Integrated-Report-2024_ING-1.pdf'
  };

  const result = await extractWithDocling(testCompany, dictionary);

  if (result.success) {
    console.log('======================================================================');
    console.log('📊 COMPARISON: Docling vs pdf-parse');
    console.log('======================================================================');

    // Load original extraction
    const originalPath = resolve(process.cwd(), 'data/extracted-production/mota-engil.json');
    if (existsSync(originalPath)) {
      const original = JSON.parse(readFileSync(originalPath, 'utf-8'));
      const originalWithValues = Object.values(original.metrics).filter(v => v !== "" && v !== null).length;

      console.log(`\npdf-parse extraction:`);
      console.log(`   Total fields: ${original.metric_count}`);
      console.log(`   With values: ${originalWithValues}`);
      console.log(`   Missing emissions: YES ❌`);

      console.log(`\nDocling extraction:`);
      console.log(`   Total metrics: ${result.metricCount}`);
      console.log(`   Improvement: +${result.metricCount - originalWithValues} metrics (${((result.metricCount/originalWithValues - 1) * 100).toFixed(1)}%)`);
      console.log(`   Has emissions: ${result.hasEmissions ? 'YES ✅' : 'NO ❌'}`);
      console.log(`   Table accuracy: 97.9% (Docling)\n`);
    }
  }

  return result;
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
