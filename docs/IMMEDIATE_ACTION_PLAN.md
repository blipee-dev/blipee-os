# Immediate Action Plan
## ESG Schema Activation - Week 1

### Priority: Activate Existing ESG Schema

The most critical first step is to **activate the world-class ESG schema** that's already designed and sitting in the archive. This single action will unlock 80% of the ESG platform capabilities.

---

## Day 1: Schema Migration Preparation

### Morning (2-3 hours)
**Task: Prepare Migration Script**

1. **Copy ESG Schema to Active Migrations**
   ```bash
   cp /supabase/migrations/archive/old_migrations/020_sustainability_core.sql \
      /supabase/migrations/$(date +%Y%m%d%H%M%S)_activate_esg_schema.sql
   ```

2. **Review and Update Schema**
   - Check for any conflicts with current schema
   - Update foreign key references if needed
   - Ensure organization_members table exists (referenced in RLS policies)

3. **Test Migration Locally**
   ```bash
   supabase db reset
   supabase db push
   ```

### Afternoon (3-4 hours)
**Task: Update TypeScript Types**

1. **Create ESG Type Definitions**
   ```typescript
   // /src/types/esg.ts
   export interface Emission {
     id: string;
     organization_id: string;
     emission_date: string;
     source_type: string;
     source_id?: string;
     scope: 1 | 2 | 3;
     category: string;
     activity_data: number;
     activity_unit: string;
     emission_factor: number;
     emissions_amount: number;
     emissions_unit: string;
     data_quality: 'measured' | 'calculated' | 'estimated';
     // ... other fields
   }

   export interface SustainabilityTarget {
     id: string;
     organization_id: string;
     target_name: string;
     target_type: 'absolute' | 'intensity' | 'net_zero' | 'carbon_neutral';
     target_category: string;
     baseline_year: number;
     baseline_value: number;
     target_year: number;
     target_value: number;
     // ... other fields
   }

   export interface ESGMetric {
     id: string;
     organization_id: string;
     metric_date: string;
     pillar: 'E' | 'S' | 'G';
     category: string;
     metric_name: string;
     metric_value: number;
     metric_unit: string;
     // ... other fields
   }
   ```

2. **Update Database Types**
   ```typescript
   // /src/types/database.ts
   export interface Database {
     public: {
       Tables: {
         // ... existing tables
         emissions: {
           Row: Emission;
           Insert: Omit<Emission, 'id' | 'created_at' | 'updated_at'>;
           Update: Partial<Emission>;
         };
         sustainability_targets: {
           Row: SustainabilityTarget;
           Insert: Omit<SustainabilityTarget, 'id' | 'created_at' | 'updated_at'>;
           Update: Partial<SustainabilityTarget>;
         };
         esg_metrics: {
           Row: ESGMetric;
           Insert: Omit<ESGMetric, 'id' | 'created_at' | 'updated_at'>;
           Update: Partial<ESGMetric>;
         };
         // ... other ESG tables
       };
     };
   }
   ```

---

## Day 2: Core ESG APIs

### Morning (3-4 hours)
**Task: Emissions API Endpoints**

1. **Create Emissions API Route**
   ```typescript
   // /src/app/api/emissions/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { createClient } from '@/lib/supabase/server';

   export async function GET(request: NextRequest) {
     const supabase = createClient();
     const { searchParams } = new URL(request.url);
     
     const organization_id = searchParams.get('organization_id');
     const start_date = searchParams.get('start_date');
     const end_date = searchParams.get('end_date');
     const scope = searchParams.get('scope');

     let query = supabase
       .from('emissions')
       .select('*')
       .order('emission_date', { ascending: false });

     if (organization_id) query = query.eq('organization_id', organization_id);
     if (start_date) query = query.gte('emission_date', start_date);
     if (end_date) query = query.lte('emission_date', end_date);
     if (scope) query = query.eq('scope', scope);

     const { data, error } = await query;
     
     if (error) {
       return NextResponse.json({ error: error.message }, { status: 500 });
     }

     return NextResponse.json(data);
   }

   export async function POST(request: NextRequest) {
     const supabase = createClient();
     const emission = await request.json();

     const { data, error } = await supabase
       .from('emissions')
       .insert(emission)
       .select()
       .single();

     if (error) {
       return NextResponse.json({ error: error.message }, { status: 500 });
     }

     return NextResponse.json(data);
   }
   ```

2. **Create Emissions Service**
   ```typescript
   // /src/lib/services/emissions.ts
   import { createClient } from '@/lib/supabase/client';
   import { Emission } from '@/types/esg';

   export class EmissionsService {
     private supabase = createClient();

     async getEmissions(filters: {
       organization_id?: string;
       start_date?: string;
       end_date?: string;
       scope?: 1 | 2 | 3;
     }): Promise<Emission[]> {
       const { data, error } = await this.supabase
         .from('emissions')
         .select('*')
         .match(filters)
         .order('emission_date', { ascending: false });

       if (error) throw error;
       return data;
     }

     async createEmission(emission: Omit<Emission, 'id' | 'created_at' | 'updated_at'>): Promise<Emission> {
       const { data, error } = await this.supabase
         .from('emissions')
         .insert(emission)
         .select()
         .single();

       if (error) throw error;
       return data;
     }

     async getTotalEmissions(organization_id: string, start_date: string, end_date: string) {
       const { data, error } = await this.supabase
         .rpc('calculate_total_emissions', {
           org_id: organization_id,
           start_date,
           end_date
         });

       if (error) throw error;
       return data;
     }
   }
   ```

### Afternoon (3-4 hours)
**Task: ESG Metrics API**

1. **Create ESG Metrics API Route**
   ```typescript
   // /src/app/api/esg-metrics/route.ts
   import { NextRequest, NextResponse } from 'next/server';
   import { createClient } from '@/lib/supabase/server';

   export async function GET(request: NextRequest) {
     const supabase = createClient();
     const { searchParams } = new URL(request.url);
     
     const organization_id = searchParams.get('organization_id');
     const pillar = searchParams.get('pillar');
     const category = searchParams.get('category');

     let query = supabase
       .from('esg_metrics')
       .select('*')
       .order('metric_date', { ascending: false });

     if (organization_id) query = query.eq('organization_id', organization_id);
     if (pillar) query = query.eq('pillar', pillar);
     if (category) query = query.eq('category', category);

     const { data, error } = await query;
     
     if (error) {
       return NextResponse.json({ error: error.message }, { status: 500 });
     }

     return NextResponse.json(data);
   }

   export async function POST(request: NextRequest) {
     const supabase = createClient();
     const metric = await request.json();

     const { data, error } = await supabase
       .from('esg_metrics')
       .insert(metric)
       .select()
       .single();

     if (error) {
       return NextResponse.json({ error: error.message }, { status: 500 });
     }

     return NextResponse.json(data);
   }
   ```

---

## Day 3: Context Engine Enhancement

### Morning (2-3 hours)
**Task: Update Context Engine**

1. **Extend Context Engine for ESG Data**
   ```typescript
   // /src/lib/ai/esg-context-enhancement.ts
   import { EmissionsService } from '@/lib/services/emissions';
   import { ESGMetricsService } from '@/lib/services/esg-metrics';

   export class ESGContextEnhancer {
     private emissionsService = new EmissionsService();
     private esgMetricsService = new ESGMetricsService();

     async enhanceWithESGData(context: any, organizationId: string) {
       // Get recent emissions data
       const recentEmissions = await this.emissionsService.getEmissions({
         organization_id: organizationId,
         start_date: this.getDateMonthsAgo(12),
         end_date: new Date().toISOString().split('T')[0]
       });

       // Get total emissions by scope
       const totalEmissions = await this.emissionsService.getTotalEmissions(
         organizationId,
         this.getDateMonthsAgo(12),
         new Date().toISOString().split('T')[0]
       );

       // Get ESG metrics
       const esgMetrics = await this.esgMetricsService.getMetrics({
         organization_id: organizationId
       });

       return {
         ...context,
         emissions: {
           recent: recentEmissions,
           totals: totalEmissions,
           trends: this.calculateTrends(recentEmissions)
         },
         esgMetrics: {
           environmental: esgMetrics.filter(m => m.pillar === 'E'),
           social: esgMetrics.filter(m => m.pillar === 'S'),
           governance: esgMetrics.filter(m => m.pillar === 'G')
         }
       };
     }

     private getDateMonthsAgo(months: number): string {
       const date = new Date();
       date.setMonth(date.getMonth() - months);
       return date.toISOString().split('T')[0];
     }

     private calculateTrends(emissions: any[]): any {
       // Simple trend calculation
       const monthlyData = emissions.reduce((acc, emission) => {
         const month = emission.emission_date.substring(0, 7);
         acc[month] = (acc[month] || 0) + emission.emissions_amount;
         return acc;
       }, {});

       return {
         monthly: monthlyData,
         trending: this.calculateTrendDirection(monthlyData)
       };
     }

     private calculateTrendDirection(monthlyData: any): 'up' | 'down' | 'stable' {
       const values = Object.values(monthlyData) as number[];
       if (values.length < 2) return 'stable';
       
       const recent = values.slice(-3).reduce((a, b) => a + b, 0);
       const previous = values.slice(-6, -3).reduce((a, b) => a + b, 0);
       
       if (recent > previous * 1.1) return 'up';
       if (recent < previous * 0.9) return 'down';
       return 'stable';
     }
   }
   ```

### Afternoon (3-4 hours)
**Task: Update AI Service Integration**

1. **Integrate ESG Context into AI Service**
   ```typescript
   // /src/lib/ai/service.ts - Add to existing service
   import { ESGContextEnhancer } from './esg-context-enhancement';

   export class AIService {
     private esgContextEnhancer = new ESGContextEnhancer();

     async processESGQuery(query: string, organizationId: string) {
       // Get enhanced context with ESG data
       const context = await this.esgContextEnhancer.enhanceWithESGData(
         {},
         organizationId
       );

       // Create ESG-specific prompt
       const prompt = this.buildESGPrompt(query, context);

       // Get AI response
       const response = await this.complete(prompt, {
         structuredOutput: true,
         chainOfThought: true
       });

       return response;
     }

     private buildESGPrompt(query: string, context: any): string {
       return `
       You are an expert ESG advisor. Given this organization's ESG data:
       
       EMISSIONS DATA:
       ${JSON.stringify(context.emissions, null, 2)}
       
       ESG METRICS:
       ${JSON.stringify(context.esgMetrics, null, 2)}
       
       USER QUERY: ${query}
       
       Provide a comprehensive ESG analysis with:
       1. Key insights from the data
       2. Trend analysis
       3. Recommendations for improvement
       4. Regulatory compliance considerations
       5. Benchmarking context
       
       Use chain-of-thought reasoning to explain your analysis.
       `;
     }
   }
   ```

---

## Day 4: UI Integration

### Morning (3-4 hours)
**Task: Update Sustainability Dashboard**

1. **Enhance Existing Dashboard with ESG Data**
   ```typescript
   // /src/components/sustainability/SustainabilityDashboard.tsx
   import { useEffect, useState } from 'react';
   import { EmissionsService } from '@/lib/services/emissions';
   import { ESGMetricsService } from '@/lib/services/esg-metrics';

   export function SustainabilityDashboard({ organizationId }: { organizationId: string }) {
     const [emissions, setEmissions] = useState([]);
     const [esgMetrics, setESGMetrics] = useState([]);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       const loadData = async () => {
         try {
           const emissionsService = new EmissionsService();
           const esgMetricsService = new ESGMetricsService();

           const [emissionsData, esgData] = await Promise.all([
             emissionsService.getEmissions({ organization_id: organizationId }),
             esgMetricsService.getMetrics({ organization_id: organizationId })
           ]);

           setEmissions(emissionsData);
           setESGMetrics(esgData);
         } catch (error) {
           console.error('Error loading ESG data:', error);
         } finally {
           setLoading(false);
         }
       };

       loadData();
     }, [organizationId]);

     if (loading) return <div>Loading ESG data...</div>;

     return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <ESGSummaryCard emissions={emissions} />
         <EmissionsTrendChart emissions={emissions} />
         <ESGMetricsOverview metrics={esgMetrics} />
         <ComplianceStatus organizationId={organizationId} />
       </div>
     );
   }
   ```

### Afternoon (3-4 hours)
**Task: Update Conversation Interface**

1. **Add ESG Query Processing to Chat**
   ```typescript
   // /src/app/api/ai/chat/route.ts - Update existing route
   import { AIService } from '@/lib/ai/service';

   export async function POST(request: NextRequest) {
     const { message, organizationId } = await request.json();
     
     const aiService = new AIService();
     
     // Check if query is ESG-related
     const isESGQuery = this.isESGRelated(message);
     
     let response;
     if (isESGQuery) {
       response = await aiService.processESGQuery(message, organizationId);
     } else {
       response = await aiService.processGeneralQuery(message, organizationId);
     }

     return NextResponse.json(response);
   }

   function isESGRelated(message: string): boolean {
     const esgKeywords = [
       'emissions', 'carbon', 'sustainability', 'esg', 'environmental',
       'social', 'governance', 'scope', 'ghg', 'climate', 'targets'
     ];
     
     return esgKeywords.some(keyword => 
       message.toLowerCase().includes(keyword)
     );
   }
   ```

---

## Day 5: Testing & Validation

### Morning (2-3 hours)
**Task: Create Test Data**

1. **Seed ESG Test Data**
   ```sql
   -- Insert test emissions data
   INSERT INTO emissions (organization_id, emission_date, source_type, scope, category, activity_data, activity_unit, emission_factor, emissions_amount, data_quality) VALUES
   ('org-uuid-here', '2024-01-01', 'building', 2, 'electricity', 1000, 'kWh', 0.433, 433, 'measured'),
   ('org-uuid-here', '2024-01-01', 'building', 1, 'natural_gas', 500, 'm3', 2.02, 1010, 'measured'),
   ('org-uuid-here', '2024-01-01', 'vehicle', 1, 'fuel_combustion', 100, 'liters', 2.31, 231, 'calculated');

   -- Insert test ESG metrics
   INSERT INTO esg_metrics (organization_id, metric_date, pillar, category, metric_name, metric_value, metric_unit) VALUES
   ('org-uuid-here', '2024-01-01', 'E', 'energy', 'Total Energy Consumption', 5000, 'kWh'),
   ('org-uuid-here', '2024-01-01', 'S', 'diversity', 'Women in Leadership', 35, '%'),
   ('org-uuid-here', '2024-01-01', 'G', 'ethics', 'Ethics Training Completion', 95, '%');
   ```

### Afternoon (3-4 hours)
**Task: End-to-End Testing**

1. **Test API Endpoints**
   ```bash
   # Test emissions API
   curl -X GET "http://localhost:3000/api/emissions?organization_id=org-uuid-here"
   
   # Test ESG metrics API
   curl -X GET "http://localhost:3000/api/esg-metrics?organization_id=org-uuid-here"
   
   # Test chat with ESG query
   curl -X POST "http://localhost:3000/api/ai/chat" \
     -H "Content-Type: application/json" \
     -d '{"message": "What are our current emissions?", "organizationId": "org-uuid-here"}'
   ```

2. **Test Dashboard Integration**
   - Navigate to sustainability dashboard
   - Verify ESG data displays correctly
   - Test chat interface with ESG queries
   - Validate context enhancement

---

## Expected Outcomes After Day 5

### ✅ **Immediate Capabilities Activated**
- Complete ESG database schema in production
- Core ESG APIs functional (emissions, metrics, targets)
- Enhanced AI context with full ESG data
- Sustainability dashboard showing ESG metrics
- Conversational ESG queries working

### ✅ **Foundation for Advanced Features**
- Database ready for materiality assessment
- APIs ready for compliance tracking
- Context engine ready for advanced analytics
- UI components ready for ESG workflows

### ✅ **Business Value Delivered**
- Organizations can start tracking comprehensive ESG data
- AI can provide ESG insights and recommendations
- Dashboard provides real-time ESG visibility
- Platform transformed from building-only to universal ESG

## Next Steps (Week 2)

1. **Materiality Assessment Implementation**
2. **Advanced ESG Analytics**
3. **Compliance Framework Integration**
4. **Enhanced Reporting Capabilities**

This immediate action plan gets the ESG platform **80% functional in just 5 days** by activating the excellent foundation that already exists. The key is to **execute quickly** and **build on existing strengths** rather than starting from scratch.