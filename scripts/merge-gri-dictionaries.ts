import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Merge comprehensive GRI dictionary (140 codes) with ESRS-GRI mapping (35 codes)
 * to create the ultimate definitive GRI dictionary
 */

interface GRICode {
  code: string;
  category: string;
  topic: string;
  esrs_reference?: string;
}

interface Dictionary {
  metadata?: any;
  codes: GRICode[];
  search_keywords: string[];
}

function main() {
  console.log('🔄 Merging GRI dictionaries...\n');

  // Load comprehensive dictionary (140 codes from official GRI Content Index)
  const comprehensivePath = resolve(process.cwd(), 'data/comprehensive-gri-dictionary.json');
  const comprehensive: Dictionary = JSON.parse(readFileSync(comprehensivePath, 'utf-8'));
  console.log(`✓ Loaded comprehensive dictionary: ${comprehensive.codes.length} codes`);

  // Load ESRS-GRI mapping dictionary (35 codes from ESRS mapping)
  const esrsPath = resolve(process.cwd(), 'data/ultimate-gri-dictionary.json');
  const esrs: Dictionary = JSON.parse(readFileSync(esrsPath, 'utf-8'));
  console.log(`✓ Loaded ESRS-GRI mapping: ${esrs.codes.length} codes\n`);

  // Merge codes (use Map to deduplicate by code)
  const mergedCodes = new Map<string, GRICode>();

  // Add all comprehensive codes first
  comprehensive.codes.forEach(code => {
    mergedCodes.set(code.code, code);
  });

  // Add/merge ESRS codes (will add ESRS reference to existing codes)
  esrs.codes.forEach(esrsCode => {
    const existing = mergedCodes.get(esrsCode.code);
    if (existing) {
      // Update existing code with ESRS reference
      existing.esrs_reference = esrsCode.esrs_reference;
    } else {
      // Add new code from ESRS mapping
      mergedCodes.set(esrsCode.code, esrsCode);
    }
  });

  // Sort by code
  const sortedCodes = Array.from(mergedCodes.values())
    .sort((a, b) => a.code.localeCompare(b.code));

  console.log(`📊 Merge results:`);
  console.log(`   Total unique codes: ${sortedCodes.length}`);
  console.log(`   From comprehensive: ${comprehensive.codes.length}`);
  console.log(`   From ESRS mapping: ${esrs.codes.length}`);
  console.log(`   New codes added: ${sortedCodes.length - comprehensive.codes.length}`);
  console.log(`   Overlapping codes: ${comprehensive.codes.length + esrs.codes.length - sortedCodes.length}\n`);

  // Group by category
  const byCategory = sortedCodes.reduce((acc, code) => {
    if (!acc[code.category]) acc[code.category] = [];
    acc[code.category].push(code);
    return acc;
  }, {} as Record<string, GRICode[]>);

  console.log('📋 Breakdown by category:');
  Object.entries(byCategory).forEach(([category, codes]) => {
    console.log(`   ${category}: ${codes.length} codes`);
  });

  // Merge search keywords (deduplicate)
  const allKeywords = new Set([
    ...comprehensive.search_keywords,
    ...esrs.search_keywords
  ]);

  // Add additional common keywords
  const additionalKeywords = [
    // Alternative names for emissions
    'Carbon emissions', 'CO2 emissions', 'GHG emissions',
    'Direct emissions', 'Indirect emissions',
    'Location-based emissions', 'Market-based emissions',

    // Alternative names for employees
    'Workforce', 'Staff count', 'Headcount',
    'Full-time employees', 'Part-time employees',
    'Permanent employees', 'Temporary employees',

    // Alternative names for water
    'Water use', 'Water recycled', 'Water reused',

    // Alternative names for energy
    'Energy use', 'Electricity consumption', 'Fuel consumption',

    // Alternative names for safety
    'Work injuries', 'Occupational injuries', 'Lost time injuries',
    'Injury rate', 'Accident rate',

    // Alternative names for diversity
    'Female representation', 'Women representation',
    'Board members', 'Executive diversity',

    // Alternative names for waste
    'Waste recycled', 'Waste disposal',

    // Alternative names for training
    'Training days', 'Employee development',

    // GRI Content Index related
    'GRI Content Index', 'GRI Index', 'Sustainability Data Table',
    'Performance Data', 'ESG Data Table', 'ESRS Disclosure'
  ];

  additionalKeywords.forEach(kw => allKeywords.add(kw));

  const searchKeywords = Array.from(allKeywords).sort();

  // Build merged dictionary
  const merged: Dictionary = {
    metadata: {
      created_at: new Date().toISOString(),
      sources: [
        'Official GRI Content Index Template (140 codes)',
        'Official ESRS-GRI mapping spreadsheet (35 codes)'
      ],
      total_codes: sortedCodes.length,
      categories: Object.keys(byCategory).length,
      search_keywords_count: searchKeywords.length
    },
    codes: sortedCodes,
    search_keywords: searchKeywords
  };

  // Save merged dictionary
  const outputPath = resolve(process.cwd(), 'data/merged-ultimate-gri-dictionary.json');
  writeFileSync(outputPath, JSON.stringify(merged, null, 2));
  console.log(`\n💾 Saved merged dictionary to: ${outputPath}`);

  // Show sample
  console.log('\n📋 Sample merged GRI codes (showing ESRS references where available):');
  sortedCodes.filter(c => c.esrs_reference).slice(0, 15).forEach(code => {
    console.log(`   ${code.code} - ${code.topic.substring(0, 50)}${code.topic.length > 50 ? '...' : ''}`);
    console.log(`      ESRS: ${code.esrs_reference}`);
  });

  console.log('\n✅ Ultimate merged GRI dictionary created!');
  console.log(`   Total unique codes: ${sortedCodes.length}`);
  console.log(`   Search keywords: ${searchKeywords.length}`);
  console.log(`   Categories: ${Object.keys(byCategory).length}`);
  console.log(`   Codes with ESRS reference: ${sortedCodes.filter(c => c.esrs_reference).length}`);
}

main();
