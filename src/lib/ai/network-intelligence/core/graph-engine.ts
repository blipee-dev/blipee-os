/**
 * Network Graph Engine
 * Core infrastructure for supply chain network analysis and ESG risk propagation
 */

import { createBrowserClient } from '@/lib/supabase/client';

export interface NetworkNode {
  id: string;
  type: 'organization' | 'supplier' | 'facility' | 'product';
  name: string;
  esgScore?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
  position?: { x: number; y: number };
}

export interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  type: 'supplies' | 'owns' | 'operates' | 'transports';
  weight: number; // Relationship strength/volume
  metadata: Record<string, any>;
}

export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    avgDegree: number;
    density: number;
    centralNodes: string[];
  };
}

export interface RiskPropagation {
  nodeId: string;
  directRisk: number;
  propagatedRisk: number;
  affectedNodes: Array<{
    id: string;
    riskContribution: number;
    path: string[];
  }>;
}

export class NetworkGraphEngine {
  private supabase;

  constructor() {
    this.supabase = createBrowserClient();
  }

  /**
   * Build supply chain network graph for an organization
   */
  async buildSupplyChainGraph(organizationId: string): Promise<NetworkGraph> {
    console.log('🔗 Building supply chain network graph...');

    try {
      // Get organization data
      const { data: org } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (!org) {
        throw new Error('Organization not found');
      }

      // Get suppliers
      const { data: suppliers } = await this.supabase
        .from('suppliers')
        .select('*')
        .eq('organization_id', organizationId);

      // Get facilities
      const { data: facilities } = await this.supabase
        .from('buildings')
        .select('*')
        .eq('organization_id', organizationId);

      // Build nodes
      const nodes: NetworkNode[] = [
        {
          id: org.id,
          type: 'organization',
          name: org.name,
          esgScore: 85, // TODO: Calculate from real data
          riskLevel: 'low',
          metadata: { ...org },
        },
      ];

      // Add supplier nodes
      if (suppliers) {
        suppliers.forEach(supplier => {
          nodes.push({
            id: supplier.id,
            type: 'supplier',
            name: supplier.name,
            esgScore: supplier.esg_score || 70,
            riskLevel: this.calculateRiskLevel(supplier.esg_score || 70),
            metadata: { ...supplier },
          });
        });
      }

      // Add facility nodes
      if (facilities) {
        facilities.forEach(facility => {
          nodes.push({
            id: facility.id,
            type: 'facility',
            name: facility.name,
            metadata: { ...facility },
          });
        });
      }

      // Build edges
      const edges: NetworkEdge[] = [];

      // Organization owns facilities
      if (facilities) {
        facilities.forEach(facility => {
          edges.push({
            id: `${org.id}-owns-${facility.id}`,
            source: org.id,
            target: facility.id,
            type: 'owns',
            weight: 1,
            metadata: {},
          });
        });
      }

      // Suppliers supply to organization
      if (suppliers) {
        suppliers.forEach(supplier => {
          edges.push({
            id: `${supplier.id}-supplies-${org.id}`,
            source: supplier.id,
            target: org.id,
            type: 'supplies',
            weight: supplier.volume || 0.5,
            metadata: {
              products: supplier.products || [],
              volume: supplier.volume,
            },
          });
        });
      }

      // Calculate network metrics
      const metadata = this.calculateNetworkMetrics(nodes, edges);

      // Apply force-directed layout
      this.applyForceDirectedLayout(nodes, edges);

      return {
        nodes,
        edges,
        metadata,
      };
    } catch (error) {
      console.error('Error building network graph:', error);
      throw error;
    }
  }

  /**
   * Calculate risk propagation through the network
   */
  async calculateNetworkRisk(nodeId: string, graph: NetworkGraph): Promise<RiskPropagation> {
    console.log('⚠️ Calculating risk propagation...');

    const node = graph.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error('Node not found in graph');
    }

    // Direct risk from the node
    const directRisk = this.nodeRiskScore(node);

    // Build adjacency map for efficient traversal
    const adjacencyMap = this.buildAdjacencyMap(graph.edges);

    // Propagate risk using modified PageRank algorithm
    const riskScores = this.propagateRisk(nodeId, directRisk, adjacencyMap, graph);

    // Calculate affected nodes
    const affectedNodes = Object.entries(riskScores)
      .filter(([id]) => id !== nodeId)
      .map(([id, risk]) => ({
        id,
        riskContribution: risk,
        path: this.findShortestPath(nodeId, id, adjacencyMap),
      }))
      .sort((a, b) => b.riskContribution - a.riskContribution);

    const propagatedRisk = affectedNodes.reduce((sum, node) => sum + node.riskContribution, 0);

    return {
      nodeId,
      directRisk,
      propagatedRisk,
      affectedNodes,
    };
  }

  /**
   * Find critical nodes using centrality measures
   */
  findCriticalNodes(graph: NetworkGraph): string[] {
    const adjacencyMap = this.buildAdjacencyMap(graph.edges);
    const centrality: Record<string, number> = {};

    // Calculate betweenness centrality
    graph.nodes.forEach(node => {
      centrality[node.id] = this.betweennessCentrality(node.id, graph, adjacencyMap);
    });

    // Sort by centrality and return top nodes
    return Object.entries(centrality)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);
  }

  /**
   * Identify network vulnerabilities
   */
  async identifyVulnerabilities(graph: NetworkGraph): Promise<{
    singlePointsOfFailure: NetworkNode[];
    highRiskClusters: NetworkNode[][];
    weakLinks: NetworkEdge[];
  }> {
    // Find nodes that would disconnect the graph if removed
    const singlePointsOfFailure = this.findArticulationPoints(graph);

    // Find clusters of high-risk nodes
    const highRiskClusters = this.findHighRiskClusters(graph);

    // Find weak links (low ESG score suppliers with high volume)
    const weakLinks = graph.edges.filter(edge => {
      const sourceNode = graph.nodes.find(n => n.id === edge.source);
      return sourceNode && 
             sourceNode.type === 'supplier' && 
             sourceNode.esgScore && 
             sourceNode.esgScore < 60 && 
             edge.weight > 0.7;
    });

    return {
      singlePointsOfFailure,
      highRiskClusters,
      weakLinks,
    };
  }

  // Private helper methods

  private calculateRiskLevel(esgScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (esgScore >= 80) return 'low';
    if (esgScore >= 60) return 'medium';
    if (esgScore >= 40) return 'high';
    return 'critical';
  }

  private nodeRiskScore(node: NetworkNode): number {
    if (!node.esgScore) return 0.5;
    return 1 - (node.esgScore / 100);
  }

  private calculateNetworkMetrics(nodes: NetworkNode[], edges: NetworkEdge[]) {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const avgDegree = (2 * totalEdges) / totalNodes;
    const maxPossibleEdges = (totalNodes * (totalNodes - 1)) / 2;
    const density = totalEdges / maxPossibleEdges;

    return {
      totalNodes,
      totalEdges,
      avgDegree,
      density,
      centralNodes: [],
    };
  }

  private buildAdjacencyMap(edges: NetworkEdge[]): Map<string, Set<string>> {
    const adjacencyMap = new Map<string, Set<string>>();
    
    edges.forEach(edge => {
      if (!adjacencyMap.has(edge.source)) {
        adjacencyMap.set(edge.source, new Set());
      }
      if (!adjacencyMap.has(edge.target)) {
        adjacencyMap.set(edge.target, new Set());
      }
      
      adjacencyMap.get(edge.source)!.add(edge.target);
      adjacencyMap.get(edge.target)!.add(edge.source);
    });
    
    return adjacencyMap;
  }

  private propagateRisk(
    sourceId: string,
    initialRisk: number,
    adjacencyMap: Map<string, Set<string>>,
    graph: NetworkGraph
  ): Record<string, number> {
    const riskScores: Record<string, number> = {};
    const dampingFactor = 0.85;
    const iterations = 10;

    // Initialize scores
    graph.nodes.forEach(node => {
      riskScores[node.id] = node.id === sourceId ? initialRisk : 0;
    });

    // Iterative propagation
    for (let i = 0; i < iterations; i++) {
      const newScores: Record<string, number> = {};

      graph.nodes.forEach(node => {
        let incomingRisk = 0;
        const neighbors = adjacencyMap.get(node.id) || new Set();

        neighbors.forEach(neighborId => {
          const edge = graph.edges.find(
            e => (e.source === neighborId && e.target === node.id) ||
                 (e.target === neighborId && e.source === node.id)
          );
          const weight = edge?.weight || 0.5;
          incomingRisk += riskScores[neighborId] * weight * dampingFactor;
        });

        newScores[node.id] = node.id === sourceId ? initialRisk : incomingRisk;
      });

      Object.assign(riskScores, newScores);
    }

    return riskScores;
  }

  private findShortestPath(
    source: string,
    target: string,
    adjacencyMap: Map<string, Set<string>>
  ): string[] {
    const queue: string[] = [source];
    const visited = new Set<string>([source]);
    const parent: Record<string, string> = {};

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current === target) {
        // Reconstruct path
        const path: string[] = [];
        let node = target;
        while (node !== source) {
          path.unshift(node);
          node = parent[node];
        }
        path.unshift(source);
        return path;
      }

      const neighbors = adjacencyMap.get(current) || new Set();
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent[neighbor] = current;
          queue.push(neighbor);
        }
      });
    }

    return [];
  }

  private betweennessCentrality(
    nodeId: string,
    graph: NetworkGraph,
    adjacencyMap: Map<string, Set<string>>
  ): number {
    let centrality = 0;
    const nodes = graph.nodes.filter(n => n.id !== nodeId);

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const source = nodes[i].id;
        const target = nodes[j].id;
        const shortestPaths = this.findAllShortestPaths(source, target, adjacencyMap);
        const pathsThroughNode = shortestPaths.filter(path => path.includes(nodeId));
        
        if (shortestPaths.length > 0) {
          centrality += pathsThroughNode.length / shortestPaths.length;
        }
      }
    }

    return centrality;
  }

  private findAllShortestPaths(
    source: string,
    target: string,
    adjacencyMap: Map<string, Set<string>>
  ): string[][] {
    // Simplified: return only one shortest path for now
    const path = this.findShortestPath(source, target, adjacencyMap);
    return path.length > 0 ? [path] : [];
  }

  private findArticulationPoints(graph: NetworkGraph): NetworkNode[] {
    // Simplified: return nodes with degree > average
    const adjacencyMap = this.buildAdjacencyMap(graph.edges);
    const avgDegree = graph.metadata.avgDegree;

    return graph.nodes.filter(node => {
      const degree = adjacencyMap.get(node.id)?.size || 0;
      return degree > avgDegree * 1.5;
    });
  }

  private findHighRiskClusters(graph: NetworkGraph): NetworkNode[][] {
    // Find connected components of high-risk nodes
    const highRiskNodes = graph.nodes.filter(n => n.riskLevel === 'high' || n.riskLevel === 'critical');
    const clusters: NetworkNode[][] = [];
    const visited = new Set<string>();

    highRiskNodes.forEach(node => {
      if (!visited.has(node.id)) {
        const cluster = this.dfsCluster(node, highRiskNodes, graph.edges, visited);
        if (cluster.length > 1) {
          clusters.push(cluster);
        }
      }
    });

    return clusters;
  }

  private dfsCluster(
    node: NetworkNode,
    candidateNodes: NetworkNode[],
    edges: NetworkEdge[],
    visited: Set<string>
  ): NetworkNode[] {
    visited.add(node.id);
    const cluster = [node];

    const connectedEdges = edges.filter(e => e.source === node.id || e.target === node.id);
    connectedEdges.forEach(edge => {
      const neighborId = edge.source === node.id ? edge.target : edge.source;
      const neighbor = candidateNodes.find(n => n.id === neighborId);
      
      if (neighbor && !visited.has(neighbor.id)) {
        cluster.push(...this.dfsCluster(neighbor, candidateNodes, edges, visited));
      }
    });

    return cluster;
  }

  private applyForceDirectedLayout(nodes: NetworkNode[], edges: NetworkEdge[]) {
    // Simple force-directed layout
    const iterations = 50;
    const k = Math.sqrt((1000 * 1000) / nodes.length); // Optimal distance

    // Initialize random positions
    nodes.forEach(node => {
      node.position = {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
      };
    });

    // Apply forces
    for (let iter = 0; iter < iterations; iter++) {
      // Repulsive forces between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].position!.x - nodes[i].position!.x;
          const dy = nodes[j].position!.y - nodes[i].position!.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 0.1;
          const force = (k * k) / distance;

          nodes[i].position!.x -= (dx / distance) * force;
          nodes[i].position!.y -= (dy / distance) * force;
          nodes[j].position!.x += (dx / distance) * force;
          nodes[j].position!.y += (dy / distance) * force;
        }
      }

      // Attractive forces for connected nodes
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source)!;
        const target = nodes.find(n => n.id === edge.target)!;
        
        const dx = target.position!.x - source.position!.x;
        const dy = target.position!.y - source.position!.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.1;
        const force = (distance * distance) / k;

        source.position!.x += (dx / distance) * force * 0.1;
        source.position!.y += (dy / distance) * force * 0.1;
        target.position!.x -= (dx / distance) * force * 0.1;
        target.position!.y -= (dy / distance) * force * 0.1;
      });
    }

    // Center the graph
    const centerX = 500;
    const centerY = 500;
    const avgX = nodes.reduce((sum, n) => sum + n.position!.x, 0) / nodes.length;
    const avgY = nodes.reduce((sum, n) => sum + n.position!.y, 0) / nodes.length;

    nodes.forEach(node => {
      node.position!.x += centerX - avgX;
      node.position!.y += centerY - avgY;
    });
  }
}