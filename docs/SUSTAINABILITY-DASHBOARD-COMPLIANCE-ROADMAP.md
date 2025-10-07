# Sustainability Dashboard Compliance Roadmap

## Executive Summary

This document outlines the implementation plan to make blipee OS's `/sustainability/dashboard` compliant with all major global sustainability reporting standards: GHG Protocol, GRI 302/305, CSRD/ESRS E1, TCFD, and ISSB IFRS S2.

**Current Status:** 40% compliant
**Target:** 95%+ compliant across all frameworks
**Timeline:** 12 weeks (3 phases)

---

## Compliance Gap Analysis

### Current Implementation (What We Have ✅)

1. **Basic Energy Tracking**
   - Total consumption (kWh)
   - Site-level breakdown
   - Time period filtering

2. **Energy Intensity Metrics (GRI 302-3)**
   - Per employee: 9,439.8 kWh/FTE
   - Per square meter: 446.9 kWh/m²
   - Per revenue: 82.3 MWh/$M

3. **Basic Emissions (Scope 2)**
   - Total CO2e calculated
   - Converted to tCO2e

4. **Dashboard Views**
   - Consumption
   - Emissions
   - Cost
   - Intensity

### Critical Gaps (Compliance Blockers 🔴)

#### 1. **Dual Reporting (GHG Protocol + IFRS S2 MANDATORY)**
**Required By:** GHG Protocol, CSRD/ESRS E1, IFRS S2
**Current:** ❌ Single emission value only
**Need:**
- Location-based Scope 2 emissions
- Market-based Scope 2 emissions
- Display both side-by-side

**Compliance Impact:** CRITICAL - Without this, you cannot claim GHG Protocol or IFRS S2 compliance

#### 2. **Energy Source Breakdown (GRI 302-1, ESRS E1-5 MANDATORY)**
**Required By:** GRI 302, CSRD/ESRS E1
**Current:** ❌ Only shows "Purchased Energy" category
**Need:**
- Fossil fuels (coal, oil, natural gas) - separate
- Nuclear energy
- Renewable energy by type (solar, wind, hydro, biomass)
- Self-generated vs purchased

**Compliance Impact:** CRITICAL - Core requirement for GRI 302 and ESRS E1

#### 3. **Energy Type Split (GRI 302-1 MANDATORY)**
**Required By:** GRI 302, CSRD/ESRS E1
**Current:** ❌ Electricity only
**Need:**
- Electricity (MWh)
- Heating (GJ)
- Cooling (GJ)
- Steam (GJ)

**Compliance Impact:** HIGH - Required for complete GRI 302-1 disclosure

#### 4. **Scope 3 Emissions (CSRD, IFRS S2)**
**Required By:** CSRD/ESRS E1, IFRS S2 (Year 2+), GRI 305
**Current:** ❌ Not tracked
**Need:**
- 15 Scope 3 categories
- At minimum: Business travel, employee commuting, purchased goods

**Compliance Impact:** HIGH - Mandatory for CSRD, IFRS S2 Year 2+

### Important Gaps (Enhanced Reporting 🟡)

#### 5. **Year-over-Year Trends (GRI 302-4, TCFD)**
**Current:** ❌ Current period only
**Need:**
- Baseline year
- Historical trends (3-5 years)
- % change calculations
- Reduction tracking

#### 6. **Targets & Goals (All Standards)**
**Current:** ❌ No targets tracked
**Need:**
- GHG reduction targets
- Renewable energy targets
- Energy efficiency goals
- SBTi alignment

#### 7. **Scenario Analysis (TCFD, IFRS S2)**
**Current:** ❌ Not available
**Need:**
- 2°C scenario modeling
- Physical risk assessment
- Transition risk analysis

### Nice-to-Have (Competitive Advantage 🟢)

#### 8. **Multiple Units (GRI Preference)**
**Current:** kWh only
**Enhancement:** Toggle between kWh, MWh, GJ, TJ

#### 9. **XBRL/Digital Tagging (CSRD)**
**Current:** None
**Enhancement:** Structured data export for regulatory filing

#### 10. **Real-time Monitoring**
**Current:** Batch data
**Enhancement:** Live energy consumption tracking

---

## Implementation Roadmap (12 Weeks)

### Phase 1: Critical Compliance (Weeks 1-4)

**Goal:** Achieve minimum compliance for GHG Protocol and GRI 302

#### Week 1-2: Dual Reporting Implementation

**Database Changes:**
```sql
-- Add to metrics_data table
ALTER TABLE metrics_data ADD COLUMN emissions_location_based DECIMAL(15,3);
ALTER TABLE metrics_data ADD COLUMN emissions_market_based DECIMAL(15,3);
ALTER TABLE metrics_data ADD COLUMN emission_factor_location DECIMAL(10,6);
ALTER TABLE metrics_data ADD COLUMN emission_factor_market DECIMAL(10,6);
ALTER TABLE metrics_data ADD COLUMN grid_region VARCHAR(100);
ALTER TABLE metrics_data ADD COLUMN contractual_instruments JSONB;
```

**API Updates:**
- `/api/energy/sources` - Add dual emissions calculation
- `/api/emissions/scope2` - New endpoint for Scope 2 breakdown

**UI Updates:**
- Add "Location-based" vs "Market-based" toggle
- Display both emission values in emissions view
- Add tooltip explaining difference

**Data Migration:**
- Calculate location-based emissions for existing data using grid factors
- Set market-based = location-based for records without RECs

**Deliverable:** Dashboard shows both Scope 2 emission methods ✓

#### Week 3-4: Energy Source Breakdown

**Database Changes:**
```sql
-- Add to metrics_catalog
ALTER TABLE metrics_catalog ADD COLUMN energy_source_type VARCHAR(50);
-- Values: 'fossil', 'nuclear', 'renewable'

ALTER TABLE metrics_catalog ADD COLUMN fuel_source VARCHAR(100);
-- Values: 'solar', 'wind', 'hydro', 'biomass', 'geothermal',
--         'natural_gas', 'coal', 'oil', 'diesel', 'nuclear'

ALTER TABLE metrics_catalog ADD COLUMN generation_type VARCHAR(50);
-- Values: 'self_generated', 'purchased'
```

**Metrics Catalog Updates:**
Create new metric entries:
- Electricity - Renewable (Solar)
- Electricity - Renewable (Wind)
- Electricity - Fossil (Natural Gas)
- Heating - Fossil (Natural Gas)
- Cooling - Electricity
- Steam - Fossil (Natural Gas)

**UI Updates:**
- New "Energy Mix" view (pie chart)
  - Renewable vs Non-renewable
  - Breakdown by source type
- Update consumption view to show source breakdown
- Add stacked bar chart for monthly trends by source

**Deliverable:** Dashboard shows renewable/non-renewable split with source types ✓

---

### Phase 2: CSRD/ESRS Compliance (Weeks 5-8)

**Goal:** Meet ESRS E1-5 and E1-6 requirements

#### Week 5-6: Energy Type Split & MWh Units

**Database Changes:**
```sql
ALTER TABLE metrics_catalog ADD COLUMN energy_type VARCHAR(50);
-- Values: 'electricity', 'heating', 'cooling', 'steam', 'fuel'
```

**Conversion Logic:**
```javascript
// Support multiple units
const conversions = {
  kWhToMWh: (kwh) => kwh / 1000,
  kWhToGJ: (kwh) => kwh * 0.0036,
  MWhToGJ: (mwh) => mwh * 3.6
};
```

**UI Updates:**
- Add unit selector (kWh / MWh / GJ)
- Display energy by type:
  - Electricity (MWh)
  - Heating (GJ)
  - Cooling (GJ)
  - Steam (GJ)
- Add "Energy Type Breakdown" card

**New Metrics to Track:**
- Create metrics for heating, cooling, steam if not exist
- Map existing electricity metrics

**Deliverable:** Dashboard shows all 4 energy types in EU-compliant units ✓

#### Week 7-8: Scope 3 Foundation & Data Points

**Database Schema:**
```sql
CREATE TABLE scope3_emissions (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  category VARCHAR(100), -- 15 Scope 3 categories
  subcategory VARCHAR(100),
  activity_data DECIMAL(15,3),
  activity_unit VARCHAR(50),
  emission_factor DECIMAL(10,6),
  emissions_tco2e DECIMAL(15,3),
  data_quality VARCHAR(50), -- 'actual', 'estimated', 'industry_average'
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_scope3_org_period ON scope3_emissions(organization_id, period_start);
```

**Scope 3 Categories (Priority):**
1. Business travel (flights, hotels)
2. Employee commuting
3. Purchased goods and services
4. Upstream transportation
5. Waste disposal
6. (Others as needed)

**API Endpoints:**
- `/api/emissions/scope3` - List Scope 3 by category
- `/api/emissions/scope3/category/{name}` - Detail by category

**UI Updates:**
- New "Scope 3" tab in emissions view
- Waterfall chart showing all 15 categories
- Data quality indicators

**Deliverable:** Scope 3 infrastructure ready, 3 categories tracked ✓

---

### Phase 3: TCFD/IFRS S2 & Advanced Features (Weeks 9-12)

**Goal:** Full compliance + competitive advantages

#### Week 9-10: Targets, Goals & Trends

**Database Schema:**
```sql
CREATE TABLE sustainability_targets (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  target_type VARCHAR(100), -- 'ghg_reduction', 'renewable_energy', 'energy_efficiency'
  baseline_year INTEGER,
  baseline_value DECIMAL(15,3),
  target_year INTEGER,
  target_value DECIMAL(15,3),
  target_unit VARCHAR(50),
  progress_percentage DECIMAL(5,2),
  status VARCHAR(50), -- 'on_track', 'at_risk', 'off_track', 'achieved'
  sbti_aligned BOOLEAN,
  created_at TIMESTAMP,
  metadata JSONB
);
```

**UI Components:**
- "Targets & Progress" dashboard card
- Progress bars for each goal
- Timeline visualization
- Year-over-year comparison charts
- Baseline year selector

**Analytics:**
- Calculate reduction % vs baseline
- Project future emissions based on trends
- Alert if off-track

**Deliverable:** Target tracking and trend analysis operational ✓

#### Week 11: Methodology Documentation & Export

**Database Schema:**
```sql
CREATE TABLE calculation_methodologies (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  metric_type VARCHAR(100),
  methodology_description TEXT,
  conversion_factors JSONB,
  data_sources TEXT[],
  standards_applied VARCHAR[], -- ['GHG Protocol', 'GRI 305', 'ESRS E1']
  assumptions TEXT,
  uncertainty_percentage DECIMAL(5,2),
  last_reviewed DATE,
  reviewed_by VARCHAR(255)
);
```

**Features:**
- Methodology documentation panel
- Export reports:
  - GRI 302 compliance report (PDF/CSV)
  - CSRD/ESRS E1 data export (XBRL)
  - GHG Protocol Scope 2 report
  - TCFD disclosure template
- Audit trail for all calculations

**Deliverable:** Full traceability and export capabilities ✓

#### Week 12: Scenario Analysis & Risk Assessment (TCFD)

**Features:**
- Scenario modeling tool:
  - 2°C warming scenario
  - 4°C warming scenario
  - Net Zero 2050 scenario
- Physical risk heatmap by site
- Transition risk analysis
- Financial impact projections

**UI:**
- "Climate Scenarios" tab
- Interactive scenario selector
- Risk matrix visualization
- Financial impact dashboard

**Deliverable:** TCFD-compliant scenario analysis ✓

---

## Technical Architecture Updates

### Database Schema Summary

**New Tables:**
- `scope3_emissions` - Scope 3 tracking
- `sustainability_targets` - Goals and targets
- `calculation_methodologies` - Audit and documentation

**Modified Tables:**
- `metrics_data` - Add 6 new columns for dual reporting
- `metrics_catalog` - Add 3 new columns for energy classification

**Total New Columns:** 9
**Total New Tables:** 3
**Estimated Database Impact:** +15% storage

### API Endpoints to Create/Update

**New Endpoints (12):**
```
GET  /api/emissions/scope2/dual-reporting
GET  /api/energy/mix
GET  /api/energy/types
GET  /api/emissions/scope3
GET  /api/emissions/scope3/category/{name}
POST /api/emissions/scope3
GET  /api/targets
POST /api/targets
PUT  /api/targets/{id}
GET  /api/scenarios
GET  /api/methodology
GET  /api/exports/gri-302
GET  /api/exports/esrs-e1
GET  /api/exports/tcfd
```

**Updated Endpoints (4):**
```
PATCH /api/energy/sources - Add renewable/non-renewable split
PATCH /api/energy/intensity - Support multiple units
PATCH /api/emissions/overview - Add Scope 3
PATCH /api/organization/context - Add targets & baselines
```

### Frontend Component Changes

**New Components (8):**
- `<DualReportingToggle />` - Location vs Market-based
- `<EnergyMixChart />` - Renewable/fossil pie chart
- `<EnergyTypeBreakdown />` - Electricity/heating/cooling/steam
- `<Scope3Dashboard />` - Waterfall chart for 15 categories
- `<TargetsProgress />` - Goal tracking
- `<ScenarioAnalysis />` - Climate scenario modeling
- `<MethodologyPanel />` - Documentation viewer
- `<ComplianceExporter />` - Multi-standard export

**Updated Components (3):**
- `<EnergyDashboard />` - Add new views
- `<ComplianceDashboard />` - Expand metrics
- `<DashboardClient />` - New tabs for scenarios, targets

---

## Compliance Checklist by Standard

### GHG Protocol Scope 2
- [ ] Location-based emissions calculated
- [ ] Market-based emissions calculated
- [ ] Both methods displayed
- [ ] Contractual instruments tracked (RECs, PPAs)
- [ ] Grid region documented
- [ ] Emission factors sourced and documented

### GRI 302: Energy
- [ ] 302-1: Total energy by type (electricity, heating, cooling, steam)
- [ ] 302-1: Renewable vs non-renewable split
- [ ] 302-1: Fuel consumption by source
- [ ] 302-2: Energy outside organization (Scope 3)
- [ ] 302-3: Energy intensity ratios (✓ already implemented)
- [ ] 302-4: Energy reduction tracking
- [ ] 302-5: Product/service efficiency improvements

### CSRD/ESRS E1
- [ ] E1-5: Total energy in MWh
- [ ] E1-5: Fossil/nuclear/renewable breakdown
- [ ] E1-5: Energy intensity (MWh/€M revenue)
- [ ] E1-5: Self-generated vs purchased
- [ ] E1-5: Energy efficiency initiatives documented
- [ ] E1-6: Scope 1, 2, 3 emissions
- [ ] E1-6: Location-based AND market-based Scope 2
- [ ] Double materiality assessment completed
- [ ] 208 data points mapped
- [ ] XBRL export capability

### TCFD
- [ ] Governance: Board oversight documented
- [ ] Strategy: Climate risks identified
- [ ] Strategy: Scenario analysis (2°C)
- [ ] Risk Management: Process documented
- [ ] Metrics: Scope 1, 2, 3 disclosed
- [ ] Metrics: Energy consumption disclosed
- [ ] Metrics: Energy intensity disclosed
- [ ] Targets: GHG reduction targets set
- [ ] Targets: Renewable energy targets set

### IFRS S2
- [ ] Scope 1 emissions (absolute gross)
- [ ] Scope 2 emissions (location-based)
- [ ] Scope 2 emissions (market-based)
- [ ] Scope 3 emissions (Year 2+ or if material)
- [ ] Industry-specific SASB metrics
- [ ] Climate-related targets disclosed
- [ ] Scenario analysis conducted
- [ ] Governance structure documented
- [ ] Risk management integrated

---

## Resource Requirements

### Development Team
- **Backend Developer:** 6 weeks full-time (database, APIs)
- **Frontend Developer:** 8 weeks full-time (UI components, dashboards)
- **Data Engineer:** 4 weeks (data migration, ETL)
- **Sustainability Expert:** 2 weeks (methodology, validation)

**Total Effort:** ~20 person-weeks

### Data Requirements
- Grid emission factors by region (location-based)
- Supplier-specific emission factors (market-based)
- Renewable energy certificates (RECs) data
- Scope 3 activity data collection templates
- Baseline year data (historical)

### Third-Party Services
- **Grid emission factors:** IEA, EPA eGRID, or Electricity Maps API
- **Calculation engine:** Consider partnering with:
  - Normative
  - Watershed
  - Plan A
  - Persefoni
- **Data validation:** External assurance provider (for CSRD)

---

## Success Metrics

### Compliance Score
- **GHG Protocol:** Target 100% (currently ~30%)
- **GRI 302:** Target 95% (currently ~35%)
- **CSRD/ESRS E1:** Target 90% (currently ~20%)
- **TCFD:** Target 85% (currently ~25%)
- **IFRS S2:** Target 90% (currently ~30%)

### User Metrics
- Dashboard load time: <2 seconds
- Export generation: <5 seconds
- Data freshness: <24 hours
- User satisfaction: >4.5/5

### Business Metrics
- Customers able to complete regulatory reports: 90%+
- Time saved vs manual reporting: 80%
- Audit-ready documentation: Yes
- Multi-framework export: 5 formats

---

## Risk Mitigation

### Technical Risks
| Risk | Mitigation |
|------|------------|
| Data quality issues | Implement validation rules, data quality scores |
| Database performance | Add indexes, implement caching, optimize queries |
| API rate limits | Cache external API calls, use batching |
| Complex calculations | Unit tests, validation against known benchmarks |

### Compliance Risks
| Risk | Mitigation |
|------|------------|
| Standard updates | Subscribe to updates, quarterly review process |
| Interpretation errors | Consult sustainability experts, external audit |
| Missing data | Estimation methodologies, data quality flags |
| Regional variations | Country-specific configurations |

---

## Next Steps

### Immediate Actions (This Week)
1. ✅ Document current gaps (this file)
2. [ ] Get stakeholder approval for roadmap
3. [ ] Allocate development resources
4. [ ] Set up project tracking (tasks, sprints)

### Week 1 Kickoff
1. [ ] Database schema design review
2. [ ] API specification finalization
3. [ ] UI/UX mockups for new components
4. [ ] Data migration plan
5. [ ] Sprint 1 planning

### Quick Wins (Can Start Immediately)
1. **Add unit toggle (kWh/MWh/GJ)** - 2 days
2. **Display renewable %** - Already have data, just show it
3. **Add "View Methodology" button** - Link to doc
4. **Create baseline year selector** - 3 days

---

## Appendix: Data Point Mapping

### ESRS E1 208 Data Points - Energy Subset

**E1-5: Energy Consumption and Mix (40 data points)**

| Data Point | Current Status | Source Table | Priority |
|------------|----------------|--------------|----------|
| Total energy consumption (MWh) | ✓ Partial (kWh) | metrics_data | P0 |
| Fossil fuel consumption (MWh) | ✗ | metrics_catalog + metrics_data | P0 |
| Nuclear energy consumption (MWh) | ✗ | metrics_catalog + metrics_data | P0 |
| Renewable energy consumption (MWh) | ✗ | metrics_catalog + metrics_data | P0 |
| Solar energy (MWh) | ✗ | metrics_catalog + metrics_data | P1 |
| Wind energy (MWh) | ✗ | metrics_catalog + metrics_data | P1 |
| Hydroelectric (MWh) | ✗ | metrics_catalog + metrics_data | P1 |
| Biomass (MWh) | ✗ | metrics_catalog + metrics_data | P1 |
| Self-generated energy (MWh) | ✗ | New field | P1 |
| Purchased energy (MWh) | ✓ | metrics_data | P0 |
| Energy intensity (MWh/€M) | ✓ Partial | Calculated | P0 |
| ... (30 more) | ... | ... | ... |

---

**Document Version:** 1.0
**Last Updated:** 2025-01-05
**Owner:** blipee OS Product Team
**Reviewers:** Engineering, Sustainability, Legal
