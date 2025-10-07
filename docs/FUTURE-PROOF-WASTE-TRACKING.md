# Future-Proof Waste Tracking System

## Overview

This document describes the enhanced waste tracking system implemented for blipee OS, designed for full compliance with GRI 306, ESRS E5, CDP, and TCFD frameworks while providing maximum flexibility for future growth.

## Key Differentiators

### Diversion Rate vs Recycling Rate

**Diversion Rate (GRI 306-4)**
- Broader metric including ALL waste diverted from disposal
- Includes: Recycling + Composting + Reuse + Waste-to-Energy
- Formula: `(Total Diverted / Total Generated) × 100`

**Recycling Rate (ESRS E5)**
- Narrower metric counting ONLY recycled materials
- Includes: Only materials sent to recycling facilities
- Formula: `(Total Recycling / Total Generated) × 100`

**Key Insight**: Recycling Rate ≤ Diversion Rate always

### Example Calculation

100 tons of waste:
- 30 tons → Recycling ♻️
- 20 tons → Composting 🌱
- 10 tons → Waste-to-Energy ⚡
- 40 tons → Landfill 🗑️

Results:
- **Diversion Rate = 60%** (30 + 20 + 10)
- **Recycling Rate = 30%** (only recycling)

## Database Schema Enhancements

### New Columns in `metrics_catalog`

```sql
waste_material_type TEXT      -- paper, plastic, metal, glass, organic, ewaste, hazardous, mixed
disposal_method TEXT          -- recycling, composting, incineration_recovery, etc.
is_diverted BOOLEAN          -- GRI 306-4: Diverted from disposal
is_recycling BOOLEAN         -- ESRS E5: Specifically recycled (subset of diverted)
has_energy_recovery BOOLEAN  -- For waste-to-energy
cost_per_ton DECIMAL(10,2)   -- Cost tracking
```

### Granular Metrics Created

**Diverted from Disposal (GRI 306-4)**
- `scope3_waste_recycling_paper` - Paper & cardboard
- `scope3_waste_recycling_plastic` - All plastic types
- `scope3_waste_recycling_metal` - Aluminum, steel, copper
- `scope3_waste_recycling_glass` - Glass bottles, containers
- `scope3_waste_recycling_mixed` - Mixed recyclables
- `scope3_waste_ewaste_recycled` - E-waste properly recycled
- `scope3_waste_composting_food` - Food waste composting
- `scope3_waste_composting_garden` - Green waste
- `scope3_waste_reuse` - Direct reuse
- `scope3_waste_incineration_recovery` - Waste-to-energy

**Directed to Disposal (GRI 306-5)**
- `scope3_waste_landfill_general` - General landfill
- `scope3_waste_landfill_construction` - C&D waste
- `scope3_waste_hazardous_treatment` - Hazardous waste
- `scope3_waste_incineration_no_recovery` - Incineration without energy
- `scope3_waste_ewaste_landfill` - E-waste to landfill

## API Enhancements

### Enhanced Response Structure

```typescript
{
  // Totals
  total_generated: number,      // All waste (tons)
  total_diverted: number,        // GRI 306-4 (tons)
  total_recycling: number,       // ESRS E5 (tons)
  total_disposal: number,        // GRI 306-5 (tons)
  total_emissions: number,       // tCO2e
  total_cost: number,            // Total cost

  // Rates
  diversion_rate: number,        // Percentage
  recycling_rate: number,        // Percentage

  // Material-specific breakdown
  material_breakdown: [
    {
      material: 'plastic',
      total: 50,
      recycled: 30,
      diverted: 35,
      disposal: 15,
      recycling_rate: 60,
      diversion_rate: 70
    },
    // ... per material
  ],

  // Compliance indicators
  gri_306_4_diverted: number,
  gri_306_5_disposal: number,
  esrs_e5_recycling: number,
  circular_economy_score: number
}
```

### Query Simplification

```typescript
// Old way (complex logic)
const totalDiverted = streams
  .filter(s => ['recycling', 'composting'].includes(s.method))
  .reduce((sum, s) => sum + s.quantity, 0);

// New way (metadata-driven)
const totalDiverted = streams
  .filter(s => s.is_diverted)
  .reduce((sum, s) => sum + s.quantity, 0);
```

## Migration Files

1. **`20251007_waste_tracking_enhanced.sql`**
   - Adds metadata columns
   - Updates existing metrics
   - Creates granular metrics
   - Adds constraints and indexes
   - Creates helper view

2. **`route-enhanced.ts`**
   - Updated API using new metadata
   - Material-specific breakdowns
   - Full compliance indicators

## Benefits

### 1. Compliance Ready
- **GRI 306**: Full 306-3, 306-4, 306-5 coverage
- **ESRS E5**: Circular economy metrics
- **CDP Water Security**: Waste section ready
- **TCFD**: Waste-related risks tracked

### 2. Scalable
- Easy to add new materials
- Simple to add new disposal methods
- Metadata-driven (no code changes needed)

### 3. Insightful
- Material-specific recycling rates
- Cost per waste stream
- Optimization opportunities identified
- Benchmarking ready

### 4. Future-Proof
- AI-ready data structure
- Network effect prepared
- Regulatory changes easy to adapt
- Industry-specific customization possible

## Usage Examples

### Dashboard Display
```typescript
// Show diversion vs recycling clearly
<Card>
  <Title>Diversion Rate</Title>
  <Value>{diversionRate}%</Value>
  <Subtitle>Includes recycling, composting, reuse</Subtitle>
  <Badge>GRI 306-4</Badge>
</Card>

<Card>
  <Title>Recycling Rate</Title>
  <Value>{recyclingRate}%</Value>
  <Subtitle>Materials recycled only</Subtitle>
  <Badge>ESRS E5</Badge>
</Card>
```

### Material Insights
```typescript
// Show which materials need improvement
materialBreakdown
  .filter(m => m.recycling_rate < 50)
  .forEach(m => {
    console.log(`⚠️ Low recycling: ${m.material} at ${m.recycling_rate}%`);
    console.log(`💡 Opportunity: ${m.disposal} tons could be recycled`);
  });
```

### AI Recommendations
```typescript
// Future: AI can suggest optimizations
if (plasticRecyclingRate < industryAverage) {
  suggestRecyclingProgram('plastic');
}

if (wasteToEnergy === 0 && organicWaste > threshold) {
  suggestCompostingFacility();
}
```

## Implementation Status

✅ **Completed**
- Migration file created
- Enhanced API created
- Documentation written
- Test scripts prepared

⏳ **Pending**
- Apply migration to database
- Update WasteDashboard to use enhanced API
- Add material breakdown charts
- Create waste optimization AI agent

## Next Steps

1. Apply migration: `npx supabase db push`
2. Update `waste/streams/route.ts` with enhanced version
3. Update `WasteDashboard.tsx` to show:
   - Diversion Rate vs Recycling Rate (explained)
   - Material-specific breakdown
   - Cost per waste stream
   - Optimization opportunities
4. Create waste optimization recommendations
5. Add industry benchmarking

## Resources

- **GRI 306**: https://www.globalreporting.org/standards/media/1036/gri-306-waste-2020.pdf
- **ESRS E5**: Circular economy & waste
- **CDP**: Water & waste section
- **Waste Hierarchy**: Prevention → Reuse → Recycling → Recovery → Disposal

---

**Last Updated**: October 7, 2025
**Status**: Ready for deployment
**Impact**: Full GRI 306 + ESRS E5 compliance with material-level insights
