import { createClient } from '@supabase/supabase-js';
import { AgentManager } from '../ai/autonomous-agents/agent-manager';
import { MLDeploymentService } from '../ml/model-deployment-service';
import { ExternalAPIManager } from '../data/external-api-manager';
import { NetworkIntelligenceService } from '../network/network-intelligence-service';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: CheckResult;
    agents: CheckResult;
    mlModels: CheckResult;
    externalAPIs: CheckResult;
    network: CheckResult;
  };
  metrics?: {
    uptime: number;
    requestsPerMinute: number;
    averageResponseTime: number;
    activeUsers: number;
  };
}

export interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  latency?: number;
  details?: any;
}

export class HealthCheckService {
  private static instance: HealthCheckService;
  private startTime: Date;
  private requestCount = 0;
  private totalResponseTime = 0;

  private constructor() {
    this.startTime = new Date();
  }

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  /**
   * Perform comprehensive health check
   */
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkAgents(),
      this.checkMLModels(),
      this.checkExternalAPIs(),
      this.checkNetwork()
    ]);

    const [database, agents, mlModels, externalAPIs, network] = checks;

    // Determine overall status
    const hasFailure = checks.some(c => c.status === 'fail');
    const hasWarning = checks.some(c => c.status === 'warn');
    
    const status = hasFailure ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database,
        agents,
        mlModels,
        externalAPIs,
        network
      },
      metrics: this.getMetrics()
    };
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<CheckResult> {
    const start = Date.now();
    
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      // Simple query to test connection
      const { data, error } = await supabase
        .from('organizations')
        .select('count')
        .limit(1);

      const latency = Date.now() - start;

      if (error) {
        return {
          status: 'fail',
          message: `Database error: ${error.message}`,
          latency
        };
      }

      if (latency > 1000) {
        return {
          status: 'warn',
          message: `Database slow: ${latency}ms`,
          latency
        };
      }

      return {
        status: 'pass',
        message: 'Database healthy',
        latency
      };

    } catch (error) {
      return {
        status: 'fail',
        message: `Database unreachable: ${error.message}`,
        latency: Date.now() - start
      };
    }
  }

  /**
   * Check agent system health
   */
  private async checkAgents(): Promise<CheckResult> {
    try {
      const agentManager = AgentManager.getInstance();
      const statuses = agentManager.getAllAgentStatuses();
      
      const activeAgents = statuses.filter(s => s.status === 'running').length;
      const totalAgents = statuses.length;
      
      if (activeAgents === 0 && totalAgents > 0) {
        return {
          status: 'fail',
          message: 'No agents running',
          details: { activeAgents, totalAgents }
        };
      }

      if (activeAgents < totalAgents) {
        return {
          status: 'warn',
          message: `${activeAgents}/${totalAgents} agents running`,
          details: { activeAgents, totalAgents, statuses }
        };
      }

      // Check recent executions
      const recentErrors = statuses.filter(s => 
        s.lastError && new Date(s.lastRun).getTime() > Date.now() - 3600000
      ).length;

      if (recentErrors > 0) {
        return {
          status: 'warn',
          message: `${recentErrors} agents with recent errors`,
          details: { activeAgents, totalAgents, recentErrors }
        };
      }

      return {
        status: 'pass',
        message: `All ${totalAgents} agents healthy`,
        details: { activeAgents, totalAgents }
      };

    } catch (error) {
      return {
        status: 'fail',
        message: `Agent system error: ${error.message}`
      };
    }
  }

  /**
   * Check ML model health
   */
  private async checkMLModels(): Promise<CheckResult> {
    try {
      const mlService = MLDeploymentService.getInstance();
      const modelMetrics = await mlService.getModelMetrics();
      
      const deployedModels = Object.keys(modelMetrics).length;
      const healthyModels = Object.values(modelMetrics).filter(
        (m: any) => m.status === 'deployed' && m.health === 'healthy'
      ).length;

      if (deployedModels === 0) {
        return {
          status: 'fail',
          message: 'No ML models deployed',
          details: { deployedModels }
        };
      }

      if (healthyModels < deployedModels) {
        return {
          status: 'warn',
          message: `${healthyModels}/${deployedModels} models healthy`,
          details: modelMetrics
        };
      }

      // Check prediction latency
      const avgLatency = Object.values(modelMetrics).reduce(
        (sum: number, m: any) => sum + (m.metrics?.avgLatency || 0), 0
      ) / deployedModels;

      if (avgLatency > 500) {
        return {
          status: 'warn',
          message: `High ML latency: ${avgLatency.toFixed(0)}ms`,
          details: { deployedModels, avgLatency }
        };
      }

      return {
        status: 'pass',
        message: `All ${deployedModels} ML models healthy`,
        details: { deployedModels, healthyModels, avgLatency }
      };

    } catch (error) {
      return {
        status: 'fail',
        message: `ML system error: ${error.message}`
      };
    }
  }

  /**
   * Check external API connections
   */
  private async checkExternalAPIs(): Promise<CheckResult> {
    try {
      const apiManager = ExternalAPIManager.getInstance();
      const connections = apiManager.getConnectionStatuses();
      
      const connectedAPIs = connections.filter(c => c.status === 'connected').length;
      const totalAPIs = connections.length;

      if (connectedAPIs === 0) {
        return {
          status: 'warn',
          message: 'No external APIs connected',
          details: { connections }
        };
      }

      const errors = connections.filter(c => c.status === 'error');
      if (errors.length > 0) {
        return {
          status: 'warn',
          message: `${errors.length} API connection errors`,
          details: { 
            connected: connectedAPIs,
            total: totalAPIs,
            errors: errors.map(e => ({ name: e.name, error: e.errorMessage }))
          }
        };
      }

      return {
        status: 'pass',
        message: `${connectedAPIs}/${totalAPIs} external APIs connected`,
        details: { connectedAPIs, totalAPIs }
      };

    } catch (error) {
      return {
        status: 'warn',
        message: `External API check error: ${error.message}`
      };
    }
  }

  /**
   * Check network intelligence health
   */
  private async checkNetwork(): Promise<CheckResult> {
    try {
      const networkService = NetworkIntelligenceService.getInstance();
      
      // Use a test organization ID
      const testOrgId = '2274271e-679f-49d1-bda8-c92c77ae1d0c';
      const metrics = await networkService.getNetworkMetrics(testOrgId);

      if (!metrics.connected) {
        return {
          status: 'warn',
          message: 'Network intelligence not initialized',
          details: { connected: false }
        };
      }

      const { networkEffects } = metrics;
      
      if (networkEffects.networkSize < 10) {
        return {
          status: 'warn',
          message: `Small network: ${networkEffects.networkSize} organizations`,
          details: networkEffects
        };
      }

      return {
        status: 'pass',
        message: `Network healthy: ${networkEffects.networkSize} organizations`,
        details: {
          networkSize: networkEffects.networkSize,
          collectiveInsights: networkEffects.collectiveInsights,
          benchmarksAvailable: metrics.benchmarksAvailable
        }
      };

    } catch (error) {
      return {
        status: 'warn',
        message: 'Network check skipped',
        details: { reason: 'Not critical for operation' }
      };
    }
  }

  /**
   * Get current system metrics
   */
  private getMetrics(): any {
    const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    const requestsPerMinute = this.requestCount / (uptime / 60);
    const averageResponseTime = this.requestCount > 0 
      ? this.totalResponseTime / this.requestCount 
      : 0;

    return {
      uptime,
      requestsPerMinute: Math.round(requestsPerMinute),
      averageResponseTime: Math.round(averageResponseTime),
      activeUsers: 0 // Would be tracked separately
    };
  }

  /**
   * Record a request for metrics
   */
  recordRequest(responseTime: number): void {
    this.requestCount++;
    this.totalResponseTime += responseTime;
  }

  /**
   * Get readiness status (for k8s style checks)
   */
  async checkReadiness(): Promise<{ ready: boolean; message: string }> {
    const health = await this.checkHealth();
    
    if (health.status === 'unhealthy') {
      return {
        ready: false,
        message: 'System unhealthy'
      };
    }

    // Check critical components
    const criticalChecks = [
      health.checks.database,
      health.checks.agents
    ];

    const criticalFailure = criticalChecks.some(c => c.status === 'fail');
    
    return {
      ready: !criticalFailure,
      message: criticalFailure ? 'Critical components not ready' : 'Ready'
    };
  }

  /**
   * Get liveness status (for k8s style checks)
   */
  async checkLiveness(): Promise<{ alive: boolean; message: string }> {
    try {
      // Simple database ping
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      const { error } = await supabase
        .from('organizations')
        .select('count')
        .limit(1);

      return {
        alive: !error,
        message: error ? error.message : 'Alive'
      };

    } catch (error) {
      return {
        alive: false,
        message: error.message
      };
    }
  }
}

// Export singleton instance
export const healthCheck = HealthCheckService.getInstance();