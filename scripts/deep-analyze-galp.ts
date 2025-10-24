import pdf from 'pdf-parse';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

async function deepAnalyze() {
  console.log('======================================================================');
  console.log('🔬 DEEP ANALYSIS: Galp Sustainability Report (61 metrics)');
  console.log('======================================================================\n');

  const pdfPath = '/tmp/galp-analysis.pdf';
  const buffer = readFileSync(pdfPath);
  const data = await pdf(buffer);

  console.log(`📄 Basic Stats:`);
  console.log(`   Pages: ${data.numpages}`);
  console.log(`   Characters: ${data.text.length.toLocaleString()}`);
  console.log(`   Words: ~${Math.round(data.text.split(/\s+/).length).toLocaleString()}\n`);

  // 1. Analyze document title and metadata
  console.log('📋 DOCUMENT STRUCTURE ANALYSIS\n');
  const firstPage = data.text.substring(0, 2000);
  console.log('First 2000 chars:');
  console.log('─'.repeat(70));
  console.log(firstPage);
  console.log('─'.repeat(70));

  // 2. Find key section headers
  console.log('\n🔍 SECTION HEADERS (searching for patterns):\n');

  const sectionPatterns = [
    /^[A-Z\s]{10,}$/gm, // ALL CAPS headers
    /^\d+\.\s+[A-Z][a-z\s]+/gm, // Numbered sections
    /^CHAPTER\s+\d+/gim,
    /^SECTION\s+\d+/gim,
    /GRI\s+\d+-\d+/gi,
    /ESRS\s+E\d+/gi,
    /Table\s+\d+/gi,
    /Annex\s+[A-Z0-9]/gi
  ];

  let allMatches: string[] = [];
  sectionPatterns.forEach(pattern => {
    const matches = data.text.match(pattern);
    if (matches) {
      allMatches = [...allMatches, ...matches.slice(0, 10)];
    }
  });

  console.log('Found headers:');
  [...new Set(allMatches)].slice(0, 30).forEach(h => {
    console.log(`   • ${h.trim()}`);
  });

  // 3. Find data-rich keywords
  console.log('\n📊 DATA KEYWORDS (frequency analysis):\n');

  const keywords = {
    'emissions': (data.text.match(/emissions?/gi) || []).length,
    'scope 1': (data.text.match(/scope\s*1/gi) || []).length,
    'scope 2': (data.text.match(/scope\s*2/gi) || []).length,
    'scope 3': (data.text.match(/scope\s*3/gi) || []).length,
    'tonCO2e': (data.text.match(/tonCO2e|tCO2e|tonnes?\s*CO2/gi) || []).length,
    'energy consumption': (data.text.match(/energy\s+consumption/gi) || []).length,
    'renewable': (data.text.match(/renewable/gi) || []).length,
    'water': (data.text.match(/\bwater\b/gi) || []).length,
    'waste': (data.text.match(/\bwaste\b/gi) || []).length,
    'recycled': (data.text.match(/recycl/gi) || []).length,
    'employees': (data.text.match(/employees?/gi) || []).length,
    'workforce': (data.text.match(/workforce/gi) || []).length,
    'diversity': (data.text.match(/diversity/gi) || []).length,
    'women': (data.text.match(/\bwomen\b/gi) || []).length,
    'training': (data.text.match(/training/gi) || []).length,
    'safety': (data.text.match(/\bsafety\b/gi) || []).length,
    'fatalities': (data.text.match(/fatalit/gi) || []).length,
    'LTIF': (data.text.match(/LTIF|lost time injury/gi) || []).length,
    'TRIR': (data.text.match(/TRIR|total recordable/gi) || []).length,
    'GRI': (data.text.match(/\bGRI\b/gi) || []).length,
    'ESRS': (data.text.match(/\bESRS\b/gi) || []).length,
    'SASB': (data.text.match(/\bSASB\b/gi) || []).length,
    'TCFD': (data.text.match(/\bTCFD\b/gi) || []).length,
    'revenue': (data.text.match(/revenue/gi) || []).length,
    'financial': (data.text.match(/financial/gi) || []).length,
    'governance': (data.text.match(/governance/gi) || []).length,
  };

  const sortedKeywords = Object.entries(keywords)
    .sort(([,a], [,b]) => b - a)
    .filter(([,count]) => count > 0);

  sortedKeywords.forEach(([keyword, count]) => {
    const bar = '█'.repeat(Math.min(Math.ceil(count / 10), 50));
    console.log(`   ${keyword.padEnd(25)} ${bar} ${count}`);
  });

  // 4. Find numeric data patterns
  console.log('\n🔢 NUMERIC DATA PATTERNS:\n');

  const numericPatterns = {
    'Percentages': (data.text.match(/\d+\.?\d*\s*%/g) || []).length,
    'Large numbers (with commas)': (data.text.match(/\d{1,3}(,\d{3})+/g) || []).length,
    'Decimal numbers': (data.text.match(/\d+\.\d+/g) || []).length,
    'Numbers with units (t, kg, m3)': (data.text.match(/\d+\.?\d*\s*(t|kg|m3|GJ|MWh)/gi) || []).length,
    'Year patterns (2023, 2024)': (data.text.match(/\b20(2[0-4]|1[0-9])\b/g) || []).length,
  };

  Object.entries(numericPatterns).forEach(([pattern, count]) => {
    console.log(`   ${pattern.padEnd(35)} ${count}`);
  });

  // 5. Find table indicators
  console.log('\n📊 TABLE INDICATORS:\n');

  const tableKeywords = [
    'Table', 'table', 'Annex', 'annex',
    'Appendix', 'appendix', 'Index', 'index',
    'Summary', 'Key figures', 'Performance indicators',
    'Data table', 'Metrics overview'
  ];

  tableKeywords.forEach(keyword => {
    const count = (data.text.match(new RegExp(keyword, 'gi')) || []).length;
    if (count > 0) {
      console.log(`   ${keyword.padEnd(30)} ${count} occurrences`);
    }
  });

  // 6. Extract sample data sections
  console.log('\n📄 SAMPLE DATA SECTIONS (looking for dense numeric areas):\n');

  // Find areas with high density of numbers
  const chunks = [];
  const chunkSize = 1000;
  for (let i = 0; i < data.text.length; i += chunkSize) {
    const chunk = data.text.substring(i, i + chunkSize);
    const numberCount = (chunk.match(/\d+\.?\d*/g) || []).length;
    if (numberCount > 20) { // High density threshold
      chunks.push({
        position: i,
        numberCount,
        text: chunk
      });
    }
  }

  // Show top 3 densest sections
  chunks.sort((a, b) => b.numberCount - a.numberCount);
  chunks.slice(0, 3).forEach((chunk, idx) => {
    console.log(`\n   Sample ${idx + 1} (position ${chunk.position}, ${chunk.numberCount} numbers):`);
    console.log('   ' + '─'.repeat(68));
    console.log('   ' + chunk.text.substring(0, 500).split('\n').join('\n   '));
    console.log('   ' + '─'.repeat(68));
  });

  // 7. GRI/ESRS mapping analysis
  console.log('\n📋 STANDARDS REFERENCES:\n');

  const griMatches = data.text.match(/GRI\s+\d+-\d+/gi) || [];
  const esrsMatches = data.text.match(/ESRS\s+[A-Z]\d+/gi) || [];

  console.log(`   GRI Standards found: ${[...new Set(griMatches)].length} unique`);
  if (griMatches.length > 0) {
    console.log(`   Examples: ${[...new Set(griMatches)].slice(0, 10).join(', ')}`);
  }

  console.log(`\n   ESRS Standards found: ${[...new Set(esrsMatches)].length} unique`);
  if (esrsMatches.length > 0) {
    console.log(`   Examples: ${[...new Set(esrsMatches)].slice(0, 10).join(', ')}`);
  }

  // 8. Save analysis report
  const report = {
    document: 'Galp Sustainability Statement 2024',
    pages: data.numpages,
    characters: data.text.length,
    metrics_extracted: 61,
    keyword_frequencies: keywords,
    numeric_patterns: numericPatterns,
    gri_standards: [...new Set(griMatches)],
    esrs_standards: [...new Set(esrsMatches)],
    high_density_sections: chunks.slice(0, 5).map(c => ({
      position: c.position,
      numbers: c.numberCount,
      preview: c.text.substring(0, 200)
    }))
  };

  const outputPath = resolve(process.cwd(), 'data/galp-analysis-report.json');
  writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log(`\n✅ Analysis report saved to: ${outputPath}`);
}

deepAnalyze()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
