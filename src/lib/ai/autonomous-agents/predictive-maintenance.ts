/**
 * Predictive Maintenance Agent
 * Predicts equipment failures and schedules maintenance based on real sensor data
 */

import { AutonomousAgent, AgentTask, AgentResult, ExecutedAction, Learning } from './agent-framework';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { aiService } from '../service';

interface DeviceHealth {
  deviceId: string;
  deviceName: string;
  healthScore: number; // 0-100
  failureProbability: number; // 0-1
  predictedFailureDate?: Date;
  anomalies: Anomaly[];
  recommendations: MaintenanceRecommendation[];
}

interface Anomaly {
  type: 'temperature' | 'vibration' | 'power' | 'performance' | 'runtime';
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  threshold: number;
  deviation: number; // percentage from normal
  detectedAt: Date;
}

interface MaintenanceRecommendation {
  action: string;
  urgency: 'routine' | 'soon' | 'urgent' | 'critical';
  estimatedCost: number;
  estimatedDowntime: number; // hours
  preventedCost: number; // cost of failure if not maintained
  confidence: number;
}

interface MaintenanceSchedule {
  deviceId: string;
  scheduledDate: Date;
  type: 'preventive' | 'predictive' | 'corrective';
  priority: 'low' | 'medium' | 'high' | 'critical';
  tasks: string[];
  estimatedDuration: number;
}

export class PredictiveMaintenanceAgent extends AutonomousAgent {
  private readonly FAILURE_THRESHOLD = 0.7;
  private readonly ANOMALY_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

  constructor(organizationId: string) {
    super(organizationId, {
      agentId: 'predictive-maintenance',
      capabilities: [
        {
          name: 'analyze_device_health',
          description: 'Analyze device health using sensor data',
          requiredPermissions: ['read:devices', 'read:sensors'],
          maxExecutionTime: 30000,
          retryable: true
        },
        {
          name: 'predict_failures',
          description: 'Predict equipment failures using ML models',
          requiredPermissions: ['read:devices', 'write:predictions'],
          maxExecutionTime: 45000,
          retryable: true
        },
        {
          name: 'schedule_maintenance',
          description: 'Create optimal maintenance schedules',
          requiredPermissions: ['write:maintenance', 'read:schedules'],
          maxExecutionTime: 20000,
          retryable: false
        },
        {
          name: 'detect_anomalies',
          description: 'Detect anomalies in real-time sensor data',
          requiredPermissions: ['read:sensors'],
          maxExecutionTime: 15000,
          retryable: true
        }
      ],
      learningEnabled: true,
      maxConcurrentTasks: 5,
      taskTimeout: 60000,
      retryAttempts: 3,
      retryDelay: 5000
    });
  }

  protected async executeTaskInternal(task: AgentTask): Promise<AgentResult> {
    switch (task.type) {
      case 'analyze_device_health':
        return await this.analyzeDeviceHealth(task);
      case 'predict_failures':
        return await this.predictFailures(task);
      case 'schedule_maintenance':
        return await this.scheduleMaintenanceTask(task);
      case 'detect_anomalies':
        return await this.detectAnomalies(task);
      default:
        return {
          success: false,
          error: `Unknown task type: ${task.type}`
        };
    }
  }

  private async analyzeDeviceHealth(task: AgentTask): Promise<AgentResult> {
    try {
      // Get devices for the organization
      const { data: devices, error: devicesError } = await supabaseAdmin
        .from('devices')
        .select('*')
        .eq('organization_id', this.organizationId);

      if (devicesError || !devices) {
        throw new Error('Failed to fetch devices');
      }

      const healthReports: DeviceHealth[] = [];

      for (const device of devices) {
        // Get recent sensor data
        const { data: sensorData } = await supabaseAdmin
          .from('sensor_readings')
          .select('*')
          .eq('device_id', device.id)
          .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('timestamp', { ascending: false });

        // Analyze patterns and calculate health score
        const analysis = await this.analyzeDevicePatterns(device, sensorData || []);

        // Detect anomalies
        const anomalies = await this.detectDeviceAnomalies(device, sensorData || []);

        // Generate recommendations
        const recommendations = await this.generateMaintenanceRecommendations(
          device,
          analysis,
          anomalies
        );

        const healthReport: DeviceHealth = {
          deviceId: device.id,
          deviceName: device.name,
          healthScore: analysis.healthScore,
          failureProbability: analysis.failureProbability,
          predictedFailureDate: analysis.predictedFailureDate,
          anomalies,
          recommendations
        };

        healthReports.push(healthReport);

        // Store health metrics
        await supabaseAdmin
          .from('device_health_metrics')
          .insert({
            device_id: device.id,
            organization_id: this.organizationId,
            health_score: analysis.healthScore,
            failure_probability: analysis.failureProbability,
            anomaly_count: anomalies.length,
            critical_issues: anomalies.filter(a => a.severity === 'critical').length,
            measured_at: new Date().toISOString()
          });

        // Learn from patterns
        if (analysis.failureProbability > this.FAILURE_THRESHOLD) {
          await this.learn({
            context: 'high_failure_risk',
            insight: `Device ${device.name} showing ${Math.round(analysis.failureProbability * 100)}% failure probability`,
            impact: analysis.failureProbability,
            confidence: 0.85,
            metadata: {
              device_id: device.id,
              anomalies: anomalies.map(a => ({ type: a.type, severity: a.severity }))
            }
          });
        }
      }

      // Store task result
      await this.storeTaskResult({
        taskId: task.id,
        success: true,
        result: {
          devicesAnalyzed: devices.length,
          criticalDevices: healthReports.filter(h => h.failureProbability > this.FAILURE_THRESHOLD).length,
          totalAnomalies: healthReports.reduce((sum, h) => sum + h.anomalies.length, 0),
          healthReports
        }
      });

      return {
        success: true,
        result: {
          healthReports,
          summary: {
            total: devices.length,
            healthy: healthReports.filter(h => h.healthScore > 80).length,
            warning: healthReports.filter(h => h.healthScore > 50 && h.healthScore <= 80).length,
            critical: healthReports.filter(h => h.healthScore <= 50).length
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async predictFailures(task: AgentTask): Promise<AgentResult> {
    try {
      const { data: devices } = await supabaseAdmin
        .from('devices')
        .select('*')
        .eq('organization_id', this.organizationId);

      if (!devices) {
        return { success: false, error: 'No devices found' };
      }

      const predictions: any[] = [];

      for (const device of devices) {
        // Get historical data for ML prediction
        const { data: historicalData } = await supabaseAdmin
          .from('sensor_readings')
          .select('*')
          .eq('device_id', device.id)
          .order('timestamp', { ascending: false })
          .limit(1000);

        if (!historicalData || historicalData.length < 100) {
          continue; // Not enough data for prediction
        }

        // Calculate failure probability using pattern analysis
        const prediction = await this.calculateFailureProbability(device, historicalData);

        if (prediction.probability > 0.5) {
          predictions.push({
            deviceId: device.id,
            deviceName: device.name,
            failureProbability: prediction.probability,
            predictedDate: prediction.estimatedDate,
            confidence: prediction.confidence,
            riskFactors: prediction.riskFactors
          });

          // Store prediction
          await supabaseAdmin
            .from('failure_predictions')
            .insert({
              device_id: device.id,
              organization_id: this.organizationId,
              probability: prediction.probability,
              predicted_date: prediction.estimatedDate,
              confidence: prediction.confidence,
              risk_factors: prediction.riskFactors,
              created_at: new Date().toISOString()
            });

          // Create alert if critical
          if (prediction.probability > this.FAILURE_THRESHOLD) {
            await this.createAlert({
              type: 'failure_prediction',
              severity: 'critical',
              message: `High failure risk for ${device.name}: ${Math.round(prediction.probability * 100)}% probability`
            });
          }
        }
      }

      return {
        success: true,
        result: {
          predictions,
          highRisk: predictions.filter(p => p.failureProbability > this.FAILURE_THRESHOLD),
          totalAnalyzed: devices.length
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async scheduleMaintenanceTask(task: AgentTask): Promise<AgentResult> {
    try {
      const { deviceId, urgency = 'routine' } = task.data || {};

      // Get device information
      const { data: device } = await supabaseAdmin
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .single();

      if (!device) {
        return { success: false, error: 'Device not found' };
      }

      // Get maintenance history
      const { data: history } = await supabaseAdmin
        .from('maintenance_history')
        .select('*')
        .eq('device_id', deviceId)
        .order('performed_at', { ascending: false })
        .limit(10);

      // Calculate optimal schedule
      const schedule = await this.calculateOptimalSchedule(device, history || [], urgency);

      // Store maintenance schedule
      const { data: scheduled, error } = await supabaseAdmin
        .from('maintenance_schedules')
        .insert({
          device_id: deviceId,
          organization_id: this.organizationId,
          scheduled_date: schedule.scheduledDate,
          type: schedule.type,
          priority: schedule.priority,
          tasks: schedule.tasks,
          estimated_duration: schedule.estimatedDuration,
          status: 'scheduled',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create calendar event
      await this.createMaintenanceEvent(device, schedule);

      return {
        success: true,
        result: {
          scheduleId: scheduled.id,
          device: device.name,
          scheduledDate: schedule.scheduledDate,
          tasks: schedule.tasks,
          estimatedDuration: schedule.estimatedDuration
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async detectAnomalies(task: AgentTask): Promise<AgentResult> {
    try {
      const { data: devices } = await supabaseAdmin
        .from('devices')
        .select('*')
        .eq('organization_id', this.organizationId);

      if (!devices) {
        return { success: false, error: 'No devices found' };
      }

      const allAnomalies: any[] = [];

      for (const device of devices) {
        // Get recent sensor data
        const { data: recentData } = await supabaseAdmin
          .from('sensor_readings')
          .select('*')
          .eq('device_id', device.id)
          .gte('timestamp', new Date(Date.now() - this.ANOMALY_WINDOW).toISOString())
          .order('timestamp', { ascending: false });

        if (!recentData || recentData.length === 0) {
          continue;
        }

        // Detect anomalies using statistical methods
        const anomalies = await this.detectStatisticalAnomalies(device, recentData);

        if (anomalies.length > 0) {
          allAnomalies.push({
            deviceId: device.id,
            deviceName: device.name,
            anomalies,
            detectedAt: new Date()
          });

          // Store anomalies
          for (const anomaly of anomalies) {
            await supabaseAdmin
              .from('detected_anomalies')
              .insert({
                device_id: device.id,
                organization_id: this.organizationId,
                type: anomaly.type,
                severity: anomaly.severity,
                value: anomaly.value,
                threshold: anomaly.threshold,
                deviation: anomaly.deviation,
                detected_at: anomaly.detectedAt
              });
          }

          // Create alert for critical anomalies
          const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
          if (criticalAnomalies.length > 0) {
            await this.createAlert({
              type: 'anomaly_detected',
              severity: 'critical',
              message: `Critical anomalies detected on ${device.name}: ${criticalAnomalies.map(a => a.type).join(', ')}`
            });
          }
        }
      }

      return {
        success: true,
        result: {
          devicesMonitored: devices.length,
          anomaliesDetected: allAnomalies.length,
          criticalDevices: allAnomalies.filter(a =>
            a.anomalies.some((an: Anomaly) => an.severity === 'critical')
          ).length,
          anomalies: allAnomalies
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Helper methods for analysis
  private async analyzeDevicePatterns(device: any, sensorData: any[]): Promise<any> {
    // Simple pattern analysis (would use ML in production)
    const avgValues = this.calculateAverages(sensorData);
    const trends = this.calculateTrends(sensorData);
    const volatility = this.calculateVolatility(sensorData);

    // Calculate health score (0-100)
    let healthScore = 100;

    // Reduce score based on volatility
    healthScore -= Math.min(volatility * 10, 30);

    // Reduce score based on negative trends
    if (trends.temperature > 0.1) healthScore -= 15;
    if (trends.vibration > 0.1) healthScore -= 20;
    if (trends.runtime > 1.2) healthScore -= 10;

    // Calculate failure probability
    const failureProbability = 1 - (healthScore / 100);

    // Predict failure date if probability is high
    let predictedFailureDate;
    if (failureProbability > 0.5) {
      const daysToFailure = Math.floor((1 - failureProbability) * 90); // Simple linear projection
      predictedFailureDate = new Date(Date.now() + daysToFailure * 24 * 60 * 60 * 1000);
    }

    return {
      healthScore: Math.max(0, Math.min(100, healthScore)),
      failureProbability,
      predictedFailureDate,
      avgValues,
      trends,
      volatility
    };
  }

  private async detectDeviceAnomalies(device: any, sensorData: any[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    if (sensorData.length === 0) return anomalies;

    // Calculate statistical thresholds
    const stats = this.calculateStatistics(sensorData);

    // Check recent readings against thresholds
    const recentReadings = sensorData.slice(0, 10);

    for (const reading of recentReadings) {
      // Temperature anomaly
      if (reading.temperature && Math.abs(reading.temperature - stats.temperature.mean) > 2 * stats.temperature.stdDev) {
        anomalies.push({
          type: 'temperature',
          severity: this.calculateSeverity(reading.temperature, stats.temperature),
          value: reading.temperature,
          threshold: stats.temperature.mean + 2 * stats.temperature.stdDev,
          deviation: ((reading.temperature - stats.temperature.mean) / stats.temperature.mean) * 100,
          detectedAt: new Date(reading.timestamp)
        });
      }

      // Vibration anomaly
      if (reading.vibration && Math.abs(reading.vibration - stats.vibration.mean) > 2 * stats.vibration.stdDev) {
        anomalies.push({
          type: 'vibration',
          severity: this.calculateSeverity(reading.vibration, stats.vibration),
          value: reading.vibration,
          threshold: stats.vibration.mean + 2 * stats.vibration.stdDev,
          deviation: ((reading.vibration - stats.vibration.mean) / stats.vibration.mean) * 100,
          detectedAt: new Date(reading.timestamp)
        });
      }
    }

    return anomalies;
  }

  private async generateMaintenanceRecommendations(
    device: any,
    analysis: any,
    anomalies: Anomaly[]
  ): Promise<MaintenanceRecommendation[]> {
    const recommendations: MaintenanceRecommendation[] = [];

    // High failure probability recommendation
    if (analysis.failureProbability > this.FAILURE_THRESHOLD) {
      recommendations.push({
        action: 'Schedule immediate comprehensive inspection and preventive maintenance',
        urgency: 'critical',
        estimatedCost: 500,
        estimatedDowntime: 4,
        preventedCost: 5000,
        confidence: 0.9
      });
    }

    // Temperature anomaly recommendation
    const tempAnomalies = anomalies.filter(a => a.type === 'temperature' && a.severity !== 'low');
    if (tempAnomalies.length > 0) {
      recommendations.push({
        action: 'Check cooling system and clean air filters',
        urgency: tempAnomalies.some(a => a.severity === 'critical') ? 'urgent' : 'soon',
        estimatedCost: 150,
        estimatedDowntime: 2,
        preventedCost: 2000,
        confidence: 0.85
      });
    }

    // Vibration anomaly recommendation
    const vibrationAnomalies = anomalies.filter(a => a.type === 'vibration' && a.severity !== 'low');
    if (vibrationAnomalies.length > 0) {
      recommendations.push({
        action: 'Inspect bearings and alignment, perform vibration analysis',
        urgency: vibrationAnomalies.some(a => a.severity === 'critical') ? 'urgent' : 'soon',
        estimatedCost: 300,
        estimatedDowntime: 3,
        preventedCost: 3500,
        confidence: 0.8
      });
    }

    // Routine maintenance if health score is declining
    if (analysis.healthScore < 70 && analysis.healthScore > 50) {
      recommendations.push({
        action: 'Schedule routine maintenance and component inspection',
        urgency: 'routine',
        estimatedCost: 200,
        estimatedDowntime: 2,
        preventedCost: 1000,
        confidence: 0.7
      });
    }

    return recommendations;
  }

  private async calculateFailureProbability(device: any, historicalData: any[]): Promise<any> {
    // Simplified failure prediction (would use LSTM/ML in production)
    const recentTrends = this.calculateTrends(historicalData.slice(0, 100));
    const volatility = this.calculateVolatility(historicalData.slice(0, 100));

    // Risk factors
    const riskFactors = [];
    let riskScore = 0;

    if (recentTrends.temperature > 0.15) {
      riskFactors.push('Rising temperature trend');
      riskScore += 0.3;
    }

    if (volatility > 0.3) {
      riskFactors.push('High operational volatility');
      riskScore += 0.25;
    }

    if (device.age_years && device.age_years > 5) {
      riskFactors.push('Equipment age');
      riskScore += 0.2;
    }

    const probability = Math.min(0.95, riskScore);

    // Estimate failure date
    const daysToFailure = probability > 0.5
      ? Math.floor((1 - probability) * 60)
      : null;

    return {
      probability,
      confidence: Math.min(0.9, 0.5 + (historicalData.length / 2000)),
      estimatedDate: daysToFailure
        ? new Date(Date.now() + daysToFailure * 24 * 60 * 60 * 1000).toISOString()
        : null,
      riskFactors
    };
  }

  private async calculateOptimalSchedule(
    device: any,
    history: any[],
    urgency: string
  ): Promise<MaintenanceSchedule> {
    // Calculate optimal maintenance window
    const now = new Date();
    let scheduledDate: Date;
    let priority: 'low' | 'medium' | 'high' | 'critical';
    let type: 'preventive' | 'predictive' | 'corrective';

    switch (urgency) {
      case 'critical':
        scheduledDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next day
        priority = 'critical';
        type = 'corrective';
        break;
      case 'urgent':
        scheduledDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days
        priority = 'high';
        type = 'predictive';
        break;
      case 'soon':
        scheduledDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
        priority = 'medium';
        type = 'predictive';
        break;
      default:
        scheduledDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month
        priority = 'low';
        type = 'preventive';
    }

    // Define maintenance tasks based on device type and urgency
    const tasks = this.getMaintenanceTasks(device, urgency);

    return {
      deviceId: device.id,
      scheduledDate,
      type,
      priority,
      tasks,
      estimatedDuration: tasks.length * 0.5 // 30 minutes per task
    };
  }

  private getMaintenanceTasks(device: any, urgency: string): string[] {
    const baseTasks = [
      'Visual inspection',
      'Performance testing',
      'Safety checks'
    ];

    const urgentTasks = [
      'Component replacement',
      'Calibration',
      'Deep cleaning',
      'Lubrication'
    ];

    const criticalTasks = [
      'Full system diagnostic',
      'Critical component replacement',
      'Emergency repairs',
      'System recertification'
    ];

    if (urgency === 'critical') {
      return [...baseTasks, ...urgentTasks, ...criticalTasks];
    } else if (urgency === 'urgent') {
      return [...baseTasks, ...urgentTasks];
    } else {
      return baseTasks;
    }
  }

  private async createMaintenanceEvent(device: any, schedule: MaintenanceSchedule): Promise<void> {
    // Store maintenance event
    await supabaseAdmin
      .from('calendar_events')
      .insert({
        organization_id: this.organizationId,
        title: `Maintenance: ${device.name}`,
        description: `${schedule.type} maintenance - Tasks: ${schedule.tasks.join(', ')}`,
        start_date: schedule.scheduledDate,
        end_date: new Date(schedule.scheduledDate.getTime() + schedule.estimatedDuration * 60 * 60 * 1000),
        type: 'maintenance',
        priority: schedule.priority,
        device_id: device.id
      });
  }

  private async detectStatisticalAnomalies(device: any, sensorData: any[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    if (sensorData.length < 10) return anomalies;

    // Calculate baseline statistics from older data
    const baseline = sensorData.slice(10);
    const recent = sensorData.slice(0, 10);

    if (baseline.length === 0) return anomalies;

    const stats = this.calculateStatistics(baseline);

    for (const reading of recent) {
      // Check each metric for anomalies
      for (const metric of ['temperature', 'vibration', 'power', 'runtime']) {
        if (reading[metric] !== undefined && stats[metric]) {
          const zScore = Math.abs((reading[metric] - stats[metric].mean) / stats[metric].stdDev);

          if (zScore > 2) {
            anomalies.push({
              type: metric as any,
              severity: zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium',
              value: reading[metric],
              threshold: stats[metric].mean + 2 * stats[metric].stdDev,
              deviation: ((reading[metric] - stats[metric].mean) / stats[metric].mean) * 100,
              detectedAt: new Date(reading.timestamp)
            });
          }
        }
      }
    }

    return anomalies;
  }

  // Statistical helper methods
  private calculateStatistics(data: any[]): any {
    const stats: any = {};
    const metrics = ['temperature', 'vibration', 'power', 'runtime'];

    for (const metric of metrics) {
      const values = data.map(d => d[metric]).filter(v => v !== undefined && v !== null);

      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        stats[metric] = { mean, stdDev, min: Math.min(...values), max: Math.max(...values) };
      }
    }

    return stats;
  }

  private calculateAverages(data: any[]): any {
    const metrics = ['temperature', 'vibration', 'power', 'runtime'];
    const avgs: any = {};

    for (const metric of metrics) {
      const values = data.map(d => d[metric]).filter(v => v !== undefined);
      avgs[metric] = values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : 0;
    }

    return avgs;
  }

  private calculateTrends(data: any[]): any {
    // Simple linear trend calculation
    const trends: any = {};
    const metrics = ['temperature', 'vibration', 'runtime'];

    for (const metric of metrics) {
      const values = data.map(d => d[metric]).filter(v => v !== undefined);

      if (values.length > 1) {
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));

        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        trends[metric] = (secondAvg - firstAvg) / firstAvg;
      } else {
        trends[metric] = 0;
      }
    }

    return trends;
  }

  private calculateVolatility(data: any[]): number {
    const values = data.map(d => d.temperature || d.power || 0).filter(v => v > 0);

    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;

    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private calculateSeverity(value: number, stats: any): 'low' | 'medium' | 'high' | 'critical' {
    const zScore = Math.abs((value - stats.mean) / stats.stdDev);

    if (zScore > 4) return 'critical';
    if (zScore > 3) return 'high';
    if (zScore > 2) return 'medium';
    return 'low';
  }

  protected async storeTaskResult(result: any): Promise<void> {
    await supabaseAdmin
      .from('agent_task_results')
      .insert({
        organization_id: this.organizationId,
        agent_id: this.agentId,
        task_id: result.taskId,
        task_type: 'predictive_maintenance',
        success: result.success,
        result: result.result,
        created_at: new Date().toISOString()
      });
  }
}

