# Stream C Industry Models Deployment Guide

## Overview
Stream C implements industry-specific intelligence with GRI sector standards integration. This deployment guide covers the database migration and initial setup.

## Database Migration

### 1. Apply the Industry Models Migration

```bash
# Apply the main migration
npx supabase db push

# Or run migrations individually
npx supabase migration up --target 20240713_industry_models_tables
```

### 2. Load Seed Data (Optional)

```bash
# Load initial industry data
psql -h your-db-host -U postgres -d your-db < supabase/seed/industry_models_seed.sql
```

## Migration Contents

### Tables Created

1. **gri_sector_standards** - GRI 11-17 sector standards
2. **industry_classifications** - NAICS/SIC/ISIC industry codes
3. **industry_metrics** - Industry-specific KPIs
4. **industry_benchmarks** - Peer comparison data
5. **benchmark_data_points** - Organization performance data
6. **regulatory_requirements** - Jurisdiction-specific regulations
7. **industry_analysis_results** - Cached AI analysis

### Organization Table Updates

- Added `industry_classification_id` column
- Added `gri_sector_id` column  
- Added `industry_confidence` column

### Material Topics Updates

- Added `gri_sector_standard` column
- Added `industry_specific` column
- Added `applicable_industries` column

## Initial Data Included

### GRI Sector Standards
- GRI 11: Oil and Gas
- GRI 12: Coal  
- GRI 13: Agriculture, Aquaculture and Fishing
- GRI 14: Mining
- GRI 15: Food and Beverage
- GRI 16: Textiles and Apparel
- GRI 17: Tobacco

### Industry Classifications
- Oil & Gas (NAICS 211)
- Coal Mining (NAICS 2121)
- Agriculture (NAICS 111)
- Manufacturing (NAICS 31-33)
- Information (NAICS 51)
- Finance (NAICS 52)

### Sample Metrics (Oil & Gas)
- GHG Intensity (kgCO2e/BOE)
- Methane Intensity (%)
- Flaring Intensity (m³/BOE)
- Water Intensity (m³/BOE)
- Spill Volume (barrels)
- TRIR (per 200,000 hours)
- Process Safety Events (count)

### Regulatory Requirements
- EPA Greenhouse Gas Reporting Program (US)
- EU Emissions Trading System (EU)
- EU Methane Regulation (EU)
- OGMP 2.0 (Global)

## Code Integration

### Basic Usage

```typescript
import { createIndustryIntelligence } from '@/lib/ai/industry-intelligence';

// Initialize the system
const industryIntelligence = createIndustryIntelligence({
  enableAutoClassification: true,
  enableBenchmarking: true,
  enableMLPredictions: false // Will enable when ML pipeline is ready
});

// Analyze an organization
const analysis = await industryIntelligence.analyzeOrganization(
  'org-id',
  {
    naicsCode: '211', // Oil & Gas
    scope1_emissions: 150000,
    scope2_emissions: 25000,
    production_volume: 1000000, // BOE
    region: 'north_america'
  }
);

// Get recommendations
const recommendations = await industryIntelligence.getRecommendations(
  'org-id',
  organizationData
);

// Get benchmarks
const benchmarks = await industryIntelligence.getBenchmarks(
  ['ghg_intensity_upstream', 'methane_intensity'],
  { industry: 'oil-gas', region: 'global' }
);
```

### Advanced Usage

```typescript
import { 
  IndustryOrchestrator, 
  OilGasGRI11Model,
  BenchmarkEngine 
} from '@/lib/ai/industry-intelligence';

// Direct model usage
const oilGasModel = new OilGasGRI11Model();
const analysis = await oilGasModel.analyze('org-id', data, classification);

// Custom benchmark analysis
const benchmarkEngine = new BenchmarkEngine({
  minSampleSize: 15,
  outlierThreshold: 2.5,
  enableAnonymization: true
});

const benchmark = benchmarkEngine.calculateBenchmark(
  'ghg_intensity_upstream',
  { industry: 'oil-gas', year: 2024 }
);
```

## Row Level Security

The migration includes comprehensive RLS policies:

- **Public read access** to reference data (GRI standards, industry classifications)
- **Organization-scoped access** to benchmark data and analysis results
- **Role-based write access** for data collection (sustainability managers, facility managers)

## Troubleshooting

### Common Issues

1. **Column "name" does not exist**
   - Fixed in seed file - uses `topic_name` column instead

2. **Permission denied**
   - Ensure user has proper role in `organization_members` table
   - Check RLS policies are applied correctly

3. **Missing foreign key reference**
   - Ensure organizations table exists before running migration
   - Verify industry classifications are properly linked to GRI sectors

### Verification Queries

```sql
-- Check GRI standards are loaded
SELECT * FROM gri_sector_standards;

-- Verify industry classifications
SELECT ic.*, gs.sector_name 
FROM industry_classifications ic
LEFT JOIN gri_sector_standards gs ON ic.gri_sector_id = gs.id;

-- Check oil & gas metrics
SELECT * FROM industry_metrics 
WHERE industry_id = (
  SELECT id FROM industry_classifications 
  WHERE code = '211' AND classification_system = 'NAICS'
);

-- Verify benchmarks
SELECT * FROM industry_benchmarks 
WHERE period_year = 2024;
```

## Next Steps

After successful deployment:

1. **Test the API integration** with existing AI chat system
2. **Add more industry models** (Coal GRI 12, Agriculture GRI 13)
3. **Integrate with ML Pipeline** for predictive analytics
4. **Connect to Autonomous Agents** for automated monitoring
5. **Implement network effects** for collective learning

## Support

For issues with this deployment:
- Check the migration logs for specific error messages
- Verify all prerequisite tables exist
- Ensure proper database permissions
- Contact the development team for assistance with Stream A/B integration