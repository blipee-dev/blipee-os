# Company Mapping & Data Collection Guide 🗺️

## Overview

This guide explains how to map companies for the Sector Intelligence system to automatically discover, track, and parse sustainability data from public sources.

**Key Point**: All sustainability reports are **public data** - companies publish them on their websites for transparency and compliance. We're automating what manual researchers already do.

---

## 📋 Company Mapping System

### What We Map

For each company, we track:

1. **Basic Info**: Name, website, stock ticker
2. **Classification**: Sector (GRI code), industry, size, country
3. **Sustainability Data**: Report URLs, reporting standards used
4. **Priority**: High/medium/low based on market influence

### Mapping Files

**1. `/src/lib/automation/sector-intelligence/company-targets.json`**

This is the master list of high-priority companies to track. Contains:
- 40 enterprise companies across 7 GRI sectors
- Direct links to sustainability report pages
- Company metadata (size, country, ticker)
- Discovery sources for finding more companies

**Structure**:
```json
{
  "sectors": {
    "GRI-14": {
      "name": "Manufacturing",
      "priority_companies": [
        {
          "name": "Tesla",
          "website": "https://www.tesla.com",
          "ticker": "TSLA",
          "sustainability_report_url": "https://www.tesla.com/impact-report",
          "country": "USA",
          "size": "enterprise",
          "priority": "high"
        }
      ],
      "discovery_sources": [
        "https://finance.yahoo.com/sector/industrials",
        "https://www.nam.org/"
      ]
    }
  }
}
```

---

## 🌱 Seeding Companies

### Quick Start

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"

# Run the seed script
npx tsx src/lib/automation/sector-intelligence/seed-companies.ts
```

**What it does**:
1. Reads `company-targets.json`
2. Inserts each company into `sector_companies` table
3. Skips duplicates
4. Reports success/failure for each company

**Expected Output**:
```
🌱 Seeding priority companies...

📂 Sector: Manufacturing (GRI-14)
   Companies: 8
   ✅ Seeded: Tesla
   ✅ Seeded: General Electric
   ✅ Seeded: Siemens
   ...

🎉 Seeding complete!
   ✅ Seeded: 40 companies
   ⏭️  Skipped: 0 companies
   📊 Total: 40 companies
```

### Programmatic Seeding

```typescript
import { seedPriorityCompanies, getCompaniesForSector } from '@/lib/automation/sector-intelligence/seed-companies';

// Seed all companies
await seedPriorityCompanies();

// Get companies for specific sector
const manufacturingCompanies = getCompaniesForSector('GRI-14');
console.log(manufacturingCompanies); // Array of 8 companies
```

---

## 🔍 Finding More Companies

### Sources for Company Discovery

**1. Stock Exchanges**
- NYSE, NASDAQ, LSE, etc.
- Filter by sector/industry
- All public companies with market cap > $1B

**2. Industry Associations**
- Each sector has associations (e.g., NAM for manufacturing)
- Member directories are public
- Often include sustainability commitments

**3. CDP (Carbon Disclosure Project)**
- https://www.cdp.net/en/companies/companies-scores
- 20,000+ companies disclose via CDP
- Free access to company scores and reports

**4. GRI Database**
- https://database.globalreporting.org/
- Searchable database of GRI reports
- Filter by sector, country, size

**5. SASB/TCFD Databases**
- Companies self-report on these frameworks
- Publicly searchable

**6. Company Registries**
- SEC EDGAR (USA): https://www.sec.gov/edgar
- Companies House (UK): https://www.gov.uk/government/organisations/companies-house
- Similar registries in EU, Canada, Australia

### Discovery Automation

The `CompanyDiscoveryScraper` automates discovery from these sources:

```typescript
import { CompanyDiscoveryScraper } from '@/lib/automation/sector-intelligence';

const scraper = new CompanyDiscoveryScraper('system', 'system', {
  sector: 'GRI-14', // Manufacturing
  region: 'North America',
  minCompanySize: 'medium',
});

const companies = await scraper.scrape();
// Returns 50-100 companies with basic info
```

---

## 📄 Sustainability Report Locations

### Common URL Patterns

Most companies publish sustainability reports at predictable URLs:

**Pattern 1: Dedicated Sustainability Page**
```
https://company.com/sustainability
https://company.com/esg
https://company.com/responsibility
https://company.com/impact
```

**Pattern 2: Investor Relations**
```
https://investors.company.com/sustainability
https://ir.company.com/esg
```

**Pattern 3: About/Corporate**
```
https://about.company.com/sustainability
https://corporate.company.com/sustainability
```

**Pattern 4: Direct Report Links**
```
https://company.com/sustainability-report-2024.pdf
https://company.com/reports/sustainability/2024
```

### Report Formats

- **PDF**: Most common (70%)
- **HTML**: Interactive reports (20%)
- **Integrated Annual Report**: Combined financial + sustainability (10%)

### Finding Reports

**Manual Method**:
1. Go to company website
2. Look for "Sustainability", "ESG", or "Impact" in navigation
3. Download latest report (usually PDF)

**Automated Method** (our system):
```typescript
import { SustainabilityReportParser } from '@/lib/automation/sector-intelligence';

const parser = new SustainabilityReportParser('system', 'system', {
  companyName: 'Tesla',
  reportUrl: 'https://www.tesla.com/ns_videos/2023-impact-report.pdf',
  sector: 'GRI-14',
  reportYear: 2023,
});

const data = await parser.scrape();
// Returns structured data: emissions, targets, metrics
```

---

## 🎯 Adding New Companies

### Method 1: Update company-targets.json

```json
{
  "GRI-14": {
    "priority_companies": [
      {
        "name": "New Company",
        "website": "https://newcompany.com",
        "ticker": "NEWC",
        "sustainability_report_url": "https://newcompany.com/sustainability",
        "country": "USA",
        "size": "large",
        "priority": "medium"
      }
    ]
  }
}
```

Then re-run seed script:
```bash
npx tsx src/lib/automation/sector-intelligence/seed-companies.ts
```

### Method 2: Direct Database Insert

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

await supabase.from('sector_companies').insert({
  company_name: 'New Company',
  website: 'https://newcompany.com',
  sector: 'GRI-14',
  industry: 'Manufacturing',
  company_size: 'large',
  country: 'USA',
  stock_ticker: 'NEWC',
  has_sustainability_report: true,
});
```

### Method 3: Use the Discovery System

```typescript
import { AutomationManager } from '@/lib/automation';

const automation = new AutomationManager('system', 'system');

// Discovers 50+ companies automatically
await automation.buildSectorBenchmark('GRI-14');
```

---

## 📊 Data Quality & Coverage

### Current Coverage

| Sector | Priority Companies | Est. Total in Sector |
|--------|-------------------|----------------------|
| GRI-11 (Oil & Gas) | 5 | 150+ |
| GRI-12 (Mining) | 5 | 100+ |
| GRI-13 (Agriculture) | 5 | 200+ |
| GRI-14 (Manufacturing) | 8 | 500+ |
| GRI-15 (Transportation) | 5 | 150+ |
| GRI-16 (Real Estate) | 5 | 300+ |
| GRI-17 (Financial Services) | 5 | 400+ |
| **Total** | **40** | **1,800+** |

### Quality Tiers

**Tier 1 (High Priority)**:
- Market cap > $10B
- Publish annual sustainability reports
- Use recognized standards (GRI, SASB, TCFD)
- External assurance

**Tier 2 (Medium Priority)**:
- Market cap $1B-$10B
- Publish reports bi-annually
- Some standardized reporting

**Tier 3 (Lower Priority)**:
- Market cap < $1B
- Ad-hoc sustainability disclosures
- May not have formal reports

---

## 🤖 Automation Workflow

### Full Pipeline

```
1. Seed Priority Companies
   ↓
2. Discovery System Finds More Companies (50-100 per sector)
   ↓
3. For Each Company:
   - Find sustainability report URL
   - Download report (PDF/HTML)
   - Parse with AI + OCR
   - Extract metrics
   - Store in database
   ↓
4. Benchmark Aggregator
   - Calculate sector statistics
   - Identify leaders/laggards
   - Generate insights
   ↓
5. Customer Access
   - Show company position
   - Provide recommendations
   - Enable competitive analysis
```

### Running the Full Pipeline

```typescript
import { AutomationManager } from '@/lib/automation';

const automation = new AutomationManager('system', 'system');

// Build complete sector benchmark
const result = await automation.buildSectorBenchmark('GRI-14');

console.log(`
  ✓ Discovered: ${result.companiesDiscovered} companies
  ✓ Parsed: ${result.reportsParsed} reports
  ✓ Benchmark created with ${result.benchmarkGenerated.companyCount} companies
`);

// Get a specific company's position
const position = await automation.getCompanyBenchmarkPosition('Tesla', 'GRI-14');

console.log(`
  Your Score: ${position.overallScore}/100
  Percentile: ${position.percentileRank}%
  Insights: ${position.insights.join(', ')}
`);
```

---

## 🔒 Legal & Ethical Considerations

### Is This Legal?

**Yes**. Here's why:

1. **Public Data**: Sustainability reports are published by companies for public consumption
2. **Terms of Service**: Most company websites allow automated access for research purposes
3. **No Authentication**: We don't bypass logins or paywalls
4. **No PII**: We collect corporate data, not personal information
5. **Respect robots.txt**: We honor website crawling policies
6. **Rate Limiting**: We don't overload servers (1 request per 2-3 seconds)

### Best Practices

1. **Attribution**: Credit source when presenting data
2. **Freshness**: Indicate when data was collected
3. **Accuracy**: Don't misrepresent what companies report
4. **Updates**: Refresh data annually when new reports published
5. **Opt-Out**: Allow companies to request removal if needed

### Precedents

Similar systems exist and are widely accepted:
- **CDP**: Aggregates corporate climate data
- **MSCI ESG Ratings**: Rates companies on sustainability
- **Bloomberg ESG**: Tracks corporate sustainability metrics
- **Sustainalytics**: Company ESG risk ratings
- **RepRisk**: Corporate risk monitoring

---

## 📈 Scaling the System

### Phase 1: Seed Priority Companies (40)
✅ Complete - Run seed script

### Phase 2: Build First Sector Benchmark (50-100)
- Choose high-value sector (Manufacturing recommended)
- Run discovery to find 100 companies
- Parse 50+ reports
- Create benchmark
- **Time**: 2-4 hours with Puppeteer, 30 min with enhanced MCPs

### Phase 3: Expand to All Sectors (500+)
- Run discovery for all 7 GRI sectors
- Parse 500+ reports
- Create 7 sector benchmarks
- **Time**: 1-2 days with automation

### Phase 4: Deep Coverage (1,800+)
- Add sub-sectors (e.g., "Electric Vehicle Manufacturing")
- Regional splits (e.g., "European Manufacturing")
- Historical data (multi-year trends)
- **Time**: Ongoing, monthly updates

### Phase 5: Global Coverage (10,000+)
- Add private companies
- Include SMEs
- International markets
- **Goal**: "The Bloomberg Terminal of Sustainability"

---

## 🛠️ Tools & Scripts

### Available Scripts

**1. Seed Companies**
```bash
npx tsx src/lib/automation/sector-intelligence/seed-companies.ts
```

**2. Discover Companies** (to build)
```bash
npx tsx scripts/discover-companies.ts --sector GRI-14
```

**3. Parse Reports** (to build)
```bash
npx tsx scripts/parse-reports.ts --sector GRI-14 --limit 10
```

**4. Build Benchmark** (to build)
```bash
npx tsx scripts/build-benchmark.ts --sector GRI-14
```

### Database Queries

**Check seeded companies**:
```sql
SELECT sector, COUNT(*) as company_count
FROM sector_companies
GROUP BY sector
ORDER BY sector;
```

**Find companies with reports**:
```sql
SELECT company_name, sector, has_sustainability_report
FROM sector_companies
WHERE has_sustainability_report = true
ORDER BY sector, company_name;
```

**Get benchmark summary**:
```sql
SELECT * FROM sector_benchmark_overview
WHERE report_year = 2024;
```

---

## 🎯 Next Steps

1. **✅ Run seed script** to load 40 priority companies
2. **📊 Build first benchmark** for Manufacturing sector
3. **🔍 Validate data quality** (target: >85% accuracy)
4. **🚀 Expand to all sectors** (500+ companies)
5. **💰 Launch premium features** (benchmarking subscriptions)

---

## 📚 Additional Resources

- **Company Targets**: `/src/lib/automation/sector-intelligence/company-targets.json`
- **Seed Script**: `/src/lib/automation/sector-intelligence/seed-companies.ts`
- **Full Implementation**: `/docs/SECTOR_INTELLIGENCE_GUIDE.md`
- **MCP Enhancement**: `/docs/MCP_ENHANCED_SECTOR_INTELLIGENCE.md`
- **Quick Start**: `/docs/QUICK_START_SECTOR_INTELLIGENCE.md`

---

**Built with automation, powered by public data, designed for market domination** 🌟

**Ready to build the world's largest sustainability database? Start with:**

```bash
npx tsx src/lib/automation/sector-intelligence/seed-companies.ts
```
