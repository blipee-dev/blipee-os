# XLSX to ExcelJS Migration Guide

## Overview
We've replaced the vulnerable `xlsx` package with `exceljs` for security reasons. This guide helps migrate any existing code.

## Security Issue Fixed
- **Package**: xlsx
- **Vulnerability**: Prototype Pollution (GHSA-4r6h-8v6p-xvw6) and ReDoS (GHSA-5pgg-2g8v-p4x9)
- **Severity**: HIGH
- **Solution**: Replaced with exceljs

## Migration Examples

### Reading Excel Files

**Before (xlsx):**
```javascript
import XLSX from 'xlsx';

const workbook = XLSX.readFile('file.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet);
```

**After (exceljs):**
```javascript
import ExcelJS from 'exceljs';

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile('file.xlsx');
const worksheet = workbook.getWorksheet(1);
const data = [];

worksheet.eachRow((row, rowNumber) => {
  if (rowNumber > 1) { // Skip header
    data.push({
      column1: row.getCell(1).value,
      column2: row.getCell(2).value,
      // ... map columns as needed
    });
  }
});
```

### Writing Excel Files

**Before (xlsx):**
```javascript
import XLSX from 'xlsx';

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
XLSX.writeFile(wb, 'output.xlsx');
```

**After (exceljs):**
```javascript
import ExcelJS from 'exceljs';

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Sheet1');

// Add headers
worksheet.columns = [
  { header: 'Column1', key: 'col1', width: 15 },
  { header: 'Column2', key: 'col2', width: 20 },
];

// Add data
data.forEach(row => {
  worksheet.addRow(row);
});

await workbook.xlsx.writeFile('output.xlsx');
```

### Processing Uploaded Files

**Before (xlsx):**
```javascript
const processExcelFile = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
};
```

**After (exceljs):**
```javascript
const processExcelFile = async (buffer) => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet(1);
  const jsonData = [];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        rowData[`col${colNumber}`] = cell.value;
      });
      jsonData.push(rowData);
    }
  });
  
  return jsonData;
};
```

## Benefits of ExcelJS

1. **Security**: No known vulnerabilities
2. **Features**: More comprehensive Excel support
3. **Performance**: Streaming support for large files
4. **Modern**: Async/await API
5. **Maintained**: Actively developed

## Testing

After migration, ensure to test:
1. File upload functionality
2. Data export features
3. Report generation
4. Any Excel-based integrations

## Support

If you find any code using xlsx that needs migration, please update it following these examples.