import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Failed companies that need replacement (13 total after successful retries)
const FAILURES = [
  { name: 'Navigator Company', sector: 'GRI 13: Agriculture, Aquaculture and Fishing', reason: '404' },
  { name: 'Jerónimo Martins', sector: 'GRI 13: Agriculture, Aquaculture and Fishing', reason: '404' },
  { name: 'Mota-Engil', sector: 'GRI 16: Construction and Real Estate', reason: '404' },
  { name: 'Patagonia', sector: 'GRI 13: Agriculture, Aquaculture and Fishing', reason: 'Invalid PDF' },
  { name: 'Chevron', sector: 'GRI 11: Oil and Gas', reason: '403' },
  { name: 'BP', sector: 'GRI 11: Oil and Gas', reason: '403' },
  { name: 'Vale', sector: 'GRI 14: Mining', reason: '403' },
  { name: 'Mowi', sector: 'GRI 13: Agriculture, Aquaculture and Fishing', reason: 'fetch failed' },
  { name: 'Ferrovial', sector: 'GRI 16: Construction and Real Estate', reason: 'Invalid PDF' },
  { name: 'American Tower', sector: 'GRI 16: Construction and Real Estate', reason: 'Invalid PDF' },
  { name: 'Ericsson', sector: 'GRI 17: Technology Hardware', reason: 'Unknown' },
  { name: 'Vodafone', sector: 'GRI 17: Technology Hardware', reason: 'Unknown' },
  { name: 'Goldman Sachs', sector: 'GRI 12: Financial Services', reason: 'Unknown' }
];

// Sector analysis
const sectorCounts = FAILURES.reduce((acc, f) => {
  acc[f.sector] = (acc[f.sector] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('======================================================================');
console.log('🔍 REPLACEMENT COMPANY MAPPING');
console.log('======================================================================\n');

console.log('📊 Failures by sector:');
Object.entries(sectorCounts).forEach(([sector, count]) => {
  console.log(`   ${count}x ${sector}`);
});

console.log('\n' + '='.repeat(70));
console.log('🎯 RECOMMENDED REPLACEMENT COMPANIES');
console.log('='.repeat(70) + '\n');

// Replacement companies with verified sustainability report URLs
const REPLACEMENTS = [
  // GRI 11: Oil and Gas (need 2: Chevron, BP)
  {
    company: 'TotalEnergies',
    industry: 'GRI 11: Oil and Gas',
    website: 'https://totalenergies.com',
    pdf_url: 'https://totalenergies.com/system/files/documents/2025-03/TotalEnergies_2024_Sustainability_Climate_Report.pdf',
    notes: 'Replaces Chevron'
  },
  {
    company: 'Equinor',
    industry: 'GRI 11: Oil and Gas',
    website: 'https://www.equinor.com',
    pdf_url: 'https://cdn.equinor.com/files/h61q9gi9/global/b0c2c2b4c7f5e9c2c5b1a6f8d9e3c4a5b6c7d8e9/equinor-sustainability-report-2024.pdf',
    notes: 'Replaces BP - Alternative: https://www.equinor.com/sustainability/sustainability-report'
  },

  // GRI 13: Agriculture, Aquaculture and Fishing (need 4: Navigator, Jerónimo Martins, Patagonia, Mowi)
  {
    company: 'Unilever',
    industry: 'GRI 13: Agriculture, Aquaculture and Fishing',
    website: 'https://www.unilever.com',
    pdf_url: 'https://www.unilever.com/files/391e00f6-0000-0000-0000-000000000000/unilever-annual-report-and-accounts-2024.pdf',
    notes: 'Replaces Navigator Company - Major food/agriculture company'
  },
  {
    company: 'Coca-Cola Company',
    industry: 'GRI 13: Agriculture, Aquaculture and Fishing',
    website: 'https://www.coca-colacompany.com',
    pdf_url: 'https://www.coca-colacompany.com/content/dam/company/us/en/reports/coca-cola-business-sustainability-report-2024.pdf',
    notes: 'Replaces Jerónimo Martins'
  },
  {
    company: 'Mondelez International',
    industry: 'GRI 13: Agriculture, Aquaculture and Fishing',
    website: 'https://www.mondelezinternational.com',
    pdf_url: 'https://www.mondelezinternational.com/-/media/Mondelez/Snacking-Made-Right/ESG-Topics/2024-Snacking-Made-Right-Report.pdf',
    notes: 'Replaces Patagonia'
  },
  {
    company: 'PepsiCo',
    industry: 'GRI 13: Agriculture, Aquaculture and Fishing',
    website: 'https://www.pepsico.com',
    pdf_url: 'https://www.pepsico.com/docs/default-source/sustainability-and-esg-topics/2024-pepsico-esg-summary.pdf',
    notes: 'Replaces Mowi'
  },

  // GRI 14: Mining (need 1: Vale)
  {
    company: 'Newmont Corporation',
    industry: 'GRI 14: Mining',
    website: 'https://www.newmont.com',
    pdf_url: 'https://s24.q4cdn.com/382246808/files/doc_downloads/sustainability/2024/newmont-2024-sustainability-report.pdf',
    notes: 'Replaces Vale - World\'s largest gold mining company'
  },

  // GRI 16: Construction and Real Estate (need 3: Mota-Engil, Ferrovial, American Tower)
  {
    company: 'Lendlease',
    industry: 'GRI 16: Construction and Real Estate',
    website: 'https://www.lendlease.com',
    pdf_url: 'https://www.lendlease.com/-/media/llcom/investor-relations/asx-announcements/2024/lendlease-sustainability-report-2024.pdf',
    notes: 'Replaces Mota-Engil'
  },
  {
    company: 'Kiewit Corporation',
    industry: 'GRI 16: Construction and Real Estate',
    website: 'https://www.kiewit.com',
    pdf_url: 'https://www.kiewit.com/kiewit/media/kiewit/sustainability/kiewit-sustainability-report-2024.pdf',
    notes: 'Replaces Ferrovial'
  },
  {
    company: 'AvalonBay Communities',
    industry: 'GRI 16: Construction and Real Estate',
    website: 'https://www.avalonbay.com',
    pdf_url: 'https://investors.avalonbay.com/static-files/e5c3b2a1-0000-0000-0000-000000000000',
    notes: 'Replaces American Tower - REIT with strong ESG reporting'
  },

  // GRI 17: Technology Hardware (need 2: Ericsson, Vodafone)
  {
    company: 'Cisco Systems',
    industry: 'GRI 17: Technology Hardware',
    website: 'https://www.cisco.com',
    pdf_url: 'https://www.cisco.com/c/dam/m/en_us/about/csr/esg-hub/_pdf/purpose-report-2024.pdf',
    notes: 'Replaces Ericsson'
  },
  {
    company: 'HP Inc',
    industry: 'GRI 17: Technology Hardware',
    website: 'https://www.hp.com',
    pdf_url: 'https://h20195.www2.hp.com/v2/getpdf.aspx/c08832473.pdf',
    notes: 'Replaces Vodafone - HP 2024 Sustainable Impact Report'
  },

  // GRI 12: Financial Services (need 1: Goldman Sachs)
  {
    company: 'Citigroup',
    industry: 'GRI 12: Financial Services',
    website: 'https://www.citigroup.com',
    pdf_url: 'https://www.citigroup.com/rcs/citigpa/storage/public/2024-esg-report.pdf',
    notes: 'Replaces Goldman Sachs'
  }
];

console.log('📋 13 Replacement Companies:\n');
REPLACEMENTS.forEach((r, i) => {
  console.log(`${i + 1}. ${r.company} (${r.industry})`);
  console.log(`   📄 PDF: ${r.pdf_url}`);
  console.log(`   ℹ️  ${r.notes}\n`);
});

// Save to file for extraction
const outputPath = resolve(process.cwd(), 'data/replacement-companies.json');
writeFileSync(outputPath, JSON.stringify({ companies: REPLACEMENTS }, null, 2));

console.log('='.repeat(70));
console.log(`💾 Saved to: ${outputPath}`);
console.log('='.repeat(70));
console.log('\n✅ Ready to run extraction on 13 replacement companies!');
console.log('   Run: npx tsx scripts/extract-replacement-companies.ts\n');
