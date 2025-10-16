/**
 * SLA Management System
 * Comprehensive service level agreement monitoring and compliance management
 */

export interface SLADefinition {
  id: string;
  name: string;
  description: string;
  tier: 'enterprise' | 'professional' | 'standard' | 'basic';
  metrics: SLAMetric[];
  scope: {
    services: string[];
    regions: string[];
    customerTiers: string[];
    excludedPeriods?: MaintenanceWindow[];
  };
  penalties: {
    breachThresholds: Array<{
      percentage: number; // SLA achievement percentage
      creditPercentage: number; // Service credit percentage
      description: string;
    }>;
    maxCreditPerMonth: number;
    escalationProcedure: string[];
  };
  reporting: {
    frequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
    stakeholders: string[];
    dashboardUrl?: string;
  };
  validFrom: Date;
  validUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  lastModified: Date;
}

export interface SLAMetric {
  id: string;
  name: string;
  description: string;
  type: 'availability' | 'latency' | 'throughput' | 'error-rate' | 'resolution-time' | 'custom';
  target: {
    value: number;
    unit: string; // e.g., '%', 'ms', 'requests/sec', 'minutes'
    operator: '>=' | '<=' | '>' | '<' | '=' | '!='; // How to compare actual vs target
  };
  measurement: {
    method: 'uptime' | 'response-time' | 'success-rate' | 'ticket-resolution' | 'custom-query';
    interval: 'minute' | 'hour' | 'day' | 'month';
    dataSource: string;
    query?: string; // Custom query for complex metrics
  };
  weight: number; // Relative importance (0-100)
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface MaintenanceWindow {
  id: string;
  name: string;
  description: string;
  startTime: Date;
  endTime: Date;
  type: 'planned' | 'emergency';
  affectedServices: string[];
  notificationSent: boolean;
  approvedBy: string;
}

export interface SLAMeasurement {
  id: string;
  slaId: string;
  metricId: string;
  timestamp: Date;
  actualValue: number;
  targetValue: number;
  achieved: boolean;
  deviationPercentage: number;
  context: {
    region?: string;
    service?: string;
    incidentId?: string;
    maintenanceWindow?: string;
  };
}

export interface SLABreach {
  id: string;
  slaId: string;
  metricId: string;
  detectedAt: Date;
  resolvedAt?: Date;
  severity: 'minor' | 'major' | 'critical';
  impact: {
    affectedUsers: number;
    affectedServices: string[];
    businessImpact: 'low' | 'medium' | 'high' | 'critical';
    estimatedCostImpact: number;
  };
  rootCause?: string;
  resolution?: string;
  creditApplied?: {
    amount: number;
    percentage: number;
    appliedAt: Date;
    reason: string;
  };
  status: 'open' | 'investigating' | 'resolved' | 'credited';
}

export interface SLAReport {
  id: string;
  slaId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  overallAchievement: number; // Percentage
  metricResults: Array<{
    metricId: string;
    metricName: string;
    target: number;
    actual: number;
    achievement: number;
    status: 'met' | 'missed' | 'at-risk';
  }>;
  breaches: SLABreach[];
  uptime: {
    total: number; // minutes
    downtime: number; // minutes
    availability: number; // percentage
    mttr: number; // mean time to recovery in minutes
    mtbf: number; // mean time between failures in minutes
  };
  performance: {
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    errorRate: number;
    throughput: number;
  };
  credits: {
    totalCredits: number;
    creditPercentage: number;
    appliedCredits: number;
    pendingCredits: number;
  };
  generatedAt: Date;
  generatedBy: string;
}

/**
 * SLA Manager
 */
export class SLAManager {
  private slaDefinitions: Map<string, SLADefinition> = new Map();
  private measurements: Map<string, SLAMeasurement> = new Map();
  private breaches: Map<string, SLABreach> = new Map();
  private maintenanceWindows: Map<string, MaintenanceWindow> = new Map();
  private reports: Map<string, SLAReport> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.initializeEnterpriseSLAs();
    this.startMonitoring();
  }

  /**
   * Initialize enterprise-grade SLA definitions
   */
  private initializeEnterpriseSLAs(): void {
    const enterpriseSLAs: SLADefinition[] = [
      {
        id: 'enterprise-tier-sla',
        name: 'Enterprise Tier SLA',
        description: 'Premium service level agreement for enterprise customers',
        tier: 'enterprise',
        metrics: [
          {
            id: 'uptime-availability',
            name: 'System Availability',
            description: 'Overall system uptime excluding planned maintenance',
            type: 'availability',
            target: {
              value: 99.95,
              unit: '%',
              operator: '>='
            },
            measurement: {
              method: 'uptime',
              interval: 'minute',
              dataSource: 'monitoring-system'
            },
            weight: 40,
            criticalityLevel: 'critical'
          },
          {
            id: 'api-response-time',
            name: 'API Response Time',
            description: '95th percentile API response time',
            type: 'latency',
            target: {
              value: 200,
              unit: 'ms',
              operator: '<='
            },
            measurement: {
              method: 'response-time',
              interval: 'minute',
              dataSource: 'vercel-analytics'
            },
            weight: 25,
            criticalityLevel: 'high'
          },
          {
            id: 'ai-inference-latency',
            name: 'AI Inference Latency',
            description: 'Average AI model inference response time',
            type: 'latency',
            target: {
              value: 2000,
              unit: 'ms',
              operator: '<='
            },
            measurement: {
              method: 'response-time',
              interval: 'minute',
              dataSource: 'ai-metrics'
            },
            weight: 20,
            criticalityLevel: 'high'
          },
          {
            id: 'error-rate',
            name: 'Error Rate',
            description: 'Percentage of failed requests',
            type: 'error-rate',
            target: {
              value: 0.1,
              unit: '%',
              operator: '<='
            },
            measurement: {
              method: 'success-rate',
              interval: 'minute',
              dataSource: 'error-tracking'
            },
            weight: 15,
            criticalityLevel: 'medium'
          }
        ],
        scope: {
          services: ['api', 'ai-inference', 'dashboard', 'data-processing'],
          regions: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
          customerTiers: ['enterprise']
        },
        penalties: {
          breachThresholds: [
            { percentage: 99.95, creditPercentage: 0, description: 'SLA met' },
            { percentage: 99.9, creditPercentage: 10, description: 'Minor breach - 10% credit' },
            { percentage: 99.0, creditPercentage: 25, description: 'Major breach - 25% credit' },
            { percentage: 95.0, creditPercentage: 50, description: 'Critical breach - 50% credit' }
          ],
          maxCreditPerMonth: 100, // Maximum 100% credit per month
          escalationProcedure: [
            'Immediate notification to customer success manager',
            'Engineering team paged within 5 minutes',
            'Executive escalation within 30 minutes',
            'Customer executive notification within 1 hour'
          ]
        },
        reporting: {
          frequency: 'real-time',
          stakeholders: ['customer-success@blipee.ai', 'engineering@blipee.ai', 'executives@blipee.ai']
        },
        validFrom: new Date(),
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      },
      {
        id: 'professional-tier-sla',
        name: 'Professional Tier SLA',
        description: 'Standard service level agreement for professional customers',
        tier: 'professional',
        metrics: [
          {
            id: 'uptime-availability-pro',
            name: 'System Availability',
            description: 'Overall system uptime excluding planned maintenance',
            type: 'availability',
            target: {
              value: 99.9,
              unit: '%',
              operator: '>='
            },
            measurement: {
              method: 'uptime',
              interval: 'minute',
              dataSource: 'monitoring-system'
            },
            weight: 50,
            criticalityLevel: 'critical'
          },
          {
            id: 'api-response-time-pro',
            name: 'API Response Time',
            description: '95th percentile API response time',
            type: 'latency',
            target: {
              value: 500,
              unit: 'ms',
              operator: '<='
            },
            measurement: {
              method: 'response-time',
              interval: 'minute',
              dataSource: 'vercel-analytics'
            },
            weight: 30,
            criticalityLevel: 'high'
          },
          {
            id: 'support-response-time',
            name: 'Support Response Time',
            description: 'Average first response time for support tickets',
            type: 'resolution-time',
            target: {
              value: 240,
              unit: 'minutes',
              operator: '<='
            },
            measurement: {
              method: 'ticket-resolution',
              interval: 'hour',
              dataSource: 'support-system'
            },
            weight: 20,
            criticalityLevel: 'medium'
          }
        ],
        scope: {
          services: ['api', 'dashboard'],
          regions: ['us-east-1', 'eu-west-1'],
          customerTiers: ['professional']
        },
        penalties: {
          breachThresholds: [
            { percentage: 99.9, creditPercentage: 0, description: 'SLA met' },
            { percentage: 99.5, creditPercentage: 5, description: 'Minor breach - 5% credit' },
            { percentage: 98.0, creditPercentage: 15, description: 'Major breach - 15% credit' }
          ],
          maxCreditPerMonth: 50,
          escalationProcedure: [
            'Customer success notification within 15 minutes',
            'Engineering team notification within 30 minutes',
            'Management escalation within 2 hours'
          ]
        },
        reporting: {
          frequency: 'daily',
          stakeholders: ['customer-success@blipee.ai', 'support@blipee.ai']
        },
        validFrom: new Date(),
        isActive: true,
        createdAt: new Date(),
        lastModified: new Date()
      }
    ];

    enterpriseSLAs.forEach(sla => {
      this.slaDefinitions.set(sla.id, sla);
    });

  }

  /**
   * Start SLA monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Monitor SLAs every minute
    this.monitoringInterval = setInterval(() => {
      this.collectAndEvaluateMetrics();
    }, 60 * 1000);

    // Generate daily reports
    setInterval(() => {
      this.generateDailySLAReports();
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Stop SLA monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

  }

  /**
   * Collect and evaluate SLA metrics
   */
  private async collectAndEvaluateMetrics(): Promise<void> {
    for (const [slaId, sla] of Array.from(this.slaDefinitions)) {
      if (!sla.isActive) continue;

      for (const metric of sla.metrics) {
        try {
          const measurement = await this.measureMetric(slaId, metric);
          this.measurements.set(measurement.id, measurement);

          // Check for SLA breaches
          if (!measurement.achieved) {
            await this.handleSLABreach(sla, metric, measurement);
          }
        } catch (error) {
          console.error(`Failed to measure metric ${metric.id} for SLA ${slaId}:`, error);
        }
      }
    }
  }

  /**
   * Measure a specific metric
   */
  private async measureMetric(slaId: string, metric: SLAMetric): Promise<SLAMeasurement> {
    // Simulate metric collection - in real implementation, would query actual monitoring systems
    let actualValue: number;

    switch (metric.type) {
      case 'availability':
        actualValue = 99.95 + (Math.random() - 0.5) * 0.1; // Simulate 99.9-100% availability
        break;
      case 'latency':
        actualValue = metric.target.value * (0.7 + Math.random() * 0.6); // Random latency around target
        break;
      case 'error-rate':
        actualValue = Math.random() * 0.2; // Random error rate 0-0.2%
        break;
      case 'resolution-time':
        actualValue = metric.target.value * (0.8 + Math.random() * 0.4); // Random resolution time
        break;
      default:
        actualValue = metric.target.value * (0.9 + Math.random() * 0.2);
    }

    const targetValue = metric.target.value;
    let achieved = false;

    // Evaluate if target is achieved
    switch (metric.target.operator) {
      case '>=':
        achieved = actualValue >= targetValue;
        break;
      case '<=':
        achieved = actualValue <= targetValue;
        break;
      case '>':
        achieved = actualValue > targetValue;
        break;
      case '<':
        achieved = actualValue < targetValue;
        break;
      case '=':
        achieved = Math.abs(actualValue - targetValue) < 0.01; // Allow small tolerance
        break;
      case '!=':
        achieved = Math.abs(actualValue - targetValue) >= 0.01;
        break;
    }

    const deviationPercentage = ((actualValue - targetValue) / targetValue) * 100;

    const measurementId = `measurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: measurementId,
      slaId,
      metricId: metric.id,
      timestamp: new Date(),
      actualValue,
      targetValue,
      achieved,
      deviationPercentage,
      context: {
        region: 'us-east-1', // Would be determined dynamically
        service: 'api'
      }
    };
  }

  /**
   * Handle SLA breach
   */
  private async handleSLABreach(
    sla: SLADefinition,
    metric: SLAMetric,
    measurement: SLAMeasurement
  ): Promise<void> {
    // Check if this is a new breach or continuation of existing one
    const existingBreach = Array.from(this.breaches.values())
      .find(b => b.slaId === sla.id && b.metricId === metric.id && b.status === 'open');

    if (existingBreach) {
      // Update existing breach
      return;
    }

    // Create new breach
    const breachId = `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const severity = this.determineSeverity(metric, measurement);
    const impact = await this.assessBreachImpact(sla, metric, measurement);

    const breach: SLABreach = {
      id: breachId,
      slaId: sla.id,
      metricId: metric.id,
      detectedAt: new Date(),
      severity,
      impact,
      status: 'open'
    };

    this.breaches.set(breachId, breach);

    // Trigger notifications and escalation
    await this.triggerBreachNotifications(sla, metric, breach);

  }

  /**
   * Determine breach severity
   */
  private determineSeverity(metric: SLAMetric, measurement: SLAMeasurement): 'minor' | 'major' | 'critical' {
    const deviationAbs = Math.abs(measurement.deviationPercentage);

    if (metric.criticalityLevel === 'critical' || deviationAbs > 20) {
      return 'critical';
    } else if (metric.criticalityLevel === 'high' || deviationAbs > 10) {
      return 'major';
    } else {
      return 'minor';
    }
  }

  /**
   * Assess breach impact
   */
  private async assessBreachImpact(
    sla: SLADefinition,
    metric: SLAMetric,
    measurement: SLAMeasurement
  ): Promise<SLABreach['impact']> {
    // Simulate impact assessment
    const affectedUsers = Math.floor(Math.random() * 1000) + 100;
    const businessImpact = metric.criticalityLevel === 'critical' ? 'high' :
      metric.criticalityLevel === 'high' ? 'medium' : 'low';
    const estimatedCostImpact = affectedUsers * 0.5; // $0.50 per affected user

    return {
      affectedUsers,
      affectedServices: sla.scope.services,
      businessImpact: businessImpact as 'low' | 'medium' | 'high' | 'critical',
      estimatedCostImpact
    };
  }

  /**
   * Trigger breach notifications
   */
  private async triggerBreachNotifications(
    sla: SLADefinition,
    metric: SLAMetric,
    breach: SLABreach
  ): Promise<void> {
    const escalationSteps = sla.penalties.escalationProcedure;
    
    // Simulate notification dispatch
    escalationSteps.forEach((step, index) => {
    });

    // In real implementation, would send actual notifications via email, Slack, PagerDuty, etc.
  }

  /**
   * Generate daily SLA reports
   */
  private async generateDailySLAReports(): Promise<void> {

    for (const [slaId, sla] of Array.from(this.slaDefinitions)) {
      if (!sla.isActive) continue;

      try {
        const report = await this.generateSLAReport(slaId, 'daily');
        this.reports.set(report.id, report);
        
      } catch (error) {
        console.error(`Failed to generate daily report for SLA ${slaId}:`, error);
      }
    }
  }

  /**
   * Generate SLA report for a specific period
   */
  async generateSLAReport(
    slaId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'custom',
    customPeriod?: { startDate: Date; endDate: Date }
  ): Promise<SLAReport> {
    const sla = this.slaDefinitions.get(slaId);
    if (!sla) {
      throw new Error(`SLA ${slaId} not found`);
    }

    // Calculate period dates
    let startDate: Date, endDate: Date;
    const now = new Date();

    if (customPeriod) {
      startDate = customPeriod.startDate;
      endDate = customPeriod.endDate;
    } else {
      switch (period) {
        case 'daily':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          endDate = now;
      }
    }

    // Get measurements for the period
    const periodMeasurements = Array.from(this.measurements.values())
      .filter(m => 
        m.slaId === slaId && 
        m.timestamp >= startDate && 
        m.timestamp <= endDate
      );

    // Calculate metric results
    const metricResults = sla.metrics.map(metric => {
      const metricMeasurements = periodMeasurements.filter(m => m.metricId === metric.id);
      
      if (metricMeasurements.length === 0) {
        return {
          metricId: metric.id,
          metricName: metric.name,
          target: metric.target.value,
          actual: 0,
          achievement: 0,
          status: 'missed' as const
        };
      }

      const avgActual = metricMeasurements.reduce((sum, m) => sum + m.actualValue, 0) / metricMeasurements.length;
      const achievedCount = metricMeasurements.filter(m => m.achieved).length;
      const achievement = (achievedCount / metricMeasurements.length) * 100;
      
      const status: 'met' | 'missed' | 'at-risk' = achievement >= 95 ? 'met' : achievement >= 85 ? 'at-risk' : 'missed';

      return {
        metricId: metric.id,
        metricName: metric.name,
        target: metric.target.value,
        actual: Math.round(avgActual * 100) / 100,
        achievement: Math.round(achievement * 100) / 100,
        status
      };
    });

    // Calculate overall achievement (weighted average)
    const totalWeight = sla.metrics.reduce((sum, m) => sum + m.weight, 0);
    const weightedAchievement = metricResults.reduce((sum, result) => {
      const metric = sla.metrics.find(m => m.id === result.metricId)!;
      return sum + (result.achievement * metric.weight / totalWeight);
    }, 0);

    // Get breaches for the period
    const periodBreaches = Array.from(this.breaches.values())
      .filter(b => 
        b.slaId === slaId && 
        b.detectedAt >= startDate && 
        b.detectedAt <= endDate
      );

    // Calculate uptime metrics
    const totalMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / (60 * 1000));
    const downtimeMinutes = Math.floor(Math.random() * 5); // Simulate downtime
    const availability = ((totalMinutes - downtimeMinutes) / totalMinutes) * 100;
    const mttr = downtimeMinutes > 0 ? Math.floor(Math.random() * 30) + 5 : 0; // Mean time to recovery
    const mtbf = totalMinutes / Math.max(1, periodBreaches.length); // Mean time between failures

    // Calculate performance metrics
    const avgLatency = 150 + Math.random() * 100; // Simulate metrics
    const p95Latency = avgLatency * 1.5;
    const p99Latency = avgLatency * 2;
    const errorRate = Math.random() * 0.1;
    const throughput = 1000 + Math.random() * 500;

    // Calculate credits
    const creditThreshold = sla.penalties.breachThresholds.find(t => 
      weightedAchievement < t.percentage
    );
    const creditPercentage = creditThreshold ? creditThreshold.creditPercentage : 0;
    const totalCredits = creditPercentage; // Simplified calculation

    const reportId = `report_${slaId}_${period}_${Date.now()}`;

    const report: SLAReport = {
      id: reportId,
      slaId,
      period: { startDate, endDate },
      overallAchievement: Math.round(weightedAchievement * 100) / 100,
      metricResults,
      breaches: periodBreaches,
      uptime: {
        total: totalMinutes,
        downtime: downtimeMinutes,
        availability: Math.round(availability * 100) / 100,
        mttr,
        mtbf: Math.round(mtbf * 100) / 100
      },
      performance: {
        averageLatency: Math.round(avgLatency),
        p95Latency: Math.round(p95Latency),
        p99Latency: Math.round(p99Latency),
        errorRate: Math.round(errorRate * 1000) / 1000,
        throughput: Math.round(throughput)
      },
      credits: {
        totalCredits,
        creditPercentage,
        appliedCredits: totalCredits,
        pendingCredits: 0
      },
      generatedAt: new Date(),
      generatedBy: 'sla-manager'
    };

    return report;
  }

  /**
   * Add maintenance window
   */
  addMaintenanceWindow(
    name: string,
    description: string,
    startTime: Date,
    endTime: Date,
    affectedServices: string[],
    approvedBy: string,
    type: 'planned' | 'emergency' = 'planned'
  ): string {
    const windowId = `maintenance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const maintenanceWindow: MaintenanceWindow = {
      id: windowId,
      name,
      description,
      startTime,
      endTime,
      type,
      affectedServices,
      notificationSent: false,
      approvedBy
    };
    
    this.maintenanceWindows.set(windowId, maintenanceWindow);
    
    
    return windowId;
  }

  /**
   * Get SLA dashboard data
   */
  getSLADashboard(): {
    activeSLAs: number;
    overallHealthScore: number;
    activeBreaches: number;
    upcomingMaintenances: number;
    recentReports: SLAReport[];
    criticalMetrics: Array<{
      slaName: string;
      metricName: string;
      currentValue: number;
      target: number;
      status: string;
    }>;
  } {
    const activeSLAs = Array.from(this.slaDefinitions.values()).filter(s => s.isActive).length;
    const activeBreaches = Array.from(this.breaches.values()).filter(b => b.status === 'open').length;
    const upcomingMaintenances = Array.from(this.maintenanceWindows.values())
      .filter(m => m.startTime > new Date()).length;
    
    const recentReports = Array.from(this.reports.values())
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .slice(0, 5);
    
    const overallHealthScore = recentReports.length > 0
      ? Math.round(recentReports.reduce((sum, r) => sum + r.overallAchievement, 0) / recentReports.length)
      : 100;
    
    // Get critical metrics (those currently breaching SLAs)
    const criticalMetrics = Array.from(this.breaches.values())
      .filter(b => b.status === 'open')
      .map(breach => {
        const sla = this.slaDefinitions.get(breach.slaId);
        const metric = sla?.metrics.find(m => m.id === breach.metricId);
        const recentMeasurement = Array.from(this.measurements.values())
          .filter(m => m.slaId === breach.slaId && m.metricId === breach.metricId)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
        
        return {
          slaName: sla?.name || 'Unknown SLA',
          metricName: metric?.name || 'Unknown Metric',
          currentValue: recentMeasurement?.actualValue || 0,
          target: metric?.target.value || 0,
          status: breach.severity
        };
      })
      .slice(0, 10);
    
    return {
      activeSLAs,
      overallHealthScore,
      activeBreaches,
      upcomingMaintenances,
      recentReports,
      criticalMetrics
    };
  }

  /**
   * Get all SLA definitions
   */
  getSLADefinitions(): Map<string, SLADefinition> {
    return new Map(this.slaDefinitions);
  }

  /**
   * Get SLA measurements
   */
  getMeasurements(): Map<string, SLAMeasurement> {
    return new Map(this.measurements);
  }

  /**
   * Get SLA breaches
   */
  getBreaches(): Map<string, SLABreach> {
    return new Map(this.breaches);
  }

  /**
   * Get maintenance windows
   */
  getMaintenanceWindows(): Map<string, MaintenanceWindow> {
    return new Map(this.maintenanceWindows);
  }

  /**
   * Get SLA reports
   */
  getReports(): Map<string, SLAReport> {
    return new Map(this.reports);
  }
}

/**
 * Global SLA manager instance
 */
export const slaManager = new SLAManager();