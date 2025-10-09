/**
 * Update all sector configurations to use new benchmark structure
 * This converts old single-value benchmarks to the new multi-metric structure
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/sustainability/sector-intensity.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Find all benchmark entries that use old format
const oldFormatRegex = /benchmarks: \{ low: ([\d.]+), average: ([\d.]+), high: ([\d.]+) \}/g;

let match;
const replacements = [];

while ((match = oldFormatRegex.exec(content)) !== null) {
  const [fullMatch, low, average, high] = match;
  const newFormat = `benchmarks: {
      production: { low: ${low}, average: ${average}, high: ${high} }
    }`;

  replacements.push({
    old: fullMatch,
    new: newFormat
  });
}

console.log(`Found ${replacements.length} sectors to update\n`);

// Apply replacements
for (const { old, new: newVal } of replacements) {
  content = content.replace(old, newVal);
}

// Write back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Updated all sectors to new benchmark structure');
console.log('   All sectors now use: benchmarks.production');
console.log('   Ready to add sector-specific perEmployee, perRevenue, perArea, perValueAdded\n');
