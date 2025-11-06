const XLSX = require('xlsx');

// Read the Excel file
const workbook = XLSX.readFile('/Users/pedro/Downloads/Emissoes Grid.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(JSON.stringify(data, null, 2));
