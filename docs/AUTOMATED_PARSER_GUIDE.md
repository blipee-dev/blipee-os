## Automated Sustainability Report Parser Guide

This guide explains how to use the automated parser to scale report parsing from 8 companies to 50+, 500+, or even 10,000+ companies.

---

## 📋 Overview

The automated parser handles the entire report parsing pipeline:

1. **Discovery**: Find companies in a sector (using Exa MCP)
2. **URL Finding**: Locate sustainability report URLs (web search/scraping)
3. **Fetching**: Download PDF/HTML content (using Firecrawl MCP)
4. **Extraction**: Parse structured data with AI (GPT-4/DeepSeek)
5. **Storage**: Save to `sector_company_reports` table
6. **Validation**: Quality checks and human review queue

---

## 🚀 Quick Start

### Basic Usage

```bash
# Parse all companies in Manufacturing sector
npx tsx scripts/automated-report-parser.ts --sector=GRI-14

# Parse specific company
npx tsx scripts/automated-report-parser.ts --company="Tesla"

# Parse all seeded companies
npx tsx scripts/automated-report-parser.ts --all
```

### Current Status

✅ **Working**: Manual parsing with sample data
⏳ **Next**: Wire up Firecrawl + AI MCPs for full automation

---

## 🏗️ Architecture

### Step 1: Find Report URL

**Option A: Use Exa MCP (Recommended)**
```typescript
const results = await exaMCP.search({
  query: `${companyName} sustainability report 2023`,
  type: 'neural', // Semantic search
  numResults: 5
});

// Filter for official company reports
const reportUrl = results.find(r => r.url.includes(companyWebsite));
```

**Option B: Common Patterns**
```typescript
const patterns = [
  `${website}/sustainability/report`,
  `${website}/esg`,
  `${website}/impact-report`,
  `${website}/corporate-responsibility`
];
```

### Step 2: Fetch Report Content

**Using Firecrawl MCP**:
```typescript
const content = await firecrawlMCP.scrape({
  url: reportUrl,
  formats: ['markdown', 'html'],
  onlyMainContent: true
});
```

**Handles**:
- PDF extraction (OCR if needed)
- HTML cleaning
- Table extraction
- Image/chart recognition

### Step 3: Extract Data with AI

**We capture 60+ sustainability metrics** across 9 categories. See `/docs/SUSTAINABILITY_METRICS_GUIDE.md` for complete list.

**Prompt Template** (abbreviated - see full template in metrics guide):
```typescript
const prompt = `
Extract sustainability metrics from this report in JSON format:

Company: ${companyName}
Report text: ${reportContent}

Return JSON with these fields (use null if not found):

EMISSIONS (tons CO2e):
- scope1_emissions, scope2_emissions, scope3_emissions, total_emissions
- carbon_neutral_target (year), net_zero_target (year)
- ghg_intensity (tons/$M revenue)

ENERGY:
- total_energy_consumption (MWh)
- renewable_energy_percent (0-100)
- energy_intensity (MWh/$M revenue)

WATER (megaliters):
- water_withdrawal, water_discharge, water_recycled
- water_intensity (ML/$M revenue)

WASTE (metric tons):
- waste_generated, waste_recycled, waste_recycling_rate (%)

HEALTH & SAFETY:
- total_recordable_incident_rate (per 100 employees)
- fatalities, lost_time_injury_rate

SOCIAL:
- employee_count, women_in_leadership (%)
- training_hours_per_employee, employee_turnover_rate (%)

SUPPLY CHAIN:
- supplier_esg_assessments, sustainable_sourcing_percent (%)

CIRCULAR ECONOMY:
- product_recycling_rate (%), product_takeback_programs (boolean)

GOVERNANCE:
- board_independence (%), esg_linked_compensation (boolean)
- externally_assured (boolean), reporting_standards (array)

FINANCIAL:
- annual_revenue (millions), revenue_currency

Return valid JSON only.
`;

const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }],
  response_format: { type: "json_object" }
});

const data = JSON.parse(response.choices[0].message.content);
```

### Step 4: Store in Database

```typescript
await supabase.from('sector_company_reports').insert({
  company_id: company.id,
  company_name: company.company_name,
  sector: company.sector,
  report_year: 2023,
  report_url: reportUrl,
  report_type: 'sustainability',
  ...extractedData,
  raw_text: reportContent.substring(0, 50000)
});
```

---

## 🔧 Integration Guides

### Firecrawl MCP Integration

**1. Check Firecrawl is connected**:
```bash
claude mcp list | grep firecrawl
# Should show: ✓ Connected
```

**2. Use in TypeScript**:
```typescript
// The MCP tool is available as mcp__firecrawl__scrape
// Example call (when running via Claude Code):
const content = await callMCP('mcp__firecrawl__scrape', {
  url: 'https://www.tesla.com/ns_videos/2023-impact-report.pdf',
  formats: ['markdown']
});
```

**3. Handle PDFs**:
- Firecrawl automatically extracts text from PDFs
- Returns clean markdown
- Preserves table structure
- Handles multi-column layouts

### Exa MCP Integration

**1. Check Exa is connected**:
```bash
claude mcp list | grep exa
# Should show: ✓ Connected
```

**2. Search for reports**:
```typescript
const results = await callMCP('mcp__exa__search', {
  query: 'Tesla sustainability report 2023',
  type: 'neural',
  numResults: 10,
  category: 'company'
});
```

**3. Filter results**:
```typescript
// Look for official company URLs
const officialReports = results.filter(r =>
  r.url.includes('tesla.com') &&
  (r.url.includes('sustainability') || r.url.includes('impact'))
);
```

### AI Model Integration

**Option A: OpenAI GPT-4**
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const response = await openai.chat.completions.create({
  model: "gpt-4-turbo-preview",
  messages: [{ role: "user", content: prompt }],
  response_format: { type: "json_object" },
  temperature: 0.1 // Low temperature for accuracy
});
```

**Option B: DeepSeek (Cheaper)**
```typescript
import { DeepSeekAPI } from '@/lib/ai/providers/deepseek';

const deepseek = new DeepSeekAPI(process.env.DEEPSEEK_API_KEY);

const response = await deepseek.chat({
  model: "deepseek-chat",
  messages: [{ role: "user", content: prompt }],
  response_format: { type: "json_object" }
});
```

---

## 📊 Scaling Strategy

### Phase 1: Validate with 8 Companies (✅ DONE)
- Manual data entry for 8 Manufacturing companies
- Verify database schema works
- Test benchmark generation logic

### Phase 2: Semi-Automated (10-20 companies)
- Use Firecrawl to fetch reports
- Manual review of AI extractions
- Build confidence in accuracy

### Phase 3: Fully Automated (50-100 companies)
- End-to-end automation
- 90%+ accuracy target
- Human review for edge cases only

### Phase 4: Mass Scale (500+ companies)
- Batch processing overnight
- Multiple sectors in parallel
- Quality monitoring dashboard

---

## 🎯 Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| **Accuracy** | 85%+ | TBD (manual baseline) |
| **Speed** | 2-3 min/company | Manual (15-30 min) |
| **Coverage** | 90% reports found | 100% (manual URLs) |
| **Cost** | <$0.50/report | $0 (manual) |

---

## 🔍 Quality Assurance

### Validation Rules

**1. Emissions Data**:
```typescript
// Total should roughly equal sum of scopes
if (data.total_emissions) {
  const scopeSum = (data.scope1 || 0) + (data.scope2 || 0) + (data.scope3 || 0);
  if (Math.abs(scopeSum - data.total_emissions) / data.total_emissions > 0.1) {
    warnings.push('Total emissions mismatch with scope sum');
  }
}
```

**2. Target Years**:
```typescript
// Targets should be in the future
if (data.net_zero_target && data.net_zero_target < 2024) {
  errors.push('Net zero target is in the past');
}
```

**3. Percentages**:
```typescript
// Should be 0-100
if (data.renewable_energy_percent > 100 || data.renewable_energy_percent < 0) {
  errors.push('Invalid percentage value');
}
```

### Human Review Queue

**Trigger review when**:
- AI confidence < 80%
- Data validation fails
- Missing key fields (emissions, targets)
- Unusual values (emissions 10x industry average)

```typescript
if (confidence < 0.8 || validationErrors.length > 0) {
  await createReviewTask({
    company_name: company.company_name,
    report_url: reportUrl,
    extracted_data: data,
    issues: validationErrors,
    confidence: confidence
  });
}
```

---

## 💰 Cost Analysis

### Per Company Cost Breakdown

**Firecrawl** (PDF scraping):
- $0.10 per PDF (up to 50 pages)
- $0.20 for larger reports (50-200 pages)

**AI Extraction** (GPT-4):
- Input: 10,000 tokens @ $0.01/1K = $0.10
- Output: 500 tokens @ $0.03/1K = $0.015
- Total: ~$0.12 per report

**Total**: $0.22-$0.32 per company

**Scaling**:
- 50 companies: $11-16
- 500 companies: $110-160
- 1,000 companies: $220-320

**ROI**: Manual parsing takes 15-30 min per company. At $100/hr developer rate:
- Manual cost: $25-50 per company
- Automated cost: $0.22-0.32 per company
- **Savings**: 99%+ ($24.70-49.70 per company)

---

## 🚧 Error Handling

### Common Issues & Solutions

**Issue**: PDF extraction fails
**Solution**: Retry with OCR enabled, or use PaddleOCR MCP

**Issue**: AI extracts wrong units (tons vs megatons)
**Solution**: Add unit validation and conversion logic

**Issue**: Report URL not found
**Solution**: Fall back to manual URL database, or skip company

**Issue**: Rate limiting
**Solution**: Add delays between requests (3-5 seconds)

---

## 📈 Next Steps

### Immediate (This Week)
1. ✅ Wire up Firecrawl MCP to fetch one Tesla report
2. ✅ Test AI extraction with real PDF content
3. ✅ Validate accuracy against manual baseline
4. ✅ Process 2-3 more companies end-to-end

### Near Term (Next 2 Weeks)
1. Process all 8 Manufacturing companies automatically
2. Build quality dashboard to monitor accuracy
3. Expand to 20-30 Manufacturing companies
4. Start Oil & Gas sector (GRI-11)

### Long Term (Next Month)
1. Process all 7 GRI sectors (500+ companies)
2. Build real-time monitoring for new reports
3. Add historical data (2020-2023 reports)
4. Enable API access for external users

---

## 📚 Additional Resources

- **Firecrawl Docs**: https://docs.firecrawl.dev/
- **Exa Search API**: https://docs.exa.ai/
- **OpenAI Structured Outputs**: https://platform.openai.com/docs/guides/structured-outputs
- **Sector Intelligence Guide**: `/docs/SECTOR_INTELLIGENCE_GUIDE.md`
- **MCP Enhancement Guide**: `/docs/MCP_ENHANCED_SECTOR_INTELLIGENCE.md`

---

**Built with AI, powered by public data, designed for scale** 🚀
