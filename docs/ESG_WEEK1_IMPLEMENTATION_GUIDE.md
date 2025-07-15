# Week 1 Implementation Guide: AI Agent Integration

## Day 1-2: ESG Chief of Staff Agent Update

### Step 1: Update getCurrentMetricValue() method
**File**: `/src/lib/ai/autonomous-agents/esg-chief-of-staff.ts`
**Line**: ~829

```typescript
// REPLACE the existing getCurrentMetricValue method with:
private async getCurrentMetricValue(metric: string): Promise<any> {
  try {
    // Direct database queries for each metric type
    switch (metric) {
      case 'ghg_emissions':
        const { data: emissions } = await this.supabase
          .from('emissions_data')
          .select('co2e_kg, period_start, period_end')
          .eq('organization_id', this.organizationId)
          .gte('period_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('period_start', { ascending: false });
        
        const totalEmissions = emissions?.reduce((sum, e) => sum + (e.co2e_kg || 0), 0) || 0;
        return {
          metric,
          value: totalEmissions / 1000, // Convert to tonnes
          unit: 'tCO2e',
          timestamp: new Date().toISOString(),
          source: 'emissions_data'
        };

      case 'workforce_diversity':
        const { data: workforce } = await this.supabase
          .from('workforce_demographics')
          .select('women_in_management_percent, total_employees, reporting_date')
          .eq('organization_id', this.organizationId)
          .order('reporting_date', { ascending: false })
          .limit(1)
          .single();
        
        return {
          metric,
          value: workforce?.women_in_management_percent || 0,
          unit: '%',
          timestamp: workforce?.reporting_date,
          additionalData: { totalEmployees: workforce?.total_employees },
          source: 'workforce_demographics'
        };

      case 'safety_performance':
        const { data: safety } = await this.supabase
          .from('health_safety_metrics')
          .select('ltifr, recordable_injuries, hours_worked')
          .eq('organization_id', this.organizationId)
          .gte('period_start', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
          .order('period_end', { ascending: false });
        
        const avgLTIFR = safety?.length 
          ? safety.reduce((sum, s) => sum + (s.ltifr || 0), 0) / safety.length 
          : 0;
        
        return {
          metric,
          value: avgLTIFR,
          unit: 'LTIFR',
          timestamp: new Date().toISOString(),
          source: 'health_safety_metrics'
        };

      case 'supplier_risk':
        const { data: suppliers } = await this.supabase
          .from('supplier_social_assessment')
          .select('criticality, child_labor_risk, forced_labor_risk')
          .eq('organization_id', this.organizationId)
          .gte('assessment_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
        
        const highRiskCount = suppliers?.filter(s => 
          s.criticality === 'critical' || 
          s.child_labor_risk === 'high' || 
          s.forced_labor_risk === 'high'
        ).length || 0;
        
        return {
          metric,
          value: suppliers?.length ? (highRiskCount / suppliers.length) * 100 : 0,
          unit: '%',
          timestamp: new Date().toISOString(),
          additionalData: { 
            totalSuppliers: suppliers?.length || 0,
            highRiskSuppliers: highRiskCount 
          },
          source: 'supplier_social_assessment'
        };

      case 'compliance_score':
        const { data: compliance } = await this.supabase
          .from('csrd_data_completeness')
          .select('*')
          .eq('organization_id', this.organizationId)
          .single();
        
        if (compliance) {
          const scores = [
            compliance.has_e1_climate ? 1 : 0,
            compliance.has_e2_pollution ? 1 : 0,
            compliance.has_e3_water ? 1 : 0,
            compliance.has_e4_biodiversity ? 1 : 0,
            compliance.has_e5_circular ? 1 : 0,
            compliance.has_s1_workforce ? 1 : 0,
            compliance.has_s2_value_chain ? 1 : 0,
            compliance.has_s3_communities ? 1 : 0,
            compliance.has_g1_conduct ? 1 : 0
          ];
          const score = (scores.filter(Boolean).length / scores.length) * 100;
          
          return {
            metric,
            value: score,
            unit: '%',
            timestamp: new Date().toISOString(),
            source: 'csrd_data_completeness'
          };
        }
        
        return null;

      default:
        console.warn(`Unknown metric requested: ${metric}`);
        return null;
    }
  } catch (error) {
    console.error(`Error fetching metric ${metric}:`, error);
    return null;
  }
}
```

### Step 2: Update analyzeMetricTrends() method
**Line**: ~1050

```typescript
// ADD this new method for trend analysis using real data
private async analyzeMetricTrends(metric: string, periods: number = 12): Promise<TrendAnalysis> {
  try {
    switch (metric) {
      case 'ghg_emissions':
        const { data: emissionsTrend } = await this.supabase
          .from('emissions_data')
          .select('co2e_kg, period_start')
          .eq('organization_id', this.organizationId)
          .order('period_start', { ascending: false })
          .limit(periods);
        
        if (!emissionsTrend || emissionsTrend.length < 2) {
          return { trend: 'insufficient_data', change: 0 };
        }
        
        const latestValue = emissionsTrend[0].co2e_kg;
        const previousValue = emissionsTrend[1].co2e_kg;
        const change = ((latestValue - previousValue) / previousValue) * 100;
        
        return {
          trend: change < -5 ? 'improving' : change > 5 ? 'worsening' : 'stable',
          change: change,
          values: emissionsTrend.map(e => ({
            date: e.period_start,
            value: e.co2e_kg / 1000
          }))
        };

      // Add similar cases for other metrics
      default:
        return { trend: 'unknown', change: 0 };
    }
  } catch (error) {
    console.error(`Error analyzing trends for ${metric}:`, error);
    return { trend: 'error', change: 0 };
  }
}
```

### Step 3: Test the Updated Agent
Create a test script to verify the agent works with real data:

```typescript
// /scripts/test-esg-chief-real-data.ts
import { ESGChiefOfStaff } from '../src/lib/ai/autonomous-agents/esg-chief-of-staff';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testESGChiefWithRealData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Get organization ID
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id')
    .limit(1);
  
  if (!orgs || orgs.length === 0) {
    console.error('No organization found');
    return;
  }

  const agent = new ESGChiefOfStaff(orgs[0].id);
  
  // Test metric retrieval
  console.log('Testing ESG Chief with real data...\n');
  
  const metrics = [
    'ghg_emissions',
    'workforce_diversity',
    'safety_performance',
    'supplier_risk',
    'compliance_score'
  ];

  for (const metric of metrics) {
    const result = await agent.getCurrentMetricValue(metric);
    console.log(`${metric}:`, result);
  }

  // Test comprehensive analysis
  const analysis = await agent.performComprehensiveESGAnalysis();
  console.log('\nComprehensive Analysis:', analysis);
}

testESGChiefWithRealData();
```

## Day 3-4: Compliance Guardian Agent Update

### Step 1: Update checkDataCompleteness() method
**File**: `/src/lib/ai/autonomous-agents/compliance-guardian.ts`
**Line**: ~668

```typescript
private async checkDataCompleteness(): Promise<DataCompletenessResult> {
  try {
    // Check CSRD completeness using the view
    const { data: csrdStatus } = await this.supabase
      .from('csrd_data_completeness')
      .select('*')
      .eq('organization_id', this.organizationId)
      .single();

    if (!csrdStatus) {
      return { complete: false, gaps: ['No CSRD data found'] };
    }

    // Check each ESRS requirement
    const esrsChecks = [
      { field: 'has_e1_climate', name: 'E1 Climate Change', table: 'emissions_data' },
      { field: 'has_e2_pollution', name: 'E2 Pollution', table: 'pollution_emissions' },
      { field: 'has_e3_water', name: 'E3 Water Resources', table: 'water_usage' },
      { field: 'has_e4_biodiversity', name: 'E4 Biodiversity', table: 'biodiversity_sites' },
      { field: 'has_e5_circular', name: 'E5 Circular Economy', table: 'circular_economy_flows' },
      { field: 'has_s1_workforce', name: 'S1 Workforce', table: 'workforce_demographics' },
      { field: 'has_s2_value_chain', name: 'S2 Value Chain', table: 'supplier_social_assessment' },
      { field: 'has_s3_communities', name: 'S3 Communities', table: 'community_engagement' },
      { field: 'has_g1_conduct', name: 'G1 Business Conduct', table: 'business_conduct' }
    ];

    const gaps = [];
    const details = {};

    for (const check of esrsChecks) {
      if (!csrdStatus[check.field]) {
        gaps.push(`Missing ${check.name} data`);
        
        // Get specific missing data points
        const { count } = await this.supabase
          .from(check.table)
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', this.organizationId);
        
        details[check.name] = {
          hasData: false,
          recordCount: count || 0,
          recommendation: `Start collecting ${check.name} data in the ${check.table} table`
        };
      } else {
        details[check.name] = {
          hasData: true,
          recordCount: 'Sufficient data available'
        };
      }
    }

    // Check GRI-specific requirements
    const griChecks = await this.checkGRICompliance();
    gaps.push(...griChecks.gaps);

    return {
      complete: gaps.length === 0,
      gaps,
      details,
      complianceScore: ((9 - gaps.length) / 9) * 100
    };
  } catch (error) {
    console.error('Error checking data completeness:', error);
    return { complete: false, gaps: ['Error checking compliance'] };
  }
}

private async checkGRICompliance(): Promise<{ gaps: string[] }> {
  const gaps = [];
  
  // GRI 305: Emissions
  const { data: emissionsCategories } = await this.supabase
    .from('emissions_data')
    .select('scope, category')
    .eq('organization_id', this.organizationId)
    .limit(100);
  
  const uniqueCategories = new Set(emissionsCategories?.map(e => `${e.scope}-${e.category}`));
  
  // Check for required Scope 3 categories
  const requiredScope3 = [
    '3-1', '3-2', '3-3', '3-4', '3-5', '3-6', '3-7', '3-8',
    '3-9', '3-10', '3-11', '3-12', '3-13', '3-14', '3-15'
  ];
  
  for (const cat of requiredScope3) {
    if (!uniqueCategories.has(cat)) {
      gaps.push(`Missing Scope 3 Category ${cat.split('-')[1]} emissions data`);
    }
  }
  
  // GRI 403: Health & Safety
  const { count: safetyCount } = await this.supabase
    .from('health_safety_metrics')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', this.organizationId)
    .gte('period_start', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
  
  if (!safetyCount || safetyCount < 4) {
    gaps.push('Insufficient health & safety data (need quarterly reporting)');
  }
  
  return { gaps };
}
```

### Step 2: Create automated compliance monitoring
```typescript
// ADD new method for continuous compliance monitoring
async monitorComplianceStatus(): Promise<ComplianceStatus> {
  const startTime = Date.now();
  
  try {
    // Get all compliance checks
    const [dataCompleteness, upcomingDeadlines, recentChanges] = await Promise.all([
      this.checkDataCompleteness(),
      this.getUpcomingDeadlines(30), // Next 30 days
      this.checkRegulatoryChanges()
    ]);

    // Calculate risk score
    const riskFactors = [
      dataCompleteness.gaps.length > 5 ? 30 : dataCompleteness.gaps.length * 5,
      upcomingDeadlines.filter(d => d.daysUntil < 7).length * 10,
      recentChanges.length * 5
    ];
    
    const riskScore = Math.min(100, riskFactors.reduce((a, b) => a + b, 0));

    // Generate recommendations
    const recommendations = this.generateComplianceRecommendations({
      dataCompleteness,
      upcomingDeadlines,
      riskScore
    });

    return {
      timestamp: new Date().toISOString(),
      overallCompliance: dataCompleteness.complianceScore,
      riskScore,
      criticalGaps: dataCompleteness.gaps.slice(0, 3),
      urgentDeadlines: upcomingDeadlines.filter(d => d.daysUntil < 14),
      recommendations,
      executionTime: Date.now() - startTime
    };
  } catch (error) {
    console.error('Error monitoring compliance:', error);
    throw error;
  }
}
```

## Day 5: Carbon Hunter & Supply Chain Updates

### Carbon Hunter Quick Update
**File**: `/src/lib/ai/autonomous-agents/carbon-hunter.ts`

```typescript
// Update getRecentEmissionsData() method around line 1119
private async getRecentEmissionsData(): Promise<EmissionsData[]> {
  const { data: emissions } = await this.supabase
    .from('emissions_data')
    .select(`
      *,
      building:buildings(name, type),
      source:emission_sources(name, category, emission_factor)
    `)
    .eq('organization_id', this.organizationId)
    .gte('period_start', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
    .order('period_start', { ascending: false });

  return emissions?.map(e => ({
    ...e,
    co2e_tonnes: e.co2e_kg / 1000,
    intensity: e.building?.type ? this.calculateIntensity(e) : null,
    reductionPotential: e.source?.category ? this.assessReductionPotential(e) : 'medium'
  })) || [];
}

// ADD new method for enhanced GHG analysis
private async analyzeGHGComposition(): Promise<GHGAnalysis> {
  // Query individual GHG gases
  const { data: ghgData } = await this.supabase
    .from('emissions_data')
    .select('co2_kg, ch4_kg, n2o_kg, hfc_kg, pfc_kg, sf6_kg, nf3_kg')
    .eq('organization_id', this.organizationId)
    .gte('period_start', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

  if (!ghgData || ghgData.length === 0) {
    return { composition: {}, insights: [] };
  }

  // Calculate totals for each gas
  const totals = ghgData.reduce((acc, row) => ({
    co2: acc.co2 + (row.co2_kg || 0),
    ch4: acc.ch4 + (row.ch4_kg || 0),
    n2o: acc.n2o + (row.n2o_kg || 0),
    hfc: acc.hfc + (row.hfc_kg || 0),
    pfc: acc.pfc + (row.pfc_kg || 0),
    sf6: acc.sf6 + (row.sf6_kg || 0),
    nf3: acc.nf3 + (row.nf3_kg || 0)
  }), { co2: 0, ch4: 0, n2o: 0, hfc: 0, pfc: 0, sf6: 0, nf3: 0 });

  // Generate insights based on composition
  const insights = [];
  if (totals.ch4 > totals.co2 * 0.1) {
    insights.push('High methane emissions detected - consider leak detection programs');
  }
  if (totals.sf6 > 0) {
    insights.push('SF6 emissions found - this is a potent GHG used in electrical equipment');
  }

  return { composition: totals, insights };
}
```

### Supply Chain Investigator Update
**File**: `/src/lib/ai/autonomous-agents/supply-chain-investigator.ts`

```typescript
// Replace loadRealSupplierData() around line 584
private async loadRealSupplierData(): Promise<void> {
  try {
    // Load supplier assessments
    const { data: assessments } = await this.supabase
      .from('supplier_social_assessment')
      .select('*')
      .eq('organization_id', this.organizationId)
      .order('assessment_date', { ascending: false })
      .limit(50);

    if (assessments && assessments.length > 0) {
      this.supplierDatabase = assessments.map(assessment => ({
        id: assessment.id,
        name: assessment.supplier_name,
        category: assessment.sector,
        location: assessment.country,
        riskScore: this.calculateSupplierRiskScore(assessment),
        lastAssessment: assessment.assessment_date,
        criticalFindings: assessment.critical_findings,
        sustainabilityRating: this.calculateSustainabilityRating(assessment),
        complianceStatus: {
          codeOfConduct: assessment.code_of_conduct_signed,
          auditConducted: assessment.audit_conducted,
          correctiveActions: assessment.cap_required
        }
      }));
    }

    // Load supply chain emissions if available
    const { data: emissions } = await this.supabase
      .from('emissions_data')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('scope', '3')
      .in('category', ['1', '2', '4', '9']); // Upstream categories

    this.supplyChainEmissions = emissions || [];

  } catch (error) {
    console.error('Error loading supplier data:', error);
  }
}

// ADD new risk calculation method
private calculateSupplierRiskScore(assessment: any): number {
  const riskFactors = {
    child_labor_risk: { high: 30, medium: 15, low: 5 },
    forced_labor_risk: { high: 30, medium: 15, low: 5 },
    health_safety_risk: { high: 20, medium: 10, low: 3 },
    criticality: { critical: 20, high: 10, medium: 5, low: 0 }
  };

  let score = 0;
  score += riskFactors.child_labor_risk[assessment.child_labor_risk] || 0;
  score += riskFactors.forced_labor_risk[assessment.forced_labor_risk] || 0;
  score += riskFactors.health_safety_risk[assessment.health_safety_risk] || 0;
  score += riskFactors.criticality[assessment.criticality] || 0;

  // Adjust based on audit results
  if (!assessment.code_of_conduct_signed) score += 10;
  if (!assessment.audit_conducted) score += 5;
  if (assessment.critical_findings > 0) score += assessment.critical_findings * 5;

  return Math.min(100, score);
}
```

## Testing & Validation

### Create comprehensive test suite
```bash
# Run all agent tests
npm test src/lib/ai/autonomous-agents/__tests__/

# Test individual agents with real data
npx tsx scripts/test-esg-chief-real-data.ts
npx tsx scripts/test-compliance-guardian-real-data.ts
npx tsx scripts/test-carbon-hunter-real-data.ts
npx tsx scripts/test-supply-chain-real-data.ts
```

### Monitor agent performance
```typescript
// /scripts/monitor-agent-performance.ts
import { AgentManager } from '../src/lib/ai/autonomous-agents/agent-manager';

async function monitorAgents() {
  const manager = AgentManager.getInstance();
  
  // Get all agents
  const agents = await manager.getAllAgents();
  
  for (const agent of agents) {
    const health = await manager.getAgentHealth(agent.id);
    const metrics = await manager.getAgentMetrics(agent.id);
    
    console.log(`\n${agent.name}:`);
    console.log(`  Status: ${health.status}`);
    console.log(`  Last execution: ${metrics.lastExecution}`);
    console.log(`  Success rate: ${metrics.successRate}%`);
    console.log(`  Avg execution time: ${metrics.avgExecutionTime}ms`);
    console.log(`  Data sources: ${metrics.dataSources.join(', ')}`);
  }
}

monitorAgents();
```

## Week 1 Deliverables Checklist

### ✅ Completed
- [ ] ESG Chief updated to use real ESG data
- [ ] Compliance Guardian checking real compliance gaps
- [ ] Carbon Hunter analyzing enhanced emissions data
- [ ] Supply Chain Investigator using supplier assessments
- [ ] All agents tested with real data
- [ ] Performance metrics collected
- [ ] Documentation updated

### 📊 Success Metrics
- Zero mock data calls in agent code
- All ESG tables being queried
- Agent execution time < 500ms
- 100% test coverage for new methods
- Real-time ESG insights generated

## Next Week Preview
Week 2 will focus on building the API layer to expose this ESG data through RESTful endpoints, enabling the dashboard and external integrations to access the comprehensive ESG metrics.