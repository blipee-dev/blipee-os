import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

interface ExtractedData {
  company_name: string;
  industry: string;
  metric_count: number;
  metrics: Record<string, any>;
}

const outputDir = resolve(process.cwd(), 'data/extracted-production');
const files = readdirSync(outputDir).filter(f => f.endsWith('.json'));

console.log(`Analyzing ${files.length} extracted companies for emissions data...\n`);

const withEmissions: string[] = [];
const withoutEmissions: string[] = [];

files.forEach(file => {
  try {
    const data: ExtractedData = JSON.parse(readFileSync(resolve(outputDir, file), 'utf-8'));

    const hasScope1 = data.metrics.scope1_emissions_tco2e_2024 || data.metrics.scope1_emissions_tco2e_2023;
    const hasScope2 = data.metrics.scope2_emissions_tco2e_2024 || data.metrics.scope2_emissions_tco2e_2023;
    const hasScope3 = data.metrics.scope3_emissions_tco2e_2024 || data.metrics.scope3_emissions_tco2e_2023;

    const hasAnyEmissions = hasScope1 || hasScope2 || hasScope3;

    if (hasAnyEmissions) {
      withEmissions.push(data.company_name);
      console.log(`✅ ${data.company_name}`);
      console.log(`   Scope 1: ${hasScope1 || '(none)'}`);
      console.log(`   Scope 2: ${hasScope2 || '(none)'}`);
      console.log(`   Scope 3: ${hasScope3 || '(none)'}`);
    } else {
      withoutEmissions.push(data.company_name);
    }
  } catch (e) {
    console.error(`Error reading ${file}`);
  }
});

console.log(`\n${'='.repeat(70)}`);
console.log(`EMISSIONS DATA COVERAGE SUMMARY`);
console.log(`${'='.repeat(70)}`);
console.log(`\n✅ WITH emissions data: ${withEmissions.length}/${files.length} (${(withEmissions.length/files.length*100).toFixed(1)}%)`);
console.log(`❌ WITHOUT emissions data: ${withoutEmissions.length}/${files.length} (${(withoutEmissions.length/files.length*100).toFixed(1)}%)`);

console.log(`\n❌ Companies MISSING emissions data:`);
withoutEmissions.forEach(name => console.log(`   - ${name}`));
