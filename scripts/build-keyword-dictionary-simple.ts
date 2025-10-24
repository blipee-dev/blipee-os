import pdf from 'pdf-parse';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

interface KeywordEntry {
  code: string;
  category: string;
  found_in: string[];
}

async function extractKeywordsSimple() {
  console.log('======================================================================');
  console.log('📚 BUILDING STANDARD KEYWORD DICTIONARY (SIMPLE METHOD)');
  console.log('======================================================================\n');
  console.log('Strategy: Extract GRI/ESRS codes using regex (faster & more reliable)\n');

  const documents = [
    { name: 'Galp Standards', path: '/tmp/galp-standards-analysis.pdf' },
    { name: 'Ageas GRI', path: '/tmp/ageas-gri/report.pdf' },
    { name: 'PLMJ GRI', path: '/tmp/plmj-puppeteer/report.pdf' }
  ];

  const allCodes = new Map<string, KeywordEntry>();

  for (const doc of documents) {
    console.log(`📊 ${doc.name}`);
    const buffer = readFileSync(doc.path);
    const data = await pdf(buffer);
    const text = data.text;

    // Extract GRI codes (format: GRI ###-# or GRI #-#)
    const griPattern = /GRI\s+\d{1,3}-\d{1,2}/gi;
    const griMatches = [...new Set(text.match(griPattern) || [])];

    // Extract ESRS codes (format: ESRS E# or ESRS S# or ESRS G#)
    const esrsPattern = /ESRS\s+[AESG]\d{1,2}(-\d{1,2})?/gi;
    const esrsMatches = [...new Set(text.match(esrsPattern) || [])];

    // Extract SASB codes (format: SASB XX-XX-###a.#)
    const sasbPattern = /SASB\s+[A-Z]{2}-[A-Z]{2,3}-\d{3}[a-z]\.\d/gi;
    const sasbMatches = [...new Set(text.match(sasbPattern) || [])];

    console.log(`   GRI codes: ${griMatches.length}`);
    console.log(`   ESRS codes: ${esrsMatches.length}`);
    console.log(`   SASB codes: ${sasbMatches.length}\n`);

    // Add to master list
    [...griMatches, ...esrsMatches, ...sasbMatches].forEach(code => {
      const normalized = code.toUpperCase().replace(/\s+/g, ' ');
      if (!allCodes.has(normalized)) {
        allCodes.set(normalized, {
          code: normalized,
          category: getCategoryFromCode(normalized),
          found_in: [doc.name]
        });
      } else {
        const existing = allCodes.get(normalized)!;
        if (!existing.found_in.includes(doc.name)) {
          existing.found_in.push(doc.name);
        }
      }
    });
  }

  // Build dictionary structure
  const dictionary = {
    metadata: {
      created_at: new Date().toISOString(),
      method: 'regex_extraction',
      source_documents: documents.map(d => d.name),
      total_codes: allCodes.size,
      description: 'Universal keyword dictionary for ESG metric extraction - GRI/ESRS/SASB codes'
    },
    codes: Array.from(allCodes.values()).sort((a, b) => a.code.localeCompare(b.code)),
    categories: getCategoriesWithCodes(Array.from(allCodes.values())),
    search_keywords: generateSearchKeywords(Array.from(allCodes.values()))
  };

  // Save
  const outputPath = resolve(process.cwd(), 'data/standard-keyword-dictionary.json');
  writeFileSync(outputPath, JSON.stringify(dictionary, null, 2));

  console.log('═'.repeat(70));
  console.log('✅ DICTIONARY COMPLETE');
  console.log('═'.repeat(70) + '\n');
  console.log(`📁 Saved to: ${outputPath}`);
  console.log(`📊 Total unique codes: ${allCodes.size}`);

  // Show breakdown
  const byCategory = new Map<string, number>();
  dictionary.codes.forEach(entry => {
    byCategory.set(entry.category, (byCategory.get(entry.category) || 0) + 1);
  });

  console.log('\n📋 BREAKDOWN BY CATEGORY:\n');
  Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`   ${cat.padEnd(20)} ${count} codes`);
  });

  // Show samples
  console.log('\n📋 SAMPLE CODES:\n');
  ['emissions', 'energy', 'water', 'employees', 'safety'].forEach(category => {
    const samples = dictionary.codes.filter(c => c.category === category).slice(0, 3);
    if (samples.length > 0) {
      console.log(`   ${category.toUpperCase()}:`);
      samples.forEach(s => console.log(`      ${s.code}`));
    }
  });

  console.log('\n💡 USAGE:');
  console.log('─'.repeat(70));
  console.log('Search for these codes in ANY sustainability report to extract metrics.');
  console.log('Example: "GRI 305-1" → Scope 1 emissions in tonCO2e');
  console.log('         "ESRS E1" → Climate change metrics');
  console.log('         "GRI 2-7" → Total employees\n');

  return dictionary;
}

function getCategoryFromCode(code: string): string {
  // GRI categories
  if (code.includes('305')) return 'emissions';
  if (code.includes('302')) return 'energy';
  if (code.includes('303')) return 'water';
  if (code.includes('306')) return 'waste';
  if (code.includes('401') || code.includes('2-7') || code.includes('2-8')) return 'employees';
  if (code.includes('405')) return 'diversity';
  if (code.includes('403')) return 'safety';
  if (code.includes('201')) return 'economic';
  if (code.includes('2-9') || code.includes('2-10')) return 'governance';

  // ESRS categories
  if (code.includes('E1')) return 'emissions';
  if (code.includes('E2')) return 'pollution';
  if (code.includes('E3')) return 'water';
  if (code.includes('E4')) return 'biodiversity';
  if (code.includes('E5')) return 'circular_economy';
  if (code.includes('S1')) return 'workforce';
  if (code.includes('S2')) return 'workers_value_chain';
  if (code.includes('S3')) return 'communities';
  if (code.includes('S4')) return 'consumers';
  if (code.includes('G1')) return 'governance';

  return 'other';
}

function getCategoriesWithCodes(codes: KeywordEntry[]): any {
  const categories: any = {};
  codes.forEach(entry => {
    if (!categories[entry.category]) {
      categories[entry.category] = [];
    }
    categories[entry.category].push(entry.code);
  });
  return categories;
}

function generateSearchKeywords(codes: KeywordEntry[]): string[] {
  const keywords = new Set<string>();

  // Add all codes
  codes.forEach(entry => keywords.add(entry.code));

  // Add common metric names
  [
    'Scope 1 emissions', 'Scope 2 emissions', 'Scope 3 emissions',
    'Total employees', 'Female employees', 'Male employees',
    'Energy consumption', 'Renewable energy', 'Water consumption',
    'Waste generated', 'Waste recycled', 'Recycling rate',
    'LTIF', 'TRIR', 'Fatalities', 'Lost time injury',
    'Board composition', 'Women on board', 'Independent directors',
    'Revenue', 'Economic value', 'Community investment',
    'Training hours', 'Diversity ratio', 'Pay equity'
  ].forEach(kw => keywords.add(kw));

  return Array.from(keywords).sort();
}

extractKeywordsSimple()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
