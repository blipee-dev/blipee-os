const XLSX = require('xlsx');

// Read the Excel file
const workbook = XLSX.readFile('/Users/pedro/Downloads/Emissoes Grid.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

// Skip first 2 rows (headers)
const dataRows = data.slice(2);

console.log('-- Complete grid mix data from Electricity Maps');
console.log('-- Source: Emissoes Grid.xlsx');
console.log('');
console.log('INSERT INTO portugal_grid_mix_reference (year, month, renewable_percentage, non_renewable_percentage, carbon_intensity, data_source, source_url, notes) VALUES');

const sqlRows = [];

dataRows.forEach((row, index) => {
  const excelDate = row['__EMPTY'];
  const carbonIntensity = row['Grams of CO2 equivalent per kilowatt-hour (gCO2eq/kWh) measuring the greenhouse gas emissions from generating electricity'];
  const renewablePercent = row['Renewable electricity includes solar, wind, hydro, biomass and geothermal'];

  if (excelDate && carbonIntensity && renewablePercent) {
    // Convert Excel serial date to JavaScript Date
    // Excel dates are days since 1899-12-30 (not 1900-01-01 due to Excel bug)
    const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
    const year = jsDate.getFullYear();
    const month = jsDate.getMonth() + 1;
    const nonRenewablePercent = 100 - renewablePercent;

    const monthName = jsDate.toLocaleDateString('pt-PT', { year: 'numeric', month: 'short' });

    sqlRows.push(
      `(${year}, ${month}, ${renewablePercent}.0, ${nonRenewablePercent}.0, ${carbonIntensity}, 'Electricity Maps', 'https://portal.electricitymaps.com/map/zone/PT/5y/monthly', '${monthName} - Complete historical data')`
    );
  }
});

console.log(sqlRows.join(',\n'));
console.log(';');
