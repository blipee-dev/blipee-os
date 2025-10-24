import pdf from 'pdf-parse';
import { readFileSync } from 'fs';

async function main() {
  const buffer = readFileSync('/tmp/ageas/report.pdf');
  const data = await pdf(buffer);
  const text = data.text;

  // Find emissions table section
  const emissionsIndex = text.indexOf('439,504');
  const snippet = text.substring(Math.max(0, emissionsIndex - 800), emissionsIndex + 800);

  console.log('=== EMISSIONS TABLE SNIPPET ===\n');
  console.log(snippet);

  console.log('\n\n=== CHECKING FOR MULTI-YEAR DATA ===');

  // Look for common year patterns in tables
  const patterns = [
    /2024.*2023/g,
    /2023.*2024/g,
    /(FY|Year).*2024.*2023/gi,
    /\d{3,},\d{3}.*\d{3},\d{3}/g // Two large numbers next to each other (likely 2 year columns)
  ];

  patterns.forEach((pattern, i) => {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      console.log(`\nPattern ${i+1} matches (first 3):`, matches.slice(0, 3));
    }
  });
}

main();
