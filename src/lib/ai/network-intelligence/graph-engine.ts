import { createClient } from '@supabase/supabase-js';
import {
  NetworkNode,
  NetworkEdge,
  NetworkGraph,
  NetworkMetrics,
  RiskAnalysis,
  Risk,
  PropagationPath,
  Community,
  ResilienceMetrics
} from './types';

interface GraphAnalysisOptions {
  includeInactive?: boolean;
  maxDepth?: number;
  minRelationshipStrength?: number;
}

interface PathAnalysisResult {
  path: string[];
  length: number;
  strength: number;
  risks: Risk[];
}

export class NetworkGraphEngine {
  private supabase: ReturnType<typeof createClient>;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * Build network graph for an organization
   */
  async buildNetwork(organizationId: string, options: GraphAnalysisOptions = {}): Promise<NetworkGraph> {
    const cacheKey = `network-${organizationId}-${JSON.stringify(options)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Get organization's network node
      const { data: orgNode } = await this.supabase
        .from('network_nodes')
        .select('*')
        .eq('organization_id', organizationId)
        .single();

      if (!orgNode) {
        throw new Error('Organization not found in network');
      }

      // Load connected nodes and edges
      const nodes = await this.loadConnectedNodes(orgNode.id, options);
      const edges = await this.loadConnectedEdges(nodes.map(n => n.id), options);

      // Calculate network metrics
      const metrics = await this.calculateNetworkMetrics(nodes, edges);

      const networkGraph: NetworkGraph = {
        nodes,
        edges,
        metrics
      };

      this.setCached(cacheKey, networkGraph);
      return networkGraph;

    } catch (error) {
      console.error('Error building network:', error);
      throw error;
    }
  }

  /**
   * Analyze supply chain risk propagation
   */
  async analyzeSupplyChainRisk(
    organizationId: string,
    depth: number = 3
  ): Promise<RiskAnalysis> {
    try {
      const network = await this.buildNetwork(organizationId, { maxDepth: depth });
      const risks: Risk[] = [];

      // Get organization's node
      const orgNode = network.nodes.find(n => n.organizationId === organizationId);
      if (!orgNode) throw new Error('Organization node not found');

      // Analyze direct suppliers (tier 1)
      const directSuppliers = this.getDirectSuppliers(orgNode.id, network);
      for (const supplier of directSuppliers) {
        const risk = await this.assessNodeRisk(supplier, network, 1);
        if (risk.score > 0.3) { // Risk threshold
          risks.push(risk);
        }
      }

      // Analyze indirect suppliers (tier 2+)
      for (let tier = 2; tier <= depth; tier++) {
        const tierSuppliers = this.getTierSuppliers(orgNode.id, network, tier);
        for (const supplier of tierSuppliers) {
          const risk = await this.assessNodeRisk(supplier, network, tier);
          if (risk.score > 0.5) { // Higher threshold for indirect risks
            risks.push(risk);
          }
        }
      }

      // Analyze risk propagation paths
      const propagationPaths = await this.simulateRiskPropagation(orgNode.id, risks, network);

      return {
        directRisks: risks.filter(r => r.tier === 1),
        indirectRisks: risks.filter(r => r.tier > 1),
        propagationPaths,
        recommendations: this.generateRiskMitigation(risks)
      };

    } catch (error) {
      console.error('Error analyzing supply chain risk:', error);
      throw error;
    }
  }

  /**
   * Find shortest path between two nodes
   */
  async findShortestPath(sourceId: string, targetId: string): Promise<PathAnalysisResult | null> {
    try {
      // Dijkstra's algorithm implementation for weighted graph
      const allNodes = await this.loadAllNetworkNodes();
      const allEdges = await this.loadAllNetworkEdges();

      const distances = new Map<string, number>();
      const previous = new Map<string, string | null>();
      const unvisited = new Set<string>();

      // Initialize distances
      for (const node of allNodes) {
        distances.set(node.id, node.id === sourceId ? 0 : Infinity);
        previous.set(node.id, null);
        unvisited.add(node.id);
      }

      while (unvisited.size > 0) {
        // Find unvisited node with minimum distance
        let current: string | null = null;
        let minDistance = Infinity;
        
        for (const nodeId of unvisited) {
          const distance = distances.get(nodeId) || Infinity;
          if (distance < minDistance) {
            minDistance = distance;
            current = nodeId;
          }
        }

        if (!current || minDistance === Infinity) break;
        if (current === targetId) break;

        unvisited.delete(current);

        // Check neighbors
        const neighbors = allEdges.filter(e => 
          e.sourceNodeId === current || e.targetNodeId === current
        );

        for (const edge of neighbors) {
          const neighbor = edge.sourceNodeId === current ? edge.targetNodeId : edge.sourceNodeId;
          if (!unvisited.has(neighbor)) continue;

          // Weight is inverse of relationship strength (lower is better)
          const weight = 1 - (edge.relationshipStrength || 0.5);
          const alt = (distances.get(current) || 0) + weight;

          if (alt < (distances.get(neighbor) || Infinity)) {
            distances.set(neighbor, alt);
            previous.set(neighbor, current);
          }
        }
      }

      // Reconstruct path
      if (!previous.has(targetId) || previous.get(targetId) === null) {
        return null; // No path found
      }

      const path: string[] = [];
      let current: string | null = targetId;
      
      while (current !== null) {
        path.unshift(current);
        current = previous.get(current) || null;
      }

      // Calculate path metrics
      const pathEdges = this.getPathEdges(path, allEdges);
      const avgStrength = pathEdges.reduce((sum, e) => sum + (e.relationshipStrength || 0), 0) / pathEdges.length;
      const pathRisks = await this.calculatePathRisks(path);

      return {
        path,
        length: path.length - 1,
        strength: avgStrength,
        risks: pathRisks
      };

    } catch (error) {
      console.error('Error finding shortest path:', error);
      return null;
    }
  }

  /**
   * Detect communities in the network
   */
  async detectCommunities(nodes: NetworkNode[], edges: NetworkEdge[]): Promise<Community[]> {
    try {
      // Simple modularity-based community detection
      const communities: Community[] = [];
      const visited = new Set<string>();
      let communityId = 0;

      for (const node of nodes) {
        if (visited.has(node.id)) continue;

        const community = await this.expandCommunity(node, nodes, edges, visited);
        if (community.length >= 3) { // Minimum community size
          communities.push({
            id: `community-${communityId++}`,
            nodes: community,
            cohesion: this.calculateCohesion(community, edges),
            size: community.length,
            industry: this.getDominantIndustry(community.map(id => nodes.find(n => n.id === id)!))
          });
        }
      }

      return communities;

    } catch (error) {
      console.error('Error detecting communities:', error);
      return [];
    }
  }

  /**
   * Calculate network resilience metrics
   */
  async calculateResilience(nodes: NetworkNode[], edges: NetworkEdge[]): Promise<ResilienceMetrics> {
    try {
      // Calculate node betweenness centrality to identify critical nodes
      const betweenness = await this.calculateBetweennessCentrality(nodes, edges);
      const criticalNodes = Object.entries(betweenness)
        .sort(([,a], [,b]) => b - a)
        .slice(0, Math.ceil(nodes.length * 0.1)) // Top 10%
        .map(([nodeId]) => nodeId);

      // Calculate redundancy (alternative paths)
      const redundancy = await this.calculateRedundancy(nodes, edges);

      // Calculate robustness (resistance to random failures)
      const robustness = await this.calculateRobustness(nodes, edges);

      // Overall vulnerability score
      const vulnerabilityScore = this.calculateVulnerabilityScore(
        criticalNodes.length / nodes.length,
        redundancy,
        robustness
      );

      return {
        redundancy,
        robustness,
        criticalNodes,
        vulnerabilityScore
      };

    } catch (error) {
      console.error('Error calculating resilience:', error);
      return {
        redundancy: 0,
        robustness: 0,
        criticalNodes: [],
        vulnerabilityScore: 1
      };
    }
  }

  // Private helper methods

  private async loadConnectedNodes(nodeId: string, options: GraphAnalysisOptions): Promise<NetworkNode[]> {
    const { data: nodes } = await this.supabase
      .from('network_nodes')
      .select(`
        *,
        source_edges:network_edges!source_node_id(*),
        target_edges:network_edges!target_node_id(*)
      `)
      .or(`id.eq.${nodeId},source_edges.target_node_id.eq.${nodeId},target_edges.source_node_id.eq.${nodeId}`)
      .limit(1000); // Reasonable limit

    return nodes?.map(this.mapToNetworkNode) || [];
  }

  private async loadConnectedEdges(nodeIds: string[], options: GraphAnalysisOptions): Promise<NetworkEdge[]> {
    let query = this.supabase
      .from('network_edges')
      .select('*')
      .or(`source_node_id.in.(${nodeIds.join(',')}),target_node_id.in.(${nodeIds.join(',')})`);

    if (!options.includeInactive) {
      query = query.eq('relationship_status', 'active');
    }

    if (options.minRelationshipStrength) {
      query = query.gte('relationship_strength', options.minRelationshipStrength);
    }

    const { data: edges } = await query;
    return edges?.map(this.mapToNetworkEdge) || [];
  }

  private async loadAllNetworkNodes(): Promise<NetworkNode[]> {
    const { data: nodes } = await this.supabase
      .from('network_nodes')
      .select('*')
      .eq('verification_status', 'verified')
      .limit(10000);

    return nodes?.map(this.mapToNetworkNode) || [];
  }

  private async loadAllNetworkEdges(): Promise<NetworkEdge[]> {
    const { data: edges } = await this.supabase
      .from('network_edges')
      .select('*')
      .eq('relationship_status', 'active')
      .limit(50000);

    return edges?.map(this.mapToNetworkEdge) || [];
  }

  private mapToNetworkNode(row: any): NetworkNode {
    return {
      id: row.id,
      organizationId: row.organization_id,
      externalId: row.external_id,
      type: row.node_type,
      name: row.node_name,
      industry: row.industry,
      subIndustry: row.sub_industry,
      location: row.location,
      sizeCategory: row.size_category,
      certifications: row.certifications || [],
      esgScore: row.esg_score,
      sustainabilityRating: row.sustainability_rating,
      dataSharingLevel: row.data_sharing_level,
      verificationStatus: row.verification_status,
      metadata: row.metadata || {},
      joinedNetworkAt: new Date(row.joined_network_at),
      lastActivityAt: row.last_activity_at ? new Date(row.last_activity_at) : undefined
    };
  }

  private mapToNetworkEdge(row: any): NetworkEdge {
    return {
      id: row.id,
      sourceNodeId: row.source_node_id,
      targetNodeId: row.target_node_id,
      type: row.edge_type,
      relationshipStrength: row.relationship_strength,
      relationshipStatus: row.relationship_status,
      volumeInfo: row.volume_info,
      contractValue: row.contract_value,
      contractDurationMonths: row.contract_duration_months,
      sustainabilityScore: row.sustainability_score,
      riskScore: row.risk_score,
      tierLevel: row.tier_level,
      criticality: row.criticality,
      metadata: row.metadata || {}
    };
  }

  private async calculateNetworkMetrics(nodes: NetworkNode[], edges: NetworkEdge[]): Promise<NetworkMetrics> {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const density = totalEdges / (totalNodes * (totalNodes - 1) / 2);
    
    // Calculate centrality measures
    const centrality = {
      degree: this.calculateDegreeCentrality(nodes, edges),
      betweenness: await this.calculateBetweennessCentrality(nodes, edges),
      eigenvector: this.calculateEigenvectorCentrality(nodes, edges)
    };

    // Detect communities
    const communities = await this.detectCommunities(nodes, edges);

    // Calculate resilience
    const resilience = await this.calculateResilience(nodes, edges);

    // Calculate clustering coefficient
    const clusteringCoefficient = this.calculateClusteringCoefficient(nodes, edges);

    // Calculate average path length
    const averagePathLength = await this.calculateAveragePathLength(nodes, edges);

    return {
      totalNodes,
      totalEdges,
      density,
      clusteringCoefficient,
      averagePathLength,
      centrality,
      communities,
      resilience
    };
  }

  private calculateDegreeCentrality(nodes: NetworkNode[], edges: NetworkEdge[]): Record<string, number> {
    const degree: Record<string, number> = {};
    
    for (const node of nodes) {
      degree[node.id] = edges.filter(e => 
        e.sourceNodeId === node.id || e.targetNodeId === node.id
      ).length;
    }

    return degree;
  }

  private async calculateBetweennessCentrality(nodes: NetworkNode[], edges: NetworkEdge[]): Promise<Record<string, number>> {
    const betweenness: Record<string, number> = {};
    
    // Initialize all to 0
    for (const node of nodes) {
      betweenness[node.id] = 0;
    }

    // For each pair of nodes, find all shortest paths and count how many go through each node
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const paths = await this.findAllShortestPaths(nodes[i].id, nodes[j].id, nodes, edges);
        
        if (paths.length > 0) {
          for (const path of paths) {
            // Count intermediate nodes
            for (let k = 1; k < path.length - 1; k++) {
              betweenness[path[k]] += 1 / paths.length;
            }
          }
        }
      }
    }

    return betweenness;
  }

  private calculateEigenvectorCentrality(nodes: NetworkNode[], edges: NetworkEdge[]): Record<string, number> {
    // Simplified eigenvector centrality calculation
    const centrality: Record<string, number> = {};
    
    // Initialize all to 1
    for (const node of nodes) {
      centrality[node.id] = 1;
    }

    // Power iteration method (simplified)
    for (let iter = 0; iter < 100; iter++) {
      const newCentrality: Record<string, number> = {};
      
      for (const node of nodes) {
        newCentrality[node.id] = 0;
        
        // Sum centrality of connected nodes
        const connectedEdges = edges.filter(e => 
          e.sourceNodeId === node.id || e.targetNodeId === node.id
        );
        
        for (const edge of connectedEdges) {
          const otherId = edge.sourceNodeId === node.id ? edge.targetNodeId : edge.sourceNodeId;
          newCentrality[node.id] += centrality[otherId] * (edge.relationshipStrength || 0.5);
        }
      }
      
      // Normalize
      const sum = Object.values(newCentrality).reduce((a, b) => a + b, 0);
      for (const nodeId in newCentrality) {
        centrality[nodeId] = newCentrality[nodeId] / sum;
      }
    }

    return centrality;
  }

  private calculateClusteringCoefficient(nodes: NetworkNode[], edges: NetworkEdge[]): number {
    let totalClustering = 0;
    
    for (const node of nodes) {
      const neighbors = this.getNeighbors(node.id, edges);
      
      if (neighbors.length < 2) {
        continue; // Need at least 2 neighbors
      }
      
      // Count edges between neighbors
      let edgesBetweenNeighbors = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          if (edges.some(e => 
            (e.sourceNodeId === neighbors[i] && e.targetNodeId === neighbors[j]) ||
            (e.sourceNodeId === neighbors[j] && e.targetNodeId === neighbors[i])
          )) {
            edgesBetweenNeighbors++;
          }
        }
      }
      
      // Clustering coefficient for this node
      const possibleEdges = neighbors.length * (neighbors.length - 1) / 2;
      totalClustering += edgesBetweenNeighbors / possibleEdges;
    }
    
    return totalClustering / nodes.length;
  }

  private async calculateAveragePathLength(nodes: NetworkNode[], edges: NetworkEdge[]): Promise<number> {
    let totalLength = 0;
    let pathCount = 0;
    
    // Sample a subset for performance
    const sampleSize = Math.min(nodes.length, 100);
    const sampleNodes = nodes.slice(0, sampleSize);
    
    for (let i = 0; i < sampleNodes.length; i++) {
      for (let j = i + 1; j < sampleNodes.length; j++) {
        const path = await this.findShortestPath(sampleNodes[i].id, sampleNodes[j].id);
        if (path) {
          totalLength += path.length;
          pathCount++;
        }
      }
    }
    
    return pathCount > 0 ? totalLength / pathCount : 0;
  }

  private getDirectSuppliers(nodeId: string, network: NetworkGraph): NetworkNode[] {
    const supplierEdges = network.edges.filter(e => 
      (e.targetNodeId === nodeId && e.type === 'supplies_to') ||
      (e.sourceNodeId === nodeId && e.type === 'buys_from')
    );

    return supplierEdges.map(e => {
      const supplierId = e.targetNodeId === nodeId ? e.sourceNodeId : e.targetNodeId;
      return network.nodes.find(n => n.id === supplierId)!;
    }).filter(Boolean);
  }

  private getTierSuppliers(nodeId: string, network: NetworkGraph, tier: number): NetworkNode[] {
    if (tier === 1) {
      return this.getDirectSuppliers(nodeId, network);
    }

    const previousTier = this.getTierSuppliers(nodeId, network, tier - 1);
    const currentTier: NetworkNode[] = [];

    for (const supplier of previousTier) {
      const nextTierSuppliers = this.getDirectSuppliers(supplier.id, network);
      currentTier.push(...nextTierSuppliers);
    }

    // Remove duplicates
    return currentTier.filter((node, index, array) => 
      array.findIndex(n => n.id === node.id) === index
    );
  }

  private async assessNodeRisk(node: NetworkNode, network: NetworkGraph, tier: number): Promise<Risk> {
    // Simplified risk assessment
    let riskScore = 0;

    // Location risk
    if (node.location?.country && this.isHighRiskCountry(node.location.country)) {
      riskScore += 0.3;
    }

    // ESG score risk
    if (node.esgScore && node.esgScore < 50) {
      riskScore += 0.2;
    }

    // Verification risk
    if (node.verificationStatus !== 'verified') {
      riskScore += 0.1;
    }

    // Concentration risk (if this supplier is critical)
    const connections = network.edges.filter(e => 
      e.sourceNodeId === node.id || e.targetNodeId === node.id
    );
    if (connections.length === 1) {
      riskScore += 0.2; // Single point of failure
    }

    // Tier risk (higher tiers are riskier)
    riskScore += (tier - 1) * 0.1;

    return {
      id: `risk-${node.id}`,
      type: 'supplier_risk',
      description: `Risk assessment for ${node.name}`,
      probability: Math.min(riskScore, 1),
      impact: this.calculateImpact(node, network),
      score: Math.min(riskScore, 1),
      tier,
      mitigation: this.generateMitigationStrategies(node, riskScore)
    };
  }

  private async simulateRiskPropagation(
    sourceNodeId: string, 
    risks: Risk[], 
    network: NetworkGraph
  ): Promise<PropagationPath[]> {
    const paths: PropagationPath[] = [];

    for (const risk of risks) {
      const riskNodeId = risk.id.replace('risk-', '');
      const path = await this.findShortestPath(riskNodeId, sourceNodeId);
      
      if (path) {
        paths.push({
          source: riskNodeId,
          target: sourceNodeId,
          path: path.path,
          probability: risk.probability * 0.8, // Reduces as it propagates
          impact: risk.impact * Math.pow(0.9, path.length) // Reduces with distance
        });
      }
    }

    return paths;
  }

  private generateRiskMitigation(risks: Risk[]): string[] {
    const strategies = new Set<string>();

    for (const risk of risks) {
      if (risk.type === 'supplier_risk') {
        strategies.add('Diversify supplier base to reduce concentration risk');
        strategies.add('Implement supplier monitoring and early warning systems');
        strategies.add('Develop alternative supplier relationships');
        
        if (risk.tier > 1) {
          strategies.add('Increase visibility into indirect suppliers');
          strategies.add('Require tier-1 suppliers to manage their supply chains');
        }
      }
    }

    return Array.from(strategies);
  }

  private getCached(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Additional helper methods would be implemented here...
  private isHighRiskCountry(country: string): boolean {
    // Implement based on risk databases
    const highRiskCountries = ['Country1', 'Country2']; // Example
    return highRiskCountries.includes(country);
  }

  private calculateImpact(node: NetworkNode, network: NetworkGraph): number {
    // Calculate business impact based on connections and criticality
    const connections = network.edges.filter(e => 
      e.sourceNodeId === node.id || e.targetNodeId === node.id
    );
    
    const avgCriticality = connections.reduce((sum, e) => {
      const criticalityScore = e.criticality === 'critical' ? 1 : 
                              e.criticality === 'high' ? 0.7 :
                              e.criticality === 'medium' ? 0.4 : 0.2;
      return sum + criticalityScore;
    }, 0) / connections.length;

    return Math.min(avgCriticality || 0.5, 1);
  }

  private generateMitigationStrategies(node: NetworkNode, riskScore: number): string[] {
    const strategies: string[] = [];
    
    if (riskScore > 0.7) {
      strategies.push('Consider immediate replacement or diversification');
    }
    if (riskScore > 0.5) {
      strategies.push('Implement enhanced monitoring and backup plans');
    }
    
    strategies.push('Regular risk assessments and compliance checks');
    strategies.push('Develop alternative supplier relationships');
    
    return strategies;
  }

  private async findAllShortestPaths(
    sourceId: string, 
    targetId: string, 
    nodes: NetworkNode[], 
    edges: NetworkEdge[]
  ): Promise<string[][]> {
    // Simplified - would implement proper all shortest paths algorithm
    const path = await this.findShortestPath(sourceId, targetId);
    return path ? [path.path] : [];
  }

  private getNeighbors(nodeId: string, edges: NetworkEdge[]): string[] {
    const neighbors: string[] = [];
    
    for (const edge of edges) {
      if (edge.sourceNodeId === nodeId) {
        neighbors.push(edge.targetNodeId);
      } else if (edge.targetNodeId === nodeId) {
        neighbors.push(edge.sourceNodeId);
      }
    }
    
    return neighbors;
  }

  private getPathEdges(path: string[], edges: NetworkEdge[]): NetworkEdge[] {
    const pathEdges: NetworkEdge[] = [];
    
    for (let i = 0; i < path.length - 1; i++) {
      const edge = edges.find(e => 
        (e.sourceNodeId === path[i] && e.targetNodeId === path[i + 1]) ||
        (e.sourceNodeId === path[i + 1] && e.targetNodeId === path[i])
      );
      
      if (edge) {
        pathEdges.push(edge);
      }
    }
    
    return pathEdges;
  }

  private async calculatePathRisks(path: string[]): Promise<Risk[]> {
    // Simplified path risk calculation
    const risks: Risk[] = [];
    
    for (const nodeId of path) {
      // Would load actual risk data for each node
      risks.push({
        id: `path-risk-${nodeId}`,
        type: 'path_risk',
        description: `Risk for node in path`,
        probability: 0.1,
        impact: 0.1,
        score: 0.1,
        tier: 1,
        mitigation: []
      });
    }
    
    return risks;
  }

  private async expandCommunity(
    startNode: NetworkNode,
    nodes: NetworkNode[],
    edges: NetworkEdge[],
    visited: Set<string>
  ): Promise<string[]> {
    const community: string[] = [];
    const queue: string[] = [startNode.id];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      if (visited.has(currentId)) continue;
      
      visited.add(currentId);
      community.push(currentId);
      
      // Add neighbors with strong connections
      const neighbors = this.getNeighbors(currentId, edges);
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          const edge = edges.find(e => 
            (e.sourceNodeId === currentId && e.targetNodeId === neighborId) ||
            (e.sourceNodeId === neighborId && e.targetNodeId === currentId)
          );
          
          if (edge && (edge.relationshipStrength || 0) > 0.5) {
            queue.push(neighborId);
          }
        }
      }
    }
    
    return community;
  }

  private calculateCohesion(community: string[], edges: NetworkEdge[]): number {
    let internalEdges = 0;
    let possibleEdges = community.length * (community.length - 1) / 2;
    
    for (let i = 0; i < community.length; i++) {
      for (let j = i + 1; j < community.length; j++) {
        if (edges.some(e => 
          (e.sourceNodeId === community[i] && e.targetNodeId === community[j]) ||
          (e.sourceNodeId === community[j] && e.targetNodeId === community[i])
        )) {
          internalEdges++;
        }
      }
    }
    
    return possibleEdges > 0 ? internalEdges / possibleEdges : 0;
  }

  private getDominantIndustry(nodes: NetworkNode[]): string | undefined {
    const industries = new Map<string, number>();
    
    for (const node of nodes) {
      if (node.industry) {
        industries.set(node.industry, (industries.get(node.industry) || 0) + 1);
      }
    }
    
    let maxCount = 0;
    let dominantIndustry: string | undefined;
    
    for (const [industry, count] of industries) {
      if (count > maxCount) {
        maxCount = count;
        dominantIndustry = industry;
      }
    }
    
    return dominantIndustry;
  }

  private async calculateRedundancy(nodes: NetworkNode[], edges: NetworkEdge[]): Promise<number> {
    // Calculate average number of alternative paths
    let totalRedundancy = 0;
    let pairCount = 0;
    
    // Sample pairs for performance
    const sampleSize = Math.min(nodes.length, 50);
    
    for (let i = 0; i < sampleSize; i++) {
      for (let j = i + 1; j < sampleSize; j++) {
        const paths = await this.findAllShortestPaths(nodes[i].id, nodes[j].id, nodes, edges);
        totalRedundancy += paths.length;
        pairCount++;
      }
    }
    
    return pairCount > 0 ? totalRedundancy / pairCount : 0;
  }

  private async calculateRobustness(nodes: NetworkNode[], edges: NetworkEdge[]): Promise<number> {
    // Simulate random node failures and measure connectivity
    const iterations = 10;
    let totalConnectivity = 0;
    
    for (let iter = 0; iter < iterations; iter++) {
      // Remove 10% of nodes randomly
      const remainingNodes = nodes.filter(() => Math.random() > 0.1);
      const remainingEdges = edges.filter(e => 
        remainingNodes.some(n => n.id === e.sourceNodeId) &&
        remainingNodes.some(n => n.id === e.targetNodeId)
      );
      
      // Measure connectivity
      const connectivity = this.measureConnectivity(remainingNodes, remainingEdges);
      totalConnectivity += connectivity;
    }
    
    return totalConnectivity / iterations;
  }

  private measureConnectivity(nodes: NetworkNode[], edges: NetworkEdge[]): number {
    if (nodes.length === 0) return 0;
    
    // Simple connectivity measure: ratio of connected node pairs
    let connectedPairs = 0;
    const totalPairs = nodes.length * (nodes.length - 1) / 2;
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (this.areConnected(nodes[i].id, nodes[j].id, edges)) {
          connectedPairs++;
        }
      }
    }
    
    return totalPairs > 0 ? connectedPairs / totalPairs : 0;
  }

  private areConnected(nodeId1: string, nodeId2: string, edges: NetworkEdge[]): boolean {
    // Simple BFS to check connectivity
    const visited = new Set<string>();
    const queue = [nodeId1];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current === nodeId2) return true;
      if (visited.has(current)) continue;
      
      visited.add(current);
      
      const neighbors = edges
        .filter(e => e.sourceNodeId === current || e.targetNodeId === current)
        .map(e => e.sourceNodeId === current ? e.targetNodeId : e.sourceNodeId);
      
      queue.push(...neighbors.filter(n => !visited.has(n)));
    }
    
    return false;
  }

  private calculateVulnerabilityScore(
    criticalNodeRatio: number,
    redundancy: number,
    robustness: number
  ): number {
    // Higher critical node ratio = more vulnerable
    // Lower redundancy = more vulnerable  
    // Lower robustness = more vulnerable
    return (criticalNodeRatio + (1 - redundancy/10) + (1 - robustness)) / 3;
  }
}