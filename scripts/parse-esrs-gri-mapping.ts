import { writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Parse official ESRS-GRI mapping data to extract ALL GRI disclosure codes
 * Source: Official ESRS-GRI mapping spreadsheet provided by user
 */

// User-provided ESRS-GRI mapping data
const esrsGriMappingData = `
ESRS S1	S1-14	Number of fatalities as a result of work-related injuries and work-related ill health in own workforce	GRI 403	403-9	a-i; b-i
ESRS S1	S1-14	Number of recordable work-related accidents in own workforce	GRI 403	403-9	a-ii
ESRS E1	E1-6	Gross Scope 1 greenhouse gas emissions in tonnes of CO2	GRI 305	305-1	a
ESRS S1	S1-6	Number of employees (head count) at the end of the reporting period	GRI 2	2-7	a
ESRS S1	S1-6	Number of employees (head count) at the end of the reporting period by gender	GRI 2	2-7	a
ESRS S1	S1-6	Number of employees at the end of the reporting period per country in countries with ≥ 50 employees	GRI 2	2-7	b-i
ESRS S1	S1-6	Total number of employees by region	GRI 2	2-7	b-i
ESRS E1	E1-6	Gross location-based Scope 2 greenhouse gas emissions in tonnes of CO2	GRI 305	305-2	a
ESRS E1	E1-6	Gross market-based Scope 2 greenhouse gas emissions in tonnes of CO2	GRI 305	305-2	b
ESRS E1	E1-6	Gross Scope 3 greenhouse gas emissions	GRI 305	305-3	a
ESRS E3	E3-4	Total amount of water consumed	GRI 303	303-5	a
ESRS E3	E3-4	Total water consumption in m³ per net revenue from areas at water risk	GRI 303	303-5	a
ESRS E2	E2-4	Total amount of waste generated	GRI 306	306-3	a
ESRS E2	E2-4	Total amount of waste diverted from disposal	GRI 306	306-4	a
ESRS E2	E2-4	Total amount of waste directed to disposal	GRI 306	306-5	a
ESRS S1	S1-7	Employee turnover rate	GRI 401	401-1	b-i
ESRS S1	S1-9	Coverage of own workers - Percentage of own workers covered by health and safety management system based on legal requirements and/or recognized standards or guidelines	GRI 403	403-8	a-i
ESRS S1	S1-9	Number and percentage of own workers covered by health and safety management system that has been internally audited	GRI 403	403-8	a-ii
ESRS S1	S1-9	Number and percentage of own workers covered by health and safety management system that has been audited or certified by an external party	GRI 403	403-8	a-iii
ESRS S1	S1-11	Percentage of own employees covered by social dialogue	GRI 2	2-30	a
ESRS S1	S1-12	Percentage of own employees covered by collective bargaining agreements	GRI 2	2-30	b
ESRS S1	S1-13	Rate of recordable work-related accidents per million hours worked in own workforce	GRI 403	403-9	a-ii
ESRS S1	S1-14	Number of fatalities per million hours worked (mortality rate)	GRI 403	403-9	a-i; b-i
ESRS S1	S1-14	Number of days lost to injuries, accidents, fatalities and illness	GRI 403	403-9	b-iii
ESRS S1	S1-16	Percentage of own employees receiving regular performance and career development reviews	GRI 404	404-3	a
ESRS S1	S1-16	Average number of hours of training per employee	GRI 404	404-1	a
ESRS S1	S1-17	Ratio of the annual total compensation for the organization's highest-paid individual to the median annual total compensation for all employees	GRI 2	2-21	a-iii
ESRS S1	S1-17	Gender pay gap	GRI 405	405-2	a
ESRS E5	E5-5	Total amount of non-recycled waste	GRI 306	306-3	a
ESRS E5	E5-6	Total amount of hazardous waste and radioactive waste generated	GRI 306	306-3	b
ESRS E4	E4-2	Species at risk in own operations	GRI 304	304-1	a
ESRS E4	E4-2	Sites owned, leased, managed in, or adjacent to, protected areas and areas of high biodiversity value outside protected areas	GRI 304	304-1	a
ESRS E3	E3-4	Total water recycled and reused	GRI 303	303-5	b
ESRS E3	E3-4	Total water stored and changes in storage	GRI 303	303-5	c
ESRS E3	E3-4	Total water withdrawal	GRI 303	303-3	a
ESRS E3	E3-4	Total water discharge	GRI 303	303-4	a
ESRS E1	E1-6	Total energy consumption	GRI 302	302-1	e
ESRS E1	E1-6	Percentage of energy consumption from renewable sources	GRI 302	302-1	NA
ESRS S2	S2-4	Number of incidents of forced labour, human trafficking or child labour in value chain	GRI 408	408-1	b
ESRS S2	S2-4	Number of incidents of forced labour, human trafficking or child labour in value chain	GRI 409	409-1	a
ESRS G1	G1-4	Confirmed incidents of corruption or bribery	GRI 205	205-3	a
ESRS G1	G1-6	Fines for violation of anti-corruption and anti-bribery laws	GRI 2	2-27	a
ESRS S4	S4-4	Number of identified cases of non-respect of UNGPs on Business and Human Rights	GRI 2	2-27	a
ESRS S3	S3-4	Number and percentage of employees trained on human rights issues	GRI 412	412-2	a
ESRS S1	S1-7	Number of new employee hires	GRI 401	401-1	a
ESRS S1	S1-7	Number of employee departures	GRI 401	401-1	b
ESRS S1	S1-8	Average annual parental leave taken per employee by gender	GRI 401	401-3	a
ESRS S1	S1-8	Return to work rate of employees that took parental leave	GRI 401	401-3	b
ESRS S1	S1-8	Retention rate of employees that took parental leave	GRI 401	401-3	c
ESRS S1	S1-17	Percentage of employees by gender in each employee category	GRI 405	405-1	b
ESRS S1	S1-17	Percentage of employees by age group in each employee category	GRI 405	405-1	b
ESRS E1	E1-4	GHG emissions intensity per net revenue	GRI 305	305-4	a
ESRS E1	E1-4	GHG emissions intensity per full-time equivalent	GRI 305	305-4	a
ESRS E1	E1-9	Anticipated financial effects of material physical risks	GRI 201	201-2	a
ESRS E1	E1-9	Anticipated financial effects of material transition risks	GRI 201	201-2	a
ESRS E1	E1-9	Anticipated financial effects of material physical and transition opportunities	GRI 201	201-2	a
ESRS 2	BP-2	Total revenue	GRI 2	2-6	a-iii
ESRS 2	BP-2	Number of employees	GRI 2	2-6	a-iv
ESRS 2	GOV-1	Composition of administrative, management and supervisory bodies	GRI 2	2-9	a
ESRS 2	GOV-1	Percentage of board members by gender	GRI 405	405-1	a
ESRS 2	GOV-1	Percentage of board members by age group	GRI 405	405-1	a
ESRS 2	SBM-1	Interests and views of stakeholders	GRI 2	2-29	a
ESRS 2	IRO-1	Involvement of administrative, management and supervisory bodies and senior executives in sustainability	GRI 2	2-12	a; b; c
ESRS 2	IRO-1	Integration of sustainability performance in incentive schemes	GRI 2	2-19	a
ESRS 2	IRO-1	Integration of sustainability performance in incentive schemes	GRI 2	2-20	a
`;

interface GRICode {
  code: string;
  category: string;
  topic: string;
  esrs_reference: string;
}

function parseESRSMapping(data: string): GRICode[] {
  const codes: Map<string, GRICode> = new Map();

  const lines = data.trim().split('\n');

  for (const line of lines) {
    if (!line.trim()) continue;

    const parts = line.split('\t');
    if (parts.length < 6) continue;

    const esrsSection = parts[0]; // e.g., "ESRS S1"
    const esrsCode = parts[1]; // e.g., "S1-14"
    const topic = parts[2]; // e.g., "Number of fatalities..."
    const griStandard = parts[3]; // e.g., "GRI 403"
    const griDisclosure = parts[4]; // e.g., "403-9"
    const griDetail = parts[5]; // e.g., "a-i; b-i"

    // Extract GRI disclosure code
    if (griDisclosure && griDisclosure.match(/^\d{1,3}-\d{1,2}$/)) {
      const fullCode = `GRI ${griDisclosure}`;

      // Determine category from GRI standard
      let category = 'general';
      const standardNum = parseInt(griStandard.replace('GRI ', ''));

      if (standardNum === 2) category = 'general';
      else if (standardNum >= 201 && standardNum <= 207) category = 'economic';
      else if (standardNum >= 301 && standardNum <= 308) category = 'environmental';
      else if (standardNum >= 401 && standardNum <= 419) category = 'social';
      else if (griStandard.includes('302')) category = 'energy';
      else if (griStandard.includes('303')) category = 'water';
      else if (griStandard.includes('305')) category = 'emissions';
      else if (griStandard.includes('306')) category = 'waste';
      else if (griStandard.includes('403')) category = 'safety';
      else if (griStandard.includes('404')) category = 'training';
      else if (griStandard.includes('405')) category = 'diversity';

      if (!codes.has(fullCode)) {
        codes.set(fullCode, {
          code: fullCode,
          category,
          topic: topic.substring(0, 100), // Truncate long topics
          esrs_reference: `${esrsSection} ${esrsCode}`
        });
      }
    }
  }

  return Array.from(codes.values()).sort((a, b) => a.code.localeCompare(b.code));
}

function main() {
  console.log('🔍 Parsing official ESRS-GRI mapping data...\n');

  const griCodes = parseESRSMapping(esrsGriMappingData);

  console.log(`✓ Extracted ${griCodes.length} unique GRI disclosure codes\n`);

  // Group by category
  const byCategory = griCodes.reduce((acc, code) => {
    if (!acc[code.category]) acc[code.category] = [];
    acc[code.category].push(code);
    return acc;
  }, {} as Record<string, GRICode[]>);

  console.log('📊 Breakdown by category:');
  Object.entries(byCategory).forEach(([category, codes]) => {
    console.log(`   ${category}: ${codes.length} codes`);
  });

  // Generate search keywords
  const searchKeywords = [
    ...griCodes.map(c => c.code),
    // Add common alternative names
    'Scope 1 emissions', 'Scope 2 emissions', 'Scope 3 emissions',
    'Total employees', 'Employee count', 'Number of employees',
    'Water consumption', 'Water withdrawal', 'Water discharge',
    'Waste generated', 'Waste disposed', 'Hazardous waste',
    'LTIF', 'TRIR', 'Fatalities', 'Lost time injury frequency',
    'Recordable injuries', 'Work-related injuries',
    'Energy consumption', 'Renewable energy',
    'Gender pay gap', 'Women in management',
    'Training hours', 'Employee training',
    'Collective bargaining', 'Union representation',
    'Turnover rate', 'Employee departures',
    'GHG intensity', 'Carbon intensity',
    'Board composition', 'Board diversity'
  ];

  // Build ultimate dictionary
  const dictionary = {
    metadata: {
      created_at: new Date().toISOString(),
      source: 'Official ESRS-GRI mapping spreadsheet',
      total_codes: griCodes.length,
      categories: Object.keys(byCategory).length
    },
    codes: griCodes,
    search_keywords: searchKeywords
  };

  // Save dictionary
  const outputPath = resolve(process.cwd(), 'data/ultimate-gri-dictionary.json');
  writeFileSync(outputPath, JSON.stringify(dictionary, null, 2));
  console.log(`\n💾 Saved ultimate GRI dictionary to: ${outputPath}`);

  // Show sample
  console.log('\n📋 Sample GRI codes:');
  griCodes.slice(0, 20).forEach(code => {
    console.log(`   ${code.code} - ${code.topic.substring(0, 60)}${code.topic.length > 60 ? '...' : ''}`);
  });
  if (griCodes.length > 20) {
    console.log(`   ... and ${griCodes.length - 20} more`);
  }

  console.log('\n✅ Ultimate GRI dictionary created!');
  console.log(`   Total codes: ${griCodes.length}`);
  console.log(`   Search keywords: ${searchKeywords.length}`);
  console.log(`   Categories: ${Object.keys(byCategory).length}`);
}

main();
