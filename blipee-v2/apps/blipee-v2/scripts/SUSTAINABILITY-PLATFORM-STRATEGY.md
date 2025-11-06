# Comprehensive Sustainability Platform Strategy

## Vision
Build a sustainability platform that tracks ALL emissions for any organization, with automated calculations compliant with SDG, GHG Protocol, GRI, ESRS, and other frameworks.

---

## Compliance Requirements Analysis

### 1. **GHG Protocol** (Greenhouse Gas Protocol)
**What you need to track:**

**Scope 1** (Direct Emissions):
- Stationary combustion (boilers, furnaces, etc.)
- Mobile combustion (company vehicles, equipment)
- Process emissions (industrial processes)
- Fugitive emissions (refrigerants, leaks)

**Scope 2** (Indirect - Energy):
- Purchased electricity
- Purchased heat
- Purchased steam
- Purchased cooling

**Scope 3** (All Other Indirect):
1. Purchased goods and services
2. Capital goods
3. Fuel and energy-related activities
4. Upstream transportation
5. Waste generated
6. Business travel
7. Employee commuting
8. Upstream leased assets
9. Downstream transportation
10. Processing of sold products
11. Use of sold products
12. End-of-life treatment
13. Downstream leased assets
14. Franchises
15. Investments

### 2. **ESRS** (European Sustainability Reporting Standards)
**E1 - Climate Change Requirements:**
- Scope 1, 2, 3 GHG emissions (tCO2e)
- GHG intensity metrics
- Energy consumption (renewable vs non-renewable)
- Energy intensity
- Avoided emissions
- Climate-related financial impacts
- Transition plans

### 3. **GRI** (Global Reporting Initiative)
**Environmental Standards:**
- GRI 305: Emissions (Scope 1, 2, 3)
- GRI 302: Energy consumption
- GRI 306: Waste
- GRI 303: Water
- GRI 304: Biodiversity

### 4. **UN SDGs** (Sustainable Development Goals)
**Relevant Goals:**
- SDG 7: Affordable and Clean Energy
- SDG 12: Responsible Consumption and Production
- SDG 13: Climate Action

---

## Recommended Data Architecture

### **Layer 1: Data Collection APIs**

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA SOURCES LAYER                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Real-time Grid Data:                                        │
│  ├── Electricity Maps (Carbon + Renewable %)                │
│  └── ENTSO-E (Price data, backup grid data)                 │
│                                                              │
│  Emission Factors Database:                                  │
│  ├── Climatiq (330k+ factors, all scopes)         ⭐ PRIMARY│
│  └── CO2.js (backup, static averages)                       │
│                                                              │
│  Complementary Data:                                         │
│  ├── WattTime (if needed for other regions)                 │
│  └── Custom/Industry-specific factors                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### **Layer 2: Calculation Engine**

```typescript
// Your platform architecture
interface EmissionCalculation {
  source: 'climatiq' | 'electricity_maps' | 'entsoe' | 'custom'
  scope: 1 | 2 | 3
  category: GHGCategory
  activity: ActivityData
  emissionFactor: EmissionFactor
  result: CO2eResult
  auditTrail: AuditInfo
}
```

### **Layer 3: Compliance Reporting**

```
User Input → Calculation Engine → Framework Mapper → Report Output
                                         │
                                         ├── GHG Protocol Format
                                         ├── ESRS E1 Format
                                         ├── GRI 305 Format
                                         └── SDG Metrics
```

---

## Strategic API Usage Plan

### **Use Electricity Maps for:**
✅ **Scope 2 - Purchased Electricity** (Real-time grid data)
- Real-time carbon intensity
- Real-time renewable percentage
- Location-based emissions (hourly)
- Market-based emissions (with RECs)

**Why**: Most accurate, real-time grid data for Scope 2 compliance

---

### **Use ENTSO-E for:**
✅ **Scope 2 - Price Data & Validation**
- Day-ahead electricity prices
- Backup grid data (free)
- Official European grid operator data
- Historical data for backfill

**Why**: Free, official data, includes pricing for cost analysis

---

### **Use Climatiq for:**
✅ **Everything Else** (Scopes 1 & 3)

**Scope 1:**
- Fuel combustion (diesel, natural gas, etc.)
- Company vehicles
- Process emissions
- Fugitive emissions (refrigerants)

**Scope 3 (15 categories):**
- Purchased goods & services (spend-based)
- Business travel (flights, hotels, rental cars)
- Employee commuting
- Waste disposal
- Water usage
- Upstream/downstream transport
- Capital goods

**Why**:
- 330,000+ emission factors covering all activities
- GHG Protocol compliant
- Automated calculations
- Regular updates
- Audit-ready

---

### **Use CO2.js for:**
✅ **Historical Gap Filling** (when other APIs unavailable)
- Pre-2025 electricity data (annual averages)
- Backup/fallback calculations
- Quick estimates

**Why**: Free, simple, good for historical approximations

---

## Recommended Platform Architecture

### **Database Schema**

```sql
-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name TEXT,
  industry_sector TEXT,
  reporting_frameworks TEXT[], -- ['GHG', 'ESRS', 'GRI', 'SDG']
  fiscal_year_start DATE
);

-- Activity Data (User Inputs)
CREATE TABLE activity_data (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  activity_type TEXT, -- 'electricity', 'fuel', 'travel', 'waste', etc.
  scope INTEGER, -- 1, 2, or 3
  ghg_category TEXT, -- 'scope_3_category_1_purchased_goods'
  quantity NUMERIC,
  unit TEXT,
  date TIMESTAMPTZ,
  metadata JSONB
);

-- Emission Calculations
CREATE TABLE emission_calculations (
  id UUID PRIMARY KEY,
  activity_data_id UUID REFERENCES activity_data(id),
  data_source TEXT, -- 'climatiq', 'electricity_maps', 'entsoe'
  emission_factor_id TEXT, -- ID from source API
  emission_factor_value NUMERIC,
  emission_factor_unit TEXT,
  co2e_kg NUMERIC, -- Result
  co2e_breakdown JSONB, -- CO2, CH4, N2O breakdown
  calculation_method TEXT,
  calculation_date TIMESTAMPTZ,
  audit_trail JSONB
);

-- Grid Mix Snapshots (from Electricity Maps/ENTSO-E)
CREATE TABLE grid_mix_snapshots (
  id UUID PRIMARY KEY,
  zone TEXT,
  datetime TIMESTAMPTZ,
  carbon_intensity NUMERIC,
  renewable_percentage NUMERIC,
  fossil_free_percentage NUMERIC,
  price_day_ahead NUMERIC,
  power_breakdown JSONB,
  data_source TEXT, -- 'electricity_maps' or 'entsoe'
  captured_at TIMESTAMPTZ
);

-- Emission Factors Cache (from Climatiq)
CREATE TABLE emission_factors_cache (
  id UUID PRIMARY KEY,
  source TEXT, -- 'climatiq'
  activity_id TEXT,
  region TEXT,
  year INTEGER,
  factor_value NUMERIC,
  unit TEXT,
  source_dataset TEXT, -- 'EXIOBASE', 'ecoinvent', 'BEIS', etc.
  last_updated TIMESTAMPTZ,
  metadata JSONB
);
```

### **Calculation Flow**

```typescript
// Example: Calculate emissions for different activities

class EmissionCalculator {

  // Scope 2: Electricity
  async calculateElectricityEmissions(data: {
    consumption_kwh: number,
    location: string,
    datetime: Date
  }) {
    // Use Electricity Maps for real-time grid data
    const gridMix = await electricityMaps.getGridMix(data.location, data.datetime)

    const emissions = {
      co2e_kg: data.consumption_kwh * (gridMix.carbon_intensity / 1000),
      renewable_percentage: gridMix.renewable_percentage,
      scope: 2,
      category: 'purchased_electricity',
      source: 'electricity_maps',
      audit_trail: {
        grid_mix: gridMix,
        calculation_method: 'location_based'
      }
    }

    return emissions
  }

  // Scope 1: Fuel combustion
  async calculateFuelEmissions(data: {
    fuel_type: 'diesel' | 'natural_gas' | 'petrol',
    volume: number,
    unit: 'l' | 'm3',
    region: string
  }) {
    // Use Climatiq
    const result = await climatiq.estimate({
      emission_factor: {
        activity_id: `fuel-type_${data.fuel_type}`,
        region: data.region
      },
      parameters: {
        volume: data.volume,
        volume_unit: data.unit
      }
    })

    return {
      co2e_kg: result.co2e,
      scope: 1,
      category: 'stationary_combustion',
      source: 'climatiq',
      audit_trail: result
    }
  }

  // Scope 3.6: Business Travel
  async calculateFlightEmissions(data: {
    origin: string,
    destination: string,
    passengers: number,
    cabin_class: 'economy' | 'business'
  }) {
    // Use Climatiq
    const result = await climatiq.estimate({
      emission_factor: {
        activity_id: `passenger_flight-route_type_${this.getRouteType(data)}`,
        data_version: '^8'
      },
      parameters: {
        passengers: data.passengers,
        departure_airport: data.origin,
        destination_airport: data.destination,
        cabin_class: data.cabin_class
      }
    })

    return {
      co2e_kg: result.co2e,
      scope: 3,
      category: 'business_travel',
      ghg_category: 'scope_3_category_6',
      source: 'climatiq',
      audit_trail: result
    }
  }

  // Scope 3.1: Purchased Goods (spend-based)
  async calculatePurchasedGoodsEmissions(data: {
    spend_amount: number,
    currency: string,
    category: string,
    region: string
  }) {
    // Use Climatiq Procurement endpoint
    const result = await climatiq.procurement({
      money: data.spend_amount,
      money_unit: data.currency,
      purchase_category: data.category,
      region: data.region
    })

    return {
      co2e_kg: result.co2e,
      scope: 3,
      category: 'purchased_goods_services',
      ghg_category: 'scope_3_category_1',
      source: 'climatiq',
      calculation_method: 'spend_based',
      audit_trail: result
    }
  }
}
```

---

## Framework Compliance Mapping

### **GHG Protocol Compliance**

```typescript
interface GHGProtocolReport {
  reporting_period: {
    start_date: Date
    end_date: Date
  }
  organizational_boundary: 'operational_control' | 'financial_control' | 'equity_share'

  scope_1: {
    total_co2e_tonnes: number
    categories: {
      stationary_combustion: number
      mobile_combustion: number
      process_emissions: number
      fugitive_emissions: number
    }
    methodology: string
    emission_factors_used: EmissionFactor[]
  }

  scope_2: {
    location_based: {
      total_co2e_tonnes: number
      electricity: number
      heat_steam: number
    }
    market_based: {
      total_co2e_tonnes: number
      electricity: number
      heat_steam: number
      renewable_energy_certificates: REC[]
    }
    methodology: string
    grid_data_source: 'electricity_maps' | 'entsoe'
  }

  scope_3: {
    total_co2e_tonnes: number
    categories: {
      category_1_purchased_goods: number
      category_2_capital_goods: number
      category_3_fuel_energy: number
      category_4_upstream_transport: number
      category_5_waste: number
      category_6_business_travel: number
      category_7_commuting: number
      // ... all 15 categories
    }
    methodology: string
    data_quality_assessment: string
  }

  total_emissions: number
  audit_trail: AuditInfo
}
```

### **ESRS E1 Climate Change Compliance**

```typescript
interface ESRSReport {
  // E1-1: Transition plan
  transition_plan: {
    ghg_reduction_targets: Target[]
    decarbonization_levers: string[]
    investments_planned: Investment[]
  }

  // E1-6: Gross Scopes 1, 2, 3 and Total GHG emissions
  emissions: {
    scope_1_gross: number
    scope_2_gross_location_based: number
    scope_2_gross_market_based: number
    scope_3_gross: number
    total_ghg_emissions: number
    base_year: number
    base_year_emissions: number
  }

  // E1-5: Energy consumption and mix
  energy: {
    total_energy_consumption: number
    renewable_energy_consumption: number
    renewable_percentage: number
    energy_intensity: number
  }

  // Additional ESRS requirements
  ghg_removals: number
  ghg_intensity: number
  internal_carbon_price: number
}
```

---

## Cost Analysis

### **Recommended API Stack**

| API | Usage | Est. Monthly Cost |
|-----|-------|------------------|
| **Electricity Maps** | Grid data (10k calls/month) | ~€50-100 (free tier: limited) |
| **ENTSO-E** | Price data, backup grid data | FREE |
| **Climatiq** | All Scope 1 & 3 calculations | €200-500 (depends on volume) |
| **CO2.js** | Historical backfill | FREE |
| **Total** | | **€250-600/month** |

### **Cost Optimization Strategies**

1. **Cache aggressively**
   - Grid mix data: Cache hourly snapshots
   - Emission factors: Cache for 1 year (they don't change often)
   - Calculations: Store results, don't recalculate

2. **Batch operations**
   - Collect daily activities, calculate in batches
   - Use Climatiq batch endpoints

3. **Smart routing**
   - Use ENTSO-E (free) when possible
   - Fall back to Electricity Maps for missing data
   - Use CO2.js for historical gaps

4. **Tiered pricing for users**
   ```
   Basic Plan: Limited calculations, annual reporting
   Pro Plan: Monthly reporting, all scopes
   Enterprise: Real-time dashboards, API access, custom factors
   ```

---

## Implementation Roadmap

### **Phase 1: Foundation (Months 1-2)**
✅ Core infrastructure
- Database schema
- Calculation engine architecture
- API integrations (Electricity Maps, ENTSO-E, Climatiq)
- User authentication & organization management

### **Phase 2: Scope 2 Compliance (Month 3)**
✅ Electricity emissions tracking
- Real-time grid data integration
- Location-based methodology
- Market-based methodology (with RECs)
- Basic GHG Protocol reporting

### **Phase 3: Scope 1 & 3 (Months 4-6)**
✅ Comprehensive emissions tracking
- Fuel consumption (Scope 1)
- Business travel (Scope 3.6)
- Purchased goods (Scope 3.1)
- Waste (Scope 3.5)
- Water usage
- Other Scope 3 categories

### **Phase 4: Compliance Reporting (Months 7-8)**
✅ Framework-compliant reports
- GHG Protocol reports
- ESRS E1 reports
- GRI reports
- SDG metrics
- Audit trails

### **Phase 5: Automation & AI (Months 9-12)**
✅ Advanced features
- Climatiq Autopilot integration (invoice parsing)
- Automated data collection
- Predictive analytics
- Carbon reduction recommendations

### **Phase 6: Enterprise Features (Year 2)**
✅ Scale & enhance
- Supply chain emissions (Scope 3.4, 3.9)
- Product carbon footprints
- Custom emission factors
- White-label solutions
- API for customers

---

## Decision Matrix

### **For Electricity (Scope 2)**

| Requirement | Electricity Maps | ENTSO-E | Climatiq |
|-------------|-----------------|---------|----------|
| Real-time carbon intensity | ✅ Best | ✅ Good | ❌ Static |
| Real-time renewable % | ✅ Best | ⚙️ Calculate | ❌ Static |
| Price data | ❌ Paid tier | ✅ Free | ❌ No |
| Historical data | ❌ Paid tier | ✅ Free | ✅ Static avg |
| **Recommendation** | **Primary** | **Backup/Price** | **Fallback** |

### **For All Other Emissions**

| Requirement | Climatiq | CO2.js | Custom |
|-------------|----------|--------|--------|
| Scope 1 factors | ✅ 1000s | ❌ Limited | ⚙️ Build |
| Scope 3 factors | ✅ 1000s | ❌ Limited | ⚙️ Build |
| Compliance-ready | ✅ Yes | ⚙️ Partial | ⚙️ You ensure |
| Audit trail | ✅ Yes | ❌ No | ⚙️ Build |
| Updates | ✅ Regular | ⚙️ Periodic | ⚙️ Manual |
| **Recommendation** | **✅ Primary** | **Fallback** | **Special cases** |

---

## Final Recommendation

### **Your API Stack**

```typescript
// Recommended architecture
const sustainabilityPlatform = {

  // Scope 2: Electricity
  electricity: {
    primary: 'Electricity Maps',     // Real-time grid data
    backup: 'ENTSO-E',               // Free alternative, price data
    historical_gap: 'CO2.js'         // Pre-2025 data
  },

  // Scope 1 & 3: Everything else
  otherEmissions: {
    primary: 'Climatiq',             // 330k+ emission factors
    backup: 'CO2.js',                // Simple calculations
    custom: 'Your own factors'       // Industry-specific
  },

  // Cost optimization
  caching: {
    grid_mix: 'Cache hourly',
    emission_factors: 'Cache 1 year',
    calculations: 'Store results'
  }
}
```

### **Why This Approach**

1. **Compliance**: Covers all GHG Protocol scopes, ESRS, GRI, SDG
2. **Accuracy**: Real-time data where it matters, validated factors everywhere
3. **Cost-effective**: Mix of free (ENTSO-E, CO2.js) and paid (Electricity Maps, Climatiq)
4. **Scalable**: APIs handle the complexity, you focus on UX
5. **Audit-ready**: Climatiq provides audit trails, you store calculations
6. **Future-proof**: Can add more data sources as needed

---

## Next Steps

### **Immediate (This Week)**
1. ✅ Deploy Electricity Maps integration (already built!)
2. ✅ Sign up for Climatiq (get API key, test free tier)
3. ✅ Register for ENTSO-E (free API access)
4. ✅ Finalize database schema

### **Short-term (This Month)**
1. Build calculation engine framework
2. Implement Scope 2 (electricity) fully
3. Test Climatiq integration for Scope 1 & 3
4. Create first GHG Protocol report template

### **Medium-term (Next 3 Months)**
1. Add all Scope 1 categories
2. Add primary Scope 3 categories (1, 6, 5)
3. Build compliance report generators
4. Launch beta with pilot customers

---

**Bottom Line**: You need **both** Electricity Maps (or ENTSO-E) AND Climatiq to build a comprehensive sustainability platform. They serve different but complementary purposes.

- **Electricity Maps/ENTSO-E**: Real-time grid data (Scope 2)
- **Climatiq**: Emission factors for everything else (Scopes 1 & 3)
- **CO2.js**: Historical gaps and simple calculations

Ready to start building?
