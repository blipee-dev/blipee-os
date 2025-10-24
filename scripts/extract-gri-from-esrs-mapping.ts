import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function main() {
  console.log('======================================================================');
  console.log('📚 EXTRACTING GRI CODES FROM ESRS MAPPING SPREADSHEET');
  console.log('======================================================================\n');

  const filePath = '/Users/pedro/Downloads/draft-esrs-gri-standards-data-point-mapping (1).xlsx';
  const workbook = XLSX.readFile(filePath);

  const allGRICodes = new Set<string>();
  const allESRSCodes = new Set<string>();
  const mappings: any[] = [];

  // Process each ESRS sheet (E1, E2, etc.)
  const esrsSheets = ['ESRS 2', 'ESRS E1', 'ESRS E2', 'ESRS E3', 'ESRS E4', 'ESRS E5', 'ESRS S1', 'ESRS S2', 'ESRS S3', 'ESRS S4', 'ESRS G1'];

  for (const sheetName of esrsSheets) {
    console.log(`\n📄 Processing: ${sheetName}`);

    if (!workbook.Sheets[sheetName]) {
      console.log(`   ⚠️  Sheet not found, skipping...`);
      continue;
    }

    const worksheet = workbook.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length === 0) continue;

    // Find column indices
    const headerRow = data[0];
    let griColumnIdx = -1;
    let esrsColumnIdx = -1;
    let descriptionIdx = -1;

    headerRow.forEach((cell: any, idx: number) => {
      const cellStr = String(cell || '').toLowerCase();
      if (cellStr.includes('gri') && cellStr.includes('standard')) {
        griColumnIdx = idx;
        console.log(`   Found GRI column at index ${idx}: "${cell}"`);
      }
      if (cellStr.includes('esrs') && !cellStr.includes('disclaimer')) {
        esrsColumnIdx = idx;
      }
      if (cellStr.includes('data point') || cellStr.includes('description')) {
        descriptionIdx = idx;
      }
    });

    if (griColumnIdx === -1) {
      console.log(`   ⚠️  GRI Standards column not found`);
      continue;
    }

    // Extract data from rows
    let foundCodes = 0;
    data.slice(1).forEach((row: any[]) => {
      const griCell = row[griColumnIdx];
      const esrsCell = esrsColumnIdx >= 0 ? row[esrsColumnIdx] : null;

      if (griCell) {
        const griStr = String(griCell);

        // Extract GRI codes (format: GRI ###-#)
        const griMatches = griStr.match(/GRI\s+\d{1,3}-\d{1,2}/gi);
        if (griMatches) {
          griMatches.forEach(code => {
            allGRICodes.add(code.toUpperCase().trim());
            foundCodes++;
          });
        }
      }

      if (esrsCell) {
        const esrsStr = String(esrsCell);
        // Extract ESRS codes
        const esrsMatches = esrsStr.match(/E[S]?RS\s*[AEGS]\d+(-\d+)?/gi);
        if (esrsMatches) {
          esrsMatches.forEach(code => allESRSCodes.add(code.toUpperCase().trim()));
        }
      }
    });

    console.log(`   ✓ Found ${foundCodes} GRI code references`);
  }

  // Convert to arrays and sort
  const griArray = Array.from(allGRICodes).sort();
  const esrsArray = Array.from(allESRSCodes).sort();

  console.log('\n' + '='.repeat(70));
  console.log('📊 EXTRACTION COMPLETE');
  console.log('='.repeat(70));
  console.log(`\n✅ Total unique GRI codes: ${griArray.length}`);
  console.log(`✅ Total unique ESRS codes: ${esrsArray.length}`);

  // Show samples by category
  console.log('\n📋 GRI CODES BY CATEGORY:\n');

  const byCategory: any = {};
  griArray.forEach(code => {
    const num = parseInt(code.replace(/[^\d]/g, ''));
    let category = 'other';

    if (num >= 200 && num < 300) category = 'economic';
    else if (num >= 300 && num < 400) category = 'environmental';
    else if (num >= 400 && num < 500) category = 'social';
    else if (code.includes('2-')) category = 'general';

    if (!byCategory[category]) byCategory[category] = [];
    byCategory[category].push(code);
  });

  Object.entries(byCategory).forEach(([cat, codes]: [string, any]) => {
    console.log(`   ${cat.toUpperCase()} (${codes.length} codes):`);
    codes.slice(0, 5).forEach((c: string) => console.log(`      ${c}`));
    if (codes.length > 5) console.log(`      ... and ${codes.length - 5} more`);
  });

  // Save enhanced dictionary
  const dictionary = {
    metadata: {
      created_at: new Date().toISOString(),
      source: 'Official ESRS-GRI mapping spreadsheet',
      method: 'excel_column_extraction',
      description: 'Complete GRI and ESRS code dictionary from official EU mapping'
    },
    gri_codes: griArray.map(code => ({
      code: code,
      category: getCategoryFromCode(code),
      source: 'ESRS-GRI official mapping'
    })),
    esrs_codes: esrsArray.map(code => ({
      code: code,
      category: getESRSCategory(code),
      source: 'ESRS-GRI official mapping'
    })),
    search_keywords: [
      ...griArray,
      ...esrsArray,
      // Add common metric names
      'Scope 1 emissions', 'Scope 2 emissions', 'Scope 3 emissions',
      'Total employees', 'Female employees', 'Male employees',
      'Energy consumption', 'Water consumption', 'Waste generated',
      'LTIF', 'TRIR', 'Fatalities', 'Training hours', 'Board composition'
    ],
    stats: {
      total_gri_codes: griArray.length,
      total_esrs_codes: esrsArray.length,
      total_keywords: griArray.length + esrsArray.length + 12
    }
  };

  // Save
  const outputPath = resolve(process.cwd(), 'data/standard-keyword-dictionary-official.json');
  writeFileSync(outputPath, JSON.stringify(dictionary, null, 2));

  console.log(`\n💾 Saved official dictionary to: ${outputPath}`);

  console.log('\n' + '='.repeat(70));
  console.log('🎯 COMPARISON');
  console.log('='.repeat(70));
  console.log(`   Our extracted dictionary:    25 GRI codes`);
  console.log(`   Official ESRS-GRI mapping:   ${griArray.length} GRI codes`);
  console.log(`   IMPROVEMENT:                 ${griArray.length - 25} more codes (+${Math.round(((griArray.length / 25) - 1) * 100)}%)`);

  console.log('\n💡 This official dictionary should MASSIVELY improve extraction!');
}

function getCategoryFromCode(code: string): string {
  if (code.includes('305')) return 'emissions';
  if (code.includes('302')) return 'energy';
  if (code.includes('303')) return 'water';
  if (code.includes('306')) return 'waste';
  if (code.includes('401') || code.includes('2-7') || code.includes('2-8')) return 'employees';
  if (code.includes('405')) return 'diversity';
  if (code.includes('403')) return 'safety';
  if (code.includes('201')) return 'economic';
  if (code.includes('2-9') || code.includes('2-10')) return 'governance';

  const num = parseInt(code.replace(/[^\d]/g, ''));
  if (num >= 200 && num < 300) return 'economic';
  if (num >= 300 && num < 400) return 'environmental';
  if (num >= 400 && num < 500) return 'social';

  return 'general';
}

function getESRSCategory(code: string): string {
  if (code.includes('E1')) return 'climate';
  if (code.includes('E2')) return 'pollution';
  if (code.includes('E3')) return 'water';
  if (code.includes('E4')) return 'biodiversity';
  if (code.includes('E5')) return 'circular_economy';
  if (code.includes('S1')) return 'workforce';
  if (code.includes('S2')) return 'value_chain_workers';
  if (code.includes('S3')) return 'communities';
  if (code.includes('S4')) return 'consumers';
  if (code.includes('G1')) return 'governance';
  return 'general';
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
