# ESG Database Integration Roadmap

## Overview
This document outlines how to integrate the comprehensive ESG database schema with the blipee OS platform's AI agents, APIs, and user interfaces.

## 🎯 Integration Goals
- Connect AI agents to real ESG data instead of mock data
- Enable conversational AI to query and analyze ESG metrics
- Create APIs for ESG data management
- Build dashboard components for ESG visualization
- Ensure compliance tracking and reporting capabilities

## 📊 Current State vs. Target State

### Current State
- ✅ Comprehensive ESG database schema created (20+ tables)
- ✅ Basic environmental data populated (emissions, water, waste)
- ⚠️ AI agents using partial real data + mock data
- ❌ No ESG-specific API endpoints
- ❌ Limited dashboard integration

### Target State
- AI agents fully powered by real ESG data
- Complete API layer for all ESG operations
- Dynamic dashboards showing real-time ESG metrics
- Automated compliance tracking and reporting
- Full supply chain visibility

## 🔧 Integration Points

### 1. AI Agent Integration

#### ESG Chief of Staff (`/src/lib/ai/autonomous-agents/esg-chief-of-staff.ts`)
**Current**: Lines 829-954 use basic queries
**Update Required**:
```typescript
// Replace getCurrentMetricValue() to use new schema
private async getCurrentMetricValue(metric: string): Promise<any> {
  const metricMapping = {
    'ghg_emissions': {
      query: `
        SELECT SUM(co2e_kg) as value, 'kg CO2e' as unit
        FROM emissions_data
        WHERE organization_id = $1 
        AND period_start >= date_trunc('month', CURRENT_DATE)
      `
    },
    'water_usage': {
      query: `
        SELECT SUM(volume_m3) as value, 'm³' as unit
        FROM water_usage
        WHERE organization_id = $1
        AND period_start >= date_trunc('month', CURRENT_DATE)
      `
    },
    'workforce_diversity': {
      query: `
        SELECT women_in_management_percent as value, '%' as unit
        FROM workforce_demographics
        WHERE organization_id = $1
        ORDER BY reporting_date DESC LIMIT 1
      `
    },
    'compliance_score': {
      query: `
        SELECT AVG(score) as value, 'score' as unit
        FROM (
          SELECT 100 as score FROM business_conduct WHERE organization_id = $1
          UNION ALL
          SELECT 100 as score FROM health_safety_metrics WHERE organization_id = $1
        ) scores
      `
    }
  };
}
```

#### Compliance Guardian (`/src/lib/ai/autonomous-agents/compliance-guardian.ts`)
**Current**: Lines 668-719 check basic data completeness
**Update Required**:
```typescript
// Enhanced compliance checking using new tables
private async checkDataCompleteness(): Promise<ComplianceCheck[]> {
  const checks = [];
  
  // CSRD/ESRS compliance check
  const csrdCheck = await this.supabase
    .from('csrd_data_completeness')
    .select('*')
    .eq('organization_id', this.organizationId)
    .single();
  
  // GRI compliance check
  const griMetrics = [
    { table: 'emissions_data', standard: 'GRI 305' },
    { table: 'water_usage', standard: 'GRI 303' },
    { table: 'workforce_demographics', standard: 'GRI 401' },
    { table: 'health_safety_metrics', standard: 'GRI 403' },
    { table: 'supplier_social_assessment', standard: 'GRI 414' }
  ];
  
  for (const metric of griMetrics) {
    const { count } = await this.supabase
      .from(metric.table)
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', this.organizationId);
    
    checks.push({
      standard: metric.standard,
      complete: count > 0,
      missing: count === 0 ? ['No data'] : []
    });
  }
  
  return checks;
}
```

### 2. API Endpoints

#### Create ESG API Structure
```bash
/src/app/api/esg/
├── dashboard/
│   └── route.ts              # ESG dashboard data
├── emissions/
│   ├── route.ts              # GET, POST emissions
│   └── [id]/route.ts         # GET, PUT, DELETE specific emission
├── workforce/
│   ├── route.ts              # Workforce demographics
│   └── diversity/route.ts    # Diversity metrics
├── compliance/
│   ├── assessments/route.ts  # Compliance assessments
│   └── frameworks/route.ts   # Supported frameworks
├── targets/
│   └── route.ts              # Sustainability targets
└── reports/
    └── generate/route.ts     # Generate ESG reports
```

#### Example: ESG Dashboard API
```typescript
// /src/app/api/esg/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Get organization from session
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user?.user_metadata?.organization_id;
  
  // Fetch data from ESG dashboard view
  const { data: dashboard } = await supabase
    .from('esg_dashboard')
    .select('*')
    .eq('organization_id', orgId)
    .single();
  
  // Fetch recent activities
  const { data: activities } = await supabase
    .from('agent_task_executions')
    .select('*, agent:autonomous_agents(name, avatar)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5);
  
  // Fetch compliance status
  const { data: compliance } = await supabase
    .from('csrd_data_completeness')
    .select('*')
    .eq('organization_id', orgId)
    .single();
  
  return NextResponse.json({
    metrics: {
      emissions: dashboard?.ytd_emissions_tco2e || 0,
      targetsOnTrack: dashboard?.targets_on_track || 0,
      employees: dashboard?.total_employees || 0,
      safetyScore: dashboard?.latest_ltifr || 0,
      boardDiversity: dashboard?.board_diversity_percent || 0
    },
    activities,
    compliance: {
      environmental: [
        compliance?.has_e1_climate,
        compliance?.has_e2_pollution,
        compliance?.has_e3_water,
        compliance?.has_e4_biodiversity,
        compliance?.has_e5_circular
      ].filter(Boolean).length / 5 * 100,
      social: [
        compliance?.has_s1_workforce,
        compliance?.has_s2_value_chain,
        compliance?.has_s3_communities
      ].filter(Boolean).length / 3 * 100,
      governance: compliance?.has_g1_conduct ? 100 : 0
    }
  });
}
```

### 3. Dashboard Components

#### Update ESG Management Hub
```typescript
// /src/components/esg/ESGManagementHub.tsx
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function ESGManagementHub() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/esg/dashboard')
      .then(res => res.json())
      .then(data => {
        setDashboard(data);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <div>Loading ESG data...</div>;
  
  return (
    <div className="grid gap-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Carbon Footprint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dashboard.metrics.emissions.toFixed(1)} tCO₂e
            </div>
            <p className="text-sm text-muted-foreground">
              Year to date emissions
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Workforce Diversity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dashboard.metrics.boardDiversity}%
            </div>
            <p className="text-sm text-muted-foreground">
              Women in leadership
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Safety Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {dashboard.metrics.safetyScore.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              LTIFR (Lost Time Injury Frequency Rate)
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Compliance Progress */}
      <Card>
        <CardHeader>
          <CardTitle>ESG Compliance Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>Environmental (E1-E5)</span>
              <span>{dashboard.compliance.environmental}%</span>
            </div>
            <Progress value={dashboard.compliance.environmental} />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span>Social (S1-S4)</span>
              <span>{dashboard.compliance.social}%</span>
            </div>
            <Progress value={dashboard.compliance.social} />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <span>Governance (G1)</span>
              <span>{dashboard.compliance.governance}%</span>
            </div>
            <Progress value={dashboard.compliance.governance} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4. Conversational AI Enhancement

#### Update Context Engine
```typescript
// /src/lib/ai/context-engine.ts
// Add ESG context building
async buildESGContext(organizationId: string): Promise<ESGContext> {
  const [
    emissions,
    workforce,
    targets,
    compliance
  ] = await Promise.all([
    this.supabase
      .from('emissions_data')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('period_start', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .order('period_start', { ascending: false }),
    
    this.supabase
      .from('workforce_demographics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('reporting_date', { ascending: false })
      .limit(1),
    
    this.supabase
      .from('sustainability_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('on_track', true),
    
    this.supabase
      .from('csrd_data_completeness')
      .select('*')
      .eq('organization_id', organizationId)
      .single()
  ]);
  
  return {
    currentEmissions: this.calculateEmissionsTrend(emissions.data),
    workforceDiversity: workforce.data?.[0],
    activeTargets: targets.data,
    complianceGaps: this.identifyComplianceGaps(compliance.data),
    materialTopics: await this.getMaterialTopics(organizationId)
  };
}
```

## 📅 Implementation Timeline

### Week 1: Core Integration
- [ ] Update AI agents to use real ESG data
- [ ] Create basic ESG API endpoints
- [ ] Update ESG dashboard with real metrics

### Week 2: Compliance & Reporting
- [ ] Implement compliance tracking APIs
- [ ] Create report generation endpoints
- [ ] Add materiality assessment UI

### Week 3: Advanced Features
- [ ] Supply chain integration
- [ ] Target management system
- [ ] Automated compliance checking

### Week 4: Testing & Optimization
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation updates

## 🚀 Quick Start

1. **Update Environment Variables**
```bash
# Add to .env.local
NEXT_PUBLIC_ESG_FEATURES_ENABLED=true
ESG_REPORTING_ENABLED=true
```

2. **Run Database Migrations**
```bash
# Already completed - tables exist
npx supabase migration list
```

3. **Seed Test Data**
```bash
npx tsx scripts/seed-comprehensive-esg-data.ts
```

4. **Test Integration**
```bash
npx tsx scripts/test-esg-compliance.ts
```

## 📊 Success Metrics

- AI agents using 100% real data (no mock data)
- All ESG tables actively queried by the platform
- Compliance scores calculated from actual data
- Real-time ESG metrics on dashboard
- Automated report generation working

## 🔗 Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project overview
- [Database Schema](../scripts/create-comprehensive-esg-schema.sql)
- [Agent Documentation](../src/lib/ai/autonomous-agents/README.md)
- [API Documentation](../src/app/api/README.md)