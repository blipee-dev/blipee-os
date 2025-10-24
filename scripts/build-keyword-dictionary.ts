import { config } from 'dotenv';
import { resolve } from 'path';
import OpenAI from 'openai';
import pdf from 'pdf-parse';
import { readFileSync, writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const deepseekApiKey = process.env.DEEPSEEK_API_KEY!;

const deepseek = new OpenAI({
  apiKey: deepseekApiKey,
  baseURL: 'https://api.deepseek.com'
});

interface StandardKeyword {
  code: string;
  metric_name: string;
  category: string;
  units: string[];
  aliases: string[];
  appears_in_docs: string[];
}

async function extractText(pdfPath: string): Promise<string> {
  console.log(`📄 Extracting text from ${pdfPath}...`);
  const buffer = readFileSync(pdfPath);
  const data = await pdf(buffer);
  console.log(`   ✓ ${data.text.length.toLocaleString()} chars from ${data.numpages} pages`);
  return data.text;
}

async function extractKeywordsWithAI(docName: string, text: string): Promise<any> {
  console.log(`🤖 Analyzing ${docName} with DeepSeek...\n`);

  const prompt = `You are analyzing a GRI/ESRS Content Index document to extract STANDARDIZED sustainability keywords.

DOCUMENT: ${docName}

TEXT (first 100K chars):
${text.substring(0, 100000)}

Extract EVERY GRI code, ESRS code, SASB code, and standard metric name you find.

For each standard, extract:
1. **Code**: GRI 305-1, ESRS E1-1, SASB EM-EP-110a.1
2. **Metric name**: "Scope 1 GHG emissions", "Total employees", "Water consumption"
3. **Category**: "emissions", "energy", "water", "waste", "employees", "diversity", "safety", "governance", "financial"
4. **Units**: tonCO2e, GJ, m3, tonnes, count, %, ratio
5. **Aliases**: Alternative names for the same metric

Return JSON structure:
{
  "gri_standards": [
    {
      "code": "GRI 305-1",
      "metric_name": "Direct (Scope 1) GHG emissions",
      "category": "emissions",
      "units": ["tonCO2e", "tCO2e", "tonnes CO2"],
      "aliases": ["Scope 1 emissions", "Direct emissions", "GHG Scope 1"]
    }
  ],
  "esrs_standards": [...],
  "sasb_standards": [...],
  "common_metrics": [
    {
      "metric_name": "Total employees",
      "category": "employees",
      "units": ["count", "number"],
      "aliases": ["Workforce", "Headcount", "Employees total", "Number of employees"]
    }
  ]
}

CRITICAL:
- Extract ALL codes you see (GRI, ESRS, SASB, WEF, TCFD)
- Include ALL variations of metric names (e.g., "Scope 1", "Direct emissions", "GHG emissions scope 1")
- List ALL possible units for each metric
- This is a STANDARDIZED dictionary - these keywords work for ALL companies

Return ONLY valid JSON.`;

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: 'Extract standardized sustainability keywords and codes from GRI/ESRS documents. Return ONLY valid JSON.'
      },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 8000,
  });

  const content = response.choices[0].message.content!;

  if (!content || content.trim().length === 0) {
    console.log('   ⚠️  Empty response from DeepSeek, using fallback...');
    return {
      gri_standards: [],
      esrs_standards: [],
      common_metrics: []
    };
  }

  try {
    return JSON.parse(content);
  } catch (e) {
    console.log('   ⚠️  JSON parse error, trying to fix...');
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[jsonMatch.length - 1]);
    }
    throw e;
  }
}

async function main() {
  console.log('======================================================================');
  console.log('📚 BUILDING STANDARD KEYWORD DICTIONARY');
  console.log('======================================================================\n');
  console.log('Strategy: Extract GRI/ESRS codes from 3 small docs to build universal dictionary\n');

  const documents = [
    {
      name: 'Galp Standards (110 metrics)',
      path: '/tmp/galp-standards-analysis.pdf'
    },
    {
      name: 'Ageas GRI (91 metrics)',
      path: '/tmp/ageas-gri/report.pdf'
    },
    {
      name: 'PLMJ GRI (71 metrics)',
      path: '/tmp/plmj-puppeteer/report.pdf'
    }
  ];

  const allKeywords: any[] = [];

  for (const doc of documents) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📊 ${doc.name}`);
    console.log('='.repeat(70));

    const text = await extractText(doc.path);
    const keywords = await extractKeywordsWithAI(doc.name, text);

    allKeywords.push({
      document: doc.name,
      keywords: keywords
    });

    // Show sample
    const griCount = keywords.gri_standards?.length || 0;
    const esrsCount = keywords.esrs_standards?.length || 0;
    const commonCount = keywords.common_metrics?.length || 0;

    console.log(`\n✓ Extracted:`);
    console.log(`   GRI standards: ${griCount}`);
    console.log(`   ESRS standards: ${esrsCount}`);
    console.log(`   Common metrics: ${commonCount}`);

    if (griCount > 0) {
      console.log(`\n📋 Sample GRI codes:`);
      keywords.gri_standards.slice(0, 5).forEach((std: any) => {
        console.log(`   ${std.code}: ${std.metric_name}`);
      });
    }
  }

  // Merge and deduplicate
  console.log('\n\n' + '='.repeat(70));
  console.log('🔄 MERGING AND DEDUPLICATING');
  console.log('='.repeat(70) + '\n');

  const mergedDict: any = {
    gri_standards: [],
    esrs_standards: [],
    sasb_standards: [],
    common_metrics: [],
    metadata: {
      created_at: new Date().toISOString(),
      source_documents: documents.map(d => d.name),
      total_sources: documents.length,
      description: 'Universal keyword dictionary for ESG metric extraction'
    }
  };

  // Collect all unique codes
  const seenCodes = new Set<string>();

  for (const doc of allKeywords) {
    const kw = doc.keywords;

    // GRI
    if (kw.gri_standards) {
      for (const std of kw.gri_standards) {
        if (!seenCodes.has(std.code)) {
          seenCodes.add(std.code);
          mergedDict.gri_standards.push({
            ...std,
            appears_in_docs: [doc.document]
          });
        } else {
          // Update existing entry
          const existing = mergedDict.gri_standards.find((s: any) => s.code === std.code);
          if (existing && !existing.appears_in_docs.includes(doc.document)) {
            existing.appears_in_docs.push(doc.document);
            // Merge aliases
            existing.aliases = [...new Set([...existing.aliases, ...std.aliases])];
          }
        }
      }
    }

    // ESRS
    if (kw.esrs_standards) {
      for (const std of kw.esrs_standards) {
        if (!seenCodes.has(std.code)) {
          seenCodes.add(std.code);
          mergedDict.esrs_standards.push({
            ...std,
            appears_in_docs: [doc.document]
          });
        } else {
          const existing = mergedDict.esrs_standards.find((s: any) => s.code === std.code);
          if (existing && !existing.appears_in_docs.includes(doc.document)) {
            existing.appears_in_docs.push(doc.document);
            existing.aliases = [...new Set([...existing.aliases, ...std.aliases])];
          }
        }
      }
    }

    // Common metrics (without codes)
    if (kw.common_metrics) {
      for (const metric of kw.common_metrics) {
        const existing = mergedDict.common_metrics.find((m: any) =>
          m.metric_name.toLowerCase() === metric.metric_name.toLowerCase()
        );
        if (!existing) {
          mergedDict.common_metrics.push({
            ...metric,
            appears_in_docs: [doc.document]
          });
        } else {
          if (!existing.appears_in_docs.includes(doc.document)) {
            existing.appears_in_docs.push(doc.document);
            existing.aliases = [...new Set([...existing.aliases, ...(metric.aliases || [])])];
          }
        }
      }
    }
  }

  console.log(`✓ Merged dictionary:`);
  console.log(`   GRI standards: ${mergedDict.gri_standards.length}`);
  console.log(`   ESRS standards: ${mergedDict.esrs_standards.length}`);
  console.log(`   Common metrics: ${mergedDict.common_metrics.length}`);
  console.log(`   Total unique keywords: ${seenCodes.size}`);

  // Save dictionary
  const outputPath = resolve(process.cwd(), 'data/standard-keyword-dictionary.json');
  writeFileSync(outputPath, JSON.stringify(mergedDict, null, 2));

  console.log(`\n✅ Dictionary saved to: ${outputPath}`);

  // Show samples by category
  console.log('\n📊 SAMPLE KEYWORDS BY CATEGORY:\n');

  const categories = ['emissions', 'energy', 'water', 'waste', 'employees', 'safety'];

  for (const category of categories) {
    const griInCategory = mergedDict.gri_standards.filter((s: any) => s.category === category);
    const commonInCategory = mergedDict.common_metrics.filter((m: any) => m.category === category);

    if (griInCategory.length > 0 || commonInCategory.length > 0) {
      console.log(`🏷️  ${category.toUpperCase()}`);

      griInCategory.slice(0, 3).forEach((std: any) => {
        console.log(`   ${std.code}: ${std.metric_name}`);
        console.log(`      Units: ${std.units.join(', ')}`);
        console.log(`      Aliases: ${std.aliases.slice(0, 2).join(', ')}`);
      });

      console.log('');
    }
  }

  console.log('\n💡 USAGE:');
  console.log('─'.repeat(70));
  console.log('This dictionary contains STANDARDIZED keywords that work across ALL companies.');
  console.log('Use these keywords to extract metrics from ANY sustainability report (big or small).');
  console.log('\nNext step: Build extraction prompt that searches for these keywords in large reports.');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
