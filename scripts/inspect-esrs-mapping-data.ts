import * as XLSX from 'xlsx';
import { resolve } from 'path';

async function main() {
  console.log('======================================================================');
  console.log('🔍 INSPECTING ESRS-GRI MAPPING SPREADSHEET DATA');
  console.log('======================================================================\n');

  const filePath = '/Users/pedro/Downloads/draft-esrs-gri-standards-data-point-mapping (1).xlsx';
  const workbook = XLSX.readFile(filePath);

  // Sample one sheet in detail
  const sheetName = 'ESRS E1';
  console.log(`📄 Detailed inspection: ${sheetName}\n`);

  const worksheet = workbook.Sheets[sheetName];
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Find GRI column
  const headerRow = data[0];
  let griColumnIdx = -1;

  headerRow.forEach((cell: any, idx: number) => {
    const cellStr = String(cell || '').toLowerCase();
    if (cellStr.includes('gri') && cellStr.includes('standard')) {
      griColumnIdx = idx;
      console.log(`Found GRI column at index ${idx}: "${cell}"\n`);
    }
  });

  if (griColumnIdx === -1) {
    console.log('❌ GRI column not found');
    return;
  }

  // Show all headers
  console.log('📋 ALL COLUMN HEADERS:\n');
  headerRow.forEach((cell: any, idx: number) => {
    console.log(`   [${idx}] ${cell}`);
  });

  // Show sample data from GRI column
  console.log(`\n📊 SAMPLE DATA FROM GRI COLUMN (index ${griColumnIdx}):\n`);
  data.slice(1, 21).forEach((row: any[], rowIdx) => {
    const griCell = row[griColumnIdx];
    if (griCell) {
      const cellStr = String(griCell);
      console.log(`   Row ${rowIdx + 2}: "${cellStr}" (type: ${typeof griCell}, length: ${cellStr.length})`);

      // Try different extraction patterns
      const pattern1 = cellStr.match(/GRI\s+\d{1,3}-\d{1,2}/gi);
      const pattern2 = cellStr.match(/\d{1,3}-\d{1,2}/gi);
      const pattern3 = cellStr.match(/GRI\s*\d+/gi);

      if (pattern1) console.log(`      ✓ Pattern 1 (GRI ###-#): ${pattern1.join(', ')}`);
      if (pattern2) console.log(`      ✓ Pattern 2 (###-#): ${pattern2.join(', ')}`);
      if (pattern3) console.log(`      ✓ Pattern 3 (GRI ###): ${pattern3.join(', ')}`);
    }
  });

  // Check other sheets too
  console.log('\n\n📚 CHECKING ALL SHEETS FOR GRI DATA:\n');
  const esrsSheets = ['ESRS 2', 'ESRS E1', 'ESRS E2', 'ESRS E3', 'ESRS E4', 'ESRS E5', 'ESRS S1', 'ESRS S2', 'ESRS S3', 'ESRS S4', 'ESRS G1'];

  for (const sheet of esrsSheets) {
    if (!workbook.Sheets[sheet]) continue;

    const ws = workbook.Sheets[sheet];
    const sheetData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (sheetData.length === 0) continue;

    const headers = sheetData[0];
    let griIdx = -1;

    headers.forEach((cell: any, idx: number) => {
      const cellStr = String(cell || '').toLowerCase();
      if (cellStr.includes('gri') && cellStr.includes('standard')) {
        griIdx = idx;
      }
    });

    if (griIdx === -1) continue;

    // Count non-empty GRI cells
    let nonEmptyCells = 0;
    let cellsWithGRI = 0;
    const samples: string[] = [];

    sheetData.slice(1).forEach(row => {
      const griCell = row[griIdx];
      if (griCell) {
        nonEmptyCells++;
        const cellStr = String(griCell);
        if (cellStr.toLowerCase().includes('gri')) {
          cellsWithGRI++;
        }
        if (samples.length < 3) {
          samples.push(cellStr.substring(0, 100));
        }
      }
    });

    console.log(`${sheet}:`);
    console.log(`   Non-empty GRI cells: ${nonEmptyCells}`);
    console.log(`   Cells containing "GRI": ${cellsWithGRI}`);
    if (samples.length > 0) {
      console.log(`   Samples:`);
      samples.forEach(s => console.log(`      "${s}"`));
    }
    console.log();
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
