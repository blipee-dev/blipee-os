import { NetworkGraphEngine } from './graph-engine';
import { PrivacyPreservingNetwork } from './privacy-layer';
import { SupplierNetwork } from './supplier-network';
import { SupplyChainInvestigatorAgent } from '../autonomous-agents/supply-chain-investigator';
import { AgentManager } from '../autonomous-agents/agent-manager';

/**
 * Initialize the complete Network Intelligence system
 */
export async function initializeNetworkIntelligence(organizationId: string) {
  console.log(`🌐 Initializing Network Intelligence for organization ${organizationId}`);

  try {
    // Initialize core engines
    const graphEngine = new NetworkGraphEngine();
    const privacyNetwork = new PrivacyPreservingNetwork();
    const supplierNetwork = new SupplierNetwork();

    // Initialize network agent using existing framework
    const agentManager = AgentManager.getInstance();
    const networkAgentId = await agentManager.startAgent(
      SupplyChainInvestigatorAgent,
      organizationId
    );

    // Check if organization has a network node
    await ensureOrganizationNetworkNode(organizationId);

    console.log(`✅ Network Intelligence initialized successfully`);
    console.log(`🤖 Supply Chain Investigator agent running: ${networkAgentId}`);

    return {
      graphEngine,
      privacyNetwork,
      supplierNetwork,
      networkAgentId,
      
      // Convenience methods
      async buildNetwork(options = {}) {
        return graphEngine.buildNetwork(organizationId, options);
      },
      
      async analyzeSupplyChainRisk(depth = 3) {
        return graphEngine.analyzeSupplyChainRisk(organizationId, depth);
      },
      
      async onboardSupplier(supplierData: any) {
        return supplierNetwork.onboardSupplier(supplierData, organizationId);
      },
      
      async createAnonymousBenchmark(metric: string, filters: any = {}) {
        return privacyNetwork.createAnonymousBenchmark(metric, filters);
      },

      async shutdown() {
        await agentManager.stopAgent(networkAgentId);
        console.log(`🛑 Network Intelligence shut down for organization ${organizationId}`);
      }
    };

  } catch (error) {
    console.error('Error initializing Network Intelligence:', error);
    throw error;
  }
}

/**
 * Ensure organization has a network node
 */
async function ensureOrganizationNetworkNode(organizationId: string) {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Check if organization already has a network node
  const { data: existingNode } = await supabase
    .from('network_nodes')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('node_type', 'organization')
    .single();

  if (existingNode) {
    console.log(`✅ Organization network node exists: ${existingNode.id}`);
    return existingNode;
  }

  // Get organization details
  const { data: organization } = await supabase
    .from('organizations')
    .select('name, industry, website')
    .eq('id', organizationId)
    .single();

  if (!organization) {
    throw new Error(`Organization ${organizationId} not found`);
  }

  // Create network node for organization
  const { data: newNode, error } = await supabase
    .from('network_nodes')
    .insert({
      organization_id: organizationId,
      node_type: 'organization',
      node_name: organization.name,
      industry: organization.industry,
      verification_status: 'verified',
      data_sharing_level: 'network',
      metadata: {
        website: organization.website,
        nodeCreatedAt: new Date().toISOString(),
        autoCreated: true
      }
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create organization network node: ${error.message}`);
  }

  console.log(`✅ Created organization network node: ${newNode.id}`);
  return newNode;
}

/**
 * Utility function to get network status for an organization
 */
export async function getNetworkStatus(organizationId: string) {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  try {
    // Get organization node
    const { data: orgNode } = await supabase
      .from('network_nodes')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (!orgNode) {
      return {
        connected: false,
        message: 'Organization not connected to network'
      };
    }

    // Get connections
    const { data: connections } = await supabase
      .from('network_edges')
      .select('*, source_node:network_nodes!source_node_id(*), target_node:network_nodes!target_node_id(*)')
      .or(`source_node_id.eq.${orgNode.id},target_node_id.eq.${orgNode.id}`)
      .eq('relationship_status', 'active');

    // Get recent assessments
    const { data: assessments } = await supabase
      .from('network_supplier_assessments')
      .select('*')
      .eq('requester_org_id', organizationId)
      .order('assessment_date', { ascending: false })
      .limit(5);

    // Get benchmarks
    const { data: benchmarks } = await supabase
      .from('network_benchmarks')
      .select('*')
      .gte('expires_at', new Date().toISOString())
      .limit(10);

    return {
      connected: true,
      node: orgNode,
      connections: connections || [],
      recentAssessments: assessments || [],
      availableBenchmarks: benchmarks || [],
      statistics: {
        totalConnections: connections?.length || 0,
        suppliers: connections?.filter(c => 
          (c.source_node_id === orgNode.id && c.edge_type === 'buys_from') ||
          (c.target_node_id === orgNode.id && c.edge_type === 'supplies_to')
        ).length || 0,
        customers: connections?.filter(c => 
          (c.source_node_id === orgNode.id && c.edge_type === 'supplies_to') ||
          (c.target_node_id === orgNode.id && c.edge_type === 'buys_from')
        ).length || 0,
        partners: connections?.filter(c => c.edge_type === 'partners_with').length || 0,
        recentAssessments: assessments?.length || 0,
        availableBenchmarks: benchmarks?.length || 0
      }
    };

  } catch (error) {
    console.error('Error getting network status:', error);
    return {
      connected: false,
      error: (error as Error).message
    };
  }
}

/**
 * Quick network analysis for an organization
 */
export async function quickNetworkAnalysis(organizationId: string) {
  try {
    const graphEngine = new NetworkGraphEngine();
    
    // Build basic network
    const network = await graphEngine.buildNetwork(organizationId, {
      maxDepth: 2,
      includeInactive: false
    });

    // Quick risk analysis
    const riskAnalysis = await graphEngine.analyzeSupplyChainRisk(organizationId, 2);

    return {
      networkSize: {
        nodes: network.nodes.length,
        edges: network.edges.length,
        density: network.metrics.density
      },
      riskSummary: {
        directRisks: riskAnalysis.directRisks.length,
        indirectRisks: riskAnalysis.indirectRisks.length,
        highRisks: [...riskAnalysis.directRisks, ...riskAnalysis.indirectRisks]
          .filter(r => r.score > 0.7).length
      },
      recommendations: riskAnalysis.recommendations.slice(0, 3),
      networkHealth: {
        vulnerability: network.metrics.resilience?.vulnerabilityScore || 0,
        redundancy: network.metrics.resilience?.redundancy || 0,
        criticalNodes: network.metrics.resilience?.criticalNodes?.length || 0
      }
    };

  } catch (error) {
    console.error('Error in quick network analysis:', error);
    throw error;
  }
}

/**
 * Set up privacy settings for network participation
 */
export async function setupNetworkPrivacy(
  organizationId: string,
  settings: {
    emissionsSharing?: 'public' | 'network' | 'partners' | 'private';
    energySharing?: 'public' | 'network' | 'partners' | 'private';
    wasteSharing?: 'public' | 'network' | 'partners' | 'private';
    socialSharing?: 'public' | 'network' | 'partners' | 'private';
    anonymizationMethod?: 'k_anonymity' | 'differential_privacy' | 'aggregation_only';
  }
) {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const defaultSettings = {
    emissionsSharing: 'network',
    energySharing: 'network', 
    wasteSharing: 'partners',
    socialSharing: 'private',
    anonymizationMethod: 'k_anonymity'
  };

  const finalSettings = { ...defaultSettings, ...settings };

  // Create privacy settings for each data category
  const privacySettings = [
    { category: 'emissions', sharing: finalSettings.emissionsSharing },
    { category: 'energy', sharing: finalSettings.energySharing },
    { category: 'waste', sharing: finalSettings.wasteSharing },
    { category: 'social', sharing: finalSettings.socialSharing }
  ];

  for (const setting of privacySettings) {
    await supabase
      .from('network_privacy_settings')
      .upsert({
        organization_id: organizationId,
        data_category: setting.category,
        sharing_level: setting.sharing,
        anonymization_method: finalSettings.anonymizationMethod,
        consent_given: true,
        consent_date: new Date().toISOString(),
        consent_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        auto_renew: true
      });
  }

  console.log(`✅ Network privacy settings configured for organization ${organizationId}`);
  
  return {
    success: true,
    settings: finalSettings,
    message: 'Privacy settings configured successfully'
  };
}

/**
 * Generate network intelligence report
 */
export async function generateNetworkReport(organizationId: string) {
  try {
    const networkStatus = await getNetworkStatus(organizationId);
    const quickAnalysis = await quickNetworkAnalysis(organizationId);

    const report = {
      generatedAt: new Date().toISOString(),
      organizationId,
      summary: {
        networkConnected: networkStatus.connected,
        totalConnections: networkStatus.statistics?.totalConnections || 0,
        networkHealth: quickAnalysis.networkHealth,
        riskLevel: quickAnalysis.riskSummary.highRisks > 0 ? 'high' : 
                   quickAnalysis.riskSummary.directRisks > 0 ? 'medium' : 'low'
      },
      networkStructure: quickAnalysis.networkSize,
      riskAnalysis: quickAnalysis.riskSummary,
      topRecommendations: quickAnalysis.recommendations,
      recentActivity: {
        assessments: networkStatus.recentAssessments?.length || 0,
        availableBenchmarks: networkStatus.availableBenchmarks?.length || 0
      },
      nextSteps: [
        networkStatus.statistics?.suppliers === 0 ? 'Onboard your first suppliers to the network' : null,
        quickAnalysis.riskSummary.highRisks > 0 ? 'Address high-risk suppliers immediately' : null,
        networkStatus.availableBenchmarks?.length === 0 ? 'Participate in industry benchmarking' : null,
        quickAnalysis.networkHealth.vulnerability > 0.7 ? 'Improve network resilience' : null
      ].filter(Boolean)
    };

    return report;

  } catch (error) {
    console.error('Error generating network report:', error);
    throw error;
  }
}

/**
 * Utility to check if migrations are applied
 */
export async function checkNetworkMigrations() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const requiredTables = [
    'network_nodes',
    'network_edges', 
    'network_privacy_settings',
    'network_benchmarks',
    'network_supplier_assessments',
    'network_data_marketplace'
  ];

  const missingTables = [];

  for (const table of requiredTables) {
    const { error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error && _error.message.includes('does not exist')) {
      missingTables.push(table);
    }
  }

  return {
    ready: missingTables.length === 0,
    missingTables,
    message: missingTables.length === 0 
      ? 'All network tables exist' 
      : `Missing tables: ${missingTables.join(', ')}. Please run migration 20240714_network_features_tables.sql`
  };
}