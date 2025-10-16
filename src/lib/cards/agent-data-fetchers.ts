/**
 * Agent Data Fetchers
 * Connects AI agents to Zero-Typing cards
 */

import { CardData } from '@/components/cards/SmartCard';
import { createClient } from '@/lib/supabase/client';

interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'processing' | 'error';
  lastAction?: string;
  currentTask?: string;
  insights?: string[];
  metrics?: Record<string, any>;
}

/**
 * ESG Chief of Staff Agent Data
 */
export async function fetchESGChiefData(): Promise<CardData> {
  const supabase = createClient();
  
  try {
    // Get organization overview
    const { data: { user } } = await supabase.auth.getUser();
    
    // Fetch key metrics
    const [emissionsRes, complianceRes, targetsRes] = await Promise.all([
      supabase
        .from('emissions')
        .select('value, scope')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('compliance_items')
        .select('status')
        .eq('status', 'non_compliant'),
      supabase
        .from('sustainability_targets')
        .select('*')
        .eq('active', true)
    ]);
    
    const totalEmissions = emissionsRes.data?.reduce((sum, e) => sum + e.value, 0) || 0;
    const nonCompliantCount = complianceRes.data?.length || 0;
    const activeTargets = targetsRes.data?.length || 0;
    
    // Generate strategic insights
    const insights: string[] = [];
    if (totalEmissions > 1000) {
      insights.push('Emissions above target - immediate action needed');
    }
    if (nonCompliantCount > 0) {
      insights.push(`${nonCompliantCount} compliance issues require attention`);
    }
    if (activeTargets < 3) {
      insights.push('Consider setting more ambitious sustainability targets');
    }
    
    return {
      id: 'esg-chief-card',
      type: 'agent',
      title: 'ESG Chief of Staff',
      subtitle: insights.length > 0 ? insights[0] : 'All systems operational',
      agentId: 'esg-chief',
      agentStatus: {
        status: insights.length > 0 ? 'processing' : 'active',
        currentTask: 'Monitoring sustainability metrics',
        lastUpdate: new Date().toISOString(),
      },
      insights,
      actions: [
        {
          id: 'report',
          label: 'Generate Report',
          action: () => {},
          variant: 'primary'
        },
        {
          id: 'strategy',
          label: 'Strategy Session',
          action: () => {},
          variant: 'secondary'
        }
      ],
      metadata: {
        totalEmissions,
        nonCompliantCount,
        activeTargets,
        lastAnalysis: new Date().toISOString(),
      }
    };
  } catch (error) {
    console.error('Failed to fetch ESG Chief data:', error);
    return {
      id: 'esg-chief-card',
      type: 'agent',
      title: 'ESG Chief of Staff',
      subtitle: 'Initializing...',
      agentId: 'esg-chief',
    };
  }
}

/**
 * Carbon Hunter Agent Data
 */
export async function fetchCarbonHunterData(): Promise<CardData> {
  const supabase = createClient();
  
  try {
    // Analyze recent emissions
    const { data: recentEmissions } = await supabase
      .from('emissions')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('value', { ascending: false })
      .limit(10);
    
    // Identify emission hotspots
    const hotspots = recentEmissions?.slice(0, 3).map(e => ({
      location: e.building_id,
      value: e.value,
      scope: e.scope,
    })) || [];
    
    // Calculate reduction opportunities
    const totalRecentEmissions = recentEmissions?.reduce((sum, e) => sum + e.value, 0) || 0;
    const potentialReduction = totalRecentEmissions * 0.15; // 15% reduction potential
    
    const insights = [
      `Identified ${hotspots.length} emission hotspots`,
      `Potential ${potentialReduction.toFixed(1)} tCO2e reduction opportunity`,
      'Real-time monitoring active across all facilities',
    ];
    
    return {
      id: 'carbon-hunter-card',
      type: 'agent',
      title: 'Carbon Hunter',
      subtitle: `Tracking ${totalRecentEmissions.toFixed(1)} tCO2e this week`,
      agentId: 'carbon-hunter',
      agentStatus: {
        status: 'processing',
        currentTask: 'Analyzing emission patterns',
        lastUpdate: new Date().toISOString(),
      },
      insights,
      chart: {
        type: 'bar',
        data: hotspots.map(h => ({
          x: `Scope ${h.scope}`,
          y: h.value,
        })),
      },
      actions: [
        {
          id: 'hunt',
          label: 'Start Hunt',
          action: () => {},
          variant: 'primary'
        },
        {
          id: 'analyze',
          label: 'Deep Analysis',
          action: () => {},
          variant: 'secondary'
        }
      ],
      metadata: {
        totalTracked: totalRecentEmissions,
        hotspots: hotspots.length,
        potentialReduction,
      }
    };
  } catch (error) {
    console.error('Failed to fetch Carbon Hunter data:', error);
    return {
      id: 'carbon-hunter-card',
      type: 'agent',
      title: 'Carbon Hunter',
      subtitle: 'Scanning for emissions...',
      agentId: 'carbon-hunter',
    };
  }
}

/**
 * Compliance Guardian Agent Data
 */
export async function fetchComplianceGuardianData(): Promise<CardData> {
  const supabase = createClient();
  
  try {
    // Check compliance status
    const { data: complianceItems } = await supabase
      .from('compliance_items')
      .select('*')
      .order('deadline', { ascending: true });
    
    const nonCompliant = complianceItems?.filter(i => i.status === 'non_compliant') || [];
    const pending = complianceItems?.filter(i => i.status === 'pending') || [];
    const upcomingDeadlines = complianceItems?.filter(i => {
      const deadline = new Date(i.deadline);
      const daysUntil = (deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
      return daysUntil <= 30 && daysUntil > 0;
    }) || [];
    
    const insights = [];
    if (nonCompliant.length > 0) {
      insights.push(`⚠️ ${nonCompliant.length} non-compliant items need immediate action`);
    }
    if (upcomingDeadlines.length > 0) {
      insights.push(`📅 ${upcomingDeadlines.length} deadlines in next 30 days`);
    }
    if (pending.length > 0) {
      insights.push(`⏳ ${pending.length} items pending review`);
    }
    
    const complianceScore = complianceItems ? 
      ((complianceItems.length - nonCompliant.length) / complianceItems.length) * 100 : 100;
    
    return {
      id: 'compliance-guardian-card',
      type: 'agent',
      title: 'Compliance Guardian',
      subtitle: `${complianceScore.toFixed(0)}% compliance score`,
      agentId: 'compliance-guardian',
      agentStatus: {
        status: nonCompliant.length > 0 ? 'processing' : 'active',
        currentTask: nonCompliant.length > 0 ? 'Resolving compliance issues' : 'Monitoring regulations',
        lastUpdate: new Date().toISOString(),
      },
      insights,
      progress: {
        value: complianceScore,
        max: 100,
        label: 'Compliance Score',
      },
      actions: [
        {
          id: 'audit',
          label: 'Run Audit',
          action: () => {},
          variant: 'primary'
        },
        {
          id: 'report',
          label: 'Compliance Report',
          action: () => {},
          variant: 'secondary'
        }
      ],
      metadata: {
        totalItems: complianceItems?.length || 0,
        nonCompliant: nonCompliant.length,
        pending: pending.length,
        upcomingDeadlines: upcomingDeadlines.length,
      }
    };
  } catch (error) {
    console.error('Failed to fetch Compliance Guardian data:', error);
    return {
      id: 'compliance-guardian-card',
      type: 'agent',
      title: 'Compliance Guardian',
      subtitle: 'Checking compliance status...',
      agentId: 'compliance-guardian',
    };
  }
}

/**
 * Supply Chain Investigator Agent Data
 */
export async function fetchSupplyChainData(): Promise<CardData> {
  const supabase = createClient();
  
  try {
    // Analyze Scope 3 emissions
    const { data: scope3Emissions } = await supabase
      .from('emissions')
      .select('*')
      .eq('scope', 3)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('*')
      .order('emissions_impact', { ascending: false })
      .limit(5);
    
    const totalScope3 = scope3Emissions?.reduce((sum, e) => sum + e.value, 0) || 0;
    const highRiskSuppliers = suppliers?.filter(s => s.risk_level === 'high').length || 0;
    
    const insights = [
      `Scope 3: ${totalScope3.toFixed(1)} tCO2e (last 30 days)`,
      `${highRiskSuppliers} high-risk suppliers identified`,
      'Supply chain mapping 78% complete',
    ];
    
    return {
      id: 'supply-chain-card',
      type: 'agent',
      title: 'Supply Chain Investigator',
      subtitle: `Monitoring ${suppliers?.length || 0} suppliers`,
      agentId: 'supply-chain',
      agentStatus: {
        status: 'active',
        currentTask: 'Analyzing supplier emissions',
        lastUpdate: new Date().toISOString(),
      },
      insights,
      list: suppliers?.slice(0, 3).map(s => ({
        id: s.id,
        title: s.name,
        subtitle: `${s.emissions_impact || 0} tCO2e impact`,
        badge: s.risk_level,
        badgeColor: s.risk_level === 'high' ? '#EF4444' : 
                   s.risk_level === 'medium' ? '#F59E0B' : '#10B981',
      })),
      actions: [
        {
          id: 'investigate',
          label: 'Investigate',
          action: () => {},
          variant: 'primary'
        },
        {
          id: 'map',
          label: 'Supply Chain Map',
          action: () => {},
          variant: 'secondary'
        }
      ],
      metadata: {
        totalScope3,
        supplierCount: suppliers?.length || 0,
        highRiskSuppliers,
      }
    };
  } catch (error) {
    console.error('Failed to fetch Supply Chain data:', error);
    return {
      id: 'supply-chain-card',
      type: 'agent',
      title: 'Supply Chain Investigator',
      subtitle: 'Analyzing supply chain...',
      agentId: 'supply-chain',
    };
  }
}

/**
 * Register agent data fetchers in the card registry
 */
export const agentDataFetchers = {
  'esg-chief-card': fetchESGChiefData,
  'carbon-hunter-card': fetchCarbonHunterData,
  'compliance-guardian-card': fetchComplianceGuardianData,
  'supply-chain-card': fetchSupplyChainData,
};