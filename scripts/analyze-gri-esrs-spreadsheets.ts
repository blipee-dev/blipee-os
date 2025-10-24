import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

function analyzeSpreadsheet(filePath: string, name: string) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 ${name}`);
  console.log('='.repeat(70) + '\n');

  const workbook = XLSX.readFile(filePath);

  console.log(`📋 Sheets: ${workbook.SheetNames.length}`);
  workbook.SheetNames.forEach((sheetName, idx) => {
    console.log(`   ${idx + 1}. ${sheetName}`);
  });

  const allData: any = {};

  // Analyze each sheet
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n📄 Analyzing: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`   Rows: ${data.length}`);

    if (data.length > 0) {
      const headers = data[0] as any[];
      console.log(`   Columns: ${headers.length}`);
      console.log(`   Headers: ${headers.slice(0, 5).join(', ')}${headers.length > 5 ? '...' : ''}`);

      // Show first few data rows
      console.log(`\n   Sample data (first 3 rows):`);
      (data.slice(1, 4) as any[]).forEach((row: any[], idx) => {
        console.log(`      Row ${idx + 1}: ${row.slice(0, 3).join(' | ')}${row.length > 3 ? ' | ...' : ''}`);
      });

      // Store full data
      allData[sheetName] = {
        headers: headers,
        rows: data.slice(1),
        rowCount: data.length - 1
      };
    }
  });

  return { name, sheets: workbook.SheetNames, data: allData };
}

async function main() {
  console.log('======================================================================');
  console.log('📚 ANALYZING OFFICIAL GRI/ESRS MAPPING SPREADSHEETS');
  console.log('======================================================================');

  const files = [
    {
      path: '/Users/pedro/Downloads/gri-content-index-template-2021.xlsx',
      name: 'GRI Content Index Template 2021'
    },
    {
      path: '/Users/pedro/Downloads/draft-esrs-gri-standards-data-point-mapping (1).xlsx',
      name: 'ESRS-GRI Standards Mapping'
    }
  ];

  const results = [];

  for (const file of files) {
    try {
      const result = analyzeSpreadsheet(file.path, file.name);
      results.push(result);
    } catch (error: any) {
      console.log(`\n❌ Error reading ${file.name}: ${error.message}`);
    }
  }

  // Extract GRI codes and mappings
  console.log('\n\n' + '='.repeat(70));
  console.log('🔍 EXTRACTING GRI/ESRS CODES AND MAPPINGS');
  console.log('='.repeat(70) + '\n');

  const extractedCodes: any = {
    gri_codes: [],
    esrs_codes: [],
    mappings: [],
    metric_definitions: []
  };

  results.forEach(result => {
    Object.entries(result.data).forEach(([sheetName, sheetData]: [string, any]) => {
      const headers = sheetData.headers;
      const rows = sheetData.rows;

      // Look for GRI codes in columns
      headers.forEach((header: string, colIdx: number) => {
        const headerStr = String(header || '').toLowerCase();

        if (headerStr.includes('gri') || headerStr.includes('disclosure') || headerStr.includes('standard')) {
          console.log(`   Found potential GRI column: "${header}" in ${sheetName}`);

          // Extract codes from this column
          rows.slice(0, 10).forEach((row: any[]) => {
            const cell = row[colIdx];
            if (cell && String(cell).match(/GRI\s+\d{1,3}-\d{1,2}/i)) {
              extractedCodes.gri_codes.push({
                code: String(cell),
                sheet: sheetName,
                context: row.slice(0, 3).join(' | ')
              });
            }
          });
        }

        // Look for ESRS codes
        if (headerStr.includes('esrs') || headerStr.includes('european')) {
          console.log(`   Found potential ESRS column: "${header}" in ${sheetName}`);

          rows.slice(0, 10).forEach((row: any[]) => {
            const cell = row[colIdx];
            if (cell && String(cell).match(/ESRS\s+[AESG]\d+/i)) {
              extractedCodes.esrs_codes.push({
                code: String(cell),
                sheet: sheetName,
                context: row.slice(0, 3).join(' | ')
              });
            }
          });
        }
      });
    });
  });

  // Deduplicate
  const uniqueGRI = [...new Set(extractedCodes.gri_codes.map((c: any) => c.code))];
  const uniqueESRS = [...new Set(extractedCodes.esrs_codes.map((c: any) => c.code))];

  console.log(`\n✓ Found ${uniqueGRI.length} unique GRI codes`);
  console.log(`✓ Found ${uniqueESRS.length} unique ESRS codes`);

  if (uniqueGRI.length > 0) {
    console.log(`\n📋 Sample GRI codes:`);
    uniqueGRI.slice(0, 10).forEach(code => console.log(`   ${code}`));
  }

  if (uniqueESRS.length > 0) {
    console.log(`\n📋 Sample ESRS codes:`);
    uniqueESRS.slice(0, 10).forEach(code => console.log(`   ${code}`));
  }

  // Save complete analysis
  const outputPath = resolve(process.cwd(), 'data/gri-esrs-spreadsheet-analysis.json');
  writeFileSync(outputPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    files_analyzed: files.map(f => f.name),
    results: results,
    extracted_codes: {
      gri_unique: uniqueGRI,
      esrs_unique: uniqueESRS,
      gri_count: uniqueGRI.length,
      esrs_count: uniqueESRS.length
    }
  }, null, 2));

  console.log(`\n💾 Saved complete analysis to: ${outputPath}`);

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`\n✅ Analyzed ${results.length} spreadsheets`);
  console.log(`✅ Found ${uniqueGRI.length} unique GRI codes`);
  console.log(`✅ Found ${uniqueESRS.length} unique ESRS codes`);
  console.log(`\n💡 These official mappings can MASSIVELY expand our 25-code dictionary!`);
  console.log(`   Current: 25 GRI codes`);
  console.log(`   Potential: ${uniqueGRI.length} GRI + ${uniqueESRS.length} ESRS = ${uniqueGRI.length + uniqueESRS.length} total codes`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
