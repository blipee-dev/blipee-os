# Mock Data Audit Report

**Date**: 2025-10-23
**Status**: IN PROGRESS

## Executive Summary

### ✅ REAL DATA (Validated)
- **Dashboard Components**: ALL using real database data via API routes
- **BlipeeBrain SQL Queries**: Querying real `metrics_data` table
- **AI Service (ai-stub.ts)**: Calls real OpenAI/DeepSeek/Anthropic APIs (despite name)
- **Supabase Client**: Real database connection

### ❌ MOCK/STUB DATA (Needs Fixing)
- **Autonomous Agent Task Handlers**: 28 instances of Math.random() + hardcoded stub responses
- **Some ML Models**: 233 total Math.random() calls across codebase (many in ML/analytics)

---

## Detailed Findings

### 1. Dashboard Layer ✅ REAL DATA

**File**: `/src/components/dashboard/OverviewDashboard.tsx`
**Data Source**: `useOverviewDashboard` hook → API routes → Database

**Evidence**:
```typescript
// Line 40
import { useOverviewDashboard } from '@/hooks/useDashboardData';

// Lines 63-72
const {
  scopeAnalysis,        // Real data from /api/dashboard/overview
  targets: targetsQuery,
  prevYearScopeAnalysis,
  fullPrevYearScopeAnalysis,
  dashboard: dashboardQuery,
  forecast: forecastQuery,
  topMetrics: topMetricsQuery,
  isLoading: internalLoading
} = useOverviewDashboard(selectedPeriod, selectedSite, organizationId);
```

**API Routes Used**:
- `/api/energy/sources` - Real energy data
- `/api/energy/intensity` - Real intensity calculations
- `/api/dashboard/overview` - Real scope analysis
- All routes query `metrics_data` table with proper joins

**Validation Query** (verified with 427.7 tCO2e):
```sql
SELECT SUM(md.co2e_emissions) / 1000.0 as total_co2e_tonnes
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
WHERE md.organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  AND md.period_start >= '2025-01-01'
  AND md.period_start < '2025-10-01';
-- Result: 427.68 tCO2e ✅ Matches dashboard exactly
```

---

### 2. BlipeeBrain AI System ✅ REAL DATA (with schema issues)

**File**: `/src/lib/ai/blipee-brain.ts`
**Data Source**: Supabase `explore_sustainability_data()` RPC function

**Evidence**:
```typescript
// Lines 415-438
const { data, error } = await this.supabase
  .rpc('explore_sustainability_data', {
    query_text: query,
    org_id: this.currentContext.organizationId
  });
```

**Status**:
- ✅ Queries real database
- ⚠️ Schema documentation is misleading (separate issue, documented in SQL_QUERY_FIX_COMPLETE.md)
- ✅ Returns actual data when query is correct

---

### 3. AI Service (Misleadingly Named) ✅ REAL

**File**: `/src/lib/ai/autonomous-agents/utils/ai-stub.ts`
**Actual Behavior**: Despite the "stub" name, this calls REAL AI APIs

**Evidence**:
```typescript
// Lines 30-35
const response = await aiService.complete(prompt, {
  temperature: options.temperature || 0.7,
  maxTokens: options.maxTokens || 2000,
  jsonMode: options.jsonMode || false
});
```

**Recommendation**: Rename file to `ai-service.ts` to avoid confusion

---

### 4. Autonomous Agents ❌ MOCK DATA

**Problem**: Agent task handlers return hardcoded stub responses with no actual logic

#### CarbonHunter Agent
**File**: `/src/lib/ai/autonomous-agents/agents/CarbonHunter.ts`
**Lines**: 713-733

**Current Implementation** (STUB):
```typescript
private async handleCarbonCalculation(task: Task): Promise<TaskResult> {
  return {
    taskId: task.id,
    status: 'success',
    confidence: 0.9,  // ❌ Hardcoded
    reasoning: ['Carbon calculation completed'],  // ❌ Generic text
    completedAt: new Date()
  };
}

private async handleAnomalyDetection(task: Task): Promise<TaskResult> {
  return {
    taskId: task.id,
    status: 'success',
    confidence: 0.85,  // ❌ Hardcoded
    reasoning: ['Anomaly detection completed'],  // ❌ Generic text
    completedAt: new Date()
  };
}

private async handleEfficiencyAnalysis(task: Task): Promise<TaskResult> {
  return {
    taskId: task.id,
    status: 'success',
    confidence: 0.8,  // ❌ Hardcoded
    reasoning: ['Efficiency analysis completed'],  // ❌ Generic text
    completedAt: new Date()
  };
}
```

**What It Should Do**:
```typescript
private async handleCarbonCalculation(task: Task): Promise<TaskResult> {
  // Query actual emissions data
  const { data, error } = await this.supabase
    .from('metrics_data')
    .select(`
      co2e_emissions,
      metrics_catalog (scope, category, name)
    `)
    .eq('organization_id', task.organizationId)
    .gte('period_start', task.periodStart)
    .lte('period_end', task.periodEnd);

  if (error) {
    return {
      taskId: task.id,
      status: 'error',
      confidence: 0,
      reasoning: [`Database error: ${error.message}`],
      completedAt: new Date()
    };
  }

  // Calculate actual totals by scope
  const totalsByScope = data.reduce((acc, row) => {
    const scope = row.metrics_catalog.scope;
    acc[scope] = (acc[scope] || 0) + (row.co2e_emissions / 1000);
    return acc;
  }, {});

  return {
    taskId: task.id,
    status: 'success',
    confidence: 0.95,
    reasoning: [
      `Calculated emissions across ${data.length} data points`,
      `Scope 1: ${totalsByScope.scope_1?.toFixed(2) || 0} tCO2e`,
      `Scope 2: ${totalsByScope.scope_2?.toFixed(2) || 0} tCO2e`,
      `Scope 3: ${totalsByScope.scope_3?.toFixed(2) || 0} tCO2e`
    ],
    data: { totalsByScope, rawData: data },
    completedAt: new Date()
  };
}
```

#### Other Affected Agents (All have similar stub handlers):
- ✅ **ComplianceGuardian**: `/src/lib/ai/autonomous-agents/agents/ComplianceGuardian.ts` (3 Math.random() calls)
- ✅ **EsgChiefOfStaff**: `/src/lib/ai/autonomous-agents/agents/EsgChiefOfStaff.ts` (3 Math.random() calls)
- ✅ **CostSavingFinder**: `/src/lib/ai/autonomous-agents/agents/CostSavingFinder.ts` (4 Math.random() calls)
- ✅ **SupplyChainInvestigator**: `/src/lib/ai/autonomous-agents/agents/SupplyChainInvestigator.ts`
- ✅ **RegulatoryForesight**: `/src/lib/ai/autonomous-agents/agents/RegulatoryForesight.ts`
- ✅ **PredictiveMaintenance**: `/src/lib/ai/autonomous-agents/agents/PredictiveMaintenance.ts`
- ✅ **AutonomousOptimizer**: `/src/lib/ai/autonomous-agents/agents/AutonomousOptimizer.ts` (2 Math.random() calls)

---

### 5. ML Models & Analytics ⚠️ MIXED

**Total Math.random() Calls**: 233 across entire codebase

**Categories**:
1. **Legitimate Use** (Random sampling, initialization):
   - Bayesian optimization initial points
   - Genetic algorithm mutations
   - Monte Carlo simulations
   - Test data generation

2. **Mock Data** (Needs fixing):
   - Confidence score generation
   - Synthetic performance metrics
   - Placeholder predictions

**Files to Review** (sample):
- `/src/lib/ai/ml-models/*.ts` (100+ files)
- `/src/lib/analytics/*.ts`
- `/src/lib/ai/analytics-optimization/*.ts`

---

## Priority Fixes

### 🔴 CRITICAL (Week 1)

#### 1. Fix Autonomous Agent Task Handlers
**Impact**: HIGH - Agents are core value proposition
**Effort**: MEDIUM - 8 agents × 5 methods avg = 40 handler implementations
**Files**:
- `/src/lib/ai/autonomous-agents/agents/CarbonHunter.ts`
- `/src/lib/ai/autonomous-agents/agents/ComplianceGuardian.ts`
- `/src/lib/ai/autonomous-agents/agents/EsgChiefOfStaff.ts`
- `/src/lib/ai/autonomous-agents/agents/CostSavingFinder.ts`
- `/src/lib/ai/autonomous-agents/agents/SupplyChainInvestigator.ts`
- `/src/lib/ai/autonomous-agents/agents/RegulatoryForesight.ts`
- `/src/lib/ai/autonomous-agents/agents/PredictiveMaintenance.ts`
- `/src/lib/ai/autonomous-agents/agents/AutonomousOptimizer.ts`

**Action Items**:
- [ ] Replace `handleCarbonCalculation()` with real emissions queries
- [ ] Replace `handleAnomalyDetection()` with actual ML anomaly detection
- [ ] Replace `handleEfficiencyAnalysis()` with real benchmarking calculations
- [ ] Replace `handleCarbonReporting()` with actual report generation
- [ ] Replace `handleSourceInvestigation()` with database drill-down queries
- [ ] Add error handling for database failures
- [ ] Add unit tests with real database fixtures

### 🟡 MEDIUM (Week 2)

#### 2. Audit ML Model Predictions
**Impact**: MEDIUM - Affects forecasting accuracy
**Effort**: HIGH - Need to separate legitimate random sampling from mock data
**Action**: Create separate audit for ML models

#### 3. Rename Misleading Files
**Impact**: LOW - Developer confusion
**Effort**: LOW - Simple rename
**Files**:
- `ai-stub.ts` → `ai-service.ts`
- `supabase-stub.ts` → `supabase-client.ts`

---

## Validation Checklist

### ✅ Confirmed Real Data:
- [x] Dashboard emissions totals (427.7 tCO2e validated)
- [x] Dashboard scope breakdowns (Scope 2: 277.3 tCO2e validated)
- [x] BlipeeBrain SQL query execution
- [x] API routes → Database connection
- [x] Supabase client configuration
- [x] AI service provider calls (OpenAI/DeepSeek/Anthropic)

### ❌ Confirmed Mock Data:
- [x] All autonomous agent task handler responses
- [x] Agent confidence scores (hardcoded 0.8-0.9)
- [x] Agent reasoning text (generic "completed" messages)
- [ ] Some ML model predictions (needs deeper audit)

---

## Database Queries to Use

### Get Scope 2 Emissions (Real)
```sql
SELECT
  mc.scope,
  mc.category,
  mc.name,
  SUM(md.co2e_emissions) / 1000.0 as total_co2e_tonnes
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
WHERE
  md.organization_id = '[org_id]'
  AND mc.scope = 'scope_2'
  AND md.period_start >= '[start_date]'
  AND md.period_end <= '[end_date]'
GROUP BY mc.scope, mc.category, mc.name
ORDER BY total_co2e_tonnes DESC;
```

### Detect Anomalies (Real)
```sql
WITH monthly_averages AS (
  SELECT
    DATE_TRUNC('month', period_start) as month,
    mc.category,
    AVG(md.co2e_emissions) as avg_emissions,
    STDDEV(md.co2e_emissions) as stddev_emissions
  FROM metrics_data md
  JOIN metrics_catalog mc ON md.metric_id = mc.id
  WHERE md.organization_id = '[org_id]'
  GROUP BY month, mc.category
)
SELECT
  md.period_start,
  mc.category,
  md.co2e_emissions,
  ma.avg_emissions,
  ma.stddev_emissions,
  -- Detect if emission is > 2 standard deviations from mean
  CASE
    WHEN md.co2e_emissions > (ma.avg_emissions + 2 * ma.stddev_emissions)
    THEN 'HIGH_ANOMALY'
    WHEN md.co2e_emissions < (ma.avg_emissions - 2 * ma.stddev_emissions)
    THEN 'LOW_ANOMALY'
    ELSE 'NORMAL'
  END as anomaly_status
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
JOIN monthly_averages ma ON
  DATE_TRUNC('month', md.period_start) = ma.month
  AND mc.category = ma.category
WHERE md.organization_id = '[org_id]'
  AND md.period_start >= '[start_date]'
ORDER BY md.period_start DESC;
```

### Calculate Efficiency Benchmarks (Real)
```sql
WITH site_emissions AS (
  SELECT
    s.id as site_id,
    s.name as site_name,
    s.area_sqm,
    SUM(md.co2e_emissions) / 1000.0 as total_co2e_tonnes
  FROM metrics_data md
  JOIN sites s ON md.site_id = s.id
  WHERE md.organization_id = '[org_id]'
    AND md.period_start >= '[start_date]'
  GROUP BY s.id, s.name, s.area_sqm
)
SELECT
  site_name,
  total_co2e_tonnes,
  area_sqm,
  total_co2e_tonnes / area_sqm as emissions_per_sqm,
  RANK() OVER (ORDER BY total_co2e_tonnes / area_sqm) as efficiency_rank
FROM site_emissions
WHERE area_sqm > 0
ORDER BY efficiency_rank;
```

---

## Next Steps

1. **Create Agent Database Integration Template** - Build a reusable pattern for all agents to query real data
2. **Implement CarbonHunter Handlers First** - Prove the pattern works
3. **Roll Out to Other 7 Agents** - Use the template
4. **Add Integration Tests** - Verify agents return real data
5. **Remove All Math.random() from Agent Task Handlers** - Zero tolerance policy

---

**Status**: Document created, audit in progress
**Last Updated**: 2025-10-23
**Next Review**: After CarbonHunter handlers are implemented with real queries
