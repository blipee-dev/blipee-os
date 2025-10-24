# CSRD & ESRS Compliance Guide

**Purpose**: Enable blipee OS to track and benchmark Corporate Sustainability Reporting Directive (CSRD) compliance.

**Market Impact**: 50,000+ companies must comply with CSRD (2024-2028 phased rollout) - this is a MASSIVE business opportunity.

---

## 🇪🇺 What is CSRD?

**CSRD (Corporate Sustainability Reporting Directive)** is the EU's mandatory sustainability reporting framework that replaces the NFRD (Non-Financial Reporting Directive).

### Key Facts

- **Mandatory**: Not voluntary like GRI/SASB
- **Phased Rollout**: 2024-2028 (already started!)
- **Scope**: 50,000+ companies (EU + non-EU with EU operations)
- **Standards**: 12 ESRS (European Sustainability Reporting Standards)
- **Audit Required**: External assurance mandatory
- **Penalties**: Heavy fines for non-compliance (varies by country)
- **Double Materiality**: Must assess both financial impact AND impact on people/planet

---

## 📅 CSRD Timeline (Who Must Comply When)

### 2024 (Reporting in 2025)
**~5,000 companies**
- Large EU companies already under NFRD
- Listed companies with 500+ employees

### 2025 (Reporting in 2026)
**~15,000 companies**
- Large EU companies (not previously under NFRD)
- Companies meeting 2 of 3 criteria:
  - 250+ employees
  - €50M+ revenue
  - €25M+ total assets

### 2026 (Reporting in 2027)
**~10,000 companies**
- Listed SMEs (except micro-enterprises)
- Small non-complex credit institutions
- Captive insurance undertakings

### 2028 (Reporting in 2029)
**~20,000 companies**
- Non-EU companies with significant EU activity:
  - €150M+ EU revenue
  - At least 1 EU subsidiary meeting large company criteria OR
  - EU branch with €40M+ revenue

**Total Addressable Market: 50,000+ companies that MUST comply**

---

## 📚 ESRS Standards (12 Standards)

### Cross-Cutting Standards (2)
1. **ESRS 1**: General Requirements (mandatory for all)
2. **ESRS 2**: General Disclosures (mandatory for all)

### Environmental Standards (5)
3. **ESRS E1**: Climate Change (mandatory)
4. **ESRS E2**: Pollution (apply or explain)
5. **ESRS E3**: Water and Marine Resources (apply or explain)
6. **ESRS E4**: Biodiversity and Ecosystems (apply or explain)
7. **ESRS E5**: Resource Use and Circular Economy (apply or explain)

### Social Standards (4)
8. **ESRS S1**: Own Workforce (apply or explain)
9. **ESRS S2**: Workers in Value Chain (apply or explain)
10. **ESRS S3**: Affected Communities (apply or explain)
11. **ESRS S4**: Consumers and End-Users (apply or explain)

### Governance Standard (1)
12. **ESRS G1**: Business Conduct (apply or explain)

**Note**: "Apply or explain" means either report on it OR explain why it's not material.

---

## 🎯 Double Materiality Assessment (Required)

CSRD requires **double materiality** - unlike US standards that focus only on financial materiality.

### Financial Materiality
**Question**: How do sustainability matters affect the company's financial performance?
**Focus**: Risks and opportunities to the business
**Example**: Water scarcity risk affecting operations

### Impact Materiality
**Question**: How does the company affect people and the environment?
**Focus**: Company's impact on society and planet
**Example**: Water pollution from company operations

### Both Must Be Assessed
Companies must report on issues that are material from EITHER perspective:
- ✅ Financially material only → Report
- ✅ Impact material only → Report
- ✅ Both → Report
- ❌ Neither → Can omit (with explanation)

---

## 📊 CSRD Metrics We Track

### CSRD Compliance Status
**Field**: `csrd_compliant`
**Type**: Boolean
**Definition**: Whether company reports under CSRD mandate
**Use Case**: Filter CSRD vs voluntary reporters

**Field**: `csrd_reporting_year`
**Type**: Integer (year)
**Definition**: First year company started CSRD reporting
**Values**: 2024, 2025, 2026, or 2028

**Field**: `esrs_standards_reported`
**Type**: Array of strings
**Example**: `["ESRS 1", "ESRS 2", "ESRS E1", "ESRS E2", "ESRS S1", "ESRS G1"]`
**Use Case**: Track which standards company covers

**Field**: `double_materiality_assessment`
**Type**: Boolean
**Definition**: Whether company conducted double materiality assessment
**Mandatory**: Yes for CSRD

---

## 🌍 ESRS E1: Climate Change

### Climate Transition Plan (Mandatory)
**Field**: `climate_transition_plan`
**Type**: JSONB
**Structure**:
```json
{
  "net_zero_target_year": 2050,
  "interim_targets": [
    {"year": 2030, "reduction_percent": 50, "baseline_year": 2020}
  ],
  "decarbonization_levers": [
    "Renewable energy procurement",
    "Energy efficiency improvements",
    "Electric vehicle fleet transition"
  ],
  "investment_plan": {
    "total_investment_euros": 500000000,
    "timeframe": "2024-2030"
  },
  "governance": "Board-level climate committee",
  "scenario_analysis_completed": true
}
```

### Climate-Related Expenditures
**Field**: `climate_related_capex`
**Unit**: Millions EUR (or USD)
**Definition**: Capital expenditure on climate change mitigation/adaptation

**Field**: `climate_related_opex`
**Unit**: Millions EUR (or USD)
**Definition**: Operating expenditure on climate change

### Climate Scenario Analysis
**Field**: `climate_scenario_analysis`
**Type**: Boolean
**Requirement**: Must use scenarios aligned with Paris Agreement

### Climate Risks
**Field**: `climate_physical_risks`
**Type**: JSONB
**Examples**: Flooding, drought, extreme heat, sea level rise
```json
{
  "acute_risks": ["Flooding at coastal facilities"],
  "chronic_risks": ["Water stress in arid regions"],
  "financial_impact_estimate": "€10-50M over 10 years"
}
```

**Field**: `climate_transition_risks`
**Type**: JSONB
**Examples**: Carbon pricing, technology shifts, market changes
```json
{
  "policy_risks": ["EU ETS carbon price increases"],
  "technology_risks": ["Fossil fuel assets becoming stranded"],
  "market_risks": ["Customer preference shift to low-carbon products"]
}
```

---

## 🏭 ESRS E2: Pollution

### Air Pollutants
**Field**: `air_pollutants_emissions`
**Type**: JSONB
**Unit**: Tons per year
```json
{
  "NOx": 1250,
  "SOx": 340,
  "particulates_PM2_5": 120,
  "particulates_PM10": 280,
  "heavy_metals": 5
}
```

### Water Pollutants
**Field**: `water_pollutants`
**Type**: JSONB
```json
{
  "heavy_metals": {"lead": 0.5, "mercury": 0.1},
  "nutrients": {"nitrogen": 1200, "phosphorus": 450},
  "organic_pollutants": ["pesticides", "solvents"]
}
```

### Substances of Concern
**Field**: `substances_of_concern`
**Type**: JSONB
**Includes**: REACH-registered substances, hazardous chemicals
```json
{
  "reach_registered": 45,
  "substances_of_very_high_concern": 3,
  "reduction_plan": "Phase out by 2028"
}
```

### Microplastics
**Field**: `microplastics_emissions`
**Unit**: Tons per year
**Growing Focus**: EU Single-Use Plastics Directive

---

## 💧 ESRS E3: Water and Marine Resources

### Water Consumption
**Field**: `water_consumption`
**Unit**: Megaliters
**Definition**: Net water consumed (withdrawal - discharge)
**Formula**: `water_withdrawal - water_discharge`

### Marine Resources Impact
**Field**: `marine_resources_impact`
**Type**: Boolean
**Applies to**: Companies with coastal operations, fishing, shipping

### Water Efficiency Targets
**Field**: `water_efficiency_targets`
**Type**: JSONB
```json
{
  "reduction_target_percent": 30,
  "baseline_year": 2020,
  "target_year": 2030,
  "measures": ["Closed-loop cooling", "Rainwater harvesting"]
}
```

---

## 🦋 ESRS E4: Biodiversity and Ecosystems

### Biodiversity Sensitive Areas
**Field**: `biodiversity_sensitive_areas`
**Type**: Boolean
**Definition**: Operations near UNESCO sites, IUCN protected areas, Natura 2000

### Biodiversity Impacts
**Field**: `biodiversity_impacts`
**Type**: JSONB
```json
{
  "species_affected": ["Red-listed species name"],
  "habitat_loss_hectares": 25,
  "mitigation_measures": [
    "Wildlife corridors created",
    "Habitat restoration program"
  ],
  "net_biodiversity_impact": "No net loss commitment"
}
```

### Ecosystem Restoration
**Field**: `ecosystem_restoration`
**Type**: JSONB
```json
{
  "restoration_projects": 3,
  "hectares_restored": 150,
  "species_reintroduced": 5,
  "investment_euros": 2000000
}
```

---

## ♻️ ESRS E5: Circular Economy

### Circular Economy Strategy
**Field**: `circular_economy_strategy`
**Type**: JSONB
```json
{
  "design_for_circularity": true,
  "product_lifetime_extension": "Repair programs",
  "material_recovery": "95% of products recyclable",
  "business_model": "Product-as-a-service for key products"
}
```

### Material Flows
**Field**: `material_inflows`
**Unit**: Metric tons
**Definition**: Total materials used in production

**Field**: `material_outflows`
**Unit**: Metric tons
**Definition**: Products produced + waste generated

### Waste to Landfill
**Field**: `waste_to_landfill`
**Unit**: Metric tons
**Goal**: Minimize (zero waste to landfill is best practice)

### Circular Revenue
**Field**: `circular_revenue_percent`
**Unit**: Percentage (0-100)
**Definition**: % revenue from circular products/services
**Examples**: Refurbished products, rental models, repair services

---

## 👷 ESRS S1: Own Workforce

### Adequate Wages
**Field**: `adequate_wages`
**Type**: Boolean
**Definition**: Beyond living wage - fair remuneration
**Requirement**: Must ensure workers can live with dignity

### Collective Bargaining
**Field**: `collective_bargaining_coverage`
**Unit**: Percentage (0-100)
**Definition**: % workforce covered by collective agreements

### Work-Life Balance
**Field**: `work_life_balance_metrics`
**Type**: JSONB
```json
{
  "flexible_working_percent": 80,
  "parental_leave_usage": 92,
  "average_overtime_hours": 3.2,
  "burnout_rate": 2
}
```

### Discrimination Incidents
**Field**: `discrimination_incidents`
**Unit**: Integer (count)
**Include**: Gender, race, age, disability discrimination cases

### Forced Labor / Child Labor Risks
**Field**: `forced_labor_risks`
**Field**: `child_labor_risks`
**Type**: Boolean
**Requirement**: Must assess and mitigate in operations and value chain

---

## 🌐 ESRS S2: Workers in Value Chain

### Value Chain Workers
**Field**: `value_chain_workers_count`
**Unit**: Integer (headcount estimate)
**Include**: Contractors, suppliers, temporary workers

### Human Rights Risks
**Field**: `value_chain_human_rights_risks`
**Type**: JSONB
```json
{
  "high_risk_countries": ["Country A", "Country B"],
  "identified_risks": [
    "Excessive working hours at Tier 2 suppliers",
    "Inadequate safety equipment"
  ],
  "mitigation_actions": [
    "Supplier code of conduct",
    "Third-party audits"
  ]
}
```

### Supplier Audits
**Field**: `supplier_audits_conducted`
**Unit**: Integer (count)

**Field**: `supplier_corrective_actions`
**Unit**: Integer (count)
**Definition**: Number of corrective action plans issued

---

## 🏘️ ESRS S3: Affected Communities

### Community Engagement
**Field**: `community_engagement`
**Type**: Boolean
**Requirement**: Meaningful consultation with affected communities

### Community Impacts
**Field**: `community_impacts`
**Type**: JSONB
```json
{
  "positive_impacts": [
    "1,200 local jobs created",
    "Community education program"
  ],
  "negative_impacts": [
    "Increased traffic near facility",
    "Air quality concerns"
  ],
  "remediation_measures": [
    "Traffic management plan",
    "Air quality monitoring and filters"
  ]
}
```

### Indigenous Rights
**Field**: `indigenous_rights_respected`
**Type**: Boolean
**Requirement**: Free, Prior, and Informed Consent (FPIC)

### Land Rights
**Field**: `land_rights_conflicts`
**Type**: Boolean
**Red Flag**: Any land disputes must be disclosed

---

## 👥 ESRS S4: Consumers and End-Users

### Product Safety
**Field**: `product_safety_incidents`
**Unit**: Integer (count)
**Include**: Recalls, injuries, safety violations

### Data Breaches
**Field**: `consumer_data_breaches`
**Unit**: Integer (count)
**GDPR Link**: Must report breaches under both GDPR and CSRD

### Product Transparency
**Field**: `product_information_transparency`
**Type**: Boolean
**Requirement**: Clear labeling, ingredients, sustainability info

### Consumer Complaints
**Field**: `consumer_complaints`
**Unit**: Integer (count)
**Include**: Formal complaints and resolution rate

---

## 🏛️ ESRS G1: Business Conduct

### Anti-Corruption
**Field**: `anti_corruption_policy`
**Type**: Boolean
**Requirement**: Must have policy aligned with UN Convention Against Corruption

**Field**: `anti_corruption_training_percent`
**Unit**: Percentage (0-100)
**Definition**: % employees trained on anti-corruption

**Field**: `bribery_incidents`
**Unit**: Integer (count)
**Include**: Confirmed cases and investigations

### Political Influence
**Field**: `political_contributions`
**Unit**: Currency (EUR/USD)
**Definition**: Total political donations and lobbying spend
**Transparency**: Must disclose recipients and amounts

### Whistleblower Protection
**Field**: `whistleblower_mechanism`
**Type**: Boolean
**Requirement**: Must have confidential reporting channel (EU Whistleblower Directive)

### Supply Chain Ethics
**Field**: `ethical_supply_chain_policy`
**Type**: Boolean
**Include**: Anti-corruption, human rights, environmental standards

---

## 🌱 EU Taxonomy Alignment (CSRD Mandatory)

The **EU Taxonomy** is a classification system for sustainable economic activities. CSRD requires companies to report Taxonomy alignment.

### Taxonomy-Eligible Activities
**Field**: `taxonomy_eligible_activities_percent`
**Unit**: Percentage (0-100)
**Definition**: % revenue from activities covered by the Taxonomy
**Note**: Activity is listed in Taxonomy (regardless of meeting criteria)

### Taxonomy-Aligned Activities
**Field**: `taxonomy_aligned_activities_percent`
**Unit**: Percentage (0-100)
**Definition**: % revenue from activities meeting ALL criteria:
1. **Substantial contribution** to at least 1 environmental objective
2. **Do no significant harm** (DNSH) to other 5 objectives
3. **Minimum social safeguards** met

### CapEx and OpEx Alignment
**Field**: `taxonomy_capex_alignment`
**Field**: `taxonomy_opex_alignment`
**Unit**: Percentage (0-100)
**Definition**: % capital/operating expenditure on Taxonomy-aligned activities

### EU Taxonomy 6 Environmental Objectives
1. Climate change mitigation
2. Climate change adaptation
3. Sustainable use and protection of water and marine resources
4. Transition to a circular economy
5. Pollution prevention and control
6. Protection and restoration of biodiversity and ecosystems

---

## 🔗 Value Chain Reporting (CSRD Requirement)

CSRD requires detailed value chain reporting, not just totals.

### Upstream Scope 3 Breakdown
**Field**: `upstream_scope3_detailed`
**Type**: JSONB
```json
{
  "purchased_goods_services": 12500000,
  "capital_goods": 3200000,
  "fuel_energy_activities": 1800000,
  "upstream_transportation": 950000,
  "waste_generated": 420000,
  "business_travel": 380000,
  "employee_commuting": 270000,
  "upstream_leased_assets": 150000
}
```

### Downstream Scope 3 Breakdown
**Field**: `downstream_scope3_detailed`
**Type**: JSONB
```json
{
  "downstream_transportation": 2100000,
  "processing_of_sold_products": 4500000,
  "use_of_sold_products": 18000000,
  "end_of_life_treatment": 890000,
  "downstream_leased_assets": 450000,
  "franchises": 0,
  "investments": 1200000
}
```

### Value Chain Engagement
**Field**: `value_chain_engagement_strategy`
**Type**: JSONB
```json
{
  "supplier_engagement": "Annual sustainability surveys + audits",
  "customer_engagement": "Product carbon footprint labeling",
  "targets_for_value_chain": "50% supplier Scope 3 reduction by 2030",
  "incentives": "Preferred supplier status for sustainability leaders"
}
```

---

## 🏆 CSRD Compliance Scoring

### Compliance Levels

**Level 5 - Full Compliance** (90-100 points):
- ✅ All 12 ESRS standards reported
- ✅ Double materiality assessment completed
- ✅ Climate transition plan published
- ✅ EU Taxonomy alignment disclosed
- ✅ External assurance obtained
- ✅ Digital tagging (ESEF/iXBRL) complete

**Level 4 - Strong Compliance** (75-89 points):
- ✅ 10+ ESRS standards reported
- ✅ Double materiality assessment
- ✅ Climate transition plan
- ⚠️ Partial Taxonomy disclosure
- ✅ External assurance

**Level 3 - Moderate Compliance** (60-74 points):
- ✅ Mandatory standards (ESRS 1, 2, E1)
- ✅ Double materiality assessment
- ⚠️ Some "apply or explain" omissions
- ⚠️ No external assurance yet

**Level 2 - Early Stage** (40-59 points):
- ⚠️ Partial compliance
- ⚠️ Missing double materiality
- ⚠️ No climate transition plan
- ❌ No external assurance

**Level 1 - Non-Compliant** (0-39 points):
- ❌ Does not meet minimum requirements
- ❌ Risk of penalties

---

## 💰 Business Opportunity for blipee OS

### Why CSRD is HUGE for Us

1. **50,000+ Companies Must Comply** (not optional)
   - Market size: €5-10 billion in compliance spending
   - Companies need tools to track and report CSRD

2. **Complexity Requires Software**
   - 12 ESRS standards with 1,000+ data points
   - Double materiality assessment is complex
   - Value chain data collection is hard
   - Manual compliance is impossible at scale

3. **External Audit Required**
   - Companies need audit-ready data
   - blipee OS provides traceable, auditable records
   - Justifies premium pricing

4. **Ongoing Annual Requirement**
   - Not one-time compliance
   - Recurring revenue opportunity
   - Companies need continuous tracking

5. **Penalties Create Urgency**
   - Non-compliance fines vary by EU country
   - Germany: Up to €10M or 5% revenue
   - Companies will pay to avoid this

### Pricing Opportunity

**CSRD Compliance Module** - Premium Add-On:
- **SME Tier**: €999/month
  - CSRD compliance dashboard
  - All 12 ESRS tracking
  - Double materiality assessment tool
  - Basic value chain tracking

- **Enterprise Tier**: €4,999/month
  - Everything in SME
  - Advanced value chain analytics
  - EU Taxonomy alignment calculator
  - Audit export functionality
  - Custom materiality workshops

- **Implementation Service**: €25,000-100,000
  - Initial CSRD gap analysis
  - Double materiality assessment facilitation
  - Data collection strategy
  - First year reporting support

**TAM (Total Addressable Market)**:
- 50,000 companies × €12,000-60,000/year = **€600M - €3B annual market**
- If blipee OS captures 1%: **€6-30M ARR**
- If blipee OS captures 5%: **€30-150M ARR**

---

## 🎯 Implementation Roadmap

### Phase 1: Data Capture (Now)
- ✅ Database schema extended with CSRD fields
- ✅ Parser updated to extract ESRS metrics
- ✅ Documentation created

### Phase 2: CSRD Dashboard (2-4 weeks)
- [ ] CSRD compliance status page
- [ ] ESRS standards coverage tracker
- [ ] Gap analysis (what's missing)
- [ ] Data quality score per ESRS

### Phase 3: Materiality Assessment Tool (4-6 weeks)
- [ ] Double materiality matrix
- [ ] Stakeholder impact assessment
- [ ] Financial materiality scoring
- [ ] Materiality report generator

### Phase 4: Value Chain Module (6-8 weeks)
- [ ] Supplier data collection forms
- [ ] Scope 3 breakdown calculator
- [ ] Value chain risk mapping
- [ ] Engagement tracking

### Phase 5: EU Taxonomy Calculator (8-10 weeks)
- [ ] Activity eligibility checker
- [ ] DNSH criteria assessment
- [ ] Alignment percentage calculator
- [ ] Taxonomy report generator

### Phase 6: Audit Export (10-12 weeks)
- [ ] ESEF/iXBRL tagging
- [ ] Audit trail functionality
- [ ] Evidence repository
- [ ] External assurance package

---

## 📚 Resources

### Official EU Resources
- **CSRD Directive**: [EUR-Lex](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022L2464)
- **ESRS Standards**: [EFRAG](https://www.efrag.org/lab6)
- **EU Taxonomy**: [Taxonomy Compass](https://ec.europa.eu/sustainable-finance-taxonomy/)

### Implementation Guidance
- **European Commission**: [CSRD Q&A](https://finance.ec.europa.eu/sustainable-finance/disclosures/sustainability-reporting-requirements_en)
- **EFRAG**: [Implementation Guidance](https://www.efrag.org/lab6)

### Useful Tools
- **Double Materiality Tool**: [GRI/EFRAG Tool](https://www.globalreporting.org/standards/standards-development/topic-standard-project-for-biodiversity/)
- **Taxonomy Navigator**: [EU Platform on Sustainable Finance](https://finance.ec.europa.eu/sustainable-finance/overview-sustainable-finance/platform-sustainable-finance_en)

---

## 🚀 Next Steps

1. **Update automated parser** to extract CSRD/ESRS metrics
2. **Build CSRD compliance dashboard** in blipee OS
3. **Create materiality assessment tool**
4. **Market to EU companies** facing 2025-2026 compliance deadlines
5. **Partner with audit firms** (Deloitte, EY, PwC, KPMG) as compliance tool

**This could be a €30-150M ARR opportunity by 2027!** 🎯

---

**Last Updated**: October 23, 2025
**Status**: Database ready, awaiting dashboard implementation
