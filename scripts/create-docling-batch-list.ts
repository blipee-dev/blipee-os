import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

interface ExtractedData {
  company_name: string;
  industry: string;
  metric_count: number;
  metrics: Record<string, any>;
  report_metadata?: {
    pdf_url?: string;
  };
}

const outputDir = resolve(process.cwd(), 'data/extracted-production');
const files = readdirSync(outputDir).filter(f => f.endsWith('.json') && !f.includes('docling'));

console.log(`Analyzing ${files.length} companies for emissions data...\n`);

const companiesNeedingDocling: Array<{
  company: string;
  industry: string;
  pdf_url: string;
  current_metrics: number;
  has_scope1: boolean;
  has_scope2: boolean;
  has_scope3: boolean;
}> = [];

files.forEach(file => {
  try {
    const data: ExtractedData = JSON.parse(readFileSync(resolve(outputDir, file), 'utf-8'));

    const hasScope1 = !!(data.metrics.scope1_emissions_tco2e_2024 || data.metrics.scope1_emissions_tco2e_2023);
    const hasScope2 = !!(data.metrics.scope2_emissions_tco2e_2024 || data.metrics.scope2_emissions_tco2e_2023);
    const hasScope3 = !!(data.metrics.scope3_emissions_tco2e_2024 || data.metrics.scope3_emissions_tco2e_2023);

    const hasAnyEmissions = hasScope1 || hasScope2 || hasScope3;

    if (!hasAnyEmissions && data.report_metadata?.pdf_url) {
      companiesNeedingDocling.push({
        company: data.company_name,
        industry: data.industry,
        pdf_url: data.report_metadata.pdf_url,
        current_metrics: data.metric_count,
        has_scope1: hasScope1,
        has_scope2: hasScope2,
        has_scope3: hasScope3
      });
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e);
  }
});

console.log(`${'='.repeat(70)}`);
console.log(`DOCLING RE-EXTRACTION BATCH LIST`);
console.log(`${'='.repeat(70)}\n`);

console.log(`📊 Found ${companiesNeedingDocling.length} companies missing emissions data\n`);

// Save to file for batch processing
const batchFile = {
  metadata: {
    created_at: new Date().toISOString(),
    total_companies: companiesNeedingDocling.length,
    extraction_method: 'docling_direct_table_focused',
    estimated_time: `${(companiesNeedingDocling.length * 12 / 60).toFixed(1)} hours (avg 12 min/company)`
  },
  companies: companiesNeedingDocling.map(c => ({
    company: c.company,
    industry: c.industry,
    pdf_url: c.pdf_url
  }))
};

const batchPath = resolve(process.cwd(), 'data/docling-batch-companies.json');
writeFileSync(batchPath, JSON.stringify(batchFile, null, 2));

console.log(`✅ Saved batch list to: ${batchPath}`);
console.log(`\n📋 Sample companies to re-extract:`);
companiesNeedingDocling.slice(0, 10).forEach(c => {
  console.log(`   - ${c.company} (${c.industry}) - ${c.current_metrics} metrics`);
});

if (companiesNeedingDocling.length > 10) {
  console.log(`   ... and ${companiesNeedingDocling.length - 10} more\n`);
}

console.log(`\n🚀 Next steps:`);
console.log(`1. Restart Claude Code to reconnect Docling MCP`);
console.log(`2. Run: npx tsx scripts/batch-extract-with-docling.ts`);
console.log(`3. Wait ${(companiesNeedingDocling.length * 12 / 60).toFixed(1)} hours for completion\n`);
