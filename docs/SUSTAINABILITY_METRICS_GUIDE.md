# Comprehensive Sustainability Metrics Guide

**Purpose**: This document defines all sustainability metrics captured by blipee OS for sector intelligence and benchmarking.

**Standards Alignment**: Metrics align with GRI, SASB, TCFD, CDP, and UN SDGs.

---

## 📊 Metrics Overview

**Total Metrics Tracked**: 60+ data points across 9 categories

### Categories
1. **Emissions (11 metrics)** - GHG emissions and carbon targets
2. **Energy (5 metrics)** - Consumption, intensity, renewable sources
3. **Water (5 metrics)** - Withdrawal, discharge, recycling, intensity
4. **Waste (3 metrics)** - Generation, recycling, circularity
5. **Health & Safety (4 metrics)** - Incidents, fatalities, near misses
6. **Social (7 metrics)** - Workforce, diversity, training, wages
7. **Supply Chain (2 metrics)** - Supplier assessments, sustainable sourcing
8. **Circular Economy (3 metrics)** - Product recycling, packaging, take-back
9. **Governance (5 metrics)** - Board, compensation, assurance, standards

---

## 1️⃣ Emissions Metrics (GHG Protocol)

### Scope 1 Emissions
**Field**: `scope1_emissions`
**Unit**: Tons CO2e (carbon dioxide equivalent)
**Definition**: Direct emissions from owned or controlled sources
**Examples**: Company vehicles, on-site fuel combustion, manufacturing processes
**GRI Standard**: GRI 305-1
**Typical Range**: 10K - 50M tons (varies by industry)

### Scope 2 Emissions
**Field**: `scope2_emissions`
**Unit**: Tons CO2e
**Definition**: Indirect emissions from purchased electricity, steam, heating, cooling
**Examples**: Office electricity, factory power
**GRI Standard**: GRI 305-2
**Note**: Can be reported as market-based or location-based

### Scope 2 Market-Based
**Field**: `scope2_market_based`
**Unit**: Tons CO2e
**Definition**: Scope 2 calculated using supplier-specific emission factors
**Use Case**: Shows impact of renewable energy contracts

### Scope 2 Location-Based
**Field**: `scope2_location_based`
**Unit**: Tons CO2e
**Definition**: Scope 2 using regional grid average emission factors
**Use Case**: Shows actual grid impact

### Scope 3 Emissions
**Field**: `scope3_emissions`
**Unit**: Tons CO2e
**Definition**: All other indirect emissions in the value chain
**Examples**: Supply chain, business travel, employee commuting, product use
**GRI Standard**: GRI 305-3
**Insight**: Typically 2-10x higher than Scope 1+2 combined

### Total Emissions
**Field**: `total_emissions`
**Unit**: Tons CO2e
**Definition**: Sum of Scope 1 + 2 + 3
**Use Case**: Overall carbon footprint

### GHG Intensity
**Field**: `ghg_intensity`
**Unit**: Tons CO2e per million USD revenue
**Definition**: Total emissions divided by annual revenue
**Use Case**: Compare companies of different sizes
**Formula**: `total_emissions / (annual_revenue / 1,000,000)`

### Carbon Neutral Target
**Field**: `carbon_neutral_target`
**Unit**: Year (integer)
**Definition**: Year company commits to carbon neutrality (net emissions ≤ 0)
**Typical Range**: 2025-2050
**Note**: May include carbon offsets

### Net Zero Target
**Field**: `net_zero_target`
**Unit**: Year (integer)
**Definition**: Year company commits to net zero (90% reduction + offsets)
**Typical Range**: 2030-2050
**Difference**: Net zero requires 90% reduction, carbon neutral allows more offsets

### Emission Reduction Target
**Field**: `emission_reduction_target`
**Type**: JSON object
**Structure**:
```json
{
  "percentage": 50,
  "baselineYear": 2020,
  "targetYear": 2030,
  "scope": "Scope 1+2",
  "notes": "Science-based target validated by SBTi"
}
```

### Biogenic Emissions
**Field**: `biogenic_emissions`
**Unit**: Tons CO2
**Definition**: CO2 from biomass combustion (reported separately from fossil)
**Examples**: Biogas, wood pellets, biofuels

---

## 2️⃣ Energy Metrics

### Total Energy Consumption
**Field**: `total_energy_consumption`
**Unit**: MWh (megawatt-hours)
**Definition**: Total energy consumed from all sources
**GRI Standard**: GRI 302-1
**Typical Range**: 100K - 50M MWh/year
**Includes**: Electricity, natural gas, fuel oil, renewable energy

### Energy Intensity
**Field**: `energy_intensity`
**Unit**: MWh per million USD revenue
**Definition**: Energy consumption per unit of economic output
**Use Case**: Compare energy efficiency across companies
**Formula**: `total_energy_consumption / (annual_revenue / 1,000,000)`

### Renewable Energy (Percentage)
**Field**: `renewable_energy_percent`
**Unit**: Percentage (0-100)
**Definition**: % of total energy from renewable sources
**GRI Standard**: GRI 302-1
**Typical Range**: 0-100%
**Leaders**: 75-100%, Laggards: 0-30%

### Renewable Energy (Absolute)
**Field**: `renewable_energy_mwh`
**Unit**: MWh
**Definition**: Absolute renewable energy consumed
**Formula**: `total_energy_consumption × renewable_energy_percent / 100`

### Renewable Energy Target
**Field**: `renewable_energy_target`
**Type**: JSON object
**Structure**:
```json
{
  "percentage": 100,
  "targetYear": 2030,
  "sources": ["Solar", "Wind", "Hydro"],
  "notes": "RE100 commitment"
}
```

---

## 3️⃣ Water Metrics

### Water Withdrawal
**Field**: `water_withdrawal`
**Unit**: Megaliters (ML)
**Definition**: Total water withdrawn from all sources
**GRI Standard**: GRI 303-3
**Sources**: Municipal, groundwater, surface water, seawater

### Water Discharge
**Field**: `water_discharge`
**Unit**: Megaliters
**Definition**: Water returned to environment after use
**GRI Standard**: GRI 303-4
**Quality**: Should meet discharge standards

### Water Recycled/Reused
**Field**: `water_recycled`
**Unit**: Megaliters
**Definition**: Water recycled and reused on-site
**GRI Standard**: GRI 303-3
**Formula**: `water_recycling_rate = water_recycled / water_withdrawal × 100`

### Water Intensity
**Field**: `water_intensity`
**Unit**: Megaliters per million USD revenue
**Definition**: Water consumption per unit economic output
**Use Case**: Compare water efficiency
**Formula**: `water_withdrawal / (annual_revenue / 1,000,000)`

### Water Stress Locations
**Field**: `water_stress_locations`
**Type**: Boolean
**Definition**: Whether company operates in water-stressed regions
**Source**: WRI Aqueduct tool
**Risk**: High water risk areas

---

## 4️⃣ Waste Metrics

### Waste Generated
**Field**: `waste_generated`
**Unit**: Metric tons
**Definition**: Total waste produced
**GRI Standard**: GRI 306-3
**Types**: Hazardous and non-hazardous

### Waste Recycled
**Field**: `waste_recycled`
**Unit**: Metric tons
**Definition**: Waste diverted from landfill (recycled, composted, reused)
**GRI Standard**: GRI 306-4

### Waste Recycling Rate
**Field**: `waste_recycling_rate`
**Unit**: Percentage (0-100)
**Definition**: % of waste diverted from landfill
**Formula**: `waste_recycled / waste_generated × 100`
**Benchmark**: 80%+ is excellent, 50-80% good, <50% needs improvement

---

## 5️⃣ Health & Safety Metrics

### Total Recordable Incident Rate (TRIR)
**Field**: `total_recordable_incident_rate`
**Unit**: Rate per 100 full-time employees
**Definition**: Work-related injuries/illnesses requiring medical treatment
**SASB Standard**: Multiple sectors
**Formula**: `(incidents × 200,000) / hours_worked`
**Benchmark**: <1.0 is excellent, 1.0-3.0 good, >3.0 needs improvement

### Lost Time Injury Rate (LTIR)
**Field**: `lost_time_injury_rate`
**Unit**: Rate per 100 employees
**Definition**: Injuries causing at least 1 day away from work
**Target**: Zero harm

### Fatalities
**Field**: `fatalities`
**Unit**: Integer (count)
**Definition**: Worker fatalities in reporting year
**Target**: Zero (always)

### Near Miss Incidents
**Field**: `near_miss_incidents`
**Unit**: Integer (count)
**Definition**: Incidents that could have caused injury but didn't
**Insight**: Leading indicator of safety culture

---

## 6️⃣ Social Metrics

### Employee Count
**Field**: `employee_count`
**Unit**: Integer (headcount)
**Definition**: Total number of employees
**Use Case**: Context for intensity metrics

### Women in Leadership
**Field**: `women_in_leadership`
**Unit**: Percentage (0-100)
**Definition**: % women in management and board positions
**SASB Standard**: Multiple sectors
**Benchmark**: 40-50% is excellent, 30-40% good, <30% needs improvement

### Training Hours per Employee
**Field**: `training_hours_per_employee`
**Unit**: Hours per employee per year
**Definition**: Average training/development hours
**GRI Standard**: GRI 404-1
**Benchmark**: 40+ hours excellent, 20-40 good, <20 needs improvement

### Employee Turnover Rate
**Field**: `employee_turnover_rate`
**Unit**: Percentage
**Definition**: % employees leaving annually
**GRI Standard**: GRI 401-1
**Benchmark**: 10-15% healthy, >25% concerning

### Living Wage Percentage
**Field**: `living_wage_percent`
**Unit**: Percentage (0-100)
**Definition**: % employees earning living wage or above
**Target**: 100%
**Source**: MIT Living Wage Calculator

### Unionized Workforce
**Field**: `unionized_workforce_percent`
**Unit**: Percentage (0-100)
**Definition**: % workforce covered by collective bargaining
**GRI Standard**: GRI 2-30

### Diversity Metrics
**Field**: `diversity_metrics`
**Type**: JSON object
**Structure**:
```json
{
  "women_overall": 42,
  "underrepresented_minorities": 35,
  "age_diversity": {"under_30": 25, "30_50": 50, "over_50": 25},
  "pay_equity_ratio": 0.98
}
```

---

## 7️⃣ Supply Chain Metrics

### Supplier ESG Assessments
**Field**: `supplier_esg_assessments`
**Unit**: Integer (count)
**Definition**: Number of suppliers assessed for ESG risks annually
**SASB Standard**: Multiple sectors
**Insight**: Shows supply chain oversight

### Sustainable Sourcing Percentage
**Field**: `sustainable_sourcing_percent`
**Unit**: Percentage (0-100)
**Definition**: % materials from certified sustainable sources
**Certifications**: FSC, Fairtrade, RSPO, MSC, etc.

---

## 8️⃣ Circular Economy Metrics

### Product Recycling Rate
**Field**: `product_recycling_rate`
**Unit**: Percentage (0-100)
**Definition**: % of products recycled at end-of-life
**Example**: Dell recycles 90% of returned products

### Packaging Recycled Content
**Field**: `packaging_recycled_content`
**Unit**: Percentage (0-100)
**Definition**: % recycled material in product packaging
**Target**: 50-100%

### Product Take-Back Programs
**Field**: `product_takeback_programs`
**Type**: Boolean
**Definition**: Whether company operates product return/recycling programs
**Example**: Apple Trade-In, Patagonia Worn Wear

---

## 9️⃣ Governance & Reporting Metrics

### Board Independence
**Field**: `board_independence`
**Unit**: Percentage (0-100)
**Definition**: % independent (non-executive) board members
**Benchmark**: 75-90% is excellent, 50-75% good, <50% concerning

### ESG-Linked Compensation
**Field**: `esg_linked_compensation`
**Type**: Boolean
**Definition**: Whether executive pay tied to ESG performance
**Trend**: Increasingly required by investors

### Externally Assured
**Field**: `externally_assured`
**Type**: Boolean
**Definition**: Whether sustainability report externally audited
**Importance**: Third-party validation

### Assurance Provider
**Field**: `assurance_provider`
**Type**: Text
**Examples**: "Deloitte", "EY", "PwC", "DNV", "SGS"

### Reporting Standards
**Field**: `reporting_standards`
**Type**: Array of strings
**Common Values**: ["GRI", "SASB", "TCFD", "CDP", "UNGC", "SDGs"]
**Benchmark**: Companies using 3+ standards show strong commitment

---

## 🔟 Financial Context

### Annual Revenue
**Field**: `annual_revenue`
**Unit**: Millions of USD (or specified currency)
**Purpose**: Enable intensity calculations
**Source**: Annual report, 10-K filing

### Revenue Currency
**Field**: `revenue_currency`
**Type**: Text (ISO 4217 code)
**Default**: "USD"
**Examples**: "EUR", "GBP", "JPY"

---

## 🎯 Metric Prioritization

### Critical Metrics (Always Capture)
1. ✅ Total emissions (Scope 1+2+3)
2. ✅ Renewable energy %
3. ✅ Net zero target year
4. ✅ Waste recycling rate
5. ✅ Women in leadership
6. ✅ External assurance
7. ✅ Reporting standards

### Important Metrics (Capture When Available)
8. Water withdrawal/discharge
9. Energy consumption (absolute)
10. GHG intensity
11. Health & safety rates (TRIR)
12. Training hours
13. Supply chain assessments

### Nice-to-Have Metrics
14. Biodiversity programs
15. Product recycling rates
16. Near-miss incidents
17. Living wage percentage

---

## 📈 AI Extraction Prompt Template

When using AI to extract these metrics from sustainability reports, use this prompt structure:

```
Extract sustainability metrics from this company report in JSON format.

Company: {company_name}
Report Year: {year}
Report text: {report_content}

Return JSON with these fields (use null if not found):

EMISSIONS (tons CO2e):
- scope1_emissions, scope2_emissions, scope3_emissions, total_emissions
- carbon_neutral_target (year), net_zero_target (year)
- ghg_intensity (tons/$M revenue)

ENERGY:
- total_energy_consumption (MWh)
- renewable_energy_percent (0-100)
- renewable_energy_mwh (MWh)
- energy_intensity (MWh/$M)

WATER (megaliters):
- water_withdrawal, water_discharge, water_recycled
- water_intensity (ML/$M)
- water_stress_locations (boolean)

WASTE (metric tons):
- waste_generated, waste_recycled, waste_recycling_rate (%)

HEALTH & SAFETY:
- total_recordable_incident_rate (per 100 employees)
- lost_time_injury_rate, fatalities, near_miss_incidents

SOCIAL:
- employee_count
- women_in_leadership (%), diversity_metrics (JSON)
- training_hours_per_employee, employee_turnover_rate (%)
- living_wage_percent (%), unionized_workforce_percent (%)

SUPPLY CHAIN:
- supplier_esg_assessments (count)
- sustainable_sourcing_percent (%)

CIRCULAR ECONOMY:
- product_recycling_rate (%), packaging_recycled_content (%)
- product_takeback_programs (boolean)

GOVERNANCE:
- board_independence (%)
- esg_linked_compensation (boolean)
- externally_assured (boolean), assurance_provider (text)
- reporting_standards (array)

FINANCIAL:
- annual_revenue (millions), revenue_currency (text)

Return valid JSON only, no markdown formatting.
```

---

## 🏆 Benchmark Calculations

### Sector Benchmarks Use:
- **Median** (50th percentile) - Middle company
- **25th Percentile** - Bottom quartile threshold
- **75th Percentile** - Top quartile threshold
- **Leaders** - Top 10% (90th percentile+)
- **Laggards** - Bottom 10% (10th percentile-)

### Company Scores Calculated From:
1. **Environmental Score** (0-100):
   - Emissions intensity vs benchmark (25%)
   - Renewable energy % vs benchmark (25%)
   - Waste recycling % vs benchmark (20%)
   - Water efficiency vs benchmark (15%)
   - Net zero target ambition vs benchmark (15%)

2. **Social Score** (0-100):
   - Women in leadership vs benchmark (30%)
   - Health & safety vs benchmark (25%)
   - Training hours vs benchmark (20%)
   - Living wage vs benchmark (15%)
   - Employee turnover vs benchmark (10%)

3. **Governance Score** (0-100):
   - Board independence vs benchmark (30%)
   - External assurance (20%)
   - ESG-linked compensation (20%)
   - Reporting standards count (15%)
   - Transparency & disclosure (15%)

4. **Overall Score** (0-100):
   - Environmental: 45%
   - Social: 30%
   - Governance: 25%

---

## 📚 Standards Reference

### GRI (Global Reporting Initiative)
- **GRI 302**: Energy
- **GRI 303**: Water
- **GRI 305**: Emissions
- **GRI 306**: Waste
- **GRI 401**: Employment
- **GRI 403**: Occupational Health & Safety
- **GRI 404**: Training

### SASB (Sustainability Accounting Standards Board)
- Industry-specific metrics
- Financial materiality focus
- Investor-oriented

### TCFD (Task Force on Climate-related Financial Disclosures)
- Climate risk disclosure
- Governance, strategy, risk, metrics
- Scenario analysis

### CDP (Carbon Disclosure Project)
- Climate, water, forests
- Questionnaire-based
- Scored A-F

---

## ✅ Data Quality Indicators

**High Quality Report** (Score: 90-100):
- ✅ All Scope 1+2+3 reported separately
- ✅ External assurance
- ✅ 3+ reporting standards
- ✅ 90%+ metrics populated
- ✅ Intensity metrics provided

**Medium Quality Report** (Score: 70-89):
- ✅ Scope 1+2 reported, Scope 3 partial
- ⚠️ No external assurance
- ✅ 1-2 reporting standards
- ✅ 70-89% metrics populated

**Low Quality Report** (Score: <70):
- ⚠️ Only total emissions reported
- ❌ No external assurance
- ❌ No standard frameworks
- ❌ <70% metrics populated

---

**Last Updated**: October 23, 2025
**Maintained By**: blipee OS Sector Intelligence Team
