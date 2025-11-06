# GRI Comprehensive Coverage Strategy

## GRI Standards Overview

GRI has **3 main series** covering **33 topic-specific standards**:

### Universal Standards (GRI 1, 2, 3)
- Foundation, General Disclosures, Material Topics

### Topic-Specific Standards

#### 200 Series: Economic (7 standards)
- GRI 201: Economic Performance
- GRI 202: Market Presence
- GRI 203: Indirect Economic Impacts
- GRI 204: Procurement Practices
- GRI 205: Anti-corruption
- GRI 206: Anti-competitive Behavior
- GRI 207: Tax

#### 300 Series: Environmental (8 standards) ⭐ **Our Focus**
- **GRI 301: Materials**
- **GRI 302: Energy** ⚡ (Climatiq + Electricity Maps)
- **GRI 303: Water and Effluents** 💧
- **GRI 304: Biodiversity** 🌱
- **GRI 305: Emissions** 🌍 (Climatiq core strength)
- **GRI 306: Waste** ♻️
- **GRI 307: Environmental Compliance**
- **GRI 308: Supplier Environmental Assessment**

#### 400 Series: Social (19 standards)
- GRI 401-418: Employment, Health & Safety, Diversity, Human Rights, Communities, etc.

---

## Phase 1: Environmental Standards (300 Series)

### GRI 302: Energy ⚡

**What's Required:**

**302-1: Energy consumption within the organization**
- Total fuel consumption (renewable + non-renewable)
- Electricity, heating, cooling, steam purchased
- Self-generated energy (solar, wind, etc.)
- Energy sold

**302-2: Energy consumption outside the organization**

**302-3: Energy intensity**
- Energy / revenue, production, employees, etc.

**302-4: Reduction of energy consumption**

**302-5: Reductions in energy requirements of products and services**

#### **Data Sources & Automation:**

```typescript
interface GRI302Data {
  // 302-1: Internal consumption
  fuelConsumption: {
    nonRenewable: {
      naturalGas: { value: number, unit: 'GJ' },
      diesel: { value: number, unit: 'GJ' },
      gasoline: { value: number, unit: 'GJ' },
      coal: { value: number, unit: 'GJ' }
    },
    renewable: {
      biogas: { value: number, unit: 'GJ' },
      biomass: { value: number, unit: 'GJ' }
    }
  },

  electricityPurchased: {
    total: { value: number, unit: 'kWh' },
    renewable: { value: number, unit: 'kWh' },  // From Electricity Maps
    nonRenewable: { value: number, unit: 'kWh' }
  },

  selfGenerated: {
    solar: { value: number, unit: 'kWh' },
    wind: { value: number, unit: 'kWh' }
  },

  // 302-3: Intensity metrics
  intensity: {
    energyPerRevenue: { value: number, unit: 'GJ/€' },
    energyPerEmployee: { value: number, unit: 'GJ/FTE' },
    energyPerSquareMeter: { value: number, unit: 'GJ/m²' }
  }
}

// Automation Level: 80%
// - Electricity grid mix: Automated via Electricity Maps
// - Fuel consumption: Manual input → Automated calculation via Climatiq
// - Self-generation: IoT sensors or manual input
```

---

### GRI 305: Emissions 🌍 ⭐ **Climatiq's Core Strength**

**What's Required:**

**305-1: Direct (Scope 1) GHG emissions**
- Gross emissions in metric tons of CO2e
- Gases included (CO2, CH4, N2O, HFCs, PFCs, SF6, NF3)
- Biogenic CO2 emissions separately

**305-2: Energy indirect (Scope 2) GHG emissions**
- Location-based method
- Market-based method

**305-3: Other indirect (Scope 3) GHG emissions**
- All 15 categories

**305-4: GHG emissions intensity**

**305-5: Reduction of GHG emissions**

**305-6: Emissions of ozone-depleting substances (ODS)**

**305-7: Nitrogen oxides (NOx), sulfur oxides (SOx), and other significant air emissions**

#### **Data Sources & Automation:**

```typescript
interface GRI305Data {
  // 305-1: Scope 1 (Direct emissions)
  scope1: {
    stationaryCombustion: {
      naturalGas: { co2e: number, co2: number, ch4: number, n2o: number },
      diesel: { co2e: number, co2: number, ch4: number, n2o: number }
    },
    mobileCombustion: {
      companyVehicles: { co2e: number, breakdown: GasBreakdown }
    },
    processEmissions: {
      // Manufacturing, chemical processes
    },
    fugitiveEmissions: {
      refrigerants: { co2e: number }  // HFCs, PFCs
    },
    biogenicCO2: { value: number }  // Reported separately
  },

  // 305-2: Scope 2 (Electricity)
  scope2: {
    locationBased: {
      electricity: { co2e: number, source: 'Electricity Maps' },
      heating: { co2e: number },
      cooling: { co2e: number }
    },
    marketBased: {
      electricity: { co2e: number },  // With RECs
      greenTariff: { co2e: number }
    }
  },

  // 305-3: Scope 3 (Value chain)
  scope3: {
    cat1_purchasedGoods: { co2e: number },      // Climatiq
    cat2_capitalGoods: { co2e: number },        // Climatiq
    cat3_fuelEnergy: { co2e: number },          // Climatiq
    cat4_upstreamTransport: { co2e: number },   // Climatiq
    cat5_waste: { co2e: number },               // Climatiq
    cat6_businessTravel: { co2e: number },      // Climatiq (flights, hotels)
    cat7_commuting: { co2e: number },           // Climatiq
    cat8_upstreamLeased: { co2e: number },
    cat9_downstreamTransport: { co2e: number },
    cat10_processing: { co2e: number },
    cat11_useOfProducts: { co2e: number },
    cat12_endOfLife: { co2e: number },
    cat13_downstreamLeased: { co2e: number },
    cat14_franchises: { co2e: number },
    cat15_investments: { co2e: number }
  },

  // 305-4: Intensity
  intensity: {
    emissionsPerRevenue: { value: number, unit: 'tCO2e/€M' },
    emissionsPerEmployee: { value: number, unit: 'tCO2e/FTE' },
    emissionsPerProduct: { value: number, unit: 'tCO2e/unit' }
  },

  // 305-6: ODS emissions
  odsEmissions: {
    cfc11Equivalent: { value: number, unit: 'kg' }
  },

  // 305-7: Other air emissions
  airEmissions: {
    nox: { value: number, unit: 'kg' },
    sox: { value: number, unit: 'kg' },
    pm: { value: number, unit: 'kg' },  // Particulate matter
    voc: { value: number, unit: 'kg' }  // Volatile organic compounds
  }
}

// Automation Level: 90%+
// - Scope 1, 2, 3: Fully automated via Climatiq
// - Gas breakdown: Automated via Climatiq
// - Intensity metrics: Automated calculations
// - ODS/Air emissions: Manual input (specialized equipment data)
```

---

### GRI 303: Water and Effluents 💧

**What's Required:**

**303-1: Interactions with water as a shared resource**

**303-2: Management of water discharge-related impacts**

**303-3: Water withdrawal**
- By source (surface, groundwater, seawater, produced water, third-party)
- In water-stressed areas

**303-4: Water discharge**
- By destination
- By treatment level

**303-5: Water consumption**

#### **Data Sources & Automation:**

```typescript
interface GRI303Data {
  // 303-3: Water withdrawal
  withdrawal: {
    surfaceWater: { value: number, unit: 'ML' },      // Megaliters
    groundwater: { value: number, unit: 'ML' },
    seawater: { value: number, unit: 'ML' },
    producedWater: { value: number, unit: 'ML' },
    thirdParty: { value: number, unit: 'ML' },

    inWaterStressedAreas: { value: number, unit: 'ML' }  // WRI Aqueduct tool
  },

  // 303-4: Water discharge
  discharge: {
    surfaceWater: { value: number, unit: 'ML' },
    groundwater: { value: number, unit: 'ML' },
    seawater: { value: number, unit: 'ML' },
    thirdParty: { value: number, unit: 'ML' },

    treatment: {
      primary: { value: number },
      secondary: { value: number },
      tertiary: { value: number },
      noTreatment: { value: number }
    }
  },

  // 303-5: Water consumption
  consumption: {
    total: { value: number, unit: 'ML' },  // Withdrawal - Discharge
    inWaterStressedAreas: { value: number, unit: 'ML' }
  }
}

// Automation Level: 30%
// - Water meters: IoT integration or manual input
// - Water stress areas: Automated via WRI Aqueduct API
// - Calculations: Automated (withdrawal - discharge = consumption)
// - Treatment levels: Manual input or wastewater system data
```

---

### GRI 306: Waste ♻️

**What's Required:**

**306-1: Waste generation and significant waste-related impacts**

**306-2: Management of significant waste-related impacts**

**306-3: Waste generated**
- By composition
- By hazardousness

**306-4: Waste diverted from disposal**
- By recovery operation (reuse, recycling, composting)

**306-5: Waste directed to disposal**
- By disposal operation (incineration, landfill, etc.)

#### **Data Sources & Automation:**

```typescript
interface GRI306Data {
  // 306-3: Waste generated
  generated: {
    byComposition: {
      plastic: { value: number, unit: 'tonnes' },
      paper: { value: number, unit: 'tonnes' },
      metal: { value: number, unit: 'tonnes' },
      glass: { value: number, unit: 'tonnes' },
      organic: { value: number, unit: 'tonnes' },
      electronic: { value: number, unit: 'tonnes' },
      hazardous: { value: number, unit: 'tonnes' },
      other: { value: number, unit: 'tonnes' }
    },

    byHazardousness: {
      hazardous: { value: number, unit: 'tonnes' },
      nonHazardous: { value: number, unit: 'tonnes' }
    }
  },

  // 306-4: Diverted from disposal
  diverted: {
    reuse: { value: number, unit: 'tonnes' },
    recycling: { value: number, unit: 'tonnes' },
    composting: { value: number, unit: 'tonnes' },
    recovery: { value: number, unit: 'tonnes' }
  },

  // 306-5: Directed to disposal
  disposal: {
    incineration: {
      value: number,
      unit: 'tonnes',
      emissions: { co2e: number }  // Via Climatiq waste factors
    },
    landfill: {
      value: number,
      unit: 'tonnes',
      emissions: { co2e: number }  // Via Climatiq waste factors
    },
    other: { value: number, unit: 'tonnes' }
  },

  // Diversion rate calculation
  diversionRate: {
    percentage: number,  // (Diverted / Total) × 100
    target: number,
    yearOverYear: number
  }
}

// Automation Level: 50%
// - Waste weights: Manual input or waste contractor data
// - Diversion rates: Automated calculations
// - Waste emissions: Automated via Climatiq waste disposal factors
// - Composition: Manual categorization or waste audit data
```

---

### GRI 301: Materials

**What's Required:**

**301-1: Materials used by weight or volume**
- Renewable materials
- Non-renewable materials

**301-2: Recycled input materials used**

**301-3: Reclaimed products and their packaging materials**

#### **Data Sources & Automation:**

```typescript
interface GRI301Data {
  // 301-1: Materials used
  materials: {
    renewable: {
      paper: { value: number, unit: 'tonnes', recycled: number },
      wood: { value: number, unit: 'tonnes', recycled: number },
      bioplastics: { value: number, unit: 'tonnes', recycled: number }
    },
    nonRenewable: {
      metals: { value: number, unit: 'tonnes', recycled: number },
      plastics: { value: number, unit: 'tonnes', recycled: number },
      minerals: { value: number, unit: 'tonnes', recycled: number }
    }
  },

  // 301-2: Recycled content percentage
  recycledInputs: {
    percentage: number,  // (Recycled materials / Total materials) × 100
    byMaterial: {
      paper: { percentage: number },
      metals: { percentage: number },
      plastics: { percentage: number }
    }
  },

  // 301-3: Reclaimed products
  reclaimed: {
    products: { value: number, unit: 'units' },
    packaging: { value: number, unit: 'tonnes' },
    reclaimedPercentage: number
  }
}

// Automation Level: 20%
// - Materials data: Manual input from procurement/manufacturing
// - Calculations: Automated (percentages, totals)
// - Potential: Integration with ERP/procurement systems
```

---

### GRI 304: Biodiversity 🌱

**What's Required:**

**304-1: Operational sites owned, leased, managed in, or adjacent to, protected areas**

**304-2: Significant impacts of activities, products, and services on biodiversity**

**304-3: Habitats protected or restored**

**304-4: IUCN Red List species in areas affected by operations**

#### **Data Sources & Automation:**

```typescript
interface GRI304Data {
  // 304-1: Sites near protected areas
  sites: {
    inProtectedAreas: number,
    adjacentToProtectedAreas: number,
    highBiodiversityAreas: number,

    details: Array<{
      siteName: string,
      location: { lat: number, lon: number },
      protectedAreaType: string,  // UNESCO, Ramsar, national park, etc.
      areaSize: { value: number, unit: 'hectares' }
    }>
  },

  // 304-2: Impacts
  impacts: {
    habitatLoss: { description: string, severity: 'low' | 'medium' | 'high' },
    speciesAffected: { count: number, iucnRedList: number },
    mitigationMeasures: string[]
  },

  // 304-3: Habitats protected/restored
  conservation: {
    protected: { value: number, unit: 'hectares' },
    restored: { value: number, unit: 'hectares' },
    ongoing: { value: number, unit: 'hectares' }
  },

  // 304-4: IUCN Red List species
  species: Array<{
    scientificName: string,
    iucnStatus: 'CR' | 'EN' | 'VU' | 'NT' | 'LC',  // Critically Endangered, Endangered, etc.
    populationTrend: 'increasing' | 'stable' | 'decreasing',
    conservationActions: string[]
  }>
}

// Automation Level: 10%
// - Site locations: From sites database
// - Protected areas check: API integration with UNEP-WCMC or similar
// - Species data: Manual input from biodiversity assessments
// - Mostly manual narrative reporting
```

---

### GRI 307: Environmental Compliance

**What's Required:**

**307-1: Non-compliance with environmental laws and regulations**
- Significant fines
- Non-monetary sanctions

#### **Data Sources & Automation:**

```typescript
interface GRI307Data {
  nonCompliance: {
    significantFines: {
      count: number,
      totalValue: { value: number, currency: 'EUR' },
      incidents: Array<{
        date: Date,
        regulation: string,
        description: string,
        fineAmount: number,
        status: 'resolved' | 'ongoing' | 'appealed'
      }>
    },

    nonMonetarySanctions: {
      count: number,
      types: Array<{
        type: string,  // Warning, permit suspension, etc.
        date: Date,
        description: string
      }>
    }
  }
}

// Automation Level: 5%
// - Mostly manual input from legal/compliance team
// - Potential: Integration with compliance management systems
```

---

### GRI 308: Supplier Environmental Assessment

**What's Required:**

**308-1: New suppliers that were screened using environmental criteria**

**308-2: Negative environmental impacts in the supply chain and actions taken**

#### **Data Sources & Automation:**

```typescript
interface GRI308Data {
  // 308-1: Supplier screening
  screening: {
    newSuppliers: { count: number },
    screenedSuppliers: { count: number },
    screeningPercentage: number,  // (Screened / Total) × 100

    criteria: string[]  // Environmental management system, certifications, etc.
  },

  // 308-2: Negative impacts
  impacts: {
    suppliersIdentified: { count: number },
    suppliersAssessed: { count: number },
    significantImpacts: Array<{
      supplier: string,
      impactType: string,
      severity: 'low' | 'medium' | 'high',
      actionTaken: string,
      status: 'ongoing' | 'resolved' | 'terminated'
    }>,

    relationshipsTerminated: { count: number }
  }
}

// Automation Level: 30%
// - Supplier counts: From procurement database
// - Screening flags: Automated from supplier management system
// - Impact assessments: Manual input from sustainability team
```

---

## Phase 2: Economic & Social Standards

### Economic Standards (200 Series)

Most require **financial data + narrative reporting**. Limited automation potential except:

**GRI 204: Procurement Practices**
- Can track % local suppliers from procurement database
- Automation: 50%

**GRI 207: Tax**
- Can extract from financial systems
- Automation: 60%

### Social Standards (400 Series)

Most require **HR data + policies + narrative reporting**:

**High Automation Potential:**
- **GRI 401: Employment** (turnover, new hires) - 70% via HR system
- **GRI 404: Training** (hours per employee) - 60% via LMS
- **GRI 405: Diversity** (gender, age breakdown) - 80% via HR system

**Medium Automation Potential:**
- **GRI 403: Health & Safety** (injury rates) - 40% via incident reporting system
- **GRI 418: Customer Privacy** (data breaches) - 30% via security systems

**Low Automation Potential:**
- Most other 400 series require narrative, policies, grievance mechanisms
- Automation: 10-20%

---

## Implementation Priority

### Priority 1: GRI 305 (Emissions) - **NOW**
**Why:** Climatiq provides 90% automation
- ✅ Scope 1, 2, 3 calculations
- ✅ Gas breakdown (CO2, CH4, N2O)
- ✅ Intensity metrics
- ✅ Source attribution

**Timeline:** 2-3 weeks
**API Budget:** 100 calls (setup), 10/month (ongoing)

### Priority 2: GRI 302 (Energy) - **Week 4**
**Why:** High automation via Electricity Maps + Climatiq
- ✅ Grid renewable percentage
- ✅ Fuel consumption → emissions
- ✅ Energy intensity calculations

**Timeline:** 1 week
**API Budget:** Covered by Priority 1

### Priority 3: GRI 306 (Waste) - **Week 5-6**
**Why:** Climatiq has waste disposal factors
- ✅ Waste → emissions calculations
- ⚙️ Manual waste weights
- ✅ Diversion rate calculations

**Timeline:** 1 week
**API Budget:** 20 calls (waste factor types)

### Priority 4: GRI 303 (Water) - **Week 7-8**
**Why:** Some automation possible
- ⚙️ Manual water meter readings
- ✅ Water stress area detection (WRI Aqueduct API)
- ✅ Consumption calculations

**Timeline:** 1 week
**New API:** WRI Aqueduct (free)

### Priority 5: GRI 301 (Materials) - **Week 9**
**Why:** Limited automation
- ⚙️ Manual material tracking
- ✅ Percentage calculations
- 🔄 Potential ERP integration

**Timeline:** 1 week

### Priority 6: GRI 304, 307, 308 - **Week 10-12**
**Why:** Mostly manual/narrative
- ⚙️ Manual data entry
- ✅ Structured data collection
- ✅ Report generation

**Timeline:** 2-3 weeks

### Priority 7: Social Standards (401, 403-405) - **Later**
**Why:** Depends on HR system integration
- 🔄 HR system API integration
- ⚙️ Policy management
- ✅ Metrics calculations

**Timeline:** 4-6 weeks

---

## Database Schema for GRI Tracking

```sql
-- GRI metrics master table
CREATE TABLE gri_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  reporting_year INTEGER NOT NULL,
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,

  -- GRI 302: Energy
  energy_data JSONB,  -- Structured as per GRI302Data interface

  -- GRI 305: Emissions
  emissions_data JSONB,  -- Structured as per GRI305Data interface

  -- GRI 303: Water
  water_data JSONB,

  -- GRI 306: Waste
  waste_data JSONB,

  -- GRI 301: Materials
  materials_data JSONB,

  -- GRI 304: Biodiversity
  biodiversity_data JSONB,

  -- GRI 307: Compliance
  compliance_data JSONB,

  -- GRI 308: Supplier
  supplier_data JSONB,

  -- Metadata
  data_quality_score NUMERIC,  -- 0-100
  completeness_percentage NUMERIC,  -- % of required fields filled
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES users(id),
  verification_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GRI report generation tracking
CREATE TABLE gri_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  reporting_year INTEGER NOT NULL,

  -- Report metadata
  report_type TEXT NOT NULL,  -- 'core' or 'comprehensive'
  standards_version TEXT NOT NULL,  -- 'GRI 2021'

  -- Coverage
  standards_covered TEXT[],  -- ['GRI 302', 'GRI 305', ...]
  completeness JSONB,  -- Per-standard completeness %

  -- Export formats
  pdf_url TEXT,
  excel_url TEXT,
  json_data JSONB,

  -- Status
  status TEXT NOT NULL,  -- 'draft', 'review', 'final', 'submitted'
  published_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- GRI data sources tracking (for audit)
CREATE TABLE gri_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id UUID REFERENCES gri_metrics(id),

  gri_disclosure TEXT NOT NULL,  -- '305-1', '302-3', etc.
  data_point TEXT NOT NULL,  -- 'scope1.naturalGas.co2e'

  source_type TEXT NOT NULL,  -- 'climatiq_api', 'manual_input', 'iot_sensor', 'erp_system'
  source_reference TEXT,  -- API call ID, sensor ID, document reference

  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,

  collected_at TIMESTAMPTZ NOT NULL,
  collected_by UUID REFERENCES users(id),

  verification_status TEXT,  -- 'unverified', 'verified', 'third_party_verified'
  verification_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Summary: GRI Coverage Roadmap

### Immediate (Month 1-2): Environmental Core
**Standards:** GRI 302, 305, 306
**Automation:** 70-90%
**API Budget:** 150 calls setup, 15/month ongoing
**Coverage:** Covers mandatory environmental disclosures

### Near-term (Month 3): Environmental Complete
**Standards:** GRI 301, 303, 304, 307, 308
**Automation:** 20-40%
**API Budget:** 50 calls setup, 5/month ongoing
**Coverage:** Full GRI 300 series

### Future (Month 4-6): Economic & Social
**Standards:** Selected GRI 200, 400 series
**Automation:** 30-60% (depends on integrations)
**API Budget:** Minimal (mostly HR/financial data)
**Coverage:** Comprehensive GRI reporting

### Long-term: Full Compliance
**Standards:** All material GRI topics
**Automation:** 50% average across all standards
**Coverage:** Complete GRI sustainability report

**Result:** V2 becomes a comprehensive GRI reporting platform, not just an emissions calculator!
