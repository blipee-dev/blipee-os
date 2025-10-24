import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

interface ExtractionResult {
  company_name: string;
  report_year: number;
  framework: string;
  metric_count: number;
}

async function main() {
  const extractedDir = resolve(process.cwd(), 'data/extracted');
  const files = readdirSync(extractedDir).filter(f => f.endsWith('.json'));

  console.log('======================================================================');
  console.log('📊 EXTRACTION RESULTS ANALYSIS');
  console.log('======================================================================\n');

  const results: ExtractionResult[] = [];
  let totalMetrics = 0;

  for (const file of files) {
    try {
      const content = readFileSync(resolve(extractedDir, file), 'utf-8');
      const data: ExtractionResult = JSON.parse(content);
      results.push(data);
      totalMetrics += data.metric_count;
    } catch (e) {
      console.log(`⚠️  Could not parse ${file}`);
    }
  }

  // Sort by metric count
  results.sort((a, b) => b.metric_count - a.metric_count);

  console.log(`📁 Total files: ${files.length}`);
  console.log(`📊 Total metrics extracted: ${totalMetrics.toLocaleString()}`);
  console.log(`📈 Average metrics per company: ${(totalMetrics / results.length).toFixed(1)}\n`);

  // Top performers
  console.log('🏆 TOP 10 PERFORMERS (by metric count):');
  console.log('─'.repeat(70));
  results.slice(0, 10).forEach((r, i) => {
    const framework = r.framework.padEnd(20);
    const name = r.company_name.padEnd(30);
    console.log(`${(i + 1).toString().padStart(2)}. ${name} ${framework} ${r.metric_count} metrics`);
  });

  // Bottom performers
  console.log('\n⚠️  BOTTOM 10 PERFORMERS (need GRI standards docs):');
  console.log('─'.repeat(70));
  results.slice(-10).reverse().forEach((r, i) => {
    const framework = r.framework.padEnd(20);
    const name = r.company_name.padEnd(30);
    console.log(`${(i + 1).toString().padStart(2)}. ${name} ${framework} ${r.metric_count} metrics`);
  });

  // Distribution
  console.log('\n📊 METRIC COUNT DISTRIBUTION:');
  console.log('─'.repeat(70));
  const ranges = [
    { min: 0, max: 10, label: '0-10 metrics   ' },
    { min: 11, max: 20, label: '11-20 metrics  ' },
    { min: 21, max: 30, label: '21-30 metrics  ' },
    { min: 31, max: 50, label: '31-50 metrics  ' },
    { min: 51, max: 70, label: '51-70 metrics  ' },
    { min: 71, max: 100, label: '71-100 metrics ' },
    { min: 101, max: 200, label: '101-200 metrics' }
  ];

  ranges.forEach(range => {
    const count = results.filter(r => r.metric_count >= range.min && r.metric_count <= range.max).length;
    const bar = '█'.repeat(Math.ceil(count / 2));
    const pct = ((count / results.length) * 100).toFixed(1);
    console.log(`${range.label}: ${bar} ${count} (${pct}%)`);
  });

  // GRI vs Narrative comparison
  console.log('\n📋 GRI STANDARDS vs NARRATIVE REPORTS:');
  console.log('─'.repeat(70));

  const gri = results.filter(r => r.framework === 'GRI' || r.framework.includes('GRI'));
  const narrative = results.filter(r => !r.framework.includes('GRI') && !r.framework.includes('ESRS'));

  if (gri.length > 0) {
    const griAvg = gri.reduce((sum, r) => sum + r.metric_count, 0) / gri.length;
    console.log(`GRI/Standards documents:     ${gri.length} files, avg ${griAvg.toFixed(1)} metrics`);
  }

  if (narrative.length > 0) {
    const narrativeAvg = narrative.reduce((sum, r) => sum + r.metric_count, 0) / narrative.length;
    console.log(`Narrative reports:           ${narrative.length} files, avg ${narrativeAvg.toFixed(1)} metrics`);
  }

  if (gri.length > 0 && narrative.length > 0) {
    const griAvg = gri.reduce((sum, r) => sum + r.metric_count, 0) / gri.length;
    const narrativeAvg = narrative.reduce((sum, r) => sum + r.metric_count, 0) / narrative.length;
    const improvement = ((griAvg / narrativeAvg - 1) * 100).toFixed(0);
    console.log(`\n💡 GRI documents extract ${improvement}% MORE metrics than narratives!`);
  }

  console.log('\n✨ RECOMMENDATIONS:');
  console.log('─'.repeat(70));
  console.log('1. Find GRI/ESRS standards documents for companies with <30 metrics');
  console.log('2. Use Puppeteer for 403-protected URLs (proved with PLMJ)');
  console.log('3. Update 404 URLs (Navigator Company, Jerónimo Martins, etc.)');
  console.log('4. Improve large report chunking strategy (currently 2-8 metrics)');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
