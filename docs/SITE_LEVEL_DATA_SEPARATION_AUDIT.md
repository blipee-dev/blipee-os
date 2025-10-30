# Site-Level Data Separation Audit & Implementation Plan

## 🔍 Problem Statement

Currently, the platform aggregates data from all sites (Faro, Lisboa, Porto) when training models, generating forecasts, and analyzing opportunities. This creates inaccurate predictions because:

- Lisboa's large consumption (75%) skews predictions for small sites like Faro (4%)
- Site-specific patterns and seasonality are lost in aggregation
- Impossible to provide site-specific recommendations
- Organization totals are not proper sums of individual site contributions

## 📊 Current State - Services Status

### ✅ Services Fully Fixed

1. **Metrics Pre-Compute Service** (`metrics-precompute-service.ts`)
   - **Status**: ✅ COMPLETE
   - **Generates**: Site-level + org-level unified forecasts (emissions, energy, water, waste)
   - **Implementation**: Loops through sites, filters by `site_id`, stores with `site_id` in cache

2. **Prophet Forecasting Service** (`forecast-precompute-service.ts`)
   - **Status**: ✅ COMPLETE
   - **Was**: Line 259 queries filtered only by `organization_id` and `metric_id`
   - **Now**: Line 259 filters by `organization_id`, `site_id`, and `metric_id`
   - **Implementation**: Loops through sites, generates per-site per-metric forecasts

3. **ML Training Service** (`ml-training-service.ts`)
   - **Status**: ✅ COMPLETE
   - **Was**: Line 373 queries filtered only by `organization_id` and `metric_id`
   - **Now**: Line 373 filters by `organization_id`, `site_id`, and `metric_id`
   - **Implementation**: Trains separate TensorFlow.js models per site, stores with `site_id`

4. **Optimization Opportunities Service** (`optimization-opportunities-service.ts`)
   - **Status**: ✅ COMPLETE
   - **Was**: Lines 173, 223, 272 queried only by `organization_id`
   - **Now**: All analysis methods filter by `organization_id` and `site_id`
   - **Implementation**: Per-site opportunity analysis with site-specific recommendations

### ✅ Services OK As-Is

- **Data Cleanup Service**: GDPR compliance (org-level is correct)
- **Notification Queue Service**: User notifications (org-level is correct)
- **Database Optimization Service**: Query performance (org-level is correct)
- **Weather Data Service**: Already location-based
- **Report Generation Service**: Needs enhancement for site breakdowns, but not critical

## 🎯 Implementation Strategy

### Phase 1: Database Schema (✅ Complete)
- ✅ Added `site_id` column to `metrics_cache` table
- ✅ Added `site_id` to `ml_models`, `ml_model_storage`, `ml_predictions` tables
- ✅ Updated constraints to support site-level + org-level models/caches
- ✅ Applied migrations:
  - `20251030_add_site_id_to_metrics_cache.sql`
  - `20251030_add_site_id_to_ml_tables.sql`

### Phase 2: Forecasting Services (✅ Complete)
- ✅ Unified forecasts (emissions, energy, water, waste) - per site + org aggregate
- ✅ Prophet per-metric forecasts - per site + org aggregate
- ✅ Both services now loop through sites and filter by `site_id`

### Phase 3: ML Training (✅ Complete)
- ✅ Train separate TensorFlow.js models per site
- ✅ Store with `site_id` in `ml_model_storage` and `ml_models` tables
- ✅ Each site gets its own LSTM and Autoencoder models
- ✅ Filters training data by `site_id` for accurate site-specific predictions

### Phase 4: Analysis Services (✅ Complete)
- ✅ Optimization opportunities per site
- ✅ Site-specific recommendations in titles and descriptions
- ✅ All analysis methods (energy, emissions, water) filter by `site_id`
- ✅ Opportunities stored with `site_id` for site-level tracking

### Phase 5: Reporting (⏳ Future Enhancement)
- Site breakdown sections in reports
- Site comparison charts
- Per-site KPIs and targets
- Cross-site benchmarking reports

## 📝 Detailed Implementation Tasks

### Task 1: Update ML Model Storage Schema
**Tables**: `ml_models`, `ml_model_storage`

**Changes**:
```sql
-- Add site_id to ml_models
ALTER TABLE ml_models ADD COLUMN site_id UUID REFERENCES sites(id);

-- Add site_id to ml_model_storage
ALTER TABLE ml_model_storage ADD COLUMN site_id UUID REFERENCES sites(id);

-- Update unique constraints
CREATE UNIQUE INDEX unique_ml_model_per_site
ON ml_models(organization_id, COALESCE(site_id::text, 'org'), model_type, metric_id)
WHERE status = 'active';
```

### Task 2: Update ML Training Service
**File**: `src/workers/services/ml-training-service.ts`

**Changes**:
1. Fetch all sites for organization
2. For each site:
   - Train model using `site_id` filter in data query (line 340)
   - Store model with `site_id`
3. Optionally train org-level model on aggregated data

**Key Code Change** (line 340):
```typescript
// Before
.eq('organization_id', organizationId)
.eq('metric_id', metricId)

// After
.eq('organization_id', organizationId)
.eq('metric_id', metricId)
.eq('site_id', siteId) // ✅ Add site filter
```

### Task 3: Update Prophet Forecasting Service
**File**: `src/workers/services/forecast-precompute-service.ts`

**Changes**:
1. Fetch all sites for organization
2. For each site:
   - Generate forecast using `site_id` filter (line 227)
   - Store in `ml_predictions` with `site_id` in metadata
3. Generate org-level forecast by summing site forecasts

**Key Code Change** (line 227):
```typescript
// Before
.eq('organization_id', organizationId)
.eq('metric_id', metricId)

// After
.eq('organization_id', organizationId)
.eq('metric_id', metricId)
.eq('site_id', siteId) // ✅ Add site filter
```

### Task 4: Update Optimization Opportunities Service
**File**: `src/workers/services/optimization-opportunities-service.ts`

**Changes**:
1. Analyze opportunities per site
2. Store opportunities with `site_id`
3. Add cross-site benchmark opportunities
   - "Lisboa uses 50% more energy per sqm than Porto"
   - "Faro has 20% better waste recycling rate"

**Key Code Changes**:
- Line 138 (energy analysis)
- Line 185 (emissions analysis)
- Line 231 (water analysis)

Add `site_id` to all three queries and loop through sites.

## 🎬 Implementation Status

### ✅ Completed (Oct 30, 2025)
1. ✅ Database schema updates (metrics_cache, ml_models, ml_model_storage, ml_predictions)
2. ✅ Metrics Pre-Compute Service - unified forecasts per site
3. ✅ Prophet Forecasting Service - per-metric forecasts per site
4. ✅ ML Training Service - TensorFlow.js models per site
5. ✅ Optimization Opportunities Service - per-site analysis

### 🚀 Ready for Deployment
All core services now properly separate data by site. Each of PLMJ's 3 sites (Faro, Lisboa, Porto) will get:
- Individual forecasts based on their own historical data
- Site-specific ML models trained on their patterns
- Tailored optimization recommendations
- Organization totals = accurate sum of site contributions

### 📋 Future Enhancements
1. Cross-site benchmarking opportunities ("Lisboa uses 50% more energy per sqm than Porto")
2. Enhanced reports with site breakdowns and comparison charts
3. Per-site KPIs and sustainability targets

## 🚀 Expected Benefits

**Accuracy**:
- Faro gets predictions based on Faro's 740 records
- Lisboa gets predictions based on Lisboa's 1,239 records
- Porto gets predictions based on Porto's 853 records

**Organization Totals**:
- Sum of all site predictions = accurate org total
- No more skewed averages

**Business Value**:
- Site-specific recommendations
- Cross-site benchmarking
- Fair performance comparisons
- Better resource allocation

## 📊 Data Breakdown - PLMJ Sites

| Site | Oct 2025 Electricity | Proportion | Records |
|------|---------------------|------------|---------|
| Lisboa - FPM41 | 37,604 kWh | 75% | 1,239 |
| Porto - POP | 5,419 kWh | 12% | 853 |
| Faro | 1,907 kWh | 4% | 740 |
| **Total** | **44,930 kWh** | **100%** | **2,832** |

Each site needs its own models and forecasts to respect these dramatic differences in scale and patterns.
