# Global Energy & Climate Reporting Standards: Comprehensive Guide

## Executive Summary

This document outlines the requirements from multiple global sustainability reporting frameworks for energy consumption and climate-related disclosures, and compares them against blipee OS's current implementation.

### Frameworks Covered:
1. **GHG Protocol Scope 2** - Global standard for corporate GHG accounting
2. **GRI 302: Energy Standard (2016)** - Global sustainability reporting
3. **CSRD/ESRS E1 (EU)** - European Corporate Sustainability Reporting Directive
4. **TCFD** - Task Force on Climate-related Financial Disclosures
5. **ISSB IFRS S2 (2024)** - International climate disclosure standard

---

## GHG Protocol - Scope 2 (Indirect Energy Emissions)

### Coverage
Scope 2 accounts for GHG emissions from the consumption of purchased:
- Electricity
- Steam
- Heat
- Cooling

### Dual Reporting Requirement (MANDATORY)

Organizations **must report BOTH** methods:

#### 1. Location-Based Method
- Uses average emission intensity of the electricity grid
- Based on geographic location where consumption occurs
- Required baseline method for all organizations

#### 2. Market-Based Method
- Reflects contractual choices (renewable energy purchases, PPAs, RECs)
- Uses supplier-specific or product-specific emission factors
- Shows impact of organizational energy procurement decisions

### Key Reporting Metrics
- Total energy consumption (MWh or GJ)
- CO2e emissions from purchased energy (both methods)
- Renewable energy percentage
- Emission factors used (source and methodology)
- Contractual instruments (RECs, GOs, PPAs)

---

## GRI 302: Energy Standard (2016)

### Disclosure 302-1: Energy Consumption Within the Organization

**REQUIRED DATA POINTS:**

1. **Total fuel consumption from non-renewable sources** (in joules or multiples)
   - By fuel type (e.g., diesel, natural gas, coal)

2. **Total fuel consumption from renewable sources** (in joules or multiples)
   - By fuel type (e.g., biogas, biodiesel, renewable electricity)

3. **Purchased energy consumption:**
   - Electricity (kWh or MWh)
   - Heating (GJ)
   - Cooling (GJ)
   - Steam (GJ)

4. **Self-generated energy:**
   - Electricity
   - Heating
   - Cooling
   - Steam

5. **Total energy consumption** (sum of all above)

6. **Energy sold** (if applicable)

7. **Standards, methodologies, and conversion factors used**

### Disclosure 302-2: Energy Consumption Outside the Organization

- Energy consumed in upstream activities (e.g., raw material transport)
- Energy consumed in downstream activities (e.g., product distribution)
- **Must exclude** energy already reported in 302-1

### Disclosure 302-3: Energy Intensity ⭐

**This is the most relevant disclosure for dashboard intensity metrics**

**REQUIRED REPORTING:**
- **Energy intensity ratio** = Total Energy Consumption / Organization-Specific Metric
- **The denominator** (organization-specific metric) examples:
  - Number of employees (FTE)
  - Square meters of floor space (m²)
  - Units of production
  - Revenue ($M)
  - Customers served
  - Facilities operated

- **Types of energy included** in the numerator:
  - Fuel only
  - Electricity only
  - Heating, cooling, steam only
  - **All energy types** (recommended)

- **Scope**: Whether ratio uses energy consumed:
  - Within the organization only (302-1)
  - Outside the organization (302-2)
  - Both

**Industry Benchmarks for Office/Legal Services:**
- Office buildings: 100-200 kWh/m²/year
- Legal services: 150-250 kWh/m²/year
- Per employee (office): 2,000-5,000 kWh/FTE/year

### Disclosure 302-4: Reduction of Energy Consumption

**REQUIRED REPORTING:**
- Reductions in energy consumption achieved (kWh, GJ, or %)
- Types of energy reduced (fuel, electricity, heating, cooling, steam, all)
- Basis for calculation:
  - Baseline year
  - Baseline methodology
- Standards/methodologies/assumptions used

### Disclosure 302-5: Reductions in Energy Requirements of Products and Services

- Energy efficiency improvements in products/services
- Reductions in energy requirements achieved during reporting period
- Basis for calculating reductions (base year, baseline)

---

## CSRD/ESRS E1: EU Corporate Sustainability Reporting Directive (2024+)

### Overview
The **Corporate Sustainability Reporting Directive (CSRD)** is the EU's comprehensive sustainability reporting framework that came into effect for large companies starting in 2024. Companies must report according to **European Sustainability Reporting Standards (ESRS)**.

### Applicability & Timeline
- **2024 (FY 2024, reports in 2025):** Large EU companies already subject to NFRD
- **2025 (FY 2025, reports in 2026):** All large EU companies (>250 employees OR >€50M revenue OR >€25M balance sheet)
- **2026 (FY 2026, reports in 2027):** Listed SMEs
- **2028 (FY 2028, reports in 2029):** Non-EU companies with significant EU operations (>€150M EU revenue)

### ESRS E1: Climate Change - Energy Requirements

**ESRS E1-5: Energy Consumption and Mix**

This is the primary disclosure for energy consumption under CSRD.

#### Required Data Points (93% Mandatory):

1. **Total Energy Consumption (MWh)**
   - Energy consumed from processes owned or controlled by the undertaking
   - Same perimeter as GHG Scopes 1 and 2
   - Reported in Mega-Watt-hours (MWh) using Lower Heating Value (LHV) or net calorific value

2. **Energy Mix Breakdown (Mandatory):**
   - **Fossil fuel consumption** (coal, oil, natural gas) - MWh
   - **Nuclear energy consumption** - MWh
   - **Renewable energy consumption** - MWh
     - Solar
     - Wind
     - Hydroelectric
     - Biomass
     - Geothermal
     - Other renewables

3. **Energy from Own Generation vs Purchased:**
   - Self-generated energy (by source)
   - Purchased/acquired energy (by source)

4. **Energy Intensity for High Climate Impact Sectors:**
   ```
   Energy Intensity = Total Energy Consumption (MWh) / Net Revenue (€M)
   ```
   - Required for companies in high climate impact sectors
   - Disclosed per sector if operating in multiple

5. **Granular Disclosures (Encouraged):**
   - Energy consumption by facility or region
   - Split between operational and non-operational energy
   - Energy consumption by business unit

6. **Energy Efficiency Initiatives:**
   - Description of initiatives to increase energy efficiency
   - Investments in renewable energy sources
   - Energy savings achieved

#### Total ESRS E1 Disclosure Burden:
- **208 total data points** across all E1 disclosures
- 93% mandatory, 7% voluntary
- **57% quantitative** (numerical data like percentages)
- **30% semi-narrative** (dates, classifications)
- **13% narrative** (text blocks)

### ESRS E1-6: Gross GHG Emissions (Related to Energy)

Must report GHG emissions from energy consumption:
- **Scope 1:** Direct emissions from owned/controlled sources
- **Scope 2:** Indirect emissions from purchased energy (location-based AND market-based)
- **Scope 3:** Value chain emissions (15 categories)

### Key Differences from GRI 302:

| Aspect | GRI 302 | ESRS E1 |
|--------|---------|---------|
| **Geographic Scope** | Global voluntary | EU mandatory |
| **Unit Preference** | Joules (GJ) preferred | MWh required |
| **Renewable Breakdown** | Yes, by type | Yes, by type + fossil/nuclear split |
| **Assurance** | Optional | Mandatory (limited → reasonable over time) |
| **Value Chain** | 302-2 covers outside org | Scope 3 detailed in E1-6 |
| **Granularity** | Flexible | 208 data points, highly prescriptive |
| **Digitalization** | Not required | XBRL/digital tagging required |

### Double Materiality Assessment

Unlike GRI which uses single materiality (impact on world), CSRD requires **double materiality:**
1. **Impact materiality:** How the company affects climate/energy
2. **Financial materiality:** How climate/energy affects the company's financial performance

Energy must be assessed through both lenses.

---

## TCFD: Task Force on Climate-related Financial Disclosures

### Overview
Established in 2015 by the Financial Stability Board, TCFD created a framework for climate-related financial risk disclosures. **Note:** TCFD disbanded in October 2023, with IFRS Foundation (ISSB) taking over monitoring.

### Four Pillars Framework

#### 1. **Governance**
- Board oversight of climate-related risks and opportunities
- Management's role in assessing and managing climate-related issues

#### 2. **Strategy**
- Climate-related risks and opportunities identified (short, medium, long-term)
- Impact on business, strategy, and financial planning
- Resilience of strategy under different climate scenarios (including 2°C scenario)

#### 3. **Risk Management**
- Processes for identifying and assessing climate-related risks
- Processes for managing climate-related risks
- Integration into overall risk management

#### 4. **Metrics and Targets**

##### Energy-Related Metrics:

**Cross-Industry Metrics (All Companies):**
- **Scope 1, 2, and 3 GHG emissions**
- Energy consumption (total and by source)
- Proportion of renewable energy
- Energy intensity ratios

**Industry-Specific Metrics:**

For **Energy Sector:**
- Total energy consumption
- Percentage renewable energy
- Energy intensity (per unit of production)
- R&D investments in low-carbon technologies

For **Real Estate (relevant for office buildings):**
- Energy consumption by property type
- Energy intensity (kWh/sq ft or kWh/m²)
- Percentage of buildings with energy ratings
- Green building certifications (LEED, BREEAM, etc.)

##### Targets:
- GHG emission reduction targets
- Renewable energy targets
- Energy efficiency improvement targets
- Alignment with Paris Agreement / Science-Based Targets (SBTi)

### TCFD Adoption
- As of 2020, **40% disclosure rate** for energy companies
- Over 4,000 organizations globally support TCFD
- Incorporated into IFRS S2 (successor standard)

---

## ISSB IFRS S2: Climate-related Disclosures (2024+)

### Overview
The **International Sustainability Standards Board (ISSB)** issued **IFRS S2 Climate-related Disclosures** in June 2023, effective for annual reporting periods beginning on or after **January 1, 2024**.

### Key Features
- **Builds on TCFD:** Fully incorporates TCFD recommendations
- **Companion to IFRS S1:** General sustainability disclosure requirements
- **Global baseline:** Designed for worldwide application
- **Investor-focused:** Tailored for capital markets and financial decision-making

### Four Core Elements (Aligned with TCFD)

#### 1. **Governance**
Disclose governance processes, controls, and procedures for climate-related risks and opportunities.

#### 2. **Strategy**
- Climate-related risks and opportunities that could affect prospects
- Current and anticipated effects on business model, value chain, strategy, and financial planning
- Climate resilience analysis (scenario analysis)

#### 3. **Risk Management**
- Processes to identify, assess, prioritize, and monitor climate-related risks and opportunities
- Integration with overall risk management

#### 4. **Metrics and Targets**

##### Energy & GHG Metrics:

**Mandatory:**
- **Scope 1 GHG emissions** (absolute gross)
- **Scope 2 GHG emissions** (absolute gross, location-based AND market-based)
- **Scope 3 GHG emissions** (if material) - *Relief: not required in Year 1*

**Industry-Specific Metrics:**
Companies must consider the SASB Standards for their industry:
- Energy consumption data
- Energy intensity
- Renewable energy percentage
- Energy-related capital expenditure

##### Targets:
- GHG emission targets (quantitative)
- Renewable energy targets
- Energy efficiency targets
- Information about how targets are set, monitored, and revised

### Transition Relief (Year 1)
Companies are **not required** to disclose in their first year:
- Scope 3 emissions
- Comparative information for prior periods

This acknowledges the complexity of value chain data collection.

### Key Differences from Other Standards:

| Aspect | IFRS S2 | CSRD/ESRS E1 | GRI 302 |
|--------|---------|--------------|---------|
| **Geographic Scope** | Global | EU | Global |
| **Mandatory** | Varies by jurisdiction | EU mandatory | Voluntary |
| **Primary Audience** | Investors | Stakeholders (double materiality) | Multi-stakeholder |
| **Scope 3 Year 1** | Optional | Required if material | Required (302-2) |
| **Assurance** | Emerging requirement | Mandatory (EU) | Optional |
| **Scenario Analysis** | Required | Required | Not required |
| **Industry Guidance** | SASB Standards | Sector-specific ESRS (coming) | Topic-specific |

### SASB Energy Metrics by Industry

For **Professional Services (Legal Firms like PLMJ):**
- Total energy consumed (GJ)
- Percentage renewable
- Discussion of energy management policies

For **Real Estate (Office Buildings):**
- Energy consumption data coverage (% of portfolio)
- Energy intensity (kWh/sq ft or kWh/m²)
- Percentage of properties with energy ratings
- Description of energy management approach

---

## Standards Comparison Matrix

### Energy Consumption Reporting

| Requirement | GHG Protocol | GRI 302 | ESRS E1 | TCFD | IFRS S2 |
|-------------|--------------|---------|---------|------|---------|
| **Total Energy** | ✓ (for Scope 2) | ✓ (GJ/MWh) | ✓ (MWh) | ✓ | ✓ |
| **Renewable Split** | Indirect | ✓ Required | ✓ Detailed | ✓ | ✓ |
| **Energy Types** | Electricity focus | Electricity, heat, steam, cooling | Fossil, nuclear, renewable | Industry-specific | SASB-aligned |
| **Energy Intensity** | Not specified | ✓ (302-3) | ✓ (MWh/€M) | ✓ | ✓ (SASB) |
| **Scope 3 Energy** | No | ✓ (302-2) | ✓ (E1-6) | ✓ | ✓ (if material) |
| **Dual Reporting** | ✓ (Scope 2) | No | No | No | ✓ (Scope 2) |
| **Assurance** | Optional | Optional | Mandatory (EU) | Emerging | Emerging |

### GHG Emissions Reporting (Scope 2)

| Requirement | GHG Protocol | GRI 305 | ESRS E1 | TCFD | IFRS S2 |
|-------------|--------------|---------|---------|------|---------|
| **Scope 1** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Scope 2 Location** | ✓ Required | ✓ | ✓ | ✓ | ✓ Required |
| **Scope 2 Market** | ✓ Required | ✓ | ✓ | ✓ | ✓ Required |
| **Scope 3** | ✓ (15 categories) | ✓ | ✓ (detailed) | ✓ | ✓ (Year 2+) |

### Target Audience

| Standard | Primary Audience | Materiality Approach |
|----------|------------------|---------------------|
| **GHG Protocol** | Companies, governments | Operational control |
| **GRI 302/305** | Multi-stakeholder | Impact materiality |
| **ESRS E1** | EU stakeholders, investors | Double materiality |
| **TCFD** | Investors, lenders | Financial materiality |
| **IFRS S2** | Investors, capital markets | Financial materiality |

---

## Current Implementation Status

### ✅ CURRENTLY IMPLEMENTED

1. **Total energy consumption tracking**
   - ✅ Aggregates from metrics_data table
   - ✅ Filters by time period
   - ✅ Filters by site

2. **GRI 302-3: Energy Intensity Metrics**
   - ✅ Per Employee: 9,439.8 kWh/FTE
   - ✅ Per Square Meter: 446.9 kWh/m²
   - ✅ Per Revenue: 82.3 MWh/$M
   - ✅ Per Production: 0 kWh/unit (placeholder)

3. **Scope 2 Emissions Tracking**
   - ✅ Total CO2e emissions calculated
   - ✅ Converted from kgCO2e to tCO2e (GRI 305 compliance)

4. **Site-Level Breakdown**
   - ✅ Organization-wide view
   - ✅ Individual site filtering
   - ✅ 3 sites tracked (Lisboa, Porto, Faro)

5. **Dashboard Features**
   - ✅ Consumption view
   - ✅ Emissions view
   - ✅ Cost view
   - ✅ Intensity view

---

## 🔶 GAPS & MISSING REQUIREMENTS

### Priority 1: Compliance Requirements

#### 1. **Renewable vs Non-Renewable Breakdown** (GRI 302-1)
**Current State:** Shows single "renewable percentage" (e.g., 23%)
**Required:**
- Separate renewable fuel consumption by type
- Separate non-renewable fuel consumption by type
- Clear categorization in metrics_catalog

**Implementation Needed:**
```javascript
// Add to metrics_catalog
{
  category: "Energy - Renewable",
  subcategory: "Solar",
  subcategory: "Wind",
  subcategory: "Hydroelectric"
}
{
  category: "Energy - Non-Renewable",
  subcategory: "Natural Gas",
  subcategory: "Diesel",
  subcategory: "Coal"
}
```

#### 2. **Energy Type Breakdown** (GRI 302-1)
**Current State:** Only "Purchased Energy" and "Electricity" categories
**Required:**
- Electricity (separate line)
- Heating (GJ)
- Cooling (GJ)
- Steam (GJ)

**Implementation Needed:**
- Add metrics for heating, cooling, steam
- Display each energy type separately in dashboard
- Calculate totals for each type

#### 3. **Dual Reporting for Scope 2** (GHG Protocol)
**Current State:** Single emission value
**Required:**
- Location-based emissions (grid average)
- Market-based emissions (contractual instruments)
- Both values displayed side-by-side

**Implementation Needed:**
```javascript
// Add to metrics_data
{
  emissions_location_based: 1234.5, // tCO2e
  emissions_market_based: 890.2,     // tCO2e
  emission_factor_location: 0.45,    // kgCO2e/kWh
  emission_factor_market: 0.32,      // kgCO2e/kWh
  grid_region: "ERCOT",
  contractual_instruments: ["RECs", "PPA"]
}
```

### Priority 2: Enhanced Reporting

#### 4. **Year-over-Year Trend Analysis** (GRI 302-4)
**Current State:** Shows current period only
**Required:**
- Baseline year comparison
- Year-over-year % change
- Historical trend line

#### 5. **Energy Reduction Tracking** (GRI 302-4)
**Current State:** Not tracked
**Required:**
- Energy saved (kWh, GJ)
- Reduction initiatives log
- Methodology documentation

#### 6. **Methodology Documentation**
**Current State:** Not documented in UI
**Required:**
- Conversion factors source (e.g., IEA, EPA, supplier-specific)
- Calculation methodology
- Standards/frameworks used (GHG Protocol, GRI 302)
- Data quality notes

### Priority 3: Nice to Have

#### 7. **Multiple Unit Options**
**Current State:** kWh only
**GRI Preference:** Joules (GJ) or multiples
**Implementation:** Toggle between kWh, MWh, GJ

Conversion: `1 kWh = 0.0036 GJ = 3.6 MJ`

#### 8. **Scope 3 Energy** (GRI 302-2)
- Upstream transportation
- Employee commuting
- Business travel
- Downstream distribution

#### 9. **Energy Source Mix Visualization**
- Pie chart of renewable vs non-renewable
- Stacked bar chart by energy type
- Sankey diagram showing energy flow

---

## Recommended Implementation Roadmap

### Phase 1: Core Compliance (Weeks 1-2)
1. Add renewable/non-renewable categorization to metrics_catalog
2. Implement dual reporting (location-based + market-based)
3. Add energy type breakdown (electricity, heat, steam, cooling)
4. Update Energy Dashboard UI to display new breakdowns

### Phase 2: Enhanced Analytics (Weeks 3-4)
5. Add year-over-year comparison functionality
6. Implement baseline year tracking
7. Create energy reduction initiatives tracker
8. Add methodology documentation panel

### Phase 3: Advanced Features (Weeks 5-6)
9. Add unit conversion (kWh ↔ GJ)
10. Implement Scope 3 energy tracking
11. Create advanced visualizations (pie charts, sankey diagrams)
12. Add export functionality for GRI/GHG Protocol reports

---

## Data Model Updates Required

### metrics_catalog table additions:
```sql
-- Add new columns
ALTER TABLE metrics_catalog ADD COLUMN energy_type VARCHAR(50);
-- 'electricity', 'heating', 'cooling', 'steam', 'fuel'

ALTER TABLE metrics_catalog ADD COLUMN fuel_type VARCHAR(50);
-- 'renewable', 'non-renewable'

ALTER TABLE metrics_catalog ADD COLUMN fuel_source VARCHAR(100);
-- 'solar', 'wind', 'natural_gas', 'diesel', etc.
```

### metrics_data table additions:
```sql
-- Add dual reporting columns
ALTER TABLE metrics_data ADD COLUMN emissions_location_based DECIMAL(15,3);
ALTER TABLE metrics_data ADD COLUMN emissions_market_based DECIMAL(15,3);
ALTER TABLE metrics_data ADD COLUMN emission_factor_location DECIMAL(10,6);
ALTER TABLE metrics_data ADD COLUMN emission_factor_market DECIMAL(10,6);
ALTER TABLE metrics_data ADD COLUMN grid_region VARCHAR(100);
ALTER TABLE metrics_data ADD COLUMN contractual_instruments JSONB;

-- Add methodology documentation
ALTER TABLE metrics_data ADD COLUMN conversion_factor_source VARCHAR(255);
ALTER TABLE metrics_data ADD COLUMN calculation_methodology TEXT;
```

---

## References

### GHG Protocol
- [GHG Protocol Scope 2 Guidance](https://ghgprotocol.org/scope-2-guidance)
- [Corporate Value Chain (Scope 3) Standard](https://ghgprotocol.org/standards/scope-3-standard)
- [GHG Protocol Corporate Standard](https://ghgprotocol.org/corporate-standard)

### GRI Standards
- [GRI 302: Energy 2016](https://www.globalreporting.org/publications/documents/english/gri-302-energy-2016/)
- [GRI 305: Emissions 2016](https://www.globalreporting.org/publications/documents/english/gri-305-emissions-2016/)
- [GRI Universal Standards 2021](https://www.globalreporting.org/standards/standards-development/universal-standards/)

### CSRD/ESRS (EU)
- [European Commission: Corporate Sustainability Reporting](https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en)
- [EFRAG: ESRS E1 Climate Change](https://www.efrag.org/lab6)
- [European Sustainability Reporting Standards (Full Set)](https://www.efrag.org/lab6)

### TCFD
- [TCFD Recommendations (Final Report 2017)](https://www.fsb-tcfd.org/recommendations/)
- [TCFD Implementation Guidance](https://www.fsb-tcfd.org/publications/)
- [TCFD Knowledge Hub](https://www.tcfdhub.org/)

### ISSB/IFRS
- [IFRS S2 Climate-related Disclosures](https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/ifrs-s2-climate-related-disclosures/)
- [IFRS S1 General Requirements for Disclosure of Sustainability-related Financial Information](https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/ifrs-s1-general-requirements/)
- [SASB Standards (Industry-Specific Metrics)](https://sasb.org/standards/)

### Additional Resources
- [Science Based Targets initiative (SBTi)](https://sciencebasedtargets.org/)
- [CDP Climate Change Questionnaire](https://www.cdp.net/en/climate)
- [ISO 14064: GHG Accounting and Verification](https://www.iso.org/standard/66453.html)

---

**Document Version:** 2.0
**Last Updated:** 2025-01-05
**Maintained By:** blipee OS Sustainability Team
**Change Log:**
- v2.0 (2025-01-05): Added CSRD/ESRS E1, TCFD, and ISSB IFRS S2 standards
- v1.0 (2025-01-05): Initial version with GHG Protocol and GRI 302
