# blipee OS v1 → v2 Migration & API Strategy

## What You Already Have (v1)

### ✅ Comprehensive Sustainability Platform

Your v1 README shows you ALREADY have:

```
✅ Emissions Tracking - Automated Scope 1/2/3 calculations (15+ categories)
✅ Energy Management - Real-time monitoring, anomaly detection, forecasting
✅ Water & Waste Analytics - Complete tracking and diversion metrics
✅ Supply Chain Analysis - Vendor sustainability scoring
✅ Compliance Automation - GHG, GRI, ESRS coverage
✅ ESG Reporting - Science-based targets, progress tracking
✅ AI Agents - 8 autonomous agents for intelligence
✅ External Integrations - Weather APIs, carbon data providers
```

### 🔍 Key Finding: You Already Use Electricity Maps!

From your v1 `.env.example`:
```env
# Optional - External Services
ELECTRICITY_MAPS_API_KEY=carbon_key
```

**This means:**
- You already have Electricity Maps integration architecture
- The API strategy discussion is about ENHANCING, not building from scratch
- You need to understand what ELSE to add (Climatiq, ENTSO-E, etc.)

---

## What's Different in v2?

Based on the current v2 codebase I'm working in, v2 appears to be a **focused rebuild** with:

1. **Cleaner architecture** (removing Redis complexity?)
2. **Simplified organization/sites structure**
3. **Better dashboard UX**
4. **Streamlined compliance reporting**

**Question**: What's the primary goal of v2?
- Complete rewrite with same features?
- Focused MVP with specific features?
- Different target market?

---

## API Strategy for v2 (Informed by v1 Experience)

### Your v1 External Integrations

```typescript
// From v1 README - External Services
interface V1ExternalAPIs {
  weather: 'OPENWEATHERMAP_API_KEY',
  carbon: 'ELECTRICITY_MAPS_API_KEY',
  // What else is integrated?
}
```

### Recommended v2 API Stack

Based on your v1 experience + compliance needs:

```typescript
// v2 External Data Layer
const v2APIStack = {

  // Scope 2: Electricity (ENHANCED from v1)
  electricity: {
    primary: 'Electricity Maps',        // You already use this
    enhancements: {
      priceData: 'ENTSO-E',             // NEW: Free price data
      historicalBackfill: 'CO2.js',     // NEW: Fill pre-2025 gaps
      validation: 'ENTSO-E'             // NEW: Cross-check official data
    }
  },

  // Scope 1 & 3: All Other Emissions (NEW for v2)
  emissionFactors: {
    primary: 'Climatiq',                // NEW: 330k+ factors
    benefits: {
      scope1: 'Fuel, vehicles, processes',
      scope3: 'All 15 categories',
      compliance: 'GHG Protocol ready',
      auditTrail: 'Built-in',
      updates: 'Automatic'
    },
    alternative: 'Build your own DB',   // What did v1 do?
  },

  // Weather (KEEP from v1)
  weather: 'OpenWeatherMap',            // Already integrated

  // AI (from v1)
  ai: {
    primary: 'DeepSeek R1',
    fallback: ['OpenAI GPT-4', 'Anthropic Claude']
  }
}
```

---

## Critical Questions About v1

### 1. **How Do You Currently Handle Emission Factors?**

In v1, for Scope 1 & 3 calculations, do you:

**Option A**: Have a custom database of emission factors?
```typescript
// Did you build this in v1?
const emissionFactors = {
  'diesel-portugal': { co2: 2.68, ch4: 0.1, n2o: 0.01 },
  'natural_gas-portugal': { ... },
  'flight-short_haul': { ... },
  // ... thousands more?
}
```

**Option B**: Use an API like Climatiq?

**Option C**: Use static data from government sources (BEIS, EPA)?

**Option D**: Let users input their own factors?

### 2. **What's the Electricity Maps Integration in v1?**

```typescript
// What does v1 do with Electricity Maps?

// Option A: Real-time grid carbon intensity?
const gridCarbon = await electricityMaps.getCarbonIntensity('PT')

// Option B: Historical data for calculations?
const historicalGrid = await electricityMaps.getHistorical(...)

// Option C: Just for display/reference?
```

### 3. **How Complete is v1's Scope 3 Tracking?**

Does v1 actually calculate ALL 15 Scope 3 categories?
```
Category 1: Purchased goods ✅ or ❌?
Category 2: Capital goods ✅ or ❌?
Category 3: Fuel/energy activities ✅ or ❌?
Category 4: Upstream transport ✅ or ❌?
Category 5: Waste ✅ or ❌?
Category 6: Business travel ✅ or ❌?
Category 7: Employee commuting ✅ or ❌?
... (8-15)
```

### 4. **What's Missing in v1 That Drove v2?**

Common reasons for v1 → v2:
- ❌ Performance issues?
- ❌ Data accuracy problems?
- ❌ Compliance gaps?
- ❌ User experience issues?
- ❌ Scalability limits?
- ❌ Missing features?

---

## Migration Strategy: v1 → v2

### Phase 1: Understand v1's Current State

**Action Items:**
1. [ ] Document v1's emission factor sources
2. [ ] Review v1's Electricity Maps integration
3. [ ] Identify what Scope 3 categories v1 actually covers
4. [ ] List v1's compliance report outputs
5. [ ] Understand v1's data quality/accuracy

### Phase 2: Define v2's Enhancements

Based on v1 learnings:

```typescript
// What v2 should IMPROVE from v1

const v2Enhancements = {

  // If v1 has manual emission factors → Automate with Climatiq
  emissionFactors: {
    v1: 'Manual database?',
    v2: 'Climatiq API (330k factors, auto-updates)'
  },

  // If v1 lacks price data → Add ENTSO-E
  electricityPricing: {
    v1: 'No price tracking?',
    v2: 'ENTSO-E free API'
  },

  // If v1 has data gaps → Backfill strategy
  historicalData: {
    v1: 'Limited history?',
    v2: 'CO2.js for gaps + ENTSO-E archives'
  },

  // If v1 lacks audit trails → Build in v2
  compliance: {
    v1: 'Basic reporting?',
    v2: 'Full audit trails + multi-framework'
  }
}
```

### Phase 3: v2 API Integration Priority

**Based on what's missing from v1:**

```typescript
// Priority matrix for v2

const v2Priorities = {

  // HIGH PRIORITY (if missing in v1)
  high: [
    {
      api: 'Climatiq',
      reason: 'Automated emission factors for all scopes',
      impact: 'Eliminates manual factor management',
      timeline: 'Week 1-2'
    },
    {
      api: 'ENTSO-E',
      reason: 'Free price data + official grid data',
      impact: 'Cost tracking + validation',
      timeline: 'Week 2-3'
    }
  ],

  // MEDIUM PRIORITY (enhancements)
  medium: [
    {
      api: 'CO2.js',
      reason: 'Historical gap filling',
      impact: 'Complete data coverage',
      timeline: 'Week 3-4'
    }
  ],

  // LOW PRIORITY (already in v1)
  low: [
    {
      api: 'Electricity Maps',
      reason: 'Already integrated in v1',
      action: 'Migrate existing integration',
      timeline: 'Week 1'
    },
    {
      api: 'OpenWeatherMap',
      reason: 'Already integrated in v1',
      action: 'Migrate existing integration',
      timeline: 'Week 1'
    }
  ]
}
```

---

## Recommended v2 Architecture

### Data Layer Enhancement

```typescript
// v2 External Data Integration Architecture

class SustainabilityDataPlatform {

  // Layer 1: Grid & Energy Data
  async getElectricityData(location: string, datetime: Date) {
    // Use existing v1 Electricity Maps integration
    const gridData = await this.electricityMaps.getGridMix(location, datetime)

    // NEW: Add price data from ENTSO-E
    const priceData = await this.entsoe.getDayAheadPrice(location, datetime)

    // NEW: Add validation from ENTSO-E
    const officialData = await this.entsoe.getActualGeneration(location, datetime)

    return {
      carbonIntensity: gridData.carbonIntensity,
      renewablePercentage: gridData.renewablePercentage,
      price: priceData.price,              // NEW
      validation: officialData,             // NEW
      source: 'electricity_maps',
      validatedBy: 'entsoe'                 // NEW
    }
  }

  // Layer 2: Emission Factor Database
  async getEmissionFactor(activity: string, region: string) {
    // NEW: Use Climatiq for automated factors
    // (Instead of manual database from v1?)
    const factor = await this.climatiq.searchEmissionFactor({
      query: activity,
      region: region
    })

    return {
      value: factor.factor,
      unit: factor.unit,
      source: factor.source_dataset,       // EXIOBASE, ecoinvent, etc.
      year: factor.year,
      audit_trail: factor.audit_info       // GHG Protocol compliant
    }
  }

  // Layer 3: Calculation Engine
  async calculateEmissions(activityData: ActivityData) {
    if (activityData.scope === 2 && activityData.type === 'electricity') {
      // Use Layer 1 (existing v1 + enhancements)
      return this.getElectricityData(...)
    } else {
      // Use Layer 2 (NEW: Climatiq)
      const factor = await this.getEmissionFactor(...)
      return activityData.quantity * factor.value
    }
  }
}
```

---

## Cost-Benefit Analysis: v1 vs v2

### If v1 Uses Manual Emission Factors

**v1 Costs:**
- Development time: 100+ hours to build/maintain factor database
- Data quality: Risk of outdated/incorrect factors
- Compliance: Manual updates for regulation changes
- Audit: No automatic audit trails

**v2 with Climatiq:**
- API cost: €200-500/month
- Development time: 10-20 hours integration
- Data quality: Professional, validated, updated
- Compliance: GHG Protocol ready
- Audit: Built-in trails

**ROI**: Positive if you value dev time at >€50/hour

### If v1 Lacks Price Data

**v2 with ENTSO-E:**
- Cost: FREE
- Benefit: Complete cost tracking for Scope 2
- Impact: Better ROI analysis for energy projects

---

## Next Steps: Understanding v1

To give you the BEST v2 strategy, I need to understand:

### 🔍 **Can you help me understand v1's data layer?**

1. **Clone v1 repo locally:**
   ```bash
   gh repo clone blipee-dev/blipee-os /tmp/blipee-v1
   cd /tmp/blipee-v1

   # Show me key files
   find . -name "*emission*" -o -name "*factor*" -o -name "*electricity*"
   ```

2. **Key questions:**
   - Where are emission factors stored/sourced in v1?
   - How does v1 use Electricity Maps?
   - What Scope 3 categories does v1 actually calculate?
   - What's the data quality/audit trail in v1?

3. **v1 vs v2 scope:**
   - Is v2 meant to replace v1 entirely?
   - Or is v2 a simplified/focused version?
   - Or is v2 for a different market segment?

---

## Immediate Action: v2 API Priority

**Without seeing v1's code, my recommendation:**

### Week 1: Deploy What's Ready
1. ✅ Electricity Maps (migrate from v1)
2. ✅ Deploy grid capture script (already built)
3. ✅ Basic Scope 2 calculations

### Week 2-3: Add What's Missing (if not in v1)
1. 🔨 Climatiq integration (if v1 lacks automated factors)
2. 🔨 ENTSO-E integration (if v1 lacks price data)
3. 🔨 Audit trail improvements

### Week 4: Enhance & Optimize
1. ⚡ CO2.js for historical gaps
2. ⚡ Data validation layer
3. ⚡ Performance optimization

---

## Questions for You

1. **What drove the decision to build v2?**
   - Performance issues?
   - Missing features?
   - Different target market?
   - Architectural cleanup?

2. **Should v2 maintain feature parity with v1?**
   - Or is it a focused/simplified version?

3. **What's v1's current production status?**
   - Live with customers?
   - Internal use?
   - Prototype?

4. **Can I explore v1's codebase?**
   - This would give me MUCH better v2 recommendations

**Would you like me to:**
1. Clone v1 and analyze its data architecture?
2. Create a detailed v1 vs v2 feature comparison?
3. Just focus on building v2 with best practices?
