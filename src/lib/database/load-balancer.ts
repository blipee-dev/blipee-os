import { ReadReplicaPool } from './read-replica';

export interface LoadBalancerStrategy {
  name: string;
  select(replicas: ReadReplicaPool[]): ReadReplicaPool | null;
  reset?(): void;
}

/**
 * Round-robin load balancing strategy
 */
export class RoundRobinStrategy implements LoadBalancerStrategy {
  name = 'round-robin';
  private currentIndex = 0;

  select(replicas: ReadReplicaPool[]): ReadReplicaPool | null {
    const healthyReplicas = replicas.filter(r => r.healthy);
    if (healthyReplicas.length === 0) return null;

    const selected = healthyReplicas[this.currentIndex % healthyReplicas.length];
    this.currentIndex++;
    
    return selected;
  }

  reset(): void {
    this.currentIndex = 0;
  }
}

/**
 * Weighted round-robin load balancing strategy
 */
export class WeightedRoundRobinStrategy implements LoadBalancerStrategy {
  name = 'weighted-round-robin';
  private weightedList: ReadReplicaPool[] = [];
  private currentIndex = 0;

  select(replicas: ReadReplicaPool[]): ReadReplicaPool | null {
    const healthyReplicas = replicas.filter(r => r.healthy);
    if (healthyReplicas.length === 0) return null;

    // Rebuild weighted list if needed
    if (this.needsRebuild(healthyReplicas)) {
      this.buildWeightedList(healthyReplicas);
    }

    if (this.weightedList.length === 0) return null;

    const selected = this.weightedList[this.currentIndex % this.weightedList.length];
    this.currentIndex++;

    return selected;
  }

  private needsRebuild(replicas: ReadReplicaPool[]): boolean {
    // Simple check - could be more sophisticated
    return this.weightedList.length === 0 || 
           this.weightedList.some(r => !r.healthy);
  }

  private buildWeightedList(replicas: ReadReplicaPool[]): void {
    this.weightedList = [];
    
    for (const replica of replicas) {
      // Add replica to list based on its weight
      for (let i = 0; i < replica.weight; i++) {
        this.weightedList.push(replica);
      }
    }
    
    // Shuffle for better distribution
    for (let i = this.weightedList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.weightedList[i], this.weightedList[j]] = 
        [this.weightedList[j], this.weightedList[i]];
    }
  }

  reset(): void {
    this.currentIndex = 0;
    this.weightedList = [];
  }
}

/**
 * Least connections load balancing strategy
 */
export class LeastConnectionsStrategy implements LoadBalancerStrategy {
  name = 'least-connections';

  select(replicas: ReadReplicaPool[]): ReadReplicaPool | null {
    const healthyReplicas = replicas.filter(r => r.healthy);
    if (healthyReplicas.length === 0) return null;

    // Select replica with fewest active connections (approximated by request count)
    return healthyReplicas.reduce((min, replica) => 
      replica.requestCount < min.requestCount ? replica : min
    );
  }
}

/**
 * Least response time load balancing strategy
 */
export class LeastResponseTimeStrategy implements LoadBalancerStrategy {
  name = 'least-response-time';

  select(replicas: ReadReplicaPool[]): ReadReplicaPool | null {
    const healthyReplicas = replicas.filter(r => r.healthy);
    if (healthyReplicas.length === 0) return null;

    // Select replica with lowest average latency
    return healthyReplicas.reduce((min, replica) => 
      replica.averageLatency < min.averageLatency ? replica : min
    );
  }
}

/**
 * Random load balancing strategy
 */
export class RandomStrategy implements LoadBalancerStrategy {
  name = 'random';

  select(replicas: ReadReplicaPool[]): ReadReplicaPool | null {
    const healthyReplicas = replicas.filter(r => r.healthy);
    if (healthyReplicas.length === 0) return null;

    const index = Math.floor(Math.random() * healthyReplicas.length);
    return healthyReplicas[index];
  }
}

/**
 * Geographic proximity load balancing strategy
 */
export class GeographicStrategy implements LoadBalancerStrategy {
  name = 'geographic';
  
  constructor(private userRegion?: string) {}

  select(replicas: ReadReplicaPool[]): ReadReplicaPool | null {
    const healthyReplicas = replicas.filter(r => r.healthy);
    if (healthyReplicas.length === 0) return null;

    // If we have user region, prefer replicas in the same region
    if (this.userRegion) {
      const regionalReplicas = healthyReplicas.filter(
        r => r.region === this.userRegion
      );
      
      if (regionalReplicas.length > 0) {
        // Use least response time among regional replicas
        return regionalReplicas.reduce((min, replica) => 
          replica.averageLatency < min.averageLatency ? replica : min
        );
      }
    }

    // Fall back to least response time globally
    return healthyReplicas.reduce((min, replica) => 
      replica.averageLatency < min.averageLatency ? replica : min
    );
  }

  setUserRegion(region: string): void {
    this.userRegion = region;
  }
}

/**
 * Hash-based load balancing strategy (for consistent routing)
 */
export class HashStrategy implements LoadBalancerStrategy {
  name = 'hash';

  select(replicas: ReadReplicaPool[], key?: string): ReadReplicaPool | null {
    const healthyReplicas = replicas.filter(r => r.healthy);
    if (healthyReplicas.length === 0) return null;

    // Use key to consistently route to the same replica
    const hash = key ? this.hashString(key) : Math.random();
    const index = Math.abs(hash) % healthyReplicas.length;
    
    return healthyReplicas[index];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }
}

/**
 * Adaptive load balancing strategy that switches based on conditions
 */
export class AdaptiveStrategy implements LoadBalancerStrategy {
  name = 'adaptive';
  private strategies: Map<string, LoadBalancerStrategy> = new Map();
  private currentStrategy: LoadBalancerStrategy;

  constructor() {
    // Initialize available strategies
    this.strategies.set('round-robin', new RoundRobinStrategy());
    this.strategies.set('least-connections', new LeastConnectionsStrategy());
    this.strategies.set('least-response-time', new LeastResponseTimeStrategy());
    this.strategies.set('weighted-round-robin', new WeightedRoundRobinStrategy());
    
    // Start with round-robin
    this.currentStrategy = this.strategies.get('round-robin')!;
  }

  select(replicas: ReadReplicaPool[]): ReadReplicaPool | null {
    // Adapt strategy based on current conditions
    this.adaptStrategy(replicas);
    
    return this.currentStrategy.select(replicas);
  }

  private adaptStrategy(replicas: ReadReplicaPool[]): void {
    const healthyReplicas = replicas.filter(r => r.healthy);
    if (healthyReplicas.length === 0) return;

    // Calculate metrics
    const avgLatency = healthyReplicas.reduce((sum, r) => sum + r.averageLatency, 0) / healthyReplicas.length;
    const latencyVariance = this.calculateVariance(healthyReplicas.map(r => r.averageLatency));
    const loadVariance = this.calculateVariance(healthyReplicas.map(r => r.requestCount));

    // Switch strategy based on conditions
    if (latencyVariance > avgLatency * 0.5) {
      // High latency variance - use least response time
      this.switchStrategy('least-response-time');
    } else if (loadVariance > healthyReplicas.length * 10) {
      // Uneven load distribution - use least connections
      this.switchStrategy('least-connections');
    } else if (healthyReplicas.some(r => r.weight !== 1)) {
      // Weighted replicas - use weighted round-robin
      this.switchStrategy('weighted-round-robin');
    } else {
      // Default to round-robin for even distribution
      this.switchStrategy('round-robin');
    }
  }

  private switchStrategy(name: string): void {
    const newStrategy = this.strategies.get(name);
    if (newStrategy && newStrategy !== this.currentStrategy) {
      this.currentStrategy = newStrategy;
    }
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  reset(): void {
    this.strategies.forEach(strategy => {
      if (strategy.reset) {
        strategy.reset();
      }
    });
  }
}

/**
 * Load balancer configuration
 */
export interface LoadBalancerConfig {
  strategy: 'round-robin' | 'weighted-round-robin' | 'least-connections' | 
            'least-response-time' | 'random' | 'geographic' | 'hash' | 'adaptive';
  healthCheckInterval?: number;
  failoverThreshold?: number;
  stickySession?: boolean;
  sessionTimeout?: number;
}

/**
 * Create a load balancer strategy
 */
export function createLoadBalancer(
  config: LoadBalancerConfig,
  userRegion?: string
): LoadBalancerStrategy {
  switch (config.strategy) {
    case 'round-robin':
      return new RoundRobinStrategy();
    case 'weighted-round-robin':
      return new WeightedRoundRobinStrategy();
    case 'least-connections':
      return new LeastConnectionsStrategy();
    case 'least-response-time':
      return new LeastResponseTimeStrategy();
    case 'random':
      return new RandomStrategy();
    case 'geographic':
      return new GeographicStrategy(userRegion);
    case 'hash':
      return new HashStrategy();
    case 'adaptive':
      return new AdaptiveStrategy();
    default:
      return new RoundRobinStrategy();
  }
}